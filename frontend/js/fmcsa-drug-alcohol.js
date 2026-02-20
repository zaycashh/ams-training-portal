 /* =========================================================
   FMCSA DRUG & ALCOHOL MODULE (ENTERPRISE VERSION)
   Mirrors Supervisor Architecture
========================================================= */

const MODULE_B_COMPLETED_KEY = "fmcsaModuleBCompleted";
const MODULE_A_COMPLETED_KEY = "fmcsaModuleACompleted";

const DRUG_CONTENT_KEY = "fmcsaDrugContentCompleted";
const DRUG_QUIZ_KEY = "fmcsaDrugQuizPassed";

const ALCOHOL_CONTENT_KEY = "fmcsaAlcoholContentCompleted";
const ALCOHOL_QUIZ_KEY = "fmcsaAlcoholQuizPassed";

/* =========================
   ATTEMPTS + COOLDOWN CONFIG
========================= */

const MAX_ATTEMPTS = 3;
const COOLDOWN_MINUTES = 15;

const DRUG_ATTEMPT_KEY = "fmcsaDrugAttempts";
const DRUG_COOLDOWN_KEY = "fmcsaDrugCooldown";

const ALCOHOL_ATTEMPT_KEY = "fmcsaAlcoholAttempts";
const ALCOHOL_COOLDOWN_KEY = "fmcsaAlcoholCooldown";

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  // 🔐 Must complete Module A first
  if (localStorage.getItem(MODULE_A_COMPLETED_KEY) !== "true") {
    alert("Complete Module A (Reasonable Suspicion) first.");
    window.location.replace("dashboard.html");
    return;
  }

  // 🔒 Block re-entry if already completed
  if (localStorage.getItem(MODULE_B_COMPLETED_KEY) === "true") {
    window.location.replace("dashboard.html");
    return;
  }

  /* =========================================================
     DRUG PDF ENGINE
  ========================================================= */

  const DRUG_PDF_URL = "../assets/fmcsa/2-Drug-Training.pdf";

  let drugPdfDoc = null;
  let drugCurrentPage = 1;
  let drugTotalPages = 0;

  const drugCanvas = document.getElementById("drugPdfCanvas");
  const drugCtx = drugCanvas?.getContext("2d");

  pdfjsLib.getDocument(DRUG_PDF_URL).promise.then(pdf => {
    drugPdfDoc = pdf;
    drugTotalPages = pdf.numPages;

    document.getElementById("drugTotalPages").textContent = drugTotalPages;

    renderDrugPage(drugCurrentPage);
  });

  function renderDrugPage(pageNum) {
    drugPdfDoc.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale: 1.2 });

      drugCanvas.height = viewport.height;
      drugCanvas.width = viewport.width;

      page.render({
        canvasContext: drugCtx,
        viewport: viewport
      });

      document.getElementById("drugCurrentPage").textContent = pageNum;

      updateDrugProgress();
    });
  }

  document.getElementById("drugNextPageBtn")?.addEventListener("click", () => {
    if (drugCurrentPage < drugTotalPages) {
      drugCurrentPage++;
      renderDrugPage(drugCurrentPage);
    }
  });

  document.getElementById("drugPrevPageBtn")?.addEventListener("click", () => {
    if (drugCurrentPage > 1) {
      drugCurrentPage--;
      renderDrugPage(drugCurrentPage);
    }
  });

  function updateDrugProgress() {
    const percent = (drugCurrentPage / drugTotalPages) * 100;
    document.getElementById("drugProgressBar").style.width = percent + "%";

    if (drugCurrentPage === drugTotalPages) {
      document.getElementById("completeDrugContentBtn").disabled = false;
    }
  }

  restoreProgress();
  wireButtons();
});

/* =========================================================
   SECTION CONTROL
========================================================= */

function showSection(id) {

  [
    "drugContentSection",
    "drugQuizSection",
    "alcoholContentSection",
    "alcoholQuizSection"
  ].forEach(section => {
    document.getElementById(section)?.classList.add("hidden");
  });

  document.getElementById(id)?.classList.remove("hidden");
}

/* =========================================================
   RESTORE PROGRESS
========================================================= */

function restoreProgress() {

  const drugPassed = localStorage.getItem(DRUG_QUIZ_KEY) === "true";
  const alcoholPassed = localStorage.getItem(ALCOHOL_QUIZ_KEY) === "true";

  if (!drugPassed) {
    showSection("drugContentSection");
    return;
  }

  if (drugPassed && !alcoholPassed) {
    showSection("alcoholContentSection");
    return;
  }

  if (drugPassed && alcoholPassed) {
    window.location.replace("dashboard.html");
  }
}

/* =========================================================
   BUTTON WIRING
========================================================= */

function wireButtons() {

  document.getElementById("completeDrugContentBtn")?.addEventListener("click", () => {
    localStorage.setItem(DRUG_CONTENT_KEY, "true");
    showSection("drugQuizSection");
    initDrugQuiz();
  });

  document.getElementById("completeAlcoholContentBtn")?.addEventListener("click", () => {
    localStorage.setItem(ALCOHOL_CONTENT_KEY, "true");
    showSection("alcoholQuizSection");
    initAlcoholQuiz();
  });
}

function calculateDrugPassScore() {
  return Math.ceil(drugQuestions.length * 0.8);
}

/* =========================
   DRUG QUESTIONS
========================= */

const drugQuestions = [
  {
    q: "Which of the following is true concerning a substance abuser?",
    a: {
      A: "The abuser lacks moral principles to stop their dependency",
      B: "The abuser lacks the will power to stop their dependency",
      C: "The abuser’s dependency is a complex disorder and quitting takes more than good intentions or a strong will.",
      D: "The drugs have changed the abuser's brain so they cannot stop their dependency"
    },
    correct: "C"
  },
  {
    q: "What percentage of substance abusers are employed?",
    a: { A: "10%", B: "25%", C: "50%", D: "75%" },
    correct: "D"
  },
  {
    q: "Crack is a form of what drug?",
    a: { A: "Amphetamine capsules", B: "Cocaine", C: "Marijuana", D: "Opium" },
    correct: "B"
  },
  {
    q: "When smoking marijuana, which ingredient passes into bloodstream?",
    a: { A: "TCH", B: "THE", C: "THC", D: "None of the above" },
    correct: "C"
  },
 {
  q: "Methamphetamine can be taken",
  a: {
    A: "Orally",
    B: "Snorted",
    C: "Injected",
    D: "All of the above"
  },
  correct: "D"
},
{
  q: "The term “opiate” refers to a number of different substances synthesizedfrom the poppy plant. Which of the following NOT one of the substances?",
  a: {
    A: "Codeine",
    B: "Morphine",
    C: "Dioxelene-B",
    D: "Hydrocodone"
  },
  correct: "C"
},
{
  q: "PCP is a very unpredictable drug that often produces:",
  a: {
    A: "Violent behavior",
    B: "Bad trips",
    C: "Self mutilation",
    D: "All of these"
  },
  correct: "D"
},
{
  q: "Speech patterns can be affected by substance abuse. True or False?",
  a: {
    A: "True",
    B: "False",
  },
  correct: "A"
},
{
  q: "Extreme hyperactivity, Nausea, and Secretive or suspicious behavior areall physical warning signs of addiction. True or False?",
  a: {
    A: "True",
    B: "False",
  },
  correct: "B"
}
];

let drugPage = 0;
let drugAnswers = new Array(drugQuestions.length).fill(null);

function initDrugQuiz() {
  drugPage = 0;
  renderDrugQuiz();
}

function renderDrugQuiz() {

  const container = document.getElementById("drugQuizQuestions");
  container.innerHTML = "";

  const q = drugQuestions[drugPage];

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-question">
        <span>Question ${drugPage + 1} of ${drugQuestions.length}</span>
        <h3>${q.q}</h3>
      </div>
      <div class="quiz-answers">
        ${Object.entries(q.a).map(([letter, text]) => `
          <label class="quiz-option">
            <input type="radio" name="drugQ" value="${letter}"
              ${drugAnswers[drugPage] === letter ? "checked" : ""}>
            <span>${letter}) ${text}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

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

function saveDrugAnswer() {
  const selected = document.querySelector("input[name='drugQ']:checked");
  if (selected) drugAnswers[drugPage] = selected.value;
}

function gradeDrugQuiz() {

  const resultBox = document.getElementById("drugQuizResult");

  const cooldownUntil = localStorage.getItem(DRUG_COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < Number(cooldownUntil)) {

    const minutesLeft = Math.ceil(
      (Number(cooldownUntil) - Date.now()) / 60000
    );

    resultBox.innerHTML = `
      <div class="result-box fail">
        Cooldown active. Try again in ${minutesLeft} minute(s).
      </div>
    `;
    return;
  }

  let score = 0;
  drugQuestions.forEach((q, i) => {
    if (drugAnswers[i] === q.correct) score++;
  });

  let attempts = parseInt(localStorage.getItem(DRUG_ATTEMPT_KEY)) || 0;

  if (score >= calculateDrugPassScore()) {

  localStorage.setItem(DRUG_QUIZ_KEY, "true");
  localStorage.removeItem(DRUG_ATTEMPT_KEY);
  localStorage.removeItem(DRUG_COOLDOWN_KEY);

  resultBox.innerHTML = `
    <div class="result-box pass">
      Drug Quiz Passed! Unlocking Alcohol Training...
    </div>
  `;

  setTimeout(() => {
    showSection("alcoholContentSection");
  }, 1500);

  return;
}
  attempts++;
  localStorage.setItem(DRUG_ATTEMPT_KEY, attempts);

  const remaining = MAX_ATTEMPTS - attempts;

  if (remaining <= 0) {
    localStorage.setItem(
      DRUG_COOLDOWN_KEY,
      Date.now() + COOLDOWN_MINUTES * 60000
    );
    localStorage.setItem(DRUG_ATTEMPT_KEY, 0);
  }

  resultBox.innerHTML = `
    <div class="result-box fail">
      You scored ${score}/${drugQuestions.length}. 
      Attempts remaining: ${remaining > 0 ? remaining : 0}
    </div>
  `;
}
/* =========================================================
   ALCOHOL QUIZ ENGINE
========================================================= */

const PASS_SCORE_ALCOHOL = 5;

/* =========================
   ALCOHOL QUESTIONS
========================= */

const alcoholQuestions = [
  {
    q: "The term BAC refers to:",
    a: {
      A: "Baseline Alcohol Concentration",
      B: "Breath Alcohol Concentration",
      C: "Blood Alcohol Concentration",
      D: "Bloodstream Alcohol Concentration"
    },
    correct: "C"
  },
  {
    q: "Which is NOT a standard alcohol measure?",
    a: {
      A: "12 oz beer",
      B: "5 oz wine",
      C: "2 oz 80 proof liquor",
      D: "8 oz malt liquor"
    },
    correct: "B"
  },
  {
    q: "Binge drinking refers to:",
    a: {
      A: "For men, 10 or more drinks in a three hour period",
      B: "For men, 5 or more drinks during a single occasion",
      C: "For women, more than 7 drinks per day on average",
      D: "For women, drinking shots at a bar"
    },
    correct: "B"
  },
  {
    q: "Underage individuals begin drinking due to:",
    a: {
      A: "Peer pressure",
      B: "Increased independence or desire for alcohol",
      C: "Stress",
      D: "All of the above"
    },
    correct: "D"
  },
  {
    q: "Alcohol abuse is a progressive process of development. Which of thefollowing is not considered part of the process?",
    a: {
      A: "Being a social drinker",
      B: "Becoming an alcoholic",
      C: "Developing symptomatic drinking habits",
      D: "Developing neurological problems"
    },
    correct: "D"
  },
 {
    q: "Which of the following would not be considered an immediate health riskconcerning the consumption of alcohol?",
    a: {
      A: "Violent behavior",
      B: "Memory problem",
      C: "Alcohol poisoning",
      D: "Traffic injuries"
    },
    correct: "B"
  }
];

let alcoholPage = 0;
let alcoholAnswers = new Array(alcoholQuestions.length).fill(null);

function initAlcoholQuiz() {
  alcoholPage = 0;
  renderAlcoholQuiz();
}

function renderAlcoholQuiz() {

  const container = document.getElementById("alcoholQuizQuestions");
  container.innerHTML = "";

  const q = alcoholQuestions[alcoholPage];

  container.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-question">
        <span>Question ${alcoholPage + 1} of ${alcoholQuestions.length}</span>
        <h3>${q.q}</h3>
      </div>
      <div class="quiz-answers">
        ${Object.entries(q.a).map(([letter, text]) => `
          <label class="quiz-option">
            <input type="radio" name="alcoholQ" value="${letter}"
              ${alcoholAnswers[alcoholPage] === letter ? "checked" : ""}>
            <span>${letter}) ${text}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

document.getElementById("alcoholNextBtn")?.addEventListener("click", () => {
  saveAlcoholAnswer();

  if (alcoholPage < alcoholQuestions.length - 1) {
    alcoholPage++;
    renderAlcoholQuiz();
  } else {
    gradeAlcoholQuiz();
  }
});

document.getElementById("alcoholPrevBtn")?.addEventListener("click", () => {
  saveAlcoholAnswer();
  if (alcoholPage > 0) {
    alcoholPage--;
    renderAlcoholQuiz();
  }
});

function saveAlcoholAnswer() {
  const selected = document.querySelector("input[name='alcoholQ']:checked");
  if (selected) alcoholAnswers[alcoholPage] = selected.value;
}

function gradeAlcoholQuiz() {

  const resultBox = document.getElementById("alcoholQuizResult");

  const cooldownUntil = localStorage.getItem(ALCOHOL_COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < Number(cooldownUntil)) {

    const minutesLeft = Math.ceil(
      (Number(cooldownUntil) - Date.now()) / 60000
    );

    resultBox.innerHTML = `
      <div class="result-box fail">
        Cooldown active. Try again in ${minutesLeft} minute(s).
      </div>
    `;
    return;
  }

  let score = 0;
  alcoholQuestions.forEach((q, i) => {
    if (alcoholAnswers[i] === q.correct) score++;
  });

  let attempts = parseInt(localStorage.getItem(ALCOHOL_ATTEMPT_KEY)) || 0;

  if (score >= PASS_SCORE_ALCOHOL) {

    localStorage.setItem(ALCOHOL_QUIZ_KEY, "true");
    localStorage.setItem(MODULE_B_COMPLETED_KEY, "true");

    localStorage.removeItem(ALCOHOL_ATTEMPT_KEY);
    localStorage.removeItem(ALCOHOL_COOLDOWN_KEY);

    resultBox.innerHTML = `
      <div class="result-box pass">
        You passed Drug & Alcohol Training!
        Redirecting to dashboard...
      </div>
    `;

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 2000);

    return;
  }

  attempts++;
  localStorage.setItem(ALCOHOL_ATTEMPT_KEY, attempts);

  const remaining = MAX_ATTEMPTS - attempts;

  if (remaining <= 0) {
    localStorage.setItem(
      ALCOHOL_COOLDOWN_KEY,
      Date.now() + COOLDOWN_MINUTES * 60000
    );
    localStorage.setItem(ALCOHOL_ATTEMPT_KEY, 0);
  }

  resultBox.innerHTML = `
    <div class="result-box fail">
      You scored ${score}/${alcoholQuestions.length}.
      Attempts remaining: ${remaining > 0 ? remaining : 0}
    </div>
  `;
}
