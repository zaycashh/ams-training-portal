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

    if (!firstName || !lastName || !company || !phone || !email || !password || !confirmPassword) {
      alert("Please fill out all required fields.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must be at least 8 characters long and include one uppercase letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const existingCompany = JSON.parse(localStorage.getItem("companyProfile") || "null");

    const user = {
      id: email,
      firstName,
      lastName,
      company,
      phone,
      email,
      role: existingCompany ? "employee" : "owner",
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("amsUser", JSON.stringify(user));
    
    // 🔐 Store permanent registration record (for login retrieval)
    localStorage.setItem(
      "registeredUser_" + email,
      JSON.stringify(user)
);

    // 🔥 ONLY CREATE COMPANY IF IT DOESN'T EXIST
    if (!existingCompany) {
      const companyProfile = {
        id: "company-" + Date.now(),
        name: company,
        adminEmail: email,
        modules: ["employee"],
        totalSeats: { employee: 0 },
        usedSeats: {},
        employees: {}
      };

      localStorage.setItem("companyProfile", JSON.stringify(companyProfile));
    }

    alert("Account created successfully. Please log in.");
    window.location.href = "login.html";
  });
});
