import { inventory } from "./products-data.js";
import {
  formatPrice,
  getCartItems,
  getCartSubtotal,
  setupCartBadge
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