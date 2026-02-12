/* =========================================================
   LOGIN FLOW — FINAL (ADMIN / EMPLOYEE / OWNER / INDIVIDUAL)
========================================================= */

const DEV_PASSWORD = "AMS!Dev2026";

const COMPANY_EMPLOYEES = [
  {
    email: "employee1@abc.com",
    password: DEV_PASSWORD,
    companyId: "abc-company"
  }
];

const COMPANY_OWNERS = [
  {
    email: "owner@abc.com",
    password: DEV_PASSWORD,
    companyId: "abc-company"
  }
];

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

  if (password !== DEV_PASSWORD) {
    alert("Invalid email or password");
    return;
  }

  localStorage.removeItem("amsUser");

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  /* =========================================================
     COMPANY ADMIN LOGIN
  ========================================================= */
  if (
    company &&
    company.adminEmail &&
    email === company.adminEmail.toLowerCase()
  ) {
    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        id: "owner-" + email,
        email,
        role: "owner",
        companyId: company.id
      })
    );

    window.location.replace("company-dashboard.html");
    return;
  }

  /* =========================================================
     COMPANY EMPLOYEE LOGIN
  ========================================================= */
  const employee = COMPANY_EMPLOYEES.find(
    u => u.email === email && u.password === password
  );

  if (employee) {
    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        id: "emp-" + email,
        email,
        role: "employee",
        companyId: employee.companyId
      })
    );

    window.location.replace("dashboard.html");
    return;
  }

  /* =========================================================
     COMPANY OWNER LOGIN (Mock)
  ========================================================= */
  const owner = COMPANY_OWNERS.find(
    u => u.email === email && u.password === password
  );

  if (owner) {
    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        id: "owner-" + email,
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
  ========================================================= */
  localStorage.setItem(
    "amsUser",
    JSON.stringify({
      id: "ind-" + email,
      email,
      role: "individual",
      companyId: null
    })
  );

  window.location.replace("dashboard.html");
});
