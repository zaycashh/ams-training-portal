/* =========================================================
   COMPANY ADMIN DASHBOARD — STABLE VERSION
========================================================= */

// 🔐 AUTH GUARD
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

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

    const key = "emp-" + emp.email;
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
  const keys = Object.keys(usedSeats);

  if (!keys.length) {
    list.innerHTML = "<li style='opacity:.6;'>No active seat assignments</li>";
    return;
  }

  keys.forEach(key => {
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
