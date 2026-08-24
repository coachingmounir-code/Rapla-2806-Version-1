import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// try {
//   console.log('[PREPLANNING] Triggering Wochenplan rules compilation...');
//   execSync('node rapla-frontend/scripts/compile_rules.js', { stdio: 'inherit' });
// } catch (e) {
//   console.error('[PREPLANNING ERROR] Failed compiling rules:', e);
// }

import { db } from './rapla-frontend/src/lib/db.ts';
import { runAiPlanning } from './rapla-frontend/src/lib/planningEngine.ts';
import { EXCEL_ABSENCES } from './rapla-frontend/src/lib/excel_absences.ts';

// Mock browser globals before any db functions are called
global.window = {} as any;
const mockLocalStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockLocalStorage[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { for (const k in mockLocalStorage) delete mockLocalStorage[k]; },
  length: 0,
  key: (index: number) => null
};

// Populate rapla_teachers in mock localStorage so db.getTeachers() returns our teachers
const teachers = db.getTeachers();
localStorage.setItem('rapla_teachers', JSON.stringify(teachers));

// Populate rapla_sevafrei in mock localStorage from EXCEL_ABSENCES
const sevafreiList = EXCEL_ABSENCES.map((abs, i) => {
  const match = teachers.find(t => {
    const cleanExcel = abs.excelName.toLowerCase().trim();
    const dbName = t.name.toLowerCase().trim();
    if (cleanExcel === "abha" && dbName.includes("abha")) return true;
    if (cleanExcel === "adam" && dbName.includes("adam")) return true;
    if (cleanExcel === "alexander" && dbName.includes("alexander")) return true;
    if (cleanExcel === "anjali" && dbName.includes("anjali")) return true;
    if (cleanExcel === "burnie" && dbName.includes("burnie")) return true;
    if (cleanExcel === "harishakti" && dbName.includes("harishakti")) return true;
    if (cleanExcel === "hu" && dbName.includes("hu")) return true;
    if (cleanExcel === "karuna" && dbName.includes("karuna")) return true;
    if (cleanExcel === "mounir" && (dbName.includes("mouniir") || dbName.includes("mounir"))) return true;
    if (cleanExcel === "narayani" && dbName.includes("narayani")) return true;
    if (cleanExcel === "nirmaya" && dbName.includes("nirmaya")) return true;
    if (cleanExcel === "pranava" && dbName.includes("pranava")) return true;
    if (cleanExcel === "satyam" && dbName.includes("satyam")) return true;
    if (cleanExcel === "ulrich" && dbName.includes("ulrich")) return true;
    
    const firstName = dbName.split(' ')[0];
    if (firstName === "karuna" && cleanExcel !== "karuna") return false;
    return cleanExcel.includes(firstName) && firstName.length > 2;
  });

  return match ? {
    id: `excel-sf-${i}`,
    teacherId: match.id,
    teacherName: match.name,
    avatarColor: match.avatarColor || '#960040',
    startDate: abs.startDate,
    endDate: abs.endDate,
    type: abs.type,
    status: abs.status,
    note: abs.note
  } : null;
}).filter(Boolean) as any[];

// Load custom absences from JSON if available and merge
const absencesPath = './rapla-frontend/src/lib/data/sevafrei_absences.json';
if (fs.existsSync(absencesPath)) {
  try {
    const absencesData = fs.readFileSync(absencesPath, 'utf-8');
    const customAbsences = JSON.parse(absencesData);
    if (Array.isArray(customAbsences)) {
      let mergedCount = 0;
      customAbsences.forEach(abs => {
        const isDup = sevafreiList.some(
          existing => existing.teacherId === abs.teacherId &&
                      existing.startDate === abs.startDate &&
                      existing.endDate === abs.endDate
        );
        if (!isDup) {
          sevafreiList.push(abs);
          mergedCount++;
        }
      });
      console.log(`[PREPLANNING] ${mergedCount} zusätzliche Abwesenheiten aus JSON geladen.`);
    }
  } catch (e) {
    console.error('[PREPLANNING] Fehler beim Laden der Abwesenheiten:', e);
  }
}

localStorage.setItem('rapla_sevafrei', JSON.stringify(sevafreiList));

// Helper to get date for a day of a given week code (Friday start)
function getLocalDateForDay(weekCode: string, dayOfWeek: number): string {
  const parts = weekCode.split('-W');
  const year = parseInt(parts[0], 10);
  const weekNum = parseInt(parts[1], 10);

  // Find the first Thursday of January
  const jan4 = new Date(year, 0, 4);
  const dayNum = jan4.getDay() || 7;
  const monday = new Date(jan4.getTime());
  monday.setDate(jan4.getDate() - dayNum + 1);
  
  const targetMonday = new Date(monday.getTime());
  targetMonday.setDate(monday.getDate() + (weekNum - 1) * 7);

  const targetFriday = new Date(targetMonday.getTime());
  targetFriday.setDate(targetMonday.getDate() - 3);

  let offset = 0;
  if (dayOfWeek === 5) offset = 0;
  else if (dayOfWeek === 6) offset = 1;
  else if (dayOfWeek === 0) offset = 2;
  else if (dayOfWeek === 1) offset = 3;
  else if (dayOfWeek === 2) offset = 4;
  else if (dayOfWeek === 3) offset = 5;
  else if (dayOfWeek === 4) offset = 6;

  const targetDate = new Date(targetFriday.getTime());
  targetDate.setDate(targetFriday.getDate() + offset);

  const yyyy = targetDate.getFullYear();
  const mm = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = targetDate.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Check standard week absences and do replanning for a given week
function planWeekWithAbsences(weekCode: string, standardCourses: any[]) {
  console.log(`\n======================================================`);
  console.log(`PLANNING FOR WEEK: ${weekCode}`);
  console.log(`======================================================`);

  // Build working courses from standard week (excluding Pranayama during 4-week YLA: 30.08.2026 - 27.09.2026)
  const courses = standardCourses
    .filter(c => {
      const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
      if (isPranayama) {
        const courseDate = getLocalDateForDay(weekCode, c.dayOfWeek);
        if (courseDate >= '2026-08-30' && courseDate <= '2026-09-27') {
          console.log(`[PRANAYAMA REMOVED] ${c.name} (${c.startTime}) entfällt am ${courseDate} (${weekCode}) wegen der 4-wöchigen Yogalehrerausbildung.`);
          return false;
        }
      }
      return true;
    })
    .map((c, idx) => {
      const courseCopy = {
        ...c,
        id: `course-${weekCode}-${idx + 1}`,
        isAiPlanned: false,
        status: 'approved'
      };

    if (!courseCopy.teacherId) {
      courseCopy.isAiPlanned = true;
      return courseCopy;
    }

    const teacher = teachers.find(t => t.id === courseCopy.teacherId);
    if (!teacher) return courseCopy;

    // Check absence
    const courseDate = getLocalDateForDay(weekCode, courseCopy.dayOfWeek);
    
    // For composite teachers, check if any of the components is absent
    const namesToCheck: string[] = [];
    if (teacher.name.includes(',')) {
      teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
    } else {
      namesToCheck.push(teacher.name.toLowerCase().trim());
    }

    let isAnyAbsent = false;
    for (const name of namesToCheck) {
      const activeAbsence = sevafreiList.find(entry => {
        if (!entry) return false;
        const entryName = entry.teacherName.toLowerCase().trim();
        // Match entry name with namesToCheck
        const isMatch = entryName.includes(name) || name.includes(entryName.split(' ')[0]);
        return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
      });

      if (activeAbsence) {
        console.log(`[ABSENCE] ${teacher.name} has absent member "${name}" on ${courseDate} (${activeAbsence.type}: ${activeAbsence.note || 'no note'}).`);
        isAnyAbsent = true;
        break;
      }
    }

    if (isAnyAbsent) {
      // Set to null to force AI replanning
      courseCopy.teacherId = null;
      courseCopy.isAiPlanned = true;
    }

    return courseCopy;
  });

  // Run AI Planning - CORRECT PARAMETER ORDER: runAiPlanning(courses, teachers, ...)
  const result = runAiPlanning(courses, teachers, [], weekCode);
  
  // Print replanned courses
  const replanned = result.plannedCourses.filter(c => c.isAiPlanned);
  console.log(`Replanned ${replanned.length} courses:`);
  replanned.forEach(c => {
    const origCourse = standardCourses.find(orig => orig.name === c.name && orig.dayOfWeek === c.dayOfWeek && orig.startTime === c.startTime);
    const origTeacher = teachers.find(t => t.id === origCourse?.teacherId)?.name || 'Unbesetzt';
    const newTeacher = teachers.find(t => t.id === c.teacherId)?.name || 'NONE';
    console.log(` - ${c.name} (${c.startTime}): ${origTeacher} -> ${newTeacher}`);
  });

  // Print logs for replanned courses that ended up unassigned (newTeacher === 'NONE')
  result.logs.forEach(log => {
    if (log.includes('Kein passender') || log.includes('Warnung') || log.includes('Fehler') || log.includes('Replanung erforderlich')) {
      console.log(`  LOG: ${log}`);
    }
  });

  return result.plannedCourses;
}

// Build standard courses array based on the updated definitions
const getTeacherIdByName = (shortName: string): string | null => {
  if (!shortName) return null;
  const nameLower = shortName.toLowerCase().trim();
  if (nameLower === 'pranava') return 'teacher-gen-pranava-pauly';
  if (nameLower === 'nirmaya') return 'teacher-gen-nirmaya-fodor';
  if (nameLower === 'harishakti') return 'teacher-gen-harishakti';
  if (nameLower === 'abha') return 'teacher-gen-abha-morkoetter';
  if (nameLower === 'karuna') return 'teacher-gen-karuna-wapke';
  if (nameLower === 'adam') return 'teacher-gen-adam-zmuda';
  if (nameLower === 'anjali') return 'teacher-gen-anjali-gelzleichter';
  if (nameLower === 'yl' || nameLower === '! yl' || nameLower === '! yl #') return 'teacher-gen-yl';
  if (nameLower === 'burnie') return 'teacher-gen-burnie-bansemer';
  if (nameLower === 'hu') return 'teacher-gen-hu-buerkle';
  if (nameLower === 'ulrich') return 'teacher-gen-ulrich-nebel';
  if (nameLower === 'alexander') return 'teacher-gen-alexander-melior';
  if (nameLower === 'narayani') return 'teacher-gen-narayani-kedenburg';
  if (nameLower === 'mouniir') return 'teacher-gen-mouniir-jaber';
  if (nameLower === 'christopher') return 'teacher-gen-christopher';
  if (nameLower === 'satyam') return 'teacher-gen-satyam';
  if (nameLower === 'adam, anjali' || nameLower === 'adam,anjali') return 'teacher-gen-adam-anjali';
  if (nameLower === 'burnie, narayani' || nameLower === 'burnie,narayani') return 'teacher-gen-burnie-narayani';
  if (nameLower === 'mouniir, christopher' || nameLower === 'mouniir,christopher') return 'teacher-gen-mouniir-christopher';
  if (nameLower === 'anjali, abha' || nameLower === 'anjali,abha') return 'teacher-gen-anjali-abha';
  return null;
};

// Custom mock teachers list that contains composite teachers as well
const mockCompositeTeachers = [
  { name: 'Adam, Anjali', id: 'teacher-gen-adam-anjali' },
  { name: 'burnie, Narayani', id: 'teacher-gen-burnie-narayani' },
  { name: 'Mouniir, Christopher', id: 'teacher-gen-mouniir-christopher' },
  { name: 'Anjali, Abha', id: 'teacher-gen-anjali-abha' }
].map(t => ({
  id: t.id,
  name: t.name,
  email: t.name.toLowerCase().replace(/[^a-z]/g, '') + '@yoga.de',
  phone: '',
  avatarColor: 'from-purple-500 to-indigo-600',
  specialties: ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini'],
  isYogaTeacher: true,
  availabilityMode: 'always' as const,
  roleType: 'external' as const,
  rules: {
    maxClassesPerDay: 2,
    maxHoursPerWeek: 10,
    minRestTime: 30,
    preferredRooms: [],
    preferredDays: [],
    canLeadMeditation: false,
    canLeadSatsang: false,
    availability: [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }))
  }
}));

teachers.push(...mockCompositeTeachers);
localStorage.setItem('rapla_teachers', JSON.stringify(teachers));

const standardCoursesDefs = [
  // Friday (dayOfWeek: 5)
  { name: 'Hausführung', style: 'Sonstiges', dayOfWeek: 5, startTime: '19:00', endTime: '19:30', roomId: 'Rezeption', teacherName: '' },
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 5, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Pranava' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 5, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Nirmaya' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 5, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Harishakti' },
  { name: 'Mittelstufe Klangyogastunde', style: 'Hatha', dayOfWeek: 5, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
  { name: 'Anfänger Ankommensstunde', style: 'Hatha', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', roomId: 'room-2', teacherName: 'Abha' },
  { name: 'Mittelstufe Ankommensstunde', style: 'Hatha', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', roomId: 'room-5', teacherName: 'Karuna' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 5, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Adam, Anjali' },
  { name: 'Satsang Einführung', style: 'Meditation', dayOfWeek: 5, startTime: '20:00', endTime: '20:35', roomId: 'room-5', teacherName: 'Pranava' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 5, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

  // Saturday (dayOfWeek: 6)
  { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 6, startTime: '06:00', endTime: '06:50', roomId: 'room-2', teacherName: '' },
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Nirmaya' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Abha' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: '! YL' },
  { name: 'Mittelstufe Mantrayogastunde', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Anjali' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 6, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Anjali' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

  // Sunday (dayOfWeek: 0)
  { name: 'Hausführung', style: 'Sonstiges', dayOfWeek: 0, startTime: '19:00', endTime: '19:30', roomId: 'Rezeption', teacherName: '' },
  { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 0, startTime: '06:00', endTime: '06:50', roomId: 'room-2', teacherName: '' },
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 0, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Harishakti' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 0, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'burnie' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 0, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'burnie' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 0, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Anjali' },
  { name: 'Anfänger Ankommensstunde', style: 'Hatha', dayOfWeek: 0, startTime: '16:30', endTime: '18:00', roomId: 'room-2', teacherName: 'Pranava' },
  { name: 'Mittelstufe Ankommensstunde', style: 'Hatha', dayOfWeek: 0, startTime: '16:30', endTime: '18:00', roomId: 'room-5', teacherName: 'Karuna' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 0, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'burnie, Narayani' },
  { name: 'Satsang Einführung', style: 'Meditation', dayOfWeek: 0, startTime: '20:00', endTime: '20:35', roomId: 'room-5', teacherName: '' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 0, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

  // Monday (dayOfWeek: 1)
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'hu' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'burnie' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Harishakti' },
  { name: 'Anfänger Rückenstunde', style: 'Hatha', dayOfWeek: 1, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Pranava' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 1, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Ulrich' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 1, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Nirmaya' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Narayani' },
  { name: 'Entspannungsangebot: Klangreise', style: 'Entspannung', dayOfWeek: 1, startTime: '21:10', endTime: '22:00', roomId: 'room-5', teacherName: '' },

  // Tuesday (dayOfWeek: 2)
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 2, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Alexander' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 2, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Harishakti' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 2, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Harishakti' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 2, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Anjali' },
  { name: 'Anfänger Yin Yoga', style: 'Hatha', dayOfWeek: 2, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Abha' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 2, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Narayani' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 2, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Christopher' },

  // Wednesday (dayOfWeek: 3)
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: '' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Narayani' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Narayani' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 3, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Abha' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },
  { name: 'Entspannungsangebot: Yogageschichten am Kamin', style: 'Entspannung', dayOfWeek: 3, startTime: '21:10', endTime: '22:00', roomId: 'room-5', teacherName: '' },

  // Thursday (dayOfWeek: 4)
  { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Christopher' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 4, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 4, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
  { name: 'Anfänger', style: 'Hatha', dayOfWeek: 4, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Ulrich' },
  { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 4, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Nirmaya' },
  { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 4, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Harishakti' },
  { name: 'Satsang', style: 'Meditation', dayOfWeek: 4, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },
  { name: 'Entspannungsangebot: Peziebälle / Fantasiereise', style: 'Entspannung', dayOfWeek: 4, startTime: '21:10', endTime: '22:00', roomId: 'room-5', teacherName: '' }
];

const standardCourses = standardCoursesDefs.map((c, index) => ({
  id: `course-def-${index + 1}`,
  name: c.name,
  style: c.style,
  dayOfWeek: c.dayOfWeek,
  startTime: c.startTime,
  endTime: c.endTime,
  roomId: c.roomId,
  teacherId: getTeacherIdByName(c.teacherName),
  isAiPlanned: false,
  status: 'draft' as const
}));

// Helper to generate 8 weeks starting from KW 35
function getNext8WeekCodes(): string[] {
  const weeks = [];
  const startWeek = 35;
  for (let i = 0; i < 8; i++) {
    const weekNum = startWeek + i;
    weeks.push(`2026-W${weekNum.toString().padStart(2, '0')}`);
  }
  return weeks;
}

const weeksToPlan = getNext8WeekCodes();
console.log(`[PREPLANNING] Planning for the next 8 weeks: ${weeksToPlan.join(', ')}`);

const results: Record<string, any[]> = {};
for (const week of weeksToPlan) {
  results[week] = planWeekWithAbsences(week, standardCourses);
}

// Let's print out the exact TS code structure to put into db.ts
function formatPlanCoursesCode(courses: any[]): string {
  const lines = courses.map(c => {
    return `      {
        "id": "${c.id}",
        "name": "${c.name}",
        "style": "${c.style}",
        "dayOfWeek": ${c.dayOfWeek},
        "startTime": "${c.startTime}",
        "endTime": "${c.endTime}",
        "roomId": "${c.roomId}",
        "teacherId": ${c.teacherId ? `"${c.teacherId}"` : 'null'},
        "isAiPlanned": ${c.isAiPlanned},
        "status": "approved"
      }`;
  });
  return '[\n' + lines.join(',\n') + '\n    ]';
}

fs.writeFileSync('planned_weeks_output.txt', 
  Object.entries(results).map(([week, courses]) => `// === ${week} ===\n${formatPlanCoursesCode(courses)}`).join('\n\n')
);
console.log("\nDone! Output written to planned_weeks_output.txt");

// Reconstruct the plans TS code to insert into db.ts
const plansCodeParts = Object.entries(results).map(([week, courses]) => {
  return `  {
    id: "plan-pre-${week}",
    name: "Vorplanung ${week} (Automatisch)",
    status: "approved",
    targetWeekCode: "${week}",
    courses: ${formatPlanCoursesCode(courses)},
    createdAt: new Date().toISOString()
  }`;
});
const plansCode = plansCodeParts.join(',\n');

// Read db.ts
const dbPath = './rapla-frontend/src/lib/db.ts';
if (fs.existsSync(dbPath)) {
  let dbContent = fs.readFileSync(dbPath, 'utf-8');

  // Find the target section to replace dynamically
  const firstPrePlanIndex = dbContent.indexOf('    id: "plan-pre-');
  let braceStartIndex = -1;
  let braceEndIndex = -1;

  if (firstPrePlanIndex !== -1) {
    braceStartIndex = dbContent.lastIndexOf('{', firstPrePlanIndex);
    const lastPrePlanIndex = dbContent.lastIndexOf('    id: "plan-pre-');
    const createdAtIndex = dbContent.indexOf('    createdAt:', lastPrePlanIndex);
    braceEndIndex = dbContent.indexOf('  }', createdAtIndex) + 3;
  }

  if (braceStartIndex !== -1 && braceEndIndex !== -1 && firstPrePlanIndex !== -1) {
    const before = dbContent.substring(0, braceStartIndex);
    const after = dbContent.substring(braceEndIndex);
    
    // Also bump CURRENT_DB_VERSION
    let updatedContent = before + plansCode + after;
    updatedContent = updatedContent.replace(
      /const CURRENT_DB_VERSION = \d+;/g,
      (match) => {
        const version = parseInt(match.match(/\d+/)![0], 10);
        return `const CURRENT_DB_VERSION = ${version + 1};`;
      }
    );
    
    fs.writeFileSync(dbPath, updatedContent);
    console.log(`[PREPLANNING] rapla-frontend/src/lib/db.ts wurde erfolgreich mit den neuen Wochenplänen aktualisiert (CURRENT_DB_VERSION erhöht).`);
  } else {
    console.error('[PREPLANNING] Fehler beim Finden des Ersetzungsbereichs in db.ts');
  }
} else {
  console.error('[PREPLANNING] db.ts Pfad existiert nicht.');
}
