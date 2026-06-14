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

// Click anywhere outside → close menu + dropdowns
document.addEventListener("click", () => {
  navMenu?.classList.remove("open");
  hamburger?.classList.remove("active");
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
});

/* ============================================================
   SLIDESHOW — images pulled from Supabase (articles + history)
   Clicking a slide opens the matching article or history page
   ============================================================ */
let slideshowPhotos = []; // filled from Supabase

const slider = {
  current: 0,
  autoTimer: null,

  init() {
    if (!document.querySelector(".slider-container")) return;
    if (slideshowPhotos.length === 0) {
      console.warn("Slideshow: no images to show.");
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
        e.stopPropagation();
        this.goToSlide(i);
        this.resetTimer();
      });
      dotsContainer.appendChild(dot);
    });
  },

  goToSlide(n) {
    const total = slideshowPhotos.length;
    if (total === 0) return;

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

  // Open the right page for the current slide
  openCurrent() {
    const photo = slideshowPhotos[this.current];
    if (!photo?.id) return;

    if (photo.type === "history") {
      window.location.href = `history/?id=${photo.id}`;
    } else {
      window.location.href = `articles/article.html?id=${photo.id}`;
    }
  },

  bindEvents() {
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const container = document.querySelector(".slider-container");
    const img = document.getElementById("slideImg");

    nextBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.goToSlide(this.current + 1);
      this.resetTimer();
    });

    prevBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.goToSlide(this.current - 1);
      this.resetTimer();
    });

    // Click slide → open its page
    img?.addEventListener("click", () => this.openCurrent());

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
   FETCH IMAGES FROM SUPABASE (articles + history combined)
   ============================================================ */
async function loadSlideshowImages() {
  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient not found — check script order in HTML.");
    return;
  }

  // Query both tables in parallel
  const [articlesRes, historyRes] = await Promise.all([
    supabaseClient
      .from("articles")
      .select("id, title, image_url, created_at")
      .not("image_url", "is", null),
    supabaseClient
      .from("history")
      .select("id, title, image_url, created_at")
      .not("image_url", "is", null),
  ]);

  if (articlesRes.error)
    console.error("Articles load error:", articlesRes.error);
  if (historyRes.error) console.error("History load error:", historyRes.error);

  // Map each table's rows into a common slide shape, tagging the source
  const toSlides = (rows, type) =>
    (rows || []).map((row) => ({
      id: row.id,
      src: row.image_url,
      caption: row.title,
      type,
      created_at: row.created_at,
    }));

  // Merge and sort newest first across both sources
  slideshowPhotos = [
    ...toSlides(articlesRes.data, "article"),
    ...toSlides(historyRes.data, "history"),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  slider.init();
}

loadSlideshowImages();
