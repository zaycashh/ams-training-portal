document.addEventListener("DOMContentLoaded", () => {

  const payBtn = document.getElementById("payNowBtn");
  if (!payBtn) return;

  const params = new URLSearchParams(window.location.search);
  const module = params.get("module");
  const type = params.get("type");

  payBtn.addEventListener("click", () => {

    if (payBtn.disabled) return;
    payBtn.disabled = true;

    const user = JSON.parse(localStorage.getItem("amsUser") || "null");

    if (!user) {
      alert("User not found. Please login again.");
      return;
    }

    const email = user.email;

    /* ================================
       FMCSA DER PURCHASE
    ================================= */

    if (module === "fmcsa-der" || type === "der_fmcsa") {

      localStorage.setItem(`paid_der_fmcsa_${email}`, "true");
      localStorage.setItem(`paid_der_fmcsa_date_${email}`, Date.now());

      alert("Purchase successful!");

      goDashboard();
      return;
    }

    /* ================================
       FMCSA SUPERVISOR BUNDLE
    ================================= */

    if (module === "fmcsa-module-a" || type === "fmcsa") {

      localStorage.setItem(`paid_fmcsa_${email}`, "true");
      localStorage.setItem(`fmcsa_start_date_${email}`, Date.now());

      alert("Purchase successful!");

      goDashboard();
      return;
    }

    /* ================================
       FAA DER PURCHASE
    ================================= */

    if (module === "der") {

      localStorage.setItem(`paid_der_${email}`, "true");

      alert("Purchase successful!");

      goDashboard();
      return;
    }

    /* ================================
       FAA SUPERVISOR PURCHASE
    ================================= */

    if (module === "supervisor") {

      localStorage.setItem(`paid_supervisor_${email}`, "true");

      alert("Purchase successful!");

      goDashboard();
      return;
    }

    /* ================================
       FAA EMPLOYEE TRAINING
    ================================= */

    if (module === "employee") {

      localStorage.setItem(`paid_employee_${email}`, "true");

      alert("Purchase successful!");

      goDashboard();
      return;
    }

    /* ================================
       FMCSA EMPLOYEE TRAINING
    ================================= */

    if (module === "fmcsa_employee") {

      localStorage.setItem(`paid_employee_fmcsa_${email}`, "true");
      localStorage.setItem(`paid_employee_fmcsa_date_${email}`, Date.now());

      alert("Purchase successful!");

      goDashboard();
      return;
    }

    /* ================================
       DEFAULT
    ================================= */

    alert("Unknown purchase type.");
    payBtn.disabled = false;

  });

});
