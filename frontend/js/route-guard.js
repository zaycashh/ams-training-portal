/* =========================
   ROUTE GUARD — AMS Training Portal
   Runs on every page via <script src="../js/route-guard.js">
========================= */

const path = window.location.pathname;

/* =========================================================
   CERTIFICATE PAGE — HARD BYPASS (runs before DOMContentLoaded)
========================================================= */
if (
  path.includes("fmcsa-certificates") ||
  path.includes("faa-certificates")
) {

  console.log("✅ Certificate page — controlled access");

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) {
    window.location.replace("login.html");
    throw new Error("Redirecting...");
  }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const email   = user?.email;

  const hasEmployeeSeat   = company?.usedSeats?.employee?.[email];
  const hasSupervisorSeat = company?.usedSeats?.supervisor?.[email];
  const hasDerSeat        = company?.usedSeats?.der?.[email];
  const hasAnySeat        = hasEmployeeSeat || hasSupervisorSeat || hasDerSeat;

  const completedEmployee   = localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true";
  const completedSupervisor = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";
  const completedDER        = localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";
  const hasAnyCompletion    = completedEmployee || completedSupervisor || completedDER;

  if (!hasAnySeat && !hasAnyCompletion) {
    sessionStorage.setItem("ams_notice", "No certificate access.");
    window.location.replace("dashboard.html");
    throw new Error("Redirecting...");
  }

} else {

/* =========================================================
   MAIN ROUTE GUARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user    = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module  = document.body?.dataset?.module || "";
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const program = company.program;
  const role    = user?.role;

  /* =========================================================
     REQUIRE LOGIN
  ========================================================= */
  if (!user && !path.includes("login")) {
    window.location.replace("login.html");
    return;
  }

  /* =========================================================
     PROGRAM LOCK (FAA vs FMCSA)
  ========================================================= */
  const fmcsaModules = [
    "fmcsa-employee",
    "fmcsa-module-a",
    "fmcsa-drug-alcohol",
    "fmcsa-der"
  ];

  const faaModules = [
    "employee",
    "supervisor",
    "der"
  ];

  if (program === "FAA" && fmcsaModules.includes(module)) {
    window.location.href = "dashboard.html";
    return;
  }

  if (program === "FMCSA" && faaModules.includes(module)) {
    window.location.href = "dashboard.html";
    return;
  }

  /* =========================================================
     ROLE LOCK
     Employees cannot access supervisor or DER modules (FAA or FMCSA)
     Supervisors cannot access DER modules
  ========================================================= */
  if (role === "employee") {
    if (
      module === "supervisor"         ||
      module === "der"                ||
      module === "fmcsa-module-a"     ||
      module === "fmcsa-drug-alcohol" ||
      module === "fmcsa-der"
    ) {
      sessionStorage.setItem("ams_notice", "You don't have access to that module.");
      window.location.href = "dashboard.html";
      return;
    }
  }

  if (role === "supervisor") {
    if (module === "der" || module === "fmcsa-der") {
      sessionStorage.setItem("ams_notice", "You don't have access to the DER module.");
      window.location.href = "dashboard.html";
      return;
    }
  }

  /* =========================================================
     COMPANY EMPLOYEE — SEAT CHECK
  ========================================================= */
  if (user?.role === "employee" && user?.type === "company") {

    const email = user.email;

    const hasEmployeeSeat   = company?.usedSeats?.employee?.[email];
    const hasSupervisorSeat = company?.usedSeats?.supervisor?.[email];
    const hasDerSeat        = company?.usedSeats?.der?.[email];

    // EMPLOYEE modules
    if (
      (path.includes("fmcsa-employee") || path.includes("employee")) &&
      !hasEmployeeSeat
    ) {
      sessionStorage.setItem("ams_notice", "No employee seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }

    // SUPERVISOR modules
    if (
      (path.includes("supervisor")        ||
       path.includes("fmcsa-module-a")    ||
       path.includes("fmcsa-supervisor")  ||
       path.includes("fmcsa-drug-alcohol")) &&
      !hasSupervisorSeat
    ) {
      sessionStorage.setItem("ams_notice", "No supervisor seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }

    // DER modules
    if (
      (path.includes("fmcsa-der") || path.includes("der")) &&
      !hasDerSeat
    ) {
      sessionStorage.setItem("ams_notice", "No DER seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }

    // BLOCK PAYMENT PAGE for company employees
    if (path.includes("payment")) {
      window.location.replace("dashboard.html");
      return;
    }
  }

  /* =========================================================
     NON-MODULE PAGES — stop here
  ========================================================= */
  if (!module) return;

  const email = user?.email;

  /* =========================================================
     INDIVIDUAL PAYMENT CHECK (non-company users)
  ========================================================= */
  if (user?.type !== "company") {

    const paymentMap = {
      "fmcsa-der":          "paid_der_fmcsa",
      "fmcsa-module-a":     "paid_fmcsa",
      "fmcsa-drug-alcohol": "paid_fmcsa",
      "fmcsa-employee":     "paid_employee_fmcsa"
    };

    const key = paymentMap[module];

    if (key) {
      const paid = localStorage.getItem(`${key}_${email}`) === "true";
      if (!paid) {
        sessionStorage.setItem("ams_notice", "Purchase required to access this training.");
        window.location.replace("dashboard.html");
        return;
      }
    }
  }

});

} // end else
