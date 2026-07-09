<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { db, type Course, type Teacher, type Room, type WeekPlan } from '$lib/db';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  let courses = $state<Course[]>([]);
  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let weekPlans = $state<WeekPlan[]>([]);
  let currentPlan = $state<WeekPlan | null>(null);
  let currentWeekOffset = $state(0);
  let isFullscreen = $state(false);

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

  const DAYS = [
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' },
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' }
  ];

  onMount(() => {
    loadData();
    
    // Add keypress listener for escaping fullscreen
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  function getWeekCode(date: Date): string {
    const year = date.getFullYear();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

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

  function getCourseColor(course: Course): { bg: string; border: string } {
    const nameLower = course.name.toLowerCase();
    const styleLower = course.style.toLowerCase();
    const isYellow = 
      nameLower.includes('meditation') || 
      nameLower.includes('satsang') || 
      nameLower.includes('om namo') || 
      nameLower.includes('ankommen') ||
      styleLower.includes('meditation');
    
    if (isYellow) {
      return {
        bg: '#ffffcc',
        border: '#dddd66'
      };
    } else {
      return {
        bg: '#ffcce6',
        border: '#ff99cc'
      };
    }
  }

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

  function getFilteredCoursesForHour(day: number, hour: number): Course[] {
    return courses
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
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  function loadData() {
    weekPlans = db.getWeekPlans();
    teachers = db.getTeachers();
    rooms = db.getRooms();
    
    const monday = getMondayOfCurrentWeek();
    const weekCode = getWeekCode(monday);
    
    // We look for the pre-planned or approved week plan matching the week code
    currentPlan = weekPlans.find(p => p.targetWeekCode === weekCode && p.status === 'approved')
               || weekPlans.find(p => p.targetWeekCode === weekCode)
               || weekPlans.find(p => p.id.startsWith('plan-pre-'))
               || weekPlans[0]
               || null;
    
    if (currentPlan) {
      courses = currentPlan.courses;
    } else {
      courses = [];
    }
  }

  function toggleFullscreen() {
    const container = document.getElementById('view-calendar-container');
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

  function navigateWeek(direction: number) {
    currentWeekOffset += direction;
    loadData();
  }

  function toggleOnlyMySlots() {
    const params = new URLSearchParams(page.url.searchParams);
    if (onlyMySlotsParam) {
      params.delete('onlyMySlots');
    } else {
      params.set('onlyMySlots', 'true');
    }
    goto(`?${params.toString()}`);
  }
</script>

<div class="view-page-container">
  <!-- Minimalist Header -->
  <header class="view-header">
    <div class="logo-area">
      <img src="/_app/immutable/assets/nataraja.Iks9i83A.jpg" alt="Yoga Vidya Logo" class="logo-img"/>
      <div>
        <h2>YOGA VIDYA NORDSEE</h2>
        <h1>Wochenplan</h1>
      </div>
    </div>
    
    <!-- User Info & Interactive Toggles -->
    <div class="header-controls">
      {#if selectedTeacher}
        <div class="user-badge" style="background: linear-gradient(135deg, #f97316, #ea580c); color: white;">
          <span class="user-icon">🧘</span>
          <div>
            <div class="badge-title">{selectedTeacher.name}</div>
            <div class="badge-subtitle">Sevaka Team</div>
          </div>
        </div>
        
        <button 
          type="button" 
          class="btn toggle-btn" 
          class:active={onlyMySlotsParam}
          onclick={toggleOnlyMySlots}
        >
          {onlyMySlotsParam ? '👁️ Kompletten Plan anzeigen' : '🔍 Nur meine Stunden anzeigen'}
        </button>
      {:else}
        <div class="user-badge" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
          <span class="user-icon">👥</span>
          <div>
            <div class="badge-title" style="color: #1e293b;">Team-Ansicht</div>
            <div class="badge-subtitle">Gesamtübersicht</div>
          </div>
        </div>
      {/if}
    </div>
  </header>

  <!-- Calendar Roster Grid -->
  <div id="view-calendar-container" class="calendar-grid-container animate-fade-in" class:fullscreen-mode={isFullscreen}>
    <div class="grid-controls-row">
      <div class="navigation-group">
        <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(-1)}>◀ Letzte Woche</button>
        <span class="week-title-badge">
          KW {currentPlan ? getWeekNumber(getMondayOfCurrentWeek()) : '--'} ({currentPlan?.targetWeekCode || 'Kein Plan'})
        </span>
        <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(1)}>Nächste Woche ▶</button>
      </div>

      <div class="action-buttons-group">
        <button type="button" class="btn btn-secondary btn-small fullscreen-toggle-btn" onclick={toggleFullscreen}>
          {isFullscreen ? '🗗 Beenden' : '🖥️ Vollbild'}
        </button>
      </div>
    </div>

    <div class="calendar-grid">
      <!-- Top Left Header Info -->
      <div class="grid-header-cell week-header">
        <div class="week-label">TAG / ZEIT</div>
      </div>

      <!-- Week Days Headers starting from Friday -->
      {#each DAYS as day}
        {@const isToday = new Date().getDay() === day.value && currentWeekOffset === 0}
        <div class="grid-header-cell day-header" class:header-today={isToday}>
          <span class="day-label-short">{day.label}</span>
          <span class="day-date">{getDayDateString(day.value)}</span>
        </div>
      {/each}

      <!-- Grid Rows by Hour -->
      {#each getDisplayedHours(courses) as hour}
        <div class="grid-time-cell">
          <span>{hour.toString().padStart(2, '0')}:00</span>
        </div>

        {#each DAYS as day}
          <div class="grid-content-cell">
            {#each getFilteredCoursesForHour(day.value, hour) as course}
              {@const isHighlighted = selectedTeacher && course.teacherId === selectedTeacher.id}
              {@const colors = getCourseColor(course)}
              {@const teacherName = teachers.find(t => t.id === course.teacherId)?.name || 'Unbesetzt'}
              {@const roomName = rooms.find(r => r.id === course.roomId)?.name || 'Raum?'}
              
              <div 
                class="course-card-rapla" 
                class:highlighted-card={isHighlighted}
                class:dimmed-card={selectedTeacher && !isHighlighted && !onlyMySlotsParam}
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
            {/each}
          </div>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  .view-page-container {
    padding: 1.5rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    font-family: 'Outfit', 'Inter', sans-serif;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo-img {
    height: 48px;
    width: 48px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ea580c;
  }

  .logo-area h2 {
    font-size: 0.8rem;
    font-weight: 700;
    color: #64748b;
    letter-spacing: 0.1em;
    margin: 0;
  }

  .logo-area h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1.25rem;
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

  .toggle-btn {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-weight: 600;
    padding: 0.5rem 1.25rem;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #1e293b;
  }

  .toggle-btn.active {
    background: #fff7ed;
    border-color: #ffedd5;
    color: #ea580c;
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
    grid-template-columns: 80px repeat(7, minmax(130px, 1fr));
    grid-auto-rows: minmax(70px, auto);
    background-color: #cbd5e1;
    gap: 1px;
    width: 100%;
    min-width: 960px;
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

  .grid-time-cell {
    background: #f1f5f9;
    padding: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #475569;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .grid-content-cell {
    background: #ffffff;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-height: 50px;
  }

  .course-card-rapla {
    padding: 6px 8px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 2px;
    transition: all 0.2s ease;
  }

  .card-top-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #64748b;
  }

  .card-time {
    white-space: nowrap;
  }

  .card-room {
    font-weight: 800;
    color: #ea580c;
  }

  .card-title-line {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
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
  .calendar-grid-container.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background: #f8fafc;
    border-radius: 0;
    padding: 12px;
  }

  .calendar-grid-container.fullscreen-mode .calendar-grid {
    height: calc(100vh - 80px);
    grid-auto-rows: 1fr; /* evenly distribute rows */
    min-width: 100%;
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
</style>
