/* =========================================================
   DER MODULE LOGIC
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const module = document.body.dataset.module;
  if (module !== "der") return;

  /* =========================
     🔐 DER PAYWALL
  ========================= */
  if (localStorage.getItem("paid_der") !== "true") {
    alert("DER Training requires purchase.");
    window.location.href = "../pages/dashboard.html";
    return;
  }

  /* =========================
     🔒 HARD LOCK AFTER COMPLETION
  ========================= */
  if (localStorage.getItem("derTrainingCompleted") === "true") {
    document.getElementById("contentSection")?.classList.add("hidden");
    document.getElementById("quizSection")?.classList.add("hidden");
    document.getElementById("certificateSection")?.classList.remove("hidden");
    populateDerCertificate();
    return;
  }
});

/* =========================
   DER QUIZ CONFIG
========================= */

const DER_PASS_PERCENTAGE = 80;
const DER_MAX_ATTEMPTS = 3;
const DER_COOLDOWN_MINUTES = 15;

const DER_ATTEMPT_KEY = "ams_der_quiz_attempts";
const DER_COOLDOWN_KEY = "ams_der_cooldown_until";

/* =========================
   DER ATTEMPTS + COOLDOWN
========================= */

function getDerAttempts() {
  return parseInt(localStorage.getItem(DER_ATTEMPT_KEY) || "0", 10);
}

function incrementDerAttempts() {
  const attempts = getDerAttempts() + 1;
  localStorage.setItem(DER_ATTEMPT_KEY, attempts);
  return attempts;
}

function getDerCooldownUntil() {
  return parseInt(localStorage.getItem(DER_COOLDOWN_KEY) || "0", 10);
}

function startDerCooldown() {
  localStorage.setItem(
    DER_COOLDOWN_KEY,
    Date.now() + DER_COOLDOWN_MINUTES * 60000
  );
}

function isDerInCooldown() {
  return Date.now() < getDerCooldownUntil();
}

function resetDerCooldownIfExpired() {
  if (!isDerInCooldown() && getDerAttempts() >= DER_MAX_ATTEMPTS) {
    localStorage.removeItem(DER_ATTEMPT_KEY);
    localStorage.removeItem(DER_COOLDOWN_KEY);
  }
}

function showDerCooldownMessage() {
  const minutesLeft = Math.ceil(
    (getDerCooldownUntil() - Date.now()) / 60000
  );

  document.getElementById("quizSection").innerHTML = `
    <h2>Quiz Locked</h2>
    <p>You have reached the maximum number of attempts.</p>
    <p>Please wait <strong>${minutesLeft}</strong> minute(s) before retrying.</p>
  `;
}

/* =========================
   DER QUIZ RESULT HANDLER
========================= */

function handleDerQuizResult(score, total) {
  const attempts = incrementDerAttempts();
  const percentage = Math.round((score / total) * 100);

  // ✅ PASSED
  if (percentage >= DER_PASS_PERCENTAGE) {
    // do NOT mark completed yet
    document.getElementById("quizSection").innerHTML = `
      <h2>Training Completed</h2>
      <p>You scored ${percentage}%</p>

      <button class="btn-primary" onclick="finishDerTraining()">
        Finish Training
      </button>
    `;
    return;
  }

  // ❌ FAILED — LOCKOUT
  if (attempts >= DER_MAX_ATTEMPTS) {
    startDerCooldown();
    showDerCooldownMessage();
    return;
  }

  // ❌ FAILED — RETRY
  document.getElementById("quizSection").innerHTML = `
    <h2>Failed</h2>
    <p>You scored ${percentage}%</p>
    <p>${DER_MAX_ATTEMPTS - attempts} attempt(s) remaining</p>

    <button class="btn-primary" onclick="showSection('quiz')">
      Retry Quiz
    </button>
  `;
}
/* =========================
   DER CERTIFICATE
========================= */

const DER_CERT_VERIFY_KEY = "ams_der_certificate_verification";

function generateDerVerificationId() {
  return (
    "AMS-DER-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Date.now().toString().slice(-6)
  );
}

function getOrCreateDerVerification() {
  let record = JSON.parse(
    localStorage.getItem(DER_CERT_VERIFY_KEY) || "null"
  );

  if (!record) {
    record = {
      id: generateDerVerificationId(),
      issuedAt: new Date().toISOString()
    };
    localStorage.setItem(DER_CERT_VERIFY_KEY, JSON.stringify(record));
  }

  return record;
}

function populateDerCertificate() {
  const verify = getOrCreateDerVerification();

  document.getElementById("certName").textContent = "Employee Name";
  document.getElementById("certDate").textContent =
    new Date(verify.issuedAt).toLocaleDateString();
  document.getElementById("certVerify").textContent = verify.id;

  renderDerCertificateQR(verify.id);
  showSection("certificate");
}

function renderDerCertificateQR(id) {
  const el = document.getElementById("certQR");
  if (!el) return;

  el.innerHTML = "";
  new QRCode(el, {
    text: `${location.origin}/verify.html?id=${id}`,
    width: 128,
    height: 128
  });
}
