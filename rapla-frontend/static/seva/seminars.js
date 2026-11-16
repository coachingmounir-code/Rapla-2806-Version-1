/* Calendar-day selection in the seminar venue's timezone, independent of task data. */
(function (root) {
  'use strict';
  const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
  function berlinDay(now = new Date()) {
    const parts = Object.fromEntries(dayFormatter.formatToParts(now).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function upcoming(seminars, now = new Date(), limit = 6, hiddenIds = []) {
    const today = berlinDay(now);
    return seminars.filter(s => !s.excluded && !hiddenIds.includes(s.id) && s.start >= today)
      .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id)).slice(0, limit);
  }
  function hiddenIds(entities) {
    return entities.filter(e => e.kind === 'knowledge' && e.category === 'seminar-hidden' && !e.deleted).map(e => e.seminar);
  }
  function visibilityId(id) {
    if (!/^nordsee-\d{3}$/.test(id)) throw Error('Unbekannter Seminartermin.');
    return '5e6a0000-0000-4000-8000-' + id.slice(8).padStart(12, '0');
  }
  const api = { berlinDay, upcoming, hiddenIds, visibilityId };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  root.SevaSeminars = api;
  const list = document.getElementById('upcoming-seminars-list');
  if (!list) return;
  const data = root.SevaSeminarData;
  if (!data) {
    document.getElementById('seminar-status').textContent = 'Die Seminarübersicht konnte nicht geladen werden. Bitte lade die Seite erneut.';
    return;
  }
  const illustrations = {
    lotus: '<path d="M40 52C23 44 23 30 40 15c17 15 17 29 0 37Z"/><path d="M40 52C18 55 9 40 10 27c18 0 29 9 30 25Zm0 0c22 3 31-12 30-25-18 0-29 9-30 25Z"/><path d="M15 60h50"/>',
    sea: '<circle cx="54" cy="21" r="9"/><path d="M8 43q10-9 21 0t21 0t22 0M8 54q10-9 21 0t21 0t22 0M18 29l8-5 8 5"/>',
    book: '<path d="M40 23c-10-7-21-7-30-4v37c10-3 20-3 30 4 10-7 20-7 30-4V19c-9-3-20-3-30 4Zm0 0v37M18 29l14 3M18 39l14 3M48 32l14-3M48 42l14-3"/>'
  };
  function illustration(title) {
    const type = /Ausbildung|Weiterbildung|Prüfung|Schriften|Lernseminar/i.test(title) ? 'book' : /Ferien|Nordsee|Stille|Schweige|Entspannung/i.test(title) ? 'sea' : 'lotus';
    const box = document.createElement('div');
    box.className = 'seminar-art seminar-art-' + type;
    box.setAttribute('aria-hidden', 'true');
    // Only fixed decorative SVG paths above are inserted as markup.
    box.innerHTML = `<svg viewBox="0 0 80 76" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${illustrations[type]}</svg>`;
    return box;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
  }
  const dateLabel = iso => iso.split('-').reverse().join('.');
  let renderedDay, hidden = [], saveVisibility;
  const section = list.closest('section');
  const feedback = element('p', 'seminar-feedback', '');
  feedback.setAttribute('role', 'status');
  const removed = document.createElement('details');
  removed.className = 'seminar-removed';
  const summary = element('summary', '', '');
  const removedList = element('div', '', '');
  removed.append(summary, removedList);
  section.append(feedback, removed);
  api.connect = function (save) { saveVisibility = save; renderedDay = null; render(); };
  api.update = function (entities) {
    const next = hiddenIds(entities).sort();
    if (JSON.stringify(next) === JSON.stringify(hidden)) return;
    hidden = next; renderedDay = null; render();
  };
  function changeVisibility(seminar, hide) {
    try {
      if (!saveVisibility) throw Error('Die Speicherung ist noch nicht bereit. Bitte lade die Seite erneut.');
      saveVisibility(seminar, hide);
      feedback.textContent = hide ? `„${seminar.title}“ wurde ausgeblendet. Die Vorschau wurde aktualisiert.` : `„${seminar.title}“ wurde wieder freigegeben.`;
      (list.querySelector('button') || summary).focus({ preventScroll: true });
    } catch (error) { feedback.textContent = 'Nicht gespeichert: ' + error.message; }
  }
  function render() {
    const now = new Date(), today = berlinDay(now);
    if (renderedDay === today) return;
    renderedDay = today;
    const entries = upcoming(data.seminars, now, 6, hidden);
    list.replaceChildren();
    for (const seminar of entries) {
      const card = element('li', 'seminar-card', '');
      const date = element('p', 'seminar-date', '');
      const start = element('time', '', dateLabel(seminar.start)); start.dateTime = seminar.start; date.append(start);
      if (seminar.end !== seminar.start) {
        const end = element('time', '', dateLabel(seminar.end)); end.dateTime = seminar.end;
        date.append(' – ', end);
      }
      const dismiss = element('button', 'seminar-dismiss', '×');
      dismiss.type = 'button';
      dismiss.disabled = !saveVisibility;
      dismiss.title = 'Seminar ausblenden';
      dismiss.setAttribute('aria-label', seminar.title + ' am ' + dateLabel(seminar.start) + ' ausblenden');
      dismiss.addEventListener('click', () => changeVisibility(seminar, true));
      card.append(illustration(seminar.title), date, dismiss);
      if (seminar.start === today) card.append(element('span', 'seminar-today', 'Startet heute'));
      card.append(element('h3', '', seminar.title));
      const leader = element('p', 'seminar-leader', '');
      leader.append(element('span', 'seminar-leader-label', 'Seminarleitung'), document.createTextNode(seminar.leaders.join(' · ') || 'Noch nicht angegeben'));
      card.append(leader);
      if (seminar.leaderNote) card.append(element('p', 'seminar-note', seminar.leaderNote));
      list.append(card);
    }
    const hiddenSeminars = data.seminars.filter(s => hidden.includes(s.id));
    removed.hidden = !hiddenSeminars.length;
    summary.textContent = `Ausgeblendete Seminare (${hiddenSeminars.length})`;
    removedList.replaceChildren();
    for (const seminar of hiddenSeminars) {
      const row = element('div', 'seminar-removed-row', '');
      const restore = element('button', '', 'Wieder anzeigen');
      restore.type = 'button';
      restore.setAttribute('aria-label', seminar.title + ' am ' + dateLabel(seminar.start) + ' wieder anzeigen');
      restore.addEventListener('click', () => changeVisibility(seminar, false));
      row.append(element('span', '', dateLabel(seminar.start) + ' · ' + seminar.title), restore);
      removedList.append(row);
    }
    document.getElementById('seminar-status').textContent = entries.length
      ? 'Am Starttag noch sichtbar · ab dem Folgetag rücken die nächsten nach.'
      : 'Keine weiteren kommenden Seminare hinterlegt. Bitte ergänze die Seminarliste.';
  }
  render();
  setInterval(render, 30000);
  window.addEventListener('pageshow', render);
  window.addEventListener('focus', render);
  window.addEventListener('hashchange', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})(typeof window === 'undefined' ? globalThis : window);
