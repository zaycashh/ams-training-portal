/* =========================================================
   EMPLOYEE REGISTRATION — B2B ONLY
========================================================= */

document
  .getElementById("employeeRegisterForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document
      .getElementById("email")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    if (!company) {
      alert("No company found. Please contact your administrator.");
      return;
    }

    // Ensure invites object exists
    if (!company.invites) {
      company.invites = {};
    }

    // Validate invite
    if (!company.invites[email]) {
      alert("You are not invited. Please contact your company administrator.");
      return;
    }

    /* =========================================================
       PREVENT DUPLICATE USER REGISTRATION
    ========================================================= */

    const users = JSON.parse(
      localStorage.getItem("ams_users") || "[]"
    );

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      alert("An account with this email already exists.");
      return;
    }

    /* =========================================================
       CREATE EMPLOYEE USER (NO SEAT ASSIGNED YET)
    ========================================================= */

    const employeeUser = {
      id: "emp-" + email,
      email,
      role: "employee",
      companyId: company.id,
      type: "company", // 🔐 REQUIRED for route guard separation
      createdAt: Date.now()
    };

    users.push(employeeUser);

    localStorage.setItem(
      "ams_users",
      JSON.stringify(users)
    );

    /* =========================================================
       REMOVE INVITE AFTER SUCCESS
    ========================================================= */

    delete company.invites[email];

    localStorage.setItem(
      "companyProfile",
      JSON.stringify(company)
    );

    /* =========================================================
       LOG USER IN
    ========================================================= */

    localStorage.setItem(
      "amsUser",
      JSON.stringify(employeeUser)
    );

    alert("Employee account created successfully.");

    window.location.replace("dashboard.html");
  });
