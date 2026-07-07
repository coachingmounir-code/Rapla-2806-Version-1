<script lang="ts">
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
    { title: "Die 10-Wochenend-Weiterbildung für Yogalehrer", date: "29.11.24–11.10.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "" },
    { title: "Die 10-Wochenend-Weiterbildung für Yogalehrer", date: "10.10.25–9.5.27", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 0, leader: "" },
    { title: "Die 10-Wochenend-Weiterbildung für Yogalehrer", date: "5.12.25–10.10.27", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 0, leader: "" },
    { title: "Grundlagen der Psychologischen Yogatherapie", date: "28.6.–5.7.26", isWE: false, location: "Nordsee", maxTN: 16, currentTN: 6, leader: "Shivakami Bretz, Sarada Drautzburg" },
    { title: "Yoga und Meditation Einführung", date: "3.–5.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 8, leader: "" },
    { title: "Feldenkrais und Stimme", date: "3.–5.7.26", isWE: true, location: "Nordsee", maxTN: 8, currentTN: 4, leader: "Hagit Noam" },
    { title: "Die 5 Elemente im Yin Yoga und Tanz erfahren", date: "5.–10.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Abha Morkötter" },
    { title: "Hatha Yoga Prävention Ferienwoche", date: "5.–10.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 7, leader: "Narayani Kedenburg" },
    { title: "Ganzheitliche Stimmbildung mit Mantra-Tönen", date: "5.–10.7.26", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 9, leader: "Hagit Noam" },
    { title: "Chakra-Reise mit spirituellem Singen und Tönen", date: "10.–12.7.26", isWE: true, location: "Nordsee", maxTN: 8, currentTN: 2, leader: "Hagit Noam" },
    { title: "Harmonium Lernseminar", date: "10.–12.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Annette Pritschow" },
    { title: "Ich bin ich – Gesund in der eigenen Mitte leben", date: "10.–12.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Amyana Finkel" },
    { title: "Hormon Yoga für Frauen nach Dinah Rodrigues", date: "12.–17.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 10, leader: "Karuna M. Wapke" },
    { title: "Yoga für Kinder 7–12 Jahre", date: "12.–17.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "" },
    { title: "Mantra Ferienwoche mit Gruppe Mudita", date: "12.–17.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Gruppe Mudita" },
    { title: "Yoga, Natur und Wattwandern", date: "12.–17.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 8, leader: "Ananda Schaak" },
    { title: "Maha-Samadhi Swami Sivananda", date: "14.7.26", isWE: false, location: "Nordsee", maxTN: 2, currentTN: 0, leader: "" },
    { title: "Ausrichtung nach dem Spiralprinzip", date: "17.–19.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Jnanadev Wallaschkowski" },
    { title: "Yoga und Meditation Einführung", date: "17.–19.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "" },
    { title: "Yoga für Kinder 7–12 Jahre", date: "17.–19.7.26", isWE: true, location: "Nordsee", maxTN: 8, currentTN: 0, leader: "Padma Stolte" },
    { title: "Yogalehrer Vorbereitung", date: "17.–19.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "" },
    { title: "Yoga Ferienwoche", date: "19.–24.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 14, leader: "Mirabai Seifert" },
    { title: "Yoga für Kinder 7–12 Jahre", date: "19.–24.7.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 2, leader: "Padma Stolte" },
    { title: "Kitesurfen meets Inner Flow Yoga", date: "19.–24.7.26", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 1, leader: "Satyananda Wahl, Aziza Lena Alemi" },
    { title: "Themenwoche mit Swami Yatidharmananda – Geschichten, Yoga Nidra, Mantras", date: "19.–24.7.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 2, leader: "Swami Yatidharmananda" },
    { title: "Yoga, Wandern und Fahrradfahren", date: "19.–24.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 7, leader: "Ananda Schaak" },
    { title: "Gesang und Stimmbildung", date: "24.–26.7.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 7, leader: "Thomas Hundsalz" },
    { title: "Yajna Woche – 108 Stunden vedische Feuerzeremonie", date: "24.–31.7.26", isWE: false, location: "Nordsee", maxTN: 5, currentTN: 1, leader: "Satyananda Wahl" },
    { title: "Hilfe! Alltag! Yoga für Eltern mit ihren Kindern", date: "24.–26.7.26", isWE: true, location: "Nordsee", maxTN: 15, currentTN: 4, leader: "Radhika Siegenbruk, Maik Piorek" },
    { title: "Yoga – Tanz & Meditation", date: "24.–26.7.26", isWE: true, location: "Nordsee", maxTN: 8, currentTN: 8, leader: "Maha Siddhi Wittop, Sambhu Groteheide" },
    { title: "Yoga Erlebniswoche", date: "26.–31.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 9, leader: "Radhika Siegenbruk, Maik Piorek" },
    { title: "Stimm- und Sprechtraining Kursleiterausbildung", date: "26.–31.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Thomas Hundsalz" },
    { title: "Yoga für die Familie", date: "26.–31.7.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 8, leader: "Cornelia Surya Haag" },
    { title: "Guru Purnima", date: "29.7.26", isWE: false, location: "Nordsee", maxTN: 0, currentTN: 0, leader: "" },
    { title: "Yoga und Meditation Einführung", date: "31.7.–2.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "" },
    { title: "Yoga für Kinder 7–12 Jahre", date: "31.7.–2.8.26", isWE: true, location: "Nordsee", maxTN: 8, currentTN: 2, leader: "" },
    { title: "Mantras und Gitarre", date: "31.7.–2.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Thomas Hundsalz" },
    { title: "Stand Up Paddling meets Yoga - Einsteiger", date: "31.7.-2.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 12, leader: "Radhika Siegenbruk, Maik Piorek" },
    { title: "Ayuryoga - mehr Balance und Zufriedenheit im Alltag", date: "2.-7.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Cornelia Surya Haag" },
    { title: "Yoga Ferienwoche", date: "2.-7.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 9, leader: "Carina van Anken" },
    { title: "Geschmeidige Muskeln - gesunde Beweglichkeit", date: "2.-7.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "Amyana Finkel" },
    { title: "Yoga für Kinder 7-12 Jahre", date: "2.-7.8.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 6, leader: "Anika Roth" },
    { title: "Stand Up Paddling meets Yoga", date: "2.-7.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Radhika Siegenbruk, Maik Piorek" },
    { title: "Yoga für Kinder 7-12 Jahre", date: "7.-9.8.26", isWE: true, location: "Nordsee", maxTN: 5, currentTN: 3, leader: "Cornelia Surya Haag" },
    { title: "Vata Dosha stabilisieren", date: "7.-9.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Aziza Lena Alemi" },
    { title: "Yoga und Chakren", date: "7.-9.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Carina van Anken" },
    { title: "Yoga und Ukulele spielen lernen", date: "7.-9.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 7, leader: "Kamala Lubina" },
    { title: "Yoga Ferienwoche", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 19, leader: "Beate Menkarski" },
    { title: "Insel-Yoga", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 9, leader: "Ananda Schaak" },
    { title: "Yoga für Kinder 7-12 Jahre", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 2, leader: "Suniti Jacob" },
    { title: "Yoga für den Rücken", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Kamala Lubina" },
    { title: "Yin Yoga", date: "9.-14.8.26", isWE: false, location: "Nordsee", maxTN: 15, currentTN: 5, leader: "Cornelia Surya Haag" },
    { title: "Die Satsang-Trommeln der Kirtan-Musik", date: "14.-16.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 8, leader: "Bernardo Juni" },
    { title: "Vinyasa Power Yoga - Meditation in Bewegung", date: "14.-16.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 6, leader: "Kamala Lubina" },
    { title: "Weg mit der Brille - Yoga für die Augen", date: "14.-16.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Susan Holze" },
    { title: "Yoga Ferienwoche", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Ananda Schaak" },
    { title: "Shakti Yoga - Erwecke die Kraft deiner Weiblichkeit", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Susan Holze" },
    { title: "Swings, Vibrations, Rotations", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Monika Adele Camara" },
    { title: "Yogaferien mit Surfen", date: "16.-21.8.26", isWE: false, location: "Nordsee", maxTN: 8, currentTN: 4, leader: "Abha Morkötter" },
    { title: "Yoga und Meditation Einführung", date: "21.-23.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Jnanadev David Ianni" },
    { title: "Hawaiianischer Tanz und Yoga am Meer", date: "21.-23.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Monika Adele Camara" },
    { title: "Yogatherapie für die Atemwege an der Nordsee", date: "21.-23.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 1, leader: "Susan Holze" },
    { title: "Yoga Ferienwoche", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Jnanadev David Ianni" },
    { title: "Yoga rund um die Geburt - Yogalehrer Weiterbildung", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Susan Holze" },
    { title: "Schamanisches Kundalini Retreat", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 15, leader: "Satyadevi Bretz, Yogita Sari" },
    { title: "Yoga, Wandern und Fahrradfahren", date: "23.-28.8.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Ananda Schaak" },
    { title: "Yoga und Meditation Einführung", date: "28.-30.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 4, leader: "" },
    { title: "Meditation und Qi Gong", date: "28.-30.8.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 3, leader: "Michael Büchel" },
    { title: "Yoga Ferienwoche - Yin Yoga", date: "30.8.-4.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Beate Menkarski" },
    { title: "Themenwoche: Indische Rituale und Rezitationen mit Swami Nivedanananda", date: "30.8.-4.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Swami Nivedanananda" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 1", date: "30.8.-4.9.26", isWE: false, location: "Nordsee", maxTN: 5, currentTN: 2, leader: "Karuna M. Wapke" },
    { title: "Yogalehrer Ausbildung Intensivkurs", date: "30.8.-27.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 5, leader: "Karuna M. Wapke" },
    { title: "Yogalehrer Ausbildung Intensivkurs Woche 1+2", date: "30.8.-11.9.26", isWE: false, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "Karuna M. Wapke" },
    { title: "Yoga und Meditation Einführung", date: "4.-6.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 2, leader: "" },
    { title: "Erleben mit dem Bauchraum", date: "4.-6.9.26", isWE: true, location: "Nordsee", maxTN: 10, currentTN: 0, leader: "Erkan Batmaz" },
    { title: "Krishna Jayanti", date: "4.9.26", isWE: false, location: "Nordsee", maxTN: 2, currentTN: 0, leader: "" }
  ];

  let searchQuery = $state('');
  let filterStatus = $state<'all' | 'open' | 'assigned'>('all');

  let filteredSeminars = $derived(
    seminars.filter(s => {
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

  let openCount = $derived(seminars.filter(s => s.leader === '').length);
  let assignedCount = $derived(seminars.filter(s => s.leader !== '').length);
</script>

<!-- Hero Section: "Yoga Orga Software" with mountains/river landscape background -->
<div class="hero-card animate-fade-in" style="background-image: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/nordsee_yoga_beach.jpg');">
  <div class="hero-content">
    <div class="hero-top-flower">🪷</div>
    <h1>Kommende & offene Seminare</h1>
  </div>
</div>

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
        <span class="chip-count">{seminars.length}</span>
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
        <div class="seminar-card glass-card" class:unassigned={seminar.leader === ''}>
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
    padding: 2.5rem;
    box-shadow: var(--shadow-main);
    overflow: hidden;
    position: relative;
    min-height: 220px;
  }

  .hero-content {
    max-width: 60%;
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
</style>
