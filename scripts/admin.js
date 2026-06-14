const loginView = document.getElementById("login-view");
const dashView = document.getElementById("dash-view");

// ─── CHECK IF ALREADY LOGGED IN ───
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
  loadAdminList();
}

// ─── LOGIN ───
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
    console.error(error);
    return;
  }
  showDashboard();
});

// ─── LOGOUT ───
document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

// ─── ADD ARTICLE (with image upload) ───
document.getElementById("add-btn").addEventListener("click", async () => {
  const title = document.getElementById("a-title").value.trim();
  const body = document.getElementById("a-body").value.trim();
  const file = document.getElementById("a-image").files[0];
  const msg = document.getElementById("form-msg");

  if (!title || !body) {
    msg.textContent = "Title and text required.";
    return;
  }
  msg.textContent = "Publishing...";

  let imageUrl = null;

  // Upload image if provided
  if (file) {
    const fileName = `${Date.now()}-${file.name}`;

    const { error: upErr } = await supabaseClient.storage
      .from("Projects")
      .upload(fileName, file);

    if (upErr) {
      msg.textContent = "Upload failed: " + upErr.message;
      console.error(upErr);
      return;
    }

    const { data } = supabaseClient.storage
      .from("Projects")
      .getPublicUrl(fileName);
    imageUrl = data.publicUrl;
  }

  // Insert article
  const { error } = await supabaseClient
    .from("articles")
    .insert({ title, body, image_url: imageUrl });

  if (error) {
    msg.textContent = "Could not save article.";
    return;
  }

  msg.textContent = "Published!";
  document.getElementById("a-title").value = "";
  document.getElementById("a-body").value = "";
  document.getElementById("a-image").value = "";
  loadAdminList();
});

// ─── LIST + DELETE ───
async function loadAdminList() {
  const list = document.getElementById("admin-list");
  const { data } = await supabaseClient
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  list.innerHTML = (data || [])
    .map(
      (a) => `
    <div class="admin-row">
      <span>${a.title.replace(/</g, "&lt;")}</span>
      <button onclick="deleteArticle('${a.id}')">Delete</button>
    </div>
  `,
    )
    .join("");
}

async function deleteArticle(id) {
  if (!confirm("Delete this article?")) return;
  await supabaseClient.from("articles").delete().eq("id", id);
  loadAdminList();
}

checkAuth();
