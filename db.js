// Supabase Database Connection Layer
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Check if credentials are set up
const isConfigured = supabaseUrl && supabaseKey;

let supabase = null;
if (isConfigured) {
  const key = process.env.SUPABASE_SERVICE_ROLE || supabaseKey;
  supabase = createClient(supabaseUrl, key);
}

// Data Mappers to translate Postgres snake_case column names into frontend camelCase format
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
    planName: m.plan ? m.plan.name : 'No Plan Assigned',
    planPrice: m.plan ? m.plan.price : 0,
    trainerName: m.trainer ? m.trainer.name : 'No Trainer Assigned'
  };
}

function mapAttendance(a) {
  if (!a) return null;
  return {
    id: a.id,
    memberId: a.member_id,
    date: a.date,
    time: a.time ? a.time.substring(0, 5) : '',
    checkInType: a.check_in_type,
    memberName: a.member ? a.member.name : 'Unknown Member',
    memberEmail: a.member ? a.member.email : ''
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
    memberName: p.member ? p.member.name : 'Unknown Member',
    planName: p.plan ? p.plan.name : 'Custom Plan'
  };
}

// DB Helpers for CRUD Operations (Promises based)
const db = {
  isConfigured,

  // --- AUTHENTICATION ---
  authenticateMember: async (email, password) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        plan:plan_id (name, price),
        trainer:trainer_id (name)
      `)
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: 'member',
      status: data.status,
      planName: data.plan ? data.plan.name : 'No Plan',
      trainerName: data.trainer ? data.trainer.name : 'No Trainer'
    };
  },

  authenticateTrainer: async (email, password) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: 'trainer',
      specialty: data.specialty,
      status: data.status
    };
  },

  // --- MEMBERS ---
  getMembers: async () => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        plan:plan_id (name, price),
        trainer:trainer_id (name)
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(mapMember);
  },

  getMemberById: async (id) => {
    if (!isConfigured) return null;

    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select(`
        *,
        plan:plan_id (name, price),
        trainer:trainer_id (name)
      `)
      .eq('id', id)
      .maybeSingle();

    if (memberErr) throw memberErr;
    if (!member) return null;

    // Get attendance logs
    const { data: attendance, error: attErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', id)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (attErr) throw attErr;

    // Get payments logs
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select(`
        *,
        plan:plan_id (name)
      `)
      .eq('member_id', id)
      .order('date', { ascending: false });

    if (payErr) throw payErr;

    return {
      profile: mapMember(member),
      attendance: attendance.map(a => ({
        id: a.id,
        memberId: a.member_id,
        date: a.date,
        time: a.time ? a.time.substring(0, 5) : '',
        checkInType: a.check_in_type
      })),
      payments: payments.map(p => ({
        id: p.id,
        memberId: p.member_id,
        planId: p.plan_id,
        amount: Number(p.amount),
        date: p.date,
        paymentMethod: p.payment_method,
        status: p.status,
        planName: p.plan ? p.plan.name : 'Subscription Payment'
      }))
    };
  },

  // Get member profile by email (for member dashboard)
  getMemberByEmail: async (email) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        plan:plan_id (name, price),
        trainer:trainer_id (name)
      `)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return mapMember(data);
  },

  addMember: async (memberData) => {
    if (!isConfigured) return null;

    const insertData = {
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone,
      password: memberData.password || 'changeme',
      plan_id: memberData.planId || null,
      trainer_id: memberData.trainerId || null,
      gender: memberData.gender || 'Other',
      notes: memberData.notes || '',
      status: memberData.status || 'Active'
    };

    const { data, error } = await supabase
      .from('members')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return mapMember(data);
  },

  updateMember: async (id, updateData) => {
    if (!isConfigured) return null;

    const mappedUpdate = {};
    if (updateData.name !== undefined) mappedUpdate.name = updateData.name;
    if (updateData.email !== undefined) mappedUpdate.email = updateData.email;
    if (updateData.phone !== undefined) mappedUpdate.phone = updateData.phone;
    if (updateData.password !== undefined) mappedUpdate.password = updateData.password;
    if (updateData.gender !== undefined) mappedUpdate.gender = updateData.gender;
    if (updateData.notes !== undefined) mappedUpdate.notes = updateData.notes;
    if (updateData.status !== undefined) mappedUpdate.status = updateData.status;
    if (updateData.planId !== undefined) mappedUpdate.plan_id = updateData.planId || null;
    if (updateData.trainerId !== undefined) mappedUpdate.trainer_id = updateData.trainerId || null;

    const { data, error } = await supabase
      .from('members')
      .update(mappedUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapMember(data);
  },

  deleteMember: async (id) => {
    if (!isConfigured) return false;

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // --- PLANS ---
  getPlans: async () => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data;
  },

  getPlanById: async (id) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  addPlan: async (planData) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('plans')
      .insert([{
        name: planData.name,
        price: Number(planData.price),
        duration: Number(planData.duration),
        features: planData.features || []
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updatePlan: async (id, updateData) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deletePlan: async (id) => {
    if (!isConfigured) return false;

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // --- TRAINERS ---
  getTrainers: async () => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  getTrainerById: async (id) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get trainer profile by email (for trainer dashboard)
  getTrainerByEmail: async (email) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get members assigned to a specific trainer
  getMembersByTrainer: async (trainerId) => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        plan:plan_id (name, price),
        trainer:trainer_id (name)
      `)
      .eq('trainer_id', trainerId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(mapMember);
  },

  addTrainer: async (trainerData) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('trainers')
      .insert([{
        name: trainerData.name,
        specialty: trainerData.specialty,
        phone: trainerData.phone || '',
        email: trainerData.email || '',
        password: trainerData.password || 'changeme',
        status: trainerData.status || 'Active'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateTrainer: async (id, updateData) => {
    if (!isConfigured) return null;

    const mappedUpdate = {};
    if (updateData.name !== undefined) mappedUpdate.name = updateData.name;
    if (updateData.specialty !== undefined) mappedUpdate.specialty = updateData.specialty;
    if (updateData.phone !== undefined) mappedUpdate.phone = updateData.phone;
    if (updateData.email !== undefined) mappedUpdate.email = updateData.email;
    if (updateData.password !== undefined) mappedUpdate.password = updateData.password;
    if (updateData.status !== undefined) mappedUpdate.status = updateData.status;

    const { data, error } = await supabase
      .from('trainers')
      .update(mappedUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteTrainer: async (id) => {
    if (!isConfigured) return false;

    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // --- ATTENDANCE ---
  getAttendance: async () => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        member:member_id (name, email)
      `)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) throw error;
    return data.map(mapAttendance);
  },

  // Get attendance for a specific member
  getAttendanceByMember: async (memberId) => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('member_id', memberId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(30);

    if (error) throw error;
    return data.map(a => ({
      id: a.id,
      memberId: a.member_id,
      date: a.date,
      time: a.time ? a.time.substring(0, 5) : '',
      checkInType: a.check_in_type
    }));
  },

  checkInMember: async (memberId, checkInType) => {
    if (!isConfigured) return null;

    const now = new Date();
    const { data, error } = await supabase
      .from('attendance')
      .insert([{
        member_id: memberId,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        check_in_type: checkInType || 'Gym Access'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- PAYMENTS ---
  getPayments: async () => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        member:member_id (name),
        plan:plan_id (name)
      `)
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(mapPayment);
  },

  // Get payments for a specific member
  getPaymentsByMember: async (memberId) => {
    if (!isConfigured) return [];

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        plan:plan_id (name)
      `)
      .eq('member_id', memberId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(p => ({
      id: p.id,
      memberId: p.member_id,
      planId: p.plan_id,
      amount: Number(p.amount),
      date: p.date,
      paymentMethod: p.payment_method,
      status: p.status,
      planName: p.plan ? p.plan.name : 'Subscription Payment'
    }));
  },

  recordPayment: async (paymentData) => {
    if (!isConfigured) return null;

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        member_id: paymentData.memberId,
        plan_id: paymentData.planId,
        amount: Number(paymentData.amount),
        date: new Date().toISOString().split('T')[0],
        payment_method: paymentData.paymentMethod || 'Card',
        status: 'Paid'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- PASSWORD MANAGEMENT ---
  // --- PASSWORD MANAGEMENT ---
  updatePassword: async (role, email, currentPassword, newPassword) => {
    if (!isConfigured) return false;

    const table = role === 'trainer' ? 'trainers' : 'members';

    // Verify current password
    const { data: user, error: verifyErr } = await supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .eq('password', currentPassword)
      .maybeSingle();

    if (verifyErr) throw verifyErr;
    if (!user) return false; // Incorrect current password

    // Update to new password
    const { error: updateErr } = await supabase
      .from(table)
      .update({ password: newPassword })
      .eq('id', user.id);

    if (updateErr) throw updateErr;
    return true; // Success
  },

  // Check whether a user exists for OTP generation
  checkUserExists: async (role, email) => {
    if (!isConfigured) return false;
    const table = role === 'trainer' ? 'trainers' : 'members';
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  // Forcefully update password without verifying old password (used after OTP verification)
  forceUpdatePassword: async (role, email, newPassword) => {
    if (!isConfigured) return false;
    const table = role === 'trainer' ? 'trainers' : 'members';
    const { error } = await supabase
      .from(table)
      .update({ password: newPassword })
      .eq('email', email);
    if (error) throw error;
    return true;
  }
};

module.exports = db;
