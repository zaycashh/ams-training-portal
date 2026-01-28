// TEMP LOGIN FLOW (no backend yet)

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // 🔐 TEMP password check (DEV ONLY)
  const DEV_PASSWORD = "AMS!Dev2026";

  if (password !== DEV_PASSWORD) {
    alert("Invalid email or password");
    return;
  }

  // TEMP user session
  const user = {
    email,
    firstName: "User"
  };

  localStorage.setItem("amsUser", JSON.stringify(user));

  window.location.replace("dashboard.html");
});
