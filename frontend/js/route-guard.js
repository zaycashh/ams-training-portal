/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body?.dataset?.module || "";
  const path = window.location.pathname;

  const BASE = "/ams-training-portal/frontend/pages/";

  const ROUTES = {
    login: BASE + "login.html",
    dashboard: BASE + "dashboard.html",
    companyDashboard: BASE + "company-dashboard.html"
  };

  const role = user?.role;
  const type = user?.type || "company";

  /* =========================================================
   1️⃣ PUBLIC PAGES
  ========================================================= */

  if (
    path.includes("login.html") ||
    path.includes("register")
  ) {
    return;
  }

  /* =========================================================
   2️⃣ REQUIRE LOGIN
  ========================================================= */

  if (!user) {
    window.location.replace(ROUTES.login);
    return;
  }

  /* =========================================================
   3️⃣ ALLOW CERTIFICATE + VERIFY PAGES
  ========================================================= */

  if (
    path.includes("certificates") ||
    path.includes("verify")
  ) {
    return;
  }

  /* =========================================================
   4️⃣ NON-MODULE PAGE PROTECTION
  ========================================================= */

  if (!module) {

    if (
      path.includes("company-dashboard") &&
      role !== "company_admin" &&
      role !== "owner"
    ) {
      redirectToRoleDashboard(user);
      return;
    }

    return;
  }

  /* =========================================================
   5️⃣ ROLE ACCESS CONTROL
  ========================================================= */

  const roleAccess = {
  individual: ["der", "supervisor", "employee", "fmcsa-der", "fmcsa-module-a", "fmcsa-drug-alcohol"],
  der: ["der", "fmcsa-der"],
  supervisor: ["supervisor", "fmcsa-module-a", "fmcsa-drug-alcohol"],
  employee: ["employee"],
  owner: []
};;

  if (!roleAccess[role] || !roleAccess[role].includes(module)) {

    sessionStorage.setItem(
      "ams_notice",
      "You don’t have access to that training module."
    );

    redirectToRoleDashboard(user);
    return;
  }

  /* =========================================================
   6️⃣ PAYMENT ENFORCEMENT
  ========================================================= */

  const paymentFlags = {
    der: "paid_der",
    supervisor: "paid_supervisor",
    employee: "paid_employee"
  };

  const payKey = paymentFlags[module];

  if (type === "individual" && payKey) {

    const paid = localStorage.getItem(payKey) === "true";

    if (!paid) {

      sessionStorage.setItem(
        "ams_notice",
        "You must purchase this training before accessing it."
      );

      redirectToRoleDashboard(user);
      return;
    }
  }

  /* =========================================================
   7️⃣ FMCSA MODULE PAYMENT + EXPIRATION
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
      "fmcsa-module-a": "fmcsa_start_date",
      "fmcsa-drug-alcohol": "fmcsa_start_date",
      "fmcsa-der": "paid_der_fmcsa_date"
    };

    const paidKey = paymentMap[module];
    const dateKey = dateMap[module];

    const paid = localStorage.getItem(paidKey) === "true";
    const purchaseDate = parseInt(localStorage.getItem(dateKey) || "0");

    if (!paid || purchaseDate === 0) {

      if (module === "fmcsa-der") {

        window.location.replace(
          BASE + "payment.html?module=fmcsa-der&type=der_fmcsa"
        );

        return;
      }

      redirectToRoleDashboard(user);
      return;
    }

    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    if (Date.now() - purchaseDate > THIRTY_DAYS) {

      localStorage.removeItem(paidKey);
      localStorage.removeItem(dateKey);

      sessionStorage.setItem(
        "ams_notice",
        "Your FMCSA training access expired. Please repurchase."
      );

      redirectToRoleDashboard(user);
      return;
    }
  }

  /* =========================================================
   HELPER – DASHBOARD REDIRECT
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

});

/* =========================================================
   GLOBAL LOGOUT
========================================================= */

function logout() {
  localStorage.removeItem("amsUser");
  window.location.replace("login.html");
}
