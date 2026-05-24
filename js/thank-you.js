(function () {
  const CHECKOUT_SESSION_KEY = "michiCheckoutSession";

  const messageEl = document.getElementById("thank-you-message");
  const bankNoticeEl = document.getElementById("thank-you-bank-notice");
  const emailInput = document.getElementById("thank-you-email");
  const subscribeBtn = document.getElementById("thank-you-subscribe");
  const statusEl = document.getElementById("thank-you-status");

  function basePath() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length > 1 && segments[0] === "michi-mobile-preview") {
      return "/" + segments[0];
    }
    return "";
  }

  function homePath() {
    return (basePath() || ".") + "/photoshop-text-preview.html";
  }

  function resolvePath(path) {
    const base = basePath();
    if (path.startsWith("/")) return base + path;
    return (base ? base + "/" : "./") + path.replace(/^\.\//, "");
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatAmount(betrag) {
    const trimmed = String(betrag || "").trim();
    return trimmed ? `${trimmed} €` : "—";
  }

  function buildThankYouMessage(session) {
    const name = [session.name, session.nachname].filter(Boolean).join(" ").trim();
    const greeting = name ? `liebe/r ${name}, ` : "";
    if (session.flow === "paypal") {
      return `${greeting}von ganzem herzen danke ich euch für eure spende über paypal. eure unterstützung bedeutet mir unglaublich viel und hilft mir, den master of public policy an der hertie school zu verwirklichen. ich melde mich, sobald ich eure zahlung sehe — und freue mich darauf, euch in den kommenden monaten von meinem weg zu berichten.`;
    }
    return `${greeting}von ganzem herzen danke ich euch für eure zusage und euer vertrauen. eure unterstützung bedeutet mir unglaublich viel und hilft mir, den master of public policy an der hertie school zu verwirklichen. sobald eure überweisung eingegangen ist, werde ich mich bei euch melden. ich freue mich darauf, euch in den kommenden monaten von meinem studium und meinen erfahrungen zu berichten.`;
  }

  function buildBankNotice(session) {
    const bank = session.bank || {};
    const iban = bank.iban || "DE64 4306 0967 7031 9359 02";
    const copied = session.ibanCopied !== false;
    const copyLine = copied
      ? "DIE IBAN WURDE IN DIE ZWISCHENABLAGE KOPIERT."
      : "BITTE KOPIERT DIE IBAN MANUELL FÜR DIE ÜBERWEISUNG.";
    const amount =
      session.mode === "monatlich" && session.monate
        ? `${formatAmount(session.betrag)} × ${session.monate} MONATE`
        : formatAmount(session.betrag);
    return `
      <p>${copyLine}</p>
      <p>IBAN: ${escapeHtml(iban)}</p>
      <p>KONTOINHABER: ${escapeHtml(bank.holder || "Michael Thomsen")}</p>
      <p>BANK: ${escapeHtml(bank.bank || "GLS-Bank")}</p>
      <p>BETRAG: ${escapeHtml(amount)}</p>
      <p>VERWENDUNGSZWECK: FÖRDERKREIS MICHAEL THOMSEN</p>
    `;
  }

  function showStatus(message, ok) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = "thank-you-status " + (ok ? "ok" : "err");
  }

  async function subscribeNewsletter(email, name) {
    const response = await fetch(resolvePath("/api/newsletter/subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, name, status: "active" }),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "Die Newsletter-Anmeldung ist auf der Live-Seite ohne Server nicht verfügbar. Bitte schreiben Sie an michael.thomsen@uni-wh.de — lokal funktioniert sie mit python3 server.py."
      );
    }
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Anmeldung fehlgeschlagen");
    }
    return data;
  }

  const session = readSession();
  if (!session || !session.flow) {
    window.location.replace(homePath());
    return;
  }

  if (messageEl) {
    messageEl.textContent = buildThankYouMessage(session);
  }

  if (bankNoticeEl && session.flow === "bank") {
    bankNoticeEl.innerHTML = buildBankNotice(session);
    bankNoticeEl.hidden = false;
  }

  if (emailInput && session.email) {
    emailInput.value = session.email;
  }

  subscribeBtn?.addEventListener("click", async () => {
    const email = emailInput?.value.trim().toLowerCase() || "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus("Bitte geben Sie eine gültige E-Mail-Adresse ein.", false);
      return;
    }
    const name = [session.name, session.nachname].filter(Boolean).join(" ").trim();
    subscribeBtn.disabled = true;
    try {
      await subscribeNewsletter(email, name);
      showStatus("Vielen Dank — Sie sind für den Newsletter angemeldet.", true);
    } catch (error) {
      showStatus(error.message, false);
      subscribeBtn.disabled = false;
      return;
    }
    subscribeBtn.disabled = true;
  });

  clearSession();
})();
