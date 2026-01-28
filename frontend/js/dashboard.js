/* =========================
   COURSE KEYS
========================= */
const COURSE_KEYS = {
  der: "paid_der",
  supervisor: "paid_supervisor",
  employee: "paid_employee",
  fmcsa: "paid_fmcsa"
};

/* =========================
   LOGOUT
========================= */
function logout() {
  // Clear user session
  localStorage.removeItem("amsUser");

  // Optional full reset (leave commented unless needed)
  // localStorage.removeItem("paid_der");
  // localStorage.removeItem("paid_supervisor");
  // localStorage.removeItem("paid_employee");
  // localStorage.removeItem("paid_fmcsa");
  // localStorage.removeItem("fmcsa_start_date");

  // Silent redirect
  window.location.replace("login.html");
}

/* =========================
   ACCESS CHECK
========================= */
function hasAccess(course) {
  const key = COURSE_KEYS[course];
  return localStorage.getItem(key) === "true";
}

/* =========================
   FMCSA START
========================= */
function startFMCSA() {
  let paid = localStorage.getItem("paid_fmcsa");
  let startDate = localStorage.getItem("fmcsa_start_date");

  // Simulated payment for now
  if (!paid) {
    localStorage.setItem("paid_fmcsa", "true");
    localStorage.setItem("fmcsa_start_date", Date.now());
  }

  window.location.href = "fmcsa.html";
}

/* =========================
   FAA MODULE ACCESS CONTROL
========================= */
function startFAA(course) {
  if (!hasAccess(course)) {
    alert(
      `${course.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`
    );
    return;
  }

  if (course === "der") {
    window.location.href = "der-training.html";
  }

  if (course === "supervisor") {
    window.location.href = "supervisor-training.html";
  }

  if (course === "employee") {
    window.location.href = "employee-training.html";
  }
}
