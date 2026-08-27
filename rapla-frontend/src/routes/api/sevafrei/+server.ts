import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

const path1 = path.resolve('src/lib/data/sevafrei_absences.json');
const path2 = path.resolve('rapla-frontend/src/lib/data/sevafrei_absences.json');
const FILE_PATH = fs.existsSync(path2) ? path2 : path1;

export const GET: RequestHandler = async () => {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, 'utf-8');
      return json(JSON.parse(data), {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
  } catch (e) {
    console.error('Error reading sevafrei absences:', e);
  }
  return json([], {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return json({ success: true });
  } catch (e) {
    console.error('Error saving sevafrei absences:', e);
    return json({ success: false, error: String(e) }, { status: 500 });
  }
};
