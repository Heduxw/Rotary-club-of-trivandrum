const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const dropdowns = document.querySelectorAll(".dropdown");

// ─── HAMBURGER TOGGLE ───
hamburger.addEventListener("click", function (e) {
  e.stopPropagation();
  hamburger.classList.toggle("active"); // animates to X
  navMenu.classList.toggle("open"); // shows/hides menu
});

// ─── DROPDOWN TOGGLE ───
dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", function (e) {
    e.stopPropagation();

    const menu = this.querySelector(".dropdown-menu");

    // Close other open dropdowns
    document.querySelectorAll(".dropdown-menu.show").forEach((openMenu) => {
      if (openMenu !== menu) openMenu.classList.remove("show");
    });

    menu.classList.toggle("show");
  });
});

// ─── CLOSE EVERYTHING ON OUTSIDE CLICK ───
document.addEventListener("click", () => {
  navMenu.classList.remove("open");
  hamburger.classList.remove("active");
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
});

const container = document.getElementById("slideshow");

// ─── BUILD SLIDES FROM photos.js ───
function buildSlideshow() {
  let slidesHTML = "";
  let dotsHTML = '<div class="dots">';

  slideshowPhotos.forEach((photo, i) => {
    slidesHTML += `
      <div class="slide ${i === 0 ? "active" : ""}">
        <img src="${photo.src}" alt="Slide ${i + 1}">
        <div class="slide-caption">
          <p>${photo.caption}</p>
        </div>
      </div>
    `;
    dotsHTML += `<span class="dot ${i === 0 ? "active" : ""}"></span>`;
  });

  dotsHTML += "</div>";

  container.innerHTML = `
    ${slidesHTML}
    <button class="slide-btn prev" id="prevBtn">&#10094;</button>
    <button class="slide-btn next" id="nextBtn">&#10095;</button>
    ${dotsHTML}
  `;

  initSlideshow();
}

// ─── SLIDESHOW LOGIC ───
function initSlideshow() {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  let current = 0;
  let autoTimer;

  function goToSlide(n) {
    slides.forEach((s) => s.classList.remove("active"));
    dots.forEach((d) => d.classList.remove("active"));
    current = (n + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  nextBtn.addEventListener("click", () => {
    goToSlide(current + 1);
    resetTimer();
  });
  prevBtn.addEventListener("click", () => {
    goToSlide(current - 1);
    resetTimer();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goToSlide(i);
      resetTimer();
    });
  });

  function startTimer() {
    autoTimer = setInterval(() => goToSlide(current + 1), 4000);
  }

  function resetTimer() {
    clearInterval(autoTimer);
    startTimer();
  }

  // Swipe support
  let touchStartX = 0;
  container.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  });
  container.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) goToSlide(current + 1);
    if (diff < -50) goToSlide(current - 1);
    resetTimer();
  });

  goToSlide(0);
  startTimer();
}

// ─── INIT ───
buildSlideshow();
