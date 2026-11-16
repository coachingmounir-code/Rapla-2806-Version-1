// Navigation stays available independently of the task/cloud initialization.
(function () {
  'use strict';
  const workspaceTabs = [...document.querySelectorAll('[data-workspace]')];
  function selectWorkspace(button) {
    workspaceTabs.forEach(tab => {
      const selected = tab === button;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  workspaceTabs.forEach((button, index) => {
    button.onclick = () => selectWorkspace(button);
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % workspaceTabs.length;
      else if (event.key === 'ArrowLeft') next = (index + workspaceTabs.length - 1) % workspaceTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = workspaceTabs.length - 1;
      else return;
      event.preventDefault();
      selectWorkspace(workspaceTabs[next]);
      workspaceTabs[next].focus();
    });
  });
})();
