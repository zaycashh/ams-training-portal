document.addEventListener("DOMContentLoaded", () => {
  const module = document.body.dataset.module;

  /* =========================
     🔐 PAYWALL CHECKS
  ========================= */

  // Employee = per-employee license
  if (
    module === "employee" &&
    localStorage.getItem("paid_employee") !== "true"
  ) {
    alert("Employee Training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  // DER = paid compliance module
  if (
    module === "der" &&
    localStorage.getItem("paid_der") !== "true"
  ) {
    alert("DER Training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  /* =========================
     🔒 HARD LOCK AFTER COMPLETION (DER)
  ========================= */

  if (
    module === "der" &&
    localStorage.getItem("derTrainingCompleted") === "true"
  ) {
    document.getElementById("contentSection")?.classList.add("hidden");
    document.getElementById("quizSection")?.classList.add("hidden");
    document.getElementById("certificateSection")?.classList.remove("hidden");
    return;
  }

  /* =========================
     EMPLOYEE COMPLETION (SOFT)
  ========================= */

  if (
    module === "employee" &&
    localStorage.getItem("employeeTrainingCompleted") === "true"
  ) {
    alert("Employee training already completed.");
    showSection("content");
    return;
  }

  /* =========================
     DEFAULT START
  ========================= */

  showSection("content");
});

/* =========================
   SECTION NAVIGATION (STEP 22.3 ENFORCED)
========================= */

function showSection(section) {

  /* 🔒 HARD LOCK — DER AFTER COMPLETION (GLOBAL) */
  if (
    document.body.dataset.module === "der" &&
    localStorage.getItem("derTrainingCompleted") === "true" &&
    section !== "certificate"
  ) {
    document.getElementById("contentSection")?.classList.add("hidden");
    document.getElementById("quizSection")?.classList.add("hidden");
    document.getElementById("certificateSection")?.classList.remove("hidden");
    return;
  }

  // Step 22 — Content → Quiz
  if (section === "quiz" && typeof hasCompletedContent === "function") {
    if (!hasCompletedContent()) return;
  }

  // Step 23 — Quiz → Certificate
  if (section === "certificate" && typeof hasPassedQuiz === "function") {
    if (!hasPassedQuiz()) return;
  }

  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.add("hidden");
  document.getElementById("certificateSection")?.classList.add("hidden");

  if (section === "content") {
    document.getElementById("contentSection")?.classList.remove("hidden");
  }

  if (section === "quiz") {
    document.getElementById("quizSection")?.classList.remove("hidden");
    loadModuleQuiz();
  }

  if (section === "certificate") {
    document.getElementById("certificateSection")?.classList.remove("hidden");
  }
}

function goDashboard() {
  window.location.href = "dashboard.html";
}

/* =========================
   DOT COMPLIANCE CONSTANTS
========================= */

const PASS_PERCENTAGE = 80;
const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 15;

/* =========================
   CERT VERIFICATION (SAFE)
========================= */

const CERT_VERIFY_KEY = "ams_certificate_verification";

function generateVerificationId() {
  return (
    "AMS-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Date.now().toString().slice(-6)
  );
}

function getOrCreateVerification() {
  let record = JSON.parse(localStorage.getItem(CERT_VERIFY_KEY) || "null");

  if (!record) {
    record = {
      id: generateVerificationId(),
      issuedAt: new Date().toISOString()
    };
    localStorage.setItem(CERT_VERIFY_KEY, JSON.stringify(record));
  }

  return record;
}

/* =========================
   QUIZ STATE
========================= */

let quizData = [];
let currentQuestion = 0;
let score = 0;

/* =========================
   MODULE QUIZ LOADER
========================= */

async function loadModuleQuiz() {
  const module = document.body.getAttribute("data-module");
  if (!module) return;

  try {
    const res = await fetch(`../quizzes/${module}.json`);
    if (!res.ok) throw new Error("Quiz not found");

    const data = await res.json();
    loadQuiz(data);
  } catch (err) {
    console.error("Quiz load failed:", err);
    document.getElementById("quizSection").innerHTML =
      "<p>Quiz unavailable.</p>";
  }
}

/* =========================
   ATTEMPTS + COOLDOWN
========================= */

const ATTEMPT_KEY = "ams_der_quiz_attempts";

function getAttempts() {
  return parseInt(localStorage.getItem(ATTEMPT_KEY) || "0", 10);
}

function incrementAttempts() {
  const attempts = getAttempts() + 1;
  localStorage.setItem(ATTEMPT_KEY, attempts);
  return attempts;
}

function getCooldownUntil() {
  return parseInt(localStorage.getItem("ams_der_cooldown_until") || "0", 10);
}

function startCooldown() {
  localStorage.setItem(
    "ams_der_cooldown_until",
    Date.now() + COOLDOWN_MINUTES * 60000
  );
}

function isInCooldown() {
  return Date.now() < getCooldownUntil();
}

function resetAfterCooldownIfExpired() {
  if (!isInCooldown() && getAttempts() >= MAX_ATTEMPTS) {
    localStorage.removeItem(ATTEMPT_KEY);
    localStorage.removeItem("ams_der_cooldown_until");
  }
}

/* =========================
   QUIZ ENGINE
========================= */

function loadQuiz(data) {
  resetAfterCooldownIfExpired();

  if (isInCooldown()) {
    showCooldownMessage();
    return;
  }

  quizData = data.quiz || [];
  currentQuestion = 0;
  score = 0;
  renderQuestion();
}

function renderQuestion() {
  const q = quizData[currentQuestion];

  document.getElementById("quizSection").innerHTML = `
    <h2>${q.question}</h2>
    <div class="quiz-options">
      ${q.options
        .map((opt, i) => `<button onclick="submitAnswer(${i})">${opt}</button>`)
        .join("")}
    </div>
  `;
}

function submitAnswer(selected) {
  if (selected === quizData[currentQuestion].answer) score++;
  currentQuestion++;

  if (currentQuestion < quizData.length) {
    renderQuestion();
  } else {
    showQuizResult();
  }
}

/* =========================
   QUIZ RESULT
========================= */

function showQuizResult() {
  const attempts = incrementAttempts();
  const percentage = Math.round((score / quizData.length) * 100);

  if (percentage >= PASS_PERCENTAGE) {
    markQuizPassed();
    populateCertificate();
    return;
  }

  if (attempts >= MAX_ATTEMPTS) {
    startCooldown();
    showCooldownMessage();
    return;
  }

  document.getElementById("quizSection").innerHTML = `
    <h2>Failed</h2>
    <p>You scored ${percentage}%</p>
    <p>${MAX_ATTEMPTS - attempts} attempt(s) remaining</p>
  `;
}

/* =========================
   CERTIFICATE
========================= */

function populateCertificate() {
  const verify = getOrCreateVerification();

  document.getElementById("certName").textContent = "Employee Name";
  document.getElementById("certDate").textContent =
    new Date(verify.issuedAt).toLocaleDateString();
  document.getElementById("certVerify").textContent = verify.id;

  renderCertificateQR(verify.id);

  localStorage.setItem("derTrainingCompleted", "true");
  showSection("certificate");
}

function renderCertificateQR(id) {
  const el = document.getElementById("certQR");
  el.innerHTML = "";

  new QRCode(el, {
    text: `${location.origin}/verify.html?id=${id}`,
    width: 128,
    height: 128
  });
}

/* =========================
   EMPLOYEE COMPLETION
========================= */

function completeEmployeeTraining() {
  localStorage.setItem("employeeTrainingCompleted", "true");
  alert("Employee training completed.");
}
