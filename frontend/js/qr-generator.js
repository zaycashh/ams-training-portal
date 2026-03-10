function generateQR(certId) {

  const url =
    window.location.origin +
    "/ams-training-portal/frontend/pages/verify.html?id=" +
    certId;

  const container = document.getElementById("certQR");

  if (!container) return;

  container.innerHTML = "";

  new QRCode(container, {
    text: url,
    width: 120,
    height: 120
  });

}
