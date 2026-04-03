/* =========================================================
   AMS ROUTE GUARD (FINAL - SEAT + PROGRAM + INDIVIDUAL SAFE)
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
     PROGRAM RESTRICTION
  ========================= */
  if (user?.role === "employee") {

    if (program === "fmcsa") {
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
      if (path.includes("fmcsa")) {
        window.location.replace("dashboard.html");
        return;
      }
    }
  }

  /* =========================
     COMPANY SEAT CHECK
  ========================= */
  function hasCompanySeat() {
    const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
    return company?.usedSeats?.[user.email] === true;
  }

  /* =========================
   EMPLOYEE ACCESS CONTROL
========================= */
if (user?.role === "employee" && user?.type === "company") {

  const hasSeat = hasCompanySeat();

  // 🔒 Block FMCSA module pages if no seat
  if (
    path.includes("fmcsa-module-a.html") ||
    path.includes("fmcsa-drug-alcohol.html") ||
    path.includes("fmcsa-der.html") ||
    path.includes("fmcsa-employee-training.html")
  ) {

    if (hasSeat !== true) {

      sessionStorage.setItem(
        "ams_notice",
        "No seat assigned. Contact your administrator."
      );

      window.location.replace("dashboard.html");
      return;
    }
  }

  // 🚫 Block payment page
  if (path.includes("payment.html")) {
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
     PAYMENT CHECK (INDIVIDUAL ONLY)
  ========================= */
  if (user.type !== "company") {

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
  }

});
