import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	const pathname = event.url.pathname;
	const contentType = response.headers.get('content-type') || '';

	// Never cache HTML document shells or SvelteKit data endpoints in browsers, routers, or Wi-Fi proxies.
	// This prevents stale HTML pointing to outdated /_app/immutable/* JS chunks after deployments or Wi-Fi switches.
	if (
		!pathname.startsWith('/_app/immutable/') &&
		(contentType.includes('text/html') || pathname.endsWith('/__data.json'))
	) {
		response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
		response.headers.set('CDN-Cache-Control', 'no-store');
		response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
		response.headers.set('Pragma', 'no-cache');
		response.headers.set('Expires', '0');
	}

	return response;
};
