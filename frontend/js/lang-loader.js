async function loadLanguage(lang = "en") {
  try {
    const module = document.body.dataset.module;

    if (!module) {
      console.error("❌ data-module missing on <body>");
      return;
    }

    const response = await fetch(
      `/ams-training-portal/frontend/lang/modules/${module}/${lang}.json`
    );

    if (!response.ok) {
      throw new Error(`Language file not found: ${module}/${lang}`);
    }

    const data = await response.json();

    document.querySelectorAll("[data-lang]").forEach(el => {
      const key = el.getAttribute("data-lang");
      if (data[key]) {
        el.textContent = data[key];
      }
    });

    console.log(`🌐 Loaded language: ${module} / ${lang}`);
  } catch (err) {
    console.error("Language load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("languageToggle");
  const initialLang = toggle?.value || "en";

  loadLanguage(initialLang);

  toggle?.addEventListener("change", e => {
    loadLanguage(e.target.value);
  });
});
