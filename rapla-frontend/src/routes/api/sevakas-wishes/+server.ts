import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

const FILE_PATH = path.resolve('src/lib/data/sevakas_wishes.json');

export const GET: RequestHandler = async () => {
  try {
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, 'utf-8');
      return json(JSON.parse(data));
    }
  } catch (e) {
    console.error('Error reading sevakas wishes:', e);
  }
  return json([]);
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
    console.error('Error saving sevakas wishes:', e);
    return json({ success: false, error: String(e) }, { status: 500 });
  }
};
