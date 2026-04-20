/* =========================
   🔥 HARD CERTIFICATE BYPASS (RUNS FIRST)
========================= */

const path = window.location.pathname;

if (
  path.includes("fmcsa-certificates") ||
  path.includes("faa-certificates")
) {

  console.log("✅ Certificate page — controlled access");

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) {
  window.location.replace("login.html");
  return;
}

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const email = user?.email;

  const hasEmployeeSeat =
    company?.usedSeats?.employee?.[email];

  const hasSupervisorSeat =
    company?.usedSeats?.supervisor?.[email];

  const hasDerSeat =
    company?.usedSeats?.der?.[email];

  const hasAnySeat =
    hasEmployeeSeat || hasSupervisorSeat || hasDerSeat;

  const completedEmployee =
    localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true";

  const completedSupervisor =
    localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";

  const completedDER =
    localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";

  const hasAnyCompletion =
    completedEmployee || completedSupervisor || completedDER;

  if (!hasAnySeat && !hasAnyCompletion) {
  alert("No certificate access.");
  window.location.replace("dashboard.html");
  return;
}

} else {
   
/* =========================================================
   MAIN ROUTE GUARD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body?.dataset?.module || "";

  const company =
    JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const program = company.program;
  const role = user?.role;

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
  ========================================================= */

  if (role === "employee") {
    if (module === "supervisor" || module === "der") {
      window.location.href = "dashboard.html";
      return;
    }
  }

  if (role === "supervisor") {
    if (module === "der" || module === "fmcsa-der") {
      window.location.href = "dashboard.html";
      return;
    }
  }

  /* =========================================================
     EMPLOYEE COMPANY SEAT CHECK
  ========================================================= */

  if (user?.role === "employee" && user?.type === "company") {

    const email = user.email;

    const hasEmployeeSeat =
      company?.usedSeats?.employee?.[email];

    const hasSupervisorSeat =
      company?.usedSeats?.supervisor?.[email];

    const hasDerSeat =
      company?.usedSeats?.der?.[email];

    // EMPLOYEE
    if (path.includes("employee") && !hasEmployeeSeat) {
      window.location.replace("dashboard.html");
      return;
    }

    // SUPERVISOR
    if (
      (path.includes("supervisor") ||
       path.includes("fmcsa-module-a") ||
       path.includes("fmcsa-drug-alcohol")) &&
      !hasSupervisorSeat
    ) {
      window.location.replace("dashboard.html");
      return;
    }

    // DER
    if (
      (path.includes("der") || path.includes("fmcsa-der")) &&
      !hasDerSeat
    ) {
      window.location.replace("dashboard.html");
      return;
    }

    // BLOCK PAYMENT
    if (path.includes("payment")) {
      window.location.replace("dashboard.html");
      return;
    }
  }

  /* =========================================================
     NON-MODULE PAGES
  ========================================================= */
  if (!module) return;

  const email = user.email;

  /* =========================================================
     INDIVIDUAL PAYMENT CHECK
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

}
