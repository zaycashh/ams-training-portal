/* =========================================================
   AMS ROUTE GUARD (FINAL - PERMISSIONS + PROGRAM LOCK)
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body?.dataset?.module || "";
  const path = window.location.pathname;

  /* =========================
     REQUIRE LOGIN
  ========================= */
  if (!user && !path.includes("login")) {
    window.location.replace("login.html");
    return;
  }

  /* =========================
     LOAD PROGRAM
  ========================= */
  const program = localStorage.getItem("amsProgram");

  /* =========================
     LOAD PERMISSIONS
  ========================= */
  const permissions = user
    ? JSON.parse(localStorage.getItem(`permissions_${user.email}`) || "{}")
    : {};

  /* =========================
     PROGRAM RESTRICTION
  ========================= */
  if (user?.role === "employee") {

    if (program === "fmcsa") {
      // Block FAA pages
      if (
        path.includes("der.html") ||
        path.includes("supervisor.html") ||
        path.includes("employee.html")
      ) {
        window.location.replace("dashboard.html");
        return;
      }
    }

    if (program === "faa") {
      // Block FMCSA pages
      if (
        path.includes("fmcsa")
      ) {
        window.location.replace("dashboard.html");
        return;
      }
    }
  }

  /* =========================
   EMPLOYEE PERMISSION LOCK
========================= */

if (user?.role === "employee") {

  const blockedSupervisor = !permissions.supervisor;
  const blockedDER = !permissions.der;
  const blockedEmployee = !permissions.employee;

  if (

    /* ===== FAA ===== */
    (path.includes("supervisor.html") && blockedSupervisor) ||
    (path.includes("der.html") && blockedDER) ||
    (path.includes("employee.html") && blockedEmployee) ||

    /* ===== FMCSA ===== */
    (path.includes("fmcsa-module-a") && blockedSupervisor) ||
    (path.includes("fmcsa-drug-alcohol") && blockedSupervisor) ||
    (path.includes("fmcsa-der") && blockedDER) ||
    (path.includes("fmcsa-employee") && blockedEmployee) ||

    /* ===== PAYMENT BLOCK ===== */
    path.includes("payment")

  ) {

    sessionStorage.setItem(
      "ams_notice",
      "This training has not been assigned to you."
    );

    window.location.replace("dashboard.html");
    return;
  }
}

  /* =========================
     ALLOW NON-MODULE PAGES
  ========================= */
  if (!module) return;

  const email = user.email;

  /* =========================
     PAYMENT CHECK ONLY
  ========================= */
  const paymentMap = {
    "fmcsa-der": "paid_der_fmcsa",
    "fmcsa-module-a": "paid_fmcsa",
    "fmcsa-drug-alcohol": "paid_fmcsa",
    "fmcsa-employee": "paid_employee_fmcsa"
  };

  const key = paymentMap[module];

  if (key) {
    const paid = localStorage.getItem(`${key}_${email}`) === "true";

    if (!paid) {
      window.location.replace("dashboard.html");
      return;
    }
  }

});
