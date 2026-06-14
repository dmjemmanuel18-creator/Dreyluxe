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
        setStatus("Signed in. Returning to index...");
        window.location.href = "index.html";
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
            setStatus("Signed in with Google. Returning to index...");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Google Auth Error:", error.message);
            setStatus("Google sign in did not finish. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    });
}
