document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (!password || !confirm) {
      alert("Please fill out all fields.");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    // Placeholder for backend password reset
    alert("Your password has been reset successfully.");

    // Future redirect
    // window.location.href = "login.html";
  });
});
