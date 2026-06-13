import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

export function persistAccount(user, additionalData = {}) {
  if (!user) return;
  const accountData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || additionalData.displayName || "",
    ...additionalData
  };
  localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accountData));
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

export function saveProfile(profileData) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
  return profileData;
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
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      persistAccount(user);
      callback(user, { source: "firebase", isAuthenticated: true });
      return;
    }

    const currentStoredAccount = readStoredAccount();
    callback(currentStoredAccount, {
      source: currentStoredAccount ? "storage" : "firebase",
      isAuthenticated: Boolean(currentStoredAccount)
    });
  });
}

export function syncAccountLinks() {
  return watchAccount((account) => {
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
      window.location.href = redirectHref;
    });
  });
}