/* =========================================================
   COMPANY ADMIN DASHBOARD — PHASE 1
========================================================= */

// 🚫 HARD BLOCK NON-ADMINS
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("companyAdmin") !== "true") {
    alert("Unauthorized access");
    window.location.href = "../index.html";
    return;
  }

  loadCompanyDashboard();
});

function loadCompanyDashboard() {
  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "{}"
  );

  // Fallback safety
  if (!company.id) {
    alert("Company profile missing");
    return;
  }

  // Populate company info
  document.getElementById("companyName").textContent =
    company.name || "—";

  document.getElementById("companyAdmin").textContent =
    company.adminEmail || "—";

  document.getElementById("companyModules").textContent =
    (company.modules || []).join(", ") || "—";

  // Seats
  const seatsTotal = company.seatsTotal || 0;
  const seatsUsed = company.seatsUsed || 0;

  document.getElementById("seatsTotal").textContent = seatsTotal;
  document.getElementById("seatsUsed").textContent = seatsUsed;
  document.getElementById("seatsAvailable").textContent =
    seatsTotal - seatsUsed;
}

function logout() {
  localStorage.removeItem("companyAdmin");
  window.location.href = "../index.html";
}
