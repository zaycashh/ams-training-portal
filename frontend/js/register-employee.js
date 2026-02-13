document.getElementById("employeeRegisterForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email")
      .value.trim()
      .toLowerCase();

    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill all fields.");
      return;
    }

    const company = JSON.parse(
      localStorage.getItem("companyProfile") || "null"
    );

    if (!company || !company.invites || !company.invites[email]) {
      alert("You are not invited. Please contact your company administrator.");
      return;
    }

    // Create employee user
    localStorage.setItem(
      "amsUser",
      JSON.stringify({
        id: "emp-" + email,
        email,
        role: "employee",
        companyId: company.id
      })
    );

    alert("Employee account created successfully.");

    window.location.replace("dashboard.html");
  });
