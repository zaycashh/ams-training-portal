/* =========================================================
   AMS CERTIFICATE PAGE LOADER
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("certificateList");

  const user =
    JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) {
    container.innerHTML = "<p>Please login.</p>";
    return;
  }

  const key = `amsCertificates_${user.email}`;

  const registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  if (!registry.length) {

    container.innerHTML = "<p>No certificates found.</p>";
    return;

  }

  registry.forEach(cert => {

    const card = document.createElement("div");
    card.className = "certificate-card";

    card.innerHTML = `
      <h3>${cert.course || "AMS Training Certificate"}</h3>
      <p><strong>Name:</strong> ${cert.name || user.email}</p>
      <p><strong>Certificate ID:</strong> ${cert.id}</p>
      <p><strong>Date:</strong> ${new Date(cert.date).toLocaleDateString()}</p>
      <div id="qr-${cert.id}"></div>
    `;

    container.appendChild(card);

    generateQR(cert.id, `qr-${cert.id}`);

  });

});
