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

const productGalleryThumbnails =
    document.querySelector("#productGalleryThumbnails");

let productMediaItems = [];

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

const productSize =
    document.querySelector("#productSize");

const productPrice =
    document.querySelector("#productPrice");

const quantityInput =
    document.querySelector("#quantity");

const quantityMinus =
    document.querySelector("#quantityDecrease");

const quantityPlus =
    document.querySelector("#quantityIncrease");

const addToCartButton =
    document.querySelector("#addToCart");

const cartFeedback =
    document.querySelector("#cartFeedback");


/* =========================================================
   PRODUCT IDENTIFICATION
========================================================= */

const params =
    new URLSearchParams(window.location.search);

// Preferred clean route: /fragrances/product-slug
// Legacy fallback: /product.html?product=product-slug
function getProductSlugFromLocation() {
    const pathParts = window.location.pathname
        .split("/")
        .filter(Boolean);

    const fragranceIndex = pathParts.indexOf("fragrances");

    if (fragranceIndex !== -1 && pathParts[fragranceIndex + 1]) {
        try {
            return decodeURIComponent(pathParts[fragranceIndex + 1]);
        } catch (error) {
            return pathParts[fragranceIndex + 1];
        }
    }

    return params.get("product");
}

const productSlug = getProductSlugFromLocation();


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
        productDescription.innerHTML = renderDescriptionHTML(product.description || "");
    }
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
   MEDIA GALLERY
========================================================= */

function renderGallery(media) {

    if (!productImage) return;

    // Sort by the Order column exposed by the product API.
    // If an order value is absent, retain the API's original sequence.
    productMediaItems = (Array.isArray(media) ? media : [])
        .map((item, originalIndex) => ({
            ...item,
            _originalIndex: originalIndex,
            _displayOrder: getMediaOrder(item)
        }))
        .filter(item => item.url)
        .sort((a, b) => {
            const aHasOrder = Number.isFinite(a._displayOrder);
            const bHasOrder = Number.isFinite(b._displayOrder);

            if (aHasOrder && bHasOrder && a._displayOrder !== b._displayOrder) {
                return a._displayOrder - b._displayOrder;
            }

            if (aHasOrder !== bHasOrder) {
                return aHasOrder ? -1 : 1;
            }

            return a._originalIndex - b._originalIndex;
        });

    if (!productMediaItems.length) {
        productImage.removeAttribute("src");
        productImage.alt = "";
        productImage.hidden = true;

        if (productGalleryThumbnails) {
            productGalleryThumbnails.replaceChildren();
            productGalleryThumbnails.hidden = true;
        }
        return;
    }

    productImage.hidden = false;
    selectGalleryImage(0);

    if (!productGalleryThumbnails) return;

    productGalleryThumbnails.replaceChildren();

    if (productMediaItems.length < 2) {
        productGalleryThumbnails.hidden = true;
        return;
    }

    productMediaItems.forEach((item, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "product-gallery-thumbnail";
        button.setAttribute("aria-label", `View product image ${index + 1}`);
        button.setAttribute("aria-pressed", index === 0 ? "true" : "false");

        const thumbnail = document.createElement("img");
        thumbnail.src = item.url;
        thumbnail.alt = "";
        thumbnail.loading = "lazy";

        button.appendChild(thumbnail);
        button.addEventListener("click", () => selectGalleryImage(index));
        productGalleryThumbnails.appendChild(button);
    });

    productGalleryThumbnails.hidden = false;
}


function getMediaOrder(item) {
    const rawOrder =
        item?.order ??
        item?.Order ??
        item?.display_order ??
        item?.sort_order ??
        item?.media_order;

    if (rawOrder === null || rawOrder === undefined || String(rawOrder).trim() === "") {
        return Number.NaN;
    }

    const parsedOrder = Number(rawOrder);
    console.log(parsedOrder)
    return Number.isFinite(parsedOrder) ? parsedOrder : Number.NaN;
}


function selectGalleryImage(index) {
    const item = productMediaItems[index];
    if (!item || !productImage) return;

    productImage.src = item.url;
    productImage.alt = `${currentProduct?.name || "Selvora"} fragrance image ${index + 1}`;

    if (!productGalleryThumbnails) return;

    productGalleryThumbnails
        .querySelectorAll(".product-gallery-thumbnail")
        .forEach((button, buttonIndex) => {
            button.setAttribute(
                "aria-pressed",
                buttonIndex === index ? "true" : "false"
            );
        });
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
            Number(quantityInput.textContent || 1);

        quantityInput.textContent =
            Math.max(1, current - 1);
    }
);


quantityPlus?.addEventListener(
    "click",
    () => {

        const current =
            Number(quantityInput.textContent || 1);

        quantityInput.textContent =
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
                        quantityInput?.textContent || 1
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
                    productMediaItems[0]?.url || currentProduct.media?.[0]?.url || "",

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
   DESCRIPTION FORMATTING
========================================================= */

// Render only a small allowlist of formatting tags. Escape all text and
// unsupported tags so arbitrary HTML or scripts cannot be injected.
function renderDescriptionHTML(value) {
    const allowedTags = new Set([
        "br", "bold", "b", "strong", "i", "em", "p", "h2", "h3", "h4", "ul", "li"
    ]);

    const source = String(value ?? "");
    const tokenPattern = /<\/?[a-zA-Z][^>]*>/g;
    let output = "";
    let lastIndex = 0;
    let match;

    while ((match = tokenPattern.exec(source)) !== null) {
        output += escapeHTML(source.slice(lastIndex, match.index));
        const token = match[0];
        const tagMatch = token.match(/^<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\s*(\/?)\s*>$/);

        if (!tagMatch) {
            output += escapeHTML(token);
        } else {
            const closing = Boolean(tagMatch[1]);
            const tag = tagMatch[2].toLowerCase();
            const selfClosing = Boolean(tagMatch[3]);

            if (!allowedTags.has(tag)) {
                output += escapeHTML(token);
            } else if (tag === "br") {
                output += "<br>";
            } else {
                const outputTag = tag === "bold" ? "strong" : tag;
                if (closing) {
                    output += `</${outputTag}>`;
                } else {
                    output += `<${outputTag}>`;
                    if (selfClosing) output += `</${outputTag}>`;
                }
            }
        }
        lastIndex = tokenPattern.lastIndex;
    }

    output += escapeHTML(source.slice(lastIndex));
    return output;
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