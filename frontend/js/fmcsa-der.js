/* =========================================================
   FMCSA DER – PDF CONTENT ENGINE (Supervisor Architecture)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const DER_CONTENT_KEY = "der_fmcsa_content_done";

  const url = "../assets/FMCSA-DER-Drug-Alc-Reg-Training.pdf";

  const pdfContainer = document.getElementById("pdfContainer");
  const completeBtn = document.getElementById("completeContentBtn");

  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  const currentPageEl = document.getElementById("currentPage");
  const totalPagesEl = document.getElementById("totalPages");

  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;

  /* =========================================================
     LOAD PDF
  ========================================================= */

  pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc = pdf;
    totalPages = pdf.numPages;

    totalPagesEl.textContent = totalPages;

    renderPage(currentPage);
  });

  /* =========================================================
     RENDER PAGE (Responsive Fit)
  ========================================================= */

  function renderPage(num) {

  pdfDoc.getPage(num).then(page => {

    let containerWidth = pdfContainer.clientWidth;

    // Fallback if container width is 0
    if (!containerWidth || containerWidth < 100) {
      containerWidth = 800; // safe default width
    }

    const viewport = page.getViewport({ scale: 1 });

    const scale = containerWidth / viewport.width;

    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    pdfContainer.innerHTML = "";
    pdfContainer.appendChild(canvas);

    page.render({
      canvasContext: context,
      viewport: scaledViewport
    });

    currentPageEl.textContent = num;

    prevBtn.disabled = num === 1;
    nextBtn.disabled = num === totalPages;

    if (num === totalPages) {
      completeBtn.disabled = false;
    } else {
      completeBtn.disabled = true;
    }

  });
}

  /* =========================================================
     NAVIGATION BUTTONS
  ========================================================= */

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    }
  });

  /* =========================================================
     COMPLETE CONTENT
  ========================================================= */

  completeBtn.addEventListener("click", () => {

    localStorage.setItem(DER_CONTENT_KEY, "true");

    document.getElementById("contentSection").classList.add("hidden");
    document.getElementById("quizSection").classList.remove("hidden");

  });

  /* =========================================================
     RESTORE PROGRESS
  ========================================================= */

  if (localStorage.getItem(DER_CONTENT_KEY) === "true") {
    document.getElementById("contentSection").classList.add("hidden");
    document.getElementById("quizSection").classList.remove("hidden");
  }

/* =========================================================
   FMCSA DER – QUIZ ENGINE
========================================================= */

const DER_PASS_PERCENT = 80;
const DER_MAX_ATTEMPTS = 3;
const DER_COOLDOWN_MINUTES = 15;

const DER_QUIZ_PASSED_KEY = "der_fmcsa_quiz_passed";
const DER_ATTEMPTS_KEY = "der_fmcsa_quiz_attempts";
const DER_COOLDOWN_KEY = "der_fmcsa_quiz_cooldown";

/* =========================================================
   QUESTIONS
========================================================= */

const derQuestions = [

  {
    q: "Who is responsible for overseeing a company's DOT drug and alcohol testing program?",
    a: {
      A: "The Safety Director",
      B: "The Designated Employer Representative (DER)",
      C: "The Driver",
      D: "The Medical Review Officer"
    },
    correct: "B"
  },

  {
    q: "Under 49 CFR Part 382, the DER must ensure testing is conducted when?",
    a: {
      A: "Only after accidents",
      B: "Randomly and as required by regulation",
      C: "Once per year",
      D: "Only when requested by drivers"
    },
    correct: "B"
  },

  {
    q: "Who receives test results from the Medical Review Officer (MRO)?",
    a: {
      A: "The driver",
      B: "The DER",
      C: "The dispatcher",
      D: "The HR assistant"
    },
    correct: "B"
  },

  {
    q: "What must the DER ensure regarding records?",
    a: {
      A: "They are destroyed immediately",
      B: "They are shared publicly",
      C: "They are maintained according to FMCSA retention rules",
      D: "They are optional"
    },
    correct: "C"
  },

  {
    q: "If a driver tests positive, the DER must:",
    a: {
      A: "Ignore it",
      B: "Allow the driver to continue driving",
      C: "Remove the driver from safety-sensitive duties",
      D: "Wait 30 days"
    },
    correct: "C"
  }

];

/* =========================================================
   ENGINE VARIABLES
========================================================= */

let currentQuestionIndex = 0;
let selectedAnswers = {};
let derAttempts = parseInt(localStorage.getItem(DER_ATTEMPTS_KEY) || "0", 10);

const quizContainer = document.getElementById("quizContainer");
const prevBtn = document.getElementById("prevQuestionBtn");
const nextBtn = document.getElementById("nextQuestionBtn");
const submitBtn = document.getElementById("submitQuizBtn");
const resultBox = document.getElementById("quizResult");

const currentQuestionEl = document.getElementById("currentQuestion");
const totalQuestionsEl = document.getElementById("totalQuestions");

if (quizContainer) initDerQuiz();

/* =========================================================
   INIT
========================================================= */

function initDerQuiz() {

  totalQuestionsEl.textContent = derQuestions.length;

  if (localStorage.getItem(DER_QUIZ_PASSED_KEY) === "true") {
    showCertificateSection();
    return;
  }

  checkCooldown();

  renderQuestion();
}

/* =========================================================
   RENDER QUESTION
========================================================= */

function renderQuestion() {

  const question = derQuestions[currentQuestionIndex];

  quizContainer.innerHTML = `
    <div class="question">
      <p><strong>${question.q}</strong></p>
      <div class="answers">
        ${Object.entries(question.a).map(([key, value]) => `
          <label>
            <input type="radio" name="answer" value="${key}"
              ${selectedAnswers[currentQuestionIndex] === key ? "checked" : ""}
            />
            ${key}. ${value}
          </label>
        `).join("")}
      </div>
    </div>
  `;

  currentQuestionEl.textContent = currentQuestionIndex + 1;

  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === derQuestions.length - 1;

  updateSubmitState();

  document.querySelectorAll("input[name='answer']").forEach(input => {
    input.addEventListener("change", e => {
      selectedAnswers[currentQuestionIndex] = e.target.value;
      updateSubmitState();
    });
  });
}

/* =========================================================
   NAVIGATION
========================================================= */

prevBtn.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentQuestionIndex < derQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  }
});

/* =========================================================
   SUBMIT LOGIC
========================================================= */

submitBtn.addEventListener("click", () => {

  let correctCount = 0;

  derQuestions.forEach((question, index) => {
    if (selectedAnswers[index] === question.correct) {
      correctCount++;
    }
  });

  const scorePercent = Math.round((correctCount / derQuestions.length) * 100);

  if (scorePercent >= DER_PASS_PERCENT) {

    localStorage.setItem(DER_QUIZ_PASSED_KEY, "true");

    resultBox.innerHTML = `
      <div class="result-box pass">
        ✅ You passed with ${scorePercent}%.
      </div>
    `;

    setTimeout(showCertificateSection, 1200);

  } else {

    derAttempts++;
    localStorage.setItem(DER_ATTEMPTS_KEY, derAttempts);

    if (derAttempts >= DER_MAX_ATTEMPTS) {
      const cooldownUntil = Date.now() + DER_COOLDOWN_MINUTES * 60000;
      localStorage.setItem(DER_COOLDOWN_KEY, cooldownUntil);
      alert("Maximum attempts reached. 15-minute cooldown activated.");
      location.reload();
      return;
    }

    resultBox.innerHTML = `
      <div class="result-box fail">
        ❌ You scored ${scorePercent}%. Attempt ${derAttempts} of ${DER_MAX_ATTEMPTS}.
      </div>
    `;
  }
});

/* =========================================================
   SUBMIT ENABLE CHECK
========================================================= */

function updateSubmitState() {
  const answeredAll = Object.keys(selectedAnswers).length === derQuestions.length;
  submitBtn.disabled = !answeredAll;
}

/* =========================================================
   COOLDOWN CHECK
========================================================= */

function checkCooldown() {
  const cooldownUntil = parseInt(localStorage.getItem(DER_COOLDOWN_KEY) || "0", 10);

  if (Date.now() < cooldownUntil) {
    const minutesLeft = Math.ceil((cooldownUntil - Date.now()) / 60000);
    alert(`Quiz locked. Try again in ${minutesLeft} minutes.`);
    window.location.href = "dashboard.html";
  }
}

/* =========================================================
   CERTIFICATE UNLOCK
========================================================= */

function showCertificateSection() {
  document.getElementById("quizSection").classList.add("hidden");
  document.getElementById("certificateSection").classList.remove("hidden");
}
});
