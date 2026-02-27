document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     PURCHASE GUARD
  ========================= */

  if (localStorage.getItem("paid_der_fmcsa") !== "true") {
    alert("DER FMCSA training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

  /* =========================
     RESTORE PROGRESS
  ========================= */

  const contentDone = localStorage.getItem("der_fmcsa_content_done");

  if (contentDone === "true") {
    showQuiz();
  }

});


/* =========================
   CONTENT COMPLETE
========================= */

function unlockQuiz() {
  localStorage.setItem("der_fmcsa_content_done", "true");
  showQuiz();
}


/* =========================
   SHOW QUIZ
========================= */

function showQuiz() {
  document.getElementById("contentSection")?.classList.add("hidden");
  document.getElementById("quizSection")?.classList.remove("hidden");
}
