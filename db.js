require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mysql = require('mysql2/promise');

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_PORT = process.env.MYSQL_PORT || '3306';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'fithub';

const isConfigured = MYSQL_HOST && MYSQL_USER && MYSQL_PASSWORD && MYSQL_DATABASE;

let pool = null;
if (isConfigured) {
  pool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

async function query(sql, params = []) {
  if (!pool) throw new Error('Database not configured');
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function mapMember(m) {
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    joinDate: m.join_date,
    status: m.status,
    planId: m.plan_id,
    trainerId: m.trainer_id,
    gender: m.gender,
    notes: m.notes,
    planName: m.plan_name,
    planPrice: m.plan_price,
    trainerName: m.trainer_name
  };
}

function mapAttendance(a) {
  if (!a) return null;
  return {
    id: a.id,
    memberId: a.member_id,
    date: a.date,
    time: a.time ? a.time.substring(0,5) : '',
    checkInType: a.check_in_type,
    memberName: a.member_name,
    memberEmail: a.member_email
  };
}

function mapPayment(p) {
  if (!p) return null;
  return {
    id: p.id,
    memberId: p.member_id,
    planId: p.plan_id,
    amount: Number(p.amount),
    date: p.date,
    paymentMethod: p.payment_method,
    status: p.status,
    memberName: p.member_name,
    planName: p.plan_name
  };
}

const db = {
  isConfigured,

  // AUTHENTICATION
  authenticateMember: async (email, password) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT m.*, p.name AS plan_name, p.price AS plan_price, t.name AS trainer_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id LEFT JOIN trainers t ON m.trainer_id = t.id WHERE m.email = ? AND m.password = ?', [email, password]);
    if (rows.length === 0) return null;
    const data = rows[0];
    return { id: data.id, name: data.name, email: data.email, role: 'member', status: data.status, planName: data.plan_name || 'No Plan', trainerName: data.trainer_name || 'No Trainer' };
  },

  authenticateTrainer: async (email, password) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT * FROM trainers WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) return null;
    const data = rows[0];
    return { id: data.id, name: data.name, email: data.email, role: 'trainer', specialty: data.specialty, status: data.status };
  },

  // MEMBERS
  getMembers: async () => {
    if (!isConfigured) return [];
    const rows = await query('SELECT m.*, p.name AS plan_name, p.price AS plan_price, t.name AS trainer_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id LEFT JOIN trainers t ON m.trainer_id = t.id ORDER BY m.name ASC');
    return rows.map(mapMember);
  },

  getMemberById: async (id) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT m.*, p.name AS plan_name, p.price AS plan_price, t.name AS trainer_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id LEFT JOIN trainers t ON m.trainer_id = t.id WHERE m.id = ?', [id]);
    if (rows.length === 0) return null;
    const member = rows[0];
    const attendance = await query('SELECT a.*, m.name AS member_name FROM attendance a JOIN members m ON a.member_id = m.id WHERE a.member_id = ? ORDER BY a.date DESC, a.time DESC', [id]);
    const payments = await query('SELECT p.*, m.name AS member_name, pl.name AS plan_name FROM payments p JOIN members m ON p.member_id = m.id LEFT JOIN plans pl ON p.plan_id = pl.id WHERE p.member_id = ? ORDER BY p.date DESC', [id]);
    return { profile: mapMember(member), attendance: attendance.map(mapAttendance), payments: payments.map(mapPayment) };
  },

  getMemberByEmail: async (email) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT m.*, p.name AS plan_name, p.price AS plan_price, t.name AS trainer_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id LEFT JOIN trainers t ON m.trainer_id = t.id WHERE m.email = ?', [email]);
    if (rows.length === 0) return null;
    return mapMember(rows[0]);
  },

  addMember: async (memberData) => {
    if (!isConfigured) return null;
    const { name, email, phone, password, planId, trainerId, gender, notes, status } = memberData;
    const result = await query('INSERT INTO members (name, email, phone, password, plan_id, trainer_id, gender, notes, status) VALUES (?,?,?,?,?,?,?,?,?)', [name, email, phone, password || "changeme", planId || null, trainerId || null, gender || "Other", notes || "", status || "Active"]);
    const rows = await query('SELECT * FROM members WHERE id = ?', [result.insertId]);
    return mapMember(rows[0]);
  },

  updateMember: async (id, updateData) => {
    if (!isConfigured) return null;
    const dbFields = {
      name: 'name',
      gender: 'gender',
      email: 'email',
      phone: 'phone',
      planId: 'plan_id',
      trainerId: 'trainer_id',
      notes: 'notes',
      password: 'password',
      status: 'status'
    };
    const fields = [];
    const params = [];
    for (const [key, value] of Object.entries(updateData)) {
      const dbKey = dbFields[key] || key;
      fields.push(`${dbKey} = ?`);
      params.push(value === '' ? null : value);
    }
    if (fields.length === 0) return null;
    params.push(id);
    await query(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`, params);
    const rows = await query('SELECT * FROM members WHERE id = ?', [id]);
    return mapMember(rows[0]);
  },

  deleteMember: async (id) => {
    if (!isConfigured) return false;
    const result = await query('DELETE FROM members WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // PLANS
  getPlans: async () => {
    if (!isConfigured) return [];
    return await query('SELECT * FROM plans ORDER BY price ASC');
  },

  getPlanById: async (id) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT * FROM plans WHERE id = ?', [id]);
    return rows[0] || null;
  },

  addPlan: async (planData) => {
    if (!isConfigured) return null;
    const { name, price, duration, features } = planData;
    const result = await query('INSERT INTO plans (name, price, duration, features) VALUES (?,?,?,?)', [name, Number(price), Number(duration), JSON.stringify(features || [])]);
    return await db.getPlanById(result.insertId);
  },

  updatePlan: async (id, updateData) => {
    if (!isConfigured) return null;
    const fields = [];
    const params = [];
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
    if (fields.length === 0) return null;
    params.push(id);
    await query(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`, params);
    return await db.getPlanById(id);
  },

  deletePlan: async (id) => {
    if (!isConfigured) return false;
    const result = await query('DELETE FROM plans WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // TRAINERS
  getTrainers: async () => {
    if (!isConfigured) return [];
    return await query('SELECT * FROM trainers ORDER BY name ASC');
  },

  getTrainerById: async (id) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT * FROM trainers WHERE id = ?', [id]);
    return rows[0] || null;
  },

  getTrainerByEmail: async (email) => {
    if (!isConfigured) return null;
    const rows = await query('SELECT * FROM trainers WHERE email = ?', [email]);
    return rows[0] || null;
  },

  addTrainer: async (trainerData) => {
    if (!isConfigured) return null;
    const { name, specialty, phone, email, password, status } = trainerData;
    const result = await query('INSERT INTO trainers (name, specialty, phone, email, password, status) VALUES (?,?,?,?,?,?)', [name, specialty, phone || "", email || "", password || "changeme", status || "Active"]);
    return await db.getTrainerById(result.insertId);
  },

  updateTrainer: async (id, updateData) => {
    if (!isConfigured) return null;
    const fields = [];
    const params = [];
    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
    if (fields.length === 0) return null;
    params.push(id);
    await query(`UPDATE trainers SET ${fields.join(', ')} WHERE id = ?`, params);
    return await db.getTrainerById(id);
  },

  deleteTrainer: async (id) => {
    if (!isConfigured) return false;
    const result = await query('DELETE FROM trainers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
// Get members assigned to a specific trainer
getMembersByTrainer: async (trainerId) => {
  if (!isConfigured) return [];
  const rows = await query('SELECT m.*, p.name AS plan_name, p.price AS plan_price, t.name AS trainer_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id LEFT JOIN trainers t ON m.trainer_id = t.id WHERE m.trainer_id = ? ORDER BY m.name ASC', [trainerId]);
  return rows.map(mapMember);
},

  // ATTENDANCE
  getAttendance: async () => {
    if (!isConfigured) return [];
    const rows = await query('SELECT a.*, m.name AS member_name, m.email AS member_email FROM attendance a JOIN members m ON a.member_id = m.id ORDER BY a.date DESC, a.time DESC');
    return rows.map(mapAttendance);
  },

  getAttendanceByMember: async (memberId) => {
    if (!isConfigured) return [];
    const rows = await query('SELECT * FROM attendance WHERE member_id = ? ORDER BY date DESC, time DESC LIMIT 30', [memberId]);
    return rows.map(mapAttendance);
  },

  checkInMember: async (memberId, checkInType) => {
    if (!isConfigured) return null;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const result = await query('INSERT INTO attendance (member_id, date, time, check_in_type) VALUES (?,?,?,?)', [memberId, dateStr, timeStr, checkInType || 'Gym Access']);
    const rows = await query('SELECT * FROM attendance WHERE id = ?', [result.insertId]);
    return rows[0] ? mapAttendance(rows[0]) : null;
  },

  // PAYMENTS
  getPayments: async () => {
    if (!isConfigured) return [];
    const rows = await query('SELECT p.*, m.name AS member_name, pl.name AS plan_name FROM payments p JOIN members m ON p.member_id = m.id LEFT JOIN plans pl ON p.plan_id = pl.id ORDER BY p.date DESC');
    return rows.map(mapPayment);
  },

  getPaymentsByMember: async (memberId) => {
    if (!isConfigured) return [];
    const rows = await query('SELECT p.*, m.name AS member_name, pl.name AS plan_name FROM payments p JOIN members m ON p.member_id = m.id LEFT JOIN plans pl ON p.plan_id = pl.id WHERE p.member_id = ? ORDER BY p.date DESC', [memberId]);
    return rows.map(mapPayment);
  },

  recordPayment: async (paymentData) => {
    if (!isConfigured) return null;
    const { memberId, planId, amount, paymentMethod } = paymentData;
    const dateStr = new Date().toISOString().split('T')[0];
    const result = await query('INSERT INTO payments (member_id, plan_id, amount, date, payment_method, status) VALUES (?,?,?,?,?,?)', [memberId, planId, Number(amount), dateStr, paymentMethod || "Card", "Paid"]);
    const rows = await query('SELECT * FROM payments WHERE id = ?', [result.insertId]);
    return rows[0] ? mapPayment(rows[0]) : null;
  },

  // PASSWORD MANAGEMENT
  updatePassword: async (role, email, currentPassword, newPassword) => {
    if (!isConfigured) return false;
    const table = role === 'trainer' ? 'trainers' : 'members';
    const rows = await query(`SELECT id FROM ${table} WHERE email = ? AND password = ?`, [email, currentPassword]);
    if (rows.length === 0) return false;
    const userId = rows[0].id;
    await query(`UPDATE ${table} SET password = ? WHERE id = ?`, [newPassword, userId]);
    return true;
  },

  checkUserExists: async (role, email) => {
    if (!isConfigured) return false;
    const table = role === 'trainer' ? 'trainers' : 'members';
    const rows = await query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
    return rows.length > 0;
  },

  forceUpdatePassword: async (role, email, newPassword) => {
    if (!isConfigured) return false;
    const table = role === 'trainer' ? 'trainers' : 'members';
    await query(`UPDATE ${table} SET password = ? WHERE email = ?`, [newPassword, email]);
    return true;
  },

  // EQUIPMENT MANAGEMENT
  getEquipments: async () => {
    if (!isConfigured) return [];
    return await query('SELECT * FROM equipments ORDER BY name ASC');
  },

  addEquipment: async (eq) => {
    if (!isConfigured) return null;
    const { name, status, notes } = eq;
    const result = await query('INSERT INTO equipments (name, status, notes) VALUES (?,?,?)', [name, status || 'Operational', notes || '']);
    const rows = await query('SELECT * FROM equipments WHERE id = ?', [result.insertId]);
    return rows[0];
  },

  updateEquipment: async (id, upd) => {
    if (!isConfigured) return null;
    const fields = [];
    const params = [];
    for (const [k, v] of Object.entries(upd)) {
      fields.push(`${k} = ?`);
      params.push(v);
    }
    if (fields.length === 0) return null;
    params.push(id);
    await query(`UPDATE equipments SET ${fields.join(', ')} WHERE id = ?`, params);
    const rows = await query('SELECT * FROM equipments WHERE id = ?', [id]);
    return rows[0];
  },

  deleteEquipment: async (id) => {
    if (!isConfigured) return false;
    const result = await query('DELETE FROM equipments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = db;
