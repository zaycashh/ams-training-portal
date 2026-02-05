/* =========================
   SECTION NAVIGATION (STEP 22.3 ENFORCED)
========================= */

function showSection(section) {
  // Enforce Step 22 authority
  if (section === "quiz" && typeof hasCompletedContent === "function") {
    if (!hasCompletedContent()) return;
  }

  if (section === "certificate" && typeof hasPassedQuiz === "function") {
    if (!hasPassedQuiz()) return;
  }

  document.getElementById("contentSection").classList.add("hidden");
  document.getElementById("quizSection").classList.add("hidden");
  document.getElementById("certificateSection").classList.add("hidden");

  if (section === "content") {
    document.getElementById("contentSection").classList.remove("hidden");
  }

  if (section === "quiz") {
  document.getElementById("quizSection").classList.remove("hidden");
  loadModuleQuiz();
}

  if (section === "certificate") {
    document.getElementById("certificateSection").classList.remove("hidden");
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
   QUIZ STATE (LOCAL ONLY)
========================= */

let quizData = [];
let currentQuestion = 0;
let score = 0;
/* =========================
   MODULE QUIZ LOADER (STEP 23.3)
========================= */

async function loadModuleQuiz() {
  const module = document.body.getAttribute("data-module");
  if (!module) return;

  try {
    const res = await fetch(`../quizzes/${module}.json`);
    if (!res.ok) throw new Error("Quiz not found");

    const data = await res.json();
    loadQuiz(data); // existing quiz engine
  } catch (err) {
    console.error("Quiz load failed:", err);
    const quizSection = document.getElementById("quizSection");
    if (quizSection) {
      quizSection.innerHTML = "<p>Quiz unavailable.</p>";
    }
  }
}

/* =========================
   ATTEMPT HELPERS (DER SAFE FOR NOW)
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

/* =========================
   COOLDOWN HELPERS (STEP 24)
========================= */

function getCooldownUntil() {
  return parseInt(
    localStorage.getItem("ams_der_cooldown_until") || "0",
    10
  );
}

function startCooldown() {
  const until =
    Date.now() + COOLDOWN_MINUTES * 60 * 1000;

  localStorage.setItem(
    "ams_der_cooldown_until",
    until
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
   QUIZ LOGIC
========================= */

function loadQuiz(data) {
  // STEP 24.3 — cooldown enforcement
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
  const section = document.getElementById("quizSection");

  if (!quizData.length) {
    section.innerHTML = "<p>No quiz available.</p>";
    return;
  }

  const q = quizData[currentQuestion];

  section.innerHTML = `
    <h2>${q.question}</h2>
    <div class="quiz-options">
      ${q.options
        .map(
          (opt, i) =>
            `<button onclick="submitAnswer(${i})">${opt}</button>`
        )
        .join("")}
    </div>
  `;
}

function submitAnswer(selected) {
  if (selected === quizData[currentQuestion].answer) {
    score++;
  }

  currentQuestion++;

  if (currentQuestion < quizData.length) {
    renderQuestion();
  } else {
    showQuizResult();
  }
}

/* =========================
   RESULTS (STEP 22 AUTHORITY)
========================= */

function showQuizResult() {
  const section = document.getElementById("quizSection");

  const attempts = incrementAttempts();
  const percentage = Math.round((score / quizData.length) * 100);
  const passed = percentage >= PASS_PERCENTAGE;

  if (passed) {
    // User passed — final success
    markQuizPassed();
    populateCertificate();

    section.innerHTML = `
      <h2>Passed</h2>
      <p>You scored ${score} / ${quizData.length} (${percentage}%)</p>
      <p>You may now access your certificate.</p>
    `;
    return;
  }

  // STEP 24.4 — start cooldown after 3 failed attempts
  if (attempts >= MAX_ATTEMPTS) {
    startCooldown();
    showCooldownMessage();
    return;
  }

  // Failed attempt but still allowed to retry
  section.innerHTML = `
    <h2>Failed</h2>
    <p>You scored ${score} / ${quizData.length} (${percentage}%)</p>
    <p>You have ${MAX_ATTEMPTS - attempts} attempt(s) remaining.</p>
  `;
}

/* =========================
   CERTIFICATE DISPLAY ONLY
========================= */

function populateCertificate() {
  const nameEl = document.getElementById("certName");
  const dateEl = document.getElementById("certDate");
  const verifyEl = document.getElementById("certVerify");

  if (!nameEl || !dateEl) return;

  const verify = getOrCreateVerification();

  nameEl.textContent = "Employee Name";
  dateEl.textContent = new Date(verify.issuedAt).toLocaleDateString();

  if (verifyEl) {
    verifyEl.textContent = verify.id;
  }

  renderCertificateQR(verify.id);
}

function renderCertificateQR(verificationId) {
  const qrContainer = document.getElementById("certQR");
  if (!qrContainer) return;

  const verifyUrl =
    window.location.origin +
    "/verify.html?id=" +
    encodeURIComponent(verificationId);

  qrContainer.innerHTML = "";

  new QRCode(qrContainer, {
    text: verifyUrl,
    width: 128,
    height: 128
  });
}
