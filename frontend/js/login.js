// TEMP LOGIN FLOW (no backend yet)

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // TEMP user session object
  const user = {
    email: email,
    firstName: "User" // placeholder until backend
  };

  // ✅ SINGLE SOURCE OF TRUTH
  localStorage.setItem("amsUser", JSON.stringify(user));

  // Redirect AFTER session is written
  window.location.replace("dashboard.html");
});
