(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const M = SevaModel, store = new SevaStore();
  // Teamfreigabe erst nach Datenbankmigration und Klärung des Planerzugriffs anbieten.
  const teamSharingReady = false;
  let entities = [], editing = null, original = null, view = 'tasks';
  let draggedTask = null;
  const weekdays = [['mon', 'Montag'], ['tue', 'Dienstag'], ['wed', 'Mittwoch'], ['thu', 'Donnerstag'], ['fri', 'Freitag'], ['sat', 'Samstag'], ['sun', 'Sonntag']];
  const currentWeekday = () => weekdays[(new Date().getDay() + 6) % 7][0];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cloud = new SevaCloud(store, render, text => { $('sync-status').textContent = text; }, accountChanged);
  function notify(message, error = false) { $('notice').hidden = false; $('notice').textContent = message; $('notice').classList.toggle('error', error); }
  function safe(fn) { return async (...args) => { try { await fn(...args); } catch (error) { notify(error.message || 'Aktion fehlgeschlagen. Bitte erneut versuchen.', true); } }; }
  function save(kind, id, patch) {
    if (cloud.teamId && !cloud.authorized) throw Error('Bitte zuerst mit einer freigegebenen E-Mail-Adresse anmelden.');
    store.change(kind, id, patch); // Persist first. Quota errors must not masquerade as a successful save.
    render(); cloud.sync();
  }
  function accountChanged(user) {
    pointerCleanup();
    if ($('editor').open) { $('editor').close(); notify('Konto gewechselt. Bitte öffne die Aufgabe im gewünschten Konto erneut.'); }
    $('sync-guidance').hidden = !!user;
    if (cloud.teamId && !user) {
      $('sync-guidance').querySelector('strong').textContent = 'Für die gemeinsame SEVA-K Liste anmelden';
      $('sync-guidance').querySelector('p').textContent = 'Melde dich mit der E-Mail-Adresse an, die für diese Liste freigegeben wurde. Ein eigener Tagesplaner-Zugang ist dafür nicht nötig.';
    }
    $('ideas-band').hidden = !!cloud.teamId && !cloud.authorized;
    $('rapla-work').hidden = !!cloud.teamId && !cloud.authorized;
    $('team-work').hidden = !!cloud.teamId && !cloud.authorized;
    $('progress-summary').hidden = !!cloud.teamId && !cloud.authorized;
    $('team-access').hidden = !cloud.teamId || cloud.authorized || !user;
    $('team-access').textContent = cloud.checking ? 'Dein Teamzugriff wird geprüft …' : cloud.accessError ? 'Der Teamzugriff konnte gerade nicht geprüft werden. Bitte versuche es mit „Abgleichen“ erneut.' : 'Diese E-Mail-Adresse ist für die Teamliste nicht freigegeben. Bitte melde dich bei Bedarf mit einer anderen Adresse an oder wende dich an die Person, die dir den Link geschickt hat.';
    $('sync-identity').hidden = !user;
    $('sync-identity').textContent = user ? 'Angemeldet als ' + user.email + (cloud.teamId && cloud.authorized ? ' · gemeinsame Liste' : '') : '';
    $('login-form').hidden = !!user; $('account').hidden = !user;
    $('account-name').textContent = user ? 'Angemeldet als ' + user.email : '';
    $('adopt').hidden = !!cloud.teamId;
    $('team-sharing').hidden = !teamSharingReady || !user || !cloud.authorized || cloud.workspaceId !== user.id;
    if (!$('team-sharing').hidden) { $('team-link').value = cloud.teamLink(); refreshMembers().catch(error => notify(error.message, true)); }
    if (cloud.teamId && !cloud.authorized) $('settings').hidden = false;
    $('auth-message').textContent = '';
  }
  async function refreshMembers() {
    const members = await cloud.teamMembers();
    $('team-members').replaceChildren(...members.map(member => {
      const item = document.createElement('li');
      const label = document.createElement('span'); label.textContent = member.email + (member.member_id ? ' · angemeldet' : ' · eingeladen');
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Entfernen'; remove.dataset.teamEmail = member.email;
      item.append(label, remove); return item;
    }));
  }
  function render() {
    if (cloud.teamId && !cloud.authorized) { $('progress-summary').hidden = true; return; }
    $('progress-summary').hidden = false;
    if (draggedTask) return;
    try { entities = store.entities(); }
    catch (_) { notify('Die gespeicherten SEVA-K Daten konnten nicht gelesen werden. Bitte nichts löschen und eine Sicherung prüfen.', true); return; }
    window.SevaSeminars?.update(entities);
    window.SevaIdeas.update(entities);
    renderChecklist();
    const tasks = entities.filter(e => e.kind === 'task'), active = tasks.filter(t => !t.deleted);
    const progress = M.taskProgress(entities), progressText = `${progress.done} von ${progress.total} Aufgaben erledigt`;
    $('progress-count').textContent = progressText;
    $('progress-percent').textContent = `${progress.percent} %`;
    $('progress-track').setAttribute('aria-valuenow', String(progress.percent));
    $('progress-track').setAttribute('aria-valuetext', progressText);
    $('progress-fill').style.width = `${progress.percent}%`;
    $('open-count').textContent = active.filter(t => t.status !== 'done').length;
    $('waiting-count').textContent = active.filter(t => t.status === 'waiting').length;
    $('done-count').textContent = active.filter(t => t.status === 'done').length;
    const now = new Date(), today = M.todayTasks(entities, now);
    $('today-count').textContent = today.length;
    $('today-list').innerHTML = today.map(t => taskCard(t, tasks, true, now)).join('') || '<div class="today-empty">Hier ist Platz für deinen heutigen Fokus.<br>Aufgaben hierher ziehen oder bei einer Aufgabe „Für heute“ wählen.</div>';
    const query = $('search').value.toLocaleLowerCase('de'), filter = $('filter').value;
    const selected = tasks.filter(t => (filter === 'trash' ? t.deleted : !t.deleted && (filter === 'hidden' ? !M.isVisible(t, now) : M.isVisible(t, now) && (filter === 'active' ? t.status !== 'done' && !today.some(x => x.id === t.id) : t.status === filter))) && `${t.title} ${t.seminar} ${t.notes}`.toLocaleLowerCase('de').includes(query));
    selected.sort((a, b) => M.priority(b, tasks).score - M.priority(a, tasks).score || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    $('list-title').textContent = filter === 'trash' ? 'Papierkorb' : filter === 'hidden' ? 'Ausgeblendete Aufgaben' : filter === 'done' ? 'Das hast du geschafft' : 'Alle Aufgaben';
    $('task-list').innerHTML = selected.map(t => taskCard(t, tasks, false, now)).join('') || `<div class="empty"><div class="empty-icon">◌</div><h3>${query ? 'Keine passende Aufgabe' : filter === 'active' ? 'Platz für deinen nächsten Schritt' : 'Hier ist gerade alles frei'}</h3><p>${filter === 'active' && !query ? 'Notiere oben, was ansteht. Die Liste begleitet dich durch alle SEVA-Blöcke.' : 'Passe den Filter oder deine Suche an.'}</p></div>`;
    const renderKnowledgeCard = (e, index, items) => `<article class="task">${e.deleted ? `<button class="check" data-action="restore" data-id="${e.id}" aria-label="Eintrag wiederherstellen">↶</button>` : ''}<div class="task-main"><button class="task-title" data-action="edit" data-id="${e.id}">${escape(e.title)}${e.deleted ? ' (im Papierkorb)' : ''}</button>${e.seminar ? `<div class="meta"><span class="chip">${escape(e.seminar)}</span></div>` : ''}<p class="knowledge-body">${SevaText.linkify(e.notes)}</p>${e.category === 'rapla' && !e.deleted ? `<div class="today-actions"><span class="chip">${e.raplaDay ? `${index + 1}. Tagespriorität` : `${index + 1}. Punkt`}</span><button data-action="rapla-up" data-id="${e.id}" aria-label="${escape(e.title)} nach oben" ${index === 0 ? 'disabled' : ''}>↑ Nach oben</button><button data-action="rapla-down" data-id="${e.id}" aria-label="${escape(e.title)} nach unten" ${index === items.length - 1 ? 'disabled' : ''}>↓ Nach unten</button></div>` : ''}</div></article>`;
    const knowledge = entities.filter(e => e.kind === 'knowledge');
    $('knowledge-list').innerHTML = knowledge.filter(e => !['onboarding', 'review', 'checklist', 'rapla', 'seminar-hidden', 'ai-idea'].includes(e.category)).map(renderKnowledgeCard).join('') || '<div class="empty"><h3>Hintergrund festhalten</h3><p>Seminarinfos, Absprachen und Notizen helfen dir, Aufgaben einzuordnen. Du kannst Texte aus unserem Chat hier einfügen.</p></div>';
    $('onboarding-list').innerHTML = knowledge.filter(e => e.category === 'onboarding').map(renderKnowledgeCard).join('') || '<div class="empty"><h3>Ideen für die Übergabe sammeln</h3><p>Zum Beispiel: Welche Schritte wiederholen sich? Was braucht eine neue Karma Yogini als Anleitung, Zugang oder Checkliste?</p></div>';
    $('review-list').innerHTML = knowledge.filter(e => e.category === 'review').map(renderKnowledgeCard).join('') || '<div class="empty"><h3>Was darf künftig besser werden?</h3><p>Halte Erfahrungen und konkrete Verbesserungsideen fest. Über „+ Punkt“ kannst du sie aufschreiben oder als Notiz einsprechen.</p></div>';
    const rapla = knowledge.filter(e => e.category === 'rapla');
    const previousDays = new Map([...$('rapla-list').querySelectorAll('[data-workflow-day]')].map(el => [el.dataset.workflowDay, el.open]));
    $('rapla-list').innerHTML = [...weekdays, ['', 'Noch keinem Tag zugeordnet']].map(([day, label]) => {
      const items = M.raplaItems(entities, day), today = day === currentWeekday();
      const opened = previousDays.has(day) ? previousDays.get(day) : today || (!day && items.length > 0);
      return `<details class="workflow-day" data-workflow-day="${day}" ${opened ? 'open' : ''}><summary><span>${label}${today ? ' · Heute' : ''}</span><span class="workflow-count">${items.length} ${items.length === 1 ? 'Punkt' : 'Punkte'}</span></summary><div class="workflow-day-body"><button type="button" data-add-rapla-day="${day}">+ Punkt ${day ? 'für ' + label : 'hinzufügen'}</button>${items.map(renderKnowledgeCard).join('') || '<p class="hint">Noch keine Punkte. Lege hier deinen Ablauf und deine Prioritäten fest.</p>'}</div></details>`;
    }).join('');
    const removedRapla = rapla.filter(e => e.deleted);
    $('rapla-trash').hidden = !removedRapla.length;
    $('rapla-trash-count').textContent = `(${removedRapla.length})`;
    $('rapla-trash-list').innerHTML = removedRapla.map(renderKnowledgeCard).join('');
    $('seminars').innerHTML = [...new Set(entities.filter(e => !e.deleted && e.category !== 'seminar-hidden').map(e => e.seminar).filter(Boolean))].map(s => `<option value="${escape(s)}"></option>`).join('');
  }
  function renderChecklist() {
    const items = M.checklistItems(entities);
    $('checklist-count').textContent = `${items.filter(e => e.status === 'done').length} von ${items.length} erledigt`;
    $('checklist-list').innerHTML = items.map((e, i) => `<article class="task ${e.status === 'done' ? 'done' : ''}">
      <button class="check ${e.status === 'done' ? 'done' : ''}" data-action="check" data-id="${e.id}" aria-pressed="${e.status === 'done'}" aria-label="${escape(e.title)} abhaken oder wieder öffnen">${e.status === 'done' ? '✓' : ''}</button>
      <div class="task-main"><button class="task-title" data-action="edit" data-id="${e.id}">${i + 1}. ${escape(e.title)}</button>${e.notes ? `<p class="knowledge-body">${escape(e.notes)}</p>` : ''}
      <div class="today-actions"><button data-action="checklist-up" data-id="${e.id}" aria-label="${escape(e.title)} nach oben" ${i === 0 ? 'disabled' : ''}>↑</button><button data-action="checklist-down" data-id="${e.id}" aria-label="${escape(e.title)} nach unten" ${i === items.length - 1 ? 'disabled' : ''}>↓</button><button data-action="checklist-remove" data-id="${e.id}">Entfernen</button></div></div></article>`).join('') || '<p class="checklist-empty">Welche Schritte möchtest du im Blick behalten? Füge deinen ersten Punkt hinzu.</p>';
    const removed = entities.filter(e => e.kind === 'knowledge' && e.category === 'checklist' && e.deleted);
    $('checklist-trash').hidden = !removed.length;
    $('checklist-trash-count').textContent = `(${removed.length})`;
    $('checklist-trash-list').innerHTML = removed.map(e => `<div class="checklist-removed"><span>${escape(e.title)}</span><button data-action="restore" data-id="${e.id}" aria-label="${escape(e.title)} wiederherstellen">Wiederherstellen</button></div>`).join('');
  }
  $('checklist-form').addEventListener('submit', safe(event => {
    event.preventDefault();
    const title = $('checklist-title').value.trim();
    if (!title) return;
    const items = M.checklistItems(store.entities());
    const rank = items.reduce((max, e) => Math.max(max, e.checklistRank ?? -1), -1) + 1;
    save('knowledge', crypto.randomUUID(), { title, category: 'checklist', status: 'open', checklistRank: rank });
    $('checklist-title').value = ''; $('checklist-title').focus();
    $('checklist-feedback').textContent = 'Checklistenpunkt hinzugefügt.';
  }));
  function taskCard(t, tasks, focused, now) {
      const p = M.priority(t, tasks), related = M.related(t, entities), automatic = M.autoToday(t, now);
      const manual = M.todayTasks(entities, now), manualIndex = manual.findIndex(item => item.id === t.id);
      const deadline = M.deadlineAt(t), remaining = deadline ? deadline - now : null;
      const remainingText = remaining === null || !automatic ? '' : remaining < 0 ? 'Frist überschritten' : remaining < 3600000 ? 'Weniger als 1 Stunde' : `Noch ${Math.ceil(remaining / 3600000)} Stunden`;
      return `<article data-task-id="${t.id}" draggable="${!t.deleted && t.status !== 'done' && M.isVisible(t, now)}" class="task ${t.status === 'done' ? 'done' : ''} ${automatic ? 'deadline-task' : ''}">
        ${t.deleted ? `<button class="check" data-action="restore" data-id="${t.id}" aria-label="${escape(t.title)} wiederherstellen">↶</button>` : `<button class="check ${t.status === 'done' ? 'done' : ''}" data-action="check" data-id="${t.id}" aria-label="${escape(t.title)} ${t.status === 'done' ? 'wieder öffnen' : 'erledigen'}" aria-pressed="${t.status === 'done'}">${t.status === 'done' ? '✓' : ''}</button>`}
        <div class="task-main">${focused ? `<span class="chip">${manualIndex + 1}. Priorität</span>` : ''}<button class="task-title" data-action="edit" data-id="${t.id}">${escape(t.title)}</button>
        <div class="meta">${t.visibleFrom || t.visibleUntil ? `<span class="chip">${M.isVisible(t, now) ? 'Sichtbar' : 'Ausgeblendet · sichtbar'}${t.visibleFrom ? ` ab ${formatDate(t.visibleFrom)}` : ''}${t.visibleUntil ? ` bis ${formatDate(t.visibleUntil)}` : ''}</span>` : ''}${automatic ? `<span class="chip deadline-alert ${remaining < 0 ? 'overdue' : ''}">${escape(remainingText)} · automatisch in Heute</span>` : ''}<span class="chip ${p.score >= 100 ? 'urgent' : ''}">${escape(p.label)}</span><span class="chip">${M.STATUSES[t.status]}</span>${t.seminar ? `<span class="chip">${escape(t.seminar)}</span>` : ''}${t.due ? `<span class="chip deadline-date ${automatic ? 'near' : ''}">Frist: ${formatDate(t.due)}${t.dueTime ? ` · ${escape(t.dueTime)} Uhr` : ' · Tagesende'}</span>` : ''}${related.length ? `<span class="chip">${related.length} Verknüpfung${related.length === 1 ? '' : 'en'}</span>` : ''}</div>
        <p class="reason">${escape(p.reasons.join(' '))}</p>${!t.deleted && !M.isVisible(t, now) ? `<div class="today-actions"><button data-action="show-now" data-id="${t.id}">Jetzt wieder einblenden</button></div>` : ''}${!t.deleted && t.status !== 'done' && M.isVisible(t, now) ? `<div class="today-actions">${focused ? `<button data-action="today-up" data-id="${t.id}" aria-label="${escape(t.title)} nach oben" ${manualIndex === 0 ? 'disabled' : ''}>↑</button><button data-action="today-down" data-id="${t.id}" aria-label="${escape(t.title)} nach unten" ${manualIndex === manual.length - 1 ? 'disabled' : ''}>↓</button>${automatic ? '<span class="hint">Wegen der Frist in Heute.</span>' : `<button data-action="today-remove" data-id="${t.id}">Aus Heute nehmen</button>`}` : `<button data-action="today-add" data-id="${t.id}">Für heute ↑</button>`}<span class="hint drag-handle" draggable="false" aria-hidden="true">⠿ Ziehen</span></div>` : ''}</div></article>`;

  }
  function formatDate(value) { return new Date(value + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function openEditor(id, kind = 'task', category = '', raplaDay = currentWeekday()) {
    window.SevaDictation?.cancel();
    const entity = entities.find(e => e.id === id) || { id: crypto.randomUUID(), kind, title: '', seminar: '', status: 'open', importance: 1, due: '', dueTime: '', followUp: '', notes: '', dependsOn: [], deleted: false, category, raplaDay };
    editing = entity; original = JSON.parse(JSON.stringify(entity));
    for (const field of ['title', 'seminar', 'status', 'importance', 'due', 'dueTime', 'followUp', 'visibleFrom', 'visibleUntil', 'notes']) $('edit-' + field).value = entity[field] ?? '';
    $('edit-dueTime').disabled = !entity.due;
    $('editor-heading').textContent = entity.category === 'ai-idea' ? 'KI-Projekt oder Idee festhalten' : entity.category === 'rapla' ? 'Rapla 2.0 · Punkt bearbeiten' : entity.category === 'review' ? 'Nachbereitung festhalten' : entity.category === 'checklist' ? 'Checklistenpunkt bearbeiten' : entity.kind === 'knowledge' ? 'Wissen festhalten' : 'Aufgabe bearbeiten';
    $('task-fields').hidden = entity.kind === 'knowledge';
    $('rapla-fields').hidden = entity.category !== 'rapla';
    $('edit-raplaDay').value = entity.raplaDay || '';
    const dependencies = entities.filter(t => t.kind === 'task' && t.id !== entity.id && (!t.deleted || entity.dependsOn.includes(t.id)));
    $('edit-dependency').innerHTML = '<option value="">Keine Voraussetzung</option>' + dependencies.map(t => `<option value="${t.id}">${escape(t.title)}${t.deleted ? ' (im Papierkorb)' : ''}</option>`).join('');
    // A deleted/missing predecessor remains explicit, never silently dropped on save.
    for (const dep of entity.dependsOn) if (!dependencies.some(t => t.id === dep)) $('edit-dependency').insertAdjacentHTML('beforeend', `<option value="${dep}">Voraussetzung nicht verfügbar</option>`);
    $('edit-dependency').value = entity.dependsOn[0] || '';
    $('delete').hidden = !entities.some(e => e.id === id);
    $('delete').textContent = entity.deleted ? 'Wiederherstellen' : 'In den Papierkorb';
    $('edit-error').textContent = '';
    showConnections(entity);
    $('editor').showModal(); $('edit-title').focus();
  }
  function showConnections(entity) {
    const related = M.related(entity, entities);
    const reasons = entity.kind === 'task' ? M.priority(entity, entities.filter(e => e.kind === 'task')).reasons.join(' ') : '';
    $('connections').textContent = [reasons, ...related.map(e => `${e.kind === 'knowledge' ? 'Wissen' : 'Aufgabe'} · ${e.title}${e.kind === 'knowledge' ? '\n' + e.notes : ''}`)].filter(Boolean).join('\n\n');
  }
  $('quick-form').addEventListener('submit', safe(event => {
    event.preventDefault(); const title = $('quick-title').value.trim();
    if (!title) return;
    const duplicate = entities.find(e => e.kind === 'task' && !e.deleted && e.status !== 'done' && e.title.toLocaleLowerCase('de') === title.toLocaleLowerCase('de'));
    if (duplicate) { notify('Diese offene Aufgabe gibt es schon. Du kannst sie ergänzen.'); openEditor(duplicate.id); return; }
    save('task', crypto.randomUUID(), { title, status: 'open', importance: 1 });
    $('quick-title').value = ''; $('filter').value = 'active'; $('search').value = ''; render();
    notify('Aufgabe erfasst. Über ihren Titel kannst du Frist und Details ergänzen.'); $('quick-title').focus();
  }));
  $('edit-form').addEventListener('submit', event => {
    event.preventDefault();
    if ($('edit-notes').readOnly) return;
    try {
      const values = {};
      for (const field of ['title', 'seminar', 'notes']) values[field] = $('edit-' + field).value.trim();
      if (editing.kind === 'knowledge') values.category = editing.category || '';
      if (editing.category === 'rapla') {
        values.raplaDay = $('edit-raplaDay').value;
        if (!entities.some(e => e.id === editing.id) || values.raplaDay !== (original.raplaDay || '')) {
          const destination = M.raplaItems(entities, values.raplaDay).filter(e => e.id !== editing.id);
          values.raplaRank = Math.max(-1, ...destination.map(e => e.raplaRank ?? -1)) + 1;
        }
      }
      if (!values.title) throw Error('Bitte einen Titel eingeben.');
      if (editing.kind === 'task') {
        for (const field of ['status', 'due', 'followUp', 'visibleFrom', 'visibleUntil']) values[field] = $('edit-' + field).value;
        if (values.visibleFrom && values.visibleUntil && values.visibleUntil < values.visibleFrom) throw Error('Sichtbar bis darf nicht vor Sichtbar ab liegen.');
        values.dueTime = values.due ? $('edit-dueTime').value : '';
        values.importance = Number($('edit-importance').value);
        const selected = $('edit-dependency').value;
        values.dependsOn = selected === (original.dependsOn[0] || '') ? original.dependsOn : selected ? [selected] : [];
        if (M.hasCycle(entities.filter(e => e.kind === 'task'), editing.id, values.dependsOn)) throw Error('Diese Abhängigkeit würde einen Kreis bilden. Bitte eine andere Voraussetzung wählen.');
      }
      // Only changed fields are written; edits arriving while the form is open survive.
      const patch = {};
      for (const [key, value] of Object.entries(values)) if (JSON.stringify(value) !== JSON.stringify(original[key])) patch[key] = value;
      if (editing.kind === 'knowledge' && !entities.some(e => e.id === editing.id)) {
        patch.category = editing.category || '';
        if (editing.category === 'rapla') patch.raplaDay = values.raplaDay;
      }
      if (Object.keys(patch).length) save(editing.kind, editing.id, patch);
      $('editor').close(); notify(editing.category === 'rapla' ? 'Rapla-Workflow gespeichert.' : editing.category === 'review' ? 'Nachbereitung gespeichert.' : editing.category === 'checklist' ? 'Checklistenpunkt gespeichert.' : 'Gespeichert. Die Prioritäten wurden neu bewertet.');
    } catch (error) { $('edit-error').textContent = error.message; }
  });
  $('edit-seminar').addEventListener('input', () => showConnections({ ...editing, seminar: $('edit-seminar').value }));
  $('edit-due').addEventListener('input', () => { $('edit-dueTime').disabled = !$('edit-due').value; if ($('edit-dueTime').disabled) $('edit-dueTime').value = ''; });
  $('cancel-edit').onclick = () => $('editor').close();
  $('delete').onclick = safe(() => {
    save(editing.kind, editing.id, { deleted: !editing.deleted });
    $('editor').close(); notify(editing.deleted ? 'Eintrag wiederhergestellt.' : 'Eintrag im Papierkorb. Er kann wiederhergestellt werden.');
  });
  document.addEventListener('click', safe(event => {
    const addDay = event.target.closest('[data-add-rapla-day]');
    if (addDay) { openEditor(null, 'knowledge', 'rapla', addDay.dataset.addRaplaDay); return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const task = entities.find(t => t.id === button.dataset.id); if (!task) return;
    if (button.dataset.action === 'show-now') { save('task', task.id, { visibleFrom: '', visibleUntil: '' }); notify('Aufgabe wieder eingeblendet.'); return; }
    if (button.dataset.action === 'checklist-remove') {
      save(task.kind, task.id, { deleted: true });
      $('checklist-feedback').textContent = 'Punkt entfernt. Unter „Entfernte Punkte“ kannst du ihn wiederherstellen.';
      $('checklist-title').focus(); return;
    }
    if (['rapla-up', 'rapla-down'].includes(button.dataset.action)) {
      if (cloud.teamId && !cloud.authorized) return;
      const current = store.entities(), index = M.raplaItems(current, task.raplaDay || '').findIndex(e => e.id === task.id);
      for (const patch of M.raplaPatches(current, task.id, index + (button.dataset.action === 'rapla-up' ? -1 : 1))) store.change('knowledge', patch.id, { raplaRank: patch.raplaRank });
      render(); cloud.sync();
      const target = $('rapla-list').querySelector(`[data-id="${task.id}"][data-action="${button.dataset.action}"]`);
      (target?.disabled ? $('rapla-list').querySelector(`[data-id="${task.id}"][data-action="edit"]`) : target)?.focus();
      notify('Reihenfolge gespeichert.'); return;
    }
    if (['checklist-up', 'checklist-down'].includes(button.dataset.action)) {
      if (cloud.teamId && !cloud.authorized) return;
      const current = store.entities(), index = M.checklistItems(current).findIndex(e => e.id === task.id);
      for (const patch of M.checklistPatches(current, task.id, index + (button.dataset.action === 'checklist-up' ? -1 : 1))) store.change('knowledge', patch.id, { checklistRank: patch.checklistRank });
      render(); cloud.sync();
      const target = $('checklist-list').querySelector(`[data-id="${task.id}"][data-action="${button.dataset.action}"]`);
      (target?.disabled ? $('checklist-list').querySelector(`[data-id="${task.id}"][data-action="edit"]`) : target)?.focus();
      $('checklist-feedback').textContent = 'Reihenfolge gespeichert.'; return;
    }
    if (button.dataset.action === 'today-add') { moveToday(task.id, M.todayTasks(entities).length); return; }
    if (button.dataset.action === 'today-remove') { if (M.autoToday(task)) return; save('task', task.id, { todayRank: null }); $('today-feedback').textContent = 'Aufgabe aus Heute genommen.'; return; }
    if (['today-up', 'today-down'].includes(button.dataset.action)) {
      const index = M.todayTasks(entities).findIndex(t => t.id === task.id);
      moveToday(task.id, index + (button.dataset.action === 'today-up' ? -1 : 1), button.dataset.action); return;
    }
    if (button.dataset.action === 'edit') openEditor(task.id);
    else if (button.dataset.action === 'check') save(task.kind, task.id, { status: task.status === 'done' ? 'open' : 'done' });
    else if (button.dataset.action === 'restore') save(task.kind, task.id, { deleted: false });
  }));
  function moveToday(id, index, focusAction = 'today-remove') {
    for (const patch of M.todayPatches(store.entities(), id, index)) store.change('task', patch.id, { todayRank: patch.todayRank });
    render(); cloud.sync();
    $('today-feedback').textContent = 'Heute-Auswahl gespeichert.';
    const target = $('today-list').querySelector(`[data-id="${id}"][data-action="${focusAction}"]`);
    (target?.disabled ? $('today-list').querySelector(`[data-id="${id}"][data-action="${focusAction === 'today-up' ? 'today-down' : 'today-up'}"]`) : target)?.focus();
  }
  // One pointer-based drag path for mouse, pen and the touch handle.
  // The fixed drop target stays reachable even when Heute is above the viewport.
  const dock = document.createElement('div');
  dock.id = 'today-drag-dock'; dock.hidden = true;
  dock.textContent = '↓ Hier loslassen · Für heute'; document.body.appendChild(dock);
  const ghost = document.createElement('div'); ghost.className = 'task-drag-ghost'; ghost.hidden = true; ghost.setAttribute('aria-hidden','true'); document.body.appendChild(ghost);
  let pointerDrag = null, scrollFrame = null, suppressClick = false;
  function clearDrag() {
    draggedTask = null; dock.hidden = true; ghost.hidden = true;
    document.body.classList.remove('task-dragging');
    $('today-section').classList.remove('drag-ready');
    document.querySelectorAll('.drop-before,.drop-after,.drop-active,.drag-source').forEach(el => el.classList.remove('drop-before','drop-after','drop-active','drag-source'));
  }
  function pointerCleanup() {
    pointerDrag = null; cancelAnimationFrame(scrollFrame); scrollFrame = null; clearDrag();
  }
  document.addEventListener('dragstart', event => { if (event.target.closest('[data-task-id]')) event.preventDefault(); });
  document.addEventListener('click', event => {
    if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
  }, true);
  document.addEventListener('pointerdown', event => {
    const card = event.target.closest('[data-task-id][draggable="true"]');
    if (!card || event.button !== 0 || event.isPrimary === false) return;
    const handle = event.target.closest('.drag-handle');
    if (event.pointerType === 'touch' && !handle) return;
    if (event.target.closest('input,select,textarea,a,button:not(.task-title)')) return;
    if (handle) event.preventDefault();
    pointerDrag = { id: card.dataset.taskId, card, x: event.clientX, y: event.clientY, startX:event.clientX, startY:event.clientY, pointerId:event.pointerId, active:false };
    // Capture on the original target so an ordinary title click still opens editing.
    event.target.setPointerCapture(event.pointerId);
  });
  function pointerTarget(x,y) {
    const target = document.elementFromPoint(x,y);
    return {zone:target?.closest('#today-section, #task-list, #today-drag-dock'),card:target?.closest('[data-task-id]')};
  }
  function highlightDrop() {
    if (!pointerDrag?.active) return;
    document.querySelectorAll('.drop-before,.drop-after,.drop-active').forEach(el=>el.classList.remove('drop-before','drop-after','drop-active'));
    const {zone,card} = pointerTarget(pointerDrag.x,pointerDrag.y);
    zone?.classList.add('drop-active');
    if (zone?.id === 'today-section' && card && card.dataset.taskId !== draggedTask) card.classList.add(pointerDrag.y < card.getBoundingClientRect().top + card.getBoundingClientRect().height/2 ? 'drop-before' : 'drop-after');
  }
  document.addEventListener('pointermove', event => {
    if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
    pointerDrag.x = event.clientX; pointerDrag.y = event.clientY;
    if (!pointerDrag.active && Math.hypot(event.clientX-pointerDrag.startX,event.clientY-pointerDrag.startY)<6) return;
    event.preventDefault();
    if (!pointerDrag.active) {
      pointerDrag.active = true; draggedTask = pointerDrag.id;
      pointerDrag.card.classList.add('drag-source'); document.body.classList.add('task-dragging');
      $('today-section').classList.add('drag-ready'); dock.hidden = false; ghost.hidden = false;
      ghost.textContent = pointerDrag.card.querySelector('.task-title').textContent;
    }
    ghost.style.left = Math.max(8,Math.min(event.clientX+14,window.innerWidth-230))+'px';
    ghost.style.top = Math.max(8,Math.min(event.clientY+18,window.innerHeight-60))+'px';
    highlightDrop();
    if (!scrollFrame) {
      const tick = () => {
        if (!pointerDrag?.active) return;
        if (pointerDrag.y < 80) window.scrollBy(0,-12);
        else if (pointerDrag.y > window.innerHeight-80) window.scrollBy(0,12);
        highlightDrop(); scrollFrame = requestAnimationFrame(tick);
      }; scrollFrame = requestAnimationFrame(tick);
    }
  }, {passive:false});
  document.addEventListener('pointerup', safe(event => {
    if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
    const {id,active} = pointerDrag;
    const {zone,card} = pointerTarget(event.clientX,event.clientY);
    const after = card && event.clientY >= card.getBoundingClientRect().top+card.getBoundingClientRect().height/2;
    pointerCleanup();
    if (!active) return;
    suppressClick = true; setTimeout(()=>{suppressClick=false;},0);
    if (!zone || card?.dataset.taskId === id) { render(); return; }
    if (zone.id === 'task-list') {
      if (M.autoToday(store.entities().find(t => t.id === id))) { render(); notify('Diese Aufgabe bleibt wegen ihrer Frist in Heute. Du kannst sie dort umsortieren.'); return; }
      save('task',id,{todayRank:null}); return;
    }
    const list = M.todayTasks(store.entities()).filter(t=>t.id!==id);
    const index = list.findIndex(t=>t.id===card?.dataset.taskId);
    moveToday(id,index<0?list.length:index+(after?1:0));
  }));
  document.addEventListener('pointercancel',pointerCleanup);
  window.addEventListener('blur',pointerCleanup);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pointerCleanup(); else render();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')pointerCleanup();});
  $('add-knowledge').onclick = () => openEditor(null, 'knowledge');
  $('add-idea').onclick = () => openEditor(null, 'knowledge', 'ai-idea');
  $('add-rapla').onclick = () => openEditor(null, 'knowledge', 'rapla');
  $('add-review').onclick = () => openEditor(null, 'knowledge', 'review');
  $('add-onboarding').onclick = () => openEditor(null, 'knowledge', 'onboarding');
  document.querySelector('.workspace-tabs').addEventListener('click', pointerCleanup);
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => {
    view = button.dataset.view;
    $('tasks-view').hidden = view !== 'tasks'; $('knowledge-view').hidden = view !== 'knowledge'; $('onboarding-view').hidden = view !== 'onboarding'; $('review-view').hidden = view !== 'review';
    document.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('selected', b.dataset.view === view); b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
  });
  $('search').oninput = render; $('filter').onchange = render;
  $('settings-toggle').onclick = () => { $('settings').hidden = !$('settings').hidden; $('settings-toggle').setAttribute('aria-expanded', String(!$('settings').hidden)); };
  $('open-login').onclick = () => { $('settings').hidden = false; $('settings-toggle').setAttribute('aria-expanded', 'true'); $('email').focus(); };
  $('sync').onclick = () => { if (!cloud.user) $('open-login').click(); else cloud.resume(); };
  $('login-form').onsubmit = safe(async event => {
    event.preventDefault();
    const button = event.submitter; button.disabled = true;
    try { await cloud.login($('email').value.trim()); $('auth-message').textContent = 'Bitte öffne den Anmeldelink aus deiner E-Mail auf diesem Gerät. Auf anderen Geräten dieselbe E-Mail-Adresse verwenden.'; }
    finally { button.disabled = false; }
  });
  $('logout').onclick = safe(() => cloud.logout());
  $('copy-team-link').onclick = safe(async () => {
    await navigator.clipboard.writeText($('team-link').value);
    notify('Link zur gemeinsamen Liste kopiert. Freigabe der E-Mail-Adresse ist zusätzlich nötig.');
  });
  $('team-invite-form').onsubmit = safe(async event => {
    event.preventDefault();
    await cloud.invite($('team-email').value);
    $('team-email').value = '';
    await refreshMembers(); notify('E-Mail-Adresse freigegeben. Du kannst jetzt den Teamlink weitergeben.');
  });
  $('team-members').onclick = safe(async event => {
    const button = event.target.closest('[data-team-email]'); if (!button) return;
    if (!confirm(`${button.dataset.teamEmail} aus der Teamliste entfernen?`)) return;
    await cloud.revoke(button.dataset.teamEmail); await refreshMembers(); notify('Teamzugang entfernt.');
  });
  $('adopt').onclick = safe(() => {
    if (!cloud.user) return;
    const local = new SevaStore(store.storage); local.scope = 'local'; const ops = local.operations();
    if (!ops.length) { notify('Keine lokalen Aufgaben zum Übernehmen vorhanden.'); return; }
    if (!confirm(`${ops.length} lokale Änderungen (Aufgaben und Wissen) in das Konto ${cloud.user.email} übernehmen und synchronisieren?`)) return;
    for (const op of ops) store.put(op);
    render(); cloud.sync(); notify('Lokaler Bestand übernommen. Das lokale Original bleibt erhalten.');
  });
  $('export').onclick = safe(() => {
    const blob = new Blob([JSON.stringify({ format: 'zeitflow-seva', version: 1, operations: store.operations() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `seva-k-${M.day()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('import').onchange = safe(async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw Error('Diese Sicherung ist zu groß (maximal 10 MB).');
      const backup = JSON.parse(await file.text());
      if (backup.format !== 'zeitflow-seva' || backup.version !== 1 || !Array.isArray(backup.operations)) throw Error('Bitte eine SEVA-K Sicherung auswählen.');
      backup.operations.forEach(M.validate);
      if (!confirm(`${backup.operations.length} Änderungen in den aktuellen SEVA-K Bestand übernehmen?${cloud.user ? ' Sie werden auch mit deinem Konto synchronisiert.' : ''}`)) return;
      backup.operations.forEach(op => store.put(op)); render(); cloud.sync(); notify('Sicherung zusammengeführt.');
    } finally { event.target.value = ''; }
  });
  window.addEventListener('storage', event => { if (event.key?.startsWith(store.key())) { render(); cloud.sync(); } });
  setInterval(() => { if (!document.hidden) render(); }, 60000);
  const embedded = new URLSearchParams(location.search).get('embedded') === '1' && window.parent !== window;
  $('close').hidden = !embedded;
  $('close').onclick = () => parent.postMessage({ type: 'seva-close' }, location.origin);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('editor').open && embedded) $('close').click(); });
  if (cloud.teamId) accountChanged(null);
  window.SevaSeminars?.connect((seminar, hide) => {
    save('knowledge', window.SevaSeminars.visibilityId(seminar.id), {
      category: 'seminar-hidden', seminar: seminar.id, title: seminar.title, deleted: !hide
    });
  });
  render(); safe(() => cloud.init())();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/seva/sw.js', { scope: '/seva/' }).catch(() => notify('Offline-Installation noch nicht möglich. Online kannst du weiterarbeiten.', true));
})();
