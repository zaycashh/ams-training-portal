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

  }

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
   
  /* =========================================================
     QUIZ ENGINE
  ========================================================= */

  const derQuestions = [

    {
      q: "If an employee as a result of a medical issue was issued a medical marijuana card, the employee would NOT be considered positive if he/she tested for it on a DOT test. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE –Having a medical marijuana card issued does NOT excuse a covered employee from the DOT regulations."
    },

    {
      q: "Recently, some states passed laws to permit use of marijuana for so-called “recreational” purposes. A covered driver tests Positive and due to the State’s new legislation, the driver would NOT be subject the DOT Drug testing regulations as they apply to marijuana. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE –State laws will have no bearing on the Dept. of Transportation’s regulated drug testing program. The Dept. of Transportation’s Drug and Alcohol Testing Regulations –49 CFR Part 40 –does not authorize the use of Schedule I drugs, including marijuana, for ANY reason."
    },

    {
      q: "Marijuana is the most widely used illicit drug in the United States. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "A",
      explanation: "TRUE–Surveys show that marijuana IS the most common illicit drug used in the United States. Over three-quarters of all drug addicts use, or have used marijuana."
    },

    {
      q: "A company DER may delegate the DER duties to a service agent. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE –as per §40.3 & §40.15, by definition of a DER, those duties may NOT be performed by a service agent."
    },

    {
      q: "If a company has their random pool setup to have pulls on a quarterly basis, an employee could be selected for a random drug test for each quarter. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "A",
       explanation: "TRUE–a random pool allows for every driver to be a potential pull for each selection period (quarterly). That is why it is called RANDOM."
    },

    {
      q: "All motor vehicle accidents require that a driver be drug & alcohol tested. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE–As per §382..303(a)&(b), a driver is only subject to testing if the accident was a “qualifying” accident."
    },

    {
      q: "As an employer, you are required to provide a SAP evaluation or any subsequent recommended education or treatment for an employee who has violated a DOT drug and alcohol regulation. TRUE or FALSE?",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE (§40.289(a)).You are NOT required to provide a SAP evaluation or any subsequent recommended education or treatment. You ARE however, required to provide names, addresses, and phone numbers for Substance Abuse Professionals to the employee. (§40.287)." 
    }, 

    {
      q: "Return-to-Duty and Follow-Up tests are performed the same as a Random test. TRUE or FALSE?.",
      a: { A: "True", B: "False" },
      correct: "B",
      explanation: "FALSE (§40.67(b)) –They MUST be conducted under direct observation."
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

if (totalQuestionsEl) totalQuestionsEl.textContent = derQuestions.length;

if (submitBtn) submitBtn.disabled = true;

if (quizContainer) initQuiz();

function initQuiz() {

  checkCooldown();

  if (localStorage.getItem(DER_QUIZ_PASSED_KEY) === "true") {
    window.location.href = "fmcsa-certificates.html";
    return;
  }

  renderQuestion();
}

function renderQuestion() {

  const question = derQuestions[currentQuestionIndex];

  quizContainer.innerHTML = `
    <p><strong>${question.q}</strong></p>
    ${Object.entries(question.a).map(([key, value]) => `
      <label>
        <input type="radio" name="answer" value="${key}"
        ${selectedAnswers[currentQuestionIndex] === key ? "checked" : ""}>
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
      updateSubmitState();
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

function updateSubmitState() {
  if (!submitBtn) return;
  submitBtn.disabled = Object.keys(selectedAnswers).length !== derQuestions.length;
}

if (submitBtn) {

  submitBtn.addEventListener("click", () => {

    let correctCount = 0;
    let reviewHTML = "";

    derQuestions.forEach((question, index) => {

      const userAnswer = selectedAnswers[index];

      if (userAnswer === question.correct) {
        correctCount++;
      } else {

        reviewHTML += `
        <div style="margin-top:15px;">
          <p><strong>Question ${index + 1}:</strong> ${question.q}</p>
          <p style="color:#c0392b;">Your Answer: ${userAnswer || "Not Answered"}</p>
          <p style="color:#27ae60;">Correct Answer: ${question.correct}</p>
          <p><strong>Explanation:</strong> ${question.explanation || "Review training material."}</p>
          <hr/>
        </div>
        `;

      }

    });

    const scorePercent = Math.round((correctCount / derQuestions.length) * 100);

    if (scorePercent >= DER_PASS_PERCENT) {

  localStorage.setItem("fmcsaDERCompleted", "true");
  localStorage.setItem("fmcsaDERDate", Date.now());     

  localStorage.setItem(DER_QUIZ_PASSED_KEY, "true");

  let certId = localStorage.getItem("fmcsaDERCertificateId");

  if (!certId) {
  certId = generateCertificateId("AMS-DER");
  localStorage.setItem("fmcsaDERCertificateId", certId);
}
const user = JSON.parse(localStorage.getItem("amsUser") || "null");

/* PREVENT DUPLICATE REGISTRATION */

if (!localStorage.getItem(`derCertRegistered_${user?.email}`)) {

  if (user && typeof registerCertificate === "function") {

    registerCertificate({
      id: certId,
      name: user.fullName || (user.firstName + " " + user.lastName),
      course: "FMCSA DER Training",
      type: "fmcsa_der",
      date: Date.now()
   });
    localStorage.setItem(`derCertRegistered_${user.email}`, "true");

  }

}
  localStorage.setItem("fmcsaDERDate", Date.now());

      localStorage.removeItem(DER_ATTEMPTS_KEY);
      localStorage.removeItem(DER_COOLDOWN_KEY);

      if (resultBox) {
        resultBox.innerHTML = `
        <div class="result-box pass">
        You passed! Generating Certificate...
        </div>
        `;
      }

      setTimeout(() => {
        window.location.href = "fmcsa-certificates.html";
      }, 2000);

    } else {

      derAttempts++;
      localStorage.setItem(DER_ATTEMPTS_KEY, derAttempts);

      if (derAttempts >= DER_MAX_ATTEMPTS) {

        const cooldownUntil = Date.now() + (DER_COOLDOWN_MINUTES * 60000);
        localStorage.setItem(DER_COOLDOWN_KEY, cooldownUntil);

        alert("Maximum attempts reached. 15-minute cooldown activated.");
        window.location.reload();
        return;

      }

      if (resultBox) {

        resultBox.innerHTML = `
        <div style="padding:15px; background:#fff4f4; border:1px solid #ffcccc; border-radius:8px;">
          <h3>Score: ${scorePercent}%</h3>
          <p>Attempt ${derAttempts} of ${DER_MAX_ATTEMPTS}</p>
          ${reviewHTML}
        </div>
        `;

      }

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

}); 
