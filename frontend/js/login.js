/* =========================================================
   ENSURE COMPANY ADMIN EXISTS (AUTO-SEED)
========================================================= */
(function ensureCompanyAdmin() {
  const company = JSON.parse(localStorage.getItem("companyProfile") || "null");
  if (!company || !company.adminEmail) return;

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

  const exists = users.some(
    u => u.email === company.adminEmail && u.role === "company_admin"
  );

  if (!exists) {
    users.push({
      email: company.adminEmail,
      role: "company_admin",
      companyId: company.id,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem("ams_users", JSON.stringify(users));
    console.log("✅ Company admin auto-seeded");
  }
})();

/* =========================================================
   LOGIN FLOW — SAFE MULTI-ROLE (STEP 4 FINAL)
========================================================= */

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

  const users = JSON.parse(localStorage.getItem("ams_users") || "[]");

  const companyUser = users.find(u => u.email === email);

  /* =========================================================
     COMPANY USERS (ADMIN / EMPLOYEE)
  ========================================================= */
  if (companyUser) {
    // 👷 Employee acceptance
    if (companyUser.role === "employee" && !companyUser.acceptedAt) {
      companyUser.acceptedAt = new Date().toISOString();

      const updated = users.map(u =>
        u.email === companyUser.email ? companyUser : u
      );
      localStorage.setItem("ams_users", JSON.stringify(updated));
    }

    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        email: companyUser.email,
        role: companyUser.role,
        companyId: companyUser.companyId || null
      })
    );

    if (companyUser.role === "company_admin") {
      window.location.replace("company-dashboard.html");
      return;
    }

    window.location.replace("dashboard.html");
    return;
  }

  /* =========================================================
     INDIVIDUAL CLIENTS (B2C)
  ========================================================= */
  localStorage.setItem(
    "amsUser",
    JSON.stringify({
      email,
      role: "individual",
      companyId: null
    })
  );

  window.location.replace("dashboard.html");
});
