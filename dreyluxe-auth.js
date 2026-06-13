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
const LEGACY_LOGIN_KEY = "dreyluxe_user_logged_in";

function readJson(key, fallback = null) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}:`, error);
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readStoredAccount(includeLegacy = true) {
  const account = readJson(ACCOUNT_STORAGE_KEY, null);

  if (account && typeof account === "object") {
    return account;
  }

  if (includeLegacy && localStorage.getItem(LEGACY_LOGIN_KEY) === "true") {
    return {
      uid: "",
      email: "",
      displayName: "Dreyluxe Member",
      photoURL: "",
      providerId: "local",
      signedInAt: ""
    };
  }

  return null;
}

export function persistAccount(user, extras = {}) {
  const storedAccount = readStoredAccount(false) || {};
  const providerId = user?.providerData?.[0]?.providerId || extras.providerId || storedAccount.providerId || "password";
  const displayName = user?.displayName || extras.displayName || extras.username || storedAccount.displayName || "";

  const account = {
    ...storedAccount,
    uid: user?.uid || extras.uid || storedAccount.uid || "",
    email: user?.email || extras.email || storedAccount.email || "",
    displayName,
    username: extras.username || storedAccount.username || displayName,
    photoURL: user?.photoURL || extras.photoURL || storedAccount.photoURL || "",
    providerId,
    signedInAt: new Date().toISOString()
  };

  writeJson(ACCOUNT_STORAGE_KEY, account);
  localStorage.setItem(LEGACY_LOGIN_KEY, "true");
  window.dispatchEvent(new CustomEvent("dreyluxe:account-updated", { detail: { account } }));
  return account;
}

export function clearStoredAccount() {
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  localStorage.removeItem(LEGACY_LOGIN_KEY);
  window.dispatchEvent(new CustomEvent("dreyluxe:account-updated", { detail: { account: null } }));
}

export function readProfile() {
  return readJson(PROFILE_STORAGE_KEY, {}) || {};
}

export function saveProfile(profileDetails) {
  const profile = {
    ...readProfile(),
    ...profileDetails,
    updatedAt: new Date().toISOString()
  };

  writeJson(PROFILE_STORAGE_KEY, profile);
  window.dispatchEvent(new CustomEvent("dreyluxe:profile-updated", { detail: { profile } }));
  return profile;
}

export function getAccountLabel(account) {
  return account?.displayName || account?.username || account?.email || "Dreyluxe Member";
}

export function getAccountInitials(account) {
  const label = getAccountLabel(account)
    .replace(/@.*/, "")
    .trim();
  const parts = label.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "DL";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatAccountDate(value) {
  if (!value) {
    return "Recently";
  }

  try {
    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch (error) {
    return "Recently";
  }
}

export function watchAccount(callback) {
  const storedAccount = readStoredAccount();

  if (storedAccount) {
    callback(storedAccount, { source: "storage", isAuthenticated: true });
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(persistAccount(user), { source: "firebase", isAuthenticated: true });
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
