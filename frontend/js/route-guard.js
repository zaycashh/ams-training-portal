/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD
   (Roles + Company Seats + Individual Purchases)
========================================================= */

(function () {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body.dataset.module; // der | employee | supervisor

  // 🔐 1. Must be logged in
  if (!user) {
    window.location.replace("../pages/login.html");
    return;
  }

  // 🔐 2. If not on a module page, nothing to guard
  if (!module) return;

  /* =========================================================
     STEP 2 – ROLE → MODULE ENFORCEMENT
  ========================================================= */

  const role = user.role; // der | employee | supervisor | individual

  const roleAccess = {
    der: ["der"],
    employee: ["employee"],
    supervisor: ["supervisor"],
    individual: ["der", "employee", "supervisor"] // B2C users
  };

  if (
    roleAccess[role] &&
    !roleAccess[role].includes(module)
  ) {
    sessionStorage.setItem(
      "ams_notice",
      "You don’t have access to that training module."
    );
    window.location.replace("../pages/dashboard.html");
    return;
  }

  /* =========================================================
     STEP 3 – COMPANY SEATS + INDIVIDUAL PAYWALL
  ========================================================= */

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  const companyModules = Array.isArray(company?.modules)
    ? company.modules.map(m => m.toLowerCase())
    : [];

  const paymentFlags = {
    der: "paid_der",
    employee: "paid_employee",
    supervisor: "paid_supervisor"
  };

  const payKey = paymentFlags[module];

  const hasCompanySeat = companyModules.includes(module);
  const hasIndividualPurchase =
    payKey && localStorage.getItem(payKey) === "true";

  if (!hasCompanySeat && !hasIndividualPurchase) {
    sessionStorage.setItem(
      "ams_notice",
      "This training module is locked."
    );
    window.location.replace("../pages/dashboard.html");
    return;
  }

  /* =========================================================
     STEP 4 – COMPLETION HARD LOCK (UI HANDLED IN MODULE)
  ========================================================= */

  const completionFlags = {
    der: "derCompleted",
    employee: "employeeCompleted",
    supervisor: "supervisorCompleted"
  };

  const completedKey = completionFlags[module];

  if (
    completedKey &&
    localStorage.getItem(completedKey) === "true"
  ) {
    console.log(
      "✅ Module completed — certificate-only access enforced"
    );
    // Module JS will handle UI lock
  }
})();
