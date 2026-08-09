<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { db, type Course, type Teacher, type Room, type WeekPlan } from '$lib/db';
  import { runAiPlanning, validateAllCourses, type ConflictMessage, validateAssignment, adjustRoomsForRules } from '$lib/planningEngine';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  let courses = $state<Course[]>([]);
  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let weekPlans = $state<WeekPlan[]>([]);
  let currentPlan = $state<WeekPlan | null>(null);
  let upcomingPlans = $state<WeekPlan[]>([]);
  let activeWeekIndex = $state(0);
  let userRole = $state('');

  // Deriving active plan ID from URL query param
  let planId = $derived(page.url.searchParams.get('planId') || '');

  // State machine: 'idle' | 'planning' | 'review'
  let planningState = $state<'idle' | 'planning' | 'review'>('idle');
  
  // Planned data and logs from engine
  let plannedCourses = $state<Course[]>([]);
  let planningLogs = $state<string[]>([]);
  let validationConflicts = $state<Record<string, ConflictMessage[]>>({});

  // Loading animation simulation steps
  let loadingStep = $state('');
  let loadingLogs = $state<string[]>([]);

  // Current selected course for manual modification in review panel
  let selectedCourseForEdit = $state<Course | null>(null);
  let customRulesText = $state('');

  const DAYS = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' }
  ];

  onMount(() => {
    userRole = localStorage.getItem('rapla_user_role') || '';
    loadData();
  });

  // Keep state updated on planId transitions
  $effect(() => {
    const _ = planId;
    untrack(() => {
      loadData();
    });
  });

  function loadData() {
    upcomingPlans = db.getOrCreateUpcomingWeekPlans();
    weekPlans = db.getWeekPlans();
    
    if (planId) {
      const idx = upcomingPlans.findIndex(p => p.id === planId);
      if (idx !== -1) {
        activeWeekIndex = idx;
      }
    }
    
    currentPlan = upcomingPlans[activeWeekIndex] || null;
    teachers = db.getTeachers();
    rooms = db.getRooms();

    if (currentPlan) {
      courses = currentPlan.courses;
      if (currentPlan.status === 'draft') {
        planningState = 'review';
        plannedCourses = currentPlan.courses;
        validationConflicts = validateAllCourses(plannedCourses, teachers, currentPlan?.seminarLeaderIds || [], currentPlan?.targetWeekCode);
      } else {
        planningState = 'idle';
        plannedCourses = [];
        validationConflicts = {};
      }
    }
  }

  // Count unassigned courses
  let unassignedCount = $derived(courses.filter(c => c.teacherId === null).length);

  async function startAiPlanning() {
    planningState = 'planning';
    loadingLogs = [];
    planningLogs = [];
    
    loadingLogs = [...loadingLogs, `[SYSTEM] Starte 4-Wochen-Vorplanung via Regel-basiertem Planungsalgorithmus...`];
    await new Promise(resolve => setTimeout(resolve, 300));
    
    for (let i = 0; i < upcomingPlans.length; i++) {
      const plan = upcomingPlans[i];
      loadingStep = `Berechne ${plan.name}...`;
      loadingLogs = [...loadingLogs, `[INFO] Plane ${plan.name}...`];
      
      // Reset plan's courses to a fresh copy of the Blankowoche template courses before planning
      const template = db.getWeekPlan('plan-template-1');
      if (template) {
        plan.courses = template.courses.map(c => ({
          ...c,
          id: 'course-' + Math.random().toString(36).substr(2, 9),
          teacherId: c.teacherId,
          isAiPlanned: false,
          status: 'draft'
        }));
      }

      try {
        const absences = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('rapla_sevafrei') || '[]') : [];
        const response = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courses: plan.courses,
            teachers: teachers,
            absences: absences,
            seminarLeaderIds: plan.seminarLeaderIds || [],
            targetWeekCode: plan.targetWeekCode,
            customWishes: customRulesText
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `Server Fehler: ${response.status}`);
        }

        const result = await response.json();
        
        plan.courses = result.plannedCourses;
        plan.status = 'draft';
        db.updateWeekPlan(plan);
        
        planningLogs = [
          ...planningLogs,
          `=== LOGS FÜR ${plan.name} ===`,
          ...(result.logs || []),
          `✓ ${plan.name} erfolgreich berechnet.`,
          ''
        ];
      } catch (err: any) {
        console.error(err);
        loadingLogs = [...loadingLogs, `❌ Fehler bei ${plan.name}: ${err.message}`];
        planningLogs = [
          ...planningLogs,
          `❌ FEHLER FÜR ${plan.name}: ${err.message}`,
          ''
        ];
      }
      
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    loadingStep = 'Planung abgeschlossen!';
    loadingLogs = [...loadingLogs, `[SYSTEM] Alle Wochen erfolgreich berechnet.`];
    await new Promise(resolve => setTimeout(resolve, 500));
    
    loadData();
    planningState = 'review';
  }

  function handleReassignTeacher(courseId: string, teacherId: string | null) {
    const index = plannedCourses.findIndex(c => c.id === courseId);
    if (index !== -1) {
      plannedCourses[index].teacherId = teacherId;
      plannedCourses[index].isAiPlanned = teacherId !== null;
      
      // Auto-adjust rooms according to room rules
      adjustRoomsForRules(plannedCourses, teachers);
      
      // Save changes immediately to currentPlan
      if (currentPlan) {
        currentPlan.courses = plannedCourses;
        db.updateWeekPlan(currentPlan);
      }
      
      validationConflicts = validateAllCourses(plannedCourses, teachers, currentPlan?.seminarLeaderIds || [], currentPlan?.targetWeekCode);
    }
  }

  function approvePlan() {
    for (const plan of upcomingPlans) {
      plan.status = 'approved';
      db.updateWeekPlan(plan);
    }
    alert('Alle 4 Dienstpläne wurden erfolgreich freigegeben und im Wochenkursplan gespeichert!');
    planningState = 'idle';
    loadData();
    goto('/schedule');
  }

  function discardPlan() {
    if (confirm('Möchten Sie die generierte Vorplanung für alle 4 Wochen wirklich verwerfen?')) {
      for (const plan of upcomingPlans) {
        plan.status = 'blanko';
        plan.courses = plan.courses.map(c => ({ ...c, teacherId: null, isAiPlanned: false }));
        db.updateWeekPlan(plan);
      }
      planningState = 'idle';
      selectedCourseForEdit = null;
      loadData();
    }
  }

  function getTeacherHours(teacherId: string): number {
    const teacherCourses = plannedCourses.filter(c => c.teacherId === teacherId);
    let totalMinutes = 0;
    teacherCourses.forEach(c => {
      const [sh, sm] = c.startTime.split(':').map(Number);
      const [eh, em] = c.endTime.split(':').map(Number);
      totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    });
    return totalMinutes / 60;
  }

  // Find alternative qualified teachers for a course in the review panel
  function getQualifiedTeachersForCourse(course: Course): { teacher: Teacher; conflicts: ConflictMessage[] }[] {
    return teachers
      .map(t => {
        // Validate assignment for each teacher
        const conflicts = validateAssignment(t, course, plannedCourses, currentPlan?.seminarLeaderIds || [], currentPlan?.targetWeekCode);
        return { teacher: t, conflicts };
      })
      .filter(item => {
        // Only return teachers who teach the style (ignore hard qualifications conflicts, keep soft)
        const hasHardQualification = item.conflicts.some(c => c.type === 'hard' && c.message.includes('Spezialisierung'));
        return !hasHardQualification;
      });
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
</script>

<div class="page-header">
  <div class="title-section">
    <span class="badge badge-secondary">Künstliche Intelligenz</span>
    <h1>KI-Vorplanungs-Assistent <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-secondary); margin-left: 0.5rem;">({currentPlan?.name || ''})</span></h1>
    <p>Automatisierte Zuweisung von Yogalehrern basierend auf Arbeitszeiten, Pausen und Stilen.</p>
  </div>
</div>

<div class="scheduler-layout">
  <!-- Left Column: Dienstpläne & Vorlagen -->
  <aside class="plans-sidebar glass-card">
    <div class="sidebar-header-row">
      <h3>Dienstpläne</h3>
      <button class="btn btn-secondary btn-small" onclick={createBlankWeek} title="Neue Blankowoche erstellen" disabled={userRole === 'viewer'}>
        ➕ Neu
      </button>
    </div>
    
    <div class="plans-list">
      <!-- 4-Wochen-KI-Vorplanung Category -->
      <div class="plan-category" style="border: 2px solid var(--primary-light); padding: 0.5rem; border-radius: 8px; background: rgba(var(--primary-rgb), 0.02); margin-bottom: 1.5rem;">
        <h4 style="color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem;">
          📅 4-Wochen-KI-Vorplanung
        </h4>
        {#each upcomingPlans as plan, index}
          <button 
            type="button"
            class="plan-list-item" 
            class:active={currentPlan?.id === plan.id}
            onclick={() => { activeWeekIndex = index; loadData(); }}
            style="position: relative; padding: 0.75rem; border-radius: 6px;"
          >
            <span class="plan-icon">
              {#if plan.status === 'approved'}
                ✅
              {:else if plan.status === 'draft'}
                ⚡
              {:else}
                ⬜
              {/if}
            </span>
            <div style="display: flex; flex-direction: column; align-items: start; gap: 0.1rem; text-align: left;">
              <span class="plan-name" style="font-weight: 600; font-size: 0.85rem;">{plan.name}</span>
              <span style="font-size: 0.7rem; color: var(--text-secondary);">
                Status: {plan.status === 'approved' ? 'Freigegeben' : plan.status === 'draft' ? 'Entwurf (Review)' : 'Nicht verplant'}
              </span>
            </div>
          </button>
        {/each}
      </div>

      <!-- Other plans (e.g. blanko, templates) -->
      <div class="plan-category">
        <h4>Weitere Entwürfe & Vorlagen</h4>
        {#each weekPlans.filter(p => !p.id.startsWith('plan-auto-')) as plan}
          <button 
            type="button"
            class="plan-list-item" 
            class:active={currentPlan?.id === plan.id}
            onclick={() => selectPlan(plan)}
          >
            <span class="plan-icon">
              {#if plan.status === 'approved'}
                ✓
              {:else if plan.status === 'draft'}
                ⚡
              {:else}
                ⬜
              {/if}
            </span>
            <span class="plan-name">{plan.name}</span>
          </button>
        {/each}
      </div>
    </div>
  </aside>

  <!-- Right Area: AI Planning and Review interfaces -->
  <div class="scheduler-main">
    {#if planningState === 'idle'}
  <!-- Idle Screen -->
  <div class="idle-container animate-fade-in">
    <div class="grid-cols-3" style="gap: 1.5rem; margin-bottom: 2rem;">
      <div class="glass-card stat-box">
        <span class="stat-icon">📅</span>
        <div class="stat-info">
          <h3>{courses.length} Kurse</h3>
          <p>Gesamtanzahl diese Woche</p>
        </div>
      </div>
      <div class="glass-card stat-box">
        <span class="stat-icon">⚠️</span>
        <div class="stat-info">
          <h3>{unassignedCount} Kurse</h3>
          <p>Aktuell unbesetzt</p>
        </div>
      </div>
      <div class="glass-card stat-box">
        <span class="stat-icon">👥</span>
        <div class="stat-info">
          <h3>{teachers.length} Yogalehrer</h3>
          <p>Verfügbares Personal</p>
        </div>
      </div>
    </div>

    <!-- Instructions / Rules checklist -->
    <div class="glass-card rules-checklist-card">
      <h2>Prüfkriterien der KI-Vorplanung:</h2>
      <p>Die KI prüft bei jeder Zuweisung alle hinterlegten Grundregeln der Yogalehrer:</p>
      
      <div class="rules-grid">
        <div class="rule-check-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>Yoga-Stile & Qualifikationen</strong>
            <p>Lehrer werden nur Kursen zugeteilt, die sie auch unterrichten können (z. B. Yin Yoga).</p>
          </div>
        </div>
        <div class="rule-check-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>Individuelle Arbeitszeiten</strong>
            <p>Zuweisungen erfolgen nur innerhalb der definierten Schichten.</p>
          </div>
        </div>
        <div class="rule-check-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>Erholungszeiten & Puffer</strong>
            <p>Einhaltung der Mindestpausen (z. B. 30 Minuten Pause zwischen zwei Kursen).</p>
          </div>
        </div>
        <div class="rule-check-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>Stunden- & Tageslimits</strong>
            <p>Max. Kurse pro Tag und max. Wochenarbeitszeit der Lehrer werden nie überschritten.</p>
          </div>
        </div>
        <div class="rule-check-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>Raum-Präferenzen</strong>
            <p>Bevorzugte Yoga-Räume werden priorisiert eingeteilt (weiche Regel).</p>
          </div>
        </div>
        <div class="rule-check-item">
          <span class="check-icon">✓</span>
          <div>
            <strong>Gleichmäßige Verteilung</strong>
            <p>Die Auslastung wird gleichmäßig auf alle verfügbaren Lehrer aufgeteilt.</p>
          </div>
        </div>
      </div>

      <!-- Custom Rules Freitext Section -->
      <div class="custom-rules-container" style="margin-top: 1.5rem; margin-bottom: 1.5rem;">
        <label for="custom-wishes-text" style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--primary-hover);">
          ✍️ Wöchentliche Sonderwünsche & Spezialregeln (Freitext)
        </label>
        <textarea 
          id="custom-wishes-text" 
          placeholder="z. B. Karuna darf diese Woche freitags abends nicht eingeteilt werden. Oder: Mounir übernimmt am Sonntag die Hausführung." 
          bind:value={customRulesText}
          disabled={userRole === 'viewer'}
          style="width: 100%; min-height: 100px; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; font-size: 0.9rem; resize: vertical;"
        ></textarea>
      </div>

      <div class="action-footer">
        {#if unassignedCount === 0}
          <div class="info-alert">
            ℹ️ Alle Kurse haben bereits feste Lehrerzuweisungen. Sie können die KI-Vorplanung dennoch starten, um Zuweisungen optimieren zu lassen.
          </div>
        {/if}
        <button class="btn btn-accent btn-large pulse-glow" onclick={startAiPlanning} disabled={userRole === 'viewer'}>
          ⚡ 4-Wochen-KI-Vorplanung starten
        </button>
      </div>
    </div>
  </div>

{:else if planningState === 'planning'}
  <!-- Planning Screen -->
  <div class="planning-container glass-card animate-fade-in">
    <div class="brain-animation">
      <div class="pulse-circle"></div>
      <div class="brain-icon">🧠</div>
    </div>
    
    <h2>KI berechnet optimalen Dienstplan...</h2>
    <div class="current-step-text">{loadingStep}</div>
    
    <div class="console-box">
      {#each loadingLogs as log}
        <div class="console-line">{log}</div>
      {/each}
    </div>
  </div>

{:else if planningState === 'review'}
  <!-- Review & Approval Flow Screen -->
  <div class="review-container animate-fade-in">
    <div class="review-header glass-card">
      <div class="review-meta">
        <h2>Entwurf überprüfen</h2>
        <p>Die KI hat Lehrkräfte zugeteilt. Bitte prüfen Sie den Entwurf und nehmen Sie ggf. manuelle Korrekturen vor.</p>
      </div>
      <div class="review-actions">
        <button class="btn btn-secondary" onclick={discardPlan} disabled={userRole === 'viewer'}>Alle 4 Wochen verwerfen</button>
        <button class="btn btn-primary" onclick={approvePlan} disabled={userRole === 'viewer'}>Alle 4 Wochen freigeben</button>
      </div>
    </div>

    <div class="review-workspace">
      <!-- 1. Left Column: Planned Courses Timeline -->
      <div class="planned-list-section">
        <h3>📅 Generierter Wochenplan</h3>
        <div class="review-days-list">
          {#each DAYS as day}
            {@const dayCourses = plannedCourses.filter(c => c.dayOfWeek === day.value).sort((a, b) => a.startTime.localeCompare(b.startTime))}
            <div class="review-day-card glass-card">
              <h4>{day.label}</h4>
              {#if dayCourses.length === 0}
                <p class="no-courses-text">Keine Yoga-Kurse geplant</p>
              {:else}
                <div class="review-day-courses">
                  {#each dayCourses as course}
                    {@const teacher = teachers.find(t => t.id === course.teacherId)}
                    {@const conflicts = validationConflicts[course.id] || []}
                    {@const hasHard = conflicts.some(c => c.type === 'hard')}
                    {@const hasSoft = conflicts.some(c => c.type === 'soft')}
                    {@const room = rooms.find(r => r.id === course.roomId)}

                    <div 
                      class="review-course-item" 
                      class:selected={selectedCourseForEdit?.id === course.id}
                      class:has-error={hasHard}
                      class:has-warning={hasSoft && !hasHard}
                      onclick={() => selectedCourseForEdit = course}
                    >
                      <div class="course-time-style">
                        <span>⏰ {course.startTime} - {course.endTime}</span>
                        <span class="style-tag">{course.style}</span>
                      </div>
                      <div class="course-info">
                        <strong>{course.name}</strong>
                        <span class="room-text">📍 {room?.name}</span>
                      </div>
                      <div class="teacher-assignment">
                        {#if !course.teacherId}
                          <span class="badge badge-danger">⚠️ Unbesetzt</span>
                        {:else}
                          <div class="teacher-pill">
                            <span class="tp-avatar bg-gradient-to-br {teacher?.avatarColor}">
                              {teacher?.name.split(' ').map(n => n[0]).join('')}
                            </span>
                            <span class="tp-name">{teacher?.name}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- 2. Right Column: Review & Modification Panel -->
      <div class="review-details-section">
        <!-- Teacher Capacity list -->
        <div class="glass-card capacity-card">
          <h3>Auslastung der Yogalehrer</h3>
          <div class="teacher-capacity-list">
            {#each teachers as teacher}
              {@const hrs = getTeacherHours(teacher.id)}
              {@const limit = teacher.rules.maxHoursPerWeek}
              {@const pct = (hrs / limit) * 100}
              <div class="capacity-item">
                <div class="ci-header">
                  <span>{teacher.name}</span>
                  <strong>{hrs.toFixed(1)} / {limit} Std.</strong>
                </div>
                <div class="progress-bar-bg">
                  <div 
                    class="progress-bar-fill" 
                    style="width: {Math.min(pct, 100)}%; background: {pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)'}"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Selected Course Detail Editor -->
        <div class="glass-card editor-card">
          {#if selectedCourseForEdit}
            {@const course = selectedCourseForEdit}
            {@const currentConflicts = validationConflicts[course.id] || []}
            {@const currentRoom = rooms.find(r => r.id === course.roomId)}
            
            <h3>Zuweisung bearbeiten</h3>
            <div class="editor-course-summary">
              <h4>{course.name}</h4>
              <p>⏰ {DAYS.find(d => d.value === course.dayOfWeek)?.label}, {course.startTime} - {course.endTime} Uhr</p>
              <p>Stil: <strong>{course.style}</strong> | Raum: <strong>{currentRoom?.name}</strong></p>
            </div>

            <!-- Validation conflicts list for current selection -->
            {#if currentConflicts.length > 0}
              <div class="editor-conflict-box">
                <h5 style="color: var(--danger-hover); font-weight: 600; margin-bottom: 0.5rem;">🚨 Konflikte:</h5>
                <ul class="conflict-list">
                  {#each currentConflicts as c}
                    <li class={c.type}>{c.message}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            <!-- Change teacher selector -->
            {#if userRole !== 'viewer'}
              <div class="form-group" style="margin-top: 1rem;">
                <label class="form-label" for="reassign-select">Anderen Lehrer zuteilen:</label>
                <div class="teacher-options-list">
                  <!-- Unassigned Option -->
                  <button 
                    class="teacher-option-row"
                    class:active={course.teacherId === null}
                    onclick={() => handleReassignTeacher(course.id, null)}
                  >
                    <span class="to-avatar">🛑</span>
                    <div class="to-info">
                      <strong>Kurs unbesetzt lassen</strong>
                    </div>
                  </button>

                  <!-- Qualified Teachers options -->
                  {#each getQualifiedTeachersForCourse(course) as item}
                    {@const hasHard = item.conflicts.some(c => c.type === 'hard')}
                    {@const hasSoft = item.conflicts.some(c => c.type === 'soft')}
                    <button 
                      class="teacher-option-row"
                      class:active={course.teacherId === item.teacher.id}
                      class:warning={hasSoft && !hasHard}
                      class:conflict={hasHard}
                      onclick={() => handleReassignTeacher(course.id, item.teacher.id)}
                    >
                      <span class="to-avatar bg-gradient-to-br {item.teacher.avatarColor}">
                        {item.teacher.name.split(' ').map(n => n[0]).join('')}
                      </span>
                      <div class="to-info">
                        <strong style="display: flex; align-items: center; gap: 0.25rem;">
                          {item.teacher.name} 
                          <span class="role-micro-tag {item.teacher.roleType === 'sevaka' ? 'role-sevaka' : 'role-external'}">
                            {item.teacher.roleType === 'sevaka' ? 'Sevaka' : 'Extern'}
                          </span>
                        </strong>
                        {#if hasHard}
                          <span class="error-msg">🚨 {item.conflicts.find(c => c.type === 'hard')?.message}</span>
                        {:else if hasSoft}
                          <span class="warning-msg">⚠️ {item.conflicts.find(c => c.type === 'soft')?.message}</span>
                        {:else}
                          <span class="success-msg">✓ Konfliktfrei & qualifiziert</span>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {:else}
            <div class="editor-empty-state">
              <span>👈</span>
              <p>Klicken Sie auf einen Kurs im Kalender links, um Details anzuzeigen, Konflikte zu prüfen oder den Yogalehrer manuell zu ändern.</p>
            </div>
          {/if}
        </div>

        <!-- AI Engine log console -->
        <div class="glass-card engine-logs-card">
          <h3>🤖 KI-Berechnungs-Protokoll</h3>
          <div class="logs-console">
            {#each planningLogs as log}
              <div class="log-line">{log}</div>
            {/each}
          </div>
        </div>
    </div>
  </div>
</div>
    {/if}
  </div>
</div>

<style>
  .page-header {
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

  /* Stat Cards */
  .stat-box {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1.5rem;
  }

  .stat-icon {
    font-size: 2.25rem;
    filter: drop-shadow(0 0 10px rgba(14, 165, 233, 0.4));
  }

  .stat-info h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-info p {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  /* Rules Checklist */
  .rules-checklist-card h2 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .rules-checklist-card > p {
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }

  .rules-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 768px) {
    .rules-grid {
      grid-template-columns: 1fr;
    }
  }

  .rule-check-item {
    display: flex;
    gap: 0.75rem;
  }

  .check-icon {
    background: var(--primary-glow);
    border: 1px solid var(--primary);
    color: var(--primary-hover);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
    flex-shrink: 0;
    margin-top: 0.2rem;
  }

  .rule-check-item strong {
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .rule-check-item p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .action-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .btn-large {
    padding: 1rem 3rem;
    font-size: 1.1rem;
    border-radius: 12px;
  }

  .info-alert {
    background: rgba(14, 165, 233, 0.08);
    border: 1px solid rgba(14, 165, 233, 0.25);
    color: var(--primary-hover);
    font-size: 0.85rem;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    text-align: center;
    max-width: 600px;
  }

  /* Processing/Loading Animation Screen */
  .planning-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }

  .brain-animation {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .brain-icon {
    font-size: 3.5rem;
    z-index: 10;
    animation: pulse-glow 1.5s infinite ease-in-out;
  }

  .pulse-circle {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--primary-glow);
    border: 1px solid var(--primary);
    animation: pulse 1.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }

  @keyframes pulse {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(1.4); opacity: 0; }
  }

  .current-step-text {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    height: 24px;
  }

  .console-box {
    margin-top: 2rem;
    width: 100%;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: left;
    max-height: 150px;
    overflow-y: auto;
  }

  .console-line {
    margin-bottom: 0.25rem;
  }

  /* Review Screen Layout */
  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 2rem;
    margin-bottom: 2rem;
  }

  .review-actions {
    display: flex;
    gap: 0.75rem;
  }

  .review-workspace {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 1024px) {
    .review-workspace {
      grid-template-columns: 1fr;
    }
  }

  .planned-list-section h3, .review-details-section h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .review-days-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .review-day-card {
    padding: 1.25rem;
  }

  .review-day-card h4 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary-hover);
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .no-courses-text {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .review-day-courses {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .review-course-item {
    cursor: pointer;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    gap: 1rem;
    transition: var(--transition-smooth);
  }

  .review-course-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .review-course-item.selected {
    background: var(--primary-glow);
    border-color: var(--primary);
  }

  .review-course-item.has-error {
    border-left: 4px solid var(--danger);
  }

  .review-course-item.has-warning {
    border-left: 4px solid var(--warning);
  }

  .course-time-style {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .course-time-style span:first-child {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .style-tag {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--primary-hover);
    align-self: flex-start;
  }

  .course-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .course-info strong {
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  .room-text {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .teacher-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid var(--border-color);
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
  }

  .tp-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: white;
  }

  .tp-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  /* Right column panels */
  .review-details-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    position: sticky;
    top: 2rem;
  }

  .capacity-card, .editor-card, .engine-logs-card {
    padding: 1.25rem;
  }

  /* Teacher capacity bar chart list */
  .teacher-capacity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .capacity-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .ci-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .ci-header span {
    color: var(--text-secondary);
  }

  .ci-header strong {
    color: var(--text-primary);
  }

  .progress-bar-bg {
    height: 6px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  /* Selected Course Editor Details */
  .editor-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.85rem;
    gap: 1rem;
  }

  .editor-empty-state span {
    font-size: 2rem;
  }

  .editor-course-summary {
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin-bottom: 1rem;
  }

  .editor-course-summary h4 {
    font-size: 1rem;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
  }

  .editor-course-summary p {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .editor-conflict-box {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .conflict-list {
    padding-left: 1.25rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .conflict-list li.hard {
    color: var(--danger-hover);
  }

  .conflict-list li.soft {
    color: var(--warning-hover);
  }

  /* Reassign teacher lists */
  .teacher-options-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
  }

  .teacher-option-row {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.65rem 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: var(--transition-smooth);
    width: 100%;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }

  .teacher-option-row:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .teacher-option-row.active {
    border-color: var(--primary);
    background: var(--primary-glow);
  }

  .to-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    color: white;
  }

  .to-info {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
  }

  .to-info strong {
    color: var(--text-primary);
  }

  .success-msg {
    font-size: 0.75rem;
    color: var(--success-hover);
  }

  .warning-msg {
    font-size: 0.75rem;
    color: var(--warning-hover);
  }

  .error-msg {
    font-size: 0.75rem;
    color: var(--danger-hover);
  }

  /* Engine Log Console */
  .logs-console {
    background: #0f172a; /* Keep dark high contrast console for code look */
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-family: monospace;
    font-size: 0.75rem;
    color: #e2e8f0;
    max-height: 150px;
    overflow-y: auto;
  }

  .log-line {
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }

  /* Scheduler Layout - Left Sidebar with plans */
  .scheduler-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 1.5rem;
    align-items: start;
    margin-top: 2rem;
  }

  @media (max-width: 1024px) {
    .scheduler-layout {
      grid-template-columns: 1fr;
    }
  }

  .plans-sidebar {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: #ffffff;
    border: 1px solid var(--border-color);
  }

  .sidebar-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
  }

  .sidebar-header-row h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary);
  }

  .plans-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .plan-category {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .plan-category h4 {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .plan-list-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    transition: var(--transition-smooth);
    width: 100%;
    color: var(--text-secondary);
  }

  .plan-list-item:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: var(--text-primary);
  }

  .plan-list-item.active {
    border-color: var(--primary);
    background: var(--primary-glow);
    color: var(--primary);
    font-weight: 700;
  }

  .plan-icon {
    font-size: 0.9rem;
  }

  .plan-name {
    font-size: 0.85rem;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .no-plans-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
    padding-left: 0.25rem;
  }

  .scheduler-main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
  }

  .role-micro-tag {
    font-size: 0.6rem;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .role-sevaka {
    background: #eef2f6;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .role-external {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
  }
</style>
