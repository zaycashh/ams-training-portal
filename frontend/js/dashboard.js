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
  localStorage.removeItem("amsUser");
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
   EMPLOYEE SEAT STATUS
========================= */
function getEmployeeSeatStatus() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user || user.role !== "employee") return null;

  // Individually purchased
  if (localStorage.getItem("paid_employee") === "true") {
    return {
      type: "paid",
      label: "✔ Individually Purchased"
    };
  }

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  if (!company) {
    return {
      type: "locked",
      label: "🔒 No Seats Available"
    };
  }

  // Seat already assigned to this user
  if (company.usedSeats && company.usedSeats[user.id]) {
    return {
      type: "assigned",
      label: "🎟 Seat Assigned"
    };
  }

  const remaining = company.seats?.employee ?? 0;

  if (remaining > 0) {
    return {
      type: "available",
      label: `${remaining} Seat${remaining > 1 ? "s" : ""} Remaining`
    };
  }

  return {
    type: "locked",
    label: "🔒 No Seats Available"
  };
}
/* =========================
   EMPLOYEE BUTTON STATE
========================= */
function updateEmployeeButtonState() {
  const btn = document.getElementById("employeeBtn");
  if (!btn) return;

  btn.title = "";

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  // Individually paid
  if (localStorage.getItem("paid_employee") === "true") {
    btn.disabled = false;
    btn.textContent = "Start Training";
    return;
  }

  // Seat already assigned
  if (company?.usedSeats && company.usedSeats[user?.id]) {
    btn.disabled = false;
    btn.textContent = "Continue Training";
    return;
  }

  const remaining = company?.seats?.employee ?? 0;

  if (remaining > 0) {
    btn.disabled = false;
    btn.textContent = "Use Company Seat";
    btn.title =
      "Uses 1 company seat. This seat will be permanently assigned once training starts.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "No Seats Available";
}

/* =========================
   EMPLOYEE BUTTON CLICK
========================= */
function handleEmployeeClick() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  // Individually purchased
  if (localStorage.getItem("paid_employee") === "true") {
    startFAA("employee");
    return;
  }

  // Seat already assigned
  if (company?.usedSeats?.[user?.id]) {
    startFAA("employee");
    return;
  }

  // Seats available → consume one
  if (company?.seats?.employee > 0) {
    consumeEmployeeSeatAndStart("employee-training.html");
    return;
  }

  alert("No seats available or purchase required.");
}

/* =========================
   START FAA COURSES
========================= */
function startFAA(course) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  // DER & Supervisor = purchase required
  if (course !== "employee" && !hasAccess(course)) {
    alert(
      `${course.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`
    );
    return;
  }

  // Employee logic
  if (
    course === "employee" &&
    !hasAccess("employee") &&
    !company?.usedSeats?.[user?.id]
  ) {
    alert(
      "Employee Training is locked.\n\nPurchase required or no company seats available."
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

/* =========================
   CONSUME EMPLOYEE SEAT
========================= */
function consumeEmployeeSeatAndStart(startUrl) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user || !company) {
    alert("Access error.");
    return;
  }

  if (!company.usedSeats) {
    company.usedSeats = {};
  }

  // Already assigned
  if (company.usedSeats[user.id]) {
    window.location.href = startUrl;
    return;
  }

  if (!company.seats || company.seats.employee <= 0) {
    alert("No seats remaining.");
    return;
  }

  // Deduct + lock seat
  company.seats.employee -= 1;
  company.usedSeats[user.id] = true;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  window.location.href = startUrl;
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const status = getEmployeeSeatStatus();

  if (status) {
    const el = document.getElementById("employeeSeatStatus");
    if (el) {
      el.innerHTML = `
        <span class="seat-badge ${status.type}">
          ${status.label}
        </span>
      `;
    }
  }

  updateEmployeeButtonState();
});
