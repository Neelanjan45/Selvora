/* =========================================================
   SELVORA — COLLECTION PAGE
   ========================================================= */

/*
  Google Apps Script / Google Sheet API endpoint.

  We will add the actual URL once the Google Sheet
  structure and Apps Script endpoint are finalized.
*/
const COLLECTION_API_URL = "https://script.google.com/macros/s/AKfycbw5x2_GxhYIV1SEX4fON8YUORn8LZ-Pz-eZ3Sv7wmU93iXxDDwwy22MDoRP2WiNPowvZQ/exec";

const productGrid = document.querySelector("#productGrid");
const collectionLoading = document.querySelector("#collectionLoading");
const collectionEmpty = document.querySelector("#collectionEmpty");
const collectionError = document.querySelector("#collectionError");
const retryButton = document.querySelector("#retryCollection");


document.addEventListener("DOMContentLoaded", () => {
    loadCollection();
});


/* =========================================================
   LOAD COLLECTION
========================================================= */

async function loadCollection() {

    showLoading();

    try {

        const response = await fetch(
            `${COLLECTION_API_URL}?action=products`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Collection request failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                data.error || "Unable to load collection."
            );
        }

        const products = Array.isArray(data.products)
            ? data.products
            : [];

        if (!products.length) {
            showEmpty();
            return;
        }

        renderProducts(products);

    } catch (error) {

        console.error(
            "Selvora collection error:",
            error
        );

        showError();
    }
}


/* =========================================================
   RENDER PRODUCTS
========================================================= */

function renderProducts(products) {

    productGrid.innerHTML = products
        .map((product, index) =>
            createProductCard(product, index)
        )
        .join("");

    collectionLoading.hidden = true;
    collectionEmpty.hidden = true;
    collectionError.hidden = true;

    setupReveal();
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(product, index) {

    const image =
        product.media?.[0]?.url || "";

    const displayIndex =
        String(index + 1).padStart(2, "0");

    const price =
        formatPrice(product.price, product.currency);

    const status =
        String(product.status || "active")
            .toLowerCase();

    const isAvailable =
        status === "active";

    return `
        <article class="product-card reveal">

            <div class="product-visual">

                <span class="product-index">
                    ${displayIndex}
                </span>

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(
                                    product.name
                                )} fragrance"
                                loading="lazy"
                            />
                          `
                        : `
                            <div
                                class="product-image-placeholder"
                                aria-hidden="true">
                            </div>
                          `
                }

            </div>

            <div class="product-info">

                <div>

                    <h3 class="product-name">
                        ${escapeHTML(product.name)}
                    </h3>

                    <p class="product-mood">
                        ${escapeHTML(product.mood || "")}
                    </p>

                    <a
                        class="product-link"
                        href="/fragrances/${encodeURIComponent(
                            product.slug
                        )}"
                    >
                        View fragrance
                    </a>

                </div>

                <div class="product-price">

                    ${
                        isAvailable
                            ? price
                            : escapeHTML(
                                formatStatus(status)
                            )
                    }

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   PRICE
========================================================= */

function formatPrice(price, currency = "INR") {

    const amount = Number(price || 0);

    if (currency === "INR") {
        return `₹${amount.toLocaleString("en-IN")}`;
    }

    return `${currency} ${amount.toLocaleString()}`;
}


/* =========================================================
   STATUS
========================================================= */

function formatStatus(status) {

    const labels = {
        sold_out: "Sold out",
        coming_soon: "Coming soon"
    };

    return labels[status] || "Unavailable";
}


/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    collectionLoading.hidden = false;
    collectionEmpty.hidden = true;
    collectionError.hidden = true;

    productGrid.innerHTML = "";
}


function showEmpty() {

    collectionLoading.hidden = true;
    collectionEmpty.hidden = false;
    collectionError.hidden = true;

    productGrid.innerHTML = "";
}


function showError() {

    collectionLoading.hidden = true;
    collectionEmpty.hidden = true;
    collectionError.hidden = false;

    productGrid.innerHTML = "";
}


/* =========================================================
   RETRY
========================================================= */

retryButton?.addEventListener(
    "click",
    loadCollection
);


/* =========================================================
   REVEAL ANIMATION
========================================================= */

function setupReveal() {

    const revealElements =
        document.querySelectorAll(
            ".product-card.reveal"
        );

    if (!("IntersectionObserver" in window)) {

        revealElements.forEach(element => {
            element.classList.add("is-visible");
        });

        return;
    }

    const revealObserver =
        new IntersectionObserver(
            (entries, observer) => {

                entries.forEach(entry => {

                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add(
                        "is-visible"
                    );

                    observer.unobserve(
                        entry.target
                    );
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}


/* =========================================================
   SECURITY / HTML HELPERS
========================================================= */

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