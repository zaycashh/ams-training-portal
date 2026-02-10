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
  const paidKey = COURSE_KEYS[course];
  return localStorage.getItem(paidKey) === "true";
}
/* =========================
   EMPLOYEE SEAT STATUS UI
   (DISPLAY ONLY)
========================= */
function getEmployeeSeatStatus() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user || user.role !== "employee") return null;

  // Individually paid employee
  if (localStorage.getItem("paid_employee") === "true") {
    return {
      type: "paid",
      label: "✔ Individually Purchased"
    };
  }

  // Seat already locked to this user
  if (user.employeeSeatLocked === true) {
    return {
      type: "assigned",
      label: "🎟️ Seat Assigned"
    };
  }

  // Show remaining seats (if any)
  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  const seatData = company?.seats?.employee;

  if (!seatData) {
    return {
      type: "locked",
      label: "🔒 Not Available"
    };
  }

  const remaining = seatData.total - seatData.used;

  if (remaining > 0) {
    return {
      type: "available",
      label: `${remaining} Seat${remaining > 1 ? "s" : ""} Remaining`
    };
  }

  return {
    type: "full",
    label: "❌ No Seats Available"
  };
}
/* =========================
   EMPLOYEE BUTTON STATE (UI ONLY)
========================= */
function updateEmployeeButtonState() {
  const btn = document.getElementById("employeeBtn");
  if (!btn) return;

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  // Paid employee → enabled
  if (localStorage.getItem("paid_employee") === "true") {
    btn.disabled = false;
    btn.textContent = "Start Training";
    return;
  }

  // Seat already assigned → enabled
  if (user?.employeeSeatLocked === true) {
    btn.disabled = false;
    btn.textContent = "Continue Training";
    return;
  }

  // Seats available → enabled
  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  const seatData = company?.seats?.employee;

  if (seatData && seatData.total - seatData.used > 0) {
    btn.disabled = false;
    btn.textContent = "Use Company Seat";
    return;
  }

  // No access
  btn.disabled = true;
  btn.textContent = "No Seats Available";
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

function startFAA(course) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  // 🔒 DER & Supervisor = individual purchase ONLY
  if (course !== "employee" && !hasAccess(course)) {
    alert(
      `${course.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`
    );
    return;
  }

  // 🪑 Employee = paid OR seat-locked
  if (
    course === "employee" &&
    !hasAccess("employee") &&
    user?.employeeSeatLocked !== true
  ) {
    alert(
      "Employee Training is locked.\n\nPurchase required or no company seats available."
    );
    return;
  }

  // 🚀 Route only (NO seat logic here)
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
