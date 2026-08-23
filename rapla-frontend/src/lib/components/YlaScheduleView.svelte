<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    getYlaWeeks, 
    getYlaWeek, 
    setYlaAssignment,
    getYlaAssignments,
    getYlaTeacherMeta,
    getYlaCleanShortTitle,
    YLA_TEACHERS,
    YLA_TEACHERS_META,
    type YlaWeek, 
    type YlaDayEntry, 
    type YlaDay, 
    type YlaSlot,
    type YlaTeacherName
  } from '$lib/ylaData';
  import { db, type Teacher } from '$lib/db';

  // Props
  let { initialWeek = 1, readOnly = false, onWeekChange }: { initialWeek?: number; readOnly?: boolean; onWeekChange?: (week: number) => void } = $props();

  let assignmentsMap = $state<Record<string, string>>({});
  let selectedWeekNumber = $state(initialWeek || 1);
  let activeMobileDayIndex = $state(0);
  let isFullscreen = $state(false);
  let searchQuery = $state('');
  let showAbbreviations = $state(false);
  let userRole = $state('');
  let allTeachersList = $state<Teacher[]>([]);

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

  let isAdmin = $derived(!readOnly && userRole === 'admin');

  // Load and subscribe to assignments
  function refreshAssignments() {
    assignmentsMap = getYlaAssignments();
  }

  onMount(() => {
    userRole = localStorage.getItem('rapla_user_role') || '';
    try {
      allTeachersList = db.getTeachers();
    } catch (e) {
      allTeachersList = [];
    }

    refreshAssignments();
    const handleStorage = () => refreshAssignments();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('yla-assignment-changed', handleStorage);

    // Fullscreen change listener
    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDetailModal) {
          closeSlotDetail();
        } else if (isFullscreen) {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('yla-assignment-changed', handleStorage);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
    if (!container) {
      isFullscreen = !isFullscreen;
      return;
    }

    if (!document.fullscreenElement && !isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().then(() => {
          isFullscreen = true;
        }).catch(() => {
          isFullscreen = true;
        });
      } else {
        isFullscreen = true;
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          isFullscreen = false;
        }).catch(() => {
          isFullscreen = false;
        });
      } else {
        isFullscreen = false;
      }
    }
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
    if (!isAdmin) return;
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
</script>

<div id="yla-schedule-container" class="yla-view-wrapper" class:fullscreen-active={isFullscreen}>
  
  <!-- ========================================================================= -->
  <!-- FULLSCREEN TOP BAR (Ultra-compact single row for seamless monitor fitting) -->
  <!-- ========================================================================= -->
  {#if isFullscreen}
    <div class="fs-top-bar glass-card">
      <div class="fs-brand-section">
        <span class="fs-brand-badge">🧘 4-wöchige YLA</span>
        <span class="fs-brand-sub" title={currentWeek.title}>Yogalehrerausbildung</span>
      </div>

      <!-- Quick 1-Click Week Switcher Pills in Fullscreen -->
      <div class="fs-week-switcher">
        {#each allWeeks as week}
          {@const isActive = week.weekNumber === selectedWeekNumber}
          <button 
            type="button" 
            class="fs-week-btn" 
            class:active={isActive}
            onclick={() => selectWeek(week.weekNumber)}
            title={week.weekSubtitle}
          >
            <span class="fs-w-title">Woche {week.weekNumber}</span>
            <span class="fs-w-dates">{week.dateRange.replace('.2026', '').replace('/2026', '')}</span>
          </button>
        {/each}
      </div>

      <!-- Fullscreen Action Controls -->
      <div class="fs-actions">
        <button 
          type="button" 
          class="btn-fs-exit" 
          onclick={toggleFullscreen}
          title="Vollbild beenden (Taste Esc)"
        >
          <span class="fs-exit-icon">✕</span>
          <span class="fs-exit-label">Vollbild beenden</span>
          <kbd class="fs-esc-key">Esc</kbd>
        </button>
      </div>
    </div>

    <!-- Special Days Slim Ribbon in Fullscreen (if any) -->
    {#if specialDays.length > 0}
      <div class="fs-special-ribbon">
        <span class="fs-ribbon-label">Besonderheiten:</span>
        <div class="fs-ribbon-chips">
          {#each specialDays as sd}
            <span class="fs-ribbon-chip">
              <span>{getSpecialFocusIcon(sd.specialFocus)}</span>
              <strong>{sd.dayName} ({sd.dateStr}):</strong>
              <span>{sd.specialFocus}</span>
            </span>
          {/each}
        </div>
      </div>
    {/if}

  {:else}

    <!-- ========================================================================= -->
    <!-- STANDARD TOP BAR (Clean view: Title & Fullscreen function only) -->
    <!-- ========================================================================= -->
    <div class="yla-top-bar">
      <h2 class="yla-main-title">{currentWeek.title}</h2>
      <div class="yla-top-actions">
        <button 
          type="button" 
          class="btn yla-btn-action btn-fullscreen-main" 
          onclick={toggleFullscreen}
          title="Vollbildmodus aktivieren"
        >
          🖥️ Vollbild
        </button>
      </div>
    </div>

    <!-- Active Week Summary Banner in Standard View -->
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
            ◀
          </button>

          <div class="week-nav-pills">
            {#each allWeeks as week}
              {@const isActive = week.weekNumber === selectedWeekNumber}
              <button 
                type="button" 
                class="btn-week-pill" 
                class:active={isActive}
                onclick={() => selectWeek(week.weekNumber)}
                title="{week.weekSubtitle}"
              >
                Woche {week.weekNumber}
              </button>
            {/each}
          </div>

          <button 
            type="button" 
            class="btn-nav-mini" 
            disabled={selectedWeekNumber >= allWeeks.length}
            onclick={() => navigateWeek(1)}
            title="Nächste Woche"
          >
            ▶
          </button>

          <span class="current-week-pill">
            {currentWeek.weekSubtitle}
          </span>
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
  {/if}

  <!-- ========================================================================= -->
  <!-- DESKTOP TIMETABLE GRID (Compact, Clean & Responsive for 1-Screen Overview) -->
  <!-- ========================================================================= -->
  <div class="yla-desktop-grid-container" class:fs-grid-container={isFullscreen}>
    <div class="yla-grid-table" class:fs-grid-table={isFullscreen}>
      
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

      <!-- Grid Body Rows (Slots) -->
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
            {@const hasContent = !!(entry && (entry.text || entry.shortTitle))}
            
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="yla-cell yla-slot-content-cell {getSlotStyleClass(slot.type)}" 
              class:is-empty={!hasContent}
              class:is-clickable={hasContent}
              class:has-assigned-teacher={!!assignedTeacher}
              onclick={() => hasContent && openSlotDetail(day, slot, entry)}
              title={hasContent ? (entry?.fullText ? `${entry.fullText}\n\n👉 Klicken für Details${isAdmin ? ' & Zuweisung' : ''}` : `Klicken für Details${isAdmin ? ' & Zuweisung' : ''}`) : ''}
            >
              {#if hasContent && entry}
                <div class="compact-slot-box">
                  
                  <!-- Optional sub-time pill -->
                  {#if entry.time}
                    <div class="slot-box-time-row">
                      <span class="compact-slot-time-pill">{entry.time}</span>
                    </div>
                  {/if}

                  <!-- PRIMARY CONCISE TITLE (No clutter, crisp & clear) -->
                  <div class="compact-slot-title" title={entry.fullText || entry.text}>
                    {getYlaCleanShortTitle(entry, slot.label)}
                  </div>

                  <!-- ASSIGNED PERSON BADGE (Prominent & Clean) -->
                  {#if assignedTeacher}
                    {@const meta = getYlaTeacherMeta(assignedTeacher)}
                    <div 
                      class="assigned-person-badge" 
                      style="color: {meta.color}; background: {meta.badgeBg}; border: 1px solid {meta.color}40;"
                      title="Eingeteilt: {assignedTeacher}{isAdmin ? ' (Klicken zum Bearbeiten)' : ''}"
                    >
                      <span class="person-avatar">{meta.avatar}</span>
                      <span class="person-name">{assignedTeacher}</span>
                    </div>
                  {:else if isAdmin}
                    <div class="admin-unassigned-pill" title="Klicken zum Zuweisen einer Lehrkraft">
                      <span class="plus-icon">+</span>
                      <span>Zuweisen</span>
                    </div>
                  {/if}

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

  <!-- ========================================================================= -->
  <!-- MOBILE / TABLET DAY ACCORDION & CARDS VIEW -->
  <!-- ========================================================================= -->
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

                <!-- Title on Mobile -->
                <div class="m-slot-title">{getYlaCleanShortTitle(entry, slot.label)}</div>

                <!-- Mobile Teacher Badge -->
                {#if assignedTeacher}
                  {@const meta = getYlaTeacherMeta(assignedTeacher)}
                  <div class="mobile-assigned-teacher-row">
                    <span class="assigned-person-badge" style="color: {meta.color}; background: {meta.badgeBg}; border: 1px solid {meta.color}40;">
                      <span>{meta.avatar}</span>
                      <strong>{assignedTeacher}</strong>
                    </span>
                  </div>
                {:else if isAdmin}
                  <div class="mobile-assigned-teacher-row">
                    <span class="admin-unassigned-pill">+ Lehrkraft zuweisen</span>
                  </div>
                {/if}

                <div class="m-click-note">
                  <span>{isAdmin ? 'ℹ️ Tippen für alle Details & Zuweisung' : 'ℹ️ Tippen für alle Details'}</span>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- ========================================================================= -->
  <!-- INTERACTIVE SLOT DETAIL MODAL (With full teacher assignment for Admin) -->
  <!-- ========================================================================= -->
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
            {getYlaCleanShortTitle(activeDetailModal.entry, activeDetailModal.slotLabel)}
          </h2>

          <!-- Slot label context -->
          <div class="detail-slot-context">
            <strong>Einheit:</strong> {activeDetailModal.slotLabel}
          </div>

          <!-- TEACHER ASSIGNMENT SECTION (Interactive for Admin, clear for Team) -->
          <div class="detail-teacher-selection-section glass-card">
            <div class="section-label-with-icon">
              <span>👤</span>
              <strong>{isAdmin ? 'Lehrkraft für diese YLA-Einheit einteilen:' : 'Eingeteilte Lehrkraft:'}</strong>
            </div>

            {#if isAdmin}
              <!-- Admin Interactive Selector -->
              <div class="admin-assignment-controls">
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
                </div>

                <!-- Extended Selector for other Sevakas / Teachers -->
                <div class="extended-teacher-select-row">
                  <span class="extended-select-label">Weitere Lehrkraft:</span>
                  <select 
                    class="extended-teacher-dropdown"
                    value={YLA_TEACHERS.includes(currentAssigned as any) ? '' : (currentAssigned || '')}
                    onchange={(e) => {
                      const val = (e.target as HTMLSelectElement).value;
                      if (val) {
                        assignTeacherToSlot(activeDetailModal!.weekNumber, activeDetailModal!.dayCol, activeDetailModal!.slotRowNumber, val);
                      }
                    }}
                  >
                    <option value="">-- Weiteren Sevaka / Lehrer auswählen --</option>
                    {#each allTeachersList.filter(t => !YLA_TEACHERS.includes(t.name as any)) as t}
                      <option value={t.name}>{t.name} ({t.roleType === 'sevaka' ? 'Kernteam' : 'Lehrer'})</option>
                    {/each}
                  </select>

                  {#if currentAssigned}
                    <button 
                      type="button" 
                      class="btn-clear-assignment"
                      onclick={() => assignTeacherToSlot(activeDetailModal!.weekNumber, activeDetailModal!.dayCol, activeDetailModal!.slotRowNumber, null)}
                      title="Zuweisung aufheben"
                    >
                      ✕ Zuweisung aufheben
                    </button>
                  {/if}
                </div>
              </div>

              {#if currentAssigned}
                <div class="assignment-notice-box success-notice">
                  <span>✓ <strong>{currentAssigned}</strong> ist fest für diese Einheit eingeteilt und im Wochenplan geblockt.</span>
                </div>
              {:else}
                <div class="assignment-notice-box neutral-notice">
                  <span>ℹ️ Für diese Einheit ist noch keine Lehrkraft ausgewählt.</span>
                </div>
              {/if}

            {:else}
              <!-- Team / Viewer Read-Only Display -->
              {#if currentAssigned}
                {@const meta = getYlaTeacherMeta(currentAssigned)}
                <div class="team-view-assigned-badge" style="color: {meta.color}; background: {meta.badgeBg}; border: 1.5px solid {meta.color}50;">
                  <span class="badge-avatar">{meta.avatar}</span>
                  <span class="badge-text">Unterrichtet von: <strong>{currentAssigned}</strong></span>
                </div>
              {:else}
                <div class="team-view-unassigned-note">
                  <span>ℹ️ Für diese Einheit ist noch keine Lehrkraft eingeteilt.</span>
                </div>
              {/if}
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

          <!-- Full Content / Description Box -->
          <div class="detail-full-text-box">
            <span class="section-label">Vollständige Beschreibung & Details:</span>
            <div class="detail-text-content">
              {activeDetailModal.entry.fullText || activeDetailModal.entry.text}
            </div>
          </div>

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

        </div>

        <!-- Modal Footer -->
        <div class="detail-modal-footer">
          <button type="button" class="btn btn-secondary btn-modal-done" onclick={closeSlotDetail}>
            Schließen
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Bottom Footer Note (Only in regular view) -->
  {#if !isFullscreen}
    <footer class="yla-view-footer">
      <div class="footer-links">
        <span>{currentWeek.contactInfo}</span>
      </div>
    </footer>
  {/if}

</div>

<style>
  /* ========================================================================= */
  /* WRAPPER & CONTAINER */
  /* ========================================================================= */
  .yla-view-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding-bottom: 2rem;
    box-sizing: border-box;
  }

  /* FULLSCREEN MODE: Fits 100% within monitor height without scrolling */
  .fullscreen-active,
  .yla-view-wrapper:fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 99999 !important;
    background: #fbf9f4 !important;
    padding: 0.4rem 0.6rem !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.35rem !important;
    box-sizing: border-box !important;
  }

  /* ========================================================================= */
  /* FULLSCREEN TOP BAR */
  /* ========================================================================= */
  .fs-top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.35rem 0.75rem;
    background: #ffffff;
    border: 1px solid #ffe082;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(150, 0, 64, 0.05);
    flex-shrink: 0;
    min-height: 42px;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .fs-brand-section {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
    min-width: 0;
  }

  .fs-brand-badge {
    background: #fff5cc;
    color: #960040;
    font-weight: 800;
    font-size: 0.8rem;
    padding: 0.2rem 0.55rem;
    border-radius: 12px;
    border: 1px solid #ffe082;
    white-space: nowrap;
  }

  .fs-brand-sub {
    font-size: 0.82rem;
    font-weight: 700;
    color: #2a1b1b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fs-week-switcher {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
  }

  .fs-week-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: #fffdf8;
    border: 1.5px solid #ffe082;
    border-radius: 8px;
    padding: 0.22rem 0.55rem;
    cursor: pointer;
    font-size: 0.76rem;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .fs-week-btn:hover {
    border-color: #960040;
    background: #fff5cc;
    color: #960040;
  }

  .fs-week-btn.active {
    background: #960040;
    border-color: #960040;
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(150, 0, 64, 0.2);
  }

  .fs-week-btn.active .fs-w-dates {
    color: #ffe082;
  }

  .fs-w-title {
    font-weight: 700;
  }

  .fs-w-dates {
    font-size: 0.68rem;
    color: #785858;
  }

  .fs-actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
    margin-left: auto;
  }

  .btn-fs-exit {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #960040;
    color: #ffffff;
    border: 1px solid #7d0034;
    border-radius: 8px;
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(150, 0, 64, 0.2);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-fs-exit:hover {
    background: #7d0034;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(150, 0, 64, 0.3);
  }

  .fs-exit-icon {
    font-size: 0.85rem;
    font-weight: bold;
  }

  .fs-esc-key {
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    padding: 0.05rem 0.3rem;
    font-size: 0.65rem;
    font-family: inherit;
    font-weight: 600;
    margin-left: 0.2rem;
  }

  .fs-special-ribbon {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #fff8e1;
    border: 1px solid #ffe082;
    border-radius: 8px;
    padding: 0.15rem 0.5rem;
    font-size: 0.72rem;
    flex-shrink: 0;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: thin;
    max-width: 100%;
    box-sizing: border-box;
  }

  .fs-ribbon-label {
    font-weight: 700;
    color: #960040;
    flex-shrink: 0;
  }

  .fs-ribbon-chips {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: nowrap;
  }

  .fs-ribbon-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    color: #2a1b1b;
    flex-shrink: 0;
  }

  .fs-ribbon-chip strong {
    color: #960040;
  }

  .fullscreen-active .yla-mobile-view {
    display: none !important;
  }

  @media (max-width: 1100px) {
    .fs-w-dates {
      display: none;
    }
    .fs-brand-sub {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .fs-exit-label {
      display: none;
    }
    .fs-esc-key {
      display: none;
    }
    .btn-fs-exit {
      padding: 0.3rem 0.5rem;
    }
  }

  /* ========================================================================= */
  /* STANDARD TOP BAR (Title & Fullscreen only) */
  /* ========================================================================= */
  .yla-top-bar {
    background: var(--bg-card, #ffffff);
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 16px;
    padding: 1.25rem 1.75rem;
    box-shadow: 0 4px 18px rgba(150, 0, 64, 0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .yla-main-title {
    font-size: 1.45rem;
    color: #2a1b1b;
    margin: 0;
    font-family: 'Playfair Display', serif;
    flex: 1;
    min-width: 260px;
  }

  .yla-top-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .yla-btn-action {
    background: #fff5cc;
    color: #2a1b1b;
    border: 1px solid #ffe082;
    border-radius: 10px;
    padding: 0.5rem 0.9rem;
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

  .btn-fullscreen-main {
    background: linear-gradient(135deg, #fff5cc 0%, #ffeaa3 100%);
    border: 1.5px solid #960040;
    color: #960040;
    font-weight: 700;
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  .btn-fullscreen-main:hover {
    background: #ffeaa3;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(150, 0, 64, 0.15);
  }

  /* Summary Banner */
  .week-summary-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: #ffffff;
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 12px;
  }

  .week-nav-mini {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .week-nav-pills {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .btn-week-pill {
    background: #fffdf8;
    border: 1.5px solid #ffe082;
    color: #2a1b1b;
    font-weight: 600;
    font-size: 0.82rem;
    padding: 0.3rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-week-pill:hover {
    border-color: #960040;
    background: #fff5cc;
    color: #960040;
  }

  .btn-week-pill.active {
    background: #960040;
    border-color: #960040;
    color: #ffffff;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(150, 0, 64, 0.2);
  }

  .btn-nav-mini {
    background: #fff5cc;
    border: 1px solid #ffe082;
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #2a1b1b;
    cursor: pointer;
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
    font-size: 0.95rem;
    color: #960040;
    padding: 0.3rem 0.75rem;
    background: #fffdf8;
    border-radius: 8px;
    border: 1px solid #ffe082;
  }

  .special-highlights-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .highlights-label {
    font-weight: 700;
    font-size: 0.82rem;
    color: #2a1b1b;
  }

  .highlights-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .highlight-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: #fff5cc;
    border: 1px solid #ffe082;
    border-radius: 16px;
    padding: 0.2rem 0.65rem;
    font-size: 0.78rem;
    color: #2a1b1b;
  }

  .highlight-chip strong {
    color: #960040;
  }

  /* ========================================================================= */
  /* DESKTOP TIMETABLE GRID (Compact & Fullscreen Fit) */
  /* ========================================================================= */
  .yla-desktop-grid-container {
    width: 100%;
    overflow-x: auto;
    background: #ffffff;
    border: 1px solid var(--border-color, #ffe082);
    border-radius: 14px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
  }

  /* Fullscreen grid container takes full remaining height */
  .fs-grid-container {
    flex: 1 !important;
    min-height: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow-x: auto !important;
    overflow-y: auto !important;
    box-shadow: none !important;
    border-radius: 10px !important;
  }

  .yla-grid-table {
    display: table;
    width: 100%;
    min-width: 1000px;
    border-collapse: collapse;
  }

  /* In fullscreen, table distributes rows equally to fit in 1 screen */
  .fs-grid-table {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    min-height: 100% !important;
    min-width: 100% !important;
  }

  .yla-grid-header-row {
    display: table-row;
    background: #fff5cc;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .fs-grid-table .yla-grid-header-row {
    display: flex !important;
    flex-shrink: 0 !important;
    min-height: 34px !important;
  }

  .yla-grid-slot-row {
    display: table-row;
    border-bottom: 1px solid #f0e6d2;
  }

  .fs-grid-table .yla-grid-slot-row {
    display: flex !important;
    flex: 1 !important;
    min-height: 0 !important;
    border-bottom: 1px solid #f0e6d2 !important;
  }

  .yla-grid-slot-row:hover {
    background: #fffef9;
  }

  .yla-cell {
    display: table-cell;
    padding: 0.4rem 0.5rem;
    vertical-align: top;
    border-right: 1px solid #f0e6d2;
    border-bottom: 1px solid #f0e6d2;
    box-sizing: border-box;
  }

  .fs-grid-table .yla-cell {
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    padding: 0.2rem 0.35rem !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  .yla-cell:last-child {
    border-right: none;
  }

  /* Header Cells */
  .yla-header-cell {
    padding: 0.6rem 0.5rem;
    border-bottom: 2px solid #ffe082;
    text-align: center;
  }

  .fs-grid-table .yla-header-cell {
    padding: 0.3rem 0.4rem !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .time-col-header {
    width: 155px;
    min-width: 155px;
    max-width: 170px;
    background: #fff0b3;
    font-weight: 800;
    font-size: 0.78rem;
    color: #960040;
    letter-spacing: 0.5px;
    text-align: left;
  }

  .fs-grid-table .time-col-header {
    width: 140px !important;
    min-width: 140px !important;
    max-width: 140px !important;
    flex-shrink: 0 !important;
  }

  .day-col-header {
    background: #fff5cc;
  }

  .fs-grid-table .day-col-header {
    flex: 1 !important;
    min-width: 0 !important;
  }

  .day-header-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #2a1b1b;
  }

  .fs-grid-table .day-header-name {
    font-size: 0.85rem;
  }

  .day-header-date {
    font-size: 0.78rem;
    color: #6b5151;
    font-weight: 600;
  }

  .fs-grid-table .day-header-date {
    font-size: 0.72rem;
  }

  .day-header-focus {
    margin-top: 0.2rem;
    background: #ffe8a3;
    border: 1px solid #ffe082;
    border-radius: 10px;
    padding: 0.1rem 0.4rem;
    font-size: 0.68rem;
    font-weight: 600;
    color: #960040;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    max-width: 100%;
  }

  .focus-text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Slot Label Column */
  .yla-slot-label-cell {
    width: 155px;
    min-width: 155px;
    max-width: 170px;
    background: #fffdf8;
    border-right: 2px solid #ffe082;
    padding: 0.45rem 0.5rem;
  }

  .fs-grid-table .yla-slot-label-cell {
    width: 140px !important;
    min-width: 140px !important;
    max-width: 140px !important;
    flex-shrink: 0 !important;
    padding: 0.2rem 0.4rem !important;
  }

  .slot-badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    color: #960040;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slot-main-label {
    font-size: 0.76rem;
    font-weight: 700;
    color: #2a1b1b;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .fs-grid-table .slot-main-label {
    font-size: 0.72rem;
    -webkit-line-clamp: 1;
  }

  .slot-time-sub {
    font-size: 0.7rem;
    font-weight: 600;
    color: #8c7070;
    margin-top: 0.1rem;
  }

  /* Slot Content Cell (Clean, Concise & Clickable) */
  .yla-slot-content-cell {
    font-size: 0.8rem;
    color: #2a1b1b;
    line-height: 1.25;
    position: relative;
    transition: all 0.15s ease-in-out;
  }

  .fs-grid-table .yla-slot-content-cell {
    flex: 1 !important;
    min-width: 0 !important;
  }

  .yla-slot-content-cell.is-clickable {
    cursor: pointer;
  }

  .yla-slot-content-cell.is-clickable:hover {
    background-color: #fff2cc !important;
    box-shadow: inset 0 0 0 2px #960040;
  }

  .yla-slot-content-cell.has-assigned-teacher {
    border-left: 3px solid #960040;
  }

  .yla-slot-content-cell.is-empty {
    background: #faf8f5;
    text-align: center;
    vertical-align: middle;
  }

  .empty-slot-placeholder {
    color: #d6ccbe;
    font-size: 0.8rem;
  }

  /* ========================================================================= */
  /* COMPACT SLOT BOX (ONLY SHORT TITLE + ASSIGNED PERSON) */
  /* ========================================================================= */
  .compact-slot-box {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    height: 100%;
    justify-content: center;
    overflow: hidden;
  }

  .slot-box-time-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .compact-slot-time-pill {
    font-size: 0.65rem;
    font-weight: 700;
    color: #960040;
    background: #fff5cc;
    border: 1px solid #ffe082;
    padding: 0.05rem 0.35rem;
    border-radius: 4px;
    line-height: 1.2;
  }

  /* Concise Primary Title */
  .compact-slot-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #2a1b1b;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
  }

  .fs-grid-table .compact-slot-title {
    font-size: 0.74rem;
    -webkit-line-clamp: 2;
  }

  /* Assigned Person Badge */
  .assigned-person-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.12rem 0.45rem;
    border-radius: 12px;
    font-size: 0.72rem;
    font-weight: 700;
    width: fit-content;
    max-width: 100%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fs-grid-table .assigned-person-badge {
    font-size: 0.68rem;
    padding: 0.08rem 0.35rem;
  }

  .person-avatar {
    font-size: 0.75rem;
  }

  .person-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .admin-unassigned-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.68rem;
    font-weight: 600;
    color: #8c7070;
    background: #fff9e6;
    border: 1px dashed #e0c885;
    border-radius: 10px;
    padding: 0.08rem 0.35rem;
    width: fit-content;
    line-height: 1.2;
    transition: all 0.2s;
  }

  .admin-unassigned-pill:hover {
    background: #fff0b3;
    border-color: #960040;
    color: #960040;
  }

  .plus-icon {
    font-weight: 800;
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
  .slot-default { background: #fffdf8; }

  /* ========================================================================= */
  /* DETAIL MODAL STYLES */
  /* ========================================================================= */
  .detail-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(42, 27, 27, 0.65);
    backdrop-filter: blur(4px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
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
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid #ffe082;
    background: #fffbf0;
  }

  .modal-meta-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .modal-week-pill {
    background: #960040;
    color: #ffffff;
    font-weight: 700;
    font-size: 0.76rem;
    padding: 0.2rem 0.55rem;
    border-radius: 12px;
  }

  .modal-day-pill {
    background: #ffe8a3;
    color: #2a1b1b;
    font-weight: 700;
    font-size: 0.78rem;
    padding: 0.2rem 0.55rem;
    border-radius: 12px;
  }

  .modal-category-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.76rem;
    font-weight: 700;
    color: #960040;
    background: #fff5cc;
    border: 1px solid #ffe082;
    padding: 0.2rem 0.55rem;
    border-radius: 12px;
  }

  .modal-time-pill {
    font-size: 0.76rem;
    font-weight: 600;
    color: #6b5151;
    background: #f1f5f9;
    padding: 0.2rem 0.5rem;
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
    padding: 1.25rem 1.5rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detail-slot-main-title {
    font-size: 1.35rem;
    color: #960040;
    font-family: 'Playfair Display', serif;
    margin: 0;
    line-height: 1.3;
  }

  .detail-slot-context {
    font-size: 0.85rem;
    color: #6b5151;
  }

  /* Teacher Selection Card */
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
    font-size: 0.9rem;
    color: #960040;
  }

  .admin-assignment-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .teacher-chips-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .teacher-select-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #ffffff;
    border: 1.5px solid #ffe082;
    border-radius: 20px;
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 600;
    color: #2a1b1b;
    transition: all 0.2s;
  }

  .teacher-select-btn:hover {
    border-color: #960040;
    background: #fff5cc;
    transform: translateY(-1px);
  }

  .teacher-select-btn.selected {
    box-shadow: 0 4px 10px rgba(150, 0, 64, 0.2);
  }

  .t-btn-avatar {
    font-size: 0.95rem;
  }

  .t-btn-name {
    font-weight: 700;
  }

  .t-btn-check {
    font-weight: 800;
    margin-left: 0.2rem;
  }

  .extended-teacher-select-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    padding-top: 0.4rem;
    border-top: 1px dashed #f0e6d2;
  }

  .extended-select-label {
    font-size: 0.8rem;
    color: #6b5151;
    font-weight: 600;
  }

  .extended-teacher-dropdown {
    flex: 1;
    min-width: 220px;
    padding: 0.4rem 0.6rem;
    border: 1px solid #ffe082;
    border-radius: 8px;
    background: #ffffff;
    font-size: 0.82rem;
    color: #2a1b1b;
    outline: none;
  }

  .btn-clear-assignment {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #991b1b;
    border-radius: 8px;
    padding: 0.4rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-clear-assignment:hover {
    background: #fecaca;
  }

  .assignment-notice-box {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-size: 0.82rem;
    line-height: 1.35;
  }

  .success-notice {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    color: #065f46;
  }

  .neutral-notice {
    background: #f8fafc;
    border-left: 4px solid #94a3b8;
    color: #475569;
  }

  /* Team View Teacher Card */
  .team-view-assigned-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 12px;
    font-size: 0.95rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }

  .badge-avatar {
    font-size: 1.2rem;
  }

  .team-view-unassigned-note {
    font-size: 0.85rem;
    color: #94a3b8;
    font-style: italic;
  }

  .detail-special-banner {
    background: #fff5cc;
    border-left: 4px solid #960040;
    border-radius: 8px;
    padding: 0.65rem 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #2a1b1b;
  }

  .detail-full-text-box {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background: #fffdf8;
    border: 1px solid #f0e6d2;
    border-radius: 12px;
    padding: 0.9rem;
  }

  .section-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #960040;
  }

  .detail-text-content {
    font-size: 0.9rem;
    color: #2a1b1b;
    line-height: 1.5;
    white-space: pre-line;
    word-break: break-word;
  }

  .detail-keywords-section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .detail-keywords-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .detail-keyword-chip {
    background: #fffdf8;
    border: 1px solid #ffe082;
    border-radius: 8px;
    padding: 0.25rem 0.55rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: #2a1b1b;
  }

  .detail-modal-footer {
    padding: 0.85rem 1.4rem;
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
    padding: 0.5rem 1.4rem;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-modal-done:hover {
    background: #7d0034;
  }

  /* ========================================================================= */
  /* SEARCH & ABBREVIATIONS OVERLAYS */
  /* ========================================================================= */

  /* ========================================================================= */
  /* MOBILE / TABLET VIEW */
  /* ========================================================================= */
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
      gap: 0.85rem;
    }

    .mobile-day-tabs {
      display: flex;
      overflow-x: auto;
      gap: 0.4rem;
      padding-bottom: 0.4rem;
      scrollbar-width: thin;
    }

    .mobile-day-tab-btn {
      flex: 1;
      min-width: 60px;
      padding: 0.5rem 0.35rem;
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
      font-size: 0.9rem;
    }

    .mobile-day-tab-btn.active .m-day-name {
      color: #ffffff;
    }

    .m-day-date {
      font-size: 0.7rem;
      color: #6b5151;
    }

    .mobile-day-tab-btn.active .m-day-date {
      color: #ffe082;
    }

    .mobile-day-feed {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .mobile-day-header-card {
      padding: 0.85rem 1rem;
      border: 1px solid #ffe082;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .m-card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .m-card-title-row h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #2a1b1b;
    }

    .m-week-tag {
      background: #fff5cc;
      color: #960040;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 10px;
    }

    .mobile-special-focus-box {
      background: #fff5cc;
      border-left: 3px solid #960040;
      padding: 0.45rem 0.65rem;
      border-radius: 8px;
      font-size: 0.82rem;
      color: #2a1b1b;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .mobile-slots-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .mobile-slot-card {
      padding: 0.85rem;
      border: 1px solid #ffe082;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      transition: all 0.2s;
    }

    .mobile-slot-card.is-clickable:hover {
      border-color: #960040;
      transform: translateY(-1px);
    }

    .m-slot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .m-slot-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: #960040;
      text-transform: uppercase;
    }

    .m-slot-time {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b5151;
      background: #fff5cc;
      padding: 0.1rem 0.4rem;
      border-radius: 6px;
    }

    .m-slot-title {
      font-weight: 700;
      font-size: 0.9rem;
      color: #2a1b1b;
    }

    .mobile-assigned-teacher-row {
      display: flex;
      align-items: center;
      margin-top: 0.1rem;
    }

    .m-click-note {
      font-size: 0.7rem;
      color: #960040;
      font-weight: 600;
      margin-top: 0.2rem;
    }
  }

  /* Footer */
  .yla-view-footer {
    text-align: center;
    padding: 0.75rem 0;
    color: #9e8585;
    font-size: 0.8rem;
  }

  /* Print Styles */
  @media print {
    :global(body) {
      background: #ffffff !important;
    }

    .yla-controls-row,
    .fs-top-bar,
    .btn-nav-mini,
    .btn-clear-search,
    .mobile-day-tabs,
    .detail-modal-backdrop,
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
      font-size: 8.5pt !important;
    }
  }
</style>

