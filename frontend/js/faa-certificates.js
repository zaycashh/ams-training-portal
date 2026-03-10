/* =========================================================
   AMS CERTIFICATE PAGE LOADER
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("certificateList");

  const registry =
    JSON.parse(localStorage.getItem("amsCertificates") || "[]");

  if (!registry.length) {

    container.innerHTML = "<p>No certificates found.</p>";
    return;

  }

  registry.forEach(cert => {

    const card = document.createElement("div");
    card.className = "certificate-card";

    card.innerHTML = `
      <h3>${cert.course}</h3>
      <p><strong>Name:</strong> ${cert.name}</p>
      <p><strong>Certificate ID:</strong> ${cert.id}</p>
      <p><strong>Date:</strong> ${new Date(cert.date).toLocaleDateString()}</p>
    `;

    container.appendChild(card);

  });

});
