document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
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
      alert("Please fill out all required fields.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert(
        "Password must be at least 8 characters long and include one uppercase letter and one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    /* =========================
       CREATE USER
    ========================= */

    const user = {
      id: email,
      firstName,
      lastName,
      company,
      phone,
      email,
      role: "owner",
      companyId: "company-" + Date.now(),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("amsUser", JSON.stringify(user));

    /* =========================
       CREATE COMPANY PROFILE
    ========================= */

    const companyProfile = {
      id: user.companyId,
      name: company, // ✅ FIXED (was companyName)
      adminEmail: email,
      modules: ["employee"],

      totalSeats: { employee: 0 },
      usedSeats: {},
      employees: {}
    };

    localStorage.setItem("companyProfile", JSON.stringify(companyProfile));

    alert("Account created successfully.");

    window.location.href = "dashboard.html";
  });
});
