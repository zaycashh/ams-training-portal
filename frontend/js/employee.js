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

  // 🔒 Hard lock after completion
  if (localStorage.getItem(EMPLOYEE_COMPLETED_KEY) === "true") {
    lockToCertificate();
    return;
  }

  // 🚫 Quiz blocked until content completed
  if (section === "quiz") {
    if (localStorage.getItem(EMPLOYEE_CONTENT_DONE_KEY) !== "true") return;
  }

  // 🚫 Certificate blocked until quiz passed
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

/* =========================
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "employee") return;

  if (localStorage.getItem("paid_employee") !== "true") {
    alert("Employee Training requires purchase.");
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
  // 🔒 Generate certificate code ONCE
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
    new QRCode(qrBox, {
      text: code,
      width: 128,
      height: 128
    });
  } else {
    console.warn("QR container or QRCode library missing");
  }
}
