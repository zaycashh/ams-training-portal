/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD
   (Authentication + Role Access + Seat Logic)
   SAFE MERGED VERSION
========================================================= */

(function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body.dataset.module; // der | employee | supervisor
  const path = window.location.pathname;

  const BASE = "/ams-training-portal/frontend/pages/";

  const ROUTES = {
    login: BASE + "login.html",
    register: BASE + "register.html",
    registerSelect: BASE + "register-select.html",
    dashboard: BASE + "dashboard.html",
    companyDashboard: BASE + "company-dashboard.html"
  };

  /* =========================================================
     STEP 1 – GLOBAL AUTH CHECK
  ========================================================= */

  // 🔐 Not logged in
  if (!user) {
    // Allow login & register pages
    if (
      path.includes("login.html") ||
      path.includes("register.html") ||
      path.includes("register-select.html")
    ) return;

    window.location.replace(ROUTES.login);
    return;
  }

  // 🔐 Logged in users cannot access auth pages
  if (
    path.includes("login.html") ||
    path.includes("register.html") ||
    path.includes("register-select.html")
  ) {
    redirectToRoleDashboard(user);
    return;
  }

  /* =========================================================
     STEP 2 – NOT A MODULE PAGE
  ========================================================= */

  if (!module) return;

  /* =========================================================
     STEP 3 – ROLE → MODULE ENFORCEMENT
  ========================================================= */

  const role = user.role; // der | employee | supervisor | individual | owner

  const roleAccess = {
    der: ["der"],
    employee: ["employee"],
    supervisor: ["supervisor"],
    individual: ["der", "employee", "supervisor"],
    owner: [] // owner cannot access modules directly
  };
   // 🔥 Allow FMCSA modules if purchased
if (
  (module === "fmcsa-module-a" || module === "fmcsa-drug-alcohol") &&
  localStorage.getItem("paid_fmcsa") === "true"
) {
  return;
}

  if (!roleAccess[role] || !roleAccess[role].includes(module)) {
  sessionStorage.setItem(
    "ams_notice",
    "You don’t have access to that training module."
  );
  redirectToRoleDashboard(user);
  return;
}

  /* =========================================================
     STEP 4 – PAYMENT / SEAT ACCESS ENFORCEMENT
  ========================================================= */

  const paymentFlags = {
    der: "paid_der",
    employee: "paid_employee",
    supervisor: "paid_supervisor"
  };

  const payKey = paymentFlags[module];

  const hasIndividualPurchase =
    payKey && localStorage.getItem(payKey) === "true";

  // 🔥 COMPANY SEAT SYSTEM (USED SEATS MODEL)
  let hasEmployeeSeat = false;

  if (module === "employee") {
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
   PAYMENT ENFORCEMENT
========================================================= */

// If individual role → must have purchase
if (user.role === "individual") {
  if (!hasIndividualPurchase) {
    sessionStorage.setItem(
      "ams_notice",
      "You must purchase this training before accessing it."
    );
    redirectToRoleDashboard(user);
    return;
  }
}

// If employee role → must have individual purchase OR valid seat
if (module === "employee" && user.role === "employee") {
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
    // Module JS handles certificate-only UI
  }

  /* =========================================================
     HELPER – ROLE DASHBOARD REDIRECT
  ========================================================= */

  function redirectToRoleDashboard(user) {
    switch (user.role) {
      case "company_admin":
      case "owner":
        window.location.replace(ROUTES.companyDashboard);
        break;
      default:
        window.location.replace(ROUTES.dashboard);
    }
  }
})();
/* =========================================================
   GLOBAL LOGOUT (AVAILABLE ON ALL PAGES)
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");
  window.location.replace(
    "/ams-training-portal/frontend/pages/login.html"
  );
}
