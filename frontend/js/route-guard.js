/* =========================================================
   AMS TRAINING PORTAL – GLOBAL ROUTE GUARD (STEP 1)
========================================================= */

(function () {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const module = document.body.dataset.module; // der | employee | supervisor

  // 🔐 1. Must be logged in
  if (!user) {
    window.location.href = "../pages/login.html";
    return;
  }

  // 🔐 2. Must be on a valid module page
  if (!module) return;

   /* =========================================================
   STEP 2 – ROLE → MODULE ROUTING ENFORCEMENT
========================================================= */

const role = user.role; // expected: 'der' | 'employee' | 'supervisor'

// Which roles can access which modules
const roleAccess = {
  der: ["der"],
  employee: ["employee"],
  supervisor: ["supervisor"]
};

// If module exists but role is not allowed → block
if (
  module &&
  roleAccess[role] &&
  !roleAccess[role].includes(module)
) {
  window.location.replace("../pages/dashboard.html");
  return;
}

  // 🔐 3. Paywall enforcement
  const paymentFlags = {
    der: "paid_der",
    employee: "paid_employee",
    supervisor: "paid_supervisor"
  };

  const payKey = paymentFlags[module];

  if (payKey && localStorage.getItem(payKey) !== "true") {
  window.location.replace("../pages/dashboard.html");
  return;
}

  // 🔒 4. Completion hard-lock redirect (handled per module)
  const completionFlags = {
    der: "derCompleted",
    employee: "employeeCompleted",
    supervisor: "supervisorCompleted"
  };

  const completedKey = completionFlags[module];

  if (
    completedKey &&
    localStorage.getItem(completedKey) === "true" &&
    !window.location.href.includes("certificate")
  ) {
    // Allow page load, module logic will lock UI
    console.log("✅ Module completed – certificate-only access enforced");
  }
})();
