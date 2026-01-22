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

function showQuizResult() {
  const section = document.getElementById("quizSection");
  const passed = score === quizData.length;

  section.innerHTML = `
    <h2>${passed ? "Passed" : "Failed"}</h2>
    <p>You scored ${score} / ${quizData.length}</p>
  `;
}

