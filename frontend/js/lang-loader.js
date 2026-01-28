async function loadLanguage(module, lang = "es") {
  try {
    const response = await fetch(
      `/frontend/lang/modules/${module}/${lang}.json`
    );
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
  if (!toggle) return;

  toggle.addEventListener("change", e => {
    loadLanguage("der", e.target.value);
  });
});
