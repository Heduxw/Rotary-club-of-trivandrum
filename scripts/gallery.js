async function loadGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  if (typeof supabaseClient === "undefined") {
    grid.innerHTML = `<p class="error">Could not load gallery.</p>`;
    console.error("supabaseClient not found — check script order in HTML.");
    return;
  }

  // Pull albums added through the admin Gallery section only
  const { data, error } = await supabaseClient
    .from("gallery")
    .select("title, images, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="error">Could not load gallery.</p>`;
    console.error("Gallery load error:", error);
    return;
  }

  // Keep only albums that actually have images
  const albums = (data || []).filter(
    (album) => Array.isArray(album.images) && album.images.length,
  );

  if (!albums.length) {
    grid.innerHTML = `<p class="loading">No photos yet.</p>`;
    return;
  }

  grid.innerHTML = albums
    .map((album) => {
      const caption = escapeAttr(album.title || "");
      const tiles = album.images
        .map(
          (url) => `
        <button class="gallery-item" data-src="${url}" data-caption="${caption}">
          <img src="${url}" alt="${caption}" loading="lazy" />
        </button>`,
        )
        .join("");

      return `
      <div class="gallery-album">
        ${album.title ? `<h2 class="gallery-album-title">${caption}</h2>` : ""}
        <div class="gallery-grid">${tiles}</div>
      </div>`;
    })
    .join("");

  bindLightbox();
}

function escapeAttr(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;");
}

function bindLightbox() {
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close");
  if (!lightbox) return;

  document.querySelectorAll(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      lightboxImg.src = item.dataset.src;
      lightboxImg.alt = item.dataset.caption;
      lightboxCaption.textContent = item.dataset.caption;
      lightbox.classList.add("open");
    });
  });

  const close = () => lightbox.classList.remove("open");
  closeBtn?.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

loadGallery();
