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

watchAccount((user) => {
    if (user) {
        console.log("Dreyluxe session active:", user.email || "Guest");
    }
});

bindSignOut(".signout-btn", "index.html");
