/* =========================================================
   EMPLOYEE TRAINING LOGIC
   (MATCHES DER LOGIC EXACTLY)
========================================================= */

const EMPLOYEE_MAX_ATTEMPTS = 3;
const EMPLOYEE_PASS_PERCENTAGE = 80;
const EMPLOYEE_COOLDOWN_MINUTES = 15;

/* =========================
   STATE HELPERS
========================= */

function getEmployeeAttempts() {
  return parseInt(localStorage.getItem("employeeQuizAttempts") || "0", 10);
}

function setEmployeeAttempts(val) {
  localStorage.setItem("employeeQuizAttempts", val);
}

function getEmployeeCooldown() {
  return parseInt(
    localStorage.getItem("employeeQuizCooldownUntil") || "0",
    10
  );
}

function setEmployeeCooldown(ts) {
  localStorage.setItem("employeeQuizCooldownUntil", ts);
}

/* =========================
   PAGE LOAD GUARD
========================= */

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "employee") return;

  // 🔐 Paywall
  if (localStorage.getItem("paid_employee") !== "true") {
    alert("Employee Training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  // ✅ Already completed → certificate ONLY
  if (localStorage.getItem("employeeTrainingCompleted") === "true") {
    lockToEmployeeCertificate();
    return;
  }

  // ⏳ Cooldown enforcement
  const cooldownUntil = getEmployeeCooldown();
  if (cooldownUntil && Date.now() < cooldownUntil) {
    const mins = Math.ceil((cooldownUntil - Date.now()) / 60000);
    alert(`Too many failed attempts. Try again in ${mins} minutes.`);
    showSection("content");
  }
});

/* =========================
   QUIZ RESULT HANDLER
========================= */

function handleEmployeeQuizResult(score, total) {
  const percentage = Math.round((score / total) * 100);
  const attempts = getEmployeeAttempts() + 1;
  setEmployeeAttempts(attempts);

  // ✅ PASSED
  if (percentage >= EMPLOYEE_PASS_PERCENTAGE) {
    localStorage.setItem("employeeQuizPassed", "true");
    setEmployeeAttempts(0);
    localStorage.removeItem("employeeQuizCooldownUntil");

    document.getElementById("quizSection").innerHTML = `
      <h2>Training Completed</h2>
      <p>You scored ${percentage}%</p>

      <button class="btn-primary" onclick="finishEmployeeTraining()">
        Finish Training
      </button>
    `;
    return;
  }

  // ❌ FAILED — LOCKOUT
  if (attempts >= EMPLOYEE_MAX_ATTEMPTS) {
    const cooldownUntil =
      Date.now() + EMPLOYEE_COOLDOWN_MINUTES * 60 * 1000;
    setEmployeeCooldown(cooldownUntil);

    document.getElementById("quizSection").innerHTML = `
      <h2>Too Many Attempts</h2>
      <p>You must wait ${EMPLOYEE_COOLDOWN_MINUTES} minutes before retrying.</p>
    `;
    return;
  }

  // ❌ FAILED — RETRY ALLOWED
  document.getElementById("quizSection").innerHTML = `
    <h2>Quiz Failed</h2>
    <p>You scored ${percentage}%</p>
    <p>Attempts remaining: ${
      EMPLOYEE_MAX_ATTEMPTS - attempts
    }</p>

    <button class="btn-primary" onclick="showSection('quiz')">
      Retry Quiz
    </button>
  `;
}

/* =========================
   FINISH TRAINING (HARD LOCK)
========================= */

function finishEmployeeTraining() {
  localStorage.setItem("employeeTrainingCompleted", "true");
  lockToEmployeeCertificate();
}

/* =========================
   EMPLOYEE CERTIFICATE HARD LOCK
========================= */

function lockToEmployeeCertificate() {
  // 🔒 Hide everything
  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");

  // 🔒 Disable nav buttons (this is the missing piece)
  document
    .querySelectorAll(".module-nav button")
    .forEach(btn => (btn.disabled = true));

  // ✅ Show certificate ONLY
  document
    .getElementById("certificateSection")
    ?.classList.remove("hidden");
}
