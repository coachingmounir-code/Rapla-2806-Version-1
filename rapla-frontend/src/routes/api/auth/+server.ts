import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { env } from '$env/dynamic/private';

const path1 = path.resolve('src/lib/data/auth_config.json');
const path2 = path.resolve('rapla-frontend/src/lib/data/auth_config.json');
const CONFIG_PATH = fs.existsSync(path2) ? path2 : path1;

function getPasswords() {
  const defaults = {
    adminPassword: env.RAPLA_ADMIN_PASSWORD || 'Erfolgsalbum1981!',
    teamPassword: env.RAPLA_TEAM_PASSWORD || 'team'
  };
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        adminPassword: env.RAPLA_ADMIN_PASSWORD || parsed.adminPassword || defaults.adminPassword,
        teamPassword: env.RAPLA_TEAM_PASSWORD || parsed.teamPassword || defaults.teamPassword
      };
    }
  } catch (e) {
    console.error('Error reading auth config:', e);
  }
  return defaults;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { password } = await request.json();
    const config = getPasswords();
    
    if (password === config.adminPassword) {
      return json({ success: true, role: 'admin' });
    } else if (password === config.teamPassword) {
      return json({ success: true, role: 'team' });
    } else {
      return json({ success: false, error: 'Ungültiges Passwort' }, { status: 401 });
    }
  } catch (e) {
    console.error('Login error:', e);
    return json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const { currentAdminPassword, newAdminPassword, newTeamPassword } = await request.json();
    const config = getPasswords();
    
    if (currentAdminPassword !== config.adminPassword) {
      return json({ success: false, error: 'Aktuelles Admin-Passwort ist ungültig' }, { status: 403 });
    }
    
    const newConfig = {
      adminPassword: newAdminPassword || config.adminPassword,
      teamPassword: newTeamPassword || config.teamPassword
    };
    
    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (fsError) {
      console.warn('Could not write configuration file to disk:', fsError);
      return json({ 
        success: false, 
        error: 'Passwortänderung fehlgeschlagen: Das Dateisystem ist schreibgeschützt (z. B. auf Vercel). Bitte ändere die Passwörter über die Vercel-Umgebungsvariablen RAPLA_ADMIN_PASSWORD und RAPLA_TEAM_PASSWORD.' 
      }, { status: 403 });
    }
    return json({ success: true });
  } catch (e) {
    console.error('Change passwords error:', e);
    return json({ success: false, error: 'Serverfehler: ' + String(e) }, { status: 500 });
  }
};
