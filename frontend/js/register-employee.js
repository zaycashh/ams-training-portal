/* =========================================================
   EMPLOYEE REGISTRATION — Supabase-backed
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("employeeRegisterForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstName  = document.getElementById("firstName").value.trim();
    const lastName   = document.getElementById("lastName").value.trim();
    const phone      = document.getElementById("phone").value.trim();
    const email      = document.getElementById("email").value.trim().toLowerCase();
    const password   = document.getElementById("password").value;
    const inviteCode = document.getElementById("inviteCode").value.trim();
    const programFromURL = (new URLSearchParams(window.location.search).get("program") || "faa").toLowerCase();

    if (!firstName || !lastName || !phone || !email || !password || !inviteCode) {
      showMsg("Please complete all fields.", "error");
      return;
    }
    if (password.length < 8) {
      showMsg("Password must be at least 8 characters.", "error");
      return;
    }

    showMsg("Verifying invite code...", "info");

    try {
      /* 1. Validate invite code in Supabase */
      const { data: invite, error: inviteErr } = await db
        .from("invite_codes")
        .select("*, companies(*)")
        .eq("code", inviteCode)
        .eq("used", false)
        .single();

      if (inviteErr || !invite) {
        showMsg("Invalid or expired invite code.", "error");
        return;
      }

      const company = invite.companies;

      /* 2. Program lock */
      if (company.program !== programFromURL) {
        showMsg("This invite is only valid for " + company.program.toUpperCase() + " registration.", "error");
        return;
      }

      /* 3. Check duplicate */
      const { data: existing } = await db.from("users").select("id").eq("email", email);
      if (existing && existing.length > 0) {
        showMsg("An account with this email already exists.", "error");
        return;
      }

      /* 4. Create employee user */
      const { data: newUser, error: userErr } = await db.from("users").insert([{
        email,
        password_hash:   password,
        name:            firstName + " " + lastName,
        type:            "company",
        role:            "employee",
        program:         company.program,
        company_id:      company.id,
        assigned_module: invite.module,
        verified:        true
      }]).select().single();

      if (userErr) throw userErr;

      /* 5. Mark invite as used */
      await db.from("invite_codes").update({ used: true, used_by: email }).eq("code", inviteCode);

      /* 6. Log seat assignment */
      await db.from("seat_assignments").insert([{
        company_id:     company.id,
        employee_id:    newUser.id,
        employee_email: email,
        employee_name:  firstName + " " + lastName,
        module:         invite.module,
        program:        company.program
      }]);

      /* 7. Set session */
      const sessionUser = {
        id:        newUser.id,
        email:     newUser.email,
        firstName,
        lastName,
        fullName:  firstName + " " + lastName,
        phone,
        role:      "employee",
        type:      "company",
        companyId: company.id,
        program:   company.program,
        seat:      invite.module
      };

      localStorage.setItem("amsUser",    JSON.stringify(sessionUser));
      localStorage.setItem("amsProgram", company.program);

      /* 8. Log activity */
      await db.from("activity_log").insert([{
        company_id: company.id,
        user_email: email,
        action:     "employee_registered",
        details:    { name: firstName + " " + lastName, module: invite.module }
      }]);

      showMsg("Account created successfully. Redirecting...", "success");
      setTimeout(() => window.location.replace("dashboard.html"), 1000);

    } catch (err) {
      console.error("Register employee error:", err);
      showMsg("Something went wrong. Please try again.", "error");
    }
  });
});
