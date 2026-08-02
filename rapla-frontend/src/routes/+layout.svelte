<script lang="ts">
	import '../global.css';
	import favicon from '$lib/assets/favicon.svg';
	import nataraja from '$lib/assets/nataraja.jpg';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Simple client-side page tracking
	import { page } from '$app/state';

	let showTeachersDropdown = $state(false);
	let showScheduleDropdown = $state(false);

	$effect(() => {
		const path = page.url.pathname;
		if (path.startsWith('/sevakas') || path.startsWith('/teachers')) {
			showTeachersDropdown = true;
		}
		if (path.startsWith('/schedule') || path.startsWith('/ai-planning')) {
			showScheduleDropdown = true;
		}
	});

	onMount(async () => {
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
			console.error('Failed to sync wishes on load:', e);
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
			console.error('Failed to sync absences on load:', e);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href="https://www.yoga-vidya.de/typo3conf/ext/of_customisation/Resources/Public/Icons/favicon_icon.ico" />
	<title>Yoga Vidya Rapla 2.0</title>
</svelte:head>

{#if page.url.pathname.startsWith('/wochenplan')}
	{@render children()}
{:else}
	<div class="layout-container">
		<!-- Sidebar Navigation - Inspired by Yoga Vidya Nordsee branding -->
		<aside class="sidebar">
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
								class:active={page.url.pathname.startsWith('/sevakas') && !page.url.pathname.endsWith('/wuensche')}
							>
								<span class="nav-icon">👥</span>
								<span class="nav-label">Sevakas</span>
							</a>
							<a 
								href="/sevakas/wuensche" 
								class="nav-dropdown-item" 
								class:active={page.url.pathname.includes('/sevakas/wuensche')}
							>
								<span class="nav-icon">📝</span>
								<span class="nav-label">Sevaka-Wünsche</span>
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
			</nav>

			<!-- Bottom Greeting Card & Brand Slogan -->
			<div class="sidebar-footer">
				<div class="namaste-card">
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
				<div class="studio-selector">
					<strong>Yoga Vidya Rapla 2.0</strong>
					<span class="selector-arrow">˅</span>
				</div>
				
				<div class="search-bar">
					<span class="search-icon">🔍</span>
					<input type="text" placeholder="Suche nach Kursen, Lehrern, Räumen..." />
				</div>

				<div class="user-profile-area">
					<div class="notification-badge-container">
						<span class="notification-icon">🔔</span>
						<span class="badge-dot">6</span>
					</div>
					<div class="avatar-profile">
						<div class="avatar-photo">🧘</div>
						<div class="avatar-info">
							<strong>Julia</strong>
							<span>Studio Admin</span>
						</div>
					</div>
				</div>
			</header>

			<div class="content-wrapper">
				{@render children()}
			</div>
		</main>
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
		cursor: pointer;
	}

	.selector-arrow {
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.search-bar {
		position: relative;
		width: 320px;
	}

	.search-icon {
		position: absolute;
		left: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.85rem;
		color: var(--text-secondary);
		opacity: 0.8;
	}

	.search-bar input {
		width: 100%;
		border: 1px solid var(--border-color);
		border-radius: 20px;
		background: #faf8f5;
		padding: 0.45rem 1rem 0.45rem 2.2rem;
		font-size: 0.85rem;
		font-family: inherit;
		color: var(--text-primary);
		transition: var(--transition-smooth);
	}

	.search-bar input:focus {
		outline: none;
		background: #ffffff;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(217, 119, 36, 0.1);
	}

	.user-profile-area {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.notification-badge-container {
		position: relative;
		cursor: pointer;
	}

	.notification-icon {
		font-size: 1.2rem;
		color: var(--text-secondary);
	}

	.badge-dot {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--primary); /* Saffron dot */
		color: #ffffff;
		font-size: 0.6rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-profile {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.avatar-photo {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--primary);
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		color: #ffffff;
	}

	.avatar-info {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}

	.avatar-info strong {
		font-size: 0.88rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.avatar-info span {
		font-size: 0.72rem;
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
</style>
