/* ========================================================
   AMS CERTIFICATE ENGINE (FINAL CLEAN VERSION)
========================================================= */

/* ========================================================
   GENERATE CERTIFICATE ID (SAFE)
========================================================= */

function generateCertificateId(prefix = "AMS") {

  const random = Math.random()
    .toString(16)
    .substring(2, 10)
    .toUpperCase();

  const ts = Date.now().toString(36).toUpperCase();

  return `${prefix}-CERT-${ts}-${random}`;
}


/* =========================================================
   STORE CERTIFICATE (PER USER)
========================================================= */

function registerCertificate(data) {

  const user =
    JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) return;

  const key = `amsCertificates_${user.email}`;

  let registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  const exists = registry.find(c => c.id === data.id);

  if (!exists) {

    data.email = user.email;

    registry.push(data);

    localStorage.setItem(
      key,
      JSON.stringify(registry)
    );
  }
}


/* =========================================================
   GET CERTIFICATE
========================================================= */

function getCertificate(certId) {

  const user =
    JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) return null;

  const key = `amsCertificates_${user.email}`;

  const registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  return registry.find(c => c.id === certId);
}


/* ========================================================
   HELPER — NAME FORMAT
========================================================= */

function getUserName(user) {
  return (
    user.fullName ||
    ((user.firstName || "") + " " + (user.lastName || "")).trim() ||
    user.email ||
    "User"
  );
}


/* ========================================================
   GENERATE SUPERVISOR CERTIFICATE
======================================================== */

function generateSupervisorCertificate() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) {
    alert("User not found");
    return;
  }

  const name = getUserName(user);

  let certId =
    localStorage.getItem(`fmcsaModuleACertificateId_${user.email}`);

  if (!certId) {
    certId = generateCertificateId("AMS-FMCSA");

    localStorage.setItem(
      `fmcsaModuleACertificateId_${user.email}`,
      certId
    );
  }

  registerCertificate({
    id: certId,
    name: name,
    course: "FMCSA Supervisor Reasonable Suspicion Training",
    type: "fmcsa_supervisor",
    date: Date.now(),
    displayDate: new Date().toLocaleDateString("en-US")
  });
}


/* ========================================================
   GENERATE DER CERTIFICATE
======================================================== */

function generateDerCertificate() {

  const user = JSON.parse(localStorage.getItem("amsUser") || "null");

  if (!user) {
    alert("User not found");
    return;
  }

  const name = getUserName(user);

  let certId =
    localStorage.getItem(`derFmcsaCertificateId_${user.email}`);

  if (!certId) {

    certId = generateCertificateId("AMS-FMCSA-DER");

    localStorage.setItem(
      `derFmcsaCertificateId_${user.email}`,
      certId
    );
  }

  registerCertificate({
    id: certId,
    name: name,
    course: "FMCSA Designated Employer Representative Training",
    type: "fmcsa_der",
    date: Date.now(),
    displayDate: new Date().toLocaleDateString("en-US")
  });
}
