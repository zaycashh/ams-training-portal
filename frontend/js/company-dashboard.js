/* =========================================================
   COMPANY ADMIN DASHBOARD — DRIFT-PROOF VERSION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  loadCompanyDashboard(user);
});

/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadCompanyDashboard(user) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

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
   DERIVED SEAT SYSTEM (SOURCE OF TRUTH = usedSeats)
========================================================= */

function getSeatStats(company) {

  const total = company?.seats?.employee?.total ?? 0;

  // ✅ ONLY SOURCE OF TRUTH
  const used = Object.keys(company?.usedSeats || {}).length;

  const remaining = total - used;

  return {
    totalPurchased: total,
    usedSeats: used,
    remaining: remaining < 0 ? 0 : remaining
  };
}

function updateSeatCounts(company) {
  const stats = getSeatStats(company);

  document.getElementById("seatTotal").textContent = stats.totalPurchased;
  document.getElementById("seatUsed").textContent = stats.usedSeats;
  document.getElementById("seatRemaining").textContent = stats.remaining;
}
/* =========================================================
   LOAD EMPLOYEES
========================================================= */

function loadEmployees(companyId) {

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) company.usedSeats = {};

  const tbody = document.getElementById("employeeTable");
  if (!tbody) return;

  tbody.innerHTML = "";

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

    const seatAssigned = !!company.usedSeats[emp.email];

    // 🔵 Per-employee completion tracking
    const completedKey = `employeeTrainingCompleted_${emp.email}`;
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
                 onclick="assignSeat('${emp.email}')">
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
   ASSIGN SEAT
========================================================= */

window.assignSeat = function (email) {

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  if (!company.usedSeats) company.usedSeats = {};

  if (company.usedSeats[email]) {
    alert("Seat already assigned.");
    return;
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = Object.keys(company.usedSeats).length;
  const remaining = total - used;

  if (remaining <= 0) {
    alert("No seats available.");
    return;
  }

  if (!confirm("Assign seat to this employee?")) return;

  company.usedSeats[email] = {
    assignedAt: Date.now()
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));

  const user = JSON.parse(localStorage.getItem("amsUser"));
  if (user) loadCompanyDashboard(user);
};


/* =========================================================
   REVOKE SEAT
========================================================= */

window.revokeSeat = function (email) {

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats || !company.usedSeats[email]) {
    alert("Seat not found.");
    return;
  }

  if (!confirm("Revoke this seat?")) return;

  delete company.usedSeats[email];

  localStorage.setItem("companyProfile", JSON.stringify(company));

  const user = JSON.parse(localStorage.getItem("amsUser"));
  if (user) loadCompanyDashboard(user);
};


/* =========================================================
   REMOVE EMPLOYEE
========================================================= */

window.removeEmployee = function (email) {

  if (!confirm("Remove this employee from the company?")) return;

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const updatedUsers = users.filter(u => u.email !== email);
  localStorage.setItem("ams_users", JSON.stringify(updatedUsers));

  if (company.usedSeats && company.usedSeats[email]) {
    delete company.usedSeats[email];
    localStorage.setItem("companyProfile", JSON.stringify(company));
  }

  const user = JSON.parse(localStorage.getItem("amsUser"));
  if (user) loadCompanyDashboard(user);
};


/* =========================================================
   RENDER ACTIVE SEAT ASSIGNMENTS
========================================================= */

function renderSeatAssignments(company) {

  const list = document.getElementById("seatUserList");
  if (!list) return;

  list.innerHTML = "";

  const usedSeats = company.usedSeats || {};
  const employeeKeys = Object.keys(usedSeats);

  if (!employeeKeys.length) {
    list.innerHTML =
      "<li style='opacity:.6;'>No active seat assignments</li>";
    return;
  }

  employeeKeys.forEach(email => {

    const li = document.createElement("li");

    li.innerHTML = `
      ${email}
      <button class="btn-secondary"
              style="margin-left:10px;"
              onclick="revokeSeat('${email}')">
        Revoke
      </button>
    `;

    list.appendChild(li);
  });
}


/* =========================================================
   BUY 5 MORE SEATS (STACK SAFE)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const buyBtn = document.getElementById("buySeatsBtn");
  if (!buyBtn) return;

  buyBtn.addEventListener("click", () => {

    const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

    if (!company.seats) company.seats = {};
    if (!company.seats.employee) {
      company.seats.employee = { total: 0 };
    }

    company.seats.employee.total += 5;

    localStorage.setItem("companyProfile", JSON.stringify(company));

    const user = JSON.parse(localStorage.getItem("amsUser"));
    if (user) loadCompanyDashboard(user);
  });
});


/* =========================================================
   INVITE EMPLOYEE
========================================================= */

window.inviteEmployee = function () {

  const emailInput = document.getElementById("inviteEmail");
  const msg = document.getElementById("inviteMsg");

  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    msg.textContent = "Please enter an employee email.";
    msg.style.color = "red";
    return;
  }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!company) {
    msg.textContent = "Company profile not found.";
    msg.style.color = "red";
    return;
  }

  const totalSeats = company.seats?.employee?.total ?? 0;
  const usedSeats = Object.keys(company.usedSeats || {}).length;

  if (usedSeats >= totalSeats) {
    msg.textContent = "No seats available. Please purchase more seats.";
    msg.style.color = "red";
    return;
  }

  company.invites = company.invites || {};

  if (company.invites[email]) {
    msg.textContent = `Invite already exists. Code: ${company.invites[email].code}`;
    msg.style.color = "#b8860b";
    return;
  }

  const inviteCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  company.invites[email] = {
    code: inviteCode,
    createdAt: Date.now()
  };

  localStorage.setItem("companyProfile", JSON.stringify(company));

  msg.textContent = `Invite created. Code: ${inviteCode}`;
  msg.style.color = "green";

  emailInput.value = "";
};


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");
  window.location.href = "/ams-training-portal/frontend/pages/login.html";
}
