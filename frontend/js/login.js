/* =========================================================
   LOGIN FLOW — CLEAN TYPE-AWARE VERSION
========================================================= */

const DEV_PASSWORD = "AMS!Dev2026";

document.getElementById("loginForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value
      .trim()
      .toLowerCase();

    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    if (password !== DEV_PASSWORD) {
      alert("Invalid email or password");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("ams_users") || "[]"
    );

    const user = users.find(u => u.email === email);

    if (!user) {
      alert("Account not found. Please register first.");
      return;
    }

    localStorage.setItem("amsUser", JSON.stringify(user));

    redirectByRole(user);
  });

/* =========================================================
   ROLE REDIRECT
========================================================= */

function redirectByRole(user) {

  if (user.type === "company" &&
      (user.role === "owner" || user.role === "company_admin")) {
    window.location.replace("company-dashboard.html");
    return;
  }

  window.location.replace("dashboard.html");
}
