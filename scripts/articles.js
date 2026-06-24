let allArticles = []; // cached so the year filter doesn't refetch

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

  allArticles = data || [];
  buildYearFilter();
  renderArticles("all");
}

// Fill the dropdown with the distinct rotary years found in the projects
function buildYearFilter() {
  const select = document.getElementById("year-filter");
  if (!select) return;

  const years = [
    ...new Set(allArticles.map((a) => a.rotary_year).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a)); // newest year first

  select.innerHTML =
    `<option value="all">All years</option>` +
    years.map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join("");

  select.addEventListener("change", () => renderArticles(select.value));
}

function renderArticles(year) {
  const grid = document.getElementById("articles-grid");

  const list =
    year === "all"
      ? allArticles
      : allArticles.filter((a) => a.rotary_year === year);

  if (!list.length) {
    grid.innerHTML = `<p class="loading">No projects for this year.</p>`;
    return;
  }

  grid.innerHTML = list
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
        ${
          article.rotary_year
            ? `<p class="rotary-year">Rotary Year ${escapeHtml(article.rotary_year)}</p>`
            : ""
        }
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
