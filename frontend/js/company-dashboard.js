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

  const used = Object.keys(
    company?.usedSeats?.employee || {}
  ).length;

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

function assignEmployeeSeat() {

  const email = document.getElementById("seatEmail").value.trim();
  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const total = company.seats?.employee?.total || 0;
  const used = Object.keys(company.usedSeats.employee || {}).length;

  if (used >= total) {
    return alert("No employee seats available");
  }

  if (company.usedSeats.employee[email]) {
    return alert("Employee already assigned");
  }

  company.usedSeats.employee[email] = {
  assignedAt: Date.now(),
  revoked: false
};

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("Employee seat assigned");

  location.reload();
}


/* =========================================================
   ASSIGN SUPERVISOR SEAT
========================================================= */

function assignSupervisorSeat() {

  const email = document.getElementById("seatEmail").value.trim();
  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const total = company.seats?.supervisor?.total || 0;
  const used = Object.keys(company.usedSeats.supervisor || {}).length;

  if (used >= total) {
    return alert("No supervisor seats available");
  }

  if (company.usedSeats.supervisor[email]) {
    return alert("Supervisor already assigned");
  }

  company.usedSeats.supervisor[email] = {
    assignedAt: Date.now()
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("Supervisor seat assigned");

  location.reload();
}

/* =========================================================
   ASSIGN DER SEAT
========================================================= */

function assignDerSeat() {

  const email = document.getElementById("seatEmail").value.trim();
  if (!email) return alert("Enter email");

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const total = company.seats?.der?.total || 0;
  const used = Object.keys(company.usedSeats.der || {}).length;

  if (used >= total) {
    return alert("No DER seats available");
  }

  if (company.usedSeats.der[email]) {
    return alert("DER already assigned");
  }

  company.usedSeats.der[email] = {
    assignedAt: Date.now()
  };

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

  if (!employees.length) {
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

  employees.forEach(emp => {

    const cleanEmail = emp.email.trim().toLowerCase(); // ✅ MUST BE FIRST

    console.log("EMP:", cleanEmail);

    /* =========================
       DETERMINE TRAINING TYPE
    ========================= */

    let trainingType = "None";

    if (company.usedSeats.supervisor && company.usedSeats.supervisor[cleanEmail]) {
      trainingType = "Supervisor";
    } 
    else if (company.usedSeats.der && company.usedSeats.der[cleanEmail]) { // ✅ FIXED )
      trainingType = "DER";
    } 
    else if (company.usedSeats.employee && company.usedSeats.employee[cleanEmail]) { // ✅ FIXED )
      trainingType = "Employee";
    }

    console.log("Training Type:", trainingType);

    const seatAssigned = trainingType !== "None";

/* =========================
   COMPLETION CHECK (FORCED FIX)
========================= */

let trainingCompleted = false;

const keys = Object.keys(localStorage);

console.log("ALL KEYS:", keys);

const matchKey = keys.find(k =>
  k.toLowerCase().includes(cleanEmail) &&
  k.toLowerCase().includes("completed")
);

console.log("MATCH KEY FOUND:", matchKey);

const val = matchKey ? localStorage.getItem(matchKey) : null;

console.log("MATCH VALUE:", val);

trainingCompleted = val === "true";

    /* =========================
       STATUS LABEL
    ========================= */

    let statusLabel = "Invited";

    if (seatAssigned && !trainingCompleted) {
      statusLabel = "In Progress";
    }

    if (seatAssigned && trainingCompleted) {
      statusLabel = "Completed";
    }

    /* =========================
       RENDER ROW
    ========================= */

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${emp.firstName || ""} ${emp.lastName || ""}</td>
      <td>${emp.email}</td>
      <td>Employee</td>
      <td>${trainingType}</td>
      <td>${statusLabel}</td>
      <td>
        ${
          seatAssigned
            ? `<button class="btn-secondary"
                 onclick="revokeSeat('${trainingType.toLowerCase()}', '${cleanEmail}')">
                 Revoke
               </button>`
            : `
              <button class="btn-primary"
                onclick="assignEmployeeSeat('${cleanEmail}')">
                Assign Employee
              </button>

              <button class="btn-primary"
                onclick="assignSupervisorSeat('${cleanEmail}')">
                Assign Supervisor
              </button>

              <button class="btn-primary"
                onclick="assignDerSeat('${cleanEmail}')">
                Assign DER
              </button>
            `
        }

        <button class="btn-secondary"
          onclick="removeEmployee('${cleanEmail}')">
          Remove
        </button>
      </td>
    `;

    tbody.appendChild(tr);

  }); // ✅ LOOP CLOSED PROPERLY
}
/* =========================================================
   REMOVE EMPLOYEE
========================================================= */

window.removeEmployee = function (email) {

  if (!confirm("Remove this employee from the company?")) return;

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const program = getCompanyProgram();

  const completedKey =
    program === "FMCSA"
      ? `fmcsaEmployeeCompleted_${email}`
      : `employeeTrainingCompleted_${email}`;

  const trainingCompleted =
    localStorage.getItem(completedKey) === "true";

  const updatedUsers = users.filter(u => u.email !== email);
  localStorage.setItem("ams_users", JSON.stringify(updatedUsers));

  if (company.usedSeats?.employee?.[email] && !trainingCompleted) {
    delete company.usedSeats.employee[email];
  }

  localStorage.setItem("companyProfile", JSON.stringify(company));

  const user = JSON.parse(localStorage.getItem("amsUser"));
  if (user) loadCompanyDashboard(user);
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

      items.push(`
        <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          
          <span>
            ${email} — <strong>${type.toUpperCase()}</strong>
          </span>

          <button 
            class="btn-danger"
            onclick="revokeSeat('${type}', '${email}')"
          >
            Revoke
          </button>

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
   BUY SUPERVISOR SEAT
========================================================= */
function buySupervisorSeats() {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.seats.supervisor) {
    company.seats.supervisor = { total: 0 };
  }

  company.seats.supervisor.total += 1;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("Supervisor seat purchased!");

  location.reload();
}


function buyDerSeats() {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.seats.der) {
    company.seats.der = { total: 0 };
  }

  company.seats.der.total += 1;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("DER seat purchased!");

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
  if (company.usedSeats.employee[email]) {
    if (msg) msg.textContent = "User already assigned";
    return;
  }

  /* =========================
     GENERATE INVITE CODE
  ========================= */

  const inviteCode =
    "AMS-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  /* =========================
     STORE INVITE
  ========================= */

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

  /* =========================
     DEBUG (VERY IMPORTANT)
  ========================= */

  console.log("Invite Created:", inviteCode);
  console.log("All Invites:", company.invites);
}
