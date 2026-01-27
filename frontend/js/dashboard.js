function logout() {
  // Clear session
  localStorage.removeItem("amsUser");

  // Optional: clear FMCSA session flags if you want a full reset
  // localStorage.removeItem("paid_fmcsa");
  // localStorage.removeItem("fmcsa_start_date");

  // Silent redirect (no popup)
  window.location.href = "login.html";
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
