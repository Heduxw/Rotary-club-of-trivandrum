async function loadEvents() {
  const { apiKey, calendarId, maxEvents } = CALENDAR_CONFIG;
  const list = document.getElementById("events-list");

  // Build API URL
  const now = new Date().toISOString();
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events` +
    `?key=${apiKey}` +
    `&timeMin=${now}` +
    `&maxResults=${maxEvents}` +
    `&singleEvents=true` +
    `&orderBy=startTime`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // API error
    if (data.error) {
      list.innerHTML = `<p class="events-error">
        Could not load events: ${data.error.message}
      </p>`;
      return;
    }

    // No events
    if (!data.items || data.items.length === 0) {
      list.innerHTML = `<p class="events-loading">
        No upcoming events found.
      </p>`;
      return;
    }

    // Build event list
    list.innerHTML = data.items
      .map((event) => {
        const name = event.summary || "Untitled Event";
        const date = formatDate(event.start.dateTime || event.start.date);
        const link = event.htmlLink || "#";

        return `
        <div class="event-item">
          <p class="event-name">
            <a href="${link}" target="_blank"
               style="text-decoration:none; color:inherit;">
              ${name}
            </a>
          </p>
          <p class="event-date">${date}</p>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    list.innerHTML = `<p class="events-error">
      Failed to load events. Check your API key and Calendar ID.
    </p>`;
    console.error("Calendar error:", err);
  }
}

// ─── FORMAT DATE ───
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Output: 26 July 2026
}

// ─── RUN ───
loadEvents();
