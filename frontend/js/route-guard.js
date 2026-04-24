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

  const role = (user.role || "").toLowerCase().trim();
  const email = (user.email || "").toLowerCase().trim();

  const isEmployee = role === "employee";
  const isSupervisor = role === "supervisor";
  const isDer = role === "der";
  const isCompanyAdmin =
    user.type === "company" && !isEmployee && !isSupervisor && !isDer;

  if (isCompanyAdmin) {
    console.log("✅ Company admin — certificate access granted");
  } else {
    const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

    const hasEmployeeSeat = !!company?.usedSeats?.employee?.[email];
    const hasSupervisorSeat = !!company?.usedSeats?.supervisor?.[email];
    const hasDerSeat = !!company?.usedSeats?.der?.[email];
    const hasAnySeat = hasEmployeeSeat || hasSupervisorSeat || hasDerSeat;

    const completedEmployee =
      localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true" ||
      localStorage.getItem(`faaEmployeeCompleted_${email}`) === "true";

    const completedSupervisor =
      localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true" ||
      localStorage.getItem(`fmcsaDrugAlcoholCompleted_${email}`) === "true" ||
      localStorage.getItem(`faaSupervisorCompleted_${email}`) === "true";

    const completedDER =
      localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true" ||
      localStorage.getItem(`der_fmcsa_quiz_passed_${email}`) === "true" ||
      localStorage.getItem(`faaDERCompleted_${email}`) === "true";

    const hasAnyCompletion =
      completedEmployee || completedSupervisor || completedDER;

    if (!hasAnySeat && !hasAnyCompletion) {
      sessionStorage.setItem("ams_notice", "No certificate access.");
      window.location.replace("dashboard.html");
      throw new Error("Redirecting...");
    }
  }

} else {

/* =========================================================
   MAIN ROUTE GUARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body?.dataset?.module || "";
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const program = (company.program || "").toUpperCase();
  const role = (user?.role || "").toLowerCase().trim();

  /* =========================================================
     REQUIRE LOGIN
  ========================================================= */
  if (!user && !path.includes("login")) {
    window.location.replace("login.html");
    return;
  }

  /* =========================================================
     NON-MODULE PAGES — stop here
  ========================================================= */
  if (!module) return;

  const email = (user?.email || "").toLowerCase().trim();

  /* =========================================================
     PROGRAM LOCK (FAA vs FMCSA)
  ========================================================= */
  const fmcsaModules = [
    "fmcsa-employee",
    "fmcsa-module-a",
    "fmcsa-supervisor",
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
     Block only what is truly forbidden.
     Company employees may access modules if they have matching seats.
  ========================================================= */
  if (role === "employee") {
    const hasEmployeeSeat = !!company?.usedSeats?.employee?.[email];
    const hasSupervisorSeat = !!company?.usedSeats?.supervisor?.[email];
    const hasDerSeat = !!company?.usedSeats?.der?.[email];

    if (module === "supervisor" && !hasSupervisorSeat) {
      sessionStorage.setItem("ams_notice", "You don't have access to that module.");
      window.location.href = "dashboard.html";
      return;
    }

    if (module === "der" && !hasDerSeat) {
      sessionStorage.setItem("ams_notice", "You don't have access to that module.");
      window.location.href = "dashboard.html";
      return;
    }

    if (
      (module === "fmcsa-module-a" ||
       module === "fmcsa-supervisor" ||
       module === "fmcsa-drug-alcohol") &&
      !hasSupervisorSeat
    ) {
      sessionStorage.setItem("ams_notice", "No supervisor seat assigned. Contact your administrator.");
      window.location.href = "dashboard.html";
      return;
    }

    if (module === "fmcsa-der" && !hasDerSeat) {
      sessionStorage.setItem("ams_notice", "No DER seat assigned. Contact your administrator.");
      window.location.href = "dashboard.html";
      return;
    }

    if (
      (module === "employee" || module === "fmcsa-employee") &&
      !hasEmployeeSeat
    ) {
      sessionStorage.setItem("ams_notice", "No employee seat assigned. Contact your administrator.");
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

  if (role === "der") {
    const hasDerSeat = !!company?.usedSeats?.der?.[email];

    if ((module === "der" || module === "fmcsa-der") && !hasDerSeat) {
      sessionStorage.setItem("ams_notice", "No DER seat assigned. Contact your administrator.");
      window.location.href = "dashboard.html";
      return;
    }

    if (
      module === "supervisor" ||
      module === "fmcsa-module-a" ||
      module === "fmcsa-supervisor" ||
      module === "fmcsa-drug-alcohol"
    ) {
      sessionStorage.setItem("ams_notice", "You don't have access to the supervisor module.");
      window.location.href = "dashboard.html";
      return;
    }

    if (module === "employee" || module === "fmcsa-employee") {
      sessionStorage.setItem("ams_notice", "You don't have access to the employee module.");
      window.location.href = "dashboard.html";
      return;
    }
  }

  /* =========================================================
     COMPANY EMPLOYEE — SEAT CHECK
  ========================================================= */
  if (user?.type === "company" && role === "employee") {
    const hasEmployeeSeat = !!company?.usedSeats?.employee?.[email];
    const hasSupervisorSeat = !!company?.usedSeats?.supervisor?.[email];
    const hasDerSeat = !!company?.usedSeats?.der?.[email];

    if (
      (path.includes("fmcsa-employee") || path.includes("employee")) &&
      !hasEmployeeSeat
    ) {
      sessionStorage.setItem("ams_notice", "No employee seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }

    if (
      (path.includes("supervisor") ||
       path.includes("fmcsa-module-a") ||
       path.includes("fmcsa-supervisor") ||
       path.includes("fmcsa-drug-alcohol")) &&
      !hasSupervisorSeat
    ) {
      sessionStorage.setItem("ams_notice", "No supervisor seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }

    if (
      (path.includes("fmcsa-der") || path.includes("der")) &&
      !hasDerSeat
    ) {
      sessionStorage.setItem("ams_notice", "No DER seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }

    if (path.includes("payment")) {
      window.location.replace("dashboard.html");
      return;
    }
  }

  /* =========================================================
     INDIVIDUAL PAYMENT CHECK (non-company users)
  ========================================================= */
  if (user?.type !== "company") {
    const paymentMap = {
      "fmcsa-der": "paid_der_fmcsa",
      "fmcsa-module-a": "paid_fmcsa",
      "fmcsa-supervisor": "paid_fmcsa",
      "fmcsa-drug-alcohol": "paid_fmcsa",
      "fmcsa-employee": "paid_employee_fmcsa",
      "employee": "paid_employee_faa",
      "supervisor": "paid_supervisor_faa",
      "der": "paid_der_faa"
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
