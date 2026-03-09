document.addEventListener("DOMContentLoaded", () => {

  const payBtn = document.getElementById("payNowBtn");
  if (!payBtn) return;

  const params = new URLSearchParams(window.location.search);
  const module = params.get("module");
  const type = params.get("type");

  payBtn.addEventListener("click", () => {

    /* ================================
       FMCSA DER PURCHASE
    ================================= */

    if (module === "fmcsa-der" || type === "der_fmcsa") {

      localStorage.setItem("paid_der_fmcsa", "true");
      localStorage.setItem("paid_der_fmcsa_date", Date.now());

      alert("Purchase successful!");

      window.location.href = "dashboard.html";
      return;
    }

    /* ================================
       FMCSA SUPERVISOR BUNDLE
    ================================= */

    if (module === "fmcsa-module-a" || type === "fmcsa") {

      localStorage.setItem("paid_fmcsa", "true");
      localStorage.setItem("fmcsaPurchaseDate", Date.now());

      alert("Purchase successful!");

      window.location.href = "dashboard.html";
      return;
    }

    /* ================================
   FAA DER PURCHASE
================================ */

if (module === "der") {

  localStorage.setItem("paid_der", "true");

  alert("Purchase successful!");

  window.location.href = "dashboard.html";
  return;
}
    /* ================================
   FAA SUPERVISOR PURCHASE
================================ */

if (module === "supervisor") {

  localStorage.setItem("paid_supervisor", "true");

  alert("Purchase successful!");

  window.location.href = "dashboard.html";
  return;
}

    /* ================================
   EMPLOYEE TRAINING (FAA)
================================ */

if (module === "employee") {

  localStorage.setItem("paid_employee", "true");

  alert("Purchase successful!");

  window.location.href = "dashboard.html";
  return;
}

/* ================================
   FMCSA EMPLOYEE TRAINING
================================ */

if (module === "fmcsa_employee") {

  localStorage.setItem("paid_employee_fmcsa", "true");
  localStorage.setItem("paid_employee_fmcsa_date", Date.now());

  alert("Purchase successful!");

  window.location.href = "dashboard.html";
  return;
}
    /* ================================
       DEFAULT
    ================================= */

    alert("Unknown purchase type.");

  });

});
