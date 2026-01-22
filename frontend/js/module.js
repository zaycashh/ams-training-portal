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

document.getElementById("languageToggle").addEventListener("change", (e) => {
  const lang = e.target.value;
  alert("Language switched to: " + (lang === "en" ? "English" : "Spanish"));
});
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

const PASS_PERCENTAGE = 80;
let quizPassed = false;

function showQuizResult() {
  const section = document.getElementById("quizSection");

  const percentage = Math.round((score / quizData.length) * 100);
  quizPassed = percentage >= PASS_PERCENTAGE;

  if (quizPassed) {
    unlockCertificate();
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
