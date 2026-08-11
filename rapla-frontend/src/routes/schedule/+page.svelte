<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { db, type Course, type Teacher, type Room, type WeekPlan } from '$lib/db';
  import { validateAssignment, type ConflictMessage, getLocalDateForDay } from '$lib/planningEngine';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  let courses = $state<Course[]>([]);
  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let weekPlans = $state<WeekPlan[]>([]);
  let currentPlan = $state<WeekPlan | null>(null);
  let currentWeekOffset = $state(0);

  function getWeekCode(date: Date): string {
    const year = date.getFullYear();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  // Deriving active plan ID from URL query param
  let planId = $derived(page.url.searchParams.get('planId') || '');

  // Filter states
  let selectedRoomFilter = $state('all');
  let selectedTeacherFilter = $state('all');

  // Modal states
  let isModalOpen = $state(false);
  let editingCourse = $state<Course | null>(null);
  let isFullscreen = $state(false);

  // Form fields
  let formName = $state('');
  let formStyle = $state('Hatha');
  let formDayOfWeek = $state(1); // Monday
  let formStartTime = $state('09:00');
  let formEndTime = $state('10:30');
  let formRoomId = $state('');
  let formTeacherId = $state<string | null>(null);

  // Active validation conflicts for the selected teacher in the form
  let activeConflicts = $state<ConflictMessage[]>([]);

  const DAYS = [
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' },
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' }
  ];

  const YOGA_STYLES = ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Entspannung', 'Power Yoga', 'Kundalini'];

  onMount(() => {
    loadData();
  });

  // Helper to find the Monday of the current week
  function getMondayOfCurrentWeek(): Date {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today.getTime());
    monday.setDate(today.getDate() - daysSinceMonday + (currentWeekOffset * 7));
    return monday;
  }

  // ISO-8601 week number
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Helper to calculate date of current week's days starting on Friday
  function getDayDateString(dayValue: number): string {
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

  // Get color based on course name or style to match the image theme
  function getCourseColor(course: Course): { bg: string; border: string } {
    const isUnassigned = !course.teacherId || course.teacherId === 'teacher-gen-yl';
    if (isUnassigned) {
      return {
        bg: '#fee2e2', // light red/rose
        border: '#ef4444' // red
      };
    }

    const nameLower = course.name.toLowerCase();
    const styleLower = course.style.toLowerCase();
    
    if (nameLower.includes('hausführung')) {
      return {
        bg: '#e0f2fe',
        border: '#38bdf8'
      };
    }

    if (nameLower.includes('entspannungsangebot') && [1, 3, 4].includes(course.dayOfWeek)) {
      return {
        bg: '#ffb347',
        border: '#e69900'
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
        bg: '#ffffcc', // bright light yellow
        border: '#dddd66'
      };
    } else {
      return {
        bg: '#ffcce6', // bright light pink
        border: '#ff99cc'
      };
    }
  }

  // Retrieve displaying hours dynamically to hide empty hours but show scheduled and core ones
  function getDisplayedHours(currentCourses: Course[]): number[] {
    const defaultHours = [5, 6, 7, 8, 9, 12, 14, 16, 19, 20, 21];
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

  // Get filtered courses for a specific day and hour
  function getFilteredCoursesForHour(day: number, hour: number): Course[] {
    return courses
      .filter(c => c.dayOfWeek === day)
      .filter(c => {
        const startHour = parseInt(c.startTime.split(':')[0], 10);
        return startHour === hour;
      })
      .filter(c => selectedRoomFilter === 'all' || c.roomId === selectedRoomFilter)
      .filter(c => selectedTeacherFilter === 'all' || c.teacherId === selectedTeacherFilter)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Keep state updated on planId transitions
  $effect(() => {
    const _ = planId;
    untrack(() => {
      loadData();
    });
  });

  function loadData() {
    weekPlans = db.getWeekPlans();
    teachers = db.getTeachers();
    rooms = db.getRooms();
    
    if (planId) {
      currentPlan = db.getWeekPlan(planId) || null;
    } else {
      const monday = getMondayOfCurrentWeek();
      const weekCode = getWeekCode(monday);
      const isAfterW40 = weekCode > '2026-W40';
      
      let foundPlan = weekPlans.find(p => p.targetWeekCode === weekCode && p.status === 'approved')
                   || weekPlans.find(p => p.targetWeekCode === weekCode);
                   
      if (!foundPlan) {
        if (isAfterW40) {
          const template = weekPlans.find(p => p.id === 'plan-template-1') || weekPlans[0];
          foundPlan = {
            ...template,
            id: `plan-blank-${weekCode}`,
            targetWeekCode: weekCode,
            courses: template.courses.map(c => ({ ...c, teacherId: null, isAiPlanned: false, status: 'draft' }))
          };
        } else {
          foundPlan = weekPlans.find(p => p.id === 'plan-template-1')
                   || weekPlans[0]
                   || null;
        }
      }
      currentPlan = foundPlan;
    }
    
    if (currentPlan) {
      const weekCode = currentPlan.targetWeekCode || getWeekCode(getMondayOfCurrentWeek());
      const saved = typeof window !== 'undefined' ? localStorage.getItem('rapla_sevafrei') : null;
      const sevafreiList = saved ? JSON.parse(saved) : [];
      
      courses = currentPlan.courses.map(c => {
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
            if (isSatsang && isBypassedType) {
              // Bypassed for Satsangs
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
    
    // Set default room for form
    if (rooms.length > 0 && !formRoomId) {
      formRoomId = rooms[0].id;
    }
  }

  function createBlankWeek() {
    const name = prompt('Name für die neue Blankowoche (z. B. Blankowoche Sommer 2026):');
    if (!name) return;
    
    const newPlan: WeekPlan = {
      id: 'plan-' + Date.now(),
      name,
      status: 'blanko',
      courses: db.getCourses('plan-template-1').map(c => ({
        ...c,
        id: 'course-' + Math.random().toString(36).substr(2, 9),
        teacherId: null,
        isAiPlanned: false,
        status: 'draft'
      })),
      createdAt: new Date().toISOString()
    };
    
    db.addWeekPlan(newPlan);
    loadData();
    
    goto(`/ai-planning?planId=${newPlan.id}`);
  }

  function selectPlan(plan: WeekPlan) {
    if (plan.status === 'approved') {
      goto(`/schedule?planId=${plan.id}`);
    } else {
      goto(`/ai-planning?planId=${plan.id}`);
    }
  }

  // Check conflicts for a course displayed in the list
  function getCourseConflicts(course: Course): ConflictMessage[] {
    if (!course.teacherId) return [];
    const teacher = teachers.find(t => t.id === course.teacherId);
    if (!teacher) return [];
    return validateAssignment(teacher, course, courses, currentPlan?.seminarLeaderIds || [], currentPlan?.targetWeekCode);
  }

  // Reactively validate the form selection
  $effect(() => {
    if (!formTeacherId) {
      activeConflicts = [];
      return;
    }
    const selectedTeacher = teachers.find(t => t.id === formTeacherId);
    if (!selectedTeacher) {
      activeConflicts = [];
      return;
    }

    // Create a temporary mock course matching form inputs to validate
    const tempCourse: Course = {
      id: editingCourse?.id || 'temp',
      name: formName,
      style: formStyle,
      dayOfWeek: Number(formDayOfWeek),
      startTime: formStartTime,
      endTime: formEndTime,
      roomId: formRoomId,
      teacherId: formTeacherId,
      isAiPlanned: false,
      status: 'draft'
    };

    activeConflicts = validateAssignment(selectedTeacher, tempCourse, courses, currentPlan?.seminarLeaderIds || [], currentPlan?.targetWeekCode);
  });

  function toggleSeminarLeader(teacherId: string) {
    if (!currentPlan) return;
    const currentLeaders = currentPlan.seminarLeaderIds || [];
    if (currentLeaders.includes(teacherId)) {
      currentPlan.seminarLeaderIds = currentLeaders.filter(id => id !== teacherId);
    } else {
      currentPlan.seminarLeaderIds = [...currentLeaders, teacherId];
    }
    db.updateWeekPlan(currentPlan);
    loadData();
  }

  function openAddModal() {
    editingCourse = null;
    formName = '';
    formStyle = 'Hatha';
    formDayOfWeek = 1;
    formStartTime = '09:00';
    formEndTime = '10:30';
    formRoomId = rooms[0]?.id || '';
    formTeacherId = null;
    isModalOpen = true;
  }

  function openEditModal(course: Course) {
    editingCourse = course;
    formName = course.name;
    formStyle = course.style;
    formDayOfWeek = course.dayOfWeek;
    formStartTime = course.startTime;
    formEndTime = course.endTime;
    formRoomId = course.roomId;
    formTeacherId = course.teacherId;
    isModalOpen = true;
  }

  function handleSave() {
    if (!formName) return alert('Bitte Kursnamen eingeben');
    if (!formRoomId) return alert('Bitte Raum auswählen');
    if (formStartTime >= formEndTime) return alert('Endzeit muss nach Startzeit liegen');

    // If there are hard conflicts, confirm with user
    const hardConflicts = activeConflicts.filter(c => c.type === 'hard');
    if (hardConflicts.length > 0) {
      const reasons = hardConflicts.map(c => '- ' + c.message).join('\n');
      const proceed = confirm(
        'Achtung: Es gibt harte Konflikte bei dieser Zuweisung:\n' +
        reasons + '\n\n' +
        'Möchtest du diese Person trotzdem einteilen?'
      );
      if (!proceed) return;
    }

    const courseData: Course = {
      id: editingCourse?.id || 'course-' + Date.now(),
      name: formName,
      style: formStyle,
      dayOfWeek: Number(formDayOfWeek),
      startTime: formStartTime,
      endTime: formEndTime,
      roomId: formRoomId,
      teacherId: formTeacherId,
      isAiPlanned: editingCourse ? editingCourse.isAiPlanned && editingCourse.teacherId === formTeacherId : false,
      status: editingCourse?.status || 'draft'
    };

    if (editingCourse) {
      db.updateCourse(courseData, currentPlan?.id);
    } else {
      db.addCourse(courseData, currentPlan?.id);
    }

    isModalOpen = false;
    loadData();
  }

  function handleDelete(id: string) {
    if (confirm('Möchten Sie diesen Kurs wirklich löschen?')) {
      db.deleteCourse(id, currentPlan?.id);
      isModalOpen = false;
      loadData();
    }
  }

  // Get courses filtered by selections
  function getFilteredCourses(day: number): Course[] {
    return courses
      .filter(c => c.dayOfWeek === day)
      .filter(c => selectedRoomFilter === 'all' || c.roomId === selectedRoomFilter)
      .filter(c => selectedTeacherFilter === 'all' || c.teacherId === selectedTeacherFilter)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  function handleSync() {
    if (confirm('Möchtest du den Wochenplan mit dem Server synchronisieren? Eigene ungespeicherte Änderungen am Plan werden zurückgesetzt.')) {
      db.syncDatabase();
    }
  }
</script>

<div class="page-header">
  <div class="title-section">
    <span class="badge badge-primary">Terminkalender</span>
    <h1>Wochenplan <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-secondary); margin-left: 0.5rem;">({currentPlan?.name || 'Aktiv'})</span></h1>
    <p>Aktuelle Yoga-Kurse und Lehrerzuweisungen der laufenden Woche.</p>
  </div>
  <div style="display: flex; gap: 0.75rem; align-items: center;">
    <button class="btn btn-secondary" onclick={handleSync} title="Lädt den neuesten Stand aus dem System">
      <span>🔄</span> Synchronisieren
    </button>
    <button class="btn btn-primary" onclick={openAddModal}>
      <span>➕</span> Kurs hinzufügen
    </button>
  </div>
</div>

<!-- Filters Toolbar on top of Calendar -->
<div class="filters-bar glass-card">
  <div class="filter-group">
    <label class="form-label" for="filter-room">Raum filtern:</label>
    <select id="filter-room" class="form-select filter-select" bind:value={selectedRoomFilter}>
      <option value="all">Alle Räume</option>
      {#each rooms as r}
        <option value={r.id}>{r.name}</option>
      {/each}
    </select>
  </div>

  <div class="filter-group">
    <label class="form-label" for="filter-teacher">Lehrer filtern:</label>
    <select id="filter-teacher" class="form-select filter-select" bind:value={selectedTeacherFilter}>
      <option value="all">Alle Yogalehrer</option>
      {#each teachers as t}
        <option value={t.id}>{t.name}</option>
      {/each}
    </select>
  </div>

  <!-- Rooms legend -->
  <div class="legend-container">
    {#each rooms as r}
      <div class="legend-item">
        <span class="legend-color" style="background-color: {r.color}"></span>
        <span>{r.name}</span>
      </div>
    {/each}
  </div>
</div>

<!-- Wochenkursplan (Calendar Weekly Board) -->
<div class="calendar-grid-container animate-fade-in" class:fullscreen-mode={isFullscreen}>
  <div class="grid-controls-row">
    {#if isFullscreen}
      <span class="fullscreen-title">🧘 Wochenplan (Vollbild)</span>
    {/if}
    <button type="button" class="btn btn-secondary btn-small fullscreen-toggle-btn" onclick={() => isFullscreen = !isFullscreen}>
      {isFullscreen ? '✕ Vollbild beenden' : '🖥️ Vollbild'}
    </button>
  </div>
  <div class="calendar-grid">
    <!-- Header row -->
    <div class="grid-header-cell week-header" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.25rem;">
      <button 
        type="button" 
        class="week-nav-btn" 
        onclick={() => { currentWeekOffset--; loadData(); }}
        title="Vorherige Woche"
      >
        ◀
      </button>
      <div class="week-label" style="font-size: 0.85rem; font-weight: 700; white-space: nowrap;">
        KW {getWeekNumber(getMondayOfCurrentWeek())}
      </div>
      <button 
        type="button" 
        class="week-nav-btn" 
        onclick={() => { currentWeekOffset++; loadData(); }}
        title="Nächste Woche"
      >
        ▶
      </button>
    </div>
    {#each DAYS as day}
      {@const isToday = day.value === (new Date().getDay() === 0 ? 0 : new Date().getDay())}
      <div class="grid-header-cell day-header" class:header-today={isToday}>
        <span class="day-label-short">{day.label.substring(0, 2)}</span>
        <span class="day-date">{getDayDateString(day.value)}</span>
      </div>
    {/each}

    <!-- Time rows -->
    {#each getDisplayedHours(courses) as hour}
      <div class="grid-time-cell">
        <span>{hour.toString().padStart(2, '0')}:00</span>
      </div>
      
      {#each DAYS as day}
        {@const coursesInSlot = getFilteredCoursesForHour(day.value, hour)}
        <div class="grid-content-cell">
          {#each coursesInSlot as course}
            {@const roomObj = rooms.find(r => r.id === course.roomId)}
            {@const teacherObj = teachers.find(t => t.id === course.teacherId)}
            {@const courseConflicts = getCourseConflicts(course)}
            {@const hasHard = courseConflicts.some(c => c.type === 'hard')}
            {@const cardColors = getCourseColor(course)}

            <div 
              class="course-card-rapla" 
              class:unassigned-card={!course.teacherId || course.teacherId === 'teacher-gen-yl'}
              style="background-color: {cardColors.bg}; border: 1px solid {cardColors.border};"
              onclick={() => openEditModal(course)}
            >
              <!-- Top line: Time and Room -->
              <div class="card-top-line">
                <span class="card-time">{course.startTime} - {course.endTime}</span>
                <span class="card-room" style="color: {roomObj?.color}">{roomObj?.name ? roomObj.name.split(' ')[0] : ''}</span>
              </div>
              
              <!-- Middle line: Course Name -->
              <div class="card-title-line">{course.name}</div>
              
              <!-- Bottom line: Teacher Name -->
              <div class="card-teacher-line" class:conflict-text={hasHard} title={hasHard ? courseConflicts.find(c => c.type === 'hard')?.message : ''}>
                {teacherObj ? teacherObj.name : 'Offen'}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    {/each}
  </div>
</div>

<!-- Plan Management Section Below Calendar -->
<div class="bottom-section-title">
  <h2>📋 Dienstplan-Management & Einstellungen</h2>
  <p>Hier können Sie Dienstpläne auswählen, neue Kopien erstellen oder Arbeitsentwürfe bearbeiten.</p>
</div>

<!-- Externe Seminarleiter dieser Woche Section -->
{#if currentPlan}
  {@const externalTeachers = teachers.filter(t => t.isYogaTeacher !== false && t.availabilityMode === 'seminar_only')}
  {#if externalTeachers.length > 0}
    <div class="dashboard-card glass-card seminar-leaders-card animate-fade-in" style="margin-bottom: 2rem;">
      <div class="card-header-row" style="flex-direction: column; align-items: flex-start; gap: 0.25rem;">
        <h3 style="margin: 0;">⛺ Externe Seminarleiter dieser Woche</h3>
        <span class="subtitle-text">Wähle aus, welche externen Lehrer in dieser Woche ein Seminar leiten, damit die KI sie einplanen kann:</span>
      </div>
      <div class="seminar-leaders-flex">
        {#each externalTeachers as teacher}
          {@const isChecked = currentPlan.seminarLeaderIds?.includes(teacher.id) || false}
          <label class="leader-checkbox-label" class:active-leader={isChecked}>
            <input 
              type="checkbox" 
              checked={isChecked} 
              onclick={() => toggleSeminarLeader(teacher.id)} 
            />
            <span>{teacher.name}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}
{/if}

<div class="dashboard-grid">
  <!-- Card 1: Blankowochen -->
  <div class="dashboard-card glass-card">
    <div class="card-header-row">
      <h3>⬜ Blankowochen (KI-Vorplanung)</h3>
      <button class="btn btn-secondary btn-small" onclick={createBlankWeek} title="Neue Blankowoche erstellen">
        ➕ Neu
      </button>
    </div>
    <div class="plans-list-horizontal">
      {#each weekPlans.filter(p => p.status === 'blanko') as plan}
        <button 
          type="button"
          class="plan-list-item-horizontal" 
          class:active={currentPlan?.id === plan.id}
          onclick={() => selectPlan(plan)}
        >
          <span class="plan-name-full">{plan.name}</span>
          <span class="plan-date-meta">Erstellt: {new Date(plan.createdAt).toLocaleDateString('de-DE')}</span>
        </button>
      {:else}
        <div class="no-plans-label">Keine Blankowochen vorhanden.</div>
      {/each}
    </div>
  </div>

  <!-- Card 2: Entwürfe -->
  <div class="dashboard-card glass-card">
    <div class="card-header-row">
      <h3>⚡ KI-Entwürfe (Review)</h3>
    </div>
    <div class="plans-list-horizontal">
      {#each weekPlans.filter(p => p.status === 'draft') as plan}
        <button 
          type="button"
          class="plan-list-item-horizontal" 
          class:active={currentPlan?.id === plan.id}
          onclick={() => selectPlan(plan)}
        >
          <span class="plan-name-full">{plan.name}</span>
          <span class="plan-date-meta">Erstellt: {new Date(plan.createdAt).toLocaleDateString('de-DE')}</span>
        </button>
      {:else}
        <div class="no-plans-label">Keine Entwürfe im Review.</div>
      {/each}
    </div>
  </div>

  <!-- Card 3: Genehmigt -->
  <div class="dashboard-card glass-card">
    <div class="card-header-row">
      <h3>✓ Genehmigt & Aktiv</h3>
    </div>
    <div class="plans-list-horizontal">
      {#each weekPlans.filter(p => p.status === 'approved') as plan}
        <button 
          type="button"
          class="plan-list-item-horizontal" 
          class:active={currentPlan?.id === plan.id}
          onclick={() => selectPlan(plan)}
        >
          <span class="plan-name-full">{plan.name}</span>
          <span class="plan-date-meta">Erstellt: {new Date(plan.createdAt).toLocaleDateString('de-DE')}</span>
        </button>
      {:else}
        <div class="no-plans-label">Keine aktiven Dienstpläne.</div>
      {/each}
    </div>
  </div>
</div>

<!-- Add/Edit Course Modal -->
{#if isModalOpen}
  <div class="modal-backdrop" onclick={() => isModalOpen = false}>
    <div class="modal-content glass-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{editingCourse ? 'Kurs bearbeiten' : 'Neuen Kurs erstellen'}</h2>
        <button class="close-btn" onclick={() => isModalOpen = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="section-title">Kursdetails</div>
        
        <div class="form-group">
          <label class="form-label" for="course-name">Kursname</label>
          <input id="course-name" type="text" class="form-input" placeholder="z. B. Vinyasa Power Flow" bind:value={formName} />
        </div>

        <div class="grid-cols-2" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="course-style">Yoga-Stil</label>
            <select id="course-style" class="form-select" bind:value={formStyle}>
              {#each YOGA_STYLES as style}
                <option value={style}>{style}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="course-room">Studio-Raum</label>
            <select id="course-room" class="form-select" bind:value={formRoomId}>
              {#each rooms as r}
                <option value={r.id}>{r.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid-cols-3" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="course-day">Wochentag</label>
            <select id="course-day" class="form-select" bind:value={formDayOfWeek}>
              {#each DAYS as d}
                <option value={d.value}>{d.label}</option>
              {/each}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="course-start">Startzeit</label>
            <input id="course-start" type="time" class="form-input" bind:value={formStartTime} />
          </div>
          <div class="form-group">
            <label class="form-label" for="course-end">Endzeit</label>
            <input id="course-end" type="time" class="form-input" bind:value={formEndTime} />
          </div>
        </div>

        <div class="divider"></div>
        <div class="section-title">👤 Yogalehrer-Zuweisung</div>

        <div class="form-group">
          <label class="form-label" for="assign-teacher">Yogalehrer zuteilen</label>
          <select id="assign-teacher" class="form-select" bind:value={formTeacherId}>
            <option value={null}>-- Unbesetzt (Später per KI einteilen) --</option>
            <optgroup label="Sevakas (Kernteam)">
              {#each teachers.filter(t => t.roleType === 'sevaka') as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </optgroup>
            <optgroup label="Externe Yogalehrer / Seminarleiter">
              {#each teachers.filter(t => t.roleType !== 'sevaka') as t}
                <option value={t.id}>{t.name}</option>
              {/each}
            </optgroup>
          </select>
        </div>

        <!-- Live Validation Alert Box -->
        {#if formTeacherId}
          <div class="live-validation-box">
            <h4>Planungsprüfung für den Lehrer:</h4>
            {#if activeConflicts.length === 0}
              <div class="validation-status status-ok">
                <span>✓</span> Lehrer ist für diese Zuweisung voll qualifiziert und konfliktfrei verfügbar.
              </div>
            {:else}
              <div class="validation-conflicts-list">
                {#each activeConflicts as c}
                  <div class="conflict-detail {c.type === 'hard' ? 'c-hard' : 'c-soft'}">
                    <span>{c.type === 'hard' ? '🚨 Hartes Limit:' : '⚠️ Präferenz:'}</span>
                    {c.message}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        {#if editingCourse}
          <button class="btn btn-danger" style="margin-right: auto;" onclick={() => editingCourse && handleDelete(editingCourse.id)}>
            🗑️ Löschen
          </button>
        {/if}
        <button class="btn btn-secondary" onclick={() => isModalOpen = false}>Abbrechen</button>
        <button class="btn btn-primary" onclick={handleSave}>Speichern</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }

  .title-section h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.25rem 0 0.5rem;
  }

  .title-section p {
    color: var(--text-secondary);
  }

  /* Filters Toolbar */
  .filters-bar {
    display: flex;
    gap: 2rem;
    align-items: center;
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .filter-group label {
    margin-bottom: 0;
    white-space: nowrap;
  }

  .filter-select {
    width: 200px;
    padding: 0.5rem 1rem;
  }

  .legend-container {
    display: flex;
    gap: 1.25rem;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 4px;
  }

  /* Live Validation Alert Box in Modal */
  .live-validation-box {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 0.5rem;
  }

  .live-validation-box h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .validation-status {
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
  }

  .status-ok {
    background: var(--success-glow);
    color: var(--success-hover);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .validation-conflicts-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .conflict-detail {
    font-size: 0.8rem;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    border: 1px solid;
    line-height: 1.4;
  }

  .conflict-detail span {
    font-weight: 700;
  }

  .c-hard {
    background: var(--danger-glow);
    color: var(--danger-hover);
    border-color: rgba(239, 68, 68, 0.2);
  }

  .c-soft {
    background: var(--warning-glow);
    color: var(--warning-hover);
    border-color: rgba(245, 158, 11, 0.2);
  }

  /* Modal Styling Extensions */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.25rem;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .close-btn:hover {
    color: var(--text-primary);
  }

  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--primary-hover);
    margin-bottom: 0.25rem;
  }

  .divider {
    height: 1px;
    background: var(--border-color);
    margin: 0.5rem 0;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    margin-top: 1.5rem;
  }

  /* Wochenkursplan Calendar Grid Layout (Rapla style) */
  .calendar-grid-container {
    width: 100%;
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #c8c8c8;
    background: #eef2f5;
    padding: 2px;
    margin-bottom: 2.5rem;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: 80px repeat(7, minmax(130px, 1fr));
    grid-auto-rows: minmax(70px, auto); /* Prevent squishing and allow rows with parallel classes to expand naturally */
    background-color: #c8c8c8; /* border color between cells */
    gap: 1px; /* grid line gap */
    width: 100%;
    min-width: 960px; /* prevent squishing */
  }

  .grid-header-cell {
    background: #f5f5f5;
    padding: 6px 4px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 48px;
    font-family: inherit;
    border-top: 3px solid #8fd1f2; /* Cyan/blue accent top border from Rapla screenshot */
  }

  .week-header {
    font-weight: 700;
    font-size: 0.85rem;
    color: #444;
    background: #eaeaea;
    border-top: 3px solid #666;
  }

  .day-header {
    color: #333;
  }

  .header-today {
    background: #eef9ff;
    border-top: 3px solid var(--primary);
  }

  .day-label-short {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .day-date {
    font-size: 0.8rem;
    color: #555;
  }

  .grid-time-cell {
    background: #f0f0f0;
    padding: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #555;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 50px;
  }

  .grid-content-cell {
    background: #ffffff;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 50px;
  }

  /* Rapla Course Card Styling */
  .course-card-rapla {
    padding: 6px 8px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .course-card-rapla:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0,0,0,0.15);
  }

  .card-top-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.68rem;
    font-weight: 700;
    color: #555;
  }

  .card-time {
    white-space: nowrap;
  }

  .card-room {
    font-weight: 700;
    font-size: 0.65rem;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-title-line {
    font-size: 0.82rem;
    font-weight: 700;
    color: #000000;
    line-height: 1.25;
  }

  .card-teacher-line {
    font-size: 0.72rem;
    font-weight: 500;
    color: #444;
  }

  /* Bottom Management Sections */
  .bottom-section-title {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 0.75rem;
  }

  .bottom-section-title h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .bottom-section-title p {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  @media (max-width: 992px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  .dashboard-card {
    padding: 1.25rem;
    background: #ffffff;
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 200px;
  }

  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .card-header-row h3 {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  .plans-list-horizontal {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
  }

  .plan-list-item-horizontal {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: var(--transition-smooth);
    width: 100%;
  }

  .plan-list-item-horizontal:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .plan-list-item-horizontal.active {
    border-color: var(--primary);
    background: var(--primary-glow);
    font-weight: bold;
  }

  .plan-list-item-horizontal.active .plan-name-full {
    color: var(--primary);
    font-weight: 700;
  }

  .plan-name-full {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .plan-date-meta {
    font-size: 0.7rem;
    color: var(--text-muted);
    margin-top: 2px;
  }

  /* Fullscreen & Controls Row styling */
  .grid-controls-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 8px 12px;
    background: #f1f5f9;
    border-bottom: 1px solid #cbd5e1;
    gap: 1rem;
  }

  .fullscreen-title {
    margin-right: auto;
    font-weight: 700;
    font-size: 1rem;
    color: var(--primary);
  }

  .fullscreen-toggle-btn {
    font-weight: 600;
    cursor: pointer;
  }

  .calendar-grid-container.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background: var(--bg-main);
    padding: 0;
    margin: 0;
    overflow: auto;
    border-radius: 0;
  }

  .calendar-grid-container.fullscreen-mode .grid-controls-row {
    position: sticky;
    top: 0;
    background: var(--secondary);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    z-index: 100;
  }

  .calendar-grid-container.fullscreen-mode .calendar-grid {
    height: auto;
    min-height: calc(100vh - 55px);
  }

  /* Externe Seminarleiter checklist styles */
  .seminar-leaders-card {
    padding: 1.25rem;
  }

  .subtitle-text {
    font-size: 0.825rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .seminar-leaders-flex {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .leader-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    transition: var(--transition-smooth);
    user-select: none;
  }

  .leader-checkbox-label:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
  }

  .leader-checkbox-label.active-leader {
    background: var(--primary-glow);
    border-color: var(--primary);
    color: var(--primary);
  }

  .week-nav-btn {
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, transform 0.1s;
    user-select: none;
  }
  .week-nav-btn:hover {
    background: var(--primary-light);
  }
  .week-nav-btn:active {
    transform: scale(0.9);
  }

  /* High Contrast Unassigned Card Warning Style */
  .unassigned-card {
    border: 1.5px solid #dc2626 !important;
    animation: pulse-warning 2.5s infinite ease-in-out;
  }

  .unassigned-card .card-top-line {
    color: #e11d48 !important;
  }

  .unassigned-card .card-room {
    color: #be123c !important;
  }

  .unassigned-card .card-title-line {
    color: #881337 !important;
  }

  .unassigned-card .card-teacher-line {
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

  @media (max-width: 768px) {
    .filters-bar {
      flex-direction: column;
      align-items: stretch !important;
      gap: 1rem;
    }
    .filter-group {
      flex-direction: column;
      align-items: stretch !important;
      gap: 0.5rem;
    }
    .filter-select {
      width: 100% !important;
    }
    .legend-container {
      margin-left: 0 !important;
      justify-content: center;
    }
  }
</style>
