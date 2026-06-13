import {
  signInWithEmailAndPassword,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  auth,
  googleProvider,
  persistAccount,
  syncAccountLinks
} from "./dreyluxe-auth.js";

const signinForm = document.querySelector("#signin-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const statusMessage = document.querySelector("#signin-status");
const googleButton = document.querySelector("#google-btn");
const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = new Date().getFullYear();
}

syncAccountLinks();

function setStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", type === "error");
}

function setLoading(isLoading) {
  signinForm.querySelector("button[type='submit']").disabled = isLoading;
  if (googleButton) {
    googleButton.disabled = isLoading;
  }
}

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    setStatus("Enter your email and password to continue.", "error");
    return;
  }

  setLoading(true);
  setStatus("Signing you in...");

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    persistAccount(userCredential.user);
    setStatus("Signed in. Returning to homepage...");
    window.location.href = "homepage.html";
  } catch (error) {
    console.error(error.message);
    setStatus("We could not sign you in. Check your details and try again.", "error");
  } finally {
    setLoading(false);
  }
});

if (googleButton) {
  googleButton.addEventListener("click", async () => {
    setLoading(true);
    setStatus("Opening Google sign in...");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      persistAccount(result.user);
      setStatus("Signed in with Google. Returning to homepage...");
      window.location.href = "homepage.html";
    } catch (error) {
      console.error("Google Auth Error:", error.message);
      setStatus("Google sign in did not finish. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  });
}
