import { inventory } from "./products-data.js";
import {
  formatPrice,
  getCartItems,
  getCartSubtotal,
  setupCartBadge
} from "./cart.js";
import {
  getAccountLabel,
  readProfile,
  saveProfile,
  syncAccountLinks,
  watchAccount
} from "./dreyluxe-auth.js";

const CHECKOUT_STORAGE_KEY = "dreyluxe_checkout_v1";

const checkoutForm = document.querySelector("#checkout-form");
const statusMessage = document.querySelector("#checkout-status");
const checkoutItems = document.querySelector("#checkout-items");
const checkoutSubtotal = document.querySelector("#checkout-subtotal");
const copyButton = document.querySelector("#copy-checkout");
const accountNote = document.querySelector("#checkout-account-note");
const year = document.querySelector("[data-year]");

const fieldIds = {
  fullName: "checkout-name",
  email: "checkout-email",
  phone: "checkout-phone",
  city: "checkout-city",
  address: "checkout-address",
  note: "checkout-note"
};

let activeAccount = null;

setupCartBadge();
syncAccountLinks();

const fixHeader = () => {
  const header = document.querySelector("header");
  if (header) {
    header.classList.add("is-fixed");
    document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
  }
};
fixHeader();
window.addEventListener("load", fixHeader);
window.addEventListener("resize", fixHeader);

if (year) {
  year.textContent = new Date().getFullYear();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readCheckoutDetails() {
  try {
    return JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || "{}");
  } catch (error) {
    console.warn("Could not read checkout details:", error);
    return {};
  }
}

function saveCheckoutDetails(details) {
  localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify({
    ...details,
    updatedAt: new Date().toISOString()
  }));
}

function setFieldValue(name, value) {
  const field = document.getElementById(fieldIds[name]);
  if (field) {
    field.value = value || "";
  }
}

function getFormDetails() {
  const formData = new FormData(checkoutForm);
  return {
    fullName: String(formData.get("fullName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    paymentMethod: String(formData.get("paymentMethod") || "Bank transfer after confirmation")
  };
}

function populateCheckoutFields(account) {
  const profile = readProfile();
  const checkoutDetails = readCheckoutDetails();
  const values = {
    fullName: checkoutDetails.fullName || profile.fullName || getAccountLabel(account),
    email: checkoutDetails.email || profile.email || account?.email || "",
    phone: checkoutDetails.phone || profile.phone || "",
    city: checkoutDetails.city || profile.city || "",
    address: checkoutDetails.address || profile.address || "",
    note: checkoutDetails.note || profile.note || ""
  };

  Object.entries(values).forEach(([name, value]) => setFieldValue(name, value));
}

function renderOrderSummary() {
  const cartItems = getCartItems(inventory);
  const hasItems = cartItems.length > 0;

  checkoutSubtotal.textContent = formatPrice(getCartSubtotal(inventory));
  copyButton.disabled = !hasItems;

  if (!hasItems) {
    checkoutItems.innerHTML = `
      <p class="empty-checkout-note">Your cart is empty. Return to the shop to add a Dreyluxe piece before checkout.</p>
    `;
    return;
  }

  checkoutItems.innerHTML = cartItems
    .map((item) => `
      <article class="order-item">
        <img src="${item.product.image}" alt="${escapeHtml(item.product.alt)}" loading="lazy" />
        <div>
          <h3>${escapeHtml(item.product.name)}</h3>
          <p>${escapeHtml(item.color)} / ${escapeHtml(item.size)} / Qty ${item.quantity}</p>
          <strong>${formatPrice(item.lineTotal)}</strong>
        </div>
      </article>
    `)
    .join("");
}

function getCheckoutSummaryText() {
  const cartItems = getCartItems(inventory);
  const details = getFormDetails();
  const lines = cartItems.map((item, index) => (
    `${index + 1}. ${item.product.name} - ${item.color}, ${item.size}, Qty ${item.quantity} - ${formatPrice(item.lineTotal)}`
  ));

  return [
    "Dreyluxe checkout request",
    `Account: ${activeAccount ? getAccountLabel(activeAccount) : "Guest"}`,
    `Name: ${details.fullName || "Not provided"}`,
    `Email: ${details.email || "Not provided"}`,
    `Phone: ${details.phone || "Not provided"}`,
    `City: ${details.city || "Not provided"}`,
    `Address: ${details.address || "Not provided"}`,
    `Payment follow-up: ${details.paymentMethod}`,
    details.note ? `Order note: ${details.note}` : "",
    "Items:",
    ...lines,
    `Subtotal: ${formatPrice(getCartSubtotal(inventory))}`
  ].filter(Boolean).join("\n");
}

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", type === "error");
}

watchAccount((account) => {
  activeAccount = account;
  accountNote.textContent = account?.email
    ? `${account.email} is connected to this checkout.`
    : "Sign in to connect this checkout to your profile.";
  populateCheckoutFields(account);
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const details = getFormDetails();

  if (!details.fullName || !details.email || !details.phone || !details.city || !details.address) {
    setStatus("Fill in the required checkout details before saving.", "error");
    return;
  }

  saveProfile(details);
  saveCheckoutDetails(details);
  setStatus("Checkout details saved. Copy the summary or contact Dreyluxe to complete the order.");
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(getCheckoutSummaryText());
    setStatus("Order summary copied.");
  } catch (error) {
    console.error("Clipboard error:", error);
    setStatus("Copy failed. Select and copy the order details manually.", "error");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "dreyluxe_cart_v1") {
    renderOrderSummary();
  }
});

renderOrderSummary();
