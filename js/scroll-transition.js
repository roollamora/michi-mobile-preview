(function () {
  const scene = document.getElementById("scene");
  const nav = document.getElementById("layer-nav");
  const cutout = document.getElementById("layer-cutout");
  const article = document.getElementById("layer-article");
  const articleInner = document.getElementById("article-scroll-inner");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenuPanel = document.getElementById("mobile-menu-panel");
  if (!scene || !nav || !cutout || !article || !articleInner) return;

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
    donationForms: document.getElementById("layer-donation-forms"),
    donationInfo: document.getElementById("layer-donation-info"),
    progressFrame: document.getElementById("progressFrame"),
    progressMarker: document.getElementById("progressMarkerTriangle"),
    donationAmount: document.getElementById("donationAmount"),
  };

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
  const DONATION_TOP_Y = 500;
  const DONATION_FORMS_H = 278;
  const DONATION_INFO_H = 300;
  const DONATION_PROGRESS_Y = DONATION_TOP_Y + DONATION_FORMS_H + 14;
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
        anchor: "top-left",
        from: { x: 98, y: 309, w: 296, h: 283 },
        to: { x: 98, y: 309, w: 150, h: 283 },
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
          y: DONATION_TOP_Y,
          w: DONATION_COL_W,
          h: DONATION_INFO_H,
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

  function updateCutout(index) {
    const link = navLinks[index];
    if (!link) return;
    const row = link.closest(".nav-row");
    if (!row) return;

    const navRect = nav.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const heroBlackRect = layers.heroBlack.getBoundingClientRect();
    const padY = 4;

    const left = Math.max(0, linkRect.left - navRect.left - 10);
    const top = Math.max(0, rowRect.top - navRect.top - padY);
    const right = heroBlackRect.right - navRect.left;
    const width = Math.max(1, right - left);
    const height = Math.max(1, rowRect.height + padY * 2);

    cutout.style.left = `${left}px`;
    cutout.style.top = `${top}px`;
    cutout.style.width = `${width}px`;
    cutout.style.height = `${height}px`;
    cutout.style.opacity = "1";
  }

  function activeSection(articleOffset, viewportPx) {
    const pivot = articleOffset + viewportPx * 0.5;
    let index = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= pivot) index = i;
    });
    return index;
  }

  function shiftProgressLabels(p, progressRect) {
    const frameLeft = progressRect
      ? progressRect.x
      : sx(lerp(99, DONATION_LEFT_X, p));
    const frameTop = progressRect ? progressRect.y : sy(lerp(468, 701, p));
    const frameWidth = progressRect ? progressRect.w : sx(441);
    const frameRight = frameLeft + frameWidth;

    const goalEl = document.getElementById("goalAmount");
    if (goalEl) {
      goalEl.style.left = `${frameRight}px`;
      goalEl.style.top = `${frameTop + sy(52)}px`;
      goalEl.style.transform = "translateX(-100%)";
      goalEl.style.width = "auto";
      goalEl.style.textAlign = "right";
    }
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
    setRectPx(layers.progressFrame, progressLeft, progressTop, progressWidth, progressHeight);
    shiftProgressLabels(1, {
      x: progressLeft,
      y: progressTop,
      w: progressWidth,
      h: progressHeight,
    });

    const frameStyle = window.getComputedStyle(layers.progressFrame);
    const border = parseFloat(frameStyle.borderLeftWidth) || 9;
    const innerInsetX = border + 1;
    const innerInsetY = border + 1;
    const innerWidth = Math.max(1, progressWidth - border * 2 - 1);
    const innerHeight = Math.max(1, progressHeight - (border + 1) * 2);
    const markerTop = progressTop + progressHeight * (PROGRESS_BASE.markerTopOffset / PROGRESS_BASE.frameH);
    const amountTop = progressTop + progressHeight * (PROGRESS_BASE.amountTopOffset / PROGRESS_BASE.frameH);
    window.MichiSite?.setProgressLayout?.({
      barLeft: progressLeft + innerInsetX,
      barTop: progressTop + innerInsetY,
      barHeight: innerHeight,
      innerWidth,
      markerOffset: markerTop - (progressTop + innerInsetY + innerHeight),
      markerTop,
      amountTop,
    });

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
    [
      layers.rightGrey,
      layers.heroBlack,
      layers.heroTitle,
      layers.greeting,
      layers.intro,
      layers.portrait,
      layers.article,
      layers.donationBorder,
      layers.footerBar,
      layers.footerBg,
      layers.donate,
      layers.donationForms,
      layers.donationInfo,
    ].forEach((el) => {
      if (el) el.style.zIndex = "";
    });

    const y = getRenderY();
    const raw = clamp01(y / transitionPx);
    const pScroll = prefersReduced ? (raw >= 0.5 ? 1 : 0) : raw;
    const pLayout = pScroll;
    lastProgress = pScroll;

    applyRect("leftBg", layers.leftBg, pLayout);
    applyRect("divider", layers.divider, pLayout);
    applyRect("rightGrey", layers.rightGrey, pLayout);
    applyRect("heroBlack", layers.heroBlack, pLayout);
    applyRect("heroTitle", layers.heroTitle, pLayout, { height: false });
    layers.heroTitle.style.right = "";
    layers.heroTitle.style.transform = "";
    layers.heroTitle.style.transformOrigin = "";
    lerpTitleTypography(pLayout);

    const greetingRect = applyRect("greeting", layers.greeting, pLayout, { height: false });
    layers.greeting.style.whiteSpace = "nowrap";
    const introRect = applyRect("intro", layers.intro, pLayout, { height: false });
    if (greetingRect && introRect && layers.greeting && layers.intro) {
      const greetingHeight = layers.greeting.getBoundingClientRect().height;
      const introTop = greetingRect.y + greetingHeight + sy(2);
      setRectPx(layers.intro, introRect.x, introTop, introRect.w, introRect.h);
    }
    applyRect("portrait", layers.portrait, pLayout);

    applyRect("nav", layers.nav, pLayout);
    const articleRect = resolveRect("article", pLayout);
    const articleTop = articleRect ? articleRect.y : sy(lerp(ARTICLE_TOP_FROM, ARTICLE_TOP_TO, pLayout));
    const footerRect = resolveRect("footerBar", pLayout);
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

    applyRect("donationBorder", layers.donationBorder, pLayout);
    applyRect("footerBar", layers.footerBar, pLayout);
    applyRect("footerBg", layers.footerBg, pLayout);
    applyRect("donate", layers.donate, pLayout);
    applyRect("donationForms", layers.donationForms, pLayout);
    applyRect("donationInfo", layers.donationInfo, pLayout);

    const progressRect = applyRect("progressFrame", layers.progressFrame, pLayout);
    shiftProgressLabels(pLayout, progressRect);

    const introFade = fadeOut(pLayout, 0.12, 0.56);
    const landingFade = fadeOut(pLayout, 0.18, 0.68);
    const transformedFade = fadeIn(pLayout, 0.62, 0.94);
    const panelFade = fadeIn(pLayout, 0.52, 0.9);
    const donateCompactFade = transformedFade * fadeOut(pLayout, 0.68, 0.86);
    const panelContentFade = fadeIn(pLayout, 0.58, 0.92);

    setOpacity(layers.divider, landingFade);
    setOpacity(layers.rightGrey, landingFade);
    setOpacity(layers.greeting, introFade);
    setOpacity(layers.intro, introFade);
    setOpacity(layers.portrait, landingFade);

    setOpacity(layers.nav, transformedFade);
    setOpacity(cutout, transformedFade);
    setOpacity(layers.article, transformedFade);
    setOpacity(layers.donationBorder, panelFade);
    setOpacity(layers.footerBar, panelFade);
    setOpacity(layers.footerBg, panelFade);
    setOpacity(layers.donate, donateCompactFade);
    setLayerVisible(layers.donationForms, panelContentFade);
    setLayerVisible(layers.donationInfo, panelContentFade);

    const revealLift = articleOffset > 0 ? 0 : sy(112) * fadeOut(pLayout, 0.58, 1);
    articleInner.style.transform = `translateY(${revealLift - articleOffset}px)`;

    const activeIndex = forcedIndex != null ? forcedIndex : activeSection(articleOffset, sy(articleHeight));
    updateCutout(activeIndex);

    const progressRectMetrics = progressRect;

    const frameLeft = progressRectMetrics
      ? progressRectMetrics.x
      : sx(lerp(99, DONATION_LEFT_X, pLayout));
    const frameTop = progressRectMetrics ? progressRectMetrics.y : sy(lerp(468, 701, pLayout));
    const frameWidth = progressRectMetrics ? progressRectMetrics.w : sx(441);
    const frameHeight = progressRectMetrics ? progressRectMetrics.h : sy(47);
    const frameStyle = window.getComputedStyle(layers.progressFrame);
    const border = parseFloat(frameStyle.borderLeftWidth) || 9;
    const innerInsetX = border + 1;
    const innerInsetY = border + 1;
    const innerWidth = Math.max(1, frameWidth - border * 2 - 1);
    const innerHeight = Math.max(1, frameHeight - (border + 1) * 2);
    const markerTop = frameTop + frameHeight * (PROGRESS_BASE.markerTopOffset / PROGRESS_BASE.frameH);
    const amountTop = frameTop + frameHeight * (PROGRESS_BASE.amountTopOffset / PROGRESS_BASE.frameH);
    if (layers.progressMarker) {
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

  navLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      forcedIndex = index;
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

  window.addEventListener("resize", () => {
    const nowMobile = isMobileLayout();
    if (nowMobile !== lastMobileBreakpoint) {
      mobileMenuOpen = false;
      document.body.classList.remove("menu-open");
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
  window.addEventListener("scroll", render, { passive: true });

  updateSceneHeight();
  render();
})();
