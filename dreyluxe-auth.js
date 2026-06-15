import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyD1ZL3Wxj8J5Zna9fFW71E_7lcfEv8--rM",
  authDomain: "dreyluxe-94067.firebaseapp.com",
  projectId: "dreyluxe-94067",
  storageBucket: "dreyluxe-94067.firebasestorage.app",
  messagingSenderId: "767222484316",
  appId: "1:767222484316:web:84636b89496f02890dc599",
  measurementId: "G-FY1QLBHSEB"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const ACCOUNT_STORAGE_KEY = "dreyluxe_account_v1";
export const PROFILE_STORAGE_KEY = "dreyluxe_profile_v1";

// --- Added Missing Storage Utility Helpers ---
export function readStoredAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Syncs the Firebase user's profile photo with their Google account photo if they differ.
 * This ensures the app always has the most recent avatar from the provider.
 */
export async function syncGoogleProfilePicture(user) {
  if (!user) return;

  const googleProfile = user.providerData.find(p => p.providerId === 'google.com');

  if (googleProfile && googleProfile.photoURL && user.photoURL !== googleProfile.photoURL) {
    try {
      await updateProfile(user, { photoURL: googleProfile.photoURL });
      console.log("Profile picture successfully updated to match Google!");
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  }
}

export function clearStoredAccount() {
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export async function saveProfile(profileData) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  if (auth.currentUser) {
    return setDoc(doc(db, "profiles", auth.currentUser.uid), profileData, { merge: true })
      .catch((err) => console.warn("Cloud profile sync failed:", err));
  }
  return profileData;
}

export async function persistAccount(user, additionalData = {}) {
  if (!user) return;
  const accountData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || "",
    photoURL: user.photoURL || additionalData.photoURL || "",
    ...additionalData
  };
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accountData));
  return Promise.resolve(accountData);
}

export function getAccountLabel(account) {
  if (!account) return "Guest";
  return account.displayName || account.email || "User";
}

export function getAccountInitials(account) {
  const label = getAccountLabel(account);
  if (label === "Guest") return "G";
  return label.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function formatAccountDate(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export function watchAccount(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      await syncGoogleProfilePicture(user);

      persistAccount(user);

      callback(user, { source: "firebase", isAuthenticated: true });

      try {
        const docSnap = await getDoc(doc(db, "profiles", user.uid));
        if (docSnap.exists()) {
          saveProfile(docSnap.data());
          callback(user, { source: "firebase", isAuthenticated: true });
        }
      } catch (error) {
        console.warn("Profile background sync skipped:", error);
      }
      return;
    }

    clearStoredAccount();
    const currentStoredAccount = readStoredAccount();
    callback(currentStoredAccount, {
      source: currentStoredAccount ? "storage" : "firebase",
      isAuthenticated: Boolean(currentStoredAccount)
    });
  });
}

export function syncAccountLinks() {
  return watchAccount((account) => {
    if (!document.querySelector(".floating-cart")) {
      const headerCart = document.querySelector(".header-cart");
      const cartHtml = `
        <a class="floating-cart" href="cart.html" aria-label="Open cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span class="cart-badge">0</span>
        </a>
      `;
      document.body.insertAdjacentHTML("beforeend", cartHtml);
      if (headerCart) headerCart.remove();
    }

    const isLoggedIn = Boolean(account);

    document.querySelectorAll("[data-account-link]").forEach((link) => {
      link.hidden = !isLoggedIn;
      link.setAttribute("aria-hidden", String(!isLoggedIn));

      const labelTarget = link.querySelector("[data-account-link-label]");
      if (labelTarget) {
        labelTarget.textContent = link.dataset.accountLabel || "Profile";
      }
    });

    document.querySelectorAll("[data-auth-link]").forEach((link) => {
      link.hidden = isLoggedIn;
      link.setAttribute("aria-hidden", String(isLoggedIn));
    });

    document.querySelectorAll("[data-account-name]").forEach((element) => {
      element.textContent = isLoggedIn ? getAccountLabel(account) : "Guest";
    });
  });
}

export function bindSignOut(selector = "[data-sign-out]", redirectHref = "index.html") {
  document.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.warn("Firebase sign out failed, clearing local account anyway:", error);
      }

      clearStoredAccount();
      localStorage.removeItem("dreyluxe_cart_v1");
      window.location.href = redirectHref;
    });
  });
}