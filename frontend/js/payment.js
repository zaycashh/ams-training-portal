/* =========================================================
   PAYMENT.JS — AMS Training Portal
   Stripe Checkout integration
========================================================= */

/* -------------------------
   STRIPE PUBLISHABLE KEY
-------------------------- */
const STRIPE_PK = "pk_live_51TRbqQA4HGfN9UFoafdYDGiqXEhQsFTxWTXuzynWVnvGHMJtPucGPLzkxzMbnAktt98QpBbHbVcqxytk1gAIjNaq00WtaP5nFy";

/* -------------------------
   CLOUDFLARE WORKER URL
   (handles secure Checkout session creation)
-------------------------- */
const WORKER_URL = "https://ams-checkout.amstrainingportal.workers.dev";

/* -------------------------
   PRICE IDs MAP
-------------------------- */
const PRICE_IDS = {
  /* Individual single seats */
  "employee":         "price_1TRcIUA4HGfN9UFoN75QElMy",  /* FAA Employee $21 */
  "supervisor":       "price_1TRcHNA4HGfN9UFok8syT6gz",  /* FAA Supervisor $31 */
  "der":              "price_1TRcJaA4HGfN9UFoZ2r0b0xZ",  /* FAA DER $51 */
  "fmcsa_employee":   "price_1TRcIzA4HGfN9UFoLnBaSUxq",  /* FMCSA Employee $21 */
  "fmcsa":            "price_1TRcI2A4HGfN9UFoPGuOLfXB",  /* FMCSA Supervisor $31 */
  "fmcsa-module-a":   "price_1TRcI2A4HGfN9UFoPGuOLfXB",  /* FMCSA Supervisor $31 (alias) */
  "der_fmcsa":        "price_1TRcJzA4HGfN9UFojcUkXTxw",  /* FMCSA DER $51 */
  "fmcsa-der":        "price_1TRcJzA4HGfN9UFojcUkXTxw",  /* FMCSA DER $51 (alias) */

  /* Company bundles */
  "employee_5pack":       "price_1TRcN3A4HGfN9UFoebVZv4z2",  /* FAA Employee 5-pack $95 */
  "supervisor_3pack":     "price_1TRcM2A4HGfN9UFoE273FN1V",  /* FAA Supervisor 3-pack $83 */
  "fmcsa_employee_5pack": "price_1TRcOXA4HGfN9UFojg2sqrza",  /* FMCSA Employee 5-pack $95 */
  "fmcsa_supervisor_3pack":"price_1TRcPbA4HGfN9UFoIKTasyKQ", /* FMCSA Supervisor 3-pack $83 */
};

/* -------------------------
   MODULE CONFIG (display)
-------------------------- */
const MODULE_CONFIG = {
  "fmcsa-der":         { title: "FMCSA DER Training",             desc: "Designated Employer Representative drug & alcohol regulations.",  program: "FMCSA", role: "DER",       price: "$51" },
  "der_fmcsa":         { title: "FMCSA DER Training",             desc: "Designated Employer Representative drug & alcohol regulations.",  program: "FMCSA", role: "DER",       price: "$51" },
  "fmcsa-module-a":    { title: "FMCSA Supervisor Training",      desc: "Supervisor drug & alcohol awareness training.",                   program: "FMCSA", role: "Supervisor", price: "$31" },
  "fmcsa":             { title: "FMCSA Supervisor Training",      desc: "Supervisor drug & alcohol awareness training.",                   program: "FMCSA", role: "Supervisor", price: "$31" },
  "fmcsa-drug-alcohol":{ title: "FMCSA Drug & Alcohol Training",  desc: "Complete FMCSA drug and alcohol compliance training.",           program: "FMCSA", role: "Employee",   price: "$21" },
  "fmcsa_employee":    { title: "FMCSA Employee Training",        desc: "Employee drug & alcohol regulations training.",                  program: "FMCSA", role: "Employee",   price: "$21" },
  "der":               { title: "FAA DER Training",               desc: "Designated Employer Representative training for FAA programs.",   program: "FAA",   role: "DER",       price: "$51" },
  "supervisor":        { title: "FAA Supervisor Training",        desc: "Supervisor drug & alcohol awareness for FAA programs.",           program: "FAA",   role: "Supervisor", price: "$31" },
  "employee":          { title: "FAA Employee Training",          desc: "Employee drug & alcohol compliance training for FAA programs.",   program: "FAA",   role: "Employee",   price: "$21" },
};

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
   MAIN
-------------------------- */
document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const module = params.get("module");
  const type   = params.get("type");
  const seats  = parseInt(params.get("seats") || "1", 10);
  const key    = module || type;
  const config = MODULE_CONFIG[key];

  /* Employee lock */
  const userCheck = JSON.parse(localStorage.getItem("amsUser") || "null");
  const COMPANY_ONLY = ["fmcsa-module-a", "fmcsa-drug-alcohol", "fmcsa-der", "supervisor", "fmcsa", "der_fmcsa"];
  if (userCheck && userCheck.role === "employee" && COMPANY_ONLY.includes(key)) {
    showToast("Employees cannot purchase this training.", "error");
    setTimeout(() => window.location.href = "dashboard.html", 1800);
    return;
  }

  /* Populate order summary */
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

  /* Pay button */
  const payBtn = document.getElementById("payNowBtn");
  if (!payBtn) return;

  payBtn.addEventListener("click", async () => {
    if (payBtn.disabled) return;

    const user = JSON.parse(localStorage.getItem("amsUser") || "null");
    if (!user) {
      showToast("Please log in to continue.", "error");
      return;
    }

    /* Determine price ID */
    const priceId = PRICE_IDS[key];
    if (!priceId) {
      showToast("Unknown purchase type. Please try again.", "error");
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = "Redirecting to checkout...";

    /* Build success URL — passes module + email so success page can unlock */
    const successUrl = `${window.location.origin}/frontend/pages/payment-success.html?module=${key}&email=${encodeURIComponent(user.email)}&seats=${seats}`;
    const cancelUrl  = `${window.location.origin}/frontend/pages/payment.html?${params.toString()}`;

    try {
      /* Call Cloudflare Worker to create Stripe Checkout session */
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          quantity: seats,
          customerEmail: user.email,
          successUrl,
          cancelUrl
        })
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "No checkout URL returned");
      }

    } catch (err) {
      console.error("Checkout error:", err);
      showToast("Payment error. Please try again.", "error");
      payBtn.disabled = false;
      payBtn.textContent = "Complete Purchase";
    }
  });

});
