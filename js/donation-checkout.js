(function () {
  const CHECKOUT_SESSION_KEY = "michiCheckoutSession";
  const overlay = document.getElementById("donation-checkout-overlay");
  const formsRoot = document.getElementById("layer-donation-forms");
  const ctas = document.querySelectorAll(".donation-forms-panel-cta");
  const leftContentEl = document.getElementById("donation-checkout-left-content");
  const pledgeEl = document.getElementById("donation-checkout-pledge");
  const checkoutErrorsEl = document.getElementById("donation-checkout-errors");
  const paypalBtn = document.getElementById("donation-checkout-paypal");
  const submitBtn = document.getElementById("donation-checkout-submit");
  const closeBtn = document.querySelector(".donation-checkout-close");

  const RECIPIENT = "Michael Thomsen";
  const PAYPAL_ME_BASE = "https://www.paypal.com/paypalme/ThomsenGoesBerlin/";
  const BANK = {
    iban: "DE64 4306 0967 7031 9359 02",
    holder: "Michael Thomsen",
    bank: "GLS-Bank",
  };
  const FUNDING_START = "01.07.2026";
  const FUNDING_END = "30.06.2028";

  const FIELD_IDS = {
    jetzt: {
      name: "donation-jetzt-name",
      nachname: "donation-jetzt-nachname",
      email: "donation-jetzt-email",
      betrag: "donation-jetzt-betrag",
    },
    monatlich: {
      name: "donation-monatlich-name",
      nachname: "donation-monatlich-nachname",
      email: "donation-monatlich-email",
      betrag: "donation-monatlich-betrag",
      monate: "donation-monatlich-monate",
    },
  };

  const FIELD_LABELS = {
    name: "Name",
    nachname: "Nachname",
    email: "E-Mail",
    betrag: "Betrag",
    monate: "Anzahl Monate",
  };

  const ERROR_ORDER = ["name", "nachname", "email", "betrag", "monate"];

  if (!overlay || !formsRoot || !ctas.length) return;

  if (overlay.parentElement !== document.body) {
    document.body.appendChild(overlay);
  }

  function getActiveMode() {
    return formsRoot.dataset.active === "monatlich" ? "monatlich" : "jetzt";
  }

  function readForm(modeOverride) {
    const mode = modeOverride || getActiveMode();
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

  function formatAmountDisplay(betrag) {
    const trimmed = String(betrag || "").trim();
    return trimmed ? `${trimmed} €` : "—";
  }

  function paypalAmount(betrag) {
    const normalized = String(betrag || "")
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".");
    if (!normalized) return "";
    const value = Number.parseFloat(normalized);
    if (!Number.isFinite(value) || value <= 0) return "";
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  function validateForm(data) {
    const errors = {};
    if (!data.name) errors.name = true;
    if (!data.nachname) errors.nachname = true;
    if (!data.email) errors.email = true;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = true;
    }
    if (!data.betrag) errors.betrag = true;
    else if (!paypalAmount(data.betrag)) errors.betrag = true;
    if (data.mode === "monatlich" && !data.monate) {
      errors.monate = true;
    }
    return errors;
  }

  function formatFieldList(labels) {
    if (!labels.length) return "";
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
    return `${labels.slice(0, -1).join(", ")} & ${labels[labels.length - 1]}`;
  }

  function buildErrorMessage(errors) {
    const labels = ERROR_ORDER.filter((key) => errors[key]).map((key) => FIELD_LABELS[key]);
    if (!labels.length) return "";
    return `Bitte ausfüllen: ${formatFieldList(labels)}`;
  }

  function formSummaryErrorEl(mode) {
    return document.getElementById(`donation-${mode}-form-error`);
  }

  function markFieldInvalid(inputId, invalid) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const monateField = input.closest(".donation-forms-field--monate");
    const wrap =
      input.closest(".donation-forms-field") ||
      input.closest(".donation-forms-betrag-wrap");
    const target = monateField || wrap;
    if (!target) return;
    target.classList.toggle("is-invalid", invalid);
  }

  function clearFieldError(inputId) {
    markFieldInvalid(inputId, false);
  }

  function clearFormErrors(mode) {
    const ids = FIELD_IDS[mode] || {};
    Object.values(ids).forEach((inputId) => clearFieldError(inputId));
    const summary = formSummaryErrorEl(mode);
    if (summary) {
      summary.hidden = true;
      summary.textContent = "";
    }
  }

  function showFormErrors(mode, errors) {
    clearFormErrors(mode);
    const map = FIELD_IDS[mode] || {};
    Object.keys(errors).forEach((key) => {
      const inputId = map[key];
      if (inputId) markFieldInvalid(inputId, true);
    });
    const message = buildErrorMessage(errors);
    const summary = formSummaryErrorEl(mode);
    if (summary && message) {
      summary.hidden = false;
      summary.textContent = message;
    }
  }

  function showCheckoutErrors(errors) {
    if (!checkoutErrorsEl) return;
    const message = buildErrorMessage(errors);
    if (!message) {
      checkoutErrorsEl.hidden = true;
      checkoutErrorsEl.textContent = "";
      return;
    }
    checkoutErrorsEl.hidden = false;
    checkoutErrorsEl.textContent = message;
  }

  function clearCheckoutErrors() {
    if (checkoutErrorsEl) {
      checkoutErrorsEl.hidden = true;
      checkoutErrorsEl.textContent = "";
    }
  }

  function attachInputClear(mode) {
    const ids = FIELD_IDS[mode] || {};
    Object.entries(ids).forEach(([key, inputId]) => {
      const input = document.getElementById(inputId);
      if (!input || input.dataset.checkoutClearBound) return;
      input.dataset.checkoutClearBound = "1";
      input.addEventListener("input", () => {
        const data = readForm(mode);
        const remaining = validateForm(data);
        showFormErrors(mode, remaining);
        if (checkoutErrorsEl && !overlay.hidden) {
          if (!Object.keys(remaining).length) clearCheckoutErrors();
          else showCheckoutErrors(remaining);
        }
      });
    });
  }

  attachInputClear("jetzt");
  attachInputClear("monatlich");

  function buildLeftColumnHtml() {
    return `
      <p>Es handelt sich hierbei um eine private Spende, die nicht gemeinnützig ist. Daher kann sie nicht steuerlich abgesetzt werden.</p>
      <p>Bitte tragt euch nur dann ein, wenn ihr euch sicher seid, dass ihr das Geld zahlen möchtet und könnt und ich mit euren angegebenen Zahlungen tatsächlich rechnen kann. Sollte sich etwas an eurer Situation ändern und ihr die monatlichen Zahlungen beenden müssen, schreibt mir bitte eine E-Mail, damit ich Bescheid weiß.</p>
      <p>Vielen lieben Dank euch!</p>
      <p><strong style="color:#ffffff;">Daten für die monatliche Unterstützung:</strong></p>
      <div class="donation-checkout-dates">
        <div><span>Förderbeginn:</span><span>${FUNDING_START}</span></div>
        <div><span>Förderende:</span><span>${FUNDING_END}</span></div>
      </div>
      <hr class="donation-checkout-separator" />
      <div class="donation-checkout-bank">
        <p><strong>IBAN:</strong> ${escapeHtml(BANK.iban)}</p>
        <p><strong>Kontoinhaber:</strong> ${escapeHtml(BANK.holder)}</p>
        <p><strong>Bank:</strong> ${escapeHtml(BANK.bank)}</p>
      </div>
    `;
  }

  function buildPledgeText(data) {
    const fullName = [data.name, data.nachname].filter(Boolean).join(" ").trim() || "—";
    const amount = formatAmountDisplay(data.betrag);
    if (data.mode === "monatlich" && data.monate) {
      const months = escapeHtml(data.monate);
      return `Ich, ${escapeHtml(fullName)}, verpflichte mich, monatlich ${escapeHtml(amount)} für ${months} Monate an ${escapeHtml(RECIPIENT)} zu überweisen, um sein Studium zu finanzieren, und ihn so bald wie möglich zu informieren, falls ich diese Unterstützung aus einem beliebigen Grund nicht wie vorgesehen durchführen kann.`;
    }
    return `Ich, ${escapeHtml(fullName)}, verpflichte mich, ${escapeHtml(amount)} an ${escapeHtml(RECIPIENT)} zu überweisen, um sein Studium zu finanzieren, und ihn so bald wie möglich zu informieren, falls ich diese Unterstützung aus einem beliebigen Grund nicht wie vorgesehen durchführen kann.`;
  }

  function thankYouPath() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const base =
      segments.length > 0 && segments[0] === "michi-mobile-preview"
        ? "/michi-mobile-preview"
        : "";
    return `${base}/danke.html`;
  }

  function saveCheckoutSession(flow, data, extra = {}) {
    const payload = {
      flow,
      savedAt: Date.now(),
      ...data,
      ...extra,
      bank: BANK,
    };
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(payload));
  }

  async function copyIban() {
    const plain = BANK.iban.replace(/\s/g, "");
    try {
      await navigator.clipboard.writeText(plain);
      return true;
    } catch (_) {
      try {
        const helper = document.createElement("textarea");
        helper.value = plain;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(helper);
        return ok;
      } catch (__) {
        return false;
      }
    }
  }

  function openCheckout(modeOverride) {
    const mode = modeOverride || getActiveMode();
    const data = readForm(mode);
    const errors = validateForm(data);
    if (Object.keys(errors).length) {
      showFormErrors(mode, errors);
      const firstKey = FIELD_IDS[mode][Object.keys(errors)[0]];
      document.getElementById(firstKey)?.focus({ preventScroll: true });
      return false;
    }

    clearFormErrors(mode);
    clearCheckoutErrors();
    if (leftContentEl) leftContentEl.innerHTML = buildLeftColumnHtml();
    if (pledgeEl) pledgeEl.innerHTML = buildPledgeText(data);
    if (paypalBtn) paypalBtn.hidden = data.mode !== "jetzt";
    overlay.removeAttribute("hidden");
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
    document.body.classList.add("checkout-open");
    window.requestAnimationFrame(() => {
      const focusTarget = pledgeEl || closeBtn;
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus({ preventScroll: true });
      }
    });
    return true;
  }

  function closeCheckout() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("checkout-open");
    clearCheckoutErrors();
  }

  ctas.forEach((cta) => {
    cta.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const mode = cta.getAttribute("data-panel-cta");
      if (mode === "jetzt" || mode === "monatlich") {
        formsRoot.dataset.active = mode;
      }
      openCheckout(mode === "jetzt" || mode === "monatlich" ? mode : undefined);
    });
  });

  closeBtn?.addEventListener("click", closeCheckout);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeCheckout();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeCheckout();
  });

  submitBtn?.addEventListener("click", async () => {
    const data = readForm();
    const errors = validateForm(data);
    if (Object.keys(errors).length) {
      showFormErrors(data.mode, errors);
      showCheckoutErrors(errors);
      return;
    }
    clearFormErrors(data.mode);
    clearCheckoutErrors();
    const copied = await copyIban();
    saveCheckoutSession("bank", data, { ibanCopied: copied });
    closeCheckout();
    window.location.href = thankYouPath();
  });

  paypalBtn?.addEventListener("click", () => {
    const data = readForm();
    const errors = validateForm(data);
    if (Object.keys(errors).length) {
      showFormErrors(data.mode, errors);
      showCheckoutErrors(errors);
      return;
    }
    clearFormErrors(data.mode);
    clearCheckoutErrors();
    const amount = paypalAmount(data.betrag);
    if (!amount) {
      const betragOnly = { betrag: true };
      showFormErrors(data.mode, betragOnly);
      showCheckoutErrors(betragOnly);
      return;
    }
    saveCheckoutSession("paypal", data);
    closeCheckout();
    const paypalUrl = PAYPAL_ME_BASE + encodeURIComponent(amount);
    window.open(paypalUrl, "_blank", "noopener,noreferrer");
    window.location.href = thankYouPath();
  });
})();
