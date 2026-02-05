/* =========================================================
   AMS TRAINING ACCESS GUARD (STEP 22.4)
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

  // Module unlock key (future payment hook)
  const unlocked = localStorage.getItem(`ams_${module}_unlocked`) === "true";

  // Block direct URL access
  if (!unlocked && !DEV_OVERRIDE) {
    console.warn(`🔒 Access blocked to ${module} module`);
    window.location.replace("dashboard.html");
  }
})();
