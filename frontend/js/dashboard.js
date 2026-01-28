const COURSE_KEYS = {
function logout() {
  // Clear session
  localStorage.removeItem("amsUser");

  // Optional: clear FMCSA session flags if you want a full reset
  // localStorage.removeItem("paid_fmcsa");
  // localStorage.removeItem("fmcsa_start_date");

  // Silent redirect (no popup)
  window.location.replace("login.html");
}

function startFMCSA() {
  const paid = localStorage.getItem("paid_fmcsa");
  const startDate = localStorage.getItem("fmcsa_start_date");

  // Simulated payment for now
  if (!paid) {
    localStorage.setItem("paid_fmcsa", "true");
    localStorage.setItem("fmcsa_start_date", Date.now());
  }

  // Redirect to FMCSA hub
  window.location.href = "./fmcsa.html";
}
/* =========================
   FAA MODULE ACCESS CONTROL
========================= */

function startFAA(type) {
  const key = `paid_${type}`;

  // Not purchased yet
  if (localStorage.getItem(key) !== "true") {
    alert(
      `${type.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`
    );
    return;
  }

  // Redirect if purchased
  if (type === "der") {
    window.location.href = "der-training.html";
  }
  if (type === "supervisor") {
    window.location.href = "supervisor-training.html";
  }
  if (type === "employee") {
    window.location.href = "employee-training.html";
  }
}
