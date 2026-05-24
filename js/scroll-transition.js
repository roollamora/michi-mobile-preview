(function () {
  const scene = document.getElementById("scene");
  const nav = document.getElementById("layer-nav");
  const cutout = document.getElementById("layer-cutout");
  const heroNavShell = document.getElementById("hero-nav-shell");
  const heroNavScroll = document.getElementById("hero-nav-scroll");
  const heroNavScrollbar = document.getElementById("hero-nav-scrollbar");
  const heroNavScrollThumb = document.querySelector(".hero-nav-scroll-thumb");
  const heroLegalLinks = document.getElementById("hero-legal-links");
  const article = document.getElementById("layer-article");
  const articleInner = document.getElementById("article-scroll-inner");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenuPanel = document.getElementById("mobile-menu-panel");
  if (!scene || !nav || !cutout || !article || !articleInner) return;

  const NAV_DESIGN_FONT_PX = 30;
  const NAV_MIN_READABLE_FIT = 14 / NAV_DESIGN_FONT_PX;
  const NAV_LEGAL_GAP_PX = 8;
  let navScrollRaf = null;
  let cutoutScrollRaf = null;
  let lastNavFit = 1;
  let lastCutoutIndex = 0;

  const layers = {
    leftBg: document.getElementById("layer-left-bg"),
    divider: document.getElementById("layer-divider"),
    rightGrey: document.getElementById("layer-right-grey"),
    heroBlack: document.getElementById("layer-hero-black"),
    heroTitle: document.getElementById("hero-title"),
    greeting: document.getElementById("layer-greeting"),
    intro: document.getElementById("layer-intro"),
    portrait: document.getElementById("layer-portrait"),
    nav,
    article,
    donationBorder: document.getElementById("layer-donation-border"),
    footerBar: document.getElementById("layer-footer-bar"),
    footerBg: document.getElementById("layer-footer-bg"),
    status: document.getElementById("layer-status"),
    donate: document.getElementById("layer-donate-compact"),
    readMore: document.getElementById("layer-read-more"),
    donationForms: document.getElementById("layer-donation-forms"),
    donationInfo: document.getElementById("layer-donation-info"),
    progressFrame: document.getElementById("progressFrame"),
    progressMarker: document.getElementById("progressMarkerTriangle"),
    donationAmount: document.getElementById("donationAmount"),
  };

  const progressGroup = document.getElementById("progress-group");

  const navLinks = [...nav.querySelectorAll(".nav-link")];
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href")?.slice(1) || ""))
    .filter(Boolean);

  const DESIGN_W = 1280;
  const DESIGN_H = 832;
  /** Expanded donation panel: equal columns inside white footer inset */
  const DONATION_PANEL_PAD_X = 44;
  const DONATION_PANEL_INNER = 20;
  const DONATION_COL_GAP = 28;
  const DONATION_WHITE_W = 1192;
  const DONATION_COL_W =
    (DONATION_WHITE_W - DONATION_PANEL_INNER * 2 - DONATION_COL_GAP) / 2;
  const DONATION_LEFT_X = DONATION_PANEL_PAD_X + DONATION_PANEL_INNER;
  const DONATION_RIGHT_X = DONATION_LEFT_X + DONATION_COL_W + DONATION_COL_GAP;
  const FOOTER_WHITE_Y = 307;
  const FOOTER_WHITE_H = 519;
  const DONATION_FORMS_H = 400;
  const DONATION_PROGRESS_H = 47;
  const DONATION_PROGRESS_GAP = 14;
  const DONATION_LEFT_MIN_H =
    DONATION_FORMS_H + DONATION_PROGRESS_GAP + DONATION_PROGRESS_H;
  const FOOTER_INNER_TOP = FOOTER_WHITE_Y + DONATION_PANEL_INNER;
  const FOOTER_INNER_H = FOOTER_WHITE_H - DONATION_PANEL_INNER * 2;
  const DONATION_COLUMN_H = Math.min(
    FOOTER_INNER_H,
    Math.max(DONATION_LEFT_MIN_H, 520)
  );
  const DONATION_COL_TOP =
    FOOTER_INNER_TOP + (FOOTER_INNER_H - DONATION_COLUMN_H) / 2;
  const DONATION_TOP_Y = DONATION_COL_TOP;
  const DONATION_PROGRESS_Y =
    DONATION_COL_TOP + DONATION_COLUMN_H - DONATION_PROGRESS_H;
  /** Viewports narrower than this use ribbon / stacked layout (no desktop scene proportions). */
  const MOBILE_LAYOUT_MAX_WIDTH_PX = 520;
  const FOOTER_TOP = 640;
  const ARTICLE_TOP_FROM = 214;
  const ARTICLE_TOP_TO = -39;
  const TRANSITION_MULTIPLIER = 1.45;
  const TITLE_SCALE = 0.58;
  const DESKTOP_ARTICLE_PADDING_TOP = 300;
  const DESKTOP_ARTICLE_PADDING_BOTTOM = 800;

  const PROGRESS_BASE = {
    frameW: 441,
    frameH: 47,
    innerInsetX: 10,
    innerInsetY: 10,
    innerW: 423,
    innerH: 27,
    markerTopOffset: 49,
    amountTopOffset: 64,
  };
  /** Design-space progress bar anchors (1280×832). */
  const PROGRESS_DESIGN = {
    article: { x: 99, y: 468, w: 441, h: 47 },
  };
  /** Landing welcome (Figma 1280×832): progress + JETZT SPENDEN before footer ribbon. */
  const LANDING_CHROME = {
    cta: { x: 86, y: 591, w: 458, h: 65 },
    readMore: { x: 281, y: 735, w: 241, h: 78 },
  };
  /** Collapsed footer ribbon: SPENDEN HIER | progress | status (Figma proportions). */
  const FOOTER_RIBBON = {
    donate: { x: 74, y: 698, w: 148, h: 72 },
    progress: { x: 240, y: 692, w: 462, h: 47 },
    status: { x: 720, y: 660, w: 350, h: 120 },
  };
  /** Side nav design box — progress must not sit over this when nav is visible. */
  const SIDE_NAV_DESIGN = { top: 309, bottom: 592 };
  /** Nav inside heroBlack: bottom-anchored; width spans hero minus left pad, flush to hero right edge. */
  const NAV_IN_HERO = {
    from: { bottom: 95, h: 283 },
    to: { bottom: 67, h: 283 },
  };
  const NAV_LEFT_PAD = 10;
  /** Desktop paint order (bottom → top). Single source of truth — do not set z-index in CSS. */
  const Z = {
    leftBg: 1,
    divider: 2,
    rightGrey: 3,
    portrait: 4,
    greeting: 5,
    intro: 6,
    article: 7,
    heroBlack: 8,
    heroTitle: 9,
    readMore: 10,
    landingDonate: 11,
    navCutout: 1,
    nav: 2,
    donationBorder: 20,
    footerBg: 21,
    footerBar: 22,
    donationInfo: 24,
    donationForms: 25,
    ribbonStatus: 26,
    ribbonDonate: 27,
    progress: 28,
    progressPanel: 32,
  };
  const DEFAULT_LAYOUT = {
    elements: {
      leftBg: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 0, y: 0, w: 577, h: 833 },
        to: { x: 0, y: 0, w: 577, h: 833 },
      },
      divider: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 577, y: 0, w: 15, h: 832 },
        to: { x: 577, y: 0, w: 15, h: 832 },
      },
      rightGrey: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 592, y: 0, w: 688, h: 832 },
        to: { x: 592, y: 0, w: 688, h: 832 },
      },
      heroBlack: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 74, y: 0, w: 518, h: 398 },
        to: { x: 74, y: 0, w: 331, h: 659 },
      },
      heroTitle: {
        mode: "proportional",
        anchor: "top-right",
        anchorTarget: "heroBlack",
        from: { x: 18.92, y: 133.25, w: 617.76, h: 0 },
        to: { x: 11.12, y: 157.03, w: 330.75, h: 0 },
      },
      greeting: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 640, y: 144, w: 480, h: 291 },
        to: { x: 640, y: 144, w: 480, h: 291 },
      },
      intro: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 619, y: 214, w: 410, h: 649 },
        to: { x: 619, y: 214, w: 410, h: 649 },
      },
      portrait: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 784, y: 398, w: 496, h: 437 },
        to: { x: 1340, y: 452, w: 496, h: 437 },
      },
      nav: {
        mode: "proportional",
        anchor: "top-right",
        anchorTarget: "heroBlack",
        from: { x: NAV_LEFT_PAD, y: 0, w: 508, h: NAV_IN_HERO.from.h },
        to: { x: NAV_LEFT_PAD, y: 0, w: 321, h: NAV_IN_HERO.to.h },
      },
      article: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 437, y: ARTICLE_TOP_FROM, w: 634, h: 426 },
        to: { x: 437, y: ARTICLE_TOP_TO, w: 634, h: 679 },
      },
      donationBorder: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 0, y: 640, w: 1280, h: 19 },
        to: { x: 0, y: 288, w: 1280, h: 544 },
      },
      footerBar: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 0, y: 640, w: 1280, h: 19 },
        to: { x: 0, y: 288, w: 1280, h: 19 },
      },
      footerBg: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 0, y: 659, w: 1280, h: 173 },
        to: { x: 44, y: 307, w: 1192, h: 519 },
      },
      donate: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 74, y: 698, w: 148, h: 59 },
        to: { x: 74, y: 698, w: 148, h: 59 },
      },
      donationForms: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 74, y: 698, w: 148, h: 59 },
        to: {
          x: DONATION_LEFT_X,
          y: DONATION_TOP_Y,
          w: DONATION_COL_W,
          h: DONATION_FORMS_H,
        },
      },
      donationInfo: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 720, y: 676, w: 350, h: 96 },
        to: {
          x: DONATION_RIGHT_X,
          y: DONATION_COL_TOP,
          w: DONATION_COL_W,
          h: DONATION_COLUMN_H,
        },
      },
      progressFrame: {
        mode: "proportional",
        anchor: "top-left",
        from: { x: 99, y: 468, w: 441, h: 47 },
        to: {
          x: DONATION_LEFT_X,
          y: DONATION_PROGRESS_Y,
          w: DONATION_COL_W,
          h: 47,
        },
      },
    },
  };

  let transitionPx = 0;
  let articleScrollMax = 0;
  let forcedIndex = null;
  const layoutConfig = DEFAULT_LAYOUT;
  let lastProgress = 0;
  let mobileMenuOpen = false;
  let mobileMenuEligible = false;
  let mobileArticleBaseStart = 0;
  let cachedMobileWelcomeEnd = 0;

  let lastMobileBreakpoint = window.innerWidth < MOBILE_LAYOUT_MAX_WIDTH_PX;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const remap = (v, a, b) => clamp01((v - a) / (b - a));
  const fadeIn = (v, a, b) => remap(v, a, b);
  const fadeOut = (v, a, b) => 1 - remap(v, a, b);
  const scaleX = () => window.innerWidth / DESIGN_W;
  const scaleY = () => window.innerHeight / DESIGN_H;
  const scaleMin = () => Math.min(scaleX(), scaleY());
  const sx = (v) => v * scaleX();
  const sy = (v) => v * scaleY();

  /** Desktop resize/nav bookkeeping only — layout is always driven by scroll position */
  const STATE_WELCOME = "welcome";
  const STATE_ARTICLE = "article";
  let pageState = STATE_WELCOME;

  /** Expanded donation footer — only grows when user clicks progress/footer (not on scroll). */
  let donationPanelT = 0;
  let donationPanelAnim = null;
  const DONATION_PANEL_MS = 480;

  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  }

  function isDonationPanelOpen() {
    return donationPanelT > 0.04;
  }

  function scrollToDonationAnchor() {
    const targetY = scene.offsetTop + transitionPx + articleScrollMax;
    window.scrollTo({
      top: targetY,
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }

  function setDonationPanelOpen(open, { animate = true } = {}) {
    const goal = open ? 1 : 0;
    if (donationPanelAnim) {
      cancelAnimationFrame(donationPanelAnim);
      donationPanelAnim = null;
    }
    if (!animate || prefersReduced) {
      donationPanelT = goal;
      document.body.classList.toggle("donation-panel-open", goal > 0.5);
      render();
      return;
    }
    const start = donationPanelT;
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / DONATION_PANEL_MS);
      donationPanelT = start + (goal - start) * easeOutCubic(u);
      document.body.classList.toggle("donation-panel-open", donationPanelT > 0.04);
      render();
      if (u < 1) {
        donationPanelAnim = requestAnimationFrame(step);
      } else {
        donationPanelT = goal;
        donationPanelAnim = null;
        render();
      }
    };
    donationPanelAnim = requestAnimationFrame(step);
  }

  function openDonationPanel() {
    if (isMobileLayout()) return;
    scrollToDonationAnchor();
    setDonationPanelOpen(true);
  }

  function closeDonationPanel() {
    setDonationPanelOpen(false);
  }

  function getZoneEnd() {
    return isMobileLayout()
      ? cachedMobileWelcomeEnd || transitionPx
      : transitionPx + DESKTOP_ARTICLE_PADDING_TOP;
  }

  function getRenderY() {
    return Math.max(0, window.scrollY - scene.offsetTop);
  }

  const titleSpans = [...layers.heroTitle.querySelectorAll("span")];
  const titleMetrics = titleSpans.map((span) => {
    const fs = Number.parseFloat(span.style.fontSize) || 26;
    const lh = Number.parseFloat(span.style.lineHeight) || fs * 1.18;
    const ls = Number.parseFloat(span.style.letterSpacing) || 0;
    return {
      span,
      fsFrom: fs,
      fsTo: fs * TITLE_SCALE,
      lhFrom: lh,
      lhTo: lh * 0.69,
      lsFrom: ls,
      lsTo: ls * 0.62,
    };
  });

  function setRectPx(el, x, y, w, h) {
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (w != null) el.style.width = `${w}px`;
    if (h != null) el.style.height = `${h}px`;
  }

  function resolveRect(name, p, visited = new Set()) {
    if (visited.has(name)) return null;
    visited.add(name);
    const spec = layoutConfig.elements[name] || DEFAULT_LAYOUT.elements[name];
    if (!spec) return null;
    const from = spec.from || {};
    const to = spec.to || from;
    const sourceRect = {
      x: lerp(Number(from.x) || 0, Number(to.x) || Number(from.x) || 0, p),
      y: lerp(Number(from.y) || 0, Number(to.y) || Number(from.y) || 0, p),
      w: lerp(Number(from.w) || 0, Number(to.w) || Number(from.w) || 0, p),
      h: lerp(Number(from.h) || 0, Number(to.h) || Number(from.h) || 0, p),
    };
    const mode = spec.mode || "proportional";
    const anchor = spec.anchor || "top-left";

    const toPixels =
      mode === "proportional"
        ? (rect) => ({ x: sx(rect.x), y: sy(rect.y), w: sx(rect.w), h: sy(rect.h) })
        : (rect) => ({ x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    const rect = toPixels(sourceRect);

    let context = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
    const target = spec.anchorTarget || "viewport";
    if (mode !== "fixed" && target !== "viewport") {
      const targetRect = resolveRect(target, p, visited);
      if (targetRect) context = targetRect;
    }

    const rightInset = rect.w;
    const bottomInset = rect.h;
    switch (anchor) {
      case "top-right":
        return {
          x: context.x + context.w - rect.w - rect.x,
          y: context.y + rect.y,
          w: rect.w,
          h: rect.h,
        };
      case "bottom-left":
        return {
          x: context.x + rect.x,
          y: context.y + context.h - rect.h - rect.y,
          w: rect.w,
          h: rect.h,
        };
      case "bottom-right":
        return {
          x: context.x + context.w - rect.w - rect.x,
          y: context.y + context.h - rect.h - rect.y,
          w: rect.w,
          h: rect.h,
        };
      case "center":
        return {
          x: context.x + (context.w - rect.w) / 2 + rect.x,
          y: context.y + (context.h - rect.h) / 2 + rect.y,
          w: rect.w,
          h: rect.h,
        };
      case "stretch-x": {
        const x = context.x + rect.x;
        const w = Math.max(1, context.w - rect.x - rightInset);
        return { x, y: context.y + rect.y, w, h: rect.h };
      }
      case "stretch-y": {
        const y = context.y + rect.y;
        const h = Math.max(1, context.h - rect.y - bottomInset);
        return { x: context.x + rect.x, y, w: rect.w, h };
      }
      case "stretch-both": {
        const x = context.x + rect.x;
        const y = context.y + rect.y;
        const w = Math.max(1, context.w - rect.x - rightInset);
        const h = Math.max(1, context.h - rect.y - bottomInset);
        return { x, y, w, h };
      }
      case "top-left":
      default:
        return { x: context.x + rect.x, y: context.y + rect.y, w: rect.w, h: rect.h };
    }
  }

  function applyRect(name, el, p, options = {}) {
    const rect = resolveRect(name, p);
    if (!rect || !el) return null;
    setRectPx(
      el,
      rect.x,
      rect.y,
      options.width === false ? null : rect.w,
      options.height === false ? null : rect.h
    );
    return rect;
  }

  function setOpacity(el, value) {
    if (!el) return;
    el.style.opacity = String(clamp01(value));
  }

  function setLayerVisible(el, value) {
    const v = clamp01(value);
    setOpacity(el, v);
    if (!el) return;
    el.style.pointerEvents = v > 0.05 ? "auto" : "none";
  }

  function lerpTitleTypography(p, scaleOverride = null) {
    const typographyScale = scaleOverride == null ? scaleMin() : scaleOverride;
    for (const metric of titleMetrics) {
      metric.span.style.fontSize = `${lerp(metric.fsFrom, metric.fsTo, p) * typographyScale}px`;
      metric.span.style.lineHeight = `${lerp(metric.lhFrom, metric.lhTo, p) * typographyScale}px`;
      metric.span.style.letterSpacing = `${lerp(metric.lsFrom, metric.lsTo, p) * typographyScale}px`;
    }
  }

  function updateNavScrollbar() {
    if (!heroNavScroll || !heroNavScrollbar || !heroNavScrollThumb) return;
    const maxScroll = Math.max(0, heroNavScroll.scrollHeight - heroNavScroll.clientHeight);
    const needsScroll = maxScroll > 2;
    heroNavScroll.classList.toggle("can-scroll", needsScroll);
    heroNavScrollbar.classList.toggle("is-visible", needsScroll);
    heroNavScrollbar.setAttribute("aria-hidden", needsScroll ? "false" : "true");
    if (!needsScroll) {
      heroNavScroll.scrollTop = 0;
      heroNavScrollThumb.style.height = "100%";
      heroNavScrollThumb.style.top = "0";
      return;
    }
    const track = heroNavScrollbar.querySelector(".hero-nav-scroll-track");
    const trackH = track?.clientHeight || 1;
    const thumbH = Math.max(10, (heroNavScroll.clientHeight / heroNavScroll.scrollHeight) * trackH);
    const thumbTop =
      maxScroll > 0 ? (heroNavScroll.scrollTop / maxScroll) * (trackH - thumbH) : 0;
    heroNavScrollThumb.style.height = `${thumbH}px`;
    heroNavScrollThumb.style.top = `${thumbTop}px`;
  }

  function getNavFit() {
    const raw = nav?.style.getPropertyValue("--nav-fit");
    const parsed = Number.parseFloat(raw || "1");
    return Number.isFinite(parsed) && parsed > 0 ? parsed : lastNavFit || 1;
  }

  function fitNavToHeight(maxHeightPx) {
    if (!nav || maxHeightPx <= 0) return 1;

    nav.style.fontSize = `${NAV_DESIGN_FONT_PX}px`;
    nav.style.marginBottom = "0";
    nav.style.setProperty("--nav-fit", "1");

    const naturalH = nav.scrollHeight;
    if (!naturalH) return 1;

    const viewportScale = Math.min(1, scaleMin());
    let fit = Math.min(1, viewportScale, maxHeightPx / naturalH);

    if (naturalH * fit > maxHeightPx && fit < NAV_MIN_READABLE_FIT) {
      fit = NAV_MIN_READABLE_FIT;
    }

    lastNavFit = fit;
    nav.style.setProperty("--nav-fit", String(fit));
    nav.style.marginBottom = `${-(naturalH * (1 - fit))}px`;

    const visualH = naturalH * fit;
    const needsScroll = visualH > maxHeightPx + 2;

    if (heroNavScroll) {
      heroNavScroll.style.maxHeight = `${maxHeightPx}px`;
      heroNavScroll.classList.toggle("can-scroll", needsScroll);
      if (!needsScroll) heroNavScroll.scrollTop = 0;
    }

    return fit;
  }

  function applyNavInHero(p, pDonation, footerRect) {
    const heroEl = layers.heroBlack;
    if (!heroEl || !nav || !heroNavShell) return null;

    const leftPadPx = sx(NAV_LEFT_PAD);
    const heroRect = heroEl.getBoundingClientRect();
    const titleRect = layers.heroTitle?.getBoundingClientRect();
    const footerBarRect = footerRect || resolveRect("footerBar", pDonation);

    const legalGapAboveFooterPx = 4;
    let legalBottomPx;
    if (footerBarRect) {
      legalBottomPx = Math.max(0, heroRect.bottom - footerBarRect.y + legalGapAboveFooterPx);
    } else {
      legalBottomPx = sy(lerp(NAV_IN_HERO.from.bottom, NAV_IN_HERO.to.bottom, p));
    }

    if (heroLegalLinks) {
      heroLegalLinks.style.left = `${leftPadPx}px`;
      heroLegalLinks.style.right = "0";
      heroLegalLinks.style.bottom = `${legalBottomPx}px`;
    }

    const legalH = heroLegalLinks?.offsetHeight || sy(20);
    let shellTop = sy(150);
    if (titleRect && heroRect.height > 0) {
      shellTop = Math.max(sy(10), titleRect.bottom - heroRect.top + sy(10));
    }

    const shellBottom = legalBottomPx + legalH + sy(NAV_LEGAL_GAP_PX);
    heroNavShell.style.left = `${leftPadPx}px`;
    heroNavShell.style.right = "0";
    heroNavShell.style.top = `${shellTop}px`;
    heroNavShell.style.bottom = `${shellBottom}px`;

    const maxNavH = Math.max(sy(48), heroRect.height - shellTop - shellBottom);
    fitNavToHeight(maxNavH);
    updateNavScrollbar();

    const navRect = nav.getBoundingClientRect();
    return {
      x: navRect.left,
      y: navRect.top,
      w: Math.max(1, navRect.width),
      h: Math.max(1, navRect.height),
    };
  }

  function scrollHeroNavBy(delta) {
    if (!heroNavScroll) return;
    heroNavScroll.scrollTop += delta;
    updateNavScrollbar();
  }

  if (heroNavScroll) {
    heroNavScroll.addEventListener(
      "scroll",
      () => {
        if (navScrollRaf) cancelAnimationFrame(navScrollRaf);
        navScrollRaf = requestAnimationFrame(updateNavScrollbar);
        if (cutoutScrollRaf) cancelAnimationFrame(cutoutScrollRaf);
        cutoutScrollRaf = requestAnimationFrame(() => updateCutout(lastCutoutIndex));
      },
      { passive: true }
    );
  }
  heroNavScrollbar?.querySelectorAll(".hero-nav-scroll-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.getAttribute("data-dir")) || 0;
      scrollHeroNavBy(dir * Math.max(36, (heroNavScroll?.clientHeight || 80) * 0.35));
    });
  });

  /** Active section, or any nav row that has scrolled up beside the hero title band. */
  function resolveCutoutIndex(activeIndex) {
    if (forcedIndex != null) return forcedIndex;

    const heroTitleRect = layers.heroTitle?.getBoundingClientRect();
    if (heroTitleRect) {
      const titleTop = heroTitleRect.top - 2;
      const titleBottom = heroTitleRect.bottom + 2;
      let reachedIndex = -1;
      navLinks.forEach((link, i) => {
        const row = link.closest(".nav-row");
        if (!row) return;
        const rowRect = row.getBoundingClientRect();
        if (rowRect.top < titleBottom && rowRect.bottom > titleTop) {
          reachedIndex = i;
        }
      });
      if (reachedIndex >= 0) return reachedIndex;
    }
    return activeIndex;
  }

  function updateCutout(index) {
    const link = navLinks[index];
    if (!link || !layers.heroBlack) {
      cutout.style.opacity = "0";
      return;
    }
    const row = link.closest(".nav-row");
    if (!row) {
      cutout.style.opacity = "0";
      return;
    }

    navLinks.forEach((navLink, i) => {
      navLink.classList.toggle("is-active", i === index);
    });

    const navRect = nav.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const heroBlackRect = layers.heroBlack.getBoundingClientRect();
    const padY = 4;
    const padLink = 4;
    const minLeftPx = sx(NAV_LEFT_PAD);

    const heroLeftInNav = heroBlackRect.left - navRect.left;
    const minLeft = Math.max(0, heroLeftInNav + minLeftPx);
    const linkLeft = linkRect.left - navRect.left - padLink;
    const left = Math.max(minLeft, linkLeft);
    const right = heroBlackRect.right - navRect.left + 1;
    const width = Math.max(1, right - left);
    const top = Math.max(0, rowRect.top - navRect.top - padY);
    const height = Math.max(1, rowRect.height + padY * 2);

    cutout.style.left = `${left}px`;
    cutout.style.top = `${top}px`;
    cutout.style.width = `${width}px`;
    cutout.style.height = `${height}px`;
    cutout.style.opacity = "1";
  }

  function scrollToArticleStart({ smooth = true } = {}) {
    pageState = STATE_ARTICLE;
    window.scrollTo({
      top: scene.offsetTop + transitionPx,
      behavior: smooth && !prefersReduced ? "smooth" : "auto",
    });
  }

  function applyDesktopLayerStack(pDonation) {
    const setZ = (el, z) => {
      if (el) el.style.zIndex = String(z);
    };
    const panelOpen = pDonation > 0.04;

    setZ(layers.leftBg, Z.leftBg);
    setZ(layers.divider, Z.divider);
    setZ(layers.rightGrey, Z.rightGrey);
    setZ(layers.portrait, Z.portrait);
    setZ(layers.greeting, Z.greeting);
    setZ(layers.intro, Z.intro);
    setZ(layers.article, Z.article);
    setZ(layers.heroBlack, Z.heroBlack);
    setZ(layers.heroTitle, Z.heroTitle);
    setZ(cutout, Z.navCutout);
    setZ(nav, Z.nav);
    setZ(layers.readMore, Z.readMore);
    setZ(layers.footerBg, Z.footerBg);
    setZ(layers.donationBorder, Z.donationBorder);
    setZ(layers.footerBar, Z.footerBar);
    setZ(layers.donationInfo, Z.donationInfo);
    setZ(layers.donationForms, Z.donationForms);
    if (layers.donate) {
      setZ(layers.donate, Z.landingDonate);
    }
    if (layers.status && layers.status.parentElement !== layers.donationInfo) {
      setZ(layers.status, Z.ribbonStatus);
    } else if (layers.status) {
      layers.status.style.zIndex = "";
    }
    if (progressGroup) {
      progressGroup.style.zIndex = String(panelOpen ? Z.progressPanel : Z.progress);
    }
  }

  function activeSection(articleOffset, viewportPx) {
    const pivot = articleOffset + viewportPx * 0.5;
    let index = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= pivot) index = i;
    });
    return index;
  }

  function expandedProgressDesign() {
    return {
      x: DONATION_LEFT_X,
      y: DONATION_PROGRESS_Y,
      w: DONATION_COL_W,
      h: DONATION_PROGRESS_H,
    };
  }

  function progressRibbonBlend(pScroll) {
    const { article } = PROGRESS_DESIGN;
    const ribbon = FOOTER_RIBBON.progress;
    const navVisible = fadeIn(pScroll, 0.62, 0.94);
    let ribbonT = fadeIn(pScroll, 0.45, 0.72);
    if (navVisible > 0.02 && ribbon.y > article.y) {
      const clearY = SIDE_NAV_DESIGN.bottom + 10;
      const neededT = clamp01((clearY - article.y) / (ribbon.y - article.y));
      ribbonT = Math.max(ribbonT, neededT * navVisible);
    }
    return ribbonT;
  }

  function progressCollapsedRect(pScroll) {
    const { article } = PROGRESS_DESIGN;
    const ribbon = FOOTER_RIBBON.progress;
    const ribbonT = progressRibbonBlend(pScroll);
    return {
      x: lerp(article.x, ribbon.x, ribbonT),
      y: lerp(article.y, ribbon.y, ribbonT),
      w: lerp(article.w, ribbon.w, ribbonT),
      h: lerp(article.h, ribbon.h, ribbonT),
    };
  }

  function designProgressRect(pScroll, pDonation) {
    const collapsed = progressCollapsedRect(pScroll);
    const expanded = expandedProgressDesign();
    if (pDonation > 0.001) {
      const t = easeOutCubic(clamp01(pDonation));
      return {
        x: lerp(collapsed.x, expanded.x, t),
        y: lerp(collapsed.y, expanded.y, t),
        w: lerp(collapsed.w, expanded.w, t),
        h: lerp(collapsed.h, expanded.h, t),
      };
    }
    return collapsed;
  }

  function ensureStatusInDonationInfo() {
    const info = layers.donationInfo;
    const status = layers.status;
    if (!info || !status || status.parentElement === info) return;
    const title = info.querySelector(".donation-info-report-title");
    if (title) title.insertAdjacentElement("afterend", status);
    else info.prepend(status);
  }

  function ensureStatusOnScene() {
    const status = layers.status;
    const frame = document.getElementById("figma-frame");
    if (!status || !frame || status.parentElement === frame) return;
    frame.appendChild(status);
  }

  function ctaScrollMorph(pScroll) {
    return clamp01(remap(pScroll, 0.1, 0.58));
  }

  function resetStatusExpandedLayout() {
    const status = layers.status;
    if (!status) return;
    status.style.position = "";
    status.style.left = "";
    status.style.top = "";
    status.style.width = "";
    status.style.height = "";
    status.style.right = "";
    status.style.bottom = "";
  }

  function applyFooterRibbonElements(pScroll, pDonation, atFooterZone) {
    const ribbonBlend = fadeIn(pScroll, 0.58, 0.92);
    const ribbonVisible = ribbonBlend * fadeOut(pDonation, 0.08, 0.42);
    const ribbonStatusVisible = Math.max(ribbonVisible, atFooterZone) * fadeOut(pDonation, 0, 0.1);
    const ctaMorph = ctaScrollMorph(pScroll);

    if (layers.donate) {
      if (pDonation > 0.08) {
        setOpacity(layers.donate, 0);
        layers.donate.style.pointerEvents = "none";
        layers.donate.classList.remove("is-landing-cta");
      } else {
        const landingPx = designRectToPx(LANDING_CHROME.cta);
        const footerPx = designRectToPx(FOOTER_RIBBON.donate);
        const t = ctaMorph;
        setRectPx(
          layers.donate,
          lerp(landingPx.x, footerPx.x, t),
          lerp(landingPx.y, footerPx.y, t),
          lerp(landingPx.w, footerPx.w, t),
          lerp(landingPx.h, footerPx.h, t)
        );
        layers.donate.classList.toggle("is-landing-cta", t < 0.5);
        layers.donate.style.setProperty("--cta-morph", String(t));
        const ctaVisible = Math.max(fadeIn(pScroll, 0, 0.06), fadeOut(pDonation, 0, 0.1));
        setOpacity(layers.donate, ctaVisible);
        layers.donate.style.pointerEvents = ctaVisible > 0.2 ? "auto" : "none";
      }
    }

    if (layers.status) {
      const statusClickable = ribbonStatusVisible > 0.2 && pDonation < 0.08;
      layers.status.classList.toggle("donation-open-target", statusClickable);
      layers.status.classList.toggle("is-ribbon-status", ribbonStatusVisible > 0.12 && pDonation < 0.08);
      if (pDonation > 0.04) {
        ensureStatusInDonationInfo();
        resetStatusExpandedLayout();
        layers.status.classList.remove("is-ribbon-status");
        setOpacity(layers.status, 1);
        layers.status.style.pointerEvents = "auto";
      } else if (ribbonStatusVisible > 0.02) {
        ensureStatusOnScene();
        const statusPx = designRectToPx(FOOTER_RIBBON.status);
        layers.status.style.position = "absolute";
        setRectPx(layers.status, statusPx.x, statusPx.y, statusPx.w, statusPx.h);
        setOpacity(layers.status, Math.min(1, ribbonStatusVisible));
        layers.status.style.pointerEvents = ribbonStatusVisible > 0.2 ? "auto" : "none";
      } else {
        ensureStatusOnScene();
        layers.status.classList.remove("is-ribbon-status");
        setOpacity(layers.status, 0);
        layers.status.style.pointerEvents = "none";
      }
    }
  }

  function designRectToPx(rect) {
    return {
      x: sx(rect.x),
      y: sy(rect.y),
      w: sx(rect.w),
      h: sy(rect.h),
    };
  }

  function shiftProgressLabels(progressRect) {
    if (!progressRect) return;
    const frameRight = progressRect.x + progressRect.w;
    const goalEl = document.getElementById("goalAmount");
    if (goalEl) {
      goalEl.style.left = `${frameRight}px`;
      goalEl.style.top = `${progressRect.y + progressRect.h * (PROGRESS_BASE.amountTopOffset / PROGRESS_BASE.frameH)}px`;
      goalEl.style.transform = "translateX(-100%)";
      goalEl.style.width = "auto";
      goalEl.style.textAlign = "right";
    }
  }

  function applyProgressChrome(progressRectPx) {
    if (!progressRectPx || !layers.progressFrame) return;
    setRectPx(
      layers.progressFrame,
      progressRectPx.x,
      progressRectPx.y,
      progressRectPx.w,
      progressRectPx.h
    );
    shiftProgressLabels(progressRectPx);

    const frameLeft = progressRectPx.x;
    const frameTop = progressRectPx.y;
    const frameWidth = progressRectPx.w;
    const frameHeight = progressRectPx.h;
    const frameStyle = window.getComputedStyle(layers.progressFrame);
    const border = parseFloat(frameStyle.borderLeftWidth) || 9;
    const innerInsetX = border + 1;
    const innerInsetY = border + 1;
    const innerWidth = Math.max(1, frameWidth - border * 2 - 1);
    const innerHeight = Math.max(1, frameHeight - (border + 1) * 2);
    const markerTop =
      frameTop + frameHeight * (PROGRESS_BASE.markerTopOffset / PROGRESS_BASE.frameH);
    const amountTop =
      frameTop + frameHeight * (PROGRESS_BASE.amountTopOffset / PROGRESS_BASE.frameH);

    if (layers.progressMarker) {
      layers.progressMarker.style.left = "";
      layers.progressMarker.style.top = `${markerTop}px`;
    }
    if (layers.donationAmount) {
      layers.donationAmount.style.top = `${amountTop}px`;
    }

    window.MichiSite?.setProgressLayout?.({
      barLeft: frameLeft + innerInsetX,
      barTop: frameTop + innerInsetY,
      barHeight: innerHeight,
      innerWidth,
      markerOffset: markerTop - (frameTop + innerInsetY + innerHeight),
      markerTop,
      amountTop,
    });
  }

  function applySceneMinHeight() {
    scene.style.minHeight = `${transitionPx + articleScrollMax + window.innerHeight * 0.35}px`;
  }

  function updateSceneHeight() {
    if (isMobileLayout()) {
      transitionPx = Math.max(window.innerHeight * 1.25, 760);
      const ribbonHeight = Math.max(96, window.innerHeight * 0.18);
      const articleTop = Math.max(260, Math.min(360, window.innerHeight * 0.38));
      const articleHeight = Math.max(120, window.innerHeight - articleTop - ribbonHeight - 12);
      articleScrollMax = Math.max(0, articleInner.scrollHeight - articleHeight);
      if (!cachedMobileWelcomeEnd) {
        cachedMobileWelcomeEnd = Math.max(window.innerHeight * 1.4, 900);
      }
      applySceneMinHeight();
      return;
    }
    transitionPx = Math.max(window.innerHeight * TRANSITION_MULTIPLIER, 920);
    const viewportHeight = Math.max(1, article.clientHeight || sy(FOOTER_TOP - ARTICLE_TOP_TO));
    articleScrollMax = Math.max(0, articleInner.scrollHeight - viewportHeight);
    applySceneMinHeight();
  }

  function isMobileLayout() {
    return window.innerWidth < MOBILE_LAYOUT_MAX_WIDTH_PX;
  }

  function renderMobile() {
    document.body.classList.add("mobile-layout");
    const sceneTop = scene.offsetTop;
    const y = getRenderY();
    const heroShrink = clamp01(y / 320);
    const extraWelcomeRunway = window.innerHeight * 0.5;
    const ribbonHeight = Math.max(96, window.innerHeight * 0.18);
    const ribbonLineTop = window.innerHeight - ribbonHeight - 2;

    const titleSidePadding = 8;
    const titleWidth = Math.max(1, window.innerWidth - titleSidePadding * 2);
    const shrinkT = clamp01((heroShrink - 0.12) / 0.88);
    const titleTop = 12;
    layers.heroTitle.style.left = "auto";
    layers.heroTitle.style.right = `${titleSidePadding}px`;
    layers.heroTitle.style.top = `${titleTop}px`;
    layers.heroTitle.style.width = `${titleWidth}px`;
    layers.heroTitle.style.transformOrigin = "100% 0%";
    layers.heroTitle.style.transform = "scale(1)";
    layers.heroTitle.style.zIndex = "17";
    layers.heroTitle.style.width = "max-content";
    layers.heroTitle.style.maxWidth = "none";
    lerpTitleTypography(0, 1);
    const titleNaturalWidth =
      Math.max(1, layers.heroTitle.getBoundingClientRect().width || layers.heroTitle.scrollWidth || titleWidth);
    const fitScale = Math.min(1, titleWidth / titleNaturalWidth);
    const titleScale = lerp(fitScale, fitScale * 0.62, shrinkT);
    layers.heroTitle.style.transform = `scale(${titleScale})`;
    const measuredTitleHeight = layers.heroTitle.getBoundingClientRect().height || 72;
    const heroExpandedHeight = Math.max(titleTop + measuredTitleHeight + 10, 86);
    const heroCollapsedHeight = Math.max(52, heroExpandedHeight * 0.52);
    const heroBaseHeight = Math.max(
      lerp(heroExpandedHeight, heroCollapsedHeight, heroShrink),
      titleTop + measuredTitleHeight + 8
    );
    mobileMenuEligible = heroShrink > 0.3;
    if (!mobileMenuEligible && mobileMenuOpen) {
      mobileMenuOpen = false;
      document.body.classList.remove("menu-open");
    }
    const menuDropHeight =
      mobileMenuEligible && mobileMenuOpen ? Math.min(230, window.innerHeight * 0.36) : 0;
    const heroHeight = heroBaseHeight + menuDropHeight;

    setRectPx(layers.leftBg, 0, 0, window.innerWidth, window.innerHeight);
    setRectPx(layers.rightGrey, 0, 0, window.innerWidth, window.innerHeight);
    layers.rightGrey.style.zIndex = "15";
    setOpacity(layers.divider, 0);
    setRectPx(layers.heroBlack, 0, 0, window.innerWidth, heroHeight);
    setOpacity(layers.heroBlack, 1);
    layers.heroBlack.style.zIndex = "16";

    const welcomeTop = heroHeight;
    const greetingX = 5;
    setRectPx(layers.greeting, greetingX, welcomeTop, window.innerWidth - 10, null);
    layers.greeting.style.whiteSpace = "normal";
    const greetingHeight = layers.greeting.getBoundingClientRect().height || 52;
    setRectPx(
      layers.intro,
      greetingX,
      welcomeTop + greetingHeight + 2,
      window.innerWidth - 10,
      null
    );
    const introHeight = layers.intro.getBoundingClientRect().height || 0;
    const welcomeAvailableHeight = Math.max(1, ribbonLineTop - welcomeTop);
    const fullWelcomeHeight = greetingHeight + 2 + introHeight;
    const requiredWelcomeScroll = Math.max(0, fullWelcomeHeight - welcomeAvailableHeight);
    const extraWelcomeHold = Math.max(180, window.innerHeight * 0.35);
    const welcomeScroll = Math.max(
      0,
      Math.min(requiredWelcomeScroll, y - 120)
    );
    const shiftedWelcomeTop = welcomeTop - welcomeScroll;
    setRectPx(layers.greeting, greetingX, shiftedWelcomeTop, window.innerWidth - 10, null);
    setRectPx(
      layers.intro,
      greetingX,
      shiftedWelcomeTop + greetingHeight + 2,
      window.innerWidth - 10,
      null
    );
    const welcomeFadeStart = 220 + requiredWelcomeScroll + extraWelcomeRunway;
    const welcomeFade = clamp01((y - welcomeFadeStart) / 260);
    setOpacity(layers.rightGrey, 0.94 * (1 - welcomeFade));
    layers.greeting.style.zIndex = "18";
    layers.intro.style.zIndex = "18";
    setOpacity(layers.greeting, 1 - welcomeFade);
    setOpacity(layers.intro, 1 - welcomeFade);

    const portraitW = Math.min(190, window.innerWidth * 0.38);
    const portraitH = portraitW * 1.28;
    setRectPx(
      layers.portrait,
      window.innerWidth - portraitW,
      ribbonLineTop - portraitH,
      portraitW,
      portraitH
    );
    layers.portrait.style.zIndex = "17";
    setOpacity(layers.portrait, 1 - welcomeFade);

    setOpacity(layers.nav, 0);
    setOpacity(cutout, 0);
    if (heroNavShell) setOpacity(heroNavShell, 0);
    if (heroLegalLinks) setOpacity(heroLegalLinks, 0);
    const articleTop = heroHeight;
    const articleHeight = Math.max(1, ribbonLineTop - articleTop);
    // In mobile, start article at section heading (menu-selected alignment).
    articleInner.style.paddingTop = "0px";
    articleInner.style.paddingBottom = "50vh";
    const dynamicArticleScrollMax = Math.max(0, articleInner.scrollHeight - articleHeight);
    if (Math.abs(dynamicArticleScrollMax - articleScrollMax) > 1) {
      articleScrollMax = dynamicArticleScrollMax;
      applySceneMinHeight();
    }
    const articleSidePadding = 15;
    setRectPx(
      layers.article,
      articleSidePadding,
      articleTop,
      Math.max(1, window.innerWidth - articleSidePadding * 2),
      articleHeight
    );
    const articleBaseStart = 120 + requiredWelcomeScroll + extraWelcomeRunway + extraWelcomeHold;
    const stableArticleBase = articleBaseStart;
    mobileArticleBaseStart = stableArticleBase;
    cachedMobileWelcomeEnd = articleBaseStart;
    const articleActive = pageState === STATE_ARTICLE || y >= stableArticleBase;
    setOpacity(layers.article, articleActive ? 1 : 0);
    layers.article.style.zIndex = "9";
    const articleOffset = articleActive
      ? Math.max(0, Math.min(articleScrollMax, y - stableArticleBase))
      : 0;
    articleInner.style.transform = `translateY(${-articleOffset}px)`;
    scene.style.minHeight = `${stableArticleBase + articleScrollMax + window.innerHeight * 0.35}px`;

    setRectPx(layers.footerBar, 0, ribbonLineTop, window.innerWidth, 2);
    setRectPx(layers.footerBg, 0, window.innerHeight - ribbonHeight, window.innerWidth, ribbonHeight);
    setOpacity(layers.footerBar, 1);
    setOpacity(layers.footerBg, 1);
    layers.footerBar.style.zIndex = "22";
    layers.footerBg.style.zIndex = "21";
    setOpacity(layers.status, 0);
    setOpacity(layers.donate, 0);
    setOpacity(layers.donationBorder, 0);
    setOpacity(layers.donationForms, 0);
    setOpacity(layers.donationInfo, 0);

    const progressWidth = Math.min(window.innerWidth - 24, 430);
    const progressHeight = progressWidth * (PROGRESS_BASE.frameH / PROGRESS_BASE.frameW);
    const progressLeft = (window.innerWidth - progressWidth) / 2;
    const progressTop = window.innerHeight - ribbonHeight + 20;
    applyProgressChrome({
      x: progressLeft,
      y: progressTop,
      w: progressWidth,
      h: progressHeight,
    });

    if (progressGroup) {
      progressGroup.style.opacity = "1";
      progressGroup.style.pointerEvents = "auto";
      progressGroup.style.zIndex = "31";
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.style.display = "block";
      mobileMenuBtn.style.top = "0px";
      mobileMenuBtn.style.left = "0px";
      mobileMenuBtn.style.height = `${heroBaseHeight}px`;
      mobileMenuBtn.style.width = `${Math.max(56, heroBaseHeight * 0.6)}px`;
      mobileMenuBtn.style.borderRadius = "0";
      mobileMenuBtn.style.padding = "0";
      mobileMenuBtn.style.lineHeight = `${heroBaseHeight}px`;
    }
    mobileMenuEligible = true;
    if (mobileMenuPanel) {
      mobileMenuPanel.style.top = `${heroBaseHeight}px`;
      mobileMenuPanel.style.height = `${menuDropHeight}px`;
      mobileMenuPanel.style.paddingTop = "10px";
    }
    if (!(mobileMenuEligible && mobileMenuOpen)) {
      document.body.classList.remove("menu-open");
    }
  }

  function render() {
    const mobile = isMobileLayout();

    if (mobile) {
      renderMobile();
      return;
    }
    document.body.classList.remove("mobile-layout");
    document.body.classList.remove("menu-open");
    mobileMenuOpen = false;
    mobileMenuEligible = false;
    articleInner.style.paddingTop = `${DESKTOP_ARTICLE_PADDING_TOP}px`;
    articleInner.style.paddingBottom = `${DESKTOP_ARTICLE_PADDING_BOTTOM}px`;
    if (mobileMenuBtn) mobileMenuBtn.style.display = "none";
    if (mobileMenuPanel) mobileMenuPanel.style.height = "0px";
    const y = getRenderY();
    const raw = clamp01(y / transitionPx);
    const pScroll = prefersReduced ? (raw >= 0.5 ? 1 : 0) : raw;
    const pDonation = prefersReduced
      ? donationPanelT > 0.5
        ? 1
        : 0
      : donationPanelT;
    lastProgress = pScroll;

    applyRect("leftBg", layers.leftBg, pScroll);
    applyRect("divider", layers.divider, pScroll);
    applyRect("rightGrey", layers.rightGrey, pScroll);
    applyRect("heroBlack", layers.heroBlack, pScroll);
    applyRect("heroTitle", layers.heroTitle, pScroll, { height: false });
    layers.heroTitle.style.right = "";
    layers.heroTitle.style.transform = "";
    layers.heroTitle.style.transformOrigin = "";
    lerpTitleTypography(pScroll);

    const greetingRect = applyRect("greeting", layers.greeting, pScroll, { height: false });
    layers.greeting.style.whiteSpace = "nowrap";
    const introRect = applyRect("intro", layers.intro, pScroll, { height: false });
    if (greetingRect && introRect && layers.greeting && layers.intro) {
      const greetingHeight = layers.greeting.getBoundingClientRect().height;
      const introTop = greetingRect.y + greetingHeight + sy(2);
      setRectPx(layers.intro, introRect.x, introTop, introRect.w, introRect.h);
    }
    applyRect("portrait", layers.portrait, pScroll);

    const footerRectForNav = resolveRect("footerBar", pDonation);
    applyNavInHero(pScroll, pDonation, footerRectForNav);
    const articleRect = resolveRect("article", pScroll);
    const articleTop = articleRect ? articleRect.y : sy(lerp(ARTICLE_TOP_FROM, ARTICLE_TOP_TO, pScroll));
    const footerRect = footerRectForNav || resolveRect("footerBar", pDonation);
    const footerTop = footerRect ? footerRect.y : sy(FOOTER_TOP);
    const articleHeight = Math.max(1, footerTop - articleTop);
    const dynamicArticleScrollMax = Math.max(0, articleInner.scrollHeight - articleHeight);
    if (Math.abs(dynamicArticleScrollMax - articleScrollMax) > 1) {
      articleScrollMax = dynamicArticleScrollMax;
      applySceneMinHeight();
    }
    const articleOffset = y > transitionPx ? Math.min(articleScrollMax, y - transitionPx) : 0;
    if (articleRect) {
      setRectPx(layers.article, articleRect.x, articleTop, articleRect.w, articleHeight);
    }

    applyRect("donationBorder", layers.donationBorder, pDonation);
    applyRect("footerBar", layers.footerBar, pDonation);
    applyRect("footerBg", layers.footerBg, pDonation);
    applyRect("donationForms", layers.donationForms, pDonation);
    applyRect("donationInfo", layers.donationInfo, pDonation);
    const atFooterZone = fadeIn(pScroll, 0.72, 0.96);
    applyFooterRibbonElements(pScroll, pDonation, atFooterZone);

    if (layers.readMore) {
      const readMoreVisible = fadeOut(pScroll, 0.35, 0.72) * fadeOut(pDonation, 0, 0.1);
      if (readMoreVisible > 0.02) {
        const readPx = designRectToPx(LANDING_CHROME.readMore);
        setRectPx(layers.readMore, readPx.x, readPx.y, readPx.w, readPx.h);
        setOpacity(layers.readMore, readMoreVisible);
        layers.readMore.style.pointerEvents = readMoreVisible > 0.2 ? "auto" : "none";
      } else {
        setOpacity(layers.readMore, 0);
        layers.readMore.style.pointerEvents = "none";
      }
    }

    const progressRectPx = designRectToPx(designProgressRect(pScroll, pDonation));
    applyProgressChrome(progressRectPx);

    const introFade = fadeOut(pScroll, 0.12, 0.56);
    const landingFade = fadeOut(pScroll, 0.18, 0.68);
    const transformedFade = fadeIn(pScroll, 0.62, 0.94);
    const panelOpen = pDonation > 0.04;
    const progressVisible = 1;
    const panelContentFade = panelOpen ? fadeIn(pDonation, 0.02, 0.2) : 0;
    const footerChromeFade = Math.max(atFooterZone, panelContentFade);

    applyDesktopLayerStack(pDonation);

    setOpacity(layers.divider, landingFade);
    setOpacity(layers.rightGrey, landingFade);
    setOpacity(layers.greeting, introFade);
    setOpacity(layers.intro, introFade);
    setOpacity(layers.portrait, landingFade);

    if (heroNavShell) {
      setOpacity(heroNavShell, transformedFade);
    }
    if (heroLegalLinks) {
      setOpacity(heroLegalLinks, transformedFade);
      heroLegalLinks.style.pointerEvents = transformedFade > 0.12 ? "auto" : "none";
    }
    setOpacity(nav, 1);
    setOpacity(cutout, 1);
    setOpacity(layers.article, transformedFade);
    document.body.classList.toggle("side-nav-visible", transformedFade > 0.12);
    if (layers.heroBlack) {
      layers.heroBlack.style.overflow = "hidden";
    }
    setOpacity(layers.donationBorder, footerChromeFade);
    setOpacity(layers.footerBar, footerChromeFade);
    setOpacity(layers.footerBg, footerChromeFade);
    if (panelOpen) {
      setOpacity(layers.donationForms, Math.max(panelContentFade, 0.98));
      setOpacity(layers.donationInfo, Math.max(panelContentFade, 0.98));
      if (layers.donationForms) layers.donationForms.style.pointerEvents = "auto";
      if (layers.donationInfo) layers.donationInfo.style.pointerEvents = "auto";
    } else {
      setLayerVisible(layers.donationForms, 0);
      setLayerVisible(layers.donationInfo, 0);
    }

    const donationTargetsClickable = !isDonationPanelOpen();
    if (layers.footerBar) {
      layers.footerBar.style.pointerEvents = "none";
    }
    if (layers.footerBg) {
      layers.footerBg.style.pointerEvents = panelOpen ? "auto" : "none";
    }
    if (progressGroup) {
      progressGroup.style.opacity = String(progressVisible);
      progressGroup.style.pointerEvents = "none";
      progressGroup.classList.toggle(
        "donation-open-target",
        donationTargetsClickable && progressVisible > 0.08
      );
    }

    const revealLift = articleOffset > 0 ? 0 : sy(112) * fadeOut(pScroll, 0.58, 1);
    articleInner.style.transform = `translateY(${revealLift - articleOffset}px)`;

    const activeIndex = activeSection(articleOffset, sy(articleHeight));
    lastCutoutIndex = resolveCutoutIndex(activeIndex);
    updateCutout(lastCutoutIndex);
  }

  navLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      forcedIndex = index;
      lastCutoutIndex = index;
      updateCutout(index);
      const sectionTarget = Math.max(0, target.offsetTop);
      pageState = STATE_ARTICLE;
      window.scrollTo({
        top: scene.offsetTop + transitionPx + sectionTarget,
        behavior: "auto",
      });
      window.setTimeout(() => {
        forcedIndex = null;
      }, 0);
    });
  });

  if (mobileMenuBtn && mobileMenuPanel) {
    mobileMenuBtn.addEventListener("click", () => {
      if (!mobileMenuEligible) return;
      mobileMenuOpen = !mobileMenuOpen;
      document.body.classList.toggle("menu-open", mobileMenuOpen);
      render();
    });
    const mobileLinks = [...mobileMenuPanel.querySelectorAll("a[data-mobile-nav]")];
    mobileLinks.forEach((link, index) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const id = link.getAttribute("href")?.slice(1);
        const target = id ? document.getElementById(id) : null;
        const sectionTarget = target ? target.offsetTop : index * 220;
        pageState = STATE_ARTICLE;
        window.scrollTo({
          top: scene.offsetTop + mobileArticleBaseStart + Math.max(0, sectionTarget),
          behavior: "auto",
        });
        mobileMenuOpen = false;
        document.body.classList.remove("menu-open");
      });
    });
    document.addEventListener("click", (event) => {
      if (!mobileMenuOpen) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (mobileMenuPanel.contains(target) || mobileMenuBtn.contains(target)) return;
      mobileMenuOpen = false;
      document.body.classList.remove("menu-open");
    });
  }

  function isInsideExpandedDonation(target) {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest(
        "#layer-donation-forms, #layer-donation-info, #layer-status, #donation-checkout-overlay, #hero-nav-shell, #hero-legal-links"
      )
    );
  }

  const figmaFrame = document.getElementById("figma-frame");
  figmaFrame?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || isMobileLayout()) return;
    if (target.closest("#layer-read-more")) {
      event.stopPropagation();
      scrollToArticleStart({ smooth: !prefersReduced });
      return;
    }
    if (!isDonationPanelOpen() && target.closest("#progress-group.donation-open-target")) {
      event.stopPropagation();
      openDonationPanel();
      return;
    }
    if (!isDonationPanelOpen() && target.closest("#layer-donate-compact")) {
      event.stopPropagation();
      openDonationPanel();
      return;
    }
    if (!isDonationPanelOpen() && target.closest("#layer-status.donation-open-target")) {
      event.stopPropagation();
      openDonationPanel();
    }
  });

  [layers.donationForms, layers.donationInfo].forEach((el) => {
    el?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });

  document.addEventListener("click", (event) => {
    if (!isDonationPanelOpen() || isMobileLayout()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (isInsideExpandedDonation(target)) return;
    if (
      target.closest(
        "#progress-group, #layer-donate-compact, #layer-status.donation-open-target"
      )
    ) {
      return;
    }
    closeDonationPanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.body.classList.contains("checkout-open")) return;
    if (isDonationPanelOpen()) closeDonationPanel();
  });

  window.addEventListener("resize", () => {
    const nowMobile = isMobileLayout();
    if (nowMobile !== lastMobileBreakpoint) {
      mobileMenuOpen = false;
      document.body.classList.remove("menu-open");
      if (donationPanelT > 0) setDonationPanelOpen(false, { animate: false });
    }
    lastMobileBreakpoint = nowMobile;

    cachedMobileWelcomeEnd = 0;
    updateSceneHeight();
    const realY = Math.max(0, window.scrollY - scene.offsetTop);
    if (realY >= getZoneEnd() - 40) {
      pageState = STATE_ARTICLE;
    } else {
      pageState = STATE_WELCOME;
    }
    render();
  });
  let renderQueued = false;
  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      render();
    });
  }

  window.addEventListener("scroll", scheduleRender, { passive: true });

  updateSceneHeight();
  render();
})();
