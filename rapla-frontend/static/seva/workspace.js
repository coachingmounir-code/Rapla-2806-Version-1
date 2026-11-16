/* Presentation shortcuts reuse the existing task, account and backup controls. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  function collapseSections() {
    $('workspace-menu').open = false;
    $('checklist-section').open = false;
  }
  collapseSections();
  window.addEventListener('hashchange', collapseSections);
  window.addEventListener('pageshow', collapseSections);
  document.querySelectorAll('[data-proxy]').forEach(button => {
    button.addEventListener('click', () => $(button.dataset.proxy).click());
  });
  document.querySelectorAll('[data-task-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelector('[data-view="tasks"]').click();
      $('filter').value = button.dataset.taskFilter;
      $('filter').dispatchEvent(new Event('change'));
      $('tasks-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  $('nav-today').addEventListener('click', () => $('today-section').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.querySelector('[data-view="tasks"]').addEventListener('click', () => {
    $('filter').value = 'active';
    $('filter').dispatchEvent(new Event('change'));
  });
})();
