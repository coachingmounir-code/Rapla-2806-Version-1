/* Display-only ticker; edits use the existing persisted knowledge editor. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const viewport = $('ideas-viewport'), track = $('ideas-track');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, entries = [], signature = '';
  function setPaused() {
    track.style.animationPlayState = paused ? 'paused' : 'running';
    $('ideas-pause').textContent = paused ? 'Weiterlaufen' : 'Pausieren';
    $('ideas-pause').setAttribute('aria-pressed', String(paused));
  }
  $('ideas-pause').onclick = () => { paused = !paused; setPaused(); };
  reduced.addEventListener('change', () => { paused = reduced.matches; setPaused(); });
  function node(tag, text, className = '') {
    const el = document.createElement(tag); el.textContent = text; el.className = className; return el;
  }
  function layout() {
    if (!entries.length || !viewport.clientWidth) return;
    const group = node('div', '', 'ideas-group');
    entries.forEach(e => group.append(node('span', e.title, 'ideas-item')));
    track.replaceChildren(group);
    // Fill at least one viewport so even a single short idea loops without a gap.
    const width = group.getBoundingClientRect().width;
    if (!width) return;
    const repeats = Math.ceil(viewport.clientWidth / width);
    for (let i = 1; i < repeats; i++) entries.forEach(e => group.append(node('span', e.title, 'ideas-item')));
    const distance = group.getBoundingClientRect().width;
    track.append(group.cloneNode(true));
    track.style.setProperty('--ideas-distance', `-${distance}px`);
    track.style.animationDuration = `${distance / 42}s`;
    setPaused();
  }
  new ResizeObserver(layout).observe(viewport);
  window.SevaIdeas = { update(entities) {
    const all = entities.filter(e => e.kind === 'knowledge' && e.category === 'ai-idea').sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    const next = JSON.stringify(all);
    if (signature === next) return;
    signature = next;
    entries = all.filter(e => !e.deleted);
    $('ideas-empty').hidden = !!entries.length;
    viewport.hidden = !entries.length;
    $('ideas-pause').hidden = !entries.length;
    $('ideas-manage').hidden = !all.length;
    $('ideas-count').textContent = `(${entries.length})`;
    $('ideas-list').replaceChildren(...all.map(e => {
      const row = node('div', '', 'ideas-row');
      const edit = node('button', e.title + (e.deleted ? ' · Im Papierkorb' : ''));
      edit.type = 'button'; edit.dataset.action = 'edit'; edit.dataset.id = e.id;
      row.append(edit);
      if (e.notes) row.append(node('p', e.notes));
      return row;
    }));
    track.replaceChildren(); layout();
  }};
  setPaused();
})();
