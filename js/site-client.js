(function () {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let BAR_LEFT = 109;
  let BAR_TOP = 478;
  let BAR_HEIGHT = 27;
  let TRACK_INNER_WIDTH = 423;
  let MARKER_OFFSET = 12;
  let lastDonations = null;
  let layoutMarkerTop = null;
  let layoutAmountTop = null;
  let lastSiteData = null;

  function formatAmount(value) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Number(value) || 0
    );
  }

  function applyDonations(donations) {
    lastDonations = donations;
    const target = Math.max(1, Number(donations.target) || 1);
    const collected = Math.max(0, Number(donations.collected) || 0);
    const pending = Math.max(0, Number(donations.pending) || 0);

    const fillEl = document.getElementById("progressFill");
    const pendingEl = document.getElementById("progressPending");
    const triangleEl = document.getElementById("progressMarkerTriangle");
    const amountEl = document.getElementById("donationAmount");
    const goalEl = document.getElementById("goalAmount");
    const frameEl = document.getElementById("progressFrame");

    const innerLeft = BAR_LEFT;
    const innerTop = BAR_TOP;
    const frameInnerHeight = Math.max(1, BAR_HEIGHT || 27);
    const markerOffset = Math.max(1, MARKER_OFFSET || 12);
    const innerWidth = Math.max(
      0,
      TRACK_INNER_WIDTH || (frameEl ? frameEl.clientWidth : 423)
    );

    const collectedWidth = Math.min(
      innerWidth,
      Math.round((collected / target) * innerWidth)
    );
    const pendingWidth = Math.min(
      innerWidth - collectedWidth,
      Math.round((pending / target) * innerWidth)
    );
    const collectedRight = innerLeft + collectedWidth;
    const pendingLeft = collectedRight;

    if (fillEl) {
      fillEl.style.left = innerLeft + "px";
      fillEl.style.top = innerTop + "px";
      fillEl.style.width = collectedWidth + "px";
      fillEl.style.height = frameInnerHeight + "px";
    }
    if (pendingEl) {
      pendingEl.style.top = innerTop + "px";
      pendingEl.style.left = pendingLeft + "px";
      pendingEl.style.width = pendingWidth + "px";
      pendingEl.style.height = frameInnerHeight + "px";
      pendingEl.style.display = pendingWidth > 0 ? "block" : "none";
      const pulseOn = pendingWidth > 0 && !prefersReducedMotion;
      pendingEl.classList.toggle("progress-loan-pulse", pulseOn);
    }
    if (triangleEl) {
      triangleEl.style.left = collectedRight + "px";
      if (layoutMarkerTop == null) {
        triangleEl.style.top = BAR_TOP + frameInnerHeight + markerOffset + "px";
      }
    }
    if (amountEl) {
      amountEl.style.left = collectedRight + "px";
    }
    if (amountEl) amountEl.textContent = formatAmount(collected);
    if (goalEl) goalEl.textContent = formatAmount(target) + "€";
    applyMilestones(donations, target, innerLeft, innerTop, innerWidth);
  }

  function applyMilestones(donations, target, innerLeft, innerTop, innerWidth) {
    const datesWrap = document.getElementById("milestoneDates");
    const amountsWrap = document.getElementById("milestoneAmounts");
    if (!datesWrap || !amountsWrap) return;
    const milestones = Array.isArray(donations.milestones) ? donations.milestones : [];
    datesWrap.innerHTML = "";
    amountsWrap.innerHTML = "";
    let prevAmount = 0;
    milestones.forEach((milestone) => {
      const amount = Math.max(0, Number(milestone.amount) || 0);
      const ratio = Math.max(0, Math.min(1, target > 0 ? amount / target : 0));
      const x = innerLeft + innerWidth * ratio;

      const dateEl = document.createElement("div");
      dateEl.className = "date-label";
      dateEl.textContent = milestone.date || "";
      dateEl.style.position = "absolute";
      dateEl.style.left = `${x}px`;
      dateEl.style.top = `${innerTop - 25}px`;
      dateEl.style.transform = "translateX(-100%)";
      datesWrap.appendChild(dateEl);

      const amountEl = document.createElement("div");
      amountEl.className = "add-label";
      const delta = Math.max(0, amount - prevAmount);
      amountEl.textContent = prevAmount === 0 ? `${formatAmount(amount)}€` : `+${formatAmount(delta)}€`;
      amountEl.style.position = "absolute";
      amountEl.style.left = `${x}px`;
      amountEl.style.top = `${innerTop + 4}px`;
      amountEl.style.transform = "translateX(-100%)";
      amountsWrap.appendChild(amountEl);
      prevAmount = amount;
    });
  }

  function applyStatusUpdates(updates) {
    const el = document.getElementById("layer-status");
    if (!el || !Array.isArray(updates) || updates.length === 0) return;
    const html = updates
      .map(
        (item) =>
          `<strong style="color:#4c4c4c;font-weight:500;">Status Update(${item.date || ""}):</strong> ${item.text || ""}<br>`
      )
      .join("");
    el.innerHTML = html;
  }

  function applySettings(settings) {
    const cta = document.getElementById("ctaText");
    const readMore = document.getElementById("readMoreText");
    const goalEl = document.getElementById("goalAmount");
    if (cta && settings.ctaText) {
      cta.innerHTML = settings.ctaText + "<br/>";
    }
    if (readMore && settings.readMoreText) {
      readMore.textContent = settings.readMoreText;
    }
    if (goalEl && settings.goalDisplay) {
      goalEl.textContent = settings.goalDisplay;
    }
  }

  function applyContent(content) {
    if (!content || typeof content !== "object") return;
    const greeting = document.getElementById("layer-greeting");
    const intro = document.getElementById("layer-intro");
    const heroTitle = document.getElementById("hero-title");
    const articleInner = document.getElementById("article-scroll-inner");
    if (greeting && content.greetingHtml) greeting.innerHTML = content.greetingHtml;
    if (intro && content.introHtml) intro.innerHTML = content.introHtml;
    if (heroTitle && content.heroTitleHtml) heroTitle.innerHTML = content.heroTitleHtml;
    if (articleInner && content.articleHtml) articleInner.innerHTML = content.articleHtml;
  }

  function basePath() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length > 1 && segments[0] === "michi-mobile-preview") {
      return "/" + segments[0];
    }
    return "";
  }

  function resolvePath(path) {
    if (path.startsWith("http")) return path;
    const base = basePath();
    if (path.startsWith("/")) return base + path;
    return (base ? base + "/" : "./") + path.replace(/^\.\//, "");
  }

  async function loadSiteData() {
    if (window.MICHI_SITE_DATA && typeof window.MICHI_SITE_DATA === "object") {
      return window.MICHI_SITE_DATA;
    }
    try {
      const apiResponse = await fetch(resolvePath("/api/site"), { cache: "no-store" });
      if (apiResponse.ok) {
        const contentType = apiResponse.headers.get("content-type") || "";
        if (contentType.includes("application/json")) return apiResponse.json();
      }
    } catch (_) {}
    const staticResponse = await fetch(resolvePath("./data/site-data.json"), {
      cache: "no-store",
    });
    if (!staticResponse.ok) throw new Error("Could not load site data");
    return staticResponse.json();
  }

  async function refreshPublicPage() {
    const data = await loadSiteData();
    lastSiteData = data;
    applyDonations(data.donations);
    applySettings(data.settings || {});
    applyContent(data.content || {});
    applyStatusUpdates(data.statusUpdates || []);
    return data;
  }

  function setProgressLayout(layout) {
    if (layout.barLeft != null) BAR_LEFT = layout.barLeft;
    if (layout.barTop != null) BAR_TOP = layout.barTop;
    if (layout.barHeight != null) BAR_HEIGHT = layout.barHeight;
    if (layout.innerWidth != null) TRACK_INNER_WIDTH = layout.innerWidth;
    if (layout.markerOffset != null) MARKER_OFFSET = layout.markerOffset;
    layoutMarkerTop = layout.markerTop ?? null;
    layoutAmountTop = layout.amountTop ?? null;
    if (layout.markerTop != null) {
      const triangleEl = document.getElementById("progressMarkerTriangle");
      if (triangleEl) triangleEl.style.top = layout.markerTop + "px";
    }
    if (layout.amountTop != null) {
      const amountEl = document.getElementById("donationAmount");
      if (amountEl) amountEl.style.top = layout.amountTop + "px";
    }
    if (lastSiteData && lastSiteData.donations) applyDonations(lastSiteData.donations);
  }

  window.MichiSite = {
    applyDonations,
    applySettings,
    applyStatusUpdates,
    loadSiteData,
    refreshPublicPage,
    formatAmount,
    setProgressLayout,
  };

  if (document.getElementById("figma-frame")) {
    refreshPublicPage().catch((error) => {
      console.error(error);
    });
  }
})();
