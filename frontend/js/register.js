document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const company = document.getElementById("company").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
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

    // Password rules
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

    // Success (placeholder)
    alert("Account created successfully. Backend coming next.");
    form.reset();
  });
});
