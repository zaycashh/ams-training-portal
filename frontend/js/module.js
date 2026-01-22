/* =========================
   SECTION NAVIGATION
========================= */

function showSection(section) {
  document.getElementById("contentSection").classList.add("hidden");
  document.getElementById("quizSection").classList.add("hidden");
  document.getElementById("certificateSection").classList.add("hidden");

  if (section === "content") {
    document.getElementById("contentSection").classList.remove("hidden");
  }

  if (section === "quiz") {
    document.getElementById("quizSection").classList.remove("hidden");
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
const ATTEMPT_KEY = "derQuizAttempts";
const PASS_KEY = "derQuizPassed";

/* =========================
   CERT VERIFICATION
========================= */

const CERT_VERIFY_KEY = "derCertificateVerification";

function generateVerificationId() {
  return (
    "AMS-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "-" +
    Date.now().toString().slice(-6)
  );
}

function getOrCreateVerification() {
  let record = JSON.parse(
    localStorage.getItem(CERT_VERIFY_KEY) || "null"
  );

  if (!record) {
    record = {
      id: generateVerificationId(),
      issuedAt: new Date().toISOString()
    };

    localStorage.setItem(
      CERT_VERIFY_KEY,
      JSON.stringify(record)
    );
  }

  return record;
}
/* =========================
   QUIZ STATE
========================= */

let quizData = [];
let currentQuestion = 0;
let score = 0;
let quizPassed = false;

/* =========================
   ATTEMPT HELPERS
========================= */

function getAttempts() {
  return parseInt(localStorage.getItem(ATTEMPT_KEY) || "0", 10);
}

function incrementAttempts() {
  const attempts = getAttempts() + 1;
  localStorage.setItem(ATTEMPT_KEY, attempts);
  return attempts;
}

function isLockedOut() {
  return getAttempts() >= MAX_ATTEMPTS && !quizPassed;
}

/* =========================
   QUIZ LOGIC
========================= */

function loadQuiz(data) {
  if (isLockedOut()) {
    showLockoutMessage();
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
   RESULTS / DOT ENFORCEMENT
========================= */

function showQuizResult() {
  const section = document.getElementById("quizSection");

  const attempts = incrementAttempts();
  const percentage = Math.round((score / quizData.length) * 100);

  quizPassed = percentage >= PASS_PERCENTAGE;

  if (quizPassed) {
    localStorage.setItem(PASS_KEY, "true");
    unlockCertificate();
    populateCertificate();
  }

  if (!quizPassed && attempts >= MAX_ATTEMPTS) {
    showLockoutMessage();
    return;
  }

  section.innerHTML = `
    <h2>${quizPassed ? "Passed" : "Failed"}</h2>
    <p>You scored ${score} / ${quizData.length} (${percentage}%)</p>
    ${
      quizPassed
        ? "<p>You may now access your certificate.</p>"
        : `<p>You have ${MAX_ATTEMPTS - attempts} attempt(s) remaining.</p>`
    }
  `;
}

function showLockoutMessage() {
  const section = document.getElementById("quizSection");

  section.innerHTML = `
    <h2>Training Locked</h2>
    <p>
      You have reached the maximum number of quiz attempts.
    </p>
    <p>
      DOT regulations require retraining before another attempt.
    </p>
    <p><strong>Please contact your administrator.</strong></p>
  `;
}

/* =========================
   CERTIFICATE ACCESS
========================= */

function unlockCertificate() {
  const certBtn = document.querySelector(
    "button[onclick=\"showSection('certificate')\"]"
  );

  if (certBtn) {
    certBtn.disabled = false;
    certBtn.classList.remove("disabled");
  }
}

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

function generateCertificate() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const userName = "Employee Name";
  const moduleName = "DER Training";
  const date = new Date().toLocaleDateString();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Certificate of Completion", 105, 40, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("This certifies that", 105, 60, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(userName, 105, 75, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(
    `has successfully completed the ${moduleName} module`,
    105,
    90,
    { align: "center" }
  );

  doc.text(`Date: ${date}`, 105, 110, { align: "center" });

  doc.save(`${moduleName}-Certificate.pdf`);
}

/* =========================
   RESTORE STATE (DOT SAFE)
========================= */

document.addEventListener("DOMContentLoaded", () => {
  quizPassed = localStorage.getItem(PASS_KEY) === "true";

  if (quizPassed) {
    unlockCertificate();
    populateCertificate();
  }
});
