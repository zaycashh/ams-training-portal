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
  updateSeatCounts(company.id, company.seatsTotal || 0);
}

/* =========================================================
   LOAD EMPLOYEES
========================================================= */
function loadEmployees(companyId) {
  const users = JSON.parse(
    localStorage.getItem("ams_users") || "[]"
  );

  const tbody = document.getElementById("employeeTable");
  tbody.innerHTML = "";

  const employees = users.filter(
    u => u.companyId === companyId && u.role === "employee"
  );

  if (!employees.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="opacity:.6;">No employees yet</td>
      </tr>
    `;
    return;
  }

  employees.forEach(emp => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${emp.name || "—"}</td>
      <td>${emp.email}</td>
      <td>${emp.role}</td>
      <td>${emp.completed ? "Completed" : "In Progress"}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================================================
   SEAT COUNTS
========================================================= */
function updateSeatCounts(companyId, seatsTotal) {
  const users = JSON.parse(
    localStorage.getItem("ams_users") || "[]"
  );

  const seatsUsed = users.filter(
    u => u.companyId === companyId && u.role === "employee"
  ).length;

  document.getElementById("seatsTotal").textContent = seatsTotal;
  document.getElementById("seatsUsed").textContent = seatsUsed;
  document.getElementById("seatsAvailable").textContent =
    Math.max(seatsTotal - seatsUsed, 0);
}

/* =========================================================
   LOGOUT
========================================================= */
function logout() {
  localStorage.removeItem("amsUser");
  window.location.href = "../index.html";
}
