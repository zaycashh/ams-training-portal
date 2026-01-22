document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    // Placeholder for backend email trigger
    alert(
      "If this email exists in our system, a password reset link will be sent."
    );

    form.reset();
  });
});
