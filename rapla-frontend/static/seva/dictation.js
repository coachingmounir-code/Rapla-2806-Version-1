/* Browser dictation: audio is handled by the browser's speech service. */
(function () {
  'use strict';
  const notes = document.getElementById('edit-notes');
  const button = document.getElementById('dictate-notes');
  const status = document.getElementById('dictation-status');
  const preview = document.getElementById('dictation-preview');
  const editor = document.getElementById('editor');
  const submit = document.querySelector('#edit-form button[type="submit"]');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let session = null, timer = null;
  const fallback = 'Nutze alternativ das Mikrofon deiner Bildschirmtastatur oder die Diktierfunktion deines Geräts.';
  function idle(message = '') {
    clearTimeout(timer); timer = null;
    notes.readOnly = false; submit.disabled = false; button.disabled = false;
    button.textContent = '🎙 Notiz einsprechen'; button.setAttribute('aria-pressed', 'false');
    preview.textContent = ''; status.textContent = message;
  }
  function cancel() {
    const previous = session; session = null;
    if (previous) { try { previous.abort(); } catch (_) {} }
    idle();
  }
  window.SevaDictation = { cancel };
  button.addEventListener('click', () => {
    if (!Recognition || !window.isSecureContext) {
      status.textContent = 'Direktes Einsprechen ist in diesem Browser nicht verfügbar. ' + fallback;
      notes.focus(); return;
    }
    if (session) {
      button.disabled = true; status.textContent = 'Diktat wird abgeschlossen …';
      const current = session;
      try { current.stop(); } catch (_) { cancel(); return; }
      timer = setTimeout(() => {
        if (session === current) { cancel(); status.textContent = 'Diktat beendet. Bitte prüfe den eingefügten Text.'; }
      }, 5000);
      return;
    }
    let current;
    try { current = new Recognition(); } catch (_) {
      status.textContent = 'Spracherkennung konnte nicht gestartet werden. ' + fallback; return;
    }
    session = current;
    let errorMessage = '', hasText = false;
    const inserted = new Set();
    current.lang = 'de-DE'; current.continuous = true; current.interimResults = true;
    notes.readOnly = true; submit.disabled = true;
    button.textContent = '■ Diktat beenden'; button.setAttribute('aria-pressed', 'true');
    status.textContent = 'Mikrofon wird gestartet. Bitte den Mikrofonzugriff erlauben.';
    current.onstart = () => { if (session === current) status.textContent = 'Ich höre zu. Sprich deine Notiz und klicke danach auf „Diktat beenden“.'; };
    current.onresult = event => {
      if (session !== current || !editor.open) return;
      const interim = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i], text = result[0].transcript.trim();
        if (!result.isFinal) { interim.push(text); continue; }
        if (inserted.has(i)) continue;
        inserted.add(i);
        if (!text) continue;
        const next = notes.value + (notes.value && !/\s$/.test(notes.value) ? ' ' : '') + text;
        if (next.length > notes.maxLength) {
          cancel(); status.textContent = 'Die Notiz ist zu lang. Bitte kürze sie. Der letzte gesprochene Abschnitt wurde nicht eingefügt.'; return;
        }
        notes.value = next; hasText = true;
        notes.dispatchEvent(new Event('input', { bubbles: true }));
        notes.scrollTop = notes.scrollHeight;
      }
      preview.textContent = interim.join(' ');
    };
    current.onerror = event => {
      if (session !== current) return;
      const messages = {
        'not-allowed': 'Mikrofonzugriff nicht erlaubt. Bitte in den Browser-Einstellungen für diese Seite freigeben.',
        'service-not-allowed': 'Die Spracherkennung ist in diesem Browser nicht erlaubt.',
        'audio-capture': 'Kein nutzbares Mikrofon gefunden. Bitte prüfe dein Mikrofon.',
        'network': 'Die Spracherkennung konnte keine Verbindung herstellen. Bitte prüfe deine Internetverbindung.',
        'no-speech': 'Keine Sprache erkannt. Bitte erneut starten und deutlich sprechen.',
        'language-not-supported': 'Deutsche Spracherkennung ist auf diesem Gerät nicht verfügbar.'
      };
      errorMessage = (messages[event.error] || 'Das Diktat wurde unterbrochen. Bereits eingefügter Text bleibt erhalten.') + ' ' + fallback;
      cancel(); status.textContent = errorMessage;
    };
    current.onend = () => {
      if (session !== current) return;
      session = null;
      idle(errorMessage || (hasText ? 'Diktat beendet. Du kannst den Text korrigieren und speichern.' : 'Kein Text übernommen. Du kannst das Diktat erneut starten.'));
    };
    try { current.start(); } catch (_) {
      cancel(); status.textContent = 'Spracherkennung konnte nicht gestartet werden. ' + fallback;
    }
  });
  editor.addEventListener('close', cancel);
  editor.addEventListener('cancel', cancel);
  document.getElementById('cancel-edit').addEventListener('click', cancel);
  document.getElementById('delete').addEventListener('click', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
  window.addEventListener('pagehide', cancel);
  window.addEventListener('message', event => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === 'seva-hidden') cancel();
  });
  if (!Recognition) status.textContent = 'Direktes Einsprechen ist in diesem Browser nicht verfügbar. ' + fallback;
})();
