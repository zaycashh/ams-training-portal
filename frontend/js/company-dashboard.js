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
  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  return company.program || "FAA"; // default safe
}

/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadCompanyDashboard(user) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
   
/* =========================================================
   🔥 ENSURE FULL SEAT STRUCTURE (FINAL FIX)
========================================================= */

let updated = false;

/* =========================
   BASE STRUCTURE FIRST
========================= */

if (!company.seats) {
  company.seats = {};
  updated = true;
}

if (!company.usedSeats) {
  company.usedSeats = {};
  updated = true;
}

/* =========================
   FORCE ALL SEAT TYPES
========================= */

if (!company.seats.employee) {
  company.seats.employee = { total: 0 };
  updated = true;
}

if (!company.seats.supervisor) {
  company.seats.supervisor = { total: 0 };
  updated = true;
}

if (!company.seats.der) {
  company.seats.der = { total: 0 };
  updated = true;
}

/* =========================
   FORCE USED SEAT STRUCTURE
========================= */

if (!company.usedSeats.employee) {
  company.usedSeats.employee = {};
  updated = true;
}

if (!company.usedSeats.supervisor) {
  company.usedSeats.supervisor = {};
  updated = true;
}

if (!company.usedSeats.der) {
  company.usedSeats.der = {};
  updated = true;
}

/* =========================
   🔥 NORMALIZE EMPLOYEE SEATS
========================= */

Object.keys(company.usedSeats.employee).forEach(email => {
  const seat = company.usedSeats.employee[email];

  if (typeof seat !== "object") {
company.usedSeats.employee[email] = {
  assignedAt: Date.now(),
  revoked: false
};

/* 🔥 ADD THIS RIGHT HERE */
if (!company.employees) company.employees = {};

if (!company.employees[email]) {
  company.employees[email] = {
    email: email,
    role: "employee",
    status: "invited",
    addedAt: Date.now()
  };
}
    updated = true;
  } else if (!("revoked" in seat)) {
    seat.revoked = false;
    updated = true;
  }
});
   /* =========================
   🔥 NORMALIZE SUPERVISOR
========================= */

Object.keys(company.usedSeats.supervisor).forEach(email => {
  const seat = company.usedSeats.supervisor[email];

  if (typeof seat !== "object") {
    company.usedSeats.supervisor[email] = {
      assignedAt: Date.now(),
      revoked: false
    };
     
    updated = true;
  } else if (!("revoked" in seat)) {
    seat.revoked = false;
    updated = true;
  }
});

/* =========================
   🔥 NORMALIZE DER
========================= */

Object.keys(company.usedSeats.der).forEach(email => {
  const seat = company.usedSeats.der[email];

  if (typeof seat !== "object") {
    company.usedSeats.der[email] = {
      assignedAt: Date.now(),
      revoked: false
    };
    updated = true;
  } else if (!("revoked" in seat)) {
    seat.revoked = false;
    updated = true;
  }
});

/* =========================
   🔥 SAVE FIX
========================= */

if (updated) {
  localStorage.setItem("companyProfile", JSON.stringify(company));
}
  const programEl = document.getElementById("companyProgram");

if (programEl) {
  const program = company.program ? company.program.toUpperCase() : "—"; programEl.textContent = program;
}

  if (!company.id) {
    alert("Company profile missing");
    return;
  }

  document.getElementById("companyName").textContent =
    company.name || user.company || "—";

  document.getElementById("companyAdmin").textContent =
    user.email || "—";

  document.getElementById("companyModules").textContent =
    (company.modules && company.modules.length)
      ? company.modules.join(", ")
      : "—";

  loadEmployees(company.id);
  updateSeatCounts(company);
  renderSeatAssignments(company);
}

/* =========================================================
   SEAT SYSTEM (EMPLOYEE ONLY)
========================================================= */

function getSeatStats(company) {

  const total = company?.seats?.employee?.total ?? 0;

  const used = Object.values(company?.usedSeats?.employee || {})
  .filter(s => !s.revoked)
  .length;

  const remaining = total - used;

  return {
    totalPurchased: total,
    usedSeats: used,
    remaining: remaining < 0 ? 0 : remaining
  };
}

function updateSeatCounts(company) {

  if (!company) {
    company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  }

  /* =========================
     EMPLOYEE
  ========================= */

  const empTotal = company?.seats?.employee?.total || 0;

  const empUsed = Object.values(company?.usedSeats?.employee || {})
  .filter(s => !s.revoked)
  .length;

  const empAvailable = Math.max(0, empTotal - empUsed);

 /* =========================
   SUPERVISOR
========================= */

const supTotal = company?.seats?.supervisor?.total || 0;

const supUsed = Object.values(company?.usedSeats?.supervisor || {})
  .filter(s => !s.revoked)
  .length;

const supAvailable = Math.max(0, supTotal - supUsed);
   
  /* =========================
   DER
========================= */

const derTotal = company?.seats?.der?.total || 0;

const derUsed = Object.values(company?.usedSeats?.der || {})
  .filter(s => !s.revoked)
  .length;

const derAvailable = Math.max(0, derTotal - derUsed);

  /* =========================
     UPDATE UI — EMPLOYEE
  ========================= */

  const seatTotal = document.getElementById("seatTotal");
  const seatUsed = document.getElementById("seatUsed");
  const seatRemaining = document.getElementById("seatRemaining");

  if (seatTotal) seatTotal.textContent = empTotal;
  if (seatUsed) seatUsed.textContent = empUsed;
  if (seatRemaining) seatRemaining.textContent = empAvailable;

  /* =========================
     UPDATE UI — SUPERVISOR
  ========================= */

  const supTotalEl = document.getElementById("supervisorTotal");
  const supUsedEl = document.getElementById("supervisorUsed");
  const supAvailEl = document.getElementById("supervisorAvailable");

  if (supTotalEl) supTotalEl.textContent = supTotal;
  if (supUsedEl) supUsedEl.textContent = supUsed;
  if (supAvailEl) supAvailEl.textContent = supAvailable;

  /* =========================
     UPDATE UI — DER
  ========================= */

  const derTotalEl = document.getElementById("derTotal");
  const derUsedEl = document.getElementById("derUsed");
  const derAvailEl = document.getElementById("derAvailable");

  if (derTotalEl) derTotalEl.textContent = derTotal;
  if (derUsedEl) derUsedEl.textContent = derUsed;
  if (derAvailEl) derAvailEl.textContent = derAvailable;
}
/* =========================================================
   ASSIGN EMPLOYEE SEAT (UPDATED)
========================================================= */
function assignEmployeeSeat(emailParam) {

const email = (emailParam ||
  document.getElementById("seatEmail").value.trim()
).toLowerCase();

  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const total = company.seats?.employee?.total || 0;
  const used = Object.values(company.usedSeats.employee || {})
  .filter(s => !s.revoked)
  .length;

  if (used >= total) {
    return alert("No employee seats available");
  }

  const existingSeat = company.usedSeats.employee[email];

if (existingSeat && existingSeat.revoked !== true) {
  return alert("Employee already assigned");
}

  company.usedSeats.employee[email] = {
  assignedAt: Date.now(),
  revoked: false
};
   
// 🔥 AUTO CREATE INVITE
if (!company.invites) company.invites = {};

// 🔥 AUTO CREATE INVITE
if (!company.invites) company.invites = {};

if (!company.invites[email]) {

  const code =
    "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  company.invites[email] = {
    email,
    code,
    program: company.program || "fmcsa",
    role: "employee",
    createdAt: Date.now(),
    status: "assigned"
  };

  const msg = document.getElementById("inviteMsg");

  if (msg) {
    msg.innerHTML = `
      Invite Code: <strong>${code}</strong>
      <button onclick="copyInvite('${code}')"
        style="margin-left:10px; padding:4px 8px; cursor:pointer;">
        Copy
      </button>
    `;
  }

}

/* 🔥 ALWAYS SAVE */
localStorage.setItem("companyProfile", JSON.stringify(company));

alert("Employee seat assigned");

location.reload();
}
   
}
/* =========================================================
   ASSIGN SUPERVISOR SEAT
========================================================= */

function assignSupervisorSeat(emailParam) {

const email = (emailParam ||
  document.getElementById("seatEmail").value.trim()
).toLowerCase();

  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const total = company.seats?.supervisor?.total || 0;
  const used = Object.values(company.usedSeats.supervisor || {})
  .filter(s => !s.revoked)
  .length;

  if (used >= total) {
    return alert("No supervisor seats available");
  }

  const existingSeat = company.usedSeats.supervisor[email];

if (existingSeat && existingSeat.revoked !== true) {
  return alert("Supervisor already assigned");
}

  company.usedSeats.supervisor[email] = {
  assignedAt: Date.now(),
  revoked: false
};
   
// 🔥 AUTO CREATE INVITE
if (!company.invites) company.invites = {};

if (!company.invites[email]) {

  const code =
    "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  company.invites[email] = {
    email,
    code,
    program: company.program || "fmcsa",
    role: "employee",
    createdAt: Date.now(),
    status: "assigned"
  };

  alert("Invite Code: " + code);
}
  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("Supervisor seat assigned");

  location.reload();
}

/* =========================================================
   ASSIGN DER SEAT
========================================================= */

function assignDerSeat(emailParam) {

const email = (emailParam ||
  document.getElementById("seatEmail").value.trim()
).toLowerCase();

  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const total = company.seats?.der?.total || 0;
  const used = Object.values(company.usedSeats.der || {})
  .filter(s => !s.revoked)
  .length;

  if (used >= total) {
    return alert("No DER seats available");
  }

  const existingSeat = company.usedSeats.der[email];

if (existingSeat && existingSeat.revoked !== true) {
  return alert("DER already assigned");
}

  company.usedSeats.der[email] = {
  assignedAt: Date.now(),
  revoked: false
};
   
// 🔥 AUTO CREATE INVITE
if (!company.invites) company.invites = {};

if (!company.invites[email]) {

  const code =
    "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  company.invites[email] = {
    email,
    code,
    program: company.program || "fmcsa",
    role: "employee",
    createdAt: Date.now(),
    status: "assigned"
  };

  alert("Invite Code: " + code);
}
  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("DER seat assigned");

  location.reload();
}

/* =========================================================
   LOAD EMPLOYEES (PROGRAM-AWARE + TRAINING TYPE)
========================================================= */

function loadEmployees(companyId) {

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) {
    company.usedSeats = {
      employee: {},
      supervisor: {},
      der: {}
    };
  }

  const tbody = document.getElementById("employeeTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  const program = getCompanyProgram();

  const employees = users.filter(
    u => u.companyId === companyId && u.role === "employee"
  );

  const invites = Object.values(company.invites || {});

if (!employees.length && !invites.length) {
  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="opacity:.6;">No employees yet</td>
    </tr>
  `;
  return;
}

  /* =========================================================
     🔥 LOOP FIX (YOU WERE MISSING THIS)
  ========================================================= */

  const invites = Object.values(company.invites || {});

[...employees, ...invites].forEach(emp => {

    const cleanEmail = emp.email.trim().toLowerCase(); // ✅ MUST BE FIRST

    const isInvite =
   emp.status === "pending" || emp.status === "resent";

    /* =========================
       DETERMINE TRAINING TYPE
    ========================= */

    let trainingType = "None";

    if (company.usedSeats.supervisor?.[cleanEmail] && !company.usedSeats.supervisor[cleanEmail].revoked) {
  trainingType = "Supervisor";
} 
else if (company.usedSeats.der?.[cleanEmail] && !company.usedSeats.der[cleanEmail].revoked) {
  trainingType = "DER";
} 
else if (company.usedSeats.employee?.[cleanEmail] && !company.usedSeats.employee[cleanEmail].revoked) {
  trainingType = "Employee";
}

/* =========================
   COMPLETION CHECK (FORCED FIX)
========================= */

const completedDER =
  localStorage.getItem(`fmcsaDERCompleted_${cleanEmail}`) === "true";

const completedSupervisor =
  localStorage.getItem(`fmcsaModuleBCompleted_${cleanEmail}`) === "true";

const completedEmployee =
  localStorage.getItem(`fmcsaEmployeeCompleted_${cleanEmail}`) === "true";

const trainingCompleted =
  completedDER || completedSupervisor || completedEmployee;

    let statusLabel = "Invited";

if (!isInvite) {
  statusLabel = "In Progress";
}

if (!isInvite && trainingCompleted) {
  statusLabel = "Completed";
}

   /* =========================
   RENDER ROW (FINAL CLEAN)
========================= */

const tr = document.createElement("tr");

const hasAnyCert = trainingCompleted;

tr.innerHTML = `
  <td>
  ${isInvite
    ? "(Pending User)"
    : `${emp.firstName || ""} ${emp.lastName || ""}`
  }
</td>

  <td>${emp.email}</td>
  <td>${isInvite ? "Invited" : "Employee"}</td>

  <td>
    <span style="
      padding:4px 8px;
      border-radius:6px;
      background:${
        trainingType === "Supervisor" ? "#dbeafe" :
        trainingType === "DER" ? "#dcfce7" :
        trainingType === "Employee" ? "#fef9c3" :
        "#eee"
      };
      font-weight:600;
    ">
      ${trainingType}
    </span>
  </td>

  <td>${statusLabel}</td>

  <!-- ACTIONS -->
<td>

  <div style="display:inline-block; position:relative;">
    
    <button class="btn-primary"
      onclick="toggleMenu('${cleanEmail}')">
      Manage ▼
    </button>

    <!-- 🔥 KEEP THIS DROPDOWN -->
    <div id="menu-${cleanEmail}" class="action-menu" style="
      display:none;
      position:absolute;
      background:white;
      border:1px solid #ddd;
      padding:10px;
      margin-top:5px;
      z-index:10;
      box-shadow:0 4px 10px rgba(0,0,0,0.1);
      min-width:160px;
    ">

      ${
        trainingType === "None" || isInvite
          ? `
            <button onclick="assignEmployeeSeat('${cleanEmail}')">Assign Employee</button><br>
            <button onclick="assignSupervisorSeat('${cleanEmail}')">Assign Supervisor</button><br>
            <button onclick="assignDerSeat('${cleanEmail}')">Assign DER</button><br>

            <hr style="margin:6px 0;">

            <button onclick="resendInvite('${cleanEmail}')">
              Resend Invite
            </button><br>
          `
          : `
            <button onclick="revokeSeat('${trainingType.toLowerCase()}', '${cleanEmail}')">
              Remove Seat
            </button><br>
          `
      }

      <button onclick="removeEmployee('${cleanEmail}')">
        Remove Employee
      </button>

    </div>

  </div>

  <!-- 🔥 QUICK REMOVE BUTTON -->
  <button onclick="removeEmployee('${cleanEmail}')"
    style="margin-top:6px;background:#dc3545;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;">
    Remove
  </button>

  ${hasAnyCert ? `
  <button onclick="viewEmployeeCert('${cleanEmail}')"
    class="btn-primary"
    style="margin-top:6px;">
    🎓 View Certificate
  </button>
  ` : ""}

</td>
`;

tbody.appendChild(tr);

});
   
}

/* =========================================================
   REMOVE EMPLOYEE
========================================================= */

window.removeEmployee = function (email) {
   
  const cleanEmail = email.toLowerCase().trim();
   
  if (!confirm("Remove this employee from the company?")) return;

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  /* =========================
     REMOVE INVITE
  ========================= */

  if (company.invites && company.invites[cleanEmail]) {
    delete company.invites[cleanEmail];
  }

  /* =========================
     CHECK COMPLETION (SAFE)
  ========================= */

  const completedDER =
    localStorage.getItem(`fmcsaDERCompleted_${cleanEmail}`) === "true";

  const completedSupervisor =
    localStorage.getItem(`fmcsaModuleBCompleted_${cleanEmail}`) === "true";

  const completedEmployee =
    localStorage.getItem(`fmcsaEmployeeCompleted_${cleanEmail}`) === "true";

  const trainingCompleted =
    completedDER || completedSupervisor || completedEmployee;

  if (trainingCompleted) {
    alert("Cannot remove employee — training completed (record must be kept)");
    return;
  }

  /* =========================
     REMOVE USER
  ========================= */

  const updatedUsers = users.filter(u => u.email !== cleanEmail);
  localStorage.setItem("ams_users", JSON.stringify(updatedUsers));

  /* =========================
     REMOVE FROM ALL SEATS
  ========================= */

  ["employee", "supervisor", "der"].forEach(type => {
    if (company.usedSeats?.[type]?.[cleanEmail]) {
      delete company.usedSeats[type][cleanEmail];
    }
  });

  localStorage.setItem("companyProfile", JSON.stringify(company));

  /* =========================
     REFRESH
  ========================= */

  location.reload();
};

/* =========================================================
   RENDER ACTIVE SEATS (FIXED)
========================================================= */

function renderSeatAssignments(company) {

  const list = document.getElementById("seatUserList");
  if (!list) return;

  list.innerHTML = "";

  const allSeats = company.usedSeats || {};

  let items = [];

  ["employee", "supervisor", "der"].forEach(type => {

    const users = allSeats[type] || {};

    Object.keys(users).forEach(email => {

  if (users[email].revoked) return;

  items.push(`
    <li>
      ${email} — <strong>${type.toUpperCase()}</strong>
    </li>
  `);

});

  });

  if (!items.length) {
    list.innerHTML = "<li style='opacity:.6;'>No active seats</li>";
    return;
  }

  list.innerHTML = items.join("");
}

/* =========================================================
   REVOKE SEAT (UNIVERSAL)
========================================================= */

window.revokeSeat = function (type, email) {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) {
    alert("Seat not found.");
    return;
  }

  if (!company.usedSeats[type]) {
    alert("Seat type not found.");
    return;
  }

  if (!company.usedSeats[type][email]) {
    alert("Seat not found.");
    return;
  }

  /* 🚫 BLOCK IF COMPLETED */

  let completed = false;

  if (type === "der") {
    completed = localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";
  }

  if (type === "supervisor") {
    completed = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";
  }

  if (type === "employee") {
    completed = localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true";
  }

  if (completed) {
    alert("Cannot revoke — training already completed");
    return;
  }

  /* ✅ REMOVE CORRECTLY */

  company.usedSeats[type][email] = {
  revoked: true,
  assignedAt: company.usedSeats[type][email]?.assignedAt || Date.now()
};

  localStorage.setItem("companyProfile", JSON.stringify(company));

  /* 🔥 RE-RENDER */

  renderSeatAssignments(company);
}

/* =========================================================
   BUY EMPLOYEE SEATS (5 PACK)
========================================================= */

function buyEmployeeSeats(qty = 5) {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.seats.employee) {
    company.seats.employee = { total: 0 };
  }

  company.seats.employee.total += qty;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert(`${qty} Employee seats purchased!`);

  location.reload();
}

/* =========================================================
   BUY SUPERVISOR SEAT
========================================================= */

function buySupervisorSeats(qty = 1) {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.seats.supervisor) {
    company.seats.supervisor = { total: 0 };
  }

  company.seats.supervisor.total += qty;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert(`${qty} Supervisor seat(s) purchased!`);

  location.reload();
}

function buyDerSeats(qty = 1) {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.seats.der) {
    company.seats.der = { total: 0 };
  }

  company.seats.der.total += qty;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert(`${qty} DER seat(s) purchased!`);

  location.reload();
}

/* =========================================================
   LOGOUT
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");
  window.location.href = "/ams-training-portal/frontend/pages/login.html";
}

/* =========================================================
   INVITE EMPLOYEE (REAL SYSTEM READY)
========================================================= */

function inviteEmployee() {

  const input = document.getElementById("inviteEmail");
  const msg = document.getElementById("inviteMsg");

  if (!input) return;

  const email = input.value.trim().toLowerCase();

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

  const exists = users.find(u => u.email === email);

  if (exists) {
    if (msg) msg.textContent = "User already registered. Assign a seat instead.";
    return;
  }
   
  /* =========================
     VALIDATION
  ========================= */

  if (!email || !email.includes("@")) {
    if (msg) msg.textContent = "Enter a valid email";
    return;
  }

  let company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.invites) company.invites = {};
  if (!company.usedSeats) company.usedSeats = {};
  if (!company.usedSeats.employee) company.usedSeats.employee = {};

  /* =========================
     BLOCK DUPLICATES
  ========================= */

  if (company.invites[email]) {
    if (msg) msg.textContent = "Already invited";
    return;
  }

  /* 🚫 Already has seat */
   
const hasActiveSeat =
  (company.usedSeats?.employee?.[email] && company.usedSeats.employee[email].revoked !== true) ||
  (company.usedSeats?.supervisor?.[email] && company.usedSeats.supervisor[email].revoked !== true) ||
  (company.usedSeats?.der?.[email] && company.usedSeats.der[email].revoked !== true);

if (hasActiveSeat) {
  msg.textContent = "User already assigned";
  return;
}

  /* =========================
     GENERATE INVITE CODE
  ========================= */

  const inviteCode =
    "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  company.invites[email] = {
    email,
    code: inviteCode,
    program: company.program || "unknown",
    role: "employee",
    createdAt: Date.now(),
    status: "pending"
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));

  /* =========================
     UI FEEDBACK
  ========================= */

  if (msg) msg.textContent = "Invite created: " + inviteCode;

  input.value = "";

}

function viewEmployeeCert(email) {

  email = email.toLowerCase().trim(); // 🔥 FIX

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) {
    alert("No company data found");
    return;
  }

  /* =========================
     🔒 SECURITY CHECK
  ========================= */

  const isAssigned =
  (company.usedSeats?.employee?.[email] && !company.usedSeats.employee[email].revoked) ||
  (company.usedSeats?.supervisor?.[email] && !company.usedSeats.supervisor[email].revoked) ||
  (company.usedSeats?.der?.[email] && !company.usedSeats.der[email].revoked);

  if (!isAssigned) {
    alert("Access denied: This employee is not assigned to your company.");
    return;
  }

  /* =========================
     LOAD CERT
  ========================= */

  const key = `amsCertificates_${email}`;
  const certs = JSON.parse(localStorage.getItem(key) || "[]");

  if (!certs.length) {
    alert("No certificate found for this employee");
    return;
  }

  const latestCert = certs[certs.length - 1];

  /* 🔥 FLAG ADMIN VIEW */
  sessionStorage.setItem("adminViewing", "true");

  /* ✅ REDIRECT */
  window.location.href =
    `fmcsa-certificates.html?id=${latestCert.id}&email=${email}`;
}

function toggleMenu(email) {

  const menu = document.getElementById(`menu-${email}`);
  if (!menu) return;

  const isOpen = menu.style.display === "block";

  // close all menus
  document.querySelectorAll(".action-menu").forEach(m => {
    m.style.display = "none";
  });

  // toggle current
  menu.style.display = isOpen ? "none" : "block";
}

function toggleSeatMenu() {
  const menu = document.getElementById("seatMenu");
  if (!menu) return;

  const isOpen = menu.style.display === "block";
  menu.style.display = isOpen ? "none" : "block";
}

/* =========================
   AUTO CLOSE SEAT MENU
========================= */

document.addEventListener("click", function (e) {

  const menu = document.getElementById("seatMenu");
  const button = document.querySelector("[onclick='toggleSeatMenu()']");

  if (!menu || !button) return;

  if (!menu.contains(e.target) && !button.contains(e.target)) {
    menu.style.display = "none";
  }

});

/* =========================
   AUTO CLOSE MANAGE MENUS
========================= */

document.addEventListener("click", function (e) {

  // ALL manage menus
  const menus = document.querySelectorAll(".action-menu");

  // ALL manage buttons
  const buttons = document.querySelectorAll("[onclick^='toggleMenu']");

  let clickedInsideMenu = false;

  menus.forEach(menu => {
    if (menu.contains(e.target)) {
      clickedInsideMenu = true;
    }
  });

  buttons.forEach(btn => {
    if (btn.contains(e.target)) {
      clickedInsideMenu = true;
    }
  });

  if (!clickedInsideMenu) {
    menus.forEach(menu => {
      menu.style.display = "none";
    });
  }

});

function resendInvite(email) {

   email = email.toLowerCase().trim();
   
  let company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.invites) company.invites = {};

  const existingInvite = company.invites[email];

  const msg = document.getElementById("inviteMsg");

  if (existingInvite) {
  if (msg) {
    msg.innerHTML = `
      Invite Code: <strong>${existingInvite.code}</strong>
      <button onclick="copyInvite('${existingInvite.code}')"
        style="margin-left:10px; padding:4px 8px; cursor:pointer;">
        Copy
      </button>
    `;
  }
  return;
}

  const newCode =
    "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  company.invites[email] = {
    email,
    code: newCode,
    program: company.program || "unknown",
    role: "employee",
    createdAt: Date.now(),
    status: "resent"
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));

  if (msg) {
  msg.innerHTML = `
    New Invite Code: <strong>${newCode}</strong>
    <button onclick="copyInvite('${newCode}')"
      style="margin-left:10px; padding:4px 8px; cursor:pointer;">
      Copy
    </button>
  `;
}
   
}

   /* =========================================================
   COPY INVITE CODE (GLOBAL)
========================================================= */
function copyInvite(code) {
  navigator.clipboard.writeText(code).then(() => {
    const msg = document.getElementById("inviteMsg");
    if (msg) {
      msg.innerHTML += " ✅ Copied!";
    }
  });
}
