/* ============================================================
   SHARED HELPERS
   Loaded before any page script that renders database content.
   ============================================================ */

// Escapes text for safe insertion into HTML element content.
// Null/undefined become an empty string.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Escapes a value for safe insertion inside a double-quoted HTML attribute
// (e.g. src="...") — also neutralises the quote character.
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
