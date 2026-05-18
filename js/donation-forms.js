(function () {
  const root = document.getElementById("layer-donation-forms");
  if (!root) return;

  const jetztTab = root.querySelector(
    ".donation-forms-jetzt .donation-forms-tab"
  );
  const monatlichTab = root.querySelector(
    ".donation-forms-monatlich .donation-forms-tab"
  );

  function sanitizeBetragValue(value) {
    let cleaned = String(value).replace(/[^\d.,]/g, "");
    if (!cleaned) return "";

    const sepIndex = cleaned.search(/[.,]/);
    if (sepIndex === -1) {
      return cleaned.replace(/[.,]/g, "");
    }

    const sep = cleaned[sepIndex];
    const intPart = cleaned.slice(0, sepIndex).replace(/[.,]/g, "");
    const decPart = cleaned
      .slice(sepIndex + 1)
      .replace(/[.,]/g, "")
      .slice(0, 2);

    if (cleaned.endsWith(sep) && !decPart) {
      return `${intPart}${sep}`;
    }
    return decPart ? `${intPart}${sep}${decPart}` : intPart;
  }

  function attachBetragInput(input) {
    input.addEventListener("input", () => {
      const cursor = input.selectionStart ?? input.value.length;
      const next = sanitizeBetragValue(input.value);
      if (input.value === next) return;
      input.value = next;
      const pos = Math.min(cursor, next.length);
      input.setSelectionRange(pos, pos);
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      const clip = event.clipboardData?.getData("text") ?? "";
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const merged = input.value.slice(0, start) + clip + input.value.slice(end);
      input.value = sanitizeBetragValue(merged);
      const pos = input.value.length;
      input.setSelectionRange(pos, pos);
    });
  }

  root.querySelectorAll('input[name="betrag"]').forEach(attachBetragInput);

  function sanitizeNaturalNumber(value) {
    let digits = String(value).replace(/\D/g, "");
    if (!digits) return "";
    digits = digits.replace(/^0+/, "");
    return digits;
  }

  function attachNaturalNumberInput(input) {
    input.addEventListener("input", () => {
      const cursor = input.selectionStart ?? input.value.length;
      const next = sanitizeNaturalNumber(input.value);
      if (input.value === next) return;
      input.value = next;
      const pos = Math.min(cursor, next.length);
      input.setSelectionRange(pos, pos);
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();
      const clip = event.clipboardData?.getData("text") ?? "";
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const merged = input.value.slice(0, start) + clip + input.value.slice(end);
      input.value = sanitizeNaturalNumber(merged);
      const pos = input.value.length;
      input.setSelectionRange(pos, pos);
    });
  }

  root.querySelectorAll('input[name="monate"]').forEach(attachNaturalNumberInput);

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

  root.querySelectorAll(".donation-forms-panel-cta").forEach((cta) => {
    cta.addEventListener("click", (event) => event.stopPropagation());
    cta.addEventListener("mousedown", (event) => event.stopPropagation());
  });

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
          ".donation-forms-field, .donation-forms-betrag-wrap, .donation-forms-panel-cta, input, label"
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
