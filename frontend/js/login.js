/* =========================================================
   LOGIN FLOW — FINAL (COMPANY ADMIN FIXED)
========================================================= */

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // 🔐 DEV PASSWORD
  const DEV_PASSWORD = "AMS!Dev2026";
  if (password !== DEV_PASSWORD) {
    alert("Invalid email or password");
    return;
  }

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  const users = JSON.parse(
    localStorage.getItem("ams_users") || "[]"
  );

  /* =========================================================
     1️⃣ COMPANY ADMIN (SOURCE OF TRUTH)
  ========================================================= */
  if (company && email === company.adminEmail) {
    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        email,
        role: "company_admin",
        companyId: company.id
      })
    );

    window.location.replace("company-dashboard.html");
    return;
  }

  /* =========================================================
     2️⃣ COMPANY EMPLOYEE
  ========================================================= */
  const employee = users.find(
    u => u.email === email && u.role === "employee"
  );

  if (employee) {
    if (!employee.acceptedAt) {
      employee.acceptedAt = new Date().toISOString();
      localStorage.setItem("ams_users", JSON.stringify(users));
    }

    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        email,
        role: "employee",
        companyId: employee.companyId
      })
    );

    window.location.replace("dashboard.html");
    return;
  }

  /* =========================================================
     3️⃣ INDIVIDUAL CLIENT
  ========================================================= */
  localStorage.setItem(
    "amsUser",
    JSON.stringify({
      email,
      role: "individual",
      companyId: null
    })
  );

  window.location.replace("dashboard.html");
});
