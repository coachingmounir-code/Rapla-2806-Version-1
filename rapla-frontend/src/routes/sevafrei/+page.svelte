<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Teacher } from '$lib/db';
  import { EXCEL_ABSENCES } from '$lib/excel_absences';

  interface SevafreiEntry {
    id: string;
    teacherId: string;
    teacherName: string;
    avatarColor: string;
    startDate: string;
    endDate: string;
    type: 'Urlaub' | 'Freizeitausgleich' | 'Krank' | 'Fortbildung' | 'Sonstiges' | 'Seminartage' | 'Seminarleitung' | 'Frei';
    status: 'Genehmigt' | 'Ausstehend';
    note: string;
  }

  interface QuotaEntry {
    spiritualName: string;
    firstName: string;
    lastName: string;
    team: string;
    seminarSoll: number;
    seminarIst: number;
    sevafreiSoll: number;
    sevafreiIst: number;
  }

  let sevafreiList = $state<SevafreiEntry[]>([]);
  let sevakas = $state<Teacher[]>([]);
  let showModal = $state(false);
  let activeView = $state<'calendar' | 'list' | 'quotas'>('calendar');

  // Month tracking
  let currentYear = $state(2026);
  let currentMonth = $state(6); // July (0-indexed, so 6 = July)

  const MONTH_NAMES = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  // Form state
  let formTeacherId = $state('');
  let formStartDate = $state('');
  let formEndDate = $state('');
  let formType = $state<'Urlaub' | 'Freizeitausgleich' | 'Krank' | 'Fortbildung' | 'Sonstiges' | 'Seminartage' | 'Seminarleitung' | 'Frei'>('Urlaub');
  let formStatus = $state<'Genehmigt' | 'Ausstehend'>('Genehmigt');
  let formNote = $state('');

  // Filtering state
  let searchQuery = $state('');
  let filterType = $state<string>('all');
  let calendarTeacherFilter = $state<string>('all');
  let calendarWrapperEl = $state<HTMLElement | null>(null);
  let isFullscreen = $state(false);

  // Excel Quota Data
  const quotas: QuotaEntry[] = [
    { spiritualName: "Karuna Mayi", firstName: "Karuna", lastName: "Wapke", team: "AL", seminarSoll: 18, seminarIst: 6, sevafreiSoll: 24, sevafreiIst: 8 },
    { spiritualName: "Pranava", firstName: "Heinz", lastName: "Pauly", team: "Hum/Shop", seminarSoll: 18, seminarIst: 6, sevafreiSoll: 29, sevafreiIst: 19 },
    { spiritualName: "Jyoti", firstName: "Melanie", lastName: "Rudolphi", team: "Jaya", seminarSoll: 0, seminarIst: 0, sevafreiSoll: 25, sevafreiIst: 0 },
    { spiritualName: "Anjali", firstName: "Magdalena", lastName: "Gelzleichter", team: "Seva/Karmayoga", seminarSoll: 18, seminarIst: 12, sevafreiSoll: 24, sevafreiIst: 19 },
    { spiritualName: "Adinatha", firstName: "Matthias", lastName: "Lang", team: "Vishnu/Shop", seminarSoll: 18, seminarIst: 18, sevafreiSoll: 24, sevafreiIst: 5 },
    { spiritualName: "Marlen", firstName: "Marlen", lastName: "Posnien", team: "ZV", seminarSoll: 0, seminarIst: 0, sevafreiSoll: 25, sevafreiIst: 0 },
    { spiritualName: "Melanie", firstName: "Melanie", lastName: "Vagt", team: "Jaya", seminarSoll: 0, seminarIst: 0, sevafreiSoll: 0, sevafreiIst: 0 },
    { spiritualName: "Burnie", firstName: "Bernhard", lastName: "Bansemer", team: "Vishnu", seminarSoll: 18, seminarIst: 0, sevafreiSoll: 24, sevafreiIst: 12 },
    { spiritualName: "Nirmaya", firstName: "Karin", lastName: "Fodor", team: "Sattva", seminarSoll: 18, seminarIst: 18, sevafreiSoll: 24, sevafreiIst: 19 },
    { spiritualName: "Maitri", firstName: "Martina", lastName: "Schloms", team: "SPL", seminarSoll: 0, seminarIst: 0, sevafreiSoll: 25, sevafreiIst: 21 },
    { spiritualName: "Alexander", firstName: "Alexander", lastName: "Melior", team: "Küche", seminarSoll: 16, seminarIst: 18, sevafreiSoll: 24, sevafreiIst: 0 },
    { spiritualName: "Abha", firstName: "Ann-Katrin", lastName: "Morkötter", team: "Jaya, Hum", seminarSoll: 16, seminarIst: 17, sevafreiSoll: 24, sevafreiIst: 17 },
    { spiritualName: "Hu", firstName: "Katja", lastName: "Bürkle", team: "Vishnu, socM", seminarSoll: 14, seminarIst: 16, sevafreiSoll: 24, sevafreiIst: 24 },
    { spiritualName: "Ulrich", firstName: "Ulrich", lastName: "Nebel", team: "Sattva", seminarSoll: 14, seminarIst: 0, sevafreiSoll: 24, sevafreiIst: 24 },
    { spiritualName: "Shantara", firstName: "Jessica", lastName: "Nickler", team: "Küche", seminarSoll: 0, seminarIst: 0, sevafreiSoll: 25, sevafreiIst: 18 },
    { spiritualName: "Adam", firstName: "Adam", lastName: "Zmuda", team: "Küche", seminarSoll: 12, seminarIst: 12, sevafreiSoll: 24, sevafreiIst: 21 },
    { spiritualName: "Narayani", firstName: "Katja", lastName: "Kedenburg", team: "ZV", seminarSoll: 18, seminarIst: 16, sevafreiSoll: 24, sevafreiIst: 17 },
    { spiritualName: "Linda", firstName: "Linda", lastName: "Silberbauer", team: "Jaya", seminarSoll: 12, seminarIst: 0, sevafreiSoll: 22, sevafreiIst: 14 },
    { spiritualName: "Mounir", firstName: "Mounir", lastName: "Jaber", team: "SPL", seminarSoll: 12, seminarIst: 0, sevafreiSoll: 22, sevafreiIst: 8 },
    { spiritualName: "Harishakti", firstName: "Ramona", lastName: "Gäpler", team: "Rezeption", seminarSoll: 0, seminarIst: 0, sevafreiSoll: 17, sevafreiIst: 6 }
  ];



  onMount(() => {
    // Load Sevakas
    sevakas = db.getTeachers().filter(t => t.roleType === 'sevaka');
    if (sevakas.length > 0) {
      formTeacherId = sevakas[0].id;
    }

    // Load Sevafrei entries from localStorage
    const saved = localStorage.getItem('rapla_sevafrei');
    if (saved) {
      sevafreiList = JSON.parse(saved);
      // Auto-merge new Excel absences from EXCEL_ABSENCES
      const dbTeachers = db.getTeachers();
      let updated = false;
      EXCEL_ABSENCES.forEach((abs, i) => {
        const match = findTeacherForExcelName(abs.excelName, dbTeachers);
        if (match) {
          const exists = sevafreiList.some(e => 
            e.teacherId === match.id && 
            e.startDate === abs.startDate && 
            e.endDate === abs.endDate && 
            e.type === abs.type
          );
          if (!exists) {
            sevafreiList.push({
              id: `excel-sf-${i}`,
              teacherId: match.id,
              teacherName: match.name,
              avatarColor: match.avatarColor || '#960040',
              startDate: abs.startDate,
              endDate: abs.endDate,
              type: abs.type,
              status: abs.status,
              note: abs.note
            });
            updated = true;
          }
        }
      });
      if (updated) {
        saveToStorage();
      }
    } else {
      // Seed Excel data automatically on first load!
      importExcelData(false);
    }

    // Listen to fullscreen changes to sync state (handles ESC key)
    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  });

  function toggleFullscreen() {
    if (!calendarWrapperEl) return;
    
    if (!isFullscreen) {
      if (calendarWrapperEl.requestFullscreen) {
        calendarWrapperEl.requestFullscreen().catch(err => {
          console.warn("Native fullscreen rejected, using fallback:", err);
        });
      }
      isFullscreen = true;
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.warn("Error exiting native fullscreen:", err);
        });
      }
      isFullscreen = false;
    }
  }

  function findTeacherForExcelName(excelName: string, dbTeachers: Teacher[]): Teacher | undefined {
    const cleanExcel = excelName.toLowerCase();
    return dbTeachers.find(t => {
      const dbName = t.name.toLowerCase();
      if (cleanExcel.includes("karuna") && dbName.includes("karuna")) return true;
      if (cleanExcel.includes("pranava") && dbName.includes("pranava")) return true;
      if (cleanExcel.includes("jyoti") && dbName.includes("jyoti")) return true;
      if (cleanExcel.includes("anjali") && dbName.includes("anjali")) return true;
      if (cleanExcel.includes("adinatha") && dbName.includes("adinatha")) return true;
      if (cleanExcel.includes("marlen") && dbName.includes("marlen")) return true;
      if (cleanExcel.includes("melanie") && dbName.includes("melanie") && dbName.includes("vagt")) return true;
      if (cleanExcel.includes("burnie") && dbName.includes("burnie")) return true;
      if (cleanExcel.includes("nirmaya") && dbName.includes("nirmaya")) return true;
      if (cleanExcel.includes("maitri") && dbName.includes("martina")) return true; // Maitri = Martina Schloms
      if (cleanExcel.includes("alexander") && dbName.includes("alexander")) return true;
      if (cleanExcel.includes("abha") && dbName.includes("abha")) return true;
      if (cleanExcel.includes("hu") && dbName.includes("hu")) return true;
      if (cleanExcel.includes("ulrich") && dbName.includes("ulrich")) return true;
      if (cleanExcel.includes("shantara") && dbName.includes("shantara")) return true;
      if (cleanExcel.includes("adam") && dbName.includes("adam")) return true;
      if (cleanExcel.includes("narayani") && dbName.includes("narayani")) return true;
      if (cleanExcel.includes("linda") && dbName.includes("linda")) return true;
      if (cleanExcel.includes("mounir") && dbName.includes("mounir")) return true;
      if (cleanExcel.includes("harishakti") && dbName.includes("harishakti")) return true;
      
      const firstName = dbName.split(' ')[0];
      return cleanExcel.includes(firstName) && firstName.length > 2;
    });
  }

  function importExcelData(showFeedback = true) {
    const list: SevafreiEntry[] = [];
    const dbTeachers = db.getTeachers();

    EXCEL_ABSENCES.forEach((abs, i) => {
      const match = findTeacherForExcelName(abs.excelName, dbTeachers);
      if (match) {
        list.push({
          id: `excel-sf-${i}`,
          teacherId: match.id,
          teacherName: match.name,
          avatarColor: match.avatarColor || '#960040',
          startDate: abs.startDate,
          endDate: abs.endDate,
          type: abs.type,
          status: abs.status,
          note: abs.note
        });
      }
    });

    sevafreiList = list;
    saveToStorage();

    if (showFeedback) {
      alert(`Erfolgreich ${list.length} Abwesenheiten aus der Excel-Planung importiert.`);
    }
  }

  function saveToStorage() {
    localStorage.setItem('rapla_sevafrei', JSON.stringify(sevafreiList));
  }

  function handleAddEntry(e: Event) {
    e.preventDefault();
    if (!formTeacherId || !formStartDate || !formEndDate) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    const selectedSevaka = sevakas.find(s => s.id === formTeacherId);
    if (!selectedSevaka) return;

    const newEntry: SevafreiEntry = {
      id: 'sf-' + Math.random().toString(36).substr(2, 9),
      teacherId: formTeacherId,
      teacherName: selectedSevaka.name,
      avatarColor: selectedSevaka.avatarColor || '#960040',
      startDate: formStartDate,
      endDate: formEndDate,
      type: formType,
      status: formStatus,
      note: formNote
    };

    sevafreiList = [...sevafreiList, newEntry];
    saveToStorage();

    // Reset form
    formStartDate = '';
    formEndDate = '';
    formNote = '';
    showModal = false;
  }

  function deleteEntry(id: string) {
    if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      sevafreiList = sevafreiList.filter(e => e.id !== id);
      saveToStorage();
    }
  }

  function formatDateString(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Calculate general weekly free days based on no slots in availability rules
  function getGeneralFreeDays(teacher: Teacher): number[] {
    const slots = teacher.rules?.availability || [];
    const daysWithAvailability = slots.map(s => s.day);
    const freeDays: number[] = [];
    for (let d = 0; d < 7; d++) {
      if (!daysWithAvailability.includes(d)) {
        freeDays.push(d);
      }
    }
    return freeDays;
  }

  // Calendar view pagination
  function prevMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  // Generate day grid cells for the monthly calendar view
  function generateCalendarDays(year: number, monthIndex: number) {
    const firstDay = new Date(year, monthIndex, 1);
    const startDayIndex = firstDay.getDay(); 
    const startOffset = startDayIndex === 0 ? 6 : startDayIndex - 1;

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

    const cells: { day: number; date: string; isCurrentMonth: boolean; weekday: number }[] = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
      const prevYear = monthIndex === 0 ? year - 1 : year;
      const monthStr = (prevMonth + 1).toString().padStart(2, '0');
      const dateStr = `${prevYear}-${monthStr}-${day.toString().padStart(2, '0')}`;
      const d = new Date(prevYear, prevMonth, day);
      cells.push({ day, date: dateStr, isCurrentMonth: false, weekday: d.getDay() });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = (monthIndex + 1).toString().padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${day.toString().padStart(2, '0')}`;
      const d = new Date(year, monthIndex, day);
      cells.push({ day, date: dateStr, isCurrentMonth: true, weekday: d.getDay() });
    }

    // Next month padding (to fill a standard 42-day calendar layout grid)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const monthStr = (nextMonth + 1).toString().padStart(2, '0');
      const dateStr = `${nextYear}-${monthStr}-${day.toString().padStart(2, '0')}`;
      const d = new Date(nextYear, nextMonth, day);
      cells.push({ day, date: dateStr, isCurrentMonth: false, weekday: d.getDay() });
    }

    return cells;
  }

  // Reactive states
  let calendarDays = $derived(generateCalendarDays(currentYear, currentMonth));

  let filteredEntries = $derived(
    sevafreiList.filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return e.teacherName.toLowerCase().includes(query) || e.note.toLowerCase().includes(query);
      }
      return true;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate))
  );

  let activeTodayCount = $derived(
    sevafreiList.filter(e => {
      const todayStr = new Date().toISOString().split('T')[0];
      return todayStr >= e.startDate && todayStr <= e.endDate;
    }).length
  );
</script>

<div class="page-header">
  <div class="title-section">
    <span class="badge badge-primary">Abwesenheiten</span>
    <h1>Sevafrei Kalender</h1>
    <p>Übersicht der Ferien, Ausgleiche und regulären freien Tage der Sevakas. Automatisch verknüpft mit der KI-Planung.</p>
  </div>
  <div class="actions-group">
    <button class="btn btn-secondary" onclick={() => importExcelData(true)} style="margin-right: 0.5rem;">
      🔄 Excel-Daten laden
    </button>
    <button class="btn btn-primary" onclick={() => showModal = true}>
      <span>➕</span> Sevafrei eintragen
    </button>
  </div>
</div>

<!-- Switch view mode and summary row -->
<div class="view-header-bar animate-fade-in" style="margin-top: 1.5rem;">
  <div class="view-switcher-pill">
    <button class="switch-btn" class:active={activeView === 'calendar'} onclick={() => activeView = 'calendar'}>
      📅 Kalender
    </button>
    <button class="switch-btn" class:active={activeView === 'list'} onclick={() => activeView = 'list'}>
      📋 Listenansicht ({filteredEntries.length})
    </button>
    <button class="switch-btn" class:active={activeView === 'quotas'} onclick={() => activeView = 'quotas'}>
      📊 Quoten & Kontingente
    </button>
  </div>

  <div class="stats-pills">
    <span class="stat-pill glass-card">
      <span class="pill-label">Heute abwesend:</span>
      <strong class:text-highlight={activeTodayCount > 0}>{activeTodayCount} Sevakas</strong>
    </span>
  </div>
</div>

{#if activeView === 'calendar'}
  <div bind:this={calendarWrapperEl} class="calendar-wrapper glass-card animate-fade-in" class:fullscreen-mode={isFullscreen} style="margin-top: 1rem;">
    <!-- Calendar Controls -->
    <div class="calendar-controls">
      <button class="arrow-btn" onclick={prevMonth}>◀</button>
      <h2 class="calendar-month-title">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
      <button class="arrow-btn" onclick={nextMonth}>▶</button>
      <button 
        class="arrow-btn" 
        onclick={toggleFullscreen} 
        style="width: auto; padding: 0 0.75rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; margin-left: 0.5rem; border-radius: 8px;"
        title="Vollbildmodus umschalten"
      >
        {isFullscreen ? '🔍 Normal' : '📺 Vollbild'}
      </button>
    </div>

    <!-- Calendar Person Filter -->
    <div class="calendar-filter-bar" style="display: flex; justify-content: flex-end; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; padding: 0 0.5rem;">
      <label class="form-label" for="calendar-teacher-filter" style="margin: 0; font-weight: 600;">Person filtern:</label>
      <select 
        id="calendar-teacher-filter" 
        class="form-select" 
        style="width: 220px; padding: 0.35rem 0.75rem; font-size: 0.85rem;" 
        bind:value={calendarTeacherFilter}
      >
        <option value="all">Alle Personen anzeigen</option>
        {#each sevakas as s}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    </div>

    <!-- Calendar Grid -->
    <div class="calendar-grid">
      <!-- Weekday headers -->
      {#each WEEKDAYS as day}
        <div class="weekday-header">{day}</div>
      {/each}

      <!-- Day cells -->
      {#each calendarDays as cell}
        {@const cellAbsences = sevafreiList.filter(e => cell.date >= e.startDate && cell.date <= e.endDate && (calendarTeacherFilter === 'all' || e.teacherId === calendarTeacherFilter))}
        {@const cellRegularFree = sevakas.filter(s => getGeneralFreeDays(s).includes(cell.weekday) && (calendarTeacherFilter === 'all' || s.id === calendarTeacherFilter))}
        <div class="day-cell" class:padded-day={!cell.isCurrentMonth}>
          <div class="day-meta">
            <span class="day-num" class:today-num={cell.date === new Date().toISOString().split('T')[0]}>
              {cell.day}
            </span>
          </div>

          <div class="cell-events-container">
            <!-- Active Absences (Urlaub, Fortbildung, etc.) -->
            {#each cellAbsences as abs}
              <div 
                class="cell-event-item {abs.type.toLowerCase()}" 
                style="border-left: 3px solid {abs.avatarColor}"
                title="{abs.teacherName}: {abs.type} - {abs.note || 'Keine Angabe'}"
              >
                <span class="event-type-icon">
                  {#if abs.type === 'Urlaub'}🌴{:else if abs.type === 'Freizeitausgleich'}⏳{:else if abs.type === 'Fortbildung'}📚{:else if abs.type === 'Krank'}🩹{:else if abs.type === 'Seminartage'}📖{:else if abs.type === 'Seminarleitung'}💼{:else if abs.type === 'Frei'}🏖️{:else}⚙️{/if}
                </span>
                <span class="event-name">{abs.teacherName.split(' ')[0]}</span>
              </div>
            {/each}

            <!-- Regular Weekly Free Days -->
            {#each cellRegularFree as freeSev}
              <!-- Only show free days if the Sevaka is not already on vacation/absence on this day -->
              {#if !cellAbsences.some(a => a.teacherId === freeSev.id)}
                <div 
                  class="cell-event-item regular-free" 
                  title="{freeSev.name}: Regulärer freier Wochentag"
                >
                  <span class="event-type-icon">🏖️</span>
                  <span class="event-name">{freeSev.name.split(' ')[0]} (Frei)</span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <!-- Calendar Legend -->
    <div class="calendar-legend">
      <div class="legend-item"><span class="legend-color-dot" style="background-color: #e3f2fd; border: 1px solid #1565c0;"></span> 🌴 Urlaub</div>
      <div class="legend-item"><span class="legend-color-dot" style="background-color: #ede7f6; border: 1px solid #651fff;"></span> ⏳ Freizeitausgleich</div>
      <div class="legend-item"><span class="legend-color-dot" style="background-color: #e8f5e9; border: 1px solid #2e7d32;"></span> 📖 Seminartage</div>
      <div class="legend-item"><span class="legend-color-dot" style="background-color: #fff3e0; border: 1px solid #e65100;"></span> 💼 Seminarleitung</div>
      <div class="legend-item"><span class="legend-color-dot" style="background-color: #ffebee; border: 1px solid #c62828;"></span> 🩹 Krank</div>
      <div class="legend-item"><span class="legend-color-dot" style="background-color: #f7f7f7; border: 1px solid #cccccc;"></span> 🏖️ Regulärer freier Wochentag</div>
    </div>
  </div>
{:else if activeView === 'list'}
  <!-- LIST TABULAR VIEW -->
  <!-- Filters bar -->
  <div class="filters-bar glass-card animate-fade-in" style="margin-top: 1rem;">
    <div class="filter-group">
      <label class="form-label" for="search-sevaka">Sevaka suchen:</label>
      <input 
        type="text" 
        id="search-sevaka"
        placeholder="Name oder Notiz suchen..." 
        class="form-select filter-select"
        style="width: 250px; padding: 0.4rem 0.75rem;"
        bind:value={searchQuery}
      />
    </div>

    <div class="filter-group">
      <label class="form-label" for="filter-type">Typ filtern:</label>
      <select id="filter-type" class="form-select filter-select" bind:value={filterType}>
        <option value="all">Alle Typen</option>
        <option value="Urlaub">🌴 Urlaub</option>
        <option value="Freizeitausgleich">⏳ Freizeitausgleich</option>
        <option value="Seminartage">📖 Seminartage</option>
        <option value="Seminarleitung">💼 Seminarleitung</option>
        <option value="Fortbildung">📚 Fortbildung</option>
        <option value="Krank">🩹 Krank</option>
        <option value="Frei">🏖️ Frei / Wochentag</option>
        <option value="Sonstiges">⚙️ Sonstiges</option>
      </select>
    </div>
  </div>

  <div class="sevafrei-list animate-fade-in" style="margin-top: 1rem;">
    {#if filteredEntries.length === 0}
      <div class="no-results glass-card">
        <span class="no-results-icon">📋</span>
        <h3>Keine Abwesenheiten eingetragen</h3>
        <p>Es wurden keine Einträge für die aktuellen Filterkriterien gefunden.</p>
      </div>
    {:else}
      <div class="grid-table">
        <div class="table-header">
          <div>Sevaka</div>
          <div>Zeitraum</div>
          <div>Kategorie</div>
          <div>Grund / Notiz</div>
          <div>Status</div>
          <div style="text-align: right;">Aktion</div>
        </div>
        
        {#each filteredEntries as entry}
          <div class="table-row">
            <div class="sevaka-cell">
              <span class="sev-avatar" style="background-color: {entry.avatarColor}">{entry.teacherName.charAt(0)}</span>
              <strong>{entry.teacherName}</strong>
            </div>
            <div>
              <strong>{formatDateString(entry.startDate)}</strong> bis <strong>{formatDateString(entry.endDate)}</strong>
            </div>
            <div>
              <span class="cat-badge {entry.type.toLowerCase()}">
                {#if entry.type === 'Urlaub'}🌴{:else if entry.type === 'Freizeitausgleich'}⏳{:else if entry.type === 'Seminartage'}📖{:else if entry.type === 'Seminarleitung'}💼{:else if entry.type === 'Fortbildung'}📚{:else if entry.type === 'Krank'}🩹{:else if entry.type === 'Frei'}🏖️{:else}⚙️{/if} {entry.type}
              </span>
            </div>
            <div class="note-cell">
              {entry.note || 'Keine Angabe'}
            </div>
            <div>
              <span class="status-badge {entry.status.toLowerCase()}">{entry.status}</span>
            </div>
            <div style="text-align: right;">
              <button class="delete-btn" onclick={() => deleteEntry(entry.id)}>🗑️ Löschen</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <!-- EXCEL QUOTAS TABULAR VIEW -->
  <div class="quotas-wrapper glass-card animate-fade-in" style="margin-top: 1rem;">
    <h3 style="margin-bottom: 0.5rem; color: var(--text-primary);">📊 Kontingente (Soll / Ist-Abgleich 2026)</h3>
    <p style="margin-bottom: 1.25rem; font-size: 0.85rem; color: var(--text-secondary);">
      Die Kontingente stammen direkt aus dem Tabellenblatt <em>Jan-Juni</em> und <em>Juli-Dez</em> des Seva-Planers.
    </p>

    <div class="grid-table">
      <div class="quota-table-header">
        <div>Name</div>
        <div>Team</div>
        <div style="text-align: center;">Seminartage Soll</div>
        <div style="text-align: center;">Seminartage Ist</div>
        <div style="text-align: center;">Seminartage Rest</div>
        <div style="text-align: center;">Sevafrei Soll</div>
        <div style="text-align: center;">Sevafrei Ist</div>
        <div style="text-align: center;">Sevafrei Rest</div>
      </div>
      
      {#each quotas as q}
        {@const semRest = q.seminarSoll - q.seminarIst}
        {@const sevRest = q.sevafreiSoll - q.sevafreiIst}
        <div class="quota-table-row">
          <div class="sevaka-cell">
            <strong>{q.spiritualName}</strong>
            {#if q.firstName !== q.spiritualName}
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">({q.firstName} {q.lastName})</span>
            {/if}
          </div>
          <div>{q.team}</div>
          <div style="text-align: center; font-weight: 500;">{q.seminarSoll}</div>
          <div style="text-align: center; color: var(--primary); font-weight: 700;">{q.seminarIst}</div>
          <div style="text-align: center; font-weight: 700;" class:text-highlight={semRest < 0} class:text-muted={semRest === 0}>
            {semRest}
          </div>
          <div style="text-align: center; font-weight: 500;">{q.sevafreiSoll}</div>
          <div style="text-align: center; color: #1565c0; font-weight: 700;">{q.sevafreiIst}</div>
          <div style="text-align: center; font-weight: 700;" class:text-highlight={sevRest < 0} class:text-muted={sevRest === 0}>
            {sevRest}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Add Modal dialog overlay -->
{#if showModal}
  <div class="modal-backdrop">
    <div class="modal-card animate-scale-in">
      <div class="modal-header">
        <h3>Abwesenheit eintragen</h3>
        <button class="modal-close" onclick={() => showModal = false}>✕</button>
      </div>
      <form onsubmit={handleAddEntry}>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="modal-sevaka">Sevaka wählen *</label>
            <select id="modal-sevaka" class="form-select" bind:value={formTeacherId} required>
              {#each sevakas as s}
                <option value={s.id}>{s.name}</option>
              {/each}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="modal-start">Startdatum *</label>
              <input type="date" id="modal-start" class="form-select" bind:value={formStartDate} required />
            </div>
            <div class="form-group">
              <label class="form-label" for="modal-end">Enddatum *</label>
              <input type="date" id="modal-end" class="form-select" bind:value={formEndDate} required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="modal-type">Kategorie</label>
              <select id="modal-type" class="form-select" bind:value={formType}>
                <option value="Urlaub">🌴 Urlaub / Sevafrei</option>
                <option value="Freizeitausgleich">⏳ Freizeitausgleich</option>
                <option value="Seminartage">📖 Seminartage</option>
                <option value="Seminarleitung">💼 Seminarleitung</option>
                <option value="Fortbildung">📚 Fortbildung</option>
                <option value="Krank">🩹 Krank</option>
                <option value="Frei">🏖️ Frei / Wochentag</option>
                <option value="Sonstiges">⚙️ Sonstiges</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="modal-status">Freigabe-Status</label>
              <select id="modal-status" class="form-select" bind:value={formStatus}>
                <option value="Genehmigt">Genehmigt</option>
                <option value="Ausstehend">Ausstehend</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="modal-note">Bemerkung / Begründung</label>
            <textarea id="modal-note" class="form-select" style="height: 80px; resize: none; padding: 0.5rem;" bind:value={formNote} placeholder="z.B. Urlaub, Fortbildung, Seminarleitung etc..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={() => showModal = false}>Abbrechen</button>
          <button type="submit" class="btn btn-primary">Speichern</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* Page Structure */
  .actions-group {
    display: flex;
    align-items: center;
  }

  /* View switcher and metadata */
  .view-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .view-switcher-pill {
    display: flex;
    background: var(--secondary);
    padding: 0.25rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }

  .switch-btn {
    background: none;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 9px;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .switch-btn.active {
    background: #ffffff;
    color: var(--primary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .stats-pills {
    display: flex;
    gap: 0.75rem;
  }

  .stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.45rem 1rem;
    border-radius: 12px;
    font-size: 0.85rem;
  }

  .pill-label {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .text-highlight {
    color: #d35400 !important;
  }

  .text-muted {
    color: var(--text-secondary) !important;
  }

  /* Fullscreen styles */
  .calendar-wrapper.fullscreen-mode,
  .calendar-wrapper:fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 99999 !important;
    background: #fdfcf9 !important; /* Match Rapla light warm background */
    padding: 2.5rem !important;
    overflow-y: auto !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
  }

  /* CALENDAR VIEW GRID */
  .calendar-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1.25rem;
  }

  .arrow-btn {
    background: var(--secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    transition: var(--transition-smooth);
  }

  .arrow-btn:hover {
    background: var(--border-color);
    color: var(--primary);
  }

  .calendar-month-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    min-width: 200px;
    text-align: center;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
  }

  .weekday-header {
    background: var(--secondary);
    padding: 0.65rem 0.5rem;
    text-align: center;
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
  }

  .day-cell {
    min-height: 110px;
    padding: 0.45rem;
    border-right: 1px solid rgba(234, 217, 201, 0.4);
    border-bottom: 1px solid rgba(234, 217, 201, 0.4);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: #ffffff;
    transition: background 0.2s ease;
  }

  .day-cell:nth-child(7n) {
    border-right: none;
  }

  .day-cell:nth-last-child(-n+7) {
    border-bottom: none;
  }

  .day-cell:hover {
    background: rgba(255, 253, 248, 0.5);
  }

  .padded-day {
    background: rgba(250, 248, 245, 0.6) !important;
    opacity: 0.6;
  }

  .day-meta {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .day-num {
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--text-secondary);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .today-num {
    background: var(--primary);
    color: #ffffff !important;
    box-shadow: 0 2px 5px rgba(150, 0, 64, 0.2);
  }

  .cell-events-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow-y: auto;
    flex-grow: 1;
    max-height: 85px;
  }

  .cell-event-item {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.2rem;
    line-height: 1.2;
    cursor: default;
    border: 1px solid rgba(0,0,0,0.03);
  }

  .cell-event-item.urlaub { background: #e3f2fd; color: #1565c0; }
  .cell-event-item.freizeitausgleich { background: #ede7f6; color: #651fff; }
  .cell-event-item.seminartage { background: #e8f5e9; color: #2e7d32; }
  .cell-event-item.seminarleitung { background: #fff3e0; color: #e65100; }
  .cell-event-item.fortbildung { background: #e8f5e9; color: #2e7d32; }
  .cell-event-item.krank { background: #ffebee; color: #c62828; }
  .cell-event-item.sonstiges { background: #f5f5f5; color: #616161; }
  .cell-event-item.frei {
    background: rgba(247, 247, 247, 0.9);
    border: 1px dashed #d1cfc7;
    color: #7a7566;
    font-weight: 600;
  }
  
  .cell-event-item.regular-free {
    background: rgba(247, 247, 247, 0.9);
    border: 1px dashed #d1cfc7;
    color: #7a7566;
    font-weight: 600;
  }

  .event-type-icon {
    font-size: 0.78rem;
  }

  .event-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .calendar-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(234, 217, 201, 0.6);
    justify-content: center;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .legend-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 4px;
    display: inline-block;
  }

  /* Grid Table layout */
  .grid-table {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(150, 0, 64, 0.01);
  }

  .table-header {
    display: grid;
    grid-template-columns: 180px 220px 150px 1fr 120px 100px;
    padding: 0.85rem 1.5rem;
    background: var(--secondary);
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
  }

  .table-row {
    display: grid;
    grid-template-columns: 180px 220px 150px 1fr 120px 100px;
    padding: 1rem 1.5rem;
    align-items: center;
    border-bottom: 1px solid rgba(234, 217, 201, 0.4);
    font-size: 0.88rem;
    color: var(--text-primary);
    transition: background 0.2s ease;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: rgba(255, 253, 248, 0.5);
  }

  /* Quotas Table grid columns */
  .quota-table-header {
    display: grid;
    grid-template-columns: 200px 100px repeat(6, 1fr);
    padding: 0.85rem 1.5rem;
    background: var(--secondary);
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
  }

  .quota-table-row {
    display: grid;
    grid-template-columns: 200px 100px repeat(6, 1fr);
    padding: 0.85rem 1.5rem;
    align-items: center;
    border-bottom: 1px solid rgba(234, 217, 201, 0.4);
    font-size: 0.88rem;
    color: var(--text-primary);
    transition: background 0.2s ease;
  }

  .quota-table-row:last-child {
    border-bottom: none;
  }

  .quota-table-row:hover {
    background: rgba(255, 253, 248, 0.5);
  }

  .sevaka-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sev-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.85rem;
  }

  .note-cell {
    color: var(--text-secondary);
    font-style: italic;
  }

  /* Badges */
  .cat-badge {
    display: inline-block;
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .cat-badge.urlaub { background: #e3f2fd; color: #1565c0; }
  .cat-badge.freizeitausgleich { background: #ede7f6; color: #651fff; }
  .cat-badge.seminartage { background: #e8f5e9; color: #2e7d32; }
  .cat-badge.seminarleitung { background: #fff3e0; color: #e65100; }
  .cat-badge.fortbildung { background: #e8f5e9; color: #2e7d32; }
  .cat-badge.krank { background: #ffebee; color: #c62828; }
  .cat-badge.sonstiges { background: #f5f5f5; color: #616161; }
  .cat-badge.frei { background: rgba(247, 247, 247, 0.9); color: #7a7566; border: 1px dashed #d1cfc7; }

  .status-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .status-badge.genehmigt {
    background: rgba(163, 196, 133, 0.2);
    color: #2e7d32;
    border: 1px solid rgba(163, 196, 133, 0.5);
  }

  .status-badge.ausstehend {
    background: #ffe5cc;
    color: #d35400;
    border: 1px solid #ff9800;
  }

  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 600;
    padding: 0.25rem;
    border-radius: 6px;
    transition: var(--transition-smooth);
  }

  .delete-btn:hover {
    color: var(--danger);
    background: rgba(220, 53, 69, 0.08);
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 2rem;
    text-align: center;
    background: rgba(255, 253, 248, 0.8);
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }

  .no-results-icon {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }

  .no-results h3 {
    font-family: 'Playfair Display', serif;
    color: var(--text-primary);
    margin-bottom: 0.35rem;
  }

  .no-results p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  /* Modal Dialog styles */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(42, 27, 27, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 20px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(234, 217, 201, 0.6);
    background: var(--secondary);
  }

  .modal-header h3 {
    margin: 0;
    font-family: 'Playfair Display', serif;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 700;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0.25rem;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-smooth);
  }

  .modal-close:hover {
    background: rgba(42, 27, 27, 0.08);
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-top: 1px solid rgba(234, 217, 201, 0.6);
    background: #faf8f5;
  }
</style>
