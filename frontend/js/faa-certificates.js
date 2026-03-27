/* =========================================================
   FAA CERTIFICATE PAGE LOADER (CLEAN)
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

  /* 🔥 FILTER FAA ONLY */
  const faaCerts = registry.filter(cert =>
    cert.course && cert.course.includes("FAA")
  );

  if (!faaCerts.length) {
    container.innerHTML = "<p>No FAA certificates found.</p>";
    return;
  }

  faaCerts.forEach(cert => {

    const card = document.createElement("div");
    card.className = "certificate-card";

    card.innerHTML = `
      <h3>${cert.course}</h3>
      <p><strong>Name:</strong> ${cert.name || user.email}</p>
      <p><strong>Certificate ID:</strong> ${cert.id}</p>
      <p><strong>Date:</strong> ${new Date(cert.date).toLocaleDateString()}</p>
      <div id="qr-${cert.id}"></div>
    `;

    container.appendChild(card);

    generateQR(cert.id, `qr-${cert.id}`);

  });

});
