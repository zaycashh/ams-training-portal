document.addEventListener("DOMContentLoaded", () => {

  if (localStorage.getItem("paid_der_fmcsa") !== "true") {
    alert("DER FMCSA training requires purchase.");
    window.location.href = "dashboard.html";
    return;
  }

});
