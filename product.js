import { inventory, getProductById, getRelatedProducts } from "./products-data.js";
import { addToCart, formatPrice, setupCartBadge, showCartFeedback } from "./cart.js";

setupCartBadge();

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

const params = new URLSearchParams(window.location.search);
const requestedProduct = params.get("id") || params.get("product") || params.get("slug");
const product = getProductById(requestedProduct);
const productState = document.querySelector("[data-product-state]");
const productForm = document.getElementById("product-form");
const quantityInput = document.getElementById("quantity");
const mainImage = document.getElementById("product-main-image");
const thumbnailRow = document.getElementById("product-thumbnails");
const colorOptions = document.getElementById("color-options");
const sizeOptions = document.getElementById("size-options");
const selectedColor = document.querySelector("[data-selected-color]");
const selectedSize = document.querySelector("[data-selected-size]");
const year = document.querySelector("[data-year]");

let activeColor = "";
let activeSize = "";

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

function renderMissingProduct() {
  document.title = "Product Not Found | Dreyluxe";
  productState.innerHTML = `
    <div class="missing-product">
      <h1>Product Not Found</h1>
      <p>This product link does not match an item in the Dreyluxe catalog yet.</p>
      <a class="button button-primary" href="../Shop-page/Shop.html">Back to Shop</a>
    </div>
  `;
  document.querySelector(".product-details-grid")?.remove();
  document.querySelector(".related-section")?.remove();
}

function updateMainImage(src, alt) {
  mainImage.src = src;
  mainImage.alt = alt;

  thumbnailRow.querySelectorAll(".thumbnail-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.image === src);
  });
}

function renderGallery() {
  updateMainImage(product.image, product.alt);
  thumbnailRow.innerHTML = product.gallery
    .map((image, index) => `
      <button class="thumbnail-button${index === 0 ? " is-active" : ""}" type="button" data-image="${image}" aria-label="View image ${index + 1}">
        <img src="${image}" alt="${escapeHtml(product.name)} image ${index + 1}" loading="lazy" />
      </button>
    `)
    .join("");

  thumbnailRow.addEventListener("click", (event) => {
    const button = event.target.closest(".thumbnail-button");
    if (!button) {
      return;
    }

    updateMainImage(button.dataset.image, product.alt);
  });
}

function renderOptionButtons(container, options, selectedValue, optionType) {
  container.innerHTML = options
    .map((option) => `
      <button class="option-button${option === selectedValue ? " is-selected" : ""}" type="button" data-option-type="${optionType}" data-option-value="${escapeHtml(option)}">
        ${escapeHtml(option)}
      </button>
    `)
    .join("");
}

function syncSelectedLabels() {
  selectedColor.textContent = activeColor;
  selectedSize.textContent = activeSize;

  document.querySelectorAll("[data-option-type='color']").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.optionValue === activeColor);
  });

  document.querySelectorAll("[data-option-type='size']").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.optionValue === activeSize);
  });
}

function renderOptions() {
  activeColor = product.colors[0] || "Default";
  activeSize = product.sizes.includes("M") ? "M" : product.sizes[0];

  renderOptionButtons(colorOptions, product.colors, activeColor, "color");
  renderOptionButtons(sizeOptions, product.sizes, activeSize, "size");
  syncSelectedLabels();

  document.querySelectorAll("[data-option-value]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.optionType === "color") {
        activeColor = button.dataset.optionValue;
      } else {
        activeSize = button.dataset.optionValue;
      }

      syncSelectedLabels();
    });
  });
}

function renderList(selector, items) {
  const list = document.querySelector(selector);
  list.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderRelatedProducts() {
  const relatedGrid = document.getElementById("related-products");
  relatedGrid.innerHTML = getRelatedProducts(product.id)
    .map((relatedProduct) => `
      <a class="related-card" href="product.html?id=${relatedProduct.id}" aria-label="View ${escapeHtml(relatedProduct.name)}">
        <span class="related-media">
          <img src="${relatedProduct.image}" alt="${escapeHtml(relatedProduct.alt)}" loading="lazy" />
        </span>
        <strong>${escapeHtml(relatedProduct.name)}</strong>
        <span>${formatPrice(relatedProduct.price)}</span>
      </a>
    `)
    .join("");
}

function bindQuantityControls() {
  document.querySelectorAll("[data-quantity-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentQuantity = Number.parseInt(quantityInput.value, 10) || 1;
      const nextQuantity = button.dataset.quantityAction === "increase"
        ? currentQuantity + 1
        : Math.max(1, currentQuantity - 1);

      quantityInput.value = String(nextQuantity);
    });
  });
}

function renderProduct() {
  document.title = `${product.name} | Dreyluxe Gospel Fashion`;
  document.querySelector("[data-product-type]").textContent = product.type;
  document.querySelector("[data-product-name]").textContent = product.name;
  document.querySelector("[data-product-price]").textContent = formatPrice(product.price);
  document.querySelector("[data-product-description]").textContent = product.description;
  document.querySelector("[data-product-story]").textContent = product.story;
  document.querySelector("[data-product-availability]").textContent = product.availability;
  document.querySelector("[data-product-fit]").textContent = product.fit;

  renderGallery();
  renderOptions();
  renderList("[data-product-features]", product.features);
  renderList("[data-product-care]", product.care);
  renderRelatedProducts();
  bindQuantityControls();
}

if (!product) {
  renderMissingProduct();
} else {
  renderProduct();
}

if (productForm && product) {
  productForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const quantity = Number.parseInt(quantityInput.value, 10) || 1;
    addToCart(product.id, {
      color: activeColor,
      size: activeSize,
      quantity
    });

    showCartFeedback(`${product.name} added to cart`);
  });
}

window.dreyluxeProducts = inventory;
