<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    adminTodoStore,
    CATEGORY_CONFIG,
    PRIORITY_CONFIG,
    type AdminTodoItem,
    type AdminTodoCategory,
    type AdminTodoPriority
  } from '$lib/adminTodoStore.svelte';

  let userRole = $state<string | null>(null);
  let isAuthorized = $state(false);

  // Filter & Search states
  let searchQuery = $state('');
  let selectedCategory = $state<AdminTodoCategory | 'all'>('all');
  let selectedPriority = $state<AdminTodoPriority | 'all'>('all');
  let showCompleted = $state(true);
  let viewMode = $state<'day' | 'grouped' | 'all'>('day');

  // Selected date for day-by-day view (defaults to today's date format YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let selectedDate = $state<string>(getTodayStr());

  // Quick Add states
  let quickTitle = $state('');
  let quickCategory = $state<AdminTodoCategory>('orga');
  let quickPriority = $state<AdminTodoPriority>('normal');
  let quickAssignee = $state('');

  // Modal for full Create / Edit
  let isModalOpen = $state(false);
  let editingTodoId = $state<string | null>(null);
  let modalTitle = $state('');
  let modalNotes = $state('');
  let modalCategory = $state<AdminTodoCategory>('seminare');
  let modalPriority = $state<AdminTodoPriority>('normal');
  let modalDueDate = $state('');
  let modalDueTime = $state('');
  let modalAssignee = $state('');
  let modalContactEmail = $state('');
  let modalLinkUrl = $state('');
  let modalLinkPassword = $state('');
  let modalRecurringRule = $state('');
  let modalSubtasks = $state<{ id: string; text: string; completed: boolean }[]>([]);
  let modalNewSubtaskText = $state('');
  let modalTags = $state('');

  // Toast / notification
  let toastMessage = $state<string | null>(null);
  let toastTimer: any = null;

  function showToast(msg: string) {
    toastMessage = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMessage = null;
    }, 3000);
  }

  onMount(() => {
    const role = localStorage.getItem('rapla_user_role');
    userRole = role;
    if (role !== 'admin') {
      goto('/');
      return;
    }
    isAuthorized = true;
  });

  // Date Navigation Helpers
  function shiftDate(days: number) {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) {
      selectedDate = getTodayStr();
      return;
    }
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    selectedDate = `${year}-${month}-${day}`;
  }

  function setDateToToday() {
    selectedDate = getTodayStr();
  }

  function formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Ohne Datum';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getRelativeDateLabel(dateStr?: string): { text: string; isOverdue: boolean; isToday: boolean } {
    if (!dateStr) return { text: 'Keine Frist', isOverdue: false, isToday: false };
    const today = getTodayStr();
    if (dateStr === today) return { text: 'Heute', isOverdue: false, isToday: true };
    if (dateStr < today) return { text: 'Überfällig (Exekution)', isOverdue: true, isToday: false };
    
    const [y, m, d] = dateStr.split('-');
    const target = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const now = new Date();
    const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 1) return { text: 'Morgen', isOverdue: false, isToday: false };
    if (diffDays <= 7) return { text: `In ${diffDays} Tagen`, isOverdue: false, isToday: false };
    return { text: formatDisplayDate(dateStr), isOverdue: false, isToday: false };
  }

  // Filtering
  let baseFilteredTodos = $derived(
    adminTodoStore.todos.filter(todo => {
      // Completed filter
      if (!showCompleted && todo.completed) return false;

      // Category filter
      if (selectedCategory !== 'all' && todo.category !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== 'all' && todo.priority !== selectedPriority) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(q);
        const matchesNotes = todo.notes ? todo.notes.toLowerCase().includes(q) : false;
        const matchesAssignee = todo.assignee ? todo.assignee.toLowerCase().includes(q) : false;
        const matchesEmail = todo.contactEmail ? todo.contactEmail.toLowerCase().includes(q) : false;
        const matchesSubtasks = todo.subtasks.some(s => s.text.toLowerCase().includes(q));
        const matchesTags = todo.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesNotes && !matchesAssignee && !matchesEmail && !matchesSubtasks && !matchesTags) {
          return false;
        }
      }

      return true;
    })
  );

  // Day View specific filtered list
  let dayViewTodos = $derived(
    baseFilteredTodos.filter(todo => {
      if (todo.dueDate === selectedDate) return true;
      // Also show recurring tasks or tasks without date if today is selected
      if (selectedDate === getTodayStr() && !todo.dueDate) return true;
      return false;
    })
  );

  // Grouped View Data
  let groupedTodos = $derived.by(() => {
    const today = getTodayStr();
    const overdue: AdminTodoItem[] = [];
    const forToday: AdminTodoItem[] = [];
    const upcoming: AdminTodoItem[] = [];
    const undated: AdminTodoItem[] = [];

    for (const todo of baseFilteredTodos) {
      if (todo.completed) {
        // can still be grouped or listed
      }
      if (!todo.dueDate) {
        undated.push(todo);
      } else if (todo.dueDate === today) {
        forToday.push(todo);
      } else if (todo.dueDate < today && !todo.completed) {
        overdue.push(todo);
      } else {
        upcoming.push(todo);
      }
    }

    // Sort upcoming chronologically
    upcoming.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    return { overdue, forToday, upcoming, undated };
  });

  // Handle Quick Add
  function handleQuickAdd() {
    if (!quickTitle.trim()) return;
    adminTodoStore.addTodo({
      title: quickTitle.trim(),
      category: quickCategory,
      priority: quickPriority,
      dueDate: viewMode === 'day' ? selectedDate : getTodayStr(),
      assignee: quickAssignee.trim() || undefined,
      subtasks: [],
      tags: []
    });
    quickTitle = '';
    quickAssignee = '';
    showToast('Befehl ausgeführt: Aufgabe im imperialen Archiv erfasst! ⚔️');
  }

  // Open Edit Modal
  function openEditModal(todo: AdminTodoItem) {
    editingTodoId = todo.id;
    modalTitle = todo.title;
    modalNotes = todo.notes || '';
    modalCategory = todo.category;
    modalPriority = todo.priority;
    modalDueDate = todo.dueDate || '';
    modalDueTime = todo.dueTime || '';
    modalAssignee = todo.assignee || '';
    modalContactEmail = todo.contactEmail || '';
    modalLinkUrl = todo.linkUrl || '';
    modalLinkPassword = todo.linkPassword || '';
    modalRecurringRule = todo.recurringRule || '';
    modalSubtasks = JSON.parse(JSON.stringify(todo.subtasks || []));
    modalNewSubtaskText = '';
    modalTags = (todo.tags || []).join(', ');
    isModalOpen = true;
  }

  // Open Create Modal
  function openCreateModal() {
    editingTodoId = null;
    modalTitle = '';
    modalNotes = '';
    modalCategory = 'seminare';
    modalPriority = 'normal';
    modalDueDate = viewMode === 'day' ? selectedDate : getTodayStr();
    modalDueTime = '';
    modalAssignee = '';
    modalContactEmail = '';
    modalLinkUrl = '';
    modalLinkPassword = '';
    modalRecurringRule = '';
    modalSubtasks = [];
    modalNewSubtaskText = '';
    modalTags = '';
    isModalOpen = true;
  }

  function handleSaveModal() {
    if (!modalTitle.trim()) return;

    const tagsArray = modalTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      title: modalTitle.trim(),
      notes: modalNotes.trim() || undefined,
      category: modalCategory,
      priority: modalPriority,
      dueDate: modalDueDate || undefined,
      dueTime: modalDueTime || undefined,
      assignee: modalAssignee.trim() || undefined,
      contactEmail: modalContactEmail.trim() || undefined,
      linkUrl: modalLinkUrl.trim() || undefined,
      linkPassword: modalLinkPassword.trim() || undefined,
      recurringRule: modalRecurringRule.trim() || undefined,
      subtasks: modalSubtasks,
      tags: tagsArray
    };

    if (editingTodoId) {
      adminTodoStore.updateTodo(editingTodoId, payload);
      showToast('Imperiales Dekret aktualisiert! ✏️');
    } else {
      adminTodoStore.addTodo(payload);
      showToast('Neuer imperialer Einsatzbefehl erstellt! ⚔️');
    }

    isModalOpen = false;
  }

  function handleModalAddSubtask() {
    if (!modalNewSubtaskText.trim()) return;
    modalSubtasks.push({
      id: 'sub-' + Math.random().toString(36).substr(2, 7),
      text: modalNewSubtaskText.trim(),
      completed: false
    });
    modalNewSubtaskText = '';
  }

  function handleModalRemoveSubtask(id: string) {
    modalSubtasks = modalSubtasks.filter(s => s.id !== id);
  }

  // Inline Add Subtask for card
  let inlineSubtaskInputs = $state<Record<string, string>>({});

  function handleAddInlineSubtask(todoId: string) {
    const text = inlineSubtaskInputs[todoId];
    if (!text || !text.trim()) return;
    adminTodoStore.addSubtask(todoId, text.trim());
    inlineSubtaskInputs[todoId] = '';
    showToast('Teiloperation protokolliert! 📋');
  }

  // Reset Confirmation
  function confirmReset() {
    if (confirm('Möchtest du alle Aufgaben auf die Standardliste (aus "Yoga Vidya Aufgaben") zurücksetzen? Eigene Änderungen werden dabei überschrieben.')) {
      adminTodoStore.resetToDefaults();
      showToast('Protokolle aus dem Sith-Archiv wiederhergestellt! 💀');
    }
  }

  // Copy/Export Summary
  function copyDaySummary() {
    const dateLabel = formatDisplayDate(selectedDate);
    const todos = dayViewTodos;
    let text = `⚔️ LORD VADER IMPERIAL COMMAND – TAGES-TO-DOS (${dateLabel})\n`;
    text += `========================================================\n\n`;
    
    if (todos.length === 0) {
      text += `Keine anstehenden Aufgaben für diesen Tag. Die Galaxis ist unter Kontrolle.\n`;
    } else {
      todos.forEach((t, i) => {
        const check = t.completed ? '[X]' : '[ ]';
        const prio = t.priority === 'urgent' ? '💀 DRINGEND: ' : (t.priority === 'high' ? '⚡ ' : '');
        const cat = CATEGORY_CONFIG[t.category]?.label || '';
        text += `${i + 1}. ${check} ${prio}${t.title} (${cat})\n`;
        if (t.assignee) text += `   👤 Zuständig: ${t.assignee}\n`;
        if (t.notes) text += `   📝 Befehl: ${t.notes}\n`;
        if (t.subtasks && t.subtasks.length > 0) {
          t.subtasks.forEach(s => {
            text += `      ${s.completed ? '✓' : '-'} ${s.text}\n`;
          });
        }
      });
    }

    navigator.clipboard.writeText(text);
    showToast('Imperialer Einsatzplan in die Zwischenablage transferiert! 💀');
  }
</script>

{#if isAuthorized}
  <div class="vader-command-page animate-fade-in">
    <!-- Starfield & Red Glow Atmospheric Elements -->
    <div class="vader-ambient-glow"></div>
    <div class="vader-grid-overlay"></div>

    <!-- Toast Notification -->
    {#if toastMessage}
      <div class="vader-toast-popup animate-fade-in">
        <span class="toast-skull">💀</span>
        <span>{toastMessage}</span>
      </div>
    {/if}

    <!-- Hero Header Card: Darth Vader Command Bridge -->
    <div class="vader-hero-card">
      <div class="vader-hero-content">
        <div class="vader-hero-badge">
          <span class="vader-badge-icon">⚔️</span>
          <span>IMPERIALES OBERKOMMANDO</span>
          <span class="badge-dot">•</span>
          <span>SITH-ARCHIV YOGA VIDYA NORDSEE</span>
        </div>
        <h1 class="vader-main-title">
          <span class="title-skull">💀</span> Seminar- & Orga-To-Dos
        </h1>
        <p class="vader-hero-quote">
          „Ich finde Ihren Mangel an erledigten To-Dos beklagenswert...“
        </p>
        <p class="vader-hero-desc">
          Zentrale Gefechtsstation aller Missionen: Seminarvorbereitung, Dozentenabstimmung, Sevaka-Einsätze und organisatorische Direktiven.
        </p>
      </div>

      <div class="vader-hero-actions">
        <button type="button" class="btn-vader-secondary" onclick={confirmReset} title="Setzt die Liste auf die Original-Aufgaben zurück">
          🔄 Sith-Vorlage laden
        </button>
        <button type="button" class="btn-vader-primary" onclick={openCreateModal}>
          ⚡ Neue Mission befehlen
        </button>
      </div>
    </div>

    <!-- KPI Statistics Grid -->
    <div class="vader-kpi-grid">
      <button 
        type="button" 
        class="vader-kpi-card" 
        class:active-kpi={viewMode === 'day' && selectedDate === getTodayStr()}
        onclick={() => { viewMode = 'day'; setDateToToday(); }}
      >
        <div class="kpi-icon-box kpi-today">📅</div>
        <div class="kpi-info">
          <span class="kpi-label">Heute im Visier</span>
          <strong class="kpi-val">{adminTodoStore.todayCount}</strong>
        </div>
      </button>

      <button 
        type="button" 
        class="vader-kpi-card kpi-urgent-card" 
        class:active-kpi={selectedPriority === 'urgent'}
        onclick={() => { selectedPriority = selectedPriority === 'urgent' ? 'all' : 'urgent'; viewMode = 'all'; }}
      >
        <div class="kpi-icon-box kpi-urgent">💀</div>
        <div class="kpi-info">
          <span class="kpi-label text-urgent">💀 Dringend / Kritisch</span>
          <strong class="kpi-val val-urgent">{adminTodoStore.urgentCount}</strong>
        </div>
      </button>

      <button 
        type="button" 
        class="vader-kpi-card" 
        class:active-kpi={viewMode === 'all' && selectedCategory === 'all' && selectedPriority === 'all'}
        onclick={() => { viewMode = 'all'; selectedCategory = 'all'; selectedPriority = 'all'; }}
      >
        <div class="kpi-icon-box kpi-pending">⏳</div>
        <div class="kpi-info">
          <span class="kpi-label">Offene Direktiven</span>
          <strong class="kpi-val">{adminTodoStore.pendingCount}</strong>
        </div>
      </button>

      <div class="vader-kpi-card kpi-card-progress">
        <div class="kpi-icon-box kpi-done">⚔️</div>
        <div class="kpi-info" style="flex-grow: 1;">
          <div class="progress-label-row">
            <span class="kpi-label">Exekutiert / Erledigt</span>
            <strong class="kpi-val-sm">{adminTodoStore.completedCount} / {adminTodoStore.totalCount}</strong>
          </div>
          <div class="lightsaber-track">
            <div 
              class="lightsaber-beam" 
              style="width: {adminTodoStore.totalCount > 0 ? (adminTodoStore.completedCount / adminTodoStore.totalCount) * 100 : 0}%;"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Bar: Imperial Command Line -->
    <div class="vader-quick-add-bar">
      <div class="quick-add-input-wrap">
        <span class="quick-icon">⚔️</span>
        <input 
          type="text" 
          placeholder="Einsatzbefehl eingeben... (z. B. Dozent kontaktieren, Skripte requirieren...)" 
          bind:value={quickTitle}
          onkeydown={(e) => e.key === 'Enter' && handleQuickAdd()}
          class="vader-quick-input"
        />
      </div>

      <div class="quick-add-controls">
        <select bind:value={quickCategory} class="vader-select" aria-label="Kategorie">
          {#each Object.entries(CATEGORY_CONFIG) as [key, conf]}
            <option value={key}>{conf.icon} {conf.label}</option>
          {/each}
        </select>

        <select bind:value={quickPriority} class="vader-select prio-select-box" aria-label="Priorität">
          <option value="urgent">💀 Dringend (Totenkopf)</option>
          <option value="high">⚡ Hoch</option>
          <option value="normal">🟡 Normal</option>
          <option value="low">🟢 Niedrig</option>
        </select>

        <input 
          type="text" 
          placeholder="👤 Zuständiger Offizier..." 
          bind:value={quickAssignee} 
          class="vader-quick-input-sm"
        />

        <button type="button" class="btn-vader-primary btn-quick-add" onclick={handleQuickAdd}>
          ⚡ Befehl erteilen
        </button>
      </div>
    </div>

    <!-- Main Toolbar & View Switcher -->
    <div class="vader-toolbar-section">
      <div class="view-mode-tabs">
        <button 
          type="button" 
          class="vader-tab-btn" 
          class:active={viewMode === 'day'} 
          onclick={() => viewMode = 'day'}
        >
          📅 Tag-für-Tag Fokus
        </button>
        <button 
          type="button" 
          class="vader-tab-btn" 
          class:active={viewMode === 'grouped'} 
          onclick={() => viewMode = 'grouped'}
        >
          🗓️ Nach Frist gruppiert
        </button>
        <button 
          type="button" 
          class="vader-tab-btn" 
          class:active={viewMode === 'all'} 
          onclick={() => viewMode = 'all'}
        >
          📑 Alle Direktiven ({baseFilteredTodos.length})
        </button>
      </div>

      <!-- Search and filters in toolbar -->
      <div class="search-filter-row">
        <div class="vader-search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Sith-Archive & Direktiven durchsuchen..." 
            bind:value={searchQuery}
            class="vader-search-input"
          />
          {#if searchQuery}
            <button class="clear-search" onclick={() => searchQuery = ''}>✕</button>
          {/if}
        </div>

        <label class="vader-checkbox-toggle">
          <input type="checkbox" bind:checked={showCompleted} />
          <span>Erledigte anzeigen</span>
        </label>
      </div>

      <!-- Category Filter Chips -->
      <div class="category-chips-row">
        <button 
          type="button" 
          class="vader-chip" 
          class:chip-active={selectedCategory === 'all'}
          onclick={() => selectedCategory = 'all'}
        >
          ✨ Alle Sektoren
        </button>
        {#each Object.entries(CATEGORY_CONFIG) as [catKey, conf]}
          {@const count = adminTodoStore.todos.filter(t => t.category === catKey && (!t.completed || showCompleted)).length}
          <button 
            type="button" 
            class="vader-chip" 
            class:chip-active={selectedCategory === catKey}
            onclick={() => selectedCategory = selectedCategory === catKey ? 'all' : catKey as AdminTodoCategory}
          >
            <span>{conf.icon}</span>
            <span>{conf.label}</span>
            <span class="vader-chip-badge">{count}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- DAY-BY-DAY VIEW -->
    {#if viewMode === 'day'}
      <div class="vader-day-nav-card">
        <div class="day-nav-controls">
          <button type="button" class="btn-vader-nav" onclick={() => shiftDate(-1)}>
            ◀ Vorheriger Zyklus
          </button>
          
          <div class="date-picker-center">
            <span class="cal-big-icon">📅</span>
            <input 
              type="date" 
              bind:value={selectedDate} 
              class="vader-date-input"
            />
            <span class="day-label-formatted">({formatDisplayDate(selectedDate)})</span>
            {#if selectedDate === getTodayStr()}
              <span class="vader-today-badge">HEUTE / JETZT</span>
            {:else}
              <button type="button" class="btn-vader-today" onclick={setDateToToday}>
                Zu Heute springen
              </button>
            {/if}
          </div>

          <button type="button" class="btn-vader-nav" onclick={() => shiftDate(1)}>
            Nächster Zyklus ▶
          </button>
        </div>

        <div class="day-actions-row">
          <span class="day-stats-text">
            <strong class="text-red-glow">{dayViewTodos.filter(t => !t.completed).length} offene</strong> von {dayViewTodos.length} Direktiven für diesen Tag
          </span>
          <button type="button" class="btn-vader-secondary btn-sm" onclick={copyDaySummary}>
            📋 Einsatzplan kopieren
          </button>
        </div>
      </div>

      <!-- Day Tasks List -->
      {#if dayViewTodos.length === 0}
        <div class="vader-empty-state">
          <span class="empty-icon">⚔️</span>
          <h3>Keine Direktiven für diesen Zyklus</h3>
          <p>Für den {formatDisplayDate(selectedDate)} sind aktuell keine Befehle hinterlegt.</p>
          <button type="button" class="btn-vader-primary" onclick={openCreateModal} style="margin-top: 1rem;">
            ⚡ Einsatzbefehl erteilen
          </button>
        </div>
      {:else}
        <div class="vader-todos-grid">
          {#each dayViewTodos as todo (todo.id)}
            {@render renderTodoCard(todo)}
          {/each}
        </div>
      {/if}
    {/if}

    <!-- GROUPED VIEW -->
    {#if viewMode === 'grouped'}
      <div class="grouped-sections-wrapper">
        <!-- Overdue -->
        {#if groupedTodos.overdue.length > 0}
          <div class="group-section overdue-section">
            <div class="group-header">
              <span class="group-icon">💀</span>
              <h3>Kritisch & Überfällig ({groupedTodos.overdue.length})</h3>
            </div>
            <div class="vader-todos-grid">
              {#each groupedTodos.overdue as todo (todo.id)}
                {@render renderTodoCard(todo)}
              {/each}
            </div>
          </div>
        {/if}

        <!-- For Today -->
        <div class="group-section today-section">
          <div class="group-header">
            <span class="group-icon">📅</span>
            <h3>Heute fällig ({groupedTodos.forToday.length})</h3>
          </div>
          {#if groupedTodos.forToday.length === 0}
            <p class="empty-group-msg">Keine offenen Direktiven für heute fällig.</p>
          {:else}
            <div class="vader-todos-grid">
              {#each groupedTodos.forToday as todo (todo.id)}
                {@render renderTodoCard(todo)}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Upcoming -->
        <div class="group-section upcoming-section">
          <div class="group-header">
            <span class="group-icon">🗓️</span>
            <h3>Anstehende Termine & Missionen ({groupedTodos.upcoming.length})</h3>
          </div>
          {#if groupedTodos.upcoming.length === 0}
            <p class="empty-group-msg">Keine weiteren anstehenden Aufgaben im System.</p>
          {:else}
            <div class="vader-todos-grid">
              {#each groupedTodos.upcoming as todo (todo.id)}
                {@render renderTodoCard(todo)}
              {/each}
            </div>
          {/if}
        </div>

        <!-- Undated -->
        {#if groupedTodos.undated.length > 0}
          <div class="group-section undated-section">
            <div class="group-header">
              <span class="group-icon">📌</span>
              <h3>Kontinuierliche Operationen ({groupedTodos.undated.length})</h3>
            </div>
            <div class="vader-todos-grid">
              {#each groupedTodos.undated as todo (todo.id)}
                {@render renderTodoCard(todo)}
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- ALL TASKS VIEW -->
    {#if viewMode === 'all'}
      {#if baseFilteredTodos.length === 0}
        <div class="vader-empty-state">
          <span class="empty-icon">🔍</span>
          <h3>Keine Direktiven gefunden</h3>
          <p>Passe deine Filterkriterien an oder erteile einen neuen Befehl.</p>
        </div>
      {:else}
        <div class="vader-todos-grid">
          {#each baseFilteredTodos as todo (todo.id)}
            {@render renderTodoCard(todo)}
          {/each}
        </div>
      {/if}
    {/if}
  </div>
{/if}

<!-- Reusable Snippet for Todo Card -->
{#snippet renderTodoCard(todo: AdminTodoItem)}
  {@const catConf = CATEGORY_CONFIG[todo.category] || CATEGORY_CONFIG.orga}
  {@const prioConf = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.normal}
  {@const relDate = getRelativeDateLabel(todo.dueDate)}
  {@const completedSubtasks = (todo.subtasks || []).filter(s => s.completed).length}
  {@const totalSubtasks = (todo.subtasks || []).length}
  {@const isUrgent = todo.priority === 'urgent' && !todo.completed}

  <div 
    class="vader-todo-card" 
    class:completed-card={todo.completed}
    class:urgent-card={isUrgent}
  >
    <!-- Top Header: Category & Priority Badges -->
    <div class="card-top-row">
      <div class="badges-left">
        <span class="vader-cat-badge">
          {catConf.icon} {catConf.label}
        </span>
        
        {#if todo.priority === 'urgent'}
          <span class="vader-prio-badge prio-urgent-skull">
            💀 DRINGEND
          </span>
        {:else}
          <span class="vader-prio-badge {prioConf.badgeClass}">
            {prioConf.icon} {prioConf.label}
          </span>
        {/if}

        {#if todo.recurringRule}
          <span class="vader-recurring-badge">
            🔄 {todo.recurringRule}
          </span>
        {/if}
      </div>

      <div class="card-actions-menu">
        <button type="button" class="btn-card-action" onclick={() => openEditModal(todo)} title="Modifizieren">
          ✏️
        </button>
        <button type="button" class="btn-card-action delete" onclick={() => adminTodoStore.deleteTodo(todo.id)} title="Exekutieren / Löschen">
          🗑️
        </button>
      </div>
    </div>

    <!-- Main Title & Checkbox -->
    <div class="card-main-row">
      <label class="vader-checkbox-wrapper" title={todo.completed ? 'Wieder öffnen' : 'Als erledigt markieren'}>
        <input 
          type="checkbox" 
          checked={todo.completed} 
          onchange={() => adminTodoStore.toggleTodo(todo.id)}
          class="vader-main-checkbox"
        />
        <span class="vader-custom-checkmark"></span>
      </label>

      <div class="card-text-content">
        <h4 class="todo-title" class:strike={todo.completed} class:urgent-title={isUrgent}>
          {#if isUrgent}
            <span class="inline-skull-glow" title="Dringende Aufgabe">💀</span>
          {/if}
          {todo.title}
        </h4>
        {#if todo.notes}
          <p class="todo-notes">{todo.notes}</p>
        {/if}
      </div>
    </div>

    <!-- Meta Details Row: Date, Assignee, Links, Contacts -->
    <div class="card-meta-row">
      {#if todo.dueDate}
        <div class="meta-item date-meta" class:overdue-meta={relDate.isOverdue} class:today-meta={relDate.isToday}>
          <span class="meta-icon">📅</span>
          <span>{formatDisplayDate(todo.dueDate)}</span>
          {#if todo.dueTime}
            <span class="time-tag">⏰ {todo.dueTime} Uhr</span>
          {/if}
          <span class="relative-time-pill" class:pill-overdue={relDate.isOverdue} class:pill-today={relDate.isToday}>
            {#if relDate.isOverdue}💀 {/if}{relDate.text}
          </span>
        </div>
      {/if}

      {#if todo.assignee}
        <div class="meta-item assignee-meta">
          <span class="meta-icon">👤</span>
          <span>{todo.assignee}</span>
        </div>
      {/if}

      {#if todo.contactEmail}
        <a href="mailto:{todo.contactEmail}" class="meta-item email-meta" title="E-Mail senden an {todo.contactEmail}">
          <span class="meta-icon">✉️</span>
          <span>{todo.contactEmail}</span>
        </a>
      {/if}

      {#if todo.linkUrl}
        <div class="meta-item link-meta">
          <a href={todo.linkUrl} target="_blank" rel="noopener noreferrer" class="link-btn">
            🔗 Hyperlink öffnen
          </a>
          {#if todo.linkPassword}
            <span class="password-badge" title="Sicherheitscode / Passwort">
              🔑 {todo.linkPassword}
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Subtasks / Checklist Section -->
    {#if todo.subtasks && todo.subtasks.length > 0}
      <div class="subtasks-container">
        <div class="subtasks-header">
          <span class="subtasks-title">Teiloperationen ({completedSubtasks}/{totalSubtasks})</span>
          <div class="subtask-progress-mini">
            <div class="subtask-progress-fill" style="width: {(completedSubtasks / totalSubtasks) * 100}%;"></div>
          </div>
        </div>

        <div class="subtasks-list">
          {#each todo.subtasks as sub (sub.id)}
            <div class="subtask-row" class:sub-completed={sub.completed}>
              <label class="subtask-check-wrap">
                <input 
                  type="checkbox" 
                  checked={sub.completed} 
                  onchange={() => adminTodoStore.toggleSubtask(todo.id, sub.id)}
                />
                <span class="subtask-text">{sub.text}</span>
              </label>
              <button 
                type="button" 
                class="btn-del-sub" 
                onclick={() => adminTodoStore.deleteSubtask(todo.id, sub.id)}
                title="Teiloperation entfernen"
              >
                ✕
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Inline Add Subtask Input -->
    <div class="inline-subtask-row">
      <input 
        type="text" 
        placeholder="＋ Teiloperation / Checkpunkt hinzufügen..." 
        bind:value={inlineSubtaskInputs[todo.id]}
        onkeydown={(e) => e.key === 'Enter' && handleAddInlineSubtask(todo.id)}
        class="inline-sub-input"
      />
      {#if inlineSubtaskInputs[todo.id]}
        <button type="button" class="btn-sub-add" onclick={() => handleAddInlineSubtask(todo.id)}>
          ＋
        </button>
      {/if}
    </div>

    <!-- Tags Row -->
    {#if todo.tags && todo.tags.length > 0}
      <div class="card-tags-row">
        {#each todo.tags as tag}
          <span class="tag-pill">#{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<!-- Create / Edit Full Modal: Imperial Command Terminal -->
{#if isModalOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="vader-modal-backdrop" onclick={() => isModalOpen = false}>
    <div class="vader-modal-card" onclick={(e) => e.stopPropagation()}>
      <div class="vader-modal-header">
        <h2>
          <span class="header-skull">⚔️</span>
          {editingTodoId ? 'Direktive modifizieren' : 'Neuen imperialen Einsatzbefehl verfassen'}
        </h2>
        <button class="modal-close-btn" onclick={() => isModalOpen = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="modal-title">Aufgabentitel / Befehl *</label>
          <input 
            id="modal-title" 
            type="text" 
            class="vader-form-input" 
            placeholder="z. B. Dozent kontaktieren, Yin ÜL AB absagen..." 
            bind:value={modalTitle}
            required
          />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-category">Sektor / Kategorie</label>
            <select id="modal-category" class="vader-form-select" bind:value={modalCategory}>
              {#each Object.entries(CATEGORY_CONFIG) as [key, conf]}
                <option value={key}>{conf.icon} {conf.label}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="modal-priority">Dringlichkeitsstufe</label>
            <select id="modal-priority" class="vader-form-select prio-select-modal" bind:value={modalPriority}>
              <option value="urgent">💀 Dringend (Totenkopf)</option>
              <option value="high">⚡ Hoch</option>
              <option value="normal">🟡 Normal</option>
              <option value="low">🟢 Niedrig</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-due-date">Fälligkeitsdatum (Zyklus)</label>
            <input 
              id="modal-due-date" 
              type="date" 
              class="vader-form-input" 
              bind:value={modalDueDate}
            />
          </div>

          <div class="form-group">
            <label for="modal-due-time">Uhrzeit (Optional)</label>
            <input 
              id="modal-due-time" 
              type="time" 
              class="vader-form-input" 
              bind:value={modalDueTime}
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-assignee">Zuständiger Sevaka / Offizier</label>
            <input 
              id="modal-assignee" 
              type="text" 
              class="vader-form-input" 
              placeholder="z. B. Karuna, Susan, Christian..." 
              bind:value={modalAssignee}
            />
          </div>

          <div class="form-group">
            <label for="modal-contact">Holonet / Kontakt-Email</label>
            <input 
              id="modal-contact" 
              type="email" 
              class="vader-form-input" 
              placeholder="z. B. name@gmx.de" 
              bind:value={modalContactEmail}
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-link">Hyperlink (URL)</label>
            <input 
              id="modal-link" 
              type="url" 
              class="vader-form-input" 
              placeholder="https://..." 
              bind:value={modalLinkUrl}
            />
          </div>

          <div class="form-group">
            <label for="modal-password">Sicherheitscode / Passwort</label>
            <input 
              id="modal-password" 
              type="text" 
              class="vader-form-input" 
              placeholder="z. B. Ganga108" 
              bind:value={modalLinkPassword}
            />
          </div>
        </div>

        <div class="form-group">
          <label for="modal-recurring">Wiederholungsrhythmus</label>
          <input 
            id="modal-recurring" 
            type="text" 
            class="vader-form-input" 
            placeholder="z. B. Jeden Mittwoch & Samstag, Wöchentlich montags..." 
            bind:value={modalRecurringRule}
          />
        </div>

        <div class="form-group">
          <label for="modal-notes">Befehlsdetails & Notizen</label>
          <textarea 
            id="modal-notes" 
            class="vader-form-textarea" 
            rows="3" 
            placeholder="Zusätzliche Direktiven, Raumangaben, Telefonnummern oder Anweisungen..."
            bind:value={modalNotes}
          ></textarea>
        </div>

        <!-- Subtasks in Modal -->
        <div class="form-group">
          <label for="modal-subtask-in">Checkliste / Teiloperationen</label>
          <div class="modal-subtask-add-row">
            <input 
              id="modal-subtask-in"
              type="text" 
              class="vader-form-input" 
              placeholder="Neuen Checkpunkt hinzufügen..." 
              bind:value={modalNewSubtaskText}
              onkeydown={(e) => e.key === 'Enter' && handleModalAddSubtask()}
            />
            <button type="button" class="btn-vader-secondary" onclick={handleModalAddSubtask}>
              ＋ Punkt
            </button>
          </div>

          {#if modalSubtasks.length > 0}
            <div class="modal-subtasks-preview">
              {#each modalSubtasks as sub}
                <div class="modal-subtask-item">
                  <span>• {sub.text}</span>
                  <button type="button" class="btn-del-mini" onclick={() => handleModalRemoveSubtask(sub.id)}>✕</button>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="modal-tags">Schlagwörter (Kommagetrennt)</label>
          <input 
            id="modal-tags" 
            type="text" 
            class="vader-form-input" 
            placeholder="z. B. Ausbildung, Susan, YLA, Rezi" 
            bind:value={modalTags}
          />
        </div>
      </div>

      <div class="vader-modal-footer">
        <button type="button" class="btn-vader-secondary" onclick={() => isModalOpen = false}>
          Abbrechen
        </button>
        <button type="button" class="btn-vader-primary" onclick={handleSaveModal}>
          ⚡ {editingTodoId ? 'Befehl aktualisieren' : 'Direktive erteilen'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Darth Vader / Galactic Empire Aesthetic Theme */
  .vader-command-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e2e8f0;
    background: #090a0f;
    min-height: calc(100vh - 100px);
    padding: 1.5rem;
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.9), 0 10px 40px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(220, 38, 38, 0.25);
  }

  /* Atmospheric Sith Red Ambient Glow */
  .vader-ambient-glow {
    position: absolute;
    top: -150px;
    right: -100px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
    pointer-events: none;
    z-index: 0;
  }

  .vader-grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(220, 38, 38, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(220, 38, 38, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* Toast Notification */
  .vader-toast-popup {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #12131c;
    color: #ffffff;
    padding: 0.9rem 1.6rem;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(220, 38, 38, 0.4);
    border: 1px solid #dc2626;
    z-index: 1000;
    font-weight: 700;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .toast-skull {
    font-size: 1.2rem;
    animation: sith-pulse 1.5s infinite;
  }

  /* Darth Vader Hero Card */
  .vader-hero-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #111219 0%, #1e0910 50%, #0c0d14 100%);
    border-radius: 20px;
    padding: 2.25rem 2.5rem;
    color: #ffffff;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(220, 38, 38, 0.2);
    border: 1px solid rgba(220, 38, 38, 0.4);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .vader-hero-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #ff0037, #dc2626, transparent);
    box-shadow: 0 0 12px #ff0037;
  }

  .vader-hero-content {
    max-width: 720px;
    z-index: 2;
  }

  .vader-hero-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    background: rgba(220, 38, 38, 0.18);
    border: 1px solid rgba(220, 38, 38, 0.5);
    color: #ff6b81;
    padding: 0.3rem 0.85rem;
    border-radius: 999px;
    width: fit-content;
    margin-bottom: 0.85rem;
    text-transform: uppercase;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.2);
  }

  .vader-badge-icon {
    font-size: 0.85rem;
  }

  .badge-dot {
    opacity: 0.5;
  }

  .vader-main-title {
    font-size: 2.3rem;
    font-weight: 900;
    letter-spacing: -0.02em;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
    color: #ffffff;
    text-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .title-skull {
    font-size: 2rem;
    filter: drop-shadow(0 0 8px #ff0037);
  }

  .vader-hero-quote {
    font-size: 1.05rem;
    font-style: italic;
    font-weight: 600;
    color: #ff8597;
    margin: 0 0 0.5rem 0;
    letter-spacing: 0.02em;
    text-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
  }

  .vader-hero-desc {
    font-size: 0.92rem;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0;
  }

  .vader-hero-actions {
    display: flex;
    gap: 0.85rem;
    align-items: center;
    z-index: 2;
  }

  /* Vader Buttons */
  .btn-vader-primary {
    background: linear-gradient(135deg, #dc2626 0%, #990000 100%);
    color: #ffffff;
    font-weight: 800;
    padding: 0.75rem 1.35rem;
    border-radius: 12px;
    border: 1px solid #ff4d6d;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4), 0 0 10px rgba(255, 0, 55, 0.3);
    transition: all 0.25s ease;
    font-size: 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .btn-vader-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 22px rgba(220, 38, 38, 0.7), 0 0 18px rgba(255, 0, 55, 0.6);
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  }

  .btn-vader-secondary {
    background: rgba(26, 27, 38, 0.8);
    color: #e2e8f0;
    font-weight: 700;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    border: 1px solid rgba(220, 38, 38, 0.3);
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition: all 0.25s ease;
    font-size: 0.9rem;
  }

  .btn-vader-secondary:hover {
    background: rgba(36, 38, 54, 0.9);
    border-color: #dc2626;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
  }

  /* KPI Grid */
  .vader-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
    z-index: 1;
  }

  .vader-kpi-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: #11121a;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    text-align: left;
    transition: all 0.25s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }

  .vader-kpi-card:hover {
    transform: translateY(-2px);
    border-color: rgba(220, 38, 38, 0.5);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(220, 38, 38, 0.2);
  }

  .vader-kpi-card.active-kpi {
    border-color: #dc2626;
    background: #1a0d13;
    box-shadow: 0 0 18px rgba(220, 38, 38, 0.4);
  }

  .vader-kpi-card.kpi-urgent-card {
    border-color: rgba(220, 38, 38, 0.4);
    background: linear-gradient(145deg, #160c12 0%, #11121a 100%);
  }

  .kpi-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .kpi-today { background: #0f1d2e; border-color: #1e3a8a; }
  .kpi-urgent { background: #2b0c11; border-color: #dc2626; box-shadow: 0 0 10px rgba(220, 38, 38, 0.4); }
  .kpi-pending { background: #261c0c; border-color: #b45309; }
  .kpi-done { background: #0c2417; border-color: #15803d; }

  .kpi-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .kpi-label {
    font-size: 0.76rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .kpi-label.text-urgent {
    color: #ff6b81;
  }

  .kpi-val {
    font-size: 1.6rem;
    font-weight: 900;
    color: #ffffff;
  }

  .kpi-val.val-urgent {
    color: #ff4d6d;
    text-shadow: 0 0 10px rgba(255, 77, 109, 0.6);
  }

  .kpi-val-sm {
    font-size: 0.95rem;
    font-weight: 800;
    color: #ffffff;
  }

  .kpi-card-progress {
    cursor: default;
  }
  .kpi-card-progress:hover {
    transform: none;
    border-color: rgba(255, 255, 255, 0.08);
  }

  .progress-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.45rem;
  }

  .lightsaber-track {
    width: 100%;
    height: 9px;
    background: #1f202e;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .lightsaber-beam {
    height: 100%;
    background: linear-gradient(90deg, #ff0055 0%, #ff2a2a 50%, #ff6b81 100%);
    border-radius: 999px;
    box-shadow: 0 0 10px #ff0055;
    transition: width 0.4s ease;
  }

  /* Quick Add Bar: Imperial Command Terminal */
  .vader-quick-add-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.35rem;
    background: #11121a;
    border-radius: 16px;
    border: 1px solid rgba(220, 38, 38, 0.3);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.5);
    z-index: 1;
  }

  .quick-add-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-grow: 1;
    min-width: 280px;
  }

  .quick-icon {
    font-size: 1.2rem;
    color: #dc2626;
    filter: drop-shadow(0 0 5px #dc2626);
  }

  .vader-quick-input {
    width: 100%;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
    background: transparent;
  }

  .vader-quick-input::placeholder {
    color: #64748b;
  }

  .quick-add-controls {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .vader-select, .vader-quick-input-sm {
    padding: 0.55rem 0.85rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #191a26;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    color: #e2e8f0;
    outline: none;
  }

  .vader-select:focus, .vader-quick-input-sm:focus {
    border-color: #dc2626;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.4);
  }

  .prio-select-box {
    border-color: rgba(220, 38, 38, 0.4);
    color: #ff8597;
  }

  .vader-quick-input-sm {
    width: 150px;
  }

  .btn-quick-add {
    padding: 0.55rem 1.15rem;
    font-size: 0.88rem;
    white-space: nowrap;
  }

  /* Main Toolbar Section */
  .vader-toolbar-section {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.25rem 1.5rem;
    background: #11121a;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 1;
  }

  .view-mode-tabs {
    display: flex;
    gap: 0.65rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 0.85rem;
  }

  .vader-tab-btn {
    padding: 0.6rem 1.2rem;
    border-radius: 10px;
    border: 1px solid transparent;
    background: rgba(255, 255, 255, 0.03);
    color: #94a3b8;
    font-family: inherit;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .vader-tab-btn:hover {
    background: rgba(220, 38, 38, 0.1);
    color: #ffffff;
    border-color: rgba(220, 38, 38, 0.3);
  }

  .vader-tab-btn.active {
    background: linear-gradient(135deg, #dc2626 0%, #990000 100%);
    color: #ffffff;
    border-color: #ff4d6d;
    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4), 0 0 10px rgba(255, 0, 55, 0.3);
  }

  .search-filter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
  }

  .vader-search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 520px;
  }

  .search-icon {
    position: absolute;
    left: 0.95rem;
    font-size: 0.95rem;
    color: #dc2626;
  }

  .vader-search-input {
    width: 100%;
    padding: 0.6rem 0.9rem 0.6rem 2.45rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #171824;
    font-family: inherit;
    font-size: 0.9rem;
    color: #ffffff;
    outline: none;
  }

  .vader-search-input:focus {
    border-color: #dc2626;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.3);
  }

  .clear-search {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .vader-checkbox-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    font-weight: 700;
    color: #94a3b8;
    cursor: pointer;
  }

  .category-chips-row {
    display: flex;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .vader-chip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #171824;
    font-family: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .vader-chip:hover {
    background: rgba(220, 38, 38, 0.12);
    color: #ffffff;
    border-color: rgba(220, 38, 38, 0.4);
  }

  .vader-chip.chip-active {
    background: #dc2626;
    color: #ffffff;
    border-color: #ff4d6d;
    box-shadow: 0 0 12px rgba(220, 38, 38, 0.5);
  }

  .vader-chip-badge {
    font-size: 0.72rem;
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.4);
    font-weight: 800;
  }

  .vader-chip.chip-active .vader-chip-badge {
    background: rgba(255, 255, 255, 0.3);
    color: #ffffff;
  }

  /* Day Navigator */
  .vader-day-nav-card {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.25rem 1.5rem;
    background: #11121a;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 1;
  }

  .day-nav-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .btn-vader-nav {
    padding: 0.55rem 1.1rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #181926;
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-vader-nav:hover {
    background: rgba(220, 38, 38, 0.15);
    border-color: #dc2626;
    color: #ffffff;
  }

  .date-picker-center {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cal-big-icon {
    font-size: 1.3rem;
  }

  .vader-date-input {
    padding: 0.45rem 0.85rem;
    border-radius: 8px;
    border: 1.5px solid #dc2626;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 800;
    color: #ff6b81;
    background: #1b0e14;
    outline: none;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.25);
  }

  .day-label-formatted {
    font-weight: 800;
    font-size: 1rem;
    color: #ffffff;
  }

  .vader-today-badge {
    font-size: 0.72rem;
    font-weight: 900;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    background: #dc2626;
    color: #ffffff;
    letter-spacing: 0.08em;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.6);
  }

  .btn-vader-today {
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    border: 1px solid rgba(220, 38, 38, 0.4);
    background: #1e0d14;
    color: #ff8597;
    cursor: pointer;
  }

  .btn-vader-today:hover {
    background: #dc2626;
    color: #ffffff;
  }

  .day-actions-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    padding-top: 0.85rem;
  }

  .day-stats-text {
    font-size: 0.88rem;
    color: #94a3b8;
  }

  .text-red-glow {
    color: #ff4d6d;
    text-shadow: 0 0 8px rgba(255, 77, 109, 0.5);
  }

  .btn-sm {
    padding: 0.45rem 0.95rem;
    font-size: 0.82rem;
  }

  /* Todos Grid */
  .vader-todos-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    z-index: 1;
  }

  /* Darth Vader Todo Card */
  .vader-todo-card {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
    padding: 1.35rem 1.6rem;
    background: #11121a;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    transition: all 0.25s ease;
    position: relative;
  }

  .vader-todo-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), 0 0 12px rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
  }

  /* URGENT / SKULL CARD STYLING (Totenkopf & Red Lightsaber Pulse) */
  .vader-todo-card.urgent-card {
    border-left: 6px solid #ff0037;
    border-color: rgba(255, 0, 55, 0.5);
    background: linear-gradient(135deg, #1b0a11 0%, #11121a 100%);
    box-shadow: 0 0 20px rgba(255, 0, 55, 0.25), inset 0 0 15px rgba(255, 0, 55, 0.08);
    animation: sith-border-glow 2.5s infinite alternate;
  }

  @keyframes sith-border-glow {
    0% {
      box-shadow: 0 0 15px rgba(255, 0, 55, 0.2), inset 0 0 10px rgba(255, 0, 55, 0.05);
    }
    100% {
      box-shadow: 0 0 28px rgba(255, 0, 55, 0.5), inset 0 0 20px rgba(255, 0, 55, 0.15);
    }
  }

  @keyframes sith-pulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px #ff0037); }
    50% { transform: scale(1.15); filter: drop-shadow(0 0 10px #ff0037); }
  }

  .vader-todo-card.completed-card {
    opacity: 0.5;
    background: #0d0e14;
    border-color: rgba(255, 255, 255, 0.03);
  }

  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badges-left {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    flex-wrap: wrap;
  }

  .vader-cat-badge {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.25rem 0.7rem;
    border-radius: 8px;
    background: #1a1b28;
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .vader-prio-badge {
    font-size: 0.72rem;
    font-weight: 900;
    padding: 0.22rem 0.6rem;
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Skull badge for urgent */
  .prio-urgent-skull {
    background: #3b0d14;
    color: #ff4d6d;
    border: 1px solid #ff0037;
    box-shadow: 0 0 10px rgba(255, 0, 55, 0.5);
    font-weight: 900;
    animation: sith-pulse 2s infinite;
  }

  .prio-high { background: #2e1708; color: #fb923c; border: 1px solid #f97316; }
  .prio-normal { background: #241d08; color: #facc15; border: 1px solid #eab308; }
  .prio-low { background: #0c2417; color: #4ade80; border: 1px solid #22c55e; }

  .vader-recurring-badge {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    background: #181926;
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .card-actions-menu {
    display: flex;
    gap: 0.35rem;
  }

  .btn-card-action {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 0.25rem 0.45rem;
    border-radius: 6px;
    opacity: 0.6;
    transition: all 0.2s ease;
    color: #94a3b8;
  }

  .btn-card-action:hover {
    opacity: 1;
    background: rgba(220, 38, 38, 0.15);
    color: #ffffff;
  }

  .btn-card-action.delete:hover {
    background: rgba(220, 38, 38, 0.3);
    color: #ff4d6d;
  }

  /* Card Main Row & Custom Checkbox */
  .card-main-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .vader-checkbox-wrapper {
    position: relative;
    display: inline-block;
    width: 22px;
    height: 22px;
    margin-top: 0.2rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .vader-main-checkbox {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .vader-custom-checkmark {
    position: absolute;
    inset: 0;
    background: #181926;
    border: 2px solid rgba(220, 38, 38, 0.5);
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .vader-checkbox-wrapper:hover .vader-custom-checkmark {
    border-color: #ff0037;
    box-shadow: 0 0 8px rgba(255, 0, 55, 0.5);
  }

  .vader-main-checkbox:checked ~ .vader-custom-checkmark {
    background: #dc2626;
    border-color: #ff4d6d;
    box-shadow: 0 0 10px #dc2626;
  }

  .vader-main-checkbox:checked ~ .vader-custom-checkmark::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .card-text-content {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex-grow: 1;
  }

  .todo-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    line-height: 1.35;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .todo-title.urgent-title {
    color: #ffffff;
    text-shadow: 0 0 8px rgba(255, 0, 55, 0.4);
  }

  .inline-skull-glow {
    font-size: 1.25rem;
    filter: drop-shadow(0 0 6px #ff0037);
    animation: sith-pulse 1.8s infinite;
  }

  .todo-title.strike {
    text-decoration: line-through;
    color: #64748b;
  }

  .todo-notes {
    font-size: 0.88rem;
    color: #94a3b8;
    line-height: 1.45;
    margin: 0;
  }

  /* Card Meta Row */
  .card-meta-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: #94a3b8;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 0.75rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .date-meta.overdue-meta {
    color: #ff4d6d;
    font-weight: 800;
  }

  .date-meta.today-meta {
    color: #f97316;
    font-weight: 800;
  }

  .relative-time-pill {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.12rem 0.45rem;
    border-radius: 4px;
    background: #181926;
    color: #cbd5e1;
    margin-left: 0.25rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .pill-overdue {
    background: #3b0d14;
    color: #ff4d6d;
    border-color: #ff0037;
    box-shadow: 0 0 6px rgba(255, 0, 55, 0.4);
  }

  .pill-today {
    background: #2e1708;
    color: #fb923c;
    border-color: #f97316;
  }

  .time-tag {
    font-weight: 800;
    color: #ff6b81;
  }

  .assignee-meta {
    font-weight: 700;
    color: #e2e8f0;
  }

  .email-meta {
    color: #60a5fa;
    text-decoration: none;
    font-weight: 700;
  }
  .email-meta:hover {
    text-decoration: underline;
  }

  .link-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .link-btn {
    color: #ff6b81;
    font-weight: 800;
    text-decoration: none;
    background: rgba(220, 38, 38, 0.15);
    border: 1px solid rgba(220, 38, 38, 0.3);
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .link-btn:hover {
    background: #dc2626;
    color: #ffffff;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
  }

  .password-badge {
    background: #241d08;
    color: #facc15;
    border: 1px solid #eab308;
    font-weight: 800;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    font-size: 0.75rem;
  }

  /* Subtasks */
  .subtasks-container {
    background: #141520;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.85rem 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .subtasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .subtasks-title {
    font-size: 0.78rem;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .subtask-progress-mini {
    width: 65px;
    height: 6px;
    background: #1f202e;
    border-radius: 999px;
    overflow: hidden;
  }

  .subtask-progress-fill {
    height: 100%;
    background: #dc2626;
    box-shadow: 0 0 6px #dc2626;
  }

  .subtasks-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .subtask-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }

  .subtask-check-wrap {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    cursor: pointer;
    color: #e2e8f0;
  }

  .subtask-row.sub-completed .subtask-text {
    text-decoration: line-through;
    color: #64748b;
  }

  .btn-del-sub {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    color: #64748b;
  }
  .btn-del-sub:hover {
    color: #ff4d6d;
  }

  .inline-subtask-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .inline-sub-input {
    width: 100%;
    padding: 0.4rem 0.75rem;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    background: #161723;
    font-family: inherit;
    font-size: 0.82rem;
    color: #ffffff;
    outline: none;
  }
  .inline-sub-input:focus {
    border-color: #dc2626;
    box-shadow: 0 0 6px rgba(220, 38, 38, 0.3);
  }

  .btn-sub-add {
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    width: 26px;
    height: 26px;
    cursor: pointer;
    font-weight: 800;
  }

  /* Tags */
  .card-tags-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .tag-pill {
    font-size: 0.72rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.18rem 0.5rem;
    border-radius: 4px;
    font-weight: 700;
  }

  /* Grouped View Styles */
  .grouped-sections-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    z-index: 1;
  }

  .group-section {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    border-bottom: 2px solid rgba(255, 255, 255, 0.08);
    padding-bottom: 0.65rem;
  }

  .group-header h3 {
    font-size: 1.3rem;
    font-weight: 900;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .overdue-section .group-header {
    border-color: #dc2626;
    color: #ff4d6d;
    text-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
  }

  .today-section .group-header {
    border-color: #dc2626;
    color: #ffffff;
  }

  .empty-group-msg {
    font-size: 0.88rem;
    color: #64748b;
    font-style: italic;
  }

  .vader-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4.5rem 2rem;
    text-align: center;
    background: #11121a;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 1;
  }

  .empty-icon {
    font-size: 3.5rem;
    margin-bottom: 0.85rem;
    filter: drop-shadow(0 0 10px #dc2626);
  }

  /* Modal Styles: Imperial Holocron Console */
  .vader-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .vader-modal-card {
    background: #11121a;
    border-radius: 20px;
    max-width: 680px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(220, 38, 38, 0.3);
    border: 1px solid rgba(220, 38, 38, 0.4);
    overflow: hidden;
  }

  .vader-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(135deg, #181926 0%, #1e0910 100%);
  }

  .vader-modal-header h2 {
    font-size: 1.35rem;
    margin: 0;
    font-weight: 900;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-skull {
    color: #dc2626;
  }

  .modal-close-btn {
    background: none;
    border: none;
    font-size: 1.3rem;
    cursor: pointer;
    color: #94a3b8;
  }
  .modal-close-btn:hover {
    color: #ff4d6d;
  }

  .modal-body {
    padding: 1.75rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    background: #11121a;
  }

  .vader-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: #141520;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 800;
    color: #cbd5e1;
  }

  .vader-form-input, .vader-form-select, .vader-form-textarea {
    padding: 0.7rem 0.95rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #181926;
    font-family: inherit;
    font-size: 0.9rem;
    color: #ffffff;
    outline: none;
  }

  .vader-form-input:focus, .vader-form-select:focus, .vader-form-textarea:focus {
    border-color: #dc2626;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.4);
    background: #1d1e2e;
  }

  .prio-select-modal {
    border-color: rgba(220, 38, 38, 0.5);
    color: #ff8597;
  }

  .modal-subtask-add-row {
    display: flex;
    gap: 0.5rem;
  }

  .modal-subtasks-preview {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-top: 0.5rem;
    background: #181926;
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .modal-subtask-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #e2e8f0;
  }

  .btn-del-mini {
    background: none;
    border: none;
    cursor: pointer;
    color: #ff4d6d;
  }

  @media (max-width: 1024px) {
    .vader-kpi-grid {
      grid-template-columns: 1fr 1fr;
    }
    .vader-hero-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .vader-quick-add-bar {
      flex-direction: column;
      align-items: stretch;
    }
    .quick-add-controls {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 640px) {
    .vader-kpi-grid {
      grid-template-columns: 1fr;
    }
    .grid-2 {
      grid-template-columns: 1fr;
    }
    .day-nav-controls {
      flex-direction: column;
    }
  }
</style>
