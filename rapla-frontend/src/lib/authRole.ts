export type RaplaUserRole = 'admin' | 'team' | 'viewer';

const ROLE_KEY = 'rapla_user_role';
const VALID_ROLES = new Set<string>(['admin', 'team', 'viewer']);

export function getStoredUserRole(): RaplaUserRole | null {
	if (typeof window === 'undefined') return null;

	try {
		const fromLocal = localStorage.getItem(ROLE_KEY);
		if (fromLocal && VALID_ROLES.has(fromLocal)) {
			return fromLocal as RaplaUserRole;
		}
	} catch {}

	try {
		const fromSession = sessionStorage.getItem(ROLE_KEY);
		if (fromSession && VALID_ROLES.has(fromSession)) {
			return fromSession as RaplaUserRole;
		}
	} catch {}

	const fromMem = (window as any).__raplaSessionRole;
	if (fromMem && VALID_ROLES.has(fromMem)) {
		return fromMem as RaplaUserRole;
	}

	return null;
}

export function setStoredUserRole(role: string): void {
	if (typeof window === 'undefined') return;
	(window as any).__raplaSessionRole = role;
	try {
		localStorage.setItem(ROLE_KEY, role);
	} catch {}
	try {
		sessionStorage.setItem(ROLE_KEY, role);
	} catch {}
}

export function clearStoredUserRole(): void {
	if (typeof window === 'undefined') return;
	delete (window as any).__raplaSessionRole;
	try {
		localStorage.removeItem(ROLE_KEY);
	} catch {}
	try {
		sessionStorage.removeItem(ROLE_KEY);
	} catch {}
}
