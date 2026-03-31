/* =========================================================
   FAA CERTIFICATE PAGE LOADER (FINAL)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("certList");
  if (!container) return;

  const user =
    JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) {
    container.innerHTML = "<p>Please login.</p>";
    return;
  }

  const key = `amsCertificates_${user.email}`;

  const registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  /* 🔥 FAA ONLY (current logic) */
  const faaCerts = registry.filter(cert =>
    cert.course && !cert.course.includes("FMCSA")
  );

  if (!faaCerts.length) {
    container.innerHTML = "<p>No FAA certificates found.</p>";
    return;
  }

  faaCerts.forEach(cert => {

    let title = "FAA Training";

    if (cert.course.includes("DER")) {
      title = "FAA DER Training";
    }
    else if (cert.course.includes("Reasonable")) {
      title = "FAA Supervisor Training";
    }
    else if (cert.course.includes("Employee")) {
      title = "FAA Employee Training";
    }

    const card = document.createElement("div");
    card.className = "certificate-card";

    card.innerHTML = `
      <h3>${title}</h3>
      <p><strong>Name:</strong> ${cert.name || user.email}</p>
      <p><strong>Date:</strong> ${cert.displayDate || new Date(cert.date).toLocaleDateString()}</p>
      <p><strong>ID:</strong> ${cert.id}</p>

      <button class="btn-primary" onclick="openFAACert('${cert.id}')">
        View Certificate
      </button>

      <div id="qr-${cert.id}" style="margin-top:10px;"></div>
    `;

    container.appendChild(card);

    generateQR(cert.id, `qr-${cert.id}`);

  });

});

/* =========================================================
   OPEN FAA CERT
========================================================= */

function openFAACert(id){
  window.location.href = "faa-certificates.html?id=" + id;
}
