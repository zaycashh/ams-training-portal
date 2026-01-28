function logout() {
  // Clear session
  localStorage.removeItem("amsUser");

  // Optional: clear FMCSA session flags if you want a full reset
  // localStorage.removeItem("paid_fmcsa");
  // localStorage.removeItem("fmcsa_start_date");

  // Silent redirect (no popup)
  window.location.replace("login.html");
}

function startFMCSA() {
  const paid = localStorage.getItem("paid_fmcsa");
  const startDate = localStorage.getItem("fmcsa_start_date");

  // Simulated payment for now
  if (!paid) {
    localStorage.setItem("paid_fmcsa", "true");
    localStorage.setItem("fmcsa_start_date", Date.now());
  }

  // Redirect to FMCSA hub
  window.location.href = "./fmcsa.html";
}
/* ===============================
   FAA MODULE ACCESS CONTROL
================================ */

function startFAA(type) {
  const modules = {
    der: {
      key: "paid_der",
      page: "der-training.html",
      name: "DER Training"
    },
    supervisor: {
      key: "paid_supervisor",
      page: "supervisor-training.html",
      name: "Supervisor Training"
    },
    employee: {
      key: "paid_employee",
      page: "employee-training.html",
      name: "Employee Training"
    }
  };

  const mod = modules[type];
  if (!mod) return;

  const paid = localStorage.getItem(mod.key);

  if (paid !== "true") {
    alert(
      `${mod.name} is locked.\n\nPlease purchase this course to continue.`
    );
    return;
  }

  window.location.href = mod.page;
}
