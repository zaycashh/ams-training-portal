/* =========================================================
   LOGIN FLOW — CLEAN TYPE-AWARE VERSION
========================================================= */

document.getElementById("loginForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value
      .trim()
      .toLowerCase();

    const password = document.getElementById("password").value;

    if (!email || !password) {
      showMsg("Please enter your email and password.", "error");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("ams_users") || "[]"
    );

    const user = users.find(u => u.email === email);

    if (!user || !user.email || !user.role) {
      showMsg("Account not found. Please register first.", "error");
      return;
    }

    if (user.password && user.password !== password) {
      showMsg("Invalid email or password.", "error");
      return;
    }

    showMsg("Signing you in...", "success");

    localStorage.removeItem("amsUser");
    localStorage.setItem("amsUser", JSON.stringify(user));

    // Short delay so the success message is visible before redirect
    setTimeout(() => redirectByRole(user), 800);
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
