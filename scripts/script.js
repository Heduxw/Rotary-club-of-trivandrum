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
const slider = {
  current: 0,
  autoTimer: null,

  init() {
    this.buildDots();
    this.goToSlide(0);
    this.bindEvents();
    this.startTimer();
  },

  buildDots() {
    const dotsContainer = document.getElementById("dots");
    dotsContainer.innerHTML = ""; // clear first
    slideshowPhotos.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      dot.addEventListener("click", () => {
        this.goToSlide(i);
        this.resetTimer();
      });
      dotsContainer.appendChild(dot);
    });
  },

  goToSlide(n) {
    const total = slideshowPhotos.length;
    this.current = (n + total) % total;

    const photo = slideshowPhotos[this.current]; // from photos.js
    const img = document.getElementById("slideImg");
    const bg = document.getElementById("slideBg");

    img.src = photo.src; // your path
    img.alt = photo.caption || "";
    bg.style.backgroundImage = `url('${photo.src}')`;

    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === this.current);
    });
  },

  bindEvents() {
    document.getElementById("nextBtn").addEventListener("click", () => {
      this.goToSlide(this.current + 1);
      this.resetTimer();
    });

    document.getElementById("prevBtn").addEventListener("click", () => {
      this.goToSlide(this.current - 1);
      this.resetTimer();
    });

    let touchStartX = 0;
    const container = document.querySelector(".slider-container");

    container.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    });

    container.addEventListener("touchend", (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (diff > 50) this.goToSlide(this.current + 1);
      if (diff < -50) this.goToSlide(this.current - 1);
      this.resetTimer();
    });
  },

  startTimer() {
    this.autoTimer = setInterval(() => {
      this.goToSlide(this.current + 1);
    }, 4000);
  },

  resetTimer() {
    clearInterval(this.autoTimer);
    this.startTimer();
  },
};

slider.init();
