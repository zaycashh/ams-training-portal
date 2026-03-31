document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("forgotPasswordForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    if (!emailInput) return;

    const email = emailInput.value.trim().toLowerCase();

    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    /* =========================================
       SIMULATED USER CHECK (FRONTEND ONLY)
    ========================================= */

    const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

    const exists = users.find(u => u.email === email);

    /* =========================================
       UX FEEDBACK (PRO FEEL)
    ========================================= */

    alert("Sending reset link...");

    setTimeout(() => {

      // 🔒 Always show same message (security best practice)
      alert(
        "If this email exists in our system, a password reset link will be sent."
      );

      form.reset();

    }, 800);

  });

});
