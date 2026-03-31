/* =========================================================
   AMS TRAINING ACCESS GUARD (FINAL — USER + SEAT SAFE)
========================================================= */

(function () {

  const DEV_OVERRIDE =
    localStorage.getItem("ams_dev_override") === "true";

  const user = JSON.parse(
    localStorage.getItem("amsUser") || "null"
  );

  const module =
    document.body.getAttribute("data-module") || null;

  /* =========================
     REQUIRE LOGIN
  ========================= */

  if (!user && !DEV_OVERRIDE) {
    window.location.replace("login.html");
    return;
  }

  if (!module) return;

  const email = user?.email;

  /* =========================
     PAYMENT MAP (USER ISOLATED)
  ========================= */

  const PAYMENT_KEYS = {
    der: "paid_der",
    supervisor: "paid_supervisor",
    employee: "paid_employee",
    "fmcsa-der": "paid_der_fmcsa",
    "fmcsa-module-a": "paid_fmcsa",
    "fmcsa-drug-alcohol": "paid_fmcsa",
    "fmcsa-employee": "paid_employee_fmcsa"
  };

  let isPaid = false;

  const baseKey = PAYMENT_KEYS[module];

  if (baseKey && email) {
    isPaid =
      localStorage.getItem(`${baseKey}_${email}`) === "true";
  }

  /* =========================
     COMPANY SEAT CHECK (EMPLOYEE ONLY)
  ========================= */

  let seatAssigned = false;

  if (module === "employee") {

    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    // ✅ FIXED: use email (not id)
    seatAssigned = !!company?.usedSeats?.[email];
  }

  /* =========================
     FINAL ACCESS CHECK
  ========================= */

  if (!isPaid && !seatAssigned && !DEV_OVERRIDE) {

    console.warn(`🔒 ${module} requires purchase or seat`);

    // 🔥 redirect safely
    window.location.replace("dashboard.html");

    return;
  }

})();
