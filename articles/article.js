function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function loadArticle() {
  const id = new URLSearchParams(location.search).get("id");
  const root = document.getElementById("article-root");

  const { data, error } = await supabaseClient
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    root.innerHTML = `<p class="error container">Article not found.</p>`;
    return;
  }

  const safeTitle = escapeHtml(data.title);
  const safeBody = escapeHtml(data.body).replace(/\n/g, "<br>");
  const safeYear = escapeHtml(data.rotary_year);

  document.title = `${data.title} | Rotary Club of Trivandrum Residency`;
  const descEl = document.getElementById("article-meta-description");
  if (descEl && data.body) descEl.content = truncate(data.body, 155);
  const canonicalEl = document.getElementById("article-canonical");
  if (canonicalEl) canonicalEl.href = location.href;

  root.innerHTML = `
    <div class="single-hero" ${data.image_url ? `style="background-image:url('${escapeAttr(data.image_url)}')"` : ""}>
      <div class="single-hero__scrim">
        <div class="container">
          ${safeYear ? `<p class="single-hero__year">Rotary Year ${safeYear}</p>` : ""}
          <h1 class="single-hero__title">${safeTitle}</h1>
        </div>
      </div>
    </div>

    <div class="single-article container">
      <p class="single-breadcrumb">
        <a href="../">Home</a> / <a href="../articles/">Projects</a> / <span>${safeTitle}</span>
      </p>
      <p class="single-body">${safeBody}</p>
      <a href="../articles/" class="back-link">← Back to all projects</a>
    </div>

    <div class="related-projects" id="related-projects"></div>
  `;

  loadRelated(data.id, data.rotary_year);
}

async function loadRelated(currentId, rotaryYear) {
  const wrap = document.getElementById("related-projects");
  if (!wrap) return;

  const { data } = await supabaseClient
    .from("articles")
    .select("id,title,rotary_year,image_url")
    .neq("id", currentId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!data || !data.length) return;

  wrap.innerHTML = `
    <div class="container">
      <div class="related-projects__label">More projects</div>
      <div class="related-projects__grid">
        ${data
          .map(
            (p) => `
          <a href="article.html?id=${encodeURIComponent(p.id)}" class="related-card">
            <div class="related-card__img" ${p.image_url ? `style="background-image:url('${escapeAttr(p.image_url)}')"` : ""}></div>
            <div class="related-card__body">
              ${p.rotary_year ? `<div class="related-card__year">RY ${escapeHtml(p.rotary_year)}</div>` : ""}
              <div class="related-card__title">${escapeHtml(p.title)}</div>
            </div>
          </a>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

loadArticle();
