/* =========================================================
   AMS TRAINING PORTAL — CORE LOGIC (SHARED)
   ⚠️ NO MODULE-SPECIFIC CODE HERE
========================================================= */

/* =========================
   GLOBAL QUIZ STATE
========================= */
let quizData = [];
let currentQuestion = 0;
let score = 0;

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof showSection === "function") {
    showSection("content");
  }
});

/* =========================
   SECTION NAVIGATION
========================= */
function showSection(section) {
  const content = document.getElementById("contentSection");
  const quiz = document.getElementById("quizSection");
  const cert = document.getElementById("certificateSection");

  content?.classList.add("hidden");
  quiz?.classList.add("hidden");
  cert?.classList.add("hidden");

  if (section === "content") content?.classList.remove("hidden");

  if (section === "quiz") {
    quiz?.classList.remove("hidden");
    loadModuleQuiz();
  }

  if (section === "certificate") {
    cert?.classList.remove("hidden");
  }
}

/* =========================
   LOAD MODULE QUIZ
========================= */
async function loadModuleQuiz() {
  const module = document.body.dataset.module;
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
   QUIZ ENGINE
========================= */
function loadQuiz(data) {
  quizData = data.quiz || [];
  currentQuestion = 0;
  score = 0;

  if (!quizData.length) {
    document.getElementById("quizSection").innerHTML =
      "<p>No quiz questions available.</p>";
    return;
  }

  renderQuestion();
}

function renderQuestion() {
  const q = quizData[currentQuestion];
  if (!q) return;

  document.getElementById("quizSection").innerHTML = `
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

function submitAnswer(selectedIndex) {
  if (selectedIndex === quizData[currentQuestion].answer) score++;
  currentQuestion++;

  if (currentQuestion < quizData.length) {
    renderQuestion();
  } else {
    showQuizResult();
  }
}

/* =========================
   QUIZ RESULT DELEGATION
========================= */
function showQuizResult() {
  const module = document.body.dataset.module;

  if (module === "der" && typeof handleDerQuizResult === "function") {
    handleDerQuizResult(score, quizData.length);
    return;
  }

  if (
    module === "employee" &&
    typeof handleEmployeeQuizResult === "function"
  ) {
    handleEmployeeQuizResult(score, quizData.length);
    return;
  }

  if (
    module === "supervisor" &&
    typeof handleSupervisorQuizResult === "function"
  ) {
    handleSupervisorQuizResult(score, quizData.length);
    return;
  }

  document.getElementById("quizSection").innerHTML = `
    <h2>Quiz Complete</h2>
    <p>You scored ${Math.round(
      (score / quizData.length) * 100
    )}%</p>
  `;
}

/* =========================
   DASHBOARD NAV
========================= */
function goDashboard() {
  window.location.href = "../pages/dashboard.html";
}
