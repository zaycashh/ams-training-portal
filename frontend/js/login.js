/* =========================================================
   LOGIN FLOW — ENTERPRISE ROLE BASED (OWNER / ADMIN / EMPLOYEE / INDIVIDUAL)
========================================================= */

const DEV_PASSWORD = "AMS!Dev2026";

/* =========================================================
   MOCK COMPANY USERS (DEV ONLY)
========================================================= */

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

/* =========================================================
   LOGIN SUBMIT
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

  if (password !== DEV_PASSWORD) {
    alert("Invalid email or password");
    return;
  }

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  /* =========================================================
     COMPANY OWNER / ADMIN LOGIN
  ========================================================= */

  // If matches companyProfile admin email
  if (
    company &&
    company.adminEmail &&
    email === company.adminEmail.toLowerCase()
  ) {
    const user = {
      id: "owner-" + email,
      email,
      role: "owner",
      companyId: company.id
    };

    localStorage.setItem("amsUser", JSON.stringify(user));
    redirectByRole(user);
    return;
  }

  // Fallback mock owner list
  const owner = COMPANY_OWNERS.find(
    u => u.email === email && u.password === password
  );

  if (owner) {
    const user = {
      id: "owner-" + email,
      email,
      role: "owner",
      companyId: owner.companyId
    };

    localStorage.setItem("amsUser", JSON.stringify(user));
    redirectByRole(user);
    return;
  }
  /* =========================================================
     COMPANY EMPLOYEE LOGIN
  ========================================================= */

  const employee = COMPANY_EMPLOYEES.find(
    u => u.email === email && u.password === password
  );

  if (employee) {
    const user = {
      id: "emp-" + email,
      email,
      role: "employee",
      companyId: employee.companyId
    };

    localStorage.setItem("amsUser", JSON.stringify(user));
    redirectByRole(user);
    return;
  }

/* =========================================================
   INDIVIDUAL CLIENT (B2C)
========================================================= */

// Retrieve stored registration record
const registeredUser =
  JSON.parse(localStorage.getItem("registeredUser_" + email)) || null;

if (!registeredUser) {
  alert("Account not found. Please register first.");
  return;
}

// Restore full profile into active session
localStorage.setItem("amsUser", JSON.stringify(registeredUser));
redirectByRole(registeredUser);
   
});
   
/* =========================================================
   ENTERPRISE ROLE REDIRECT
========================================================= */

function redirectByRole(user) {

  switch (user.role) {

    case "owner":
    case "company_admin":
      window.location.replace("company-dashboard.html");
      break;

    case "der":
      window.location.replace("der-training.html");
      break;

    case "supervisor":
      window.location.replace("supervisor-training.html");
      break;

    case "employee":
      window.location.replace("dashboard.html");
      break;

    case "individual":
    default:
      window.location.replace("dashboard.html");
      break;
  }
}
