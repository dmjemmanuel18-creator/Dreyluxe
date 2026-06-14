import { auth, db } from "./dreyluxe-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const CART_STORAGE_KEY = "dreyluxe_cart_v1";
const CART_UPDATED_EVENT = "dreyluxe:cart-updated";

function safeQuantity(quantity) {
  const parsed = Number.parseInt(quantity, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function readCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = storedCart ? JSON.parse(storedCart) : [];
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.warn("Could not read Dreyluxe cart:", error);
    return [];
  }
}

function writeCart(cartItems, syncToCloud = true) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cartItems } }));
  updateCartBadges();

  if (syncToCloud && auth.currentUser) {
    setDoc(doc(db, "carts", auth.currentUser.uid), {
      items: cartItems,
      updatedAt: new Date().toISOString()
    }).catch((error) => console.warn("Cart cloud sync failed:", error));
  }
}

function cartLineKey(productId, size, color) {
  return `${productId}::${size || "Default"}::${color || "Default"}`;
}

export function formatPrice(value) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(value);
  } catch (error) {
    return `NGN ${Number(value || 0).toLocaleString("en-NG")}`;
  }
}

export function getCart() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((total, item) => total + safeQuantity(item.quantity), 0);
}

export function getCartItems(inventory) {
  return readCart()
    .map((cartItem) => {
      const product = inventory.find((item) => item.id === cartItem.productId);
      if (!product) {
        return null;
      }

      return {
        ...cartItem,
        product,
        lineTotal: product.price * safeQuantity(cartItem.quantity)
      };
    })
    .filter(Boolean);
}

export function getCartSubtotal(inventory) {
  return getCartItems(inventory).reduce((total, item) => total + item.lineTotal, 0);
}

export function addToCart(productId, options = {}) {
  const quantity = safeQuantity(options.quantity);
  const size = options.size || "M";
  const color = options.color || "Default";
  const lineKey = cartLineKey(productId, size, color);
  const cartItems = readCart();
  const existingItem = cartItems.find((item) => item.lineKey === lineKey);

  if (existingItem) {
    existingItem.quantity = safeQuantity(existingItem.quantity) + quantity;
  } else {
    cartItems.push({
      lineKey,
      productId,
      size,
      color,
      quantity
    });
  }

  writeCart(cartItems);
  return cartItems.find((item) => item.lineKey === lineKey);
}

export function updateCartItem(lineKey, quantity) {
  const nextQuantity = safeQuantity(quantity);
  const nextCart = readCart().map((item) =>
    item.lineKey === lineKey ? { ...item, quantity: nextQuantity } : item
  );

  writeCart(nextCart);
}

export function removeFromCart(lineKey) {
  writeCart(readCart().filter((item) => item.lineKey !== lineKey));
}

export function clearCart() {
  writeCart([]);
}

export function updateCartBadges() {
  const cartCount = getCartCount();
  document.querySelectorAll(".cart-badge").forEach((badge) => {
    badge.textContent = String(cartCount);
    badge.setAttribute("aria-label", `${cartCount} item${cartCount === 1 ? "" : "s"} in cart`);
  });
}

export function setupCartBadge() {
  updateCartBadges();
  window.addEventListener(CART_UPDATED_EVENT, updateCartBadges);
  window.addEventListener("storage", (event) => {
    if (event.key === CART_STORAGE_KEY) {
      updateCartBadges();
    }
  });
}

export function showCartFeedback(message) {
  let toast = document.querySelector("[data-cart-toast]");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.setAttribute("data-cart-toast", "");
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showCartFeedback.hideTimer);
  showCartFeedback.hideTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}



onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docSnap = await getDoc(doc(db, "carts", user.uid));
      if (docSnap.exists()) {
        const cloudItems = docSnap.data().items || [];
        writeCart(cloudItems, false);
      }
    } catch (error) {
      console.warn("Could not fetch cloud cart:", error);
    }
  } else {
    writeCart([], false);
  }
});