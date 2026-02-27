/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD
   (Authentication + Role Access + Seat Logic)
   TYPE-AWARE STABLE VERSION
========================================================= */

(function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body.dataset.module;
  const path = window.location.pathname;
  const role = user?.role;
  const type = user?.type || "company";

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
    if (
      path.includes("login.html") ||
      path.includes("register-select.html") ||
      path.includes("register-company.html") ||
      path.includes("register-employee.html") ||
      path.includes("register-individual.html")
    ) {
      return;
    }

    window.location.replace(ROUTES.login);
    return;
  }

  /* =========================================================
     STEP 2 – NOT A MODULE PAGE
  ========================================================= */

  if (!module) return;

  /* =========================================================
     FMCSA MODULE ACCESS + 30-DAY EXPIRATION
  ========================================================= */

  if (
    module === "fmcsa-module-a" ||
    module === "fmcsa-drug-alcohol" ||
    module === "fmcsa-der"
  ) {

    const paymentMap = {
      "fmcsa-module-a": "paid_fmcsa",
      "fmcsa-drug-alcohol": "paid_fmcsa",
      "fmcsa-der": "paid_der_fmcsa"
    };

    const dateMap = {
      "fmcsa-module-a": "paid_fmcsa_date",
      "fmcsa-drug-alcohol": "paid_fmcsa_date",
      "fmcsa-der": "paid_der_fmcsa_date"
    };

    const paidKey = paymentMap[module];
    const dateKey = dateMap[module];

    const paid = localStorage.getItem(paidKey);
    const purchaseDate = parseInt(localStorage.getItem(dateKey) || "0", 10);

    if (paid !== "true" || !purchaseDate) {
      sessionStorage.setItem(
        "ams_notice",
        "You must purchase this FMCSA training to access it."
      );
      redirectToRoleDashboard(user);
      return;
    }

    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    if (Date.now() - purchaseDate > THIRTY_DAYS) {

      localStorage.removeItem(paidKey);
      localStorage.removeItem(dateKey);

      sessionStorage.setItem(
        "ams_notice",
        "Your FMCSA training access has expired (30 days). Please repurchase to continue."
      );

      redirectToRoleDashboard(user);
      return;
    }

    return;
  }

  /* =========================================================
     HYBRID EMPLOYEE ACCESS (INDIVIDUAL + COMPANY)
  ========================================================= */

  if (module === "employee") {

    const hasIndividualPurchase =
      localStorage.getItem("paid_employee") === "true";

    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    const hasEmployeeSeat =
      !!company?.usedSeats?.[user?.email];

    if (type === "individual" && hasIndividualPurchase) {
      return;
    }

    if (type === "company" && role === "employee" && hasEmployeeSeat) {
      return;
    }

    sessionStorage.setItem(
      "ams_notice",
      "You must purchase or be assigned a company seat to access this training."
    );

    redirectToRoleDashboard(user);
    return;
  }

  /* =========================================================
     ROLE ACCESS CONTROL
  ========================================================= */

  const roleAccess = {
    individual: ["der", "supervisor", "employee"],
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
     PAYMENT ENFORCEMENT (NON-FMCSA MODULES)
  ========================================================= */

  const paymentFlags = {
    der: "paid_der",
    employee: "paid_employee",
    supervisor: "paid_supervisor"
  };

  const payKey = paymentFlags[module];
  const hasIndividualPurchase =
    payKey && localStorage.getItem(payKey) === "true";

  if (type === "individual" && !hasIndividualPurchase) {
    sessionStorage.setItem(
      "ams_notice",
      "You must purchase this training before accessing it."
    );
    redirectToRoleDashboard(user);
    return;
  }

  /* =========================================================
     COMPLETION HARD LOCK (INFO ONLY)
  ========================================================= */

  const completionFlags = {
    der: "derTrainingCompleted",
    employee: "employeeTrainingCompleted",
    supervisor: "supervisorTrainingCompleted"
  };

  const completedKey = completionFlags[module];

  if (completedKey &&
      localStorage.getItem(completedKey) === "true") {
    console.log("✅ Module completed — certificate-only access enforced");
  }

  /* =========================================================
     HELPER – ROLE DASHBOARD REDIRECT
  ========================================================= */

  function redirectToRoleDashboard(user) {
    if (
      user.type === "company" &&
      (user.role === "company_admin" || user.role === "owner")
    ) {
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
