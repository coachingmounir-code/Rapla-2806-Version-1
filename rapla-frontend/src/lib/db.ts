// LocalStorage Database helper for Yoga Studio Scheduler
import { supabase } from './supabaseClient';
import wochenplanRules from './data/wochenplan_rules.json' with { type: 'json' };
import { isDateInYlaRange } from './ylaData';
import { EXCEL_ABSENCES } from './excel_absences';

// Convert ISO week code (e.g. "2026-W28") to actual date string (YYYY-MM-DD) for a specific day of the week (Friday-Thursday cycle)
export function getLocalDateForDay(weekCode: string, dayOfWeek: number): string {
  const [yearStr, weekStr] = weekCode.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const daysToMonday = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1;
  const mondayOfW1 = new Date(jan4.getTime());
  mondayOfW1.setDate(jan4.getDate() - daysToMonday);

  // Monday of target week
  const targetMonday = new Date(mondayOfW1.getTime());
  targetMonday.setDate(mondayOfW1.getDate() + (week - 1) * 7);

  // Friday of target week (Monday - 3)
  const targetFriday = new Date(targetMonday.getTime());
  targetFriday.setDate(targetMonday.getDate() - 3);

  // Offset from Friday
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

export interface TimeSlot {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface TeacherRules {
  preferredRooms: string[];
  preferredDays?: number[]; // list of days (0-6) where this teacher is prioritized
  nonPreferredDays?: number[]; // list of days (0-6) where this teacher prefers not to teach
  canLeadMeditation?: boolean;
  canLeadSatsang?: boolean;
  canLeadPranayama?: boolean;
  canLeadOnn?: boolean;
  canLeadSatsangEinfuehrung?: boolean;
  canLeadHausfuehrung?: boolean;
  canLeadSpaziergang?: boolean;
  maxYogaClassesPerWeek?: number;
  maxMeditationPerWeek?: number;
  maxSatsangsPerWeek?: number;
  maxOnnPerWeek?: number;
  maxMorningSatsangsPerWeek?: number;
  noTwoYogaSameDay?: boolean;
  weekendAfternoonOnly?: boolean;
  weekendAsBackupOnly?: boolean;
  noYogaOnWeekend?: boolean;
  prefersMittelstufe?: boolean;
  customCourseNames?: { originalName: string; customName: string }[];
  availability: TimeSlot[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarColor: string;
  specialties: string[]; // e.g. ["Hatha", "Vinyasa", "Yin", "Meditation"]
  isYogaTeacher?: boolean;
  availabilityMode?: 'always' | 'seminar_only';
  roleType?: 'sevaka' | 'external' | 'karma_yogi' | 'guest_teacher'; // 'sevaka' (core team), 'external', 'karma_yogi', or 'guest_teacher'
  rules: TeacherRules;
  customWishes?: string; // free text for comments/wishes
  stayStartDate?: string; // YYYY-MM-DD (e.g. "2026-08-20")
  stayEndDate?: string;   // YYYY-MM-DD (e.g. "2026-09-10")
  stayNotes?: string;     // Notes on stay/responsibilities
}

export function isTeacherInHouseOnDate(teacher: Teacher, dateStr: string): boolean {
  if (teacher.roleType === 'sevaka') return true;
  if (!teacher.stayStartDate && !teacher.stayEndDate) {
    return teacher.roleType !== 'karma_yogi' && teacher.roleType !== 'guest_teacher';
  }
  if (teacher.stayStartDate && dateStr < teacher.stayStartDate) return false;
  if (teacher.stayEndDate && dateStr > teacher.stayEndDate) return false;
  return true;
}

export function isTeacherAbsentOnDate(teacherIdOrName: string, dateStr: string): boolean {
  if (!teacherIdOrName || !dateStr) return false;
  const idOrNameLower = teacherIdOrName.toLowerCase().trim();
  
  if ((idOrNameLower.includes('abha') || idOrNameLower === 'teacher-gen-abha-morkoetter') && isDateInYlaRange(dateStr)) {
    return true;
  }

  const allAbsences = [...(typeof window !== 'undefined' ? db.getSevafrei() : []), ...EXCEL_ABSENCES];
  return allAbsences.some((entry: any) => {
    if (!entry) return false;
    const rawName = entry.teacherName || entry.excelName || '';
    const entryName = rawName.toLowerCase().trim();
    if (!entryName) return false;
    const isMatch = idOrNameLower.includes(entryName) || entryName.includes(idOrNameLower.replace('teacher-gen-', '').split('-')[0]);
    return isMatch && dateStr >= entry.startDate && dateStr <= entry.endDate;
  });
}

export function getTeacherStayStatus(teacher: Teacher, referenceDateStr?: string): 'active' | 'upcoming' | 'expired' | 'permanent' {
  if (teacher.roleType === 'sevaka') return 'permanent';
  if (!teacher.stayStartDate && !teacher.stayEndDate) return 'permanent';
  
  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
  if (teacher.stayStartDate && teacher.stayStartDate > todayStr) {
    return 'upcoming';
  }
  if (teacher.stayEndDate && teacher.stayEndDate < todayStr) {
    return 'expired';
  }
  return 'active';
}

export function generateTeacherId(name: string, roleType: string = 'karma_yogi'): string {
  const cleanName = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const prefix = roleType === 'karma_yogi' ? 'teacher-karma' 
               : roleType === 'guest_teacher' ? 'teacher-guest' 
               : roleType === 'sevaka' ? 'teacher-gen' 
               : 'teacher';
  const slug = cleanName || 'person';
  const suffix = Date.now().toString().slice(-6);
  return `${prefix}-${slug}-${suffix}`;
}

export interface Room {
  id: string;
  name: string;
  color: string; // hex or hsl
}

export interface Course {
  id: string;
  name: string; // e.g. "Hatha Yoga Flow"
  style: string; // e.g. "Hatha"
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  roomId: string;
  teacherId: string | null; // assigned teacher
  teacherName?: string; // assigned teacher display name (safeguard against sync desync)
  additionalVisibilityTeacherIds?: string[]; // teachers for whom this course is additionally visible (e.g. mandatory participation / Schulung)
  isAiPlanned: boolean;
  status: 'draft' | 'approved';
  isManuallyEdited?: boolean;
  isFixedAgreement?: boolean; // Slot is firmly agreed upon (e.g. fixed recurring agreement with teacher)
  agreementNotes?: string;   // Notes / context for this agreed slot
}

export interface WeekPlan {
  id: string;
  name: string;
  status: 'blanko' | 'draft' | 'approved';
  courses: Course[];
  seminarLeaderIds?: string[];
  targetWeekCode?: string;
  createdAt: string;
  isManualOnly?: boolean;
  isApproved?: boolean;
  hasManualEdits?: boolean;
  lastEditedAt?: string;
  deletedCourseIds?: string[];
}

// Default Data
const DEFAULT_ROOMS: Room[] = [
  { id: 'room-1', name: 'Devi', color: '#d32f2f' },
  { id: 'room-2', name: 'Radhakrishna', color: '#f57c00' },
  { id: 'room-3', name: 'Hanuman', color: '#388e3c' },
  { id: 'room-4', name: 'Sitaram', color: '#1976d2' },
  { id: 'room-5', name: 'Tripura', color: '#7b1fa2' },
  { id: 'room-6', name: 'am Kamin', color: '#ea580c' },
  { id: 'room-7', name: 'vor dem Eingang', color: '#0d9488' }
];

const NEW_TEACHER_NAMES = [
  "! Assistenz #",
  "! Assistenz 2",
  "! Assistenz YLAB",
  "! SemBegl #",
  "! Übersetzer #",
  "! YL #",
  "Abha",
  "Adam",
  "Adinatha Lang #",
  "Alexander",
  "Amyana Finkel",
  "Ananda Schaak",
  "Ananta Heussler",
  "Anantadas Büsseler",
  "Anjali",
  "Annette Pritschow",
  "Aziza Lena Alemi",
  "Beate Menkarski",
  "Bhavani Jannausch",
  "Burnie",
  "Carina van Anken",
  "Chandrashekara",
  "Christel Smaluhn",
  "Christopher",
  "Darshanie Sukhu",
  "David",
  "Devi Ruiz",
  "Elena",
  "Eric Vis Dieperink",
  "Erkan Batmaz",
  "Gruppe Mudita",
  "Hagit Noam",
  "Harishakti",
  "Hu",
  "Ingrid Seemann",
  "Jnanadev Wallaschkowski",
  "Jörg Lützow",
  "Jörg Müller",
  "Julia Backhaus",
  "Jutta Kremer",
  "Jyoti Rudolphi #",
  "Karuna",
  "Klaus Schindler",
  "Larissa Gaertner",
  "Lilly",
  "Linda Silberbauer #",
  "Liu Jianshe",
  "Madhavi Broszinski",
  "Maharani Schons",
  "Maharani Fritsch",
  "Maria",
  "Martina Schloms #",
  "Matthias Physal #",
  "Melanie Vagt",
  "Michael Büchel",
  "Michaela Hold",
  "Mirabai Seifert",
  "Monika",
  "Monika Adele Camara",
  "Mounir",
  "Narayani",
  "Nathalie Butscher",
  "Nina Pabst",
  "Nirmaya",
  "Parashakti Küttner",
  "Petra Zimmermann",
  "Pranava",
  "Ramashakti Sikora",
  "Raphael Mousa",
  "Sarada Drautzburg",
  "Satyadevi Bretz",
  "Satyam",
  "Satyamitra",
  "Shankara Maune",
  "Shankara Hübener",
  "Shankari Susanne Hill",
  "Shantara Nickler",
  "Shivakami Bretz",
  "Sivani",
  "Sukadev Bretz",
  "Susanne Sirringhaus",
  "Swami Tattvarupananda",
  "Swami Yatidharmananda",
  "Teresa",
  "Ulrich",
  "Venulo Broszinski",
  "Volker Horn",
  "Wolfgang Seemann",
  "Wolfgang Meisel",
  "Zofia Konchok Nyima"
];

const SEVAKA_NAMES = [
  "Abha",
  "Adam",
  "Alexander",
  "Anjali",
  "Burnie",
  "burnie",
  "Chandrashekara",
  "Christopher",
  "Harishakti",
  "Hu",
  "Karuna",
  "Mounir",
  "Narayani",
  "Nirmaya",
  "Pranava",
  "Satyam",
  "Teresa",
  "Ulrich"
];

function getTeacherAvailability(name: string, isSevaka: boolean): TimeSlot[] {
  const nameLower = name.toLowerCase().trim();
  
  if (!isSevaka) {
    // Non-Sevakas (externals) are available all week from 08:00 to 22:00
    return [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '08:00', end: '22:00' }));
  }

  // Look up rules in parsed JSON
  const teacherKey = Object.keys(wochenplanRules.teachers).find(k => nameLower.includes(k) || k.includes(nameLower));
  const tRules = teacherKey ? (wochenplanRules.teachers as any)[teacherKey] : null;

  if (!tRules) {
    // Default fallback for any other Sevaka
    return [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }

  // Check preferredAvailability
  if (tRules.preferredAvailability && tRules.preferredAvailability.length > 0) {
    return tRules.preferredAvailability;
  }

  // Generate availability based on freeDays
  const freeDays = tRules.freeDays || [];
  const availDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !freeDays.includes(d));

  let slots: TimeSlot[] = availDays.map(d => ({ day: d, start: '06:00', end: '22:00' }));

  // Check availabilityRestrictions
  if (tRules.availabilityRestrictions && tRules.availabilityRestrictions.length > 0) {
    const updatedSlots: TimeSlot[] = [];
    for (const slot of slots) {
      const rest = tRules.availabilityRestrictions.find((r: any) => r.day === slot.day && r.allowed === false);
      if (rest) {
        if (rest.timeAfter) {
          // If not allowed after timeAfter, end is timeAfter
          updatedSlots.push({ ...slot, end: rest.timeAfter });
        } else if (rest.timeBefore) {
          // If not allowed before timeBefore, start is timeBefore
          updatedSlots.push({ ...slot, start: rest.timeBefore });
        } else if ((rest.timeFrom && rest.timeTo) || (rest.start && rest.end)) {
          const fromTime = rest.timeFrom || rest.start;
          const toTime = rest.timeTo || rest.end;
          if (fromTime > slot.start) {
            updatedSlots.push({ ...slot, end: fromTime });
          }
          if (toTime < slot.end) {
            updatedSlots.push({ ...slot, start: toTime });
          }
        } else {
          updatedSlots.push(slot);
        }
      } else {
        updatedSlots.push(slot);
      }
    }
    slots = updatedSlots;
  }

  return slots;
}

function getTeacherRules(name: string, isSevaka: boolean): Partial<TeacherRules> {
  const nameLower = name.toLowerCase().trim();
  
  // Look up rules in parsed JSON
  const teacherKey = Object.keys(wochenplanRules.teachers).find(k => nameLower.includes(k) || k.includes(nameLower));
  const tRules = teacherKey ? (wochenplanRules.teachers as any)[teacherKey] : null;

  if (!isSevaka || !tRules) {
    return {
      canLeadMeditation: false,
      canLeadSatsang: false,
      availability: getTeacherAvailability(name, isSevaka)
    };
  }

  // Build the rules object from the JSON rules
  const rules: Partial<TeacherRules> = {
    maxYogaClassesPerWeek: tRules.maxYogaClassesPerWeek || undefined,
    maxMeditationPerWeek: tRules.maxMeditationPerWeek !== null ? tRules.maxMeditationPerWeek : undefined,
    maxSatsangsPerWeek: tRules.maxSatsangsPerWeek !== null ? tRules.maxSatsangsPerWeek : undefined,
    maxMorningSatsangsPerWeek: tRules.maxMorningSatsangsPerWeek !== null ? tRules.maxMorningSatsangsPerWeek : undefined,
    maxOnnPerWeek: tRules.maxOnnPerWeek !== null ? tRules.maxOnnPerWeek : undefined,
    noTwoYogaSameDay: tRules.noTwoYogaSameDay || false,
    weekendAfternoonOnly: tRules.weekendAfternoonOnly || false,
    weekendAsBackupOnly: tRules.weekendAsBackupOnly || false,
    noYogaOnWeekend: tRules.noYogaOnWeekend || false,
    prefersMittelstufe: tRules.prefersMittelstufe || false,
    canLeadMeditation: wochenplanRules.meditation.allowed.some((a: string) => nameLower.includes(a)),
    canLeadSatsang: isSevaka && !wochenplanRules.satsang.forbidden.some((a: string) => nameLower.includes(a)),
    canLeadPranayama: tRules.canLeadPranayama || false,
    canLeadSatsangEinfuehrung: tRules.canLeadSatsangEinfuehrung || false,
    canLeadHausfuehrung: (wochenplanRules.hausfuehrung?.allowed || []).some((a: string) => nameLower.includes(a)),
    canLeadOnn: tRules.canLeadOnn !== undefined ? tRules.canLeadOnn : true,
    customCourseNames: tRules.customCourseNames || []
  };

  return rules;
}

const GENERATED_TEACHERS: Teacher[] = NEW_TEACHER_NAMES.map((name, index) => {
  const cleanIdName = name.toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  let id = `teacher-gen-${cleanIdName || index}`;
  if (name === "Abha") id = "teacher-gen-abha-morkoetter";
  else if (name === "Adam") id = "teacher-gen-adam-zmuda";
  else if (name === "Alexander") id = "teacher-gen-alexander-melior";
  else if (name === "Anjali") id = "teacher-gen-anjali-gelzleichter";
  else if (name === "burnie" || name === "Burnie") id = "teacher-gen-burnie-bansemer";
  else if (name === "Chandrashekara") id = "teacher-gen-chandrashekara";
  else if (name === "Hu") id = "teacher-gen-hu-buerkle";
  else if (name === "Karuna") id = "teacher-gen-karuna-wapke";
  else if (name === "Mounir") id = "teacher-gen-mouniir-jaber";
  else if (name === "Narayani") id = "teacher-gen-narayani-kedenburg";
  else if (name === "Nirmaya") id = "teacher-gen-nirmaya-fodor";
  else if (name === "Pranava") id = "teacher-gen-pranava-pauly";
  else if (name === "Teresa") id = "teacher-gen-teresa-allgaeu";
  else if (name === "Ulrich") id = "teacher-gen-ulrich-nebel";
  
  const emailName = name.toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '.');
  const email = `${emailName}@yoga.de`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '');

  const colors = [
    'from-pink-500 to-rose-500',
    'from-blue-500 to-indigo-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-600',
    'from-purple-500 to-indigo-600',
    'from-cyan-400 to-blue-500'
  ];
  const avatarColor = colors[index % colors.length];
  const isSevaka = SEVAKA_NAMES.some(s => s.toLowerCase() === name.toLowerCase());
  const isYogaTeacher = isSevaka ? !(
    name.toLowerCase().includes('teresa') || 
    name.toLowerCase().includes('hu') || 
    name.toLowerCase().includes('mounir') || 
    name.toLowerCase().includes('adam') ||
    name.toLowerCase().includes('satyam') ||
    name.toLowerCase().includes('christopher')
  ) : true;

  const tRules = getTeacherRules(name, isSevaka);

  return {
    id,
    name,
    email,
    phone: '',
    avatarColor,
    specialties: isYogaTeacher ? ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini'] : ['Meditation'],
    isYogaTeacher,
    availabilityMode: isSevaka ? 'always' : 'seminar_only',
    roleType: isSevaka ? 'sevaka' : 'external',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      ...tRules,
      availability: getTeacherAvailability(name, isSevaka)
    }
  } as Teacher;
});

const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'teacher-gen-satyam-bm',
    name: 'Satyam Bad Meinberg',
    email: '',
    phone: '',
    avatarColor: 'from-amber-500 to-orange-600',
    specialties: ['Hatha', 'Anfänger', 'Mittelstufe', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'external',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: true,
      canLeadPranayama: false,
      canLeadOnn: false,
      canLeadHausfuehrung: false,
      availability: []
    }
  },
  {
    id: 'teacher-karma-marlene',
    name: 'Marlen',
    email: '',
    phone: '',
    avatarColor: 'from-amber-400 to-orange-500',
    specialties: ['Hatha', 'Anfänger', 'Mittelstufe'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayStartDate: '2026-08-01',
    stayEndDate: '2026-10-31',
    stayNotes: 'Gibt Anfänger- und Mittelstufen-Yogastunden sowie Hausführungen.',
    customWishes: 'Gibt Anfänger- und Mittelstufen-Yogastunden sowie Hausführungen.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadHausfuehrung: true,
      prefersMittelstufe: true,
      availability: [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ]
    }
  },
  {
    id: 'teacher-karma-tanja-eichenmueller',
    name: 'Tanja',
    email: 'tanja.eichenmueller@yoga.de',
    phone: '',
    avatarColor: 'from-pink-500 to-rose-500',
    specialties: ['Hatha', 'Anfänger', 'Mittelstufe', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayStartDate: '2026-09-06',
    stayEndDate: '2026-09-20',
    stayNotes: 'Karma Yogini als Yogalehrerin (06.09. bis 20.09.2026).',
    customWishes: 'Unterrichtet als Yogalehrerin vom 06.09. bis 20.09.2026.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadHausfuehrung: false,
      prefersMittelstufe: false,
      availability: [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ]
    }
  },
  {
    id: 'teacher-karma-devani',
    name: 'Devani',
    email: '',
    phone: '',
    avatarColor: 'from-pink-500 to-rose-500',
    specialties: ['Hatha', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayNotes: 'Karma Yoga Frau, die unterrichten kann.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: true,
      canLeadPranayama: false,
      canLeadOnn: true,
      canLeadHausfuehrung: false,
      prefersMittelstufe: false,
      availability: []
    }
  },
  {
    id: 'teacher-karma-swantje',
    name: 'Swantje',
    email: 'swantje@yoga.de',
    phone: '',
    avatarColor: 'from-emerald-400 to-teal-600',
    specialties: ['Hatha', 'Anfänger', 'Mittelstufe', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayStartDate: '2026-09-01',
    stayEndDate: '2026-09-10',
    stayNotes: 'Swantje – Karma Yogini als Yogalehrerin (01.09. bis 10.09.2026).',
    customWishes: 'Unterrichtet als Yogalehrerin vom 01.09. bis 10.09.2026.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadHausfuehrung: false,
      prefersMittelstufe: false,
      availability: [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ]
    }
  },
  {
    id: 'teacher-karma-gopala',
    name: 'Gopala',
    email: '',
    phone: '',
    avatarColor: 'from-blue-500 to-indigo-500',
    specialties: ['Hatha', 'Anfänger', 'Mittelstufe', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayStartDate: '2026-09-12',
    stayEndDate: '2026-09-26',
    stayNotes: 'Karma Yogi als Yogalehrer (12.09. bis 26.09.2026).',
    customWishes: 'Unterrichtet als Yogalehrer vom 12.09. bis 26.09.2026.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadHausfuehrung: false,
      prefersMittelstufe: true,
      availability: [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ]
    }
  },
  {
    id: 'teacher-karma-irene',
    name: 'Irene Hofmann',
    email: '',
    phone: '',
    avatarColor: 'from-purple-500 to-indigo-600',
    specialties: ['Hatha', 'Anfänger', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayEndDate: '2026-10-09',
    stayNotes: 'Karma Yogini bis zum 09.10. Einteilbar für Anfängerstunden.',
    customWishes: 'Unterrichtet als Karma Yogini Anfängerstunden bis 09.10.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadHausfuehrung: false,
      prefersMittelstufe: false,
      availability: [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ]
    }
  },
  {
    id: 'teacher-karma-krishnajyoti',
    name: 'Krishnajyoti',
    email: '',
    phone: '',
    avatarColor: 'from-amber-400 to-orange-500',
    specialties: ['Hatha', 'Anfänger', 'Mittelstufe', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'karma_yogi',
    stayStartDate: '2026-10-10',
    stayEndDate: '2026-10-17',
    stayNotes: 'Karma Yogini bis zum 17.10. Einteilbar für 1x täglich eine Yogastunde und 2x für das Om Namo Narayana.',
    customWishes: 'Einteilbar bis 17.10.: täglich max. 1 Yogastunde und 2x Om Namo Narayana.',
    rules: {
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadPranayama: false,
      canLeadOnn: true,
      canLeadHausfuehrung: false,
      prefersMittelstufe: false,
      noTwoYogaSameDay: true,
      maxYogaClassesPerWeek: 7,
      maxOnnPerWeek: 2,
      availability: [
        { day: 1, start: '06:30', end: '22:00' },
        { day: 2, start: '06:30', end: '22:00' },
        { day: 3, start: '06:30', end: '22:00' },
        { day: 4, start: '06:30', end: '22:00' },
        { day: 5, start: '06:30', end: '22:00' },
        { day: 6, start: '06:30', end: '22:00' },
        { day: 0, start: '06:30', end: '22:00' }
      ]
    }
  },
  {
    id: 'teacher-1',
    name: 'Sarah Schmidt',
    email: 'sarah.schmidt@yoga.de',
    phone: '+49 176 1234567',
    avatarColor: 'from-pink-500 to-rose-500',
    specialties: ['Hatha', 'Vinyasa', 'Yin'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'external',
    rules: {
      preferredRooms: ['room-1', 'room-2'],
      preferredDays: [],
      availability: [
        { day: 1, start: '08:00', end: '14:00' }, // Mon morning
        { day: 3, start: '08:00', end: '18:00' }, // Wed all day
        { day: 5, start: '12:00', end: '20:00' }  // Fri afternoon/evening
      ]
    }
  },
  {
    id: 'teacher-2',
    name: 'Michael Müller',
    email: 'michael.mueller@yoga.de',
    phone: '+49 172 9876543',
    avatarColor: 'from-blue-500 to-indigo-500',
    specialties: ['Vinyasa', 'Power Yoga', 'Meditation'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'external',
    rules: {
      preferredRooms: ['room-1', 'room-3'],
      preferredDays: [],
      availability: [
        { day: 2, start: '10:00', end: '20:00' }, // Tue all day
        { day: 4, start: '14:00', end: '21:00' }, // Thu afternoon/evening
        { day: 6, start: '09:00', end: '16:00' }  // Sat morning/afternoon
      ]
    }
  },
  {
    id: 'teacher-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@yoga.de',
    phone: '+49 179 4561230',
    avatarColor: 'from-amber-400 to-orange-500',
    specialties: ['Yin', 'Meditation', 'Hatha'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'external',
    rules: {
      preferredRooms: ['room-2', 'room-3'],
      preferredDays: [],
      availability: [
        { day: 1, start: '14:00', end: '21:00' }, // Mon afternoon/evening
        { day: 3, start: '14:00', end: '21:00' }, // Wed afternoon/evening
        { day: 5, start: '08:00', end: '15:00' }  // Fri morning/afternoon
      ]
    }
  },
  {
    id: 'teacher-4',
    name: 'Jan Nowak',
    email: 'jan.nowak@yoga.de',
    phone: '+49 151 7894561',
    avatarColor: 'from-emerald-400 to-teal-600',
    specialties: ['Hatha', 'Meditation', 'Kundalini'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'external',
    rules: {
      preferredRooms: ['room-3'],
      preferredDays: [],
      availability: [
        { day: 2, start: '08:00', end: '12:00' }, // Tue morning
        { day: 4, start: '08:00', end: '12:00' }, // Thu morning
        { day: 0, start: '10:00', end: '18:00' }  // Sun all day
      ]
    }
  },
  ...GENERATED_TEACHERS
];

const generateDefaultCourses = (): Course[] => {
  const getTeacherIdByName = (shortName: string): string | null => {
    if (!shortName) return null;
    const nameLower = shortName.toLowerCase();
    if (nameLower === 'pranava') return 'teacher-gen-pranava-pauly';
    if (nameLower === 'nirmaya') return 'teacher-gen-nirmaya-fodor';
    if (nameLower === 'harishakti') return 'teacher-gen-harishakti';
    if (nameLower === 'abha') return 'teacher-gen-abha-morkoetter';
    if (nameLower === 'karuna') return 'teacher-gen-karuna-wapke';
    if (nameLower === 'adam') return 'teacher-gen-adam-zmuda';
    if (nameLower === 'anjali') return 'teacher-gen-anjali-gelzleichter';
    if (nameLower === 'yl') return 'teacher-gen-yl';
    if (nameLower === 'burnie') return 'teacher-gen-burnie-bansemer';
    if (nameLower === 'hu') return 'teacher-gen-hu-buerkle';
    if (nameLower === 'ulrich') return 'teacher-gen-ulrich-nebel';
    if (nameLower === 'alexander') return 'teacher-gen-alexander-melior';
    if (nameLower === 'narayani') return 'teacher-gen-narayani-kedenburg';
    if (nameLower === 'mouniir' || nameLower === 'mounir') return 'teacher-gen-mouniir-jaber';
    if (nameLower === 'christopher') return 'teacher-gen-christopher';
    if (nameLower === 'marlen' || nameLower === 'marlene') return 'teacher-karma-marlene';
    if (nameLower === 'tanja' || nameLower === 'tanja eichenmüller' || nameLower === 'tanja eichenmueller') return 'teacher-karma-tanja-eichenmueller';
    if (nameLower === 'swantje' || nameLower === 'karma yogini' || nameLower === 'karma-yogini' || nameLower === 'neue karma yogini') return 'teacher-karma-swantje';
    if (nameLower === 'gopala') return 'teacher-karma-gopala';
    if (nameLower === 'irene' || nameLower === 'irene hofmann') return 'teacher-karma-irene';
    return null;
  };

  interface RawCourseDef {
    name: string;
    style: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomId: string;
    teacherName: string;
  }

  const rawDefs: RawCourseDef[] = [
    // Friday (dayOfWeek: 5)
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 5, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Pranava' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 5, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Nirmaya' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 5, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Mittelstufe Klangyogastunde', style: 'Hatha', dayOfWeek: 5, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Anfänger Ankommensstunde', style: 'Hatha', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Mittelstufe Ankommensstunde', style: 'Hatha', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', roomId: 'room-5', teacherName: 'Karuna' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 5, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Adam' },
    { name: 'Satsang Einführung', style: 'Meditation', dayOfWeek: 5, startTime: '20:00', endTime: '20:35', roomId: 'room-5', teacherName: 'Pranava' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 5, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Saturday (dayOfWeek: 6)
    { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 6, startTime: '06:00', endTime: '06:50', roomId: 'room-2', teacherName: 'Karuna' },
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Nirmaya' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'YL' },
    { name: 'Mittelstufe Mantrayogastunde', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 6, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '20:00', endTime: '22:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Sunday (dayOfWeek: 0)
    { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 0, startTime: '06:00', endTime: '06:50', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 0, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 0, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 0, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 0, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Anfänger Ankommensstunde', style: 'Hatha', dayOfWeek: 0, startTime: '16:30', endTime: '18:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Mittelstufe Ankommensstunde', style: 'Hatha', dayOfWeek: 0, startTime: '16:30', endTime: '18:00', roomId: 'room-5', teacherName: 'Karuna' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 0, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Satsang Einführung', style: 'Meditation', dayOfWeek: 0, startTime: '20:00', endTime: '20:35', roomId: 'room-5', teacherName: '' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 0, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Monday (dayOfWeek: 1)
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Hu' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Anfänger Rückenstunde', style: 'Hatha', dayOfWeek: 1, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 1, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Ulrich' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 1, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Nirmaya' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Narayani' },
    { name: 'Entspannungsangebot: Klangreise', style: 'Entspannung', dayOfWeek: 1, startTime: '21:10', endTime: '22:00', roomId: 'room-2', teacherName: '' },

    // Tuesday (dayOfWeek: 2)
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 2, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Alexander' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 2, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Harishakti' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 2, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Harishakti' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 2, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Anfänger Yin Yoga', style: 'Hatha', dayOfWeek: 2, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 2, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Narayani' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 2, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Mounir' },
    { name: 'Meditativer Spaziergang', style: 'Entspannung', dayOfWeek: 2, startTime: '19:30', endTime: '20:30', roomId: 'room-7', teacherName: 'Pranava' },

    // Wednesday (dayOfWeek: 3)
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: '' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Narayani' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Narayani' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 3, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },
    { name: 'Entspannungsangebot: Yogageschichten am Kamin', style: 'Entspannung', dayOfWeek: 3, startTime: '21:10', endTime: '22:00', roomId: 'room-6', teacherName: '' },

    // Thursday (dayOfWeek: 4)
    { name: 'Geführte Meditation', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: '' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 4, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 4, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 4, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Ulrich' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 4, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Nirmaya' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 4, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Harishakti' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 4, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },
    { name: 'Entspannungsangebot: Peziebälle / Fantasiereise', style: 'Entspannung', dayOfWeek: 4, startTime: '21:10', endTime: '22:00', roomId: 'room-2', teacherName: '' }
  ];

  return rawDefs.map((d, index) => ({
    id: `course-def-${index + 1}`,
    name: d.name,
    style: d.style,
    dayOfWeek: d.dayOfWeek,
    startTime: d.startTime,
    endTime: d.endTime,
    roomId: d.roomId,
    teacherId: getTeacherIdByName(d.teacherName),
    isAiPlanned: false,
    status: 'draft'
  }));
};

const DEFAULT_COURSES = generateDefaultCourses();

export interface SpecialSchulungCourse {
  targetWeekCode: string;
  dayOfWeek: number;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  roomId: string;
  style: string;
}

export const SPECIAL_SCHULUNG_COURSES: SpecialSchulungCourse[] = [
  { targetWeekCode: '2026-W41', dayOfWeek: 4, date: '2026-10-08', name: 'YL-Schulung, Thema 1', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W43', dayOfWeek: 6, date: '2026-10-17', name: 'YL-Schulung, Thema 2', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W43', dayOfWeek: 4, date: '2026-10-22', name: 'YL-Schulung, Thema 3', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W44', dayOfWeek: 6, date: '2026-10-24', name: 'YL-Schulung, Thema 4', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W44', dayOfWeek: 4, date: '2026-10-29', name: 'YL-Schulung, Thema 5', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W45', dayOfWeek: 4, date: '2026-11-05', name: 'YL-Schulung, Thema 8', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W46', dayOfWeek: 4, date: '2026-11-12', name: 'YL-Schulung, Thema 9', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W47', dayOfWeek: 6, date: '2026-11-14', name: 'YL-Schulung, Thema 10', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W47', dayOfWeek: 4, date: '2026-11-19', name: 'YL-Schulung, Thema 11', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W48', dayOfWeek: 6, date: '2026-11-21', name: 'YL-Schulung, Thema 12', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' }
];

const DEFAULT_WEEK_PLANS: WeekPlan[] = [
  {
    id: 'plan-template-1',
    name: 'Blankowoche Sommer',
    status: 'blanko',
    courses: DEFAULT_COURSES.map(c => ({ ...c, isAiPlanned: false, status: 'draft' })),
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'plan-active-1',
    name: 'Kursplan (Genehmigt & Aktiv)',
    status: 'approved',
    isApproved: true,
    courses: DEFAULT_COURSES.map(c => ({ ...c, status: 'approved' })),
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  // --- PREPLANNED WEEKS ---
  {
    id: "plan-pre-2026-W41",
    name: "Vorplanung 2026-W41 (Automatisch)",
    status: "approved",
    isApproved: true,
    targetWeekCode: "2026-W41",
    courses: [
      {
        "id": "course-2026-W41-21",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-24",
        "name": "Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-26",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-31",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-33",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-35",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-37",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-39",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-41",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-47",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-48",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-50",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-51",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-52",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-53",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-54",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-55",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-56",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-schulung-yl-schulung--thema-1",
        "name": "YL-Schulung, Thema 1",
        "style": "Schulung",
        "dayOfWeek": 4,
        "startTime": "15:00",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-59",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-60",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-61",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-62",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-63",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-11",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-12",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-13",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: "2026-10-01T08:00:00.000Z"
  },
  {
    id: "plan-pre-2026-W42",
    name: "Vorplanung 2026-W42 (Automatisch)",
    status: "approved",
    isApproved: true,
    targetWeekCode: "2026-W42",
    courses: [
      {
        "id": "course-2026-W42-21",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-24",
        "name": "Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-26",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-31",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-33",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-35",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-37",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-39",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-41",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-teresa-allgaeu",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-47",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-48",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-50",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-51",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-52",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-53",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-54",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-55",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-56",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-59",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-60",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-61",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-62",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-63",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-11",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-12",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-13",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: "2026-10-01T08:00:00.000Z"
  },
  {
    id: "plan-pre-2026-W43",
    name: "Vorplanung 2026-W43 (Automatisch)",
    status: "approved",
    isApproved: true,
    targetWeekCode: "2026-W43",
    courses: [
      {
        "id": "course-2026-W43-21",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-24",
        "name": "Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-26",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-31",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-33",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-35",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-37",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-39",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-41",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-47",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-48",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-50",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-51",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-52",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-teresa-allgaeu",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-53",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-54",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-55",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-56",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-schulung-yl-schulung--thema-3",
        "name": "YL-Schulung, Thema 3",
        "style": "Schulung",
        "dayOfWeek": 4,
        "startTime": "15:00",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-59",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-60",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-61",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-62",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-63",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-11",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-12",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-13",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-schulung-yl-schulung--thema-2",
        "name": "YL-Schulung, Thema 2",
        "style": "Schulung",
        "dayOfWeek": 6,
        "startTime": "15:00",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W43-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: "2026-10-01T08:00:00.000Z"
  },
  {
    "id": "plan-pre-2026-W38",
    "name": "Vorplanung 2026-W38 (Automatisch)",
    "status": "approved",
    "isApproved": true,
    "targetWeekCode": "2026-W38",
    "courses": [
      {
        "id": "course-2026-W38-1",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-3",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-5",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-7",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-11",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-13",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-15",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-19",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-20",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-21",
        "name": "Anfänger Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-22",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-23",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-24",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-25",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-27",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-29",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-31",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-33",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-37",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-38",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-39",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-40",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-41",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-42",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-44",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-45",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-46",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-47",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-48",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-50",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-52",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-53",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-54",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-55",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-56",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-59",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-60",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    "createdAt": "2026-09-08T08:00:00.000Z"
  },
  {
    "id": "plan-pre-2026-W39",
    "name": "Vorplanung 2026-W39 (Automatisch)",
    "status": "approved",
    "isApproved": true,
    "targetWeekCode": "2026-W39",
    "courses": [
      { "id": "course-2026-W39-1", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 5, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-2", "name": "Satsang", "style": "Meditation", "dayOfWeek": 5, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-nirmaya-fodor", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-3", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 5, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-harishakti", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-4", "name": "Mittelstufe Klangyogastunde", "style": "Hatha", "dayOfWeek": 5, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-5", "name": "Anfänger Ankommensstunde", "style": "Hatha", "dayOfWeek": 5, "startTime": "16:30", "endTime": "18:00", "roomId": "room-4", "teacherId": "teacher-karma-tanja-eichenmueller", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-6", "name": "Mittelstufe Ankommensstunde", "style": "Hatha", "dayOfWeek": 5, "startTime": "16:30", "endTime": "18:00", "roomId": "room-3", "teacherId": "teacher-gen-karuna-wapke", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-7", "name": "Hausführung", "style": "Sonstiges", "dayOfWeek": 5, "startTime": "19:00", "endTime": "19:30", "roomId": "Rezeption", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-8", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 5, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-adam-zmuda", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-9", "name": "Satsang Einführung", "style": "Meditation", "dayOfWeek": 5, "startTime": "20:00", "endTime": "20:35", "roomId": "room-5", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-10", "name": "Satsang", "style": "Meditation", "dayOfWeek": 5, "startTime": "20:00", "endTime": "21:00", "roomId": "room-2", "teacherId": "teacher-gen-karuna-wapke", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-11", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 6, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-nirmaya-fodor", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-12", "name": "Satsang", "style": "Meditation", "dayOfWeek": 6, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-alexander-melior", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-13", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 6, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-14", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 6, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-karma-gopala", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-15", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 6, "startTime": "16:15", "endTime": "18:00", "roomId": "room-4", "teacherId": "teacher-gen-yl", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-17", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 6, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-anjali-gelzleichter", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-18", "name": "Satsang", "style": "Meditation", "dayOfWeek": 6, "startTime": "20:00", "endTime": "22:00", "roomId": "room-2", "teacherId": "teacher-gen-karuna-wapke", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-19", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 0, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-harishakti", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-20", "name": "Satsang", "style": "Meditation", "dayOfWeek": 0, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-burnie-bansemer", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-21", "name": "Anfänger Pavanmukt Asana", "style": "Hatha", "dayOfWeek": 0, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-burnie-bansemer", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-22", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 0, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-karma-gopala", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-23", "name": "Anfänger Ankommensstunde", "style": "Hatha", "dayOfWeek": 0, "startTime": "16:30", "endTime": "18:00", "roomId": "room-4", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-24", "name": "Mittelstufe Ankommensstunde", "style": "Hatha", "dayOfWeek": 0, "startTime": "16:30", "endTime": "18:00", "roomId": "room-3", "teacherId": "teacher-gen-anjali-gelzleichter", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-25", "name": "Hausführung", "style": "Sonstiges", "dayOfWeek": 0, "startTime": "19:00", "endTime": "19:30", "roomId": "Rezeption", "teacherId": "teacher-gen-christopher", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-26", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 0, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-christopher", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-27", "name": "Satsang Einführung", "style": "Meditation", "dayOfWeek": 0, "startTime": "20:00", "endTime": "20:35", "roomId": "room-5", "teacherId": "teacher-gen-hu-buerkle", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-28", "name": "Satsang", "style": "Meditation", "dayOfWeek": 0, "startTime": "20:00", "endTime": "21:00", "roomId": "room-2", "teacherId": "teacher-gen-karuna-wapke", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-29", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 1, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-hu-buerkle", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-30", "name": "Satsang", "style": "Meditation", "dayOfWeek": 1, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-anjali-gelzleichter", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-31", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 1, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-chandrashekara", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-32", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 1, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-gen-harishakti", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-33", "name": "Anfänger Rückenstunde", "style": "Hatha", "dayOfWeek": 1, "startTime": "16:15", "endTime": "18:00", "roomId": "room-4", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-34", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 1, "startTime": "16:15", "endTime": "18:00", "roomId": "room-3", "teacherId": "teacher-karma-gopala", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-35", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 1, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-nirmaya-fodor", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-36", "name": "Satsang", "style": "Meditation", "dayOfWeek": 1, "startTime": "20:00", "endTime": "21:00", "roomId": "room-2", "teacherId": "teacher-gen-narayani-kedenburg", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-37", "name": "Entspannungsangebot: Klangreise", "style": "Entspannung", "dayOfWeek": 1, "startTime": "21:10", "endTime": "22:00", "roomId": "room-5", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-38", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 2, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-alexander-melior", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-39", "name": "Satsang", "style": "Meditation", "dayOfWeek": 2, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-harishakti", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-40", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 2, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-alexander-melior", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-41", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 2, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-gen-anjali-gelzleichter", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-pranava-joint", "name": "Gemeinsame Stunde", "style": "Hatha", "dayOfWeek": 2, "startTime": "16:15", "endTime": "18:00", "roomId": "room-3", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-44", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 2, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-chandrashekara", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-45", "name": "Meditativer Spaziergang", "style": "Sonstiges", "dayOfWeek": 2, "startTime": "19:30", "endTime": "20:30", "roomId": "room-7", "teacherId": "teacher-gen-pranava-pauly", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-46", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 3, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-mouniir-jaber", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-47", "name": "Satsang", "style": "Meditation", "dayOfWeek": 3, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-narayani-kedenburg", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-48", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 3, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-alexander-melior", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-49", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 3, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-karma-gopala", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-50", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 3, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-adam-zmuda", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-51", "name": "Satsang", "style": "Meditation", "dayOfWeek": 3, "startTime": "20:00", "endTime": "21:00", "roomId": "room-2", "teacherId": "teacher-gen-karuna-wapke", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-52", "name": "Entspannungsangebot: Yogageschichten am Kamin", "style": "Entspannung", "dayOfWeek": 3, "startTime": "21:10", "endTime": "22:00", "roomId": "room-6", "teacherId": "teacher-gen-hu-buerkle", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-53", "name": "Geführte Meditation", "style": "Meditation", "dayOfWeek": 4, "startTime": "07:00", "endTime": "07:30", "roomId": "room-5", "teacherId": "teacher-gen-hu-buerkle", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-54", "name": "Satsang", "style": "Meditation", "dayOfWeek": 4, "startTime": "07:00", "endTime": "08:00", "roomId": "room-2", "teacherId": "teacher-gen-burnie-bansemer", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-55", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 4, "startTime": "09:15", "endTime": "11:00", "roomId": "room-4", "teacherId": "teacher-gen-alexander-melior", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-56", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 4, "startTime": "09:15", "endTime": "11:00", "roomId": "room-3", "teacherId": "teacher-karma-gopala", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-57", "name": "Anfänger", "style": "Hatha", "dayOfWeek": 4, "startTime": "16:15", "endTime": "18:00", "roomId": "room-4", "teacherId": "teacher-gen-chandrashekara", "isAiPlanned": true, "status": "approved" },
      { "id": "course-2026-W39-58", "name": "Mittelstufe", "style": "Hatha", "dayOfWeek": 4, "startTime": "16:15", "endTime": "18:00", "roomId": "room-3", "teacherId": "teacher-gen-nirmaya-fodor", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-59", "name": "Om Namo Narayanaya", "style": "Meditation", "dayOfWeek": 4, "startTime": "19:30", "endTime": "20:00", "roomId": "room-1", "teacherId": "teacher-gen-harishakti", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-60", "name": "Satsang", "style": "Meditation", "dayOfWeek": 4, "startTime": "20:00", "endTime": "21:00", "roomId": "room-2", "teacherId": "teacher-gen-karuna-wapke", "isAiPlanned": false, "status": "approved" },
      { "id": "course-2026-W39-61", "name": "Entspannungsangebot: Peziebälle", "style": "Entspannung", "dayOfWeek": 4, "startTime": "21:10", "endTime": "22:00", "roomId": "room-5", "teacherId": "teacher-gen-burnie-bansemer", "isAiPlanned": false, "status": "approved" }
    ],
    "createdAt": "2026-09-14T10:00:00.000Z"
  }
];


// Cloud-aware storage
const inMemoryStore: Record<string, any> = {};
let cloudInitialized = false;
let cloudSyncPromise: Promise<void> | null = null;
let lastCloudSyncTime = 0;
const inFlightUpserts = new Map<string, Promise<boolean>>();

const PENDING_SYNC_STORAGE_KEY = 'rapla_pending_sync_keys';

function getPendingSyncKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(PENDING_SYNC_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function markKeyPendingSync(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getPendingSyncKeys();
    keys.add(key);
    localStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(Array.from(keys)));
  } catch {}
}

function clearKeyPendingSync(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const keys = getPendingSyncKeys();
    if (keys.has(key)) {
      keys.delete(key);
      localStorage.setItem(PENDING_SYNC_STORAGE_KEY, JSON.stringify(Array.from(keys)));
    }
  } catch {}
}

// Keep inMemoryStore synchronized across multiple tabs in the same browser
if (typeof window !== 'undefined' && !(window as any).__rapla_storage_listener_attached) {
  (window as any).__rapla_storage_listener_attached = true;
  window.addEventListener('storage', (event: StorageEvent) => {
    if (!event.key) {
      for (const k of Object.keys(inMemoryStore)) {
        delete inMemoryStore[k];
      }
      return;
    }
    if (event.newValue === null) {
      delete inMemoryStore[event.key];
    } else {
      try {
        inMemoryStore[event.key] = JSON.parse(event.newValue);
      } catch {
        delete inMemoryStore[event.key];
      }
    }
  });

  // Automatically re-sync with cloud when user switches back to this tab/browser or regains connectivity
  const triggerVisibilitySync = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCloudSyncTime > 2000) {
      db.initializeCloudSync().catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', triggerVisibilitySync);
  window.addEventListener('focus', triggerVisibilitySync);
  window.addEventListener('online', () => {
    db.initializeCloudSync().catch(() => {});
  });
}

// Helper functions for storage (Read-safe: never writes defaults to localStorage on cache miss)
function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  if (inMemoryStore[key] !== undefined) {
    return inMemoryStore[key] as T;
  }

  // Fallback to localStorage without polluting localStorage with un-synced defaults
  const stored = localStorage.getItem(key);
  if (!stored) {
    const clonedDefault = JSON.parse(JSON.stringify(defaultValue)) as T;
    inMemoryStore[key] = clonedDefault;
    return clonedDefault;
  }
  try {
    const parsed = JSON.parse(stored) as T;
    inMemoryStore[key] = parsed;
    return parsed;
  } catch (e) {
    const clonedDefault = JSON.parse(JSON.stringify(defaultValue)) as T;
    inMemoryStore[key] = clonedDefault;
    return clonedDefault;
  }
}

const syncDebounceTimers: Record<string, any> = {};
let eventDebounceTimer: any = null;

async function upsertKeyToCloud(key: string, serializedValue: string): Promise<boolean> {
  if (!supabase) return true;
  const client = supabase;
  const task = (async () => {
    try {
      const { error } = await client.from('app_state').upsert({ key, value: serializedValue }, { onConflict: 'key' });
      if (error) {
        console.error(`Failed to sync ${key} to cloud`, error);
        return false;
      }
      clearKeyPendingSync(key);
      return true;
    } catch (err) {
      console.error(`Error syncing ${key} to cloud:`, err);
      return false;
    } finally {
      inFlightUpserts.delete(key);
    }
  })();
  inFlightUpserts.set(key, task);
  return await task;
}

async function setStored<T>(key: string, value: T, immediate = false): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  const serialized = JSON.stringify(value);
  inMemoryStore[key] = value;
  try {
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  markKeyPendingSync(key);
  let cloudSuccess = true;

  if (supabase) {
    if (immediate) {
      if (syncDebounceTimers[key]) {
        clearTimeout(syncDebounceTimers[key]);
        delete syncDebounceTimers[key];
      }
      cloudSuccess = await upsertKeyToCloud(key, serialized);
    } else {
      if (syncDebounceTimers[key]) clearTimeout(syncDebounceTimers[key]);
      syncDebounceTimers[key] = setTimeout(async () => {
        delete syncDebounceTimers[key];
        await upsertKeyToCloud(key, JSON.stringify(inMemoryStore[key] ?? value));
      }, 250);
    }
  }

  if (eventDebounceTimer) clearTimeout(eventDebounceTimer);
  eventDebounceTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('rapla-data-synced'));
  }, 50);

  return cloudSuccess;
}

const BOGUS_TEACHER_IDS = new Set([
  'teacher-guest-1791727410561',
  'teacher-guest-1789207307944',
  'teacher-gen-adam-anjali',
  'teacher-gen-burnie-narayani',
  'teacher-gen-mouniir-christopher',
  'teacher-gen-anjali-abha'
]);

function isBogusTeacherId(id: string | null | undefined): boolean {
  if (!id) return true;
  if (id.includes(',')) return true;
  return BOGUS_TEACHER_IDS.has(id);
}

// Idempotent, deterministic normalization for the teacher list
function normalizeTeachersList(rawTeachers: Teacher[], plansForAutoHeal?: WeekPlan[]): { teachers: Teacher[]; hasChanges: boolean } {
  const beforeJson = JSON.stringify(rawTeachers || []);
  const deletedIds = getStored<string[]>('rapla_deleted_teacher_ids', []);
  const list: Teacher[] = [];
  const seenIds = new Set<string>();

  for (const rawT of (rawTeachers || [])) {
    if (!rawT || !rawT.id) continue;
    let t: Teacher = JSON.parse(JSON.stringify(rawT));
    const nameLowerInit = (t.name || '').toLowerCase();

    // Normalize legacy IDs before deduplication
    if (nameLowerInit.includes('tanja') || t.id.includes('tanja')) {
      t.id = 'teacher-karma-tanja-eichenmueller';
    } else if (t.id === 'teacher-karma-swantje' || t.id === 'teacher-karma-neu-september' || nameLowerInit === 'swantje' || (t.roleType === 'karma_yogi' && (nameLowerInit === 'karma yogini' || nameLowerInit === 'neue karma yogini'))) {
      t.id = 'teacher-karma-swantje';
    } else if (nameLowerInit === 'gopala' || t.id === 'teacher-karma-gopala' || t.id === 'teacher-guest-1789207307944') {
      t.id = 'teacher-karma-gopala';
    } else if (t.id === 'teacher-guest-1791727410561') {
      continue; // Migrated into teacher-karma-krishnajyoti
    }

    if (isBogusTeacherId(t.id) || deletedIds.includes(t.id)) continue;
    if (seenIds.has(t.id)) continue;
    seenIds.add(t.id);
    list.push(t);
  }

  // Ensure all DEFAULT_TEACHERS are present (unless deleted)
  for (const defT of DEFAULT_TEACHERS) {
    if (deletedIds.includes(defT.id)) continue;
    const existingIdx = list.findIndex(t => t.id === defT.id || t.name === defT.name);
    if (existingIdx === -1) {
      list.push(JSON.parse(JSON.stringify(defT)));
      seenIds.add(defT.id);
    }
  }

  // Restore missing Sathyam Bad Meinberg teacher
  if (!list.some(t => t.id === 'teacher-guest-1790942126763') && !deletedIds.includes('teacher-guest-1790942126763')) {
    list.push({
      id: 'teacher-guest-1790942126763',
      name: 'Sathyam Bad Meinberg',
      email: '',
      phone: '',
      avatarColor: '#f59e0b',
      specialties: ['Meditation'],
      isYogaTeacher: false,
      availabilityMode: 'always',
      roleType: 'karma_yogi',
      rules: {
        preferredRooms: [],
        preferredDays: [],
        canLeadMeditation: true,
        canLeadSatsang: false,
        canLeadPranayama: false,
        canLeadOnn: false,
        availability: [
          { day: 1, start: '06:30', end: '22:00' },
          { day: 2, start: '06:30', end: '22:00' },
          { day: 3, start: '06:30', end: '22:00' },
          { day: 4, start: '06:30', end: '22:00' },
          { day: 5, start: '06:30', end: '22:00' },
          { day: 6, start: '06:30', end: '22:00' },
          { day: 0, start: '06:30', end: '22:00' }
        ]
      }
    });
  }

  // Auto-heal teachers referenced in week plans (splitting comma-separated multi-teacher IDs)
  try {
    const plans = plansForAutoHeal || getStored<WeekPlan[]>('rapla_week_plans', []);
    if (Array.isArray(plans)) {
      for (const p of plans) {
        if (!Array.isArray(p.courses)) continue;
        for (const c of p.courses) {
          if (!c.teacherId || c.teacherId === 'teacher-gen-yl') continue;
          const individualIds = c.teacherId.split(',').map(s => s.trim()).filter(Boolean);
          for (const rawId of individualIds) {
            const targetId = rawId === 'teacher-guest-1791727410561' ? 'teacher-karma-krishnajyoti'
                           : rawId === 'teacher-guest-1789207307944' ? 'teacher-karma-gopala'
                           : rawId;
            if (isBogusTeacherId(targetId) || deletedIds.includes(targetId) || targetId === 'teacher-gen-yl') continue;
            const singleCourseTeacherName = individualIds.length === 1 ? c.teacherName : undefined;
            const exists = list.some(t => t.id === targetId || (singleCourseTeacherName && t.name.toLowerCase() === singleCourseTeacherName.toLowerCase()));
            if (!exists && targetId.startsWith('teacher-')) {
              const cleanName = singleCourseTeacherName || targetId.replace(/^teacher-(karma|guest|gen)-/, '').replace(/-?\d+$/, '');
              const formattedName = cleanName ? cleanName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Lehrer';
              list.push({
                id: targetId,
                name: formattedName,
                email: '',
                phone: '',
                avatarColor: 'from-amber-400 to-orange-500',
                specialties: ['Hatha', 'Meditation'],
                isYogaTeacher: true,
                availabilityMode: 'always',
                roleType: targetId.includes('karma') ? 'karma_yogi' : 'guest_teacher',
                rules: {
                  preferredRooms: [],
                  preferredDays: [],
                  canLeadMeditation: true,
                  canLeadSatsang: false,
                  canLeadPranayama: false,
                  canLeadOnn: true,
                  availability: [
                    { day: 1, start: '06:30', end: '22:00' },
                    { day: 2, start: '06:30', end: '22:00' },
                    { day: 3, start: '06:30', end: '22:00' },
                    { day: 4, start: '06:30', end: '22:00' },
                    { day: 5, start: '06:30', end: '22:00' },
                    { day: 6, start: '06:30', end: '22:00' },
                    { day: 0, start: '06:30', end: '22:00' }
                  ]
                }
              });
            }
          }
        }
      }
    }
  } catch {}

  for (const t of list) {
    if (!t.rules) {
      t.rules = { preferredRooms: [], preferredDays: [], availability: [] };
    }
    if (!Array.isArray(t.rules.availability)) {
      t.rules.availability = [];
    }

    if ((t.id === 'teacher-karma-marlene' || t.name === 'Marlene') && t.name !== 'Marlen') t.name = 'Marlen';
    else if (t.id === 'teacher-gen-abha-morkoetter' && t.name !== 'Abha') t.name = 'Abha';
    else if (t.id === 'teacher-gen-adam-zmuda' && t.name !== 'Adam') t.name = 'Adam';
    else if (t.id === 'teacher-gen-alexander-melior' && t.name !== 'Alexander') t.name = 'Alexander';
    else if (t.id === 'teacher-gen-anjali-gelzleichter' && t.name !== 'Anjali') t.name = 'Anjali';
    else if ((t.id === 'teacher-gen-burnie-bansemer' || t.name === 'Burnie') && t.name !== 'burnie') t.name = 'burnie';
    else if (t.id === 'teacher-gen-chandrashekara' && t.name !== 'Chandrashekara') t.name = 'Chandrashekara';
    else if (t.id === 'teacher-gen-hu-buerkle' && t.name !== 'Hu') t.name = 'Hu';
    else if (t.id === 'teacher-gen-karuna-wapke' && t.name !== 'Karuna') t.name = 'Karuna';
    else if (t.id === 'teacher-gen-mouniir-jaber' && t.name !== 'Mounir') t.name = 'Mounir';
    else if (t.id === 'teacher-gen-narayani-kedenburg' && t.name !== 'Narayani') t.name = 'Narayani';
    else if (t.id === 'teacher-gen-nirmaya-fodor' && t.name !== 'Nirmaya') t.name = 'Nirmaya';
    else if (t.id === 'teacher-gen-pranava-pauly' && t.name !== 'Pranava') t.name = 'Pranava';
    else if (t.id === 'teacher-gen-teresa-allgaeu' && t.name !== 'Teresa') t.name = 'Teresa';
    else if (t.id === 'teacher-gen-ulrich-nebel' && t.name !== 'Ulrich') t.name = 'Ulrich';
    else if (t.id === 'teacher-gen-christopher' && t.name !== 'Christopher') t.name = 'Christopher';

    const nameLower = t.name.toLowerCase();

    // Harishakti & Christopher availability rules (free Wednesday, Tue after 11:00 off, Thu before 11:00 off)
    if (nameLower.includes('harishakti') || nameLower.includes('christopher')) {
      t.rules.availability = [
        { day: 0, start: '06:00', end: '22:00' },
        { day: 1, start: '06:00', end: '22:00' },
        { day: 2, start: '06:00', end: '11:00' },
        { day: 4, start: '11:00', end: '22:00' },
        { day: 5, start: '06:00', end: '22:00' },
        { day: 6, start: '06:00', end: '22:00' }
      ];
    }

    // Chandrashekara rules (Tuesday afternoon off: 12:00 - 18:30)
    if (nameLower.includes('chandrashekara') || t.id === 'teacher-gen-chandrashekara') {
      const hasTueAfternoon = t.rules.availability.some(
        s => s.day === 2 && s.start <= '12:00' && s.end >= '18:00'
      );
      if (hasTueAfternoon || !t.rules.availability.some(s => s.day === 2 && s.end === '12:00')) {
        t.rules.availability = t.rules.availability
          .filter(s => s.day !== 2)
          .concat([
            { day: 2, start: '06:00', end: '12:00' },
            { day: 2, start: '18:30', end: '22:00' }
          ])
          .sort((a, b) => a.day !== b.day ? a.day - b.day : a.start.localeCompare(b.start));
      }
    }

    // Karuna rules (Monday off)
    if (nameLower.includes('karuna')) {
      const hasMondayAvail = t.rules.availability.some(a => a.day === 1);
      if (hasMondayAvail) {
        t.rules.availability = [
          { day: 2, start: '06:00', end: '22:00' },
          { day: 3, start: '06:00', end: '22:00' },
          { day: 4, start: '06:00', end: '22:00' },
          { day: 5, start: '06:00', end: '22:00' },
          { day: 6, start: '06:00', end: '22:00' },
          { day: 0, start: '06:00', end: '22:00' }
        ];
      }
    }

    let correctRole = t.roleType || 'external';
    if (SEVAKA_NAMES.includes(t.name)) {
      correctRole = 'sevaka';
    } else if (t.roleType !== 'karma_yogi' && t.roleType !== 'guest_teacher') {
      correctRole = 'external';
    }

    const correctYogaTeacher = correctRole === 'sevaka'
      ? !['teresa', 'hu', 'mounir', 'adam', 'satyam', 'christopher'].some(n => nameLower.includes(n))
      : (t.isYogaTeacher !== undefined ? t.isYogaTeacher : true);
    if (t.isYogaTeacher !== correctYogaTeacher) {
      t.isYogaTeacher = correctYogaTeacher;
      t.specialties = correctYogaTeacher ? (t.specialties.length > 0 ? t.specialties : ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini']) : ['Meditation'];
    }
    if (t.availabilityMode === undefined) {
      t.availabilityMode = 'always';
    }
    if (t.roleType !== correctRole) {
      t.roleType = correctRole;
    }

    if (correctRole === 'sevaka') {
      t.availabilityMode = 'always';
      t.rules.availability = t.rules.availability.map(slot => {
        if (slot.start === '08:00' || slot.start === '06:30') {
          return { ...slot, start: '06:00' };
        }
        return slot;
      });
    }

    if (t.rules.preferredDays === undefined) {
      t.rules.preferredDays = [];
    }
    if (nameLower.includes('satyam') && !nameLower.includes('meinberg')) {
      t.isYogaTeacher = false;
      t.rules.availability = [];
      t.rules.canLeadHausfuehrung = false;
      t.rules.canLeadOnn = false;
    }
    const shouldLeadMeditation = ['pranava', 'harishakti', 'alexander', 'burnie', 'nirmaya', 'narayani', 'mounir', 'mouniir', 'hu', 'christopher'].some(n => nameLower.includes(n));
    const shouldLeadSatsang = correctRole === 'sevaka' && !['adam', 'hu', 'mounir', 'mouniir', 'teresa', 'satyam', 'ulrich', 'pranava'].some(n => nameLower.includes(n));
    t.rules.canLeadMeditation = shouldLeadMeditation;
    t.rules.canLeadSatsang = shouldLeadSatsang;

    if (t.id === 'teacher-karma-tanja-eichenmueller') {
      t.name = 'Tanja';
      t.roleType = 'karma_yogi';
      t.isYogaTeacher = true;
      t.stayStartDate = '2026-09-06';
      t.stayEndDate = '2026-09-20';
      if (!t.stayNotes) t.stayNotes = 'Karma Yogini als Yogalehrerin (06.09. bis 20.09.2026).';
      t.availabilityMode = 'always';
      if (!t.rules.availability || t.rules.availability.length === 0 || t.rules.availability.some(s => s.start === '08:00')) {
        t.rules.availability = [
          { day: 1, start: '06:30', end: '22:00' },
          { day: 2, start: '06:30', end: '22:00' },
          { day: 3, start: '06:30', end: '22:00' },
          { day: 4, start: '06:30', end: '22:00' },
          { day: 5, start: '06:30', end: '22:00' },
          { day: 6, start: '06:30', end: '22:00' },
          { day: 0, start: '06:30', end: '22:00' }
        ];
      }
    }

    if (t.id === 'teacher-karma-swantje') {
      t.name = 'Swantje';
      t.email = 'swantje@yoga.de';
      t.roleType = 'karma_yogi';
      t.isYogaTeacher = true;
      t.stayStartDate = '2026-09-01';
      t.stayEndDate = '2026-09-10';
      if (!t.stayNotes || t.stayNotes.includes('Karma Yogini – unterrichtet')) {
        t.stayNotes = 'Swantje – Karma Yogini als Yogalehrerin (01.09. bis 10.09.2026).';
      }
      t.availabilityMode = 'always';
      if (!t.rules.availability || t.rules.availability.length === 0 || t.rules.availability.some(s => s.start === '08:00')) {
        t.rules.availability = [
          { day: 1, start: '06:30', end: '22:00' },
          { day: 2, start: '06:30', end: '22:00' },
          { day: 3, start: '06:30', end: '22:00' },
          { day: 4, start: '06:30', end: '22:00' },
          { day: 5, start: '06:30', end: '22:00' },
          { day: 6, start: '06:30', end: '22:00' },
          { day: 0, start: '06:30', end: '22:00' }
        ];
      }
    }

    if (t.id === 'teacher-karma-marlene') {
      t.name = 'Marlen';
      t.roleType = 'karma_yogi';
      t.isYogaTeacher = true;
    }

    if (t.id === 'teacher-karma-gopala') {
      t.name = 'Gopala';
      t.roleType = 'karma_yogi';
      t.isYogaTeacher = true;
      t.stayStartDate = '2026-09-12';
      t.stayEndDate = '2026-09-26';
      if (!t.stayNotes) t.stayNotes = 'Karma Yogi als Yogalehrer (12.09. bis 26.09.2026).';
      t.availabilityMode = 'always';
      if (!t.rules.availability || t.rules.availability.length === 0) {
        t.rules.availability = [
          { day: 1, start: '06:30', end: '22:00' },
          { day: 2, start: '06:30', end: '22:00' },
          { day: 3, start: '06:30', end: '22:00' },
          { day: 4, start: '06:30', end: '22:00' },
          { day: 5, start: '06:30', end: '22:00' },
          { day: 6, start: '06:30', end: '22:00' },
          { day: 0, start: '06:30', end: '22:00' }
        ];
      }
    }
  }

  const afterJson = JSON.stringify(list);
  return { teachers: list, hasChanges: beforeJson !== afterJson };
}

// Comprehensive Teacher Reconciliation Function to guarantee custom & default teachers are ALWAYS preserved and merged
export function reconcileTeachersWithCloud(
  localTeachers: Teacher[], 
  remoteTeachers: Teacher[],
  allowLocalNewTeachers = true
): { teachers: Teacher[]; hasChanges: boolean } {
  const remoteBeforeJson = JSON.stringify(remoteTeachers || []);
  const deletedIds = getStored<string[]>('rapla_deleted_teacher_ids', []);
  const teacherMap = new Map<string, Teacher>();

  // 1. First populate with default teachers (except deleted ones)
  for (const defT of DEFAULT_TEACHERS) {
    if (!deletedIds.includes(defT.id)) {
      teacherMap.set(defT.id, JSON.parse(JSON.stringify(defT)));
    }
  }

  // 2. Merge remote teachers (authoritative over defaults)
  if (Array.isArray(remoteTeachers)) {
    for (const remT of remoteTeachers) {
      if (!remT || !remT.id || isBogusTeacherId(remT.id) || deletedIds.includes(remT.id)) continue;
      const existing = teacherMap.get(remT.id);
      if (existing) {
        teacherMap.set(remT.id, {
          ...existing,
          ...remT,
          rules: { ...existing.rules, ...(remT.rules || {}) }
        });
      } else {
        teacherMap.set(remT.id, JSON.parse(JSON.stringify(remT)));
      }
    }
  }

  // 3. Merge local teachers (only when local storage actually had custom teachers)
  if (allowLocalNewTeachers && Array.isArray(localTeachers)) {
    for (const locT of localTeachers) {
      if (!locT || !locT.id || isBogusTeacherId(locT.id) || deletedIds.includes(locT.id)) continue;
      const existing = teacherMap.get(locT.id);
      if (!existing) {
        teacherMap.set(locT.id, JSON.parse(JSON.stringify(locT)));
      } else {
        const merged: Teacher = {
          ...existing,
          ...locT,
          rules: {
            ...(existing.rules || {}),
            ...(locT.rules || {})
          }
        };
        teacherMap.set(locT.id, merged);
      }
    }
  }

  const { teachers: normalized } = normalizeTeachersList(Array.from(teacherMap.values()));
  const afterJson = JSON.stringify(normalized);
  return { teachers: normalized, hasChanges: afterJson !== remoteBeforeJson };
}

function isSamePlanIdentity(a: WeekPlan, b: WeekPlan): boolean {
  if (a.id === b.id) return true;
  if (a.targetWeekCode && b.targetWeekCode && a.targetWeekCode === b.targetWeekCode) return true;
  return false;
}

// Comprehensive, 100% Idempotent Reconciliation Function for Week Plans
export function reconcilePlansWithDefaults(plans: WeekPlan[]): { plans: WeekPlan[]; hasChanges: boolean } {
  const beforeJson = JSON.stringify(plans || []);
  const rawList: WeekPlan[] = JSON.parse(beforeJson);

  // 1. Deduplicate plans by id or targetWeekCode (fixes duplicate plan-active-1 or duplicate week plans)
  const list: WeekPlan[] = [];
  for (const candidate of rawList) {
    if (!candidate || !candidate.id) continue;
    // Fix corrupted plan-active-1 that got overwritten by plan-template-1 due to undefined === undefined
    if (candidate.id === 'plan-active-1' && candidate.name === 'Blankowoche Sommer' && list.some(p => p.id === 'plan-template-1')) {
      const defActive = DEFAULT_WEEK_PLANS.find(dp => dp.id === 'plan-active-1');
      if (defActive && !rawList.some(p => p.id === 'plan-active-1' && p.name === 'Kursplan (Genehmigt & Aktiv)')) {
        Object.assign(candidate, JSON.parse(JSON.stringify(defActive)));
      } else {
        continue;
      }
    }
    const existingIdx = list.findIndex(p => isSamePlanIdentity(p, candidate));
    if (existingIdx === -1) {
      list.push(candidate);
    } else {
      const existing = list[existingIdx];
      const candTime = candidate.lastEditedAt ? new Date(candidate.lastEditedAt).getTime() : 0;
      const existTime = existing.lastEditedAt ? new Date(existing.lastEditedAt).getTime() : 0;
      if (candTime > existTime || (candidate.hasManualEdits && !existing.hasManualEdits)) {
        list[existingIdx] = candidate;
      }
    }
  }

  // 2. Reconcile with DEFAULT_WEEK_PLANS
  for (const defPlan of DEFAULT_WEEK_PLANS) {
    const idx = list.findIndex(p => isSamePlanIdentity(p, defPlan));
    if (idx === -1) {
      list.push(JSON.parse(JSON.stringify(defPlan)));
    } else {
      const plan = list[idx];
      if (defPlan.targetWeekCode && plan.targetWeekCode !== defPlan.targetWeekCode) {
        plan.targetWeekCode = defPlan.targetWeekCode;
      }
      if (defPlan.isApproved && plan.isApproved !== true && !(plan as any).manuallyUnapproved) {
        plan.isApproved = true;
        plan.status = 'approved';
      }

      if (!Array.isArray(plan.courses)) {
        plan.courses = JSON.parse(JSON.stringify(defPlan.courses));
      }

      // Sync courses from defPlan
      for (const defC of defPlan.courses) {
        if (plan.deletedCourseIds?.includes(defC.id)) {
          continue;
        }

        // Skip courses that are intentionally filtered out by week-specific rules below
        if (plan.targetWeekCode === '2026-W37' && defC.dayOfWeek === 2 && defC.name.toLowerCase().includes('spaziergang')) {
          continue;
        }
        if (plan.targetWeekCode === '2026-W38' && defC.dayOfWeek === 4 && (defC.name.toLowerCase().includes('entspannung') || defC.style.toLowerCase().includes('entspannung'))) {
          continue;
        }
        if (plan.targetWeekCode === '2026-W39' && (
          (defC.dayOfWeek === 6 && defC.startTime === '16:15' && (defC.name.toLowerCase().includes('mantra') || defC.id === 'course-2026-W39-16')) ||
          (defC.dayOfWeek === 2 && defC.startTime === '16:15' && (defC.name.toLowerCase().includes('anfänger') || defC.name.toLowerCase().includes('mittelstufe') || defC.id === 'course-2026-W39-42' || defC.id === 'course-2026-W39-43'))
        )) {
          continue;
        }

        const existingC = plan.courses.find(c =>
          c.id === defC.id ||
          (c.dayOfWeek === defC.dayOfWeek && c.startTime === defC.startTime && c.name === defC.name)
        );

        if (!existingC) {
          const isSchulung = defC.name.toLowerCase().includes('schulung') || defC.style?.toLowerCase().includes('schulung');
          if ((plan.hasManualEdits || plan.isManualOnly) && !isSchulung && plan.targetWeekCode !== '2026-W43') {
            continue;
          }
          plan.courses.push(JSON.parse(JSON.stringify(defC)));
        } else {
          if (defC.additionalVisibilityTeacherIds && defC.additionalVisibilityTeacherIds.length > 0) {
            if (!existingC.additionalVisibilityTeacherIds || JSON.stringify(existingC.additionalVisibilityTeacherIds) !== JSON.stringify(defC.additionalVisibilityTeacherIds)) {
              existingC.additionalVisibilityTeacherIds = [...defC.additionalVisibilityTeacherIds];
            }
          }
          if (defC.id === 'course-2026-W36-sevaka-schulung') {
            existingC.roomId = defC.roomId;
            existingC.teacherId = defC.teacherId;
            existingC.startTime = defC.startTime;
            existingC.endTime = defC.endTime;
          }
          // For preplanned weeks W40-W43, ensure any unedited course matches the canonical default assignment
          if (['2026-W40', '2026-W41', '2026-W42', '2026-W43'].includes(plan.targetWeekCode || '') && !existingC.isManuallyEdited) {
            const isSchulung = existingC.name.toLowerCase().includes('schulung') || existingC.style?.toLowerCase().includes('schulung');
            if (!isSchulung) {
              if (!plan.hasManualEdits && !plan.isManualOnly) {
                existingC.teacherId = defC.teacherId;
                existingC.isAiPlanned = defC.isAiPlanned;
                existingC.roomId = defC.roomId;
                existingC.startTime = defC.startTime;
                existingC.endTime = defC.endTime;
                existingC.status = 'approved';
              } else if (plan.targetWeekCode === '2026-W43') {
                // Heal specific courses in 2026-W43 if they were affected by the eef40de regression or left unassigned without manual edit
                const regressionIds: Record<string, string | null> = {
                  'course-2026-W43-6': 'teacher-gen-harishakti',
                  'course-2026-W43-8': 'teacher-gen-adam-anjali',
                  'course-2026-W43-18': 'teacher-gen-anjali-gelzleichter',
                  'course-2026-W43-46': 'teacher-gen-teresa-allgaeu',
                  'course-2026-W43-52': null,
                  'course-2026-W43-61': 'teacher-gen-adam-zmuda'
                };
                if (!existingC.teacherId || (existingC.id in regressionIds && existingC.teacherId === regressionIds[existingC.id])) {
                  existingC.teacherId = defC.teacherId;
                  existingC.isAiPlanned = defC.isAiPlanned;
                }
              }
            }
          }
        }
      }
    }
  }

  // 3. Apply universal normalizations across all plans
  const APPROVED_WEEKS = new Set(['2026-W36', '2026-W37', '2026-W38', '2026-W39', '2026-W40', '2026-W41', '2026-W42', '2026-W43']);

  for (const p of list) {
    if (p.targetWeekCode === '2026-W36') {
      p.isApproved = true;
      p.status = 'approved';
      p.isManualOnly = true;
      p.hasManualEdits = true;
    } else if (p.targetWeekCode && APPROVED_WEEKS.has(p.targetWeekCode)) {
      if (!(p as any).manuallyUnapproved) {
        p.isApproved = true;
        p.status = 'approved';
      }
    } else if (p.isApproved === undefined) {
      if (p.status === 'approved' && p.targetWeekCode !== '2026-W35') {
        p.isApproved = true;
      } else if (p.status !== 'blanko') {
        p.isApproved = false;
        p.status = 'draft';
      }
    }

    if (p.seminarLeaderIds === undefined) {
      p.seminarLeaderIds = [];
    }

    if (!Array.isArray(p.courses)) {
      p.courses = [];
    }

    // Remove legacy course-2026-W36-mittelstufe-pflicht and invalid Ankommensmed. days
    p.courses = p.courses.filter(c => {
      if (c.id === 'course-2026-W36-mittelstufe-pflicht') return false;
      const isAnkommen = c.name === 'Ankommensmed.' || c.name.includes('Ankommen');
      if (isAnkommen && c.dayOfWeek !== 5 && c.dayOfWeek !== 0) return false;
      return true;
    });

    for (const c of p.courses) {
      if (c.teacherId === 'teacher-guest-1789207307944') {
        c.teacherId = 'teacher-karma-gopala';
        c.teacherName = 'Gopala';
      }
      if (c.teacherId === 'teacher-guest-1791727410561') {
        c.teacherId = 'teacher-karma-krishnajyoti';
        c.teacherName = 'Krishnajyoti';
      }
      if (c.teacherId === 'teacher-karma-krishnajyoti' && !c.teacherName) {
        c.teacherName = 'Krishnajyoti';
      }
      // Ensure Chandrashekara is never scheduled on Tuesday afternoon (12:00 - 18:30)
      if (c.dayOfWeek === 2 && c.teacherId === 'teacher-gen-chandrashekara' && c.startTime >= '12:00' && c.startTime < '18:30') {
        c.teacherId = 'teacher-gen-narayani-kedenburg';
      }
      // Saturday evening Satsang always lasts until 22:00 (Langer Satsang)
      if (!c.isManuallyEdited && c.dayOfWeek === 6 && c.name.toLowerCase() === 'satsang' && c.startTime === '20:00' && c.endTime !== '22:00') {
        c.endTime = '22:00';
      }
      if (p.isApproved && c.status !== 'approved') {
        c.status = 'approved';
      }
    }

    if (p.targetWeekCode) {
      for (const c of p.courses) {
        const courseDate = getLocalDateForDay(p.targetWeekCode, c.dayOfWeek);
        const nameLower = c.name.toLowerCase();

        if (isDateInYlaRange(courseDate) && !p.isManualOnly && !p.hasManualEdits) {
          if (c.dayOfWeek !== 0 && !(p.targetWeekCode === '2026-W37' && c.dayOfWeek === 2) && (nameLower.includes('om namo') || nameLower.includes('narayanaya')) && c.roomId !== 'room-1' && !c.isManuallyEdited) {
            c.roomId = 'room-1';
          }
          if (!c.isManuallyEdited && (c.teacherId === 'teacher-gen-abha-morkoetter' || c.teacherId === 'abha')) {
            c.teacherId = null;
            c.isAiPlanned = false;
          }
          const isPranavaWalk = c.dayOfWeek === 2 && (nameLower.includes('spaziergang') || c.roomId === 'room-7') && c.teacherId === 'teacher-gen-pranava-pauly';
          if (!isPranavaWalk && !c.isManuallyEdited && c.teacherId && isTeacherAbsentOnDate(c.teacherId, courseDate)) {
            c.teacherId = null;
            c.isAiPlanned = true;
          }
          if (!c.isManuallyEdited && c.teacherId) {
            const tId = c.teacherId.toLowerCase();
            if (tId.includes('christopher') || tId.includes('harishakti')) {
              const isTueAfter11 = c.dayOfWeek === 2 && c.startTime >= '11:00';
              const isWed = c.dayOfWeek === 3;
              const isThuBefore11 = c.dayOfWeek === 4 && c.startTime < '11:00';
              if (isTueAfter11 || isWed || isThuBefore11) {
                c.teacherId = null;
                c.isAiPlanned = true;
              }
            }
          }
          if (!c.isManuallyEdited && !p.isManualOnly && nameLower === 'satsang' && c.startTime === '07:00') {
            const ylaMorningMap: Record<string, string> = {
              '2026-08-31': 'teacher-gen-anjali-gelzleichter',
              '2026-09-01': 'teacher-gen-karuna-wapke',
              '2026-09-02': 'teacher-gen-anjali-gelzleichter',
              '2026-09-03': 'teacher-gen-karuna-wapke',
              '2026-09-04': 'teacher-gen-narayani-schumacher'
            };
            if (ylaMorningMap[courseDate] && c.teacherId !== ylaMorningMap[courseDate]) {
              c.teacherId = ylaMorningMap[courseDate];
            }
          }
        }
      }

      p.courses = p.courses.filter(c => {
        if (c.isManuallyEdited) return true;
        const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
        if (isPranayama) {
          const courseDate = getLocalDateForDay(p.targetWeekCode!, c.dayOfWeek);
          if (isDateInYlaRange(courseDate)) return false;
        }
        return true;
      });
    }

    if (p.targetWeekCode === '2026-W38') {
      p.courses = p.courses.filter(c => c.isManuallyEdited || !(c.dayOfWeek === 4 && (c.name.toLowerCase().includes('entspannung') || c.style.toLowerCase().includes('entspannung'))));
    }

    if (p.targetWeekCode === '2026-W39') {
      p.courses = p.courses.filter(c =>
        c.isManuallyEdited || (
          !(c.dayOfWeek === 6 && c.startTime === '16:15' && (c.name.toLowerCase().includes('mantra') || c.id === 'course-2026-W39-16')) &&
          !(c.dayOfWeek === 2 && c.startTime === '16:15' && (c.name.toLowerCase().includes('anfänger') || c.name.toLowerCase().includes('mittelstufe') || c.id === 'course-2026-W39-42' || c.id === 'course-2026-W39-43'))
        )
      );
      const hasPranavaJoint = p.courses.some(c => c.dayOfWeek === 2 && c.startTime === '16:15' && (c.teacherId === 'teacher-gen-pranava-pauly' || c.name.toLowerCase().includes('gemeinsam')));
      if (!hasPranavaJoint) {
        p.courses.push({
          id: 'course-2026-W39-pranava-joint',
          name: 'Gemeinsame Stunde',
          style: 'Hatha',
          dayOfWeek: 2,
          startTime: '16:15',
          endTime: '18:00',
          roomId: 'room-3',
          teacherId: 'teacher-gen-pranava-pauly',
          isAiPlanned: false,
          status: p.status === 'approved' ? 'approved' : 'draft'
        });
      }
    }

    if (p.targetWeekCode === '2026-W37') {
      p.courses = p.courses.filter(c => c.isManuallyEdited || !(c.dayOfWeek === 2 && c.name.toLowerCase().includes('spaziergang')));

      const onnCourseId = 'course-2026-W37-44';
      const onnCourse = p.courses.find(c => c.id === onnCourseId || (c.dayOfWeek === 2 && (c.name.toLowerCase().includes('om namo') || c.name.toLowerCase().includes('narayanaya'))));
      if (!onnCourse && !p.deletedCourseIds?.includes(onnCourseId)) {
        p.courses.push({
          id: onnCourseId,
          name: 'Om Namo Narayanaya',
          style: 'Meditation',
          dayOfWeek: 2,
          startTime: '19:30',
          endTime: '20:00',
          roomId: 'room-2',
          teacherId: 'teacher-gen-chandrashekara',
          isAiPlanned: false,
          status: p.status === 'approved' ? 'approved' : 'draft'
        });
      } else if (onnCourse && !onnCourse.isManuallyEdited) {
        if (onnCourse.teacherId === 'teacher-gen-christopher') {
          onnCourse.teacherId = 'teacher-gen-chandrashekara';
        }
        onnCourse.roomId = 'room-2';
        onnCourse.startTime = '19:30';
        onnCourse.endTime = '20:00';
      }

      const pujaCourseId = 'course-2026-W37-puja-sivananda';
      const pujaCourse = p.courses.find(c => c.id === pujaCourseId || (c.dayOfWeek === 2 && (c.name.toLowerCase().includes('sivananda') || c.name.toLowerCase().includes('shivananda')) && c.startTime === '20:00'));
      if (!pujaCourse && !p.deletedCourseIds?.includes(pujaCourseId)) {
        p.courses.push({
          id: pujaCourseId,
          name: 'Swami Sivanandas Geburtstag Puja',
          style: 'Puja',
          dayOfWeek: 2,
          startTime: '20:00',
          endTime: '21:30',
          roomId: 'room-2',
          teacherId: 'teacher-gen-karuna-wapke',
          isAiPlanned: false,
          status: p.status === 'approved' ? 'approved' : 'draft'
        });
      } else if (pujaCourse && !pujaCourse.isManuallyEdited) {
        pujaCourse.teacherId = 'teacher-gen-karuna-wapke';
        pujaCourse.roomId = 'room-2';
        pujaCourse.startTime = '20:00';
        pujaCourse.endTime = '21:30';
        pujaCourse.name = 'Swami Sivanandas Geburtstag Puja';
        pujaCourse.style = 'Puja';
      }
    } else {
      const walkId = `course-${p.targetWeekCode || p.id}-walk-tue`;
      const walkCourse = p.courses.find(c => c.id === walkId || (c.dayOfWeek === 2 && (c.name.toLowerCase().includes('spaziergang') || c.roomId === 'room-7')));
      if (!walkCourse && !p.deletedCourseIds?.includes(walkId)) {
        p.courses.push({
          id: walkId,
          name: 'Meditativer Spaziergang',
          style: 'Entspannung',
          dayOfWeek: 2,
          startTime: '19:30',
          endTime: '20:30',
          roomId: 'room-7',
          teacherId: 'teacher-gen-pranava-pauly',
          isAiPlanned: false,
          status: p.status === 'approved' ? 'approved' : 'draft'
        });
      } else if (walkCourse && !walkCourse.isManuallyEdited) {
        walkCourse.name = 'Meditativer Spaziergang';
        walkCourse.startTime = '19:30';
        walkCourse.endTime = '20:30';
        walkCourse.roomId = 'room-7';
        if (!walkCourse.teacherId && p.targetWeekCode !== '2026-W37') {
          walkCourse.teacherId = 'teacher-gen-pranava-pauly';
        }
      }
    }

    // Ensure all special Schulung courses are injected into corresponding week plans if not present
    if (p.targetWeekCode) {
      const schulungenForWeek = SPECIAL_SCHULUNG_COURSES.filter(s => s.targetWeekCode === p.targetWeekCode);
      for (const s of schulungenForWeek) {
        const courseId = `course-${s.targetWeekCode}-schulung-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const existingC = p.courses.find(c =>
          c.id === courseId ||
          (c.dayOfWeek === s.dayOfWeek && c.startTime === s.startTime && c.name.toLowerCase().includes('schulung'))
        );
        if (!existingC && !p.deletedCourseIds?.includes(courseId)) {
          p.courses.push({
            id: courseId,
            name: s.name,
            style: s.style,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            roomId: s.roomId,
            teacherId: null,
            isAiPlanned: false,
            status: p.status === 'approved' ? 'approved' : 'draft'
          });
        }
      }
    }

    p.courses.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      const timeCmp = a.startTime.localeCompare(b.startTime);
      if (timeCmp !== 0) return timeCmp;
      return a.id.localeCompare(b.id);
    });
  }

  const afterJson = JSON.stringify(list);
  return { plans: list, hasChanges: beforeJson !== afterJson };
}

const CURRENT_DB_VERSION = 140;

// Database Actions
export const db = {
  getStored,
  setStored,
  initializeCloudSync: async (): Promise<void> => {
    if (typeof window === 'undefined' || !supabase) return;
    if (cloudSyncPromise) {
      return await cloudSyncPromise;
    }

    cloudSyncPromise = (async () => {
      try {
        // Flush any pending debounce timers to ensure latest local edits are sent to cloud
        for (const [key, timer] of Object.entries(syncDebounceTimers)) {
          clearTimeout(timer);
          delete syncDebounceTimers[key];
          if (inMemoryStore[key] !== undefined) {
            await upsertKeyToCloud(key, JSON.stringify(inMemoryStore[key]));
          }
        }

        // Wait for any in-flight local upserts to finish before pulling from cloud
        if (inFlightUpserts.size > 0) {
          await Promise.allSettled(Array.from(inFlightUpserts.values()));
        }

        const { data, error } = await supabase.from('app_state').select('*');
        lastCloudSyncTime = Date.now();

        if (!error && data && data.length > 0) {
          let changed = false;
          const pendingKeys = getPendingSyncKeys();
          const hadLocalPlansInStorage = localStorage.getItem('rapla_week_plans') !== null;
          const hadLocalTeachersInStorage = localStorage.getItem('rapla_teachers') !== null;

          // Process rapla_deleted_teacher_ids first if present in cloud
          const deletedTeachersRow = data.find(r => r.key === 'rapla_deleted_teacher_ids');
          if (deletedTeachersRow?.value) {
            try {
              const remDeleted: string[] = JSON.parse(deletedTeachersRow.value);
              const locDeleted = getStored<string[]>('rapla_deleted_teacher_ids', []);
              const mergedDeleted = Array.from(new Set([...locDeleted, ...(Array.isArray(remDeleted) ? remDeleted : [])]));
              const mergedDeletedStr = JSON.stringify(mergedDeleted);
              if (localStorage.getItem('rapla_deleted_teacher_ids') !== mergedDeletedStr) {
                localStorage.setItem('rapla_deleted_teacher_ids', mergedDeletedStr);
                changed = true;
              }
              inMemoryStore['rapla_deleted_teacher_ids'] = mergedDeleted;
            } catch {}
          }

          for (const row of data) {
            try {
              if (row.key === 'rapla_deleted_teacher_ids') continue;

              if (row.key === 'rapla_week_plans') {
                const remotePlans: WeekPlan[] = JSON.parse(row.value);
                const localPlans = hadLocalPlansInStorage
                  ? getStored<WeekPlan[]>('rapla_week_plans', DEFAULT_WEEK_PLANS)
                  : [];
                const isPendingLocalPlans = pendingKeys.has('rapla_week_plans');

                let needsCloudPush = false;

                const merged: WeekPlan[] = remotePlans.map(remPlan => {
                  const locPlan = localPlans.find(lp => isSamePlanIdentity(lp, remPlan));
                  if (!locPlan) return remPlan;

                  const locTime = locPlan.lastEditedAt ? new Date(locPlan.lastEditedAt).getTime() : 0;
                  const remTime = remPlan.lastEditedAt ? new Date(remPlan.lastEditedAt).getTime() : 0;

                  // Case 1: Local has a strictly newer timestamp (or unsynced pending edit)
                  if ((locPlan.hasManualEdits || locPlan.isManualOnly) && (locTime > remTime || (isPendingLocalPlans && locTime >= remTime && locTime > 0))) {
                    needsCloudPush = true;
                    return locPlan;
                  }

                  // Case 2: Local browser has manual edits on individual courses or plan settings
                  if (locPlan.hasManualEdits || locPlan.isManualOnly || locPlan.courses?.some(c => c.isManuallyEdited)) {
                    let anyCourseMerged = false;
                    const mergedCourses = remPlan.courses.map(rc => {
                      const lc = locPlan.courses?.find(c => c.id === rc.id || (c.dayOfWeek === rc.dayOfWeek && c.startTime === rc.startTime && c.roomId === rc.roomId));
                      if (lc && lc.isManuallyEdited && !rc.isManuallyEdited) {
                        anyCourseMerged = true;
                        return lc;
                      }
                      return rc;
                    });
                    // Also preserve any custom manually-added courses in locPlan not in remPlan
                    for (const lc of (locPlan.courses || [])) {
                      if (lc.isManuallyEdited && !mergedCourses.some(mc => mc.id === lc.id || (mc.dayOfWeek === lc.dayOfWeek && mc.startTime === lc.startTime && mc.name === lc.name))) {
                        if (!remPlan.deletedCourseIds?.includes(lc.id)) {
                          mergedCourses.push(lc);
                          anyCourseMerged = true;
                        }
                      }
                    }
                    const seminarLeadersChanged = locPlan.seminarLeaderIds && locPlan.seminarLeaderIds.length > 0 && JSON.stringify(locPlan.seminarLeaderIds) !== JSON.stringify(remPlan.seminarLeaderIds || []);
                    if (anyCourseMerged || seminarLeadersChanged) {
                      needsCloudPush = true;
                      return {
                        ...remPlan,
                        hasManualEdits: true,
                        isManualOnly: locPlan.isManualOnly ?? remPlan.isManualOnly,
                        seminarLeaderIds: seminarLeadersChanged ? locPlan.seminarLeaderIds : (remPlan.seminarLeaderIds || []),
                        lastEditedAt: locTime >= remTime ? (locPlan.lastEditedAt || new Date().toISOString()) : remPlan.lastEditedAt,
                        courses: mergedCourses
                      };
                    }
                  }

                  return remPlan;
                });

                // Include any locally created plans with manual edits that don't exist in remotePlans yet
                for (const locPlan of localPlans) {
                  if ((locPlan.hasManualEdits || locPlan.isManualOnly) && !merged.some(mp => isSamePlanIdentity(mp, locPlan))) {
                    merged.push(locPlan);
                    needsCloudPush = true;
                  }
                }

                // Apply universal idempotent reconciliation with codebase defaults
                const { plans: reconciled } = reconcilePlansWithDefaults(merged);
                const mergedStr = JSON.stringify(reconciled);

                const currentStr = localStorage.getItem('rapla_week_plans');
                if (currentStr !== mergedStr) {
                  changed = true;
                  localStorage.setItem('rapla_week_plans', mergedStr);
                }
                inMemoryStore['rapla_week_plans'] = reconciled;
                localStorage.setItem('rapla_db_version', CURRENT_DB_VERSION.toString());

                if (needsCloudPush && supabase) {
                  await upsertKeyToCloud('rapla_week_plans', mergedStr);
                } else {
                  clearKeyPendingSync('rapla_week_plans');
                }
              } else if (row.key === 'rapla_teachers') {
                const remoteTeachers: Teacher[] = JSON.parse(row.value);
                const localTeachers = hadLocalTeachersInStorage
                  ? getStored<Teacher[]>('rapla_teachers', DEFAULT_TEACHERS)
                  : [];
                const allowLocalNew = hadLocalTeachersInStorage && pendingKeys.has('rapla_teachers');
                const { teachers: reconciled } = reconcileTeachersWithCloud(localTeachers, remoteTeachers, allowLocalNew);

                const reconciledStr = JSON.stringify(reconciled);
                const currentStr = localStorage.getItem('rapla_teachers');
                if (currentStr !== reconciledStr) {
                  changed = true;
                  localStorage.setItem('rapla_teachers', reconciledStr);
                }
                inMemoryStore['rapla_teachers'] = reconciled;

                if (allowLocalNew && reconciledStr !== row.value && supabase) {
                  await upsertKeyToCloud('rapla_teachers', reconciledStr);
                } else {
                  clearKeyPendingSync('rapla_teachers');
                }
              } else {
                if (pendingKeys.has(row.key) && localStorage.getItem(row.key) !== null) {
                  const localVal = localStorage.getItem(row.key)!;
                  if (localVal !== row.value) {
                    await upsertKeyToCloud(row.key, localVal);
                  } else {
                    clearKeyPendingSync(row.key);
                  }
                } else {
                  const currentStr = localStorage.getItem(row.key);
                  if (currentStr !== row.value) {
                    changed = true;
                    localStorage.setItem(row.key, row.value);
                  }
                  inMemoryStore[row.key] = JSON.parse(row.value);
                  if (row.key === 'rapla_yla_assignments') {
                    window.dispatchEvent(new CustomEvent('yla-assignment-changed'));
                  }
                }
              }
            } catch (e) {
              console.error('Error processing row in initializeCloudSync:', row.key, e);
            }
          }
          cloudInitialized = true;
          if (changed) {
            window.dispatchEvent(new CustomEvent('rapla-data-synced'));
            window.dispatchEvent(new CustomEvent('yla-assignment-changed'));
          }
        } else {
          cloudInitialized = true;
        }

        // Setup Realtime sync so updates across all connected team/admin devices reflect immediately
        if (supabase && typeof window !== 'undefined' && !(window as any).__rapla_realtime_initialized) {
          (window as any).__rapla_realtime_initialized = true;
          try {
            supabase
              .channel('app_state_realtime_channel')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload: any) => {
                if (payload?.new?.key && payload?.new?.value) {
                  try {
                    const key = payload.new.key;
                    const val = payload.new.value;
                    if (inFlightUpserts.has(key)) return;

                    const current = localStorage.getItem(key);
                    if (current !== val) {
                      if (key === 'rapla_week_plans') {
                        const remotePlans: WeekPlan[] = JSON.parse(val);
                        const { plans: reconciled } = reconcilePlansWithDefaults(remotePlans);
                        const reconciledStr = JSON.stringify(reconciled);
                        if (current === reconciledStr) return;
                        localStorage.setItem(key, reconciledStr);
                        inMemoryStore[key] = reconciled;
                      } else if (key === 'rapla_teachers') {
                        const remoteTeachers: Teacher[] = JSON.parse(val);
                        const { teachers: reconciled } = reconcileTeachersWithCloud([], remoteTeachers, false);
                        const reconciledStr = JSON.stringify(reconciled);
                        if (current === reconciledStr) return;
                        localStorage.setItem(key, reconciledStr);
                        inMemoryStore[key] = reconciled;
                      } else {
                        localStorage.setItem(key, val);
                        inMemoryStore[key] = JSON.parse(val);
                      }
                      if (key === 'rapla_yla_assignments') {
                        window.dispatchEvent(new CustomEvent('yla-assignment-changed'));
                      }
                      window.dispatchEvent(new CustomEvent('rapla-data-synced'));
                    }
                  } catch (err) {
                    console.error('Error handling realtime app_state update:', err);
                  }
                }
              })
              .subscribe();
          } catch (subErr) {
            console.error('Failed to subscribe to realtime app_state changes:', subErr);
          }
        }
      } catch (e) {
        console.error('Failed to initialize cloud sync', e);
        cloudInitialized = true;
      } finally {
        cloudSyncPromise = null;
      }
    })();

    return await cloudSyncPromise;
  },
  getSevafrei: (): any[] => {
    const list = [...getStored<any[]>('rapla_sevafrei', [])];
    const hasChristopher = list.some((a: any) =>
      (a.teacherName?.toLowerCase().includes('christopher') || a.teacherId === 'teacher-gen-christopher') &&
      a.startDate === '2026-10-31' &&
      a.endDate === '2026-11-01'
    );
    if (!hasChristopher) {
      list.push({
        id: 'sf-christopher-2026-10-31-2026-11-01',
        teacherId: 'teacher-gen-christopher',
        teacherName: 'Christopher',
        avatarColor: 'from-amber-400 to-orange-500',
        startDate: '2026-10-31',
        endDate: '2026-11-01',
        type: 'Urlaub',
        status: 'Genehmigt',
        note: 'Sevafrei'
      });
      inMemoryStore['rapla_sevafrei'] = list;
      if (typeof window !== 'undefined' && localStorage.getItem('rapla_sevafrei') !== null) {
        try {
          localStorage.setItem('rapla_sevafrei', JSON.stringify(list));
        } catch (e) {}
      }
    }
    return list;
  },
  saveSevafrei: (list: any[]): void => { setStored('rapla_sevafrei', list); },
  getDefaultCourses: (): Course[] => DEFAULT_COURSES,
  getTeachers: (): Teacher[] => {
    const stored = getStored<Teacher[]>('rapla_teachers', DEFAULT_TEACHERS);
    const { teachers: list, hasChanges } = normalizeTeachersList(stored);

    inMemoryStore['rapla_teachers'] = list;
    if (hasChanges && typeof window !== 'undefined' && localStorage.getItem('rapla_teachers') !== null) {
      try {
        localStorage.setItem('rapla_teachers', JSON.stringify(list));
      } catch {}
    }
    return list;
  },
  saveTeachers: (teachers: Teacher[], immediate = true): void => {
    const { teachers: normalized } = normalizeTeachersList(teachers);
    setStored('rapla_teachers', normalized, immediate);
  },
  saveTeachersAsync: async (teachers: Teacher[]): Promise<boolean> => {
    const { teachers: normalized } = normalizeTeachersList(teachers);
    return await setStored('rapla_teachers', normalized, true);
  },
  addTeacher: (teacher: Teacher, immediate = true): void => {
    const deletedIds = getStored<string[]>('rapla_deleted_teacher_ids', []);
    if (deletedIds.includes(teacher.id)) {
      setStored('rapla_deleted_teacher_ids', deletedIds.filter(id => id !== teacher.id), true);
    }
    const list = db.getTeachers();
    const existingIdx = list.findIndex(t => t.id === teacher.id);
    if (existingIdx !== -1) {
      list[existingIdx] = teacher;
    } else {
      list.push(teacher);
    }
    db.saveTeachers(list, immediate);
  },
  addTeacherAsync: async (teacher: Teacher): Promise<boolean> => {
    const deletedIds = getStored<string[]>('rapla_deleted_teacher_ids', []);
    if (deletedIds.includes(teacher.id)) {
      setStored('rapla_deleted_teacher_ids', deletedIds.filter(id => id !== teacher.id), true);
    }
    const list = db.getTeachers();
    const existingIdx = list.findIndex(t => t.id === teacher.id);
    if (existingIdx !== -1) {
      list[existingIdx] = teacher;
    } else {
      list.push(teacher);
    }
    const { teachers: normalized } = normalizeTeachersList(list);
    return await setStored('rapla_teachers', normalized, true);
  },
  updateTeacher: (teacher: Teacher, immediate = true): void => {
    const list = db.getTeachers();
    const index = list.findIndex(t => t.id === teacher.id);
    if (index !== -1) {
      list[index] = teacher;
      db.saveTeachers(list, immediate);
    }
  },
  updateTeacherAsync: async (teacher: Teacher): Promise<boolean> => {
    const list = db.getTeachers();
    const index = list.findIndex(t => t.id === teacher.id);
    if (index !== -1) {
      list[index] = teacher;
      const { teachers: normalized } = normalizeTeachersList(list);
      return await setStored('rapla_teachers', normalized, true);
    }
    return false;
  },
  deleteTeacher: (id: string, immediate = true): void => {
    const deletedIds = getStored<string[]>('rapla_deleted_teacher_ids', []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      setStored('rapla_deleted_teacher_ids', deletedIds, true);
    }
    const list = db.getTeachers();
    db.saveTeachers(list.filter(t => t.id !== id), immediate);
    
    // Clean up course assignments across all plans for deleted teacher
    const plans = db.getWeekPlans();
    const updated = plans.map(plan => ({
      ...plan,
      courses: plan.courses.map(c => c.teacherId === id ? { ...c, teacherId: null, isAiPlanned: false } : c)
    }));
    db.saveWeekPlans(updated);
  },
  deleteTeacherAsync: async (id: string): Promise<boolean> => {
    const deletedIds = getStored<string[]>('rapla_deleted_teacher_ids', []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      await setStored('rapla_deleted_teacher_ids', deletedIds, true);
    }
    const list = db.getTeachers();
    const ok = await setStored('rapla_teachers', list.filter(t => t.id !== id), true);
    
    // Clean up course assignments across all plans for deleted teacher
    const plans = db.getWeekPlans();
    const updated = plans.map(plan => ({
      ...plan,
      courses: plan.courses.map(c => c.teacherId === id ? { ...c, teacherId: null, isAiPlanned: false } : c)
    }));
    db.saveWeekPlans(updated);
    return ok;
  },
  
  getRooms: (): Room[] => {
    const stored = getStored<Room[]>('rapla_rooms', DEFAULT_ROOMS);
    const isOld = stored.length !== DEFAULT_ROOMS.length || stored.some(r => r.name === 'Sivananda Saal' || r.name === 'Radhakrisna') || !stored.some(r => r.name === 'am Kamin') || !stored.some(r => r.name === 'vor dem Eingang');
    if (isOld) {
      inMemoryStore['rapla_rooms'] = DEFAULT_ROOMS;
      if (typeof window !== 'undefined' && localStorage.getItem('rapla_rooms') !== null) {
        try {
          localStorage.setItem('rapla_rooms', JSON.stringify(DEFAULT_ROOMS));
        } catch {}
      }
      return DEFAULT_ROOMS;
    }
    let hasUpdated = false;
    for (const r of stored) {
      if (r.id === 'room-2' && r.name === 'Radhakrisna') {
        r.name = 'Radhakrishna';
        hasUpdated = true;
      }
    }
    if (hasUpdated) {
      inMemoryStore['rapla_rooms'] = stored;
      if (typeof window !== 'undefined' && localStorage.getItem('rapla_rooms') !== null) {
        try {
          localStorage.setItem('rapla_rooms', JSON.stringify(stored));
        } catch {}
      }
    }
    return stored;
  },
  saveRooms: (rooms: Room[]): void => { setStored('rapla_rooms', rooms); },
  
  // Week Plan Methods (Read-safe: never triggers cloud upserts or event loops)
  getWeekPlans: (): WeekPlan[] => {
    const stored = getStored<WeekPlan[]>('rapla_week_plans', DEFAULT_WEEK_PLANS);
    const hasOldCourses = stored.some(p => p.courses?.some(c => c.name === 'Morgen-Hatha Flow'));
    const basePlans = hasOldCourses ? DEFAULT_WEEK_PLANS : stored;

    const { plans: list, hasChanges } = reconcilePlansWithDefaults(basePlans);
    inMemoryStore['rapla_week_plans'] = list;

    if ((hasChanges || hasOldCourses) && typeof window !== 'undefined' && localStorage.getItem('rapla_week_plans') !== null) {
      try {
        localStorage.setItem('rapla_week_plans', JSON.stringify(list));
      } catch {}
    }
    return list;
  },
  saveWeekPlans: (plans: WeekPlan[]): void => {
    const { plans: reconciled } = reconcilePlansWithDefaults(plans);
    setStored('rapla_week_plans', reconciled, true);
  },
  getWeekPlan: (id: string): WeekPlan | undefined => db.getWeekPlans().find(p => p.id === id),
  addWeekPlan: (plan: WeekPlan): void => {
    const list = db.getWeekPlans();
    plan.lastEditedAt = new Date().toISOString();
    list.push(plan);
    db.saveWeekPlans(list);
  },
  updateWeekPlan: (plan: WeekPlan): void => {
    const list = db.getWeekPlans();
    const index = list.findIndex(p => p.id === plan.id || (plan.targetWeekCode && p.targetWeekCode === plan.targetWeekCode));
    if (index !== -1) {
      plan.lastEditedAt = new Date().toISOString();
      list[index] = plan;
      db.saveWeekPlans(list);
    } else {
      plan.lastEditedAt = new Date().toISOString();
      list.push(plan);
      db.saveWeekPlans(list);
    }
  },
  deleteWeekPlan: (id: string): void => {
    const list = db.getWeekPlans();
    db.saveWeekPlans(list.filter(p => p.id !== id));
  },
  setWeekPlanApproval: (weekCodeOrPlanId: string, isApproved: boolean): WeekPlan | undefined => {
    const list = db.getWeekPlans();
    let plan = list.find(p => p.id === weekCodeOrPlanId || p.targetWeekCode === weekCodeOrPlanId);
    if (!plan) {
      const template = list.find(p => p.id === 'plan-template-1') || list[0];
      plan = {
        ...template,
        id: `plan-auto-${weekCodeOrPlanId}`,
        targetWeekCode: weekCodeOrPlanId,
        status: isApproved ? 'approved' : 'draft',
        isApproved,
        hasManualEdits: true,
        courses: template ? template.courses.map(c => ({
          ...c,
          id: 'course-' + Math.random().toString(36).substr(2, 9),
          teacherId: null,
          isAiPlanned: false,
          status: isApproved ? 'approved' : 'draft'
        })) : [],
        createdAt: new Date().toISOString(),
        lastEditedAt: new Date().toISOString()
      };
      (plan as any).manuallyUnapproved = !isApproved;

      const schulungenForWeek = SPECIAL_SCHULUNG_COURSES.filter(s => s.targetWeekCode === weekCodeOrPlanId);
      for (const s of schulungenForWeek) {
        plan.courses.push({
          id: `course-${s.targetWeekCode}-schulung-${s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: s.name,
          style: s.style,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          roomId: s.roomId,
          teacherId: null,
          isAiPlanned: false,
          status: isApproved ? 'approved' : 'draft'
        });
      }
      plan.courses.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });

      list.push(plan);
    } else {
      plan.isApproved = isApproved;
      plan.status = isApproved ? 'approved' : 'draft';
      plan.hasManualEdits = true;
      (plan as any).manuallyUnapproved = !isApproved;
      if (isApproved) {
        plan.courses = plan.courses.map(c => ({ ...c, status: 'approved' }));
      }
      plan.lastEditedAt = new Date().toISOString();
    }
    db.saveWeekPlans(list);
    return plan;
  },
  isWeekPlanApproved: (weekCodeOrPlanId: string): boolean => {
    const list = db.getWeekPlans();
    const plan = list.find(p => p.id === weekCodeOrPlanId || p.targetWeekCode === weekCodeOrPlanId);
    return !!plan && (plan.isApproved === true || (plan.status === 'approved' && plan.isApproved !== false));
  },

  // Courses API - maps to specific plan (defaults to first approved plan if no planId provided)
  getCourses: (planId?: string): Course[] => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(id);
    return plan ? plan.courses : [];
  },
  saveCourses: (courses: Course[], planId?: string): void => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(id);
    if (plan) {
      plan.courses = courses;
      db.updateWeekPlan(plan);
    }
  },
  addCourse: (course: Course, planId?: string): void => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(id);
    if (plan) {
      course.isManuallyEdited = true;
      course.isAiPlanned = false;
      plan.courses.push(course);
      plan.isManualOnly = true;
      plan.hasManualEdits = true;
      plan.lastEditedAt = new Date().toISOString();
      db.updateWeekPlan(plan);
    }
  },
  updateCourse: (course: Course, planId?: string): void => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(id);
    if (plan) {
      const index = plan.courses.findIndex(c => c.id === course.id);
      if (index !== -1) {
        course.isManuallyEdited = true;
        course.isAiPlanned = false;
        plan.courses[index] = course;
        plan.isManualOnly = true;
        plan.hasManualEdits = true;
        plan.lastEditedAt = new Date().toISOString();
        db.updateWeekPlan(plan);
      }
    }
  },
  deleteCourse: (id: string, planId?: string): void => {
    const plans = db.getWeekPlans();
    const pId = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(pId);
    if (plan) {
      if (!plan.deletedCourseIds) plan.deletedCourseIds = [];
      if (!plan.deletedCourseIds.includes(id)) {
        plan.deletedCourseIds.push(id);
      }
      plan.courses = plan.courses.filter(c => c.id !== id);
      plan.isManualOnly = true;
      plan.hasManualEdits = true;
      plan.lastEditedAt = new Date().toISOString();
      db.updateWeekPlan(plan);
    }
  },
  
  // Clear all planner data for a specific plan
  resetSchedule: (planId?: string): void => {
    const plans = db.getWeekPlans();
    const pId = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(pId);
    if (plan) {
      plan.courses = plan.courses.map(c => ({ ...c, teacherId: null, isAiPlanned: false, isManuallyEdited: false, status: 'draft' }));
      plan.deletedCourseIds = [];
      plan.isManualOnly = false;
      plan.hasManualEdits = false;
      plan.lastEditedAt = new Date().toISOString();
      db.updateWeekPlan(plan);
    }
  },

  syncWithServerAndCloud: async (): Promise<{ success: boolean; message: string }> => {
    if (typeof window === 'undefined') return { success: false, message: 'Nicht im Browser' };
    try {
      const timestamp = Date.now();
      const noCacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      const fetchWithTimeout = async (url: string, timeoutMs = 4000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
            headers: noCacheHeaders
          });
          clearTimeout(timer);
          return res;
        } catch (err) {
          clearTimeout(timer);
          throw err;
        }
      };

      // 1. FIRST: Sync Supabase cloud state (Week plans, YLA assignments, teachers, rooms, etc.)
      // Doing this FIRST guarantees a fresh browser/device pulls the authoritative cloud state before merging server JSONs
      await db.initializeCloudSync();

      // 2. Sync wishes from server JSON to localStorage & teachers (only saving if something actually changed)
      try {
        const wishesRes = await fetchWithTimeout(`/api/sevakas-wishes?t=${timestamp}`);
        if (wishesRes.ok) {
          const wishes = await wishesRes.json();
          if (wishes && wishes.length > 0) {
            const teachers = db.getTeachers();
            let updated = false;
            for (const wish of wishes) {
              const idx = teachers.findIndex((t: any) => t.id === wish.id || t.name === wish.name);
              if (idx !== -1) {
                const beforeWishStr = JSON.stringify(teachers[idx]);
                teachers[idx].rules = { ...teachers[idx].rules, ...wish.rules };
                if (wish.availabilityMode) teachers[idx].availabilityMode = wish.availabilityMode;
                if (wish.specialties) teachers[idx].specialties = wish.specialties;
                if (wish.customWishes !== undefined) teachers[idx].customWishes = wish.customWishes;
                if (JSON.stringify(teachers[idx]) !== beforeWishStr) {
                  updated = true;
                }
              }
            }
            if (updated) {
              await db.saveTeachersAsync(teachers);
            }
          }
        }
      } catch (e) {
        console.warn('Wishes sync skipped or timed out:', e);
      }

      // 3. Sync absences from server JSON to localStorage & sevafrei (only saving if something actually changed)
      try {
        const absencesRes = await fetchWithTimeout(`/api/sevafrei?t=${timestamp}`);
        if (absencesRes.ok) {
          const serverAbsences = await absencesRes.json();
          if (serverAbsences && serverAbsences.length > 0) {
            let localAbsences = db.getSevafrei();
            let updated = false;
            
            const serverIds = new Set(serverAbsences.map((a: any) => a.id));
            const originalLength = localAbsences.length;
            localAbsences = localAbsences.filter((a: any) => {
              if (a.id.startsWith('sf-') && a.id.length > 15) {
                if ((a.startDate?.startsWith('2026-09') || a.startDate?.startsWith('2026-10')) && !serverIds.has(a.id)) {
                  return false;
                }
              }
              return true;
            });
            if (localAbsences.length !== originalLength) updated = true;

            for (const sAbs of serverAbsences) {
              const idx = localAbsences.findIndex((a: any) => a.id === sAbs.id);
              if (idx !== -1) {
                if (JSON.stringify(localAbsences[idx]) !== JSON.stringify(sAbs)) {
                  localAbsences[idx] = sAbs;
                  updated = true;
                }
              } else {
                localAbsences.push(sAbs);
                updated = true;
              }
            }
            if (updated) {
              await setStored('rapla_sevafrei', localAbsences, true);
            }
          }
        }
      } catch (e) {
        console.warn('Absences sync skipped or timed out:', e);
      }

      // 4. Ensure week plans are verified in memory
      db.getWeekPlans();

      // 5. Dispatch events so all active components (Wochenplan, YLA, Team views, Teachers) update immediately
      window.dispatchEvent(new CustomEvent('rapla-data-synced'));
      window.dispatchEvent(new CustomEvent('yla-assignment-changed'));
      return { success: true, message: 'Daten erfolgreich synchronisiert' };
    } catch (err: any) {
      console.error('Sync error:', err);
      return { success: false, message: err?.message || 'Fehler bei der Synchronisation' };
    }
  },

  syncDatabase: (): void => {
    if (typeof window !== 'undefined') {
      db.syncWithServerAndCloud().then(() => {
        window.dispatchEvent(new CustomEvent('rapla-data-synced'));
      });
    }
  },

  getOrCreateUpcomingWeekPlans: (): WeekPlan[] => {
    const plans = db.getWeekPlans();
    const upcoming: WeekPlan[] = [];
    
    const today = new Date();
    const currentDay = today.getDay();
    let daysToMonday = 0;
    if (currentDay === 5) daysToMonday = 3;
    else if (currentDay === 6) daysToMonday = 2;
    else if (currentDay === 0) daysToMonday = 1;
    else if (currentDay === 1) daysToMonday = 0;
    else if (currentDay === 2) daysToMonday = -1;
    else if (currentDay === 3) daysToMonday = -2;
    else if (currentDay === 4) daysToMonday = -3;
    
    // Helper to calculate ISO week number
    const getWeekNo = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Generate/retrieve for 4 weeks (current week = 0, +1, +2, +3)
    for (let w = 0; w < 4; w++) {
      const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      monday.setDate(today.getDate() + daysToMonday + (w * 7));
      
      const year = monday.getFullYear();
      const weekNum = getWeekNo(monday);
      const weekStr = weekNum.toString().padStart(2, '0');
      const weekCode = `${year}-W${weekStr}`;
      
      // Calculate date range string (Friday to Thursday)
      // Wait, the scheduler starts on Friday! So let's calculate Friday to Thursday:
      const friday = new Date(monday.getTime());
      friday.setDate(monday.getDate() - 3); // Monday - 3 = Friday
      const nextThursday = new Date(friday.getTime());
      nextThursday.setDate(friday.getDate() + 6); // Friday + 6 = Thursday
      
      const startStr = friday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      const endStr = nextThursday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      const rangeLabel = `${startStr} - ${endStr}`;
      
      let plan = plans.find(p => p.targetWeekCode === weekCode);
      if (!plan) {
        const template = plans.find(p => p.id === 'plan-template-1') || plans[0];
        const isAfterW40 = weekCode > '2026-W40';
        
        // Helper to get local date for a day
        const getLocalDateForPlanDay = (dOfWeek: number): string => {
          let dayOff = 0;
          if (dOfWeek === 5) dayOff = 0;
          else if (dOfWeek === 6) dayOff = 1;
          else if (dOfWeek === 0) dayOff = 2;
          else if (dOfWeek === 1) dayOff = 3;
          else if (dOfWeek === 2) dayOff = 4;
          else if (dOfWeek === 3) dayOff = 5;
          else if (dOfWeek === 4) dayOff = 6;
          const d = new Date(friday.getTime());
          d.setDate(friday.getDate() + dayOff);
          const y = d.getFullYear();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          const dayNumStr = d.getDate().toString().padStart(2, '0');
          return `${y}-${m}-${dayNumStr}`;
        };

        plan = {
          id: `plan-auto-${weekCode}`,
          name: `KW ${weekNum} (${rangeLabel})`,
          status: 'draft',
          targetWeekCode: weekCode,
          courses: template.courses
            .filter(c => {
              const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
              if (isPranayama) {
                const cDate = getLocalDateForPlanDay(c.dayOfWeek);
                if (isDateInYlaRange(cDate)) return false;
              }
              return true;
            })
            .map(c => {
              const cDate = getLocalDateForPlanDay(c.dayOfWeek);
              const isAbhaInYla = (c.teacherId === 'teacher-gen-abha-morkoetter' || c.teacherId === 'abha') && isDateInYlaRange(cDate);
              const inYla = isDateInYlaRange(cDate);
              const nameLower = c.name.toLowerCase();
              let roomId = c.roomId;
              if (inYla) {
                const isAfterYlaEnd = cDate === '2026-09-27' && c.startTime >= '16:30';
                if (!isAfterYlaEnd) {
                  if (nameLower.includes('anfänger')) roomId = 'room-4';
                  else if (nameLower.includes('mittelstufe')) roomId = 'room-3';
                }
              }
              const isAbsent = c.teacherId ? isTeacherAbsentOnDate(c.teacherId, cDate) : false;
              const shouldUnassign = isAfterW40 || isAbhaInYla || isAbsent;
              return {
                ...c,
                id: 'course-' + Math.random().toString(36).substr(2, 9),
                roomId,
                teacherId: shouldUnassign ? null : c.teacherId,
                isAiPlanned: isAbsent ? true : false,
                status: 'draft'
              };
            }),
          createdAt: new Date().toISOString()
        };
        plans.push(plan);
        db.saveWeekPlans(plans);
      }
      upcoming.push(plan);
    }
    return upcoming;
  }
};
