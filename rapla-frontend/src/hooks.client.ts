import type { HandleClientError } from '@sveltejs/kit';

const RELOAD_KEY = 'rapla_chunk_recovery_ts';

function isNetworkOrChunkError(error: unknown): boolean {
	if (!error) return false;
	const msg = String((error as any)?.message || error).toLowerCase();
	return (
		msg.includes('failed to fetch dynamically imported module') ||
		msg.includes('importing a module script failed') ||
		msg.includes('error loading dynamically imported module') ||
		msg.includes('unable to preload css') ||
		msg.includes('chunkloaderror') ||
		msg.includes('/_app/immutable/') ||
		msg.includes('load failed') ||
		msg.includes('networkerror') ||
		msg.includes('failed to fetch')
	);
}

export const handleError: HandleClientError = ({ error, status }) => {
	if (typeof window !== 'undefined' && (isNetworkOrChunkError(error) || status === 404)) {
		try {
			const now = Date.now();
			const last = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10);
			if (now - last > 20000 && isNetworkOrChunkError(error)) {
				sessionStorage.setItem(RELOAD_KEY, String(now));
				const targetUrl = new URL(window.location.href);
				targetUrl.searchParams.set('_r', String(now));
				window.location.replace(targetUrl.toString());
				return {
					message: 'Verbindung wird im aktuellen Netzwerk neu aufgebaut...'
				};
			}
		} catch {
			// Ignore storage restrictions
		}
	}

	console.error('[Rapla Client Error]:', error);
	return {
		message: 'Die Seite konnte im aktuellen WLAN kurzzeitig nicht geladen werden. Bitte einmal neu laden.'
	};
};
