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
   QUIZ LOGIC
========================= */

let quizData = [];
let currentQuestion = 0;
let score = 0;

function loadQuiz(data) {
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
   PASS / CERTIFICATE LOGIC
========================= */

const PASS_PERCENTAGE = 80;
let quizPassed = false;

function unlockCertificate() {
  const certBtn = document.querySelector(
    "button[onclick=\"showSection('certificate')\"]"
  );

  if (certBtn) {
    certBtn.disabled = false;
    certBtn.classList.remove("disabled");
  }
}

function showQuizResult() {
  const section = document.getElementById("quizSection");

  const percentage = Math.round((score / quizData.length) * 100);
  quizPassed = percentage >= PASS_PERCENTAGE;

  if (quizPassed) {
    unlockCertificate();
    populateCertificate();
    localStorage.setItem("derQuizPassed", "true");
  }

  section.innerHTML = `
    <h2>${quizPassed ? "Passed" : "Failed"}</h2>
    <p>You scored ${score} / ${quizData.length} (${percentage}%)</p>
    ${
      quizPassed
        ? "<p>You may now access your certificate.</p>"
        : "<p>Please review the content and try again.</p>"
    }
  `;
}

/* =========================
   CERTIFICATE
========================= */

function populateCertificate() {
  const nameEl = document.getElementById("certName");
  const dateEl = document.getElementById("certDate");

  if (!nameEl || !dateEl) return;

  nameEl.textContent = "Employee Name";
  dateEl.textContent = new Date().toLocaleDateString();
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
   RESTORE STATE
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const passed = localStorage.getItem("derQuizPassed") === "true";

  if (passed) {
    quizPassed = true;
    unlockCertificate();
    populateCertificate();
  }
});
