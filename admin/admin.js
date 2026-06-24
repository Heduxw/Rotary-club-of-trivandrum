/* ============================================================
   ADMIN — login, tabbed form, add / edit / delete
   Handles the "articles", "history" and "gallery" tables.
   ============================================================ */

const loginView = document.getElementById("login-view");
const dashView = document.getElementById("dash-view");

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

// Maps each tab to its database table + display label
const TABLES = {
  article: { name: "articles", label: "Article" },
  history: { name: "history", label: "History" },
  gallery: { name: "gallery", label: "Gallery" },
};

let currentTab = "article"; // which tab is active
let editId = null; // null = adding new, otherwise editing this id
let editingImageUrl = null; // keeps existing image when editing without a new upload
let editingImages = null; // keeps existing gallery images when editing

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
const PENCIL = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`;

const TRASH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"
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

function showLogin() {
  loginView.style.display = "block";
  dashView.style.display = "none";
}

function showDashboard() {
  loginView.style.display = "none";
  dashView.style.display = "block";
  loadList("article");
  loadList("history");
  loadList("gallery");
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const err = document.getElementById("login-error");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    err.textContent = error.message;
    return;
  }
  showDashboard();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

/* ============================================================
   TABS
   ============================================================ */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentTab = tab.dataset.tab;
    resetForm();
  });
});

// Clears the form and adapts it to the current tab
function resetForm() {
  editId = null;
  editingImageUrl = null;
  editingImages = null;

  F.title.value = "";
  F.body.value = "";
  F.image.value = "";
  F.date.value = "";
  F.year.value = "";

  const isHistory = currentTab === "history";
  const isGallery = currentTab === "gallery";
  const isArticle = currentTab === "article";

  // Date is history-only, Rotary year is articles-only,
  // and gallery items are image-only with an optional caption.
  F.date.style.display = isHistory ? "block" : "none";
  F.year.style.display = isArticle ? "block" : "none";
  F.body.style.display = isGallery ? "none" : "block";
  F.image.multiple = isGallery;
  F.body.placeholder = isHistory ? "Description" : "Article text";
  F.title.placeholder = isGallery ? "Caption (optional)" : "Title";
  F.publishBtn.textContent = "Publish " + TABLES[currentTab].label;
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
  const table = TABLES[currentTab].name;

  if (currentTab === "gallery") {
    if (!editId && !files.length) {
      msg.textContent = "Please choose an image.";
      return;
    }
  } else if (!title || !body) {
    msg.textContent = "Title and text are required.";
    return;
  }
  msg.textContent = "Saving...";

  let record;
  try {
    if (currentTab === "gallery") {
      // Append any newly selected files to the album's existing images
      const images = editingImages ? [...editingImages] : [];
      for (const f of files) {
        images.push(await uploadFile(f));
      }
      record = { title: title || null, images };
    } else {
      // Keep existing image unless a new file is chosen
      let imageUrl = editingImageUrl;
      if (files[0]) imageUrl = await uploadFile(files[0]);
      record = { title, body, image_url: imageUrl };
      if (currentTab === "history") record.event_date = date || null;
      if (currentTab === "article") record.rotary_year = year || null;
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

  msg.textContent = editId ? "Updated!" : "Published!";
  resetForm();
  loadList(currentTab);
});

/* ============================================================
   LISTS
   ============================================================ */
async function loadList(tabKey) {
  const table = TABLES[tabKey].name;
  const listEl = document.getElementById(tabKey + "-list");
  if (!listEl) return;

  const orderCol = tabKey === "history" ? "event_date" : "created_at";
  const { data } = await supabaseClient
    .from(table)
    .select("*")
    .order(orderCol, { ascending: false });

  listEl.innerHTML = (data || [])
    .map(
      (item) => `
    <div class="list-row">
      <span class="list-row-title">${escapeHtml(item.title) || "(untitled image)"}</span>
      <span class="list-row-actions">
        <button class="icon-btn" title="Edit"
          onclick="editItem('${tabKey}','${item.id}')">${PENCIL}</button>
        <button class="icon-btn" title="Delete"
          onclick="deleteItem('${tabKey}','${item.id}')">${TRASH}</button>
      </span>
    </div>
  `,
    )
    .join("");
}

/* ─── EDIT — load an item back into the form ─── */
async function editItem(tabKey, id) {
  const table = TABLES[tabKey].name;
  const { data } = await supabaseClient
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (!data) return;

  // Switch to the correct tab
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === tabKey));
  currentTab = tabKey;
  resetForm(); // sets field visibility + labels for this tab

  // Fill the form with existing values
  F.title.value = data.title || "";
  F.body.value = data.body || "";
  if (tabKey === "history") F.date.value = data.event_date || "";
  if (tabKey === "article") F.year.value = data.rotary_year || "";

  editId = id;
  editingImageUrl = data.image_url || null;
  editingImages = tabKey === "gallery" ? data.images || [] : null;
  F.publishBtn.textContent = "Update " + TABLES[tabKey].label;
  F.msg.textContent =
    tabKey === "gallery"
      ? `Editing — this album has ${editingImages.length} image(s). Any new images you pick will be added to it.`
      : "Editing — pick a new image only if you want to replace the current one.";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ─── DELETE ─── */
async function deleteItem(tabKey, id) {
  if (!confirm("Delete this item permanently?")) return;
  await supabaseClient.from(TABLES[tabKey].name).delete().eq("id", id);
  if (editId === id) resetForm();
  loadList(tabKey);
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
