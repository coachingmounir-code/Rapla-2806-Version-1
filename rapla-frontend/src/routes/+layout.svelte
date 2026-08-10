<script lang="ts">
	import '../global.css';
	import favicon from '$lib/assets/favicon.svg';
	import nataraja from '$lib/assets/nataraja.jpg';
	import { onMount } from 'svelte';
	import { todoManager } from '$lib/todoStore';

	let { children } = $props();

	function getCategoryLabel(cat: string) {
		switch (cat) {
			case 'check': return '🔍 Prüfen';
			case 'prepare': return '🛠️ Vorbereiten';
			case 'communicate': return '💬 Kommunizieren';
			case 'materials': return '📦 Material';
			default: return '📋 Aufgabe';
		}
	}

	// Simple client-side page tracking
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	let showTeachersDropdown = $state(false);
	let showScheduleDropdown = $state(false);
	let mobileMenuOpen = $state(false);

	let userRole = $state<string | null>(null);
	let authChecked = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const path = page.url.pathname;
		mobileMenuOpen = false; // close mobile menu on page navigation
		if (path.startsWith('/sevakas') || path.startsWith('/teachers')) {
			showTeachersDropdown = true;
		}
		if (path.startsWith('/schedule') || path.startsWith('/ai-planning')) {
			showScheduleDropdown = true;
		}

		const storedRole = localStorage.getItem('rapla_user_role');
		userRole = storedRole;
		
		if (!storedRole) {
			if (path !== '/login') {
				goto('/login');
			}
		} else if (storedRole === 'team') {
			if (!path.startsWith('/wochenplan') && path !== '/login') {
				goto('/wochenplan');
			}
		} else if (storedRole === 'admin' || storedRole === 'viewer') {
			if (path === '/login') {
				goto('/');
			}
		}
		authChecked = true;
	});

	let isSyncing = $state(false);

	async function syncData() {
		if (isSyncing) return;
		isSyncing = true;
		// Sync wishes from server JSON to localStorage
		try {
			const wishesRes = await fetch('/api/sevakas-wishes');
			if (wishesRes.ok) {
				const wishes = await wishesRes.json();
				if (wishes && wishes.length > 0) {
					const savedTeachers = localStorage.getItem('rapla_teachers');
					if (savedTeachers) {
						const teachers = JSON.parse(savedTeachers);
						let updated = false;
						for (const wish of wishes) {
							const idx = teachers.findIndex((t: any) => t.id === wish.id || t.name === wish.name);
							if (idx !== -1) {
								teachers[idx].rules = { ...teachers[idx].rules, ...wish.rules };
								if (wish.availabilityMode) teachers[idx].availabilityMode = wish.availabilityMode;
								if (wish.specialties) teachers[idx].specialties = wish.specialties;
								teachers[idx].customWishes = wish.customWishes; // sync custom wishes field
								updated = true;
							}
						}
						if (updated) {
							localStorage.setItem('rapla_teachers', JSON.stringify(teachers));
						}
					}
				}
			}
		} catch (e) {
			console.error('Failed to sync wishes:', e);
		}

		// Sync absences from server JSON to localStorage
		try {
			const absencesRes = await fetch('/api/sevafrei');
			if (absencesRes.ok) {
				const serverAbsences = await absencesRes.json();
				if (serverAbsences && serverAbsences.length > 0) {
					const localAbsencesStr = localStorage.getItem('rapla_sevafrei') || '[]';
					const localAbsences = JSON.parse(localAbsencesStr);
					let updated = false;
					for (const sAbs of serverAbsences) {
						const idx = localAbsences.findIndex((a: any) => a.id === sAbs.id);
						if (idx !== -1) {
							localAbsences[idx] = sAbs;
							updated = true;
						} else {
							localAbsences.push(sAbs);
							updated = true;
						}
					}
					if (updated) {
						localStorage.setItem('rapla_sevafrei', JSON.stringify(localAbsences));
					}
				}
			}
		} catch (e) {
			console.error('Failed to sync absences:', e);
		}
		
		// Small delay to make the sync animation visible
		setTimeout(() => {
			isSyncing = false;
			// Reload page to reflect changes if manually triggered
			if (typeof window !== 'undefined' && userRole) {
				// Don't reload on mount, but reload when button is explicitly clicked
			}
		}, 600);
	}

	onMount(() => {
		syncData();
		
		todoManager.checkReminders();
		const interval = setInterval(() => {
			todoManager.checkReminders();
		}, 10000);
		
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<link rel="icon" href="https://www.yoga-vidya.de/typo3conf/ext/of_customisation/Resources/Public/Icons/favicon_icon.ico" />
	<title>Yoga Vidya Rapla 2.0</title>
</svelte:head>

{#if authChecked}
	{#if userRole === 'admin' || userRole === 'viewer' || (userRole === 'team' && page.url.pathname.startsWith('/wochenplan')) || page.url.pathname === '/login'}
		{#if page.url.pathname.startsWith('/wochenplan') || page.url.pathname === '/login'}
			{@render children()}
		{:else}
			<div class="layout-container">
				{#if mobileMenuOpen}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="sidebar-backdrop" onclick={() => mobileMenuOpen = false}></div>
				{/if}
				<!-- Sidebar Navigation - Inspired by Yoga Vidya Nordsee branding -->
				<aside class="sidebar" class:open={mobileMenuOpen}>
					<div class="logo-area">
						<div class="logo-img-wrapper">
							<img src={nataraja} alt="Yoga Vidya Logo" class="logo-img" />
						</div>
						<div class="logo-text">
							<h2>YOGA VIDYA</h2>
							<span>NORDSEE</span>
						</div>
					</div>

					<!-- Swami Teachings Quote -->
					<div class="logo-teachings">
						<p>"To serve, to love, to give, to purify, to meditate, to realize."</p>
					</div>

					<nav class="nav-menu">
						<a href="/" class="nav-item" class:active={page.url.pathname === '/'}>
							<span class="nav-icon">🏠</span>
							<span class="nav-label">Kommende Seminare</span>
						</a>
						<!-- Wochenplan & KI-Vorplanung Dropdown Menu -->
						<div class="nav-dropdown-container">
							<button 
								type="button" 
								class="nav-item nav-dropdown-trigger" 
								class:active={page.url.pathname.startsWith('/schedule') || page.url.pathname.startsWith('/ai-planning')}
								onclick={() => showScheduleDropdown = !showScheduleDropdown}
							>
								<span class="nav-icon">📅</span>
								<span class="nav-label">Wochenplan</span>
								<span class="dropdown-arrow">{showScheduleDropdown ? '▼' : '▶'}</span>
							</button>
							
							{#if showScheduleDropdown}
								<div class="nav-dropdown-menu">
									<a 
										href="/schedule" 
										class="nav-dropdown-item" 
										class:active={page.url.pathname.startsWith('/schedule')}
									>
										<span class="nav-icon">📆</span>
										<span class="nav-label">Wochenplan</span>
									</a>
									<a 
										href="/ai-planning" 
										class="nav-dropdown-item" 
										class:active={page.url.pathname.startsWith('/ai-planning')}
									>
										<span class="nav-icon">⚡</span>
										<span class="nav-label">KI-Vorplanung</span>
									</a>
								</div>
							{/if}
						</div>
						
						<!-- Sevafrei Kalender als eigener Hauptreiter -->
						<a 
							href="/sevafrei" 
							class="nav-item" 
							class:active={page.url.pathname.startsWith('/sevafrei')}
						>
							<span class="nav-icon">🏖️</span>
							<span class="nav-label">Sevafrei Kalender</span>
						</a>
						
						<!-- Combined Teachers Dropdown Menu -->
						<div class="nav-dropdown-container">
							<button 
								type="button" 
								class="nav-item nav-dropdown-trigger" 
								class:active={page.url.pathname.startsWith('/sevakas') || page.url.pathname.startsWith('/teachers')}
								onclick={() => showTeachersDropdown = !showTeachersDropdown}
							>
								<span class="nav-icon">🧘</span>
								<span class="nav-label">Unterrichtende</span>
								<span class="dropdown-arrow">{showTeachersDropdown ? '▼' : '▶'}</span>
							</button>
							
							{#if showTeachersDropdown}
								<div class="nav-dropdown-menu">
									<a 
										href="/sevakas" 
										class="nav-dropdown-item" 
										class:active={page.url.pathname.startsWith('/sevakas')}
									>
										<span class="nav-icon">👥</span>
										<span class="nav-label">Sevakas</span>
									</a>
									<a 
										href="/teachers" 
										class="nav-dropdown-item" 
										class:active={page.url.pathname.startsWith('/teachers')}
									>
										<span class="nav-icon">👤</span>
										<span class="nav-label">Externe Seminarleiter</span>
									</a>
								</div>
							{/if}
						</div>

						<a 
							href="/settings" 
							class="nav-item" 
							class:active={page.url.pathname === '/settings'}
						>
							<span class="nav-icon">⚙️</span>
							<span class="nav-label">Einstellungen</span>
						</a>

						<!-- Snycronisations Button -->
						<button 
							type="button" 
							class="nav-item sync-action-btn" 
							class:syncing={isSyncing}
							onclick={() => {
								syncData().then(() => {
									// Optional: window.location.reload() to refresh the data on the current page immediately
									window.location.reload();
								});
							}}
							disabled={isSyncing}
							title="Lade neueste Urlaube & Wünsche neu vom Server"
						>
							<span class="nav-icon icon-spin" class:spinning={isSyncing}>🔄</span>
							<span class="nav-label">{isSyncing ? 'Synchronisiere...' : 'Daten synchronisieren'}</span>
						</button>
					</nav>

					<!-- Bottom Greeting Card & Brand Slogan -->
					<div class="sidebar-footer">
						<button 
							type="button" 
							class="logout-sidebar-btn" 
							onclick={() => {
								localStorage.removeItem('rapla_user_role');
								goto('/login');
							}}
						>
							🚪 Abmelden
						</button>
						<div class="namaste-card" style="margin-top: 0.75rem;">
							<!-- Simple meditating outline or icon -->
							<svg class="meditation-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<circle cx="50" cy="30" r="8" fill="none" stroke="var(--text-secondary)" stroke-width="2" />
								<path d="M50 38 L50 60 L38 52 M50 60 L62 52" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" fill="none" />
								<path d="M30 75 C30 65 40 60 50 60 C60 60 70 65 70 75" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" fill="none" />
								<path d="M25 80 C35 78 65 78 75 80" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" fill="none" />
							</svg>
							<div class="namaste-text">
								<p class="teach-item">Be good</p>
								<p class="teach-item">Do good</p>
								<p class="teach-item">Be kind</p>
								<p class="teach-item">Be pure</p>
								<p class="teach-item">Be truthful</p>
							</div>
						</div>
					</div>
				</aside>

				<!-- Main Content Area -->
				<main class="main-content">
					<!-- Header Search Bar & User info -->
					<header class="top-header">
						<button 
							type="button" 
							class="hamburger-menu" 
							onclick={() => mobileMenuOpen = !mobileMenuOpen} 
							aria-label="Menü öffnen"
						>
							☰
						</button>
						<div class="studio-selector">
							<strong>Yoga Vidya Rapla 2.0</strong>
							<span class="selector-arrow">˅</span>
						</div>
					</header>

					<div class="content-wrapper">
						{@render children()}
					</div>
				</main>
			</div>
		{/if}
	{/if}

	{#if todoManager.activeReminder}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="global-reminder-overlay" onclick={() => todoManager.dismissReminder(todoManager.activeReminder!.id)}>
			<div class="global-reminder-card glass-card" onclick={(e) => e.stopPropagation()}>
				<div class="reminder-header">
					<span class="reminder-icon">⏰</span>
					<h3>Seminar-Aufgabe fällig</h3>
				</div>
				<div class="reminder-body">
					<p class="reminder-seminar">Seminar: <strong>{todoManager.activeReminder.seminarTitle}</strong> ({todoManager.activeReminder.seminarDate})</p>
					<div class="reminder-task-box">
						<span class="category-badge {todoManager.activeReminder.category}">
							{getCategoryLabel(todoManager.activeReminder.category)}
						</span>
						<p class="reminder-text">{todoManager.activeReminder.text}</p>
					</div>
				</div>
				<div class="reminder-footer">
					<button type="button" class="btn btn-secondary btn-snooze" onclick={() => todoManager.snoozeTodo(todoManager.activeReminder!.id)}>
						💤 Später (15 Min.)
					</button>
					<button type="button" class="btn btn-primary btn-done" onclick={() => {
						todoManager.toggleTodo(todoManager.activeReminder!.id);
						todoManager.activeReminder = null;
					}}>
						✓ Erledigt
					</button>
					<button type="button" class="btn btn-close-rem" onclick={() => todoManager.dismissReminder(todoManager.activeReminder!.id)}>
						Ausblenden
					</button>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="auth-loading-screen">
		<div class="spinner"></div>
		<p style="margin-top: 1rem; font-family: 'Outfit', sans-serif;">Yoga Vidya Rapla 2.0 wird geladen...</p>
	</div>
{/if}

<style>
	.layout-container {
		display: flex;
		min-height: 100vh;
		background-color: var(--bg-main);
	}

	.sidebar {
		width: 250px;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
		display: flex;
		flex-direction: column;
		padding: 2rem 1.25rem;
		z-index: 100;
		background-color: var(--secondary); /* Light warm Sand/Beige sidebar */
		color: var(--text-primary);
		border-right: 1px solid var(--border-color);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.logo-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.logo-img-wrapper {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
		background-color: #f7f2eb;
		box-shadow: var(--shadow-main);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: var(--transition-smooth);
	}

	.logo-img-wrapper:hover {
		transform: scale(1.05);
		border-color: var(--primary);
		box-shadow: var(--shadow-glow);
	}

	.logo-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		transform: scale(1.25);
		transition: var(--transition-smooth);
	}

	.logo-img-wrapper:hover .logo-img {
		transform: scale(1.35);
	}

	.logo-text h2 {
		font-family: 'Outfit', sans-serif;
		font-size: 1.25rem;
		font-weight: 800;
		color: #960040;
		letter-spacing: 0.05em;
		line-height: 1.2;
		margin: 0;
	}

	.logo-text span {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.logo-teachings {
		font-size: 0.75rem;
		font-style: italic;
		color: var(--text-secondary);
		line-height: 1.4;
		text-align: center;
		margin-bottom: 1.5rem;
		padding: 0 0.5rem;
		border-bottom: 1px solid rgba(234, 217, 201, 0.6);
		padding-bottom: 0.75rem;
	}

	.nav-menu {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		flex-grow: 1;
		overflow-y: auto;
	}

	.nav-menu::-webkit-scrollbar {
		width: 4px;
	}
	.nav-menu::-webkit-scrollbar-thumb {
		background: rgba(217, 119, 36, 0.15);
		border-radius: 2px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.85rem;
		color: var(--text-secondary);
		text-decoration: none;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.9rem;
		transition: var(--transition-smooth);
	}

	.nav-item:hover {
		color: var(--text-primary);
		background: rgba(234, 217, 201, 0.5);
	}

	.nav-item.active {
		color: #ffffff;
		background: var(--primary); /* Active solid Saffron background */
		box-shadow: 0 4px 12px 0 rgba(217, 119, 36, 0.25);
	}

	.nav-icon {
		font-size: 1.1rem;
	}

	.sidebar-footer {
		margin-top: auto;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(234, 217, 201, 0.6);
	}

	.namaste-card {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		background: rgba(255, 255, 255, 0.45);
		border: 1px solid rgba(234, 217, 201, 0.8);
		border-radius: 12px;
		padding: 0.75rem 1rem;
	}

	.meditation-icon-svg {
		width: 32px;
		height: 32px;
		color: var(--text-secondary);
	}

	.namaste-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.teach-item {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-secondary);
		line-height: 1.2;
	}

	.main-content {
		margin-left: 250px;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	/* Top Header Bar */
	.top-header {
		height: 70px;
		background: #ffffff;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 2.5rem;
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.studio-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.selector-arrow {
		font-size: 0.7rem;
		color: var(--text-secondary);
	}





	.content-wrapper {
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
		padding: 2.5rem;
	}

	/* Navigation Dropdown Styles */
	.nav-dropdown-container {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.nav-dropdown-trigger {
		background: transparent;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		position: relative;
	}

	.dropdown-arrow {
		margin-left: auto;
		font-size: 0.7rem;
		opacity: 0.7;
		transition: transform 0.2s ease;
	}

	.nav-dropdown-trigger.active {
		color: var(--text-primary);
		background: rgba(234, 217, 201, 0.4);
	}

	.nav-dropdown-menu {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-left: 1.25rem;
		border-left: 2px solid rgba(234, 217, 201, 0.4);
		margin-left: 1.25rem;
		margin-top: 0.1rem;
		margin-bottom: 0.25rem;
	}

	.nav-dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.5rem 0.75rem;
		color: var(--text-secondary);
		text-decoration: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.85rem;
		transition: var(--transition-smooth);
	}

	.nav-dropdown-item:hover {
		color: var(--text-primary);
		background: rgba(234, 217, 201, 0.4);
	}

	.nav-dropdown-item.active {
		color: #ffffff;
		background: var(--primary);
		box-shadow: 0 3px 8px 0 rgba(217, 119, 36, 0.15);
	}

	.sidebar-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(42, 27, 27, 0.35);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 999;
	}

	.hamburger-menu {
		display: none;
	}

	@media (max-width: 1024px) {
		.sidebar {
			transform: translateX(-100%);
			z-index: 1000;
		}
		.sidebar.open {
			transform: translateX(0);
		}
		.main-content {
			margin-left: 0 !important;
		}
		.hamburger-menu {
			display: flex;
			align-items: center;
			justify-content: center;
			background: none;
			border: none;
			font-size: 1.75rem;
			cursor: pointer;
			color: var(--primary);
			padding: 0.5rem;
			border-radius: 8px;
			transition: var(--transition-smooth);
		}
		.hamburger-menu:hover {
			background: rgba(150, 0, 64, 0.05);
		}
		.top-header {
			padding: 0 1.25rem;
		}
	}

	@media (max-width: 768px) {


		.content-wrapper {
			padding: 1.25rem 1rem;
		}
	}

	.logout-sidebar-btn {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--border-color);
		background-color: var(--bg-card);
		color: var(--primary);
		border-radius: 10px;
		font-weight: 700;
		font-size: 0.9rem;
		cursor: pointer;
		font-family: inherit;
		transition: var(--transition-smooth);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.logout-sidebar-btn:hover {
		background-color: var(--primary);
		color: white;
		box-shadow: 0 4px 10px rgba(150, 0, 64, 0.15);
		border-color: var(--primary);
	}

	.auth-loading-screen {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-main);
		font-family: 'Outfit', sans-serif;
		color: var(--text-secondary);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--secondary);
		border-top: 4px solid var(--primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.sync-action-btn {
		background: rgba(150, 0, 64, 0.05); /* very light primary */
		border: 1px solid rgba(150, 0, 64, 0.15);
		margin-top: 0.5rem;
		width: 100%;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
		color: var(--primary);
	}

	.sync-action-btn:hover {
		background: rgba(150, 0, 64, 0.1);
		color: var(--primary-hover);
	}

	.sync-action-btn.syncing {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.icon-spin.spinning {
		display: inline-block;
		animation: spin 1s linear infinite;
	}

	/* Global Reminder Overlay Popup */
	.global-reminder-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(45, 50, 39, 0.45);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeIn 0.2s ease-out;
		font-family: 'Outfit', sans-serif;
	}

	.global-reminder-card {
		width: 100%;
		max-width: 460px;
		background: #ffffff;
		border-radius: 20px;
		border: 1px solid var(--border-color);
		box-shadow: 0 10px 30px rgba(150, 0, 64, 0.12);
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.reminder-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 0.75rem;
	}

	.reminder-icon {
		font-size: 1.75rem;
	}

	.reminder-header h3 {
		font-family: 'Playfair Display', serif;
		color: var(--primary);
		margin: 0;
		font-size: 1.4rem;
	}

	.reminder-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reminder-seminar {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.reminder-task-box {
		background: #fdfbf7;
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.category-badge {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		text-transform: uppercase;
	}

	.category-badge.check {
		background: rgba(0, 112, 243, 0.08);
		color: #0070f3;
	}

	.category-badge.prepare {
		background: rgba(230, 126, 34, 0.08);
		color: #e67e22;
	}

	.category-badge.communicate {
		background: rgba(142, 68, 173, 0.08);
		color: #8e44ad;
	}

	.category-badge.materials {
		background: rgba(39, 174, 96, 0.08);
		color: #27ae60;
	}

	.reminder-text {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.reminder-footer {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.btn-snooze {
		background: #f5f2eb !important;
		color: var(--text-primary) !important;
		border: 1px solid var(--border-color) !important;
	}

	.btn-snooze:hover {
		background: #e9e4d9 !important;
	}

	.btn-done {
		background: #27ae60 !important;
		color: #ffffff !important;
		border: 1px solid #27ae60 !important;
	}

	.btn-done:hover {
		background: #219653 !important;
	}

	.btn-close-rem {
		background: transparent !important;
		color: var(--text-secondary) !important;
		border: 1px solid transparent !important;
	}

	.btn-close-rem:hover {
		color: var(--text-primary) !important;
		background: rgba(0, 0, 0, 0.04) !important;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleUp {
		from { transform: scale(0.95); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
