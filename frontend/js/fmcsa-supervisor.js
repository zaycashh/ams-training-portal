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
   FMCSA SUPERVISOR MODULE A
   Extracted from inline script — all IDs + logic preserved
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
   PDF.JS WORKER
-------------------------- */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* -------------------------
   CONSTANTS
-------------------------- */
const PASS_SCORE    = 7;
const MAX_ATTEMPTS  = 3;
const COOLDOWN_MINUTES = 15;
const ATTEMPT_KEY   = "fmcsa_mod1_attempts";
const COOLDOWN_KEY  = "fmcsa_mod1_cooldown";
const PROGRESS_KEY  = "fmcsa_mod1_quiz_progress";

/* =========================================================
   SECTION CONTROL
========================================================= */
function showSection(section) {
  const user  = JSON.parse(localStorage.getItem("amsUser") || "{}");
  const email = user.email;

  if (section === "quiz") {
    const done = localStorage.getItem(`fmcsa_mod1_content_done_${email}`) === "true";
    if (!done) {
      showToast("Complete the training content first.", "error");
      return;
    }
  }

  ["contentSection","quizSection","certificateSection"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  document.querySelectorAll(".pill-btn").forEach(b => b.classList.remove("active"));

  if (section === "content") {
    document.getElementById("contentSection")?.classList.remove("hidden");
    document.getElementById("btnContent")?.classList.add("active");
  }
  if (section === "quiz") {
    document.getElementById("quizSection")?.classList.remove("hidden");
    document.getElementById("btnQuiz")?.classList.add("active");
  }
  if (section === "certificate") {
    document.getElementById("certificateSection")?.classList.remove("hidden");
    document.getElementById("btnCertificate")?.classList.add("active");
  }
}

function goDashboard() {
  const u = JSON.parse(localStorage.getItem("amsUser") || "null");
  const isAdmin = u && (u.role === "company_admin" || u.role === "owner" || u.role === "admin");
  window.location.href = isAdmin ? "company-dashboard.html" : "dashboard.html";
}

/* =========================================================
   COOLDOWN CHECK
========================================================= */
function checkCooldown() {
  const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || "0", 10);
  if (Date.now() < cooldownUntil) {
    const minutesLeft = Math.ceil((cooldownUntil - Date.now()) / 60000);
    showToast(`Quiz locked. Try again in ${minutesLeft} minute(s).`, "error", 5000);
    setTimeout(() => goDashboard(), 2000);
    return true;
  }
  return false;
}

/* =========================================================
   PDF VIEWER
========================================================= */
const url = "../assets/fmcsa/1-Sup-Reas-Susp-Training.pdf";
let pdfDoc = null, pageNum = 1, totalPages = 0, rendering = false;
const canvas = document.getElementById("pdfCanvas");
const ctx    = canvas ? canvas.getContext("2d") : null;
const completeBtn = document.getElementById("completeContentBtn");

pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;
  document.getElementById("totalPages").textContent = totalPages;
  renderPage(pageNum);
}).catch(err => console.error("PDF load error:", err));

function renderPage(num) {
  if (rendering || !pdfDoc) return;
  rendering = true;
  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale: 1 });
    canvas.height = viewport.height;
    canvas.width  = viewport.width;
    page.render({ canvasContext: ctx, viewport }).promise.then(() => { rendering = false; });
    document.getElementById("currentPage").textContent = num;
    document.getElementById("progressBar").style.width = (num / totalPages * 100) + "%";

    if (completeBtn) {
      if (num === totalPages) {
        completeBtn.style.display = "inline-flex";
        completeBtn.disabled = false;
      } else {
        completeBtn.style.display = "none";
        completeBtn.disabled = true;
      }
    }
  });
}

document.getElementById("prevPageBtn")?.addEventListener("click", () => {
  if (pageNum > 1) { pageNum--; renderPage(pageNum); }
});
document.getElementById("nextPageBtn")?.addEventListener("click", () => {
  if (pageNum < totalPages) { pageNum++; renderPage(pageNum); }
});

/* =========================================================
   COMPLETE CONTENT BUTTON
========================================================= */
document.addEventListener("click", function(e) {
  if (e.target.closest("#completeContentBtn")) {
    const user  = JSON.parse(localStorage.getItem("amsUser") || "{}");
    const email = user.email;
    localStorage.setItem(`fmcsa_mod1_content_done_${email}`, "true");

    const quizBtn = document.getElementById("btnQuiz");
    if (quizBtn) { quizBtn.disabled = false; quizBtn.classList.add("done"); }

    showSection("quiz");
    initQuiz();
  }
});

/* =========================================================
   RESTORE PROGRESS
========================================================= */
document.addEventListener("DOMContentLoaded", function() {
  const user  = JSON.parse(localStorage.getItem("amsUser") || "{}");
  const email = user.email;
  const contentDone = localStorage.getItem(`fmcsa_mod1_content_done_${email}`);

  if (contentDone === "true") {
    const quizBtn = document.getElementById("btnQuiz");
    if (quizBtn) { quizBtn.disabled = false; quizBtn.classList.add("done"); }
    document.getElementById("contentSection")?.classList.add("hidden");
    document.getElementById("quizSection")?.classList.remove("hidden");
    document.getElementById("btnContent")?.classList.remove("active");
    document.getElementById("btnQuiz")?.classList.add("active");
    initQuiz();
  }
});

/* =========================================================
   QUIZ QUESTIONS
========================================================= */
const questions = [
  { q:"A Drug-Free Workplace policy does which of the following?", a:{A:"Promote a safe work environment",B:"Maintain product integrity",C:"Encourage employees who have a substance abuse problem to voluntarily seek help",D:"All of the above"}, correct:"D" },
  { q:"Which of the following is NOT a category of substance abuse symptom or warning signs?", a:{A:"Behavioral",B:"Physical",C:"Clinical",D:"Performance"}, correct:"C" },
  { q:"Workplace aggression, Employee burnout, Anxiety, Depression, Paranoia, Withdrawn, Denial, and over sensitivity would be examples of which warning signs?", a:{A:"Emotional",B:"Behavioral",C:"Physical",D:"Performance"}, correct:"A" },
  { q:"Which of the following would be a valid reason for a supervisor to be worried about an employee?", a:{A:"Habitual lateness",B:"Declining attention to personal hygiene",C:"Workplace aggression",D:"All of the above"}, correct:"D" },
  { q:"Which of the following would NOT be considered a \"direct personal action\" warning sign?", a:{A:"Falling asleep on the job",B:"DWI conviction",C:"Unexplained increase in disputes with fellow workers",D:"Borrowing money from fellow employees"}, correct:"A" },
  { q:"Enabling refers to allowing a substance abuser to avoid the consequences of his/her actions. Which of the following actions by a supervisor is the most correct answer for enabling?", a:{A:"Sending an employee home sick",B:"Covering up for a poor or declining job performance",C:"Transferring the employee to another department",D:"All of these are considered enabling actions"}, correct:"D" },
  { q:"Which of the following does NOT relate to documentation?", a:{A:"It is an essential ingredient in any drug-free workplace program.",B:"It allows the supervisor to have their Human Resource department handle the problem first.",C:"It allows for declining performance to be recorded",D:"May be used to address employee issues"}, correct:"B" },
  { q:"Sometimes as a supervisor you may face a crisis situation when an employee appears to be under the influence of alcohol and/or drugs. Which of the following should you do?", a:{A:"Immediately confront the employee and ask him/her if they have been drinking or taking drugs",B:"Enlist the assistance of a fellow manager to observe the employee's actions",C:"Call your Human Resources department and let them handle the problem",D:"Tell the employee to go home"}, correct:"B" }
];

let currentPage = 0;
let userAnswers  = new Array(questions.length).fill(null);

/* =========================================================
   INIT QUIZ
========================================================= */
function initQuiz() {
  if (checkCooldown()) return;

  const saved = localStorage.getItem(PROGRESS_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    currentPage = data.currentPage ?? 0;
    userAnswers = data.userAnswers ?? userAnswers;
  }
  updateQuizPage();
}

function updateQuizPage() {
  const start     = currentPage * 2;
  const end       = Math.min(start + 2, questions.length);
  const container = document.getElementById("quizQuestions");
  if (!container) return;
  container.innerHTML = "";

  document.getElementById("pageIndicator").textContent =
    `Page ${currentPage + 1} of ${Math.ceil(questions.length / 2)}`;

  for (let i = start; i < end; i++) {
    const q   = questions[i];
    const div = document.createElement("div");
    div.className = "quiz-card";
    div.innerHTML = `
      <div class="quiz-question">
        <span>Question ${i + 1} of ${questions.length}</span>
        <h3>${q.q}</h3>
      </div>
      <div class="quiz-answers">
        ${Object.entries(q.a).map(([letter, text]) => `
          <label class="quiz-option">
            <input type="radio" name="q${i}" value="${letter}" ${userAnswers[i] === letter ? "checked" : ""}>
            <span>${letter}. ${text}</span>
          </label>
        `).join("")}
      </div>`;
    container.appendChild(div);
  }

  const nextBtn = document.getElementById("nextQuizBtn");
  if (nextBtn) nextBtn.textContent = currentPage === 3 ? "Submit" : "Next →";
}

/* =========================================================
   QUIZ NAV
========================================================= */
document.getElementById("nextQuizBtn")?.addEventListener("click", () => {
  saveAnswers();
  if (currentPage < 3) { currentPage++; updateQuizPage(); }
  else gradeQuiz();
});

document.getElementById("prevQuizBtn")?.addEventListener("click", () => {
  saveAnswers();
  if (currentPage > 0) { currentPage--; updateQuizPage(); }
});

function saveAnswers() {
  document.querySelectorAll("#quizQuestions input").forEach(input => {
    if (input.checked) {
      userAnswers[parseInt(input.name.replace("q", ""))] = input.value;
    }
  });
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ currentPage, userAnswers }));
}

document.addEventListener("change", function(e) {
  if (e.target.matches("#quizQuestions input[type='radio']")) saveAnswers();
});

/* =========================================================
   GRADE QUIZ
========================================================= */
function gradeQuiz() {
  const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < cooldownUntil) {
    showToast("Cooldown active. Try again later.", "error");
    return;
  }

  let score = 0;
  questions.forEach((q, i) => { if (userAnswers[i] === q.correct) score++; });

  let attempts = parseInt(localStorage.getItem(ATTEMPT_KEY)) || 0;

  if (score >= PASS_SCORE) {
    const user  = JSON.parse(localStorage.getItem("amsUser") || "null");
    const email = user?.email || "guest";

    if (typeof generateSupervisorCertificate === "function") generateSupervisorCertificate();

    localStorage.setItem(`fmcsaModuleACompleted_${email}`, "true");
    saveTrainingProgress("fmcsa-supervisor-a", "fmcsa", new Date().toISOString(), localStorage.getItem(`fmcsaModuleACertificateId_${email}`));
    localStorage.setItem(`fmcsaModuleADate_${email}`, Date.now());

    let certId = localStorage.getItem(`fmcsaModuleACertificateId_${email}`);
    if (!certId && typeof generateCertificateId === "function") {
      certId = generateCertificateId("AMS-FMCSA");
      localStorage.setItem(`fmcsaModuleACertificateId_${email}`, certId);
    }

    /* Save cert ID into companyProfile keys — only update keys that already have company data */
    try {
      const _certEntry = { certId, type: "supervisor", date: Date.now() };
      ["companyProfile_fmcsa", "companyProfile"].forEach(key => {
        const raw = localStorage.getItem(key);
        if (!raw) return; /* don't create from scratch */
        const cp = JSON.parse(raw);
        if (!cp.id && !cp.name) return; /* skip if not a real company profile */
        if (!cp.certIds) cp.certIds = {};
        cp.certIds[email] = _certEntry;
        localStorage.setItem(key, JSON.stringify(cp));
      });
    } catch(e) {}

    localStorage.removeItem(ATTEMPT_KEY);
    localStorage.removeItem(PROGRESS_KEY);

    document.getElementById("quizResult").innerHTML =
      `<div class="result-box pass">You passed! Generating certificate...</div>`;

    showToast("Quiz passed! Certificate generated.", "success");

    /* Unlock cert nav btn */
    const certBtn = document.getElementById("btnCertificate");
    if (certBtn) { certBtn.disabled = false; certBtn.classList.add("done"); }

    setTimeout(() => {
      document.getElementById("quizSection")?.classList.add("hidden");
      document.getElementById("certificateSection")?.classList.remove("hidden");

      const u = JSON.parse(localStorage.getItem("amsUser") || "null");
      const fullName = u?.fullName ||
        `${u?.firstName || ""} ${u?.lastName || ""}`.trim() ||
        u?.email || "User";

      document.getElementById("certName").textContent = fullName;
      document.getElementById("certDate").textContent = new Date().toLocaleDateString("en-US");
      document.getElementById("certId").textContent   = localStorage.getItem(`fmcsaModuleACertificateId_${email}`) || "";

      if (typeof generateQR === "function") {
        generateQR(localStorage.getItem(`fmcsaModuleACertificateId_${email}`), "certQR");
      }
    }, 1500);

    return;
  }

  attempts++;
  localStorage.setItem(ATTEMPT_KEY, attempts);
  const remaining = MAX_ATTEMPTS - attempts;

  if (remaining <= 0) {
    localStorage.setItem(COOLDOWN_KEY, Date.now() + COOLDOWN_MINUTES * 60000);
    localStorage.setItem(ATTEMPT_KEY, 0);
    showToast("Maximum attempts reached. Quiz locked for 15 minutes.", "error", 5000);
    setTimeout(() => goDashboard(), 2000);
    return;
  }

  let reviewHTML = "";
  questions.forEach((q, i) => {
    if (userAnswers[i] !== q.correct) {
      reviewHTML += `
        <div style="margin-top:12px;">
          <p><strong>Q${i+1}:</strong> ${q.q}</p>
          <p style="color:var(--color-warning)">Your answer: ${userAnswers[i] || "Not answered"}. ${q.a[userAnswers[i]] || ""}</p>
          <p style="color:var(--color-success)">Correct: ${q.correct}. ${q.a[q.correct]}</p>
        </div>`;
    }
  });

  document.getElementById("quizResult").innerHTML = `
    <div class="result-box fail">
      <strong>Score: ${score}/${questions.length}</strong> — Attempts remaining: ${remaining}
      ${reviewHTML}
    </div>`;
}
