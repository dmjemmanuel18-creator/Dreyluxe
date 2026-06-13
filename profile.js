import { inventory } from "../Products/products-data.js";
import {
  formatPrice,
  getCartItems,
  getCartSubtotal,
  setupCartBadge
} from "../Products/cart.js";
import {
  auth,
  db,
  bindSignOut,
  formatAccountDate,
  getAccountInitials,
  getAccountLabel,
  readProfile,
  saveProfile,
  syncAccountLinks,
  watchAccount
} from "../assets/js/dreyluxe-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const profileContent = document.querySelectorAll("[data-profile-content]");
const loggedOutPanel = document.querySelector("[data-logged-out]");
const signOutButton = document.querySelector("[data-sign-out]");
const initialsElement = document.querySelector("[data-account-initials]");
const accountNameElements = document.querySelectorAll("[data-account-name]");
const accountEmail = document.querySelector("[data-account-email]");
const profileForm = document.querySelector("#profile-form");
const profileStatus = document.querySelector("#profile-status");
const cartList = document.querySelector("#profile-cart-list");
const cartSubtotal = document.querySelector("#profile-cart-subtotal");
const year = document.querySelector("[data-year]");

const profileFieldsContainer = document.querySelector(".profile-fields");
const saveProfileBtn = document.querySelector("#save-profile-btn");
const editProfileBtn = document.querySelector("#edit-profile-btn");

const fieldIds = {
  fullName: "full-name",
  email: "profile-email",
  phone: "profile-phone",
  city: "profile-city",
  address: "profile-address",
  note: "profile-note"
};

let currentAccount = null;

setupCartBadge();
syncAccountLinks();
bindSignOut("[data-sign-out]", "../Homepage/homepage.html");

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

function setAuthenticatedState(isAuthenticated) {
  profileContent.forEach((element) => {
    element.hidden = !isAuthenticated;
  });

  loggedOutPanel.hidden = isAuthenticated;
  signOutButton.hidden = !isAuthenticated;
}

function setFieldValue(name, value) {
  const field = document.getElementById(fieldIds[name]);
  if (field) {
    field.value = value || "";
  }
}

function populateProfileForm(account) {
  const profile = readProfile();
  setFieldValue("fullName", profile.fullName || getAccountLabel(account));
  setFieldValue("email", profile.email || account?.email || "");
  setFieldValue("phone", profile.phone || "");
  setFieldValue("city", profile.city || "");
  setFieldValue("address", profile.address || "");
  setFieldValue("note", profile.note || "");
}

function toggleFormEditing(isEditing) {
  profileFieldsContainer.hidden = !isEditing;
  saveProfileBtn.hidden = !isEditing;
  editProfileBtn.hidden = isEditing;
}

function renderCartDetails() {
  const cartItems = getCartItems(inventory);

  cartSubtotal.textContent = formatPrice(getCartSubtotal(inventory));

  if (cartItems.length === 0) {
    cartList.innerHTML = `
      <p class="empty-cart-note">Your cart is empty. Add a Dreyluxe piece from the shop and it will show here.</p>
    `;
    return;
  }

  cartList.innerHTML = cartItems
    .map((item) => `
      <article class="profile-cart-item">
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

watchAccount(async (account) => {
  const isAuthenticated = Boolean(account);
  setAuthenticatedState(isAuthenticated);
  currentAccount = account;
  if (!account) {
    return;
  }

  document.title = `${getAccountLabel(account)} | Dreyluxe Profile`;
  initialsElement.textContent = getAccountInitials(account);
  accountNameElements.forEach((element) => {
    element.textContent = getAccountLabel(account);
  });
  accountEmail.textContent = account.email
    ? `${account.email} - Last sign in ${formatAccountDate(account.signedInAt)}`
    : `Last sign in ${formatAccountDate(account.signedInAt)}`;

  if (account.uid) {
    try {
      const docRef = doc(db, "profiles", account.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        saveProfile(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching cloud profile:", error);
    }
  }

  populateProfileForm(account);
  renderCartDetails();

  const localProfile = readProfile();
  if (localProfile.phone || localProfile.address) {
    toggleFormEditing(false);
  } else {
    toggleFormEditing(true);
  }
});

editProfileBtn.addEventListener("click", () => {
  toggleFormEditing(true);
  profileStatus.textContent = "";
  profileStatus.style.color = "";
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  profileStatus.textContent = "Saving details...";
  profileStatus.style.color = "var(--text-muted, #666)";

  const formData = new FormData(profileForm);
  const profileData = {
    fullName: String(formData.get("fullName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    note: String(formData.get("note") || "").trim(),
    updatedAt: new Date().toISOString()
  };

  const savedProfile = saveProfile(profileData);

  const activeUserUid = auth.currentUser?.uid || currentAccount?.uid;

  if (activeUserUid && activeUserUid !== "") {
    try {
      await setDoc(doc(db, "profiles", activeUserUid), profileData);
      profileStatus.textContent = `Profile details saved for ${savedProfile.fullName || "your account"}.`;
      profileStatus.style.color = "green";
      toggleFormEditing(false);
    } catch (error) {
      console.error("Cloud save error:", error);
      profileStatus.textContent = "Saved locally, but failed to sync online. Check network setup.";
      profileStatus.style.color = "orange";
    }
  } else {
    profileStatus.textContent = "Profile saved locally. Sign in to sync across devices.";
    profileStatus.style.color = "orange";
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "dreyluxe_cart_v1") {
    renderCartDetails();
  }
});