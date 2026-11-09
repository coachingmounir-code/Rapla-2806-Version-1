<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getSeminarsForWeek,
    getDaysForSeminarWeek,
    getEffectiveSeminarSlotsForDay,
    getSeminarTransitionType,
    SEMINAR_ROOMS,
    getSeminarRoomDisplayName,
    getSeminarRoomShortName,
    getLeaderShortName,
    isIndoorSeminarRoomSlot,
    type SeminarSlot,
    type Seminar
  } from '$lib/seminarData';
  import { db, type Teacher } from '$lib/db';
  import { isDateInYlaRange } from '$lib/ylaData';

  interface Props {
    currentWeekCode?: string;
    onNavigateWeek?: (delta: number) => void;
    onGoToCurrentWeek?: () => void;
    onSwitchToOccupancy?: (roomId?: string) => void;
    onClose?: () => void;
    isAdmin?: boolean;
    selectedTeacher?: Teacher | null;
    onlyMySlots?: boolean;
  }

  let {
    currentWeekCode = '2026-W45',
    onNavigateWeek,
    onGoToCurrentWeek,
    onSwitchToOccupancy,
    onClose,
    isAdmin = false,
    selectedTeacher = null,
    onlyMySlots = false
  }: Props = $props();

  interface SlotEntry {
    slot: SeminarSlot;
    seminar: Seminar;
  }

  // Live reactive seminars & teachers from db
  let allSeminars = $state<Seminar[]>(db.getSeminars());
  let teachers = $state<Teacher[]>(db.getTeachers());
  let saveFeedback = $state<string | null>(null);
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  function showSaveFeedback(msg: string) {
    saveFeedback = msg;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      saveFeedback = null;
    }, 4500);
  }

  function refreshData() {
    allSeminars = db.getSeminars();
    teachers = db.getTeachers();
  }

  // Filter out permanently excluded team members per project rules
  const EXCLUDED_NAMES = ['teresa', 'harishakti', 'ulrich', 'adam'];
  function isSelectableTeacher(t: Teacher): boolean {
    const n = (t.name || '').trim().toLowerCase();
    if (!n || n.startsWith('!')) return false;
    return !EXCLUDED_NAMES.some(ex => n === ex || n.startsWith(ex + ' '));
  }

  let selectableTeachers = $derived(teachers.filter(isSelectableTeacher));
  let sevakaTeachers = $derived(selectableTeachers.filter(t => t.roleType === 'sevaka'));
  let karmaAndGuestTeachers = $derived(
    selectableTeachers.filter(t => t.roleType === 'karma_yogi' || t.roleType === 'guest_teacher' || t.stayStartDate || t.stayEndDate)
  );
  let externalTeachers = $derived(
    selectableTeachers.filter(t => t.roleType !== 'sevaka' && t.roleType !== 'karma_yogi' && t.roleType !== 'guest_teacher' && !t.stayStartDate && !t.stayEndDate)
  );

  // Active seminars overlapping this Friday-to-Friday week
  let weekSeminars = $derived(getSeminarsForWeek(currentWeekCode, allSeminars));

  let coreWeekSeminars = $derived(
    weekSeminars.filter(s => getSeminarTransitionType(s, currentWeekCode) === null)
  );

  // Selected seminar ID: 'all' = master overview of all parallel seminars, or specific seminar id
  let selectedSeminarId = $state<string>('all');

  // Reset selectedSeminarId to 'all' when navigating to a week where that seminar is not active
  $effect(() => {
    const code = currentWeekCode;
    if (selectedSeminarId !== 'all' && code && !weekSeminars.some(s => s.id === selectedSeminarId)) {
      selectedSeminarId = 'all';
    }
  });

  // Filter: 'all' | 'orange' | 'white'
  let activeFilter = $state<'all' | 'orange' | 'white'>('all');

  // Mobile active day index (0 = Start-Freitag .. 7 = End-Freitag)
  let activeMobileDayIndex = $state<number>(0);

  let todayIso = $derived.by(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  // Week number display
  let weekNumber = $derived(
    currentWeekCode ? parseInt(currentWeekCode.split('-W')[1] || '45', 10) : 45
  );

  // Dynamic 8-day array from Friday to Friday for current week
  let currentDays = $derived(getDaysForSeminarWeek(currentWeekCode));

  $effect(() => {
    const matchToday = currentDays.find(d => d.dateStr === todayIso);
    if (matchToday) {
      activeMobileDayIndex = matchToday.dayIndex;
    } else if (activeMobileDayIndex < 0 || activeMobileDayIndex > 7) {
      activeMobileDayIndex = 0;
    }
  });

  // Active single seminar object (if not 'all')
  let activeSeminar = $derived(
    selectedSeminarId === 'all'
      ? null
      : weekSeminars.find(s => s.id === selectedSeminarId) || null
  );

  let activeSeminarDeviatingCount = $derived.by(() => {
    if (!activeSeminar) return 0;
    return activeSeminar.slots.filter(
      s => isIndoorSeminarRoomSlot(s) && s.roomId && s.roomId !== activeSeminar!.roomId
    ).length;
  });

  function formatShortDate(dateStr: string): string {
    const parts = (dateStr || '').split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.`;
    return dateStr;
  }

  function cleanSlotTitle(rawTitle: string): string {
    return (rawTitle || '')
      .replace(/^\d{1,2}:\d{2}\s*Uhr\s*:\s*/i, '')
      .replace(/^\d{1,2}:\d{2}\s*Uhr\s+/i, '')
      .trim();
  }

  function matchesSelectedTeacher(entry: SlotEntry, teacher: Teacher | null): boolean {
    if (!teacher) return false;
    const targetFull = (teacher.name || '').trim().toLowerCase();
    if (!targetFull) return false;
    const targetFirst = targetFull.split(/[\s,]+/)[0] || targetFull;
    const slotPerson = (entry.slot.teacher || (entry.slot.isOrange ? entry.seminar.leader : '') || '').toLowerCase();
    if (!slotPerson) return false;
    return slotPerson.includes(targetFull) || (targetFirst.length >= 3 && slotPerson.includes(targetFirst));
  }

  function getSlotHour(slot: SeminarSlot): number {
    const h = parseInt((slot.startTime || '08:00').split(':')[0], 10);
    return Number.isNaN(h) ? 8 : h;
  }

  function getEntriesForDay(day: { index: number; dayIndex: number; dateStr: string; dayOfWeek: number; label: string }): SlotEntry[] {
    const results: SlotEntry[] = [];
    const seminarsToSearch = activeSeminar ? [activeSeminar] : weekSeminars;

    for (const sem of seminarsToSearch) {
      const daySlots = getEffectiveSeminarSlotsForDay(sem, day);
      for (const slot of daySlots) {
        if (!activeSeminar && !slot.isOrange) {
          // Deduplicate shared open Ashram Hausprogramm slots by hour + category in combined view
          const hour = getSlotHour(slot);
          const alreadyHasHouseSlot = results.some(
            r => !r.slot.isOrange && getSlotHour(r.slot) === hour && r.slot.category === slot.category
          );
          if (!alreadyHasHouseSlot) {
            results.push({ slot, seminar: sem });
          }
        } else {
          results.push({ slot, seminar: sem });
        }
      }
    }

    return results.sort((a, b) => {
      const timeCmp = a.slot.startTime.localeCompare(b.slot.startTime);
      if (timeCmp !== 0) return timeCmp;
      if (a.slot.isOrange !== b.slot.isOrange) return a.slot.isOrange ? 1 : -1;
      return a.seminar.title.localeCompare(b.seminar.title);
    });
  }

  function shouldShowEntryBase(entry: SlotEntry): boolean {
    if (activeFilter === 'orange') return entry.slot.isOrange;
    if (activeFilter === 'white') return !entry.slot.isOrange;
    return true;
  }

  // Check if selectedTeacher actually leads/teaches any seminar slot in this week
  let selectedTeacherHasWeekSlots = $derived.by(() => {
    if (!selectedTeacher) return false;
    return currentDays.some(day =>
      getEntriesForDay(day).some(entry => matchesSelectedTeacher(entry, selectedTeacher))
    );
  });

  function shouldShowEntry(entry: SlotEntry): boolean {
    if (!shouldShowEntryBase(entry)) return false;
    if (selectedTeacher && onlyMySlots && selectedTeacherHasWeekSlots) {
      return matchesSelectedTeacher(entry, selectedTeacher);
    }
    return true;
  }

  function getFilteredEntriesForDayAndHour(
    day: { index: number; dayIndex: number; dateStr: string; dayOfWeek: number; label: string },
    hour: number
  ): SlotEntry[] {
    return getEntriesForDay(day)
      .filter(entry => getSlotHour(entry.slot) === hour)
      .filter(shouldShowEntry);
  }

  let displayedHours = $derived.by<number[]>(() => {
    const hours = new Set<number>();
    for (const day of currentDays) {
      for (const entry of getEntriesForDay(day)) {
        if (shouldShowEntry(entry)) {
          hours.add(getSlotHour(entry.slot));
        }
      }
    }
    if (hours.size === 0 && weekSeminars.length > 0) {
      [7, 8, 9, 11, 14, 16, 18, 20, 21].forEach(h => hours.add(h));
    }
    return Array.from(hours).sort((a, b) => a - b);
  });

  // Harmonized card color system matching wochenplan/+page.svelte
  function getSeminarCardColors(entry: SlotEntry): {
    bg: string;
    border: string;
    roomText: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
  } {
    const { slot, seminar } = entry;

    if (!slot.isOrange) {
      if (slot.category === 'meal') {
        return {
          bg: '#ecfccb',
          border: '#65a30d',
          roomText: '#3f6212',
          pillBg: '#f7fee7',
          pillText: '#3f6212',
          pillBorder: '#bef264'
        };
      }
      if (slot.category === 'meditation' || slot.category === 'satsang') {
        return {
          bg: '#fef9c3',
          border: '#eab308',
          roomText: '#a16207',
          pillBg: '#fefce8',
          pillText: '#854d0e',
          pillBorder: '#fde047'
        };
      }
      if (slot.category === 'departure') {
        return {
          bg: '#ecfeff',
          border: '#06b6d4',
          roomText: '#0e7490',
          pillBg: '#cffafe',
          pillText: '#155e75',
          pillBorder: '#67e8f9'
        };
      }
      // Open Yoga (Ankommensstunde / Yogastunde)
      return {
        bg: '#fff7ed',
        border: '#ea580c',
        roomText: '#ea580c',
        pillBg: '#ffedd5',
        pillText: '#9a3412',
        pillBorder: '#fed7aa'
      };
    }

    // Fixed Seminar Units: tinted pastel matched to seminar.color
    const c = (seminar.color || '#ea580c').toLowerCase();
    if (c === '#16a34a' || c === '#059669') {
      return {
        bg: '#dcfce7',
        border: '#16a34a',
        roomText: '#15803d',
        pillBg: '#f0fdf4',
        pillText: '#166534',
        pillBorder: '#86efac'
      };
    }
    if (c === '#e11d48' || c === '#db2777') {
      return {
        bg: '#ffe4e6',
        border: '#e11d48',
        roomText: '#be123c',
        pillBg: '#fff1f2',
        pillText: '#9f1239',
        pillBorder: '#fda4af'
      };
    }
    if (c === '#8b5cf6' || c === '#7c3aed' || c === '#9333ea') {
      return {
        bg: '#f3e8ff',
        border: '#8b5cf6',
        roomText: '#6d28d9',
        pillBg: '#faf5ff',
        pillText: '#5b21b6',
        pillBorder: '#d8b4fe'
      };
    }
    if (c === '#0284c7' || c === '#2563eb') {
      return {
        bg: '#e0f2fe',
        border: '#0284c7',
        roomText: '#0369a1',
        pillBg: '#f0f9ff',
        pillText: '#075985',
        pillBorder: '#7dd3fc'
      };
    }
    if (c === '#d97706') {
      return {
        bg: '#fef3c7',
        border: '#d97706',
        roomText: '#b45309',
        pillBg: '#fffbeb',
        pillText: '#92400e',
        pillBorder: '#fcd34d'
      };
    }
    if (c === '#0d9488') {
      return {
        bg: '#ccfbf1',
        border: '#0d9488',
        roomText: '#0f766e',
        pillBg: '#f0fdfa',
        pillText: '#115e59',
        pillBorder: '#5eead4'
      };
    }
    // Default Saffron / FEWO
    return {
      bg: '#ffedd5',
      border: '#ea580c',
      roomText: '#c2410c',
      pillBg: '#fff7ed',
      pillText: '#9a3412',
      pillBorder: '#fdba74'
    };
  }

  function getSlotRoomLabel(entry: SlotEntry): string {
    const { slot, seminar } = entry;
    if (!slot.isOrange) {
      if (slot.category === 'meal') return 'Speisesaal';
      if (slot.category === 'meditation' || slot.category === 'satsang') return 'Sivananda-Saal';
      if (slot.category === 'departure') return 'Abreise';
      return 'Laut Tagesplan';
    }
    if (slot.roomId) {
      return getSeminarRoomDisplayName(slot.roomId, slot.roomName || seminar.roomName);
    }
    return slot.roomName || seminar.roomName || 'Laut Tagesaushang';
  }

  // --- SEMINAR-LEVEL EDIT MODAL (Leitung & Raum für alle Slots) ---
  let editingSeminarModal = $state<{ seminar: Seminar; focusField: 'leader' | 'room' } | null>(null);
  let semFormLeaderSelect = $state<string>('');
  let semFormLeaderText = $state<string>('');
  let semFormRoomId = $state<string>('room-4');
  let semFormApplyRoomAll = $state<boolean>(true);
  let semFormApplyLeaderAll = $state<boolean>(true);

  function openSeminarEditModal(seminar: Seminar, focusField: 'leader' | 'room' = 'room') {
    if (!isAdmin) return;
    editingSeminarModal = { seminar, focusField };
    semFormLeaderText = seminar.leader || '';
    const matchedTeacher = selectableTeachers.find(
      t => t.name.trim().toLowerCase() === (seminar.leader || '').trim().toLowerCase()
    );
    semFormLeaderSelect = matchedTeacher ? matchedTeacher.name : '';
    semFormRoomId = seminar.roomId || 'room-4';

    const hasDeviatingSlots = seminar.slots.some(
      s => isIndoorSeminarRoomSlot(s) && s.roomId && s.roomId !== seminar.roomId
    );
    semFormApplyRoomAll = focusField === 'room' ? true : !hasDeviatingSlots;
    semFormApplyLeaderAll = true;
  }

  function closeSeminarEditModal() {
    editingSeminarModal = null;
  }

  function handleSaveSeminarEdit() {
    if (!editingSeminarModal) return;
    const sem = editingSeminarModal.seminar;
    const finalLeader = semFormLeaderText.trim() || 'Offen';
    const roomChanged = semFormRoomId !== sem.roomId;
    const shouldApplyRoomAll = roomChanged || semFormApplyRoomAll;

    const updated = db.updateSeminarGlobal(sem.id, {
      leader: finalLeader,
      roomId: semFormRoomId,
      applyRoomToAllSlots: shouldApplyRoomAll,
      applyLeaderToAllSlots: semFormApplyLeaderAll
    });

    refreshData();
    closeSeminarEditModal();

    if (updated) {
      const roomLabel = getSeminarRoomDisplayName(semFormRoomId, updated.roomName);
      if (shouldApplyRoomAll) {
        showSaveFeedback(`✅ „${updated.title}“ gespeichert: Alle festen Slots auf ${roomLabel} gesetzt · Leitung: ${updated.leader}`);
      } else {
        showSaveFeedback(`✅ „${updated.title}“ aktualisiert: Leitung: ${updated.leader} · Hauptraum: ${roomLabel}`);
      }
    }
  }

  function handleResetSeminarDefault() {
    if (!editingSeminarModal) return;
    const sem = editingSeminarModal.seminar;
    if (confirm(`Möchtest du „${sem.title}“ wirklich auf die ursprüngliche Standard-Belegung (Raum & Leitung) zurücksetzen?`)) {
      db.resetSeminarToDefault(sem.id);
      refreshData();
      closeSeminarEditModal();
      showSaveFeedback(`↺ „${sem.title}“ wurde auf die Standard-Einstellungen zurückgesetzt.`);
    }
  }

  // --- SLOT DETAIL & INDIVIDUAL / GLOBAL EDIT MODAL ---
  let selectedSlotModal = $state<{ slot: SeminarSlot; seminar: Seminar } | null>(null);
  let slotEditScope = $state<'single' | 'all'>('single');
  let slotFormRoomChoice = $state<string>('room-4');
  let slotFormTeacherSelect = $state<string>('');
  let slotFormTeacherText = $state<string>('');
  let slotFormTitle = $state<string>('');
  let slotFormStartTime = $state<string>('08:10');
  let slotFormEndTime = $state<string>('09:00');
  let slotFormLocationHint = $state<string>('');

  function openSlotModal(slot: SeminarSlot, seminar: Seminar) {
    selectedSlotModal = { slot, seminar };
    slotEditScope = 'single';

    if (!slot.isOrange) {
      slotFormRoomChoice = 'house';
    } else if (slot.roomId && SEMINAR_ROOMS.some(r => r.id === slot.roomId)) {
      slotFormRoomChoice = slot.roomId;
    } else {
      slotFormRoomChoice = 'treffpunkt';
    }

    const effectiveTeacher = slot.teacher || seminar.leader || '';
    slotFormTeacherText = effectiveTeacher;
    const matchedTeacher = selectableTeachers.find(
      t => t.name.trim().toLowerCase() === effectiveTeacher.trim().toLowerCase()
    );
    slotFormTeacherSelect = matchedTeacher ? matchedTeacher.name : '';
    slotFormTitle = slot.title;
    slotFormStartTime = slot.startTime;
    slotFormEndTime = slot.endTime;
    slotFormLocationHint = slot.locationHint || '';
  }

  function closeSlotModal() {
    selectedSlotModal = null;
  }

  function handleSaveSlotModal() {
    if (!selectedSlotModal || !isAdmin) return;
    const { slot, seminar } = selectedSlotModal;
    const finalTeacher = slotFormTeacherText.trim() || seminar.leader;

    if (slotEditScope === 'all') {
      const targetRoomId = SEMINAR_ROOMS.some(r => r.id === slotFormRoomChoice)
        ? slotFormRoomChoice
        : (seminar.roomId || 'room-4');

      const updated = db.updateSeminarGlobal(seminar.id, {
        leader: finalTeacher,
        roomId: targetRoomId,
        applyRoomToAllSlots: true,
        applyLeaderToAllSlots: true
      });
      refreshData();
      closeSlotModal();
      if (updated) {
        const rName = getSeminarRoomDisplayName(targetRoomId, updated.roomName);
        showSaveFeedback(`✅ Alle festen Slots von „${updated.title}“ wurden auf ${rName} (${updated.leader}) umgestellt.`);
      }
      return;
    }

    let newRoomId: string | null = null;
    let newRoomName: string | undefined = undefined;
    let newIsOrange = slot.isOrange;

    if (slotFormRoomChoice === 'house') {
      newRoomId = null;
      newRoomName = undefined;
      newIsOrange = false;
    } else if (slotFormRoomChoice === 'treffpunkt') {
      newRoomId = null;
      newRoomName = 'Treffpunkt Eingang';
      newIsOrange = true;
    } else {
      newRoomId = slotFormRoomChoice;
      newRoomName = getSeminarRoomDisplayName(slotFormRoomChoice);
      newIsOrange = true;
    }

    db.updateSeminarSlot(seminar.id, slot.id, {
      roomId: newRoomId,
      roomName: newRoomName,
      isOrange: newIsOrange,
      teacher: finalTeacher,
      title: slotFormTitle.trim() || slot.title,
      startTime: slotFormStartTime || slot.startTime,
      endTime: slotFormEndTime || slot.endTime,
      locationHint: slotFormLocationHint.trim() || undefined,
      dateStr: slot.dateStr,
      dayOfWeek: slot.dayOfWeek,
      dayName: slot.dayName
    });

    refreshData();
    closeSlotModal();
    const roomMsg = newRoomId ? getSeminarRoomDisplayName(newRoomId) : (newIsOrange ? 'Treffpunkt Eingang' : 'Hausprogramm');
    showSaveFeedback(`✅ Einzelner Slot (${slot.dayName}, ${slotFormStartTime}) angepasst: ${roomMsg} · ${finalTeacher}`);
  }

  // Fullscreen state (matching wochenplan/+page.svelte)
  let isFullscreen = $state(false);
  function toggleFullscreen() {
    const container = document.getElementById('seminar-calendar-container');
    if (!document.fullscreenElement && !isFullscreen) {
      if (container && container.requestFullscreen) {
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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (editingSeminarModal) closeSeminarEditModal();
      else if (selectedSlotModal) closeSlotModal();
      else if (isFullscreen && !document.fullscreenElement) isFullscreen = false;
    }
  }

  onMount(() => {
    refreshData();
    db.getRoomReservations(currentWeekCode);
    const onSynced = () => refreshData();
    const onFsChange = () => {
      if (!document.fullscreenElement) isFullscreen = false;
    };
    window.addEventListener('rapla-data-synced', onSynced);
    window.addEventListener('storage', onSynced);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('rapla-data-synced', onSynced);
      window.removeEventListener('storage', onSynced);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if saveFeedback}
  <div class="seminar-save-toast animate-fade-in">
    <span>{saveFeedback}</span>
    <button type="button" class="toast-close-btn" onclick={() => { saveFeedback = null; }}>✕</button>
  </div>
{/if}

<!-- Desktop Friday-to-Friday Grid (exact Wochenplan aesthetic & ground design) -->
<div class="desktop-only-grid">
  <div id="seminar-calendar-container" class="calendar-grid-container animate-fade-in" class:fullscreen-mode={isFullscreen}>
    <div class="grid-controls-row">
      <div class="navigation-group">
        <button type="button" class="btn btn-current-week btn-small" onclick={() => onGoToCurrentWeek?.()}>
          Aktuelle Woche
        </button>
        <button type="button" class="btn btn-secondary btn-small" onclick={() => onNavigateWeek?.(-1)}>
          ◀ Letzte Woche
        </button>
        <span class="week-title-badge">
          KW {weekNumber} ({currentWeekCode})
        </span>
        <button type="button" class="btn btn-secondary btn-small" onclick={() => onNavigateWeek?.(1)}>
          Nächste Woche ▶
        </button>
      </div>

      <div class="action-buttons-group">
        {#if onSwitchToOccupancy}
          <button
            type="button"
            class="btn btn-secondary btn-small"
            onclick={() => onSwitchToOccupancy(activeSeminar?.roomId || 'room-4')}
            title="Transparente Raumbelegung für Seminar- und Yogaräume ansehen"
          >
            🏛️ Raumbelegung
          </button>
        {/if}
        <button type="button" class="btn btn-secondary btn-small" onclick={() => window.print()}>
          🖨️ Drucken
        </button>
        <button type="button" class="btn btn-secondary btn-small fullscreen-toggle-btn" onclick={toggleFullscreen}>
          {isFullscreen ? '🗗 Beenden' : '🖥️ Vollbild'}
        </button>
        {#if onClose}
          <button type="button" class="btn btn-secondary btn-small" onclick={onClose} title="Zurück zum Wochenplan">
            📅 Wochenplan
          </button>
        {/if}
      </div>
    </div>

    {#if weekSeminars.length > 0}
      <!-- Compact Seminar & Slot-Type Filter Toolbar (matching slate controls bar) -->
      <div class="seminar-filter-toolbar">
        <div class="seminar-pills-list">
          <button
            type="button"
            class="seminar-chip"
            class:active={selectedSeminarId === 'all'}
            onclick={() => selectedSeminarId = 'all'}
          >
            <span class="chip-title">Alle Seminare</span>
            <span class="chip-count">{coreWeekSeminars.length || weekSeminars.length}</span>
          </button>

          {#each weekSeminars as sem (sem.id)}
            {@const transitionType = getSeminarTransitionType(sem, currentWeekCode)}
            {@const roomShort = sem.roomId ? getSeminarRoomShortName(sem.roomId, sem.roomName) : ''}
            <div class="seminar-chip-group">
              <button
                type="button"
                class="seminar-chip"
                class:active={selectedSeminarId === sem.id}
                class:transition-chip={transitionType !== null}
                style="--sem-accent: {sem.color};"
                onclick={() => selectedSeminarId = sem.id}
                title="{sem.title} · {sem.subtitle} · Leitung: {sem.leader}{roomShort ? ` · Raum: ${roomShort}` : ''}"
              >
                <span class="chip-color-dot" style="background-color: {sem.color};"></span>
                <span class="chip-title">{sem.shortTitle}</span>
                {#if transitionType === 'departing-start-fr'}
                  <span class="chip-cycle-tag departing">Abreise Fr</span>
                {:else if transitionType === 'arriving-end-fr'}
                  <span class="chip-cycle-tag arriving">Anreise Fr</span>
                {:else if sem.startDayName === 'Freitag' && sem.endDayName === 'Sonntag'}
                  <span class="chip-cycle-tag weekend">WE Fr–So</span>
                {:else}
                  <span class="chip-cycle-tag weekly">So–Fr</span>
                {/if}
                {#if roomShort}
                  <span class="chip-room">· {roomShort}</span>
                {/if}
              </button>
              {#if isAdmin}
                <button
                  type="button"
                  class="seminar-chip-edit-btn"
                  onclick={() => openSeminarEditModal(sem, 'room')}
                  title="Raum & Leitung für „{sem.title}“ bearbeiten"
                >
                  ✏️
                </button>
              {/if}
            </div>
          {/each}
        </div>

        <div class="slot-type-segmented">
          <button
            type="button"
            class="seg-btn"
            class:active={activeFilter === 'all'}
            onclick={() => activeFilter = 'all'}
          >
            Alle
          </button>
          <button
            type="button"
            class="seg-btn"
            class:active={activeFilter === 'orange'}
            onclick={() => activeFilter = 'orange'}
          >
            Seminar-Einheiten
          </button>
          <button
            type="button"
            class="seg-btn"
            class:active={activeFilter === 'white'}
            onclick={() => activeFilter = 'white'}
          >
            Hausprogramm
          </button>
        </div>
      </div>

      {#if activeSeminar}
        <div class="selected-seminar-strip" style="border-left: 4px solid {activeSeminar.color};">
          <div class="strip-main">
            <span class="strip-title">{activeSeminar.title}</span>
            <span class="strip-meta">🗓️ {activeSeminar.subtitle}</span>
            <span class="strip-meta">👤 {activeSeminar.leader}</span>
            <span class="strip-meta">
              🏛️ {activeSeminar.roomId ? getSeminarRoomDisplayName(activeSeminar.roomId, activeSeminar.roomName) : activeSeminar.roomName}
              {#if activeSeminarDeviatingCount > 0}
                <small>({activeSeminarDeviatingCount} abw.)</small>
              {/if}
            </span>
          </div>
          <div class="strip-actions">
            {#if isAdmin}
              <button
                type="button"
                class="btn btn-secondary btn-small"
                onclick={() => openSeminarEditModal(activeSeminar!, 'room')}
              >
                ⚙️ Raum & Leitung ändern
              </button>
            {/if}
            <button
              type="button"
              class="btn btn-secondary btn-small"
              onclick={() => selectedSeminarId = 'all'}
            >
              ✕ Alle Seminare
            </button>
          </div>
        </div>
      {/if}

      <div class="calendar-grid">
        <!-- Top Left Header Info -->
        <div class="grid-header-cell week-header">
          <div class="week-label">TAG / ZEIT</div>
        </div>

        <!-- Week Days Headers starting from Friday (8 Tage: Fr – Fr) -->
        {#each currentDays as day (day.dayIndex)}
          {@const isToday = day.dateStr === todayIso}
          {@const isYlaWednesday = day.dayOfWeek === 3 && isDateInYlaRange(day.dateStr)}
          <div
            class="grid-header-cell day-header"
            class:header-today={isToday}
            class:header-schweigetag={isYlaWednesday}
            class:header-start-friday={day.isStartFriday}
            class:header-end-friday={day.isEndFriday}
          >
            {#if isYlaWednesday}
              <div class="schweigetag-pill" title="Schweigen bis 12 Uhr wegen YLA">
                <div class="schweigetag-pill-title">🤫 Schweigetag</div>
                <div class="schweigetag-pill-sub">Schweigen bis 12 Uhr wegen YLA</div>
              </div>
            {/if}
            <span class="day-label-short">{day.label}</span>
            <span class="day-date">{formatShortDate(day.dateStr)}</span>
            {#if day.isStartFriday}
              <span class="day-cycle-pill start">Start</span>
            {:else if day.isEndFriday}
              <span class="day-cycle-pill end">Abschluss</span>
            {/if}
          </div>
        {/each}

        <!-- Grid Rows by Hour (exact Wochenplan logic) -->
        {#each displayedHours as hour, idx (hour)}
          {@const prevHour = idx > 0 ? displayedHours[idx - 1] : null}
          {@const isMiddayGap = prevHour !== null && prevHour <= 12 && hour >= 13}

          {#if isMiddayGap}
            <div class="grid-midday-gap" aria-hidden="true"></div>
          {/if}

          <div class="grid-time-cell">
            <span>{hour.toString().padStart(2, '0')}:00</span>
          </div>

          {#each currentDays as day (day.dayIndex)}
            {@const cellEntries = getFilteredEntriesForDayAndHour(day, hour)}
            <div class="grid-content-cell">
              {#each cellEntries as entry (entry.seminar.id + '-' + entry.slot.id)}
                {@const colors = getSeminarCardColors(entry)}
                {@const roomLabel = getSlotRoomLabel(entry)}
                {@const isMeal = !entry.slot.isOrange && entry.slot.category === 'meal'}
                {@const isHighlighted = selectedTeacherHasWeekSlots && matchesSelectedTeacher(entry, selectedTeacher)}
                {@const isDimmed = selectedTeacherHasWeekSlots && !isHighlighted && !onlyMySlots}
                {@const teacherLabel = entry.slot.teacher || entry.seminar.leader || 'Offen'}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="course-card-rapla seminar-card-clickable"
                  class:highlighted-card={isHighlighted}
                  class:dimmed-card={isDimmed}
                  style="background-color: {colors.bg}; border-left: 4px solid {isHighlighted ? '#ea580c' : colors.border};"
                  onclick={() => openSlotModal(entry.slot, entry.seminar)}
                  title="{entry.slot.startTime} – {entry.slot.endTime}: {entry.slot.title} ({entry.seminar.title})"
                >
                  <div class="card-top-line">
                    <span class="card-time">{entry.slot.startTime} - {entry.slot.endTime}</span>
                    <span class="card-room" style="color: {colors.roomText};">{roomLabel}</span>
                  </div>
                  <div class="card-title-line">{cleanSlotTitle(entry.slot.title)}</div>
                  {#if entry.slot.isOrange && selectedSeminarId === 'all'}
                    <div
                      class="card-seminar-pill"
                      style="background-color: {colors.pillBg}; color: {colors.pillText}; border-color: {colors.pillBorder};"
                    >
                      {entry.seminar.shortTitle}
                    </div>
                  {/if}
                  {#if isMeal}
                    <div class="card-teacher-line" style="color: #3f6212; font-weight: 600;">
                      🍽️ Speisesaal
                    </div>
                  {:else if !entry.slot.isOrange}
                    <div class="card-teacher-line">
                      🕊️ Offenes Hausprogramm
                    </div>
                  {:else}
                    <div class="card-teacher-line">
                      👤 {teacherLabel}
                    </div>
                  {/if}
                  {#if entry.slot.locationHint}
                    <div class="card-loc-hint">📍 {entry.slot.locationHint}</div>
                  {/if}
                </div>
              {/each}
            </div>
          {/each}
        {/each}
      </div>
    {:else}
      <div class="unapproved-week-notice animate-fade-in">
        <div class="notice-icon-large">🧘‍♀️</div>
        <h2>Keine Seminare in dieser Woche hinterlegt</h2>
        <p class="notice-main-text">
          Für den Zeitraum <strong>KW {weekNumber} ({formatShortDate(currentDays[0]?.dateStr || '')} – {formatShortDate(currentDays[7]?.dateStr || '')})</strong> sind aktuell keine Seminare eingetragen.
        </p>
        <div class="notice-action-row">
          <button type="button" class="btn btn-current-week btn-small" onclick={() => onGoToCurrentWeek?.()}>
            📅 Zur aktuellen Woche wechseln
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Mobile View (Phone & Tablet <= 1100px, matching wochenplan/+page.svelte) -->
<div class="mobile-only-agenda">
  <div class="mobile-week-nav">
    <button type="button" class="btn btn-current-week btn-small" onclick={() => onGoToCurrentWeek?.()}>
      Aktuelle Woche
    </button>
    <button type="button" class="btn btn-secondary btn-small" onclick={() => onNavigateWeek?.(-1)}>◀</button>
    <span class="week-title-badge-mobile">
      KW {weekNumber} ({currentWeekCode})
    </span>
    <button type="button" class="btn btn-secondary btn-small" onclick={() => onNavigateWeek?.(1)}>▶</button>
    {#if onSwitchToOccupancy}
      <button
        type="button"
        class="btn btn-secondary btn-small"
        onclick={() => onSwitchToOccupancy(activeSeminar?.roomId || 'room-4')}
        title="Transparente Raumbelegung ansehen"
      >
        🏛️ Räume
      </button>
    {/if}
  </div>

  {#if weekSeminars.length === 0}
    <div class="unapproved-week-notice animate-fade-in" style="margin: 1rem 0; padding: 2rem 1rem;">
      <div class="notice-icon-large">🧘‍♀️</div>
      <h2 style="font-size: 1.2rem;">Keine Seminare hinterlegt</h2>
      <p class="notice-main-text" style="font-size: 0.9rem;">
        Für <strong>KW {weekNumber} ({formatShortDate(currentDays[0]?.dateStr || '')} – {formatShortDate(currentDays[7]?.dateStr || '')})</strong> liegen aktuell keine Seminardaten vor.
      </p>
      <button type="button" class="btn btn-current-week btn-small" onclick={() => onGoToCurrentWeek?.()}>
        📅 Zur aktuellen Woche
      </button>
    </div>
  {:else}
    <!-- Mobile Seminar Chips -->
    <div class="mobile-seminar-chips">
      <button
        type="button"
        class="seminar-chip"
        class:active={selectedSeminarId === 'all'}
        onclick={() => selectedSeminarId = 'all'}
      >
        Alle ({coreWeekSeminars.length || weekSeminars.length})
      </button>
      {#each weekSeminars as sem (sem.id)}
        <button
          type="button"
          class="seminar-chip"
          class:active={selectedSeminarId === sem.id}
          style="--sem-accent: {sem.color};"
          onclick={() => selectedSeminarId = sem.id}
        >
          <span class="chip-color-dot" style="background-color: {sem.color};"></span>
          <span>{sem.shortTitle}</span>
        </button>
      {/each}
    </div>

    <!-- Day Selector Tabs (8 Days: Fr Start – Fr Ende) -->
    <div class="mobile-day-tabs">
      {#each currentDays as day (day.dayIndex)}
        {@const isToday = day.dateStr === todayIso}
        {@const isYlaWednesday = day.dayOfWeek === 3 && isDateInYlaRange(day.dateStr)}
        <button
          type="button"
          class="day-tab-btn"
          class:active={activeMobileDayIndex === day.dayIndex}
          class:is-today={isToday}
          class:tab-schweigetag={isYlaWednesday}
          onclick={() => { activeMobileDayIndex = day.dayIndex; }}
        >
          {#if isYlaWednesday}
            <span class="schweigetag-tab-pill">🤫 Schweigetag</span>
          {/if}
          <span class="day-tab-name">
            {day.short}
            {#if day.isStartFriday}
              <span class="day-cycle-pill start" style="font-size: 0.55rem; padding: 1px 3px;">Start</span>
            {:else if day.isEndFriday}
              <span class="day-cycle-pill end" style="font-size: 0.55rem; padding: 1px 3px;">Ende</span>
            {/if}
          </span>
          <span class="day-tab-date">{formatShortDate(day.dateStr)}</span>
        </button>
      {/each}
    </div>

    <!-- Mobile Day Agenda List -->
    {@const activeMobileDay = currentDays.find(d => d.dayIndex === activeMobileDayIndex) || currentDays[0]}
    {@const mobileEntries = activeMobileDay ? getEntriesForDay(activeMobileDay).filter(shouldShowEntry) : []}
    <div class="mobile-agenda-list">
      {#if mobileEntries.length === 0}
        <div class="empty-agenda-state">
          Für {activeMobileDay?.label}, {formatShortDate(activeMobileDay?.dateStr || '')} sind keine Seminar-Einheiten mit diesem Filter eingetragen.
        </div>
      {:else}
        {#each mobileEntries as entry (entry.seminar.id + '-mob-' + entry.slot.id)}
          {@const colors = getSeminarCardColors(entry)}
          {@const roomLabel = getSlotRoomLabel(entry)}
          {@const isMeal = !entry.slot.isOrange && entry.slot.category === 'meal'}
          {@const isHighlighted = selectedTeacherHasWeekSlots && matchesSelectedTeacher(entry, selectedTeacher)}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="mobile-agenda-card"
            style="background-color: {colors.bg}; border-left: 5px solid {isHighlighted ? '#ea580c' : colors.border}; cursor: pointer;"
            onclick={() => openSlotModal(entry.slot, entry.seminar)}
          >
            <div class="agenda-time-room">
              <span>⏰ {entry.slot.startTime} – {entry.slot.endTime}</span>
              <span class="agenda-room" style="color: {colors.roomText};">📍 {roomLabel}</span>
            </div>
            <h3 class="agenda-title">{cleanSlotTitle(entry.slot.title)}</h3>
            {#if entry.slot.isOrange}
              <div
                class="card-seminar-pill"
                style="background-color: {colors.pillBg}; color: {colors.pillText}; border-color: {colors.pillBorder}; align-self: flex-start;"
              >
                {entry.seminar.title}
              </div>
            {/if}
            <div class="agenda-teacher">
              {#if isMeal}
                🍽️ Speisesaal
              {:else if !entry.slot.isOrange}
                🕊️ Offenes Hausprogramm
              {:else}
                👤 {entry.slot.teacher || entry.seminar.leader || 'Offen'}
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<!-- SEMINAR-LEVEL EDIT MODAL (Leitung & Raum für alle Slots, Admin only) -->
{#if editingSeminarModal && isAdmin}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop animate-fade-in" onclick={closeSeminarEditModal}>
    <div class="modal-dialog seminar-edit-dialog" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header" style="border-left: 6px solid {editingSeminarModal.seminar.color};">
        <div class="modal-title-wrap">
          <span class="modal-type-tag" style="background: {editingSeminarModal.seminar.color}; color: #fff;">
            ⚙️ Seminar-Einstellungen (Gesamtes Seminar)
          </span>
          <h3>{editingSeminarModal.seminar.title}</h3>
          <span class="modal-time-badge">
            🗓️ {editingSeminarModal.seminar.subtitle} · {editingSeminarModal.seminar.shortTitle}
          </span>
        </div>
        <button type="button" class="btn-close" onclick={closeSeminarEditModal}>✕</button>
      </div>

      <div class="modal-body">
        <div class="admin-edit-section" class:section-focused={editingSeminarModal.focusField === 'leader'}>
          <div class="edit-section-header">
            <span class="section-badge">👤 Seminarleitung</span>
            <span class="section-hint">Person aus Liste wählen oder frei eintragen</span>
          </div>

          <div class="edit-form-grid">
            <div class="edit-field-group">
              <label for="sem-leader-select">Aus vorhandenen Unterrichtenden wählen:</label>
              <select
                id="sem-leader-select"
                class="admin-select"
                bind:value={semFormLeaderSelect}
                onchange={() => {
                  if (semFormLeaderSelect) {
                    semFormLeaderText = semFormLeaderSelect;
                  }
                }}
              >
                <option value="">-- Person aus Liste auswählen --</option>
                <optgroup label="Sevakas (Kernteam)">
                  {#each sevakaTeachers as t (t.id)}
                    <option value={t.name}>🧘 {t.name}</option>
                  {/each}
                </optgroup>
                {#if karmaAndGuestTeachers.length > 0}
                  <optgroup label="Karma-Yogis & Gast-Seminarleiter">
                    {#each karmaAndGuestTeachers as t (t.id)}
                      <option value={t.name}>✨ {t.name}</option>
                    {/each}
                  </optgroup>
                {/if}
                <optgroup label="Externe Seminarleiter">
                  {#each externalTeachers as t (t.id)}
                    <option value={t.name}>👤 {t.name}</option>
                  {/each}
                </optgroup>
              </select>
            </div>

            <div class="edit-field-group">
              <label for="sem-leader-input">Oder Name frei reinschreiben / anpassen:</label>
              <input
                id="sem-leader-input"
                type="text"
                class="admin-input"
                placeholder="z. B. Narayani Kedenburg oder externer Gastname..."
                bind:value={semFormLeaderText}
                oninput={() => {
                  const m = selectableTeachers.find(
                    t => t.name.trim().toLowerCase() === semFormLeaderText.trim().toLowerCase()
                  );
                  semFormLeaderSelect = m ? m.name : '';
                }}
                onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveSeminarEdit(); } }}
              />
            </div>
          </div>

          <label class="checkbox-line">
            <input type="checkbox" bind:checked={semFormApplyLeaderAll} />
            <span>Leitung unmittelbar für alle Seminar-Slots übernehmen</span>
          </label>
        </div>

        <div class="admin-edit-section" class:section-focused={editingSeminarModal.focusField === 'room'}>
          <div class="edit-section-header">
            <span class="section-badge">🏛️ Feste Raumbelegung (Alle Tage)</span>
            <span class="section-hint">Stellt den Raum für alle festen Slots um</span>
          </div>

          <div class="room-choice-cards">
            {#each SEMINAR_ROOMS as rm (rm.id)}
              <button
                type="button"
                class="room-choice-card"
                class:selected={semFormRoomId === rm.id}
                onclick={() => {
                  semFormRoomId = rm.id;
                  semFormApplyRoomAll = true;
                }}
              >
                <span class="rm-icon">{rm.icon}</span>
                <span class="rm-name">{rm.name}</span>
                {#if semFormRoomId === rm.id}
                  <span class="rm-check">✓</span>
                {/if}
              </button>
            {/each}
          </div>

          <label class="checkbox-line highlight-check">
            <input type="checkbox" bind:checked={semFormApplyRoomAll} />
            <span>
              <strong>Für alle festen Raum-Slots an allen Tagen übernehmen</strong>
              (ändert alle Seminarraum-Einheiten sowie die Raumbelegung automatisch auf {getSeminarRoomDisplayName(semFormRoomId)})
            </span>
          </label>
        </div>
      </div>

      <div class="modal-footer modal-footer-between">
        <button
          type="button"
          class="btn btn-secondary btn-small"
          onclick={handleResetSeminarDefault}
          title="Auf ursprüngliche Standard-Daten zurücksetzen"
        >
          ↺ Standard
        </button>

        <div class="footer-right-btns">
          <button type="button" class="btn btn-secondary btn-small" onclick={closeSeminarEditModal}>
            Abbrechen
          </button>
          <button type="button" class="btn btn-current-week btn-small" onclick={handleSaveSeminarEdit}>
            ✓ Für Seminar speichern
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- SLOT DETAIL & EDIT MODAL -->
{#if selectedSlotModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop animate-fade-in" onclick={closeSlotModal}>
    <div class="modal-dialog" class:slot-admin-dialog={isAdmin} onclick={(e) => e.stopPropagation()}>
      <div class="modal-header" style={selectedSlotModal.slot.isOrange ? `border-left: 6px solid ${selectedSlotModal.seminar.color};` : ''}>
        <div class="modal-title-wrap">
          <span class="modal-type-tag" style={selectedSlotModal.slot.isOrange ? `background: ${selectedSlotModal.seminar.color}; color: #fff;` : ''}>
            {selectedSlotModal.slot.isOrange ? '🧘‍♀️ Feste Seminar-Einheit' : '🕊️ Offenes Hausprogramm'}
          </span>
          <h3>{cleanSlotTitle(selectedSlotModal.slot.title)}</h3>
          <span class="modal-time-badge">
            📅 {selectedSlotModal.slot.dayName}, {formatShortDate(selectedSlotModal.slot.dateStr)} · ⏰ {selectedSlotModal.slot.startTime} – {selectedSlotModal.slot.endTime} Uhr
          </span>
        </div>
        <button type="button" class="btn-close" onclick={closeSlotModal}>✕</button>
      </div>

      <div class="modal-body">
        {#if !isAdmin}
          <div class="modal-fields-grid">
            <div class="modal-field">
              <span class="field-label">Seminar</span>
              <span class="field-val"><strong>{selectedSlotModal.seminar.title}</strong> ({selectedSlotModal.seminar.subtitle})</span>
            </div>

            <div class="modal-field">
              <span class="field-label">Leitung / Referent</span>
              <span class="field-val">{selectedSlotModal.slot.teacher || selectedSlotModal.seminar.leader}</span>
            </div>

            <div class="modal-field">
              <span class="field-label">Raum / Ort</span>
              <span class="field-val highlight">
                {getSlotRoomLabel({ slot: selectedSlotModal.slot, seminar: selectedSlotModal.seminar })}
              </span>
            </div>

            <div class="modal-field">
              <span class="field-label">Art der Einheit</span>
              <span class="field-val {selectedSlotModal.slot.isOrange ? 'status-reserved' : 'status-open'}">
                {selectedSlotModal.slot.isOrange
                  ? (selectedSlotModal.slot.roomId ? '🔒 Feste Raumbelegung im Seminarraum' : '📌 Feste Seminar-Einheit laut Aushang')
                  : '⚪ Offenes Ashram-Hausprogramm'}
              </span>
            </div>
          </div>
        {:else}
          <div class="scope-switcher-box">
            <span class="scope-caption">Wie soll die Änderung gelten?</span>
            <div class="scope-buttons-row">
              <button
                type="button"
                class="scope-pill-btn"
                class:active={slotEditScope === 'single'}
                onclick={() => slotEditScope = 'single'}
              >
                📅 Nur dieser Tag / Slot ({selectedSlotModal.slot.dayName})
              </button>
              <button
                type="button"
                class="scope-pill-btn scope-all"
                class:active={slotEditScope === 'all'}
                onclick={() => {
                  slotEditScope = 'all';
                  if (!SEMINAR_ROOMS.some(r => r.id === slotFormRoomChoice)) {
                    slotFormRoomChoice = selectedSlotModal!.seminar.roomId || 'room-4';
                  }
                }}
              >
                🗓️ Für ALLE festen Slots des Seminars
              </button>
            </div>
          </div>

          <div class="admin-edit-section">
            <div class="edit-form-grid">
              <div class="edit-field-group">
                <label for="slot-room-select">
                  {slotEditScope === 'all' ? '🏛️ Neuer Raum für ALLE festen Seminar-Slots:' : '🏛️ Raum für diesen Slot:'}
                </label>
                <select id="slot-room-select" class="admin-select" bind:value={slotFormRoomChoice}>
                  {#each SEMINAR_ROOMS as rm (rm.id)}
                    <option value={rm.id}>{rm.icon} {rm.name}</option>
                  {/each}
                  {#if slotEditScope === 'single'}
                    <option value="treffpunkt">📍 Treffpunkt Eingang / Draußen (ohne Raumbelegung)</option>
                    <option value="house">🕊️ Offenes Hausprogramm (weißer Slot)</option>
                  {/if}
                </select>
              </div>

              <div class="edit-field-group">
                <label for="slot-teacher-select">
                  {slotEditScope === 'all' ? '👤 Gesamtleitung aus Liste wählen:' : '👤 Leitung / Referent aus Liste wählen:'}
                </label>
                <select
                  id="slot-teacher-select"
                  class="admin-select"
                  bind:value={slotFormTeacherSelect}
                  onchange={() => {
                    if (slotFormTeacherSelect) {
                      slotFormTeacherText = slotFormTeacherSelect;
                    }
                  }}
                >
                  <option value="">-- Aus Liste auswählen --</option>
                  <optgroup label="Sevakas (Kernteam)">
                    {#each sevakaTeachers as t (t.id)}
                      <option value={t.name}>🧘 {t.name}</option>
                    {/each}
                  </optgroup>
                  {#if karmaAndGuestTeachers.length > 0}
                    <optgroup label="Karma-Yogis & Gast-Seminarleiter">
                      {#each karmaAndGuestTeachers as t (t.id)}
                        <option value={t.name}>✨ {t.name}</option>
                      {/each}
                    </optgroup>
                  {/if}
                  <optgroup label="Externe Seminarleiter">
                    {#each externalTeachers as t (t.id)}
                      <option value={t.name}>👤 {t.name}</option>
                    {/each}
                  </optgroup>
                </select>
              </div>
            </div>

            <div class="edit-field-group" style="margin-top: 0.65rem;">
              <label for="slot-teacher-text">Oder Name direkt reinschreiben:</label>
              <input
                id="slot-teacher-text"
                type="text"
                class="admin-input"
                placeholder="Name frei eingeben..."
                bind:value={slotFormTeacherText}
                oninput={() => {
                  const m = selectableTeachers.find(
                    t => t.name.trim().toLowerCase() === slotFormTeacherText.trim().toLowerCase()
                  );
                  slotFormTeacherSelect = m ? m.name : '';
                }}
              />
            </div>

            {#if slotEditScope === 'single'}
              <div class="slot-extra-fields">
                <div class="edit-field-group">
                  <label for="slot-title-input">Bezeichnung / Thema:</label>
                  <input id="slot-title-input" type="text" class="admin-input" bind:value={slotFormTitle} />
                </div>
                <div class="slot-time-inputs">
                  <div class="edit-field-group">
                    <label for="slot-start-input">Von:</label>
                    <input id="slot-start-input" type="time" class="admin-input" bind:value={slotFormStartTime} />
                  </div>
                  <div class="edit-field-group">
                    <label for="slot-end-input">Bis:</label>
                    <input id="slot-end-input" type="time" class="admin-input" bind:value={slotFormEndTime} />
                  </div>
                </div>
              </div>
            {:else}
              <div class="all-slots-info-note">
                ⚡ Alle festen Raum-Einheiten von <strong>{selectedSlotModal.seminar.title}</strong> werden an allen Tagen auf <strong>{getSeminarRoomDisplayName(slotFormRoomChoice)}</strong> ({slotFormTeacherText || selectedSlotModal.seminar.leader}) umgestellt.
              </div>
            {/if}
          </div>
        {/if}

        {#if selectedSlotModal.slot.description}
          <div class="modal-desc-area">
            <h5>Beschreibung & Ablauf</h5>
            <p>{selectedSlotModal.slot.description}</p>
          </div>
        {/if}

        {#if selectedSlotModal.slot.locationHint}
          <div class="modal-hint-box">
            <span>📍 {selectedSlotModal.slot.locationHint}</span>
          </div>
        {/if}
      </div>

      <div class="modal-footer modal-footer-between">
        <div>
          {#if selectedSlotModal.slot.isOrange && selectedSlotModal.slot.roomId && onSwitchToOccupancy}
            <button
              type="button"
              class="btn btn-secondary btn-small"
              onclick={() => {
                const rId = selectedSlotModal?.slot.roomId || 'room-4';
                closeSlotModal();
                onSwitchToOccupancy(rId);
              }}
            >
              🏛️ In Raumbelegung öffnen
            </button>
          {/if}
        </div>

        <div class="footer-right-btns">
          <button type="button" class="btn btn-secondary btn-small" onclick={closeSlotModal}>
            {isAdmin ? 'Abbrechen' : 'Schließen'}
          </button>
          {#if isAdmin}
            <button type="button" class="btn btn-current-week btn-small" onclick={handleSaveSlotModal}>
              {slotEditScope === 'all' ? '✓ Für alle Slots speichern' : '✓ Slot speichern'}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Exact Ground Design & Roster Calendar Grid Styling from wochenplan/+page.svelte */
  .calendar-grid-container {
    width: 100%;
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    box-sizing: border-box;
  }

  .grid-controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f1f5f9;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .navigation-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .action-buttons-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .week-title-badge {
    font-weight: 700;
    font-size: 0.9rem;
    color: #334155;
    background: #ffffff;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
  }

  /* Compact Seminar Filter Toolbar harmonized with grid-controls-row */
  .seminar-filter-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.5rem 0.75rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .seminar-pills-list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
  }

  .seminar-chip-group {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .seminar-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.6rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .seminar-chip:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .seminar-chip.active {
    background: #fff7ed;
    border-color: var(--sem-accent, #ea580c);
    color: #0f172a;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(234, 88, 12, 0.12);
  }

  .seminar-chip.transition-chip:not(.active) {
    opacity: 0.88;
    border-style: dashed;
  }

  .chip-color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .chip-count {
    background: #ea580c;
    color: #ffffff;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.05rem 0.38rem;
    border-radius: 9999px;
  }

  .chip-cycle-tag {
    font-size: 0.64rem;
    font-weight: 700;
    padding: 0.05rem 0.32rem;
    border-radius: 4px;
    background: #e2e8f0;
    color: #475569;
  }

  .chip-cycle-tag.weekend {
    background: #f3e8ff;
    color: #6d28d9;
  }

  .chip-cycle-tag.weekly {
    background: #ffedd5;
    color: #c2410c;
  }

  .chip-cycle-tag.departing {
    background: #fae8ff;
    color: #a21caf;
  }

  .chip-cycle-tag.arriving {
    background: #e0f2fe;
    color: #0369a1;
  }

  .chip-room {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 600;
  }

  .seminar-chip-edit-btn {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 0.22rem 0.38rem;
    font-size: 0.7rem;
    cursor: pointer;
    line-height: 1;
    transition: all 0.15s ease;
  }

  .seminar-chip-edit-btn:hover {
    background: #fff7ed;
    border-color: #ea580c;
  }

  .slot-type-segmented {
    display: inline-flex;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
    flex-shrink: 0;
  }

  .seg-btn {
    background: transparent;
    border: none;
    border-radius: 4px;
    padding: 0.24rem 0.55rem;
    font-family: inherit;
    font-size: 0.73rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .seg-btn.active {
    background: #ffffff;
    color: #0f172a;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .selected-seminar-strip {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 0.85rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .strip-main {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.82rem;
    color: #334155;
  }

  .strip-title {
    font-weight: 800;
    color: #0f172a;
    font-size: 0.88rem;
  }

  .strip-meta {
    font-weight: 600;
    color: #475569;
  }

  .strip-actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  /* 8-Column Friday-to-Friday Grid (exact match with wochenplan/+page.svelte) */
  .calendar-grid {
    display: grid;
    grid-template-columns: 80px repeat(8, minmax(135px, 1fr));
    grid-auto-rows: auto;
    background-color: #cbd5e1;
    gap: 1px;
    width: 100%;
    min-width: 1160px;
    border-radius: 8px;
    overflow: hidden;
  }

  .day-cycle-pill {
    display: inline-block;
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.08rem 0.35rem;
    border-radius: 9999px;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .day-cycle-pill.start {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
  }

  .day-cycle-pill.end {
    background: #fae8ff;
    color: #a21caf;
    border: 1px solid #f5d0fe;
  }

  .grid-header-cell {
    background: #f8fafc;
    padding: 8px 4px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 48px;
    border-top: 3px solid #94a3b8;
  }

  .week-header {
    font-weight: 700;
    font-size: 0.75rem;
    color: #475569;
    background: #f1f5f9;
    border-top: 3px solid #64748b;
  }

  .day-header {
    color: #334155;
  }

  .header-today {
    background: #eff6ff;
    border-top: 3px solid #3b82f6;
  }

  .header-schweigetag {
    background: #fdf4ff;
    border-top: 3px solid #c026d3;
  }

  .header-today.header-schweigetag {
    background: #faf5ff;
    border-top: 3px solid #9333ea;
  }

  .schweigetag-pill {
    background: #f3e8ff;
    border: 1px solid #d8b4fe;
    border-radius: 6px;
    padding: 3px 4px;
    margin-bottom: 4px;
    text-align: center;
    width: 95%;
    box-shadow: 0 1px 2px rgba(147, 51, 234, 0.1);
  }

  .schweigetag-pill-title {
    font-size: 0.72rem;
    font-weight: 800;
    color: #7e22ce;
    letter-spacing: 0.01em;
    line-height: 1.1;
  }

  .schweigetag-pill-sub {
    font-size: 0.62rem;
    font-weight: 600;
    color: #9333ea;
    line-height: 1.15;
    margin-top: 1px;
  }

  .day-label-short {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .day-date {
    font-size: 0.75rem;
    color: #64748b;
  }

  .grid-midday-gap {
    grid-column: 1 / -1;
    background: #cbd5e1;
    height: 8px;
    min-height: 8px;
    box-sizing: border-box;
  }

  .grid-time-cell {
    background: #f1f5f9;
    padding: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #475569;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 80px;
    box-sizing: border-box;
  }

  .grid-content-cell {
    background: #ffffff;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 80px;
    box-sizing: border-box;
  }

  /* Exact Course Card Styling from wochenplan/+page.svelte */
  .course-card-rapla {
    padding: 6px 8px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all 0.2s ease;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    flex-shrink: 0;
  }

  .seminar-card-clickable {
    cursor: pointer;
  }

  .seminar-card-clickable:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(15, 23, 42, 0.09);
  }

  .card-top-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
  }

  .card-time {
    white-space: nowrap;
  }

  .card-room {
    font-weight: 800;
    color: #ea580c;
    text-align: right;
  }

  .card-title-line {
    font-size: 0.85rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }

  .card-seminar-pill {
    display: inline-block;
    align-self: flex-start;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
    border: 1px solid transparent;
    line-height: 1.25;
  }

  .card-teacher-line {
    font-size: 0.7rem;
    font-weight: 600;
    color: #334155;
  }

  .card-loc-hint {
    font-size: 0.66rem;
    font-weight: 600;
    color: #475569;
  }

  .highlighted-card {
    box-shadow: 0 4px 8px rgba(234, 88, 12, 0.15);
    transform: scale(1.02);
  }

  .dimmed-card {
    opacity: 0.78;
  }

  .dimmed-card:hover {
    opacity: 0.92;
  }

  /* Empty Week Notice (matching wochenplan/+page.svelte .unapproved-week-notice) */
  .unapproved-week-notice {
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    padding: 3rem 2rem;
    text-align: center;
    margin: 0.5rem 0;
  }

  .notice-icon-large {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .unapproved-week-notice h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.35rem;
    color: #0f172a;
  }

  .notice-main-text {
    color: #475569;
    font-size: 0.95rem;
    margin: 0 auto 1.25rem auto;
    max-width: 560px;
  }

  .notice-action-row {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Fullscreen Mode override (matching wochenplan/+page.svelte) */
  .calendar-grid-container.fullscreen-mode,
  .calendar-grid-container:fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 99999 !important;
    background: #fffbf7 !important;
    border-radius: 0 !important;
    padding: 0.75rem 1rem !important;
    overflow-y: auto !important;
    overflow-x: auto !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
    margin: 0 !important;
    border: none !important;
  }

  .calendar-grid-container.fullscreen-mode .grid-controls-row,
  .calendar-grid-container:fullscreen .grid-controls-row {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    background: #f1f5f9 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    margin-bottom: 0 !important;
    flex-shrink: 0 !important;
  }

  /* Buttons (matching wochenplan/+page.svelte) */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 0.4rem 0.85rem;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-secondary {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #334155;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .btn-current-week {
    background: #ea580c;
    border-color: #c2410c;
    color: #ffffff;
    font-weight: 700;
  }

  .btn-current-week:hover {
    background: #c2410c;
    border-color: #9a3412;
  }

  .btn-small {
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
  }

  .seminar-save-toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #166534;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-size: 0.84rem;
    font-weight: 600;
    margin-bottom: 0.65rem;
  }

  .toast-close-btn {
    background: transparent;
    border: none;
    color: #166534;
    font-weight: 700;
    cursor: pointer;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Responsive Breakpoints & Mobile Agenda (matching wochenplan/+page.svelte) */
  @media (min-width: 1101px) {
    .desktop-only-grid {
      display: block;
    }
    .mobile-only-agenda {
      display: none;
    }
  }

  @media (max-width: 1100px) {
    .desktop-only-grid {
      display: none;
    }
    .mobile-only-agenda {
      display: block;
      width: 100%;
      overflow-x: hidden;
    }
  }

  .mobile-week-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.35rem;
    background: #f1f5f9;
    padding: 0.5rem;
    border-radius: 8px;
    margin-bottom: 0.65rem;
    border: 1px solid #cbd5e1;
  }

  .week-title-badge-mobile {
    font-weight: 700;
    font-size: 0.8rem;
    color: #334155;
    background: #ffffff;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    text-align: center;
  }

  .mobile-seminar-chips {
    display: flex;
    overflow-x: auto;
    gap: 0.4rem;
    padding: 0.15rem 0.15rem 0.55rem 0.15rem;
    scrollbar-width: none;
  }

  .mobile-seminar-chips::-webkit-scrollbar {
    display: none;
  }

  .mobile-day-tabs {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 0.25rem 0.25rem 0.75rem 0.25rem;
    margin-bottom: 1rem;
    scrollbar-width: none;
  }

  .mobile-day-tabs::-webkit-scrollbar {
    display: none;
  }

  .day-tab-btn {
    flex: 1 0 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.65rem 0.4rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .day-tab-btn.active {
    background: #ea580c;
    border-color: #ea580c;
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2);
  }

  .day-tab-btn.active .day-tab-date {
    color: rgba(255, 255, 255, 0.85);
  }

  .day-tab-name {
    font-weight: 800;
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  .day-tab-date {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 2px;
  }

  .day-tab-btn.is-today:not(.active) {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .day-tab-btn.is-today:not(.active) .day-tab-date {
    color: #2563eb;
  }

  .tab-schweigetag {
    border-color: #d8b4fe !important;
  }

  .schweigetag-tab-pill {
    font-size: 0.52rem;
    font-weight: 800;
    color: #7e22ce;
    background: #fae8ff;
    border: 1px solid #e9d5ff;
    padding: 1px 3px;
    border-radius: 4px;
    margin-bottom: 2px;
  }

  .mobile-agenda-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .mobile-agenda-card {
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
  }

  .agenda-time-room {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    font-weight: 700;
    color: #64748b;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
    padding-bottom: 4px;
  }

  .agenda-room {
    font-weight: 800;
    color: #ea580c;
  }

  .agenda-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.25;
  }

  .agenda-teacher {
    font-size: 0.78rem;
    font-weight: 600;
    color: #475569;
  }

  .empty-agenda-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #94a3b8;
    background: #ffffff;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
    font-weight: 600;
    font-size: 0.9rem;
  }

  /* Modal Dialogs */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 100000;
  }

  .modal-dialog {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    width: 100%;
    max-width: 580px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  }

  .slot-admin-dialog,
  .seminar-edit-dialog {
    max-width: 680px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .modal-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .modal-type-tag {
    display: inline-block;
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    background: #e2e8f0;
    color: #334155;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
  }

  .modal-time-badge {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 600;
  }

  .btn-close {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-weight: 700;
    color: #475569;
  }

  .modal-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
  }

  .modal-field {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.65rem 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .field-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
  }

  .field-val {
    font-size: 0.88rem;
    color: #0f172a;
    font-weight: 600;
  }

  .field-val.highlight {
    color: #ea580c;
    font-weight: 700;
  }

  .modal-desc-area {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.8rem 1rem;
  }

  .modal-desc-area h5 {
    margin: 0 0 0.35rem 0;
    font-size: 0.78rem;
    text-transform: uppercase;
    color: #64748b;
  }

  .modal-desc-area p {
    margin: 0;
    font-size: 0.88rem;
    color: #334155;
    line-height: 1.45;
  }

  .modal-hint-box {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
    padding: 0.55rem 0.8rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .modal-footer {
    padding: 0.9rem 1.25rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .modal-footer-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .footer-right-btns {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* Admin Form Controls inside Modals */
  .admin-edit-section {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .admin-edit-section.section-focused {
    border-color: #ea580c;
    background: #fffbf7;
  }

  .edit-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .section-badge {
    font-weight: 800;
    font-size: 0.85rem;
    color: #0f172a;
  }

  .section-hint {
    font-size: 0.75rem;
    color: #64748b;
  }

  .edit-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0.75rem;
  }

  .edit-field-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .edit-field-group label {
    font-size: 0.76rem;
    font-weight: 700;
    color: #334155;
  }

  .admin-select,
  .admin-input {
    padding: 0.45rem 0.65rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    font-family: inherit;
    font-size: 0.84rem;
    color: #0f172a;
  }

  .room-choice-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
    gap: 0.5rem;
  }

  .room-choice-card {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .room-choice-card.selected {
    border-color: #ea580c;
    background: #fff7ed;
    color: #9a3412;
    font-weight: 700;
  }

  .rm-check {
    margin-left: auto;
    color: #ea580c;
    font-weight: 800;
  }

  .checkbox-line {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #334155;
    cursor: pointer;
  }

  .scope-switcher-box {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .scope-caption {
    font-size: 0.76rem;
    font-weight: 700;
    color: #475569;
  }

  .scope-buttons-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .scope-pill-btn {
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .scope-pill-btn.active {
    background: #fff7ed;
    border-color: #ea580c;
    color: #9a3412;
    font-weight: 700;
  }

  .slot-extra-fields {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    margin-top: 0.65rem;
  }

  .slot-time-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
  }

  .all-slots-info-note {
    margin-top: 0.65rem;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
    font-size: 0.8rem;
  }

  @media print {
    .grid-controls-row,
    .seminar-filter-toolbar,
    .mobile-only-agenda {
      display: none !important;
    }
    .desktop-only-grid {
      display: block !important;
    }
    .calendar-grid-container {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    .calendar-grid {
      min-width: 0 !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .course-card-rapla {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
      break-inside: avoid;
    }
  }
</style>
