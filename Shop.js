import { inventory } from "./products-data.js";
import { addToCart, formatPrice, setupCartBadge, showCartFeedback } from "./cart.js";
import { syncAccountLinks } from "./dreyluxe-auth.js";

const shopGrid = document.getElementById("shop-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = new Date().getFullYear();
}

setupCartBadge();
syncAccountLinks();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProducts(productsToDisplay) {
  shopGrid.innerHTML = "";

  if (productsToDisplay.length === 0) {
    shopGrid.innerHTML = "<p class='shop-empty'>No products found in this category.</p>";
    return;
  }

  shopGrid.innerHTML = productsToDisplay
    .map((product) => `
      <article class="shop-card">
        <a class="card-media" href="product.html?id=${product.id}" aria-label="View ${escapeHtml(product.name)}">
          <span class="product-type-badge">${escapeHtml(product.type)}</span>
          <img src="${product.image}" alt="${escapeHtml(product.alt)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x500/123125/d9aa45?text=Dreyluxe'">
        </a>
        <div class="card-content">
          <h3 class="card-title">${escapeHtml(product.name)}</h3>
          <p class="card-desc">${escapeHtml(product.description)}</p>
          <div class="card-footer">
            <span class="card-price">${formatPrice(product.price)}</span>
            <div class="card-actions">
              <a class="view-btn" href="product.html?id=${product.id}">View</a>
              <button class="add-btn" type="button" data-add-to-cart="${product.id}">Add</button>
            </div>
          </div>
        </div>
      </article>
    `)
    .join("");
}

renderProducts(inventory);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => filterButton.classList.remove("active"));
    button.classList.add("active");

    const category = button.getAttribute("data-filter");
    const productsToDisplay = category === "all"
      ? inventory
      : inventory.filter((product) => product.type === category);

    renderProducts(productsToDisplay);
  });
});

shopGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (!addButton) {
    return;
  }

  const product = inventory.find((item) => item.id === addButton.dataset.addToCart);
  if (!product) {
    return;
  }

  addToCart(product.id, {
    color: product.colors[0] || "Default",
    size: product.sizes.includes("M") ? "M" : product.sizes[0],
    quantity: 1
  });

  showCartFeedback(`${product.name} added to cart`);
});
