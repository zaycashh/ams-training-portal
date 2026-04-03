/* =========================================================
   AMS ROUTE GUARD (CLEAN RESET)
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body?.dataset?.module || "";
  const path = window.location.pathname;
   
   /* =========================
   LOAD PERMISSIONS
========================= */

const permissions = user
  ? JSON.parse(localStorage.getItem(`permissions_${user.email}`) || "{}")
  : {};
   
/* =========================
   EMPLOYEE PERMISSION LOCK
========================= */

if (user?.role === "employee") {

  const blockedSupervisor = !permissions.supervisor;
  const blockedDER = !permissions.der;
  const blockedEmployee = !permissions.employee;

  if (
    (path.includes("fmcsa-module-a") && blockedSupervisor) ||
    (path.includes("fmcsa-drug-alcohol") && blockedSupervisor) ||
    (path.includes("fmcsa-der") && blockedDER) ||
    (path.includes("fmcsa-employee") && blockedEmployee) ||
    path.includes("payment") // still block all purchases
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
     REQUIRE LOGIN
  ========================= */
  if (!user && !path.includes("login")) {
    window.location.replace("login.html");
    return;
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
