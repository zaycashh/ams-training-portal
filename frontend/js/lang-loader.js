async function loadLanguage(module, lang = "en") {
  try {
    const response = await fetch(
      `/frontend/lang/modules/${module}/${lang}.json`
    );
    const data = await response.json();

    document.querySelectorAll("[data-lang]").forEach(el => {
      const keyPath = el.getAttribute("data-lang").split(".");
      let value = data;

      keyPath.forEach(k => {
        if (value) value = value[k];
      });

      if (value) {
        el.textContent = value;
      }
    });

    // Load quiz if available
    if (typeof loadQuiz === "function" && data.quiz) {
      loadQuiz(data);
    }

  } catch (err) {
    console.error("Language load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("languageToggle");
  if (!toggle) return;

  loadLanguage("der", toggle.value || "en");

  toggle.addEventListener("change", (e) => {
    loadLanguage("der", e.target.value);
  });
});
