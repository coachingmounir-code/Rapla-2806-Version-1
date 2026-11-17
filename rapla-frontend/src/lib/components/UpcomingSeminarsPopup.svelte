<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto, afterNavigate } from '$app/navigation';
  import {
    getLocalTodayIso,
    getNextStartingSeminars,
    getDaysUntilSeminarStart,
    getIsoWeekNumberForRaplaDate,
    getDeletedUpcomingSeminarIds,
    getUpcomingSeminarOverrides,
    getEffectiveNordseeSeminars,
    deleteUpcomingSeminar,
    restoreUpcomingSeminar,
    updateUpcomingSeminarItem,
    type UpcomingSeminarItem
  } from '$lib/upcomingSeminarsData';

  let isOpen = $state(true);
  let suppressNextScheduleAutoOpen = false;

  let nowTick = $state(Date.now());
  let todayIso = $derived(getLocalTodayIso(new Date(nowTick)));
  let upcomingPreviewLimit = $state<6 | 8>(6);
  let deletedUpcomingIds = $state<string[]>(getDeletedUpcomingSeminarIds());
  let upcomingOverrides = $state(getUpcomingSeminarOverrides());

  let effectiveNordseeSeminars = $derived<UpcomingSeminarItem[]>(
    getEffectiveNordseeSeminars({
      includeDeleted: false,
      deletedIds: deletedUpcomingIds,
      overrides: upcomingOverrides
    })
  );

  let deletedUpcomingSeminars = $derived<UpcomingSeminarItem[]>(
    getEffectiveNordseeSeminars({
      includeDeleted: true,
      deletedIds: deletedUpcomingIds,
      overrides: upcomingOverrides
    }).filter((s) => s.isManuallyCancelled)
  );

  let nextEightSeminars = $derived<UpcomingSeminarItem[]>(
    getNextStartingSeminars(todayIso, upcomingPreviewLimit, effectiveNordseeSeminars)
  );

  let isUpcomingEightExpanded = $state(true);
  let showDeletedUpcomingPanel = $state(false);
  let lastDeletedUpcomingSem = $state<UpcomingSeminarItem | null>(null);
  let editingUpcomingSemId = $state<string | null>(null);
  let editUpcomingZahlend = $state(0);
  let editUpcomingNichtZahlend = $state(0);
  let editUpcomingMaxTN = $state(10);
  let editUpcomingLeader = $state('');

  function refreshUpcomingSeminarsState() {
    deletedUpcomingIds = getDeletedUpcomingSeminarIds();
    upcomingOverrides = getUpcomingSeminarOverrides();
  }

  function handleDeleteUpcomingCard(sem: UpcomingSeminarItem) {
    lastDeletedUpcomingSem = sem;
    deleteUpcomingSeminar(sem.id);
    refreshUpcomingSeminarsState();
  }

  function handleRestoreUpcomingCard(semId: string) {
    restoreUpcomingSeminar(semId);
    if (lastDeletedUpcomingSem?.id === semId) {
      lastDeletedUpcomingSem = null;
    }
    refreshUpcomingSeminarsState();
  }

  function openEditUpcomingCard(sem: UpcomingSeminarItem) {
    editingUpcomingSemId = sem.id;
    editUpcomingZahlend = sem.currentTN;
    editUpcomingNichtZahlend = sem.extraStat ?? 0;
    editUpcomingMaxTN = sem.maxTN;
    editUpcomingLeader = sem.leader;
  }

  function saveEditUpcomingCard(semId: string) {
    updateUpcomingSeminarItem(semId, {
      currentTN: Math.max(0, Number(editUpcomingZahlend) || 0),
      extraStat: Math.max(0, Number(editUpcomingNichtZahlend) || 0),
      maxTN: Math.max(0, Number(editUpcomingMaxTN) || 0),
      leader: editUpcomingLeader.trim()
    });
    editingUpcomingSemId = null;
    refreshUpcomingSeminarsState();
  }

  function openPopup() {
    nowTick = Date.now();
    refreshUpcomingSeminarsState();
    isUpcomingEightExpanded = true;
    isOpen = true;
  }

  function closePopup() {
    editingUpcomingSemId = null;
    isOpen = false;
  }

  function handleJumpToWeek(seminarStartIso: string) {
    closePopup();
    if (page.url.pathname.startsWith('/schedule')) {
      window.dispatchEvent(
        new CustomEvent('rapla-jump-seminar-week', { detail: { startDate: seminarStartIso } })
      );
    } else {
      suppressNextScheduleAutoOpen = true;
      goto(`/schedule?jumpDate=${encodeURIComponent(seminarStartIso)}`);
    }
  }

  afterNavigate(({ from, to }) => {
    if (!to?.url) return;
    if (suppressNextScheduleAutoOpen) {
      suppressNextScheduleAutoOpen = false;
      return;
    }

    const toPath = to.url.pathname;
    const fromPath = from?.url?.pathname || '';
    const toTab = to.url.searchParams.get('tab') || '';
    const fromTab = from?.url?.searchParams.get('tab') || '';

    const isToScheduleCalendar =
      toPath.startsWith('/schedule') &&
      (toTab === '' || toTab === 'calendar' || toTab === 'wochenplan');
    const wasOnScheduleCalendar =
      fromPath.startsWith('/schedule') &&
      (fromTab === '' || fromTab === 'calendar' || fromTab === 'wochenplan');

    // Open popup every time the user enters/selects the Admin-Ansicht (/schedule) from another page or tab
    if (isToScheduleCalendar && !wasOnScheduleCalendar) {
      openPopup();
    }
  });

  onMount(() => {
    openPopup();

    const handleOpenEvent = () => openPopup();
    const handleSyncUpdate = () => refreshUpcomingSeminarsState();

    window.addEventListener('open-upcoming-seminars-popup', handleOpenEvent);
    window.addEventListener('upcoming-seminars-updated', handleSyncUpdate);
    window.addEventListener('storage', handleSyncUpdate);
    window.addEventListener('rapla-data-synced', handleSyncUpdate);

    return () => {
      window.removeEventListener('open-upcoming-seminars-popup', handleOpenEvent);
      window.removeEventListener('upcoming-seminars-updated', handleSyncUpdate);
      window.removeEventListener('storage', handleSyncUpdate);
      window.removeEventListener('rapla-data-synced', handleSyncUpdate);
    };
  });
</script>

{#if isOpen && (nextEightSeminars.length > 0 || deletedUpcomingSeminars.length > 0)}
  <div
    class="u8-popup-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Pop-up: Kommende {upcomingPreviewLimit} Seminare im Überblick"
  >
    <div class="u8-popup-window">
      <section class="upcoming-eight-showcase u8-inside-popup" aria-label="Die nächsten {upcomingPreviewLimit} kommenden Seminare">
        <div class="u8-header">
          <div class="u8-header-left">
            <div class="u8-eyebrow-row">
              <span class="u8-eyebrow-badge">🪷 NÄCHSTE {upcomingPreviewLimit} SEMINARE · VORSCHAU</span>
              <span class="u8-auto-rule-pill">⏱️ Auto-Wechsel spätestens 1 Tag nach Seminarbeginn</span>
              <span class="u8-auto-rule-pill">🗑️ Stornierte Seminare manuell löschbar (Nachrück-Automatik)</span>
            </div>
            <h2 class="u8-section-title">Kommende {upcomingPreviewLimit} Seminare im Überblick</h2>
          </div>
          <div class="u8-header-actions">
            <div class="u8-limit-switcher" title="Anzahl der angezeigten kommenden Seminare wählen">
              <button
                type="button"
                class="u8-limit-btn"
                class:active={upcomingPreviewLimit === 6}
                onclick={() => (upcomingPreviewLimit = 6)}
              >
                6 Seminare
              </button>
              <button
                type="button"
                class="u8-limit-btn"
                class:active={upcomingPreviewLimit === 8}
                onclick={() => (upcomingPreviewLimit = 8)}
              >
                8 Seminare
              </button>
            </div>
            {#if deletedUpcomingSeminars.length > 0}
              <button
                type="button"
                class="u8-deleted-toggle-btn"
                class:active={showDeletedUpcomingPanel}
                onclick={() => (showDeletedUpcomingPanel = !showDeletedUpcomingPanel)}
                title="Manuell gelöschte / stornierte Seminare anzeigen oder wiederherstellen"
              >
                🚫 Storniert ({deletedUpcomingSeminars.length})
              </button>
            {/if}
            <a
              href="/"
              class="u8-all-seminars-link"
              onclick={() => closePopup()}
              title="Alle kommenden Seminare anzeigen"
            >
              Alle kommenden Seminare →
            </a>
            <button
              type="button"
              class="u8-collapse-btn"
              onclick={() => (isUpcomingEightExpanded = !isUpcomingEightExpanded)}
              aria-expanded={isUpcomingEightExpanded}
            >
              {isUpcomingEightExpanded ? '▲ Einklappen' : `▼ Alle ${nextEightSeminars.length} anzeigen`}
            </button>
            <button
              type="button"
              class="u8-popup-close-btn"
              onclick={closePopup}
              title="Pop-up-Fenster schließen"
            >
              ✕ Schließen
            </button>
          </div>
        </div>

        {#if lastDeletedUpcomingSem}
          <div class="u8-undo-toast">
            <span>
              🗑️ Seminar <strong>„{lastDeletedUpcomingSem.title}“</strong> ({lastDeletedUpcomingSem.date}) als storniert aus der Vorschau entfernt — das nächste Seminar ist nachgerückt.
            </span>
            <div class="u8-undo-actions">
              <button
                type="button"
                class="u8-undo-btn"
                onclick={() => lastDeletedUpcomingSem && handleRestoreUpcomingCard(lastDeletedUpcomingSem.id)}
              >
                ↩️ Rückgängig
              </button>
              <button
                type="button"
                class="u8-undo-dismiss"
                onclick={() => (lastDeletedUpcomingSem = null)}
                aria-label="Hinweis schließen"
              >
                ✕
              </button>
            </div>
          </div>
        {/if}

        {#if showDeletedUpcomingPanel && deletedUpcomingSeminars.length > 0}
          <div class="u8-deleted-panel">
            <div class="u8-deleted-panel-header">
              <strong>🚫 Manuell stornierte / gelöschte Seminare ({deletedUpcomingSeminars.length})</strong>
              <span>Klicke auf „Wiederherstellen“, falls ein storniertes Seminar wieder eingeblendet werden soll:</span>
            </div>
            <div class="u8-deleted-list">
              {#each deletedUpcomingSeminars as delSem (delSem.id)}
                <div class="u8-deleted-item">
                  <div class="u8-deleted-info">
                    <span class="u8-deleted-date">📅 {delSem.date}</span>
                    <strong>{delSem.title}</strong>
                    {#if delSem.leader}
                      <span class="u8-deleted-leader">· 🧘 {delSem.leader}</span>
                    {/if}
                  </div>
                  <button
                    type="button"
                    class="u8-restore-btn"
                    onclick={() => handleRestoreUpcomingCard(delSem.id)}
                  >
                    ↩️ Wiederherstellen
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if isUpcomingEightExpanded}
          <div class="u8-cards-grid" class:u8-grid-six={upcomingPreviewLimit === 6}>
            {#each nextEightSeminars as sem, idx (sem.id)}
              {@const daysUntil = getDaysUntilSeminarStart(sem.startDate, todayIso)}
              {@const semKw = getIsoWeekNumberForRaplaDate(sem.startDate)}
              <article
                class="u8-seminar-card"
                class:u8-unassigned={sem.leader === ''}
                class:u8-starts-today={daysUntil === 0}
                class:u8-strikethrough={sem.isStrikethrough}
              >
                <div class="u8-card-top">
                  <div class="u8-date-group">
                    <span class="u8-rank-badge">#{idx + 1}</span>
                    <span class="u8-date-text">📅 {sem.date}</span>
                    {#if sem.isWE}
                      <span class="u8-we-tag">WE</span>
                    {/if}
                  </div>
                  <div class="u8-top-right-group">
                    {#if daysUntil === 0}
                      <span class="u8-countdown-pill today">🟢 Startet heute</span>
                    {:else if daysUntil === 1}
                      <span class="u8-countdown-pill tomorrow">🟠 Morgen</span>
                    {:else if daysUntil <= 7}
                      <span class="u8-countdown-pill soon">In {daysUntil} Tg.</span>
                    {:else}
                      <span class="u8-countdown-pill future">In {daysUntil} Tg.</span>
                    {/if}
                    <button
                      type="button"
                      class="u8-card-icon-btn edit"
                      onclick={() => (editingUpcomingSemId === sem.id ? (editingUpcomingSemId = null) : openEditUpcomingCard(sem))}
                      title="Anmeldezahlen (Zahlend / Nicht zahlend) oder Seminarleitung bearbeiten"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      class="u8-card-icon-btn delete"
                      onclick={() => handleDeleteUpcomingCard(sem)}
                      title="Seminar intern stornieren / manuell aus der Vorschau löschen"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div class="u8-card-body">
                  {#if sem.isStrikethrough}
                    <span class="u8-strike-badge" title={sem.note || ''}>🚫 Durchgestrichen</span>
                  {/if}
                  <h3 class="u8-card-title">
                    {#if sem.isStrikethrough}
                      <del>{sem.title}</del>
                    {:else}
                      {sem.title}
                    {/if}
                  </h3>

                  {#if sem.leader !== ''}
                    <div class="u8-leader-row">
                      <span class="u8-leader-icon">🧘</span>
                      {#if sem.leaderPrefixBadge}
                        <span class="u8-leader-green-badge" title={sem.note || ''}>{sem.leaderPrefixBadge}</span>
                      {/if}
                      <span class="u8-leader-name">{sem.leader}</span>
                    </div>
                  {:else}
                    <div class="u8-leader-row u8-leader-open">
                      <span>⚠️ Leitung offen</span>
                    </div>
                  {/if}

                  {#if editingUpcomingSemId === sem.id}
                    <div class="u8-inline-edit-box">
                      <div class="u8-inline-edit-grid">
                        <label>
                          <span>Zahlend</span>
                          <input type="number" min="0" bind:value={editUpcomingZahlend} />
                        </label>
                        <label>
                          <span>Nicht zahlend</span>
                          <input type="number" min="0" bind:value={editUpcomingNichtZahlend} />
                        </label>
                        <label>
                          <span>Max. TN</span>
                          <input type="number" min="0" bind:value={editUpcomingMaxTN} />
                        </label>
                      </div>
                      <label class="u8-inline-leader-field">
                        <span>Seminarleitung</span>
                        <input type="text" placeholder="Name der Seminarleitung (leer = offen)" bind:value={editUpcomingLeader} />
                      </label>
                      <div class="u8-inline-edit-actions">
                        <button type="button" class="u8-save-edit-btn" onclick={() => saveEditUpcomingCard(sem.id)}>
                          ✓ Speichern
                        </button>
                        <button type="button" class="u8-cancel-edit-btn" onclick={() => (editingUpcomingSemId = null)}>
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>

                <div class="u8-card-footer">
                  <div
                    class="u8-stats-pill"
                    class:u8-overbooked={sem.maxTN > 0 && sem.currentTN > sem.maxTN}
                    title="Zahlende Gäste: {sem.currentTN}{sem.maxTN > 0 ? ` (Max. ${sem.maxTN})` : ''} · Nicht zahlende Gäste: {sem.extraStat ?? 0}"
                  >
                    <span class="u8-stat-paying">👥 Zahlend: <strong>{sem.currentTN}</strong>{sem.maxTN > 0 ? ` / ${sem.maxTN}` : ''}</span>
                    <span class="u8-extra-stat">· Nicht zahlend: <strong>{sem.extraStat ?? 0}</strong></span>
                  </div>
                  {#if semKw}
                    <button
                      type="button"
                      class="u8-jump-kw-btn"
                      onclick={() => handleJumpToWeek(sem.startDate)}
                      title="Wochenplan direkt zu KW {semKw} öffnen"
                    >
                      KW {semKw} ➔
                    </button>
                  {/if}
                </div>
              </article>
            {/each}
          </div>
        {/if}

        <div class="u8-popup-footer">
          <span class="u8-popup-footer-hint">
            💡 Erinnerung an die kommenden {upcomingPreviewLimit} Seminare in der Admin-Ansicht
          </span>
          <button type="button" class="u8-popup-footer-close-btn" onclick={closePopup}>
            ✓ Gesehen & Pop-up schließen
          </button>
        </div>
      </section>
    </div>
  </div>
{/if}

<style>
  .u8-popup-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9990;
    background: rgba(15, 23, 42, 0.62);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
    overflow-y: auto;
    animation: u8BackdropFadeIn 0.2s ease-out;
  }

  .u8-popup-window {
    width: 100%;
    max-width: 1220px;
    max-height: calc(100vh - 2.5rem);
    overflow-y: auto;
    border-radius: 18px;
    box-shadow: 0 25px 60px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(245, 158, 11, 0.35);
    animation: u8PopupSlideIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes u8BackdropFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes u8PopupSlideIn {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .upcoming-eight-showcase.u8-inside-popup {
    background: linear-gradient(135deg, #fffdf9 0%, #fff7ed 55%, #fef3c7 100%);
    border: 2px solid #f59e0b;
    border-left: 6px solid #960040;
    border-radius: 16px;
    padding: 1.2rem 1.4rem;
    margin: 0;
    box-shadow: 0 8px 24px rgba(150, 0, 64, 0.08), 0 2px 6px rgba(234, 88, 12, 0.06);
  }

  .u8-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
  }

  .u8-header-left {
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
  }

  .u8-eyebrow-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .u8-eyebrow-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: linear-gradient(135deg, #960040, #be123c);
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    text-transform: uppercase;
    box-shadow: 0 2px 5px rgba(150, 0, 64, 0.22);
  }

  .u8-auto-rule-pill {
    display: inline-flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid #fde68a;
    color: #92400e;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.16rem 0.55rem;
    border-radius: 999px;
  }

  .u8-section-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
    line-height: 1.25;
  }

  .u8-header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.55rem;
  }

  .u8-all-seminars-link {
    display: inline-flex;
    align-items: center;
    background: #ffffff;
    border: 1px solid rgba(150, 0, 64, 0.25);
    color: #960040;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.38rem 0.75rem;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.18s ease;
  }

  .u8-all-seminars-link:hover {
    background: #960040;
    color: #ffffff;
    border-color: #960040;
  }

  .u8-collapse-btn {
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #cbd5e1;
    color: #334155;
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 700;
    padding: 0.38rem 0.7rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .u8-collapse-btn:hover {
    background: #ffffff;
    border-color: #94a3b8;
    color: #0f172a;
  }

  .u8-popup-close-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #960040;
    border: 1px solid #960040;
    color: #ffffff;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 800;
    padding: 0.42rem 0.85rem;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(150, 0, 64, 0.25);
    transition: all 0.18s ease;
  }

  .u8-popup-close-btn:hover {
    background: #7a0034;
    border-color: #7a0034;
    transform: translateY(-1px);
  }

  .u8-cards-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 0.9rem;
  }

  .u8-cards-grid.u8-grid-six {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .u8-limit-switcher {
    display: inline-flex;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
  }

  .u8-limit-btn {
    background: transparent;
    border: none;
    color: #475569;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.25rem 0.55rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .u8-limit-btn.active {
    background: #960040;
    color: #ffffff;
  }

  .u8-deleted-toggle-btn {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    color: #b91c1c;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.36rem 0.68rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .u8-deleted-toggle-btn:hover,
  .u8-deleted-toggle-btn.active {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
  }

  .u8-undo-toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.75rem;
    padding: 0.55rem 0.85rem;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 10px;
    font-size: 0.8rem;
    color: #881337;
  }

  .u8-undo-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .u8-undo-btn {
    background: #960040;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 0.26rem 0.65rem;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
  }

  .u8-undo-dismiss {
    background: transparent;
    border: none;
    color: #881337;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.1rem 0.35rem;
  }

  .u8-deleted-panel {
    margin-top: 0.75rem;
    padding: 0.75rem 0.9rem;
    background: rgba(255, 255, 255, 0.92);
    border: 1px dashed #f87171;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .u8-deleted-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: #7f1d1d;
  }

  .u8-deleted-list {
    display: flex;
    flex-direction: column;
    gap: 0.38rem;
  }

  .u8-deleted-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.38rem 0.65rem;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 8px;
    font-size: 0.78rem;
  }

  .u8-deleted-info {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .u8-deleted-date {
    font-weight: 700;
    color: #475569;
  }

  .u8-deleted-leader {
    color: #64748b;
  }

  .u8-restore-btn {
    background: #ffffff;
    border: 1px solid #16a34a;
    color: #15803d;
    border-radius: 6px;
    padding: 0.22rem 0.58rem;
    font-family: inherit;
    font-size: 0.73rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .u8-restore-btn:hover {
    background: #16a34a;
    color: #ffffff;
  }

  .u8-top-right-group {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .u8-card-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .u8-card-icon-btn.edit:hover {
    background: #eff6ff;
    border-color: #93c5fd;
  }

  .u8-card-icon-btn.delete {
    border-color: rgba(220, 38, 38, 0.25);
    background: #fef2f2;
  }

  .u8-card-icon-btn.delete:hover {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
  }

  .u8-inline-edit-box {
    margin-top: 0.35rem;
    padding: 0.55rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .u8-inline-edit-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .u8-inline-edit-grid label,
  .u8-inline-leader-field {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: #475569;
  }

  .u8-inline-edit-grid input,
  .u8-inline-leader-field input {
    padding: 0.24rem 0.4rem;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font-family: inherit;
    font-size: 0.75rem;
    font-weight: 700;
    color: #0f172a;
    background: #ffffff;
  }

  .u8-inline-edit-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .u8-save-edit-btn {
    background: #16a34a;
    color: #ffffff;
    border: none;
    border-radius: 5px;
    padding: 0.24rem 0.55rem;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
  }

  .u8-cancel-edit-btn {
    background: #ffffff;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 0.24rem 0.55rem;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
  }

  .u8-seminar-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid #eadfce;
    border-top: 3px solid #960040;
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }

  .u8-seminar-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(150, 0, 64, 0.1);
    border-color: #f59e0b;
  }

  .u8-seminar-card.u8-unassigned {
    border-top-color: #ea580c;
    border-left: 4px solid #ea580c;
    background: #fffaf5;
  }

  .u8-seminar-card.u8-starts-today {
    border-top-color: #16a34a;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12);
  }

  .u8-seminar-card.u8-strikethrough {
    border-top-color: #9ca3af;
    background: #f8fafc;
    opacity: 0.86;
  }

  .u8-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .u8-date-group {
    display: flex;
    align-items: center;
    gap: 0.32rem;
    flex-wrap: wrap;
  }

  .u8-rank-badge {
    font-size: 0.68rem;
    font-weight: 800;
    color: #960040;
    background: rgba(150, 0, 64, 0.09);
    padding: 0.08rem 0.36rem;
    border-radius: 5px;
  }

  .u8-date-text {
    font-size: 0.76rem;
    font-weight: 800;
    color: #1e293b;
  }

  .u8-we-tag {
    font-size: 0.64rem;
    font-weight: 800;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
    padding: 0.05rem 0.34rem;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .u8-countdown-pill {
    font-size: 0.67rem;
    font-weight: 800;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    white-space: nowrap;
  }

  .u8-countdown-pill.today {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #86efac;
  }

  .u8-countdown-pill.tomorrow {
    background: #ffedd5;
    color: #c2410c;
    border: 1px solid #fdba74;
  }

  .u8-countdown-pill.soon {
    background: #ffe4e6;
    color: #9f1239;
    border: 1px solid #fecdd3;
  }

  .u8-countdown-pill.future {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .u8-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.32rem;
    flex: 1;
  }

  .u8-strike-badge {
    display: inline-block;
    width: fit-content;
    font-size: 0.65rem;
    font-weight: 800;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
    padding: 0.06rem 0.4rem;
    border-radius: 4px;
  }

  .u8-card-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }

  .u8-card-title del {
    color: #64748b;
    text-decoration-thickness: 2px;
  }

  .u8-leader-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.3rem;
    font-size: 0.78rem;
    color: #334155;
  }

  .u8-leader-icon {
    font-size: 0.85rem;
  }

  .u8-leader-green-badge {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #86efac;
    font-size: 0.66rem;
    font-weight: 800;
    padding: 0.04rem 0.32rem;
    border-radius: 4px;
  }

  .u8-leader-name {
    font-weight: 700;
    color: #960040;
  }

  .u8-leader-open {
    background: #ffedd5;
    border: 1px solid #fdba74;
    color: #c2410c;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.14rem 0.48rem;
    border-radius: 6px;
    width: fit-content;
  }

  .u8-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    padding-top: 0.42rem;
    border-top: 1px dashed #e2e8f0;
  }

  .u8-stats-pill {
    font-size: 0.73rem;
    color: #475569;
    display: inline-flex;
    align-items: center;
    gap: 0.22rem;
    flex-wrap: wrap;
  }

  .u8-stats-pill strong {
    color: #0f172a;
    font-weight: 800;
  }

  .u8-stats-pill.u8-overbooked strong {
    color: #15803d;
  }

  .u8-extra-stat {
    color: #64748b;
    font-size: 0.69rem;
  }

  .u8-jump-kw-btn {
    background: #fdf2f8;
    border: 1px solid rgba(150, 0, 64, 0.24);
    color: #960040;
    font-family: inherit;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.16rem 0.48rem;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .u8-jump-kw-btn:hover {
    background: #960040;
    color: #ffffff;
    border-color: #960040;
  }

  .u8-popup-footer {
    margin-top: 1rem;
    padding-top: 0.85rem;
    border-top: 1px solid rgba(245, 158, 11, 0.35);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .u8-popup-footer-hint {
    font-size: 0.8rem;
    font-weight: 600;
    color: #92400e;
  }

  .u8-popup-footer-close-btn {
    background: linear-gradient(135deg, #960040, #be123c);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 0.55rem 1.25rem;
    font-family: inherit;
    font-size: 0.86rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(150, 0, 64, 0.28);
    transition: all 0.18s ease;
  }

  .u8-popup-footer-close-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(150, 0, 64, 0.36);
  }

  @media (max-width: 1100px) {
    .u8-cards-grid,
    .u8-cards-grid.u8-grid-six {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 680px) {
    .u8-popup-backdrop {
      padding: 0.65rem;
    }
    .u8-cards-grid,
    .u8-cards-grid.u8-grid-six {
      grid-template-columns: 1fr;
    }
    .upcoming-eight-showcase.u8-inside-popup {
      padding: 0.95rem;
    }
  }
</style>
