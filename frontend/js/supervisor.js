/* =========================================================
   SUPERVISOR TRAINING LOGIC
   COMPLIANCE-GRADE (MULTI-USER SAFE)
========================================================= */

const SUPERVISOR_MAX_ATTEMPTS = 3;
const SUPERVISOR_PASS_PERCENTAGE = 80;
const SUPERVISOR_COOLDOWN_MINUTES = 15;

/* =========================
   USER CONTEXT
========================= */

const user = JSON.parse(localStorage.getItem("amsUser") || "null");
const USER_EMAIL = user?.email || "guest";

/* =========================
   USER-SCOPED STORAGE KEYS
========================= */

const SUPERVISOR_CONTENT_DONE_KEY = `supervisorContentCompleted_${USER_EMAIL}`;
const SUPERVISOR_PASSED_KEY = `supervisorQuizPassed_${USER_EMAIL}`;
const SUPERVISOR_COMPLETED_KEY = `supervisorTrainingCompleted_${USER_EMAIL}`;
const SUPERVISOR_ATTEMPTS_KEY = `supervisorQuizAttempts_${USER_EMAIL}`;
const SUPERVISOR_COOLDOWN_KEY = `supervisorQuizCooldownUntil_${USER_EMAIL}`;
const SUPERVISOR_CERT_CODE_KEY = `supervisorCertificateCode_${USER_EMAIL}`;

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
   SECTION NAVIGATION
========================= */

function showSection(section) {

  if (localStorage.getItem(SUPERVISOR_COMPLETED_KEY) === "true") {
    lockToSupervisorCertificate();
    return;
  }

  if (section === "quiz") {
    if (localStorage.getItem(SUPERVISOR_CONTENT_DONE_KEY) !== "true") return;
  }

  if (section === "certificate") {
    if (localStorage.getItem(SUPERVISOR_PASSED_KEY) !== "true") return;
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
    populateSupervisorCertificate();
  }

}

/* =========================
   PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {

  if (document.body.dataset.module !== "supervisor") return;

  if (localStorage.getItem("paid_supervisor") !== "true") {

    alert("Supervisor Training requires purchase.");
    window.location.href = "../pages/dashboard.html";
    return;

  }

  if (localStorage.getItem(SUPERVISOR_COMPLETED_KEY) === "true") {

    lockToSupervisorCertificate();
    return;

  }

  showSection("content");

});

/* =========================
   CONTENT COMPLETION
========================= */

function completeSupervisorContent() {

  localStorage.setItem(SUPERVISOR_CONTENT_DONE_KEY, "true");
  showSection("quiz");

}

/* =========================
   QUIZ RESULT HANDLER
========================= */

function handleSupervisorQuizResult(score, total) {

  const percent = Math.round((score / total) * 100);

  const attempts =
    parseInt(localStorage.getItem(SUPERVISOR_ATTEMPTS_KEY) || "0", 10) + 1;

  localStorage.setItem(SUPERVISOR_ATTEMPTS_KEY, attempts);

  if (percent >= SUPERVISOR_PASS_PERCENTAGE) {

    localStorage.setItem(SUPERVISOR_PASSED_KEY, "true");
    localStorage.removeItem(SUPERVISOR_ATTEMPTS_KEY);
    localStorage.removeItem(SUPERVISOR_COOLDOWN_KEY);

    document.getElementById("quizSection").innerHTML = `
      <h2>Training Completed</h2>
      <p>You scored ${percent}%</p>
      <button class="btn-primary" onclick="finishSupervisorTraining()">
        Finish Training
      </button>
    `;

    return;

  }

  if (attempts >= SUPERVISOR_MAX_ATTEMPTS) {

    localStorage.setItem(
      SUPERVISOR_COOLDOWN_KEY,
      Date.now() + SUPERVISOR_COOLDOWN_MINUTES * 60000
    );

    document.getElementById("quizSection").innerHTML = `
      <h2>Too Many Attempts</h2>
      <p>Please wait ${SUPERVISOR_COOLDOWN_MINUTES} minutes.</p>
    `;

    return;

  }

  document.getElementById("quizSection").innerHTML = `
    <h2>Quiz Failed</h2>
    <p>You scored ${percent}%</p>
    <p>Attempts remaining: ${SUPERVISOR_MAX_ATTEMPTS - attempts}</p>
    <button class="btn-primary" onclick="showSection('quiz')">
      Retry Quiz
    </button>
  `;

}

/* =========================
   FINALIZE TRAINING
========================= */

function finishSupervisorTraining() {

  if (!localStorage.getItem(SUPERVISOR_CERT_CODE_KEY)) {

    localStorage.setItem(
      SUPERVISOR_CERT_CODE_KEY,
      "AMS-SUP-" + Date.now()
    );

  }

  localStorage.setItem(SUPERVISOR_COMPLETED_KEY, "true");

  lockToSupervisorCertificate();

}

/* =========================
   CERTIFICATE LOCK
========================= */

function lockToSupervisorCertificate() {

  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.remove("hidden");

  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.disabled = true;
  });

  setActiveTab("certificate");

  populateSupervisorCertificate();

}

/* =========================
   CERTIFICATE GENERATION
========================= */
function populateSupervisorCertificate() {

  let code = localStorage.getItem(SUPERVISOR_CERT_CODE_KEY);

  if (!code) {

    code = "AMS-SUP-" + Date.now();
    localStorage.setItem(SUPERVISOR_CERT_CODE_KEY, code);

  }

  /* REGISTER CERTIFICATE ONLY ON FIRST GENERATION */

  if (!localStorage.getItem(`supervisorCertRegistered_${USER_EMAIL}`)) {

    if (typeof registerCertificate === "function") {

      registerCertificate({
        id: code,
        name: user.fullName || (user.firstName + " " + user.lastName),
        course: "Supervisor Reasonable Suspicion Training",
        date: Date.now()
      });

      localStorage.setItem(`supervisorCertRegistered_${USER_EMAIL}`, "true");

    }

  }

  /* Populate certificate fields */

  if (user) {

    document.getElementById("certName").textContent =
      user.fullName || (user.firstName + " " + user.lastName);

  }

  document.getElementById("certDate").textContent =
    new Date().toLocaleDateString();

  document.getElementById("certVerify").textContent = code;

  /* Generate verification QR */

  const qrBox = document.getElementById("certQR");

  if (qrBox && typeof QRCode !== "undefined") {

    qrBox.innerHTML = "";

    const verifyURL =
      window.location.origin +
      "/ams-training-portal/frontend/pages/verify.html?id=" +
      code;

    new QRCode(qrBox, {
      text: verifyURL,
      width: 128,
      height: 128
    });

  }

}
