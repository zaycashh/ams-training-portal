/* =========================================================
   DER TRAINING LOGIC
   COMPLIANCE-GRADE (MULTI-USER SAFE)
========================================================= */

const DER_MAX_ATTEMPTS = 3;
const DER_PASS_PERCENTAGE = 80;
const DER_COOLDOWN_MINUTES = 15;

/* =========================
   USER CONTEXT
========================= */

const user = JSON.parse(localStorage.getItem("amsUser") || "null");
const USER_EMAIL = user?.email || "guest";

/* =========================
   USER-SCOPED STORAGE KEYS
========================= */

const DER_CONTENT_DONE_KEY = `derContentCompleted_${USER_EMAIL}`;
const DER_PASSED_KEY = `derQuizPassed_${USER_EMAIL}`;
const DER_COMPLETED_KEY = `derTrainingCompleted_${USER_EMAIL}`;
const DER_ATTEMPTS_KEY = `derQuizAttempts_${USER_EMAIL}`;
const DER_COOLDOWN_KEY = `derQuizCooldownUntil_${USER_EMAIL}`;
const DER_CERT_CODE_KEY = `derCertificateCode_${USER_EMAIL}`;
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

  if (localStorage.getItem(DER_COMPLETED_KEY) === "true") {
    lockToDerCertificate();
    return;
  }

  if (section === "quiz") {
    if (localStorage.getItem(DER_CONTENT_DONE_KEY) !== "true") return;
  }

  if (section === "certificate") {
    if (localStorage.getItem(DER_PASSED_KEY) !== "true") return;
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
    populateDerCertificate();
  }

}/* =========================
   PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {

  if (document.body.dataset.module !== "der") return;

  if (localStorage.getItem("paid_der") !== "true") {

    alert("DER Training requires purchase.");
    window.location.href = "../pages/dashboard.html";
    return;

  }

  if (localStorage.getItem(DER_COMPLETED_KEY) === "true") {

    lockToDerCertificate();
    return;

  }

  showSection("content");

});
/* =========================
   CONTENT COMPLETION
========================= */

function completeDerContent() {

  localStorage.setItem(DER_CONTENT_DONE_KEY, "true");
  showSection("quiz");

}
/* =========================
   QUIZ RESULT HANDLER
========================= */

function handleDerQuizResult(score, total) {

  const percent = Math.round((score / total) * 100);

  const attempts =
    parseInt(localStorage.getItem(DER_ATTEMPTS_KEY) || "0", 10) + 1;

  localStorage.setItem(DER_ATTEMPTS_KEY, attempts);

  if (percent >= DER_PASS_PERCENTAGE) {

    localStorage.setItem(DER_PASSED_KEY, "true");
    localStorage.removeItem(DER_ATTEMPTS_KEY);
    localStorage.removeItem(DER_COOLDOWN_KEY);

    document.getElementById("quizSection").innerHTML = `
      <h2>Training Completed</h2>
      <p>You scored ${percent}%</p>
      <button class="btn-primary" onclick="finishDerTraining()">
        Finish Training
      </button>
    `;

    return;

  }

  if (attempts >= DER_MAX_ATTEMPTS) {

    localStorage.setItem(
      DER_COOLDOWN_KEY,
      Date.now() + DER_COOLDOWN_MINUTES * 60000
    );

    document.getElementById("quizSection").innerHTML = `
      <h2>Too Many Attempts</h2>
      <p>Please wait ${DER_COOLDOWN_MINUTES} minutes.</p>
    `;

    return;

  }

  document.getElementById("quizSection").innerHTML = `
    <h2>Quiz Failed</h2>
    <p>You scored ${percent}%</p>
    <p>Attempts remaining: ${DER_MAX_ATTEMPTS - attempts}</p>
    <button class="btn-primary" onclick="showSection('quiz')">
      Retry Quiz
    </button>
  `;

}
/* =========================
   FINALIZE TRAINING
========================= */

function finishDerTraining() {

  localStorage.setItem(DER_COMPLETED_KEY, "true");
  lockToDerCertificate();

}
/* =========================
   CERTIFICATE LOCK
========================= */

function lockToDerCertificate() {

  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.remove("hidden");

  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.disabled = true;
  });

  setActiveTab("certificate");
  populateDerCertificate();

}
/* =========================
   CERTIFICATE GENERATION
========================= */

function populateDerCertificate() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  let code = localStorage.getItem(DER_CERT_CODE_KEY);

  if (!code) {

    code = "AMS-DER-" + Date.now();
    localStorage.setItem(DER_CERT_CODE_KEY, code);

  }

  /* REGISTER CERTIFICATE ONLY ON FIRST GENERATION */

if (!localStorage.getItem(`derCertRegistered_${USER_EMAIL}`)) {

  if (user && typeof registerCertificate === "function") {

    registerCertificate({
      id: code,
      name: user.fullName || (user.firstName + " " + user.lastName),
      course: "FAA DER Training",
      date: Date.now()
    });

    localStorage.setItem(`derCertRegistered_${USER_EMAIL}`, "true");

  }

}

  document.getElementById("certName").textContent =
    user?.fullName || (user?.firstName + " " + user?.lastName);

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
