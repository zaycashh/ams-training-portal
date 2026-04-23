/* =========================================================
   COMPANY ADMIN DASHBOARD — FINAL UPGRADED VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  loadCompanyDashboard(user);
});

/* =========================================================
   GLOBAL PROGRAM
========================================================= */

function getCompanyProgram() {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  return company.program || "FAA";
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadCompanyDashboard(user) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

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

  if (updated) localStorage.setItem("companyProfile", JSON.stringify(company));

  const programEl = document.getElementById("companyProgram");
  if (programEl) {
    programEl.textContent = company.program ? company.program.toUpperCase() : "—";
  }

  if (!company.id) { alert("Company profile missing"); return; }

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
  if (!company) company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

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
    const isDone =
      localStorage.getItem(`fmcsaDERCompleted_${email}`)      === "true" ||
      localStorage.getItem(`fmcsaModuleBCompleted_${email}`)  === "true" ||
      localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true";

    if (isDone)          completed++;
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
  if (!company) company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

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

function assignEmployeeSeat(emailParam) {
  const email = (emailParam || document.getElementById("seatEmail")?.value.trim() || "").toLowerCase();
  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const hasAnySeat =
    (company.usedSeats?.employee?.[email]   && !company.usedSeats.employee[email].revoked)   ||
    (company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked) ||
    (company.usedSeats?.der?.[email]        && !company.usedSeats.der[email].revoked);
  if (hasAnySeat) return alert("User already has a training assigned");

  const total = company.seats?.employee?.total || 0;
  const used  = Object.values(company.usedSeats.employee || {}).filter(s => !s.revoked).length;
  if (used >= total) return alert("No employee seats available");

  company.usedSeats.employee[email] = { assignedAt: Date.now(), revoked: false };
  if (!company.employees) company.employees = {};
  company.employees[email] = { email, role: "employee", status: "assigned", addedAt: Date.now() };

  if (!company.invites) company.invites = {};
  if (!company.invites[email]) {
    const code = "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    company.invites[email] = { email, code, program: company.program || "fmcsa", role: "employee", createdAt: Date.now(), status: "assigned" };
    _showInviteMsg(code, "Employee");
  }

  localStorage.setItem("companyProfile", JSON.stringify(company));
  alert("Employee seat assigned");
  _refreshAll(company);
}

function assignSupervisorSeat(emailParam) {
  const email = (emailParam || document.getElementById("seatEmail")?.value.trim() || "").toLowerCase();
  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const hasAnySeat =
    (company.usedSeats?.employee?.[email]   && !company.usedSeats.employee[email].revoked)   ||
    (company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked) ||
    (company.usedSeats?.der?.[email]        && !company.usedSeats.der[email].revoked);
  if (hasAnySeat) return alert("User already has a training assigned");

  const total = company.seats?.supervisor?.total || 0;
  const used  = Object.values(company.usedSeats?.supervisor || {}).filter(s => !s.revoked).length;
  if (used >= total) return alert("No supervisor seats available");

  if (!company.usedSeats.supervisor) company.usedSeats.supervisor = {};
  company.usedSeats.supervisor[email] = { assignedAt: Date.now(), revoked: false };
  if (!company.employees) company.employees = {};
  company.employees[email] = { email, role: "supervisor", status: "assigned", addedAt: Date.now() };

  if (!company.invites) company.invites = {};
  if (!company.invites[email]) {
    const code = "AMS-SUP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    company.invites[email] = { email, code, program: company.program || "fmcsa", role: "supervisor", createdAt: Date.now(), status: "assigned" };
    _showInviteMsg(code, "Supervisor");
  }

  localStorage.setItem("companyProfile", JSON.stringify(company));
  alert("Supervisor seat assigned");
  _refreshAll(company);
}

function assignDerSeat(emailParam) {
  const email = (emailParam || document.getElementById("seatEmail")?.value.trim() || "").toLowerCase();
  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const hasAnySeat =
    (company.usedSeats?.employee?.[email]   && !company.usedSeats.employee[email].revoked)   ||
    (company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked) ||
    (company.usedSeats?.der?.[email]        && !company.usedSeats.der[email].revoked);
  if (hasAnySeat) return alert("User already has a training assigned");

  const total = company.seats?.der?.total || 0;
  const used  = Object.values(company.usedSeats?.der || {}).filter(s => !s.revoked).length;
  if (used >= total) return alert("No DER seats available");

  if (!company.usedSeats.der) company.usedSeats.der = {};
  company.usedSeats.der[email] = { assignedAt: Date.now(), revoked: false };
  if (!company.employees) company.employees = {};
  company.employees[email] = { email, role: "der", status: "assigned", addedAt: Date.now() };

  if (!company.invites) company.invites = {};
  if (!company.invites[email]) {
    const code = "AMS-DER-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    company.invites[email] = { email, code, program: company.program || "fmcsa", role: "der", createdAt: Date.now(), status: "assigned" };
    _showInviteMsg(code, "DER");
  }

  localStorage.setItem("companyProfile", JSON.stringify(company));
  alert("DER seat assigned");
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
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) company.usedSeats = { employee: {}, supervisor: {}, der: {} };

  const tbody = document.getElementById("employeeTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  const employees = users.filter(u => u.companyId === companyId && u.role === "employee");
  const invites   = Object.values(company.invites || {});

  if (!employees.length && !invites.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
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

  [...employees, ...invites].forEach(emp => {
    const cleanEmail = emp.email.trim().toLowerCase();

    const isInvite = ["pending", "resent", "assigned"].includes(emp.status);

    /* Training type */
    let trainingType = "None";
    if      (company.usedSeats.supervisor?.[cleanEmail] && !company.usedSeats.supervisor[cleanEmail].revoked) trainingType = "Supervisor";
    else if (company.usedSeats.der?.[cleanEmail]        && !company.usedSeats.der[cleanEmail].revoked)        trainingType = "DER";
    else if (company.usedSeats.employee?.[cleanEmail]   && !company.usedSeats.employee[cleanEmail].revoked)   trainingType = "Employee";

    /* Completion check */
    const completedDER        = localStorage.getItem(`fmcsaDERCompleted_${cleanEmail}`)      === "true";
    const completedSupervisor = localStorage.getItem(`fmcsaModuleBCompleted_${cleanEmail}`)  === "true";
    const completedEmployee   = localStorage.getItem(`fmcsaEmployeeCompleted_${cleanEmail}`) === "true";
    const trainingCompleted   = completedDER || completedSupervisor || completedEmployee;

    /* Status label */
    let statusLabel = "Invited";
    if (!isInvite) statusLabel = trainingCompleted ? "Completed" : "In Progress";

    /* Training badge colors */
    const badgeColors = {
      Supervisor: { bg: "#dbeafe", color: "#1d4ed8" },
      DER:        { bg: "#dcfce7", color: "#15803d" },
      Employee:   { bg: "#fef9c3", color: "#854d0e" },
      None:       { bg: "#f3f4f6", color: "#6b7280" }
    };
    const badge = badgeColors[trainingType] || badgeColors.None;

    /* Status badge */
    const statusClass = trainingCompleted
      ? "status-completed"
      : isInvite
        ? "status-pending"
        : "status-in-progress";

    /* Remove button — disabled + tooltip if training completed */
    const removeBtn = trainingCompleted
      ? `<button
            disabled
            title="Cannot remove — training completed. Record must be kept."
            style="opacity:.4;cursor:not-allowed;"
          >
            <i data-lucide="trash-2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            Remove
          </button>`
      : `<button
            onclick="removeEmployee('${cleanEmail}')"
            style="color:var(--color-warning);"
          >
            <i data-lucide="trash-2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            Remove
          </button>`;

    /* View Cert — only show if completed */
    const viewCertBtn = trainingCompleted
      ? `<button onclick="viewEmployeeCert('${cleanEmail}')">
            <i data-lucide="award" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>
            View Certificate
          </button>`
      : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="td-name">
        ${isInvite ? `<span style="color:var(--color-text-muted);font-style:italic;">Pending</span>` : `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "—"}
      </td>
      <td class="td-email">${emp.email}</td>
      <td>
        <span class="role-badge role-${trainingType.toLowerCase() === "none" ? "employee" : trainingType.toLowerCase()}"
              style="background:${badge.bg};color:${badge.color};">
          ${trainingType}
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
          <button class="btn btn-secondary btn-sm" onclick="toggleMenu('${cleanEmail}')">
            Actions <i data-lucide="chevron-down" style="width:12px;height:12px;"></i>
          </button>
          <div id="menu-${cleanEmail}" class="action-menu" style="display:none;position:absolute;right:0;top:calc(100% + 4px);z-index:100;">
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

window.removeEmployee = function (email) {
  const cleanEmail = email.toLowerCase().trim();
  if (!confirm("Remove this employee from the company?")) return;

  const users   = JSON.parse(localStorage.getItem("ams_users")      || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (company.invites?.[cleanEmail]) delete company.invites[cleanEmail];

  const completedDER        = localStorage.getItem(`fmcsaDERCompleted_${cleanEmail}`)      === "true";
  const completedSupervisor = localStorage.getItem(`fmcsaModuleBCompleted_${cleanEmail}`)  === "true";
  const completedEmployee   = localStorage.getItem(`fmcsaEmployeeCompleted_${cleanEmail}`) === "true";

  if (completedDER || completedSupervisor || completedEmployee) {
    alert("Cannot remove employee — training completed. Record must be kept.");
    return;
  }

  const updatedUsers = users.filter(u => u.email !== cleanEmail);
  localStorage.setItem("ams_users", JSON.stringify(updatedUsers));

  ["employee", "supervisor", "der"].forEach(type => {
    if (company.usedSeats?.[type]?.[cleanEmail]) delete company.usedSeats[type][cleanEmail];
  });

  localStorage.setItem("companyProfile", JSON.stringify(company));
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
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats?.[type]?.[email]) return alert("Seat not found.");

  const completionKeys = {
    der:        `fmcsaDERCompleted_${email}`,
    supervisor: `fmcsaModuleBCompleted_${email}`,
    employee:   `fmcsaEmployeeCompleted_${email}`
  };

  if (localStorage.getItem(completionKeys[type]) === "true") {
    return alert("Cannot revoke — training already completed.");
  }

  company.usedSeats[type][email] = {
    revoked:    true,
    assignedAt: company.usedSeats[type][email]?.assignedAt || Date.now()
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));
  renderSeatAssignments(company);
};

/* =========================================================
   BUY SEATS
========================================================= */

function buyEmployeeSeats(qty = 5) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  if (!company.seats.employee) company.seats.employee = { total: 0 };
  company.seats.employee.total += qty;
  localStorage.setItem("companyProfile", JSON.stringify(company));
  alert(`${qty} Employee seat(s) purchased!`);
  location.reload();
}

function buySupervisorSeats(qty = 1) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  if (!company.seats.supervisor) company.seats.supervisor = { total: 0 };
  company.seats.supervisor.total += qty;
  localStorage.setItem("companyProfile", JSON.stringify(company));
  alert(`${qty} Supervisor seat(s) purchased!`);
  location.reload();
}

function buyDerSeats(qty = 1) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  if (!company.seats.der) company.seats.der = { total: 0 };
  company.seats.der.total += qty;
  localStorage.setItem("companyProfile", JSON.stringify(company));
  alert(`${qty} DER seat(s) purchased!`);
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

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
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
  localStorage.setItem("companyProfile", JSON.stringify(company));

  if (msg) msg.textContent = "Invite created: " + inviteCode;
  input.value = "";
}

function resendInvite(email) {
  email = email.toLowerCase().trim();
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  if (!company.invites) company.invites = {};

  const existing = company.invites[email];
  const msg = document.getElementById("inviteMsg");

  if (existing) {
    if (msg) msg.innerHTML = `Invite Code: <strong>${existing.code}</strong> <button onclick="copyInvite('${existing.code}')" style="margin-left:10px;padding:4px 8px;cursor:pointer;">Copy</button>`;
    return;
  }

  const newCode = "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  company.invites[email] = { email, code: newCode, program: company.program || "unknown", role: "employee", createdAt: Date.now(), status: "resent" };
  localStorage.setItem("companyProfile", JSON.stringify(company));

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
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) { alert("No company data found"); return; }

  const isAssigned =
    (company.usedSeats?.employee?.[email]   && !company.usedSeats.employee[email].revoked)   ||
    (company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked) ||
    (company.usedSeats?.der?.[email]        && !company.usedSeats.der[email].revoked);

  if (!isAssigned) { alert("Access denied: This employee is not assigned to your company."); return; }

  /* Look up cert ID from companyProfile.certIds (written at completion time) */
  const certEntry = company.certIds?.[email];
  const certId = certEntry?.certId || null;

  if (!certId) { alert("No certificate found for this employee. They may need to complete their training first."); return; }

  sessionStorage.setItem("adminViewing", "true");
  window.location.href = `fmcsa-certificates.html?id=${certId}&email=${encodeURIComponent(email)}`;
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
