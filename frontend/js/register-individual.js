/* =========================================================
   INDIVIDUAL REGISTRATION — Supabase-backed
========================================================= */

document
  .getElementById("individualRegisterForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstName       = document.getElementById("firstName").value.trim();
    const lastName        = document.getElementById("lastName").value.trim();
    const phone           = document.getElementById("phone").value.trim();
    const email           = document.getElementById("email").value.trim().toLowerCase();
    const password        = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const program         = (new URLSearchParams(window.location.search).get("program") || localStorage.getItem("amsProgram") || "faa").toLowerCase();

    if (!firstName || !lastName || !phone || !email || !password || !confirmPassword) {
      showMsg("Please complete all fields.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showMsg("Passwords do not match.", "error");
      return;
    }
    if (password.length < 8) {
      showMsg("Password must be at least 8 characters.", "error");
      return;
    }

    showMsg("Creating your account...", "info");

    try {
      /* 1. Check if email already exists */
      const { data: existing } = await db.from("users").select("id").eq("email", email);
      if (existing && existing.length > 0) {
        showMsg("An account with this email already exists.", "error");
        return;
      }

      /* 2. Create user in Supabase */
      const { data: newUser, error } = await db.from("users").insert([{
        email,
        password_hash: password,
        name:          firstName + " " + lastName,
        type:          "individual",
        role:          "individual",
        program,
        verified:      true
      }]).select().single();

      if (error) throw error;

      /* 3. Set session */
      const sessionUser = {
        id:        newUser.id,
        email:     newUser.email,
        firstName,
        lastName,
        fullName:  firstName + " " + lastName,
        phone,
        role:      "individual",
        type:      "individual",
        program
      };

      localStorage.setItem("amsUser",    JSON.stringify(sessionUser));
      localStorage.setItem("amsProgram", program);

      showMsg("Account created successfully. Redirecting...", "success");
      setTimeout(() => window.location.replace("dashboard.html"), 1000);

    } catch (err) {
      console.error("Register error:", err);
      showMsg("Something went wrong. Please try again.", "error");
    }
  });
