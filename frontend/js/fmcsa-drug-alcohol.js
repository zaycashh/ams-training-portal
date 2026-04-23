/* =========================================================
   FMCSA DRUG & ALCOHOL MODULE (MODULE B)
   Mirrors Supervisor Architecture
========================================================= */

/* -------------------------
   TOAST HELPER
-------------------------- */
function showToast(msg, type, duration) {
  type = type || "info"; duration = duration || 3500;
  document.querySelectorAll(".ams-toast").forEach(function(t){t.remove();});
  var toast = document.createElement("div");
  toast.className = "ams-toast toast-" + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function(){toast.remove();}, duration);
}

/* -------------------------
   USER
-------------------------- */
const user  = JSON.parse(localStorage.getItem("amsUser") || "null");
const email = user?.email;

const MODULE_B_CERT_ID_KEY   = `fmcsaModuleBCertificateId_${email}`;
const MODULE_B_COMPLETED_KEY = `fmcsaModuleBCompleted_${email}`;
const MODULE_A_COMPLETED_KEY = `fmcsaModuleACompleted_${email}`;
const DRUG_CONTENT_KEY       = `fmcsaDrugContentCompleted_${email}`;
const DRUG_QUIZ_KEY          = `fmcsaDrugQuizPassed_${email}`;
const ALCOHOL_CONTENT_KEY    = `fmcsaAlcoholContentCompleted_${email}`;
const ALCOHOL_QUIZ_KEY       = `fmcsaAlcoholQuizPassed_${email}`;

/* -------------------------
   ATTEMPTS + COOLDOWN
-------------------------- */
const MAX_ATTEMPTS     = 3;
const COOLDOWN_MINUTES = 15;
const DRUG_ATTEMPT_KEY    = "fmcsaDrugAttempts";
const DRUG_COOLDOWN_KEY   = "fmcsaDrugCooldown";
const ALCOHOL_ATTEMPT_KEY = "fmcsaAlcoholAttempts";
const ALCOHOL_COOLDOWN_KEY = "fmcsaAlcoholCooldown";

/* =========================================================
   PDF.JS WORKER
========================================================= */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* =========================================================
   EXPIRATION CHECK
========================================================= */
function isFMCSAExpired() {
  const start = localStorage.getItem("fmcsa_start_date");
  if (!start) return false;
  const elapsed = Date.now() - Number(start);
  return Math.floor(elapsed / 86400000) >= 30;
}

/* =========================================================
   PILL NAV HELPER
========================================================= */
function setNavActive(btnId) {
  document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add("active");
}

function enableNav(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.disabled = false; btn.classList.add("done"); }
}

/* =========================================================
   SECTION CONTROL
========================================================= */
function showSection(id) {
  [
    "drugContentSection","drugQuizSection",
    "alcoholContentSection","alcoholQuizSection","moduleBCertificateSection"
  ].forEach(s => {
    document.getElementById(s)?.classList.add("hidden");
  });
  document.getElementById(id)?.classList.remove("hidden");

  const navMap = {
    drugContentSection:        "btnDrugContent",
    drugQuizSection:           "btnDrugQuiz",
    alcoholContentSection:     "btnAlcoholContent",
    alcoholQuizSection:        "btnAlcoholQuiz",
    moduleBCertificateSection: "btnCertificate"
  };
  setNavActive(navMap[id] || "btnDrugContent");
}

/* =========================================================
   CERTIFICATE DISPLAY
========================================================= */
function showModuleBCertificate() {
  showSection("moduleBCertificateSection");
  enableNav("btnCertificate");

  const u = JSON.parse(localStorage.getItem("amsUser") || "null");
  const fullName = u?.fullName ||
    `${u?.firstName || ""} ${u?.lastName || ""}`.trim() ||
    u?.email || "User";

  const certId = localStorage.getItem(MODULE_B_CERT_ID_KEY) || "";
  const certDate = localStorage.getItem(`fmcsaModuleBDate_${email}`)
    ? new Date(Number(localStorage.getItem(`fmcsaModuleBDate_${email}`))).toLocaleDateString("en-US")
    : new Date().toLocaleDateString("en-US");

  const nameEl = document.getElementById("moduleBCertName");
  const dateEl = document.getElementById("moduleBCertDate");
  const idEl   = document.getElementById("moduleBCertId");
  if (nameEl) nameEl.textContent = fullName;
  if (dateEl) dateEl.textContent = certDate;
  if (idEl)   idEl.textContent   = certId;
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {

  /* EXPIRATION */
  if (isFMCSAExpired()) {
    localStorage.removeItem(`fmcsaModuleACompleted_${email}`);
    localStorage.removeItem(`fmcsaModuleBCompleted_${email}`);
    localStorage.removeItem(`fmcsaDrugQuizPassed_${email}`);
    localStorage.removeItem(`fmcsaAlcoholQuizPassed_${email}`);
    localStorage.removeItem(`fmcsaDrugContentCompleted_${email}`);
    localStorage.removeItem(`fmcsaAlcoholContentCompleted_${email}`);
    localStorage.removeItem(`fmcsaModuleADate_${email}`);
    localStorage.removeItem(`fmcsaModuleBDate_${email}`);
    localStorage.removeItem(`fmcsaModuleACertificateId_${email}`);
    localStorage.removeItem(`fmcsaModuleBCertificateId_${email}`);
    sessionStorage.setItem("ams_notice", "FMCSA training window expired. Repurchase required.");
    window.location.replace("dashboard.html");
    return;
  }

  /* MODULE B ALREADY COMPLETE */
  if (localStorage.getItem(MODULE_B_COMPLETED_KEY) === "true") {
    showModuleBCertificate();
    return;
  }

  /* PREREQUISITE: MODULE A */
  if (localStorage.getItem(MODULE_A_COMPLETED_KEY) !== "true") {
    sessionStorage.setItem("ams_notice", "Complete Module A (Reasonable Suspicion) first.");
    window.location.href = "dashboard.html";
    return;
  }

  /* -------------------------------------------------------
     DRUG PDF ENGINE
  ------------------------------------------------------- */
  const DRUG_PDF_URL = "../assets/fmcsa/2-Drug-Training.pdf";
  let drugPdfDoc = null, drugCurrentPage = 1, drugTotalPages = 0, drugRenderTask = null;
  const drugCanvas = document.getElementById("drugPdfCanvas");
  const drugCtx    = drugCanvas ? drugCanvas.getContext("2d") : null;

  if (drugCanvas) {
    pdfjsLib.getDocument(DRUG_PDF_URL).promise
      .then(pdf => {
        drugPdfDoc = pdf;
        drugTotalPages = pdf.numPages;
        document.getElementById("drugTotalPages").textContent = drugTotalPages;
        renderDrugPage(drugCurrentPage);
      })
      .catch(err => console.error("Drug PDF load error:", err));
  }

  function renderDrugPage(pageNum) {
    if (drugRenderTask) drugRenderTask.cancel();
    drugPdfDoc.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale: 1.2 });
      drugCanvas.height = viewport.height;
      drugCanvas.width  = viewport.width;
      drugRenderTask = page.render({ canvasContext: drugCtx, viewport });
      drugRenderTask.promise.catch(() => {});
      document.getElementById("drugCurrentPage").textContent = pageNum;
      updateDrugProgress();
    });
  }

  function updateDrugProgress() {
    const pct = (drugCurrentPage / drugTotalPages) * 100;
    document.getElementById("drugProgressBar").style.width = pct + "%";
    const btn = document.getElementById("takeDrugQuizBtn");
    if (btn) {
      if (drugCurrentPage === drugTotalPages) btn.classList.remove("hidden");
      else btn.classList.add("hidden");
    }
  }

  document.getElementById("drugNextPageBtn")?.addEventListener("click", () => {
    if (drugCurrentPage < drugTotalPages) { drugCurrentPage++; renderDrugPage(drugCurrentPage); }
  });
  document.getElementById("drugPrevPageBtn")?.addEventListener("click", () => {
    if (drugCurrentPage > 1) { drugCurrentPage--; renderDrugPage(drugCurrentPage); }
  });

  /* -------------------------------------------------------
     ALCOHOL PDF ENGINE
  ------------------------------------------------------- */
  const ALCOHOL_PDF_URL = "../assets/fmcsa/3-Alcohol-Training.pdf";
  let alcoholPdfDoc = null, alcoholCurrentPage = 1, alcoholTotalPages = 0;
  let alcoholRendering = false, alcoholRenderTask = null;
  const alcoholCanvas = document.getElementById("alcoholPdfCanvas");
  const alcoholCtx    = alcoholCanvas ? alcoholCanvas.getContext("2d") : null;

  if (alcoholCanvas) {
    pdfjsLib.getDocument(ALCOHOL_PDF_URL).promise
      .then(pdf => {
        alcoholPdfDoc = pdf;
        alcoholTotalPages = pdf.numPages;
        document.getElementById("alcoholTotalPages").textContent = alcoholTotalPages;
        renderAlcoholPage(alcoholCurrentPage);
      })
      .catch(err => console.error("Alcohol PDF load error:", err));
  }

  function renderAlcoholPage(pageNum) {
    if (alcoholRendering && alcoholRenderTask) alcoholRenderTask.cancel();
    alcoholRendering = true;
    alcoholPdfDoc.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale: 1.2 });
      alcoholCanvas.height = viewport.height;
      alcoholCanvas.width  = viewport.width;
      alcoholRenderTask = page.render({ canvasContext: alcoholCtx, viewport });
      alcoholRenderTask.promise
        .then(() => { alcoholRendering = false; })
        .catch(() => { alcoholRendering = false; });
      document.getElementById("alcoholCurrentPage").textContent = pageNum;
      updateAlcoholProgress();
    });
  }

  function updateAlcoholProgress() {
    const pct = (alcoholCurrentPage / alcoholTotalPages) * 100;
    document.getElementById("alcoholProgressBar").style.width = pct + "%";
    const btn = document.getElementById("takeAlcoholQuizBtn");
    if (btn) {
      if (alcoholCurrentPage === alcoholTotalPages) btn.classList.remove("hidden");
      else btn.classList.add("hidden");
    }
  }

  document.getElementById("alcoholNextPageBtn")?.addEventListener("click", () => {
    if (alcoholCurrentPage < alcoholTotalPages) { alcoholCurrentPage++; renderAlcoholPage(alcoholCurrentPage); }
  });
  document.getElementById("alcoholPrevPageBtn")?.addEventListener("click", () => {
    if (alcoholCurrentPage > 1) { alcoholCurrentPage--; renderAlcoholPage(alcoholCurrentPage); }
  });

  restoreProgress();
  wireButtons();
});

/* =========================================================
   RESTORE PROGRESS
========================================================= */
function restoreProgress() {
  const drugPassed    = localStorage.getItem(DRUG_QUIZ_KEY) === "true";
  const alcoholPassed = localStorage.getItem(ALCOHOL_QUIZ_KEY) === "true";

  if (!drugPassed) {
    if (localStorage.getItem(DRUG_CONTENT_KEY) === "true") {
      enableNav("btnDrugQuiz");
      showSection("drugQuizSection");
      initDrugQuiz();
    } else {
      showSection("drugContentSection");
    }
    return;
  }

  enableNav("btnDrugQuiz");
  enableNav("btnAlcoholContent");

  if (drugPassed && !alcoholPassed) {
    if (localStorage.getItem(ALCOHOL_CONTENT_KEY) === "true") {
      enableNav("btnAlcoholQuiz");
      showSection("alcoholQuizSection");
      initAlcoholQuiz();
    } else {
      showSection("alcoholContentSection");
    }
    return;
  }

  if (drugPassed && alcoholPassed) {
    enableNav("btnAlcoholQuiz");
    showModuleBCertificate();
  }
}

/* =========================================================
   BUTTON WIRING
========================================================= */
function wireButtons() {
  document.getElementById("takeDrugQuizBtn")?.addEventListener("click", () => {
    localStorage.setItem(DRUG_CONTENT_KEY, "true");
    enableNav("btnDrugQuiz");
    showSection("drugQuizSection");
    initDrugQuiz();
  });

  document.getElementById("takeAlcoholQuizBtn")?.addEventListener("click", () => {
    localStorage.setItem(ALCOHOL_CONTENT_KEY, "true");
    enableNav("btnAlcoholQuiz");
    showSection("alcoholQuizSection");
    initAlcoholQuiz();
  });
}

/* =========================================================
   DRUG QUESTIONS
========================================================= */
const drugQuestions = [
  { q:"Which of the following is true concerning a substance abuser?", a:{A:"The abuser lacks moral principles to stop their dependency",B:"The abuser lacks the will power to stop their dependency",C:"The abuser's dependency is a complex disorder and quitting takes more than good intentions or a strong will.",D:"The drugs have changed the abuser's brain so they cannot stop their dependency"}, correct:"C" },
  { q:"What percentage of substance abusers are employed?", a:{A:"10%",B:"25%",C:"50%",D:"75%"}, correct:"D" },
  { q:"Crack is a form of what drug?", a:{A:"Amphetamine capsules",B:"Cocaine",C:"Marijuana",D:"Opium"}, correct:"B" },
  { q:"When smoking marijuana, which ingredient passes into bloodstream?", a:{A:"TCH",B:"THE",C:"THC",D:"None of the above"}, correct:"C" },
  { q:"Methamphetamine can be taken", a:{A:"Orally",B:"Snorted",C:"Injected",D:"All of the above"}, correct:"D" },
  { q:"The term \"opiate\" refers to a number of different substances synthesized from the poppy plant. Which of the following is NOT one of the substances?", a:{A:"Codeine",B:"Morphine",C:"Dioxelene-B",D:"Hydrocodone"}, correct:"C" },
  { q:"PCP is a very unpredictable drug that often produces:", a:{A:"Violent behavior",B:"Bad trips",C:"Self mutilation",D:"All of these"}, correct:"D" },
  { q:"Speech patterns can be affected by substance abuse. True or False?", a:{A:"True",B:"False"}, correct:"A" },
  { q:"Extreme hyperactivity, Nausea, and Secretive or suspicious behavior are all physical warning signs of addiction. True or False?", a:{A:"True",B:"False"}, correct:"B" }
];

let drugPage = 0;
let drugAnswers = new Array(drugQuestions.length).fill(null);

function calculateDrugPassScore() { return Math.ceil(drugQuestions.length * 0.8); }

function initDrugQuiz() { drugPage = 0; renderDrugQuiz(); }

function renderDrugQuiz() {
  const container = document.getElementById("drugQuizQuestions");
  if (!container) return;
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
            <input type="radio" name="drugQ" value="${letter}" ${drugAnswers[drugPage] === letter ? "checked" : ""}>
            <span>${letter}) ${text}</span>
          </label>
        `).join("")}
      </div>
    </div>`;
  const nextBtn = document.getElementById("drugNextBtn");
  if (nextBtn) nextBtn.textContent = drugPage === drugQuestions.length - 1 ? "Submit" : "Next →";
}

document.getElementById("drugNextBtn")?.addEventListener("click", () => {
  saveDrugAnswer();
  if (drugPage < drugQuestions.length - 1) { drugPage++; renderDrugQuiz(); }
  else gradeDrugQuiz();
});

document.getElementById("drugPrevBtn")?.addEventListener("click", () => {
  saveDrugAnswer();
  if (drugPage > 0) { drugPage--; renderDrugQuiz(); }
});

function saveDrugAnswer() {
  const sel = document.querySelector("input[name='drugQ']:checked");
  if (sel) drugAnswers[drugPage] = sel.value;
}

function gradeDrugQuiz() {
  const resultBox = document.getElementById("drugQuizResult");

  const cooldownUntil = localStorage.getItem(DRUG_COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
    const mins = Math.ceil((Number(cooldownUntil) - Date.now()) / 60000);
    showToast(`Quiz locked. Try again in ${mins} minute(s).`, "error");
    return;
  }

  let score = 0;
  drugQuestions.forEach((q, i) => { if (drugAnswers[i] === q.correct) score++; });

  let attempts = parseInt(localStorage.getItem(DRUG_ATTEMPT_KEY)) || 0;

  if (score >= calculateDrugPassScore()) {
    localStorage.setItem(DRUG_QUIZ_KEY, "true");
    localStorage.removeItem(DRUG_ATTEMPT_KEY);
    localStorage.removeItem(DRUG_COOLDOWN_KEY);
    resultBox.innerHTML = `<div class="result-box pass">Drug Quiz Passed! Unlocking Alcohol Training...</div>`;
    enableNav("btnAlcoholContent");
    setTimeout(() => showSection("alcoholContentSection"), 1500);
    return;
  }

  attempts++;
  localStorage.setItem(DRUG_ATTEMPT_KEY, attempts);
  const remaining = MAX_ATTEMPTS - attempts;

  if (remaining <= 0) {
    localStorage.setItem(DRUG_COOLDOWN_KEY, Date.now() + COOLDOWN_MINUTES * 60000);
    localStorage.setItem(DRUG_ATTEMPT_KEY, 0);
    showToast("Maximum attempts reached. Quiz locked for 15 minutes.", "error", 5000);
    setTimeout(() => window.location.href = "dashboard.html", 2000);
    return;
  }

  resultBox.innerHTML = `<div class="result-box fail">You scored ${score}/${drugQuestions.length}. Attempts remaining: ${remaining}</div>`;
}

/* =========================================================
   ALCOHOL QUESTIONS
========================================================= */
const alcoholQuestions = [
  { q:"The term BAC refers to:", a:{A:"Baseline Alcohol Concentration",B:"Breath Alcohol Concentration",C:"Blood Alcohol Concentration",D:"Bloodstream Alcohol Concentration"}, correct:"C" },
  { q:"Which is NOT a standard alcohol measure?", a:{A:"12 oz beer",B:"5 oz wine",C:"2 oz 80 proof liquor",D:"8 oz malt liquor"}, correct:"B" },
  { q:"Binge drinking refers to:", a:{A:"For men, 10 or more drinks in a three hour period",B:"For men, 5 or more drinks during a single occasion",C:"For women, more than 7 drinks per day on average",D:"For women, drinking shots at a bar"}, correct:"B" },
  { q:"Underage individuals begin drinking due to:", a:{A:"Peer pressure",B:"Increased independence or desire for alcohol",C:"Stress",D:"All of the above"}, correct:"D" },
  { q:"Alcohol abuse is a progressive process of development. Which of the following is not considered part of the process?", a:{A:"Being a social drinker",B:"Becoming an alcoholic",C:"Developing symptomatic drinking habits",D:"Developing neurological problems"}, correct:"D" },
  { q:"Which of the following would not be considered an immediate health risk concerning the consumption of alcohol?", a:{A:"Violent behavior",B:"Memory problem",C:"Alcohol poisoning",D:"Traffic injuries"}, correct:"B" }
];

const PASS_SCORE_ALCOHOL = 5;
let alcoholPage = 0;
let alcoholAnswers = new Array(alcoholQuestions.length).fill(null);

function initAlcoholQuiz() { alcoholPage = 0; renderAlcoholQuiz(); }

function renderAlcoholQuiz() {
  const container = document.getElementById("alcoholQuizQuestions");
  if (!container) return;
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
            <input type="radio" name="alcoholQ" value="${letter}" ${alcoholAnswers[alcoholPage] === letter ? "checked" : ""}>
            <span>${letter}) ${text}</span>
          </label>
        `).join("")}
      </div>
    </div>`;
  const nextBtn = document.getElementById("alcoholNextBtn");
  if (nextBtn) nextBtn.textContent = alcoholPage === alcoholQuestions.length - 1 ? "Submit" : "Next →";
}

document.getElementById("alcoholNextBtn")?.addEventListener("click", () => {
  saveAlcoholAnswer();
  if (alcoholPage < alcoholQuestions.length - 1) { alcoholPage++; renderAlcoholQuiz(); }
  else gradeAlcoholQuiz();
});

document.getElementById("alcoholPrevBtn")?.addEventListener("click", () => {
  saveAlcoholAnswer();
  if (alcoholPage > 0) { alcoholPage--; renderAlcoholQuiz(); }
});

function saveAlcoholAnswer() {
  const sel = document.querySelector("input[name='alcoholQ']:checked");
  if (sel) alcoholAnswers[alcoholPage] = sel.value;
}

function gradeAlcoholQuiz() {
  const resultBox = document.getElementById("alcoholQuizResult");

  const cooldownUntil = localStorage.getItem(ALCOHOL_COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < Number(cooldownUntil)) {
    const mins = Math.ceil((Number(cooldownUntil) - Date.now()) / 60000);
    showToast(`Quiz locked. Try again in ${mins} minute(s).`, "error");
    return;
  }

  let score = 0;
  alcoholQuestions.forEach((q, i) => { if (alcoholAnswers[i] === q.correct) score++; });
  let attempts = parseInt(localStorage.getItem(ALCOHOL_ATTEMPT_KEY)) || 0;

  if (score >= PASS_SCORE_ALCOHOL) {
    localStorage.setItem(MODULE_B_COMPLETED_KEY, "true");
    localStorage.setItem(`fmcsaModuleBDate_${email}`, Date.now());

    let certId = localStorage.getItem(MODULE_B_CERT_ID_KEY);
    if (!certId && typeof generateCertificateId === "function") {
      certId = generateCertificateId("AMS-SUP");
      localStorage.setItem(MODULE_B_CERT_ID_KEY, certId);
    }

    /* Save cert ID into companyProfile so admin can view it */
    try {
      const cp = JSON.parse(localStorage.getItem("companyProfile") || "{}");
      if (!cp.certIds) cp.certIds = {};
      cp.certIds[email] = { certId, type: "supervisor", date: Date.now() };
      localStorage.setItem("companyProfile", JSON.stringify(cp));
    } catch(e) {}

    if (typeof generateSupervisorCertificate === "function") generateSupervisorCertificate();

    localStorage.removeItem(ALCOHOL_ATTEMPT_KEY);
    localStorage.removeItem(ALCOHOL_COOLDOWN_KEY);

    resultBox.innerHTML = `<div class="result-box pass">You passed the Alcohol Quiz! Generating certificate...</div>`;
    showToast("Module B complete! Certificate generated.", "success");
    setTimeout(() => showModuleBCertificate(), 1500);
    return;
  }

  attempts++;
  localStorage.setItem(ALCOHOL_ATTEMPT_KEY, attempts);
  const remaining = MAX_ATTEMPTS - attempts;

  if (remaining <= 0) {
    localStorage.setItem(ALCOHOL_COOLDOWN_KEY, Date.now() + COOLDOWN_MINUTES * 60000);
    localStorage.setItem(ALCOHOL_ATTEMPT_KEY, 0);
    showToast("Maximum attempts reached. Quiz locked for 15 minutes.", "error", 5000);
    setTimeout(() => window.location.href = "dashboard.html", 2000);
    return;
  }

  resultBox.innerHTML = `<div class="result-box fail">You scored ${score}/${alcoholQuestions.length}. Attempts remaining: ${remaining}</div>`;
}

function returnToDashboard() { window.location.href = "dashboard.html"; }
