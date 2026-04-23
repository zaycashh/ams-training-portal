document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirm  = document.getElementById("confirmPassword").value;

    if (!password || !confirm) {
      showMsg("Please fill out all fields.", "error");
      return;
    }

    if (password !== confirm) {
      showMsg("Passwords do not match.", "error");
      return;
    }

    if (password.length < 8) {
      showMsg("Password must be at least 8 characters.", "error");
      return;
    }

    // ✅ Success feedback
    showMsg("Your password has been reset successfully.", "success");

    // 🔌 Placeholder for Cloudflare Worker backend call:
    // fetch("/api/reset-password", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ password })
    // }).then(res => res.json()).then(data => {
    //   if (data.success) {
    //     showMsg("Password reset successfully.", "success");
    //     setTimeout(() => window.location.href = "login.html", 1500);
    //   } else {
    //     showMsg(data.message || "Something went wrong.", "error");
    //   }
    // });

    // Future redirect (uncomment when backend is live):
    // setTimeout(() => window.location.href = "login.html", 1500);
  });
});
