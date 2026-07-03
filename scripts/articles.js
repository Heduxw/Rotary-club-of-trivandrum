let allArticles = []; // cached so the year filter doesn't refetch
let overflowYears = []; // years tucked into the "More" pill

const MAX_VISIBLE_YEAR_PILLS = 5;

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

// Render the distinct rotary years found in the projects as pill buttons,
// tucking any beyond MAX_VISIBLE_YEAR_PILLS into a select styled as a pill.
function buildYearFilter() {
  const wrap = document.getElementById("year-pills");
  if (!wrap) return;

  const years = [
    ...new Set(allArticles.map((a) => a.rotary_year).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a)); // newest year first

  const visibleYears = years.slice(0, MAX_VISIBLE_YEAR_PILLS);
  overflowYears = years.slice(MAX_VISIBLE_YEAR_PILLS);

  let html = `<button type="button" class="year-pill active" data-year="all">All</button>`;
  html += visibleYears
    .map(
      (y) =>
        `<button type="button" class="year-pill" data-year="${escapeAttr(y)}">${escapeHtml(y)}</button>`,
    )
    .join("");

  if (overflowYears.length) {
    html += `
      <label class="year-pill year-pill-more">
        <select id="year-more-select" aria-label="More rotary years">
          <option value="">More…</option>
          ${overflowYears
            .map(
              (y) =>
                `<option value="${escapeAttr(y)}">${escapeHtml(y)}</option>`,
            )
            .join("")}
        </select>
      </label>`;
  }

  wrap.innerHTML = html;

  wrap.querySelectorAll(".year-pill[data-year]").forEach((btn) => {
    btn.addEventListener("click", () => selectYear(btn.dataset.year));
  });

  const moreSelect = document.getElementById("year-more-select");
  if (moreSelect) {
    moreSelect.addEventListener("change", () => {
      if (moreSelect.value) selectYear(moreSelect.value);
    });
  }
}

function selectYear(year) {
  const wrap = document.getElementById("year-pills");
  if (wrap) {
    wrap.querySelectorAll(".year-pill[data-year]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.year === year);
    });
  }

  const morePill = document.querySelector(".year-pill-more");
  const moreSelect = document.getElementById("year-more-select");
  if (morePill && moreSelect) {
    const isOverflowYear = overflowYears.includes(year);
    morePill.classList.toggle("active", isOverflowYear);
    moreSelect.value = isOverflowYear ? year : "";
  }

  renderArticles(year);
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
    <a href="article.html?id=${encodeURIComponent(article.id)}" class="article-card">
      ${
        article.image_url
          ? `<img src="${escapeAttr(article.image_url)}" alt="${escapeAttr(article.title)}" loading="lazy">`
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
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + " ....." : text;
}

loadArticles();
