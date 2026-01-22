function showSection(section) {
  document.getElementById("contentSection").classList.add("hidden");
  document.getElementById("quizSection").classList.add("hidden");
  document.getElementById("certificateSection").classList.add("hidden");

  if (section === "content") {
    document.getElementById("contentSection").classList.remove("hidden");
  }

  if (section === "quiz") {
    document.getElementById("quizSection").classList.remove("hidden");
  }

  if (section === "certificate") {
    document.getElementById("certificateSection").classList.remove("hidden");
  }
}

function goDashboard() {
  window.location.href = "dashboard.html";
}

document.getElementById("languageToggle").addEventListener("change", (e) => {
  const lang = e.target.value;
  alert("Language switched to: " + (lang === "en" ? "English" : "Spanish"));
});
