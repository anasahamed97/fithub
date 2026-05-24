require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');
// Email service using Resend
const { sendOtpEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoded admin credentials
const ADMIN_CREDS = { email: 'admin@fithub.com', password: 'Admin@123' };

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Redirect root: show setup if not configured, else show login
app.get('/', (req, res) => {
  if (!db.isConfigured) {
    return res.sendFile(path.join(__dirname, 'public', 'setup.html'));
  }
  // Serve login page as default entry
  return res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Intercept APIs if database is not configured
app.use('/api', (req, res, next) => {
  if (!db.isConfigured) {
    return res.status(503).json({
      error: "Supabase connection is not configured.",
      code: "DB_UNCONFIGURED",
      message: "Please configure your SUPABASE_URL and SUPABASE_KEY in the .env file and run schema.sql in your Supabase SQL Editor."
    });
  }
  next();
});

// ── Admin-only middleware ──
function requireAdmin(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// --- API ROUTES ---

// ══════════════════════════════════════════
// 0. AUTHENTICATION
// ══════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password and role are required' });
    }

    // ── Admin login (hardcoded) ──
    if (role === 'admin') {
      if (email === ADMIN_CREDS.email && password === ADMIN_CREDS.password) {
        return res.json({
          success: true,
          user: { id: 'admin', name: 'Admin', email, role: 'admin' }
        });
      }
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // ── Member login (from database) ──
    if (role === 'member') {
      const member = await db.authenticateMember(email, password);
      if (!member) {
        return res.status(401).json({ error: 'Invalid email or password. Contact admin if you don\'t have an account.' });
      }
      if (member.status === 'Inactive') {
        return res.status(403).json({ error: 'Your membership is inactive. Contact admin.' });
      }
      return res.json({ success: true, user: member });
    }

    // ── Trainer login (from database) ──
    if (role === 'trainer') {
      const trainer = await db.authenticateTrainer(email, password);
      if (!trainer) {
        return res.status(401).json({ error: 'Invalid email or password. Contact admin if you don\'t have an account.' });
      }
      if (trainer.status === 'Inactive') {
        return res.status(403).json({ error: 'Your account is inactive. Contact admin.' });
      }
      return res.json({ success: true, user: trainer });
    }

    return res.status(400).json({ error: 'Invalid role' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// In-memory OTP store (email -> { otp, expiresAt, role })
const otps = new Map();

// Helper to generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Forgot password - send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }
    const exists = await db.checkUserExists(role, email);
    if (!exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const otp = generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    otps.set(email, { otp, expiresAt, role });
    // Send OTP via email
    try {
      await sendOtpEmail(email, otp);
    } catch (mailErr) {
      console.error('Email send error:', mailErr);
      // Still continue; OTP will be logged in console for debugging
    }
    console.log(`🔐 OTP for ${role} (${email}): ${otp}`);
    return res.json({ success: true, message: 'OTP sent to email' });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// ── Reset password using OTP
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;
    if (!email || !role || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const record = otps.get(email);
    if (!record || record.role !== role || record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    if (Date.now() > record.expiresAt) {
      otps.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }
    await db.forceUpdatePassword(role, email, newPassword);
    otps.delete(email);
    return res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ══════════════════════════════════════════
// 1. DASHBOARD OVERVIEW (admin only)
// ══════════════════════════════════════════
app.get('/api/dashboard', async (req, res) => {
  try {
    const [members, plans, trainers, attendance, payments] = await Promise.all([
      db.getMembers(),
      db.getPlans(),
      db.getTrainers(),
      db.getAttendance(),
      db.getPayments()
    ]);

    const todayStr = new Date().toISOString().split('T')[0];

    // Basic Metrics
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'Active').length;
    const activeTrainers = trainers.filter(t => t.status === 'Active').length;
    
    // Revenue metrics
    const currentMonth = new Date().getMonth(); // 0-11
    const currentYear = new Date().getFullYear();
    
    const revenueThisMonth = payments
      .filter(p => {
        const payDate = new Date(p.date);
        return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear && p.status === 'Paid';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    const todayAttendance = attendance.filter(a => a.date === todayStr).length;

    // Recent activities (combining joins, payments and check-ins)
    const recentActivity = [];

    // Add recent check-ins
    attendance.slice(0, 5).forEach(att => {
      recentActivity.push({
        type: 'attendance',
        title: `${att.memberName} checked in`,
        detail: `Checked in for ${att.checkInType} at ${att.time}`,
        time: att.date,
        icon: 'user-check',
        color: 'cyan'
      });
    });

    // Add recent payments
    payments.slice(0, 5).forEach(pay => {
      recentActivity.push({
        type: 'payment',
        title: `Payment received from ${pay.memberName}`,
        detail: `$${pay.amount} for ${pay.planName} via ${pay.paymentMethod}`,
        time: pay.date,
        icon: 'credit-card',
        color: 'purple'
      });
    });

    // Sort recent activities by date (descending)
    recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivity = recentActivity.slice(0, 6);

    // Chart Data Calculations
    // A. Revenue Trend (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueTrend = { labels: [], data: [] };
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      
      const mLabel = monthNames[mIdx];
      revenueTrend.labels.push(mLabel);

      const mRevenue = payments
        .filter(p => {
          const payDate = new Date(p.date);
          return payDate.getMonth() === mIdx && payDate.getFullYear() === yr && p.status === 'Paid';
        })
        .reduce((sum, p) => sum + p.amount, 0);
      
      revenueTrend.data.push(mRevenue);
    }

    // B. Class/Check-in Distribution (all time or recent)
    const classDistribution = {};
    attendance.forEach(a => {
      const type = a.checkInType || 'Gym Access';
      classDistribution[type] = (classDistribution[type] || 0) + 1;
    });

    // C. Membership Growth (members joined in the last 6 months)
    const membershipGrowth = { labels: [], data: [] };
    
    // Calculate cumulative member counts for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      
      membershipGrowth.labels.push(monthNames[mIdx]);
      
      const monthEnd = new Date(yr, mIdx + 1, 0, 23, 59, 59);
      const count = members.filter(m => new Date(m.joinDate) <= monthEnd).length;
      membershipGrowth.data.push(count);
    }

    res.json({
      metrics: {
        totalMembers,
        activeMembers,
        activeTrainers,
        revenueThisMonth,
        todayAttendance
      },
      recentActivity: limitedActivity,
      charts: {
        revenueTrend,
        classDistribution: {
          labels: Object.keys(classDistribution),
          data: Object.values(classDistribution)
        },
        membershipGrowth
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════
// 2. MEMBERS ENDPOINTS
// ══════════════════════════════════════════
app.get('/api/members', async (req, res) => {
  try {
    let members = await db.getMembers();

    // Filters
    const { search, status, planId } = req.query;

    if (search) {
      const term = search.toLowerCase();
      members = members.filter(m => 
        m.name.toLowerCase().includes(term) || 
        m.email.toLowerCase().includes(term) ||
        m.phone.includes(term)
      );
    }

    if (status) {
      members = members.filter(m => m.status === status);
    }

    if (planId) {
      members = members.filter(m => m.planId === planId);
    }

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members/:id', async (req, res) => {
  try {
    const details = await db.getMemberById(req.params.id);
    if (!details) return res.status(404).json({ error: 'Member not found' });
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: add member
app.post('/api/members', requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, password, planId, trainerId, gender, notes } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required fields' });
    }

    const newMember = await db.addMember({
      name,
      email,
      phone,
      password: password || 'changeme',
      planId,
      trainerId,
      gender,
      notes,
      status: 'Active'
    });

    // Automatically record an initial payment if a plan is assigned
    if (planId) {
      const plan = await db.getPlanById(planId);
      if (plan) {
        await db.recordPayment({
          memberId: newMember.id,
          planId: plan.id,
          amount: plan.price,
          paymentMethod: 'UPI'
        });
      }
    }

    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: update member
app.put('/api/members/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateMember(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Member not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: delete member
app.delete('/api/members/:id', requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteMember(req.params.id);
    if (!success) return res.status(404).json({ error: 'Member not found' });
    res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════
// 3. PLANS ENDPOINTS
// ══════════════════════════════════════════
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await db.getPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/plans', requireAdmin, async (req, res) => {
  try {
    const { name, price, duration, features } = req.body;
    if (!name || price === undefined || !duration) {
      return res.status(400).json({ error: 'Name, price, and duration are required' });
    }

    const newPlan = await db.addPlan({
      name,
      price: Number(price),
      duration: Number(duration),
      features: Array.isArray(features) ? features : []
    });
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/plans/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await db.updatePlan(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Plan not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/plans/:id', requireAdmin, async (req, res) => {
  try {
    const success = await db.deletePlan(req.params.id);
    if (!success) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════
// 4. TRAINERS ENDPOINTS
// ══════════════════════════════════════════
app.get('/api/trainers', async (req, res) => {
  try {
    const trainers = await db.getTrainers();
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: add trainer
app.post('/api/trainers', requireAdmin, async (req, res) => {
  try {
    const { name, specialty, phone, email, password } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ error: 'Name and specialty are required' });
    }

    const newTrainer = await db.addTrainer({
      name,
      specialty,
      phone,
      email,
      password: password || 'changeme'
    });
    res.status(201).json(newTrainer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: update trainer
app.put('/api/trainers/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateTrainer(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Trainer not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: delete trainer
app.delete('/api/trainers/:id', requireAdmin, async (req, res) => {
  try {
    const success = await db.deleteTrainer(req.params.id);
    if (!success) return res.status(404).json({ error: 'Trainer not found' });
    res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════
// 5. ATTENDANCE ENDPOINTS
// ══════════════════════════════════════════
app.get('/api/attendance', async (req, res) => {
  try {
    const records = await db.getAttendance();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/checkin', async (req, res) => {
  try {
    const { memberId, checkInType } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required for check-in' });
    }

    const record = await db.checkInMember(memberId, checkInType);
    if (!record) return res.status(404).json({ error: 'Member not found' });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════
// 6. PAYMENTS ENDPOINTS
// ══════════════════════════════════════════
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await db.getPayments();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', requireAdmin, async (req, res) => {
  try {
    const { memberId, planId, amount, paymentMethod } = req.body;
    if (!memberId || !planId || amount === undefined) {
      return res.status(400).json({ error: 'Member ID, Plan ID, and Amount are required' });
    }

    const record = await db.recordPayment({
      memberId,
      planId,
      amount: Number(amount),
      paymentMethod
    });

    if (!record) return res.status(404).json({ error: 'Member not found' });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ══════════════════════════════════════════
// 7. MEMBER / TRAINER PROFILE ENDPOINTS
// ══════════════════════════════════════════

// Member: get own profile + attendance + payments
app.get('/api/me/member', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (!email) return res.status(400).json({ error: 'Missing user email header' });

    const member = await db.getMemberByEmail(email);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const [attendance, payments] = await Promise.all([
      db.getAttendanceByMember(member.id),
      db.getPaymentsByMember(member.id)
    ]);

    res.json({ profile: member, attendance, payments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trainer: get own profile + assigned members
app.get('/api/me/trainer', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    if (!email) return res.status(400).json({ error: 'Missing user email header' });

    const trainer = await db.getTrainerByEmail(email);
    if (!trainer) return res.status(404).json({ error: 'Trainer not found' });

    const assignedMembers = await db.getMembersByTrainer(trainer.id);

    res.json({
      profile: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        specialty: trainer.specialty,
        phone: trainer.phone,
        status: trainer.status
      },
      assignedMembers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change own password (member or trainer)
app.put('/api/me/password', async (req, res) => {
  try {
    const email = req.headers['x-user-email'];
    const role = req.headers['x-user-role'];
    const { currentPassword, newPassword } = req.body;

    if (!email || !role) {
      return res.status(401).json({ error: 'Unauthorized: Missing authentication headers' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (role !== 'member' && role !== 'trainer') {
      return res.status(403).json({ error: 'Password change is only available for members and trainers' });
    }

    const success = await db.updatePassword(role, email, currentPassword, newPassword);
    
    if (!success) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  FitHub Gym Management server running successfully!`);
  console.log(`  Local Endpoint: http://localhost:${PORT}`);
  if (!db.isConfigured) {
    console.log(`  WARNING: Supabase connection parameters are empty!`);
    console.log(`  Please fill in URL/Key in your project .env file.`);
  } else {
    console.log(`  Database Provider: Supabase SQL Postgres instance`);
  }
  console.log(`==================================================`);
});
