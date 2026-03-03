/* =========================================================
   FMCSA DER – PDF CONTENT ENGINE (Supervisor Architecture)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const DER_CONTENT_KEY = "der_fmcsa_content_done";

  const url = "../assets/FMCSA-DER-Drug-Alc-Reg-Training.pdf";

  const pdfContainer = document.getElementById("pdfContainer");
  const completeBtn = document.getElementById("completeContentBtn");

  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");

  const currentPageEl = document.getElementById("currentPage");
  const totalPagesEl = document.getElementById("totalPages");

  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;

  /* =========================================================
     LOAD PDF
  ========================================================= */

  pdfjsLib.getDocument(url).promise.then(pdf => {
    pdfDoc = pdf;
    totalPages = pdf.numPages;

    totalPagesEl.textContent = totalPages;

    renderPage(currentPage);
  });

  /* =========================================================
     RENDER PAGE (Responsive Fit)
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

      currentPageEl.textContent = num;

      // Button logic
      prevBtn.disabled = num === 1;
      nextBtn.disabled = num === totalPages;

      // Unlock complete only on last page
      if (num === totalPages) {
        completeBtn.disabled = false;
      } else {
        completeBtn.disabled = true;
      }
    });
  }

  /* =========================================================
     NAVIGATION BUTTONS
  ========================================================= */

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage(currentPage);
    }
  });

  nextBtn.addEventListener("click", () => {
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

    document.getElementById("contentSection").classList.add("hidden");
    document.getElementById("quizSection").classList.remove("hidden");

  });

  /* =========================================================
     RESTORE PROGRESS
  ========================================================= */

  if (localStorage.getItem(DER_CONTENT_KEY) === "true") {
    document.getElementById("contentSection").classList.add("hidden");
    document.getElementById("quizSection").classList.remove("hidden");
  }

});
