// Builds one album from a table of single-image rows (articles/history),
// where each photo keeps its own row's title as its lightbox caption.
function albumFromRows(rows, albumTitle) {
  const withImages = (rows || []).filter((row) => row.image_url);
  if (!withImages.length) return null;
  return {
    title: albumTitle,
    tiles: withImages.map((row) => ({
      url: row.image_url,
      caption: row.title || albumTitle,
    })),
  };
}

async function loadGallery() {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  if (typeof supabaseClient === "undefined") {
    grid.innerHTML = `<p class="error">Could not load gallery.</p>`;
    console.error("supabaseClient not found — check script order in HTML.");
    return;
  }

  // Every photo the club has: albums added through the admin Gallery
  // section, plus every Project (article) and History image.
  const [galleryRes, articlesRes, historyRes] = await Promise.all([
    supabaseClient
      .from("gallery")
      .select("title, images, created_at")
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("articles")
      .select("title, image_url, created_at")
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("history")
      .select("title, image_url, event_date")
      .order("event_date", { ascending: false }),
  ]);

  if (galleryRes.error || articlesRes.error || historyRes.error) {
    grid.innerHTML = `<p class="error">Could not load gallery.</p>`;
    console.error(
      "Gallery load error:",
      galleryRes.error || articlesRes.error || historyRes.error,
    );
    return;
  }

  // Gallery-section albums: every image in one shares the album's own title
  const galleryAlbums = (galleryRes.data || [])
    .filter((album) => Array.isArray(album.images) && album.images.length)
    .map((album) => ({
      title: album.title,
      tiles: album.images.map((url) => ({ url, caption: album.title || "" })),
    }));

  const albums = [
    ...galleryAlbums,
    albumFromRows(articlesRes.data, "Projects"),
    albumFromRows(historyRes.data, "History"),
  ].filter(Boolean);

  if (!albums.length) {
    grid.innerHTML = `<p class="loading">No photos yet.</p>`;
    return;
  }

  grid.innerHTML = albums
    .map((album) => {
      const tiles = album.tiles
        .map((tile) => {
          const safeUrl = escapeAttr(tile.url);
          const captionAttr = escapeAttr(tile.caption || "");
          return `
        <button class="gallery-item" data-src="${safeUrl}" data-caption="${captionAttr}">
          <img src="${safeUrl}" alt="${captionAttr}" loading="lazy" />
        </button>`;
        })
        .join("");

      return `
      <div class="gallery-album">
        ${album.title ? `<h2 class="gallery-album-title">${escapeHtml(album.title)}</h2>` : ""}
        <div class="gallery-grid">${tiles}</div>
      </div>`;
    })
    .join("");

  bindLightbox();
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
