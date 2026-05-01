/* =========================================================
   LOGIN — Supabase-backed
========================================================= */

document.getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showMsg("Please enter your email and password.", "error");
      return;
    }

    showMsg("Signing you in...", "info");

    try {
      /* 1. Look up user in Supabase */
      const { data: users, error } = await db
        .from("users")
        .select("*")
        .eq("email", email);

      if (error) throw error;

      if (!users || users.length === 0) {
        showMsg("Account not found. Please register first.", "error");
        return;
      }

      const user = users[0];

      /* 2. Simple password check (plain text for now — upgrade to bcrypt later) */
      if (user.password_hash !== password) {
        showMsg("Invalid email or password.", "error");
        return;
      }

      /* 3. Build session object (same shape as before so rest of app works) */
      const sessionUser = {
        id:        user.id,
        email:     user.email,
        firstName: user.name ? user.name.split(" ")[0] : "",
        lastName:  user.name ? user.name.split(" ").slice(1).join(" ") : "",
        fullName:  user.name || user.email,
        role:      user.role,
        type:      user.type,
        program:   user.program,
        companyId: user.company_id,
        seat:      user.assigned_module
      };

      localStorage.setItem("amsUser",    JSON.stringify(sessionUser));
      localStorage.setItem("amsProgram", user.program || "faa");

      /* 4. If company admin, load company profile from Supabase */
      if (user.type === "company" && (user.role === "company_admin" || user.role === "owner")) {
        const { data: company } = await db
          .from("companies")
          .select("*")
          .eq("id", user.company_id)
          .single();

        if (company) {
          const profileKey = (company.program || "faa").toLowerCase() === "fmcsa"
            ? "companyProfile_fmcsa" : "companyProfile_faa";
          localStorage.setItem(profileKey, JSON.stringify({
            id:      company.id,
            name:    company.name,
            email:   company.admin_email,
            program: company.program,
            seats:   company.seats,
            invites: {}
          }));
          localStorage.setItem("companyProfile", localStorage.getItem(profileKey));
        }
      }

      showMsg("Welcome back! Redirecting...", "success");
      setTimeout(() => redirectByRole(sessionUser), 800);

    } catch (err) {
      console.error("Login error:", err);
      showMsg("Something went wrong. Please try again.", "error");
    }
  });

function redirectByRole(user) {
  if (user.type === "company" &&
      (user.role === "owner" || user.role === "company_admin")) {
    window.location.replace("company-dashboard.html");
    return;
  }
  window.location.replace("dashboard.html");
}
