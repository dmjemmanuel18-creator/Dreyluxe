import {
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
    auth,
    googleProvider,
    persistAccount,
    saveProfile,
    syncAccountLinks
} from "./dreyluxe-auth.js";

const signupForm = document.querySelector("#signup-form");
const nameInput = document.querySelector("#username");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const confirmPasswordInput = document.querySelector("#confirm-password");
const termsInput = document.querySelector("#terms");
const statusMessage = document.querySelector("#signup-status");
const googleButton = document.querySelector("#google-btn");
const year = document.querySelector("[data-year]");

const reqLength = document.getElementById("req-length");
const reqUpper = document.getElementById("req-upper");
const reqLower = document.getElementById("req-lower");
const reqNum = document.getElementById("req-num");

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

function passwordChecks(password) {
    return {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };
}

function syncPasswordChecklist() {
    const checks = passwordChecks(passwordInput.value);
    reqLength.classList.toggle("valid", checks.length);
    reqUpper.classList.toggle("valid", checks.upper);
    reqLower.classList.toggle("valid", checks.lower);
    reqNum.classList.toggle("valid", checks.number);
    return Object.values(checks).every(Boolean);
}

function setStatus(message, type = "info") {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("is-error", type === "error");
}

function setLoading(isLoading) {
    signupForm.querySelector("button[type='submit']").disabled = isLoading;
    if (googleButton) {
        googleButton.disabled = isLoading;
    }
}

passwordInput.addEventListener("input", syncPasswordChecklist);

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!displayName || !email || !password || !confirmPassword) {
        setStatus("Fill in every field to create your account.", "error");
        return;
    }

    if (!syncPasswordChecklist()) {
        setStatus("Update your password so every requirement is marked ok.", "error");
        return;
    }

    if (password !== confirmPassword) {
        setStatus("Your passwords do not match yet.", "error");
        return;
    }

    if (!termsInput.checked) {
        setStatus("Confirm that you want Dreyluxe to save your account details.", "error");
        return;
    }

    setLoading(true);
    setStatus("Creating your account...");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        persistAccount(userCredential.user, { displayName, username: displayName, email });
        saveProfile({ fullName: displayName, email });
        setStatus("Account created. Returning to index...");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Sign-up error:", error.message);
        setStatus("We could not create that account. Try a different email or password.", "error");
    } finally {
        setLoading(false);
    }
});

if (googleButton) {
    googleButton.addEventListener("click", async () => {
        setLoading(true);
        setStatus("Opening Google sign up...");

        try {
            const result = await signInWithPopup(auth, googleProvider);
            persistAccount(result.user);
            saveProfile({
                fullName: result.user.displayName || "",
                email: result.user.email || ""
            });
            setStatus("Account connected with Google. Returning to index...");
            window.location.href = "index.html";
        } catch (error) {
            console.error("Google Auth Error:", error.message);
            setStatus("Google sign up did not finish. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    });
}
