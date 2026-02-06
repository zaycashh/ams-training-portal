/* =========================================================
   EMPLOYEE TRAINING MODULE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "employee") return;

  // 🔐 Paywall
  if (localStorage.getItem("paid_employee") !== "true") {
    alert("Employee Training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  // Already completed
  if (localStorage.getItem("employeeTrainingCompleted") === "true") {
    showSection("content");
  }
});

/* =========================
   QUIZ RESULT HANDLER
========================= */

function handleEmployeeQuizResult(score, total) {
  const percentage = Math.round((score / total) * 100);

  document.getElementById("quizSection").innerHTML = `
    <h2>Training Completed</h2>
    <p>You scored ${percentage}%</p>

    <button class="btn-primary" onclick="finishEmployeeTraining()">
      Return to Dashboard
    </button>
  `;
}

/* =========================
   COMPLETE TRAINING
========================= */

function finishEmployeeTraining() {
  localStorage.setItem("employeeTrainingCompleted", "true");
  window.location.href = "dashboard.html";
}
