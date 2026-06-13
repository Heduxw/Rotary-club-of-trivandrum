async function loadArticles() {
  const grid = document.getElementById("articles-grid");

  const { data, error } = await supabaseClient
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="error">Could not load articles.</p>`;
    console.error(error);
    return;
  }

  if (!data.length) {
    grid.innerHTML = `<p class="loading">No articles yet.</p>`;
    return;
  }

  grid.innerHTML = data
    .map(
      (article) => `
    <a href="article.html?id=${article.id}" class="article-card">
      ${
        article.image_url
          ? `<img src="${article.image_url}" alt="${escapeHtml(article.title)}">`
          : ""
      }
      <div class="article-card-body">
        <h2>${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(truncate(article.body, 160))}</p>
      </div>
    </a>
  `,
    )
    .join("");
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max) + " ....." : text;
}

// Prevents broken layout / injection from article text
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadArticles();
