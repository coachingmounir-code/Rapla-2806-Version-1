<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    getYlaWeeks, 
    getYlaWeek, 
    searchYlaCurriculum, 
    setYlaAssignment,
    getYlaAssignments,
    YLA_TEACHERS,
    YLA_TEACHERS_META,
    type YlaWeek, 
    type YlaSearchResult, 
    type YlaDayEntry, 
    type YlaDay, 
    type YlaSlot,
    type YlaTeacherName
  } from '$lib/ylaData';

  // Props
  let { initialWeek = 1, onWeekChange }: { initialWeek?: number; onWeekChange?: (week: number) => void } = $props();

  let assignmentsMap = $state<Record<string, string>>({});
  let selectedWeekNumber = $state(initialWeek || 1);
  let activeMobileDayIndex = $state(0);
  let isFullscreen = $state(false);
  let searchQuery = $state('');
  let showAbbreviations = $state(false);

  // Modal State for Slot Detail
  let activeDetailModal = $state<{
    weekSubtitle: string;
    weekNumber: number;
    dayCol: string;
    slotRowNumber: number;
    dayName: string;
    dateStr: string;
    specialFocus?: string;
    slotLabel: string;
    slotTime: string;
    slotBadge: string;
    slotType: string;
    entry: YlaDayEntry;
  } | null>(null);

  // Load and subscribe to assignments
  function refreshAssignments() {
    assignmentsMap = getYlaAssignments();
  }

  onMount(() => {
    refreshAssignments();
    const handleStorage = () => refreshAssignments();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('yla-assignment-changed', handleStorage);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDetailModal) {
          closeSlotDetail();
        } else if (searchQuery) {
          searchQuery = '';
        }
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('yla-assignment-changed', handleStorage);
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  const allWeeks = getYlaWeeks();
  let currentWeekRaw = $derived(getYlaWeek(selectedWeekNumber) || allWeeks[0]);

  // Merge live assignments into current week
  let currentWeek = $derived.by(() => {
    const w = JSON.parse(JSON.stringify(currentWeekRaw)) as YlaWeek;
    for (const slot of w.slots) {
      for (const day of w.days) {
        const key = `${w.weekNumber}_${day.col}_${slot.rowNumber}`;
        const entry = slot.entries[day.col];
        if (entry) {
          entry.assignedTeacher = assignmentsMap[key] || null;
        }
      }
    }
    return w;
  });

  let searchResults = $derived(searchYlaCurriculum(searchQuery));
  let specialDays = $derived(currentWeek.days.filter(d => d.specialFocus));
  let activeDay = $derived(currentWeek.days[activeMobileDayIndex]);

  function selectWeek(num: number) {
    selectedWeekNumber = num;
    activeMobileDayIndex = 0;
    if (onWeekChange) {
      onWeekChange(num);
    }
  }

  function navigateWeek(delta: number) {
    const newWeek = selectedWeekNumber + delta;
    if (newWeek >= 1 && newWeek <= allWeeks.length) {
      selectWeek(newWeek);
    }
  }

  function toggleFullscreen() {
    const container = document.getElementById('yla-schedule-container');
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
      isFullscreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      isFullscreen = false;
    }
  }

  function handlePrint() {
    window.print();
  }

  function openSlotDetail(day: YlaDay, slot: YlaSlot, entry: YlaDayEntry) {
    if (!entry || (!entry.text && !entry.shortTitle)) return;
    const key = `${currentWeek.weekNumber}_${day.col}_${slot.rowNumber}`;
    const assigned = assignmentsMap[key] || entry.assignedTeacher || null;

    activeDetailModal = {
      weekSubtitle: currentWeek.weekSubtitle,
      weekNumber: currentWeek.weekNumber,
      dayCol: day.col,
      slotRowNumber: slot.rowNumber,
      dayName: day.dayName,
      dateStr: day.dateStr,
      specialFocus: day.specialFocus,
      slotLabel: slot.label,
      slotTime: slot.time,
      slotBadge: slot.badge,
      slotType: slot.type,
      entry: { ...entry, assignedTeacher: assigned }
    };
  }

  function closeSlotDetail() {
    activeDetailModal = null;
  }

  function assignTeacherToSlot(weekNumber: number, dayCol: string, rowNumber: number, teacherName: string | null) {
    setYlaAssignment(weekNumber, dayCol, rowNumber, teacherName);
    refreshAssignments();
    if (activeDetailModal && activeDetailModal.weekNumber === weekNumber && activeDetailModal.dayCol === dayCol && activeDetailModal.slotRowNumber === rowNumber) {
      activeDetailModal.entry.assignedTeacher = teacherName;
    }
  }

  function getSlotCategoryIcon(type: string): string {
    switch (type) {
      case 'morning_lecture': return '🌅';
      case 'morning_practice': return '🧘';
      case 'early_practice': return '✨';
      case 'gita': return '📖';
      case 'afternoon_lecture': return '🫀';
      case 'mantras': return '🎶';
      case 'reading_basic': return '📘';
      case 'reading_advanced': return '📙';
      case 'teaching_practice': return '👥';
      case 'teaching_review':
      case 'teaching_review_1':
      case 'teaching_review_2': return '💬';
      case 'evening_lecture': return '🏛️';
      case 'satsang': return '🌙';
      case 'special_evening': return '🕉️';
      case 'study_exam': return '🎓';
      case 'midday_event':
      case 'mantra_init': return '🪔';
      case 'exam_lunch': return '🍲';
      default: return '📋';
    }
  }

  function getSlotStyleClass(type: string): string {
    switch (type) {
      case 'morning_lecture': return 'slot-morning-lecture';
      case 'morning_practice': return 'slot-morning-practice';
      case 'early_practice': return 'slot-early-practice';
      case 'gita': return 'slot-gita';
      case 'afternoon_lecture': return 'slot-afternoon-lecture';
      case 'mantras': return 'slot-mantra';
      case 'reading_basic': return 'slot-reading-basic';
      case 'reading_advanced': return 'slot-reading-advanced';
      case 'teaching_practice': return 'slot-teaching';
      case 'teaching_review':
      case 'teaching_review_1':
      case 'teaching_review_2': return 'slot-review';
      case 'evening_lecture': return 'slot-evening-lecture';
      case 'satsang': return 'slot-satsang';
      case 'special_evening': return 'slot-ceremony';
      case 'study_exam': return 'slot-exam';
      case 'midday_event':
      case 'mantra_init': return 'slot-mantra-init';
      case 'exam_lunch': return 'slot-lunch';
      default: return 'slot-default';
    }
  }

  function getSpecialFocusIcon(focusText: string): string {
    const textLower = focusText.toLowerCase();
    if (textLower.includes('schweigen') || textLower.includes('schweig')) return '🤫';
    if (textLower.includes('fasten') || textLower.includes('kriya')) return '🌾';
    if (textLower.includes('prüfung')) return '🎓';
    if (textLower.includes('studientag')) return '📖';
    if (textLower.includes('mantra')) return '🪔';
    if (textLower.includes('frei')) return '🌿';
    if (textLower.includes('kundalini')) return '⚡';
    if (textLower.includes('karma')) return '☸️';
    return '✨';
  }

  function getTeacherBadgeStyle(name: string) {
    const meta = YLA_TEACHERS_META[name as YlaTeacherName];
    if (meta) {
      return {
        color: meta.color,
        bg: meta.badgeBg,
        avatar: meta.avatar
      };
    }
    return {
      color: '#960040',
      bg: '#fff5cc',
      avatar: '👤'
    };
  }
</script>

<div id="yla-schedule-container" class="yla-view-wrapper" class:fullscreen-active={isFullscreen}>
  <!-- Top Navigation & Week Selector Buttons -->
  <div class="yla-top-bar">
    <div class="yla-title-section">
      <div class="yla-heading-row">
        <span class="yla-badge">🧘 4-wöchige Yogalehrerausbildung (YLA)</span>
        <span class="yla-sub-badge">Start: 30.08.2026 • Intensivkurs</span>
      </div>
      <h2 class="yla-main-title">{currentWeek.title}</h2>
    </div>

    <div class="yla-controls-row">
      <!-- Search Input -->
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Im 4-Wochen-Plan suchen (z.B. Anjali, Gita, Bernie, Anatomie, Prüfung)..." 
          class="yla-search-input"
        />
        {#if searchQuery}
          <button type="button" class="btn-clear-search" onclick={() => searchQuery = ''} title="Suche leeren">✕</button>
        {/if}
      </div>

      <!-- Action buttons -->
      <div class="yla-action-buttons">
        <button 
          type="button" 
          class="btn yla-btn-action" 
          onclick={() => showAbbreviations = !showAbbreviations}
          title="Abkürzungen anzeigen / verbergen"
        >
          📖 {showAbbreviations ? 'Abkürzungen verbergen' : 'Abkürzungen'}
        </button>

        <button 
          type="button" 
          class="btn yla-btn-action" 
          onclick={handlePrint}
          title="Unterrichtsplan drucken"
        >
          🖨️ Drucken
        </button>

        <button 
          type="button" 
          class="btn yla-btn-action" 
          onclick={toggleFullscreen}
          title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
        >
          {isFullscreen ? '🗗 Beenden' : '🖥️ Vollbild'}
        </button>
      </div>
    </div>

    <!-- 4-Week Selector Tabs / Buttons (Single click per week) -->
    <div class="week-selector-tabs">
      {#each allWeeks as week}
        {@const isActive = week.weekNumber === selectedWeekNumber}
        <button 
          type="button" 
          class="week-tab-btn" 
          class:active={isActive}
          onclick={() => selectWeek(week.weekNumber)}
        >
          <div class="week-tab-num">Woche {week.weekNumber}</div>
          <div class="week-tab-dates">{week.dateRange}</div>
          <div class="week-tab-days-badge">{week.days.length} Tage</div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Search Results Overlay if active -->
  {#if searchQuery.trim().length >= 2}
    <div class="search-results-panel glass-card animate-fade-in">
      <div class="search-results-header">
        <h3>Suchergebnisse für "{searchQuery}" ({searchResults.length} Treffer)</h3>
        <button type="button" class="btn-close-results" onclick={() => searchQuery = ''}>Schließen ✕</button>
      </div>
      {#if searchResults.length === 0}
        <p class="no-results-msg">Keine passenden Einheiten in den 4 Wochen gefunden.</p>
      {:else}
        <div class="search-results-grid">
          {#each searchResults as res}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="search-result-card"
              onclick={() => {
                selectWeek(res.weekNumber);
                searchQuery = '';
              }}
            >
              <div class="res-card-top">
                <span class="res-week-badge">Woche {res.weekNumber}</span>
                <span class="res-day-badge">{res.dateStr} {res.dayName}</span>
                <span class="res-time-badge">{res.time || 'Ganztägig'}</span>
              </div>
              <div class="res-slot-name">{res.slotLabel}</div>
              <p class="res-match-text">{res.matchText}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Collapsible Abbreviations Box -->
  {#if showAbbreviations}
    <div class="abbreviations-box glass-card animate-fade-in">
      <div class="abbr-header">
        <h4>Verwendete Abkürzungen & Literatur</h4>
        <button type="button" class="btn-icon-close" onclick={() => showAbbreviations = false}>✕</button>
      </div>
      <div class="abbr-grid">
        {#each currentWeek.abbreviations as item}
          <div class="abbr-item">
            <span class="abbr-code">{item.abbr}</span>
            <span class="abbr-meaning">{item.meaning}</span>
          </div>
        {/each}
      </div>
      <div class="abbr-footer-note">
        {currentWeek.contactInfo}
      </div>
    </div>
  {/if}

  <!-- Active Week Summary Banner -->
  <div class="week-summary-banner glass-card">
    <div class="summary-left">
      <div class="week-nav-mini">
        <button 
          type="button" 
          class="btn-nav-mini" 
          disabled={selectedWeekNumber <= 1}
          onclick={() => navigateWeek(-1)}
          title="Vorherige Woche"
        >
          ◀ Woche {selectedWeekNumber - 1}
        </button>
        <span class="current-week-pill">
          {currentWeek.weekSubtitle}
        </span>
        <button 
          type="button" 
          class="btn-nav-mini" 
          disabled={selectedWeekNumber >= allWeeks.length}
          onclick={() => navigateWeek(1)}
          title="Nächste Woche"
        >
          Woche {selectedWeekNumber + 1} ▶
        </button>
      </div>
    </div>

    <!-- Special Highlights of this week -->
    {#if specialDays.length > 0}
      <div class="special-highlights-row">
        <span class="highlights-label">Besonderheiten:</span>
        <div class="highlights-chips">
          {#each specialDays as sd}
            <div class="highlight-chip">
              <span class="chip-icon">{getSpecialFocusIcon(sd.specialFocus)}</span>
              <strong>{sd.dayName} ({sd.dateStr}):</strong>
              <span>{sd.specialFocus}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- DESKTOP TIMETABLE GRID (Compact & Clickable) -->
  <div class="yla-desktop-grid-container">
    <div class="yla-grid-table">
      <!-- Grid Header Row with Days -->
      <div class="yla-grid-header-row">
        <div class="yla-cell yla-header-cell time-col-header">
          <div class="header-time-title">ZEIT / EINHEIT</div>
        </div>

        {#each currentWeek.days as day}
          <div class="yla-cell yla-header-cell day-col-header">
            <div class="day-header-name">{day.dayName}</div>
            <div class="day-header-date">{day.dateStr}</div>
            {#if day.specialFocus}
              <div class="day-header-focus" title={day.specialFocus}>
                <span>{getSpecialFocusIcon(day.specialFocus)}</span>
                <span class="focus-text-truncate">{day.specialFocus}</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Grid Body Rows -->
      {#each currentWeek.slots as slot}
        <div class="yla-grid-slot-row">
          <!-- Left Label Column -->
          <div class="yla-cell yla-slot-label-cell {getSlotStyleClass(slot.type)}">
            <div class="slot-badge-tag">
              <span>{getSlotCategoryIcon(slot.type)}</span>
              <span>{slot.badge}</span>
            </div>
            <div class="slot-main-label">{slot.label}</div>
            {#if slot.time}
              <div class="slot-time-sub">{slot.time}</div>
            {/if}
          </div>

          <!-- Day Columns for this slot -->
          {#each currentWeek.days as day}
            {@const entry = slot.entries[day.col]}
            {@const key = `${currentWeek.weekNumber}_${day.col}_${slot.rowNumber}`}
            {@const assignedTeacher = assignmentsMap[key] || entry?.assignedTeacher}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="yla-cell yla-slot-content-cell {getSlotStyleClass(slot.type)}" 
              class:is-empty={!entry || (!entry.text && !entry.shortTitle)}
              class:is-clickable={entry && (entry.text || entry.shortTitle)}
              class:has-assigned-teacher={!!assignedTeacher}
              onclick={() => entry && (entry.text || entry.shortTitle) && openSlotDetail(day, slot, entry)}
              title={entry && entry.fullText ? 'Klicken für alle Details & Lehrerauswahl' : ''}
            >
              {#if entry && (entry.text || entry.shortTitle)}
                <div class="compact-slot-box">
                  <!-- Top Row: Time Pill and Inline Teacher Selector / Badge -->
                  <div class="compact-slot-top-row">
                    {#if entry.time}
                      <span class="compact-slot-time-pill">{entry.time}</span>
                    {/if}

                    <!-- Teacher Badge or Quick Select Dropdown -->
                    <div class="slot-teacher-assign-wrapper" onclick={(e) => e.stopPropagation()}>
                      {#if assignedTeacher}
                        {@const meta = getTeacherBadgeStyle(assignedTeacher)}
                        <div 
                          class="assigned-teacher-badge" 
                          style="color: {meta.color}; background: {meta.bg}; border-color: {meta.color};"
                          title="Eingeteilt: {assignedTeacher} (Klicken zum Ändern)"
                        >
                          <span class="t-avatar">{meta.avatar}</span>
                          <span class="t-name">{assignedTeacher}</span>
                          <button 
                            type="button" 
                            class="btn-clear-teacher"
                            onclick={(e) => {
                              e.stopPropagation();
                              assignTeacherToSlot(currentWeek.weekNumber, day.col, slot.rowNumber, null);
                            }}
                            title="Zuweisung entfernen"
                          >✕</button>
                        </div>
                      {:else}
                        <!-- Inline Quick Dropdown -->
                        <select 
                          class="inline-teacher-select"
                          value=""
                          onchange={(e) => {
                            const val = (e.target as HTMLSelectElement).value;
                            assignTeacherToSlot(currentWeek.weekNumber, day.col, slot.rowNumber, val || null);
                          }}
                          title="Lehrkraft für diese Einheit einteilen"
                        >
                          <option value="">+ Person</option>
                          {#each YLA_TEACHERS as tName}
                            <option value={tName}>{YLA_TEACHERS_META[tName].avatar} {tName}</option>
                          {/each}
                        </select>
                      {/if}
                    </div>
                  </div>

                  <!-- Primary Concise Title (3-5 keywords) -->
                  <div class="compact-slot-title">
                    {entry.shortTitle || entry.text}
                  </div>

                  <!-- Keyword Tags Chips (Max 3) -->
                  {#if entry.keywords && entry.keywords.length > 0}
                    <div class="compact-keywords-list">
                      {#each entry.keywords.slice(0, 3) as kw}
                        <span class="compact-keyword-tag">{kw}</span>
                      {/each}
                    </div>
                  {/if}

                  <!-- Click info hint -->
                  <div class="slot-click-hint">
                    <span class="hint-icon">🔍</span>
                    <span class="hint-text">Details & Zuweisung</span>
                  </div>
                </div>
              {:else}
                <div class="empty-slot-placeholder">—</div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  <!-- MOBILE / TABLET DAY ACCORDION & CARDS VIEW -->
  <div class="yla-mobile-view">
    <!-- Day Tabs Navigation for Mobile -->
    <div class="mobile-day-tabs">
      {#each currentWeek.days as day, idx}
        <button 
          type="button" 
          class="mobile-day-tab-btn" 
          class:active={activeMobileDayIndex === idx}
          onclick={() => activeMobileDayIndex = idx}
        >
          <span class="m-day-name">{day.dayName.slice(0, 2)}</span>
          <span class="m-day-date">{day.dateStr}</span>
        </button>
      {/each}
    </div>

    <!-- Active Day Schedule Feed on Mobile -->
    {#if activeDay}
      <div class="mobile-day-feed animate-fade-in">
        <div class="mobile-day-header-card glass-card">
          <div class="m-card-title-row">
            <h3>{activeDay.dayName}, {activeDay.dateStr}</h3>
            <span class="m-week-tag">Woche {currentWeek.weekNumber}</span>
          </div>
          {#if activeDay.specialFocus}
            <div class="mobile-special-focus-box">
              <span class="focus-icon">{getSpecialFocusIcon(activeDay.specialFocus)}</span>
              <strong>{activeDay.specialFocus}</strong>
            </div>
          {/if}
        </div>

        <div class="mobile-slots-list">
          {#each currentWeek.slots as slot}
            {@const entry = slot.entries[activeDay.col]}
            {@const key = `${currentWeek.weekNumber}_${activeDay.col}_${slot.rowNumber}`}
            {@const assignedTeacher = assignmentsMap[key] || entry?.assignedTeacher}
            {#if entry && (entry.text || entry.shortTitle)}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                class="mobile-slot-card glass-card {getSlotStyleClass(slot.type)} is-clickable"
                onclick={() => openSlotDetail(activeDay, slot, entry)}
              >
                <div class="m-slot-header">
                  <div class="m-slot-badge">
                    <span>{getSlotCategoryIcon(slot.type)}</span>
                    <span>{slot.badge}</span>
                  </div>
                  {#if entry.time || slot.time}
                    <span class="m-slot-time">{entry.time || slot.time}</span>
                  {/if}
                </div>

                <!-- Mobile Teacher Badge -->
                {#if assignedTeacher}
                  {@const meta = getTeacherBadgeStyle(assignedTeacher)}
                  <div class="mobile-assigned-teacher-row">
                    <span class="assigned-teacher-badge" style="color: {meta.color}; background: {meta.bg}; border-color: {meta.color};">
                      <span>{meta.avatar}</span>
                      <strong>{assignedTeacher}</strong>
                    </span>
                  </div>
                {/if}

                <div class="m-slot-title">{entry.shortTitle || slot.label}</div>

                {#if entry.keywords && entry.keywords.length > 0}
                  <div class="m-keywords-row">
                    {#each entry.keywords as kw}
                      <span class="compact-keyword-tag">{kw}</span>
                    {/each}
                  </div>
                {/if}

                <div class="m-click-note">
                  <span>ℹ️ Klicken für vollständige Beschreibung & Lehrerauswahl</span>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- INTERACTIVE SLOT DETAIL MODAL WITH TEACHER SELECTION -->
  {#if activeDetailModal}
    {@const modalKey = `${activeDetailModal.weekNumber}_${activeDetailModal.dayCol}_${activeDetailModal.slotRowNumber}`}
    {@const currentAssigned = assignmentsMap[modalKey] || activeDetailModal.entry.assignedTeacher}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="detail-modal-backdrop animate-fade-in" onclick={closeSlotDetail}>
      <div class="detail-modal-card glass-card animate-scale-up" onclick={(e) => e.stopPropagation()}>
        <!-- Modal Header -->
        <div class="detail-modal-header">
          <div class="modal-meta-row">
            <span class="modal-week-pill">Woche {activeDetailModal.weekNumber}</span>
            <span class="modal-day-pill">{activeDetailModal.dayName}, {activeDetailModal.dateStr}</span>
            <span class="modal-category-pill {getSlotStyleClass(activeDetailModal.slotType)}">
              <span>{getSlotCategoryIcon(activeDetailModal.slotType)}</span>
              <span>{activeDetailModal.slotBadge}</span>
            </span>
            {#if activeDetailModal.entry.time || activeDetailModal.slotTime}
              <span class="modal-time-pill">⏰ {activeDetailModal.entry.time || activeDetailModal.slotTime}</span>
            {/if}
          </div>
          <button type="button" class="btn-modal-close" onclick={closeSlotDetail} aria-label="Schließen">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="detail-modal-body">
          <!-- Main Title -->
          <h2 class="detail-slot-main-title">
            {activeDetailModal.entry.shortTitle || activeDetailModal.slotLabel}
          </h2>

          <!-- Slot label context -->
          <div class="detail-slot-context">
            <strong>Einheit:</strong> {activeDetailModal.slotLabel}
          </div>

          <!-- TEACHER SELECTION SECTION -->
          <div class="detail-teacher-selection-section">
            <div class="section-label-with-icon">
              <span>👤</span>
              <span>Lehrkraft für diese YLA-Einheit einteilen:</span>
            </div>
            <div class="teacher-chips-picker">
              {#each YLA_TEACHERS as tName}
                {@const meta = YLA_TEACHERS_META[tName]}
                {@const isSelected = currentAssigned === tName}
                <button 
                  type="button" 
                  class="teacher-select-btn"
                  class:selected={isSelected}
                  style={isSelected ? `background: ${meta.color}; border-color: ${meta.color}; color: #ffffff;` : ''}
                  onclick={() => assignTeacherToSlot(activeDetailModal!.weekNumber, activeDetailModal!.dayCol, activeDetailModal!.slotRowNumber, isSelected ? null : tName)}
                >
                  <span class="t-btn-avatar">{meta.avatar}</span>
                  <span class="t-btn-name">{tName}</span>
                  {#if isSelected}
                    <span class="t-btn-check">✓</span>
                  {/if}
                </button>
              {/each}
              {#if currentAssigned}
                <button 
                  type="button" 
                  class="teacher-select-btn btn-clear-assignment"
                  onclick={() => assignTeacherToSlot(activeDetailModal!.weekNumber, activeDetailModal!.dayCol, activeDetailModal!.slotRowNumber, null)}
                  title="Zuweisung aufheben"
                >
                  <span>✕ Keine Person</span>
                </button>
              {/if}
            </div>

            {#if currentAssigned}
              <div class="assignment-notice-box">
                <span>✓ <strong>{currentAssigned}</strong> ist fest für diese Einheit eingeteilt und wird in der regulären Wochenplanung für diesen Zeitraum automatisch geblockt.</span>
              </div>
            {/if}
          </div>

          <!-- Special Focus if any -->
          {#if activeDetailModal.specialFocus}
            <div class="detail-special-banner">
              <span class="banner-icon">{getSpecialFocusIcon(activeDetailModal.specialFocus)}</span>
              <div>
                <strong>Tages-Besonderheit:</strong> {activeDetailModal.specialFocus}
              </div>
            </div>
          {/if}

          <!-- Keywords List -->
          {#if activeDetailModal.entry.keywords && activeDetailModal.entry.keywords.length > 0}
            <div class="detail-keywords-section">
              <span class="section-label">Schlagwörter & Themen:</span>
              <div class="detail-keywords-chips">
                {#each activeDetailModal.entry.keywords as kw}
                  <span class="detail-keyword-chip">🏷️ {kw}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Full Content / Description Box -->
          <div class="detail-full-text-box">
            <span class="section-label">Vollständige Beschreibung & Details:</span>
            <div class="detail-text-content">
              {activeDetailModal.entry.fullText || activeDetailModal.entry.text}
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="detail-modal-footer">
          <button type="button" class="btn btn-secondary btn-modal-done" onclick={closeSlotDetail}>
            Schließen & Speichern
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Bottom Footer Note -->
  <footer class="yla-view-footer">
    <div class="footer-links">
      <span>{currentWeek.contactInfo}</span>
    </div>
  </footer>
</div>

<style>
  .yla-view-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding-bottom: 2.5rem;
  }

  .fullscreen-active {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #fffdf8;
    padding: 1.5rem;
    overflow-y: auto;
  }

  /* Top Bar */
  .yla-top-bar {
    background: var(--bg-card, #ffffff);
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 18px rgba(150, 0, 64, 0.04);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .yla-title-section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .yla-heading-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .yla-badge {
    background: #fff5cc;
    color: #960040;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.3rem 0.8rem;
    border-radius: 20px;
    border: 1px solid #ffe082;
  }

  .yla-sub-badge {
    font-size: 0.85rem;
    color: #6b5151;
    font-weight: 600;
  }

  .yla-main-title {
    font-size: 1.5rem;
    color: #2a1b1b;
    margin: 0;
    font-family: 'Playfair Display', serif;
  }

  /* Controls Row */
  .yla-controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .search-input-wrapper {
    position: relative;
    flex: 1;
    min-width: 280px;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 0.9rem;
    font-size: 0.95rem;
    color: #9e8585;
    pointer-events: none;
  }

  .yla-search-input {
    width: 100%;
    padding: 0.65rem 2.2rem 0.65rem 2.4rem;
    border-radius: 12px;
    border: 1px solid var(--border-color, #ffe082);
    background: #fffdf8;
    font-size: 0.9rem;
    color: #2a1b1b;
    outline: none;
    transition: all 0.2s;
  }

  .yla-search-input:focus {
    border-color: #960040;
    box-shadow: 0 0 0 3px rgba(150, 0, 64, 0.1);
  }

  .btn-clear-search {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    color: #9e8585;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 0.2rem;
  }

  .yla-action-buttons {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .yla-btn-action {
    background: #fff5cc;
    color: #2a1b1b;
    border: 1px solid #ffe082;
    border-radius: 10px;
    padding: 0.55rem 0.95rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .yla-btn-action:hover {
    background: #ffe8a3;
    border-color: #960040;
    color: #960040;
  }

  /* 4-Week Selector Tabs */
  .week-selector-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  @media (max-width: 768px) {
    .week-selector-tabs {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .week-tab-btn {
    background: #ffffff;
    border: 2px solid #ffe082;
    border-radius: 14px;
    padding: 0.85rem 1rem;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  }

  .week-tab-btn:hover {
    border-color: #960040;
    background: #fff9e6;
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(150, 0, 64, 0.08);
  }

  .week-tab-btn.active {
    background: linear-gradient(135deg, #fff5cc 0%, #ffeaa3 100%);
    border-color: #960040;
    box-shadow: 0 6px 16px rgba(150, 0, 64, 0.15);
  }

  .week-tab-num {
    font-weight: 700;
    font-size: 1.05rem;
    color: #2a1b1b;
  }

  .week-tab-btn.active .week-tab-num {
    color: #960040;
  }

  .week-tab-dates {
    font-size: 0.85rem;
    color: #6b5151;
    font-weight: 500;
  }

  .week-tab-days-badge {
    align-self: flex-start;
    margin-top: 0.3rem;
    font-size: 0.72rem;
    font-weight: 700;
    background: rgba(150, 0, 64, 0.08);
    color: #960040;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
  }

  /* Summary Banner */
  .week-summary-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #ffffff;
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 14px;
  }

  .week-nav-mini {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .btn-nav-mini {
    background: #fff5cc;
    border: 1px solid #ffe082;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #2a1b1b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-nav-mini:hover:not(:disabled) {
    background: #ffe8a3;
    border-color: #960040;
    color: #960040;
  }

  .btn-nav-mini:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .current-week-pill {
    font-weight: 700;
    font-size: 1rem;
    color: #960040;
    padding: 0.35rem 0.85rem;
    background: #fffdf8;
    border-radius: 10px;
    border: 1px solid #ffe082;
  }

  .special-highlights-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .highlights-label {
    font-weight: 700;
    font-size: 0.85rem;
    color: #2a1b1b;
  }

  .highlights-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .highlight-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #fff5cc;
    border: 1px solid #ffe082;
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
    font-size: 0.82rem;
    color: #2a1b1b;
  }

  .highlight-chip strong {
    color: #960040;
  }

  /* Abbreviations Box */
  .abbreviations-box {
    background: #ffffff;
    border: 1px solid #ffe082;
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .abbr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .abbr-header h4 {
    margin: 0;
    color: #960040;
    font-size: 1.05rem;
  }

  .btn-icon-close {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    color: #9e8585;
  }

  .abbr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.6rem;
  }

  .abbr-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: #fffdf8;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid #ffe082;
  }

  .abbr-code {
    background: #960040;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.78rem;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  .abbr-meaning {
    font-size: 0.85rem;
    color: #2a1b1b;
    font-weight: 500;
  }

  .abbr-footer-note {
    font-size: 0.8rem;
    color: #9e8585;
    border-top: 1px solid #ffe082;
    padding-top: 0.5rem;
  }

  /* Search Results */
  .search-results-panel {
    background: #ffffff;
    border: 2px solid #960040;
    border-radius: 14px;
    padding: 1.25rem;
    box-shadow: 0 10px 30px rgba(150, 0, 64, 0.12);
  }

  .search-results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .search-results-header h3 {
    margin: 0;
    color: #960040;
    font-size: 1.1rem;
  }

  .btn-close-results {
    background: #fff5cc;
    border: 1px solid #ffe082;
    border-radius: 8px;
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #960040;
    cursor: pointer;
  }

  .search-results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 0.85rem;
    max-height: 420px;
    overflow-y: auto;
  }

  .search-result-card {
    background: #fffdf8;
    border: 1px solid #ffe082;
    border-left: 4px solid #960040;
    border-radius: 10px;
    padding: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .search-result-card:hover {
    background: #fff5cc;
    border-color: #960040;
    transform: translateY(-2px);
  }

  .res-card-top {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .res-week-badge {
    background: #960040;
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
  }

  .res-day-badge {
    background: #ffe8a3;
    color: #2a1b1b;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
  }

  .res-time-badge {
    font-size: 0.72rem;
    color: #6b5151;
    font-weight: 500;
  }

  .res-slot-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #2a1b1b;
  }

  .res-match-text {
    font-size: 0.85rem;
    color: #4a3838;
    line-height: 1.35;
    margin: 0;
  }

  /* Desktop Timetable Grid */
  .yla-desktop-grid-container {
    width: 100%;
    overflow-x: auto;
    background: #ffffff;
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  }

  .yla-grid-table {
    display: table;
    width: 100%;
    min-width: 1100px;
    border-collapse: collapse;
  }

  .yla-grid-header-row {
    display: table-row;
    background: #fff5cc;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .yla-grid-slot-row {
    display: table-row;
    border-bottom: 1px solid #f0e6d2;
  }

  .yla-grid-slot-row:hover {
    background: #fffef9;
  }

  .yla-cell {
    display: table-cell;
    padding: 0.65rem 0.6rem;
    vertical-align: top;
    border-right: 1px solid #f0e6d2;
    border-bottom: 1px solid #f0e6d2;
  }

  .yla-cell:last-child {
    border-right: none;
  }

  /* Header Cells */
  .yla-header-cell {
    padding: 0.85rem 0.6rem;
    border-bottom: 2px solid #ffe082;
    text-align: center;
  }

  .time-col-header {
    width: 190px;
    min-width: 190px;
    max-width: 210px;
    background: #fff0b3;
    font-weight: 800;
    font-size: 0.82rem;
    color: #960040;
    letter-spacing: 0.5px;
    text-align: left;
  }

  .day-col-header {
    background: #fff5cc;
  }

  .day-header-name {
    font-size: 1rem;
    font-weight: 700;
    color: #2a1b1b;
  }

  .day-header-date {
    font-size: 0.82rem;
    color: #6b5151;
    font-weight: 600;
    margin-top: 0.1rem;
  }

  .day-header-focus {
    margin-top: 0.35rem;
    background: #ffe8a3;
    border: 1px solid #ffe082;
    border-radius: 12px;
    padding: 0.15rem 0.45rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: #960040;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 100%;
  }

  .focus-text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Slot Label Column */
  .yla-slot-label-cell {
    width: 190px;
    min-width: 190px;
    max-width: 210px;
    background: #fffdf8;
    border-right: 2px solid #ffe082;
    padding: 0.75rem 0.65rem;
  }

  .slot-badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 0.25rem;
    color: #960040;
  }

  .slot-main-label {
    font-size: 0.82rem;
    font-weight: 700;
    color: #2a1b1b;
    line-height: 1.3;
  }

  .slot-time-sub {
    font-size: 0.75rem;
    font-weight: 600;
    color: #9e8585;
    margin-top: 0.25rem;
  }

  /* Slot Content Cell (Clean & Clickable) */
  .yla-slot-content-cell {
    font-size: 0.84rem;
    color: #2a1b1b;
    line-height: 1.35;
    position: relative;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .yla-slot-content-cell.is-clickable {
    cursor: pointer;
  }

  .yla-slot-content-cell.is-clickable:hover {
    background-color: #fff4d6 !important;
    box-shadow: inset 0 0 0 2px #960040;
  }

  .yla-slot-content-cell.has-assigned-teacher {
    box-shadow: inset 0 3px 0 #960040;
  }

  .yla-slot-content-cell.is-empty {
    background: #faf8f5;
    text-align: center;
    vertical-align: middle;
  }

  .empty-slot-placeholder {
    color: #ccc0b0;
    font-size: 0.85rem;
  }

  /* Compact Slot Box */
  .compact-slot-box {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    height: 100%;
    justify-content: flex-start;
  }

  .compact-slot-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    flex-wrap: wrap;
  }

  .compact-slot-time-pill {
    font-size: 0.68rem;
    font-weight: 700;
    color: #960040;
    background: #fff5cc;
    border: 1px solid #ffe082;
    padding: 0.1rem 0.4rem;
    border-radius: 6px;
  }

  /* Inline Teacher Badge / Select */
  .slot-teacher-assign-wrapper {
    display: inline-flex;
    align-items: center;
  }

  .assigned-teacher-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.45rem;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .assigned-teacher-badge .t-avatar {
    font-size: 0.8rem;
  }

  .assigned-teacher-badge .t-name {
    font-weight: 700;
  }

  .btn-clear-teacher {
    background: none;
    border: none;
    font-size: 0.75rem;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    padding: 0 0 0 0.2rem;
    opacity: 0.7;
  }

  .btn-clear-teacher:hover {
    opacity: 1;
  }

  .inline-teacher-select {
    padding: 0.12rem 0.35rem;
    font-size: 0.68rem;
    font-weight: 600;
    color: #7a5c5c;
    background: #fff9e6;
    border: 1px dashed #e0c885;
    border-radius: 6px;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
  }

  .inline-teacher-select:hover {
    background: #fff0b3;
    border-color: #960040;
    color: #960040;
  }

  .compact-slot-title {
    font-size: 0.84rem;
    font-weight: 700;
    color: #2a1b1b;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .compact-keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.1rem;
  }

  .compact-keyword-tag {
    font-size: 0.68rem;
    font-weight: 600;
    color: #5c3838;
    background: rgba(150, 0, 64, 0.06);
    border: 1px solid rgba(150, 0, 64, 0.12);
    padding: 0.08rem 0.35rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .slot-click-hint {
    margin-top: auto;
    padding-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    font-weight: 600;
    color: #960040;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .yla-slot-content-cell:hover .slot-click-hint {
    opacity: 1;
  }

  /* Category Themes & Colors */
  .slot-morning-lecture { background: #fffef5; }
  .slot-morning-practice { background: #fffaf5; }
  .slot-gita { background: #f8fbff; }
  .slot-afternoon-lecture { background: #fcf8f2; }
  .slot-mantra { background: #faf5ff; }
  .slot-reading-basic { background: #f6faff; }
  .slot-reading-advanced { background: #fff9f5; }
  .slot-teaching { background: #fff5f0; }
  .slot-review { background: #fffdf5; }
  .slot-evening-lecture { background: #fcfaf5; }
  .slot-satsang { background: #fffbe8; }
  .slot-ceremony { background: #fff5eb; }
  .slot-exam { background: #fff2f2; }

  /* DETAIL MODAL STYLES */
  .detail-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(42, 27, 27, 0.6);
    backdrop-filter: blur(5px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .detail-modal-card {
    background: #ffffff;
    border: 2px solid #ffe082;
    border-radius: 20px;
    width: 100%;
    max-width: 680px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(150, 0, 64, 0.25);
    overflow: hidden;
  }

  .detail-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #ffe082;
    background: #fffbf0;
  }

  .modal-meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .modal-week-pill {
    background: #960040;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.78rem;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
  }

  .modal-day-pill {
    background: #ffe8a3;
    color: #2a1b1b;
    font-weight: 700;
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
  }

  .modal-category-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: #960040;
    background: #fff5cc;
    border: 1px solid #ffe082;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
  }

  .modal-time-pill {
    font-size: 0.78rem;
    font-weight: 600;
    color: #6b5151;
    background: #f1f5f9;
    padding: 0.2rem 0.55rem;
    border-radius: 8px;
  }

  .btn-modal-close {
    background: none;
    border: none;
    font-size: 1.3rem;
    color: #9e8585;
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    transition: color 0.2s;
  }

  .btn-modal-close:hover {
    color: #960040;
  }

  .detail-modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
  }

  .detail-slot-main-title {
    font-size: 1.4rem;
    color: #960040;
    font-family: 'Playfair Display', serif;
    margin: 0;
    line-height: 1.3;
  }

  .detail-slot-context {
    font-size: 0.88rem;
    color: #6b5151;
  }

  /* Teacher Selection Section */
  .detail-teacher-selection-section {
    background: #fffdf8;
    border: 1.5px solid #ffe082;
    border-radius: 14px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-label-with-icon {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88rem;
    font-weight: 700;
    color: #960040;
  }

  .teacher-chips-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .teacher-select-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border-radius: 10px;
    border: 1.5px solid #e0c885;
    background: #ffffff;
    font-size: 0.88rem;
    font-weight: 700;
    color: #2a1b1b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .teacher-select-btn:hover {
    background: #fff5cc;
    border-color: #960040;
    transform: translateY(-1px);
  }

  .teacher-select-btn.selected {
    box-shadow: 0 4px 12px rgba(150, 0, 64, 0.25);
  }

  .t-btn-avatar {
    font-size: 1.1rem;
  }

  .t-btn-name {
    font-weight: 700;
  }

  .t-btn-check {
    font-weight: 800;
    font-size: 0.9rem;
  }

  .btn-clear-assignment {
    background: #fdf2f2;
    border-color: #ffcdd2;
    color: #c62828;
  }

  .btn-clear-assignment:hover {
    background: #ffebee;
    border-color: #c62828;
  }

  .assignment-notice-box {
    background: #f1f8e9;
    border: 1px solid #c5e1a5;
    border-radius: 8px;
    padding: 0.55rem 0.85rem;
    font-size: 0.82rem;
    color: #33691e;
    line-height: 1.4;
  }

  .detail-special-banner {
    background: #fff5cc;
    border-left: 4px solid #960040;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.88rem;
    color: #2a1b1b;
  }

  .detail-special-banner .banner-icon {
    font-size: 1.3rem;
  }

  .detail-keywords-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .section-label {
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #960040;
  }

  .detail-keywords-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .detail-keyword-chip {
    background: #fffdf8;
    border: 1px solid #ffe082;
    border-radius: 8px;
    padding: 0.3rem 0.65rem;
    font-size: 0.82rem;
    font-weight: 600;
    color: #2a1b1b;
  }

  .detail-full-text-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: #fffdf8;
    border: 1px solid #f0e6d2;
    border-radius: 12px;
    padding: 1.1rem;
  }

  .detail-text-content {
    font-size: 0.95rem;
    color: #2a1b1b;
    line-height: 1.55;
    white-space: pre-line;
    word-break: break-word;
  }

  .detail-modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #ffe082;
    display: flex;
    justify-content: flex-end;
    background: #fffbf0;
  }

  .btn-modal-done {
    background: #960040;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 0.55rem 1.5rem;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-modal-done:hover {
    background: #7d0034;
  }

  /* Mobile View */
  .yla-mobile-view {
    display: none;
  }

  @media (max-width: 1024px) {
    .yla-desktop-grid-container {
      display: none;
    }

    .yla-mobile-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mobile-day-tabs {
      display: flex;
      overflow-x: auto;
      gap: 0.5rem;
      padding-bottom: 0.5rem;
      scrollbar-width: thin;
    }

    .mobile-day-tab-btn {
      flex: 1;
      min-width: 65px;
      padding: 0.6rem 0.4rem;
      background: #ffffff;
      border: 1px solid #ffe082;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mobile-day-tab-btn.active {
      background: #960040;
      border-color: #960040;
      color: #ffffff;
    }

    .m-day-name {
      font-weight: 700;
      font-size: 0.95rem;
    }

    .mobile-day-tab-btn.active .m-day-name {
      color: #ffffff;
    }

    .m-day-date {
      font-size: 0.72rem;
      color: #6b5151;
    }

    .mobile-day-tab-btn.active .m-day-date {
      color: #ffe082;
    }

    .mobile-day-feed {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mobile-day-header-card {
      padding: 1rem 1.25rem;
      border: 1px solid #ffe082;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .m-card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .m-card-title-row h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #2a1b1b;
    }

    .m-week-tag {
      background: #fff5cc;
      color: #960040;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
    }

    .mobile-special-focus-box {
      background: #fff5cc;
      border-left: 3px solid #960040;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #2a1b1b;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .mobile-slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mobile-slot-card {
      padding: 1rem;
      border: 1px solid #ffe082;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      transition: all 0.2s;
    }

    .mobile-slot-card.is-clickable:hover {
      border-color: #960040;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(150, 0, 64, 0.1);
    }

    .m-slot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .m-slot-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #960040;
      text-transform: uppercase;
    }

    .m-slot-time {
      font-size: 0.78rem;
      font-weight: 600;
      color: #6b5151;
      background: #fff5cc;
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
    }

    .mobile-assigned-teacher-row {
      margin-top: 0.2rem;
    }

    .m-slot-title {
      font-weight: 700;
      font-size: 0.95rem;
      color: #2a1b1b;
    }

    .m-keywords-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-top: 0.2rem;
    }

    .m-click-note {
      font-size: 0.72rem;
      color: #960040;
      font-weight: 600;
      margin-top: 0.3rem;
    }
  }

  /* Footer */
  .yla-view-footer {
    text-align: center;
    padding: 1rem 0;
    color: #9e8585;
    font-size: 0.82rem;
  }

  /* Print Styles */
  @media print {
    :global(body) {
      background: #ffffff !important;
    }

    .yla-controls-row,
    .btn-nav-mini,
    .btn-clear-search,
    .mobile-day-tabs,
    .detail-modal-backdrop,
    .slot-teacher-assign-wrapper,
    :global(.sidebar),
    :global(.top-header),
    :global(.view-header) {
      display: none !important;
    }

    .yla-view-wrapper {
      padding: 0;
      box-shadow: none;
    }

    .yla-top-bar,
    .week-summary-banner,
    .yla-desktop-grid-container {
      box-shadow: none !important;
      border: 1px solid #ccc !important;
    }

    .yla-desktop-grid-container {
      display: block !important;
      overflow: visible !important;
    }

    .yla-grid-table {
      min-width: 100% !important;
      font-size: 9pt !important;
    }
  }
</style>
