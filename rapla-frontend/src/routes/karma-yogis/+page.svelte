<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Teacher, type TimeSlot, type Room, getTeacherStayStatus } from '$lib/db';

  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let userRole = $state('');

  // Filter states
  let selectedFilterStatus = $state<'all' | 'active' | 'upcoming' | 'expired'>('all');
  let selectedRoleFilter = $state<'all' | 'karma_yogi' | 'guest_teacher'>('all');
  let searchQuery = $state('');
  let selectedTeacherIds = $state<string[]>([]);
  let isArchiveExpanded = $state(true);

  // Modal states
  let isModalOpen = $state(false);
  let editingTeacher = $state<Teacher | null>(null);

  // Form fields
  let formName = $state('');
  let formEmail = $state('');
  let formPhone = $state('');
  let formRoleType = $state<'karma_yogi' | 'guest_teacher'>('karma_yogi');
  let formStayStartDate = $state('');
  let formStayEndDate = $state('');
  let formIsYogaTeacher = $state(true);
  let formCanLeadMeditation = $state(true);
  let formCanLeadSatsang = $state(false);
  let formSpecialties = $state<string[]>(['Hatha']);
  let formStayNotes = $state('');
  let formAvailability = $state<TimeSlot[]>([
    { day: 1, start: '06:30', end: '22:00' },
    { day: 2, start: '06:30', end: '22:00' },
    { day: 3, start: '06:30', end: '22:00' },
    { day: 4, start: '06:30', end: '22:00' },
    { day: 5, start: '06:30', end: '22:00' },
    { day: 6, start: '06:30', end: '22:00' },
    { day: 0, start: '06:30', end: '22:00' }
  ]);

  const SPECIALTY_OPTIONS = ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini', 'Klangyoga', 'Rücken-Yoga'];

  const AVATAR_COLORS = [
    'from-emerald-400 to-teal-600',
    'from-amber-400 to-orange-500',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-indigo-500',
    'from-purple-500 to-indigo-600',
    'from-cyan-400 to-blue-500'
  ];

  onMount(() => {
    userRole = localStorage.getItem('rapla_user_role') || '';
    loadData();
  });

  function loadData() {
    teachers = db.getTeachers();
    rooms = db.getRooms();
    selectedTeacherIds = [];
  }

  // All karma yogis and guest teachers (or externals with stay dates)
  let karmaTeachers = $derived(
    teachers.filter(t => t.roleType === 'karma_yogi' || t.roleType === 'guest_teacher' || (t.roleType !== 'sevaka' && (t.stayStartDate || t.stayEndDate)))
  );

  const todayStr = new Date().toISOString().split('T')[0];

  function getDaysRemaining(endDateStr?: string): number | null {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date(todayStr);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getDaysUntil(startDateStr?: string): number | null {
    if (!startDateStr) return null;
    const start = new Date(startDateStr);
    const today = new Date(todayStr);
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function formatDateDe(dateStr?: string): string {
    if (!dateStr) return 'Unbefristet';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  }

  // Filtered teachers list based on active search/role filters
  let filteredTeachers = $derived(
    karmaTeachers.filter(t => {
      // Filter by role
      if (selectedRoleFilter === 'karma_yogi' && t.roleType !== 'karma_yogi') return false;
      if (selectedRoleFilter === 'guest_teacher' && t.roleType !== 'guest_teacher' && t.roleType !== 'external') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesNotes = (t.stayNotes || '').toLowerCase().includes(query) || (t.customWishes || '').toLowerCase().includes(query);
        const matchesSpecialties = (t.specialties || []).some(s => s.toLowerCase().includes(query));
        return matchesName || matchesNotes || matchesSpecialties;
      }

      return true;
    })
  );

  // Grouped lists for sectioned top-to-bottom layout
  let activeTeachers = $derived(
    filteredTeachers.filter(t => {
      const st = getTeacherStayStatus(t, todayStr);
      return st === 'active' || st === 'permanent';
    })
  );

  let upcomingTeachers = $derived(
    filteredTeachers.filter(t => getTeacherStayStatus(t, todayStr) === 'upcoming')
  );

  let expiredTeachers = $derived(
    filteredTeachers.filter(t => getTeacherStayStatus(t, todayStr) === 'expired')
  );

  // Statistics
  let activeCount = $derived(activeTeachers.length);
  let yogaCount = $derived(activeTeachers.filter(t => t.isYogaTeacher !== false).length);
  let meditationCount = $derived(activeTeachers.filter(t => t.rules.canLeadMeditation).length);
  let satsangCount = $derived(activeTeachers.filter(t => t.rules.canLeadSatsang).length);
  let upcomingCount = $derived(upcomingTeachers.length);
  let expiredCount = $derived(expiredTeachers.length);

  function openAddModal(role: 'karma_yogi' | 'guest_teacher' = 'karma_yogi') {
    editingTeacher = null;
    formName = '';
    formEmail = '';
    formPhone = '';
    formRoleType = role;
    
    // Default stay dates: today until 3 weeks from now
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 21);
    
    formStayStartDate = today.toISOString().split('T')[0];
    formStayEndDate = future.toISOString().split('T')[0];
    formIsYogaTeacher = true;
    formCanLeadMeditation = true;
    formCanLeadSatsang = false;
    formSpecialties = ['Hatha', 'Meditation'];
    formStayNotes = '';
    formAvailability = [
      { day: 1, start: '06:30', end: '22:00' },
      { day: 2, start: '06:30', end: '22:00' },
      { day: 3, start: '06:30', end: '22:00' },
      { day: 4, start: '06:30', end: '22:00' },
      { day: 5, start: '06:30', end: '22:00' },
      { day: 6, start: '06:30', end: '22:00' },
      { day: 0, start: '06:30', end: '22:00' }
    ];
    isModalOpen = true;
  }

  function openEditModal(teacher: Teacher) {
    editingTeacher = teacher;
    formName = teacher.name;
    formEmail = teacher.email || '';
    formPhone = teacher.phone || '';
    formRoleType = (teacher.roleType === 'guest_teacher' ? 'guest_teacher' : 'karma_yogi');
    formStayStartDate = teacher.stayStartDate || '';
    formStayEndDate = teacher.stayEndDate || '';
    formIsYogaTeacher = teacher.isYogaTeacher !== false;
    formCanLeadMeditation = !!teacher.rules.canLeadMeditation;
    formCanLeadSatsang = !!teacher.rules.canLeadSatsang;
    formSpecialties = [...(teacher.specialties || [])];
    formStayNotes = teacher.stayNotes || teacher.customWishes || '';
    formAvailability = [...(teacher.rules.availability || [])];
    isModalOpen = true;
  }

  function handleSave() {
    if (!formName.trim()) return alert('Bitte Namen eingeben');
    if (formStayStartDate && formStayEndDate && formStayStartDate > formStayEndDate) {
      return alert('Das Enddatum darf nicht vor dem Startdatum liegen.');
    }

    const teacherData: Teacher = {
      id: editingTeacher?.id || `teacher-guest-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      avatarColor: editingTeacher?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      specialties: formSpecialties,
      isYogaTeacher: formIsYogaTeacher,
      availabilityMode: 'always',
      roleType: formRoleType,
      stayStartDate: formStayStartDate || undefined,
      stayEndDate: formStayEndDate || undefined,
      stayNotes: formStayNotes.trim() || undefined,
      customWishes: formStayNotes.trim() || undefined,
      rules: {
        preferredRooms: editingTeacher?.rules.preferredRooms || [],
        preferredDays: editingTeacher?.rules.preferredDays || [],
        canLeadMeditation: formCanLeadMeditation,
        canLeadSatsang: formCanLeadSatsang,
        canLeadPranayama: editingTeacher?.rules.canLeadPranayama || false,
        canLeadOnn: editingTeacher?.rules.canLeadOnn !== undefined ? editingTeacher.rules.canLeadOnn : true,
        availability: formAvailability.length > 0 ? formAvailability : [
          { day: 1, start: '06:30', end: '22:00' },
          { day: 2, start: '06:30', end: '22:00' },
          { day: 3, start: '06:30', end: '22:00' },
          { day: 4, start: '06:30', end: '22:00' },
          { day: 5, start: '06:30', end: '22:00' },
          { day: 6, start: '06:30', end: '22:00' },
          { day: 0, start: '06:30', end: '22:00' }
        ]
      }
    };

    if (editingTeacher) {
      db.updateTeacher(teacherData);
    } else {
      db.addTeacher(teacherData);
    }

    isModalOpen = false;
    loadData();
  }

  function handleDelete(id: string) {
    if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      db.deleteTeacher(id);
      isModalOpen = false;
      loadData();
    }
  }

  function extendStay(teacher: Teacher, daysToAdd: number) {
    const baseDateStr = teacher.stayEndDate && teacher.stayEndDate >= todayStr 
      ? teacher.stayEndDate 
      : todayStr;
      
    const baseDate = new Date(baseDateStr);
    baseDate.setDate(baseDate.getDate() + daysToAdd);
    const newEnd = baseDate.toISOString().split('T')[0];

    const updated = {
      ...teacher,
      stayEndDate: newEnd
    };
    db.updateTeacher(updated);
    loadData();
  }

  function reactivateStay(teacher: Teacher, daysToAdd: number = 14) {
    const start = new Date(todayStr);
    const end = new Date(todayStr);
    end.setDate(start.getDate() + daysToAdd);

    const updated = {
      ...teacher,
      stayStartDate: start.toISOString().split('T')[0],
      stayEndDate: end.toISOString().split('T')[0]
    };
    db.updateTeacher(updated);
    loadData();
  }

  function toggleSpecialty(spec: string) {
    if (formSpecialties.includes(spec)) {
      formSpecialties = formSpecialties.filter(s => s !== spec);
    } else {
      formSpecialties = [...formSpecialties, spec];
    }
  }

  function toggleSelectTeacher(id: string) {
    if (selectedTeacherIds.includes(id)) {
      selectedTeacherIds = selectedTeacherIds.filter(tId => tId !== id);
    } else {
      selectedTeacherIds = [...selectedTeacherIds, id];
    }
  }

  function bulkDelete() {
    if (selectedTeacherIds.length === 0) return;
    if (!confirm(`Möchten Sie ${selectedTeacherIds.length} Einträge wirklich löschen?`)) return;
    selectedTeacherIds.forEach(id => db.deleteTeacher(id));
    selectedTeacherIds = [];
    loadData();
  }
</script>

<div class="page-container">
  <!-- Page Header -->
  <div class="page-header">
    <div class="title-section">
      <div class="badge-row">
        <span class="badge badge-primary">Vor-Ort-Ressourcen</span>
        <span class="badge badge-secondary">Ampelsystem mit Zeitfenster</span>
      </div>
      <h1>✨ Karma-Yogis & externe Seminarleiter</h1>
      <p>Auf einen Blick alle anwesenden und zukünftigen Karma-Yogis und externen Seminarleiter, die für <strong>Yogastunden</strong>, <strong>geführte Meditationen</strong> und <strong>Satsangs</strong> zur Verfügung stehen.</p>
    </div>
    {#if userRole !== 'viewer'}
      <div class="header-actions">
        <button class="btn btn-secondary" onclick={() => openAddModal('guest_teacher')}>
          <span>➕</span> Gast-Seminarleiter
        </button>
        <button class="btn btn-primary" onclick={() => openAddModal('karma_yogi')}>
          <span>➕</span> Karma-Yogi einpflegen
        </button>
      </div>
    {/if}
  </div>

  <!-- KPI Status Metric Cards (Ampelsystem Overview) -->
  <div class="kpi-grid animate-fade-in">
    <div class="kpi-card glass-card card-kpi-active">
      <div class="kpi-icon active-icon">🟢</div>
      <div class="kpi-info">
        <span class="kpi-value">{activeCount}</span>
        <span class="kpi-label">Aktuell im Haus</span>
      </div>
    </div>
    <div class="kpi-card glass-card">
      <div class="kpi-icon yoga-icon">🧘</div>
      <div class="kpi-info">
        <span class="kpi-value">{yogaCount}</span>
        <span class="kpi-label">Geben Yogastunden</span>
      </div>
    </div>
    <div class="kpi-card glass-card">
      <div class="kpi-icon medi-icon">🪷</div>
      <div class="kpi-info">
        <span class="kpi-value">{meditationCount}</span>
        <span class="kpi-label">Leiten Meditation</span>
      </div>
    </div>
    <div class="kpi-card glass-card card-kpi-upcoming">
      <div class="kpi-icon upcoming-icon">⏳</div>
      <div class="kpi-info">
        <span class="kpi-value">{upcomingCount}</span>
        <span class="kpi-label">Zukünftig (Anreise)</span>
      </div>
    </div>
    <div class="kpi-card glass-card card-kpi-expired">
      <div class="kpi-icon expired-icon">🔴</div>
      <div class="kpi-info">
        <span class="kpi-value">{expiredCount}</span>
        <span class="kpi-label">Abgelaufen (Archiv)</span>
      </div>
    </div>
  </div>

  <!-- Search & Quick Navigation Toolbar -->
  <div class="filters-toolbar glass-card animate-fade-in">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input 
        type="text" 
        placeholder="Name, Notiz, Yoga-Stil suchen..." 
        bind:value={searchQuery} 
        class="form-input search-input"
      />
      {#if searchQuery}
        <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
      {/if}
    </div>

    <div class="filter-group-tabs">
      <button 
        type="button"
        class="tab-btn" 
        class:active={selectedFilterStatus === 'all'} 
        onclick={() => selectedFilterStatus = 'all'}
      >
        Alle Bereiche ({karmaTeachers.length})
      </button>
      <button 
        type="button"
        class="tab-btn active-tab" 
        class:active={selectedFilterStatus === 'active'} 
        onclick={() => selectedFilterStatus = 'active'}
      >
        🟢 Nur Im Haus ({activeCount})
      </button>
      <button 
        type="button"
        class="tab-btn upcoming-tab" 
        class:active={selectedFilterStatus === 'upcoming'} 
        onclick={() => selectedFilterStatus = 'upcoming'}
      >
        ⏳ Nur Zukünftig ({upcomingCount})
      </button>
      <button 
        type="button"
        class="tab-btn expired-tab" 
        class:active={selectedFilterStatus === 'expired'} 
        onclick={() => selectedFilterStatus = 'expired'}
      >
        🔴 Nur Abgelaufen ({expiredCount})
      </button>
    </div>

    <div class="role-selector">
      <label for="role-filter">Rolle:</label>
      <select id="role-filter" class="form-select select-compact" bind:value={selectedRoleFilter}>
        <option value="all">Alle Rollen</option>
        <option value="karma_yogi">Nur Karma-Yogis</option>
        <option value="guest_teacher">Nur Gast-Seminarleiter</option>
      </select>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- SEKTION 1: 🟢 AKTUELL IM HAUS & EINSATZBEREIT (Ganz oben im Sichtfeld!) -->
  <!-- ========================================================================= -->
  {#if selectedFilterStatus === 'all' || selectedFilterStatus === 'active'}
    <section class="section-container active-section animate-fade-in">
      <div class="section-header-banner banner-active">
        <div class="section-header-left">
          <span class="status-indicator-dot dot-green"></span>
          <div>
            <h2 class="section-heading">🟢 Gerade im Haus & Unterrichtsberechtigt ({activeTeachers.length})</h2>
            <p class="section-subtext">Diese Karma-Yogis und externen Seminarleiter sind aktuell vor Ort und können im Wochenplan direkt für Stunden eingeteilt werden.</p>
          </div>
        </div>
        <button class="btn btn-small btn-primary" onclick={() => openAddModal('karma_yogi')}>
          ➕ Anwesende Person erfassen
        </button>
      </div>

      {#if activeTeachers.length > 0}
        <div class="grid-cols-3">
          {#each activeTeachers as teacher}
            {@const daysRemaining = getDaysRemaining(teacher.stayEndDate)}
            
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="glass-card glass-card-interactive karma-card status-active"
              class:selected-card={selectedTeacherIds.includes(teacher.id)}
              onclick={() => openEditModal(teacher)}
            >
              <!-- Card Header -->
              <div class="card-header-flex">
                <input 
                  type="checkbox" 
                  class="teacher-select-checkbox" 
                  checked={selectedTeacherIds.includes(teacher.id)}
                  onclick={(e) => {
                    e.stopPropagation();
                    toggleSelectTeacher(teacher.id);
                  }}
                />
                <div class="avatar bg-gradient-to-br {teacher.avatarColor}">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div class="card-meta">
                  <h3 class="teacher-title">{teacher.name}</h3>
                  <div class="role-badges-row">
                    {#if teacher.roleType === 'guest_teacher' || teacher.roleType === 'external'}
                      <span class="badge-tag label-guest">⛺ Gast-Seminarleiter</span>
                    {:else}
                      <span class="badge-tag label-karma">🧡 Karma-Yogi</span>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Green Stay Banner with Countdown -->
              <div class="stay-banner active">
                <div class="stay-banner-header">
                  <span class="badge-live-green">🟢 Vor Ort</span>
                  <span class="stay-date-range">📅 {formatDateDe(teacher.stayStartDate)} – {formatDateDe(teacher.stayEndDate)}</span>
                </div>
                <div class="stay-countdown text-green-bold">
                  {#if daysRemaining !== null}
                    ⏱️ Noch <strong>{daysRemaining} Tage</strong> im Haus
                  {:else}
                    ♾️ Unbefristeter Aufenthalt
                  {/if}
                </div>
              </div>

              <!-- Qualifications Grid: Prominent Highlights -->
              <div class="qualifications-box">
                <div class="qual-item" class:qual-active={teacher.isYogaTeacher !== false}>
                  <span class="qual-icon">🧘</span>
                  <span class="qual-label">Yogastunden:</span>
                  <strong class="qual-val">{teacher.isYogaTeacher !== false ? '✓ Ja' : '✗ Nein'}</strong>
                </div>
                <div class="qual-item" class:qual-active={teacher.rules.canLeadMeditation}>
                  <span class="qual-icon">🪷</span>
                  <span class="qual-label">Meditation:</span>
                  <strong class="qual-val">{teacher.rules.canLeadMeditation ? '✓ Ja' : '✗ Nein'}</strong>
                </div>
                <div class="qual-item" class:qual-active={teacher.rules.canLeadSatsang}>
                  <span class="qual-icon">🕉️</span>
                  <span class="qual-label">Satsang:</span>
                  <strong class="qual-val">{teacher.rules.canLeadSatsang ? '✓ Ja' : '✗ Nein'}</strong>
                </div>
              </div>

              <!-- Specialties Tags -->
              {#if teacher.specialties && teacher.specialties.length > 0}
                <div class="specialties-pills">
                  {#each teacher.specialties as spec}
                    <span class="spec-pill">{spec}</span>
                  {/each}
                </div>
              {/if}

              <!-- Notes / Aufgaben -->
              {#if teacher.stayNotes || teacher.customWishes}
                <div class="notes-box">
                  <span class="notes-icon">💬</span>
                  <p class="notes-text">{teacher.stayNotes || teacher.customWishes}</p>
                </div>
              {/if}

              <!-- Card Quick Action Footer -->
              <div class="card-footer-actions">
                <button 
                  type="button" 
                  class="btn-quick-action" 
                  onclick={(e) => {
                    e.stopPropagation();
                    extendStay(teacher, 7);
                  }}
                  title="Zeitfenster um 7 Tage verlängern"
                >
                  +7 Tage
                </button>
                <button 
                  type="button" 
                  class="btn-quick-action" 
                  onclick={(e) => {
                    e.stopPropagation();
                    extendStay(teacher, 14);
                  }}
                  title="Zeitfenster um 14 Tage verlängern"
                >
                  +14 Tage
                </button>
                <button 
                  type="button" 
                  class="btn-quick-edit" 
                  onclick={(e) => {
                    e.stopPropagation();
                    openEditModal(teacher);
                  }}
                >
                  ✏️ Bearbeiten
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="glass-card empty-card-compact">
          <span class="empty-icon-sm">🟢</span>
          <p>Aktuell sind keine Karma-Yogis oder Seminarleiter mit aktivem Zeitfenster für heute eingetragen.</p>
          <button class="btn btn-small btn-primary" onclick={() => openAddModal('karma_yogi')}>
            ➕ Jetzt ersten Karma-Yogi einpflegen
          </button>
        </div>
      {/if}
    </section>
  {/if}

  <!-- ========================================================================= -->
  <!-- SEKTION 2: ⏳ ZUKÜNFTIGE ANREISEN (Direkt darunter) -->
  <!-- ========================================================================= -->
  {#if selectedFilterStatus === 'all' || selectedFilterStatus === 'upcoming'}
    <section class="section-container upcoming-section animate-fade-in">
      <div class="section-header-banner banner-upcoming">
        <div class="section-header-left">
          <span class="status-indicator-dot dot-blue"></span>
          <div>
            <h2 class="section-heading">⏳ Zukünftige Anreisen & Geplante Aufenthalte ({upcomingTeachers.length})</h2>
            <p class="section-subtext">Diese Unterrichtenden reisen demnächst an und stehen ab ihrem Anreisedatum zur Verfügung.</p>
          </div>
        </div>
        <button class="btn btn-small btn-secondary" onclick={() => openAddModal('guest_teacher')}>
          <span>➕</span> Zukünftigen Gast erfassen
        </button>
      </div>

      {#if upcomingTeachers.length > 0}
        <div class="grid-cols-3">
          {#each upcomingTeachers as teacher}
            {@const daysUntil = getDaysUntil(teacher.stayStartDate)}
            
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div 
              class="glass-card glass-card-interactive karma-card status-upcoming" 
              class:selected-card={selectedTeacherIds.includes(teacher.id)}
              onclick={() => openEditModal(teacher)}
            >
              <!-- Card Header -->
              <div class="card-header-flex">
                <input 
                  type="checkbox" 
                  class="teacher-select-checkbox" 
                  checked={selectedTeacherIds.includes(teacher.id)}
                  onclick={(e) => {
                    e.stopPropagation();
                    toggleSelectTeacher(teacher.id);
                  }}
                />
                <div class="avatar bg-gradient-to-br {teacher.avatarColor}">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div class="card-meta">
                  <h3 class="teacher-title">{teacher.name}</h3>
                  <div class="role-badges-row">
                    {#if teacher.roleType === 'guest_teacher' || teacher.roleType === 'external'}
                      <span class="badge-tag label-guest">⛺ Gast-Seminarleiter</span>
                    {:else}
                      <span class="badge-tag label-karma">🧡 Karma-Yogi</span>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Blue Stay Banner with Arrival Countdown -->
              <div class="stay-banner upcoming">
                <div class="stay-banner-header">
                  <span class="badge-live-blue">⏳ Anreise bevorstehend</span>
                  <span class="stay-date-range">📅 {formatDateDe(teacher.stayStartDate)} – {formatDateDe(teacher.stayEndDate)}</span>
                </div>
                <div class="stay-countdown text-blue-bold">
                  {#if daysUntil !== null}
                    🚀 Ankunft in <strong>{daysUntil} Tagen</strong> vor Ort
                  {/if}
                </div>
              </div>

              <!-- Qualifications Grid -->
              <div class="qualifications-box">
                <div class="qual-item" class:qual-active={teacher.isYogaTeacher !== false}>
                  <span class="qual-icon">🧘</span>
                  <span class="qual-label">Yogastunden:</span>
                  <strong class="qual-val">{teacher.isYogaTeacher !== false ? '✓ Ja' : '✗ Nein'}</strong>
                </div>
                <div class="qual-item" class:qual-active={teacher.rules.canLeadMeditation}>
                  <span class="qual-icon">🪷</span>
                  <span class="qual-label">Meditation:</span>
                  <strong class="qual-val">{teacher.rules.canLeadMeditation ? '✓ Ja' : '✗ Nein'}</strong>
                </div>
                <div class="qual-item" class:qual-active={teacher.rules.canLeadSatsang}>
                  <span class="qual-icon">🕉️</span>
                  <span class="qual-label">Satsang:</span>
                  <strong class="qual-val">{teacher.rules.canLeadSatsang ? '✓ Ja' : '✗ Nein'}</strong>
                </div>
              </div>

              <!-- Specialties Tags -->
              {#if teacher.specialties && teacher.specialties.length > 0}
                <div class="specialties-pills">
                  {#each teacher.specialties as spec}
                    <span class="spec-pill">{spec}</span>
                  {/each}
                </div>
              {/if}

              <!-- Notes / Aufgaben -->
              {#if teacher.stayNotes || teacher.customWishes}
                <div class="notes-box">
                  <span class="notes-icon">💬</span>
                  <p class="notes-text">{teacher.stayNotes || teacher.customWishes}</p>
                </div>
              {/if}

              <!-- Card Quick Action Footer -->
              <div class="card-footer-actions">
                <button 
                  type="button" 
                  class="btn-quick-edit" 
                  style="width: 100%; text-align: center;"
                  onclick={(e) => {
                    e.stopPropagation();
                    openEditModal(teacher);
                  }}
                >
                  ✏️ Aufenthaltsdaten bearbeiten
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="glass-card empty-card-compact">
          <span class="empty-icon-sm">⏳</span>
          <p>Keine zukünftigen Anreisen eingetragen.</p>
        </div>
      {/if}
    </section>
  {/if}

  <!-- ========================================================================= -->
  <!-- SEKTION 3: 🔴 ARCHIV / VERGANGENE AUFENTHALTE (Abgelaufen) -->
  <!-- ========================================================================= -->
  {#if selectedFilterStatus === 'all' || selectedFilterStatus === 'expired'}
    <section class="section-container expired-section animate-fade-in">
      <div class="section-header-banner banner-expired">
        <div class="section-header-left">
          <span class="status-indicator-dot dot-red"></span>
          <div>
            <h2 class="section-heading">🔴 Archiv / Vergangene Zeitfenster ({expiredTeachers.length})</h2>
            <p class="section-subtext">Diese Zeitfenster sind abgelaufen. Mit 1-Klick können diese Personen für einen neuen Aufenthalt reaktiviert werden.</p>
          </div>
        </div>
        <button 
          type="button" 
          class="btn-toggle-archive" 
          onclick={() => isArchiveExpanded = !isArchiveExpanded}
        >
          {isArchiveExpanded ? '▲ Einklappen' : '▼ Ausklappen'}
        </button>
      </div>

      {#if isArchiveExpanded}
        {#if expiredTeachers.length > 0}
          <div class="grid-cols-3">
            {#each expiredTeachers as teacher}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div 
                class="glass-card glass-card-interactive karma-card status-expired"
                class:selected-card={selectedTeacherIds.includes(teacher.id)}
                onclick={() => openEditModal(teacher)}
              >
                <!-- Card Header -->
                <div class="card-header-flex">
                  <input 
                    type="checkbox" 
                    class="teacher-select-checkbox" 
                    checked={selectedTeacherIds.includes(teacher.id)}
                    onclick={(e) => {
                      e.stopPropagation();
                      toggleSelectTeacher(teacher.id);
                    }}
                  />
                  <div class="avatar bg-gradient-to-br {teacher.avatarColor}">
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div class="card-meta">
                    <h3 class="teacher-title">{teacher.name}</h3>
                    <div class="role-badges-row">
                      {#if teacher.roleType === 'guest_teacher' || teacher.roleType === 'external'}
                        <span class="badge-tag label-guest">⛺ Gast-Seminarleiter</span>
                      {:else}
                        <span class="badge-tag label-karma">🧡 Karma-Yogi</span>
                      {/if}
                    </div>
                  </div>
                </div>

                <!-- Expired Stay Banner -->
                <div class="stay-banner expired">
                  <div class="stay-banner-header">
                    <span class="badge-live-red">🔴 Abgelaufen</span>
                    <span class="stay-date-range">📅 {formatDateDe(teacher.stayStartDate)} – {formatDateDe(teacher.stayEndDate)}</span>
                  </div>
                  <div class="stay-countdown text-red-bold">
                    Aufenthalt endete am {formatDateDe(teacher.stayEndDate)}
                  </div>
                </div>

                <!-- Card Quick Re-Activate Action Footer -->
                <div class="card-footer-actions">
                  <button 
                    type="button" 
                    class="btn btn-small btn-primary" 
                    style="width: 100%; justify-content: center;"
                    onclick={(e) => {
                      e.stopPropagation();
                      reactivateStay(teacher, 14);
                    }}
                    title="Startet einen neuen 14-tägigen Aufenthalt ab heute"
                  >
                    🔄 Jetzt für 14 Tage reaktivieren
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="glass-card empty-card-compact">
            <span class="empty-icon-sm">🔴</span>
            <p>Keine abgelaufenen Einträge im Archiv.</p>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
</div>

<!-- Add / Edit Modal -->
{#if isModalOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={() => isModalOpen = false}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content glass-card modal-lg" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{editingTeacher ? 'Profil & Zeitfenster bearbeiten' : 'Neuen Karma-Yogi / externen Seminarleiter einpflegen'}</h2>
        <button class="close-btn" onclick={() => isModalOpen = false}>✕</button>
      </div>

      <div class="modal-body">
        <!-- Basic Info -->
        <div class="section-title">👤 Persönliche Daten & Rolle</div>
        <div class="grid-cols-2" style="gap: 1rem; display: grid; grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label class="form-label" for="form-name">Name *</label>
            <input id="form-name" type="text" class="form-input" placeholder="z. B. Johanna Weber" bind:value={formName} />
          </div>
          <div class="form-group">
            <label class="form-label" for="form-role">Rolle / Status *</label>
            <select id="form-role" class="form-select" bind:value={formRoleType}>
              <option value="karma_yogi">🧡 Karma-Yogi</option>
              <option value="guest_teacher">⛺ Externer Gast-Seminarleiter</option>
            </select>
          </div>
        </div>

        <div class="grid-cols-2" style="gap: 1rem; display: grid; grid-template-columns: 1fr 1fr; margin-top: 0.5rem;">
          <div class="form-group">
            <label class="form-label" for="form-email">E-Mail (optional)</label>
            <input id="form-email" type="email" class="form-input" placeholder="johanna@yoga.de" bind:value={formEmail} />
          </div>
          <div class="form-group">
            <label class="form-label" for="form-phone">Telefon (optional)</label>
            <input id="form-phone" type="text" class="form-input" placeholder="+49 170 1234567" bind:value={formPhone} />
          </div>
        </div>

        <!-- Stay Period (Zeitfenster) -->
        <div class="divider"></div>
        <div class="section-title">📅 Aufenthaltszeitraum im Haus (Zeitfenster)</div>
        <p class="section-desc">Während dieses Datumsbereichs ist die Person für Stunden im Terminkalender und Wochenplan manuell wählbar:</p>
        
        <div class="grid-cols-2" style="gap: 1rem; display: grid; grid-template-columns: 1fr 1fr;">
          <div class="form-group">
            <label class="form-label" for="form-start">Anreise / Im Haus ab *</label>
            <input id="form-start" type="date" class="form-input" bind:value={formStayStartDate} />
          </div>
          <div class="form-group">
            <label class="form-label" for="form-end">Abreise / Im Haus bis *</label>
            <input id="form-end" type="date" class="form-input" bind:value={formStayEndDate} />
          </div>
        </div>

        <!-- Qualifications -->
        <div class="divider"></div>
        <div class="section-title">🧘 Unterrichts-Qualifikationen & Berechtigungen</div>
        <p class="section-desc">Bestimmen Sie, für welche Stundenarten die Person manuell eingeteilt werden kann:</p>

        <div class="checkbox-box-group">
          <label class="custom-checkbox-row">
            <input type="checkbox" bind:checked={formIsYogaTeacher} />
            <div class="checkbox-text-meta">
              <strong>🧘 Kann Yogastunden unterrichten</strong>
              <span>Ermöglicht die Zuteilung zu Anfänger-, Mittelstufen- und Themenstunden.</span>
            </div>
          </label>
          <label class="custom-checkbox-row">
            <input type="checkbox" bind:checked={formCanLeadMeditation} />
            <div class="checkbox-text-meta">
              <strong>🪷 Kann geführte Meditationen leiten</strong>
              <span>Ermöglicht die Zuteilung zu morgendlichen geführten Meditationen (07:00 Uhr).</span>
            </div>
          </label>
          <label class="custom-checkbox-row">
            <input type="checkbox" bind:checked={formCanLeadSatsang} />
            <div class="checkbox-text-meta">
              <strong>🕉️ Kann Satsangs leiten</strong>
              <span>Ermöglicht bei Bedarf die Zuteilung zu Satsangs.</span>
            </div>
          </label>
        </div>

        <!-- Yoga Specialties -->
        <div class="form-group" style="margin-top: 1rem;">
          <span class="form-label">Bevorzugte Yoga-Stile & Schwerpunkte</span>
          <div class="checkbox-grid">
            {#each SPECIALTY_OPTIONS as spec}
              <button 
                type="button" 
                class="checkbox-chip" 
                class:active={formSpecialties.includes(spec)}
                onclick={() => toggleSpecialty(spec)}
              >
                {spec}
              </button>
            {/each}
          </div>
        </div>

        <!-- Notes / Comments -->
        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label" for="form-notes">Aufgaben, Notizen & Freitext-Absprachen</label>
          <textarea 
            id="form-notes" 
            class="form-input" 
            style="min-height: 80px; resize: vertical;"
            placeholder="z. B. Hilft im Sevabereich Küche und möchte 2x pro Woche die Yogastunde am Nachmittag übernehmen..."
            bind:value={formStayNotes}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        {#if editingTeacher && userRole !== 'viewer'}
          <button class="btn btn-danger" style="margin-right: auto;" onclick={() => editingTeacher && handleDelete(editingTeacher.id)}>
            🗑️ Löschen
          </button>
        {/if}
        <button class="btn btn-secondary" onclick={() => isModalOpen = false}>Abbrechen</button>
        {#if userRole !== 'viewer'}
          <button class="btn btn-primary" onclick={handleSave}>Speichern & Aktivieren</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Bulk Actions Floating Bar -->
{#if selectedTeacherIds.length > 0 && userRole !== 'viewer'}
  <div class="bulk-actions-bar glass-card animate-fade-in">
    <span class="bulk-count">⚡ {selectedTeacherIds.length} ausgewählt</span>
    <button type="button" class="btn btn-danger btn-small" onclick={bulkDelete}>
      Ausgewählte löschen
    </button>
    <button type="button" class="btn btn-secondary btn-small" onclick={() => selectedTeacherIds = []}>
      Abbrechen
    </button>
  </div>
{/if}

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 1.5rem;
    gap: 1.5rem;
  }

  .badge-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .title-section h1 {
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
    color: var(--text-primary);
  }

  .title-section p {
    color: var(--text-secondary);
    max-width: 850px;
    margin: 0;
    line-height: 1.5;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 1rem;
  }

  .kpi-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.2rem 1.4rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    transition: transform 0.2s ease;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
  }

  .card-kpi-active {
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(255, 255, 255, 0.9));
    border-color: #a7f3d0;
  }

  .card-kpi-upcoming {
    background: linear-gradient(135deg, rgba(239, 246, 255, 0.9), rgba(255, 255, 255, 0.9));
    border-color: #bfdbfe;
  }

  .card-kpi-expired {
    background: linear-gradient(135deg, rgba(244, 244, 245, 0.9), rgba(255, 255, 255, 0.9));
    border-color: #e4e4e7;
  }

  .kpi-icon {
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }

  .kpi-info {
    display: flex;
    flex-direction: column;
  }

  .kpi-value {
    font-size: 1.7rem;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.1;
  }

  .kpi-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-top: 0.2rem;
  }

  /* Toolbar */
  .filters-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 320px;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    font-size: 0.9rem;
    opacity: 0.6;
  }

  .search-input {
    padding-left: 2.25rem;
    padding-right: 2rem;
  }

  .clear-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
  }

  .filter-group-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    font-family: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .tab-btn:hover {
    background: #fff9e6;
    color: var(--text-primary);
  }

  .tab-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(150, 0, 64, 0.2);
  }

  .role-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .select-compact {
    padding: 0.4rem 1.8rem 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  /* Section Containers */
  .section-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-header-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-radius: 16px;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .banner-active {
    background: linear-gradient(90deg, #ecfdf5 0%, #ffffff 100%);
    border: 1.5px solid #10b981;
  }

  .banner-upcoming {
    background: linear-gradient(90deg, #eff6ff 0%, #ffffff 100%);
    border: 1.5px solid #3b82f6;
  }

  .banner-expired {
    background: linear-gradient(90deg, #f4f4f5 0%, #ffffff 100%);
    border: 1.5px solid #a1a1aa;
  }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .status-indicator-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot-green {
    background: #10b981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
  }

  .dot-blue {
    background: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
  }

  .dot-red {
    background: #71717a;
    box-shadow: 0 0 0 4px rgba(113, 113, 122, 0.25);
  }

  .section-heading {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-primary);
  }

  .section-subtext {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0.15rem 0 0;
  }

  .btn-toggle-archive {
    background: transparent;
    border: 1px solid var(--border-color);
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    color: var(--text-secondary);
  }

  /* Karma Cards */
  .grid-cols-3 {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  .karma-card {
    display: flex;
    flex-direction: column;
    padding: 1.4rem;
    border-radius: 18px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    position: relative;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .karma-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-main);
  }

  .karma-card.status-active {
    border-left: 6px solid #10b981; /* green */
    background: #ffffff;
  }

  .karma-card.status-upcoming {
    border-left: 6px solid #3b82f6; /* blue */
    background: #f8fafc;
  }

  .karma-card.status-expired {
    border-left: 6px solid #71717a; /* neutral gray */
    background: #fafafa;
    opacity: 0.9;
  }

  .card-header-flex {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 1rem;
  }

  .teacher-select-checkbox {
    cursor: pointer;
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: white;
    font-size: 1.1rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .teacher-title {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }

  .role-badges-row {
    display: flex;
    gap: 0.4rem;
  }

  .label-karma {
    background: #ffedd5;
    color: #c2410c;
    border: 1px solid #fed7aa;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
  }

  .label-guest {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
  }

  /* Stay Banner */
  .stay-banner {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .stay-banner.active {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
  }

  .stay-banner.upcoming {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }

  .stay-banner.expired {
    background: #f4f4f5;
    border: 1px solid #e4e4e7;
  }

  .stay-banner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .badge-live-green {
    font-size: 0.75rem;
    font-weight: 800;
    color: #047857;
    background: #d1fae5;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }

  .badge-live-blue {
    font-size: 0.75rem;
    font-weight: 800;
    color: #1d4ed8;
    background: #dbeafe;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }

  .badge-live-red {
    font-size: 0.75rem;
    font-weight: 800;
    color: #52525b;
    background: #e4e4e7;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
  }

  .stay-date-range {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stay-countdown {
    font-size: 0.8rem;
  }

  .text-green-bold {
    color: #065f46;
  }

  .text-blue-bold {
    color: #1e40af;
  }

  .text-red-bold {
    color: #52525b;
  }

  /* Qualifications Box */
  .qualifications-box {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.65rem 0.85rem;
    margin-bottom: 0.85rem;
  }

  .qual-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  .qual-item.qual-active {
    color: var(--text-primary);
  }

  .qual-item.qual-active .qual-val {
    color: #059669;
    font-weight: 800;
  }

  .qual-val {
    margin-left: auto;
    font-weight: 700;
  }

  /* Specialties Pills */
  .specialties-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.85rem;
  }

  .spec-pill {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    color: var(--text-secondary);
  }

  /* Notes */
  .notes-box {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    background: #fffdf7;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 0.6rem 0.8rem;
    margin-bottom: 1rem;
  }

  .notes-icon {
    font-size: 0.9rem;
  }

  .notes-text {
    font-size: 0.8rem;
    color: #78350f;
    margin: 0;
    line-height: 1.4;
  }

  /* Footer Quick Actions */
  .card-footer-actions {
    margin-top: auto;
    display: flex;
    gap: 0.4rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--border-color);
  }

  .btn-quick-action {
    background: rgba(150, 0, 64, 0.05);
    border: 1px solid rgba(150, 0, 64, 0.2);
    border-radius: 6px;
    padding: 0.35rem 0.6rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--primary);
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .btn-quick-action:hover {
    background: var(--primary);
    color: white;
  }

  .btn-quick-edit {
    margin-left: auto;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .btn-quick-edit:hover {
    background: #f1f5f9;
  }

  /* Empty state */
  .empty-card-compact {
    text-align: center;
    padding: 1.5rem 1rem;
    border-radius: 14px;
    border: 1px dashed var(--border-color);
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .empty-icon-sm {
    font-size: 1.5rem;
  }

  /* Modal Details */
  .modal-lg {
    max-width: 680px;
  }

  .section-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: -0.25rem 0 0.85rem;
  }

  .checkbox-box-group {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
  }

  .custom-checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    cursor: pointer;
  }

  .custom-checkbox-row input {
    margin-top: 0.2rem;
    width: 18px;
    height: 18px;
    accent-color: var(--primary);
  }

  .checkbox-text-meta {
    display: flex;
    flex-direction: column;
  }

  .checkbox-text-meta strong {
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .checkbox-text-meta span {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .bulk-actions-bar {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-radius: 30px;
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    z-index: 99;
  }

  .bulk-count {
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--primary);
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }
    .header-actions {
      flex-direction: column;
    }
  }
</style>
