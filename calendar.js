async function loadEvents() {
  const { apiKey, calendarId, maxEvents } = CALENDAR_CONFIG;
  const list = document.getElementById("events-list");

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/` +
    `${encodeURIComponent(calendarId)}/events` +
    `?key=${apiKey}` +
    `&timeMin=${new Date().toISOString()}` +
    `&maxResults=${maxEvents}` +
    `&singleEvents=true&orderBy=startTime`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      list.innerHTML = `<p class="events-error">${data.error.message}</p>`;
      return;
    }

    if (!data.items?.length) {
      list.innerHTML = `<p class="events-loading">No upcoming events.</p>`;
      return;
    }

    list.innerHTML = data.items
      .map(
        (ev) => `
      <div class="event-item">
        <p class="event-name">${ev.summary || "Untitled Event"}</p>
        <p class="event-date">${formatDate(ev.start.dateTime || ev.start.date)}</p>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    list.innerHTML = `<p class="events-error">Could not load events.</p>`;
    console.error(err);
  }
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

loadEvents();
