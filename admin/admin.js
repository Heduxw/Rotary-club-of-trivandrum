/* ============================================================
   ADMIN — login, sidebar workspace (Overview + per-section
   add / edit / delete / search). Handles the "articles",
   "history", "gallery" and "member_resources" tables.
   ============================================================ */

const loginView = document.getElementById("login-view");
const dashView = document.getElementById("dash-view");
const overviewPanel = document.getElementById("overview-panel");
const sectionPanel = document.getElementById("section-panel");
const statGrid = document.getElementById("stat-grid");
const sectionTitleEl = document.getElementById("section-title");
const formPanel = document.getElementById("form-panel");
const addToggleBtn = document.getElementById("add-toggle-btn");
const cancelBtn = document.getElementById("cancel-btn");
const searchInput = document.getElementById("search-input");
const itemList = document.getElementById("item-list");

// Form fields, cached once (they exist in the DOM from page load)
const F = {
  title: document.getElementById("f-title"),
  body: document.getElementById("f-body"),
  image: document.getElementById("f-image"),
  date: document.getElementById("f-date"),
  year: document.getElementById("f-year"),
  publishBtn: document.getElementById("publish-btn"),
  msg: document.getElementById("form-msg"),
};

// Maps each section to its database table, display label and icon
const TABLES = {
  article: { name: "articles", label: "Article", icon: "📰" },
  history: { name: "history", label: "History", icon: "🕰️" },
  gallery: { name: "gallery", label: "Gallery", icon: "🖼️" },
  members: { name: "member_resources", label: "Member File", icon: "📁" },
};
const SECTION_ORDER = ["article", "history", "gallery", "members"];

const cachedData = { article: [], history: [], gallery: [], members: [] };

let currentSection = "article"; // last real section selected (not "overview")
let editId = null; // null = adding new, otherwise editing this id
let editingImageUrl = null; // keeps existing image when editing without a new upload
let editingImages = null; // keeps existing gallery images when editing
let editingFile = null; // keeps existing member file {url, name, type} when editing

/* Uploads one file to the Projects bucket and returns its public URL */
async function uploadFile(file) {
  const fileName = `${Date.now()}-${file.name}`;
  const { error: upErr } = await supabaseClient.storage
    .from("Projects")
    .upload(fileName, file);
  if (upErr) throw upErr;
  return supabaseClient.storage.from("Projects").getPublicUrl(fileName).data
    .publicUrl;
}

/* ─── ICONS ─── */
const PENCIL = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;

const TRASH = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

/* ============================================================
   AUTH
   ============================================================ */
async function checkAuth() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) showDashboard();
  else showLogin();
}

// The shared site nav (mounted by navbar.js) only makes sense before
// login — the dashboard has its own sidebar branding + logout. Hiding
// it via a body class (rather than looking up the .site-nav element
// directly) means it still applies correctly even if navbar.js hasn't
// mounted the nav yet — e.g. on a reload with an existing session,
// where checkAuth() can call showDashboard() before navbar.js's script
// tag (which runs after admin.js) has run.
function showLogin() {
  loginView.style.display = "";
  dashView.style.display = "none";
  document.body.classList.remove("admin-dashboard-active");
}

function showDashboard() {
  loginView.style.display = "none";
  dashView.style.display = "";
  document.body.classList.add("admin-dashboard-active");
  loadAllSections();
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const err = document.getElementById("login-error");
  const btn = document.getElementById("login-btn");

  btn.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      err.textContent = error.message;
      return;
    }
    showDashboard();
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */
document.getElementById("sidebar-nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".admin-sidebar__link");
  if (btn) selectSection(btn.dataset.section);
});

statGrid.addEventListener("click", (e) => {
  const tile = e.target.closest(".admin-stat-tile");
  if (tile) selectSection(tile.dataset.section);
});

function selectSection(section) {
  document
    .querySelectorAll(".admin-sidebar__link")
    .forEach((b) => b.classList.toggle("active", b.dataset.section === section));

  if (section === "overview") {
    overviewPanel.style.display = "block";
    sectionPanel.style.display = "none";
    renderOverview();
    return;
  }

  currentSection = section;
  overviewPanel.style.display = "none";
  sectionPanel.style.display = "block";
  sectionTitleEl.textContent = TABLES[section].label;
  searchInput.value = "";
  closeForm();
  renderList(section);
}

/* ============================================================
   ADD / EDIT FORM
   ============================================================ */
function openForm() {
  formPanel.style.display = "block";
  addToggleBtn.textContent = "Cancel";
}

function closeForm() {
  formPanel.style.display = "none";
  addToggleBtn.textContent = "+ New";
  resetForm();
}

addToggleBtn.addEventListener("click", () => {
  if (formPanel.style.display === "none") {
    resetForm();
    openForm();
  } else {
    closeForm();
  }
});

cancelBtn.addEventListener("click", closeForm);

// Clears the form and adapts it to the current section
function resetForm() {
  editId = null;
  editingImageUrl = null;
  editingImages = null;
  editingFile = null;

  F.title.value = "";
  F.body.value = "";
  F.image.value = "";
  F.date.value = "";
  F.year.value = "";

  const isHistory = currentSection === "history";
  const isGallery = currentSection === "gallery";
  const isArticle = currentSection === "article";
  const isMembers = currentSection === "members";

  // Date applies to history and member files, Rotary year is articles-only,
  // gallery items are image-only, and member files accept any document type.
  F.date.style.display = isHistory || isMembers ? "block" : "none";
  F.year.style.display = isArticle ? "block" : "none";
  F.body.style.display = isGallery || isMembers ? "none" : "block";
  F.image.multiple = isGallery;
  F.image.accept = isMembers
    ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
    : "image/*";
  F.body.placeholder = isHistory ? "Description" : "Article text";
  F.title.placeholder = isGallery
    ? "Caption (optional)"
    : isMembers
      ? "Document title"
      : "Title";
  F.publishBtn.textContent = "Publish " + TABLES[currentSection].label;
  F.msg.textContent = "";
}

/* ============================================================
   PUBLISH / UPDATE
   ============================================================ */
F.publishBtn.addEventListener("click", async () => {
  const title = F.title.value.trim();
  const body = F.body.value.trim();
  const files = F.image.files;
  const date = F.date.value;
  const year = F.year.value.trim();
  const msg = F.msg;
  const table = TABLES[currentSection].name;

  if (currentSection === "gallery") {
    if (!editId && !files.length) {
      msg.textContent = "Please choose an image.";
      return;
    }
  } else if (currentSection === "members") {
    if (!title) {
      msg.textContent = "Title is required.";
      return;
    }
    if (!editId && !files.length) {
      msg.textContent = "Please choose a file.";
      return;
    }
  } else if (!title || !body) {
    msg.textContent = "Title and text are required.";
    return;
  }
  msg.textContent = "Saving...";
  F.publishBtn.disabled = true;

  try {
    let record;
    try {
      if (currentSection === "gallery") {
        // Append any newly selected files to the album's existing images
        const images = editingImages ? [...editingImages] : [];
        for (const f of files) {
          images.push(await uploadFile(f));
        }
        record = { title: title || null, images };
      } else if (currentSection === "members") {
        // Keep the existing file unless a new one is chosen
        let file_url = editingFile?.url || null;
        let file_name = editingFile?.name || null;
        let file_type = editingFile?.type || null;
        if (files[0]) {
          file_url = await uploadFile(files[0]);
          file_name = files[0].name;
          file_type = files[0].type;
        }
        record = { title, file_url, file_name, file_type, file_date: date || null };
      } else {
        // Keep existing image unless a new file is chosen
        let imageUrl = editingImageUrl;
        if (files[0]) imageUrl = await uploadFile(files[0]);
        record = { title, body, image_url: imageUrl };
        if (currentSection === "history") record.event_date = date || null;
        if (currentSection === "article") record.rotary_year = year || null;
      }
    } catch (upErr) {
      msg.textContent = "Image upload failed: " + upErr.message;
      return;
    }

    let error;
    if (editId) {
      ({ error } = await supabaseClient
        .from(table)
        .update(record)
        .eq("id", editId));
    } else {
      ({ error } = await supabaseClient.from(table).insert(record));
    }

    if (error) {
      msg.textContent = "Could not save: " + error.message;
      return;
    }

    const savedMsg = editId ? "Updated!" : "Published!";
    closeForm();
    F.msg.textContent = savedMsg;
    await loadSectionData(currentSection);
    renderList(currentSection);
  } finally {
    F.publishBtn.disabled = false;
  }
});

/* ============================================================
   OVERVIEW
   ============================================================ */
function renderOverview() {
  statGrid.innerHTML = SECTION_ORDER.map(
    (key) => `
    <button class="admin-stat-tile" data-section="${key}">
      <div class="admin-stat-tile__icon">${TABLES[key].icon}</div>
      <div class="admin-stat-tile__count">${cachedData[key].length}</div>
      <div class="admin-stat-tile__label">${escapeHtml(TABLES[key].label)}</div>
    </button>
  `,
  ).join("");
}

/* ============================================================
   LISTS
   ============================================================ */
async function loadAllSections() {
  await Promise.all(SECTION_ORDER.map((key) => loadSectionData(key)));
  selectSection("overview");
}

async function loadSectionData(section) {
  const table = TABLES[section].name;
  const orderCol = section === "history" ? "event_date" : "created_at";
  const { data } = await supabaseClient
    .from(table)
    .select("*")
    .order(orderCol, { ascending: false });
  cachedData[section] = data || [];
  return cachedData[section];
}

function formatItemDate(section, item) {
  const raw =
    section === "history"
      ? item.event_date
      : section === "members"
        ? item.file_date
        : item.created_at;
  if (!raw) return "";
  return new Date(raw).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderList(section) {
  const query = searchInput.value.trim().toLowerCase();
  const items = cachedData[section].filter(
    (item) => !query || (item.title || "").toLowerCase().includes(query),
  );

  if (!items.length) {
    itemList.innerHTML = `<div class="admin-item-list__empty">${
      query ? "No items match your search." : "No items yet in this section."
    }</div>`;
    return;
  }

  itemList.innerHTML = items
    .map(
      (item) => `
    <div class="admin-item-row">
      <div class="admin-item-row__icon">${TABLES[section].icon}</div>
      <div class="admin-item-row__info">
        <div class="admin-item-row__title">${escapeHtml(item.title) || "(untitled image)"}</div>
        <div class="admin-item-row__date">${escapeHtml(formatItemDate(section, item))}</div>
      </div>
      <button class="icon-btn" title="Edit"
        data-action="edit" data-section="${section}" data-id="${item.id}">${PENCIL}</button>
      <button class="icon-btn" title="Delete"
        data-action="delete" data-section="${section}" data-id="${item.id}">${TRASH}</button>
    </div>
  `,
    )
    .join("");
}

searchInput.addEventListener("input", () => renderList(currentSection));

// Delegated so newly rendered rows don't need their own listeners rebound.
itemList.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-btn");
  if (!btn) return;
  const { action, section, id } = btn.dataset;
  if (action === "edit") editItem(section, id);
  else if (action === "delete") deleteItem(section, id);
});

/* ─── EDIT — load an item back into the form ─── */
async function editItem(section, id) {
  const table = TABLES[section].name;
  const { data } = await supabaseClient
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return;

  currentSection = section;
  resetForm(); // sets field visibility + labels for this section

  // Fill the form with existing values
  F.title.value = data.title || "";
  F.body.value = data.body || "";
  if (section === "history") F.date.value = data.event_date || "";
  if (section === "members") F.date.value = data.file_date || "";
  if (section === "article") F.year.value = data.rotary_year || "";

  editId = id;
  editingImageUrl = data.image_url || null;
  editingImages = section === "gallery" ? data.images || [] : null;
  editingFile =
    section === "members"
      ? { url: data.file_url, name: data.file_name, type: data.file_type }
      : null;
  openForm();
  F.publishBtn.textContent = "Update " + TABLES[section].label;
  F.msg.textContent =
    section === "gallery"
      ? `Editing — this album has ${editingImages.length} image(s). Any new images you pick will be added to it.`
      : section === "members"
        ? "Editing — pick a new file only if you want to replace the current one."
        : "Editing — pick a new image only if you want to replace the current one.";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ─── DELETE ─── */
async function deleteItem(section, id) {
  if (!confirm("Delete this item permanently?")) return;
  await supabaseClient.from(TABLES[section].name).delete().eq("id", id);
  if (editId === id) closeForm();
  await loadSectionData(section);
  renderList(section);
}

/* ============================================================
   ROTARY YEAR DROPDOWN
   Rotary years run July–June. Lists 2008-09 up to the current
   (or upcoming) Rotary year, newest first.
   ============================================================ */
function populateYearOptions() {
  const select = F.year;
  if (!select) return;

  const now = new Date();
  // From July onward we're already in the next Rotary year
  let latestStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  latestStart += 1; // include the upcoming Rotary year

  const options = ['<option value="">Select Rotary year</option>'];
  for (let start = latestStart; start >= 2008; start--) {
    const end = String((start + 1) % 100).padStart(2, "0");
    const label = `${start}-${end}`;
    options.push(`<option value="${label}">${label}</option>`);
  }
  select.innerHTML = options.join("");
}

/* ─── START ─── */
populateYearOptions();
checkAuth();
