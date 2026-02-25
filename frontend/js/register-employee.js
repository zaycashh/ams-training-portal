document.getElementById("employeeRegisterForm")
  .addEventListener("submit", function (e) {

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

  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");

  if (!company || !company.invites) {
    msg.textContent = "Invalid invite code.";
    return;
  }

  const inviteEntry = company.invites[email];

  if (!inviteEntry || inviteEntry.code !== inviteCode) {
    msg.textContent = "Invalid or expired invite code.";
    return;
  }

  /* =========================================================
     CREATE EMPLOYEE USER (LIFECYCLE SAFE)
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
    acceptedAt: Date.now(),   // 🔥 FIX
    completed: false,
    createdAt: Date.now()
  };

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");
  users.push(employeeUser);
  localStorage.setItem("ams_users", JSON.stringify(users));

  /* =========================================================
     REMOVE INVITE
  ========================================================= */

  delete company.invites[email];

  // ⚠️ DO NOT TOUCH seats.employee.used
  // Your system now derives seat usage from company.usedSeats ONLY

  localStorage.setItem("companyProfile", JSON.stringify(company));

  /* =========================================================
     LOGIN SESSION
  ========================================================= */

  localStorage.setItem("amsUser", JSON.stringify(employeeUser));

  window.location.replace("dashboard.html");
});
