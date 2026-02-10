/* =========================================================
   AMS TRAINING ACCESS GUARD (FIXED)
========================================================= */
(function () {
  const DEV_OVERRIDE = localStorage.getItem("ams_dev_override") === "true";

  const user = localStorage.getItem("amsUser");
  const module = document.body.getAttribute("data-module");

  // Must be logged in
  if (!user && !DEV_OVERRIDE) {
    window.location.replace("login.html");
    return;
  }

  // If no module defined, nothing to guard
  if (!module) return;

  // 🔑 PAYMENT CHECK (NOT QUIZ PASS)
  const paidKey = `paid_${module}`;
  const isPaid = localStorage.getItem(paidKey) === "true";

  if (!isPaid && !DEV_OVERRIDE) {
    console.warn(`🔒 ${module} not purchased`);
    window.location.replace("dashboard.html");
    return;
  }
})();
