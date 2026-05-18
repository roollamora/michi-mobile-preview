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

  root.querySelectorAll("input, .donation-forms-betrag-wrap").forEach((el) => {
    el.addEventListener("click", (event) => event.stopPropagation());
    el.addEventListener("mousedown", (event) => event.stopPropagation());
  });

  root.querySelectorAll(".donation-forms-field").forEach((field) => {
    const input = field.querySelector("input");
    if (!input) return;
    field.addEventListener("click", (event) => {
      event.stopPropagation();
      input.focus();
    });
    field.addEventListener("mousedown", (event) => event.stopPropagation());
  });

  root.querySelectorAll(".donation-forms-panel").forEach((panel) => {
    panel.addEventListener("click", (event) => {
      if (
        event.target.closest(
          ".donation-forms-field, .donation-forms-betrag-wrap, input, label"
        )
      ) {
        return;
      }
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
