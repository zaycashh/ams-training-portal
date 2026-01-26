function logout() {
  alert("Logged out (session handling coming next).");
  window.location.href = "login.html";
}
function startFMCSA() {
  const paid = localStorage.getItem("paid_fmcsa");
  const startDate = localStorage.getItem("fmcsa_start_date");

  // Simulated payment for now
  if (!paid) {
    alert("FMCSA training requires payment before starting.");
    localStorage.setItem("paid_fmcsa", "true");
    localStorage.setItem("fmcsa_start_date", Date.now());
  }

  // Redirect to FMCSA hub
  window.location.href = "./fmcsa.html";
}
