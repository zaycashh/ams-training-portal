// =========================================================
// LOGIN FLOW — COMPANY SEATS + INDIVIDUAL ACCESS
// =========================================================

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  // 🔐 DEV PASSWORD (TEMP)
  const DEV_PASSWORD = "AMS!Dev2026";

  if (password !== DEV_PASSWORD) {
    alert("Invalid email or password");
    return;
  }

  /* =========================================================
     ROLE + COMPANY DETECTION
  ========================================================= */

  const emailDomain = email.split("@")[1];

  const companyProfile = JSON.parse(
    localStorage.getItem("companyProfile") || "null"
  );

  let role = "individual";
  let companyId = null;
  let employeeId = null;

  // 🏢 Company Admin
  if (
    companyProfile &&
    email === companyProfile.adminEmail
  ) {
    role = "company_admin";
    companyId = companyProfile.id;
  }

  // 👷 Company Employee (seat-based)
  else if (
    companyProfile &&
    email.endsWith("@" + companyProfile.adminEmail.split("@")[1])
  ) {
    role = "employee";
    companyId = companyProfile.id;
    employeeId = "EMP-" + Date.now();

    // 🪑 Consume seat ONLY on first login
    const usedEmployees =
      JSON.parse(localStorage.getItem("companyEmployees") || "[]");

    const alreadyExists = usedEmployees.find(
      e => e.email === email
    );

    if (!alreadyExists) {
      if (companyProfile.seatsUsed >= companyProfile.seatsTotal) {
        alert("No employee seats available for this company.");
        return;
      }

      companyProfile.seatsUsed += 1;
      localStorage.setItem(
        "companyProfile",
        JSON.stringify(companyProfile)
      );

      usedEmployees.push({
        email,
        employeeId,
        completed: false
      });

      localStorage.setItem(
        "companyEmployees",
        JSON.stringify(usedEmployees)
      );
    }
  }

  /* =========================================================
     SESSION STORE
  ========================================================= */

  const user = {
    email,
    role,
    companyId,
    employeeId
  };

  localStorage.setItem("amsUser", JSON.stringify(user));

  /* =========================================================
     ROUTING
  ========================================================= */

  if (role === "company_admin") {
    window.location.replace("company-dashboard.html");
    return;
  }

  window.location.replace("dashboard.html");
});
