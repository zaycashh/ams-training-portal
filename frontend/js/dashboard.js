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

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  if (!company) {
    return { type: "locked", label: "🔒 No Seats Available" };
  }

  // 🔥 EMAIL-BASED CHECK
  if (company.usedSeats?.[user.email]) {
    return { type: "assigned", label: "🎟 Seat Assigned" };
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = company?.seats?.employee?.used ?? 0;
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

  if (localStorage.getItem("paid_employee") === "true") {
    btn.disabled = false;
    btn.textContent = "Start Training";
    return;
  }

  // 🔥 EMAIL-BASED CHECK
  if (company?.usedSeats?.[user?.email]) {
    btn.disabled = false;
    btn.textContent = "Continue Training";
    return;
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = company?.seats?.employee?.used ?? 0;
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

/* =========================
   EMPLOYEE BUTTON CLICK
========================= */
function handleEmployeeClick() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  // 🔒 Only employees can ever use company seats
  if (!user || user.role !== "employee") {
    alert("Only employees can use company seats.");
    return;
  }

  // Individually purchased
  if (localStorage.getItem("paid_employee") === "true") {
    startFAA("employee");
    return;
  }

  // Already assigned seat
  if (company?.usedSeats?.[user.email]) {
    startFAA("employee");
    return;
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = company?.seats?.employee?.used ?? 0;
  const remaining = total - used;

  if (remaining > 0) {
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

  if (course !== "employee" && !hasAccess(course)) {
    alert(
      `${course.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`
    );
    return;
  }

  if (
    course === "employee" &&
    !hasAccess("employee") &&
    !company?.usedSeats?.[user?.email]
  ) {
    alert(
      "Employee Training is locked.\n\nPurchase required or no company seats available."
    );
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
    alert("Access error.");
    return;
  }

  if (!company.usedSeats) {
    company.usedSeats = {};
  }

  // Already assigned
  if (company.usedSeats[user.email]) {
    window.location.href = startUrl;
    return;
  }

  if (!company.seats?.employee) {
    alert("No seat structure found.");
    return;
  }

  const total = company.seats.employee.total ?? 0;
  const used = company.seats.employee.used ?? 0;
  const remaining = total - used;

  if (remaining <= 0) {
    alert("No seats remaining.");
    return;
  }

  // ✅ Proper seat consumption
  company.seats.employee.used += 1;
  company.usedSeats[user.email] = true;

  localStorage.setItem("companyProfile", JSON.stringify(company));

  window.location.href = startUrl;
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
   console.log("DASHBOARD INIT RUNNING");

  const modACompleted =
    localStorage.getItem("fmcsaModuleACompleted") === "true";

  const modBCompleted =
    localStorage.getItem("fmcsaModuleBCompleted") === "true";

  const badgesContainer =
    document.getElementById("fmcsaCompletionBadges");

  const modABadge =
    document.getElementById("modABadge");

  const modBBadge =
    document.getElementById("modBBadge");

/* =========================
   SHOW COMPLETION BADGES (FORCED RESET)
========================= */

badgesContainer?.classList.add("hidden");
modABadge?.classList.add("hidden");
modBBadge?.classList.add("hidden");

if (modACompleted || modBCompleted) {
  badgesContainer?.classList.remove("hidden");
}

if (modACompleted) {
  modABadge?.classList.remove("hidden");
}

if (modBCompleted) {
  modBBadge?.classList.remove("hidden");
}

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  // 🔹 Employee Welcome Banner
  if (user?.role === "employee") {
    const welcome =
      document.getElementById("employeeWelcome");
    if (welcome) welcome.style.display = "block";
  }

  const status = getEmployeeSeatStatus();

  if (status) {
    const el =
      document.getElementById("employeeSeatStatus");
    if (el) {
      el.innerHTML = `
        <span class="seat-badge ${status.type}">
          ${status.label}
        </span>
      `;
    }
  }

  updateEmployeeButtonState();
  updateFMCSATimer();

  /* =========================
     FMCSA BUTTON LABEL UPDATE
  ========================= */

  const fmcsaBtn =
    document.getElementById("fmcsaBtn");

  if (fmcsaBtn && hasAccess("fmcsa")) {

    if (modACompleted && modBCompleted) {

      fmcsaBtn.textContent =
        "View FMCSA Certificates";

      fmcsaBtn.classList.remove("btn-primary");
      fmcsaBtn.classList.add("btn-secondary");

    }
    else if (modACompleted) {

      fmcsaBtn.textContent =
        "Continue FMCSA Drug & Alcohol (Module B)";

    }
    else {

      fmcsaBtn.textContent =
        "Start FMCSA Reasonable Suspicion (Module A)";
    }
  }

});
/* =========================
   PURCHASE COURSE
========================= */
function purchaseCourse(course) {

  const key = COURSE_KEYS[course];

  if (!key) {
    alert("Invalid course.");
    return;
  }

  localStorage.setItem(key, "true");

  // Special handling for FMCSA 30-day timer
  if (course === "fmcsa") {
    localStorage.setItem("fmcsa_start_date", Date.now());
  }

  alert(`${course.toUpperCase()} Training unlocked successfully!`);

  location.reload();
}
/* =========================
   HANDLE FMCSA CLICK
========================= */
function handleFMCSA() {

  if (!hasAccess("fmcsa")) {

    const confirmPurchase = confirm(
      "FMCSA Supervisor Training is required for supervisors.\n\nWould you like to purchase and unlock now?"
    );

    if (!confirmPurchase) return;

    purchaseCourse("fmcsa");
    return;
  }

  const modACompleted =
    localStorage.getItem("fmcsaModuleACompleted") === "true";

  const modBCompleted =
    localStorage.getItem("fmcsaModuleBCompleted") === "true";

  // ✅ BOTH COMPLETED → Go to certificates page
  if (modACompleted && modBCompleted) {
    window.location.href = "fmcsa-certificates.html";
    return;
  }

  // ✅ Only A done → go to Module B
  if (modACompleted && !modBCompleted) {
    window.location.href = "fmcsa-drug-alcohol.html";
    return;
  }

  // ❌ Nothing done → go to Module A
  window.location.href = "fmcsa-module-a.html";
}
/* =========================
   FMCSA COUNTDOWN DISPLAY
========================= */
function updateFMCSATimer() {

  const timerEl = document.getElementById("fmcsaTimer");
  if (!timerEl) return;

  if (!hasAccess("fmcsa")) {
    timerEl.innerHTML = "";
    return;
  }

  const start = localStorage.getItem("fmcsa_start_date");
  if (!start) return;

  const DAY_MS = 86400000;
  const LIMIT_DAYS = 30;

  const elapsed = Date.now() - Number(start);
  const daysUsed = Math.floor(elapsed / DAY_MS);
  const daysLeft = LIMIT_DAYS - daysUsed;

  if (daysLeft <= 0) {
    timerEl.innerHTML =
      `<span style="color:red;font-weight:600;">
        ⚠ Training window expired
      </span>`;
    return;
  }

  timerEl.innerHTML =
    `<span style="color:#b8860b;font-weight:600;">
      ⏳ ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining
    </span>`;
}
