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
/* =========================================================
   DRUG QUIZ ENGINE
========================================================= */

const drugQuestions = [
  {
    q: "Which drug category is tested under FMCSA regulations?",
    a: { A: "Marijuana", B: "Cocaine", C: "Amphetamines", D: "All of the above" },
    correct: "D"
  },
  {
    q: "When is a drug test required?",
    a: { A: "Pre-employment", B: "Random", C: "Post-accident", D: "All of the above" },
    correct: "D"
  },
  {
    q: "Who determines reasonable suspicion?",
    a: { A: "Supervisor", B: "Co-worker", C: "Driver", D: "Dispatcher" },
    correct: "A"
  },
  {
    q: "Positive drug results may lead to:",
    a: { A: "Return-to-duty process", B: "Immediate termination always", C: "Promotion", D: "None" },
    correct: "A"
  }
];

let drugPage = 0;
let drugAnswers = new Array(drugQuestions.length).fill(null);

function initDrugQuiz() {
  renderDrugQuiz();
}

function renderDrugQuiz() {
  const container = document.getElementById("drugQuizQuestions");
  container.innerHTML = "";

  const q = drugQuestions[drugPage];

  const div = document.createElement("div");
  div.innerHTML = `<strong>${drugPage + 1}. ${q.q}</strong>`;

  Object.entries(q.a).forEach(([letter, text]) => {
    div.innerHTML += `
      <label>
        <input type="radio" name="drugQ" value="${letter}"
        ${drugAnswers[drugPage] === letter ? "checked" : ""}>
        ${letter}) ${text}
      </label>
    `;
  });

  container.appendChild(div);
}

/* =========================
   NAVIGATION
========================= */

document.getElementById("drugNextBtn")?.addEventListener("click", () => {
  saveDrugAnswer();

  if (drugPage < drugQuestions.length - 1) {
    drugPage++;
    renderDrugQuiz();
  } else {
    gradeDrugQuiz();
  }
});

document.getElementById("drugPrevBtn")?.addEventListener("click", () => {
  saveDrugAnswer();
  if (drugPage > 0) {
    drugPage--;
    renderDrugQuiz();
  }
});

/* =========================
   SAVE ANSWER
========================= */

function saveDrugAnswer() {
  const selected = document.querySelector("input[name='drugQ']:checked");
  if (selected) {
    drugAnswers[drugPage] = selected.value;
  }
}

/* =========================
   GRADE
========================= */

function gradeDrugQuiz() {

  const cooldownUntil = localStorage.getItem(DRUG_COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < cooldownUntil) {
    alert("Drug quiz cooldown active. Try again later.");
    return;
  }

  let score = 0;
  drugQuestions.forEach((q, i) => {
    if (drugAnswers[i] === q.correct) score++;
  });

  let attempts = parseInt(localStorage.getItem(DRUG_ATTEMPT_KEY)) || 0;

  if (score >= DRUG_PASS_SCORE) {

    localStorage.setItem(DRUG_QUIZ_KEY, "true");

    document.getElementById("drugQuizResult").innerHTML =
      `<div class="result-box pass">
        Drug Quiz Passed (${score}/4)
      </div>`;

    document.getElementById("alcoholContentSection")
      ?.classList.remove("hidden");

  } else {

    attempts++;
    localStorage.setItem(DRUG_ATTEMPT_KEY, attempts);

    if (attempts >= DRUG_MAX_ATTEMPTS) {
      localStorage.setItem(
        DRUG_COOLDOWN_KEY,
        Date.now() + DRUG_COOLDOWN_MINUTES * 60000
      );
      localStorage.setItem(DRUG_ATTEMPT_KEY, 0);
    }

    document.getElementById("drugQuizResult").innerHTML =
      `<div class="result-box fail">
        Drug Quiz Failed (${score}/4)
      </div>`;
  }
}
/* =========================================================
   DRUG PDF VIEWER
========================================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const drugPdfUrl = "../assets/fmcsa/2-Drug-Training.pdf";

let drugPdfDoc = null;
let drugPageNum = 1;
let drugTotalPages = 0;

const drugCanvas = document.getElementById("drugPdfCanvas");
const drugCtx = drugCanvas?.getContext("2d");

const drugCompleteBtn = document.getElementById("completeDrugContentBtn");

if (drugCompleteBtn) drugCompleteBtn.disabled = true;

pdfjsLib.getDocument(drugPdfUrl).promise.then(pdf => {
  drugPdfDoc = pdf;
  drugTotalPages = pdf.numPages;

  document.getElementById("drugTotalPages").textContent = drugTotalPages;

  renderDrugPage(drugPageNum);
});

function renderDrugPage(num) {

  drugPdfDoc.getPage(num).then(page => {

    const viewport = page.getViewport({ scale: 1.3 });

    drugCanvas.height = viewport.height;
    drugCanvas.width = viewport.width;

    page.render({
      canvasContext: drugCtx,
      viewport: viewport
    });

    document.getElementById("drugCurrentPage").textContent = num;

    const progressPercent = (num / drugTotalPages) * 100;
    document.getElementById("drugProgressBar").style.width =
      progressPercent + "%";

    // Enable completion only on last page
    if (drugCompleteBtn) {
      drugCompleteBtn.disabled = (num !== drugTotalPages);
    }

  });
}

/* =========================
   PAGE NAVIGATION
========================= */

document.getElementById("drugPrevPageBtn")?.addEventListener("click", () => {
  if (drugPageNum > 1) {
    drugPageNum--;
    renderDrugPage(drugPageNum);
  }
});

document.getElementById("drugNextPageBtn")?.addEventListener("click", () => {
  if (drugPageNum < drugTotalPages) {
    drugPageNum++;
    renderDrugPage(drugPageNum);
  }
});
