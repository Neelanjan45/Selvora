/* =========================================================
   SELVORA — PRODUCT DETAIL
   ========================================================= */


/* =========================================================
   PRODUCT DATA
   ========================================================= */

const PRODUCT_API_URL = "https://script.google.com/macros/s/AKfycbw5x2_GxhYIV1SEX4fON8YUORn8LZ-Pz-eZ3Sv7wmU93iXxDDwwy22MDoRP2WiNPowvZQ/exec";


/* =========================================================
   ELEMENTS
========================================================= */

const productLoading =
    document.querySelector("#productLoading");

const productError =
    document.querySelector("#productError");

const productContent =
    document.querySelector("#productContent");

const productImage =
    document.querySelector("#productImage");

const productIndex =
    document.querySelector("#productIndex");

const productMood =
    document.querySelector("#productMood");

const productName =
    document.querySelector("#productName");

const productTagline =
    document.querySelector("#productTagline");

const productDescription =
    document.querySelector("#productDescription");

const topNotes =
    document.querySelector("#topNotes");

const heartNotes =
    document.querySelector("#heartNotes");

const baseNotes =
    document.querySelector("#baseNotes");

const productSize =
    document.querySelector("#productSize");

const productPrice =
    document.querySelector("#productPrice");

const quantityInput =
    document.querySelector("#quantity");

const quantityMinus =
    document.querySelector("#quantityMinus");

const quantityPlus =
    document.querySelector("#quantityPlus");

const addToCartButton =
    document.querySelector("#addToCart");

const cartFeedback =
    document.querySelector("#cartFeedback");


/* =========================================================
   PRODUCT IDENTIFICATION
========================================================= */

const params =
    new URLSearchParams(window.location.search);

const productSlug =
    params.get("product");


let currentProduct = null;


/* =========================================================
   INITIALISE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!productSlug) {
            showError(
                "No fragrance was specified."
            );
            return;
        }

        loadProduct();
        updateCartCount();
    }
);


/* =========================================================
   LOAD PRODUCT
========================================================= */

async function loadProduct() {

    showLoading();

    try {

        const response = await fetch(
            `${PRODUCT_API_URL}?action=product&slug=${encodeURIComponent(
                productSlug
            )}`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Product request failed: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.success || !data.product) {
            throw new Error(
                data.error || "Product not found."
            );
        }

        currentProduct = data.product;

        renderProduct(currentProduct);

    } catch (error) {

        console.error(
            "Selvora product error:",
            error
        );

        showError(
            "This fragrance could not be found."
        );
    }
}


/* =========================================================
   RENDER PRODUCT
========================================================= */

function renderProduct(product) {

    document.title =
        `${product.name} | Selvora`;

    const firstMedia =
        product.media?.[0]?.url || "";

    if (productImage) {

        if (firstMedia) {

            productImage.src =
                firstMedia;

            productImage.alt =
                `${product.name} fragrance`;

            productImage.hidden = false;

        } else {

            productImage.hidden = true;
        }
    }


    if (productIndex) {

        productIndex.textContent =
            String(product.display_order || "")
                .padStart(2, "0");
    }


    if (productMood) {

        productMood.textContent =
            product.mood || "";
    }


    if (productName) {

        productName.textContent =
            product.name || "";
    }


    if (productTagline) {

        productTagline.textContent =
            product.tagline || "";
    }


    if (productDescription) {

        productDescription.textContent =
            product.description || "";
    }


    renderNotes(
        topNotes,
        product.notes?.top
    );

    renderNotes(
        heartNotes,
        product.notes?.heart
    );

    renderNotes(
        baseNotes,
        product.notes?.base
    );


    if (productSize) {

        productSize.textContent =
            product.size || "";
    }


    if (productPrice) {

        productPrice.textContent =
            formatPrice(
                product.price,
                product.currency
            );
    }


    renderGallery(product.media);

    setupAvailability(product.status);

    productLoading.hidden = true;
    productError.hidden = true;
    productContent.hidden = false;
}


/* =========================================================
   NOTES
========================================================= */

function renderNotes(element, notes) {

    if (!element) return;

    const values =
        Array.isArray(notes)
            ? notes
            : [];

    element.innerHTML =
        values.length
            ? values
                .map(note =>
                    `<span>${escapeHTML(note)}</span>`
                )
                .join("")
            : "<span>—</span>";
}


/* =========================================================
   MEDIA GALLERY
========================================================= */

function renderGallery(media) {

    if (!Array.isArray(media)) {
        return;
    }

    /*
     * The existing product page currently has
     * one main image.
     *
     * For now we use the first media as the main image.
     *
     * We'll enhance this into a proper gallery
     * once the basic data flow is confirmed.
     */

    if (!media.length || !productImage) {
        return;
    }

    productImage.src =
        media[0].url;
}


/* =========================================================
   AVAILABILITY
========================================================= */

function setupAvailability(status) {

    if (!addToCartButton) {
        return;
    }

    const normalizedStatus =
        String(status || "active")
            .toLowerCase();

    if (normalizedStatus === "active") {

        addToCartButton.disabled = false;

        addToCartButton.textContent =
            "Add to cart";

        return;
    }


    addToCartButton.disabled = true;


    if (normalizedStatus === "sold_out") {

        addToCartButton.textContent =
            "Sold out";

    } else if (
        normalizedStatus === "coming_soon"
    ) {

        addToCartButton.textContent =
            "Coming soon";

    } else {

        addToCartButton.textContent =
            "Unavailable";
    }
}


/* =========================================================
   QUANTITY
========================================================= */

quantityMinus?.addEventListener(
    "click",
    () => {

        const current =
            Number(quantityInput.value || 1);

        quantityInput.value =
            Math.max(1, current - 1);
    }
);


quantityPlus?.addEventListener(
    "click",
    () => {

        const current =
            Number(quantityInput.value || 1);

        quantityInput.value =
            Math.min(10, current + 1);
    }
);


/* =========================================================
   ADD TO CART
========================================================= */

addToCartButton?.addEventListener(
    "click",
    () => {

        if (!currentProduct) {
            return;
        }

        const quantity =
            Math.min(
                10,
                Math.max(
                    1,
                    Number(
                        quantityInput?.value || 1
                    )
                )
            );


        const cart =
            JSON.parse(
                localStorage.getItem(
                    "selvoraCart"
                ) || "[]"
            );


        const existing =
            cart.find(
                item =>
                    item.slug ===
                    currentProduct.slug
            );


        if (existing) {

            existing.quantity =
                Math.min(
                    10,
                    existing.quantity +
                    quantity
                );

        } else {

            cart.push({

                id:
                    currentProduct.id,

                slug:
                    currentProduct.slug,

                name:
                    currentProduct.name,

                size:
                    currentProduct.size,

                price:
                    currentProduct.price,

                currency:
                    currentProduct.currency,

                image:
                    currentProduct.media?.[0]?.url || "",

                quantity:
                    quantity
            });
        }


        localStorage.setItem(
            "selvoraCart",
            JSON.stringify(cart)
        );


        updateCartCount();
        showCartFeedback(quantity);
    }
);


/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {

    const cart =
        JSON.parse(
            localStorage.getItem(
                "selvoraCart"
            ) || "[]"
        );


    const count =
        cart.reduce(
            (total, item) =>
                total +
                Number(item.quantity || 0),
            0
        );


    document
        .querySelectorAll(".cart-count")
        .forEach(element => {

            element.textContent =
                count;
        });
}


/* =========================================================
   CART FEEDBACK
========================================================= */

function showCartFeedback(quantity) {

    if (!cartFeedback) {
        return;
    }

    cartFeedback.textContent =
        quantity > 1
            ? `${quantity} added to cart.`
            : "Added to cart.";

    cartFeedback.hidden = false;


    window.setTimeout(
        () => {

            cartFeedback.hidden = true;

        },
        2500
    );
}


/* =========================================================
   PRICE
========================================================= */

function formatPrice(
    price,
    currency = "INR"
) {

    const amount =
        Number(price || 0);


    if (currency === "INR") {

        return `₹${amount.toLocaleString(
            "en-IN"
        )}`;
    }


    return `${currency} ${amount.toLocaleString()}`;
}


/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    if (productLoading) {
        productLoading.hidden = false;
    }

    if (productError) {
        productError.hidden = true;
    }

    if (productContent) {
        productContent.hidden = true;
    }
}


function showError(message) {

    if (productLoading) {
        productLoading.hidden = true;
    }

    if (productContent) {
        productContent.hidden = true;
    }

    if (productError) {

        productError.hidden = false;

        const messageElement =
            productError.querySelector(
                "[data-product-error]"
            );

        if (messageElement) {
            messageElement.textContent =
                message;
        }
    }
}


/* =========================================================
   SECURITY
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}