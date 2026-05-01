* ── Save training progress to Supabase (non-blocking) ── */
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
   FAA SUPERVISOR TRAINING LOGIC
   Fully independent from FMCSA — zero key collision
========================================================= */

const FAA_SUP_MAX_ATTEMPTS     = 3;
const FAA_SUP_PASS_PERCENTAGE  = 80;
const FAA_SUP_COOLDOWN_MINUTES = 15;

/* =========================
   USER CONTEXT
========================= */
const user         = JSON.parse(localStorage.getItem("amsUser") || "null");
const USER_EMAIL   = user?.email || "guest";

/* =========================
   STORAGE KEYS — all faa prefixed, no FMCSA collision
========================= */
const FAA_SUP_CONTENT_DONE_KEY = `faaSupervisorContentCompleted_${USER_EMAIL}`;
const FAA_SUP_PASSED_KEY       = `faaSupervisorQuizPassed_${USER_EMAIL}`;
const FAA_SUP_COMPLETED_KEY    = `faaSupervisorCompleted_${USER_EMAIL}`;
const FAA_SUP_ATTEMPTS_KEY     = `faaSupervisorQuizAttempts_${USER_EMAIL}`;
const FAA_SUP_COOLDOWN_KEY     = `faaSupervisorQuizCooldownUntil_${USER_EMAIL}`;
const FAA_SUP_CERT_KEY         = `faaSupervisorCertificateId_${USER_EMAIL}`;
const FAA_SUP_DATE_KEY         = `faaSupervisorTrainingDate_${USER_EMAIL}`;

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
  if (localStorage.getItem(FAA_SUP_COMPLETED_KEY) === "true") {
    lockToFAASupervisorCertificate();
    return;
  }
  if (section === "quiz") {
    if (localStorage.getItem(FAA_SUP_CONTENT_DONE_KEY) !== "true") {
      showToast("Complete the training content first.", "error");
      return;
    }
    /* Cooldown check */
    const cooldownUntil = parseInt(localStorage.getItem(FAA_SUP_COOLDOWN_KEY) || "0", 10);
    if (Date.now() < cooldownUntil) {
      const mins = Math.ceil((cooldownUntil - Date.now()) / 60000);
      showToast(`Quiz locked. Try again in ${mins} minute(s).`, "error", 5000);
      return;
    }
  }
  if (section === "certificate") {
    if (localStorage.getItem(FAA_SUP_PASSED_KEY) !== "true") return;
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
    loadFAASupervisorQuiz();
  }
  if (section === "certificate") {
    document.getElementById("certificateSection")?.classList.remove("hidden");
    setActiveTab("certificate");
    populateFAASupervisorCertificate();
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
  if (document.body.dataset.module !== "faa-supervisor") return;

  if (!user) { window.location.replace("login.html"); return; }

  if (localStorage.getItem(FAA_SUP_COMPLETED_KEY) === "true") {
    lockToFAASupervisorCertificate();
    return;
  }

  showSection("content");
});

/* =========================
   CONTENT COMPLETION
========================= */
function completeFAASupervisorContent() {
  localStorage.setItem(FAA_SUP_CONTENT_DONE_KEY, "true");
  showSection("quiz");
}

/* =========================
   QUIZ — QUESTIONS
========================= */
const FAA_SUPERVISOR_QUESTIONS = [
  {
    q: "Under FAA regulations, what is the primary role of a supervisor in drug and alcohol testing?",
    options: [
      "To conduct the actual drug tests on employees",
      "To observe employees for reasonable suspicion and refer them for testing",
      "To determine if an employee is impaired without any testing",
      "To administer treatment programs for employees"
    ],
    answer: 1
  },
  {
    q: "What percentage of aviation safety-sensitive employees must be randomly tested for drugs annually under FAA rules?",
    options: ["10%", "25%", "50%", "100%"],
    answer: 2
  },
  {
    q: "Which of the following is considered a safety-sensitive function under FAA regulations?",
    options: [
      "Administrative office work",
      "Aircraft maintenance and preventive maintenance",
      "Customer service at ticket counters",
      "Baggage handling in unsecured areas only"
    ],
    answer: 1
  },
  {
    q: "A supervisor must have reasonable suspicion testing based on:",
    options: [
      "A rumor from another employee",
      "Specific, contemporaneous, articulable observations of the employee",
      "A single observation made weeks earlier",
      "Anonymous tip from the public"
    ],
    answer: 1
  },
  {
    q: "Under FAA 14 CFR Part 120, how soon after a reasonable suspicion observation must the employee be tested?",
    options: [
      "Within 72 hours",
      "Within 8 hours for alcohol, 32 hours for drugs",
      "Within 24 hours for both",
      "Within 48 hours for alcohol, 72 hours for drugs"
    ],
    answer: 1
  },
  {
    q: "What action must a supervisor take if an employee refuses to submit to a required drug or alcohol test?",
    options: [
      "Issue a written warning and allow the employee to continue working",
      "Remove the employee from safety-sensitive duties and treat it as a positive test",
      "Give the employee 24 hours to reconsider",
      "Contact law enforcement immediately"
    ],
    answer: 1
  },
  {
    q: "Which of the following physical signs may indicate alcohol misuse?",
    options: [
      "Pinpoint pupils and slow heart rate",
      "Slurred speech, unsteady gait, and smell of alcohol",
      "Excessive sweating and rapid speech only",
      "Red eyes and increased appetite"
    ],
    answer: 1
  },
  {
    q: "Under FAA regulations, what is the alcohol concentration level that prohibits an employee from performing safety-sensitive functions?",
    options: [
      "0.02 or greater",
      "0.04 or greater",
      "0.08 or greater",
      "Any detectable level"
    ],
    answer: 1
  },
  {
    q: "A supervisor's reasonable suspicion observations must be documented:",
    options: [
      "Only if the test comes back positive",
      "Within 24 hours of the observed behavior or before the results are released",
      "At the end of the work week",
      "Documentation is not required under FAA rules"
    ],
    answer: 1
  },
  {
    q: "Which of the following is true about the supervisor's training requirement under FAA 14 CFR Part 120?",
    options: [
      "No training is required if the supervisor has prior law enforcement experience",
      "Supervisors must receive 60 minutes of training on physical, behavioral, and performance indicators of drug use and 60 minutes on alcohol misuse",
      "A single 30-minute online course is sufficient",
      "Training only needs to happen once every 5 years"
    ],
    answer: 1
  }
];

/* =========================
   QUIZ RENDER
========================= */
function loadFAASupervisorQuiz() {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  /* Shuffle and pick 10 */
  const questions = [...FAA_SUPERVISOR_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
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
        <div class="quiz-nav" style="margin-top:1.5rem;display:flex;justify-content:space-between;gap:1rem;">
          ${current > 0 ? `<button class="btn btn-secondary" onclick="faaSupervisorNav(-1)">← Back</button>` : `<span></span>`}
          ${current < questions.length - 1
            ? `<button class="btn btn-primary" onclick="faaSupervisorNav(1)">Next →</button>`
            : `<button class="btn btn-primary" onclick="faaSupervisorSubmit()">Submit Quiz</button>`
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

  window.faaSupervisorNav = function(dir) {
    current += dir;
    renderQuestion();
  };

  window.faaSupervisorSubmit = function() {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      showToast(`Please answer all questions (${unanswered} remaining).`, "error");
      return;
    }
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) score++; });
    handleFAASupervisorQuizResult(score, questions.length);
  };

  renderQuestion();
}

/* =========================
   QUIZ RESULT
========================= */
function handleFAASupervisorQuizResult(score, total) {
  const percent  = Math.round((score / total) * 100);
  const attempts = parseInt(localStorage.getItem(FAA_SUP_ATTEMPTS_KEY) || "0", 10) + 1;
  localStorage.setItem(FAA_SUP_ATTEMPTS_KEY, attempts);

  if (percent >= FAA_SUP_PASS_PERCENTAGE) {
    localStorage.setItem(FAA_SUP_PASSED_KEY, "true");
    localStorage.removeItem(FAA_SUP_ATTEMPTS_KEY);
    localStorage.removeItem(FAA_SUP_COOLDOWN_KEY);
    document.getElementById("quizSection").innerHTML = `
      <div class="quiz-card" style="text-align:center;">
        <h2 style="color:var(--color-primary);margin-bottom:.5rem;">Training Completed</h2>
        <p style="margin-bottom:1.5rem;">You scored <strong>${percent}%</strong> — Passed</p>
        <button class="btn btn-primary" onclick="finishFAASupervisorTraining()">View Certificate</button>
      </div>
    `;
    return;
  }

  if (attempts >= FAA_SUP_MAX_ATTEMPTS) {
    localStorage.setItem(FAA_SUP_COOLDOWN_KEY, Date.now() + FAA_SUP_COOLDOWN_MINUTES * 60000);
    document.getElementById("quizSection").innerHTML = `
      <div class="quiz-card" style="text-align:center;">
        <h2 style="color:var(--color-warning);margin-bottom:.5rem;">Too Many Attempts</h2>
        <p>Please wait ${FAA_SUP_COOLDOWN_MINUTES} minutes before retrying.</p>
      </div>
    `;
    return;
  }

  document.getElementById("quizSection").innerHTML = `
    <div class="quiz-card" style="text-align:center;">
      <h2 style="color:var(--color-warning);margin-bottom:.5rem;">Quiz Failed</h2>
      <p>You scored <strong>${percent}%</strong>. Passing score is ${FAA_SUP_PASS_PERCENTAGE}%.</p>
      <p style="margin:.5rem 0 1.5rem;">Attempts remaining: <strong>${FAA_SUP_MAX_ATTEMPTS - attempts}</strong></p>
      <button class="btn btn-primary" onclick="showSection('quiz')">Retry Quiz</button>
    </div>
  `;
}

/* =========================
   FINALIZE TRAINING
========================= */
function finishFAASupervisorTraining() {
  localStorage.setItem(FAA_SUP_COMPLETED_KEY, "true");
  saveTrainingProgress("faa-supervisor", "faa", new Date().toISOString());
  localStorage.setItem(FAA_SUP_DATE_KEY, Date.now());
  lockToFAASupervisorCertificate();
}

/* =========================
   CERTIFICATE LOCK
========================= */
function lockToFAASupervisorCertificate() {
  ["contentSection","quizSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  document.getElementById("certificateSection")?.classList.remove("hidden");
  document.querySelectorAll(".module-nav button").forEach(btn => { btn.disabled = true; });
  setActiveTab("certificate");
  populateFAASupervisorCertificate();
}

/* =========================
   CERTIFICATE GENERATION
========================= */
function populateFAASupervisorCertificate() {
  if (!user) return;

  let certId = localStorage.getItem(FAA_SUP_CERT_KEY);
  if (!certId) {
    certId = typeof generateCertificateId === "function"
      ? generateCertificateId("FAA-SUP")
      : "FAA-SUP-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem(FAA_SUP_CERT_KEY, certId);
  }

  /* Register in amsCertificates registry */
  if (!localStorage.getItem(`faaSupervisorCertRegistered_${USER_EMAIL}`)) {
    if (typeof registerCertificate === "function") {
      const fullName = user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.email;
      registerCertificate({
        id: certId,
        name: fullName,
        course: "FAA Supervisor Reasonable Suspicion Training",
        type: "faa_supervisor",
        date: Date.now(),
        displayDate: new Date().toLocaleDateString("en-US")
      });
      localStorage.setItem(`faaSupervisorCertRegistered_${USER_EMAIL}`, "true");
    }
  }

  /* Also write into companyProfile.certIds so admin can view it */
  try {
    const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
    if (!company.certIds) company.certIds = {};
    if (!company.certIds[USER_EMAIL]) {
      company.certIds[USER_EMAIL] = { certId, type: "faa_supervisor", date: Date.now() };
      localStorage.setItem("companyProfile", JSON.stringify(company));
    }
  } catch(e) {}

  /* Populate fields */
  const displayName = user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email || "—";

  document.getElementById("certName").textContent  = displayName;
  document.getElementById("certDate").textContent  =
    new Date(Number(localStorage.getItem(FAA_SUP_DATE_KEY) || Date.now())).toLocaleDateString("en-US");
  document.getElementById("certVerify").textContent = certId;
  document.getElementById("certId").textContent     = certId;

  /* QR code */
  const qrBox = document.getElementById("certQR");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: window.location.origin + "/frontend/pages/verify.html?id=" + certId,
      width: 128, height: 128
    });
  }
}
