<script lang="ts">
	import { page } from '$app/state';
	import nataraja from '$lib/assets/nataraja.jpg';

	function reloadFresh() {
		if (typeof window === 'undefined') return;
		const url = new URL(window.location.href);
		url.searchParams.set('_r', String(Date.now()));
		window.location.replace(url.toString());
	}

	function goHomeFresh() {
		if (typeof window === 'undefined') return;
		window.location.replace('/?_r=' + Date.now());
	}
</script>

<div class="error-wrapper">
	<div class="error-card glass-card">
		<div class="logo-img-wrapper">
			<img src={nataraja} alt="Yoga Vidya Logo" class="logo-img" />
		</div>
		<h2>YOGA VIDYA NORDSEE</h2>
		<h1>Verbindung wird aktualisiert</h1>
		<p class="desc">
			{page.error?.message || 'Beim Öffnen im aktuellen WLAN ist ein kurzer Verbindungsfehler aufgetreten.'}
		</p>
		<div class="actions">
			<button type="button" class="btn btn-primary" onclick={reloadFresh}>
				🔄 Jetzt neu laden
			</button>
			<button type="button" class="btn btn-secondary" onclick={goHomeFresh}>
				🏠 Zur Startseite
			</button>
		</div>
	</div>
</div>

<style>
	.error-wrapper {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--bg-main, #fffdf8);
	}

	.error-card {
		max-width: 440px;
		width: 100%;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2.25rem 2rem;
	}

	.logo-img-wrapper {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		border: 2px solid var(--border-color, #ffe082);
		background-color: #f7f2eb;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logo-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		transform: scale(1.25);
	}

	h2 {
		font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 0.9rem;
		color: var(--primary, #960040);
		letter-spacing: 0.1em;
		font-weight: 700;
		margin: 0;
	}

	h1 {
		font-size: 1.45rem;
		margin: 0;
		color: var(--text-primary, #2a1b1b);
	}

	.desc {
		font-size: 0.9rem;
		color: var(--text-secondary, #6b5151);
		line-height: 1.5;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 0.5rem;
	}
</style>
