document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("employeeRegisterForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {

    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const inviteCode = document.getElementById("inviteCode").value.trim();

    const msg = document.getElementById("msg");

    if (!firstName || !lastName || !phone || !email || !password || !inviteCode) {
      msg.textContent = "Please complete all fields.";
      return;
    }

    /* =========================================================
       GET COMPANY
    ========================================================= */

    const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

    if (!company || !company.invites) {
      msg.textContent = "Invalid invite code.";
      return;
    }

    /* =========================================================
       PROGRAM LOCK (🔥 CRITICAL FIX)
    ========================================================= */

    const programFromURL =
      new URLSearchParams(window.location.search).get("program") || "faa";

    if (company.program !== programFromURL) {
      msg.textContent =
        "This invite is only valid for " +
        (company.program || "FAA").toUpperCase() +
        " registration.";
      return;
    }

    /* =========================================================
       VALIDATE INVITE
    ========================================================= */

    const inviteEntry = company.invites[email];

    if (!inviteEntry || inviteEntry.code !== inviteCode) {
      msg.textContent = "Invalid or expired invite code.";
      return;
    }

    /* =========================================================
       PREVENT DUPLICATE USERS
    ========================================================= */

    const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

    if (users.find(u => u.email === email)) {
      msg.textContent = "An account with this email already exists.";
      return;
    }

    /* =========================================================
       CREATE EMPLOYEE USER
    ========================================================= */

    const employeeUser = {
      id: "emp-" + email,
      firstName,
      lastName,
      phone,
      email,
      role: "employee",
      type: "company",
      companyId: company.id,
      program: company.program, // 🔥 LOCK USER TO COMPANY PROGRAM
      acceptedAt: Date.now(),
      completed: false,
      createdAt: Date.now()
    };

    users.push(employeeUser);
    localStorage.setItem("ams_users", JSON.stringify(users));

    /* =========================================================
       ASSIGN SEAT (EMAIL-BASED MODEL)
    ========================================================= */

    if (!company.usedSeats) {
      company.usedSeats = {};
    }

    company.usedSeats[email] = {
      assignedAt: Date.now(),
      completed: false
    };

    /* =========================================================
       REMOVE INVITE
    ========================================================= */

    delete company.invites[email];

    localStorage.setItem("companyProfile", JSON.stringify(company));

    /* =========================================================
       START SESSION
    ========================================================= */

    localStorage.setItem("amsUser", JSON.stringify(employeeUser));
    localStorage.setItem("amsProgram", company.program);

    /* =========================================================
       REDIRECT
    ========================================================= */

    window.location.replace("dashboard.html");

  });

});
