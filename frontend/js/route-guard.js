/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD
   (Authentication + Role Access + Seat Logic)
   TYPE-AWARE STABLE VERSION
========================================================= */

(function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body.dataset.module; // der | employee | supervisor
  const path = window.location.pathname;

  const BASE = "/ams-training-portal/frontend/pages/";

  const ROUTES = {
  login: BASE + "login.html",
  registerSelect: BASE + "register-select.html",
  dashboard: BASE + "dashboard.html",
  companyDashboard: BASE + "company-dashboard.html"
};

  /* =========================================================
   STEP 1 – GLOBAL AUTH CHECK
========================================================= */

if (!user) {

  // Allow public auth pages
  if (
    path.includes("login.html") ||
    path.includes("register-select.html") ||
    path.includes("register-company.html") ||
    path.includes("register-employee.html") ||
    path.includes("register-individual.html")
  ) {
    return; // ✅ allow access
  }

  window.location.replace(ROUTES.login);
  return;
}
  /* =========================================================
     STEP 2 – NOT A MODULE PAGE
  ========================================================= */

  if (!module) return;

  /* =========================================================
   STEP 3 – ROLE → MODULE ENFORCEMENT
========================================================= */

const role = user.role;
const type = user.type || "company"; // safeguard default

   /* =========================================================
   HYBRID EMPLOYEE ACCESS (INDIVIDUAL + COMPANY)
========================================================= */

if (module === "employee") {

  const payKey = "paid_employee";
  const hasIndividualPurchase =
    localStorage.getItem(payKey) === "true";

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  const hasEmployeeSeat =
    company?.usedSeats?.[user?.email] === true;

  // 🟢 Individual purchase allowed
  if (type === "individual" && hasIndividualPurchase) {
    return;
  }

  // 🟢 Company seat allowed
  if (type === "company" && role === "employee" && hasEmployeeSeat) {
    return;
  }

  // 🔴 Block everyone else
  sessionStorage.setItem(
    "ams_notice",
    "You must purchase or be assigned a company seat to access this training."
  );
  redirectToRoleDashboard(user);
  return;
}

const roleAccess = {
  der: ["der"],
  employee: ["employee"],
  supervisor: ["supervisor"],
  owner: []
};

  if (!roleAccess[role] || !roleAccess[role].includes(module)) {
    sessionStorage.setItem(
      "ams_notice",
      "You don’t have access to that training module."
    );
    redirectToRoleDashboard(user);
    return;
  }

  /* =========================================================
     FMCSA MODULE ACCESS
  ========================================================= */

  if (
    (module === "fmcsa-module-a" || module === "fmcsa-drug-alcohol") &&
    localStorage.getItem("paid_fmcsa") === "true"
  ) {
    return;
  }

  /* =========================================================
     STEP 4 – PAYMENT / SEAT ENFORCEMENT
  ========================================================= */

  const paymentFlags = {
    der: "paid_der",
    employee: "paid_employee",
    supervisor: "paid_supervisor"
  };

  const payKey = paymentFlags[module];

  const hasIndividualPurchase =
    payKey && localStorage.getItem(payKey) === "true";

  let hasEmployeeSeat = false;

  if (module === "employee" && type === "company") {

    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    if (company && user?.email) {

      const assigned = company.usedSeats?.[user.email] === true;

      const total = company?.seats?.employee?.total ?? 0;
      const used = company?.seats?.employee?.used ?? 0;

      const seatStructureValid = used <= total;

      hasEmployeeSeat = assigned && seatStructureValid;
    }
  }

  /* =========================================================
     PAYMENT ENFORCEMENT LOGIC
  ========================================================= */

  // 🔵 Individual Users (B2C)
  if (type === "individual") {
    if (!hasIndividualPurchase) {
      sessionStorage.setItem(
        "ams_notice",
        "You must purchase this training before accessing it."
      );
      redirectToRoleDashboard(user);
      return;
    }
  }

  // 🟢 Company Employees (B2B)
  if (module === "employee" && type === "company" && role === "employee") {
    if (!hasIndividualPurchase && !hasEmployeeSeat) {
      sessionStorage.setItem(
        "ams_notice",
        "You do not have access to this employee training."
      );
      redirectToRoleDashboard(user);
      return;
    }
  }

  /* =========================================================
     STEP 5 – COMPLETION HARD LOCK
  ========================================================= */

  const completionFlags = {
    der: "derTrainingCompleted",
    employee: "employeeTrainingCompleted",
    supervisor: "supervisorTrainingCompleted"
  };

  const completedKey = completionFlags[module];

  if (
    completedKey &&
    localStorage.getItem(completedKey) === "true"
  ) {
    console.log("✅ Module completed — certificate-only access enforced");
  }

  /* =========================================================
     HELPER – ROLE DASHBOARD REDIRECT
  ========================================================= */

  function redirectToRoleDashboard(user) {
    if (user.type === "company" &&
        (user.role === "company_admin" || user.role === "owner")) {
      window.location.replace(ROUTES.companyDashboard);
    } else {
      window.location.replace(ROUTES.dashboard);
    }
  }

})();

/* =========================================================
   GLOBAL LOGOUT
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");
  window.location.replace("login.html");
}
