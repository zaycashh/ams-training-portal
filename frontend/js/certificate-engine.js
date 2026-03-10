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
   STORE CERTIFICATE (PER USER)
========================================================= */

function registerCertificate(data) {

  const user =
    JSON.parse(localStorage.getItem("amsUser") || "null");

  if(!user) return;

  const key = `amsCertificates_${user.email}`;

  const registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  registry.push(data);

  localStorage.setItem(
    key,
    JSON.stringify(registry)
  );
}

/* =========================================================
   GET CERTIFICATE (PER USER)
========================================================= */

function getCertificate(certId) {

  const user =
    JSON.parse(localStorage.getItem("amsUser") || "null");

  if(!user) return null;

  const key = `amsCertificates_${user.email}`;

  const registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  return registry.find(c => c.id === certId);
}
