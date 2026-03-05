function generateQR(certId) {

  const url =
    window.location.origin +
    "/ams-training-portal/frontend/pages/verify.html?id=" +
    certId;

  const qr = new QRCode(
    document.getElementById("qrCode"),
    {
      text: url,
      width: 120,
      height: 120
    }
  );
}
