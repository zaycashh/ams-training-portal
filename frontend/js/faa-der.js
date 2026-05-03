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

/* =========================================================
   FAA DER TRAINING LOGIC
   Fully independent from FMCSA — zero key collision
========================================================= */

const FAA_DER_MAX_ATTEMPTS     = 3;
const FAA_DER_PASS_PERCENTAGE  = 80;
const FAA_DER_COOLDOWN_MINUTES = 15;

/* =========================
   USER CONTEXT
========================= */
const user       = JSON.parse(localStorage.getItem("amsUser") || "null");
const USER_EMAIL = user?.email || "guest";

/* =========================
   STORAGE KEYS — all faa prefixed
========================= */
const FAA_DER_CONTENT_DONE_KEY = `faaDERContentCompleted_${USER_EMAIL}`;
const FAA_DER_PASSED_KEY       = `faaDERQuizPassed_${USER_EMAIL}`;
const FAA_DER_COMPLETED_KEY    = `faaDERCompleted_${USER_EMAIL}`;
const FAA_DER_ATTEMPTS_KEY     = `faaDERQuizAttempts_${USER_EMAIL}`;
const FAA_DER_COOLDOWN_KEY     = `faaDERQuizCooldownUntil_${USER_EMAIL}`;
const FAA_DER_CERT_KEY         = `faaDERCertificateId_${USER_EMAIL}`;
const FAA_DER_DATE_KEY         = `faaDERTrainingDate_${USER_EMAIL}`;

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
  if (localStorage.getItem(FAA_DER_COMPLETED_KEY) === "true") {
    lockToFAADERCertificate();
    return;
  }
  if (section === "quiz") {
    if (localStorage.getItem(FAA_DER_CONTENT_DONE_KEY) !== "true") {
      showToast("Complete the training content first.", "error");
      return;
    }
    const cooldownUntil = parseInt(localStorage.getItem(FAA_DER_COOLDOWN_KEY) || "0", 10);
    if (Date.now() < cooldownUntil) {
      const mins = Math.ceil((cooldownUntil - Date.now()) / 60000);
      showToast(`Quiz locked. Try again in ${mins} minute(s).`, "error", 5000);
      return;
    }
  }
  if (section === "certificate") {
    if (localStorage.getItem(FAA_DER_PASSED_KEY) !== "true") return;
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
    loadFAADERQuiz();
  }
  if (section === "certificate") {
    document.getElementById("certificateSection")?.classList.remove("hidden");
    setActiveTab("certificate");
    populateFAADERCertificate();
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
  if (document.body.dataset.module !== "faa-der") return;

  if (!user) { window.location.replace("login.html"); return; }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  /* Company seat check */
  if (user.type === "company" && user.role === "employee") {
    const hasSeat = company?.usedSeats?.der?.[user.email];
    if (!hasSeat) {
      sessionStorage.setItem("ams_notice", "No DER seat assigned. Contact your administrator.");
      window.location.replace("dashboard.html");
      return;
    }
  }

  const completeBtn = document.getElementById("completeDerContentBtn");
  if (completeBtn) completeBtn.addEventListener("click", completeFAADERContent);

  if (localStorage.getItem(FAA_DER_COMPLETED_KEY) === "true") {
    lockToFAADERCertificate();
    return;
  }

  showSection("content");
});

/* =========================
   CONTENT COMPLETION
========================= */
function completeFAADERContent() {
  localStorage.setItem(FAA_DER_CONTENT_DONE_KEY, "true");
  showSection("quiz");
}

/* =========================
   QUIZ — QUESTIONS (placeholder — replace with real FAA DER content)
========================= */
const FAA_DER_QUESTIONS = [
  {
    q: "What is the primary responsibility of a Designated Employer Representative (DER) under FAA 14 CFR Part 120?",
    options: [
      "To conduct all drug tests personally",
      "To serve as the employer's point of contact with testing authorities and oversee the drug and alcohol testing program",
      "To approve or deny all employee leave requests",
      "To manage payroll for safety-sensitive employees"
    ],
    answer: 1
  },
  {
    q: "When must a DER immediately remove an employee from safety-sensitive functions?",
    options: [
      "When the employee shows up late for work",
      "When the employee has a confirmed positive drug test, refuses a test, or has an alcohol concentration of 0.04 or greater",
      "When the employee has three unexcused absences",
      "When the employee's annual physical is overdue"
    ],
    answer: 1
  },
  {
    q: "Under FAA regulations, which type of testing must a DER ensure is conducted on a strictly unannounced basis?",
    options: [
      "Pre-employment testing",
      "Return-to-duty testing",
      "Random testing",
      "Post-accident testing"
    ],
    answer: 2
  },
  {
    q: "What action must a DER take when an employee is involved in a fatal aviation accident?",
    options: [
      "Wait for law enforcement to conduct testing",
      "Ensure the employee is tested for drugs within 32 hours and alcohol within 8 hours of the accident",
      "File an incident report and test within 72 hours",
      "No testing is required if the employee was not the pilot"
    ],
    answer: 1
  },
  {
    q: "A DER receives a verified positive drug test result. What is the correct sequence of actions?",
    options: [
      "Terminate the employee immediately without further steps",
      "Remove the employee from safety-sensitive duties, refer to a Substance Abuse Professional (SAP), and document the action",
      "Give the employee a warning and allow continued work pending appeal",
      "Contact law enforcement before taking any action"
    ],
    answer: 1
  },
  {
    q: "Which of the following is NOT a DER responsibility under the FAA drug and alcohol testing program?",
    options: [
      "Maintaining required testing records",
      "Ensuring random testing rates meet FAA minimums",
      "Performing medical evaluations of employees",
      "Coordinating with the Medical Review Officer (MRO)"
    ],
    answer: 2
  },
  {
    q: "How long must a DER retain records of verified positive drug test results?",
    options: [
      "1 year",
      "2 years",
      "5 years",
      "10 years"
    ],
    answer: 2
  },
  {
    q: "What is the DER's role when an employee requests a split specimen test?",
    options: [
      "The DER can deny the request if they believe it is not warranted",
      "The DER must ensure the request is forwarded to the MRO within 72 hours of notification",
      "The DER conducts the split specimen test personally",
      "The DER must wait for the employee's union to authorize the test"
    ],
    answer: 1
  },
  {
    q: "Under FAA rules, what must a DER do if they cannot locate an employee selected for random testing?",
    options: [
      "Skip the employee for that testing period with no documentation",
      "Document the attempts to contact the employee and report if the employee cannot be reached",
      "Automatically count the employee as a refusal",
      "Test the next employee on the list without documentation"
    ],
    answer: 1
  },
  {
    q: "A Substance Abuse Professional (SAP) recommends a return-to-duty treatment plan. What must the DER ensure before allowing the employee back to safety-sensitive duties?",
    options: [
      "The employee signs a waiver acknowledging the positive test",
      "The employee completes the SAP's recommended treatment and passes a return-to-duty test with a verified negative result",
      "The employee completes only a written acknowledgment form",
      "The employee serves a 30-day suspension regardless of SAP recommendation"
    ],
    answer: 1
  }
];

/* =========================
   QUIZ RENDER
========================= */
function loadFAADERQuiz() {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  const questions = [...FAA_DER_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
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
          ${current > 0 ? `<button class="btn btn-secondary" onclick="faaDERNav(-1)">← Back</button>` : `<span></span>`}
          ${current < questions.length - 1
            ? `<button class="btn btn-primary" onclick="faaDERNav(1)">Next →</button>`
            : `<button class="btn btn-primary" onclick="faaDERSubmit()">Submit Quiz</button>`
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

  window.faaDERNav = function(dir) { current += dir; renderQuestion(); };

  window.faaDERSubmit = function() {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      showToast(`Please answer all questions (${unanswered} remaining).`, "error");
      return;
    }
    let score = 0;
    questions.forEach((q, i) => { if (answers[i] === q.answer) score++; });
    handleFAADERQuizResult(score, questions.length);
  };

  renderQuestion();
}

/* =========================
   QUIZ RESULT
========================= */
function handleFAADERQuizResult(score, total) {
  const percent  = Math.round((score / total) * 100);
  const attempts = parseInt(localStorage.getItem(FAA_DER_ATTEMPTS_KEY) || "0", 10) + 1;
  localStorage.setItem(FAA_DER_ATTEMPTS_KEY, attempts);

  if (percent >= FAA_DER_PASS_PERCENTAGE) {
    localStorage.setItem(FAA_DER_PASSED_KEY, "true");
    localStorage.removeItem(FAA_DER_ATTEMPTS_KEY);
    localStorage.removeItem(FAA_DER_COOLDOWN_KEY);
    document.getElementById("quizSection").innerHTML = `
      <div class="quiz-card" style="text-align:center;">
        <h2 style="color:var(--color-primary);margin-bottom:.5rem;">Training Completed</h2>
        <p style="margin-bottom:1.5rem;">You scored <strong>${percent}%</strong> — Passed</p>
        <button class="btn btn-primary" onclick="finishFAADERTraining()">View Certificate</button>
      </div>
    `;
    return;
  }

  if (attempts >= FAA_DER_MAX_ATTEMPTS) {
    localStorage.setItem(FAA_DER_COOLDOWN_KEY, Date.now() + FAA_DER_COOLDOWN_MINUTES * 60000);
    document.getElementById("quizSection").innerHTML = `
      <div class="quiz-card" style="text-align:center;">
        <h2 style="color:var(--color-warning);margin-bottom:.5rem;">Too Many Attempts</h2>
        <p>Please wait ${FAA_DER_COOLDOWN_MINUTES} minutes before retrying.</p>
      </div>
    `;
    return;
  }

  document.getElementById("quizSection").innerHTML = `
    <div class="quiz-card" style="text-align:center;">
      <h2 style="color:var(--color-warning);margin-bottom:.5rem;">Quiz Failed</h2>
      <p>You scored <strong>${percent}%</strong>. Passing score is ${FAA_DER_PASS_PERCENTAGE}%.</p>
      <p style="margin:.5rem 0 1.5rem;">Attempts remaining: <strong>${FAA_DER_MAX_ATTEMPTS - attempts}</strong></p>
      <button class="btn btn-primary" onclick="showSection('quiz')">Retry Quiz</button>
    </div>
  `;
}

/* =========================
   FINALIZE TRAINING
========================= */
function finishFAADERTraining() {
  localStorage.setItem(FAA_DER_COMPLETED_KEY, "true");
  saveTrainingProgress("faa-der", "faa", new Date().toISOString(), localStorage.getItem(FAA_DER_CERT_KEY));
  localStorage.setItem(FAA_DER_DATE_KEY, Date.now());
  lockToFAADERCertificate();
}

/* =========================
   CERTIFICATE LOCK
========================= */
function lockToFAADERCertificate() {
  ["contentSection","quizSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  document.getElementById("certificateSection")?.classList.remove("hidden");
  document.querySelectorAll(".module-nav button").forEach(btn => { btn.disabled = true; });
  setActiveTab("certificate");
  populateFAADERCertificate();
}

/* =========================
   CERTIFICATE GENERATION
========================= */
function populateFAADERCertificate() {
  if (!user) return;

  let certId = localStorage.getItem(FAA_DER_CERT_KEY);
  if (!certId) {
    certId = typeof generateCertificateId === "function"
      ? generateCertificateId("FAA-DER")
      : "FAA-DER-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    localStorage.setItem(FAA_DER_CERT_KEY, certId);
  }

  if (!localStorage.getItem(`faaDERCertRegistered_${USER_EMAIL}`)) {
    if (typeof registerCertificate === "function") {
      const fullName = user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
      registerCertificate({
        id: certId,
        name: fullName,
        course: "FAA DER Drug & Alcohol Training",
        type: "faa_der",
        date: Date.now(),
        displayDate: new Date().toLocaleDateString("en-US")
      });
      localStorage.setItem(`faaDERCertRegistered_${USER_EMAIL}`, "true");
    }
  }

  /* Write into companyProfile.certIds for admin view */
  try {
    const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
    if (!company.certIds) company.certIds = {};
    if (!company.certIds[USER_EMAIL]) {
      company.certIds[USER_EMAIL] = { certId, type: "faa_der", date: Date.now() };
      localStorage.setItem("companyProfile", JSON.stringify(company));
    }
  } catch(e) {}

  const displayName = user.fullName ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "—";

  document.getElementById("certName").textContent  = displayName;
  document.getElementById("certDate").textContent  =
    new Date(Number(localStorage.getItem(FAA_DER_DATE_KEY) || Date.now())).toLocaleDateString("en-US");
  document.getElementById("certVerify").textContent = certId;
  if (document.getElementById("certId")) document.getElementById("certId").textContent = certId;

  const qrBox = document.getElementById("certQR");
  if (qrBox && typeof QRCode !== "undefined") {
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: window.location.origin + "/frontend/pages/verify.html?id=" + certId,
      width: 128, height: 128
    });
  }
}
