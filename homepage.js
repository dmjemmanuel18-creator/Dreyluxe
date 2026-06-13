import { setupCartBadge } from "../Products/cart.js";
import {
    auth,
    watchAccount,
    bindSignOut,
    syncAccountLinks
} from "../assets/js/dreyluxe-auth.js";

const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const year = document.querySelector("[data-year]");

if (year) {
    year.textContent = new Date().getFullYear();
}

if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });
}

setupCartBadge();
syncAccountLinks();

watchAccount((user) => {
    if (user) {
        console.log("Dreyluxe session active:", user.email || "Guest");
    }
});

bindSignOut(".signout-btn", "../Homepage/homepage.html");
