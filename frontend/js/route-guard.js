/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD (USER ISOLATED)
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

  const email = user.email;

  /* =========================================================
   3️⃣ CERTIFICATE ACCESS LOCK (USER ISOLATED)
  ========================================================= */

  if (path.includes("certificates")) {

    const urlParams = new URLSearchParams(window.location.search);
    const certId = urlParams.get("id");

    if (certId) {
      const key = `amsCertificates_${email}`;
      const registry = JSON.parse(localStorage.getItem(key) || "[]");

      const match = registry.find(c => c.id === certId);

      if (!match) {
        document.body.innerHTML =
          "<h2 style='text-align:center;margin-top:50px;'>Invalid Certificate Access</h2>";
        return;
      }
    }

    return;
  }

  /* =========================================================
   4️⃣ VERIFY PAGE (PUBLIC SAFE)
  ========================================================= */

  if (path.includes("verify")) {
    return;
  }

  /* =========================================================
   5️⃣ NON-MODULE PAGE PROTECTION
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
   6️⃣ ROLE ACCESS CONTROL
  ========================================================= */

  const roleAccess = {
    individual: ["der", "supervisor", "employee", "fmcsa-der", "fmcsa-module-a", "fmcsa-drug-alcohol", "fmcsa-employee"],
    der: ["der", "fmcsa-der"],
    supervisor: ["supervisor", "fmcsa-module-a", "fmcsa-drug-alcohol"],
    employee: ["employee", "fmcsa-employee"],
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
   7️⃣ FAA PAYMENT ENFORCEMENT (USER ISOLATED)
  ========================================================= */

  const FAA_KEYS = {
    der: "paid_der",
    supervisor: "paid_supervisor",
    employee: "paid_employee"
  };

  if (["der", "supervisor", "employee"].includes(module)) {

    const key = FAA_KEYS[module];

    if (type === "individual") {

      const paid =
        localStorage.getItem(`${key}_${email}`) === "true";

      if (!paid) {

        sessionStorage.setItem(
          "ams_notice",
          "You must purchase this training before accessing it."
        );

        redirectToRoleDashboard(user);
        return;
      }
    }
  }

  /* =========================================================
   8️⃣ FMCSA PAYMENT + EXPIRATION (USER ISOLATED)
  ========================================================= */

  if (
    module === "fmcsa-module-a" ||
    module === "fmcsa-drug-alcohol" ||
    module === "fmcsa-employee"
  ) {

    const paymentMap = {
      "fmcsa-module-a": "paid_fmcsa",
      "fmcsa-drug-alcohol": "paid_fmcsa",
      "fmcsa-employee": "paid_employee_fmcsa"
    };

    const dateMap = {
      "fmcsa-module-a": "fmcsa_start_date",
      "fmcsa-drug-alcohol": "fmcsa_start_date",
      "fmcsa-der": "paid_der_fmcsa_date",
      "fmcsa-employee": "paid_employee_fmcsa_date"
    };

    const paidKey = paymentMap[module];
    const dateKey = dateMap[module];

    const paid =
      localStorage.getItem(`${paidKey}_${email}`) === "true";

    const purchaseDate = parseInt(
      localStorage.getItem(`${dateKey}_${email}`) || "0"
    );

    if (!paid) {

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

      localStorage.removeItem(`${paidKey}_${email}`);
      localStorage.removeItem(`${dateKey}_${email}`);

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
