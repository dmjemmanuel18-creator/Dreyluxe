import { inventory } from "./products-data.js";
import {
  clearCart,
  formatPrice,
  getCartCount,
  getCartItems,
  getCartSubtotal,
  removeFromCart,
  setupCartBadge,
  showCartFeedback,
  updateCartItem
} from "./cart.js";
import {
  syncAccountLinks,
  bindSignOut
} from "./dreyluxe-auth.js";

const cartItemsContainer = document.getElementById("cart-items");
const emptyCart = document.getElementById("cart-empty");
const cartSubtotal = document.getElementById("cart-subtotal");
const cartCountLabel = document.getElementById("cart-count-label");
const clearCartButton = document.getElementById("clear-cart");
const copyOrderButton = document.getElementById("copy-order");
const year = document.querySelector("[data-year]");

setupCartBadge();
syncAccountLinks();
bindSignOut("[data-sign-out]", "index.html");

const fixHeader = () => {
  const header = document.querySelector("header");
  if (header) {
    header.style.setProperty("position", "fixed", "important");
    header.style.setProperty("top", "0", "important");
    header.style.setProperty("left", "0", "important");
    header.style.setProperty("right", "0", "important");
    header.style.setProperty("width", "100%", "important");
    header.style.setProperty("max-width", "100vw", "important");
    header.style.setProperty("box-sizing", "border-box", "important");
    header.style.setProperty("z-index", "1000", "important");
    header.style.setProperty("padding-left", "20px", "important");
    header.style.setProperty("padding-right", "20px", "important");
    document.body.style.paddingTop = `${header.offsetHeight + 20}px`;
  }
};
fixHeader();
window.addEventListener("load", fixHeader);
window.addEventListener("resize", fixHeader);

if (year) {
  year.textContent = new Date().getFullYear();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getOrderSummaryText() {
  const cartItems = getCartItems(inventory);

  if (cartItems.length === 0) {
    return "Dreyluxe order: cart is empty.";
  }

  const lines = cartItems.map((item, index) => (
    `${index + 1}. ${item.product.name} - ${item.color}, ${item.size}, Qty ${item.quantity} - ${formatPrice(item.lineTotal)}`
  ));

  return [
    "Dreyluxe order request",
    ...lines,
    `Subtotal: ${formatPrice(getCartSubtotal(inventory))}`
  ].join("\n");
}

async function copyOrderSummary() {
  const summary = getOrderSummaryText();

  try {
    await navigator.clipboard.writeText(summary);
    showCartFeedback("Order summary copied");
  } catch (error) {
    showCartFeedback("Copy failed. Select the cart items and copy manually.");
  }
}

function renderCart() {
  const cartItems = getCartItems(inventory);
  const cartCount = getCartCount();

  cartCountLabel.textContent = `${cartCount} item${cartCount === 1 ? "" : "s"} saved`;
  cartSubtotal.textContent = formatPrice(getCartSubtotal(inventory));
  emptyCart.classList.toggle("is-visible", cartItems.length === 0);
  cartItemsContainer.hidden = cartItems.length === 0;
  clearCartButton.disabled = cartItems.length === 0;
  copyOrderButton.disabled = cartItems.length === 0;

  cartItemsContainer.innerHTML = cartItems
    .map((item) => `
      <article class="cart-item" data-line-key="${escapeHtml(item.lineKey)}">
        <a class="cart-item-media" href="product.html?id=${item.product.id}" aria-label="View ${escapeHtml(item.product.name)}">
          <img src="${item.product.image}" alt="${escapeHtml(item.product.alt)}" loading="lazy" />
        </a>
        <div class="cart-item-copy">
          <h2>${escapeHtml(item.product.name)}</h2>
          <p>${escapeHtml(item.color)} / ${escapeHtml(item.size)}</p>
          <span>${formatPrice(item.product.price)} each</span>
          <strong>${formatPrice(item.lineTotal)}</strong>
        </div>
        <div class="cart-item-controls">
          <div class="quantity-stepper" aria-label="Quantity for ${escapeHtml(item.product.name)}">
            <button type="button" data-cart-action="decrease" aria-label="Decrease quantity">-</button>
            <input type="number" min="1" value="${item.quantity}" data-cart-quantity aria-label="Quantity" />
            <button type="button" data-cart-action="increase" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-cart-button" type="button" data-cart-action="remove">Remove</button>
        </div>
      </article>
    `)
    .join("");
}

cartItemsContainer.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) {
    return;
  }

  const cartItem = button.closest("[data-line-key]");
  const lineKey = cartItem.dataset.lineKey;
  const quantityInput = cartItem.querySelector("[data-cart-quantity]");
  const currentQuantity = Number.parseInt(quantityInput.value, 10) || 1;

  if (button.dataset.cartAction === "remove") {
    removeFromCart(lineKey);
    renderCart();
    return;
  }

  const nextQuantity = button.dataset.cartAction === "increase"
    ? currentQuantity + 1
    : Math.max(1, currentQuantity - 1);

  updateCartItem(lineKey, nextQuantity);
  renderCart();
});

cartItemsContainer.addEventListener("change", (event) => {
  const input = event.target.closest("[data-cart-quantity]");
  if (!input) {
    return;
  }

  const cartItem = input.closest("[data-line-key]");
  updateCartItem(cartItem.dataset.lineKey, input.value);
  renderCart();
});

clearCartButton.addEventListener("click", () => {
  clearCart();
  renderCart();
});

copyOrderButton.addEventListener("click", copyOrderSummary);

renderCart();
