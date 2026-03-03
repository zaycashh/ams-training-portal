/* =========================================================
   FMCSA DER – COMPLETE ENGINE (PDF + QUIZ)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     PDF CONTENT ENGINE
  ========================================================= */

  const DER_CONTENT_KEY = "der_fmcsa_content_done";
  const DER_QUIZ_PASSED_KEY = "der_fmcsa_quiz_passed";
  const DER_ATTEMPTS_KEY = "der_fmcsa_quiz_attempts";
  const DER_COOLDOWN_KEY = "der_fmcsa_quiz_cooldown";

  const DER_PASS_PERCENT = 80;
  const DER_MAX_ATTEMPTS = 3;
  const DER_COOLDOWN_MINUTES = 15;

  const url = "../assets/FMCSA-DER-Drug-Alc-Reg-Training.pdf";

  const pdfContainer = document.getElementById("pdfContainer");
  const completeBtn = document.getElementById("completeContentBtn");

  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");

  const currentPageEl = document.getElementById("currentPage");
  const totalPagesEl = document.getElementById("totalPages");

  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;

  if (pdfContainer) {

    pdfjsLib.getDocument(url).promise.then(pdf => {
      pdfDoc = pdf;
      totalPages = pdf.numPages;
      if (totalPagesEl) totalPagesEl.textContent = totalPages;
      renderPage(currentPage);
    });

    function renderPage(num) {

      pdfDoc.getPage(num).then(page => {

        let containerWidth = pdfContainer.clientWidth || 800;

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

        if (currentPageEl) currentPageEl.textContent = num;

        if (prevPageBtn) prevPageBtn.disabled = num === 1;
        if (nextPageBtn) nextPageBtn.disabled = num === totalPages;

        if (completeBtn) {
          completeBtn.disabled = num !== totalPages;
        }

      });
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage(currentPage);
        }
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage(currentPage);
        }
      });
    }

    if (completeBtn) {
      completeBtn.addEventListener("click", () => {
        localStorage.setItem(DER_CONTENT_KEY, "true");
        document.getElementById("contentSection").classList.add("hidden");
        document.getElementById("quizSection").classList.remove("hidden");
      });
    }

    if (localStorage.getItem(DER_CONTENT_KEY) === "true") {
      document.getElementById("contentSection").classList.add("hidden");
      document.getElementById("quizSection").classList.remove("hidden");
    }

  }

  /* =========================================================
     QUIZ ENGINE
  ========================================================= */

  const derQuestions = [

    {
      q: "If an employee as a result of a medical issue was issued a medical marijuana card, the employee would NOT be considered positive if he/she tested for it on a DOT test. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B"
    },

    {
      q: "State legalization of marijuana overrides DOT drug testing regulations.",
      a: { A: "True", B: "False" },
      correct: "B"
    },

    {
      q: "Marijuana is the most widely used illicit drug in the United States. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "A"
    },

    {
      q: "A company DER may delegate the DER duties to a service agent. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B"
    },

    {
      q: "If a company has their random pool setup to have pulls on a quarterly basis, an employee could be selected for a random drug test for each quarter. TRUE or FALSE?.",
      a: { A: "True", B: "False" },
      correct: "A"
    },

    {
      q: "All motor vehicle accidents require that a driver be drug & alcohol tested. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B"
    },

    {
      q: "As an employer, you are required to provide a SAP evaluation or any subsequent recommended education or treatment for an employee who has violated a DOT drug and alcohol regulation. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B"
    },

    {
      q: "Return-to-Duty and Follow-Up tests are performed the same as a Random test. TRUE or FALSE?.",
      a: { A: "True", B: "False" },
      correct: "B"
    }

  ];

  let currentQuestionIndex = 0;
  let selectedAnswers = {};
  let derAttempts = parseInt(localStorage.getItem(DER_ATTEMPTS_KEY) || "0", 10);

  const quizContainer = document.getElementById("quizContainer");
  const prevQuestionBtn = document.getElementById("prevQuestionBtn");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const submitBtn = document.getElementById("submitQuizBtn");
  const resultBox = document.getElementById("quizResult");

  const currentQuestionEl = document.getElementById("currentQuestion");
  const totalQuestionsEl = document.getElementById("totalQuestions");

  if (quizContainer) initQuiz();

  function initQuiz() {

    if (totalQuestionsEl) totalQuestionsEl.textContent = derQuestions.length;

    if (localStorage.getItem(DER_QUIZ_PASSED_KEY) === "true") {
      showCertificateSection();
      return;
    }

    checkCooldown();
    renderQuestion();
  }

  function renderQuestion() {

    const question = derQuestions[currentQuestionIndex];

    quizContainer.innerHTML = `
      <p><strong>${question.q}</strong></p>
      ${Object.entries(question.a).map(([key, value]) => `
        <label>
          <input type="radio" name="answer" value="${key}">
          ${key}. ${value}
        </label>
      `).join("")}
    `;

    if (currentQuestionEl) currentQuestionEl.textContent = currentQuestionIndex + 1;

    if (prevQuestionBtn) prevQuestionBtn.disabled = currentQuestionIndex === 0;
    if (nextQuestionBtn) nextQuestionBtn.disabled = currentQuestionIndex === derQuestions.length - 1;

    document.querySelectorAll("input[name='answer']").forEach(input => {
      input.addEventListener("change", e => {
        selectedAnswers[currentQuestionIndex] = e.target.value;
      });
    });
  }

  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener("click", () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
      }
    });
  }

  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener("click", () => {
      if (currentQuestionIndex < derQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      }
    });
  }

  if (submitBtn) {
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
        showCertificateSection();
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

        alert(`You scored ${scorePercent}%. Attempt ${derAttempts} of ${DER_MAX_ATTEMPTS}.`);
      }

    });
  }

  function checkCooldown() {
    const cooldownUntil = parseInt(localStorage.getItem(DER_COOLDOWN_KEY) || "0", 10);

    if (Date.now() < cooldownUntil) {
      const minutesLeft = Math.ceil((cooldownUntil - Date.now()) / 60000);
      alert(`Quiz locked. Try again in ${minutesLeft} minutes.`);
      window.location.href = "dashboard.html";
    }
  }

  function showCertificateSection() {
    document.getElementById("quizSection").classList.add("hidden");
    document.getElementById("certificateSection").classList.remove("hidden");
  }

});
