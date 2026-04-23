const user = JSON.parse(localStorage.getItem("amsUser") || "null");
const email = user?.email;

const company =
  JSON.parse(localStorage.getItem("companyProfile") || "{}");

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
    completedKey: (email) => `employeeTrainingCompleted_${email}`,
    start: "employee-training.html"
  },

  supervisor: {
    btn: "supervisorBtn",
    paidKey: "paid_supervisor",
    completedKey: (email) => `supervisorTrainingCompleted_${email}`,
    start: "supervisor-training.html"
  },

  der: {
    btn: "derBtn",
    paidKey: "paid_der",
    completedKey: (email) => `derTrainingCompleted_${email}`,
    start: "der-training.html"
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

    if (paidFAA) {
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
   BADGE HELPERS
========================= */
function setAssignedBadge(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = "🎟 Assigned";
  el.style.color = "#0a7d2c";
  el.style.fontWeight = "600";
}

function clearBadge(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = "";
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

/* =========================
   EMPLOYEE SEAT STATUS
========================= */
function getEmployeeSeatStatus() {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user || user.role !== "employee") return null;

  if (localStorage.getItem("paid_employee") === "true") {
    return { type: "paid", label: "✔ Individually Purchased" };
  }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");
  if (!company) {
    return { type: "locked", label: "🔒 No Seats Available" };
  }

  if (
    company.usedSeats?.employee?.[user.email] ||
    company.usedSeats?.supervisor?.[user.email] ||
    company.usedSeats?.der?.[user.email]
  ) {
    return { type: "assigned", label: "🎟 Seat Assigned" };
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used  = Object.keys(company?.usedSeats || {}).length;
  const remaining = total - used;

  if (remaining > 0) {
    return {
      type: "available",
      label: `${remaining} Seat${remaining > 1 ? "s" : ""} Remaining`
    };
  }

  return { type: "locked", label: "🔒 No Seats Available" };
}

function handleEmployeeClick() {
  const user    = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user) {
    showToast("Please log in.", "error");
    return;
  }

  if (user.role === "individual" && localStorage.getItem("paid_employee") === "true") {
    startFAA("employee");
    return;
  }

  if (user.role === "individual") {
    window.location.href = "../pages/payment.html?module=employee";
    return;
  }

  if (user.role === "employee" && user.type === "company") {

    if (!company) {
      showToast("Company profile not found.", "error");
      return;
    }

    if (
      company.usedSeats?.employee?.[user.email] ||
      company.usedSeats?.supervisor?.[user.email] ||
      company.usedSeats?.der?.[user.email]
    ) {
      startFAA("employee");
      return;
    }

    showToast(
      "You do not have a company seat assigned. Please contact your administrator.",
      "warning"
    );
    return;
  }

  const total     = company?.seats?.employee?.total ?? 0;
  const used      = Object.keys(company?.usedSeats || {}).length;
  const remaining = total - used;

  if (remaining <= 0) {
    showToast("No seats available.", "error");
    return;
  }

  showToast("You must be assigned a company seat by your administrator.", "warning");
  return;

  // 🔴 FALLBACK BLOCK
  showToast(
    "This training is available through company enrollment only.",
    "warning"
  );
}

/* =========================
   START FAA COURSES
========================= */
function startFAA(course) {

  const user    = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (course !== "employee" && !hasAccess(course)) {
    showToast(`${course.toUpperCase()} Training is locked. Please purchase this course to continue.`, "warning");
    return;
  }

  if (
    course === "employee" &&
    !hasAccess("employee") &&
    !company?.usedSeats?.[user?.email]
  ) {
    showToast("Employee Training is locked. Purchase required or no company seats available.", "warning");
    return;
  }

  window.location.href = `${course}-training.html`;
}

/* =========================
   CONSUME EMPLOYEE SEAT
========================= */
function consumeEmployeeSeatAndStart(startUrl) {
  const user    = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user || !company) {
    showToast("Access error. Please refresh.", "error");
    return;
  }

  if (!company.usedSeats) company.usedSeats = {};

  if (company.usedSeats[user.email]) {
    window.location.href = startUrl;
    return;
  }

  const total     = company?.seats?.employee?.total ?? 0;
  const used      = Object.keys(company?.usedSeats || {}).length;
  const remaining = total - used;

  if (remaining <= 0) {
    showToast("No seats remaining.", "warning");
    return;
  }

  company.usedSeats[user.email] = true;
  localStorage.setItem("companyProfile", JSON.stringify(company));
  window.location.href = startUrl;
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
   GET USER ACCESS
========================= */
function getUserAccess(email) {

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) return { employee: false, supervisor: false, der: false };

  function checkSeat(seat) {
    if (seat === true) return true;
    if (typeof seat === "object" && seat !== null && seat.revoked !== true) return true;
    return false;
  }

  return {
    employee:   checkSeat(company.usedSeats?.employee?.[email]),
    supervisor: checkSeat(company.usedSeats?.supervisor?.[email]),
    der:        checkSeat(company.usedSeats?.der?.[email])
  };
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const company      = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const storedProgram = localStorage.getItem("amsProgram");
  const program      = (company.program || storedProgram || "").toLowerCase();

  console.log("PROGRAM:", program);

  /* PROGRAM LOCK */
  if (program === "fmcsa") {
    document.querySelectorAll(".faa-section").forEach(el => el.remove());
  }
  if (program === "faa") {
    document.querySelectorAll(".fmcsa-section").forEach(el => el.remove());
  }

  /* EMPLOYEE MODULE FILTER */
  if (user?.role === "employee") {
    const access = getUserAccess(user.email);
    console.log("Employee Access:", access);
  }

  /* Global Notice */
  const notice = sessionStorage.getItem("ams_notice");
  if (notice) {
    showToast(notice);
    sessionStorage.removeItem("ams_notice");
  }

  /* Employee Welcome */
  if (user?.role === "employee") {
    const welcome = document.getElementById("employeeWelcome");
    if (welcome) welcome.classList.add("show");
  }

  const status = getEmployeeSeatStatus();
  if (status) {
    const el = document.getElementById("employeeSeatStatus");
    if (el) {
      el.innerHTML = `<span class="seat-badge ${status.type}">${status.label}</span>`;
    }
  }

  /* Show Admin Panel */
  const currentUser = JSON.parse(localStorage.getItem("amsUser") || "{}");
  if (currentUser.role === "company_admin" || currentUser.role === "owner") {
    const panel = document.getElementById("adminPanel");
    if (panel) panel.style.display = "block";
  }

  updateFAAModuleButtons();
  updateFAACompletionDates();
  updateFMCSAStatus();
  updateFMCSATimer();
  updateFMCSDERButtonState();
  updateFMCSAEmployeeButton();
  updateFMCSASupervisorButton();
  updateFMCSAProgress();
  renderSeatList();

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
   GENERIC SEAT CHECK
========================= */
function hasCompanySeat(type) {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  if (!user) return false;

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const seat    = company?.usedSeats?.[type]?.[user.email];

  if (seat === true) return true;
  if (typeof seat === "object" && seat !== null && seat.revoked !== true) return true;
  return false;

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
  const hasSeat   = hasCompanySeat("der");
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

  if (user.role === "employee") {
    if (hasSeat) {
      setAssignedBadge("derSeatBadge");
      derFmcsaBtn.textContent    = "Start DER Training";
      derFmcsaBtn.style.opacity  = "1";
      derFmcsaBtn.style.cursor   = "pointer";
      derFmcsaBtn.onclick = () => { window.location.href = "fmcsa-der.html"; };
      return;
    }
    clearBadge("derSeatBadge");
    derFmcsaBtn.textContent    = "🔒 Seat Required";
    derFmcsaBtn.style.opacity  = "0.7";
    derFmcsaBtn.style.cursor   = "not-allowed";
    derFmcsaBtn.disabled       = true;
    derFmcsaBtn.onclick = () => { showToast("No seat assigned. Contact your admin.", "warning"); };
    return;
  }

  if (paid) {
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

  const email   = user.email;
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const hasSeat = !!company?.usedSeats?.supervisor?.[email];
  const paid    = localStorage.getItem(`paid_fmcsa_${email}`) === "true";
  const modA    = localStorage.getItem(`fmcsaModuleACompleted_${email}`) === "true";
  const modB    = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";

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

  btn.textContent = "Start Module A – Reasonable Suspicion";
  btn.onclick = () => { window.location.href = "fmcsa-module-a.html"; };

  if (user.role === "employee") {
    if (hasSeat) {
      setAssignedBadge("supervisorSeatBadge");
      btn.style.opacity = "1";
      if (modA && !modB) {
        btn.textContent = "Continue Training";
        btn.onclick = () => { window.location.href = "fmcsa-drug-alcohol.html"; };
        return;
      }
      if (!modA) {
        btn.textContent = "Start Training";
        btn.onclick = () => { window.location.href = "fmcsa-module-a.html"; };
        return;
      }
    }
    clearBadge("supervisorSeatBadge");
    btn.textContent    = "🔒 Seat Required";
    btn.style.opacity  = "0.7";
    btn.onclick = () => { showToast("No seat assigned. Contact your admin.", "warning"); };
    return;
  }

  if (paid) {
    btn.textContent = "Start Training";
    btn.onclick = () => { window.location.href = "fmcsa-module-a.html"; };
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

  const user    = JSON.parse(localStorage.getItem("amsUser") || "{}");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  const paid         = localStorage.getItem(`paid_employee_fmcsa_${user.email}`) === "true";
  const hasSeat      = !!company?.usedSeats?.employee?.[user.email];
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

  if (user.role === "employee") {
    if (hasSeat) {
      setAssignedBadge("employeeSeatBadge");
      btn.textContent       = "Start Training";
      btn.style.opacity     = "1";
      btn.style.cursor      = "pointer";
      btn.onclick = () => {
        const route = getEmployeeTrainingRoute();
        if (!route) {
          showToast("Training program not assigned.", "error");
          return;
        }
        window.location.href = route;
      };
      return;
    }
    clearBadge("employeeSeatBadge");
    btn.textContent   = "🔒 Seat Required";
    btn.style.opacity = "0.7";
    btn.style.cursor  = "not-allowed";
    btn.onclick = () => { showToast("No seat assigned. Contact your admin.", "warning"); };
    return;
  }

  if (paid) {
    btn.textContent = "Start Training";
    btn.onclick = () => { window.location.href = "fmcsa-employee-training.html"; };
    return;
  }

  btn.textContent = "🔒 Locked — Purchase Required";
  btn.onclick = () => { window.location.href = "payment.html?module=fmcsa_employee"; };

}

/* =========================
   ADMIN SEAT CONTROL
========================= */
function assignSeat(type) {

  const input = document.getElementById("seatEmailInput");
  if (!input) return;

  const email = input.value.trim().toLowerCase();
  if (!email) { showToast("Enter an email address.", "error"); return; }

  let company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  company.usedSeats = {
    employee:   company.usedSeats?.employee   || {},
    supervisor: company.usedSeats?.supervisor || {},
    der:        company.usedSeats?.der        || {}
  };

  if (company.usedSeats[type][email]) {
    showToast("This user is already assigned.", "warning");
    return;
  }

  company.usedSeats[type][email] = true;
  localStorage.setItem("companyProfile", JSON.stringify(company));

  showToast(`${type.toUpperCase()} seat assigned to ${email}.`, "info");
  renderSeatList();
  if (typeof updateSeatCounts === "function") updateSeatCounts();
  input.value = "";

}

/* =========================
   REMOVE SEAT
========================= */
function removeSeat() {

  const input = document.getElementById("seatEmailInput");
  if (!input) return;

  const email = input.value.trim().toLowerCase();
  if (!email) { showToast("Enter an email address.", "error"); return; }

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");

  if (!company.usedSeats) { showToast("No seats exist.", "warning"); return; }

  let removed = false;
  ["employee", "supervisor", "der"].forEach(type => {
    if (company.usedSeats[type]?.[email]) {
      delete company.usedSeats[type][email];
      removed = true;
    }
  });

  if (!removed) { showToast("No seat found for this user.", "warning"); return; }

  localStorage.setItem("companyProfile", JSON.stringify(company));

  showToast("Seat removed.", "info");
  renderSeatList();
  if (typeof updateSeatCounts === "function") updateSeatCounts();
  input.value = "";

}

/* =========================
   RENDER SEAT LIST
========================= */
function renderSeatList() {

  const container = document.getElementById("seatList");
  if (!container) return;

  const company  = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  const allSeats = company.usedSeats || {};
  let rows = [];

  ["employee", "supervisor", "der"].forEach(type => {
    const users = allSeats[type] || {};
    Object.keys(users).forEach(email => {
      rows.push(`
        <div style="padding:8px;border-bottom:1px solid var(--color-divider);">
          🎟 ${email} — <strong>${type.toUpperCase()}</strong>
        </div>
      `);
    });
  });

  container.innerHTML = rows.length
    ? rows.join("")
    : "<p style='color:var(--color-text-muted);margin-top:8px;'>No assigned seats</p>";

}

/* =========================
   EMPLOYEE TRAINING ROUTE
========================= */
function getEmployeeTrainingRoute() {

  const company = JSON.parse(localStorage.getItem("companyProfile") || "{}");
  if (!company.program) return null;

  const program = company.program.toUpperCase();
  if (program === "FMCSA") return "fmcsa-employee-training.html";
  if (program === "FAA")   return "employee-training.html";
  return null;

}
