/* =========================================================
   AMS TRAINING FLOW AUTHORITY (USER ISOLATED)
========================================================= */

function getUser() {
  return JSON.parse(localStorage.getItem("amsUser") || "null");
}

function getModule() {
  return document.body.getAttribute("data-module");
}

function getKey(base) {
  const user = getUser();
  if (!user) return null;
  return `${base}_${user.email}`;
}

/* -------------------------
   STATE HELPERS
------------------------- */

function hasCompletedContent() {
  const module = getModule();
  const key = getKey(`ams_${module}_content`);
  return key && localStorage.getItem(key) === "complete";
}

function hasPassedQuiz() {
  const module = getModule();
  const key = getKey(`ams_${module}_unlocked`);
  return key && localStorage.getItem(key) === "true";
}

/* -------------------------
   STATE SETTERS
------------------------- */

function markContentComplete() {
  const module = getModule();
  const key = getKey(`ams_${module}_content`);
  if (!key) return;

  localStorage.setItem(key, "complete");
  unlockQuiz();
}

function markQuizPassed() {
  const module = getModule();
  const key = getKey(`ams_${module}_unlocked`);
  if (!key) return;

  localStorage.setItem(key, "true");

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

  const user = getUser();
  if (!user) return;

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
