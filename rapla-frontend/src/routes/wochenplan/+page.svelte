<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { db, type Course, type Teacher, type Room, type WeekPlan } from '$lib/db';
  import { getLocalDateForDay } from '$lib/planningEngine';
  import { isDateInYlaRange, getYlaSlotsForTeacherAndWeek, type YlaTeacherWeekSlot } from '$lib/ylaData';
  import nataraja from '$lib/assets/nataraja.jpg';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  let courses = $state<Course[]>([]);
  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let weekPlans = $state<WeekPlan[]>([]);
  let currentPlan = $state<WeekPlan | null>(null);
  let currentWeekOffset = $state(0);
  let isFullscreen = $state(false);
  let activeMobileDay = $state(5);
  let isWeekApproved = $state(false);

  // Filter query parameters
  let teacherParam = $derived(page.url.searchParams.get('teacher') || '');
  let onlyMySlotsParam = $derived(page.url.searchParams.get('onlyMySlots') === 'true');

  // Resolved teacher state
  let selectedTeacher = $derived.by<Teacher | null>(() => {
    if (!teacherParam) return null;
    return teachers.find(t => 
      t.id === teacherParam || 
      t.name.toLowerCase().includes(teacherParam.toLowerCase())
    ) || null;
  });

  let karmaTeachersList = $derived(
    teachers.filter(t => t.roleType === 'karma_yogi' || t.roleType === 'guest_teacher' || t.stayStartDate || t.stayEndDate)
  );
  let externalTeachersList = $derived(
    teachers.filter(t => t.roleType !== 'sevaka' && t.roleType !== 'karma_yogi' && t.roleType !== 'guest_teacher' && !t.stayStartDate && !t.stayEndDate)
  );
  let sevakaTeachersList = $derived(
    teachers.filter(t => t.roleType === 'sevaka')
  );

  let activeWeekCode = $derived(
    currentPlan?.targetWeekCode || getWeekCode(getMondayForOffset(currentWeekOffset))
  );

  // Resolved 4-Week YLA slots for the selected teacher in this week
  let selectedTeacherYlaSlots = $derived.by<YlaTeacherWeekSlot[]>(() => {
    if (!selectedTeacher) return [];
    return getYlaSlotsForTeacherAndWeek(selectedTeacher.name, activeWeekCode, selectedTeacher.id);
  });

  // Derived combined courses for total displayed hours and counting
  let allDisplayCourses = $derived<(Course | YlaTeacherWeekSlot)[]>(
    selectedTeacher ? [...courses, ...selectedTeacherYlaSlots] : courses
  );

  // Derived filtered courses for the mobile agenda view
  let filteredMobileCourses = $derived.by<(Course | YlaTeacherWeekSlot)[]>(() => {
    const regular = courses
      .filter(c => c.dayOfWeek === activeMobileDay)
      .filter(c => !onlyMySlotsParam || !selectedTeacher || c.teacherId === selectedTeacher.id);

    const yla = (selectedTeacher ? selectedTeacherYlaSlots : [])
      .filter(s => s.dayOfWeek === activeMobileDay);

    return [...regular, ...yla].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const DAYS = [
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' },
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' }
  ];

  let hasSetInitialWeek = false;

  onMount(() => {
    weekPlans = db.getWeekPlans();
    if (!hasSetInitialWeek) {
      currentWeekOffset = findDefaultApprovedWeekOffset(weekPlans);
      hasSetInitialWeek = true;
    }
    loadData();
    
    // Set active mobile day to today if today is within our calendar cycle
    const todayVal = new Date().getDay();
    if (DAYS.some(d => d.value === todayVal)) {
      activeMobileDay = todayVal;
    }
    
    // Add keypress listener for escaping fullscreen
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    const handleFullscreenChange = () => {
      isFullscreen = !!document.fullscreenElement;
    };

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('storage', handleSync);
    window.addEventListener('rapla-data-synced', handleSync);
    window.addEventListener('yla-assignment-changed', handleSync);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('rapla-data-synced', handleSync);
      window.removeEventListener('yla-assignment-changed', handleSync);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  });

  let isSyncing = $state(false);
  let syncFeedback = $state<string | null>(null);

  async function handleHeaderSync() {
    if (isSyncing) return;
    isSyncing = true;
    try {
      await db.syncWithServerAndCloud();
      loadData();
      syncFeedback = '✅ Daten erfolgreich synchronisiert!';
      setTimeout(() => { syncFeedback = null; }, 3500);
    } catch (e: any) {
      syncFeedback = '❌ Fehler: ' + (e?.message || '');
      setTimeout(() => { syncFeedback = null; }, 4000);
    } finally {
      isSyncing = false;
    }
  }

  function handleResetCurrentPlan() {
    if (!currentPlan) return;
    if (confirm(`Möchtest du den Plan für "${currentPlan.name}" wirklich auf die Standard-Vorlage zurücksetzen? Alle manuellen Zuweisungen für diese Woche werden dabei verworfen.`)) {
      db.resetSchedule(currentPlan.id);
      loadData();
      syncFeedback = 'ℹ️ Plan wurde auf die Standard-Vorlage zurückgesetzt.';
      setTimeout(() => { syncFeedback = null; }, 3500);
    }
  }

  function getWeekCode(date: Date): string {
    const year = date.getFullYear();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  function getMondayForOffset(offset: number): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    let daysToMonday = 0;
    if (currentDay === 5) daysToMonday = 3; // Friday -> upcoming Monday (+3)
    else if (currentDay === 6) daysToMonday = 2; // Saturday -> upcoming Monday (+2)
    else if (currentDay === 0) daysToMonday = 1; // Sunday -> tomorrow Monday (+1)
    else if (currentDay === 1) daysToMonday = 0; // Monday -> today (0)
    else if (currentDay === 2) daysToMonday = -1; // Tuesday -> past Monday (-1)
    else if (currentDay === 3) daysToMonday = -2; // Wednesday -> past Monday (-2)
    else if (currentDay === 4) daysToMonday = -3; // Thursday -> past Monday (-3)
    
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(today.getDate() + daysToMonday + (offset * 7));
    return monday;
  }

  function getMondayOfCurrentWeek(): Date {
    return getMondayForOffset(currentWeekOffset);
  }

  function findDefaultApprovedWeekOffset(plans: WeekPlan[]): number {
    // 1. If current calendar week (offset 0) is approved, show current week
    const currentWeekCode = getWeekCode(getMondayForOffset(0));
    const curPlan = plans.find(p => p.targetWeekCode === currentWeekCode);
    const isCurrentApproved = !!curPlan && (curPlan.isApproved === true || (curPlan.status === 'approved' && curPlan.isApproved !== false));
    if (isCurrentApproved) {
      return 0;
    }

    // 2. Otherwise start with the first upcoming approved week (e.g. KW 36)
    for (let offset = 1; offset <= 26; offset++) {
      const code = getWeekCode(getMondayForOffset(offset));
      const plan = plans.find(p => p.targetWeekCode === code);
      if (plan && (plan.isApproved === true || (plan.status === 'approved' && plan.isApproved !== false))) {
        return offset;
      }
    }

    return 0;
  }

  // ISO-8601 week number
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  function getDayDateString(dayValue: number): string {
    if (currentPlan?.targetWeekCode) {
      const dateStr = getLocalDateForDay(currentPlan.targetWeekCode, dayValue);
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.`;
      }
    }
    const monday = getMondayOfCurrentWeek();
    let offset = 0;
    if (dayValue === 5) offset = -3;
    else if (dayValue === 6) offset = -2;
    else if (dayValue === 0) offset = -1;
    else if (dayValue === 1) offset = 0;
    else if (dayValue === 2) offset = 1;
    else if (dayValue === 3) offset = 2;
    else if (dayValue === 4) offset = 3;
    
    const targetDate = new Date(monday.getTime());
    targetDate.setDate(monday.getDate() + offset);
    return targetDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }

  function getCourseColor(course: Course | YlaTeacherWeekSlot): { bg: string; border: string } {
    if ((course as any).isYla || course.style === 'YLA') {
      return {
        bg: '#faf5ff', // gentle lavender / light purple
        border: '#9333ea' // deep vibrant purple
      };
    }

    const isUnassigned = !course.teacherId || course.teacherId === 'teacher-gen-yl';
    if (isUnassigned) {
      return {
        bg: '#fdf2f8', // light pink (lotus)
        border: '#db2777' // deep pink
      };
    }

    const nameLower = course.name.toLowerCase();
    const styleLower = course.style.toLowerCase();
    
    if (nameLower.includes('hausführung')) {
      return {
        bg: '#ecfeff', // cyan/teal (peacock/krishna vibe)
        border: '#06b6d4'
      };
    }

    const isEntspannung = 
      nameLower.includes('entspannung') || 
      nameLower.includes('klangreise') || 
      nameLower.includes('yogageschichten am kamin') || 
      nameLower.includes('peziebälle') || 
      nameLower.includes('fantasiereise') ||
      nameLower.includes('spaziergang') ||
      styleLower.includes('entspannung');
      
    if (isEntspannung) {
      return {
        bg: '#ffedd5', // warm sand/light orange
        border: '#f97316' // bright orange
      };
    }

    const isYellow = 
      (nameLower.includes('meditation') || 
       nameLower.includes('satsang') || 
       nameLower.includes('om namo') || 
       nameLower.includes('ankommen') ||
       styleLower.includes('meditation')) &&
      !nameLower.includes('ankommensstunde');
    
    if (isYellow) {
      return {
        bg: '#fef9c3', // golden yellow
        border: '#eab308' // deep gold
      };
    } else {
      return {
        bg: '#fff7ed', // very light saffron
        border: '#ea580c' // deep saffron / terracotta
      };
    }
  }

  function getDisplayedHours(currentCourses: (Course | YlaTeacherWeekSlot)[]): number[] {
    const defaultHours = [6, 7, 9, 16, 19, 20, 21];
    const activeHours = new Set<number>();
    currentCourses.forEach(c => {
      const h = parseInt(c.startTime.split(':')[0], 10);
      if (!isNaN(h)) {
        activeHours.add(h);
      }
    });
    const combined = new Set([...defaultHours, ...activeHours]);
    return Array.from(combined).sort((a, b) => a - b);
  }

  function getFilteredCoursesForHour(day: number, hour: number): (Course | YlaTeacherWeekSlot)[] {
    const regular = courses
      .filter(c => c.dayOfWeek === day)
      .filter(c => {
        const startHour = parseInt(c.startTime.split(':')[0], 10);
        return startHour === hour;
      })
      .filter(c => {
        // If onlyMySlots is active, only show courses assigned to the selected teacher
        if (onlyMySlotsParam && selectedTeacher) {
          return c.teacherId === selectedTeacher.id;
        }
        return true;
      });

    const yla = (selectedTeacher ? selectedTeacherYlaSlots : [])
      .filter(s => s.dayOfWeek === day)
      .filter(s => {
        const startHour = parseInt(s.startTime.split(':')[0], 10);
        return startHour === hour;
      });

    return [...regular, ...yla].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function loadData() {
    weekPlans = db.getWeekPlans();
    teachers = db.getTeachers();
    rooms = db.getRooms();
    
    const monday = getMondayOfCurrentWeek();
    const weekCode = getWeekCode(monday);
    
    let foundPlan = weekPlans.find(p => p.targetWeekCode === weekCode);
    const approved = !!foundPlan && (foundPlan.isApproved === true || (foundPlan.status === 'approved' && foundPlan.isApproved !== false));
    
    isWeekApproved = approved;
    currentPlan = foundPlan || null;
    
    if (approved && currentPlan) {
      // Dynamically filter out absent teachers & remove Pranayama during YLA
      const sevafreiList = db.getSevafrei();
      
      courses = currentPlan.courses
        .filter(c => {
          const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
          if (isPranayama) {
            const courseDate = getLocalDateForDay(weekCode, c.dayOfWeek);
            if (isDateInYlaRange(courseDate)) return false;
          }
          return true;
        })
        .map(c => {
        if (!c.teacherId) return c;
        const teacher = teachers.find(t => t.id === c.teacherId);
        if (!teacher) return c;
        
        const courseDate = getLocalDateForDay(weekCode, c.dayOfWeek);
        
        // Support composite teacher names (e.g. "Adam, Anjali")
        const namesToCheck: string[] = [];
        if (teacher.name.includes(',')) {
          teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
        } else {
          namesToCheck.push(teacher.name.toLowerCase().trim());
        }
        
        let isAbsent = false;
        for (const name of namesToCheck) {
          const activeAbsence = sevafreiList.find((entry: any) => {
            const entryName = entry.teacherName.toLowerCase().trim();
            const isMatch = entryName.includes(name) || name.includes(entryName.split(' ')[0]);
            return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
          });
          if (activeAbsence) {
            const isSatsang = c.name.toLowerCase().includes('satsang');
            const isBypassedType = ['seminartage'].includes(activeAbsence.type.toLowerCase());
            const isWalk = c.name.toLowerCase().includes('spaziergang');
            const isPranava = teacher.name.toLowerCase().includes('pranava');
            const isRegularFreeDay = activeAbsence.type?.toLowerCase() === 'frei' || (activeAbsence.note && activeAbsence.note.toLowerCase().includes('regulärer freier wochentag'));

            if (isSatsang && isBypassedType) {
              // Bypassed for Satsangs
            } else if (isWalk && isPranava && isRegularFreeDay) {
              // Pranava standardmäßig für meditativen Spaziergang eingeteilt
            } else {
              isAbsent = true;
              break;
            }
          }
        }
        
        if (isAbsent && c.isAiPlanned) {
          return { ...c, teacherId: null };
        }
        return c;
      });
    } else {
      courses = [];
    }
  }

  function toggleFullscreen() {
    const container = document.getElementById('view-calendar-container');
    if (!container) return;

    if (!document.fullscreenElement && !isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {
          isFullscreen = true;
        });
      } else {
        isFullscreen = true;
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          isFullscreen = false;
        });
      } else {
        isFullscreen = false;
      }
    }
  }

  function navigateWeek(direction: number) {
    currentWeekOffset += direction;
    loadData();
  }

  function selectTeacher(teacherId: string) {
    const params = new URLSearchParams(page.url.searchParams);
    if (teacherId) {
      params.set('teacher', teacherId);
      params.set('onlyMySlots', 'true');
    } else {
      params.delete('teacher');
      params.delete('onlyMySlots');
    }
    goto(`?${params.toString()}`);
  }


</script>

<div class="view-page-container">
  <!-- Minimalist Header -->
  <header class="view-header">
    <div class="logo-area">
      <img src={nataraja} alt="Yoga Vidya Logo" class="logo-img"/>
      <div>
        <h2>YOGA VIDYA NORDSEE</h2>
        <h1>Wochenplan</h1>
      </div>
    </div>
    
    <!-- User Info & Interactive Toggles -->
    <div class="header-controls">
      <div class="view-selector-group">
        <label for="teacher-select">Ansicht filtern:</label>
        <select 
          id="teacher-select" 
          class="view-select-dropdown" 
          value={selectedTeacher?.id || ''} 
          onchange={(e) => selectTeacher(e.currentTarget.value)}
        >
          <option value="">👥 Gesamtübersicht</option>
          <optgroup label="Sevakas (Team)">
            {#each sevakaTeachersList as t}
              <option value={t.id}>🧘 {t.name}</option>
            {/each}
          </optgroup>
          {#if karmaTeachersList.length > 0}
            <optgroup label="Karma-Yogis & externe Seminarleiter">
              {#each karmaTeachersList as t}
                <option value={t.id}>✨ {t.name} ({t.roleType === 'guest_teacher' ? 'Gast-SL' : 'Karma-Yogi'})</option>
              {/each}
            </optgroup>
          {/if}
          <optgroup label="Externe Lehrer">
            {#each externalTeachersList as t}
              <option value={t.id}>👤 {t.name}</option>
            {/each}
          </optgroup>
        </select>
      </div>

      <button 
        type="button" 
        class="btn sync-header-btn" 
        onclick={handleHeaderSync}
        disabled={isSyncing}
        title="Lade neueste Urlaube & Wünsche neu vom Server"
      >
        <span class:icon-spin={isSyncing}>🔄</span> {isSyncing ? 'Synchronisiere...' : 'Synchronisieren'}
      </button>

      <button 
        type="button" 
        class="btn logout-header-btn" 
        onclick={() => { 
          localStorage.removeItem('rapla_user_role'); 
          goto('/login'); 
        }}
      >
        🚪 Abmelden
      </button>

        <div class="user-badge" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
          <span class="user-icon">👥</span>
          <div>
            <div class="badge-title" style="color: #1e293b;">Team-Ansicht</div>
            <div class="badge-subtitle">Gesamtübersicht</div>
          </div>
        </div>
    </div>
  </header>

  {#if syncFeedback}
    <div style="margin-bottom: 1.5rem; padding: 0.75rem 1.25rem; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; border-radius: 8px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <span>{syncFeedback}</span>
      <button type="button" onclick={() => { syncFeedback = null; }} style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #065f46;">✕</button>
    </div>
  {/if}

  {#if selectedTeacher}
    <div class="personal-teacher-header-banner animate-fade-in">
      <div class="teacher-avatar-badge" style="background-color: {selectedTeacher.avatarColor || '#ea580c'};">
        {selectedTeacher.name.charAt(0)}
      </div>
      <div class="teacher-info-col">
        <div class="teacher-name-row">
          <h2>Persönlicher Wochenplan: <strong>{selectedTeacher.name}</strong></h2>
          {#if selectedTeacherYlaSlots.length > 0}
            <span class="yla-counter-pill">
              🧘‍♂️ {selectedTeacherYlaSlots.length}x 4-Wochen YLA eingeteilt
            </span>
          {/if}
        </div>
        <div class="teacher-details-row">
          <span>Rolle: <strong>{selectedTeacher.roleType === 'sevaka' ? 'Sevaka (Team)' : selectedTeacher.roleType === 'karma_yogi' ? 'Karma-Yogi' : selectedTeacher.roleType === 'guest_teacher' ? 'Gast-Seminarleiter' : 'Unterrichtende/r'}</strong></span>
          {#if selectedTeacherYlaSlots.length > 0}
            <span class="dot-separator">•</span>
            <span class="yla-active-notice">
              ✨ Deine Einteilungen für die 4-wöchige Yogalehrerausbildung sind im Plan hervorgehoben!
            </span>
          {/if}
        </div>
      </div>
      <button 
        type="button" 
        class="btn btn-secondary btn-small reset-filter-btn" 
        onclick={() => selectTeacher('')}
        title="Zurück zur Gesamtübersicht"
      >
        ✕ Gesamtübersicht
      </button>
    </div>
  {/if}

  <!-- Calendar Roster Grid (Desktop Only) -->
  <div class="desktop-only-grid">
    <div id="view-calendar-container" class="calendar-grid-container animate-fade-in" class:fullscreen-mode={isFullscreen}>
      <div class="grid-controls-row">
        <div class="navigation-group">
          <button type="button" class="btn btn-current-week btn-small" onclick={() => { currentWeekOffset = 0; loadData(); }}>Aktuelle Woche</button>
          <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(-1)}>◀ Letzte Woche</button>
          <span class="week-title-badge">
            KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())} ({currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())})
          </span>
          <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(1)}>Nächste Woche ▶</button>
        </div>

        <div class="action-buttons-group">
          <button type="button" class="btn btn-secondary btn-small fullscreen-toggle-btn" onclick={toggleFullscreen}>
            {isFullscreen ? '🗗 Beenden' : '🖥️ Vollbild'}
          </button>
        </div>
      </div>

      {#if !isWeekApproved}
        <div class="unapproved-week-notice animate-fade-in">
          <div class="notice-icon-large">🔒</div>
          <h2>Wochenplan noch nicht freigegeben</h2>
          <p class="notice-main-text">
            Der Wochenplan für <strong>KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())} ({getDayDateString(5)} – {getDayDateString(4)})</strong> befindet sich noch in der Vorbereitung und wurde von der Leitung noch nicht genehmigt.
          </p>
          <p class="notice-sub-text">
            Sobald die Freigabe erteilt wird, werden alle Kurse, Zeiten und Zuweisungen hier automatisch für das gesamte Team sichtbar.
          </p>
          <div class="notice-action-row" style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button 
              type="button" 
              class="btn btn-primary btn-small" 
              onclick={() => { currentWeekOffset = findDefaultApprovedWeekOffset(weekPlans); loadData(); }}
            >
              📅 Zur freigegebenen Woche
            </button>
            {#if currentWeekOffset !== 0}
              <button 
                type="button" 
                class="btn btn-secondary btn-small" 
                onclick={() => { currentWeekOffset = 0; loadData(); }}
              >
                Aktuelle Woche (KW {getWeekNumber(getMondayForOffset(0))})
              </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="calendar-grid">
          <!-- Top Left Header Info -->
          <div class="grid-header-cell week-header">
            <div class="week-label">TAG / ZEIT</div>
          </div>

          <!-- Week Days Headers starting from Friday -->
          {#each DAYS as day}
            {@const isToday = new Date().getDay() === day.value && currentWeekOffset === 0}
            {@const currentWeekCode = currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())}
            {@const dayDateStr = getLocalDateForDay(currentWeekCode, day.value)}
            {@const isYlaWednesday = day.value === 3 && isDateInYlaRange(dayDateStr)}
            <div class="grid-header-cell day-header" class:header-today={isToday} class:header-schweigetag={isYlaWednesday}>
              {#if isYlaWednesday}
                <div class="schweigetag-pill" title="Schweigen bis 12 Uhr wegen YLA">
                  <div class="schweigetag-pill-title">🤫 Schweigetag</div>
                  <div class="schweigetag-pill-sub">Schweigen bis 12 Uhr wegen YLA</div>
                </div>
              {/if}
              <span class="day-label-short">{day.label}</span>
              <span class="day-date">{getDayDateString(day.value)}</span>
            </div>
          {/each}

          <!-- Grid Rows by Hour -->
          {#each getDisplayedHours(allDisplayCourses) as hour, idx}
            {@const hoursList = getDisplayedHours(allDisplayCourses)}
            {@const prevHour = idx > 0 ? hoursList[idx - 1] : null}
            {@const isMiddayGap = prevHour !== null && prevHour <= 10 && hour >= 15}

            {#if isMiddayGap}
              <div class="grid-midday-gap" aria-hidden="true"></div>
            {/if}

            <div class="grid-time-cell">
              <span>{hour.toString().padStart(2, '0')}:00</span>
            </div>

            {#each DAYS as day}
              <div class="grid-content-cell">
                {#each getFilteredCoursesForHour(day.value, hour) as course}
                  {@const isYla = (course as any).isYla === true}
                  {@const isHighlighted = selectedTeacher && (course.teacherId === selectedTeacher.id || isYla)}
                  {@const colors = getCourseColor(course)}
                  {@const teacherName = isYla ? (course as any).teacherName : (teachers.find(t => t.id === course.teacherId)?.name || 'Unbesetzt')}
                  {@const roomName = isYla ? ((course as any).roomName || 'Sivananda Saal (YLA)') : (rooms.find(r => r.id === course.roomId)?.name || course.roomId || 'Raum?')}
                  
                  {#if isYla}
                    {@const yla = course as any}
                    <div 
                      class="course-card-rapla yla-course-card highlighted-card"
                      style="background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); border-left: 5px solid #9333ea; box-shadow: 0 3px 8px rgba(147, 51, 234, 0.18);"
                      title="{yla.slotLabel}: {yla.topic}"
                    >
                      <div class="card-top-line">
                        <span class="card-time" style="color: #7e22ce; font-weight: 800;">⏰ {yla.startTime} - {yla.endTime}</span>
                        <span class="yla-badge-pill">🧘‍♂️ 4-Wochen YLA</span>
                      </div>
                      <div class="card-title-line" style="color: #581c87; font-weight: 800;">
                        {yla.name.replace('4-Wochen YLA: ', '')}
                      </div>
                      <div class="card-subtitle-line">
                        📍 {yla.roomName} • {yla.badge}
                      </div>
                      <div class="card-teacher-line" style="color: #6b21a8; font-weight: 700;">
                        👤 {yla.teacherName}
                      </div>
                    </div>
                  {:else}
                    <div 
                      class="course-card-rapla" 
                      class:highlighted-card={isHighlighted}
                      class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                      class:unassigned-card={!course.teacherId || course.teacherId === 'teacher-gen-yl'}
                      style="background-color: {colors.bg}; border-left: 4px solid {isHighlighted ? '#ea580c' : colors.border};"
                    >
                      <div class="card-top-line">
                        <span class="card-time">{course.startTime} - {course.endTime}</span>
                        <span class="card-room">{roomName}</span>
                      </div>
                      <div class="card-title-line">{course.name}</div>
                      <div class="card-teacher-line">
                        👤 {teacherName}
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
            {/each}
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Mobile View (Phone Only) -->
  <div class="mobile-only-agenda">
    <!-- Navigation for Weeks on Mobile -->
    <div class="mobile-week-nav">
      <button type="button" class="btn btn-current-week btn-small" onclick={() => { currentWeekOffset = 0; loadData(); }}>Aktuelle Woche</button>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(-1)}>◀</button>
      <span class="week-title-badge-mobile">
        KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())} ({currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())})
      </span>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(1)}>▶</button>
    </div>

    {#if !isWeekApproved}
      <div class="unapproved-week-notice animate-fade-in" style="margin: 1.5rem 0.5rem; padding: 2rem 1rem;">
        <div class="notice-icon-large">🔒</div>
        <h2 style="font-size: 1.25rem;">Wochenplan noch nicht freigegeben</h2>
        <p class="notice-main-text" style="font-size: 0.9rem;">
          Der Wochenplan für <strong>KW {currentPlan?.targetWeekCode ? parseInt(currentPlan.targetWeekCode.split('-W')[1], 10) : getWeekNumber(getMondayOfCurrentWeek())}</strong> befindet sich noch in der Vorbereitung und wurde von der Leitung noch nicht genehmigt.
        </p>
        <p class="notice-sub-text">
          Sobald die Freigabe erfolgt ist, erscheint der Plan hier automatisch.
        </p>
        <div class="notice-action-row" style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
          <button 
            type="button" 
            class="btn btn-primary btn-small" 
            onclick={() => { currentWeekOffset = findDefaultApprovedWeekOffset(weekPlans); loadData(); }}
          >
            📅 Zur freigegebenen Woche
          </button>
          {#if currentWeekOffset !== 0}
            <button 
              type="button" 
              class="btn btn-secondary btn-small" 
              onclick={() => { currentWeekOffset = 0; loadData(); }}
            >
              Aktuelle Woche
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Day Selector Tabs -->
      <div class="mobile-day-tabs">
        {#each DAYS as day}
          {@const isToday = new Date().getDay() === day.value && currentWeekOffset === 0}
          {@const currentWeekCode = currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek())}
          {@const dayDateStr = getLocalDateForDay(currentWeekCode, day.value)}
          {@const isYlaWednesday = day.value === 3 && isDateInYlaRange(dayDateStr)}
          <button 
            type="button" 
            class="day-tab-btn" 
            class:active={activeMobileDay === day.value}
            class:is-today={isToday}
            class:tab-schweigetag={isYlaWednesday}
            onclick={() => activeMobileDay = day.value}
          >
            {#if isYlaWednesday}
              <span class="schweigetag-tab-pill">🤫 Schweigetag</span>
            {/if}
            <span class="day-tab-name">{day.label.substring(0, 2)}</span>
            <span class="day-tab-date">{getDayDateString(day.value)}</span>
          </button>
        {/each}
      </div>

      <!-- Timeline of Courses -->
      <div class="mobile-agenda-list">
        {#if activeMobileDay === 3 && isDateInYlaRange(getLocalDateForDay(currentPlan?.targetWeekCode || getWeekCode(getMondayOfCurrentWeek()), 3))}
          <div class="mobile-schweigetag-banner">
            <span class="banner-icon">🤫</span>
            <div class="banner-text">
              <span class="banner-title">Schweigetag</span>
              <span class="banner-sub">Schweigen bis 12 Uhr wegen YLA</span>
            </div>
          </div>
        {/if}

        {#if filteredMobileCourses.length === 0}
          <div class="empty-agenda-state">
            📭 Keine Stunden für diesen Tag eingetragen.
          </div>
        {:else}
          {#each filteredMobileCourses as course}
            {@const isYla = (course as any).isYla === true}
            {@const isHighlighted = selectedTeacher && (course.teacherId === selectedTeacher.id || isYla)}
            {@const colors = getCourseColor(course)}
            {@const teacherName = isYla ? (course as any).teacherName : (teachers.find(t => t.id === course.teacherId)?.name || 'Unbesetzt')}
            {@const roomName = isYla ? ((course as any).roomName || 'Sivananda Saal (YLA)') : (rooms.find(r => r.id === course.roomId)?.name || course.roomId || 'Raum?')}

            {#if isYla}
              {@const yla = course as any}
              <div 
                class="mobile-agenda-card yla-mobile-card highlighted-card"
                style="background: linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%); border-left: 6px solid #9333ea; box-shadow: 0 4px 10px rgba(147, 51, 234, 0.15);"
              >
                <div class="agenda-time-room">
                  <span class="agenda-time" style="color: #7e22ce; font-weight: 800;">⏰ {yla.startTime} - {yla.endTime}</span>
                  <span class="yla-badge-pill">🧘‍♂️ 4-Wochen YLA</span>
                </div>
                <h3 class="agenda-title" style="color: #581c87; font-weight: 800;">{yla.name.replace('4-Wochen YLA: ', '')}</h3>
                <div style="font-size: 0.75rem; color: #7e22ce; margin-bottom: 0.25rem; font-weight: 600;">
                  📍 {yla.roomName} • {yla.badge}
                </div>
                <div class="agenda-teacher" style="color: #6b21a8; font-weight: 700;">
                  👤 {yla.teacherName}
                </div>
              </div>
            {:else}
              <div 
                class="mobile-agenda-card"
                class:highlighted-card={isHighlighted}
                class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
                class:unassigned-card={!course.teacherId || course.teacherId === 'teacher-gen-yl'}
                style="background-color: {colors.bg}; border-left: 5px solid {isHighlighted ? '#ea580c' : colors.border};"
              >
                <div class="agenda-time-room">
                  <span class="agenda-time">⏰ {course.startTime} - {course.endTime}</span>
                  <span class="agenda-room">{roomName}</span>
                </div>
                <h3 class="agenda-title">{course.name}</h3>
                <div class="agenda-teacher">
                  👤 {teacherName}
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    {/if}
  </div>
  
  <footer class="view-footer-info" style="margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem; clear: both;">
    <span>Yoga Vidya Nordsee © 2026</span>
    {#if currentPlan}
      <span style="margin: 0 10px;">•</span>
      <button type="button" onclick={handleResetCurrentPlan} style="background: none; border: none; color: #3b82f6; cursor: pointer; text-decoration: underline; font-size: 0.8rem; padding: 0; font-family: inherit;">Aktuellen Plan auf Blanko-Vorlage zurücksetzen</button>
    {/if}
  </footer>
</div>

<style>
  .view-page-container {
    padding: 1.5rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    font-family: 'Outfit', 'Inter', sans-serif;
    background-color: #fffbf7; /* warm ivory background */
    min-height: 100vh;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1.25rem;
    border-bottom: 2px solid #fed7aa; /* warm orange border */
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo-img {
    height: 56px;
    width: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ea580c; /* Saffron border */
    box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2); /* Saffron glow */
  }

  .logo-area h2 {
    font-size: 0.85rem;
    font-weight: 700;
    color: #ea580c;
    letter-spacing: 0.15em;
    margin: 0;
  }

  .logo-area h1 {
    font-size: 1.6rem;
    font-weight: 800;
    color: #9a3412; /* Darker terracotta / deep orange */
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .view-selector-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: inherit;
  }

  .view-selector-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #475569;
  }

  .view-select-dropdown {
    padding: 0.5rem 2rem 0.5rem 1rem;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1e293b;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 30px;
    outline: none;
    cursor: pointer;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 14px;
    min-width: 180px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }

  .view-select-dropdown:hover {
    border-color: #94a3b8;
    background-color: #f8fafc;
  }

  .view-select-dropdown:focus {
    border-color: #ea580c;
    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
  }

  .sync-header-btn {
    background: linear-gradient(135deg, #0284c7, #0369a1);
    color: white !important;
    border: none;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(3, 105, 161, 0.2);
    border-radius: 30px;
    padding: 0.5rem 1.25rem;
    transition: all 0.2s ease;
  }

  .sync-header-btn:hover {
    background: linear-gradient(135deg, #0369a1, #075985);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(3, 105, 161, 0.3);
  }

  .logout-header-btn {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white !important;
    border: none;
    font-weight: 700;
    box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
    border-radius: 30px;
    padding: 0.5rem 1.25rem;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .logout-header-btn:hover {
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(220, 38, 38, 0.3);
  }

  .user-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    border-radius: 30px;
  }

  .user-icon {
    font-size: 1.25rem;
  }

  .badge-title {
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .badge-subtitle {
    font-size: 0.7rem;
    opacity: 0.85;
  }

  /* Roster Calendar Grid Styling */
  .calendar-grid-container {
    width: 100%;
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    padding: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  .grid-controls-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #f1f5f9;
    border-radius: 8px;
    margin-bottom: 6px;
  }

  .navigation-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

  .calendar-grid {
    display: grid;
    grid-template-columns: 80px repeat(7, minmax(140px, 1fr));
    grid-auto-rows: auto;
    background-color: #cbd5e1;
    gap: 1px;
    width: 100%;
    min-width: 1060px;
    border-radius: 8px;
    overflow: hidden;
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

  .header-today {
    background: #eff6ff;
    border-top: 3px solid #3b82f6;
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

  .course-card-rapla {
    padding: 6px 8px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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

  .card-teacher-line {
    font-size: 0.7rem;
    font-weight: 600;
    color: #334155;
  }

  /* Highlight and Dim effects for personalized filters */
  .highlighted-card {
    box-shadow: 0 4px 8px rgba(234, 88, 12, 0.15);
    transform: scale(1.02);
  }

  .dimmed-card {
    opacity: 0.8;
  }

  .dimmed-card:hover {
    opacity: 0.9;
    filter: none;
  }

  /* Fullscreen Mode override */
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

  .calendar-grid-container.fullscreen-mode .calendar-grid,
  .calendar-grid-container:fullscreen .calendar-grid {
    height: auto !important;
    min-height: fit-content !important;
    grid-auto-rows: auto !important;
    min-width: 1060px !important;
    overflow: visible !important;
    flex: none !important;
    width: 100% !important;
  }

  .calendar-grid-container.fullscreen-mode .grid-time-cell,
  .calendar-grid-container:fullscreen .grid-time-cell {
    min-height: 75px !important;
    height: auto !important;
  }

  .calendar-grid-container.fullscreen-mode .grid-content-cell,
  .calendar-grid-container:fullscreen .grid-content-cell {
    min-height: 75px !important;
    height: auto !important;
    padding: 4px 6px !important;
    gap: 4px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: flex-start !important;
  }

  .calendar-grid-container.fullscreen-mode .course-card-rapla,
  .calendar-grid-container:fullscreen .course-card-rapla {
    padding: 6px 8px !important;
    min-height: fit-content !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    gap: 3px !important;
    flex-shrink: 0 !important;
  }

  .calendar-grid-container.fullscreen-mode .card-title-line,
  .calendar-grid-container:fullscreen .card-title-line {
    font-size: 0.85rem !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
  }

  .calendar-grid-container.fullscreen-mode .card-top-line,
  .calendar-grid-container:fullscreen .card-top-line {
    font-size: 0.72rem !important;
  }

  .calendar-grid-container.fullscreen-mode .card-teacher-line,
  .calendar-grid-container:fullscreen .card-teacher-line {
    font-size: 0.72rem !important;
  }

  /* Buttons */
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

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Responsive Breakpoints & Toggles */
  @media (min-width: 1101px) {
    .desktop-only-grid {
      display: block;
    }
    .mobile-only-agenda {
      display: none;
    }
  }

  @media (max-width: 1100px) {
    .view-page-container {
      padding: 1rem 0.5rem;
      overflow-x: hidden;
      max-width: 100vw;
    }

    .desktop-only-grid {
      display: none;
    }
    .mobile-only-agenda {
      display: block;
      width: 100%;
      overflow-x: hidden;
    }

    /* Stacking header elements on small devices */
    .view-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1.25rem;
      padding-bottom: 1.25rem;
    }

    .logo-area {
      justify-content: center;
      text-align: center;
    }

    .header-controls {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .user-badge {
      justify-content: center;
    }
  }

  /* Mobile agenda specific CSS styling */
  .mobile-week-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f1f5f9;
    padding: 0.5rem;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    border: 1px solid #cbd5e1;
  }

  .week-title-badge-mobile {
    font-weight: 700;
    font-size: 0.8rem;
    color: #334155;
    background: white;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    text-align: center;
  }

  .mobile-day-tabs {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 0.25rem 0.25rem 0.75rem 0.25rem;
    margin-bottom: 1.25rem;
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
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .day-tab-btn.active {
    background: #ea580c;
    border-color: #ea580c;
    color: white;
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

  .tab-schweigetag.active {
    background: #7e22ce !important;
    border-color: #7e22ce !important;
    color: white !important;
  }

  .tab-schweigetag.active .day-tab-date,
  .tab-schweigetag.active .day-tab-name {
    color: white !important;
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
    display: inline-block;
    white-space: nowrap;
    line-height: 1.1;
  }

  .tab-schweigetag.active .schweigetag-tab-pill {
    background: #ffffff;
    color: #7e22ce;
    border-color: #ffffff;
  }

  .mobile-schweigetag-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #fdf4ff;
    border: 1.5px solid #d8b4fe;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 6px rgba(147, 51, 234, 0.1);
  }

  .mobile-schweigetag-banner .banner-icon {
    font-size: 1.6rem;
    line-height: 1;
  }

  .mobile-schweigetag-banner .banner-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .mobile-schweigetag-banner .banner-title {
    font-size: 0.95rem;
    font-weight: 800;
    color: #6b21a8;
  }

  .mobile-schweigetag-banner .banner-sub {
    font-size: 0.8rem;
    font-weight: 600;
    color: #7e22ce;
  }

  .mobile-agenda-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
    touch-action: pan-y;
  }

  .mobile-agenda-card {
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
    transition: all 0.2s ease;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
  }

  .agenda-time-room {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    font-weight: 750;
    color: #64748b;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.05);
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
    padding: 3.5rem 1rem;
    color: #94a3b8;
    background: white;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
    font-weight: 600;
    font-size: 0.9rem;
  }

  /* High Contrast Unassigned Card Warning Style */
  .unassigned-card {
    border-left: 5px solid #dc2626 !important;
    animation: pulse-warning 2.5s infinite ease-in-out;
  }

  .unassigned-card .card-top-line,
  .unassigned-card .agenda-time-room {
    color: #e11d48 !important;
  }

  .unassigned-card .card-room,
  .unassigned-card .agenda-room {
    color: #be123c !important;
  }

  .unassigned-card .card-title-line,
  .unassigned-card .agenda-title {
    color: #881337 !important;
  }

  .unassigned-card .card-teacher-line,
  .unassigned-card .agenda-teacher {
    color: #be123c !important;
    font-weight: 800 !important;
  }

  @keyframes pulse-warning {
    0%, 100% {
      background-color: #ffe4e6; /* rose-100 */
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    50% {
      background-color: #fecdd3; /* rose-200 - strong alert red/rose */
      box-shadow: 0 0 12px rgba(225, 29, 72, 0.4);
    }
  }

  /* Unapproved Notice Card */
  .unapproved-week-notice {
    background: #ffffff;
    border: 2px dashed #fed7aa;
    border-radius: 16px;
    padding: 3.5rem 2rem;
    text-align: center;
    max-width: 680px;
    margin: 2.5rem auto;
    box-shadow: 0 4px 20px rgba(234, 88, 12, 0.06);
  }

  .notice-icon-large {
    font-size: 3.25rem;
    margin-bottom: 1rem;
    line-height: 1;
  }

  .unapproved-week-notice h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #9a3412;
    margin: 0 0 0.75rem 0;
  }

  .notice-main-text {
    font-size: 1rem;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 0.5rem;
  }

  .notice-sub-text {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  .notice-action-row {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  /* Personal Teacher Banner & YLA Styling */
  .personal-teacher-header-banner {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
    border: 2px solid #fed7aa;
    border-radius: 14px;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.08);
  }

  .teacher-avatar-badge {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    color: white;
    font-size: 1.4rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  }

  .teacher-info-col {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex-grow: 1;
  }

  .teacher-name-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .teacher-name-row h2 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .teacher-name-row h2 strong {
    color: #ea580c;
  }

  .yla-counter-pill {
    background: #f3e8ff;
    color: #7e22ce;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    border: 1px solid #d8b4fe;
    box-shadow: 0 2px 4px rgba(126, 34, 206, 0.1);
  }

  .teacher-details-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #64748b;
    flex-wrap: wrap;
  }

  .yla-active-notice {
    color: #7e22ce;
    font-weight: 600;
  }

  .dot-separator {
    color: #cbd5e1;
  }

  .reset-filter-btn {
    flex-shrink: 0;
  }

  .yla-badge-pill {
    background: #f3e8ff;
    color: #7e22ce;
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #d8b4fe;
    white-space: nowrap;
  }

  .yla-course-card {
    border-left: 5px solid #9333ea !important;
  }

  .yla-course-card:hover {
    box-shadow: 0 6px 14px rgba(147, 51, 234, 0.25) !important;
    transform: translateY(-1px);
  }

  .yla-mobile-card {
    border-left: 6px solid #9333ea !important;
  }

  .card-subtitle-line {
    font-size: 0.68rem;
    color: #7e22ce;
    font-weight: 600;
    line-height: 1.2;
    margin-top: 1px;
  }
</style>
