/* =========================================================
   COMPANY ADMIN DASHBOARD — PHASE 2 (REPLACEMENT)
========================================================= */

// 🔐 AUTH GUARD (STANDARDIZED)
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(
    localStorage.getItem("amsUser") || "null"
  );

  if (!user || user.role !== "company_admin") {
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

  // Employees + seats
  loadEmployees(company.id);
  
   updateSeatCounts(company);
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

  delete company.usedSeats[userId];
  company.seats.employee += 1;

  localStorage.setItem(
    "companyProfile",
    JSON.stringify(company)
  );

  alert("Seat revoked successfully.");

  location.reload();
}

/* =========================================================
   SEAT COUNTS
========================================================= */
function updateSeatCounts(company) {

  if (!company?.seats?.employee) {
    document.getElementById("seatsTotal").textContent = 0;
    document.getElementById("seatsUsed").textContent = 0;
    document.getElementById("seatsAvailable").textContent = 0;
    return;
  }

  const total = company.seats.employee.total || 0;
  const used = company.seats.employee.used || 0;
  const available = Math.max(total - used, 0);

  document.getElementById("seatsTotal").textContent = total;
  document.getElementById("seatsUsed").textContent = used;
  document.getElementById("seatsAvailable").textContent = available;
}
/* =========================================================
   LOGOUT
========================================================= */
function logout() {
  localStorage.removeItem("amsUser");
  window.location.href = "../index.html";
}
