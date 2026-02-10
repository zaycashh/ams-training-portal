/* =========================================================
   LOGIN FLOW — FINAL (ADMIN / EMPLOYEE / INDIVIDUAL)
========================================================= */

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value
    .trim()
    .toLowerCase();

  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // 🔐 TEMP DEV PASSWORD
  const DEV_PASSWORD = "AMS!Dev2026";
  if (password !== DEV_PASSWORD) {
    alert("Invalid email or password");
    return;
  }

  // Clear previous session
  localStorage.removeItem("amsUser");

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  const users = JSON.parse(
    localStorage.getItem("ams_users") || "[]"
  );

  /* =========================================================
     COMPANY ADMIN (SOURCE = companyProfile)
  ========================================================= */
  if (
    company &&
    company.adminEmail &&
    email === company.adminEmail.toLowerCase()
  ) {
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
     COMPANY EMPLOYEE (SEAT USER)
  ========================================================= */
  const employee = users.find(
    u =>
      u.email.toLowerCase() === email &&
      u.role === "employee"
  );

  if (employee) {
    if (!employee.acceptedAt) {
      employee.acceptedAt = new Date().toISOString();
      localStorage.setItem("ams_users", JSON.stringify(users));
    }

    localStorage.setItem(
  "amsUser",
  JSON.stringify({
    id: employee.id || "emp-" + Date.now(),
    email: email,
    role: "employee",
    companyId: employee.companyId,
    employeeSeatLocked: false
  })
);
    window.location.replace("dashboard.html");
    return;
  }

  /* =========================================================
     INDIVIDUAL CLIENT (B2C)
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
