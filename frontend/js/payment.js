/* =========================================================
   PAYMENT.JS — AMS Training Portal
   Populates order summary from URL params + handles purchase
========================================================= */

/* -------------------------
   TOAST HELPER
-------------------------- */
function showToast(msg, type = "info", duration = 3500) {
  document.querySelectorAll(".ams-toast").forEach(t => t.remove());
  const toast = document.createElement("div");
  toast.className = `ams-toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* -------------------------
   MODULE CONFIG
   Add prices + labels here — swap amounts for real Stripe prices later
-------------------------- */
const MODULE_CONFIG = {
  "fmcsa-der":        { title: "FMCSA DER Training",              desc: "Designated Employer Representative drug & alcohol regulations.",  program: "FMCSA", role: "DER",        price: "$51" },
  "der_fmcsa":        { title: "FMCSA DER Training",              desc: "Designated Employer Representative drug & alcohol regulations.",  program: "FMCSA", role: "DER",        price: "$51" },
  "fmcsa-module-a":   { title: "FMCSA Supervisor Bundle",         desc: "Supervisor drug & alcohol awareness training bundle.",            program: "FMCSA", role: "Supervisor",  price: "$31" },
  "fmcsa":            { title: "FMCSA Supervisor Bundle",         desc: "Supervisor drug & alcohol awareness training bundle.",            program: "FMCSA", role: "Supervisor",  price: "$31" },
  "fmcsa-drug-alcohol":{ title: "FMCSA Drug & Alcohol Training",  desc: "Complete FMCSA drug and alcohol compliance training.",           program: "FMCSA", role: "Employee",   price: "$21" },
  "fmcsa_employee":   { title: "FMCSA Employee Training",         desc: "Employee drug & alcohol regulations training.",                  program: "FMCSA", role: "Employee",   price: "$21" },
  "der":              { title: "FAA DER Training",                desc: "Designated Employer Representative training for FAA programs.",   program: "FAA",   role: "DER",        price: "$51" },
  "supervisor":       { title: "FAA Supervisor Training",         desc: "Supervisor drug & alcohol awareness for FAA programs.",          program: "FAA",   role: "Supervisor",  price: "$31" },
  "employee":         { title: "FAA Employee Training",           desc: "Employee drug & alcohol compliance training for FAA programs.",  program: "FAA",   role: "Employee",   price: "$21" },
};

/* -------------------------
   POPULATE ORDER SUMMARY
-------------------------- */
document.addEventListener("DOMContentLoaded", () => {

  const params  = new URLSearchParams(window.location.search);
  const module  = params.get("module");
  const type    = params.get("type");
  const key     = module || type;
  const config  = MODULE_CONFIG[key];

  /* Employee lock — employees cannot buy company-only modules */
  const userCheck = JSON.parse(localStorage.getItem("amsUser") || "null");
  const COMPANY_ONLY = ["fmcsa-module-a", "fmcsa-drug-alcohol", "fmcsa-der", "supervisor", "fmcsa", "der_fmcsa"];
  if (userCheck && userCheck.role === "employee" && COMPANY_ONLY.includes(key)) {
    showToast("Employees cannot purchase this training.", "error");
    setTimeout(() => window.location.href = "dashboard.html", 1800);
    return;
  }

  /* Populate summary */
  if (config) {
    document.getElementById("orderTitle").textContent   = config.title;
    document.getElementById("orderDesc").textContent    = config.desc;
    document.getElementById("orderProgram").textContent = config.program;
    document.getElementById("orderRole").textContent    = config.role;
    document.getElementById("orderPrice").textContent   = config.price;
  } else {
    document.getElementById("orderTitle").textContent = "Training Module";
    document.getElementById("orderDesc").textContent  = "Complete your training purchase below.";
  }

  /* -------------------------
     PAY BUTTON
  -------------------------- */
  const payBtn = document.getElementById("payNowBtn");
  if (!payBtn) return;

  /* Helper — go back to the right dashboard after purchase */
  function goAfterPurchase() {
    const u = JSON.parse(localStorage.getItem("amsUser") || "null");
    const isAdmin = u && (u.role === "company_admin" || u.role === "owner" || u.role === "admin");
    window.location.href = isAdmin ? "company-dashboard.html" : "dashboard.html";
  }

  payBtn.addEventListener("click", () => {
    if (payBtn.disabled) return;
    payBtn.disabled = true;

    const user = JSON.parse(localStorage.getItem("amsUser") || "null");
    if (!user) {
      showToast("User not found. Please log in again.", "error");
      payBtn.disabled = false;
      return;
    }

    const email = user.email;

    /* FMCSA DER */
    if (module === "fmcsa-der" || type === "der_fmcsa") {
      localStorage.setItem(`paid_der_fmcsa_${email}`, "true");
      localStorage.setItem(`paid_der_fmcsa_date_${email}`, Date.now());
      showToast("Purchase successful! Redirecting...", "success");
      setTimeout(() => goAfterPurchase(), 1500);
      return;
    }

    /* FMCSA Supervisor Bundle */
    if (module === "fmcsa-module-a" || type === "fmcsa") {
      localStorage.setItem(`paid_fmcsa_${email}`, "true");
      localStorage.setItem(`fmcsa_start_date_${email}`, Date.now());
      showToast("Purchase successful! Redirecting...", "success");
      setTimeout(() => goAfterPurchase(), 1500);
      return;
    }

    /* FAA DER */
    if (module === "der") {
      localStorage.setItem(`paid_der_${email}`, "true");
      showToast("Purchase successful! Redirecting...", "success");
      setTimeout(() => goAfterPurchase(), 1500);
      return;
    }

    /* FAA Supervisor */
    if (module === "supervisor") {
      localStorage.setItem(`paid_supervisor_${email}`, "true");
      showToast("Purchase successful! Redirecting...", "success");
      setTimeout(() => goAfterPurchase(), 1500);
      return;
    }

    /* FAA Employee */
    if (module === "employee") {
      localStorage.setItem(`paid_employee_${email}`, "true");
      showToast("Purchase successful! Redirecting...", "success");
      setTimeout(() => goAfterPurchase(), 1500);
      return;
    }

    /* FMCSA Employee */
    if (module === "fmcsa_employee") {
      localStorage.setItem(`paid_employee_fmcsa_${email}`, "true");
      localStorage.setItem(`paid_employee_fmcsa_date_${email}`, Date.now());
      showToast("Purchase successful! Redirecting...", "success");
      setTimeout(() => goAfterPurchase(), 1500);
      return;
    }

    /* Unknown */
    showToast("Unknown purchase type. Please try again.", "error");
    payBtn.disabled = false;
  });

});
