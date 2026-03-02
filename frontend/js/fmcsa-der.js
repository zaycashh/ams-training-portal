/* =========================================================
   FMCSA DER – PDF CONTENT ENGINE
========================================================= */

const DER_CONTENT_KEY = "fmcsaDerContentCompleted";

const url = "../assets/FMCSA-DER-Drug-Alc-Reg-Training.pdf";

const pdfContainer = document.getElementById("pdfContainer");
const completeBtn = document.getElementById("completeContentBtn");

let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

/* =========================================================
   LOAD PDF
========================================================= */

pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  totalPages = pdf.numPages;
  renderPage(currentPage);
});

/* =========================================================
   RENDER PAGE
========================================================= */

function renderPage(num) {

  pdfDoc.getPage(num).then(page => {

    const containerWidth = pdfContainer.clientWidth;

    const viewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    pdfContainer.innerHTML = "";
    pdfContainer.appendChild(canvas);

    page.render({
      canvasContext: context,
      viewport: scaledViewport
    });

    // Enable complete button only on last page
    if (num === totalPages) {
      completeBtn.disabled = false;
    }
  });

/* =========================================================
   CLICK TO ADVANCE SLIDES
========================================================= */

pdfContainer.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    renderPage(currentPage);
  }
});

/* =========================================================
   COMPLETE CONTENT
========================================================= */

completeBtn.addEventListener("click", () => {

  localStorage.setItem(DER_CONTENT_KEY, "true");

  alert("Content completed. Quiz unlocked.");

  document.getElementById("quizSection").classList.remove("hidden");

});
