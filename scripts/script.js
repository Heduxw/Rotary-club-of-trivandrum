/* ============================================================
   SLIDESHOW — images pulled from Supabase (articles + history)
   Clicking a slide opens the matching article or history page
   The navbar lives in scripts/navbar.js
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
    // Percent-encode chars that could break out of the url('…') wrapper
    if (bg) {
      const safeSrc = String(photo.src).replace(/['"()\\]/g, encodeURIComponent);
      bg.style.backgroundImage = `url('${safeSrc}')`;
    }

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
  // Only the home page has a slideshow — skip the DB queries everywhere else
  if (!document.querySelector(".slider-container")) return;

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

/* ============================================================
   "IN ACTION" PREVIEW — first few gallery photos on the home page
   ============================================================ */
async function loadActionImages() {
  const grid = document.getElementById("action-grid");
  if (!grid || typeof supabaseClient === "undefined") return;

  const { data, error } = await supabaseClient
    .from("gallery")
    .select("images, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("In Action load error:", error);
    return;
  }

  // Flatten all album images, newest album first, take the first four
  const images = [];
  (data || []).forEach((album) => {
    if (Array.isArray(album.images)) images.push(...album.images);
  });

  if (!images.length) return; // keep the placeholder tiles

  let html = "";
  for (let i = 0; i < 4; i++) {
    if (images[i]) {
      html += `<a class="action-tile" href="gallery/"><img src="${escapeAttr(
        images[i],
      )}" alt="" loading="lazy" /></a>`;
    } else {
      html += `<div class="action-tile"><span>Photo</span></div>`;
    }
  }
  grid.innerHTML = html;
}

loadActionImages();
