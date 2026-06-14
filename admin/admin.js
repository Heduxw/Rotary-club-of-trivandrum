/* ============================================================
   ADMIN — login, tabbed form, add / edit / delete
   Handles both "articles" and "history" tables.
   ============================================================ */

const loginView = document.getElementById("login-view");
const dashView = document.getElementById("dash-view");

// Maps each tab to its database table + display label
const TABLES = {
  article: { name: "articles", label: "Article" },
  history: { name: "history", label: "History" },
};

let currentTab = "article"; // which tab is active
let editId = null; // null = adding new, otherwise editing this id
let editingImageUrl = null; // keeps existing image when editing without a new upload

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

  document.getElementById("f-title").value = "";
  document.getElementById("f-body").value = "";
  document.getElementById("f-image").value = "";
  document.getElementById("f-date").value = "";

  const isHistory = currentTab === "history";
  document.getElementById("f-date").style.display = isHistory
    ? "block"
    : "none";
  document.getElementById("f-body").placeholder = isHistory
    ? "Description"
    : "Article text";
  document.getElementById("publish-btn").textContent =
    "Publish " + TABLES[currentTab].label;
  document.getElementById("form-msg").textContent = "";
}

/* ============================================================
   PUBLISH / UPDATE
   ============================================================ */
document.getElementById("publish-btn").addEventListener("click", async () => {
  const title = document.getElementById("f-title").value.trim();
  const body = document.getElementById("f-body").value.trim();
  const file = document.getElementById("f-image").files[0];
  const date = document.getElementById("f-date").value;
  const msg = document.getElementById("form-msg");
  const table = TABLES[currentTab].name;

  if (!title || !body) {
    msg.textContent = "Title and text are required.";
    return;
  }
  msg.textContent = "Saving...";

  // Keep existing image unless a new file is chosen
  let imageUrl = editingImageUrl;
  if (file) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: upErr } = await supabaseClient.storage
      .from("Projects")
      .upload(fileName, file);
    if (upErr) {
      msg.textContent = "Image upload failed: " + upErr.message;
      return;
    }
    imageUrl = supabaseClient.storage.from("Projects").getPublicUrl(fileName)
      .data.publicUrl;
  }

  const record = { title, body, image_url: imageUrl };
  if (currentTab === "history") record.event_date = date || null;

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
      <span class="list-row-title">${esc(item.title)}</span>
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
  document.getElementById("f-title").value = data.title || "";
  document.getElementById("f-body").value = data.body || "";
  if (tabKey === "history") {
    document.getElementById("f-date").value = data.event_date || "";
  }

  editId = id;
  editingImageUrl = data.image_url || null;
  document.getElementById("publish-btn").textContent =
    "Update " + TABLES[tabKey].label;
  document.getElementById("form-msg").textContent =
    "Editing — pick a new image only if you want to replace the current one.";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ─── DELETE ─── */
async function deleteItem(tabKey, id) {
  if (!confirm("Delete this item permanently?")) return;
  await supabaseClient.from(TABLES[tabKey].name).delete().eq("id", id);
  if (editId === id) resetForm();
  loadList(tabKey);
}

/* ─── Escape HTML (prevents broken layout / injection) ─── */
function esc(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ─── START ─── */
checkAuth();
