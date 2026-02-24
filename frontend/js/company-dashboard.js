/* =========================================================
   COMPANY ADMIN DASHBOARD — STABLE VERSION
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

  // Company overview
  document.getElementById("companyName").textContent =
    company.name || user.company || "—";

  document.getElementById("companyAdmin").textContent =
    company.adminEmail || user.email || "—";

  document.getElementById("companyModules").textContent =
    (company.modules && company.modules.length)
      ? company.modules.join(", ")
      : "—";

  loadEmployees(company.id);

  updateSeatCounts(company);
  renderSeatAssignments(company);
}


/* =========================================================
   DERIVED SEAT SYSTEM
========================================================= */
function getSeatStats(company) {
  const total = company?.seats?.employee?.total ?? 0;
  const used = company?.seats?.employee?.used ?? 0;
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

  const tbody = document.getElementById("employeeTable");
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
    const tr = document.createElement("tr");

    const key = emp.email;
    const seatAssigned = company.usedSeats && company.usedSeats[key];

    tr.innerHTML = `
      <td>${emp.name || "—"}</td>
      <td>${emp.email}</td>
      <td>Employee</td>
      <td>
        ${
          seatAssigned
            ? "Seat Assigned"
            : emp.completed
              ? "Completed"
              : emp.acceptedAt
                ? "In Progress"
                : "Invited"
        }
      </td>
      <td>
        ${
          seatAssigned
            ? `<button class="btn-secondary" onclick="revokeSeat('${key}')">
                Revoke Seat
               </button>`
            : ""
        }
        <button class="btn-secondary" onclick="removeEmployee('${emp.email}')">
          Remove
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}


/* =========================================================
   REVOKE SEAT
========================================================= */

function revokeSeat(userKey) {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats || !company.usedSeats[userKey]) {
    alert("Seat not found.");
    return;
  }

  if (!confirm("Revoke this seat?")) return;

  delete company.usedSeats[userKey];

if (company.seats?.employee?.used > 0) {
  company.seats.employee.used -= 1;
}
  localStorage.setItem("companyProfile", JSON.stringify(company));

  alert("Seat revoked successfully.");

  const user = JSON.parse(localStorage.getItem("amsUser"));
  loadCompanyDashboard(user);
}


/* =========================================================
   RENDER ACTIVE SEAT ASSIGNMENTS
========================================================= */
function renderSeatAssignments(company) {
  const list = document.getElementById("seatUserList");
  if (!list) return;

  list.innerHTML = "";

  const usedSeats = company.usedSeats || {};
  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

  const employeeKeys = Object.keys(usedSeats);

  if (!employeeKeys.length) {
    list.innerHTML =
      "<li style='opacity:.6;'>No active seat assignments</li>";
    return;
  }

  employeeKeys.forEach(key => {
    const email = key;

    const li = document.createElement("li");

    li.innerHTML = `
      ${email}
      <button class="btn-secondary"
              style="margin-left:10px;"
              onclick="revokeSeat('${key}')">
        Revoke
      </button>
    `;

    list.appendChild(li);
  });
}

/* =========================================================
   BUY 5 MORE SEATS (STACKING)
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const buyBtn = document.getElementById("buySeatsBtn");
  if (!buyBtn) return;

  buyBtn.addEventListener("click", () => {
    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "{}"
    );

    if (!company.seats) company.seats = {};
    if (!company.seats.employee) {
      company.seats.employee = { total: 0, used: 0 };
    }

    // Add 5 seats per purchase
    company.seats.employee.total += 5;

    localStorage.setItem("companyProfile", JSON.stringify(company));

    alert("5 seats added successfully.");

    const user = JSON.parse(localStorage.getItem("amsUser"));
    loadCompanyDashboard(user);
  });
});
/* =========================================================
   INVITE EMPLOYEE (SEAT-AWARE)
========================================================= */

function inviteEmployee() {

  const emailInput = document.getElementById("inviteEmail");
  const msg = document.getElementById("inviteMsg");

  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    msg.textContent = "Please enter an employee email.";
    msg.style.color = "red";
    return;
  }

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  if (!company) {
    msg.textContent = "Company profile not found.";
    msg.style.color = "red";
    return;
  }

  const totalSeats = company.seats?.employee?.total ?? 0;
  const usedSeats = company.seats?.employee?.used ?? 0;

  if (usedSeats >= totalSeats) {
    msg.textContent = "No seats available. Please purchase more seats.";
    msg.style.color = "red";
    return;
  }

  company.invites = company.invites || {};

  // Prevent duplicate invite
  if (company.invites[email]) {
    msg.textContent = `Invite already exists. Code: ${company.invites[email].code}`;
    msg.style.color = "#b8860b";
    return;
  }

  // Generate secure 6-character code
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
}
/* =========================================================
   LOGOUT
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");

  // Always send back to login page safely
  window.location.href = "/ams-training-portal/frontend/pages/login.html";
}
