/* ============================================================
   SHARED NAVBAR
   Injected on every page so the navigation lives in one place.
   It works out the path back to the site root from its own
   <script src="…/scripts/navbar.js"> so links resolve from any
   folder depth. It replaces a #navbar-root placeholder or any
   legacy <nav class="navbar">, else it prepends to <body>.
   ============================================================ */
(function () {
  const tag =
    document.currentScript ||
    document.querySelector('script[src*="navbar.js"]');
  const src = tag ? tag.getAttribute("src") : "scripts/navbar.js";
  const prefix = src.slice(0, src.indexOf("scripts/navbar.js")); // "" or "../"
  const link = (path) => prefix + path;

  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.innerHTML = `
    <a class="site-nav__brand" href="${link("index.html")}">
      <img
        class="site-nav__logo-img"
        src="${link("media/Rotary club of trivandrum.svg")}"
        alt="Rotary Club of Trivandrum"
      />
    </a>
    <button class="site-nav__burger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
    <div class="site-nav__menu">
      <a href="${link("index.html")}">Home</a>
      <div class="site-nav__dropdown">
        <a href="#" class="site-nav__droptoggle">About ▾</a>
        <div class="site-nav__dropmenu">
          <a href="${link("index.html#team")}">Our Team</a>
          <a href="${link("history/")}">History</a>
        </div>
      </div>
      <a href="${link("gallery/")}">Gallery</a>
      <a href="${link("articles/")}">Projects</a>
      <a href="${link("contact/")}">Contact</a>
      <a class="site-nav__login" href="${link("users/")}">Member Login</a>
    </div>
  `;

  function mount() {
    const placeholder = document.getElementById("navbar-root");
    const legacy = document.querySelector("nav.navbar");
    if (placeholder) placeholder.replaceWith(nav);
    else if (legacy) legacy.replaceWith(nav);
    else document.body.insertBefore(nav, document.body.firstChild);

    const burger = nav.querySelector(".site-nav__burger");
    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      nav.classList.toggle("open");
    });

    nav.querySelectorAll(".site-nav__dropdown").forEach((d) => {
      d.querySelector(".site-nav__droptoggle").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        d.classList.toggle("open");
      });
    });

    // Click anywhere else closes the mobile menu + any open dropdown
    document.addEventListener("click", () => {
      nav.classList.remove("open");
      nav
        .querySelectorAll(".site-nav__dropdown.open")
        .forEach((d) => d.classList.remove("open"));
    });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
