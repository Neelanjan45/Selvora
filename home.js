/* =========================================================
   SELVORA — DYNAMIC HOMEPAGE BANNERS
   ========================================================= */

const HOME_API_URL = "https://script.google.com/macros/s/AKfycbw5x2_GxhYIV1SEX4fON8YUORn8LZ-Pz-eZ3Sv7wmU93iXxDDwwy22MDoRP2WiNPowvZQ/exec";

const bannerTrack = document.querySelector("#bannerTrack");
const bannerLoading = document.querySelector("#bannerLoading");
const bannerDots = document.querySelector("#bannerDots");
const bannerPrev = document.querySelector("#bannerPrev");
const bannerNext = document.querySelector("#bannerNext");
const bannerCounter = document.querySelector("#bannerCounter");

let homeBanners = [];
let activeBannerIndex = 0;
let bannerTimer = null;
let bannerPaused = false;

const BANNER_INTERVAL = 6000;

document.addEventListener("DOMContentLoaded", () => {
  if (!bannerTrack) return;
  loadHomeBanners();
});

async function loadHomeBanners() {

  try {

    const response = await fetch(
      `${HOME_API_URL}?action=banners`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Banner request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    if (!data.success || !Array.isArray(data.banners)) {
      throw new Error(data.error || "Unable to load banners.");
    }

    homeBanners = data.banners.filter(isUsableBanner);

    renderBanners();

  } catch (error) {

    console.error("Selvora banner error:", error);
    showBannerError();
  }
}

function isUsableBanner(banner) {
  return Boolean(
    banner &&
    String(banner.media_url || "").trim() &&
    String(banner.title || "").trim()
  );
}

function renderBanners() {

  if (!bannerTrack) return;

  if (!homeBanners.length) {
    showBannerEmpty();
    return;
  }

  bannerTrack.innerHTML = homeBanners
    .map((banner, index) => createBannerMarkup(banner, index))
    .join("");

  bannerTrack.hidden = false;

  if (bannerLoading) {
    bannerLoading.hidden = true;
  }

  activeBannerIndex = 0;
  updateBannerState();

  const hasCarousel = homeBanners.length > 1;

  if (bannerPrev) bannerPrev.hidden = !hasCarousel;
  if (bannerNext) bannerNext.hidden = !hasCarousel;
  if (bannerDots) bannerDots.hidden = !hasCarousel;

  renderBannerDots();

  if (hasCarousel) {
    setupBannerControls();
    startBannerAutoplay();
  }
}

function createBannerMarkup(banner, index) {

  const ctaText = String(banner.cta_text || "").trim();
  const ctaUrl = String(banner.cta_url || "").trim();
  const eyebrow = String(banner.eyebrow || "").trim();
  const description = String(banner.description || "").trim();
  const altText = String(banner.alt_text || banner.title || "Selvora").trim();

  return `
    <article
      class="banner-slide${index === 0 ? " is-active" : ""}"
      data-banner-index="${index}"
      aria-hidden="${index === 0 ? "false" : "true"}"
    >
      <img
        class="banner-image"
        src="${escapeAttribute(banner.media_url)}"
        alt="${escapeAttribute(altText)}"
        ${index === 0 ? '' : 'loading="lazy"'}
      >

      <div class="banner-overlay" aria-hidden="true"></div>

      <div class="banner-content">
        ${eyebrow ? `
          <div class="eyebrow">${escapeHTML(eyebrow)}</div>
        ` : ""}

        <h1>${escapeHTML(banner.title)}</h1>

        ${description ? `
          <p class="hero-description">${escapeHTML(description)}</p>
        ` : ""}

        ${ctaText && ctaUrl ? `
          <div class="hero-actions">
            <a
              class="button-link banner-cta"
              href="${escapeAttribute(ctaUrl)}"
            >
              ${escapeHTML(ctaText)}
            </a>
          </div>
        ` : ""}
      </div>
    </article>
  `;
}

function renderBannerDots() {

  if (!bannerDots || homeBanners.length < 2) {
    if (bannerDots) bannerDots.innerHTML = "";
    return;
  }

  bannerDots.innerHTML = homeBanners
    .map((banner, index) => {
      const label = banner.title || `Banner ${index + 1}`;

      return `
        <button
          class="banner-dot${index === activeBannerIndex ? " is-active" : ""}"
          type="button"
          data-banner-target="${index}"
          aria-label="Show ${escapeAttribute(label)}"
          aria-current="${index === activeBannerIndex ? "true" : "false"}"
        ></button>
      `;
    })
    .join("");
}

function updateBannerState() {

  const slides =
    bannerTrack?.querySelectorAll(".banner-slide") || [];

  slides.forEach((slide, index) => {
    const isActive = index === activeBannerIndex;

    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  if (bannerCounter) {
    bannerCounter.textContent =
      `${String(activeBannerIndex + 1).padStart(2, "0")} / ${String(homeBanners.length).padStart(2, "0")}`;
  }

  if (bannerDots) {
    bannerDots.querySelectorAll(".banner-dot").forEach((dot, index) => {
      const isActive = index === activeBannerIndex;

      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", String(isActive));
    });
  }
}

function goToBanner(index) {

  if (homeBanners.length < 2) return;

  activeBannerIndex =
    (index + homeBanners.length) % homeBanners.length;

  updateBannerState();
  restartBannerAutoplay();
}

function nextBanner() {
  goToBanner(activeBannerIndex + 1);
}

function previousBanner() {
  goToBanner(activeBannerIndex - 1);
}

function setupBannerControls() {

  bannerPrev?.addEventListener("click", previousBanner);
  bannerNext?.addEventListener("click", nextBanner);

  bannerDots?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-banner-target]");

    if (!button) return;

    goToBanner(Number(button.dataset.bannerTarget));
  });

  bannerTrack?.addEventListener("mouseenter", () => {
    bannerPaused = true;
    stopBannerAutoplay();
  });

  bannerTrack?.addEventListener("mouseleave", () => {
    bannerPaused = false;
    startBannerAutoplay();
  });

  bannerTrack?.addEventListener("focusin", () => {
    bannerPaused = true;
    stopBannerAutoplay();
  });

  bannerTrack?.addEventListener("focusout", () => {
    bannerPaused = false;
    startBannerAutoplay();
  });
}

function startBannerAutoplay() {

  if (homeBanners.length < 2 || bannerPaused) return;

  stopBannerAutoplay();

  bannerTimer = window.setInterval(() => {
    nextBanner();
  }, BANNER_INTERVAL);
}

function stopBannerAutoplay() {

  if (bannerTimer !== null) {
    window.clearInterval(bannerTimer);
    bannerTimer = null;
  }
}

function restartBannerAutoplay() {
  stopBannerAutoplay();
  startBannerAutoplay();
}

function showBannerEmpty() {

  if (bannerLoading) bannerLoading.hidden = true;
  if (bannerTrack) bannerTrack.hidden = true;
  if (bannerPrev) bannerPrev.hidden = true;
  if (bannerNext) bannerNext.hidden = true;
  if (bannerDots) bannerDots.hidden = true;

  if (bannerCounter) bannerCounter.textContent = "";
}

function showBannerError() {

  if (bannerLoading) {
    bannerLoading.hidden = false;
    bannerLoading.innerHTML =
      "<span>Selvora is preparing something new.</span>";
  }

  if (bannerTrack) bannerTrack.hidden = true;
  if (bannerPrev) bannerPrev.hidden = true;
  if (bannerNext) bannerNext.hidden = true;
  if (bannerDots) bannerDots.hidden = true;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* Pause autoplay when the browser tab is not visible. */
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopBannerAutoplay();
  } else {
    startBannerAutoplay();
  }
});

/* Respect users who prefer reduced motion. */
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  bannerPaused = true;
}
