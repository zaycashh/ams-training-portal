// TEMP LOGIN FLOW (no backend yet)

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Simple validation
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // TEMP: mark user as logged in
  localStorage.setItem("ams_logged_in", "true");
  localStorage.setItem("ams_user_email", email);

  // Redirect to dashboard
  window.location.href = "dashboard.html";
});
