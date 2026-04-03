const user = JSON.parse(localStorage.getItem("amsUser") || "null");
const email = user?.email;

const program = localStorage.getItem("amsProgram") || "faa";
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
  window.location.href = "certificates.html#"+module;
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

  /* DER */
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

  /* SUPERVISOR */
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

  /* EMPLOYEE */
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

  if (company.usedSeats?.[user.email]) {
    return { type: "assigned", label: "🎟 Seat Assigned" };
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = Object.keys(company?.usedSeats || {}).length;
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
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user) {
    showToast("Please log in.", "error");
    return;
  }

  // 🔵 INDIVIDUAL PURCHASE FLOW
  if (
    user.role === "individual" &&
    localStorage.getItem("paid_employee") === "true"
  ) {
    startFAA("employee");
    return;
  }

  // 🔵 INDIVIDUAL NOT PAID
  if (user.role === "individual") {
    window.location.href = "../pages/payment.html?module=employee";
    return;
  }

  // 🔵 COMPANY EMPLOYEE FLOW (Admin-Controlled Seats)
if (user.role === "employee" && user.type === "company") {

  if (!company) {
    showToast("Company profile not found.", "error");
    return;
  }

  // Seat already assigned
  if (company.usedSeats?.[user.email]) {
    startFAA("employee");
    return;
  }

  // 🔴 No seat assigned — show admin warning
  showToast(
    "You do not have a company seat assigned. Please contact your administrator.",
    "warning"
  );

  return;
}
   
const total = company?.seats?.employee?.total ?? 0;
const used = Object.keys(company?.usedSeats || {}).length;
const remaining = total - used;

if (remaining <= 0) {
  showToast("No seats available.", "error");
  return;
}

// ❌ Do NOT auto-assign seat anymore
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
   
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (course !== "employee" && !hasAccess(course)) {
    alert(`${course.toUpperCase()} Training is locked.\n\nPlease purchase this course to continue.`);
    return;
  }

  if (
    course === "employee" &&
    !hasAccess("employee") &&
    !company?.usedSeats?.[user?.email]
  ) {
    alert("Employee Training is locked.\n\nPurchase required or no company seats available.");
    return;
  }

  window.location.href = `${course}-training.html`;
}

/* =========================
   CONSUME EMPLOYEE SEAT
========================= */
function consumeEmployeeSeatAndStart(startUrl) {
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!user || !company) {
    showToast("Access error. Please refresh.", "error");
    return;
  }

  if (!company.usedSeats) {
    company.usedSeats = {};
  }

  if (company.usedSeats[user.email]) {
    window.location.href = startUrl;
    return;
  }

  const total = company?.seats?.employee?.total ?? 0;
  const used = Object.keys(company?.usedSeats || {}).length;
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

  const paid =
    localStorage.getItem(`paid_fmcsa_${user.email}`) === "true";

  if (!paid) return; // ✅ THIS IS WHAT YOU WERE MISSING

  const purchaseDate =
    localStorage.getItem(`fmcsa_start_date_${user.email}`);
  if (!purchaseDate) return;

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const expiration = parseInt(purchaseDate) + THIRTY_DAYS;
  const remaining = expiration - now;

  const fmcsaCard = document.getElementById("fmcsaCard");
  if (!fmcsaCard) return;

  if (remaining <= 0) {
    // Expired
    localStorage.removeItem(`paid_fmcsa_${user.email}`);
    localStorage.removeItem(`fmcsa_start_date_${user.email}`);

    const btn = fmcsaCard.querySelector("button");
    if (btn) {
      btn.textContent = "Expired — Purchase Required";
      btn.onclick = () =>
        (window.location.href = "../pages/payment.html?type=fmcsa");
    }

    return;
  }

  const daysLeft = Math.ceil(remaining / (1000 * 60 * 60 * 24));

  const info = fmcsaCard.querySelector(".fmcsa-timer");
  if (info) {
    info.textContent = `Access expires in ${daysLeft} day${
      daysLeft > 1 ? "s" : ""
    }`;
  }
}
/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  
  const user = JSON.parse(localStorage.getItem("amsUser") || "null");
   
/* =========================
   PROGRAM LOCK (FAA vs FMCSA)
========================= */

if (program === "fmcsa") {

  document.querySelectorAll(".faa-section")
    .forEach(el => el.style.display = "none");

  document.querySelectorAll(".fmcsa-section")
    .forEach(el => el.style.display = "block");

}

if (program === "faa") {

  document.querySelectorAll(".fmcsa-section")
    .forEach(el => el.style.display = "none");

  document.querySelectorAll(".faa-section")
    .forEach(el => el.style.display = "block");

}

/* =========================
   EMPLOYEE LOCK (CORRECT)
========================= */

const isEmployee =
user?.role === "employee" && user?.type === "company";

if (isEmployee) {

  // Hide only supervisor + DER (NOT employee training)
  document.getElementById("fmcsaSupervisorSection")?.style.setProperty("display","none");
  document.getElementById("fmcsaDerSection")?.style.setProperty("display","none");

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
    if (welcome) welcome.style.display = "block";
  }

  const status = getEmployeeSeatStatus();
  if (status) {
    const el = document.getElementById("employeeSeatStatus");
    if (el) {
      el.innerHTML = `<span class="seat-badge ${status.type}">${status.label}</span>`;
    }
  }

 updateFAAModuleButtons();
 updateFAACompletionDates();  
 updateFMCSATimer();
 updateFMCSAModuleButtons();
 updateFMCSDERButtonState();
 updateFMCSAEmployeeButton();  
 updateFMCSAStatus();  
 updateFMCSAProgress();
   
/* =========================
MODULE A COMPLETION DATE
========================= */

const modADate = localStorage.getItem(`fmcsaModuleADate_${email}`);

if (modADate) {

  const el = document.getElementById("moduleACompletionDate");

  if (el) {

    const date = new Date(parseInt(modADate));

    el.innerHTML = `
  <span class="status-badge status-completed">✔ Completed</span>
  ${date.toLocaleDateString("en-US")}
`;

  }

}
   /* =========================
MODULE B COMPLETION DATE
========================= */

const modBDate = localStorage.getItem(`fmcsaModuleBDate_${email}`);

if (modBDate) {

  const el = document.getElementById("moduleBCompletionDate");

  if (el) {

    const date = new Date(parseInt(modBDate));

    el.innerHTML = `
  <span class="status-badge status-completed">✔ Completed</span>
  ${date.toLocaleDateString("en-US")}
`;

  }

}

const empDate = localStorage.getItem(`fmcsaEmployeeDate_${email}`);

if (empDate) {

  const el = document.getElementById("employeeFmcsaCompletionDate")

  if (el) {

    const date = new Date(parseInt(empDate));

    const formatted =
      date.toLocaleDateString("en-US",{ timeZone:"America/New_York" });

    el.innerHTML =
      `<span class="status-badge status-completed">✔ Completed</span> ${formatted}`;

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

    if (modA) {
      modABadge.textContent = "✔ Completed";
      modABadge.className = "status-badge status-completed";
    } else {
      modABadge.textContent = "⏳ Not Started";
      modABadge.className = "status-badge status-inprogress";
    }

  }

  if (modBBadge) {

    if (modB) {
      modBBadge.textContent = "✔ Completed";
      modBBadge.className = "status-badge status-completed";
    } else if (modA) {
      modBBadge.textContent = "⏳ Ready to Start";
      modBBadge.className = "status-badge status-inprogress";
    } else {
      modBBadge.textContent = "🔒 Locked";
      modBBadge.className = "status-badge status-locked";
    }

  }

  if (certBadge) {

    if (modA && modB) {
      certBadge.textContent = "✔ Certificate Available";
      certBadge.className = "status-badge status-completed";
    } else {
      certBadge.textContent = "🔒 Locked";
      certBadge.className = "status-badge status-locked";
    }

  }

}

function handleDerFmcsa() {

  const completed =
  localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";

  if (completed) {
    window.location.href = "fmcsa-certificates.html?type=der";
    return;
  }

  if (
  localStorage.getItem(`paid_der_fmcsa_${email}`) === "true"
) {
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

  fill.style.width = percent + "%";
  text.textContent = percent + "% Complete";

}
/* =========================
   DER COMPLETION STATUS
========================= */
function updateFMCSDERButtonState() {

  const derFmcsaBtn = document.getElementById("derFmcsaBtn");
  if (!derFmcsaBtn) return;

  const derDateEl = document.getElementById("derFmcsaCompletionDate");

  const paid =
    localStorage.getItem(`paid_der_fmcsa_${email}`) === "true";

  const completed =
    localStorage.getItem(`fmcsaDERCompleted_${email}`) === "true";

  const derDate =
    localStorage.getItem(`fmcsaDERDate_${email}`);

  /* =========================
     COMPLETED
  ========================= */
  if (completed) {

    derFmcsaBtn.textContent = "View DER Certificate";

    derFmcsaBtn.onclick = () => {
      window.location.href = "fmcsa-certificates.html?type=der";
    };

    /* ✅ SHOW COMPLETION DATE */
    if (derDate && derDateEl) {
      derDateEl.textContent =
        "✔ Completed " +
        new Date(Number(derDate)).toLocaleDateString("en-US");
    }

    return;
  }

  /* =========================
     PURCHASED
  ========================= */
  if (paid) {

    derFmcsaBtn.textContent = "Start DER Training";

    derFmcsaBtn.onclick = () => {
      window.location.href = "fmcsa-der.html";
    };

    return;
  }

  /* =========================
     LOCKED
  ========================= */
  derFmcsaBtn.textContent = "🔒 Locked — Purchase Required";

  derFmcsaBtn.onclick = () => {
    window.location.href = "payment.html?module=fmcsa-der&type=der_fmcsa";
  };

}
/* =========================
   FMCSA MODULE UNLOCK SYSTEM
========================= */

function updateFMCSAModuleButtons() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "{}");
  const email = user.email;

  const paid =
  localStorage.getItem(`paid_fmcsa_supervisor_${email}`) === "true";

  const modA = localStorage.getItem(`fmcsaModuleACompleted_${email}`) === "true";
  const modB = localStorage.getItem(`fmcsaModuleBCompleted_${email}`) === "true";

  const modABtn = document.getElementById("fmcsaModABtn");
  const modBBtn = document.getElementById("fmcsaModBBtn");
  const certBtn = document.getElementById("fmcsaCertBtn");

  if (!modABtn || !modBBtn || !certBtn) return;

  /* =========================
     NOT PURCHASED
  ========================= */
  if (!paid) {

    modABtn.textContent = "Locked — Purchase Required";
    modABtn.onclick = () => {
      window.location.href = "payment.html?type=fmcsa";
    };

    modBBtn.disabled = true;
    modBBtn.textContent = "Locked — Purchase Required";

    certBtn.classList.add("hidden");

    return;
  }

  /* =========================
     MODULE A NOT DONE
  ========================= */
  if (!modA) {

    modABtn.textContent = "Start Module A";
    modABtn.disabled = false;
    modABtn.onclick = () => window.location.href = "fmcsa-module-a.html";

    modBBtn.textContent = "Locked — Complete Module A";
    modBBtn.disabled = true;

    certBtn.classList.add("hidden");

    return;
  }

  /* =========================
     MODULE B NOT DONE
  ========================= */
  if (!modB) {

    modABtn.textContent = "✔ Module A Completed";
    modABtn.disabled = true;

    modBBtn.textContent = "Start Module B";
    modBBtn.disabled = false;
    modBBtn.onclick = () => window.location.href = "fmcsa-drug-alcohol.html";

    certBtn.classList.add("hidden");

    return;
  }

  /* =========================
     BOTH COMPLETE
  ========================= */
  if (modA && modB) {

  modABtn.textContent = "✔ Module A Completed";
  modABtn.disabled = true;

  modBBtn.textContent = "✔ Module B Completed";
  modBBtn.disabled = true;

  certBtn.classList.remove("hidden");

  certBtn.textContent = "View Certificate";
  certBtn.onclick = () => {
    window.location.href = "fmcsa-certificates.html?type=supervisor";
  };

}
   
}

/* =========================
   FMCSA EMPLOYEE AWARENESS FIXED
========================= */

function updateFMCSAEmployeeButton() {

  const btn = document.getElementById("employeeTrainingBtn");
  const dateEl = document.getElementById("employeeTrainingDate"); // ✅ ADD THIS

  if (!btn) return;

  const paid =
  localStorage.getItem(`paid_employee_fmcsa_${email}`) === "true";

  const empCompleted =
  localStorage.getItem(`fmcsaEmployeeCompleted_${email}`) === "true";

  const empDate =
  localStorage.getItem("fmcsaEmployeeDate");

  /* =========================
     COMPLETED
  ========================= */

  if (empCompleted) {

    btn.textContent = "🎓 View Certificate";

    btn.onclick = () => {
      window.location.href = "fmcsa-certificates.html?type=employee";
    };

    // ✅ SHOW COMPLETION DATE
    if (dateEl && empDate) {
      dateEl.textContent =
        "✔ Completed " + new Date(Number(empDate)).toLocaleDateString("en-US");
    }

    return;
  }

  /* =========================
     NOT PURCHASED
  ========================= */

  if (!paid) {

    btn.textContent = "🔒 Locked — Purchase Required";

    btn.onclick = () => {
      window.location.href = "payment.html?module=fmcsa_employee";
    };

    return;
  }

  /* =========================
     PURCHASED BUT NOT DONE
  ========================= */

  btn.textContent = "Start Training";

  btn.onclick = () => {
    window.location.href = "fmcsa-employee-training.html";
  };

}
