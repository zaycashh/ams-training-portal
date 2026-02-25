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

  if (localStorage.getItem("paid_employee") === "true") {
    return { type: "paid", label: "✔ Individually Purchased" };
  }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");
  if (!company) {
    return { type: "locked", label: "🔒 No Seats Available" };
  }

  if (company.usedSeats?.[user.email]) {
    return { type: "assigned", label: "🎟 Seat Assigned" };
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = Object.keys(company?.usedSeats || {}).length;
  const remaining = total - used;

  if (remaining > 0) {
    return {
      type: "available",
      label: `${remaining} Seat${remaining > 1 ? "s" : ""} Remaining`
    };
  }

  return { type: "locked", label: "🔒 No Seats Available" };
}

/* =========================
   EMPLOYEE BUTTON STATE
========================= */
function updateEmployeeButtonState() {
  const btn = document.getElementById("employeeBtn");
  if (!btn) return;

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  // 🔵 INDIVIDUAL ACCOUNT LOGIC
  if (user?.role === "individual") {
    const btn = document.getElementById("employeeBtn");
    if (!btn) return;

    if (localStorage.getItem("paid_employee") === "true") {
      btn.disabled = false;
      btn.textContent = "Start Training";
      btn.onclick = () => startFAA("employee");
    } else {
      btn.disabled = false;
      btn.textContent = "Locked — Purchase Required";
      btn.onclick = () =>
        (window.location.href = "../pages/payment.html?module=employee");
    }

    return; // 🚨 VERY IMPORTANT — stops seat logic below
  }

  if (localStorage.getItem("paid_employee") === "true") {
    btn.disabled = false;
    btn.textContent = "Start Training";
    return;
  }

  if (company?.usedSeats?.[user?.email]) {
    btn.disabled = false;
    btn.textContent = "Continue Training";
    return;
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = Object.keys(company?.usedSeats || {}).length;
  const remaining = total - used;

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

function handleEmployeeClick() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user) {
    showToast("Please log in.", "error");
    return;
  }

  // 🟢 INDIVIDUAL PURCHASE
  if (
    user.role === "individual" &&
    localStorage.getItem("paid_employee") === "true"
  ) {
    startFAA("employee");
    return;
  }

  // 🟢 COMPANY SEAT
  if (
    user.role === "employee" &&
    company?.usedSeats?.[user.email]
  ) {
    startFAA("employee");
    return;
  }

  // 🟡 INDIVIDUAL NOT PAID
  if (user.role === "individual") {
    window.location.href = "../pages/payment.html?module=employee";
    return;
  }

  // 🔴 BLOCK EVERYTHING ELSE
  showToast("This training is available through company enrollment only.", "warning");
}

/* =========================
   START FAA COURSES
========================= */
function startFAA(course) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (course !== "employee" && !hasAccess(course)) {
    alert(`${course.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`);
    return;
  }

  if (
    course === "employee" &&
    !hasAccess("employee") &&
    !company?.usedSeats?.[user?.email]
  ) {
    alert("Employee Training is locked.\n\nPurchase required or no company seats available.");
    return;
  }

  window.location.href = `${course}-training.html`;
}

/* =========================
   CONSUME EMPLOYEE SEAT
========================= */
function consumeEmployeeSeatAndStart(startUrl) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user || !company) {
    showToast("Access error. Please refresh.", "error");
    return;
  }

  if (!company.usedSeats) {
    company.usedSeats = {};
  }

  if (company.usedSeats[user.email]) {
    window.location.href = startUrl;
    return;
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = Object.keys(company?.usedSeats || {}).length;
  const remaining = total - used;

  if (remaining <= 0) {
    showToast("No seats remaining.", "warning");
    return;
  }

  company.usedSeats[user.email] = true;
  localStorage.setItem("companyProfile", JSON.stringify(company));

  window.location.href = startUrl;
}

function updateFMCSATimer() {
  const paid = localStorage.getItem("paid_fmcsa") === "true";
  if (!paid) return;

  const purchaseDate = localStorage.getItem("fmcsaPurchaseDate");
  if (!purchaseDate) return;

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const expiration = parseInt(purchaseDate) + THIRTY_DAYS;
  const remaining = expiration - now;

  const fmcsaCard = document.getElementById("fmcsaCard");
  if (!fmcsaCard) return;

  if (remaining <= 0) {
    // Expired
    localStorage.removeItem("paid_fmcsa");
    localStorage.removeItem("fmcsaPurchaseDate");

    const btn = fmcsaCard.querySelector("button");
    if (btn) {
      btn.textContent = "Expired — Purchase Required";
      btn.onclick = () =>
        (window.location.href = "../pages/payment.html?module=fmcsa");
    }

    return;
  }

  const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));

  const info = fmcsaCard.querySelector(".fmcsa-timer");
  if (info) {
    info.textContent = `Access expires in ${daysLeft} day${
      daysLeft > 1 ? "s" : ""
    }`;
  }
}
/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  /* 🔒 Hide FMCSA for employees */
  if (user?.role === "employee") {
    const fmcsaSection = document.querySelector(".fmcsa-section");
    if (fmcsaSection) {
      fmcsaSection.style.display = "none";
    }
  }

  /* Global Notice */
  const notice = sessionStorage.getItem("ams_notice");
  if (notice) {
    showToast(notice);
    sessionStorage.removeItem("ams_notice");
  }

  /* Employee Welcome */
  if (user?.role === "employee") {
    const welcome = document.getElementById("employeeWelcome");
    if (welcome) welcome.style.display = "block";
  }

  const status = getEmployeeSeatStatus();
  if (status) {
    const el = document.getElementById("employeeSeatStatus");
    if (el) {
      el.innerHTML = `<span class="seat-badge ${status.type}">${status.label}</span>`;
    }
  }

  updateEmployeeButtonState();
  updateFMCSATimer();
});

/* =========================
   TOAST
========================= */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `ams-toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
