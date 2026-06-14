import { setupCartBadge } from "./cart.js";
import {
    auth,
    watchAccount,
    bindSignOut,
    syncAccountLinks
} from "./dreyluxe-auth.js";

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

watchAccount((user) => {
    if (user) {
        console.log("Dreyluxe session active:", user.email || "Guest");
    }
});

bindSignOut(".signout-btn", "index.html");
