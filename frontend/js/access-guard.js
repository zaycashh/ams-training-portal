/* =========================================================
   AMS TRAINING ACCESS GUARD (SEAT-AWARE VERSION)
========================================================= */
(function () {
  const DEV_OVERRIDE =
    localStorage.getItem("ams_dev_override") === "true";

  const user = JSON.parse(
    localStorage.getItem("amsUser") || "null"
  );

  const module = document.body.getAttribute("data-module");

  // Must be logged in
  if (!user && !DEV_OVERRIDE) {
    window.location.replace("login.html");
    return;
  }

  // If no module defined, nothing to guard
  if (!module) return;

  let isPaid = false;

// FAA MODULES
if (module === "der") {
  isPaid = localStorage.getItem("paid_der") === "true";
}

if (module === "supervisor") {
  isPaid = localStorage.getItem("paid_supervisor") === "true";
}

if (module === "employee") {
  isPaid = localStorage.getItem("paid_employee") === "true";
}

// FMCSA MODULES
if (module === "fmcsa-der") {
  isPaid = localStorage.getItem("paid_der_fmcsa") === "true";
}

if (module === "fmcsa-module-a" || module === "fmcsa-drug-alcohol") {
  isPaid = localStorage.getItem("paid_fmcsa") === "true";
}

if (module === "fmcsa-employee") {
  isPaid = localStorage.getItem("paid_employee_fmcsa") === "true";
}

  // 🔥 COMPANY SEAT SUPPORT (EMPLOYEE ONLY)
  let seatAssigned = false;

  if (module === "employee") {
    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    seatAssigned = company?.usedSeats?.[user?.id] === true;
  }

  if (!isPaid && !seatAssigned && !DEV_OVERRIDE) {
    console.warn(`🔒 ${module} requires purchase or seat`);
    window.location.replace("dashboard.html");
    return;
  }
})();
