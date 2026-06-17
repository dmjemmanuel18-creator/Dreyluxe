import { inventory } from "./products-data.js";
import {
  formatPrice,
  getCartItems,
  getCartSubtotal,
  setupCartBadge,
  updatePaymentTelegramLinks
} from "./cart.js";
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
  watchAccount,
  readStoredAccount
} from "./dreyluxe-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

let currentAccount = null;

if (year) {
  year.textContent = new Date().getFullYear();
}

setupCartBadge();
updatePaymentTelegramLinks(".profile-main");
syncAccountLinks();
bindSignOut("[data-sign-out]", "index.html");

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

function toggleFormEditing(isEditing) {
  if (!profileForm) return;
  const inputs = profileForm.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    input.disabled = !isEditing;
  });
  if (saveProfileBtn) saveProfileBtn.hidden = !isEditing;
  if (editProfileBtn) editProfileBtn.hidden = isEditing;
}

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => toggleFormEditing(true));
}

function populateProfileFields(data) {
  if (!profileForm) return;
  Object.keys(data).forEach((key) => {
    const field = profileForm.querySelector(`[name="${key}"], #${key}`);
    if (field) {
      field.value = data[key] || "";
    }
  });
}

watchAccount((account) => {
  currentAccount = account;
  const isLoggedIn = Boolean(account);

  if (loggedOutPanel) loggedOutPanel.hidden = isLoggedIn;
  profileContent.forEach((el) => {
    el.hidden = !isLoggedIn;
  });

  if (isLoggedIn) {
    if (initialsElement) initialsElement.textContent = getAccountInitials(account);
    if (accountEmail) accountEmail.textContent = account.email || "No email verified";

    const localProfile = readProfile();
    populateProfileFields(localProfile);
    toggleFormEditing(false);

    updatePaymentTelegramLinks(".profile-main", localProfile.fullName || getAccountLabel(account));
  }
});

if (profileForm) {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    profileStatus.textContent = "Saving details...";
    profileStatus.style.color = "#666";

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

    if (activeUserUid) {
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
}