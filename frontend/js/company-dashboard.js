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

if (!company.seats) {
  company.seats = {};
  updated = true;
}

// 🔥 FORCE ALL SEAT TYPES
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

// 🔥 USED SEATS
if (!company.usedSeats) {
  company.usedSeats = {};
  updated = true;
}

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

// 🔥 SAVE FIX
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

  // EMPLOYEE
  const empTotal = company?.seats?.employee?.total || 0;
  const empUsed = Object.keys(company?.usedSeats?.employee || {}).length;

  // SUPERVISOR
  const supTotal = company?.seats?.supervisor?.total || 0;
  const supUsed = Object.keys(company?.usedSeats?.supervisor || {}).length;

  // DER
  const derTotal = company?.seats?.der?.total || 0;
  const derUsed = Object.keys(company?.usedSeats?.der || {}).length;

  // UPDATE UI
  const seatTotal = document.getElementById("seatTotal");
  const seatUsed = document.getElementById("seatUsed");
  const seatRemaining = document.getElementById("seatRemaining");

  if (seatTotal) seatTotal.textContent = empTotal;
  if (seatUsed) seatUsed.textContent = empUsed;
  if (seatRemaining) seatRemaining.textContent = empTotal - empUsed;

  const supTotalEl = document.getElementById("supervisorTotal");
  const supUsedEl = document.getElementById("supervisorUsed");

  if (supTotalEl) supTotalEl.textContent = supTotal;
  if (supUsedEl) supUsedEl.textContent = supUsed;

  const derTotalEl = document.getElementById("derTotal");
  const derUsedEl = document.getElementById("derUsed");

  if (derTotalEl) derTotalEl.textContent = derTotal;
  if (derUsedEl) derUsedEl.textContent = derUsed;
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
    assignedAt: Date.now()
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
   LOAD EMPLOYEES (PROGRAM-AWARE)
========================================================= */

function loadEmployees(companyId) {

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) company.usedSeats = {};

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
        <td colspan="5" style="opacity:.6;">No employees yet</td>
      </tr>
    `;
    return;
  }

  employees.forEach(emp => {

    const seatAssigned = !!company.usedSeats.employee?.[emp.email];

    /* 🔥 PROGRAM-AWARE COMPLETION */
    const completedKey =
      program === "FMCSA"
        ? `fmcsaEmployeeCompleted_${emp.email}`
        : `employeeTrainingCompleted_${emp.email}`;

    const trainingCompleted =
      localStorage.getItem(completedKey) === "true";

    let statusLabel = "Invited";

    if (seatAssigned && !trainingCompleted) {
      statusLabel = "In Progress";
    }

    if (seatAssigned && trainingCompleted) {
      statusLabel = "Completed";
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${emp.firstName || ""} ${emp.lastName || ""}</td>
      <td>${emp.email}</td>
      <td>Employee</td>
      <td>${statusLabel}</td>
      <td>
        ${
          seatAssigned
            ? `<button class="btn-secondary"
                 onclick="revokeSeat('${emp.email}')">
                 Revoke Seat
               </button>`
            : `<button class="btn-primary"
                 onclick="assignEmployeeSeat('${emp.email}')">
                 Assign Seat
               </button>`
        }
        <button class="btn-secondary"
          onclick="removeEmployee('${emp.email}')">
          Remove
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
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
   REVOKE SEAT
========================================================= */

window.revokeSeat = function (email) {

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats?.employee?.[email]) {
    alert("Seat not found.");
    return;
  }

  const program = getCompanyProgram();

  const completedKey =
    program === "FMCSA"
      ? `fmcsaEmployeeCompleted_${email}`
      : `employeeTrainingCompleted_${email}`;

  const trainingCompleted =
    localStorage.getItem(completedKey) === "true";

  if (trainingCompleted) {
    alert("Seat cannot be revoked. Training completed.");
    return;
  }

  if (!confirm("Revoke this seat?")) return;

  delete company.usedSeats.employee[email];

  localStorage.setItem("companyProfile", JSON.stringify(company));

  const user = JSON.parse(localStorage.getItem("amsUser"));
  if (user) loadCompanyDashboard(user);
};

/* =========================================================
   RENDER ACTIVE SEATS
========================================================= */

function renderSeatAssignments(company) {

  const list = document.getElementById("seatUserList");
  if (!list) return;

  list.innerHTML = "";

  const usedSeats = company.usedSeats.employee || {};
  const emails = Object.keys(usedSeats);

  if (!emails.length) {
    list.innerHTML = "<li style='opacity:.6;'>No active seats</li>";
    return;
  }

  emails.forEach(email => {
    const li = document.createElement("li");
    li.textContent = email;
    list.appendChild(li);
  });
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
   INVITE EMPLOYEE (SIMPLE SYSTEM)
========================================================= */

function inviteEmployee() {

  const input = document.getElementById("inviteEmail");
  const msg = document.getElementById("inviteMsg");

  if (!input) return;

  const email = input.value.trim().toLowerCase();

  if (!email) {
    if (msg) msg.textContent = "Enter a valid email";
    return;
  }

  let company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.invites) {
    company.invites = {};
  }

  // 🚫 prevent duplicate invite
  if (company.invites[email]) {
    if (msg) msg.textContent = "Already invited";
    return;
  }

  company.invites[email] = {
    email,
    createdAt: Date.now()
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));

  if (msg) msg.textContent = "Invite saved (demo mode)";

  input.value = "";

  console.log("Invites:", company.invites);
}
