/* =========================================================
   EMPLOYEE REGISTRATION (INVITE REQUIRED)
========================================================= */

document.getElementById("employeeRegisterForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value
      .trim()
      .toLowerCase();

    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    if (!email || !password) {
      msg.textContent = "All fields are required.";
      msg.style.color = "red";
      return;
    }

    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    if (!company) {
      msg.textContent = "No company found.";
      msg.style.color = "red";
      return;
    }

    // 🔒 Check invite
    if (!company.employees || !company.employees[email]) {
      msg.textContent =
        "You are not invited. Please contact your company administrator.";
      msg.style.color = "red";
      return;
    }

    const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

    if (users.find(u => u.email === email)) {
      msg.textContent = "Account already exists.";
      msg.style.color = "red";
      return;
    }

    // ✅ Create employee user
    const newUser = {
      id: "emp-" + email,
      email,
      password,
      role: "employee",
      companyId: company.id,
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem("ams_users", JSON.stringify(users));

    msg.textContent = "Account created successfully!";
    msg.style.color = "green";

    // Auto login
    localStorage.setItem("amsUser", JSON.stringify(newUser));

    setTimeout(() => {
      window.location.replace("dashboard.html");
    }, 800);
});
