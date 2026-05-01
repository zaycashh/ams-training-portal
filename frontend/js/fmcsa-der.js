/* ── Save training progress to Supabase (non-blocking) ── */
async function saveTrainingProgress(module, program, completedAt) {
  try {
    const u = JSON.parse(localStorage.getItem('amsUser') || 'null');
    if (!u || !u.id) return;
    await db.from('training_progress').upsert([{
      user_id:      u.id,
      module,
      program,
      completed:    true,
      completed_at: completedAt || new Date().toISOString()
    }], { onConflict: 'user_id,module,program' });
  } catch(e) { console.warn('Supabase progress save failed:', e); }
}

/* =========================================================
   FMCSA DER – COMPLETE ENGINE (PDF + QUIZ)
   All alert() replaced with showToast()
   All IDs and logic preserved exactly
========================================================= */

/* -------------------------
   TOAST HELPER
-------------------------- */
function goDashboard() {
  const u = JSON.parse(localStorage.getItem("amsUser") || "null");
  const isAdmin = u && (u.role === "company_admin" || u.role === "owner" || u.role === "admin");
  window.location.href = isAdmin ? "company-dashboard.html" : "dashboard.html";
}

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
   SECTION CONTROL (global — called from nav)
-------------------------- */
function showSection(section) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  if (section === "quiz") {
    const done = localStorage.getItem(`fmcsaDERContentDone_${user?.email}`) === "true";
    if (!done) {
      showToast("Complete the training content first.", "error");
      return;
    }
  }

  ["contentSection","quizSection","certificateSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));

  const sectionEl = document.getElementById(
    section === "content" ? "contentSection" :
    section === "quiz"    ? "quizSection"    : "certificateSection"
  );
  sectionEl?.classList.remove("hidden");

  const btnMap = { content:"btnContent", quiz:"btnQuiz", certificate:"btnCertificate" };
  document.getElementById(btnMap[section])?.classList.add("active");
}

/* =========================================================
   MAIN INIT
========================================================= */
document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  /* -------------------------------------------------------
     CONSTANTS
  ------------------------------------------------------- */
  const DER_CONTENT_KEY      = `fmcsaDERContent_${user?.email}`;
  const DER_QUIZ_PASSED_KEY  = "der_fmcsa_quiz_passed";
  const DER_ATTEMPTS_KEY     = "der_fmcsa_quiz_attempts";
  const DER_COOLDOWN_KEY     = "der_fmcsa_quiz_cooldown";
  const DER_PASS_PERCENT     = 80;
  const DER_MAX_ATTEMPTS     = 3;
  const DER_COOLDOWN_MINUTES = 15;

  /* -------------------------------------------------------
     RESTORE QUIZ ACCESS ON REFRESH
  ------------------------------------------------------- */
  if (user) {
    const done = localStorage.getItem(`fmcsaDERContentDone_${user.email}`);
    if (done === "true") {
      const quizBtn = document.getElementById("btnQuiz");
      if (quizBtn) { quizBtn.disabled = false; quizBtn.classList.add("done"); }
    }
  }

  /* -------------------------------------------------------
     PDF ENGINE
  ------------------------------------------------------- */
  const url          = "../assets/FMCSA-DER-Drug-Alc-Reg-Training.pdf";
  const pdfContainer = document.getElementById("pdfContainer");
  const prevPageBtn  = document.getElementById("prevPageBtn");
  const nextPageBtn  = document.getElementById("nextPageBtn");
  const currentPageEl = document.getElementById("currentPage");
  const totalPagesEl  = document.getElementById("totalPages");
  const progressBar   = document.getElementById("progressBar");

  let pdfDoc = null, currentPage = 1, totalPages = 0;

  if (pdfContainer) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    pdfjsLib.getDocument(url).promise.then(pdf => {
      pdfDoc = pdf;
      totalPages = pdf.numPages;
      if (totalPagesEl) totalPagesEl.textContent = totalPages;
      renderPage(currentPage);
    }).catch(err => console.error("DER PDF load error:", err));
  }

  function renderPage(num) {
    if (!pdfDoc) return;
    pdfDoc.getPage(num).then(page => {
      const containerWidth = pdfContainer.clientWidth || 800;
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
      if (progressBar)   progressBar.style.width = (num / totalPages * 100) + "%";

      const takeQuizBtn = document.getElementById("takeQuizBtn");
      if (takeQuizBtn) {
        if (num === totalPages) takeQuizBtn.classList.remove("hidden");
        else takeQuizBtn.classList.add("hidden");
      }
    });
  }

  prevPageBtn?.addEventListener("click", () => {
    if (currentPage > 1) { currentPage--; renderPage(currentPage); }
  });

  nextPageBtn?.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderPage(currentPage);
    }

    if (currentPage === totalPages && user) {
      localStorage.setItem(`fmcsaDERContentDone_${user.email}`, "true");
      const quizBtn = document.getElementById("btnQuiz");
      if (quizBtn) { quizBtn.disabled = false; quizBtn.classList.add("done"); }
    }
  });

  /* Take Quiz button */
  document.getElementById("takeQuizBtn")?.addEventListener("click", () => {
    if (user) localStorage.setItem(`fmcsaDERContentDone_${user.email}`, "true");
    const quizBtn = document.getElementById("btnQuiz");
    if (quizBtn) { quizBtn.disabled = false; quizBtn.classList.add("done"); }
    showSection("quiz");
  });

  /* -------------------------------------------------------
     QUIZ ENGINE
  ------------------------------------------------------- */
  const derQuestions = [
    {
      q: "If an employee as a result of a medical issue was issued a medical marijuana card, the employee would NOT be considered positive if he/she tested for it on a DOT test. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE – Having a medical marijuana card issued does NOT excuse a covered employee from the DOT regulations."
    },
    {
      q: "Recently, some states passed laws to permit use of marijuana for so-called \"recreational\" purposes. A covered driver tests Positive and due to the State's new legislation, the driver would NOT be subject the DOT Drug testing regulations as they apply to marijuana. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE – State laws will have no bearing on the Dept. of Transportation's regulated drug testing program. The Dept. of Transportation's Drug and Alcohol Testing Regulations – 49 CFR Part 40 – does not authorize the use of Schedule I drugs, including marijuana, for ANY reason."
    },
    {
      q: "Marijuana is the most widely used illicit drug in the United States. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "A",
      explanation: "TRUE – Surveys show that marijuana IS the most common illicit drug used in the United States. Over three-quarters of all drug addicts use, or have used marijuana."
    },
    {
      q: "A company DER may delegate the DER duties to a service agent. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE – as per §40.3 & §40.15, by definition of a DER, those duties may NOT be performed by a service agent."
    },
    {
      q: "If a company has their random pool setup to have pulls on a quarterly basis, an employee could be selected for a random drug test for each quarter. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "A",
      explanation: "TRUE – a random pool allows for every driver to be a potential pull for each selection period (quarterly). That is why it is called RANDOM."
    },
    {
      q: "All motor vehicle accidents require that a driver be drug & alcohol tested. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE – As per §382.303(a)&(b), a driver is only subject to testing if the accident was a \"qualifying\" accident."
    },
    {
      q: "As an employer, you are required to provide a SAP evaluation or any subsequent recommended education or treatment for an employee who has violated a DOT drug and alcohol regulation. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE (§40.289(a)). You are NOT required to provide a SAP evaluation or any subsequent recommended education or treatment. You ARE however, required to provide names, addresses, and phone numbers for Substance Abuse Professionals to the employee. (§40.287)."
    },
    {
      q: "Return-to-Duty and Follow-Up tests are performed the same as a Random test. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE (§40.67(b)) – They MUST be conducted under direct observation."
    }
  ];

  let currentQuestionIndex = 0;
  let selectedAnswers = {};
  let derAttempts = parseInt(localStorage.getItem(DER_ATTEMPTS_KEY) || "0", 10);

  const quizContainer    = document.getElementById("quizContainer");
  const prevQuestionBtn  = document.getElementById("prevQuestionBtn");
  const nextQuestionBtn  = document.getElementById("nextQuestionBtn");
  const submitBtn        = document.getElementById("submitQuizBtn");
  const resultBox        = document.getElementById("quizResult");
  const currentQuestionEl = document.getElementById("currentQuestion");
  const totalQuestionsEl  = document.getElementById("totalQuestions");

  if (totalQuestionsEl) totalQuestionsEl.textContent = derQuestions.length;

  /* Check if already passed */
  if (localStorage.getItem(DER_QUIZ_PASSED_KEY) === "true") {
    const email  = user?.email;
    const certId = localStorage.getItem(`fmcsaDERCertificateId_${email}`);
    if (certId) {
      window.location.href = `fmcsa-certificates.html?id=${certId}`;
      return;
    }
  }

  if (quizContainer) initQuiz();

  /* -------------------------------------------------------
     COOLDOWN CHECK
  ------------------------------------------------------- */
  function checkCooldown() {
    const cooldownUntil = parseInt(localStorage.getItem(DER_COOLDOWN_KEY) || "0", 10);
    if (Date.now() < cooldownUntil) {
      const minutesLeft = Math.ceil((cooldownUntil - Date.now()) / 60000);
      showToast(`Quiz locked. Try again in ${minutesLeft} minute(s).`, "error", 5000);
      setTimeout(() => goDashboard(), 2000);
      return true;
    }
    return false;
  }

  function initQuiz() {
    if (checkCooldown()) return;
    renderQuestion();
  }

  /* -------------------------------------------------------
     RENDER QUESTION
  ------------------------------------------------------- */
  function renderQuestion() {
    if (!quizContainer) return;
    const question = derQuestions[currentQuestionIndex];

    quizContainer.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-question">
          <span>Question ${currentQuestionIndex + 1} of ${derQuestions.length}</span>
          <h3>${question.q}</h3>
        </div>
        <div class="quiz-answers">
          ${Object.entries(question.a).map(([key, text]) => `
            <label class="quiz-option">
              <input type="radio" name="answer" value="${key}"
                ${selectedAnswers[currentQuestionIndex] === key ? "checked" : ""}>
              <span>${key}. ${text}</span>
            </label>
          `).join("")}
        </div>
      </div>`;

    if (currentQuestionEl) currentQuestionEl.textContent = currentQuestionIndex + 1;
    if (prevQuestionBtn)   prevQuestionBtn.disabled = currentQuestionIndex === 0;
    if (nextQuestionBtn)   nextQuestionBtn.disabled = currentQuestionIndex === derQuestions.length - 1;

    /* Submit only on last question */
    if (submitBtn) {
      if (currentQuestionIndex === derQuestions.length - 1) submitBtn.classList.remove("hidden");
      else submitBtn.classList.add("hidden");
    }

    /* Save on change */
    quizContainer.querySelectorAll("input[name='answer']").forEach(input => {
      input.addEventListener("change", e => {
        selectedAnswers[currentQuestionIndex] = e.target.value;
      });
    });
  }

  /* -------------------------------------------------------
     QUIZ NAVIGATION
  ------------------------------------------------------- */
  prevQuestionBtn?.addEventListener("click", () => {
    if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(); }
  });

  nextQuestionBtn?.addEventListener("click", () => {
    if (currentQuestionIndex < derQuestions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      showToast("You've reached the last question. Click Submit.", "info");
    }
  });

  /* -------------------------------------------------------
     SUBMIT + GRADE
  ------------------------------------------------------- */
  submitBtn?.addEventListener("click", () => {
    let correctCount = 0;
    let reviewHTML   = "";

    derQuestions.forEach((question, index) => {
      const userAnswer = selectedAnswers[index];
      if (userAnswer === question.correct) {
        correctCount++;
      } else {
        reviewHTML += `
          <div class="review-item">
            <p><strong>Q${index + 1}:</strong> ${question.q}</p>
            <p style="color:var(--color-warning)">Your answer: ${userAnswer || "Not answered"}</p>
            <p style="color:var(--color-success)">Correct: ${question.correct}</p>
            <p><strong>Explanation:</strong> ${question.explanation || "Review training material."}</p>
          </div>`;
      }
    });

    const scorePercent = Math.round((correctCount / derQuestions.length) * 100);

    /* PASS */
    if (scorePercent >= DER_PASS_PERCENT) {
      const email = user?.email;

      localStorage.setItem(`fmcsaDERCompleted_${email}`, "true");
      saveTrainingProgress("fmcsa-der", "fmcsa", new Date().toISOString());
      localStorage.setItem(`fmcsaDERDate_${email}`, Date.now());
      localStorage.setItem(DER_QUIZ_PASSED_KEY, "true");

      let certId = localStorage.getItem(`fmcsaDERCertificateId_${email}`);
      if (!certId && typeof generateCertificateId === "function") {
        certId = generateCertificateId("AMS-DER");
        localStorage.setItem(`fmcsaDERCertificateId_${email}`, certId);
      }

      /* Save cert ID into companyProfile so admin can view it */
      try {
        const cp = JSON.parse(localStorage.getItem("companyProfile") || "{}");
        if (!cp.certIds) cp.certIds = {};
        cp.certIds[email] = { certId, type: "der", date: Date.now() };
        localStorage.setItem("companyProfile", JSON.stringify(cp));
      } catch(e) {}

      /* Register certificate (no duplicates) */
      if (!localStorage.getItem(`derCertRegistered_${email}`)) {
        if (user && typeof registerCertificate === "function") {
          registerCertificate({
            id:     certId,
            name:   user.fullName || (`${user.firstName || ""} ${user.lastName || ""}`).trim(),
            course: "FMCSA DER Training",
            type:   "fmcsa_der",
            date:   Date.now()
          });
          localStorage.setItem(`derCertRegistered_${email}`, "true");
        }
      }

      localStorage.removeItem(DER_ATTEMPTS_KEY);
      localStorage.removeItem(DER_COOLDOWN_KEY);

      if (resultBox) resultBox.innerHTML = `<div class="result-box pass">You passed! Generating certificate...</div>`;
      showToast("Quiz passed! Redirecting to certificate...", "success");

      setTimeout(() => {
        window.location.href = `fmcsa-certificates.html?id=${certId}`;
      }, 2000);

      return;
    }

    /* FAIL */
    derAttempts++;
    localStorage.setItem(DER_ATTEMPTS_KEY, derAttempts);

    if (derAttempts >= DER_MAX_ATTEMPTS) {
      const cooldownUntil = Date.now() + (DER_COOLDOWN_MINUTES * 60000);
      localStorage.setItem(DER_COOLDOWN_KEY, cooldownUntil);
      localStorage.setItem(DER_ATTEMPTS_KEY, 0);
      showToast("Maximum attempts reached. Quiz locked for 15 minutes.", "error", 5000);
      setTimeout(() => goDashboard(), 2000);
      return;
    }

    const remaining = DER_MAX_ATTEMPTS - derAttempts;
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="result-box fail">
          <strong>Score: ${scorePercent}%</strong> — Attempt ${derAttempts} of ${DER_MAX_ATTEMPTS} · ${remaining} remaining
          ${reviewHTML}
        </div>`;
    }
  });

});
