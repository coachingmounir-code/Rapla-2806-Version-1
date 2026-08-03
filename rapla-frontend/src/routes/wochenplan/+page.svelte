<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { db, type Course, type Teacher, type Room, type WeekPlan } from '$lib/db';
  import { getLocalDateForDay } from '$lib/planningEngine';
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

  // Derived filtered courses for the mobile agenda view
  let filteredMobileCourses = $derived(
    courses
      .filter(c => c.dayOfWeek === activeMobileDay)
      .filter(c => !onlyMySlotsParam || !selectedTeacher || c.teacherId === selectedTeacher.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

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
    const isUnassigned = !course.teacherId || course.teacherId === 'teacher-gen-yl';
    if (isUnassigned) {
      return {
        bg: '#fee2e2', // light red/rose
        border: '#ef4444' // red
      };
    }

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
        foundPlan = weekPlans.find(p => p.id.startsWith('plan-pre-'))
                 || weekPlans[0]
                 || null;
      }
    }
    currentPlan = foundPlan;
    
    if (currentPlan) {
      // Dynamically filter out absent teachers
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
            isAbsent = true;
            break;
          }
        }
        
        if (isAbsent) {
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
            {#each teachers.filter(t => t.roleType === 'sevaka') as t}
              <option value={t.id}>🧘 {t.name}</option>
            {/each}
          </optgroup>
          <optgroup label="Externe Lehrer">
            {#each teachers.filter(t => t.roleType !== 'sevaka') as t}
              <option value={t.id}>👤 {t.name}</option>
            {/each}
          </optgroup>
        </select>
      </div>

      <button 
        type="button" 
        class="btn sync-header-btn" 
        onclick={() => { 
          if(confirm('Möchtest du den Browser-Speicher zurücksetzen und neu synchronisieren?')) { 
            db.syncDatabase();
          } 
        }}
      >
        🔄 Synchronisieren
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

  <!-- Calendar Roster Grid (Desktop Only) -->
  <div class="desktop-only-grid">
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
              {/each}
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>

  <!-- Mobile View (Phone Only) -->
  <div class="mobile-only-agenda">
    <!-- Navigation for Weeks on Mobile -->
    <div class="mobile-week-nav">
      <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(-1)}>◀</button>
      <span class="week-title-badge-mobile">
        KW {currentPlan ? getWeekNumber(getMondayOfCurrentWeek()) : '--'} ({currentPlan?.targetWeekCode || 'Kein Plan'})
      </span>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => navigateWeek(1)}>▶</button>
    </div>

    <!-- Day Selector Tabs -->
    <div class="mobile-day-tabs">
      {#each DAYS as day}
        {@const isToday = new Date().getDay() === day.value && currentWeekOffset === 0}
        <button 
          type="button" 
          class="day-tab-btn" 
          class:active={activeMobileDay === day.value}
          class:is-today={isToday}
          onclick={() => activeMobileDay = day.value}
        >
          <span class="day-tab-name">{day.label.substring(0, 2)}</span>
          <span class="day-tab-date">{getDayDateString(day.value)}</span>
        </button>
      {/each}
    </div>

    <!-- Timeline of Courses -->
    <div class="mobile-agenda-list">
      {#if filteredMobileCourses.length === 0}
        <div class="empty-agenda-state">
          📭 Keine Stunden für diesen Tag eingetragen.
        </div>
      {:else}
        {#each filteredMobileCourses as course}
          {@const isHighlighted = selectedTeacher && course.teacherId === selectedTeacher.id}
          {@const colors = getCourseColor(course)}
          {@const teacherName = teachers.find(t => t.id === course.teacherId)?.name || 'Unbesetzt'}
          {@const roomName = rooms.find(r => r.id === course.roomId)?.name || 'Raum?'}

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
        {/each}
      {/if}
    </div>
  </div>
  
  <footer class="view-footer-info" style="margin-top: 2rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1rem; clear: both;">
    <span>Yoga Vidya Nordsee © 2026</span>
    <span style="margin: 0 10px;">•</span>
    <button type="button" onclick={() => { if(confirm('Möchtest du den Browser-Speicher zurücksetzen? Deine lokalen Planungs-Änderungen gehen verloren.')) { db.syncDatabase(); } }} style="background: none; border: none; color: #3b82f6; cursor: pointer; text-decoration: underline; font-size: 0.8rem; padding: 0; font-family: inherit;">Planungsdaten zurücksetzen (Synchronisieren)</button>
  </footer>
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

  /* Responsive Breakpoints & Toggles */
  @media (min-width: 768px) {
    .desktop-only-grid {
      display: block;
    }
    .mobile-only-agenda {
      display: none;
    }
  }

  @media (max-width: 767px) {
    .desktop-only-grid {
      display: none;
    }
    .mobile-only-agenda {
      display: block;
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

  .mobile-agenda-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
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
</style>
