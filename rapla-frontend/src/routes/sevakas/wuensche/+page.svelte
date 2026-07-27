<script lang="ts">
  import { onMount } from 'svelte';
  import { db, type Teacher, type TimeSlot, type Room } from '$lib/db';

  // State variables using Svelte 5 runes
  let teachers = $state<Teacher[]>([]);
  let rooms = $state<Room[]>([]);
  let selectedTeacherId = $state<string>('');
  
  // Form states linked to the selected teacher
  let isYogaTeacher = $state<boolean>(true);
  let canLeadMeditation = $state<boolean>(true);
  let canLeadSatsang = $state<boolean>(true);
  let maxClassesPerDay = $state<number>(2);
  let maxHoursPerWeek = $state<number>(10);
  let minRestTime = $state<number>(30);
  
  let preferredRooms = $state<string[]>([]);
  let preferredDays = $state<number[]>([]);
  let nonPreferredDays = $state<number[]>([]);
  let specialties = $state<string[]>([]);
  let customWishes = $state<string>('');
  
  // Weekly Availability Slots
  let ruleAvailability = $state<TimeSlot[]>([]);
  let tempAvailDay = $state<number>(1); // Monday
  let tempAvailStart = $state<string>('06:30');
  let tempAvailEnd = $state<string>('22:00');
  
  // Absences State (Sevafrei)
  let absencesList = $state<any[]>([]);
  let newAbsenceStart = $state<string>('');
  let newAbsenceEnd = $state<string>('');
  let newAbsenceType = $state<'Urlaub' | 'Frei' | 'Seminartage' | 'Krank' | 'Sonstiges'>('Urlaub');
  let newAbsenceNote = $state<string>('');

  // Toast / Feedback State
  let showToast = $state<boolean>(false);
  let toastMessage = $state<string>('');
  let toastType = $state<'success' | 'error'>('success');

  const DAYS = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 0, label: 'Sonntag' }
  ];

  const STYLE_OPTIONS = [
    'Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 
    'Kundalini', 'Yoga Nidra', 'Pranayama', 'Raja Yoga', 'Satsang'
  ];

  onMount(() => {
    loadInitialData();
  });

  function loadInitialData() {
    teachers = db.getTeachers().filter(t => t.roleType === 'sevaka');
    rooms = db.getRooms();
    loadAllAbsences();
  }

  function loadAllAbsences() {
    const saved = localStorage.getItem('rapla_sevafrei');
    if (saved) {
      try {
        absencesList = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse absences', e);
      }
    }
  }

  // Derived filtered absences for the selected teacher
  let teacherAbsences = $derived(
    absencesList.filter(a => a.teacherId === selectedTeacherId)
  );

  let selectedTeacher = $derived(
    teachers.find(t => t.id === selectedTeacherId)
  );

  // Watch for selected teacher changes and populate form
  $effect(() => {
    if (selectedTeacher) {
      const t = selectedTeacher;
      isYogaTeacher = t.isYogaTeacher !== false;
      canLeadMeditation = t.rules.canLeadMeditation !== false;
      canLeadSatsang = t.rules.canLeadSatsang !== false;
      maxClassesPerDay = t.rules.maxClassesPerDay ?? 2;
      maxHoursPerWeek = t.rules.maxHoursPerWeek ?? 10;
      minRestTime = t.rules.minRestTime ?? 30;
      
      preferredRooms = [...(t.rules.preferredRooms || [])];
      preferredDays = [...(t.rules.preferredDays || [])];
      nonPreferredDays = [...(t.rules.nonPreferredDays || [])];
      specialties = [...(t.specialties || [])];
      customWishes = t.customWishes ?? '';
      ruleAvailability = [...(t.rules.availability || [])];
    }
  });

  // Toggle preferred rooms
  function toggleRoomPref(roomId: string) {
    if (preferredRooms.includes(roomId)) {
      preferredRooms = preferredRooms.filter(id => id !== roomId);
    } else {
      preferredRooms = [...preferredRooms, roomId];
    }
  }

  // Toggle preferred weekdays (prioritized)
  function togglePreferredDay(day: number) {
    if (preferredDays.includes(day)) {
      preferredDays = preferredDays.filter(d => d !== day);
    } else {
      // Remove from nonPreferredDays if present
      nonPreferredDays = nonPreferredDays.filter(d => d !== day);
      preferredDays = [...preferredDays, day];
    }
  }

  // Toggle non-preferred weekdays (avoid if possible)
  function toggleNonPreferredDay(day: number) {
    if (nonPreferredDays.includes(day)) {
      nonPreferredDays = nonPreferredDays.filter(d => d !== day);
    } else {
      // Remove from preferredDays if present
      preferredDays = preferredDays.filter(d => d !== day);
      nonPreferredDays = [...nonPreferredDays, day];
    }
  }

  // Toggle yoga style specialties
  function toggleSpecialty(style: string) {
    if (specialties.includes(style)) {
      specialties = specialties.filter(s => s !== style);
    } else {
      specialties = [...specialties, style];
    }
  }

  // Add availability slot
  function addAvailability() {
    // Basic verification
    if (tempAvailStart >= tempAvailEnd) {
      triggerToast('Startzeit muss vor der Endzeit liegen.', 'error');
      return;
    }
    
    // Check duplication
    const duplicate = ruleAvailability.some(
      slot => slot.day === tempAvailDay && slot.start === tempAvailStart && slot.end === tempAvailEnd
    );
    if (duplicate) {
      triggerToast('Dieser Zeitbereich existiert bereits.', 'error');
      return;
    }

    ruleAvailability = [
      ...ruleAvailability,
      { day: tempAvailDay, start: tempAvailStart, end: tempAvailEnd }
    ].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.start.localeCompare(b.start);
    });
    triggerToast('Arbeitszeit hinzugefügt.', 'success');
  }

  function removeAvailability(index: number) {
    ruleAvailability = ruleAvailability.filter((_, i) => i !== index);
    triggerToast('Arbeitszeit entfernt.', 'success');
  }

  // Quick preset buttons for shifts
  function applyAvailabilityPreset(preset: 'standard' | 'weekendOnly' | 'halfDay' | 'none') {
    if (preset === 'standard') {
      ruleAvailability = [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ];
    } else if (preset === 'weekendOnly') {
      ruleAvailability = [
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ];
    } else if (preset === 'halfDay') {
      ruleAvailability = [
        { day: 1, start: '08:00', end: '13:00' },
        { day: 2, start: '08:00', end: '13:00' },
        { day: 3, start: '08:00', end: '13:00' },
        { day: 4, start: '08:00', end: '13:00' },
        { day: 5, start: '08:00', end: '13:00' }
      ];
    } else {
      ruleAvailability = [];
    }
    triggerToast('Preset angewendet.', 'success');
  }

  // Absences CRUD
  function handleAddAbsence() {
    if (!newAbsenceStart || !newAbsenceEnd) {
      triggerToast('Bitte Start- und Enddatum der Abwesenheit eingeben.', 'error');
      return;
    }
    if (newAbsenceStart > newAbsenceEnd) {
      triggerToast('Das Startdatum darf nicht nach dem Enddatum liegen.', 'error');
      return;
    }

    const newEntry = {
      id: 'sf-' + Math.random().toString(36).substr(2, 9),
      teacherId: selectedTeacherId,
      teacherName: selectedTeacher?.name || '',
      startDate: newAbsenceStart,
      endDate: newAbsenceEnd,
      type: newAbsenceType,
      status: 'Genehmigt',
      note: newAbsenceNote || newAbsenceType
    };

    absencesList = [...absencesList, newEntry];
    localStorage.setItem('rapla_sevafrei', JSON.stringify(absencesList));
    
    // Sync with Server JSON
    syncAbsencesToServer();

    // Reset Form
    newAbsenceStart = '';
    newAbsenceEnd = '';
    newAbsenceNote = '';
    triggerToast('Abwesenheit erfolgreich eingetragen.', 'success');
  }

  function handleDeleteAbsence(id: string) {
    absencesList = absencesList.filter(a => a.id !== id);
    localStorage.setItem('rapla_sevafrei', JSON.stringify(absencesList));
    
    // Sync with Server JSON
    syncAbsencesToServer();
    triggerToast('Abwesenheit entfernt.', 'success');
  }

  async function syncAbsencesToServer() {
    try {
      const res = await fetch('/api/sevafrei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(absencesList)
      });
      if (!res.ok) console.error('Failed to sync absences to server folder');
    } catch (e) {
      console.error('Network error during absences sync', e);
    }
  }

  // Trigger Feedbacks
  function triggerToast(msg: string, type: 'success' | 'error' = 'success') {
    toastMessage = msg;
    toastType = type;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 4000);
  }

  // Main Save changes
  async function handleSaveWishes() {
    if (!selectedTeacherId) return;

    // Load full teachers list from storage to modify
    const allStoredTeachers = db.getTeachers();
    const idx = allStoredTeachers.findIndex(t => t.id === selectedTeacherId);
    
    if (idx !== -1) {
      // Build updated teacher profile
      const updatedTeacher: Teacher = {
        ...allStoredTeachers[idx],
        isYogaTeacher,
        specialties,
        customWishes,
        rules: {
          ...allStoredTeachers[idx].rules,
          maxClassesPerDay,
          maxHoursPerWeek,
          minRestTime,
          preferredRooms,
          preferredDays,
          nonPreferredDays,
          canLeadMeditation,
          canLeadSatsang,
          availability: ruleAvailability
        }
      };

      // 1. Update client-side Database
      db.updateTeacher(updatedTeacher);
      
      // 2. Prepare file export list (Sync all local teachers wishes to the folder JSON file)
      // Retrieve the updated teachers list to serialize
      const updatedTeachersList = db.getTeachers();
      
      // Select only wishes fields for sevakas to avoid bloating the file
      const wishesOnly = updatedTeachersList
        .filter(t => t.roleType === 'sevaka')
        .map(t => ({
          id: t.id,
          name: t.name,
          specialties: t.specialties,
          customWishes: t.customWishes,
          availabilityMode: t.availabilityMode,
          rules: {
            maxClassesPerDay: t.rules.maxClassesPerDay,
            maxHoursPerWeek: t.rules.maxHoursPerWeek,
            minRestTime: t.rules.minRestTime,
            preferredRooms: t.rules.preferredRooms,
            preferredDays: t.rules.preferredDays,
            nonPreferredDays: t.rules.nonPreferredDays,
            canLeadMeditation: t.rules.canLeadMeditation,
            canLeadSatsang: t.rules.canLeadSatsang,
            availability: t.rules.availability
          }
        }));

      // 3. Post wishes list to SvelteKit API endpoint (saving to src/lib/data/sevakas_wishes.json)
      try {
        const res = await fetch('/api/sevakas-wishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wishesOnly)
        });
        
        if (res.ok) {
          triggerToast('Deine Einstellungen wurden erfolgreich gespeichert und werden für alle zukünftigen Planungen genutzt! 🙏', 'success');
        } else {
          triggerToast('Lokales Speichern erfolgreich, aber Serverordner-Sync schlug fehl.', 'error');
        }
      } catch (e) {
        console.error(e);
        triggerToast('Lokales Speichern erfolgreich. Verbindung zum Server fehlgeschlagen.', 'error');
      }
    } else {
      triggerToast('Sevaka-Profil wurde in der Datenbank nicht gefunden.', 'error');
    }
  }
</script>

<svelte:head>
  <title>Sevaka-Wünsche & Präferenzen | Rapla 2.0</title>
</svelte:head>

<main class="page-container animate-fade-in">
  <!-- Toast Notification -->
  {#if showToast}
    <div class="toast-notification {toastType} animate-slide-up">
      <span>{toastType === 'success' ? '🙏' : '🚨'} {toastMessage}</span>
    </div>
  {/if}

  <header class="page-header">
    <div class="header-content">
      <span class="badge badge-accent">Abfrage-Formular</span>
      <h1>Sevaka-Wünsche & Präferenzen</h1>
      <p>Hier kannst du alle speziellen Wünsche, Arbeitszeiten und Raum-Präferenzen für dich festlegen. Diese werden automatisch bei jeder neuen KI-Planung beachtet.</p>
    </div>
  </header>

  <div class="selection-card glass-card">
    <div class="form-group">
      <label class="form-label" for="sevaka-select">Wähle deinen Namen aus, um deine Präferenzen zu laden:</label>
      <select id="sevaka-select" class="form-select select-highlight" bind:value={selectedTeacherId}>
        <option value="">-- Bitte wählen --</option>
        {#each teachers as t}
          <option value={t.id}>{t.name}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if selectedTeacherId}
    <div class="form-grid">
      <!-- Left Column: Settings and capacities -->
      <div class="form-column">
        <!-- Section: Stammdaten & Rollen -->
        <section class="section-card glass-card">
          <h2>Rollen & Fähigkeiten</h2>
          <p class="section-desc">Welche Aufgaben kannst oder möchtest du im Haus übernehmen?</p>
          
          <div class="checkbox-row">
            <label class="toggle-control">
              <input type="checkbox" bind:checked={isYogaTeacher} />
              <span class="control-indicator"></span>
              <span class="control-label">Unterrichtet Hatha-Yoga & Kurse</span>
            </label>
          </div>

          <div class="checkbox-row">
            <label class="toggle-control">
              <input type="checkbox" bind:checked={canLeadMeditation} />
              <span class="control-indicator"></span>
              <span class="control-label">Kann Meditationen leiten (morgens/abends)</span>
            </label>
          </div>

          <div class="checkbox-row">
            <label class="toggle-control">
              <input type="checkbox" bind:checked={canLeadSatsang} />
              <span class="control-indicator"></span>
              <span class="control-label">Kann Satsänge leiten (Satsang-Vortrag & Kirtan)</span>
            </label>
          </div>
        </section>

        <!-- Section: Limits & Kapazitäten -->
        <section class="section-card glass-card">
          <h2>Kapazitäten & Grenzen</h2>
          <p class="section-desc">Lege fest, wie viel Unterricht für dich am Tag und in der Woche gesund ist.</p>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="max-hours-week">Max. Unterrichtsstunden / Woche</label>
              <input id="max-hours-week" type="number" class="form-input" min="1" max="40" bind:value={maxHoursPerWeek} />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="max-classes-day">Max. Klassen / Tag</label>
              <input id="max-classes-day" type="number" class="form-input" min="1" max="5" bind:value={maxClassesPerDay} />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="min-rest-time">Mindest-Pause zwischen zwei Klassen (Minuten)</label>
            <input id="min-rest-time" type="number" class="form-input" min="0" step="5" bind:value={minRestTime} />
          </div>
        </section>

        <!-- Section: Wochentage -->
        <section class="section-card glass-card">
          <h2>Wochentags-Wünsche</h2>
          <p class="section-desc">Klicke Wochentage an, an denen du bevorzugt eingeteilt werden möchtest (Gold) oder an denen du lieber nicht unterrichten möchtest (Rot).</p>
          
          <div class="form-group">
            <label class="form-label">Bevorzugte Tage (Einteilungs-Priorität)</label>
            <div class="checkbox-grid">
              {#each DAYS as day}
                <button 
                  type="button" 
                  class="checkbox-chip gold" 
                  class:active={preferredDays.includes(day.value)}
                  onclick={() => togglePreferredDay(day.value)}
                >
                  {day.label}
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group" style="margin-top: 1.5rem;">
            <label class="form-label">Nicht bevorzugte Tage (Nur im Notfall verplanen)</label>
            <div class="checkbox-grid">
              {#each DAYS as day}
                <button 
                  type="button" 
                  class="checkbox-chip red" 
                  class:active={nonPreferredDays.includes(day.value)}
                  onclick={() => toggleNonPreferredDay(day.value)}
                >
                  {day.label}
                </button>
              {/each}
            </div>
          </div>
        </section>

        <!-- Section: Räume und Stile -->
        <section class="section-card glass-card">
          <h2>Räume & Yoga-Stile</h2>
          <p class="section-desc">Konfiguriere deine bevorzugten Unterrichts-Säle und deine Stil-Spezialisierungen.</p>

          <div class="form-group">
            <label class="form-label">Bevorzugte Yoga-Säle</label>
            <div class="checkbox-grid">
              {#each rooms as room}
                <button 
                  type="button" 
                  class="checkbox-chip" 
                  style="--accent: {room.color}"
                  class:active={preferredRooms.includes(room.id)}
                  onclick={() => toggleRoomPref(room.id)}
                >
                  {room.name}
                </button>
              {/each}
            </div>
          </div>

          <div class="form-group" style="margin-top: 1.5rem;">
            <label class="form-label">Deine Yoga-Stile & Spezialisierungen</label>
            <div class="checkbox-grid">
              {#each STYLE_OPTIONS as style}
                <button 
                  type="button" 
                  class="checkbox-chip" 
                  class:active={specialties.includes(style)}
                  onclick={() => toggleSpecialty(style)}
                >
                  {style}
                </button>
              {/each}
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column: Availability grid & Absences & Comments -->
      <div class="form-column">
        <!-- Section: Verfügbare Schichtzeiten -->
        <section class="section-card glass-card">
          <h2>Wöchentliche Arbeitszeiten & Schichten</h2>
          <p class="section-desc">Gib deine regelmäßigen Arbeits- und Unterrichtszeiten an. Außerhalb dieser Schichten wirst du blockiert.</p>
          
          <div class="preset-buttons">
            <button type="button" class="btn btn-small" onclick={() => applyAvailabilityPreset('standard')}>Preset: Ganze Woche (06:30 - 22:00)</button>
            <button type="button" class="btn btn-small" onclick={() => applyAvailabilityPreset('weekendOnly')}>Preset: Nur Wochenende</button>
            <button type="button" class="btn btn-small" onclick={() => applyAvailabilityPreset('halfDay')}>Preset: Nur Vormittags (Mo-Fr)</button>
            <button type="button" class="btn btn-small btn-danger-text" onclick={() => applyAvailabilityPreset('none')}>Alles leeren</button>
          </div>

          <div class="availability-builder" style="margin-top: 1.5rem;">
            <select class="form-select" style="width: 140px;" bind:value={tempAvailDay}>
              {#each DAYS as d}
                <option value={d.value}>{d.label}</option>
              {/each}
            </select>
            <div class="time-inputs">
              <input type="time" class="form-input" bind:value={tempAvailStart} />
              <span>bis</span>
              <input type="time" class="form-input" bind:value={tempAvailEnd} />
            </div>
            <button type="button" class="btn btn-secondary" onclick={addAvailability}>
              ➕ Hinzufügen
            </button>
          </div>

          <div class="slots-list" style="margin-top: 1.25rem;">
            {#if ruleAvailability.length === 0}
              <div class="empty-state">Keine Arbeitszeiten hinterlegt (Du bist für automatische Einteilungen komplett blockiert).</div>
            {:else}
              {#each ruleAvailability as slot, index}
                <div class="slot-item">
                  <span class="slot-day">{DAYS.find(d => d.value === slot.day)?.label}</span>
                  <span class="slot-time">⏰ {slot.start} - {slot.end} Uhr</span>
                  <button type="button" class="delete-slot-btn" onclick={() => removeAvailability(index)}>✕</button>
                </div>
              {/each}
            {/if}
          </div>
        </section>

        <!-- Section: Urlaub und freie Zeiten (Sevafrei) -->
        <section class="section-card glass-card">
          <h2>Urlaub & Freie Zeiten (Sevafrei)</h2>
          <p class="section-desc">Plane hier deine abwesenden Tage. Diese werden direkt im globalen Sevafrei-Kalender verbucht und berücksichtigt.</p>
          
          <form class="absence-form" onsubmit={(e) => { e.preventDefault(); handleAddAbsence(); }}>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="abs-start">Von Datum</label>
                <input id="abs-start" type="date" class="form-input" bind:value={newAbsenceStart} />
              </div>
              <div class="form-group">
                <label class="form-label" for="abs-end">Bis Datum</label>
                <input id="abs-end" type="date" class="form-input" bind:value={newAbsenceEnd} />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="abs-type">Typ</label>
                <select id="abs-type" class="form-select" bind:value={newAbsenceType}>
                  <option value="Urlaub">Urlaub (Sevafrei)</option>
                  <option value="Frei">Wöchentlicher Ruhetag (Frei)</option>
                  <option value="Seminartage">Seminartage / Externe Leitung</option>
                  <option value="Krank">Krankheitsbedingt</option>
                  <option value="Sonstiges">Sonstige Abwesenheit</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="abs-note">Bemerkung (z.B. Urlaubsort)</label>
                <input id="abs-note" type="text" class="form-input" placeholder="Optional" bind:value={newAbsenceNote} />
              </div>
            </div>

            <button type="submit" class="btn btn-secondary w-full" style="margin-top: 0.5rem;">
              ✈️ Abwesenheit eintragen
            </button>
          </form>

          <div class="absences-list-table" style="margin-top: 1.5rem;">
            <h3>Deine eingetragenen Abwesenheiten</h3>
            {#if teacherAbsences.length === 0}
              <div class="empty-state">Keine geplanten Abwesenheiten für dich hinterlegt.</div>
            {:else}
              <div class="table-wrapper">
                <table class="simple-table">
                  <thead>
                    <tr>
                      <th>Zeitraum</th>
                      <th>Typ</th>
                      <th>Notiz</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each teacherAbsences as entry}
                      <tr>
                        <td>{entry.startDate} bis {entry.endDate}</td>
                        <td><span class="badge badge-small">{entry.type}</span></td>
                        <td>{entry.note || '-'}</td>
                        <td>
                          <button type="button" class="btn-action-delete" onclick={() => handleDeleteAbsence(entry.id)}>🗑️</button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </section>

        <!-- Section: Spezielle Wünsche & Freitext -->
        <section class="section-card glass-card">
          <h2>Spezielle Wünsche & Notizen (Freitext)</h2>
          <p class="section-desc">Gibt es weitere spezielle Wünsche, wiederkehrende Sperrzeiten (z. B. Rezeptionsdienste, Team-Meetings, persönliche Einschränkungen) oder Planungsdetails?</p>
          <div class="form-group">
            <textarea 
              class="form-textarea" 
              rows="4" 
              placeholder="Z. B. 'Dienstags ab 12 Uhr Rezeption und danach Buchungsarbeiten (nachmittags keine Dienste)' oder 'Bitte wenn möglich bevorzugt Morgenstunden zuteilen...'"
              bind:value={customWishes}
            ></textarea>
          </div>
        </section>
      </div>
    </div>

    <!-- Submit bar -->
    <div class="sticky-footer glass-card">
      <div class="footer-content">
        <p>Deine Änderungen werden lokal gespeichert und mit der Hauptplanungs-Datei synchronisiert.</p>
        <button type="button" class="btn btn-primary btn-large" onclick={handleSaveWishes}>
          💾 Wünsche & Einstellungen speichern
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
  .page-container {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    padding-bottom: 8rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }
  
  .badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 9999px;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .badge-accent {
    background-color: var(--accent-glow);
    color: var(--primary);
    border: 1px solid var(--border-color);
  }

  .badge-small {
    font-size: 0.75rem;
    padding: 0.1rem 0.5rem;
    background-color: var(--primary-glow);
    color: var(--primary);
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .page-header p {
    color: var(--text-secondary);
    max-width: 800px;
  }

  .selection-card {
    margin-bottom: 2rem;
  }

  .select-highlight {
    font-size: 1.1rem;
    border: 2px solid var(--border-color);
    padding: 0.75rem;
    background-color: #fffdf8;
    color: var(--text-primary);
    border-radius: 10px;
    cursor: pointer;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }

  .form-column {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section-card h2 {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
    border-bottom: 2px solid var(--secondary-hover);
    padding-bottom: 0.5rem;
  }

  .section-desc {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .form-input, .form-select, .form-textarea {
    padding: 0.65rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: #fff;
    font-family: inherit;
    font-size: 0.95rem;
    transition: var(--transition-smooth);
    color: var(--text-primary);
  }

  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-glow);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .checkbox-row {
    margin-bottom: 1rem;
  }

  .toggle-control {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .toggle-control input {
    display: none;
  }

  .control-indicator {
    width: 44px;
    height: 24px;
    background-color: #e0e0e0;
    border-radius: 12px;
    position: relative;
    margin-right: 0.75rem;
    transition: background-color 0.2s;
  }

  .control-indicator::after {
    content: '';
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .toggle-control input:checked + .control-indicator {
    background-color: var(--primary);
  }

  .toggle-control input:checked + .control-indicator::after {
    transform: translateX(20px);
  }

  .control-label {
    font-size: 0.95rem;
    font-weight: 500;
  }

  .checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .checkbox-chip {
    background: #fff;
    border: 1px solid var(--border-color);
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition-smooth);
    font-family: inherit;
    color: var(--text-secondary);
  }

  .checkbox-chip:hover {
    border-color: var(--primary);
    background: var(--primary-glow);
  }

  .checkbox-chip.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .checkbox-chip.gold.active {
    background: var(--accent);
    color: #2a1b1b;
    border-color: var(--accent);
    font-weight: 600;
  }

  .checkbox-chip.red.active {
    background: var(--danger);
    color: white;
    border-color: var(--danger);
  }

  /* Availability builder */
  .preset-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: var(--transition-smooth);
    font-family: inherit;
  }

  .btn-small {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
    background-color: var(--secondary-glow);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .btn-small:hover {
    background-color: var(--secondary-hover);
  }

  .btn-danger-text {
    background: transparent;
    border: 1px solid transparent;
    color: var(--danger);
  }

  .btn-danger-text:hover {
    background-color: var(--danger-glow);
    border-color: var(--border-color);
  }

  .btn-secondary {
    background-color: var(--secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background-color: var(--secondary-hover);
  }

  .btn-primary {
    background-color: var(--primary);
    color: white;
    border: 1px solid var(--primary);
  }

  .btn-primary:hover {
    background-color: var(--primary-hover);
    border-color: var(--primary-hover);
  }

  .btn-large {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .w-full {
    width: 100%;
  }

  .availability-builder {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--secondary-glow);
    padding: 0.75rem;
    border-radius: 10px;
    border: 1px dashed var(--border-color);
  }

  .time-inputs {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .time-inputs .form-input {
    width: 95px;
    padding: 0.4rem;
  }

  .slots-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .slot-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .slot-day {
    font-weight: 600;
    color: var(--text-primary);
    width: 90px;
  }

  .slot-time {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .delete-slot-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0 0.25rem;
    transition: color 0.15s;
  }

  .delete-slot-btn:hover {
    color: var(--danger);
  }

  .empty-state {
    text-align: center;
    padding: 1.5rem;
    color: var(--text-muted);
    border: 1px dashed var(--border-color);
    border-radius: 8px;
    font-size: 0.9rem;
    background: var(--bg-main);
  }

  /* Absences Form and Table */
  .absence-form {
    background: var(--bg-main);
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
  }

  .absences-list-table h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }

  .table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  .simple-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    background: #fff;
  }

  .simple-table th, .simple-table td {
    padding: 0.6rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .simple-table th {
    background: var(--bg-main);
    font-weight: 600;
    color: var(--text-secondary);
  }

  .simple-table tr:last-child td {
    border-bottom: none;
  }

  .btn-action-delete {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0;
    transition: transform 0.1s;
  }

  .btn-action-delete:hover {
    transform: scale(1.2);
  }

  /* Sticky Footer */
  .sticky-footer {
    position: fixed;
    bottom: 0;
    left: 240px; /* offset sidebar width roughly */
    right: 0;
    padding: 1rem 2rem;
    z-index: 100;
    border-radius: 0;
    border-top: 1px solid var(--border-color);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
    background: rgba(255, 253, 248, 0.95);
    backdrop-filter: blur(8px);
  }

  @media (max-width: 768px) {
    .sticky-footer {
      left: 0;
    }
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
  }

  .footer-content p {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  /* Toast Notification */
  .toast-notification {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 500;
    z-index: 999;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
  }

  .toast-notification.success {
    background-color: var(--success);
    border: 1px solid var(--success-hover);
  }

  .toast-notification.error {
    background-color: var(--danger);
    border: 1px solid var(--danger-hover);
  }

  /* Animations */
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }

  .animate-slide-up {
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
</style>
