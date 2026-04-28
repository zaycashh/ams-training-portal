/* =========================================================
   FAA EMPLOYEE TRAINING LOGIC
   Fully independent from FMCSA — zero key collision
========================================================= */

const FAA_EMP_MAX_ATTEMPTS     = 3;
const FAA_EMP_PASS_PERCENTAGE  = 80;
const FAA_EMP_COOLDOWN_MINUTES = 15;

/* =========================
   USER CONTEXT
========================= */
const user       = JSON.parse(localStorage.getItem("amsUser") || "null");
const USER_EMAIL = user?.email || "guest";

/* =========================
   STORAGE KEYS — all faa prefixed
========================= */
const FAA_EMP_CONTENT_DONE_KEY = `faaEmployeeContentCompleted_${USER_EMAIL}`;
const FAA_EMP_PASSED_KEY       = `faaEmployeeQuizPassed_${USER_EMAIL}`;
const FAA_EMP_COMPLETED_KEY    = `faaEmployeeCompleted_${USER_EMAIL}`;
const FAA_EMP_ATTEMPTS_KEY     = `faaEmployeeQuizAttempts_${USER_EMAIL}`;
const FAA_EMP_COOLDOWN_KEY     = `faaEmployeeQuizCooldownUntil_${USER_EMAIL}`;
const FAA_EMP_CERT_KEY         = `faaEmployeeCertificateId_${USER_EMAIL}`;
const FAA_EMP_DATE_KEY         = `faaEmployeeTrainingDate_${USER_EMAIL}`;

/* =========================
   TOAST
========================= */
function showToast(msg, type, duration) {
  type = type || "info"; duration = duration || 3500;
  document.querySelectorAll(".ams-toast").forEach(t => t.remove());
  const toast = document.createElement("div");
  toast.className = "ams-toast toast-" + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* =========================
   TAB STATES
========================= */
function setActiveTab(tab) {
  document.querySelectorAll(".module-nav button").forEach(btn => {
    btn.classList.remove("active", "completed");
  });
  if (tab === "content") {
    document.getElementById("btnContent")?.classList.add("active");
  }
  if (tab === "quiz") {
    document.getElementById("btnContent")?.classList.add("completed");
    document.getElementById("btnQuiz")?.classList.add("active");
  }
  if (tab === "certificate") {
    document.getElementById("btnContent")?.classList.add("completed");
    document.getElementById("btnQuiz")?.classList.add("completed");
    document.getElementById("btnCertificate")?.classList.add("active");
  }
}

/* =========================
   SECTION NAVIGATION
========================= */
function showSection(section) {
  if (localStorage.getItem(FAA_EMP_COMPLETED_KEY) === "true") {
    lockToFAAEmployeeCertificate();
    return;
  }
  if (section === "quiz") {
    if (localStorage.getItem(FAA_EMP_CONTENT_DONE_KEY) !== "true") {
      showToast("Complete the training content first.", "error");
      return;
    }
    const cooldownUntil = parseInt(localStorage.getItem(FAA_EMP_COOLDOWN_KEY) || "0", 10);
    if (Date.now() < cooldownUntil) {
      const mins = Math.ceil((cooldownUntil - Date.now()) / 60000);
      showToast(`Quiz locked. Try again in ${mins} minute(s).`, "error", 5000);
      return;
    }
  }
  if (section === "certificate") {
    if (localStorage.getItem(FAA_EMP_PASSED_KEY) !== "true") return;
  }

  ["contentSection","quizSection","certificateSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  if (section === "content") {
    document.getElementById("contentSection")?.classList.remove("hidden");
    setActiveTab("content");
  }
  if (section === "quiz") {
    document.getElementById("quizSection")?.classList.remove("hidden");
    setActiveTab("quiz");
    loadFAAEmployeeQuiz();
  }
  if (section === "certificate") {
    document.getElementById("certificateSection")?.classList.remove("hidden");
    setActiveTab("certificate");
    populateFAAEmployeeCertificate();
  }
}

function goDashboard() {
  const u = JSON.parse(localStorage.getItem("amsUser") || "null");
  const isAdmin = u && (u.role === "company_admin" || u.role === "owner" || u.role === "admin");
  window.location.href = isAdmin ? "company-dashboard.html" : "dashboard.html";
}

/* =========================
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.module !== "faa-employee") return;

  if (!user) { window.location.replace("login.html"); return; }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  /* Company seat check */
  if (user.type === "company" && user.role === "employee") {
    const hasSeat = company?.usedSeats?.employee?.[user.email];
    if (!hasSeat) {
      sessionStorage.setItem("ams_notice", "No employee seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }
  }

  const btn = document.getElementById("continueToQuizBtn");
  if (btn) btn.addEventListener("click", completeFAAEmployeeContent);

  if (localStorage.getItem(FAA_EMP_COMPLETED_KEY) === "true") {
    lockToFAAEmployeeCertificate();
    return;
  }

  showSection("content");
});

/* =========================
   CONTENT COMPLETION
========================= */
function completeFAAEmployeeContent() {
  localStorage.setItem(FAA_EMP_CONTENT_DONE_KEY, "true");
  showSection("quiz");
}

/* =========================
   QUIZ — QUESTIONS (placeholder — replace with real FAA content)
========================= */
const FAA_EMPLOYEE_QUESTIONS = [
  {
    q: "Under FAA 14 CFR Part 120, which employees are subject to drug and alcohol testing?",
    options: [
      "All airline employees regardless of duties",
      "Employees performing safety-sensitive functions",
      "Only pilots and air traffic controllers",
      "Only employees hired after 2000"
    ],
    answer: 1
  },
  {
    q: "What is a safety-sensitive function under FAA regulations?",
    options: [
      "Any administrative task at an airport",
      "Functions such as aircraft maintenance, flight crewmember duties, or air traffic control",
      "Baggage handling in public areas only",
      "Customer service at ticket counters"
    ],
    answer: 1
  },
  {
    q: "Which substances are tested for under the FAA drug testing program?",
    options: [
      "Alcohol only",
      "Marijuana only",
      "Marijuana, cocaine, opioids, phencyclidine (PCP), and amphetamines",
      "Prescription drugs only"
    ],
    answer: 2
  },
  {
    q: "What must an employee do if selected for a random drug test?",
    options: [
      "Report to the collection site within 3 days",
      "Report to the collection site immediately or as soon as possible",
      "Notify their union representative first",
      "Request a retest before complying"
    ],
    answer: 1
  },
  {
    q: "What is the consequence of refusing to take a required drug or alcohol test?",
    options: [
      "A written warning is issued",
      "The refusal is treated the same as a positive test result",
      "The employee must pay a fine",
      "No consequence if it is the first refusal"
    ],
    answer: 1
  },
  {
    q: "Under FAA rules, an employee with a blood alcohol concentration (BAC) of 0.04 or greater:",
    options: [
      "May continue working with supervisor approval",
      "Must be removed from safety-sensitive duties",
      "Only needs to be monitored for the rest of the shift",
      "Can return to work after 1 hour"
    ],
    answer: 1
  },
  {
    q: "What is a 'return-to-duty' test?",
    options: [
      "A test given after any absence of more than 3 days",
      "A test required before an employee can return to safety-sensitive duties after a positive test or refusal",
      "A routine annual test",
      "A test performed on new hires only"
    ],
    answer: 1
  },
  {
    q: "How long must records of drug and alcohol test results be kept by the employer?",
    options: [
      "1 year",
      "2 years for negative results, 5 years for positive results and refusals",
      "5 years for all records",
      "10 years for all records"
    ],
    answer: 1
  },
  {
    q: "Which of the following best describes a 'verified negative' result?",
    options: [
      "A result where the sample was rejected",
      "A result reviewed by a Medical Review Officer (MRO) confirming no prohibited substance at reportable levels",
      "A result the employee disputes",
      "A result obtained without a chain of custody form"
    ],
    answer: 1
  },
  {
    q: "An employee who is in a follow-up testing program after a positive test must:",
    options: [
      "Only be tested once more after returning to work",
      "Be subject to at least 6 unannounced tests in the first 12 months following return to duty",
      "Complete a training course instead of further testing",
      "Be tested only if the supervisor suspects further use"
    ],
    answer: 1
  }
];

/* =========================
   QUIZ RENDER
========================= */
function loadFAAEmployeeQuiz() {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  const questions = [...FAA_EMPLOYEE_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  let current = 0;
  let answers  = new Array(questions.length).fill(null);

  function renderQuestion() {
    const q   = questions[current];
    const num = current + 1;
    container.innerHTML = `
      <div class="quiz-card">
        <span class="quiz-number">Question ${num} of ${questions.length}</span>
        <div class="quiz-question"><h3>${q.q}</h3></div>
        <div class="quiz-answers">
          ${q.options.map((opt, i) => `
            <label class="quiz-option ${answers[current] === i ? "selected" : ""}">
              <input type="radio" name="q${current}" value="${i}" ${answers[current] === i ? "checked" : ""} />
              ${opt}
            </label>
          `).join("")}
        </div>
        <div style="margin-top:1.5rem;display:flex;justify-content:space-between;gap:1rem;">
          ${current > 0 ? `<button class="btn btn-secondary" onclick="faaEmployeeNav(-1)">← Back</button>` : `<span></span>`}
          ${current < questions.length - 1
            ? `<button class="btn btn-primary" onclick="faaEmployeeNav(1)">Next →</button>`
            : `<button class="btn btn-primary" onclick="faaEmployeeSubmit()">Submit Quiz</button>`
          }
        </div>
      </div>
    `;
    container.querySelectorAll("input[type=radio]").forEach(input => {
      input.addEventListener("change", () => {
        answers[current] = parseInt(input.value);
        container.querySelectorAll(".quiz-option").forEach(l => l.classList.remove("selected"));
        input.closest(".quiz-option")?.classList.add("selected");
      });
    });
  }

  window.faaEmployeeNav = function(dir) { current += dir; renderQuestion(); };

  window.faaEmployeeSubmit = function() {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      showToast(`Please answer all questions (${unanswered} remaining).`, "error");
      return;
    }
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) score++; });
    handleFAAEmployeeQuizResult(score, questions.length);
  };

  renderQuestion();
}

/* =========================
   QUIZ RESULT
========================= */
function handleFAAEmployeeQuizResult(score, total) {
  const percent  = Math.round((score / total) * 100);
  const attempts = parseInt(localStorage.getItem(FAA_EMP_ATTEMPTS_KEY) || "0", 10) + 1;
  localStorage.setItem(FAA_EMP_ATTEMPTS_KEY, attempts);

  if (percent >= FAA_EMP_PASS_PERCENTAGE) {
    localStorage.setItem(FAA_EMP_PASSED_KEY, "true");
    localStorage.removeItem(FAA_EMP_ATTEMPTS_KEY);
    localStorage.removeItem(FAA_EMP_COOLDOWN_KEY);
    document.getElementById("quizSection").innerHTML = `
      <div class="quiz-card" style="text-align:center;">
        <h2 style="color:var(--color-primary);margin-bottom:.5rem;">Training Completed</h2>
        <p style="margin-bottom:1.5rem;">You scored <strong>${percent}%</strong> — Passed</p>
        <button class="btn btn-primary" onclick="finishFAAEmployeeTraining()">View Certificate</button>
      </div>
    `;
    return;
  }

  if (attempts >= FAA_EMP_MAX_ATTEMPTS) {
    localStorage.setItem(FAA_EMP_COOLDOWN_KEY, Date.now() + FAA_EMP_COOLDOWN_MINUTES * 60000);
    document.getElementById("quizSection").innerHTML = `
      <div class="quiz-card" style="text-align:center;">
        <h2 style="color:var(--color-warning);margin-bottom:.5rem;">Too Many Attempts</h2>
        <p>Please wait ${FAA_EMP_COOLDOWN_MINUTES} minutes before retrying.</p>
      </div>
    `;
    return;
  }

  document.getElementById("quizSection").innerHTML = `
    <div class="quiz-card" style="text-align:center;">
      <h2 style="color:var(--color-warning);margin-bottom:.5rem;">Quiz Failed</h2>
      <p>You scored <strong>${percent}%</strong>. Passing score is ${FAA_EMP_PASS_PERCENTAGE}%.</p>
      <p style="margin:.5rem 0 1.5rem;">Attempts remaining: <strong>${FAA_EMP_MAX_ATTEMPTS - attempts}</strong></p>
      <button class="btn btn-primary" onclick="showSection('quiz')">Retry Quiz</button>
    </div>
  `;
}

/* =========================
   FINALIZE TRAINING
========================= */
function finishFAAEmployeeTraining() {
  localStorage.setItem(FAA_EMP_COMPLETED_KEY, "true");
  localStorage.setItem(FAA_EMP_DATE_KEY, Date.now());
  lockToFAAEmployeeCertificate();
}

/* =========================
   CERTIFICATE LOCK
========================= */
function lockToFAAEmployeeCertificate() {
  ["contentSection","quizSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  document.getElementById("certificateSection")?.classList.remove("hidden");
  document.querySelectorAll(".module-nav button").forEach(btn => { btn.disabled = true; });
  setActiveTab("certificate");
  populateFAAEmployeeCertificate();
}

/* =========================
   CERTIFICATE GENERATION
========================= */
function populateFAAEmployeeCertificate() {
  if (!user) return;

  let certId = localStorage.getItem(FAA_EMP_CERT_KEY);
  if (!certId) {
    certId = typeof generateCertificateId === "function"
      ? generateCertificateId("FAA-EMP")
      : "FAA-EMP-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem(FAA_EMP_CERT_KEY, certId);
  }

  if (!localStorage.getItem(`faaEmployeeCertRegistered_${USER_EMAIL}`)) {
    if (typeof registerCertificate === "function") {
      const fullName = user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      registerCertificate({
        id: certId,
        name: fullName,
        course: "FAA Employee Drug & Alcohol Awareness Training",
        type: "faa_employee",
        date: Date.now(),
        displayDate: new Date().toLocaleDateString("en-US")
      });
      localStorage.setItem(`faaEmployeeCertRegistered_${USER_EMAIL}`, "true");
    }
  }

  /* Write into companyProfile.certIds for admin view */
  try {
    const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
    if (!company.certIds) company.certIds = {};
    if (!company.certIds[USER_EMAIL]) {
      company.certIds[USER_EMAIL] = { certId, type: "faa_employee", date: Date.now() };
      localStorage.setItem("companyProfile", JSON.stringify(company));
    }
  } catch(e) {}

  const displayName = user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "—";

  document.getElementById("certName").textContent  = displayName;
  document.getElementById("certDate").textContent  =
    new Date(Number(localStorage.getItem(FAA_EMP_DATE_KEY) || Date.now())).toLocaleDateString("en-US");
  document.getElementById("certVerify").textContent = certId;
  if (document.getElementById("certId")) document.getElementById("certId").textContent = certId;

  const qrBox = document.getElementById("certQR");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: window.location.origin + "/ams-training-portal/frontend/pages/verify.html?id=" + certId,
      width: 128, height: 128
    });
  }
}
