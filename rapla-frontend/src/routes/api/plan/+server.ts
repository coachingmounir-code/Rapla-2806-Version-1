import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import solverSource from '$lib/solver.py?raw';

async function parseCustomWishes(customWishes: string, teachers: any[], courses: any[]) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { constraints: [], warning: 'Google Gemini API-Key fehlt in den Vercel-Umgebungsvariablen.' };
  }
  if (!customWishes.trim()) {
    return { constraints: [], warning: '' };
  }

  try {
    const teacherContext = teachers.map(t => ({ id: t.id, name: t.name }));
    const courseContext = courses.map(c => ({ id: c.id, name: c.name, dayOfWeek: c.dayOfWeek, startTime: c.startTime, style: c.style }));

    const prompt = `
Du bist ein präziser Dienstplan-Assistent. Deine Aufgabe ist es, Sonderwünsche in strukturierte JSON-Ausschlüsse oder -Einteilungen zu übersetzen.

Hier sind die verfügbaren Lehrer:
${JSON.stringify(teacherContext)}

Hier sind die Kurse dieser Woche:
${JSON.stringify(courseContext)}

Sonderwünsche:
"${customWishes}"

Übersetze diese Wünsche in ein valides JSON-Array. Verwende NUR folgende zwei Objekte:
1. Ausschluss:
{"type": "exclude", "teacherId": "LEHRER_ID", "dayOfWeek": WOCHENTAG_NUMMER (0=So, 1=Mo, etc.), "startTime": "HH:MM" (optional, falls für bestimmten Kurs)}

2. Feste Einteilung:
{"type": "include", "teacherId": "LEHRER_ID", "courseId": "KURS_ID"}

Gib ausschließlich das JSON-Array zurück. Keine Markdown-Formatierung, kein Begleittext!
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson.error?.message || response.statusText;
      } catch {
        errText = response.statusText;
      }
      return { 
        constraints: [], 
        warning: `Gemini API-Aufruf fehlgeschlagen (${response.status}): ${errText}. Bitte prüfen Sie Ihren API-Key.` 
      };
    }

    const resData = await response.json();
    let text = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.trim();

    // Clean JSON markdown blocks if any
    if (text.startsWith('```')) {
      const lines = text.split('\n');
      if (lines[0].startsWith('```json') || lines[0].startsWith('```')) {
        text = lines.slice(1, -1).join('\n');
      }
    }

    return { constraints: JSON.parse(text.trim()), warning: '' };
  } catch (err: any) {
    console.warn('[GEMINI PARSE WARNING]', err);
    return { constraints: [], warning: `Fehler beim Verarbeiten der KI-Rückgabe: ${err.message}` };
  }
}

export async function POST({ request }) {
  try {
    const payload = await request.json();
    const { courses, teachers, customWishes } = payload;

    // Parse custom wishes to constraints
    let customConstraints: any[] = [];
    let geminiWarning = '';
    
    const aggregatedWishes: string[] = [];
    if (customWishes && customWishes.trim()) {
      aggregatedWishes.push(`Wöchentliche Sonderwünsche (Allgemein):\n"${customWishes.trim()}"`);
    }
    
    teachers.forEach((t: any) => {
      if (t.customWishes && t.customWishes.trim()) {
        aggregatedWishes.push(`Sonderwunsch für ${t.name} (ID: ${t.id}):\n"${t.customWishes.trim()}"`);
      }
    });

    if (aggregatedWishes.length > 0) {
      const combinedWishes = aggregatedWishes.join('\n\n');
      const result = await parseCustomWishes(combinedWishes, teachers, courses);
      customConstraints = result.constraints;
      geminiWarning = result.warning;
    }

    // Prepare solver payload
    const solverPayload = {
      ...payload,
      customConstraints
    };

    // Write solverSource directly to /tmp/solver.py so it's always available at runtime on Vercel
    const solverPath = path.join('/tmp', 'solver.py');
    fs.writeFileSync(solverPath, solverSource, 'utf8');

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [solverPath]);
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[SOLVER ERROR]', stderr);
          resolve(json({ error: `Solver failed with code ${code}`, stderr }, { status: 500 }));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (geminiWarning) {
            result.logs = [
              `⚠️ [KI-WARNUNG] ${geminiWarning}`,
              ...(result.logs || [])
            ];
          }
          resolve(json(result));
        } catch (e) {
          console.error('[SOLVER PARSE ERROR]', stdout);
          resolve(json({ error: 'Failed to parse solver output', stdout, stderr }, { status: 500 }));
        }
      });

      // Write Svelte payload to Python script via stdin
      pythonProcess.stdin.write(JSON.stringify(solverPayload));
      pythonProcess.stdin.end();
    });
  } catch (err: any) {
    console.error('[API ERROR]', err);
    return json({ error: err.message }, { status: 500 });
  }
}
