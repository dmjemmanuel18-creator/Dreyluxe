import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth, syncAccountLinks } from "./dreyluxe-auth.js";

const resetForm = document.querySelector("#reset-form");
const emailInput = document.querySelector("#reset-email");
const statusMessage = document.querySelector("#reset-status");
const submitButton = document.querySelector("#send-reset-btn");
const year = document.querySelector("[data-year]");

syncAccountLinks();

if (year) {
  year.textContent = new Date().getFullYear();
}

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

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();

  if (!email) {
    setStatus("Enter the email connected to your account.", "error");
    return;
  }

  submitButton.disabled = true;
  setStatus("Sending your reset link...");

  try {
    await sendPasswordResetEmail(auth, email);
    setStatus("Reset link sent. Check your inbox, then return to sign in.");
  } catch (error) {
    console.error("Password reset error:", error.message);
    setStatus("We could not send that reset link. Check the email and try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
});
