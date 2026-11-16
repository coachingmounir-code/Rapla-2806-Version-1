/* Shared, deterministic model. No planner state or browser dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SevaModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STATUSES = { open: 'Offen', doing: 'In Arbeit', waiting: 'Wartet auf Rückmeldung', done: 'Erledigt' };
  const FIELDS = ['title', 'status', 'seminar', 'due', 'dueTime', 'followUp', 'visibleFrom', 'visibleUntil', 'importance', 'notes', 'dependsOn', 'deleted', 'todayRank', 'category', 'checklistRank', 'raplaRank', 'raplaDay'];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function day(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function dateValid(value) {
    if (value === '') return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T12:00:00');
    return !Number.isNaN(d.getTime()) && day(d) === value;
  }
  function timeValid(value) { return value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
  function deadlineAt(task) {
    if (!task.due || !dateValid(task.due) || !timeValid(task.dueTime || '')) return null;
    const [year, month, date] = task.due.split('-').map(Number);
    const [hour, minute] = (task.dueTime || '23:59').split(':').map(Number);
    // A date without a time remains valid until the end of that local day.
    return new Date(year, month - 1, date, hour, minute, task.dueTime ? 0 : 59, task.dueTime ? 0 : 999);
  }
  function isVisible(task, now = new Date()) {
    const today = day(now);
    return (!task.visibleFrom || task.visibleFrom <= today) && (!task.visibleUntil || task.visibleUntil >= today);
  }
  function autoToday(task, now = new Date()) {
    const deadline = deadlineAt(task);
    return task.kind === 'task' && !task.deleted && isVisible(task, now) && task.status !== 'done' && deadline !== null && deadline - now < 48 * 60 * 60 * 1000;
  }
  function validate(op) {
    if (!op || !uuid.test(op.id) || !uuid.test(op.entityId) || !Number.isSafeInteger(op.time) || op.time < 0 || !['task', 'knowledge'].includes(op.kind)) throw Error('Ungültiger Aufgabeneintrag.');
    if (!op.patch || typeof op.patch !== 'object' || Array.isArray(op.patch)) throw Error('Ungültige Änderung.');
    for (const [key, value] of Object.entries(op.patch)) {
      if (!FIELDS.includes(key)) throw Error('Unbekanntes Feld.');
      if (['todayRank', 'checklistRank', 'raplaRank'].includes(key)) { if (value !== null && (!Number.isSafeInteger(value) || value < 0)) throw Error('Ungültige Heute-Reihenfolge.'); }
      else if (key === 'raplaDay') { if (!['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(value)) throw Error('Ungültiger Wochentag.'); }
      else if (key === 'deleted') { if (typeof value !== 'boolean') throw Error('Ungültiger Papierkorbstatus.'); }
      else if (key === 'dependsOn') { if (!Array.isArray(value) || value.length > 100 || !value.every(id => uuid.test(id))) throw Error('Ungültige Abhängigkeiten.'); }
      else if (key === 'importance') { if (![0, 1, 2].includes(value)) throw Error('Ungültige Wichtigkeit.'); }
      else if (key === 'category') { if (!['', 'onboarding', 'review', 'checklist', 'rapla', 'seminar-hidden', 'ai-idea'].includes(value)) throw Error('Ungültige Wissenskategorie.'); }
      else if (typeof value !== 'string' || value.length > (key === 'notes' ? 12000 : 300)) throw Error('Text zu lang oder ungültig.');
      if (key === 'status' && !STATUSES[value]) throw Error('Ungültiger Status.');
      if (['due', 'followUp', 'visibleFrom', 'visibleUntil'].includes(key) && !dateValid(value)) throw Error('Ungültiges Datum.');
      if (key === 'dueTime' && !timeValid(value)) throw Error('Ungültige Uhrzeit.');
    }
    return op;
  }
  function compare(a, b) { return a.time - b.time || a.id.localeCompare(b.id); }
  function materialize(operations) {
    const entities = new Map();
    const unique = new Map(operations.map(o => [validate(o).id, o]));
    for (const op of [...unique.values()].sort(compare)) {
      const key = `${op.kind}:${op.entityId}`;
      const entity = entities.get(key) || { id: op.entityId, kind: op.kind, title: '', status: 'open', seminar: '', due: '', dueTime: '', followUp: '', visibleFrom: '', visibleUntil: '', importance: 1, notes: '', dependsOn: [], deleted: false, todayRank: null, category: '', createdAt: op.time };
      Object.assign(entity, op.patch, { updatedAt: op.time });
      entities.set(key, entity);
    }
    return [...entities.values()];
  }
  function priority(task, tasks, today = day()) {
    const reasons = [];
    let score = task.importance * 20;
    if (task.status === 'done') return { score: -1000, label: 'Erledigt', reasons: ['Bereits abgeschlossen.'] };
    const blockers = task.dependsOn.map(id => tasks.find(t => t.id === id)).filter(t => !t || t.deleted || t.status !== 'done');
    const deadline = task.status === 'waiting' ? task.followUp : task.due;
    if (task.importance === 2) reasons.push('Von dir als wichtig markiert.');
    if (deadline) {
      const days = Math.round((new Date(deadline + 'T12:00:00') - new Date(today + 'T12:00:00')) / 86400000);
      if (days < 0) { score += 120; reasons.push(task.status === 'waiting' ? 'Rückfrage ist überfällig.' : 'Frist ist überschritten.'); }
      else if (days === 0) { score += 100; reasons.push(task.status === 'waiting' ? 'Heute nachfassen.' : 'Heute fällig.'); }
      else if (days <= 3) { score += 60; reasons.push(`In ${days} Tag${days === 1 ? '' : 'en'} ${task.status === 'waiting' ? 'nachfassen' : 'fällig'}.`); }
      else if (days <= 7) { score += 30; reasons.push('In den nächsten sieben Tagen fällig.'); }
    }
    const unlocks = tasks.filter(t => !t.deleted && t.status !== 'done' && t.dependsOn.includes(task.id)).length;
    if (unlocks) { score += 25; reasons.push(`Ermöglicht ${unlocks} weitere Aufgabe${unlocks === 1 ? '' : 'n'}.`); }
    if (task.status === 'doing') { score += 10; reasons.push('Bereits in Arbeit.'); }
    if (blockers.length) { score -= 250; reasons.unshift(`${blockers.length} Voraussetzung${blockers.length === 1 ? '' : 'en'} noch offen. Erst diese klären.`); }
    if (task.status === 'waiting' && (!task.followUp || task.followUp > today)) { score -= 200; reasons.unshift(task.followUp ? `Wiedervorlage am ${task.followUp}.` : 'Wartet auf Rückmeldung; Wiedervorlage fehlt.'); }
    return { score, label: blockers.length ? 'Abhängig' : score >= 100 ? 'Jetzt wichtig' : score >= 50 ? 'Als Nächstes' : task.status === 'waiting' ? 'Warten' : 'Im Blick', reasons: reasons.length ? reasons : ['Keine nahe Frist oder offene Folgeaufgabe bekannt.'] };
  }
  function hasCycle(tasks, id, dependsOn) {
    const byId = new Map(tasks.map(t => [t.id, t]));
    const visit = (current, seen) => {
      if (current === id) return true;
      if (seen.has(current)) return false;
      seen.add(current);
      return (byId.get(current)?.dependsOn || []).some(next => visit(next, seen));
    };
    return dependsOn.some(dep => visit(dep, new Set()));
  }
  function related(entity, entities) {
    const seminar = entity.seminar.trim().toLocaleLowerCase('de');
    return seminar ? entities.filter(e => !e.deleted && e.id !== entity.id && e.seminar.trim().toLocaleLowerCase('de') === seminar) : [];
  }
  function taskProgress(entities) {
    const tasks = entities.filter(t => t.kind === 'task' && !t.deleted);
    const done = tasks.filter(t => t.status === 'done').length;
    return { done, total: tasks.length, percent: tasks.length ? Math.round(done * 100 / tasks.length) : 0 };
  }
  function checklistItems(entities) {
    return entities.filter(e => e.kind === 'knowledge' && e.category === 'checklist' && !e.deleted)
      .sort((a, b) => (a.checklistRank ?? Number.MAX_SAFE_INTEGER) - (b.checklistRank ?? Number.MAX_SAFE_INTEGER) || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }
  function checklistPatches(entities, id, index) {
    const items = checklistItems(entities), item = items.find(e => e.id === id);
    if (!item) return [];
    const list = items.filter(e => e.id !== id);
    list.splice(Math.max(0, Math.min(index, list.length)), 0, item);
    return list.map((e, i) => ({ id: e.id, checklistRank: i })).filter(p => items.find(e => e.id === p.id).checklistRank !== p.checklistRank);
  }
  function raplaItems(entities, weekday) {
    return entities.filter(e => e.kind === 'knowledge' && e.category === 'rapla' && !e.deleted && (weekday === undefined || (e.raplaDay || '') === weekday))
      .sort((a, b) => (a.raplaRank ?? Number.MAX_SAFE_INTEGER) - (b.raplaRank ?? Number.MAX_SAFE_INTEGER) || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  }
  function raplaPatches(entities, id, index) {
    const target = entities.find(e => e.id === id);
    const items = raplaItems(entities, target?.raplaDay || ''), item = items.find(e => e.id === id);
    if (!item) return [];
    const list = items.filter(e => e.id !== id);
    list.splice(Math.max(0, Math.min(index, list.length)), 0, item);
    return list.map((e, i) => ({ id: e.id, raplaRank: i })).filter(p => items.find(e => e.id === p.id).raplaRank !== p.raplaRank);
  }
  function manualTodayTasks(entities, now = new Date()) {
    return entities.filter(t => t.kind === 'task' && !t.deleted && t.status !== 'done' && isVisible(t, now) && Number.isSafeInteger(t.todayRank))
      .sort((a, b) => a.todayRank - b.todayRank || a.id.localeCompare(b.id));
  }
  function todayTasks(entities, now = new Date()) {
    const automatic = entities.filter(t => autoToday(t, now) && !Number.isSafeInteger(t.todayRank))
      .sort((a, b) => deadlineAt(a) - deadlineAt(b) || a.id.localeCompare(b.id));
    const automaticIds = new Set(automatic.map(t => t.id));
    return automatic.concat(manualTodayTasks(entities, now).filter(t => !automaticIds.has(t.id)));
  }
  function todayPatches(entities, id, index, now = new Date()) {
    const task = entities.find(t => t.id === id && t.kind === 'task' && !t.deleted && t.status !== 'done' && isVisible(t, now));
    if (!task) return [];
    const list = todayTasks(entities, now).filter(t => t.id !== id);
    list.splice(Math.max(0, Math.min(index, list.length)), 0, task);
    return list.map((t, i) => ({ id: t.id, todayRank: i })).filter(p => entities.find(t => t.id === p.id).todayRank !== p.todayRank);
  }
  return { raplaItems, raplaPatches, isVisible, checklistItems, checklistPatches, todayTasks, manualTodayTasks, todayPatches, autoToday, deadlineAt, taskProgress, STATUSES, day, dateValid, timeValid, validate, compare, materialize, priority, hasCycle, related };
});
