document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("employeeRegisterForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {

    e.preventDefault();

    const firstName  = document.getElementById("firstName").value.trim();
    const lastName   = document.getElementById("lastName").value.trim();
    const phone      = document.getElementById("phone").value.trim();
    const email      = document.getElementById("email").value.trim().toLowerCase();
    const password   = document.getElementById("password").value;
    const inviteCode = document.getElementById("inviteCode").value.trim();

    if (!firstName || !lastName || !phone || !email || !password || !inviteCode) {
      showMsg("Please complete all fields.", "error");
      return;
    }

    if (password.length < 8) {
      showMsg("Password must be at least 8 characters.", "error");
      return;
    }

    /* =========================================================
       GET COMPANY
    ========================================================= */

    const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

    if (!company || !company.invites) {
      showMsg("Invalid invite code.", "error");
      return;
    }

    /* =========================================================
       PROGRAM LOCK
    ========================================================= */

    const programFromURL =
      new URLSearchParams(window.location.search).get("program") || "faa";

    if (company.program !== programFromURL) {
      showMsg(
        "This invite is only valid for " +
        (company.program || "FAA").toUpperCase() +
        " registration.",
        "error"
      );
      return;
    }

    /* =========================================================
       VALIDATE INVITE
    ========================================================= */

    const inviteEntry = company.invites[email];

    if (!inviteEntry || inviteEntry.code !== inviteCode) {
      showMsg("Invalid or expired invite code.", "error");
      return;
    }

    /* =========================================================
       PREVENT DUPLICATE USERS
    ========================================================= */

    const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

    if (users.find(u => u.email === email)) {
      showMsg("An account with this email already exists.", "error");
      return;
    }

    /* =========================================================
       CREATE EMPLOYEE USER
    ========================================================= */

    const employeeUser = {
      id:         "emp-" + email,
      firstName,
      lastName,
      phone,
      email,
      role:       "employee",
      type:       "company",
      companyId:  company.id,
      program:    company.program,
      acceptedAt: Date.now(),
      completed:  false,
      createdAt:  Date.now()
    };

    users.push(employeeUser);
    localStorage.setItem("ams_users", JSON.stringify(users));

    /* =========================================================
       ASSIGN SEAT (EMAIL-BASED MODEL)
    ========================================================= */

    if (!company.usedSeats) company.usedSeats = {};

    company.usedSeats[email] = {
      assignedAt: Date.now(),
      completed:  false
    };

    /* =========================================================
       REMOVE INVITE
    ========================================================= */

    delete company.invites[email];

    localStorage.setItem("companyProfile", JSON.stringify(company));

    /* =========================================================
       START SESSION
    ========================================================= */

    localStorage.setItem("amsUser",    JSON.stringify(employeeUser));
    localStorage.setItem("amsProgram", company.program);

    /* =========================================================
       REDIRECT
    ========================================================= */

    showMsg("Account created successfully. Redirecting...", "success");

    setTimeout(() => window.location.replace("dashboard.html"), 1000);

  });

});
