/* =========================================================
   AMS TRAINING FLOW AUTHORITY (STEP 22)
========================================================= */

function getModule() {
  return document.body.getAttribute("data-module");
}

/* -------------------------
   STATE HELPERS
------------------------- */

function hasCompletedContent() {
  const module = getModule();
  return localStorage.getItem(`ams_${module}_content`) === "complete";
}

function hasPassedQuiz() {
  const module = getModule();
  return localStorage.getItem(`ams_${module}_quiz`) === "passed";
}

/* -------------------------
   STATE SETTERS
------------------------- */

function markContentComplete() {
  const module = getModule();
  localStorage.setItem(`ams_${module}_content`, "complete");
  unlockQuiz();
}

function markQuizPassed() {
  const module = getModule();
  localStorage.setItem(`ams_${module}_quiz`, "passed");
  unlockCertificate();
}

/* -------------------------
   UI LOCK CONTROL
------------------------- */

function lockTab(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("disabled");
  el.disabled = true;
}

function unlockTab(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("disabled");
  el.disabled = false;
}

function unlockQuiz() {
  unlockTab("tabQuiz");
}

function unlockCertificate() {
  unlockTab("tabCertificate");
}

/* -------------------------
   INIT ON LOAD
------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  if (!hasCompletedContent()) {
    lockTab("tabQuiz");
    lockTab("tabCertificate");
    return;
  }

  unlockQuiz();

  if (!hasPassedQuiz()) {
    lockTab("tabCertificate");
    return;
  }

  unlockCertificate();
});
