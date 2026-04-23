/* =========================================================
   FORGOT PASSWORD — AMS Training Portal
   alert() replaced with showMsg() inline
========================================================= */

function showMsg(msg, type) {
  const el = document.getElementById("formMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = "form-msg " + (type || "error");
}

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    if (!emailInput) return;

    const email     = emailInput.value.trim().toLowerCase();
    const submitBtn = document.getElementById("submitBtn");

    if (!email) {
      showMsg("Please enter your email address.", "error");
      return;
    }

    /* Disable button while "sending" */
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    /* =========================================
       SIMULATED USER CHECK (FRONTEND ONLY)
    ========================================= */
    const users  = JSON.parse(localStorage.getItem("ams_users") || "[]");
    const exists = users.find(u => u.email === email); // kept for future backend use

    /* =========================================
       UX FEEDBACK — always same message (security best practice)
    ========================================= */
    setTimeout(() => {
      showMsg(
        "If this email exists in our system, a password reset link will be sent.",
        "success"
      );
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="send" style="width:15px;height:15px;"></i> Send Reset Link`;
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }, 800);

  });

});
