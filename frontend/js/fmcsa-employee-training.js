/* ── Save training progress to Supabase (non-blocking) ── */
async function saveTrainingProgress(module, program, completedAt, certId) {
  try {
    const u = JSON.parse(localStorage.getItem('amsUser') || 'null');
    if (!u || !u.id) return;
    const row = {
      user_id:      u.id,
      email:        u.email || '',
      module,
      program,
      completed:    true,
      completed_at: completedAt || new Date().toISOString()
    };
    if (certId) row.cert_id = certId;
    await db.from('training_progress').upsert([row], { onConflict: 'email,module,program' });
  } catch(e) { console.warn('Supabase progress save failed:', e); }
}

document.addEventListener("DOMContentLoaded", () => {

function goDashboard() {
  const u = JSON.parse(localStorage.getItem("amsUser") || "null");
  const isAdmin = u && (u.role === "company_admin" || u.role === "owner" || u.role === "admin");
  window.location.href = isAdmin ? "company-dashboard.html" : "dashboard.html";
}

const user  = JSON.parse(localStorage.getItem("amsUser") || "{}");
const email = user.email;
let questions = [];

/* =========================================================
   CONFIG KEYS
========================================================= */

const CONTENT_KEY   = `fmcsaEmployeeContentCompleted_${email}`;
const QUIZ_KEY      = `fmcsaEmployeeQuizPassed_${email}`;
const COMPLETED_KEY = `fmcsaEmployeeCompleted_${email}`;
const ATTEMPTS_KEY  = `fmcsaEmployeeAttempts_${email}`;
const COOLDOWN_KEY  = `fmcsaEmployeeCooldown_${email}`;
const CERT_ID_KEY   = `fmcsaEmployeeCertificateId_${email}`;
const CERT_DATE_KEY = `fmcsaEmployeeDate_${email}`;

/* =========================================================
   QUIZ SETTINGS
========================================================= */

const PASS_PERCENT     = 80;
const MAX_ATTEMPTS     = 3;
const COOLDOWN_MINUTES = 15;

/* =========================================================
   TOAST HELPER
========================================================= */

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `ams-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* =========================================================
   PDF CONFIG
========================================================= */

const url = "../assets/fmcsa/fmcsa-employee-drug-alcohol-regulations.pdf";

const pdfContainer  = document.getElementById("pdfContainer");
const completeBtn   = document.getElementById("takeQuizBtn");
const prevPageBtn   = document.getElementById("prevPageBtn");
const nextPageBtn   = document.getElementById("nextPageBtn");
const currentPageEl = document.getElementById("currentPage");
const totalPagesEl  = document.getElementById("totalPages");

let pdfDoc      = null;
let currentPage = 1;
let totalPages  = 0;

/* =========================================================
   PDF LOADER
========================================================= */

if (pdfContainer) {
  pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc      = pdf;
    totalPages  = pdf.numPages;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    renderPage(currentPage);
  });
}

function renderPage(num) {
  pdfDoc.getPage(num).then(page => {
    let containerWidth = pdfContainer.clientWidth || 800;
    const viewport       = page.getViewport({ scale: 1 });
    const scale          = containerWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas  = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = scaledViewport.height;
    canvas.width  = scaledViewport.width;

    pdfContainer.innerHTML = "";
    pdfContainer.appendChild(canvas);

    page.render({ canvasContext: context, viewport: scaledViewport });

    if (currentPageEl) currentPageEl.textContent = num;
    if (prevPageBtn)   prevPageBtn.disabled = num === 1;
    if (nextPageBtn)   nextPageBtn.disabled = num === totalPages;

    if (completeBtn) {
      if (num >= totalPages) {
        completeBtn.style.display = "block";
        completeBtn.disabled      = false;
        completeBtn.textContent   = "Take Quiz";
      } else {
        completeBtn.style.display = "none";
      }
    }
  });
}

/* =========================================================
   PDF NAVIGATION
========================================================= */

if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderPage(currentPage); }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
  });
}

/* =========================================================
   CONTENT COMPLETE
========================================================= */

if (completeBtn) {
  completeBtn.addEventListener("click", () => {
    localStorage.setItem(CONTENT_KEY, "true");
    localStorage.removeItem(`fmcsaEmployeeAnswers_${email}`);
    document.getElementById("contentSection").classList.add("hidden");
    document.getElementById("quizSection").classList.remove("hidden");
  });
}

/* =========================================================
   QUIZ QUESTIONS
========================================================= */

questions = [
  {
    q: "Who is subject to DOT drug testing?",
    a: {
      A: "All transit personnel",
      B: "An employee position classified as a safety-sensitive function",
      C: "All warehouse personnel",
      D: "A driver of farm equipment"
    },
    correct: "B"
  },
  {
    q: "Which drug is NOT tested under DOT regulations?",
    a: {
      A: "Marijuana",
      B: "Phencyclidine (PCP)",
      C: "Opiates",
      D: "Barbiturates"
    },
    correct: "D"
  },
  {
    q: "Drug testing is NOT required for which type of occasion?",
    a: {
      A: "Periodic",
      B: "Post-Accident",
      C: "Pre-Employment",
      D: "Random"
    },
    correct: "A"
  },
  {
    q: "Under the DOT, the required number of drug panels is?",
    a: { A: "5", B: "3", C: "7", D: "9" },
    correct: "A"
  },
  {
    q: "The individual who makes the final determination of a drug test result is the?:",
    a: {
      A: "Designated Employer Representative (DER)",
      B: "Medical Review Officer (MRO)",
      C: "Substance Abuse Professional (SAP)",
      D: "Company official in charge of the drug and alcohol testing program"
    },
    correct: "B"
  },
  {
    q: "Which conduct is prohibited under the DOT regulations?",
    a: {
      A: "You must not use or possess alcohol or any illicit drug while assigned to perform safety-sensitive functions or actually performing safety-sensitive functions",
      B: "Reporting for service or remaining on duty while under the influence of alcohol",
      C: "Having a blood alcohol concentration of 0.04 or greater",
      D: "All of the above"
    },
    correct: "D"
  },
  {
    q: "A DOT driver has been selected for a random test. The driver reports to the collection site on time and cannot provide a urine specimen. Which of the following is True?",
    a: {
      A: "The driver will sign the Custody and Control Form and state that he/she cannot provide a specimen and will leave.",
      B: "The collector will inform the driver to go back to his employer and inform them that he has to be re-scheduled for another test.",
      C: "The collector will inform the company's DER and advise them of the situation. The DER will instruct the collector to have a blood test as a substitute test in order to comply with the DOT regulations.",
      D: "The driver will stay in the collection area, drink up to 40 oz. of fluid over a three hour period, and attempt to provide the required urine specimen."
    },
    correct: "D"
  },
  {
    q: "Which of the following is considered a refusal to test?",
    a: {
      A: "Failing to appear for a random drug test when instructed",
      B: "Failing to provide a urine specimen when required",
      C: "Leaving the collection site before the test process is completed",
      D: "All of the above"
    },
    correct: "D"
  },
  {
    q: "How many unannounced drug tests is a DOT covered employee required to take in the first 12 months after having returned to service?",
    a: { A: "5", B: "8", C: "3", D: "6" },
    correct: "D"
  },
  {
    q: "A driver tests positive for a controlled substance. The driver completes all regulatory requirements concerning Return-to-duty. Upon returning to a safety-sensitive job, the driver will be subject to unannounced testing for drugs and/or alcohol no less than 6 times during the first 12 months of active service with the possibility unannounced tests up to how many months (as prescribed by the SAP)?",
    a: { A: "20", B: "40", C: "60", D: "30" },
    correct: "C"
  },
  {
    q: "From the time you were hired, you feel that your supervisor does not like you. Your supervisor informs you that you have been selected for a DOT Random drug test but you feel you have been selected unfairly. Which of the following statements is TRUE?",
    a: {
      A: "Don't go for the test because you feel that he is trying to create a hostile situation.",
      B: "You can immediately go to your human resource department and submit a grievance and wait for a decision concerning your grievance. If it is deemed valid, you do not have to be tested",
      C: "A fellow employee will state for the record that your boss does not like you. Because of this fact, you can refuse to take the test.",
      D: "You cannot interfere with the testing process, you must take the test."
    },
    correct: "D"
  },
  {
    q: "You were selected for a Random drug test, have gone for the collection, and were advised by the MRO that your test result was positive for a drug. As a result of the phone interview with the MRO, he has informed you that the test will be reported as a verified positive. The MRO has explained to you that you have how many hours in which you can request a re-testing of the split-specimen (Bottle B)?",
    a: { A: "24", B: "36", C: "72", D: "48" },
    correct: "C"
  },
  {
    q: "If an employee has a medical marijuana card and tests positive on a DOT test, the result will NOT be considered positive.",
    a: { A: "True", B: "False" },
    correct: "B"
  },
  {
    q: "Recently, some states passed initiatives to permit use of marijuana for so-called \"recreational\" purposes. A driver tests Positive and due to the State's new legislation, the driver would NOT be subject the DOT Drug testing regulations as they apply to marijuana. TRUE or FALSE?",
    a: { A: "True", B: "False" },
    correct: "B"
  },
  {
    q: "You are involved in an accident where another driver is killed but was at fault. You are NOT required to take a DOT drug and alcohol test. TRUE or FALSE?",
    a: { A: "True", B: "False" },
    correct: "B"
  }
];

let currentQuestionIndex = 0;
let selectedAnswers      = JSON.parse(localStorage.getItem(`fmcsaEmployeeAnswers_${email}`) || "{}");
let attempts             = parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0", 10);

const quizContainer    = document.getElementById("quizContainer");
const prevQuestionBtn  = document.getElementById("prevQuestionBtn");
const nextQuestionBtn  = document.getElementById("nextQuestionBtn");
const resultBox        = document.getElementById("quizResult");
const submitBtn        = document.getElementById("submitQuizBtn");
const currentQuestionEl = document.getElementById("currentQuestion");
const totalQuestionsEl  = document.getElementById("totalQuestions");

if (totalQuestionsEl) totalQuestionsEl.textContent = questions.length;
if (quizContainer)    initQuiz();

/* =========================================================
   COOLDOWN CHECK
========================================================= */

function checkCooldown() {
  const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || "0", 10);
  if (Date.now() < cooldownUntil) {
    const minutesLeft = Math.ceil((cooldownUntil - Date.now()) / 60000);
    showToast(`Quiz locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`, "warning");
    setTimeout(() => goDashboard(), 2000);
  }
}

/* =========================================================
   QUIZ INIT
========================================================= */

function initQuiz() {
  checkCooldown();

  const company   = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const hasSeat   = company.usedSeats?.employee?.[email];
  const completed = localStorage.getItem(QUIZ_KEY) === "true";
  const certId    = localStorage.getItem(CERT_ID_KEY);

  if (hasSeat && completed) {
    window.location.href = `fmcsa-certificates.html?id=${certId}`;
    return;
  }

  renderQuestion();
}

/* =========================================================
   RENDER QUESTION
========================================================= */

function renderQuestion() {
  const question = questions[currentQuestionIndex];

  quizContainer.innerHTML = `
    <div class="question-block">
      <p class="question-text">${question.q}</p>
      <div class="answers">
        ${Object.entries(question.a).map(([key, value]) => `
          <label class="quiz-option">
            <input type="radio" name="answer" value="${key}"
              ${selectedAnswers[currentQuestionIndex] === key ? "checked" : ""}>
            <span class="option-text">${key}. ${value}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `;

  if (currentQuestionEl) currentQuestionEl.textContent = currentQuestionIndex + 1;
  if (prevQuestionBtn)   prevQuestionBtn.disabled = currentQuestionIndex === 0;
  if (nextQuestionBtn)   nextQuestionBtn.disabled = currentQuestionIndex === questions.length - 1;

  if (submitBtn) {
    submitBtn.style.display = currentQuestionIndex === questions.length - 1 ? "block" : "none";
  }

  document.querySelectorAll("input[name='answer']").forEach(input => {
    input.addEventListener("change", e => {
      selectedAnswers[currentQuestionIndex] = e.target.value;
      localStorage.setItem(`fmcsaEmployeeAnswers_${email}`, JSON.stringify(selectedAnswers));
    });
  });
}

/* =========================================================
   QUIZ NAV
========================================================= */

if (prevQuestionBtn) {
  prevQuestionBtn.addEventListener("click", () => {
    if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(); }
  });
}

if (nextQuestionBtn) {
  nextQuestionBtn.addEventListener("click", () => {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      showToast("You've reached the last question. Click Submit Quiz.", "info");
    }
  });
}

/* =========================================================
   QUIZ SUBMIT
========================================================= */

if (submitBtn) {
  submitBtn.addEventListener("click", () => {

    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correct) correct++;
    });

    const scorePercent = Math.round((correct / questions.length) * 100);

    const report = questions.map((q, i) => ({
      question: q.q,
      selected: selectedAnswers[i] || "No answer",
      correct:  q.correct,
      isCorrect: selectedAnswers[i] === q.correct
    }));

    localStorage.setItem(`quizReport_${email}`, JSON.stringify(report));

    /* ── PASS ── */
    if (scorePercent >= PASS_PERCENT) {
      localStorage.setItem(COMPLETED_KEY, "true");
      saveTrainingProgress("fmcsa-employee", "fmcsa", new Date().toISOString(), localStorage.getItem(CERT_ID_KEY));
      localStorage.setItem(QUIZ_KEY, "true");

      let certId = localStorage.getItem(CERT_ID_KEY);
      if (!certId) {
        const short = Math.random().toString(36).substring(2, 8).toUpperCase();
        certId = `AMS-EMP-${short}`;
        localStorage.setItem(CERT_ID_KEY, certId);
      }

      localStorage.setItem(CERT_DATE_KEY, Date.now());

      /* Save cert ID into companyProfile so admin can view it */
      try {
        const cp = JSON.parse(localStorage.getItem("companyProfile") || "{}");
        if (!cp.certIds) cp.certIds = {};
        cp.certIds[email] = { certId, type: "employee", date: Date.now() };
        localStorage.setItem("companyProfile", JSON.stringify(cp));
      } catch(e) {}

      const key      = `amsCertificates_${email}`;
      const registry = JSON.parse(localStorage.getItem(key) || "[]");

      const users        = JSON.parse(localStorage.getItem("ams_users") || "[]");
      const employeeUser = users.find(u => u.email === email);

      const certRecord = {
        id:     certId,
        name:   employeeUser?.fullName ||
                `${employeeUser?.firstName || ""} ${employeeUser?.lastName || ""}`.trim() ||
                email,
        course: "FMCSA Employee Drug & Alcohol Awareness Training",
        type:   "fmcsa_employee",
        date:   Date.now(),
        email:  email
      };

      const exists = registry.find(c => c.id === certId);
      if (!exists) {
        registry.push(certRecord);
        localStorage.setItem(key, JSON.stringify(registry));
      }

      showToast(`Passed! Score: ${scorePercent}%`, "success");
      setTimeout(() => window.location.href = `fmcsa-certificates.html?id=${certId}`, 1200);
      return;
    }

    /* ── FAIL ── */
    attempts++;
    localStorage.setItem(ATTEMPTS_KEY, attempts);

    const wrongAnswers = report.filter(r => !r.isCorrect);
    const resultEl     = document.getElementById("quizResult");

    if (resultEl) {
      let html = `
        <div class="result-box fail">
          <strong>Score: ${scorePercent}% — Need ${PASS_PERCENT}% to pass.</strong>
          <br><br>
          <strong>Review Incorrect Answers:</strong>
      `;
      wrongAnswers.forEach(item => {
        html += `
          <div style="margin-top:10px;padding:10px;border:1px solid var(--color-border);border-radius:var(--radius-md);">
            <div><strong>Q:</strong> ${item.question}</div>
            <div style="color:var(--color-danger);margin-top:4px;">Your Answer: ${item.selected}</div>
            <div style="color:var(--color-success);margin-top:2px;">Correct Answer: ${item.correct}</div>
          </div>
        `;
      });
      html += `</div>`;
      resultEl.innerHTML = html;
    }

    if (attempts >= MAX_ATTEMPTS) {
      const cooldownUntil = Date.now() + (COOLDOWN_MINUTES * 60000);
      localStorage.setItem(COOLDOWN_KEY, cooldownUntil);
      showToast("Maximum attempts reached. Quiz locked for 15 minutes.", "error");
      setTimeout(() => goDashboard(), 2000);
      return;
    }

    showToast(`Score: ${scorePercent}%. ${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts > 1 ? "s" : ""} remaining.`, "warning");

  });
}

/* =========================================================
   INITIALIZE MODULE
========================================================= */

if (localStorage.getItem(CONTENT_KEY) === "true") {
  document.getElementById("contentSection").classList.add("hidden");
  document.getElementById("quizSection").classList.remove("hidden");
  initQuiz();
}

});

/* =========================================================
   SECTION NAVIGATION
========================================================= */

window.showSection = function(section) {
  const sections = {
    content:     "contentSection",
    quiz:        "quizSection",
    certificate: "certificateSection"
  };
  Object.values(sections).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  const active = document.getElementById(sections[section]);
  if (active) active.classList.remove("hidden");
};
