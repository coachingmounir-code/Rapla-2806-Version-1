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
    if (dateStr < today) return { text: 'Überfällig', isOverdue: true, isToday: false };
    
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
    showToast('Aufgabe erfolgreich hinzugefügt! ✨');
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
      showToast('Aufgabe aktualisiert! ✏️');
    } else {
      adminTodoStore.addTodo(payload);
      showToast('Neue Aufgabe erstellt! ✨');
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
    showToast('Teilaufgabe hinzugefügt! 📋');
  }

  // Reset Confirmation
  function confirmReset() {
    if (confirm('Möchtest du alle Aufgaben auf die Standardliste (aus "Yoga Vidya Aufgaben") zurücksetzen? Eigene Änderungen werden dabei überschrieben.')) {
      adminTodoStore.resetToDefaults();
      showToast('Aufgabenliste aus PDF-Vorlage neu geladen! 🪷');
    }
  }

  // Copy/Export Summary
  function copyDaySummary() {
    const dateLabel = formatDisplayDate(selectedDate);
    const todos = dayViewTodos;
    let text = `📋 YOGA VIDYA NORDSEE – TAGES-TO-DOS (${dateLabel})\n\n`;
    
    if (todos.length === 0) {
      text += `Keine anstehenden Aufgaben für diesen Tag.\n`;
    } else {
      todos.forEach((t, i) => {
        const check = t.completed ? '[x]' : '[ ]';
        const prio = t.priority === 'urgent' || t.priority === 'high' ? '🔥 ' : '';
        const cat = CATEGORY_CONFIG[t.category]?.label || '';
        text += `${i + 1}. ${check} ${prio}${t.title} (${cat})\n`;
        if (t.assignee) text += `   👤 Zuständig: ${t.assignee}\n`;
        if (t.notes) text += `   📝 Info: ${t.notes}\n`;
        if (t.subtasks && t.subtasks.length > 0) {
          t.subtasks.forEach(s => {
            text += `      ${s.completed ? '✓' : '-'} ${s.text}\n`;
          });
        }
      });
    }

    navigator.clipboard.writeText(text);
    showToast('Tagesplan in die Zwischenablage kopiert! 📋');
  }
</script>

{#if isAuthorized}
  <div class="admin-todos-page animate-fade-in">
    <!-- Toast Notification -->
    {#if toastMessage}
      <div class="toast-popup animate-fade-in">
        {toastMessage}
      </div>
    {/if}

    <!-- Hero Header Card -->
    <div class="hero-card">
      <div class="hero-content">
        <div class="hero-badge">
          <span>🔒 ADMIN-BEREICH</span>
          <span class="badge-dot">•</span>
          <span>YOGA VIDYA NORDSEE</span>
        </div>
        <h1>📋 Seminar- & Orga-To-Dos</h1>
        <p class="hero-desc">
          Zentrale Tagesübersicht aller anstehenden Aufgaben rund um Seminarvorbereitung, Dozentenabstimmung, Abrechnung und Sevaka-Planung.
        </p>
      </div>

      <div class="hero-actions">
        <button type="button" class="btn btn-hero-secondary" onclick={confirmReset} title="Setzt die Liste auf die Original-Aufgaben aus dem PDF zurück">
          🔄 Vorlage neu laden
        </button>
        <button type="button" class="btn btn-hero-primary" onclick={openCreateModal}>
          ＋ Neue Aufgabe
        </button>
      </div>
    </div>

    <!-- KPI Statistics Grid -->
    <div class="kpi-grid">
      <button 
        type="button" 
        class="kpi-card glass-card" 
        class:active-kpi={viewMode === 'day' && selectedDate === getTodayStr()}
        onclick={() => { viewMode = 'day'; setDateToToday(); }}
      >
        <div class="kpi-icon-box kpi-today">📅</div>
        <div class="kpi-info">
          <span class="kpi-label">Heute anstehend</span>
          <strong class="kpi-val">{adminTodoStore.todayCount}</strong>
        </div>
      </button>

      <button 
        type="button" 
        class="kpi-card glass-card" 
        class:active-kpi={selectedPriority === 'urgent'}
        onclick={() => { selectedPriority = selectedPriority === 'urgent' ? 'all' : 'urgent'; viewMode = 'all'; }}
      >
        <div class="kpi-icon-box kpi-urgent">🔥</div>
        <div class="kpi-info">
          <span class="kpi-label">Dringend / Wichtig</span>
          <strong class="kpi-val">{adminTodoStore.urgentCount}</strong>
        </div>
      </button>

      <button 
        type="button" 
        class="kpi-card glass-card" 
        class:active-kpi={viewMode === 'all' && selectedCategory === 'all' && selectedPriority === 'all'}
        onclick={() => { viewMode = 'all'; selectedCategory = 'all'; selectedPriority = 'all'; }}
      >
        <div class="kpi-icon-box kpi-pending">⏳</div>
        <div class="kpi-info">
          <span class="kpi-label">Offen gesamt</span>
          <strong class="kpi-val">{adminTodoStore.pendingCount}</strong>
        </div>
      </button>

      <div class="kpi-card glass-card kpi-card-progress">
        <div class="kpi-icon-box kpi-done">✅</div>
        <div class="kpi-info" style="flex-grow: 1;">
          <div class="progress-label-row">
            <span class="kpi-label">Erledigt</span>
            <strong class="kpi-val-sm">{adminTodoStore.completedCount} / {adminTodoStore.totalCount}</strong>
          </div>
          <div class="progress-bar-bg">
            <div 
              class="progress-bar-fill" 
              style="width: {adminTodoStore.totalCount > 0 ? (adminTodoStore.completedCount / adminTodoStore.totalCount) * 100 : 0}%;"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Bar -->
    <div class="quick-add-bar glass-card">
      <div class="quick-add-input-wrap">
        <span class="quick-icon">✍️</span>
        <input 
          type="text" 
          placeholder="Schnelle Aufgabe eingeben... (z. B. Dozent X anrufen, Skripte prüfen...)" 
          bind:value={quickTitle}
          onkeydown={(e) => e.key === 'Enter' && handleQuickAdd()}
          class="quick-input"
        />
      </div>

      <div class="quick-add-controls">
        <select bind:value={quickCategory} class="quick-select" aria-label="Kategorie">
          {#each Object.entries(CATEGORY_CONFIG) as [key, conf]}
            <option value={key}>{conf.icon} {conf.label}</option>
          {/each}
        </select>

        <select bind:value={quickPriority} class="quick-select" aria-label="Priorität">
          <option value="urgent">🔥 Dringend</option>
          <option value="high">⚡ Hoch</option>
          <option value="normal">🟡 Normal</option>
          <option value="low">🟢 Niedrig</option>
        </select>

        <input 
          type="text" 
          placeholder="👤 Zuständig..." 
          bind:value={quickAssignee} 
          class="quick-input-sm"
        />

        <button type="button" class="btn btn-primary btn-quick-add" onclick={handleQuickAdd}>
          ＋ Hinzufügen
        </button>
      </div>
    </div>

    <!-- Main Toolbar & View Switcher -->
    <div class="toolbar-section glass-card">
      <div class="view-mode-tabs">
        <button 
          type="button" 
          class="view-tab-btn" 
          class:active={viewMode === 'day'} 
          onclick={() => viewMode = 'day'}
        >
          📅 Tag-für-Tag Fokus
        </button>
        <button 
          type="button" 
          class="view-tab-btn" 
          class:active={viewMode === 'grouped'} 
          onclick={() => viewMode = 'grouped'}
        >
          🗓️ Nach Frist gruppiert
        </button>
        <button 
          type="button" 
          class="view-tab-btn" 
          class:active={viewMode === 'all'} 
          onclick={() => viewMode = 'all'}
        >
          📑 Alle ({baseFilteredTodos.length})
        </button>
      </div>

      <!-- Search and filters in toolbar -->
      <div class="search-filter-row">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Aufgaben, Namen, Notizen durchsuchen..." 
            bind:value={searchQuery}
            class="search-input"
          />
          {#if searchQuery}
            <button class="clear-search" onclick={() => searchQuery = ''}>✕</button>
          {/if}
        </div>

        <label class="checkbox-label hide-done-toggle">
          <input type="checkbox" bind:checked={showCompleted} />
          <span>Erledigte anzeigen</span>
        </label>
      </div>

      <!-- Category Filter Chips -->
      <div class="category-chips-row">
        <button 
          type="button" 
          class="chip" 
          class:chip-active={selectedCategory === 'all'}
          onclick={() => selectedCategory = 'all'}
        >
          ✨ Alle Kategorien
        </button>
        {#each Object.entries(CATEGORY_CONFIG) as [catKey, conf]}
          {@const count = adminTodoStore.todos.filter(t => t.category === catKey && (!t.completed || showCompleted)).length}
          <button 
            type="button" 
            class="chip" 
            class:chip-active={selectedCategory === catKey}
            onclick={() => selectedCategory = selectedCategory === catKey ? 'all' : catKey as AdminTodoCategory}
          >
            <span>{conf.icon}</span>
            <span>{conf.label}</span>
            <span class="chip-badge">{count}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- DAY-BY-DAY VIEW -->
    {#if viewMode === 'day'}
      <div class="day-navigator-card glass-card">
        <div class="day-nav-controls">
          <button type="button" class="btn-day-nav" onclick={() => shiftDate(-1)}>
            ◀ Vorheriger Tag
          </button>
          
          <div class="date-picker-center">
            <span class="cal-big-icon">📅</span>
            <input 
              type="date" 
              bind:value={selectedDate} 
              class="day-date-input"
            />
            <span class="day-label-formatted">({formatDisplayDate(selectedDate)})</span>
            {#if selectedDate === getTodayStr()}
              <span class="tag-today-badge">HEUTE</span>
            {:else}
              <button type="button" class="btn-goto-today" onclick={setDateToToday}>
                Zu Heute springen
              </button>
            {/if}
          </div>

          <button type="button" class="btn-day-nav" onclick={() => shiftDate(1)}>
            Nächster Tag ▶
          </button>
        </div>

        <div class="day-actions-row">
          <span class="day-stats-text">
            <strong>{dayViewTodos.filter(t => !t.completed).length} offene</strong> von {dayViewTodos.length} Aufgaben für diesen Tag
          </span>
          <button type="button" class="btn btn-secondary btn-sm" onclick={copyDaySummary}>
            📋 Tagesplan kopieren
          </button>
        </div>
      </div>

      <!-- Day Tasks List -->
      {#if dayViewTodos.length === 0}
        <div class="empty-state-card glass-card">
          <span class="empty-icon">🪷</span>
          <h3>Keine Aufgaben für diesen Tag</h3>
          <p>Für den {formatDisplayDate(selectedDate)} sind aktuell keine To-Dos hinterlegt.</p>
          <button type="button" class="btn btn-primary" onclick={openCreateModal} style="margin-top: 1rem;">
            ＋ Aufgabe für diesen Tag anlegen
          </button>
        </div>
      {:else}
        <div class="todos-grid">
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
              <span class="group-icon">⚠️</span>
              <h3>Überfällige Aufgaben ({groupedTodos.overdue.length})</h3>
            </div>
            <div class="todos-grid">
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
            <p class="empty-group-msg">Keine offenen Aufgaben für heute fällig.</p>
          {:else}
            <div class="todos-grid">
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
            <h3>Anstehende Termine & Aufgaben ({groupedTodos.upcoming.length})</h3>
          </div>
          {#if groupedTodos.upcoming.length === 0}
            <p class="empty-group-msg">Keine weiteren anstehenden Aufgaben gefunden.</p>
          {:else}
            <div class="todos-grid">
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
              <h3>Ohne festes Datum / Kontinuierlich ({groupedTodos.undated.length})</h3>
            </div>
            <div class="todos-grid">
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
        <div class="empty-state-card glass-card">
          <span class="empty-icon">🔍</span>
          <h3>Keine Aufgaben gefunden</h3>
          <p>Passe deine Filterkriterien an oder erstelle eine neue Aufgabe.</p>
        </div>
      {:else}
        <div class="todos-grid">
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

  <div 
    class="todo-card glass-card" 
    class:completed-card={todo.completed}
    class:urgent-card={todo.priority === 'urgent' && !todo.completed}
  >
    <!-- Top Header: Category & Priority Badges -->
    <div class="card-top-row">
      <div class="badges-left">
        <span class="cat-badge" style="background-color: {catConf.bg}; color: {catConf.color};">
          {catConf.icon} {catConf.label}
        </span>
        <span class="prio-badge {prioConf.badgeClass}">
          {prioConf.icon} {prioConf.label}
        </span>
        {#if todo.recurringRule}
          <span class="recurring-badge">
            🔄 {todo.recurringRule}
          </span>
        {/if}
      </div>

      <div class="card-actions-menu">
        <button type="button" class="btn-card-action" onclick={() => openEditModal(todo)} title="Bearbeiten">
          ✏️
        </button>
        <button type="button" class="btn-card-action delete" onclick={() => adminTodoStore.deleteTodo(todo.id)} title="Löschen">
          🗑️
        </button>
      </div>
    </div>

    <!-- Main Title & Checkbox -->
    <div class="card-main-row">
      <label class="todo-checkbox-wrapper">
        <input 
          type="checkbox" 
          checked={todo.completed} 
          onchange={() => adminTodoStore.toggleTodo(todo.id)}
          class="main-checkbox"
        />
        <span class="custom-checkbox"></span>
      </label>

      <div class="card-text-content">
        <h4 class="todo-title" class:strike={todo.completed}>
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
            {relDate.text}
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
            🔗 Link öffnen
          </a>
          {#if todo.linkPassword}
            <span class="password-badge" title="Passwort für Umfrage / Seite">
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
          <span class="subtasks-title">Teilaufgaben ({completedSubtasks}/{totalSubtasks})</span>
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
                title="Teilaufgabe entfernen"
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
        placeholder="＋ Teilaufgabe / Checkpunkt hinzufügen..." 
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

<!-- Create / Edit Full Modal -->
{#if isModalOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop" onclick={() => isModalOpen = false}>
    <div class="modal-card glass-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{editingTodoId ? '✏️ Aufgabe bearbeiten' : '＋ Neue Seminar- & Orga-Aufgabe'}</h2>
        <button class="modal-close-btn" onclick={() => isModalOpen = false}>✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="modal-title">Aufgabentitel *</label>
          <input 
            id="modal-title" 
            type="text" 
            class="form-input" 
            placeholder="z. B. Teilnehmer für Weiterbildung kontaktieren..." 
            bind:value={modalTitle}
            required
          />
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-category">Kategorie</label>
            <select id="modal-category" class="form-select" bind:value={modalCategory}>
              {#each Object.entries(CATEGORY_CONFIG) as [key, conf]}
                <option value={key}>{conf.icon} {conf.label}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="modal-priority">Priorität</label>
            <select id="modal-priority" class="form-select" bind:value={modalPriority}>
              <option value="urgent">🔥 Dringend</option>
              <option value="high">⚡ Hoch</option>
              <option value="normal">🟡 Normal</option>
              <option value="low">🟢 Niedrig</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-due-date">Fälligkeitsdatum (Tag)</label>
            <input 
              id="modal-due-date" 
              type="date" 
              class="form-input" 
              bind:value={modalDueDate}
            />
          </div>

          <div class="form-group">
            <label for="modal-due-time">Uhrzeit (Optional)</label>
            <input 
              id="modal-due-time" 
              type="time" 
              class="form-input" 
              bind:value={modalDueTime}
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-assignee">Zuständige Person (Sevaka / Dozent)</label>
            <input 
              id="modal-assignee" 
              type="text" 
              class="form-input" 
              placeholder="z. B. Karuna, Susan, Christian..." 
              bind:value={modalAssignee}
            />
          </div>

          <div class="form-group">
            <label for="modal-contact">Kontakt-Email</label>
            <input 
              id="modal-contact" 
              type="email" 
              class="form-input" 
              placeholder="z. B. name@gmx.de" 
              bind:value={modalContactEmail}
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="modal-link">Web-Link (URL)</label>
            <input 
              id="modal-link" 
              type="url" 
              class="form-input" 
              placeholder="https://..." 
              bind:value={modalLinkUrl}
            />
          </div>

          <div class="form-group">
            <label for="modal-password">Passwort / Code (Optional)</label>
            <input 
              id="modal-password" 
              type="text" 
              class="form-input" 
              placeholder="z. B. Ganga108" 
              bind:value={modalLinkPassword}
            />
          </div>
        </div>

        <div class="form-group">
          <label for="modal-recurring">Wiederholungsregel</label>
          <input 
            id="modal-recurring" 
            type="text" 
            class="form-input" 
            placeholder="z. B. Jeden Mittwoch & Samstag, Wöchentlich montags..." 
            bind:value={modalRecurringRule}
          />
        </div>

        <div class="form-group">
          <label for="modal-notes">Notizen & Beschreibung</label>
          <textarea 
            id="modal-notes" 
            class="form-textarea" 
            rows="3" 
            placeholder="Zusätzliche Details, Raumangaben, Telefonnummern oder Anweisungen..."
            bind:value={modalNotes}
          ></textarea>
        </div>

        <!-- Subtasks in Modal -->
        <div class="form-group">
          <label for="modal-subtask-in">Checkliste / Teilaufgaben</label>
          <div class="modal-subtask-add-row">
            <input 
              id="modal-subtask-in"
              type="text" 
              class="form-input" 
              placeholder="Neuen Checkpunkt hinzufügen..." 
              bind:value={modalNewSubtaskText}
              onkeydown={(e) => e.key === 'Enter' && handleModalAddSubtask()}
            />
            <button type="button" class="btn btn-secondary" onclick={handleModalAddSubtask}>
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
            class="form-input" 
            placeholder="z. B. Ausbildung, Susan, YLA, Rezi" 
            bind:value={modalTags}
          />
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick={() => isModalOpen = false}>
          Abbrechen
        </button>
        <button type="button" class="btn btn-primary" onclick={handleSaveModal}>
          💾 {editingTodoId ? 'Änderungen speichern' : 'Aufgabe erstellen'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .admin-todos-page {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    font-family: 'Outfit', sans-serif;
    color: var(--text-primary);
  }

  /* Toast notification */
  .toast-popup {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: #1f2937;
    color: #ffffff;
    padding: 0.85rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    font-weight: 600;
    font-size: 0.95rem;
  }

  /* Hero Header */
  .hero-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, rgba(150, 0, 64, 0.92) 0%, rgba(217, 119, 36, 0.88) 100%);
    border-radius: 20px;
    padding: 2.25rem 2.5rem;
    color: #ffffff;
    box-shadow: 0 10px 30px rgba(150, 0, 64, 0.15);
    position: relative;
    overflow: hidden;
  }

  .hero-content {
    max-width: 680px;
    z-index: 2;
  }

  .hero-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    width: fit-content;
    margin-bottom: 0.75rem;
    backdrop-filter: blur(4px);
  }

  .badge-dot {
    opacity: 0.7;
  }

  .hero-content h1 {
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
    color: #ffffff;
  }

  .hero-desc {
    font-size: 0.95rem;
    opacity: 0.95;
    line-height: 1.45;
    margin: 0;
  }

  .hero-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    z-index: 2;
  }

  .btn-hero-primary {
    background: #ffffff;
    color: var(--primary);
    font-weight: 700;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: var(--transition-smooth);
  }

  .btn-hero-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .btn-hero-secondary {
    background: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    font-weight: 600;
    padding: 0.75rem 1.15rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: var(--transition-smooth);
  }

  .btn-hero-secondary:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
  }

  .kpi-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    cursor: pointer;
    text-align: left;
    transition: var(--transition-smooth);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-main);
    border-color: var(--primary);
  }

  .kpi-card.active-kpi {
    border-color: var(--primary);
    background: #fff7ed;
    box-shadow: 0 0 0 2px rgba(150, 0, 64, 0.15);
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
  }

  .kpi-today { background: #eff6ff; }
  .kpi-urgent { background: #fef2f2; }
  .kpi-pending { background: #fefce8; }
  .kpi-done { background: #f0fdf4; }

  .kpi-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .kpi-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .kpi-val {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .kpi-val-sm {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .kpi-card-progress {
    cursor: default;
  }
  .kpi-card-progress:hover {
    transform: none;
    border-color: var(--border-color);
  }

  .progress-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .progress-bar-bg {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  /* Quick Add Bar */
  .quick-add-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 12px rgba(150, 0, 64, 0.03);
  }

  .quick-add-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-grow: 1;
    min-width: 280px;
  }

  .quick-icon {
    font-size: 1.2rem;
    opacity: 0.8;
  }

  .quick-input {
    width: 100%;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-primary);
    background: transparent;
  }

  .quick-add-controls {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .quick-select, .quick-input-sm {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: #fafaf9;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .quick-input-sm {
    width: 130px;
  }

  .btn-quick-add {
    padding: 0.55rem 1.15rem;
    font-size: 0.88rem;
    white-space: nowrap;
  }

  /* Toolbar Section */
  .toolbar-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }

  .view-mode-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
  }

  .view-tab-btn {
    padding: 0.55rem 1.15rem;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .view-tab-btn:hover {
    background: #fafaf9;
    color: var(--text-primary);
  }

  .view-tab-btn.active {
    background: var(--primary);
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(150, 0, 64, 0.2);
  }

  .search-filter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 500px;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    font-size: 0.95rem;
    opacity: 0.6;
  }

  .search-input {
    width: 100%;
    padding: 0.55rem 0.85rem 0.55rem 2.35rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #fafaf9;
    font-family: inherit;
    font-size: 0.88rem;
    color: var(--text-primary);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--primary);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(150, 0, 64, 0.08);
  }

  .clear-search {
    position: absolute;
    right: 0.65rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    opacity: 0.6;
  }

  .hide-done-toggle {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
  }

  .category-chips-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: #fafaf9;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .chip:hover {
    background: #fff9e6;
    color: var(--text-primary);
    border-color: #ffe082;
  }

  .chip.chip-active {
    background: #960040;
    color: #ffffff;
    border-color: #960040;
  }

  .chip-badge {
    font-size: 0.7rem;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.08);
    font-weight: 700;
  }

  .chip.chip-active .chip-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  /* Day Navigator */
  .day-navigator-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
  }

  .day-nav-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .btn-day-nav {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: #fafaf9;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-smooth);
  }

  .btn-day-nav:hover {
    background: #f4ece1;
    border-color: var(--accent);
  }

  .date-picker-center {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .cal-big-icon {
    font-size: 1.3rem;
  }

  .day-date-input {
    padding: 0.45rem 0.75rem;
    border-radius: 8px;
    border: 1.5px solid var(--primary);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    color: var(--primary);
    background: #fff7ed;
  }

  .day-label-formatted {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .tag-today-badge {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    background: #10b981;
    color: #ffffff;
    letter-spacing: 0.05em;
  }

  .btn-goto-today {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--primary);
    cursor: pointer;
  }

  .day-actions-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px dashed var(--border-color);
    padding-top: 0.75rem;
  }

  .day-stats-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  /* Todos Grid & Card Styling */
  .todos-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .todo-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1.25rem 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    transition: var(--transition-smooth);
    position: relative;
  }

  .todo-card:hover {
    box-shadow: var(--shadow-main);
    border-color: #ffd299;
  }

  .todo-card.urgent-card {
    border-left: 6px solid #ef4444;
    background: #fffdfd;
  }

  .todo-card.completed-card {
    opacity: 0.65;
    background: #f9fafb;
  }

  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .badges-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .cat-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .prio-badge {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    text-transform: uppercase;
  }

  .prio-urgent { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .prio-high { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
  .prio-normal { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
  .prio-low { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

  .recurring-badge {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    background: #f3f4f6;
    color: #4b5563;
  }

  .card-actions-menu {
    display: flex;
    gap: 0.35rem;
  }

  .btn-card-action {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0.25rem 0.45rem;
    border-radius: 6px;
    opacity: 0.6;
    transition: var(--transition-smooth);
  }

  .btn-card-action:hover {
    opacity: 1;
    background: #f4ece1;
  }

  .btn-card-action.delete:hover {
    background: #fee2e2;
  }

  /* Main Row */
  .card-main-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .todo-checkbox-wrapper {
    position: relative;
    cursor: pointer;
    margin-top: 0.15rem;
  }

  .main-checkbox {
    width: 22px;
    height: 22px;
    accent-color: var(--primary);
    cursor: pointer;
  }

  .card-text-content {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex-grow: 1;
  }

  .todo-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.35;
  }

  .todo-title.strike {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .todo-notes {
    font-size: 0.88rem;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0;
  }

  /* Meta Row */
  .card-meta-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: var(--text-secondary);
    border-top: 1px solid rgba(234, 217, 201, 0.5);
    padding-top: 0.65rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .date-meta.overdue-meta {
    color: #b91c1c;
    font-weight: 700;
  }

  .date-meta.today-meta {
    color: #d97724;
    font-weight: 700;
  }

  .relative-time-pill {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    background: #f3f4f6;
    color: #4b5563;
    margin-left: 0.25rem;
  }

  .pill-overdue {
    background: #fee2e2;
    color: #b91c1c;
  }

  .pill-today {
    background: #ffedd5;
    color: #c2410c;
  }

  .time-tag {
    font-weight: 700;
    color: var(--primary);
  }

  .assignee-meta {
    font-weight: 600;
    color: var(--text-primary);
  }

  .email-meta {
    color: #2563eb;
    text-decoration: none;
    font-weight: 600;
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
    color: #960040;
    font-weight: 700;
    text-decoration: none;
    background: rgba(150, 0, 64, 0.08);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  .link-btn:hover {
    background: rgba(150, 0, 64, 0.15);
  }

  .password-badge {
    background: #fef08a;
    color: #854d0e;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
    font-size: 0.75rem;
  }

  /* Subtasks */
  .subtasks-container {
    background: #fafaf9;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .subtasks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .subtasks-title {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
  }

  .subtask-progress-mini {
    width: 60px;
    height: 5px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
  }

  .subtask-progress-fill {
    height: 100%;
    background: #10b981;
  }

  .subtasks-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
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
    gap: 0.5rem;
    cursor: pointer;
  }

  .subtask-row.sub-completed .subtask-text {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .btn-del-sub {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.75rem;
    opacity: 0.4;
  }
  .btn-del-sub:hover {
    opacity: 1;
    color: #ef4444;
  }

  .inline-subtask-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .inline-sub-input {
    width: 100%;
    padding: 0.35rem 0.65rem;
    border: 1px dashed var(--border-color);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 0.8rem;
  }
  .inline-sub-input:focus {
    outline: none;
    border-color: var(--primary);
    background: #ffffff;
  }

  .btn-sub-add {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-weight: 700;
  }

  /* Tags */
  .card-tags-row {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .tag-pill {
    font-size: 0.72rem;
    color: var(--text-secondary);
    background: rgba(0, 0, 0, 0.04);
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-weight: 600;
  }

  /* Grouped View Styles */
  .grouped-sections-wrapper {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .group-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .group-header h3 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0;
  }

  .overdue-section .group-header {
    border-color: #fca5a5;
    color: #b91c1c;
  }

  .today-section .group-header {
    border-color: var(--primary);
    color: var(--primary);
  }

  .empty-group-msg {
    font-size: 0.88rem;
    color: var(--text-secondary);
    font-style: italic;
  }

  .empty-state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background: #ffffff;
    border-radius: 20px;
    border: 1px solid var(--border-color);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 20px;
    max-width: 680px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.75rem;
    border-bottom: 1px solid var(--border-color);
    background: #fafaf9;
  }

  .modal-header h2 {
    font-size: 1.35rem;
    margin: 0;
    font-weight: 800;
  }

  .modal-close-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.6;
  }
  .modal-close-btn:hover {
    opacity: 1;
  }

  .modal-body {
    padding: 1.75rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.25rem 1.75rem;
    border-top: 1px solid var(--border-color);
    background: #fafaf9;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .form-input, .form-select, .form-textarea {
    padding: 0.65rem 0.85rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: #fafaf9;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--text-primary);
  }

  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--primary);
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(150, 0, 64, 0.08);
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
    background: #fafaf9;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .modal-subtask-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
  }

  .btn-del-mini {
    background: none;
    border: none;
    cursor: pointer;
    color: #ef4444;
  }

  @media (max-width: 1024px) {
    .kpi-grid {
      grid-template-columns: 1fr 1fr;
    }
    .hero-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .quick-add-bar {
      flex-direction: column;
      align-items: stretch;
    }
    .quick-add-controls {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 640px) {
    .kpi-grid {
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
