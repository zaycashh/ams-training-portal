/* =========================================================
   INDIVIDUAL REGISTRATION — FULL PROFILE VERSION
========================================================= */

document
  .getElementById("individualRegisterForm")
  .addEventListener("submit", function (e) {

    e.preventDefault();

    const firstName       = document.getElementById("firstName").value.trim();
    const lastName        = document.getElementById("lastName").value.trim();
    const phone           = document.getElementById("phone").value.trim();
    const email           = document.getElementById("email").value.trim().toLowerCase();
    const password        = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

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

    const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      showMsg("An account with this email already exists.", "error");
      return;
    }

    const individualUser = {
      id:        "ind-" + email,
      firstName,
      lastName,
      fullName:  firstName + " " + lastName,
      phone,
      email,
      password,
      role:      "individual",
      type:      "individual",
      createdAt: new Date().toISOString()
    };

    users.push(individualUser);

    localStorage.setItem("ams_users",  JSON.stringify(users));
    localStorage.setItem("amsUser",    JSON.stringify(individualUser));

    showMsg("Account created successfully. Redirecting...", "success");

    setTimeout(() => window.location.replace("dashboard.html"), 1000);
  });
