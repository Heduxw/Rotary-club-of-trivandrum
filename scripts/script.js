/* ============================================================
   NAVBAR — Hamburger + Dropdown
   ============================================================ */
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");
const dropdowns = document.querySelectorAll(".dropdown");

if (hamburger && navMenu) {
  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("open");
  });
}

dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", function (e) {
    e.stopPropagation();
    const menu = this.querySelector(".dropdown-menu");
    document.querySelectorAll(".dropdown-menu.show").forEach((open) => {
      if (open !== menu) open.classList.remove("show");
    });
    menu.classList.toggle("show");
  });
});

document.addEventListener("click", () => {
  navMenu?.classList.remove("open");
  hamburger?.classList.remove("active");
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
});

/* ============================================================
   SLIDESHOW — images pulled from Supabase articles
   Clicking a slide opens that article
   ============================================================ */
let slideshowPhotos = []; // filled from Supabase

const slider = {
  current: 0,
  autoTimer: null,

  init() {
    if (!document.querySelector(".slider-container")) return;
    if (slideshowPhotos.length === 0) {
      console.warn("Slideshow: no article images to show.");
      return;
    }
    this.buildDots();
    this.goToSlide(0);
    this.bindEvents();
    this.startTimer();
  },

  buildDots() {
    const dotsContainer = document.getElementById("dots");
    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";
    slideshowPhotos.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      dot.addEventListener("click", (e) => {
        e.stopPropagation(); // don't trigger the slide-open click
        this.goToSlide(i);
        this.resetTimer();
      });
      dotsContainer.appendChild(dot);
    });
  },

  goToSlide(n) {
    const total = slideshowPhotos.length;
    this.current = (n + total) % total;

    const photo = slideshowPhotos[this.current];
    const img = document.getElementById("slideImg");
    const bg = document.getElementById("slideBg");

    if (img) {
      img.src = photo.src;
      img.alt = photo.caption || "";
    }
    if (bg) bg.style.backgroundImage = `url('${photo.src}')`;

    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === this.current);
    });
  },

  bindEvents() {
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const container = document.querySelector(".slider-container");
    const img = document.getElementById("slideImg");

    nextBtn?.addEventListener("click", (e) => {
      e.stopPropagation(); // don't open article when clicking arrow
      this.goToSlide(this.current + 1);
      this.resetTimer();
    });

    prevBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.goToSlide(this.current - 1);
      this.resetTimer();
    });

    // ─── CLICK SLIDE → OPEN ITS ARTICLE ───
    img?.addEventListener("click", () => {
      const photo = slideshowPhotos[this.current];
      if (photo?.id) {
        window.location.href = `articles/article.html?id=${photo.id}`;
      }
    });
    if (img) img.style.cursor = "pointer"; // hint it's clickable

    // Swipe support (mobile)
    let touchStartX = 0;
    container?.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    });
    container?.addEventListener("touchend", (e) => {
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

/* ============================================================
   FETCH ARTICLE IMAGES FROM SUPABASE
   ============================================================ */
async function loadSlideshowImages() {
  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient not found — check script order in HTML.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("id, title, image_url") // id needed for the link
    .not("image_url", "is", null) // only articles WITH an image
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Slideshow load error:", error);
    return;
  }

  slideshowPhotos = data.map((article) => ({
    id: article.id, // used to open the article
    src: article.image_url,
    caption: article.title,
  }));

  slider.init(); // start only after images are loaded
}

loadSlideshowImages();
