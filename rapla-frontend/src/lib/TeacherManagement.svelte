<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Teacher, type TimeSlot, type Room } from '$lib/db';

  // Svelte 5 component prop
  let { roleType }: { roleType: 'sevaka' | 'external' } = $props();

  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  
  // Derived state to only show the teachers of this specific roleType
  let filteredTeachers = $derived(teachers.filter(t => t.roleType === roleType));
  
  // Modal states
  let isModalOpen = $state(false);
  let editingTeacher = $state<Teacher | null>(null);
  
  // Form fields
  let formName = $state('');
  let formEmail = $state('');
  let formPhone = $state('');
  let formSpecialties = $state<string[]>([]);
  let formIsYogaTeacher = $state(true);
  let formAvailabilityMode = $state<'always' | 'seminar_only'>('always');
  let formCustomWishes = $state('');
  let selectedTeacherIds = $state<string[]>([]);
  
  // Rule fields
  let ruleMaxClasses = $state(2);
  let ruleMaxHours = $state(10);
  let ruleMinRest = $state(30);
  let rulePreferredRooms = $state<string[]>([]);
  let rulePreferredDays = $state<number[]>([]);
  let ruleCanLeadMeditation = $state(false);
  let ruleCanLeadSatsang = $state(false);
  let ruleCanLeadPranayama = $state(false);
  let ruleCanLeadOnn = $state(false);
  let ruleCanLeadSatsangEinfuehrung = $state(false);
  let ruleCanLeadHausfuehrung = $state(false);
  let ruleCanLeadSpaziergang = $state(false);
  let ruleMaxYogaClasses = $state<number | null>(null);
  let ruleMaxMeditation = $state<number | null>(null);
  let ruleMaxSatsangs = $state<number | null>(null);
  let ruleMaxOnn = $state<number | null>(null);
  let ruleMaxMorningSatsangs = $state<number | null>(null);
  let ruleNoTwoYogaSameDay = $state(false);
  let ruleWeekendAfternoonOnly = $state(false);
  let ruleWeekendAsBackupOnly = $state(false);
  let ruleNoYogaOnWeekend = $state(false);
  let rulePrefersMittelstufe = $state(false);
  let ruleCustomCourseNamesText = $state('');
  let ruleAvailability = $state<TimeSlot[]>([]);
  
  // Temp availability slot builder
  let tempAvailDay = $state(1); // Monday
  let tempAvailStart = $state('09:00');
  let tempAvailEnd = $state('17:00');

  const DAYS = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' }
  ];

  const SPECIALTY_OPTIONS = ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini'];
  
  const AVATAR_COLORS = [
    'from-pink-500 to-rose-500',
    'from-blue-500 to-indigo-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-600',
    'from-purple-500 to-indigo-600',
    'from-cyan-400 to-blue-500'
  ];

  onMount(() => {
    loadData();
  });

  function loadData() {
    teachers = db.getTeachers();
    rooms = db.getRooms();
    selectedTeacherIds = [];
  }

  function openAddModal() {
    editingTeacher = null;
    formName = '';
    formEmail = '';
    formPhone = '';
    formSpecialties = [];
    formIsYogaTeacher = true;
    formAvailabilityMode = roleType === 'sevaka' ? 'always' : 'seminar_only';
    formCustomWishes = '';
    ruleMaxClasses = 2;
    ruleMaxHours = 10;
    ruleMinRest = 30;
    rulePreferredRooms = [];
    rulePreferredDays = [];
    ruleCanLeadMeditation = false;
    ruleCanLeadSatsang = false;
    ruleCanLeadPranayama = false;
    ruleCanLeadOnn = false;
    ruleCanLeadSatsangEinfuehrung = false;
    ruleCanLeadHausfuehrung = false;
    ruleCanLeadSpaziergang = false;
    ruleMaxYogaClasses = null;
    ruleMaxMeditation = null;
    ruleMaxSatsangs = null;
    ruleMaxOnn = null;
    ruleMaxMorningSatsangs = null;
    ruleNoTwoYogaSameDay = false;
    ruleWeekendAfternoonOnly = false;
    ruleWeekendAsBackupOnly = false;
    ruleNoYogaOnWeekend = false;
    rulePrefersMittelstufe = false;
    ruleCustomCourseNamesText = '';
    ruleAvailability = [
      { day: 1, start: '08:00', end: '22:00' },
      { day: 2, start: '08:00', end: '22:00' },
      { day: 3, start: '08:00', end: '22:00' },
      { day: 4, start: '08:00', end: '22:00' },
      { day: 5, start: '08:00', end: '22:00' },
      { day: 6, start: '08:00', end: '22:00' },
      { day: 0, start: '08:00', end: '22:00' }
    ];
    isModalOpen = true;
  }

  function openEditModal(teacher: Teacher) {
    editingTeacher = teacher;
    formName = teacher.name;
    formEmail = teacher.email;
    formPhone = teacher.phone;
    formSpecialties = [...teacher.specialties];
    formIsYogaTeacher = teacher.isYogaTeacher !== false;
    formAvailabilityMode = teacher.availabilityMode || 'always';
    formCustomWishes = teacher.customWishes || '';
    ruleMaxClasses = teacher.rules.maxClassesPerDay;
    ruleMaxHours = teacher.rules.maxHoursPerWeek;
    ruleMinRest = teacher.rules.minRestTime;
    rulePreferredRooms = [...teacher.rules.preferredRooms];
    rulePreferredDays = [...(teacher.rules.preferredDays || [])];
    ruleCanLeadMeditation = !!teacher.rules.canLeadMeditation;
    ruleCanLeadSatsang = !!teacher.rules.canLeadSatsang;
    ruleCanLeadPranayama = !!teacher.rules.canLeadPranayama;
    ruleCanLeadOnn = !!teacher.rules.canLeadOnn;
    ruleCanLeadSatsangEinfuehrung = !!teacher.rules.canLeadSatsangEinfuehrung;
    ruleCanLeadHausfuehrung = !!teacher.rules.canLeadHausfuehrung;
    ruleCanLeadSpaziergang = !!teacher.rules.canLeadSpaziergang;
    ruleMaxYogaClasses = teacher.rules.maxYogaClassesPerWeek ?? null;
    ruleMaxMeditation = teacher.rules.maxMeditationPerWeek ?? null;
    ruleMaxSatsangs = teacher.rules.maxSatsangsPerWeek ?? null;
    ruleMaxOnn = teacher.rules.maxOnnPerWeek ?? null;
    ruleMaxMorningSatsangs = teacher.rules.maxMorningSatsangsPerWeek ?? null;
    ruleNoTwoYogaSameDay = !!teacher.rules.noTwoYogaSameDay;
    ruleWeekendAfternoonOnly = !!teacher.rules.weekendAfternoonOnly;
    ruleWeekendAsBackupOnly = !!teacher.rules.weekendAsBackupOnly;
    ruleNoYogaOnWeekend = !!teacher.rules.noYogaOnWeekend;
    rulePrefersMittelstufe = !!teacher.rules.prefersMittelstufe;
    ruleCustomCourseNamesText = (teacher.rules.customCourseNames || [])
      .map(c => `${c.originalName}: ${c.customName}`)
      .join(', ');
    ruleAvailability = [...teacher.rules.availability];
    isModalOpen = true;
  }

  function handleSave() {
    if (!formName) return alert('Bitte Namen eingeben');

    const customCourseNames: { originalName: string; customName: string }[] = [];
    if (ruleCustomCourseNamesText.trim()) {
      ruleCustomCourseNamesText.split(',').forEach(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
          customCourseNames.push({
            originalName: parts[0].trim(),
            customName: parts[1].trim()
          });
        }
      });
    }

    const teacherData: Teacher = {
      id: editingTeacher?.id || 'teacher-' + Date.now(),
      name: formName,
      email: formEmail,
      phone: formPhone,
      avatarColor: editingTeacher?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      specialties: formSpecialties,
      isYogaTeacher: formIsYogaTeacher,
      availabilityMode: formAvailabilityMode,
      roleType, // Assigns current page roleType ('sevaka' or 'external')
      customWishes: formCustomWishes,
      rules: {
        maxClassesPerDay: ruleMaxClasses,
        maxHoursPerWeek: ruleMaxHours,
        minRestTime: ruleMinRest,
        preferredRooms: rulePreferredRooms,
        preferredDays: rulePreferredDays,
        canLeadMeditation: ruleCanLeadMeditation,
        canLeadSatsang: ruleCanLeadSatsang,
        canLeadPranayama: ruleCanLeadPranayama,
        canLeadOnn: ruleCanLeadOnn,
        canLeadSatsangEinfuehrung: ruleCanLeadSatsangEinfuehrung,
        canLeadHausfuehrung: ruleCanLeadHausfuehrung,
        canLeadSpaziergang: ruleCanLeadSpaziergang,
        maxYogaClassesPerWeek: ruleMaxYogaClasses === null ? undefined : ruleMaxYogaClasses,
        maxMeditationPerWeek: ruleMaxMeditation === null ? undefined : ruleMaxMeditation,
        maxSatsangsPerWeek: ruleMaxSatsangs === null ? undefined : ruleMaxSatsangs,
        maxOnnPerWeek: ruleMaxOnn === null ? undefined : ruleMaxOnn,
        maxMorningSatsangsPerWeek: ruleMaxMorningSatsangs === null ? undefined : ruleMaxMorningSatsangs,
        noTwoYogaSameDay: ruleNoTwoYogaSameDay,
        weekendAfternoonOnly: ruleWeekendAfternoonOnly,
        weekendAsBackupOnly: ruleWeekendAsBackupOnly,
        noYogaOnWeekend: ruleNoYogaOnWeekend,
        prefersMittelstufe: rulePrefersMittelstufe,
        customCourseNames: customCourseNames.length > 0 ? customCourseNames : undefined,
        availability: ruleAvailability
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
    if (confirm('Möchten Sie dieses Profil wirklich löschen?')) {
      db.deleteTeacher(id);
      isModalOpen = false;
      loadData();
    }
  }

  function addAvailability() {
    if (!tempAvailStart || !tempAvailEnd) return;
    if (tempAvailStart >= tempAvailEnd) return alert('Endzeit muss nach Startzeit liegen');
    
    // Add slot
    ruleAvailability = [
      ...ruleAvailability,
      { day: Number(tempAvailDay), start: tempAvailStart, end: tempAvailEnd }
    ].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  }

  function removeAvailability(index: number) {
    ruleAvailability = ruleAvailability.filter((_, i) => i !== index);
  }

  function toggleSpecialty(spec: string) {
    if (formSpecialties.includes(spec)) {
      formSpecialties = formSpecialties.filter(s => s !== spec);
    } else {
      formSpecialties = [...formSpecialties, spec];
    }
  }

  function togglePreferredRoom(roomId: string) {
    if (rulePreferredRooms.includes(roomId)) {
      rulePreferredRooms = rulePreferredRooms.filter(id => id !== roomId);
    } else {
      rulePreferredRooms = [...rulePreferredRooms, roomId];
    }
  }

  function togglePreferredDay(day: number) {
    if (rulePreferredDays.includes(day)) {
      rulePreferredDays = rulePreferredDays.filter(d => d !== day);
    } else {
      rulePreferredDays = [...rulePreferredDays, day];
    }
  }

  function toggleSelectTeacher(id: string) {
    if (selectedTeacherIds.includes(id)) {
      selectedTeacherIds = selectedTeacherIds.filter(tId => tId !== id);
    } else {
      selectedTeacherIds = [...selectedTeacherIds, id];
    }
  }

  function applyBulkAction(action: 'always' | 'seminar_only' | 'is_yoga' | 'is_seminar_leader' | 'delete') {
    if (selectedTeacherIds.length === 0) return;
    
    if (action === 'delete') {
      if (!confirm(`Möchten Sie diese ${selectedTeacherIds.length} Profile wirklich löschen?`)) {
        return;
      }
      selectedTeacherIds.forEach(id => db.deleteTeacher(id));
    } else {
      const list = db.getTeachers();
      const updatedList = list.map(t => {
        if (selectedTeacherIds.includes(t.id)) {
          if (action === 'always') {
            return { ...t, availabilityMode: 'always' as const };
          } else if (action === 'seminar_only') {
            return { ...t, availabilityMode: 'seminar_only' as const };
          } else if (action === 'is_yoga') {
            return { ...t, isYogaTeacher: true };
          } else if (action === 'is_seminar_leader') {
            return { ...t, isYogaTeacher: false };
          }
        }
        return t;
      });
      db.saveTeachers(updatedList);
    }
    selectedTeacherIds = [];
    loadData();
  }
</script>

<div class="page-header">
  <div class="title-section">
    <span class="badge badge-primary">{roleType === 'sevaka' ? 'Kernteam' : 'Ressourcen'}</span>
    <h1>{roleType === 'sevaka' ? 'Sevakas' : 'Externe'}</h1>
    <p>{roleType === 'sevaka' ? 'Verwalten Sie das interne Kernteam (Sevakas) und legen Sie Richtlinien für die KI-Vorplanung fest.' : 'Verwalten Sie das externe Lehrpersonal und legen Sie Richtlinien für die KI-Vorplanung fest.'}</p>
  </div>
  <button class="btn btn-primary" onclick={openAddModal}>
    <span>➕</span> {roleType === 'sevaka' ? 'Sevaka hinzufügen' : 'Lehrer hinzufügen'}
  </button>
</div>

<!-- Teachers Grid -->
<div class="grid-cols-3 animate-fade-in" style="margin-top: 2rem;">
  {#each filteredTeachers as teacher}
    <div 
      class="glass-card glass-card-interactive teacher-card" 
      class:selected-card={selectedTeacherIds.includes(teacher.id)}
      onclick={() => openEditModal(teacher)}
    >
      <!-- Card Header -->
      <div class="teacher-header">
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
        <div class="teacher-meta">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <h3 style="margin: 0;">{teacher.name}</h3>
            {#if teacher.isYogaTeacher === false}
              <span class="badge-tag label-seminar">Seminarleiter</span>
            {:else}
              <span class="badge-tag label-yoga">Yogalehrer</span>
              {#if teacher.availabilityMode === 'seminar_only'}
                <span class="badge-tag label-external">Extern (Nur Seminar)</span>
              {:else}
                <span class="badge-tag label-fulltime">Vollzeit</span>
              {/if}
            {/if}
          </div>
          <span class="teacher-contact">{teacher.email}</span>
        </div>
      </div>

      <!-- Specialties -->
      <div class="specialties-row">
        {#each teacher.specialties as specialty}
          <span class="specialty-tag">{specialty}</span>
        {/each}
      </div>

      <!-- Rules Summary -->
      {#if roleType !== 'sevaka'}
        <div class="rules-summary">
          <h4>📋 Aktive Grundregeln:</h4>
          <div class="rule-item">
            <span>Max. Einheiten:</span>
            <strong>{teacher.rules.maxClassesPerDay} / Tag | {teacher.rules.maxHoursPerWeek} Std. / Woche</strong>
          </div>
          <div class="rule-item">
            <span>Mindestpause:</span>
            <strong>{teacher.rules.minRestTime} Minuten</strong>
          </div>
          <div class="rule-item">
            <span>Verfügbarkeit:</span>
            <strong>{teacher.rules.availability.length} Schichten</strong>
          </div>
          {#if teacher.rules.preferredDays && teacher.rules.preferredDays.length > 0}
            <div class="rule-item">
              <span>Priorisiert an:</span>
              <strong style="color: var(--primary);">{teacher.rules.preferredDays.map(d => DAYS.find(day => day.value === d)?.label.substring(0, 2)).join(', ')}</strong>
            </div>
          {/if}
          {#if teacher.rules.canLeadMeditation || teacher.rules.canLeadSatsang}
            <div class="rule-item">
              <span>KI-Qualifikation:</span>
              <strong style="color: #960040;">
                {[
                  teacher.rules.canLeadMeditation ? 'Meditation' : '',
                  teacher.rules.canLeadSatsang ? 'Satsang' : ''
                ].filter(Boolean).join(', ')}
              </strong>
            </div>
          {/if}
        </div>
        
        <div class="card-action">
          <span class="edit-link">Regeln bearbeiten →</span>
        </div>
      {:else}
        <div class="card-action">
          <span class="edit-link">Profil bearbeiten →</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="glass-card" style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-secondary);">
      <h3>Keine Einträge vorhanden</h3>
      <p>Klicken Sie oben auf "{roleType === 'sevaka' ? 'Sevaka hinzufügen' : 'Lehrer hinzufügen'}", um ein neues Profil zu erstellen.</p>
    </div>
  {/each}
</div>

<!-- Add/Edit Modal -->
{#if isModalOpen}
  <div class="modal-backdrop" onclick={() => isModalOpen = false}>
    <div class="modal-content glass-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{editingTeacher ? (roleType === 'sevaka' ? 'Sevaka bearbeiten' : 'Externe bearbeiten') : (roleType === 'sevaka' ? 'Neuen Sevaka anlegen' : 'Neuen Externen anlegen')}</h2>
        <button class="close-btn" onclick={() => isModalOpen = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="section-title">Profilinformationen</div>
        <div class="form-group">
          <label class="form-label" for="teacher-name">Name</label>
          <input id="teacher-name" type="text" class="form-input" placeholder="z. B. Sarah Schmidt" bind:value={formName} />
        </div>
        
        <div class="grid-cols-2" style="gap: 1rem;">
          <div class="form-group">
            <label class="form-label" for="teacher-email">E-Mail-Adresse</label>
            <input id="teacher-email" type="email" class="form-input" placeholder="sarah@yoga.de" bind:value={formEmail} />
          </div>
          <div class="form-group">
            <label class="form-label" for="teacher-phone">Telefonnummer</label>
            <input id="teacher-phone" type="text" class="form-input" placeholder="+49 170..." bind:value={formPhone} />
          </div>
        </div>

        <!-- Yoga Teacher Toggle Checkbox -->
        <div class="form-group checkbox-form-group" style="margin-bottom: 1rem;">
          <label class="form-checkbox-label">
            <input type="checkbox" bind:checked={formIsYogaTeacher} />
            <span class="checkbox-label-text">Unterrichtet Yoga (für automatische KI-Planung berücksichtigen)</span>
          </label>
        </div>

        <!-- Custom wishes text field per teacher -->
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label" for="teacher-custom-wishes">Individuelle Sonderwünsche & Spezialregeln (Freitext)</label>
          <textarea 
            id="teacher-custom-wishes" 
            placeholder="z. B. Ulrich macht nie das Om Namo Narayanaya. Oder: Satyam unterrichtet gerne sonntags Pranayama." 
            class="form-input" 
            style="min-height: 80px; resize: vertical; font-family: inherit;"
            bind:value={formCustomWishes}
          ></textarea>
        </div>

        {#if roleType === 'sevaka'}
          <div class="divider"></div>
          <div class="section-title">⚙️ Planungsregeln für Sevaka</div>

          <div class="grid-cols-3" style="gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="rule-max-classes-sevaka">Max. Klassen / Tag</label>
              <input id="rule-max-classes-sevaka" type="number" min="1" max="10" class="form-input" bind:value={ruleMaxClasses} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-max-hours-sevaka">Max. Stunden / Woche</label>
              <input id="rule-max-hours-sevaka" type="number" min="1" max="50" class="form-input" bind:value={ruleMaxHours} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-min-rest-sevaka">Mindestpause (Min.)</label>
              <input id="rule-min-rest-sevaka" type="number" min="0" max="240" step="15" class="form-input" bind:value={ruleMinRest} />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Spezifische Qualifikationen</label>
            <div class="checkbox-grid-3">
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadMeditation} />
                <span>Meditation</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadSatsang} />
                <span>Satsang</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadPranayama} />
                <span>Pranayama</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadOnn} />
                <span>ONN</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadSatsangEinfuehrung} />
                <span>Satsang Einf.</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadHausfuehrung} />
                <span>Hausführung</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleCanLeadSpaziergang} />
                <span>Spaziergang</span>
              </label>
            </div>
          </div>

          <div class="section-title" style="font-size: 0.95rem; margin-top: 1rem;">Wöchentliche Limits (Optional)</div>
          <div class="grid-cols-3" style="gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" for="rule-max-yoga-week">Yogastunden / Woche</label>
              <input id="rule-max-yoga-week" type="number" placeholder="Kein Limit" class="form-input" bind:value={ruleMaxYogaClasses} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-max-med-week">Meditationen / Woche</label>
              <input id="rule-max-med-week" type="number" placeholder="Kein Limit" class="form-input" bind:value={ruleMaxMeditation} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-max-sat-week">Satsangs / Woche</label>
              <input id="rule-max-sat-week" type="number" placeholder="Kein Limit" class="form-input" bind:value={ruleMaxSatsangs} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-max-onn-week">ONN / Woche</label>
              <input id="rule-max-onn-week" type="number" placeholder="Kein Limit" class="form-input" bind:value={ruleMaxOnn} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-max-morn-sat">Morgen-Satsangs / Woche</label>
              <input id="rule-max-morn-sat" type="number" placeholder="Kein Limit" class="form-input" bind:value={ruleMaxMorningSatsangs} />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Besondere Planungsbedingungen</label>
            <div class="checkbox-grid-2">
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleNoTwoYogaSameDay} />
                <span>Max 1 Yogastunde/Tag</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleWeekendAfternoonOnly} />
                <span>WE: Nur nachmittags Yoga</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleWeekendAsBackupOnly} />
                <span>WE: Nur als Notvertretung</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={ruleNoYogaOnWeekend} />
                <span>WE: Keine Yogastunden</span>
              </label>
              <label class="checkbox-chip-label">
                <input type="checkbox" bind:checked={rulePrefersMittelstufe} />
                <span>Bevorzugt Mittelstufe</span>
              </label>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label" for="rule-custom-names">Kurs-Umbennungen (z.B. "Anfänger: meets Pavanmuktasana")</label>
            <input id="rule-custom-names" type="text" placeholder="z. B. Anfänger: meets Pavanmuktasana, Mittelstufe: Yoga Flow" class="form-input" bind:value={ruleCustomCourseNamesText} />
          </div>

          <div class="form-group">
            <label class="form-label" for="avail-day-sevaka">Arbeitszeiten & Freie Tage</label>
            <div class="availability-builder">
              <select id="avail-day-sevaka" class="form-select" style="width: 130px;" bind:value={tempAvailDay}>
                {#each DAYS as d}
                  <option value={d.value}>{d.label}</option>
                {/each}
              </select>
              <div class="time-inputs">
                <input id="avail-start-sevaka" type="time" class="form-input" bind:value={tempAvailStart} />
                <span>bis</span>
                <input id="avail-end-sevaka" type="time" class="form-input" bind:value={tempAvailEnd} />
              </div>
              <button type="button" class="btn btn-secondary btn-icon" onclick={addAvailability}>
                <span>➕ Hinzufügen</span>
              </button>
            </div>

            {#if ruleAvailability.length === 0}
              <div class="empty-state">Keine Arbeitszeiten hinterlegt (Lehrer ist dauerhaft blockiert).</div>
            {:else}
              <div class="slots-list" style="max-height: 150px; overflow-y: auto;">
                {#each ruleAvailability as slot, index}
                  <div class="slot-item">
                    <span class="slot-day">{DAYS.find(d => d.value === slot.day)?.label}</span>
                    <span class="slot-time">⏰ {slot.start} - {slot.end} Uhr</span>
                    <button type="button" class="delete-slot-btn" onclick={() => removeAvailability(index)}>✕</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          {#if formIsYogaTeacher}
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label class="form-label" for="teacher-avail-mode">Einteilungs-Verfügbarkeit</label>
              <select id="teacher-avail-mode" class="form-input" bind:value={formAvailabilityMode}>
                <option value="always">Vollzeit vor Ort (Immer verfügbar)</option>
                <option value="seminar_only">Externer Seminarleiter (Nur in Seminarwochen einteilbar)</option>
              </select>
            </div>
          {/if}

          <!-- Specialties Checkboxes -->
          <div class="form-group">
            <label class="form-label" for="spec-hatha">Yoga-Stile / Qualifikationen</label>
            <div class="checkbox-grid">
              {#each SPECIALTY_OPTIONS as spec}
                <button 
                  id="spec-{spec.toLowerCase().replace(' ', '-')}"
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

          <div class="divider"></div>
          <div class="section-title">⚙️ Planungsregeln für die KI</div>

          <div class="grid-cols-3" style="gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="rule-max-classes">Max. Klassen / Tag</label>
              <input id="rule-max-classes" type="number" min="1" max="10" class="form-input" bind:value={ruleMaxClasses} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-max-hours">Max. Stunden / Woche</label>
              <input id="rule-max-hours" type="number" min="1" max="50" class="form-input" bind:value={ruleMaxHours} />
            </div>
            <div class="form-group">
              <label class="form-label" for="rule-min-rest">Mindestpause (Min.)</label>
              <input id="rule-min-rest" type="number" min="0" max="240" step="15" class="form-input" bind:value={ruleMinRest} />
            </div>
          </div>

          <!-- Preferred Rooms -->
          <div class="form-group">
            <label class="form-label" for="room-pref">Bevorzugte Studios / Räume</label>
            <div class="checkbox-grid">
              {#each rooms as room}
                <button 
                  id="room-pref-{room.id}"
                  type="button"
                  class="checkbox-chip" 
                  class:active={rulePreferredRooms.includes(room.id)}
                  onclick={() => togglePreferredRoom(room.id)}
                >
                  {room.name}
                </button>
              {/each}
            </div>
          </div>

          <!-- Availability Schedule -->
          <div class="form-group">
            <label class="form-label" for="avail-day">Schichtzeiten & Verfügbarkeiten</label>
            <div class="availability-builder">
              <select id="avail-day" class="form-select" style="width: 130px;" bind:value={tempAvailDay}>
                {#each DAYS as d}
                  <option value={d.value}>{d.label}</option>
                {/each}
              </select>
              <div class="time-inputs">
                <input id="avail-start" type="time" class="form-input" bind:value={tempAvailStart} />
                <span>bis</span>
                <input id="avail-end" type="time" class="form-input" bind:value={tempAvailEnd} />
              </div>
              <button type="button" class="btn btn-secondary btn-icon" onclick={addAvailability}>
                <span>➕ Hinzufügen</span>
              </button>
            </div>

            <!-- Availability Slots List -->
            {#if ruleAvailability.length === 0}
              <div class="empty-state">Keine Arbeitszeiten hinterlegt (Lehrer ist dauerhaft blockiert).</div>
            {:else}
              <div class="slots-list">
                {#each ruleAvailability as slot, index}
                  <div class="slot-item">
                    <span class="slot-day">{DAYS.find(d => d.value === slot.day)?.label}</span>
                    <span class="slot-time">⏰ {slot.start} - {slot.end} Uhr</span>
                    <button type="button" class="delete-slot-btn" onclick={() => removeAvailability(index)}>✕</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="modal-footer">
        {#if editingTeacher}
          <button class="btn btn-danger" style="margin-right: auto;" onclick={() => editingTeacher && handleDelete(editingTeacher.id)}>
            🗑️ Löschen
          </button>
        {/if}
        <button class="btn btn-secondary" onclick={() => isModalOpen = false}>Abbrechen</button>
        <button class="btn btn-primary" onclick={handleSave}>Speichern</button>
      </div>
    </div>
  </div>
{/if}

<!-- Floating Bulk Actions Bar -->
{#if selectedTeacherIds.length > 0}
  <div class="bulk-actions-bar glass-card animate-fade-in">
    <div class="bulk-info">
      <span class="bulk-count">⚡ {selectedTeacherIds.length} ausgewählt</span>
    </div>
    <div class="bulk-buttons">
      <button type="button" class="btn btn-secondary btn-small" onclick={() => applyBulkAction('always')}>
        Vollzeit
      </button>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => applyBulkAction('seminar_only')}>
        Extern
      </button>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => applyBulkAction('is_yoga')}>
        Yogalehrer (Ja)
      </button>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => applyBulkAction('is_seminar_leader')}>
        Seminarleiter (Ja)
      </button>
      <button type="button" class="btn btn-danger btn-small" style="background-color: var(--danger-hover); border-color: var(--danger-hover); color: white;" onclick={() => applyBulkAction('delete')}>
        Löschen
      </button>
      <button type="button" class="btn btn-secondary btn-small" onclick={() => selectedTeacherIds = []}>
        Abbrechen
      </button>
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
  }

  .title-section h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.25rem 0 0.5rem;
  }

  .title-section p {
    color: var(--text-secondary);
  }

  .teacher-card {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1.5rem;
  }

  .teacher-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .teacher-meta h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .teacher-contact {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .specialties-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .specialty-tag {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    color: var(--text-secondary);
  }

  .rules-summary {
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-grow: 1;
  }

  .rules-summary h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  .rule-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .rule-item span {
    color: var(--text-muted);
  }

  .rule-item strong {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .card-action {
    margin-top: 1.5rem;
    text-align: right;
  }

  .edit-link {
    font-size: 0.85rem;
    color: var(--primary);
    font-weight: 600;
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

  .checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .checkbox-chip {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: var(--transition-smooth);
  }

  .checkbox-chip:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .checkbox-chip.active {
    background: var(--primary-glow);
    border-color: var(--primary);
    color: var(--primary);
  }

  .delete-slot-btn {
    background: none;
    border: none;
    color: var(--danger-hover);
    font-weight: bold;
    cursor: pointer;
    font-size: 0.9rem;
    transition: var(--transition-smooth);
    padding: 0 0.25rem;
  }

  .delete-slot-btn:hover {
    transform: scale(1.2);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    margin-top: 1.5rem;
  }

  .badge-tag {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label-yoga {
    background: #fce7f3;
    color: #9d174d;
    border: 1px solid #fbcfe8;
  }

  .label-seminar {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .checkbox-form-group {
    margin-top: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: 6px;
  }

  .form-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--text-primary);
  }

  .checkbox-label-text {
    font-weight: 500;
  }

  .label-external {
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
  }

  .label-fulltime {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .teacher-select-checkbox {
    margin-right: 0.75rem;
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--primary);
  }

  .teacher-card.selected-card {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-glow);
    background: #fdfbf7;
  }

  .bulk-actions-bar {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--primary);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    width: max-content;
    max-width: 90vw;
  }

  .bulk-info {
    display: flex;
    align-items: center;
  }

  .bulk-count {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--primary);
    white-space: nowrap;
  }

  .bulk-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .bulk-actions-bar {
      flex-direction: column;
      bottom: 1rem;
      width: calc(100% - 2rem);
      align-items: stretch;
      gap: 0.75rem;
    }
    .bulk-buttons {
      justify-content: center;
    }
  }

  .checkbox-grid-3 {
    display: grid;
    grid-template-cols: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .checkbox-grid-2 {
    display: grid;
    grid-template-cols: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .checkbox-chip-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.5rem 0.75rem;
    transition: var(--transition-smooth);
    user-select: none;
  }

  .checkbox-chip-label:hover {
    background: #f8fafc;
    border-color: #94a3b8;
  }

  .checkbox-chip-label:has(input:checked) {
    background: var(--primary-glow);
    border-color: var(--primary);
    color: var(--primary);
  }

  .checkbox-chip-label input {
    cursor: pointer;
  }
</style>
