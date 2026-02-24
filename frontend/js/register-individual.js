/* =========================================================
   INDIVIDUAL REGISTRATION — B2C ONLY
========================================================= */

document
  .getElementById("individualRegisterForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document
      .getElementById("email")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please complete all fields.");
      return;
    }

    // Prevent duplicate users
    const users = JSON.parse(
      localStorage.getItem("ams_users") || "[]"
    );

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      alert("An account with this email already exists.");
      return;
    }

    /* =========================================================
       CREATE INDIVIDUAL USER
    ========================================================= */

    const individualUser = {
      id: "ind-" + email,
      email,
      role: "employee",
      type: "individual", // 🔐 critical separation flag
      createdAt: Date.now()
    };

    users.push(individualUser);

    localStorage.setItem(
      "ams_users",
      JSON.stringify(users)
    );

    localStorage.setItem(
      "amsUser",
      JSON.stringify(individualUser)
    );

    // B2C unlock
    localStorage.setItem("paid_employee", "true");

    // Remove any B2B data
    localStorage.removeItem("companyProfile");

    alert("Individual account created successfully.");

    window.location.replace("dashboard.html");
  });
