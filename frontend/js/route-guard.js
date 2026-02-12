/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD
   (Roles + Individual Purchases + Employee Seats)
   SECURITY LAYER ONLY – NO UI, NO SEAT CONSUMPTION
========================================================= */

(function () {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body.dataset.module; // der | employee | supervisor

  /* =========================================================
     STEP 1 – AUTHENTICATION
  ========================================================= */

  // 🔐 Must be logged in
  if (!user) {
    window.location.replace("../pages/login.html");
    return;
  }

  // 🔐 Not on a module page → nothing to guard
  if (!module) return;

  /* =========================================================
     STEP 2 – ROLE → MODULE ENFORCEMENT
  ========================================================= */

  const role = user.role; // der | employee | supervisor | individual

  const roleAccess = {
    der: ["der"],
    employee: ["employee"],
    supervisor: ["supervisor"],
    individual: ["der", "employee", "supervisor"] // B2C buyers
  };

  if (
    roleAccess[role] &&
    !roleAccess[role].includes(module)
  ) {
    sessionStorage.setItem(
      "ams_notice",
      "You don’t have access to that training module."
    );
    window.location.replace("../pages/dashboard.html");
    return;
  }

 /* =========================================================
   STEP 3 – PAYMENT / SEAT ACCESS ENFORCEMENT (UPDATED)
========================================================= */

const paymentFlags = {
  der: "paid_der",
  employee: "paid_employee",
  supervisor: "paid_supervisor"
};

const payKey = paymentFlags[module];

const hasIndividualPurchase =
  payKey && localStorage.getItem(payKey) === "true";

// 🔥 UPDATED COMPANY SEAT SYSTEM (EMAIL-BASED + ACTIVE CHECK)
let hasEmployeeSeat = false;

if (module === "employee") {
  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  if (company?.assignedSeats && user?.email) {
    hasEmployeeSeat = company.assignedSeats.some(
      seat =>
        seat.email === user.email &&
        seat.active === true
    );
  }
}

// 🔒 Final access decision
if (!hasIndividualPurchase && !hasEmployeeSeat) {
  sessionStorage.setItem(
    "ams_notice",
    "This training module is locked."
  );
  window.location.replace("../pages/dashboard.html");
  return;
}

  /* =========================================================
     STEP 4 – COMPLETION HARD LOCK (UI HANDLED IN MODULE)
  ========================================================= */

  const completionFlags = {
    der: "derTrainingCompleted",
    employee: "employeeTrainingCompleted",
    supervisor: "supervisorTrainingCompleted"
  };

  const completedKey = completionFlags[module];

  if (
    completedKey &&
    localStorage.getItem(completedKey) === "true"
  ) {
    console.log(
      "✅ Module completed — certificate-only access enforced"
    );
    // Module JS handles certificate-only UI
  }
})();
