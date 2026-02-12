/* =========================================================
   COMPANY ADMIN DASHBOARD — PHASE 2 (REPLACEMENT)
========================================================= */

// 🔐 AUTH GUARD (STANDARDIZED)
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(
    localStorage.getItem("amsUser") || "null"
  );

  if (!user || (user.role !== "company_admin" && user.role !== "owner")) {
    alert("Unauthorized access");
    window.location.href = "../index.html";
    return;
  }

  loadCompanyDashboard(user);
});

/* =========================================================
   LOAD DASHBOARD
========================================================= */

function loadCompanyDashboard(user) {
  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "{}"
  );

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

  // Load employees
  loadEmployees(company.id);

  // Seat counts + assignments
  updateSeatCounts(company);
  renderSeatAssignments(company);
}

/* =========================================================
   SEAT STATS (DERIVED SYSTEM)
========================================================= */

function getSeatStats(company) {
  const totalPurchased = company.totalSeats?.employee || 0;

  const usedSeats = company.usedSeats
    ? Object.keys(company.usedSeats).length
    : 0;

  const remaining = totalPurchased - usedSeats;

  return {
    totalPurchased,
    usedSeats,
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
  const users = JSON.parse(
    localStorage.getItem("ams_users") || "[]"
  );

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "{}"
  );

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

    const seatAssigned =
      company.usedSeats &&
      company.usedSeats["emp-" + emp.email];

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
            ? `<button class="btn-secondary" onclick="revokeSeat('emp-${emp.email}')">
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

function revokeSeat(userId) {
  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "{}"
  );

  if (!company.usedSeats || !company.usedSeats[userId]) {
    alert("Seat not found.");
    return;
  }

  if (!confirm("Revoke this seat?")) return;

  delete company.usedSeats[userId];

  localStorage.setItem(
    "companyProfile",
    JSON.stringify(company)
  );

  alert("Seat revoked successfully.");

  loadCompanyDashboard(JSON.parse(localStorage.getItem("amsUser")));
}

function renderSeatAssignments(company) {

  const list = document.getElementById("seatUserList");
  if (!list) return;

  list.innerHTML = "";

  const usedSeats = company.usedSeats || {};

  if (!Object.keys(usedSeats).length) {
    list.innerHTML = "<li style='opacity:.6;'>No active seat assignments</li>";
    return;
  }

  Object.keys(usedSeats).forEach(key => {

    const email = key.replace("emp-", "");

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
   LOGOUT
========================================================= */
function logout() {
  localStorage.removeItem("amsUser");
  window.location.href = "../index.html";
}
