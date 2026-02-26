document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const module = params.get("module");
  const productType = params.get("type");
  const qty = parseInt(params.get("qty") || "1", 10);
  const params = new URLSearchParams(window.location.search);
  const module = params.get("module");

  const payBtn = document.getElementById("payNowBtn");

  if (!module || !payBtn) return;

  payBtn.addEventListener("click", () => {
    simulateStripeSuccess(module);
  });
});

function simulateStripeSuccess(module) {
  if (module === "fmcsa") {
    localStorage.setItem("paid_fmcsa", "true");
    localStorage.setItem("fmcsaPurchaseDate", Date.now());
  }

  if (module === "der") {
    localStorage.setItem("paid_der", "true");
  }

  if (module === "supervisor") {
    localStorage.setItem("paid_supervisor", "true");
  }

  if (module === "employee") {
    localStorage.setItem("paid_employee", "true");
  }

  alert("Payment successful!");
  window.location.href = "dashboard.html";
}

if (productType === "employee_seats") {

  const company = JSON.parse(localStorage.getItem("companyProfile"));

  if (!company.seats) company.seats = {};
  if (!company.seats.employee) {
    company.seats.employee = { total: 0 };
  }

  company.seats.employee.total += 5;

  localStorage.setItem("companyProfile", JSON.stringify(company));
}
