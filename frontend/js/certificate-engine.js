/* ========================================================
   AMS CERTIFICATE ENGINE
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

  let registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  const exists = registry.find(c => c.id === data.id);

  if (!exists) {

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

  if(!user) return null;

  const key = `amsCertificates_${user.email}`;

  const registry =
    JSON.parse(localStorage.getItem(key) || "[]");

  return registry.find(c => c.id === certId);

}
/* ========================================================
   GENERATE SUPERVISOR CERTIFICATE
======================================================== */

function generateSupervisorCertificate(){

const user = JSON.parse(localStorage.getItem("amsUser") || "null");

if(!user){
alert("User not found");
return;
}

const name = user.name || "Student";

const date = new Date().toLocaleDateString("en-US",{
year:"numeric",
month:"long",
day:"numeric"
});

let certId = localStorage.getItem("fmcsaModuleACertificateId");

if(!certId){
certId = generateCertificateId("AMS-FMCSA");
localStorage.setItem("fmcsaModuleACertificateId",certId);
}

registerCertificate({
id: certId,
name: name,
course: "FMCSA Supervisor Reasonable Suspicion Training",
date: Date.now()
});

}
