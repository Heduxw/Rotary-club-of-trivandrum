/* ============================================================
   SHARED FOOTER
   Injected like the navbar so it lives in one place. Works out
   the path back to the site root from its own <script src> so
   links resolve from any folder depth. Replaces a #footer-root
   placeholder if present, else appends to <body>.
   ============================================================ */
(function () {
  const tag =
    document.currentScript ||
    document.querySelector('script[src*="footer.js"]');
  const src = tag ? tag.getAttribute("src") : "scripts/footer.js";
  const prefix = src.slice(0, src.indexOf("scripts/footer.js")); // "" or "../"
  const link = (path) => prefix + path;

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="site-footer__inner">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-brand__logo">
            <img
              class="footer-logo-img"
              src="${link("media/Rotarty logo title.svg")}"
              alt="Rotary Club of Trivandrum"
            />
            <div style=\"font:800 20px 'Archivo';\">Rotary<\u002Fdiv>
          </div>
          <p>
            Rotary Club of Trivandrum Residency — neighbours and leaders
            united in service to our community.
          </p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <a href="${link("index.html")}">Home</a>
          <a href="${link("index.html#team")}">Our Team</a>
          <a href="${link("history/")}">History</a>
          <a href="${link("gallery/")}">Gallery</a>
          <a href="${link("articles/")}">Projects</a>
        </div>
        <div class="footer-col">
          <h4>Get Involved</h4>
          <a href="${link("contact/")}">Become a Member</a>
          <a href="${link("articles/")}">Our Projects</a>
          <a href="${link("users/")}">Member Login</a>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <span>VRA 59, Lavanya, Mosque Lane, Kesavadasapuram,
            Thiruvananthapuram, Kerala, India</span>
          <a href="mailto:info@rotarytrivandrumresidency.in"
            >info@rotarytrivandrumresidency.in</a>
          <a href="tel:+919496063303">+91 94960 63303</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 Rotary Club of Trivandrum Residency. All rights
          reserved.</span>
        <span class="tagline">Service Above Self</span>
      </div>
    </div>
  `;

  function mount() {
    const placeholder = document.getElementById("footer-root");
    if (placeholder) placeholder.replaceWith(footer);
    else document.body.appendChild(footer);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
