import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve directories relative to this script
const envPath = path.resolve(__dirname, '..', '.env');
const rootDir = path.resolve(__dirname, '..', '..');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        // Remove surrounding quotes if any
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('[RULE COMPILER ERROR] Gemini API Key is missing in environment!');
  process.exit(1);
}

const rulesDir = path.resolve(rootDir, 'Wochenplan Regeln');
if (!fs.existsSync(rulesDir)) {
  console.error(`[RULE COMPILER ERROR] Rules directory not found at: ${rulesDir}`);
  process.exit(1);
}

// Find rule files recursively
function getRuleFiles(dir, files = {}) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getRuleFiles(fullPath, files);
    } else if (item.endsWith('.txt')) {
      const relativeName = path.relative(rulesDir, fullPath);
      files[relativeName] = fs.readFileSync(fullPath, 'utf8');
    }
  }
  return files;
}

const fileContents = getRuleFiles(rulesDir);
console.log(`[RULE COMPILER] Read ${Object.keys(fileContents).length} rule files from disk.`);

// Prepare files content for the prompt
const filesText = Object.entries(fileContents)
  .map(([name, content]) => `--- DATEI: ${name} ---\n${content}`)
  .join('\n\n');

const prompt = `
Du bist ein präzises Übersetzungssystem für Dienstplan-Regeln eines Yoga-Zentrums in strukturiertes JSON.
Hier sind die Inhalte aller Regeldateien im Verzeichnis "Wochenplan Regeln":

${filesText}

Übersetze diese Regeln in ein präzises, strukturiertes JSON-Objekt mit genau folgendem Schema. Halte dich exakt an die Namen und Bedeutungen im Text:

{
  "teachers": {
    "lehrer_id_kleingeschrieben_ohne_sonderzeichen": {
      "name": "Name des Lehrers (exakt aus der Datei, z.B. 'Burnie', 'Karuna', 'Hu', 'Mounir', 'Nirmaya', 'Narayani', 'Pranava', 'Alexander', 'Adam', 'Harishakti', 'Ulrich')",
      "freeDays": [Wochentage an denen frei ist als Zahlen: 0=Sonntag, 1=Montag, 2=Dienstag, 3=Mittwoch, 4=Donnerstag, 5=Freitag, 6=Samstag],
      "maxMeditationPerWeek": Max. geführte Meditationen pro Woche (Zahl oder null),
      "maxSatsangsPerWeek": Max. Satsangs pro Woche gesamt (Zahl oder null),
      "maxMorningSatsangsPerWeek": Max. morgendliche Satsangs pro Woche (Zahl oder null),
      "maxYogaClassesPerWeek": Max. Yogastunden pro Woche (Zahl oder null),
      "maxOnnPerWeek": Max. Om Namo Narayanaya (ONN) pro Woche (Zahl oder null),
      "maxAnfaengerYogaPerWeek": Max. Anfänger-Yogastunden pro Woche (Zahl oder null),
      "isYogaTeacher": true oder false (wenn explizit keine Yogastunden gegeben werden, sonst true),
      "canLeadSatsang": true oder false (wenn explizit kein Satsang gegeben wird, sonst true),
      "canLeadPranayama": true oder false (wenn explizit Pranayama erlaubt/unterrichtet wird, sonst false),
      "canLeadSatsangEinfuehrung": true oder false (wenn explizit dafür in Frage kommend, sonst false),
      "canLeadOnn": true oder false (wenn explizit ONN erlaubt/unterrichtet wird oder verboten ist, passe es an),
      "noYogaOnWeekend": true oder false (wenn am Wochenende keine Yogastunden erlaubt sind),
      "noTwoYogaSameDay": true oder false (wenn nicht zwei Yogastunden am selben Tag erlaubt sind),
      "weekendAfternoonOnly": true oder false (wenn am Wochenende nur nachmittags Yogastunden erlaubt sind),
      "weekendAsBackupOnly": true oder false (wenn am Wochenende nur verplant werden soll, wenn sonst niemand frei ist),
      "prefersMittelstufe": true oder false (wenn Mittelstufe bevorzugt wird),
      "customCourseNames": [
        { "originalName": "Anfänger", "customName": "Yoga Vidya meets Pavanmuktasana" }
      ] (Liste von spezifischen Umbenennungen für Yogastunden dieses Lehrers),
      "availabilityRestrictions": [
        { "day": 2, "timeAfter": "12:00", "allowed": false },
        { "day": 4, "timeBefore": "11:00", "allowed": false }
      ] (Spezifische zeitliche Einschränkungen an Tagen, z.B. für Anjali oder Hu),
      "preferredAvailability": [
        { "day": 1, "start": "06:30", "end": "22:00" },
        { "day": 2, "start": "06:30", "end": "11:30" }
      ] (Wenn Zeiten bevorzugt/ideal sind, wie für Harishakti),
      "maxClassesPerDay": Zahl (Tageslimit, standardmäßig 2, außer Karuna hat 3)
    }
  },
  "meditation": {
    "allowed": ["namen", "in", "kleinschreibung", "die", "meditation", "leiten", "dürfen"],
    "forbidden": ["namen", "in", "kleinschreibung", "die", "meditation", "nicht", "leiten", "dürfen"],
    "dailyPrimary": {
      "1": "hu",
      "2": "alexander",
      "3": "satyam",
      "4": "christopher",
      "5": "pranava",
      "6": "nirmaya",
      "0": "harishakti"
    } (Standard-Leiter pro Wochentag)
  },
  "satsang": {
    "forbidden": ["namen", "die", "nie", "satsang", "leiten", "dürfen"],
    "morningAllowed": ["namen", "die", "morgens", "satsang", "leiten", "dürfen"],
    "morningMaxTwo": ["namen", "die", "morgens", "bis", "zu", "zwei", "mal", "leiten", "dürfen"],
    "evening": {
      "wedSun": {
        "primary": "karuna",
        "backups": ["narayani", "abha", "anjali"]
      },
      "mon": {
        "primary": "narayani",
        "backups": ["abha", "anjali"]
      }
    }
  },
  "satsangEinfuehrung": {
    "allowed": ["namen", "die", "für", "satsang", "einführung", "in", "frage", "kommen"],
    "friday": "pranava",
    "sunday": ["nirmaya", "hu", "pranava", "mounir", "burnie"]
  },
  "yoga": {
    "fridayMorningAnfaenger": {
      "primary": "harishakti",
      "backup": "abha"
    },
    "fridayMorningMittelstufe": {
      "primary": "pranava"
    },
    "sundayMittelstufeAnkommen": {
      "primary": "karuna",
      "backups": ["anjali", "narayani", "ulrich"]
    },
    "fridayMittelstufeAnkommen": {
      "primary": "karuna"
    }
  },
  "pranayama": {
    "allowed": ["karuna", "burnie", "narayani", "abha"]
  }
}

Gib ausschließlich das valide JSON-Objekt zurück. Keine Erklärungen, kein Markdown-Markup!
`;

async function fetchWithRetry(url, options, maxRetries = 3, delayMs = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      const errText = await response.text();
      console.warn(`[RULE COMPILER WARNING] API call failed (Attempt ${i + 1}/${maxRetries}) with status ${response.status}: ${errText}`);
      
      // If 503 or 429, wait and retry
      if (response.status === 503 || response.status === 429) {
        console.log(`[RULE COMPILER] Waiting ${delayMs}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff
        continue;
      }
      throw new Error(`Gemini API failed with status ${response.status}: ${errText}`);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.warn(`[RULE COMPILER WARNING] Network error (Attempt ${i + 1}/${maxRetries}):`, err.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2;
    }
  }
  throw new Error('Max retries reached');
}

async function compile() {
  try {
    console.log('[RULE COMPILER] Querying Gemini API to parse rules...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    };

    const response = await fetchWithRetry(url, options);
    const resData = await response.json();
    let text = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.trim();

    // Clean JSON markdown code blocks if any
    if (text.startsWith('```')) {
      const lines = text.split('\n');
      if (lines[0].startsWith('```json') || lines[0].startsWith('```')) {
        text = lines.slice(1, -1).join('\n');
      }
    }

    // Try parsing to validate it is correct JSON
    const parsed = JSON.parse(text.trim());

    // Ensure output directory exists
    const outDir = path.join(rootDir, 'rapla-frontend', 'src', 'lib', 'data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(outDir, 'wochenplan_rules.json');
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
    console.log(`[RULE COMPILER SUCCESS] Compiled rules written to: ${outPath}`);
  } catch (err) {
    console.error('[RULE COMPILER ERROR] Failed compiling rules:', err);
    process.exit(1);
  }
}

compile();
