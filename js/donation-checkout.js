(function () {
  const overlay = document.getElementById("donation-checkout-overlay");
  const formsRoot = document.getElementById("layer-donation-forms");
  const ctas = document.querySelectorAll(".donation-forms-panel-cta");
  const summaryEl = document.getElementById("donation-checkout-summary");
  const paypalBtn = document.getElementById("donation-checkout-paypal");
  const submitBtn = document.getElementById("donation-checkout-submit");
  const closeBtn = document.querySelector(".donation-checkout-close");

  if (!overlay || !formsRoot || !ctas.length || !summaryEl) return;

  function getActiveMode() {
    return formsRoot.dataset.active === "monatlich" ? "monatlich" : "jetzt";
  }

  function readForm() {
    const mode = getActiveMode();
    const prefix = mode === "monatlich" ? "donation-monatlich" : "donation-jetzt";
    return {
      mode,
      name: document.getElementById(`${prefix}-name`)?.value.trim() || "",
      nachname: document.getElementById(`${prefix}-nachname`)?.value.trim() || "",
      email: document.getElementById(`${prefix}-email`)?.value.trim() || "",
      betrag: document.getElementById(`${prefix}-betrag`)?.value.trim() || "",
      monate:
        mode === "monatlich"
          ? document.getElementById("donation-monatlich-monate")?.value.trim() || ""
          : "",
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildSummaryHtml(data) {
    const modeLabel =
      data.mode === "jetzt"
        ? "Einmalige Spende (JETZT)"
        : "Monatliche Spende (MONATLICH)";
    const amountLine =
      data.mode === "monatlich" && data.monate
        ? `${escapeHtml(data.betrag || "—")} € × ${escapeHtml(data.monate)} MONAT`
        : `${escapeHtml(data.betrag || "—")} €`;

    return `
      <p style="font-size:17px;color:#ffffff;font-weight:700;">Vielen Dank für Ihre Unterstützung</p>
      <p style="font-size:14px;color:#d9d9d9;margin-bottom:14px;">${escapeHtml(modeLabel)}</p>
      <p style="font-size:14px;color:#fdfdfb;"><strong style="color:#ffffff;">Name:</strong> ${escapeHtml(data.name || "—")} ${escapeHtml(data.nachname || "")}</p>
      <p style="font-size:14px;color:#fdfdfb;"><strong style="color:#ffffff;">E-Mail:</strong> ${escapeHtml(data.email || "—")}</p>
      <p style="font-size:14px;color:#fdfdfb;"><strong style="color:#ffffff;">Betrag:</strong> ${amountLine}</p>
      <p style="font-size:14px;color:#d9d9d9;margin-top:12px;">Mit Ihrer Spende helfen Sie mir, den Master of Public Policy an der Hertie School zu finanzieren.</p>
    `;
  }

  function openCheckout() {
    const data = readForm();
    summaryEl.innerHTML = buildSummaryHtml(data);
    paypalBtn.hidden = data.mode !== "jetzt";
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("checkout-open");
    closeBtn?.focus();
  }

  function closeCheckout() {
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("checkout-open");
  }

  ctas.forEach((cta) => {
    cta.addEventListener("click", (event) => {
      event.stopPropagation();
      const mode = cta.getAttribute("data-panel-cta");
      if (mode === "jetzt" || mode === "monatlich") {
        formsRoot.dataset.active = mode;
      }
      openCheckout();
    });
  });

  closeBtn?.addEventListener("click", closeCheckout);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeCheckout();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeCheckout();
  });

  submitBtn?.addEventListener("click", closeCheckout);
  paypalBtn?.addEventListener("click", closeCheckout);
})();
