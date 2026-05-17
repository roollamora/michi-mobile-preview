(function () {
  const root = document.getElementById("layer-donation-forms");
  if (!root) return;

  const jetztTab = root.querySelector(
    ".donation-forms-jetzt .donation-forms-tab"
  );
  const monatlichTab = root.querySelector(
    ".donation-forms-monatlich .donation-forms-tab"
  );

  function setActive(mode) {
    if (mode !== "jetzt" && mode !== "monatlich") return;
    if (root.dataset.active === mode) return;
    root.dataset.active = mode;
    if (jetztTab) {
      jetztTab.setAttribute("aria-expanded", mode === "jetzt" ? "true" : "false");
    }
    if (monatlichTab) {
      monatlichTab.setAttribute(
        "aria-expanded",
        mode === "monatlich" ? "true" : "false"
      );
    }
  }

  root.querySelectorAll(".donation-forms-panel").forEach((panel) => {
    panel.addEventListener("click", (event) => {
      if (event.target.closest(".donation-forms-field")) return;
      const mode = panel.getAttribute("data-panel");
      if (mode) setActive(mode);
    });
  });

  jetztTab?.addEventListener("click", (event) => {
    event.stopPropagation();
    setActive("jetzt");
  });
  monatlichTab?.addEventListener("click", (event) => {
    event.stopPropagation();
    setActive("monatlich");
  });
})();
