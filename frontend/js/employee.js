/* =========================================================
   EMPLOYEE TRAINING LOGIC
   (EXACT DER PARITY – HARD LOCK + UI STATES)
========================================================= */

const EMPLOYEE_MAX_ATTEMPTS = 3;
const EMPLOYEE_PASS_PERCENTAGE = 80;
const EMPLOYEE_COOLDOWN_MINUTES = 15;

const EMPLOYEE_COMPLETED_KEY = "employeeTrainingCompleted";
const EMPLOYEE_PASSED_KEY = "employeeQuizPassed";
const EMPLOYEE_ATTEMPTS_KEY = "employeeQuizAttempts";
const EMPLOYEE_COOLDOWN_KEY = "employeeQuizCooldownUntil";

/* =========================
   TAB ACTIVE / COMPLETED STATE
========================= */
function setActiveTab(tab) {
  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.classList.remove("active");
  });

  const map = {
    content: "btnContent",
    quiz: "btnQuiz",
    certificate: "btnCertificate"
  };

  const el = document.getElementById(map[tab]);
  if (el) el.classList.add("active");
}

function markCompletedTabs() {
  document.getElementById("btnContent")?.classList.add("completed");
  document.getElementById("btnQuiz")?.classList.add("completed");
}

/* =========================
   STATE HELPERS
========================= */
function getAttempts() {
  return parseInt(localStorage.getItem(EMPLOYEE_ATTEMPTS_KEY) || "0", 10);
}

function setAttempts(v) {
  localStorage.setItem(EMPLOYEE_ATTEMPTS_KEY, v);
}

/* =========================
   SECTION NAVIGATION (GUARDED)
========================= */
function showSection(section) {

  /* 🔒 HARD LOCK AFTER COMPLETION */
  if (localStorage.getItem(EMPLOYEE_COMPLETED_KEY) === "true") {
    lockToEmployeeCertificate();
    return;
  }

  /* 🚫 AUTHORITY RULES */
  if (section === "quiz" && localStorage.getItem(EMPLOYEE_PASSED_KEY) === "true") return;
  if (section === "certificate" && localStorage.getItem(EMPLOYEE_PASSED_KEY) !== "true") return;

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

/* =========================
   PAGE LOAD GUARD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "employee") return;

  if (localStorage.getItem("paid_employee") !== "true") {
    alert("Employee Training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  if (localStorage.getItem(EMPLOYEE_COMPLETED_KEY) === "true") {
    lockToEmployeeCertificate();
    return;
  }

  showSection("content");
});

/* =========================
   QUIZ RESULT HANDLER
========================= */
function handleEmployeeQuizResult(score, total) {
  const percent = Math.round((score / total) * 100);
  const attempts = getAttempts() + 1;
  setAttempts(attempts);

  /* ✅ PASSED */
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

  /* ❌ LOCKOUT */
  if (attempts >= EMPLOYEE_MAX_ATTEMPTS) {
    localStorage.setItem(
      EMPLOYEE_COOLDOWN_KEY,
      Date.now() + EMPLOYEE_COOLDOWN_MINUTES * 60 * 1000
    );

    document.getElementById("quizSection").innerHTML = `
      <h2>Too Many Attempts</h2>
      <p>Please wait ${EMPLOYEE_COOLDOWN_MINUTES} minutes.</p>
    `;
    return;
  }

  /* ❌ RETRY */
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
   FINALIZE TRAINING (HARD LOCK)
========================= */
function finishEmployeeTraining() {
  localStorage.setItem(EMPLOYEE_COMPLETED_KEY, "true");
  lockToEmployeeCertificate();
}

/* =========================
   CERTIFICATE HARD LOCK + UI
========================= */
function lockToEmployeeCertificate() {
  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.remove("hidden");

  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.disabled = true;
    btn.classList.remove("active");
  });

  markCompletedTabs();

  const certBtn = document.getElementById("btnCertificate");
  if (certBtn) {
    certBtn.disabled = false;
    certBtn.classList.add("active");
  }

  populateEmployeeCertificate();
}

/* =========================
   CERTIFICATE + QR
========================= */
function populateEmployeeCertificate() {
  const code = "AMS-EMP-" + Date.now();

  document.getElementById("certName").textContent = "Employee Name";
  document.getElementById("certDate").textContent =
    new Date().toLocaleDateString();
  document.getElementById("certVerify").textContent = code;

  const qrBox = document.getElementById("certQR");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: code,
      width: 128,
      height: 128
    });
  }
}
