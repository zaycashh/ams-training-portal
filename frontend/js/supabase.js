/* =============================================
   AMS Training Portal — Supabase Client
   ============================================= */

const SUPABASE_URL  = 'https://yfxwfjyjiolbflxrgjse.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmeHdmanlqaW9sYmZseHJnanNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTg0OTcsImV4cCI6MjA5MzE3NDQ5N30.9KFngqbmR6DYctDgy-l_xWmhoumldlD3BGb_Ysiv0cU';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/* =============================================
   AUTH HELPERS
   ============================================= */

async function dbGetUser(email) {
  const { data, error } = await db.from('users').select('*').eq('email', email).single();
  return error ? null : data;
}

async function dbCreateUser(userData) {
  const { data, error } = await db.from('users').insert([userData]).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateUser(email, updates) {
  const { data, error } = await db.from('users').update(updates).eq('email', email).select().single();
  if (error) throw error;
  return data;
}

/* =============================================
   COMPANY HELPERS
   ============================================= */

async function dbGetCompany(id) {
  const { data, error } = await db.from('companies').select('*').eq('id', id).single();
  return error ? null : data;
}

async function dbGetCompanyByEmail(email) {
  const { data, error } = await db.from('companies').select('*').eq('admin_email', email).single();
  return error ? null : data;
}

async function dbCreateCompany(companyData) {
  const { data, error } = await db.from('companies').insert([companyData]).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateCompanySeats(companyId, seats) {
  const { data, error } = await db.from('companies').update({ seats }).eq('id', companyId).select().single();
  if (error) throw error;
  return data;
}

/* =============================================
   MODULE ACCESS HELPERS
   ============================================= */

async function dbGetModuleAccess(email) {
  const { data, error } = await db.from('module_access').select('*').eq('email', email);
  return error ? [] : data;
}

async function dbGrantModuleAccess(email, module, program, grantedBy = 'purchase') {
  const { data, error } = await db.from('module_access')
    .upsert([{ email, module, program, granted_by: grantedBy }], { onConflict: 'email,module,program' })
    .select().single();
  if (error) throw error;
  return data;
}

/* =============================================
   SEAT ASSIGNMENT HELPERS
   ============================================= */

async function dbGetSeatAssignments(companyId) {
  const { data, error } = await db.from('seat_assignments')
    .select('*').eq('company_id', companyId).eq('status', 'active');
  return error ? [] : data;
}

async function dbAssignSeat(companyId, employeeEmail, employeeName, module, program) {
  const { data, error } = await db.from('seat_assignments')
    .insert([{ company_id: companyId, employee_email: employeeEmail, employee_name: employeeName, module, program }])
    .select().single();
  if (error) throw error;
  return data;
}

/* =============================================
   PURCHASE HELPERS
   ============================================= */

async function dbLogPurchase(email, module, program, seats, stripeSessionId, companyId = null) {
  const { data, error } = await db.from('purchases')
    .insert([{ email, module, program, seats, stripe_session_id: stripeSessionId, company_id: companyId }])
    .select().single();
  if (error) throw error;
  return data;
}

async function dbGetPurchases(email) {
  const { data, error } = await db.from('purchases').select('*').eq('email', email).order('purchased_at', { ascending: false });
  return error ? [] : data;
}

/* =============================================
   TRAINING PROGRESS HELPERS
   ============================================= */

async function dbGetTrainingProgress(email) {
  const { data, error } = await db.from('training_progress').select('*').eq('email', email);
  return error ? [] : data;
}

async function dbMarkModuleComplete(email, module, program, certId) {
  const { data, error } = await db.from('training_progress')
    .upsert([{ email, module, program, completed: true, completed_at: new Date().toISOString(), cert_id: certId }],
      { onConflict: 'email,module,program' })
    .select().single();
  if (error) throw error;
  return data;
}

/* =============================================
   ACTIVITY LOG HELPERS
   ============================================= */

async function dbLogActivity(companyId, userEmail, action, details = {}) {
  await db.from('activity_log').insert([{ company_id: companyId, user_email: userEmail, action, details }]);
}

async function dbGetActivity(companyId, limit = 20) {
  const { data, error } = await db.from('activity_log')
    .select('*').eq('company_id', companyId)
    .order('created_at', { ascending: false }).limit(limit);
  return error ? [] : data;
}

/* =============================================
   INVITE CODE HELPERS
   ============================================= */

async function dbCreateInviteCode(code, companyId, module, program) {
  const { data, error } = await db.from('invite_codes')
    .insert([{ code, company_id: companyId, module, program }])
    .select().single();
  if (error) throw error;
  return data;
}

async function dbGetInviteCode(code) {
  const { data, error } = await db.from('invite_codes').select('*').eq('code', code).single();
  return error ? null : data;
}

async function dbMarkInviteUsed(code, usedBy) {
  await db.from('invite_codes').update({ used: true, used_by: usedBy }).eq('code', code);
}
