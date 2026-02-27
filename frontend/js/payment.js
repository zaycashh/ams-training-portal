document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const module = params.get("module");
  const productType = params.get("type");
  const qty = parseInt(params.get("qty") || "1", 10);

  const payBtn = document.getElementById("payNowBtn");

  if (!payBtn) return;

  payBtn.addEventListener("click", () => {
    simulateStripeSuccess(module, productType, qty);
  });

});

function simulateStripeSuccess(module, productType, qty) {

  /* ===============================
     MODULE PURCHASES
  =============================== */

  if (module === "fmcsa") {
    localStorage.setItem("paid_fmcsa", "true");
    localStorage.setItem("fmcsaPurchaseDate", Date.now());
  }

  if (module === "der") {
    localStorage.setItem("paid_der", "true");
  }
  
  if (module === "der_fmcsa") {
  localStorage.setItem("paid_der_fmcsa", "true");
}

  if (module === "supervisor") {
    localStorage.setItem("paid_supervisor", "true");
  }

  if (module === "employee") {
    localStorage.setItem("paid_employee", "true");
  }

  /* ===============================
   SEAT PURCHASE
=============================== */

if (productType === "employee_seats") {

  const company = JSON.parse(
    localStorage.getItem("companyProfile") || "{}"
  );

  if (!company.seats) company.seats = {};
  if (!company.seats.employee) {
    company.seats.employee = { total: 0 };
  }

  company.seats.employee.total += qty;

  localStorage.setItem("companyProfile", JSON.stringify(company));
}

alert("Payment successful!");
  
  if (module === "der_fmcsa") {
  window.location.replace("fmcsa-der.html");
  return;
}

// 🔐 Smart Redirect Logic
const user = JSON.parse(localStorage.getItem("amsUser") || "null");

if (
  productType === "employee_seats" &&
  (user?.role === "company_admin" || user?.role === "owner")
) {
  window.location.replace("company-dashboard.html");
} else {
  window.location.replace("dashboard.html");
}

}
