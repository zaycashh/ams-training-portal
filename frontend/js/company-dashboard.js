/* =========================================================
   COMPANY ADMIN DASHBOARD — FINAL UPGRADED VERSION
========================================================= */

/* showToast — defined here so it works on ALL pages that load this JS
   (company-dashboard.html, employees.html, etc.) */
function showToast(msg, type, duration) {
  type = type || 'info'; duration = duration || 3500;
  document.querySelectorAll('.ams-toast').forEach(function(t){ t.remove(); });
  var toast = document.createElement('div');
  toast.className = 'ams-toast toast-' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function(){ toast.remove(); }, duration);
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  loadCompanyDashboard(user);

  /* Auto-switch tab if ?tab= param is in the URL */
  const tabParam = new URLSearchParams(window.location.search).get("tab");
  if (tabParam) switchTab(tabParam);
});

/* =========================================================
   GLOBAL PROGRAM — program-scoped profile helpers
   Each program (FAA / FMCSA) stores its own companyProfile
   so seats, usedSeats, and invites never bleed across programs.
   Key format:  companyProfile_faa  |  companyProfile_fmcsa
   The legacy key "companyProfile" is kept in sync for any
   legacy code that still reads it directly.
========================================================= */

function _profileKey(program) {
  const p = (program || "").toLowerCase();
  if (p === "fmcsa") return "companyProfile_fmcsa";
  return "companyProfile_faa"; // default
}

function getCompanyProfile() {
  /* 1. Try to detect program from amsUser or amsProgram */
  const user    = JSON.parse(localStorage.getItem("amsUser")  || "null");
  const program = (user?.program || localStorage.getItem("amsProgram") || "").toLowerCase();
  const key     = _profileKey(program);

  /* 2. Try scoped key first */
  let profile = JSON.parse(localStorage.getItem(key) || "null");

  /* 3. Fall back to legacy key if scoped key is empty */
  if (!profile) profile = JSON.parse(localStorage.getItem("companyProfile") || "null");

  return profile || {};
}

function saveCompanyProfile(company) {
  const key = _profileKey(company.program);
  localStorage.setItem(key, JSON.stringify(company));
  /* Keep legacy key in sync so any page that still reads
     "companyProfile" directly gets the right data */
  localStorage.setItem("companyProfile", JSON.stringify(company));
}

function getCompanyProgram() {
  const company = getCompanyProfile();
  return company.program || "FAA";
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadCompanyDashboard(user) {
  const company = getCompanyProfile();

  /* =========================================================
     ENSURE FULL SEAT STRUCTURE
  ========================================================= */

  let updated = false;

  if (!company.seats) { company.seats = {}; updated = true; }
  if (!company.usedSeats) { company.usedSeats = {}; updated = true; }

  if (!company.seats.employee)   { company.seats.employee   = { total: 0 }; updated = true; }
  if (!company.seats.supervisor) { company.seats.supervisor = { total: 0 }; updated = true; }
  if (!company.seats.der)        { company.seats.der        = { total: 0 }; updated = true; }

  if (!company.usedSeats.employee)   { company.usedSeats.employee   = {}; updated = true; }
  if (!company.usedSeats.supervisor) { company.usedSeats.supervisor = {}; updated = true; }
  if (!company.usedSeats.der)        { company.usedSeats.der        = {}; updated = true; }

  /* Normalize employee seats */
  Object.keys(company.usedSeats.employee).forEach(email => {
    let seat = company.usedSeats.employee[email];
    if (typeof seat !== "object") {
      company.usedSeats.employee[email] = { assignedAt: Date.now(), revoked: false };
      seat = company.usedSeats.employee[email];
      updated = true;
    }
    if (!("revoked" in seat)) { seat.revoked = false; updated = true; }
    if (!company.employees) company.employees = {};
    if (!company.employees[email]) {
      company.employees[email] = { email, role: "employee", status: "assigned", addedAt: Date.now() };
      updated = true;
    }
  });

  /* Normalize supervisor seats */
  Object.keys(company.usedSeats.supervisor).forEach(email => {
    const seat = company.usedSeats.supervisor[email];
    if (typeof seat !== "object") {
      company.usedSeats.supervisor[email] = { assignedAt: Date.now(), revoked: false };
      updated = true;
    } else if (!("revoked" in seat)) { seat.revoked = false; updated = true; }
  });

  /* Normalize DER seats */
  Object.keys(company.usedSeats.der).forEach(email => {
    const seat = company.usedSeats.der[email];
    if (typeof seat !== "object") {
      company.usedSeats.der[email] = { assignedAt: Date.now(), revoked: false };
      updated = true;
    } else if (!("revoked" in seat)) { seat.revoked = false; updated = true; }
  });

  if (updated) saveCompanyProfile(company);

  const programEl = document.getElementById("companyProgram");
  if (programEl) {
    programEl.textContent = company.program ? company.program.toUpperCase() : "—";
  }

  if (!company.id) { showToast("Company profile missing", "error"); return; }

  const nameEl = document.getElementById("companyName");
  const adminEl = document.getElementById("companyAdmin");
  if (nameEl) nameEl.textContent = company.name || user?.company || "—";
  if (adminEl) adminEl.textContent = user?.email || "—";

  loadEmployees(company.id);
  updateSeatCounts(company);
  renderSeatAssignments(company);
  updateEmployeeOverview(company);
}

/* =========================================================
   EMPLOYEE OVERVIEW STATS
========================================================= */

function updateEmployeeOverview(company) {
  if (!company) company = getCompanyProfile();

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

  /* All active (non-revoked) seat holders across all types */
  const allSeatedEmails = new Set();
  ["employee", "supervisor", "der"].forEach(type => {
    Object.entries(company.usedSeats?.[type] || {}).forEach(([email, seat]) => {
      if (!seat.revoked) allSeatedEmails.add(email.trim().toLowerCase());
    });
  });

  /* Also count pending invites that haven't registered yet */
  Object.values(company.invites || {}).forEach(inv => {
    if (["pending", "resent", "assigned"].includes(inv.status)) {
      allSeatedEmails.add(inv.email.trim().toLowerCase());
    }
  });

  const total = allSeatedEmails.size;
  let completed  = 0;
  let inProgress = 0;
  let notStarted = 0;

  allSeatedEmails.forEach(email => {
    const isRegistered = users.some(u => u.email === email);

    /* Check companyProfile.certIds first (set when employee completes on their browser) */
    const hasCert = !!company.certIds?.[email]?.certId;

    /* Also check local storage as fallback (works when admin = same browser as employee) */
    const localDone =
      localStorage.getItem(`fmcsaDERCompleted_${email}`)      === "true" ||
      localStorage.getItem(`fmcsaModuleBCompleted_${email}`)  === "true" ||
      localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true" ||
      localStorage.getItem(`faaDERCompleted_${email}`)        === "true" ||
      localStorage.getItem(`faaSupervisorCompleted_${email}`) === "true" ||
      localStorage.getItem(`faaEmployeeCompleted_${email}`)   === "true";

    const isDone = hasCert || localDone;

    if (isDone)            completed++;
    else if (isRegistered) inProgress++;
    else                   notStarted++;
  });

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set("statTotal",     total);
  set("statCompleted", completed);
  set("statInProgress", inProgress);
  set("statPending",   notStarted);

  /* Delta badges — show change indicator if IDs exist */
  set("statTotalDelta",     "");
  set("statCompletedDelta", "");
  set("statProgressDelta",  "");
  set("statPendingDelta",   "");
}

/* =========================================================
   SEAT COUNTS
========================================================= */

function getSeatStats(company) {
  const total = company?.seats?.employee?.total ?? 0;
  const used  = Object.values(company?.usedSeats?.employee || {}).filter(s => !s.revoked).length;
  return { totalPurchased: total, usedSeats: used, remaining: Math.max(0, total - used) };
}

function updateSeatCounts(company) {
  if (!company) company = getCompanyProfile();

  const empTotal     = company?.seats?.employee?.total || 0;
  const empUsed      = Object.values(company?.usedSeats?.employee   || {}).filter(s => !s.revoked).length;
  const empAvailable = Math.max(0, empTotal - empUsed);

  const supTotal     = company?.seats?.supervisor?.total || 0;
  const supUsed      = Object.values(company?.usedSeats?.supervisor || {}).filter(s => !s.revoked).length;
  const supAvailable = Math.max(0, supTotal - supUsed);

  const derTotal     = company?.seats?.der?.total || 0;
  const derUsed      = Object.values(company?.usedSeats?.der        || {}).filter(s => !s.revoked).length;
  const derAvailable = Math.max(0, derTotal - derUsed);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set("seatTotal",           empTotal);
  set("seatUsed",            empUsed);
  set("seatRemaining",       empAvailable);
  set("supervisorTotal",     supTotal);
  set("supervisorUsed",      supUsed);
  set("supervisorAvailable", supAvailable);
  set("derTotal",            derTotal);
  set("derUsed",             derUsed);
  set("derAvailable",        derAvailable);
}

/* =========================================================
   ASSIGN SEATS
========================================================= */

/* ─────────────────────────────────────────────────────────
   SEAT ASSIGNMENT RULES
   • All 3 modules (Employee, Supervisor, DER) are INDEPENDENT
   • A person can hold any combination simultaneously
   • Block ONLY if:
       - Same module is already active/assigned (not revoked)
       - Same module was already COMPLETED (can't redo a done module)
         EXCEPTION: Supervisor must redo annually (allow if completed
         more than 365 days ago)
   • No hierarchy — DER does not block Supervisor and vice versa
───────────────────────────────────────────────────────── */

function _moduleCompleted(email, role) {
  /* Returns completion timestamp (ms) or null */
  if (role === 'employee')   return localStorage.getItem('fmcsaEmployeeCompleted_' + email) === 'true'
                               ? parseInt(localStorage.getItem('fmcsaEmployeeDate_' + email) || '0') || Date.now() : null;
  if (role === 'supervisor') return localStorage.getItem('fmcsaModuleBCompleted_' + email) === 'true'
                               ? parseInt(localStorage.getItem('fmcsaModuleBDate_' + email) || '0') || Date.now() : null;
  if (role === 'der')        return localStorage.getItem('fmcsaDERCompleted_' + email) === 'true'
                               ? parseInt(localStorage.getItem('fmcsaDERDate_' + email) || '0') || Date.now() : null;
  return null;
}

function assignEmployeeSeat(emailParam) {
  const email = (emailParam || document.getElementById('seatEmail')?.value.trim() || '').toLowerCase();
  if (!email) return showToast('Enter an email address.', 'error');

  const company = getCompanyProfile();
  if (!company.usedSeats) company.usedSeats = {};

  /* Block: already has active Employee seat */
  const activeEmp = company.usedSeats?.employee?.[email] && !company.usedSeats.employee[email].revoked;
  if (activeEmp) return showToast('This person already has an Employee seat assigned.', 'error');

  /* Block: Employee module already completed (no annual renewal for employees) */
  const completedTs = _moduleCompleted(email, 'employee');
  if (completedTs) return showToast('This person already completed the Employee module.', 'error');

  const total = company.seats?.employee?.total || 0;
  const used  = Object.values(company.usedSeats.employee || {}).filter(s => !s.revoked).length;
  if (used >= total) return showToast('No employee seats available. Purchase more seats.', 'error');

  if (!company.usedSeats.employee) company.usedSeats.employee = {};
  company.usedSeats.employee[email] = { assignedAt: Date.now(), revoked: false };
  if (!company.employees) company.employees = {};
  company.employees[email] = { email, role: 'employee', status: 'assigned', addedAt: Date.now() };

  if (!company.invites) company.invites = {};
  if (!company.invites[email] || company.invites[email].role !== 'employee') {
    const code = 'AMS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    company.invites[email] = { email, code, program: company.program || 'fmcsa', role: 'employee', createdAt: Date.now(), status: 'assigned' };
    _showInviteMsg(code, 'Employee');
  }

  saveCompanyProfile(company);
  showToast('Employee seat assigned.', 'success');
  _refreshAll(company);
}

function assignSupervisorSeat(emailParam) {
  const email = (emailParam || document.getElementById('seatEmail')?.value.trim() || '').toLowerCase();
  if (!email) return showToast('Enter an email address.', 'error');

  const company = getCompanyProfile();
  if (!company.usedSeats) company.usedSeats = {};

  /* Block: already has active Supervisor seat */
  const activeSup = company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked;
  if (activeSup) return showToast('This person already has a Supervisor seat assigned.', 'error');

  /* Block: Supervisor module completed — UNLESS it was over 365 days ago (annual renewal) */
  const completedTs = _moduleCompleted(email, 'supervisor');
  if (completedTs) {
    const daysSince = (Date.now() - completedTs) / (1000 * 60 * 60 * 24);
    if (daysSince < 365) {
      const renewDate = new Date(completedTs + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US');
      return showToast('Supervisor module completed. Annual renewal due ' + renewDate + '.', 'info', 5000);
    }
    /* Over a year — archive old cert before clearing, then reset for renewal */
    const prog = (company.program || 'fmcsa').toLowerCase();
    const oldCertId  = prog === 'faa'
      ? localStorage.getItem(`faaSupervisorCertificateId_${email}`)
      : localStorage.getItem(`fmcsaModuleBCertificateId_${email}`);
    const oldDate    = prog === 'faa'
      ? localStorage.getItem(`faaSupervisorTrainingDate_${email}`)
      : localStorage.getItem(`fmcsaModuleBDate_${email}`);

    if (oldCertId) {
      if (!company.certHistory)           company.certHistory = {};
      if (!company.certHistory[email])    company.certHistory[email] = [];
      company.certHistory[email].push({
        module:      'supervisor',
        program:     prog,
        certId:      oldCertId,
        completedAt: oldDate ? parseInt(oldDate) : completedTs,
        archivedAt:  Date.now()
      });
    }

    /* Clear current completion keys */
    if (prog === 'faa') {
      localStorage.removeItem(`faaSupervisorCompleted_${email}`);
      localStorage.removeItem(`faaSupervisorCertificateId_${email}`);
      localStorage.removeItem(`faaSupervisorTrainingDate_${email}`);
    } else {
      localStorage.removeItem('fmcsaModuleBCompleted_' + email);
      localStorage.removeItem('fmcsaModuleACompleted_' + email);
      localStorage.removeItem('fmcsaModuleACertificateId_' + email);
      localStorage.removeItem('fmcsaModuleBDate_' + email);
    }
    if (company.usedSeats?.supervisor?.[email]) company.usedSeats.supervisor[email].revoked = true;
  }

  const total = company.seats?.supervisor?.total || 0;
  const used  = Object.values(company.usedSeats?.supervisor || {}).filter(s => !s.revoked).length;
  if (used >= total) return showToast('No supervisor seats available. Purchase more seats.', 'error');

  if (!company.usedSeats.supervisor) company.usedSeats.supervisor = {};
  company.usedSeats.supervisor[email] = { assignedAt: Date.now(), revoked: false };
  if (!company.employees) company.employees = {};
  /* Keep existing role label if they have other modules; only set supervisor if no other role */
  if (!company.employees[email]) company.employees[email] = { email, role: 'supervisor', status: 'assigned', addedAt: Date.now() };
  else company.employees[email].supervisorStatus = 'assigned';

  if (!company.invites) company.invites = {};
  const supCode = 'AMS-SUP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  /* Always generate a new supervisor invite */
  company.invites[email + '_supervisor'] = { email, code: supCode, program: company.program || 'fmcsa', role: 'supervisor', createdAt: Date.now(), status: 'assigned' };
  _showInviteMsg(supCode, 'Supervisor');

  saveCompanyProfile(company);
  showToast(completedTs ? 'Supervisor annual renewal assigned.' : 'Supervisor seat assigned.', 'success');
  _refreshAll(company);
}

function assignDerSeat(emailParam) {
  const email = (emailParam || document.getElementById('seatEmail')?.value.trim() || '').toLowerCase();
  if (!email) return showToast('Enter an email address.', 'error');

  const company = getCompanyProfile();
  if (!company.usedSeats) company.usedSeats = {};

  /* Block: already has active DER seat */
  const activeDer = company.usedSeats?.der?.[email] && !company.usedSeats.der[email].revoked;
  if (activeDer) return showToast('This person already has a DER seat assigned.', 'error');

  /* Block: DER module already completed */
  const completedTs = _moduleCompleted(email, 'der');
  if (completedTs) return showToast('This person already completed the DER module.', 'error');

  const total = company.seats?.der?.total || 0;
  const used  = Object.values(company.usedSeats?.der || {}).filter(s => !s.revoked).length;
  if (used >= total) return showToast('No DER seats available. Purchase more seats.', 'error');

  if (!company.usedSeats.der) company.usedSeats.der = {};
  company.usedSeats.der[email] = { assignedAt: Date.now(), revoked: false };
  if (!company.employees) company.employees = {};
  if (!company.employees[email]) company.employees[email] = { email, role: 'der', status: 'assigned', addedAt: Date.now() };
  else company.employees[email].derStatus = 'assigned';

  if (!company.invites) company.invites = {};
  const derCode = 'AMS-DER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  company.invites[email + '_der'] = { email, code: derCode, program: company.program || 'fmcsa', role: 'der', createdAt: Date.now(), status: 'assigned' };
  _showInviteMsg(derCode, 'DER');

  saveCompanyProfile(company);
  showToast('DER seat assigned.', 'success');
  _refreshAll(company);
}

/* helpers */
function _showInviteMsg(code, label) {
  const msg = document.getElementById("inviteMsg");
  if (!msg) return;
  msg.innerHTML = `
    ${label} Invite Code: <strong>${code}</strong>
    <button onclick="copyInvite('${code}')" style="margin-left:10px;padding:4px 8px;cursor:pointer;">Copy</button>
  `;
}

function _refreshAll(company) {
  renderSeatAssignments(company);
  updateSeatCounts(company);
  loadEmployees(company.id);
  const input = document.getElementById("seatEmail");
  if (input) input.value = "";
}

/* =========================================================
   LOAD EMPLOYEES — CLEAN DROPDOWN (Resend / View Cert / Remove)
========================================================= */

function loadEmployees(companyId) {
  const users   = JSON.parse(localStorage.getItem("ams_users")      || "[]");
  const company = getCompanyProfile();

  if (!company.usedSeats) company.usedSeats = { employee: {}, supervisor: {}, der: {} };

  const tbody = document.getElementById("employeeTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  /* ── Build rows: ONE ROW PER MODULE PER PERSON ──────────────────────────
     A person with Employee + DER seats gets 2 rows.
     rowEntries = [ { email, module, isInvite }, ... ] */
  const rowEntries = [];
  const seen = new Set(); // track email+module combos to avoid duplicates

  const badgeColors = {
    supervisor: { bg: "#dbeafe", color: "#1d4ed8", label: "Supervisor" },
    der:        { bg: "#dcfce7", color: "#15803d", label: "DER"        },
    employee:   { bg: "#fef9c3", color: "#854d0e", label: "Employee"   },
    none:       { bg: "#f3f4f6", color: "#6b7280", label: "None"       }
  };

  /* 1. Walk every active seat — one row per module */
  ["supervisor", "der", "employee"].forEach(type => {
    Object.entries(company.usedSeats?.[type] || {}).forEach(([rawEmail, seat]) => {
      if (seat.revoked) return;
      const e   = rawEmail.trim().toLowerCase();
      const key = e + "__" + type;
      if (seen.has(key)) return;
      seen.add(key);
      rowEntries.push({ email: e, module: type, isInvite: false });
    });
  });

  /* 2. Walk pending invites — add a row only if no seat row exists for that module */
  Object.values(company.invites || {}).forEach(inv => {
    const e      = (inv.email || "").trim().toLowerCase();
    const module = (inv.role  || "employee").toLowerCase();
    const key    = e + "__" + module;
    if (!e) return;
    if (seen.has(key)) return; // already have a seat row for this combo
    seen.add(key);
    rowEntries.push({ email: e, module, isInvite: true });
  });

  if (!rowEntries.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="users" style="width:22px;height:22px;"></i></div>
            <h4>No employees yet</h4>
            <p>Assign training above to add employees to your roster.</p>
          </div>
        </td>
      </tr>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  rowEntries.forEach(({ email: cleanEmail, module, isInvite }) => {
    /* Registered user lookup for name */
    const registeredUser = users.find(u => (u.email || "").trim().toLowerCase() === cleanEmail);

    /* Per-module completion check */
    const completionFlags = {
      supervisor: localStorage.getItem(`fmcsaModuleBCompleted_${cleanEmail}`)  === "true",
      der:        localStorage.getItem(`fmcsaDERCompleted_${cleanEmail}`)      === "true",
      employee:   localStorage.getItem(`fmcsaEmployeeCompleted_${cleanEmail}`) === "true"
    };
    /* Also check certIds as fallback for the module's cert type */
    const hasCert = !!company.certIds?.[cleanEmail]?.certId;
    const trainingCompleted = completionFlags[module] || (hasCert && module === (company.certIds?.[cleanEmail]?.type || "").toLowerCase());

    const badge = badgeColors[module] || badgeColors.none;

    /* Status */
    let statusLabel  = "Invited";
    let statusClass  = "status-pending";
    if (!isInvite) {
      statusLabel = trainingCompleted ? "Completed" : "In Progress";
      statusClass = trainingCompleted ? "status-completed" : "status-in-progress";
    }

    /* Unique menu key so same email with 2 modules gets 2 separate menus */
    const menuKey = cleanEmail.replace(/[@.]/g, "_") + "__" + module;

    /* Remove button — pass module so only that module row is removed */
    const removeBtn = trainingCompleted
      ? `<button disabled title="Cannot remove — this module is already completed. Record must be kept."
              style="opacity:.4;cursor:not-allowed;">
            <i data-lucide="trash-2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            Remove
          </button>`
      : `<button onclick="removeEmployee('${cleanEmail}', '${module}')" style="color:var(--color-warning);">
            <i data-lucide="trash-2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            Remove
          </button>`;

    /* View Cert — only if completed */
    const viewCertBtn = trainingCompleted
      ? `<button onclick="viewEmployeeCert('${cleanEmail}')">
            <i data-lucide="award" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            View Certificate
          </button>`
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="td-name">
        ${isInvite
          ? `<span style="color:var(--color-text-muted);font-style:italic;">Pending</span>`
          : (`${registeredUser?.firstName || ""} ${registeredUser?.lastName || ""}`.trim() || "—")}
      </td>
      <td class="td-email">${cleanEmail}</td>
      <td>
        <span class="role-badge role-${module}"
              style="background:${badge.bg};color:${badge.color};">
          ${badge.label}
        </span>
      </td>
      <td>
        <span class="status-badge ${statusClass}">
          <span class="status-dot"></span>
          ${statusLabel}
        </span>
      </td>
      <td style="white-space:nowrap;">
        <div style="display:inline-block;position:relative;">
          <button class="btn btn-secondary btn-sm" onclick="toggleMenu('${menuKey}')">
            Actions <i data-lucide="chevron-down" style="width:12px;height:12px;"></i>
          </button>
          <div id="menu-${menuKey}" class="action-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:100;">
            <button onclick="resendInvite('${cleanEmail}')">
              <i data-lucide="send" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
              Resend Invite
            </button>
            ${viewCertBtn}
            <hr>
            ${removeBtn}
          </div>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
}

/* =========================================================
   REMOVE EMPLOYEE
========================================================= */

window.removeEmployee = function (email, module) {
  const cleanEmail = email.toLowerCase().trim();

  /* If a specific module is passed, remove only that module row */
  if (module) {
    const completionKeys = {
      employee:   `fmcsaEmployeeCompleted_${cleanEmail}`,
      supervisor: `fmcsaModuleBCompleted_${cleanEmail}`,
      der:        `fmcsaDERCompleted_${cleanEmail}`
    };
    if (localStorage.getItem(completionKeys[module]) === "true") {
      showToast("Cannot remove — this module is already completed. Record must be kept.", "error");
      return;
    }
    /* Two-click confirmation — first click sets a pending flag */
    const confirmKey = `_pendingRemove_${cleanEmail}_${module}`;
    if (!sessionStorage.getItem(confirmKey)) {
      sessionStorage.setItem(confirmKey, "1");
      showToast(`Click Remove again to confirm removing ${module} training for ${cleanEmail}.`, "warning", 4000);
      setTimeout(() => sessionStorage.removeItem(confirmKey), 4000);
      return;
    }
    sessionStorage.removeItem(confirmKey);

    const company = getCompanyProfile();

    /* Revoke the specific module seat */
    if (company.usedSeats?.[module]?.[cleanEmail]) {
      delete company.usedSeats[module][cleanEmail];
    }

    /* Remove the module-specific invite if present */
    const inviteKey = module === "employee" ? cleanEmail : cleanEmail + "_" + module;
    if (company.invites?.[inviteKey]) delete company.invites[inviteKey];

    /* If the person has NO remaining active seats, also remove from ams_users */
    const hasOtherSeats = ["employee", "supervisor", "der"].some(type => {
      if (type === module) return false;
      const seat = company.usedSeats?.[type]?.[cleanEmail];
      return seat && !seat.revoked;
    });

    if (!hasOtherSeats) {
      const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
      const updatedUsers = users.filter(u => u.email !== cleanEmail);
      localStorage.setItem("ams_users", JSON.stringify(updatedUsers));
      if (company.employees?.[cleanEmail]) delete company.employees[cleanEmail];
    }

    saveCompanyProfile(company);
    location.reload();
    return;
  }

  /* Legacy fallback: no module passed — block if ANY module completed */
  const completedDER        = localStorage.getItem(`fmcsaDERCompleted_${cleanEmail}`)      === "true";
  const completedSupervisor = localStorage.getItem(`fmcsaModuleBCompleted_${cleanEmail}`)  === "true";
  const completedEmployee   = localStorage.getItem(`fmcsaEmployeeCompleted_${cleanEmail}`) === "true";

  if (completedDER || completedSupervisor || completedEmployee) {
    showToast("Cannot remove — training already completed. Record must be kept.", "error");
    return;
  }

  /* Two-click confirmation */
  const confirmEmpKey = `_pendingRemoveEmp_${cleanEmail}`;
  if (!sessionStorage.getItem(confirmEmpKey)) {
    sessionStorage.setItem(confirmEmpKey, "1");
    showToast(`Click Remove again to confirm removing ${cleanEmail} from the company.`, "warning", 4000);
    setTimeout(() => sessionStorage.removeItem(confirmEmpKey), 4000);
    return;
  }
  sessionStorage.removeItem(confirmEmpKey);

  const users   = JSON.parse(localStorage.getItem("ams_users")      || "[]");
  const company = getCompanyProfile();

  if (company.invites?.[cleanEmail]) delete company.invites[cleanEmail];

  const updatedUsers = users.filter(u => u.email !== cleanEmail);
  localStorage.setItem("ams_users", JSON.stringify(updatedUsers));

  ["employee", "supervisor", "der"].forEach(type => {
    if (company.usedSeats?.[type]?.[cleanEmail]) delete company.usedSeats[type][cleanEmail];
  });

  saveCompanyProfile(company);
  location.reload();
};

/* =========================================================
   RENDER ACTIVE SEAT ASSIGNMENTS
========================================================= */

function renderSeatAssignments(company) {
  const list = document.getElementById("seatUserList");
  if (!list) return;
  list.innerHTML = "";

  const roleColors = {
    employee:   { badge: "role-employee",   label: "Employee"   },
    supervisor: { badge: "role-supervisor", label: "Supervisor" },
    der:        { badge: "role-der",        label: "DER"        }
  };

  let items = [];
  ["employee", "supervisor", "der"].forEach(type => {
    const seats = company.usedSeats?.[type] || {};
    Object.keys(seats).forEach(email => {
      if (seats[email].revoked) return;
      const r = roleColors[type];
      items.push(`
        <li class="assignment-item">
          <span class="assignment-email">
            <i data-lucide="mail"></i>
            ${email}
          </span>
          <span class="role-badge ${r.badge}">${r.label}</span>
        </li>
      `);
    });
  });

  if (!items.length) {
    list.innerHTML = `
      <li>
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="users" style="width:22px;height:22px;"></i></div>
          <h4>No assignments yet</h4>
          <p>Use the form above to assign training to employees.</p>
        </div>
      </li>`;
  } else {
    list.innerHTML = items.join("");
  }

  if (window.lucide) lucide.createIcons();
}

/* =========================================================
   REVOKE SEAT
========================================================= */

window.revokeSeat = function (type, email) {
  const company = getCompanyProfile();

  if (!company.usedSeats?.[type]?.[email]) { showToast("Seat not found.", "error"); return; }

  const completionKeys = {
    der:        `fmcsaDERCompleted_${email}`,
    supervisor: `fmcsaModuleBCompleted_${email}`,
    employee:   `fmcsaEmployeeCompleted_${email}`
  };

  if (localStorage.getItem(completionKeys[type]) === "true") {
    { showToast("Cannot revoke — training already completed.", "warning"); return; }
  }

  company.usedSeats[type][email] = {
    revoked:    true,
    assignedAt: company.usedSeats[type][email]?.assignedAt || Date.now()
  };

  saveCompanyProfile(company);
  renderSeatAssignments(company);
};

/* =========================================================
   BUY SEATS
========================================================= */

function buyEmployeeSeats(qty = 5) {
  const company = getCompanyProfile();
  if (!company.seats.employee) company.seats.employee = { total: 0 };
  company.seats.employee.total += qty;
  saveCompanyProfile(company);
  showToast(`${qty} Employee seat(s) purchased!`, "success");
  location.reload();
}

function buySupervisorSeats(qty = 1) {
  const company = getCompanyProfile();
  if (!company.seats.supervisor) company.seats.supervisor = { total: 0 };
  company.seats.supervisor.total += qty;
  saveCompanyProfile(company);
  showToast(`${qty} Supervisor seat(s) purchased!`, "success");
  location.reload();
}

function buyDerSeats(qty = 1) {
  const company = getCompanyProfile();
  if (!company.seats.der) company.seats.der = { total: 0 };
  company.seats.der.total += qty;
  saveCompanyProfile(company);
  showToast(`${qty} DER seat(s) purchased!`, "success");
  location.reload();
}

/* =========================================================
   INVITE / RESEND / COPY
========================================================= */

function inviteEmployee() {
  const input = document.getElementById("inviteEmail");
  const msg   = document.getElementById("inviteMsg");
  if (!input) return;

  const email = input.value.trim().toLowerCase();
  if (!email || !email.includes("@")) { if (msg) msg.textContent = "Enter a valid email"; return; }

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  if (users.find(u => u.email === email)) {
    if (msg) msg.textContent = "User already registered. Assign a seat instead.";
    return;
  }

  const company = getCompanyProfile();
  if (!company.invites)              company.invites              = {};
  if (!company.usedSeats)            company.usedSeats            = {};
  if (!company.usedSeats.employee)   company.usedSeats.employee   = {};

  if (company.invites[email]) { if (msg) msg.textContent = "Already invited"; return; }

  const hasActiveSeat =
    (company.usedSeats?.employee?.[email]   && company.usedSeats.employee[email].revoked   !== true) ||
    (company.usedSeats?.supervisor?.[email] && company.usedSeats.supervisor[email].revoked !== true) ||
    (company.usedSeats?.der?.[email]        && company.usedSeats.der[email].revoked        !== true);
  if (hasActiveSeat) { if (msg) msg.textContent = "User already assigned"; return; }

  const inviteCode = "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  company.invites[email] = { email, code: inviteCode, program: company.program || "unknown", role: "employee", createdAt: Date.now(), status: "pending" };
  saveCompanyProfile(company);

  if (msg) msg.textContent = "Invite created: " + inviteCode;
  input.value = "";
}

function resendInvite(email) {
  email = email.toLowerCase().trim();
  const company = getCompanyProfile();
  if (!company.invites) company.invites = {};

  const existing = company.invites[email];
  const msg = document.getElementById("inviteMsg");

  if (existing) {
    if (msg) msg.innerHTML = `Invite Code: <strong>${existing.code}</strong> <button onclick="copyInvite('${existing.code}')" style="margin-left:10px;padding:4px 8px;cursor:pointer;">Copy</button>`;
    return;
  }

  const newCode = "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  company.invites[email] = { email, code: newCode, program: company.program || "unknown", role: "employee", createdAt: Date.now(), status: "resent" };
  saveCompanyProfile(company);

  if (msg) msg.innerHTML = `New Invite Code: <strong>${newCode}</strong> <button onclick="copyInvite('${newCode}')" style="margin-left:10px;padding:4px 8px;cursor:pointer;">Copy</button>`;
}

function copyInvite(code) {
  navigator.clipboard.writeText(code).then(() => {
    const msg = document.getElementById("inviteMsg");
    if (msg) msg.innerHTML += " ✅ Copied!";
  });
}

/* =========================================================
   VIEW CERTIFICATE
========================================================= */

function viewEmployeeCert(email) {
  email = email.toLowerCase().trim();
  const company = getCompanyProfile();

  if (!company.usedSeats) { showToast("No company data found", "error"); return; }

  const isAssigned =
    (company.usedSeats?.employee?.[email]   && !company.usedSeats.employee[email].revoked)   ||
    (company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked) ||
    (company.usedSeats?.der?.[email]        && !company.usedSeats.der[email].revoked);

  if (!isAssigned) { showToast("Access denied: This employee is not assigned to your company.", "error"); return; }

  /* 1. Try companyProfile.certIds first */
  let certId = company.certIds?.[email]?.certId || null;

  /* 2. Fallback — check direct localStorage keys written by each training module */
  if (!certId) certId = localStorage.getItem(`fmcsaDERCertificateId_${email}`)       || null;
  if (!certId) certId = localStorage.getItem(`fmcsaModuleBCertificateId_${email}`)   || null; // supervisor cert (module B)
  if (!certId) certId = localStorage.getItem(`fmcsaModuleACertificateId_${email}`)   || null; // supervisor cert (module A fallback)
  if (!certId) certId = localStorage.getItem(`fmcsaEmployeeCertificateId_${email}`)  || null;

  if (!certId) {
    showToast("No certificate found for this employee.", "error");
    return;
  }

  window.location.href = `fmcsa-certificates.html?id=${certId}&email=${encodeURIComponent(email)}&admin=1`;
}

/* =========================================================
   TOGGLE MENUS
========================================================= */

function toggleMenu(email) {
  const menu = document.getElementById(`menu-${email}`);
  if (!menu) return;
  const isOpen = menu.style.display === "block";
  document.querySelectorAll(".action-menu").forEach(m => m.style.display = "none");
  menu.style.display = isOpen ? "none" : "block";
}

function toggleSeatMenu() {
  const menu = document.getElementById("seatMenu");
  if (!menu) return;
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

/* Auto-close seat menu */
document.addEventListener("click", function (e) {
  const menu   = document.getElementById("seatMenu");
  const button = document.querySelector("[onclick='toggleSeatMenu()']");
  if (!menu || !button) return;
  if (!menu.contains(e.target) && !button.contains(e.target)) menu.style.display = "none";
});

/* Auto-close manage menus */
document.addEventListener("click", function (e) {
  const menus   = document.querySelectorAll(".action-menu");
  const buttons = document.querySelectorAll("[onclick^='toggleMenu']");
  let inside = false;
  menus.forEach(m   => { if (m.contains(e.target))   inside = true; });
  buttons.forEach(b => { if (b.contains(e.target))   inside = true; });
  if (!inside) menus.forEach(m => m.style.display = "none");
});

/* =========================================================
   LOGOUT
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");
  window.location.href = "/ams-training-portal/frontend/pages/login.html";
}
