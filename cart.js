/* =========================================================
   SELVORA — CART
========================================================= */

const CART_API_URL =
  "https://script.google.com/macros/s/AKfycbw5x2_GxhYIV1SEX4fON8YUORn8LZ-Pz-eZ3Sv7wmU93iXxDDwwy22MDoRP2WiNPowvZQ/exec";

const CART_KEY = "selvoraCart";

/* =========================================================
   ELEMENTS
========================================================= */

const cartCount = document.querySelector("#cartCount");

const cartEmpty = document.querySelector("#cartEmpty");

const cartContent = document.querySelector("#cartContent");

const cartItems = document.querySelector("#cartItems");

const cartItemCount = document.querySelector("#cartItemCount");

const summarySubtotal = document.querySelector("#summarySubtotal");

const summaryShipping = document.querySelector("#summaryShipping");

const summaryTotal = document.querySelector("#summaryTotal");

const couponCodeInput = document.querySelector("#couponCode");

const applyCouponButton = document.querySelector("#applyCoupon");

const couponMessage = document.querySelector("#couponMessage");

const couponSummaryRow = document.querySelector("#couponSummaryRow");

const summaryCouponCode = document.querySelector("#summaryCouponCode");

const summaryDiscount = document.querySelector("#summaryDiscount");

const placeOrderButton = document.querySelector("#placeOrderButton");

const orderSection = document.querySelector("#orderSection");

const backToCart = document.querySelector("#backToCart");

const orderForm = document.querySelector("#orderForm");

const submitOrderButton = document.querySelector("#submitOrder");

const orderMessage = document.querySelector("#orderMessage");

const orderSuccess = document.querySelector("#orderSuccess");

const successOrderId = document.querySelector("#successOrderId");

/* =========================================================
   STATE
========================================================= */

let cart = readCart();

let appliedCoupon = null;

let totals = {
  subtotal: 0,
  discount: 0,
  shipping: 0,
  total: 0,
};

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  renderCart();
});

/* =========================================================
   CART STORAGE
========================================================= */

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored
      .filter((item) => item && item.slug)
      .map((item) => ({
        id: item.id || "",
        slug: item.slug,
        name: item.name || item.slug,
        size: item.size || "",
        price: Number(item.price || 0),
        currency: item.currency || "INR",
        image: item.image || "",
        quantity: Math.min(10, Math.max(1, Number(item.quantity || 1))),
      }));
  } catch (error) {
    console.error("Selvora cart read error:", error);

    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  document.querySelectorAll(".cart-count").forEach((element) => {
    element.textContent = count;
  });
}

/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {
  if (!cart.length) {
    cartEmpty.hidden = false;
    cartContent.hidden = true;
    orderSection.hidden = true;

    return;
  }

  cartEmpty.hidden = true;
  cartContent.hidden = false;

  cartItems.innerHTML = cart
    .map((item, index) => createCartItem(item, index))
    .join("");

  const count = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  cartItemCount.textContent = `${count} ${count === 1 ? "item" : "items"}`;

  calculateTotals();
}

function createCartItem(item, index) {
  const unitPrice = Number(item.price || 0);

  const lineTotal = unitPrice * item.quantity;

  const imageMarkup = item.image
    ? `
                <img
                    src="${escapeAttribute(item.image)}"
                    alt="${escapeAttribute(item.name)} fragrance"
                >
              `
    : "";

  return `
        <article class="cart-item">

            <div class="cart-item-image">
                ${imageMarkup}
            </div>

            <div class="cart-item-info">

                <div class="cart-item-top">

                    <div>

                        <h3 class="cart-item-name">
                            ${escapeHTML(item.name)}
                        </h3>

                        <p class="cart-item-mood">
                            Eau de parfum
                        </p>

                    </div>

                    <strong class="cart-item-price">
                        ${formatPrice(lineTotal, item.currency)}
                    </strong>

                </div>


                <p class="cart-item-size">

                    ${escapeHTML(item.size)} ml ·

                    ${formatPrice(unitPrice, item.currency)}

                    each

                </p>


                <div class="cart-item-actions">

                    <div
                        class="cart-quantity"
                        aria-label="Quantity for ${escapeAttribute(item.name)}"
                    >

                        <button
                            type="button"
                            data-action="decrease"
                            data-index="${index}"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>

                        <span>
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            data-action="increase"
                            data-index="${index}"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>

                    </div>


                    <button
                        type="button"
                        class="cart-remove"
                        data-action="remove"
                        data-index="${index}"
                    >
                        Remove
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   CART ACTIONS
========================================================= */

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);

  if (Number.isNaN(index) || !cart[index]) {
    return;
  }

  const action = button.dataset.action;

  /* -----------------------------------------
           INCREASE
        ----------------------------------------- */

  if (action === "increase") {
    cart[index].quantity = Math.min(10, cart[index].quantity + 1);
  } else if (action === "decrease") {

  /* -----------------------------------------
           DECREASE
        ----------------------------------------- */
    cart[index].quantity = Math.max(1, cart[index].quantity - 1);
  } else if (action === "remove") {

  /* -----------------------------------------
           REMOVE
        ----------------------------------------- */
    cart.splice(index, 1);

    /*
     * Cart changed after coupon application.
     * Clear the coupon so the customer doesn't
     * accidentally use an old calculation.
     */

    if (appliedCoupon) {
      appliedCoupon = null;

      clearCouponUI();
    }
  }

  saveCart();

  renderCart();
});

/* =========================================================
   COUPON
========================================================= */

applyCouponButton?.addEventListener("click", applyCoupon);

couponCodeInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();

    applyCoupon();
  }
});

async function applyCoupon() {
  const code = String(couponCodeInput.value || "")
    .trim()
    .toUpperCase();

  if (!code) {
    appliedCoupon = null;

    clearCouponUI();

    calculateTotals();

    return;
  }

  setCouponMessage("Checking coupon...", "");

  applyCouponButton.disabled = true;

  try {
    const response = await fetch(
      `${CART_API_URL}?action=coupon&code=${encodeURIComponent(code)}`,
      {
        method: "GET",

        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Coupon request failed.");
    }

    const data = await response.json();

    if (!data.success || !data.coupon) {
      throw new Error(data.error || "Invalid coupon code.");
    }

    appliedCoupon = data.coupon;

    setCouponMessage(formatCouponMessage(appliedCoupon), "success");

    calculateTotals();
  } catch (error) {
    appliedCoupon = null;

    clearCouponUI();

    setCouponMessage(error.message || "Unable to apply coupon.", "error");

    calculateTotals();
  } finally {
    applyCouponButton.disabled = false;
  }
}

function formatCouponMessage(coupon) {
  if (coupon.discount_type === "percentage") {
    return `${coupon.code} applied — ${coupon.discount_value}% off.`;
  }

  return `${coupon.code} applied — ₹${Number(
    coupon.discount_value,
  ).toLocaleString("en-IN")} off.`;
}

function clearCouponUI() {
  couponSummaryRow.hidden = true;

  summaryCouponCode.textContent = "";

  summaryDiscount.textContent = "−₹0";

  setCouponMessage("", "");
}

function setCouponMessage(message, type) {
  couponMessage.textContent = message;

  couponMessage.classList.remove("success", "error");

  if (type) {
    couponMessage.classList.add(type);
  }
}

/* =========================================================
   TOTALS
========================================================= */

function calculateTotals() {
  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );

  let discount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = (subtotal * Number(appliedCoupon.discount_value)) / 100;
    } else {
      discount = Number(appliedCoupon.discount_value);
    }

    discount = Math.min(subtotal, discount);
  }

  /*
   * Shipping is currently ₹0.
   * We can add shipping rules later.
   */

  const shipping = 0;

  const total = Math.max(0, subtotal - discount + shipping);

  totals = {
    subtotal: roundMoney(subtotal),

    discount: roundMoney(discount),

    shipping: roundMoney(shipping),

    total: roundMoney(total),
  };

  summarySubtotal.textContent = formatPrice(totals.subtotal);

  summaryShipping.textContent = formatPrice(totals.shipping);

  summaryTotal.textContent = formatPrice(totals.total);

  if (appliedCoupon && totals.discount > 0) {
    couponSummaryRow.hidden = false;

    summaryCouponCode.textContent = appliedCoupon.code;

    summaryDiscount.textContent = `−${formatPrice(totals.discount)}`;
  } else {
    couponSummaryRow.hidden = true;
  }
}

/* =========================================================
   PLACE ORDER
========================================================= */

placeOrderButton?.addEventListener("click", () => {
  if (!cart.length) {
    return;
  }

  orderSection.hidden = false;

  orderSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  document.querySelector("#customerName")?.focus();
});

backToCart?.addEventListener("click", () => {
  orderSection.hidden = true;

  document.querySelector(".cart-layout")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

/* =========================================================
   SUBMIT ORDER
========================================================= */

document.querySelector("#customerPincode")?.addEventListener("input", event => {

    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 6);

});

orderForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!cart.length) {
    return;
  }

  orderMessage.textContent = "";

  submitOrderButton.disabled = true;

  submitOrderButton.textContent = "Submitting...";

  try {
    /*
     * IMPORTANT:
     *
     * We send only:
     * - customer information
     * - product slug
     * - quantity
     * - coupon
     *
     * We deliberately do NOT send prices.
     *
     * Apps Script looks up the actual product prices
     * again before creating the order.
     */

    const payload = {
      action: "placeOrder",

      customer: {
        name: document.querySelector("#customerName").value.trim(),

        email: document.querySelector("#customerEmail").value.trim(),

        phone: document.querySelector("#customerPhone").value.trim(),

        address_line_1: document.querySelector("#addressLine1").value.trim(),

        address_line_2: document.querySelector("#addressLine2").value.trim(),

        city: document.querySelector("#customerCity").value.trim(),

        state: document.querySelector("#customerState").value.trim(),

        pincode: document.querySelector("#customerPincode").value.trim(),
      },

      items: cart.map((item) => ({
        slug: item.slug,

        quantity: item.quantity,
      })),

      coupon: appliedCoupon?.code || "",
    };

    /*
     * Use text/plain so that the browser does not
     * perform a JSON CORS preflight against Apps Script.
     */

    const response = await fetch(CART_API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },

      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("We could not submit the order.");
    }

    const data = await response.json();

    if (!data.success || !data.order) {
      throw new Error(data.error || "We could not submit the order.");
    }

    showOrderSuccess(data.order.order_id);
  } catch (error) {
    console.error("Selvora order error:", error);

    orderMessage.textContent =
      error.message || "Something went wrong. Please try again.";

    submitOrderButton.disabled = false;

    submitOrderButton.textContent = "Submit order request";
  }
});

/* =========================================================
   ORDER SUCCESS
========================================================= */

function showOrderSuccess(orderId) {
  successOrderId.textContent = orderId;

  /*
   * Order has been accepted.
   * Clear the local cart.
   */

  cart = [];

  saveCart();

  appliedCoupon = null;

  cartContent.hidden = true;

  orderSection.hidden = true;

  cartEmpty.hidden = true;

  orderSuccess.hidden = false;

  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
}

/* =========================================================
   HELPERS
========================================================= */

function formatPrice(price, currency = "INR") {
  const amount = Number(price || 0);

  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  return `${currency} ${amount.toLocaleString()}`;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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
