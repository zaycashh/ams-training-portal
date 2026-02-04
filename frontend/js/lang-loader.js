async function loadLanguage(module, lang = "en") {
  try {
    const response = await fetch(
      `/ams-training-portal/frontend/lang/modules/${module}/${lang}.json`
    );

    if (!response.ok) {
      throw new Error("Language file not found");
    }

    const data = await response.json();

    document.querySelectorAll("[data-lang]").forEach(el => {
      const key = el.getAttribute("data-lang");
      if (data[key]) {
        el.textContent = data[key];
      }
    });

    console.log(`Loaded language: ${module} / ${lang}`);
  } catch (err) {
    console.error("Language load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const module = document.body.dataset.module; // 🔥 THIS FIXES EVERYTHING
  const toggle = document.getElementById("languageToggle");
  const initialLang = toggle?.value || "en";

  if (!module) {
    console.error("Missing data-module on body");
    return;
  }

  loadLanguage(module, initialLang);

  if (toggle) {
    toggle.addEventListener("change", e => {
      loadLanguage(module, e.target.value);
    });
  }
});

