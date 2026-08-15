import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Automatically compile rules during Vite initialization (dev/build)
try {
	const rulesJsonPath = path.resolve('src/lib/data/wochenplan_rules.json');
	const scriptPath = path.resolve('scripts/compile_rules.js');
	if (!fs.existsSync(rulesJsonPath) && fs.existsSync(scriptPath)) {
		console.log('[VITE] Triggering Wochenplan rules compilation...');
		execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
	}
} catch (e) {
	console.error('[VITE ERROR] Rules compilation failed:', e);
}

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
