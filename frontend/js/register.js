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

    // Required fields
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

    // Password rules (keep your strong rule ✅)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      alert(
        "Password must be at least 8 characters long and include one uppercase letter and one number."
      );
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Save user (MVP local auth)
    const user = {
      firstName,
      lastName,
      company,
      phone,
      email,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem("amsUser", JSON.stringify(user));

    alert("Account created successfully. Please log in.");

    // ✅ OPTION A: Go back to login
    window.location.href = "login.html";
  });
});
