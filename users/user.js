/* ============================================================
   MEMBER AREA — login (Supabase users table) → read-only
   projects list. Separate credentials from the admin page.
   ============================================================ */

const loginView = document.getElementById("login-view");
const dashView = document.getElementById("dash-view");
const resourceList = document.getElementById("resource-list");

// Remembers the login for this browser tab (gates a view of
// otherwise-public data, so this is a convenience, not real security).
const SESSION_KEY = "rotary_member";

/* ─── VIEWS ─── */
function showLogin() {
  loginView.style.display = "block";
  dashView.style.display = "none";
}

function showDashboard() {
  loginView.style.display = "none";
  dashView.style.display = "block";
  loadResources();
}

/* ─── LOGIN ─── */
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const err = document.getElementById("login-error");

  if (!username || !password) {
    err.textContent = "Enter your username and password.";
    return;
  }

  err.textContent = "Checking...";

  // verify_user is a security-definer function that checks the hashed
  // password server-side and returns true/false (see setup SQL).
  const { data, error } = await supabaseClient.rpc("verify_user", {
    p_username: username,
    p_password: password,
  });

  if (error) {
    err.textContent = "Login failed: " + error.message;
    return;
  }

  if (data === true) {
    sessionStorage.setItem(SESSION_KEY, username);
    err.textContent = "";
    showDashboard();
  } else {
    err.textContent = "Invalid username or password.";
  }
}

document.getElementById("login-btn").addEventListener("click", login);
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
});

/* ─── MEMBER RESOURCES (read-only) ─── */
async function loadResources() {
  const { data, error } = await supabaseClient
    .from("member_resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    resourceList.innerHTML = `<p class="error">Could not load files.</p>`;
    console.error(error);
    return;
  }

  if (!data?.length) {
    resourceList.innerHTML = `<p class="loading">No files yet.</p>`;
    return;
  }

  resourceList.innerHTML = data
    .map(
      (item) => `
    <a class="resource-item" href="${escapeAttr(item.file_url)}" target="_blank" rel="noopener">
      <span class="resource-icon">${fileIcon(item.file_name, item.file_type)}</span>
      <span class="resource-info">
        <span class="resource-title">${escapeHtml(item.title)}</span>
        ${item.file_date ? `<span class="resource-date">${escapeHtml(formatDate(item.file_date))}</span>` : ""}
        ${item.file_name ? `<span class="resource-name">${escapeHtml(item.file_name)}</span>` : ""}
      </span>
      <span class="resource-action">Open ↗</span>
    </a>
  `,
    )
    .join("");
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Picks an emoji icon from the file's type or extension
function fileIcon(name, type) {
  const ext = (name || "").split(".").pop().toLowerCase();
  const t = type || "";
  if (t.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return "🖼️";
  if (t === "application/pdf" || ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext) || t.includes("word")) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext) || t.includes("sheet") || t.includes("excel"))
    return "📊";
  if (["ppt", "pptx"].includes(ext) || t.includes("presentation")) return "📽️";
  return "📁";
}

/* ─── START — stay logged in within the tab ─── */
if (sessionStorage.getItem(SESSION_KEY)) showDashboard();
else showLogin();
