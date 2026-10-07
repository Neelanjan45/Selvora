/* =========================================================
   SELVORA — CUSTOMER FEEDBACK
   ========================================================= */

const FEEDBACK_API_URL = "https://script.google.com/macros/s/AKfycbw5x2_GxhYIV1SEX4fON8YUORn8LZ-Pz-eZ3Sv7wmU93iXxDDwwy22MDoRP2WiNPowvZQ/exec";

const feedbackModal = document.querySelector("#feedbackModal");
const feedbackForm = document.querySelector("#feedbackForm");
const feedbackProduct = document.querySelector("#feedbackProduct");
const feedbackStatus = document.querySelector("#feedbackStatus");

let feedbackProductsLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-open-feedback]").forEach((button) => {
    button.addEventListener("click", openFeedback);
  });

  document.querySelectorAll("[data-close-feedback]").forEach((element) => {
    element.addEventListener("click", closeFeedback);
  });

  feedbackForm?.addEventListener("submit", submitFeedback);
});

async function openFeedback() {
  if (!feedbackModal) return;

  feedbackModal.hidden = false;
  feedbackModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("feedback-open");

  if (!feedbackProductsLoaded) {
    await loadFeedbackProducts();
  }

  window.setTimeout(() => {
    feedbackProduct?.focus();
  }, 50);
}

function closeFeedback() {
  if (!feedbackModal) return;

  feedbackModal.hidden = true;
  feedbackModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("feedback-open");
}

async function loadFeedbackProducts() {
  if (!feedbackProduct) return;

  try {
    const response = await fetch(
      `${FEEDBACK_API_URL}?action=products`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`Product request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.products)) {
      throw new Error(data.error || "Unable to load fragrances.");
    }

    const activeProducts = data.products.filter((product) => {
      return String(product.status || "").toLowerCase() === "active";
    });

    feedbackProduct.innerHTML = `
      <option value="">Choose a fragrance</option>
      ${activeProducts.map((product) => `
        <option value="${escapeFeedbackAttribute(product.slug)}">
          ${escapeFeedbackHTML(product.name)}
        </option>
      `).join("")}
    `;

    feedbackProductsLoaded = true;

  } catch (error) {
    console.error("Selvora feedback product error:", error);

    feedbackProduct.innerHTML =
      `<option value="">Unable to load fragrances</option>`;
  }
}

async function submitFeedback(event) {
  event.preventDefault();

  if (!feedbackForm) return;

  const formData = new FormData(feedbackForm);

  const payload = {
    action: "submitFeedback",
    product_slug: String(formData.get("product") || "").trim(),
    rating: Number(formData.get("rating") || 0),
    feedback: String(formData.get("feedback") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    show_name: Boolean(formData.get("consent"))
  };

  setFeedbackStatus("", "");

  const submitButton = feedbackForm.querySelector(".feedback-submit");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.querySelector("span:first-child").textContent = "Sending...";
  }

  try {
    const response = await fetch(FEEDBACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Unable to submit feedback.");
    }

    feedbackForm.reset();

    setFeedbackStatus(
      "Thank you. Your feedback has been received.",
      "success"
    );

  } catch (error) {
    console.error("Selvora feedback error:", error);

    setFeedbackStatus(
      error.message || "Something went wrong. Please try again.",
      "error"
    );

  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.querySelector("span:first-child").textContent = "Send feedback";
    }
  }
}

function setFeedbackStatus(message, type) {
  if (!feedbackStatus) return;

  feedbackStatus.textContent = message;
  feedbackStatus.className = `feedback-status ${type || ""}`.trim();
  feedbackStatus.hidden = !message;
}

function escapeFeedbackHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeFeedbackAttribute(value) {
  return escapeFeedbackHTML(value);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && feedbackModal && !feedbackModal.hidden) {
    closeFeedback();
  }
});
