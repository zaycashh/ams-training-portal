/* =========================================================
   EMPLOYEE TRAINING LOGIC
   COMPLIANCE-GRADE FLOW (LOCKED + VERIFIED)
========================================================= */

const EMPLOYEE_MAX_ATTEMPTS = 3;
const EMPLOYEE_PASS_PERCENTAGE = 80;
const EMPLOYEE_COOLDOWN_MINUTES = 15;

const EMPLOYEE_CONTENT_DONE_KEY = "employeeContentCompleted";
const EMPLOYEE_PASSED_KEY = "employeeQuizPassed";
const EMPLOYEE_COMPLETED_KEY = "employeeTrainingCompleted";
const EMPLOYEE_ATTEMPTS_KEY = "employeeQuizAttempts";
const EMPLOYEE_COOLDOWN_KEY = "employeeQuizCooldownUntil";
const EMPLOYEE_CERT_CODE_KEY = "employeeCertificateCode";

/* =========================
   TAB STATES
========================= */
function setActiveTab(tab) {
  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.classList.remove("active", "completed");
  });

  if (tab === "content") {
    document.getElementById("btnContent")?.classList.add("active");
  }

  if (tab === "quiz") {
    document.getElementById("btnContent")?.classList.add("completed");
    document.getElementById("btnQuiz")?.classList.add("active");
  }

  if (tab === "certificate") {
    document.getElementById("btnContent")?.classList.add("completed");
    document.getElementById("btnQuiz")?.classList.add("completed");
    document.getElementById("btnCertificate")?.classList.add("active");
  }
}

/* =========================
   SECTION NAVIGATION (HARD GUARDED)
========================= */
function showSection(section) {
  if (localStorage.getItem(EMPLOYEE_COMPLETED_KEY) === "true") {
    lockToCertificate();
    return;
  }

  if (section === "quiz") {
    if (localStorage.getItem(EMPLOYEE_CONTENT_DONE_KEY) !== "true") return;
  }

  if (section === "certificate") {
    if (localStorage.getItem(EMPLOYEE_PASSED_KEY) !== "true") return;
  }

  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.add("hidden");

  if (section === "content") {
    document.getElementById("contentSection")?.classList.remove("hidden");
    setActiveTab("content");
  }

  if (section === "quiz") {
    document.getElementById("quizSection")?.classList.remove("hidden");
    setActiveTab("quiz");
    loadModuleQuiz();
  }

  if (section === "certificate") {
    document.getElementById("certificateSection")?.classList.remove("hidden");
    setActiveTab("certificate");
    populateEmployeeCertificate();
  }
}

/* =========================================================
   EMPLOYEE SEAT CONSUMPTION (ONE-TIME, COMPANY ONLY)
========================================================= */
function consumeEmployeeSeatIfNeeded() {
  const user = JSON.parse(localStorage.getItem("amsUser"));
  if (!user || user.role !== "employee") return;

  // Already paid individually OR seat already locked
  if (
    localStorage.getItem("paid_employee") === "true" ||
    user.employeeSeatLocked === true
  ) {
    return;
  }

  const company = JSON.parse(localStorage.getItem("companyProfile"));
  if (!company?.seats?.employee) {
    alert("Company seat data missing.");
    window.location.href = "dashboard.html";
    return;
  }

  const seatData = company.seats.employee;
  const available = seatData.total - seatData.used;

  if (available <= 0) {
    alert("No employee training seats available.");
    window.location.href = "dashboard.html";
    return;
  }

  // ✅ Consume ONE seat
  seatData.used += 1;
  user.employeeSeatLocked = true;

  localStorage.setItem("companyProfile", JSON.stringify(company));
  localStorage.setItem("amsUser", JSON.stringify(user));

  console.log("✅ Employee seat consumed + locked");
}

/* =========================
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "employee") return;

  const user = JSON.parse(localStorage.getItem("amsUser"));

  // 🪑 Seat logic ONLY for company employees
  if (user?.role === "employee") {
    consumeEmployeeSeatIfNeeded();
  }

  // ✅ Allow: individual purchase OR company seat
  if (
    localStorage.getItem("paid_employee") !== "true" &&
    user?.employeeSeatLocked !== true
  ) {
    alert("Employee Training requires purchase or an available company seat.");
    window.location.href = "dashboard.html";
    return;
  }

  if (localStorage.getItem(EMPLOYEE_COMPLETED_KEY) === "true") {
    lockToCertificate();
    return;
  }

  showSection("content");
});

/* =========================
   CONTENT COMPLETION
========================= */
function completeEmployeeContent() {
  localStorage.setItem(EMPLOYEE_CONTENT_DONE_KEY, "true");
  showSection("quiz");
}

/* =========================
   QUIZ RESULT HANDLER
========================= */
function handleEmployeeQuizResult(score, total) {
  const percent = Math.round((score / total) * 100);
  const attempts =
    parseInt(localStorage.getItem(EMPLOYEE_ATTEMPTS_KEY) || "0", 10) + 1;

  localStorage.setItem(EMPLOYEE_ATTEMPTS_KEY, attempts);

  if (percent >= EMPLOYEE_PASS_PERCENTAGE) {
    localStorage.setItem(EMPLOYEE_PASSED_KEY, "true");
    localStorage.removeItem(EMPLOYEE_ATTEMPTS_KEY);
    localStorage.removeItem(EMPLOYEE_COOLDOWN_KEY);

    document.getElementById("quizSection").innerHTML = `
      <h2>Training Completed</h2>
      <p>You scored ${percent}%</p>
      <button class="btn-primary" onclick="finishEmployeeTraining()">
        Finish Training
      </button>
    `;
    return;
  }

  if (attempts >= EMPLOYEE_MAX_ATTEMPTS) {
    localStorage.setItem(
      EMPLOYEE_COOLDOWN_KEY,
      Date.now() + EMPLOYEE_COOLDOWN_MINUTES * 60000
    );

    document.getElementById("quizSection").innerHTML = `
      <h2>Too Many Attempts</h2>
      <p>Please wait ${EMPLOYEE_COOLDOWN_MINUTES} minutes.</p>
    `;
    return;
  }

  document.getElementById("quizSection").innerHTML = `
    <h2>Quiz Failed</h2>
    <p>You scored ${percent}%</p>
    <p>Attempts remaining: ${EMPLOYEE_MAX_ATTEMPTS - attempts}</p>
    <button class="btn-primary" onclick="showSection('quiz')">
      Retry Quiz
    </button>
  `;
}

/* =========================
   FINALIZE TRAINING
========================= */
function finishEmployeeTraining() {
  localStorage.setItem(EMPLOYEE_COMPLETED_KEY, "true");
  lockToCertificate();
}

/* =========================
   CERTIFICATE LOCK + QR
========================= */
function lockToCertificate() {
  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.remove("hidden");

  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.disabled = true;
  });

  setActiveTab("certificate");
  populateEmployeeCertificate();
}

function populateEmployeeCertificate() {
  let code = localStorage.getItem(EMPLOYEE_CERT_CODE_KEY);

  if (!code) {
    code = "AMS-EMP-" + Date.now();
    localStorage.setItem(EMPLOYEE_CERT_CODE_KEY, code);
  }

  document.getElementById("certName").textContent = "Employee Name";
  document.getElementById("certDate").textContent =
    new Date().toLocaleDateString();
  document.getElementById("certVerify").textContent = code;

  const qrBox = document.getElementById("certQR");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    new QRCode(qrBox, { text: code, width: 128, height: 128 });
  }
}

/* =========================
   CONTENT → QUIZ BUTTON
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("continueToQuizBtn");
  if (btn) btn.addEventListener("click", completeEmployeeContent);
});
