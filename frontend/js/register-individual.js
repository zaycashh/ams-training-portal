/* =========================================================
   INDIVIDUAL REGISTRATION — FULL PROFILE VERSION
========================================================= */

document
  .getElementById("individualRegisterForm")
  .addEventListener("submit", function (e) {

    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const company = document.getElementById("company").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (
      !firstName ||
      !lastName ||
      !company ||
      !phone ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      alert("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("ams_users") || "[]"
    );

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      alert("An account with this email already exists.");
      return;
    }

    const individualUser = {
      id: "ind-" + email,
      firstName,
      lastName,
      company,
      phone,
      email,
      role: "individual",
      type: "individual",
      createdAt: new Date().toISOString()
    };

    users.push(individualUser);

    localStorage.setItem("ams_users", JSON.stringify(users));
    localStorage.setItem("amsUser", JSON.stringify(individualUser));

    alert("Account created successfully.");

    window.location.replace("dashboard.html");
});
