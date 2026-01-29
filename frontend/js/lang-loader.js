async function loadLanguage(module, lang = "en") {
  try {
    const response = await fetch(
      `/frontend/lang/modules/${module}/${lang}.json`
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

  } catch (err) {
    console.error("Language load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("languageToggle");

  const initialLang = toggle?.value || "en";

  // Load DER language on page load
  loadLanguage("der", initialLang);

  // Handle language switch
  if (toggle) {
    toggle.addEventListener("change", e => {
      loadLanguage("der", e.target.value);
    });
  }
});
