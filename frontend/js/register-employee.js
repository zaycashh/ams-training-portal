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

    /* Load the correct program-scoped profile */
    const _regProgram = new URLSearchParams(window.location.search).get("program") || "faa";
    const _regKey     = _regProgram.toLowerCase() === "fmcsa" ? "companyProfile_fmcsa" : "companyProfile_faa";
    const company     = JSON.parse(localStorage.getItem(_regKey) || localStorage.getItem("companyProfile") || "null");

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
       Invites are stored under different keys depending on role:
         employee  → company.invites[email]
         supervisor → company.invites[email + '_supervisor']
         der        → company.invites[email + '_der']
       We search all possible keys for a matching invite code.
    ========================================================= */

    const possibleKeys = [
      email,
      email + "_supervisor",
      email + "_der"
    ];

    let inviteKey   = null;
    let inviteEntry = null;

    for (const k of possibleKeys) {
      const entry = company.invites[k];
      if (entry && entry.code === inviteCode) {
        inviteKey   = k;
        inviteEntry = entry;
        break;
      }
    }

    if (!inviteEntry) {
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
      seat:       inviteEntry.role || "employee",
      acceptedAt: Date.now(),
      completed:  false,
      createdAt:  Date.now()
    };

    users.push(employeeUser);
    localStorage.setItem("ams_users", JSON.stringify(users));

    /* =========================================================
       ASSIGN SEAT — role-aware
       Place the seat under the correct sub-key so dashboard
       can find it (usedSeats.employee / .supervisor / .der)
    ========================================================= */

    if (!company.usedSeats)             company.usedSeats             = {};
    if (!company.usedSeats.employee)    company.usedSeats.employee    = {};
    if (!company.usedSeats.supervisor)  company.usedSeats.supervisor  = {};
    if (!company.usedSeats.der)         company.usedSeats.der         = {};

    const seatRole = inviteEntry.role || "employee";
    company.usedSeats[seatRole][email] = {
      assignedAt: Date.now(),
      revoked:    false
    };

    /* =========================================================
       REMOVE INVITE
    ========================================================= */

    delete company.invites[inviteKey];

    /* Save back to both scoped key and legacy key */
    const _saveKey = (company.program || "").toLowerCase() === "fmcsa" ? "companyProfile_fmcsa" : "companyProfile_faa";
    localStorage.setItem(_saveKey, JSON.stringify(company));
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

    setTimeout(() => window.location.replace("company-dashboard.html"), 1000);

  });

});
