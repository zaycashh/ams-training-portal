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
   LOGIN HANDLER (FINAL – ROLE SAFE & SEAT SAFE)
========================================================= */

// Example mock data (keep or replace later with API)
const COMPANY_EMPLOYEES = [
  {
    email: "employee1@abc.com",
    password: "AMS!Dev2026",
    companyId: "abc-company"
  }
];

const COMPANY_OWNERS = [
  {
    email: "owner@abc.com",
    password: "AMS!Dev2026",
    companyId: "abc-company"
  }
];

document
  .getElementById("loginForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    /* =========================================================
       COMPANY EMPLOYEE LOGIN
       (Consumes company seats)
    ========================================================= */
    const employee = COMPANY_EMPLOYEES.find(
      u => u.email === email && u.password === password
    );

    if (employee) {
      localStorage.setItem(
        "amsUser",
        JSON.stringify({
          id: "emp-" + Date.now(),
          email,
          role: "employee",              // ✅ MUST be employee
          companyId: employee.companyId, // ✅ REQUIRED
          employeeSeatLocked: false
        })
      );

      window.location.replace("dashboard.html");
      return; // 🔥 CRITICAL — prevents overwrite
    }

    /* =========================================================
       COMPANY OWNER LOGIN
       (Manages seats, does NOT consume)
    ========================================================= */
    const owner = COMPANY_OWNERS.find(
      u => u.email === email && u.password === password
    );

    if (owner) {
      localStorage.setItem(
        "amsUser",
        JSON.stringify({
          id: "owner-" + Date.now(),
          email,
          role: "owner",
          companyId: owner.companyId
        })
      );

      window.location.replace("dashboard.html");
      return;
    }

    /* =========================================================
       INDIVIDUAL CLIENT (B2C)
       (No company, no seats)
    ========================================================= */
    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        id: "ind-" + Date.now(),
        email,
        role: "individual",
        companyId: null
      })
    );

    window.location.replace("dashboard.html");
  });
