function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

async function loadArticle() {
  const id = new URLSearchParams(location.search).get("id");
  const el = document.getElementById("article");

  const { data, error } = await supabaseClient
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    el.innerHTML = `<p class="error">Article not found.</p>`;
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

  el.innerHTML = `
    ${data.image_url ? `<img src="${escapeAttr(data.image_url)}" class="single-img" alt="">` : ""}
    <h1>${safeTitle}</h1>
    ${safeYear ? `<p class="rotary-year">Rotary Year ${safeYear}</p>` : ""}
    <p class="single-body">${safeBody}</p>
    <a href="../articles/" class="back-link">← Back to all articles</a>
  `;
}

loadArticle();
