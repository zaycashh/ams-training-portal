/* =========================================================
   EMPLOYEE TRAINING LOGIC
   (EXACT DER PARITY – HARD LOCK ENFORCED)
========================================================= */

const EMPLOYEE_MAX_ATTEMPTS = 3;
const EMPLOYEE_PASS_PERCENTAGE = 80;
const EMPLOYEE_COOLDOWN_MINUTES = 15;

const EMPLOYEE_COMPLETED_KEY = "employeeTrainingCompleted";
const EMPLOYEE_PASSED_KEY = "employeeQuizPassed";
const EMPLOYEE_ATTEMPTS_KEY = "employeeQuizAttempts";
const EMPLOYEE_COOLDOWN_KEY = "employeeQuizCooldownUntil";

/* =========================
   TAB ACTIVE STATE
========================= */
function setActiveTab(tab) {
  document
    .querySelectorAll(".module-nav button")
    .forEach(btn => btn.classList.remove("active"));

  const map = {
    content: "btnContent",
    quiz: "btnQuiz",
    certificate: "btnCertificate"
  };

  const el = document.getElementById(map[tab]);
  if (el) el.classList.add("active");
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

function getCooldownUntil() {
  return parseInt(localStorage.getItem(EMPLOYEE_COOLDOWN_KEY) || "0", 10);
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

  /* 🧱 AUTHORITY RULES */
  if (section === "quiz") {
    if (localStorage.getItem(EMPLOYEE_PASSED_KEY) === "true") return;
  }

  if (section === "certificate") {
    if (localStorage.getItem(EMPLOYEE_PASSED_KEY) !== "true") return;
  }

  document.getElementById("contentSection").classList.add("hidden");
  document.getElementById("quizSection").classList.add("hidden");
  document.getElementById("certificateSection").classList.add("hidden");

  if (section === "content") {
    document.getElementById("contentSection").classList.remove("hidden");
    setActiveTab("content");
  }

  if (section === "quiz") {
    document.getElementById("quizSection").classList.remove("hidden");
    loadModuleQuiz();
    setActiveTab("quiz");
  }

  if (section === "certificate") {
    document.getElementById("certificateSection").classList.remove("hidden");
    setActiveTab("certificate");
    populateEmployeeCertificate();
  }
}

/* =========================
   PAGE LOAD GUARD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "employee") return;

  /* 🔐 PAYWALL */
  if (localStorage.getItem("paid_employee") !== "true") {
    alert("Employee Training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  /* 🏁 COMPLETED → CERTIFICATE ONLY */
  if (localStorage.getItem(EMPLOYEE_COMPLETED_KEY) === "true") {
    lockToEmployeeCertificate();
    return;
  }

  /* 🧠 PASSED QUIZ → CERTIFICATE TAB */
  if (localStorage.getItem(EMPLOYEE_PASSED_KEY) === "true") {
    showSection("certificate");
    return;
  }

  /* 📘 DEFAULT */
  showSection("content");
});

/* =========================
   QUIZ RESULT HANDLER
========================= */
function handleEmployeeQuizResult(score, total) {
  const percent = Math.round((score / total) * 100);
  const attempts = getAttempts() + 1;
  setAttempts(attempts);

  /* ✅ PASS */
  if (percent >= EMPLOYEE_PASS_PERCENTAGE) {
    localStorage.setItem(EMPLOYEE_PASSED_KEY, "true");
    setAttempts(0);
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

  /* ❌ MAX ATTEMPTS */
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
   CERTIFICATE HARD LOCK
========================= */
function lockToEmployeeCertificate() {
  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.remove("hidden");

  document
    .querySelectorAll(".module-nav button")
    .forEach(btn => {
      btn.disabled = true;
      btn.classList.remove("active");
    });

  setActiveTab("certificate");
  populateEmployeeCertificate();
}

/* =========================
   CERTIFICATE DATA
========================= */
function populateEmployeeCertificate() {
  document.getElementById("certName").textContent = "Employee Name";
  document.getElementById("certDate").textContent =
    new Date().toLocaleDateString();
  document.getElementById("certVerify").textContent =
    "AMS-EMP-" + Date.now();
}
