/* =========================================================
   FORGOT PASSWORD — Supabase-backed
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email     = document.getElementById("email").value.trim().toLowerCase();
    const submitBtn = document.getElementById("submitBtn");

    if (!email) {
      showMsg("Please enter your email address.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      /* 1. Check if user exists in Supabase */
      const { data: users } = await db.from("users").select("id, email").eq("email", email);

      if (users && users.length > 0) {
        /* 2. Generate a reset token */
        const token   = crypto.randomUUID();
        const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

        /* 3. Save token to Supabase */
        await db.from("users").update({
          reset_token:         token,
          reset_token_expires: expires
        }).eq("email", email);

        /* 4. Build reset link */
        const resetLink = window.location.origin +
          "/frontend/pages/reset-password.html?token=" + token + "&email=" + encodeURIComponent(email);

        /* 5. Send email via Cloudflare Worker + Resend */
        await fetch("https://ams-checkout.josealfonsodejesus.workers.dev/send-reset-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            resetLink,
            name: user.name || ""
          })
        });
      }

      /* Always show same message for security */
      showMsg(
        "If this email exists in our system, a password reset link will be sent.",
        "success"
      );
      form.reset();

    } catch (err) {
      console.error("Forgot password error:", err);
      showMsg(
        "If this email exists in our system, a password reset link will be sent.",
        "success"
      );
      form.reset();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="send" style="width:15px;height:15px;"></i> Send Reset Link`;
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }
  });
});
