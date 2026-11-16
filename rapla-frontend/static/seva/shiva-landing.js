// Keep navigation independent of cloud initialization and preserve existing panels/data.
(function () {
  'use strict';
  const landing = document.getElementById('shiva-landing');
  const tabs = [...document.querySelectorAll('[data-workspace]')];
  const links = [...document.querySelectorAll('[data-orbit]')];
  const toggle = document.getElementById('orbit-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, hovered = false, angle = 0, previous = 0;
  const routes = { '#tagesseva': 'daily', '#ki-projekte': 'rapla' };
  function navigate(focus = false) {
    const selected = routes[location.hash];
    landing.hidden = !!selected;
    document.body.dataset.workspace = selected || 'landing';
    document.getElementById('workspace-title').textContent = selected === 'rapla' ? 'KI-Projekte' : 'Tagesseva';
    document.body.classList.toggle('landing-active', !selected);
    tabs.forEach((tab, index) => {
      const active = tab.dataset.workspace === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active || (!selected && index === 0) ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    document.title = selected === 'daily' ? 'Tagesseva · ZeitFlow' : selected === 'rapla' ? 'KI-Projekte · ZeitFlow' : 'Digital Shiva · ZeitFlow';
    if (focus) {
      (selected ? tabs.find(t => t.dataset.workspace === selected) : links[0]).focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }
  function open(tab) { location.hash = tab.dataset.workspace === 'daily' ? 'tagesseva' : 'ki-projekte'; }
  tabs.forEach((tab, i) => {
    tab.onclick = () => open(tab);
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault(); open(tabs[next]); tabs[next].focus();
    });
  });
  window.addEventListener('hashchange', () => navigate(true));
  links.forEach(link => {
    link.addEventListener('pointerenter', () => { hovered = true; });
    link.addEventListener('pointerleave', () => { hovered = false; });
    link.addEventListener('pointerdown', () => { hovered = true; });
  });
  function updateToggle() {
    toggle.textContent = paused ? 'Animation fortsetzen' : 'Animation pausieren';
    toggle.setAttribute('aria-pressed', String(paused));
  }
  toggle.onclick = () => { paused = !paused; updateToggle(); };
  reduced.addEventListener('change', () => { paused = reduced.matches; updateToggle(); });
  function position() {
    const radius = landing.clientWidth <= 700 ? 250 : 300;
    document.querySelectorAll('.shiva-orbit ellipse').forEach(ellipse => ellipse.setAttribute('rx', radius));
    links.forEach((link, i) => {
      const theta = angle + i * Math.PI;
      const radius = landing.clientWidth <= 700 ? 250 : 300;
      const x = 500 + radius * Math.cos(theta);
      const y = 420 + 125 * Math.sin(theta) - .25 * (x - 500);
      link.style.left = `${x / 10}%`;
      link.style.top = `${y / 7}%`;
    });
  }
  function animate(now) {
    const delta = previous ? Math.min(now - previous, 64) : 0;
    previous = now;
    if (!landing.hidden && !document.hidden && !paused && !hovered && !links.includes(document.activeElement)) {
      angle = (angle + delta * Math.PI * 2 / 48000) % (Math.PI * 2);
      position();
    }
    requestAnimationFrame(animate);
  }
  window.addEventListener('resize', position);
  position(); updateToggle(); navigate(); requestAnimationFrame(animate);
})();
