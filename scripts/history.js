async function loadHistory() {
  const grid = document.getElementById("history-grid");

  const { data, error } = await supabaseClient
    .from("history")
    .select("*")
    .order("event_date", { ascending: false }); // newest first

  if (error) {
    grid.innerHTML = `<p class="error">Could not load history.</p>`;
    console.error(error);
    return;
  }

  if (!data?.length) {
    grid.innerHTML = `<p class="loading">No history items yet.</p>`;
    return;
  }

  grid.innerHTML = data
    .map(
      (item) => `
    <div class="article-card">
      ${item.image_url ? `<img src="${escapeAttr(item.image_url)}" alt="${escapeAttr(item.title)}">` : ""}
      <div class="article-card-body">
        <h2>${escapeHtml(item.title)}</h2>
        ${item.event_date ? `<p class="event-date">${formatDate(item.event_date)}</p>` : ""}
        <p>${escapeHtml(item.body)}</p>
      </div>
    </div>
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

loadHistory();
