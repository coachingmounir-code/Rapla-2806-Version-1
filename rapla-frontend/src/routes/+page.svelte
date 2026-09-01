<script lang="ts">
  import { onMount } from 'svelte';
  import { todoManager } from '$lib/todoStore.svelte';

  interface OpenDayProgramItem {
    id: string;
    time: string;
    title: string;
    instructor: string;
    room?: string;
    description?: string;
  }

  const defaultOpenDayProgram: OpenDayProgramItem[] = [
    {
      id: '1',
      time: '11:00 - 12:00',
      title: 'Hausführung & Begrüßung',
      instructor: 'Karuna M. Wapke',
      room: 'Foyer / Rezeption',
      description: 'Herzlicher Empfang, Hausrundgang durch das Haus Yoga Vidya Nordsee & Vorstellung des Tagesablaufs'
    },
    {
      id: '2',
      time: '14:00 - 15:00',
      title: 'Lachyoga-Stunde mit Antje',
      instructor: 'Antje',
      room: 'Shanti Raum',
      description: 'Befreiendes Lachen, Atem- & Lachyoga-Übungen für pure Freude, Leichtigkeit und neue Lebensenergie'
    },
    {
      id: '3',
      time: '15:30 - 16:45',
      title: 'Hatha Yoga Schnupperstunde (für alle Level)',
      instructor: 'Sevaka-Team',
      room: 'Großer Übungsraum',
      description: 'Sanfte Asanas, Pranayama und geführte Tiefenentspannung'
    },
    {
      id: '4',
      time: '17:00 - 18:00',
      title: 'Vortrag: Yoga als Lebensweg',
      instructor: 'Karuna M. Wapke',
      room: 'Satsang-Raum',
      description: 'Einführung in die ganzheitliche Yoga-Philosophie, Meditation & gesunde Lebensführung'
    },
    {
      id: '5',
      time: '20:00 - 21:30',
      title: 'Gemeinsamer Satsang & Kirtan',
      instructor: 'Ashram Team',
      room: 'Satsang-Raum',
      description: 'Meditation, Mantrasingen, Friedensgebete & traditionelles Arati'
    }
  ];

  interface Seminar {
    title: string;
    date: string;
    isWE: boolean;
    location: string;
    maxTN: number;
    currentTN: number;
    leader: string;
  }

  const seminars: Seminar[] = [
    { title: "Yoga Ferienwoche", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 19, leader: "Beate Menkarski" },
    { title: "Insel-Yoga", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 13, leader: "Ananda Schaak" },
    { title: "Yoga für Kinder 7-12 Jahre", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 2, leader: "Suniti Jacob" },
    { title: "Yoga für den Rücken", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Kamala Lubina" },
    { title: "Yin Yoga", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 15, currentTN: 8, leader: "Cornelia Surya Haag" },
    { title: "Die Satsang-Trommeln der Kirtan-Musik", date: "14.-16.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 11, leader: "Bernardo Juni" },
    { title: "Vinyasa Power Yoga - Meditation in Bewegung", date: "14.-16.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 8, leader: "Kamala Lubina" },
    { title: "Weg mit der Brille - Yoga für die Augen", date: "14.-16.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Susan Holze" },
    { title: "Yoga Ferienwoche", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 7, leader: "Ananda Schaak" },
    { title: "Shakti Yoga - Erwecke die Kraft deiner Weiblichkeit", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 7, leader: "Susan Holze" },
    { title: "Swings, Vibrations, Rotations", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Monika Adele Camara" },
    { title: "Yogaferien mit Surfen", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 3, leader: "Abha Morkötter" },
    { title: "Yoga und Meditation Einführung", date: "21.-23.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Jnanadev David Ianni" },
    { title: "Hawaiianischer Tanz und Yoga am Meer", date: "21.-23.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Monika Adele Camara" },
    { title: "Yogatherapie für die Atemwege an der Nordsee", date: "21.-23.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Susan Holze" },
    { title: "Yoga Ferienwoche", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 11, leader: "Jnanadev David Ianni" },
    { title: "Yoga rund um die Geburt - Yogalehrer Weiterbildung", date: "23.-30.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Susan Holze" },
    { title: "Schamanisches Kundalini Retreat", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 19, leader: "Satyadevi Bretz, Yogita Sari" },
    { title: "Yoga, Wandern und Fahrradfahren", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Ananda Schaak" },
    { title: "Yoga und Meditation Einführung", date: "28.-30.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "" },
    { title: "Meditation und Qi Gong", date: "28.-30.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Michael Büchel" },
    { title: "Yoga Ferienwoche - Yin Yoga", date: "30.8.-4.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Beate Menkarski" },
    { title: "Themenwoche: Indische Rituale und Rezitationen mit Swami Nivedanananda", date: "30.8.-4.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Swami Nivedanananda" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 1", date: "30.8.-4.9.26", isWE: false, location: "Nordsee", maxTN: 5, currentTN: 3, leader: "Karuna M. Wapke" },
    { title: "Yogalehrer Ausbildung Intensivkurs", date: "30.8.-27.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Karuna M. Wapke" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 1+2", date: "30.8.-11.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Karuna M. Wapke" },
    { title: "Yoga und Meditation Einführung", date: "4.-6.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "" },
    { title: "Erleben mit dem Bauchraum", date: "4.-6.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Erkan Batmaz" },
    { title: "Krishna Jayanti", date: "4.9.26", isWE: false, location: "Nordsee", maxTN: 2, currentTN: 0, leader: "" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 2", date: "4.-11.9.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 4, leader: "Karuna M. Wapke" },
    { title: "Yoga Ferienwoche", date: "6.-11.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Erkan Batmaz" },
    { title: "Insel-Yoga", date: "6.-11.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Pranava Heinz Pauly" },
    { title: "Sivanandas Geburtstag", date: "8.9.26", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 0, leader: "" },
    { title: "Harmonium Lernseminar", date: "11.-13.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Jürgen Wade" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 3", date: "11.-18.9.26", isWE: false, location: "Nordsee", maxTN: 5, currentTN: 4, leader: "Karuna M. Wapke" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 3+4", date: "11.-27.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Karuna M. Wapke" },
    { title: "Yoga Ferienwoche", date: "13.-18.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Madhavi Füllen, Gopala Kirill Serov" },
    { title: "Yoga, Wandern und Fahrradfahren", date: "13.-18.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Pranava Heinz Pauly" },
    { title: "Yoga und Meditation Einführung", date: "18.-20.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Gopala Kirill Serov" },
    { title: "Schamanismus als Medizin", date: "18.-20.9.26", isWE: true, location: "Nordsee", maxTN: 0, currentTN: 1, leader: "Maharani Fritsch de Navarrete" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 4", date: "18.-27.9.26", isWE: false, location: "Nordsee", maxTN: 5, currentTN: 1, leader: "Karuna M. Wapke" },
    { title: "Yoga Ferienwoche", date: "20.-25.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Chandradevi Winterhalter" },
    { title: "Yoga und Meditation Einführung", date: "24.-26.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "" },
    { title: "Acro Yoga", date: "25.-27.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Jnanadev Wallaschkowski" },
    { title: "Freude im Herzen - Mantra Singen und Yoga", date: "25.-27.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Gruppe Mudita" },
    { title: "YLA Prüfungswochenende", date: "25.-27.9.26", isWE: true, location: "Nordsee", maxTN: 5, currentTN: 0, leader: "Karuna M. Wapke" },
    { title: "Ayurvedisches Fasten für Pitta und Vata", date: "27.9.-2.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Satyananda Wahl, Aziza Lena Alemi" },
    { title: "Yoga Ferienwoche", date: "27.9.-2.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Gita Irene Hofmann" },
    { title: "Ayur-Yoga-Therapie für Schultern und Nacken", date: "2.-4.10.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Gita Irene Hofmann" },
    { title: "Yoga und Meditation Einführung", date: "2.-4.10.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Parashakti Küttner" },
    { title: "Meditation Intensiv Schweigend", date: "2.-4.10.26", isWE: true, location: "Nordsee", maxTN: 20, currentTN: 24, leader: "Karuna M. Wapke" },
    { title: "Aufrichtung in der Asana erleben und verstehen", date: "4.-9.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Gita Irene Hofmann" },
    { title: "Wellnesswoche: Ayurveda, Massagen, Yoga & Medi(t)", date: "4.-9.10.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 10, leader: "Madhavi Veronika Broszinski, Venulo Bernd Broszinski" },
    { title: "Yin Yoga Übungsleiter Ausbildung", date: "4.-16.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "" },
    { title: "Die 10-Wochenend-Weiterbildung für Yogalehrer", date: "9.10.26-21.5.28", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 0, leader: "" },
    { title: "Raja Yoga 2", date: "9.-11.10.26", isWE: true, location: "Nordsee", maxTN: 20, currentTN: 1, leader: "Karuna M. Wapke, Sukadev Bretz" },
    { title: "Yoga Ferienwoche", date: "11.-16.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Shankara Stefan Maune" },
    { title: "Navaratri", date: "11.-20.10.26", isWE: false, location: "Nordsee", maxTN: 2, currentTN: 0, leader: "" },
    { title: "Stärke deine Weiblichkeit im Frauentempel", date: "11.-16.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Rajeshwari Gemnich" },
    { title: "Yoga und Meditation Einführung", date: "16.-18.10.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Pranava Heinz Pauly" },
    { title: "Jnana Yoga, Vedanta, Meditation und Schweigen", date: "16.-18.10.26", isWE: true, location: "Nordsee", maxTN: 20, currentTN: 0, leader: "Karuna M. Wapke" },
    { title: "Mantra-Begleitung mit Ukulele | Aufbauseminar", date: "16.-18.10.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Shankari Susanne Hill" },
    { title: "Yoga Ferienwoche", date: "18.-23.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Erkan Batmaz" },
    { title: "Nordsee Special: Yoga und Klangthemenwoche", date: "18.-23.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Wolfgang Meisel, Jutta Kremer" },
    { title: "Time out statt Burn out", date: "18.-23.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Nicole Padmini Neumann" },
    { title: "Vijaya Dashami", date: "20.10.26", isWE: false, location: "Nordsee", maxTN: 2, currentTN: 0, leader: "" },
    { title: "Tag der offenen Tür - Haus Yoga Vidya Nordsee", date: "24.10.26", isWE: true, location: "Nordsee", maxTN: 20, currentTN: 4, leader: "Karuna M. Wapke" },
    { title: "Hatha Yoga Prävention Ferienwoche", date: "25.-30.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Pranava Heinz Pauly" },
    { title: "Yin Yoga meets Vipassana", date: "25.-30.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Christian Bliedtner" },
    { title: "Yoga und Meditation Einführung", date: "30.10.-1.11.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "" },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getEndDate(dateStr: string): Date | null {
    try {
      const cleanStr = dateStr.replace(/WE/g, '').replace(/–/g, '-').trim();
      const rangeParts = cleanStr.split('-');
      const endPartStr = rangeParts[rangeParts.length - 1].trim();
      const dateComponents = endPartStr.split('.').map(c => c.trim()).filter(Boolean);
      
      if (dateComponents.length < 3) return null;
      
      const day = parseInt(dateComponents[0], 10);
      const month = parseInt(dateComponents[1], 10) - 1; // JS Month is 0-indexed
      let year = parseInt(dateComponents[2], 10);
      
      if (year < 100) year += 2000;
      
      return new Date(year, month, day, 23, 59, 59); // End of the day
    } catch (e) {
      return null;
    }
  }

  function isUpcoming(dateStr: string): boolean {
    const endDate = getEndDate(dateStr);
    if (!endDate) return true;
    return endDate >= today;
  }

  const upcomingSeminars = seminars.filter(s => isUpcoming(s.date));

  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'open' | 'assigned'>('all');

  let filteredSeminars = $derived(
    upcomingSeminars.filter(s => {
      // Filter by open/assigned status
      if (filterStatus === 'open' && s.leader !== '') return false;
      if (filterStatus === 'assigned' && s.leader === '') return false;

      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(query);
        const matchesLeader = s.leader.toLowerCase().includes(query);
        const matchesDate = s.date.includes(query);
        return matchesTitle || matchesLeader || matchesDate;
      }

      return true;
    })
  );

  let openCount = $derived(upcomingSeminars.filter(s => s.leader === '').length);
  let assignedCount = $derived(upcomingSeminars.filter(s => s.leader !== '').length);

  let activeSeminarForTodo = $state<Seminar | null>(null);
  let newTodoText = $state('');
  let newTodoCategory = $state<'check' | 'prepare' | 'communicate' | 'materials'>('check');
  let newTodoReminderTime = $state('');

  function handleAddTodo() {
    if (!newTodoText.trim() || !activeSeminarForTodo) return;
    todoManager.addTodo(
      activeSeminarForTodo.title,
      activeSeminarForTodo.date,
      newTodoText.trim(),
      newTodoCategory,
      newTodoReminderTime ? newTodoReminderTime : null
    );
    newTodoText = '';
    newTodoReminderTime = '';
  }

  function getSeminarTodos(title: string, date: string) {
    return todoManager.todos.filter(t => t.seminarTitle === title && t.seminarDate === date);
  }

  function getCategoryLabel(cat: string) {
    switch (cat) {
      case 'check': return '🔍 Prüfen';
      case 'prepare': return '🛠️ Vorbereiten';
      case 'communicate': return '💬 Kommunizieren';
      case 'materials': return '📦 Material';
      default: return '📋 Aufgabe';
    }
  }
  let isOpenDayExpanded = $state(false);
  let openDayProgram = $state<OpenDayProgramItem[]>(defaultOpenDayProgram);

  let showAddProgramForm = $state(false);
  let newProgTime = $state('');
  let newProgTitle = $state('');
  let newProgInstructor = $state('');
  let newProgRoom = $state('');
  let newProgDesc = $state('');

  onMount(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('open_day_program_2026');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            openDayProgram = parsed;
          }
        } catch (e) {
          console.error('Failed to parse open day program', e);
        }
      }
    }
  });

  function saveProgram(items: OpenDayProgramItem[]) {
    openDayProgram = items;
    if (typeof window !== 'undefined') {
      localStorage.setItem('open_day_program_2026', JSON.stringify(items));
    }
  }

  function handleAddProgramItem() {
    if (!newProgTitle.trim()) return;
    const newItem: OpenDayProgramItem = {
      id: Date.now().toString(),
      time: newProgTime.trim() || 'Ganztägig',
      title: newProgTitle.trim(),
      instructor: newProgInstructor.trim() || 'Offen / Team',
      room: newProgRoom.trim() || 'Haus Nordsee',
      description: newProgDesc.trim() || undefined
    };
    saveProgram([...openDayProgram, newItem]);
    newProgTime = '';
    newProgTitle = '';
    newProgInstructor = '';
    newProgRoom = '';
    newProgDesc = '';
    showAddProgramForm = false;
  }

  function handleDeleteProgramItem(id: string) {
    saveProgram(openDayProgram.filter(item => item.id !== id));
  }
</script>

<!-- Hero Section with Event Highlight -->
<div class="hero-card animate-fade-in" style="background-image: linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.65)), url('/nordsee_yoga_beach.jpg');">
  <div class="hero-content">
    <div class="hero-top-flower">🪷</div>
    <h1>Kommende & offene Seminare</h1>
    <p class="hero-subtitle">Übersicht aller Seminare & Veranstaltungen im Haus Yoga Vidya Nordsee</p>
  </div>

  <!-- Tag der offenen Tür Highlight-Hinweis (24.10.2026) -->
  {#if !isOpenDayExpanded}
    <!-- Zuklappter Modus: Einfach und kompakt -->
    <div 
      class="open-day-collapsed-pill"
      onclick={() => isOpenDayExpanded = true}
      role="button"
      tabindex="0"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') isOpenDayExpanded = true; }}
    >
      <div class="collapsed-left">
        <span class="badge-pulse-dot"></span>
        <span class="collapsed-icon">🚪✨</span>
        <span class="collapsed-title">Tag der offenen Tür, 24. Oktober</span>
      </div>
      <button 
        type="button" 
        class="btn-expand-pill" 
        onclick={(e) => { e.stopPropagation(); isOpenDayExpanded = true; }}
      >
        <span>Programm anzeigen</span>
        <span class="expand-arrow">▼</span>
      </button>
    </div>
  {:else}
    <!-- Aufgeklappter Modus: Detailliertes Programm & Bearbeitung -->
    <div class="open-day-banner expanded animate-fade-in">
      <div class="open-day-banner-top">
        <div class="open-day-badge">
          <span class="badge-pulse-dot"></span>
          <span>🎉 Tag der offenen Tür — Programm</span>
        </div>
        <button 
          type="button" 
          class="btn-collapse" 
          onclick={() => isOpenDayExpanded = false}
          title="Zuklappen"
        >
          ▲ Zuklappen
        </button>
      </div>

      <div class="open-day-header">
        <span class="open-day-icon">🚪✨</span>
        <div class="open-day-title-group">
          <h2 class="open-day-title">Tag der offenen Tür</h2>
          <div class="open-day-date">
            <span class="date-icon">📅</span>
            <strong>24. Oktober 2026</strong>
            <span class="day-of-week">(Samstag)</span>
            <span class="location-tag">📍 Haus Yoga Vidya Nordsee</span>
          </div>
        </div>
      </div>

      <p class="open-day-desc">
        Herzliche Einladung! Entdecke unser vielfältiges Programm mit Schnupperstunden, Lachyoga mit Antje, Führungen, Vorträgen & Satsang.
      </p>

      <!-- Program Points Section -->
      <div class="open-day-program-section">
        <div class="program-section-header">
          <span class="program-title-label">📋 Tagesprogramm ({openDayProgram.length} Punkte):</span>
          <button 
            type="button" 
            class="btn-add-program-toggle" 
            onclick={() => showAddProgramForm = !showAddProgramForm}
          >
            {showAddProgramForm ? '✕ Abbrechen' : '＋ Programmpunkt hinzufügen'}
          </button>
        </div>

        {#if showAddProgramForm}
          <div class="add-program-inline-form animate-fade-in">
            <h4>Neuen Programmpunkt anlegen</h4>
            <div class="form-row-grid">
              <div class="form-subgroup">
                <label for="prog-time">Uhrzeit</label>
                <input id="prog-time" type="text" placeholder="z. B. 14:00 - 15:00" bind:value={newProgTime} />
              </div>
              <div class="form-subgroup">
                <label for="prog-title">Titel / Angebot *</label>
                <input id="prog-title" type="text" placeholder="z. B. Lachyoga-Stunde" bind:value={newProgTitle} />
              </div>
            </div>
            <div class="form-row-grid">
              <div class="form-subgroup">
                <label for="prog-inst">Unterrichtende / Leitung</label>
                <input id="prog-inst" type="text" placeholder="z. B. Antje" bind:value={newProgInstructor} />
              </div>
              <div class="form-subgroup">
                <label for="prog-room">Raum / Ort</label>
                <input id="prog-room" type="text" placeholder="z. B. Shanti Raum" bind:value={newProgRoom} />
              </div>
            </div>
            <div class="form-subgroup">
              <label for="prog-desc">Beschreibung (optional)</label>
              <input id="prog-desc" type="text" placeholder="Kurze Beschreibung des Programmpunkts..." bind:value={newProgDesc} />
            </div>
            <button type="button" class="btn-save-program" onclick={handleAddProgramItem}>
              ✓ Programmpunkt speichern
            </button>
          </div>
        {/if}

        <div class="program-items-list">
          {#if openDayProgram.length === 0}
            <div class="empty-program-msg">Noch keine Programmpunkte eingetragen. Klicke auf „+ Programmpunkt hinzufügen“.</div>
          {:else}
            {#each openDayProgram as item (item.id)}
              <div 
                class="program-item-card" 
                class:highlight-item={item.instructor.toLowerCase().includes('antje') || item.title.toLowerCase().includes('lachyoga')}
              >
                <div class="prog-time-badge">
                  <span class="prog-clock-icon">⏰</span>
                  <strong>{item.time}</strong>
                </div>
                <div class="prog-details">
                  <div class="prog-title-row">
                    <span class="prog-name">{item.title}</span>
                    {#if item.instructor.toLowerCase().includes('antje') || item.title.toLowerCase().includes('lachyoga')}
                      <span class="lachyoga-badge">😄 Lachyoga Highlight mit Antje</span>
                    {/if}
                  </div>
                  <div class="prog-meta-row">
                    <span class="prog-leader">🧘 {item.instructor}</span>
                    {#if item.room}
                      <span class="prog-room">📍 {item.room}</span>
                    {/if}
                  </div>
                  {#if item.description}
                    <p class="prog-desc-text">{item.description}</p>
                  {/if}
                </div>
                <button 
                  type="button" 
                  class="btn-delete-prog" 
                  onclick={() => handleDeleteProgramItem(item.id)} 
                  title="Programmpunkt löschen"
                  aria-label="Löschen"
                >
                  🗑️
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <div class="open-day-footer">
        <span class="open-day-leader">Gesamtleitung: <strong>Karuna M. Wapke</strong></span>
        <div class="open-day-actions">
          <button 
            type="button" 
            class="open-day-btn" 
            onclick={() => {
              searchQuery = 'Tag der offenen Tür';
              const el = document.getElementById('seminars-list-anchor');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Im Seminarplan anzeigen"
          >
            Im Plan anzeigen ➔
          </button>
          <button 
            type="button" 
            class="btn-close-subtle" 
            onclick={() => isOpenDayExpanded = false}
          >
            Zuklappen ▲
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<div id="seminars-list-anchor"></div>

<div class="seminars-container animate-fade-in">
  <!-- Interactive Filters Toolbar -->
  <div class="filters-toolbar glass-card">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input 
        type="text" 
        placeholder="Seminarname, Seminarleiter oder Datum suchen..." 
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button class="clear-search-btn" onclick={() => searchQuery = ''}>✕</button>
      {/if}
    </div>

    <div class="filter-chips">
      <button 
        class="chip-btn" 
        class:active={filterStatus === 'all'} 
        onclick={() => filterStatus = 'all'}
      >
        <span>🌟 Alle</span>
        <span class="chip-count">{upcomingSeminars.length}</span>
      </button>
      <button 
        class="chip-btn chip-open" 
        class:active={filterStatus === 'open'} 
        onclick={() => filterStatus = 'open'}
      >
        <span>⚠️ Offen (nicht belegt)</span>
        <span class="chip-count count-open">{openCount}</span>
      </button>
      <button 
        class="chip-btn chip-assigned" 
        class:active={filterStatus === 'assigned'} 
        onclick={() => filterStatus = 'assigned'}
      >
        <span>✓ Belegt</span>
        <span class="chip-count count-assigned">{assignedCount}</span>
      </button>
    </div>
  </div>

  <!-- Seminars Grid / List -->
  <div class="seminars-list">
    {#if filteredSeminars.length === 0}
      <div class="no-results glass-card">
        <span class="no-results-icon">🪷</span>
        <h3>Keine Seminare gefunden</h3>
        <p>Bitte passe deine Suchkriterien oder Filter an.</p>
      </div>
    {:else}
      {#each filteredSeminars as seminar}
        {@const todos = getSeminarTodos(seminar.title, seminar.date)}
        {@const openTodos = todos.filter(t => t.status === 'pending')}
        <div 
          class="seminar-card glass-card" 
          class:unassigned={seminar.leader === ''}
          class:special-event={seminar.title.includes('Tag der offenen Tür')}
        >
          <!-- Left Column: Date & Location Info -->
          <div class="seminar-date-sec">
            <span class="calendar-icon">📅</span>
            <div class="date-text-wrapper">
              <strong class="date-range">{seminar.date}</strong>
              <span class="location-badge">📍 {seminar.location}</span>
            </div>
            {#if seminar.isWE}
              <span class="weekend-tag">WE</span>
            {/if}
          </div>

          <!-- Middle Column: Seminar Title & Leader Info -->
          <div class="seminar-info-sec">
            {#if seminar.title.includes('Tag der offenen Tür')}
              <div class="special-event-pill">
                <span>⭐ Besonderes Event</span>
              </div>
            {/if}
            <h3 class="seminar-title">{seminar.title}</h3>
            
            {#if seminar.leader !== ''}
              <div class="leader-row">
                <span class="leader-icon">🧘</span>
                <span class="leader-label">Seminarleiter:</span>
                <strong class="leader-names">{seminar.leader}</strong>
              </div>
            {:else}
              <div class="leader-row open-leader">
                <span class="leader-icon">⚠️</span>
                <strong class="open-label">Offen / Nicht belegt</strong>
              </div>
            {/if}

            <!-- To-Dos Section -->
            <div class="todo-badge-wrapper">
              <button type="button" class="btn-card-todo" onclick={() => activeSeminarForTodo = seminar}>
                📋 To-Dos
                {#if todos.length > 0}
                  <span class="badge-count" class:has-pending={openTodos.length > 0}>
                    {openTodos.length} offene ({todos.length} gesamt)
                  </span>
                {:else}
                  <span class="badge-count empty">0 Aufgaben</span>
                {/if}
              </button>
            </div>
          </div>

          <!-- Right Column: Registration / Capacity Info -->
          <div class="seminar-stats-sec">
            <div class="stats-header">
              <span class="stats-icon">👥</span>
              <span>Anmeldungen:</span>
            </div>
            <div class="participants-count">
              {#if seminar.maxTN > 0}
                <strong>{seminar.currentTN}</strong> <span class="cap-slash">/</span> <span class="cap-total">{seminar.maxTN}</span>
              {:else}
                <strong>{seminar.currentTN}</strong> <span class="cap-unlimited">(unbegrenzt)</span>
              {/if}
            </div>

            {#if seminar.maxTN > 0}
              {@const pct = (seminar.currentTN / seminar.maxTN) * 100}
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: {Math.min(pct, 100)}%;"></div>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Footer Info -->
  <div class="seminar-list-footer">
    <p class="footer-timestamp">Stand: 04.07.2026 13:19:47 — Seite 1 & 2 von 8</p>
  </div>
</div>

{#if activeSeminarForTodo}
  {@const currentTodos = getSeminarTodos(activeSeminarForTodo.title, activeSeminarForTodo.date)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={() => activeSeminarForTodo = null}>
    <div class="modal-content glass-card todo-modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>📋 To-Dos & Erinnerungen</h2>
        <button class="close-btn" onclick={() => activeSeminarForTodo = null}>✕</button>
      </div>

      <div class="modal-body">
        <div class="seminar-details-header">
          <h3>{activeSeminarForTodo.title}</h3>
          <p>📅 {activeSeminarForTodo.date} | 📍 {activeSeminarForTodo.location}</p>
        </div>

        <div class="todo-section">
          <h4>Aufgabenliste</h4>
          
          {#if currentTodos.length === 0}
            <p class="no-todos-msg">Bisher keine To-Dos für dieses Seminar angelegt.</p>
          {:else}
            <div class="todo-items-list">
              {#each currentTodos as todo}
                <div class="todo-item" class:completed={todo.status === 'completed'}>
                  <input 
                    type="checkbox" 
                    checked={todo.status === 'completed'} 
                    onchange={() => todoManager.toggleTodo(todo.id)} 
                  />
                  <div class="todo-item-info">
                    <span class="category-badge {todo.category}">
                      {getCategoryLabel(todo.category)}
                    </span>
                    <span class="todo-item-text">{todo.text}</span>
                    {#if todo.reminderTime}
                      <span class="todo-item-time">
                        ⏰ {new Date(todo.reminderTime).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    {/if}
                  </div>
                  <button type="button" class="delete-todo-btn" onclick={() => todoManager.deleteTodo(todo.id)}>🗑️</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="divider"></div>

        <div class="add-todo-section">
          <h4>Neue Aufgabe hinzufügen</h4>
          <div class="form-group">
            <label class="form-label" for="new-todo-text">Aufgabe</label>
            <input 
              id="new-todo-text" 
              type="text" 
              class="form-input" 
              placeholder="z. B. Skripte kopieren, Mail an SL senden..." 
              bind:value={newTodoText} 
            />
          </div>

          <div class="grid-cols-2" style="gap: 1rem; display: grid; grid-template-columns: 1fr 1fr;">
            <div class="form-group">
              <label class="form-label" for="new-todo-cat">Kategorie</label>
              <select id="new-todo-cat" class="form-select" bind:value={newTodoCategory}>
                <option value="check">🔍 Prüfen</option>
                <option value="prepare">🛠️ Vorbereiten</option>
                <option value="communicate">💬 Kommunizieren</option>
                <option value="materials">📦 Material besorgen</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="new-todo-time">Erinnerung am</label>
              <input 
                id="new-todo-time" 
                type="datetime-local" 
                class="form-input" 
                bind:value={newTodoReminderTime} 
              />
            </div>
          </div>

          <button type="button" class="btn btn-primary w-full" style="margin-top: 1rem; width: 100%;" onclick={handleAddTodo}>
            ＋ Aufgabe hinzufügen
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Hero Card Banner */
  .hero-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-size: cover;
    background-position: center 33%; /* Adjusted to show faces and bodies in optimal balance */
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 2.25rem 2.5rem;
    box-shadow: var(--shadow-main);
    overflow: hidden;
    position: relative;
    min-height: 220px;
    gap: 2rem;
  }

  .hero-content {
    max-width: 52%;
    z-index: 10;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(45, 50, 39, 0.4);
  }

  .hero-top-flower {
    font-size: 1.8rem;
    margin-bottom: 0.25rem;
  }

  .hero-content h1 {
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.25;
    margin: 0;
  }

  .hero-subtitle {
    font-size: 0.95rem;
    color: #fff9e6;
    margin-top: 0.5rem;
    font-weight: 500;
    opacity: 0.95;
    line-height: 1.4;
  }

  /* Collapsed Mode: Clean Minimal Pill */
  .open-day-collapsed-pill {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.25rem;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 2px solid #ffcc00;
    border-radius: 999px;
    padding: 0.65rem 1.25rem;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25), 0 0 20px rgba(255, 204, 0, 0.3);
    transition: var(--transition-smooth);
    z-index: 10;
  }

  .open-day-collapsed-pill:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3), 0 0 25px rgba(255, 204, 0, 0.5);
    border-color: #ffd54f;
    background: #ffffff;
  }

  .collapsed-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .collapsed-icon {
    font-size: 1.25rem;
    line-height: 1;
  }

  .collapsed-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 800;
    color: #960040;
    letter-spacing: 0.01em;
  }

  .btn-expand-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: #960040;
    color: #ffffff;
    border: none;
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition-smooth);
    box-shadow: 0 2px 6px rgba(150, 0, 64, 0.25);
  }

  .btn-expand-pill:hover {
    background: #7d0034;
    transform: scale(1.03);
  }

  .expand-arrow {
    font-size: 0.7rem;
    transition: transform 0.2s ease;
  }

  /* Tag der offenen Tür Highlight Banner (Expanded) */
  .open-day-banner.expanded {
    background: rgba(255, 255, 255, 0.97);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 2px solid #ffcc00;
    border-radius: 18px;
    padding: 1.4rem 1.6rem;
    width: 100%;
    max-width: 580px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 204, 0, 0.4);
    color: var(--text-primary);
    position: relative;
    z-index: 15;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 520px;
    overflow-y: auto;
  }

  .open-day-banner.expanded::-webkit-scrollbar {
    width: 6px;
  }
  .open-day-banner.expanded::-webkit-scrollbar-thumb {
    background: #ffe082;
    border-radius: 4px;
  }

  .open-day-banner-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .btn-collapse {
    background: rgba(150, 0, 64, 0.08);
    border: 1px solid rgba(150, 0, 64, 0.2);
    color: #960040;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 8px;
    padding: 0.25rem 0.6rem;
    cursor: pointer;
    transition: var(--transition-smooth);
    font-family: inherit;
  }

  .btn-collapse:hover {
    background: #960040;
    color: #ffffff;
  }

  .open-day-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(135deg, #960040, #c41c5a);
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    box-shadow: 0 2px 6px rgba(150, 0, 64, 0.25);
    align-self: flex-start;
  }

  .badge-pulse-dot {
    width: 6px;
    height: 6px;
    background-color: #ffd54f;
    border-radius: 50%;
    animation: pulse-dot 1.5s infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.6); opacity: 0.5; }
  }

  .open-day-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.15rem;
  }

  .open-day-icon {
    font-size: 2rem;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  }

  .open-day-title-group {
    display: flex;
    flex-direction: column;
  }

  .open-day-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    font-weight: 800;
    color: #960040;
    margin: 0;
    line-height: 1.2;
  }

  .open-day-date {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    font-size: 0.88rem;
    color: #2a1b1b;
    margin-top: 0.15rem;
  }

  .open-day-date strong {
    color: #960040;
    font-weight: 800;
  }

  .day-of-week {
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 0.8rem;
  }

  .location-tag {
    background: #fff5cc;
    color: #960040;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    border: 1px solid #ffe082;
  }

  .open-day-desc {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.35;
    margin: 0.15rem 0 0.35rem 0;
  }

  /* Program Section */
  .open-day-program-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-top: 0.15rem;
  }

  .program-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px dashed rgba(150, 0, 64, 0.2);
    padding-bottom: 0.4rem;
  }

  .program-title-label {
    font-size: 0.85rem;
    font-weight: 800;
    color: #2a1b1b;
  }

  .btn-add-program-toggle {
    background: #fff8e1;
    border: 1px solid #ffe082;
    color: #960040;
    font-size: 0.74rem;
    font-weight: 700;
    border-radius: 6px;
    padding: 0.2rem 0.55rem;
    cursor: pointer;
    font-family: inherit;
    transition: var(--transition-smooth);
  }

  .btn-add-program-toggle:hover {
    background: #960040;
    color: #ffffff;
    border-color: #960040;
  }

  /* Inline Add Form */
  .add-program-inline-form {
    background: #fffcf5;
    border: 1px solid #ffe082;
    border-radius: 10px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .add-program-inline-form h4 {
    font-size: 0.82rem;
    margin: 0;
    color: #960040;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .form-row-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .form-subgroup {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .form-subgroup label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .form-subgroup input {
    background: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.35rem 0.55rem;
    font-size: 0.82rem;
    font-family: inherit;
    color: var(--text-primary);
  }

  .form-subgroup input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(150, 0, 64, 0.15);
  }

  .btn-save-program {
    background: var(--primary);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    align-self: flex-end;
    font-family: inherit;
    transition: var(--transition-smooth);
    margin-top: 0.25rem;
  }

  .btn-save-program:hover {
    background: var(--primary-hover);
  }

  /* Program Items List */
  .program-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    max-height: 220px;
    overflow-y: auto;
    padding-right: 0.2rem;
  }

  .program-items-list::-webkit-scrollbar {
    width: 4px;
  }
  .program-items-list::-webkit-scrollbar-thumb {
    background: rgba(150, 0, 64, 0.2);
    border-radius: 2px;
  }

  .empty-program-msg {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-style: italic;
    text-align: center;
    padding: 1rem 0;
  }

  .program-item-card {
    display: grid;
    grid-template-columns: 110px 1fr auto;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.55rem 0.75rem;
    background: #ffffff;
    border: 1px solid #ffe082;
    border-radius: 8px;
    transition: var(--transition-smooth);
  }

  .program-item-card:hover {
    background: #fffdf7;
    border-color: #ffd54f;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  .program-item-card.highlight-item {
    border-left: 4px solid #ff9800;
    background: linear-gradient(to right, #fff8e8, #ffffff);
    box-shadow: 0 2px 8px rgba(217, 119, 36, 0.08);
  }

  .prog-time-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.76rem;
    color: #960040;
    background: #fff5cc;
    padding: 0.2rem 0.4rem;
    border-radius: 6px;
    font-weight: 700;
    white-space: nowrap;
  }

  .prog-clock-icon {
    font-size: 0.75rem;
  }

  .prog-details {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .prog-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .prog-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .lachyoga-badge {
    background: #ffecb3;
    color: #b71c1c;
    font-size: 0.68rem;
    font-weight: 800;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    border: 1px solid #ffe082;
  }

  .prog-meta-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 0.74rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .prog-desc-text {
    font-size: 0.73rem;
    color: var(--text-secondary);
    margin: 0.15rem 0 0 0;
    line-height: 1.3;
  }

  .btn-delete-prog {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.78rem;
    opacity: 0.4;
    padding: 0.2rem;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .btn-delete-prog:hover {
    opacity: 1;
    transform: scale(1.15);
  }

  .open-day-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 0.6rem;
    border-top: 1px solid rgba(255, 224, 130, 0.6);
    flex-wrap: wrap;
  }

  .open-day-leader {
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  .open-day-leader strong {
    color: #960040;
  }

  .open-day-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .open-day-btn {
    background: #960040;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    padding: 0.35rem 0.75rem;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: var(--transition-smooth);
    box-shadow: 0 2px 6px rgba(150, 0, 64, 0.2);
  }

  .open-day-btn:hover {
    background: #7d0034;
    transform: translateX(2px);
    box-shadow: 0 4px 10px rgba(150, 0, 64, 0.3);
  }

  .btn-close-subtle {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.35rem 0.65rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: inherit;
    transition: var(--transition-smooth);
  }

  .btn-close-subtle:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }

  @media (max-width: 950px) {
    .hero-card {
      flex-direction: column;
      align-items: stretch;
      padding: 1.75rem 1.25rem;
      gap: 1.25rem;
    }
    .hero-content {
      max-width: 100%;
    }
    .open-day-banner.expanded {
      max-width: 100%;
    }
    .open-day-collapsed-pill {
      width: 100%;
    }
    .program-item-card {
      grid-template-columns: 1fr;
    }
  }

  /* Seminars Section Styling */
  .seminars-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 2rem;
  }

  /* Filters Toolbar */
  .filters-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
    background: rgba(255, 253, 248, 0.8);
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }

  @media (max-width: 900px) {
    .filters-toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 480px;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    font-size: 1rem;
    opacity: 0.6;
  }

  .search-input {
    width: 100%;
    padding: 0.65rem 1rem 0.65rem 2.5rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--text-primary);
    transition: var(--transition-smooth);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(150, 0, 64, 0.1);
  }

  .clear-search-btn {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    opacity: 0.5;
    padding: 0.2rem;
  }

  .clear-search-btn:hover {
    opacity: 0.9;
  }

  .filter-chips {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  .chip-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
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

  .chip-btn:hover {
    background: #fff9e6;
    color: var(--text-primary);
    border-color: #ffe082;
  }

  .chip-btn.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }

  .chip-count {
    font-size: 0.75rem;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    background: rgba(150, 0, 64, 0.08);
    color: var(--primary);
    font-weight: 700;
  }

  .chip-btn.active .chip-count {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  .chip-open .chip-count {
    background: rgba(217, 119, 36, 0.1);
    color: var(--accent);
  }

  .chip-open.active .chip-count {
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
  }

  /* Seminars List Grid */
  .seminars-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3.5rem 2rem;
    text-align: center;
    background: rgba(255, 253, 248, 0.8);
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

  /* Seminar Card */
  .seminar-card {
    display: grid;
    grid-template-columns: 220px 1fr 180px;
    align-items: center;
    gap: 2rem;
    padding: 1.25rem 1.75rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 10px rgba(150, 0, 64, 0.02);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
  }

  @media (max-width: 950px) {
    .seminar-card {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1.25rem;
    }
  }

  .seminar-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-main);
    border-color: #ffe082;
    background: #fffdfb;
  }

  /* Highlight Style for Unassigned/Open Seminars */
  .seminar-card.unassigned {
    border-left: 8px solid #ff9800; /* Thicker, high-contrast orange border */
    background: #fff7eb; /* Warmer, distinct background tint */
    box-shadow: 0 4px 12px rgba(217, 119, 36, 0.06);
  }

  .seminar-card.unassigned:hover {
    border-left-width: 8px;
    background: #ffeed6; /* Deeper hover highlight */
    border-color: #e65100;
    box-shadow: 0 6px 15px rgba(217, 119, 36, 0.12);
  }

  /* Highlight Style for Special Events (Tag der offenen Tür) */
  .seminar-card.special-event {
    border-left: 8px solid #ffcc00;
    background: linear-gradient(to right, #fffdf2, #ffffff);
    box-shadow: 0 4px 15px rgba(255, 204, 0, 0.12);
    border-color: #ffd54f;
  }

  .seminar-card.special-event:hover {
    border-left-width: 8px;
    background: linear-gradient(to right, #fff9e6, #fffdf8);
    border-color: #ffc107;
    box-shadow: 0 8px 20px rgba(255, 204, 0, 0.22);
  }

  .special-event-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: linear-gradient(135deg, #fff5cc, #ffecb3);
    border: 1px solid #ffe082;
    color: #960040;
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.15rem 0.55rem;
    border-radius: 6px;
    margin-bottom: 0.25rem;
    width: fit-content;
    box-shadow: 0 1px 3px rgba(150, 0, 64, 0.08);
  }

  /* Date & Location Section */
  .seminar-date-sec {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }

  .calendar-icon {
    font-size: 1.25rem;
    color: var(--primary);
  }

  .seminar-card.unassigned .calendar-icon {
    color: var(--accent);
  }

  .date-text-wrapper {
    display: flex;
    flex-direction: column;
    line-height: 1.35;
  }

  .date-range {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .location-badge {
    font-size: 0.78rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .weekend-tag {
    font-size: 0.72rem;
    font-weight: 800;
    background: var(--secondary);
    color: var(--text-primary);
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    text-transform: uppercase;
  }

  /* Seminar Info Section */
  .seminar-info-sec {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .seminar-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  .leader-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.88rem;
  }

  .leader-icon {
    font-size: 1rem;
    opacity: 0.8;
  }

  .leader-label {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .leader-names {
    color: var(--primary);
    font-weight: 600;
  }

  /* Open / Unassigned Style */
  .open-leader {
    background: #ffe5cc; /* High-contrast background */
    border: 1px solid #ff9800; /* Clear accent border */
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    align-self: flex-start;
    box-shadow: 0 2px 4px rgba(217, 119, 36, 0.05);
  }

  .open-label {
    color: #d35400; /* Darker burnt orange for perfect readability */
    font-weight: 800;
    font-size: 0.82rem;
    letter-spacing: 0.02em;
  }

  /* Stats Capacity Section */
  .seminar-stats-sec {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .stats-header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.78rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .stats-icon {
    font-size: 0.9rem;
  }

  .participants-count {
    font-size: 1rem;
    color: var(--text-primary);
  }

  .participants-count strong {
    font-size: 1.25rem;
    font-weight: 800;
  }

  .cap-slash {
    color: var(--border-color);
    margin: 0 0.1rem;
  }

  .cap-total {
    font-weight: 600;
    color: var(--text-secondary);
  }

  .cap-unlimited {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .progress-bar-bg {
    width: 100%;
    height: 6px;
    background: #efe9d7;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 0.2rem;
  }

  .progress-bar-fill {
    height: 100%;
    background: #a3c485; /* Soft sage green fill for registration levels */
    border-radius: 999px;
  }

  .seminar-card.unassigned .progress-bar-fill {
    background: var(--accent);
  }

  /* Seminar Footer styling */
  .seminar-list-footer {
    display: flex;
    justify-content: center;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    margin-top: 1rem;
  }

  .footer-timestamp {
    font-size: 0.78rem;
    color: var(--text-secondary);
    font-weight: 600;
    font-style: italic;
  }

  /* Seminar Card To-Do Badge Button */
  .todo-badge-wrapper {
    margin-top: 0.75rem;
  }

  .btn-card-todo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: #fdfbf7;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition-smooth);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }

  .btn-card-todo:hover {
    background: #fcf6e8;
    color: var(--text-primary);
    border-color: #ffe082;
    box-shadow: 0 2px 5px rgba(150, 0, 64, 0.05);
  }

  .badge-count {
    background: rgba(150, 0, 64, 0.06);
    color: var(--primary);
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .badge-count.has-pending {
    background: #ffeccf;
    color: #d35400;
  }

  .badge-count.empty {
    background: #f3efe5;
    color: var(--text-secondary);
    font-weight: 500;
    opacity: 0.7;
  }

  /* To-Do Modal styling */
  .todo-modal {
    max-width: 580px !important;
  }

  .seminar-details-header {
    background: rgba(150, 0, 64, 0.03);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .seminar-details-header h3 {
    font-family: 'Playfair Display', serif;
    color: var(--primary);
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
  }

  .seminar-details-header p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 600;
  }

  .todo-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .todo-section h4, .add-todo-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.95rem;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.25rem;
  }

  .no-todos-msg {
    margin: 0;
    color: var(--text-secondary);
    font-style: italic;
    font-size: 0.9rem;
    padding: 1.5rem 0;
    text-align: center;
  }

  .todo-items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .todo-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.85rem;
    background: #fdfdfb;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    transition: var(--transition-smooth);
  }

  .todo-item:hover {
    background: #fffefb;
    border-color: #ffe082;
  }

  .todo-item.completed {
    background: #fcfbf8;
    opacity: 0.6;
  }

  .todo-item.completed .todo-item-text {
    text-decoration: line-through;
    color: var(--text-secondary);
  }

  .todo-item-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .todo-item-text {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .todo-item-time {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
    background: rgba(0, 0, 0, 0.03);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }

  .delete-todo-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    opacity: 0.4;
    transition: opacity 0.2s ease, transform 0.2s ease;
    padding: 0.2rem;
  }

  .delete-todo-btn:hover {
    opacity: 1;
    transform: scale(1.1);
  }

  .add-todo-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .divider {
    height: 1px;
    background: var(--border-color);
    margin: 1.5rem 0;
  }
</style>
