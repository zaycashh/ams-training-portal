/* ========================================================
   AMS CERTIFICATE ENGINE
   Generates secure certificate IDs and registry
========================================================= */

function generateCertificateId(prefix = "AMS") {

  const random = Math.random()
    .toString(16)
    .substring(2, 10)
    .toUpperCase();

  return `${prefix}-CERT-${random}`;
}

/* =========================================================
   STORE CERTIFICATE
========================================================= */

function registerCertificate(data) {

  const registry =
    JSON.parse(localStorage.getItem("amsCertificates") || "[]");

  registry.push(data);

  localStorage.setItem(
    "amsCertificates",
    JSON.stringify(registry)
  );
}

/* =========================================================
   GET CERTIFICATE
========================================================= */

function getCertificate(certId) {

  const registry =
    JSON.parse(localStorage.getItem("amsCertificates") || "[]");

  return registry.find(c => c.id === certId);
}
