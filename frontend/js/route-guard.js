/* =========================================================
   AMS ROUTE GUARD (FINAL - CLEAN + SAFE)
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body?.dataset?.module || "";
  const path = window.location.pathname;

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const program = company.program; // 🔥 SINGLE SOURCE
  const role = user?.role;

  /* =========================================================
     REQUIRE LOGIN FIRST
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

  // 🚫 FAA company trying FMCSA pages
  if (program === "FAA" && fmcsaModules.includes(module)) {
    window.location.href = "dashboard.html";
    return;
  }

  // 🚫 FMCSA company trying FAA pages
  if (program === "FMCSA" && faaModules.includes(module)) {
    window.location.href = "dashboard.html";
    return;
  }

  /* =========================================================
     ROLE LOCK
  ========================================================= */

  // 🔒 Employee restrictions
  if (role === "employee") {

  // Only block FAA modules directly
  if (module === "supervisor" || module === "der") {
    window.location.href = "dashboard.html";
    return;
  }

}
  // 🔒 Optional: Supervisor cannot access DER
  if (role === "supervisor") {

    if (module === "der" || module === "fmcsa-der") {
      window.location.href = "dashboard.html";
      return;
    }

  }

  /* =========================================================
     COMPANY SEAT CHECK
  ========================================================= */

  function hasCompanySeat() {
    const company =
      JSON.parse(localStorage.getItem("companyProfile") || "{}");

    return !!company?.usedSeats?.[user.email];
  }

  /* =========================
   EMPLOYEE ACCESS CONTROL (FINAL)
========================= */

if (user?.role === "employee" && user?.type === "company") {

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const email = user.email;

  const hasEmployeeSeat =
    company?.usedSeats?.employee?.[email] === true ||
    !!company?.usedSeats?.employee?.[email];

  const hasSupervisorSeat =
    company?.usedSeats?.supervisor?.[email] === true ||
    !!company?.usedSeats?.supervisor?.[email];

  const hasDerSeat =
    company?.usedSeats?.der?.[email] === true ||
    !!company?.usedSeats?.der?.[email];

  /* =========================
     MODULE ACCESS RULES
  ========================= */

  // 🔒 EMPLOYEE TRAINING
  if (path.includes("employee")) {
    if (!hasEmployeeSeat) {
      sessionStorage.setItem(
        "ams_notice",
        "No employee seat assigned."
      );
      window.location.replace("dashboard.html");
      return;
    }
  }

  // 🔒 SUPERVISOR (FAA + FMCSA)
  if (
    path.includes("supervisor") ||
    path.includes("fmcsa-module-a") ||
    path.includes("fmcsa-drug-alcohol")
  ) {
    if (!hasSupervisorSeat) {
      sessionStorage.setItem(
        "ams_notice",
        "Supervisor training not assigned."
      );
      window.location.replace("dashboard.html");
      return;
    }
  }

  // 🔒 DER (FAA + FMCSA)
  if (
    path.includes("der") ||
    path.includes("fmcsa-der")
  ) {
    if (!hasDerSeat) {
      sessionStorage.setItem(
        "ams_notice",
        "DER training not assigned."
      );
      window.location.replace("dashboard.html");
      return;
    }
  }

  // 🚫 BLOCK PAYMENT PAGE FOR EMPLOYEES
  if (path.includes("payment.html")) {
    window.location.replace("dashboard.html");
    return;
  }
}

  /* =========================================================
     ALLOW NON-MODULE PAGES
  ========================================================= */
  if (!module) return;

  const email = user.email;

  /* =========================================================
     PAYMENT CHECK (INDIVIDUAL ONLY)
  ========================================================= */

  if (user?.type !== "company") {

    const paymentMap = {
      "fmcsa-der": "paid_der_fmcsa",
      "fmcsa-module-a": "paid_fmcsa",
      "fmcsa-drug-alcohol": "paid_fmcsa",
      "fmcsa-employee": "paid_employee_fmcsa"
    };

    const key = paymentMap[module];

    if (key) {
      const paid =
        localStorage.getItem(`${key}_${email}`) === "true";

      if (!paid) {
        window.location.replace("dashboard.html");
        return;
      }
    }
  }

});
