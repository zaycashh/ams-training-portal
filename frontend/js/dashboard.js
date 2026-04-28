const user  = JSON.parse(localStorage.getItem("amsUser") || "null");
const email = user?.email;

/* =========================
   COURSE KEYS
========================= */
const COURSE_KEYS = {
  der: "paid_der",
  supervisor: "paid_supervisor",
  employee: "paid_employee",
  fmcsa: "paid_fmcsa"
};

/* =========================
   FAA MODULE REGISTRY
========================= */
const FAA_MODULES = {

  employee: {
    btn: "employeeBtn",
    paidKey: "paid_employee",
    completedKey: (email) => `faaEmployeeCompleted_${email}`,
    start: "faa-employee.html"
  },

  supervisor: {
    btn: "supervisorBtn",
    paidKey: "paid_supervisor",
    completedKey: (email) => `faaSupervisorCompleted_${email}`,
    start: "faa-supervisor.html"
  },

  der: {
    btn: "derBtn",
    paidKey: "paid_der",
    completedKey: (email) => `faaDERCompleted_${email}`,
    start: "faa-der.html"
  }

};

/* =========================
   FAA BUTTON ENGINE
========================= */
function updateFAAModuleButtons() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return;

  Object.keys(FAA_MODULES).forEach(module => {

    const config = FAA_MODULES[module];
    const btn = document.getElementById(config.btn);

    if (!btn) return;

    const completed =
      localStorage.getItem(config.completedKey(user.email)) === "true";

    if (completed) {
      btn.textContent = "🎓 View Certificate";
      btn.onclick = () => {
        window.location.href = "certificates.html#" + module;
      };
      btn.disabled = false;
      return;
    }

    const paidFAA =
      localStorage.getItem(`${config.paidKey}_${user.email}`) === "true";

    /* Check company seat for employees — only unlock the specific assigned module */
    const _faaProf   = JSON.parse(localStorage.getItem("companyProfile_faa") || localStorage.getItem("companyProfile") || "{}");
    const _faaSeat   = _faaProf?.usedSeats?.[module]?.[user.email];
    const hasFAASeat = _faaSeat && !_faaSeat.revoked;

    if (paidFAA || hasFAASeat) {
      btn.textContent = "Start Training";
      btn.onclick = () => {
        window.location.href = config.start;
      };
      btn.disabled = false;
      return;
    }

    btn.textContent = "🔒 Locked — Purchase Required";
    btn.onclick = () => {
      window.location.href = `payment.html?module=${module}`;
    };

  });

}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.removeItem("amsUser");
  window.location.replace("login.html");
}

/* =========================
   ACCESS CHECK
========================= */
function hasAccess(course) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return false;
  const paidKey = COURSE_KEYS[course];
  return localStorage.getItem(`${paidKey}_${user.email}`) === "true";
}

/* =========================
   COMPLETION DATES
========================= */
function updateFAACompletionDates() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return;

  const derDate = localStorage.getItem(`derTrainingDate_${user.email}`);
  if (derDate) {
    const el = document.getElementById("derCompletionDate");
    if (el) {
      el.innerHTML = `
        <span class="status-badge status-completed">✔ Completed</span>
        ${new Date(Number(derDate)).toLocaleDateString("en-US")}
      `;
    }
  }

  const supDate = localStorage.getItem(`supervisorTrainingDate_${user.email}`);
  if (supDate) {
    const el = document.getElementById("supervisorCompletionDate");
    if (el) {
      el.innerHTML = `
        <span class="status-badge status-completed">✔ Completed</span>
        ${new Date(Number(supDate)).toLocaleDateString("en-US")}
      `;
    }
  }

  const empDate = localStorage.getItem(`employeeTrainingDate_${user.email}`);
  if (empDate) {
    const el = document.getElementById("employeeCompletionDate");
    if (el) {
      el.innerHTML = `
        <span class="status-badge status-completed">✔ Completed</span>
        ${new Date(Number(empDate)).toLocaleDateString("en-US")}
      `;
    }
  }

}

function updateFMCSATimer() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return;

  const paid = localStorage.getItem(`paid_fmcsa_${user.email}`) === "true";
  if (!paid) return;

  const purchaseDate = localStorage.getItem(`fmcsa_start_date_${user.email}`);
  if (!purchaseDate) return;

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now         = Date.now();
  const expiration  = parseInt(purchaseDate) + THIRTY_DAYS;
  const remaining   = expiration - now;

  const fmcsaCard = document.getElementById("fmcsaCard");
  if (!fmcsaCard) return;

  if (remaining <= 0) {
    localStorage.removeItem(`paid_fmcsa_${user.email}`);
    localStorage.removeItem(`fmcsa_start_date_${user.email}`);
    const btn = fmcsaCard.querySelector("button");
    if (btn) {
      btn.textContent = "Expired — Purchase Required";
      btn.onclick = () => (window.location.href = "../pages/payment.html?type=fmcsa");
    }
    return;
  }

  const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  const info = fmcsaCard.querySelector(".fmcsa-timer");
  if (info) {
    info.textContent = `Access expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const company      = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const storedProgram = localStorage.getItem("amsProgram");
  const _currentUser  = JSON.parse(localStorage.getItem("amsUser") || "{}");
  const program       = (_currentUser.program || company.program || storedProgram || "").toLowerCase();

  console.log("PROGRAM:", program);

  /* PROGRAM LOCK */
  if (program === "fmcsa") {
    document.querySelectorAll(".faa-section").forEach(el => el.remove());
  }
  if (program === "faa") {
    document.querySelectorAll(".fmcsa-section").forEach(el => el.remove());
  }

  /* Global Notice */
  const notice = sessionStorage.getItem("ams_notice");
  if (notice) {
    showToast(notice);
    sessionStorage.removeItem("ams_notice");
  }

  updateFAAModuleButtons();
  updateFAACompletionDates();
  updateFMCSAStatus();
  updateFMCSATimer();
  updateFMCSDERButtonState();
  updateFMCSAEmployeeButton();
  updateFMCSASupervisorButton();
  updateFMCSAProgress();
  /* MODULE A COMPLETION DATE */
  const modADate = localStorage.getItem(`fmcsaModuleADate_${email}`);
  if (modADate) {
    const el = document.getElementById("moduleACompletionDate");
    if (el) {
      const date = new Date(parseInt(modADate));
      el.innerHTML = `<span class="status-badge status-completed">✔ Completed</span> ${date.toLocaleDateString("en-US")}`;
    }
  }

  /* MODULE B COMPLETION DATE */
  const modBDate = localStorage.getItem(`fmcsaModuleBDate_${email}`);
  if (modBDate) {
    const el = document.getElementById("moduleBCompletionDate");
    if (el) {
      const date = new Date(parseInt(modBDate));
      el.innerHTML = `<span class="status-badge status-completed">✔ Completed</span> ${date.toLocaleDateString("en-US")}`;
    }
  }

  /* FMCSA EMPLOYEE COMPLETION DATE */
  const empDate = localStorage.getItem(`fmcsaEmployeeDate_${email}`);
  if (empDate) {
    const el = document.getElementById("employeeFmcsaCompletionDate");
    if (el) {
      const date      = new Date(parseInt(empDate));
      const formatted = date.toLocaleDateString("en-US", { timeZone: "America/New_York" });
      el.innerHTML    = `<span class="status-badge status-completed">✔ Completed</span> ${formatted}`;
    }
  }

});

/* =========================
   TOAST
========================= */
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

/* =========================
   FMCSA COMPLETION STATUS
========================= */
function updateFMCSAStatus() {

  const modA = localStorage.getItem(`fmcsaModuleACompleted_${email}`) === "true";
  const modB = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";

  const modABadge = document.getElementById("modABadge");
  const modBBadge = document.getElementById("modBBadge");
  const certBadge = document.getElementById("certBadge");

  if (modABadge) {
    modABadge.textContent = modA ? "✔ Completed" : "⏳ Not Started";
    modABadge.className   = modA ? "status-badge status-completed" : "status-badge status-inprogress";
  }

  if (modBBadge) {
    if (modB) {
      modBBadge.textContent = "✔ Completed";
      modBBadge.className   = "status-badge status-completed";
    } else if (modA) {
      modBBadge.textContent = "⏳ Ready to Start";
      modBBadge.className   = "status-badge status-inprogress";
    } else {
      modBBadge.textContent = "🔒 Locked";
      modBBadge.className   = "status-badge status-locked";
    }
  }

  if (certBadge) {
    certBadge.textContent = (modA && modB) ? "✔ Certificate Available" : "🔒 Locked";
    certBadge.className   = (modA && modB) ? "status-badge status-completed" : "status-badge status-locked";
  }

}

function handleDerFmcsa() {

  const completed = localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";

  if (completed) {
    const certId = localStorage.getItem(`fmcsaDERCertificateId_${email}`);
    if (certId) {
      window.location.href = `fmcsa-certificates.html?id=${certId}`;
    } else {
      showToast("Certificate not found.", "error");
    }
    return;
  }

  if (localStorage.getItem(`paid_der_fmcsa_${email}`) === "true") {
    window.location.href = "fmcsa-der.html";
  } else {
    window.location.href = "payment.html?module=der_fmcsa";
  }

}

function updateFMCSAProgress() {

  const modA = localStorage.getItem(`fmcsaModuleACompleted_${email}`) === "true";
  const modB = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";

  const fill = document.getElementById("fmcsaProgressFill");
  const text = document.getElementById("fmcsaProgressText");

  if (!fill || !text) return;

  let percent = 0;
  if (modA) percent = 50;
  if (modA && modB) percent = 100;

  fill.style.width    = percent + "%";
  text.textContent    = percent + "% Complete";

}

/* =========================
   DER COMPLETION STATUS
========================= */
function updateFMCSDERButtonState() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return;

  const email = user.email;

  const derFmcsaBtn = document.getElementById("derFmcsaBtn");
  if (!derFmcsaBtn) return;

  const derDateEl = document.getElementById("derFmcsaCompletionDate");
  const paid      = localStorage.getItem(`paid_der_fmcsa_${email}`) === "true";
  const completed = localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";
  const derDate   = localStorage.getItem(`fmcsaDERDate_${email}`);

  if (completed) {
    derFmcsaBtn.textContent = "View DER Certificate";
    derFmcsaBtn.onclick = () => {
      const certId = localStorage.getItem(`fmcsaDERCertificateId_${email}`);
      if (certId) {
        window.location.href = `fmcsa-certificates.html?id=${certId}`;
      } else {
        showToast("Certificate not found.", "error");
      }
    };
    if (derDate && derDateEl) {
      derDateEl.textContent =
        "✔ Completed " + new Date(Number(derDate)).toLocaleDateString("en-US");
    }
    return;
  }

  const _fmcsaProf = JSON.parse(localStorage.getItem("companyProfile_fmcsa") || localStorage.getItem("companyProfile") || "{}");
  const _derSeat    = _fmcsaProf?.usedSeats?.der?.[email];
  const hasDERSeat  = _derSeat && !_derSeat.revoked;

  if (paid || hasDERSeat) {
    derFmcsaBtn.textContent = "Start DER Training";
    derFmcsaBtn.onclick = () => { window.location.href = "fmcsa-der.html"; };
    return;
  }

  derFmcsaBtn.textContent = "🔒 Locked — Purchase Required";
  derFmcsaBtn.onclick = () => { window.location.href = "payment.html?module=der_fmcsa"; };

}

function updateFMCSASupervisorButton() {

  const btn = document.getElementById("supervisorTrainingBtn");
  if (!btn) return;

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return;

  const email = user.email;
  const paid  = localStorage.getItem(`paid_fmcsa_${email}`) === "true";
  const modA  = localStorage.getItem(`fmcsaModuleACompleted_${email}`) === "true";
  const modB  = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";

  if (modA && modB) {
    btn.textContent = "🎓 View Certificate";
    btn.onclick = () => {
      const certId =
        localStorage.getItem(`fmcsaModuleBCertificateId_${email}`) ||
        localStorage.getItem(`fmcsaModuleACertificateId_${email}`);
      if (certId) {
        window.location.href = `fmcsa-certificates.html?id=${certId}`;
      } else {
        showToast("Certificate not found.", "error");
      }
    };
    return;
  }

  if (modA && !modB) {
    btn.textContent            = "⚠️ Continue Training (Module B Required)";
    btn.style.backgroundColor  = "#f0ad4e";
    btn.onclick = () => { window.location.href = "fmcsa-drug-alcohol.html"; };
    return;
  }

  const _fmcsaProf2 = JSON.parse(localStorage.getItem("companyProfile_fmcsa") || localStorage.getItem("companyProfile") || "{}");
  const _supSeat     = _fmcsaProf2?.usedSeats?.supervisor?.[email];
  const hasSupSeat   = _supSeat && !_supSeat.revoked;

  if (paid || hasSupSeat) {
    btn.textContent = "Start Training";
    btn.onclick = () => { window.location.href = "fmcsa-supervisor.html"; };
    return;
  }

  btn.textContent = "🔒 Locked — Purchase Required";
  btn.onclick = () => { window.location.href = "payment.html?type=fmcsa"; };

}

/* =========================
   FMCSA EMPLOYEE BUTTON
========================= */
function updateFMCSAEmployeeButton() {

  const btn    = document.getElementById("employeeTrainingBtn");
  const dateEl = document.getElementById("employeeTrainingDate");

  if (!btn) return;

  const user = JSON.parse(localStorage.getItem("amsUser") || "{}");

  const paid         = localStorage.getItem(`paid_employee_fmcsa_${user.email}`) === "true";
  const empCompleted = localStorage.getItem(`fmcsaEmployeeCompleted_${user.email}`) === "true";
  const empDate      = localStorage.getItem(`fmcsaEmployeeDate_${user.email}`);

  if (empCompleted) {
    btn.textContent = "🎓 View Certificate";
    btn.onclick = () => {
      const certId = localStorage.getItem(`fmcsaEmployeeCertificateId_${user.email}`);
      if (certId) {
        window.location.href = `fmcsa-certificates.html?id=${certId}`;
      } else {
        showToast("Certificate not found.", "error");
      }
    };
    if (dateEl && empDate) {
      dateEl.textContent =
        "✔ Completed " + new Date(Number(empDate)).toLocaleDateString("en-US");
    }
    return;
  }

  const _fmcsaProf3 = JSON.parse(localStorage.getItem("companyProfile_fmcsa") || localStorage.getItem("companyProfile") || "{}");
  const _empSeat     = _fmcsaProf3?.usedSeats?.employee?.[user.email];
  const hasEmpSeat   = _empSeat && !_empSeat.revoked;

  if (paid || hasEmpSeat) {
    btn.textContent = "Start Training";
    btn.onclick = () => { window.location.href = "fmcsa-employee-training.html"; };
    return;
  }

  btn.textContent = "🔒 Locked — Purchase Required";
  btn.onclick = () => { window.location.href = "payment.html?module=fmcsa_employee"; };

}
