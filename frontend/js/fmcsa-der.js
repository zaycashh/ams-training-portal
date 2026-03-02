/* =========================================================
   FMCSA DER – PDF CONTENT ENGINE
========================================================= */

const DER_CONTENT_KEY = "fmcsaDerContentCompleted";

// 👉 Make sure your PDF exists in this path
https://zaycashh.github.io/ams-training-portal/frontend/assets/FMSCA-DER-Drug-Alc-Reg-Training.pdf

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

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const viewport = page.getViewport({ scale: 1.3 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    page.render({
      canvasContext: context,
      viewport: viewport
    });

    pdfContainer.innerHTML = "";
    pdfContainer.appendChild(canvas);

    // Enable complete button only on last page
    if (num === totalPages) {
      completeBtn.disabled = false;
    }
  });
}

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
