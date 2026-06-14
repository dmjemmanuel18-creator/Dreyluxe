import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth, syncAccountLinks, bindSignOut } from "./dreyluxe-auth.js";

const resetForm = document.querySelector("#reset-form");
const emailInput = document.querySelector("#reset-email");
const statusMessage = document.querySelector("#reset-status");
const submitButton = document.querySelector("#send-reset-btn");
const year = document.querySelector("[data-year]");

syncAccountLinks();
bindSignOut(".signout-btn", "index.html");

if (year) {
  year.textContent = new Date().getFullYear();
}

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
