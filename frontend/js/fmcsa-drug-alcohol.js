/* =========================================================
   FMCSA DRUG & ALCOHOL MODULE ENGINE
========================================================= */

const MODULE_B_COMPLETED_KEY = "fmcsaModuleBCompleted";
const MODULE_A_COMPLETED_KEY = "fmcsaModuleACompleted";

const DRUG_CONTENT_KEY = "fmcsaDrugContentCompleted";
const DRUG_QUIZ_KEY = "fmcsaDrugQuizPassed";

const ALCOHOL_CONTENT_KEY = "fmcsaAlcoholContentCompleted";
const ALCOHOL_QUIZ_KEY = "fmcsaAlcoholQuizPassed";

/* =========================
   DRUG QUIZ CONFIG
========================= */

const DRUG_PASS_SCORE = 3;
const DRUG_MAX_ATTEMPTS = 3;
const DRUG_COOLDOWN_MINUTES = 15;

const DRUG_ATTEMPT_KEY = "fmcsaDrugAttempts";
const DRUG_COOLDOWN_KEY = "fmcsaDrugCooldown";

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // 🔒 Require Module A first
  if (localStorage.getItem(MODULE_A_COMPLETED_KEY) !== "true") {
    alert("Complete Module A (Reasonable Suspicion) first.");
    window.location.replace("dashboard.html");
    return;
  }

  restoreProgress();
  wireButtons();

  // If drug content already completed → initialize quiz
  if (localStorage.getItem(DRUG_CONTENT_KEY) === "true") {
    initDrugQuiz();
  }

});

/* =========================================================
   RESTORE PROGRESS
========================================================= */

function restoreProgress() {

  if (localStorage.getItem(DRUG_CONTENT_KEY) === "true") {
    document.getElementById("drugQuizSection")?.classList.remove("hidden");
  }

  if (localStorage.getItem(DRUG_QUIZ_KEY) === "true") {
    document.getElementById("alcoholContentSection")?.classList.remove("hidden");
  }

  if (localStorage.getItem(ALCOHOL_CONTENT_KEY) === "true") {
    document.getElementById("alcoholQuizSection")?.classList.remove("hidden");
  }

  if (localStorage.getItem(ALCOHOL_QUIZ_KEY) === "true") {
    document.getElementById("drugAlcoholCertificateSection")?.classList.remove("hidden");
  }
}

/* =========================================================
   BUTTON WIRING
========================================================= */

function wireButtons() {

  // Drug content complete
  document.getElementById("completeDrugContentBtn")?.addEventListener("click", () => {
    localStorage.setItem(DRUG_CONTENT_KEY, "true");
    document.getElementById("drugQuizSection")?.classList.remove("hidden");
    initDrugQuiz();
  });

  // Alcohol content complete
  document.getElementById("completeAlcoholContentBtn")?.addEventListener("click", () => {
    localStorage.setItem(ALCOHOL_CONTENT_KEY, "true");
    document.getElementById("alcoholQuizSection")?.classList.remove("hidden");
  });

}
