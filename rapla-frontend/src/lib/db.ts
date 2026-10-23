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
  onlyMittelstufeYoga?: boolean;
  maxAnfaengerYogaPerWeek?: number;
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
  lastEditedAt?: string; // ISO timestamp of the latest manual or approved edit to this individual course
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
  manuallyUnapproved?: boolean;
  lastEditedAt?: string;
  deletedCourseIds?: string[];
}

// Default Data
const DEFAULT_ROOMS: Room[] = [
  { id: 'room-2', name: 'Radhakrishna', color: '#f57c00' },
  { id: 'room-1', name: 'Devi', color: '#d32f2f' },
  { id: 'room-5', name: 'Tripura', color: '#7b1fa2' },
  { id: 'room-4', name: 'Sitaram', color: '#1976d2' },
  { id: 'room-3', name: 'Hanuman', color: '#388e3c' },
  { id: 'room-7', name: 'Eingangsbereich', color: '#0d9488' },
  { id: 'room-6', name: 'Kaminzimmer', color: '#ea580c' }
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
    onlyMittelstufeYoga: tRules.onlyMittelstufeYoga || false,
    maxAnfaengerYogaPerWeek: tRules.maxAnfaengerYogaPerWeek !== undefined ? tRules.maxAnfaengerYogaPerWeek : undefined,
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
    id: 'teacher-custom-christina-und-roland',
    name: 'Christina und Roland',
    email: '',
    phone: '',
    avatarColor: 'from-purple-500 to-indigo-600',
    specialties: ['Qigong', 'Klangreise', 'Lachyoga', 'Entspannung', 'Hatha'],
    isYogaTeacher: true,
    availabilityMode: 'always',
    roleType: 'external',
    rules: {
      preferredRooms: ['room-2'],
      preferredDays: [],
      canLeadMeditation: true,
      canLeadSatsang: false,
      canLeadPranayama: false,
      canLeadOnn: false,
      canLeadHausfuehrung: false,
      availability: [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '08:00', end: '22:00' }))
    }
  },
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
  { targetWeekCode: '2026-W44', dayOfWeek: 4, date: '2026-10-29', name: 'YL-Schulung, Thema 5', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W45', dayOfWeek: 4, date: '2026-11-05', name: 'YL-Schulung, Thema 8', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W46', dayOfWeek: 4, date: '2026-11-12', name: 'YL-Schulung, Thema 9', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W47', dayOfWeek: 6, date: '2026-11-14', name: 'YL-Schulung, Thema 10', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W47', dayOfWeek: 4, date: '2026-11-19', name: 'YL-Schulung, Thema 11', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' },
  { targetWeekCode: '2026-W48', dayOfWeek: 6, date: '2026-11-21', name: 'YL-Schulung, Thema 12', startTime: '15:00', endTime: '18:00', roomId: 'room-5', style: 'Schulung' }
];

export const OPEN_DAY_2026_W44_SATURDAY_COURSES: Course[] = [
  {
    "id": "course-2026-W44-tdot-gefuehrte-meditation",
    "name": "Geführte Meditation",
    "style": "Meditation",
    "dayOfWeek": 6,
    "startTime": "07:00",
    "endTime": "07:30",
    "roomId": "room-5",
    "teacherId": "teacher-gen-nirmaya-fodor",
    "teacherName": "Nirmaya",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-satsang-morgen",
    "name": "Satsang",
    "style": "Meditation",
    "dayOfWeek": 6,
    "startTime": "07:00",
    "endTime": "08:00",
    "roomId": "room-2",
    "teacherId": "teacher-gen-alexander-melior",
    "teacherName": "Alexander",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-gemeinsame-stunde",
    "name": "Gemeinsame Stunde für alle Gäste",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "09:15",
    "endTime": "10:15",
    "roomId": "room-2",
    "teacherId": "teacher-gen-anjali-gelzleichter",
    "teacherName": "Anjali",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-infopoint",
    "name": "Infopoint (nicht während der Yogastunden)",
    "style": "Sonstiges",
    "dayOfWeek": 6,
    "startTime": "10:00",
    "endTime": "18:00",
    "roomId": "Infopoint",
    "teacherId": "teacher-gen-nirmaya-fodor",
    "teacherName": "Nirmaya , Mounir, Anjali",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-rezeption",
    "name": "Rezeption (nicht während der Yogastunden)",
    "style": "Sonstiges",
    "dayOfWeek": 6,
    "startTime": "10:00",
    "endTime": "18:00",
    "roomId": "Rezeption",
    "teacherId": "teacher-custom-melanie-jyoti",
    "teacherName": "Melanie , Jyoti",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-yogashop",
    "name": "Yoga-Shop (nicht während der Yogastunden)",
    "style": "Sonstiges",
    "dayOfWeek": 6,
    "startTime": "10:00",
    "endTime": "18:00",
    "roomId": "Yoga-Shop",
    "teacherId": "teacher-gen-pranava-pauly",
    "teacherName": "Pranava , Teresa",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-begruessung",
    "name": "Begrüßung",
    "style": "Sonstiges",
    "dayOfWeek": 6,
    "startTime": "10:30",
    "endTime": "11:00",
    "roomId": "room-2",
    "teacherId": "teacher-gen-karuna-wapke",
    "teacherName": "Karuna",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-buffet-1",
    "name": "Vollwert-Buffet",
    "style": "Buffet",
    "dayOfWeek": 6,
    "startTime": "11:00",
    "endTime": "12:00",
    "roomId": "Speisesaal",
    "teacherId": null,
    "isAiPlanned": false,
    "status": "approved",
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-einfuehrung-yoga",
    "name": "Einführung in ganzheitliches Yoga mit Vorführung",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "12:15",
    "endTime": "13:15",
    "roomId": "room-2",
    "teacherId": "teacher-gen-karuna-wapke",
    "teacherName": "Karuna",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-yoga-1330-anfaenger",
    "name": "Anfänger",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "13:30",
    "endTime": "15:00",
    "roomId": "room-2",
    "teacherId": "teacher-gen-yl",
    "teacherName": "! YL #",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-yoga-1330-mittelstufe",
    "name": "Mittelstufe",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "13:30",
    "endTime": "15:00",
    "roomId": "room-5",
    "teacherId": "teacher-custom-kalipriya",
    "teacherName": "Kalipriya",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-hausfuehrung",
    "name": "Hausführung",
    "style": "Sonstiges",
    "dayOfWeek": 6,
    "startTime": "15:00",
    "endTime": "15:30",
    "roomId": "Rezeption",
    "teacherId": "teacher-gen-mouniir-jaber",
    "teacherName": "Mounir",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-lachyoga",
    "name": "Lachyoga",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "15:00",
    "endTime": "15:45",
    "roomId": "room-5",
    "teacherId": "teacher-custom-dashini",
    "teacherName": "Dashini",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-einfuehrung-meditation",
    "name": "Einführung in die Meditation",
    "style": "Meditation",
    "dayOfWeek": 6,
    "startTime": "15:45",
    "endTime": "16:15",
    "roomId": "room-2",
    "teacherId": "teacher-gen-mouniir-jaber",
    "teacherName": "Mounir",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-yoga-1630-anfaenger",
    "name": "Anfänger",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "16:30",
    "endTime": "18:00",
    "roomId": "room-5",
    "teacherId": "teacher-gen-burnie-bansemer",
    "teacherName": "burnie",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-yoga-1630-klang",
    "name": "Klangyoga – Mittelstufe",
    "style": "Hatha",
    "dayOfWeek": 6,
    "startTime": "16:30",
    "endTime": "18:00",
    "roomId": "room-2",
    "teacherId": "teacher-gen-pranava-pauly",
    "teacherName": "Pranava",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-buffet-2",
    "name": "Vollwert-Buffet",
    "style": "Buffet",
    "dayOfWeek": 6,
    "startTime": "18:00",
    "endTime": "19:00",
    "roomId": "Speisesaal",
    "teacherId": null,
    "isAiPlanned": false,
    "status": "approved",
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-info-yla",
    "name": "Information Modelle Yoga-Ausbildung",
    "style": "Sonstiges",
    "dayOfWeek": 6,
    "startTime": "19:00",
    "endTime": "19:30",
    "roomId": "room-2",
    "teacherId": "teacher-gen-karuna-wapke",
    "teacherName": "Karuna",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-mantra-singen",
    "name": "Mantra-Singen",
    "style": "Meditation",
    "dayOfWeek": 6,
    "startTime": "19:30",
    "endTime": "20:00",
    "roomId": "room-2",
    "teacherId": "teacher-custom-shantara",
    "teacherName": "Shantara",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  },
  {
    "id": "course-2026-W44-tdot-satsang",
    "name": "Satsang – gemeinsames Meditieren, Mantrasingen, Lichtzeremonie",
    "style": "Meditation",
    "dayOfWeek": 6,
    "startTime": "20:00",
    "endTime": "22:00",
    "roomId": "room-2",
    "teacherId": "teacher-gen-karuna-wapke",
    "teacherName": "Karuna",
    "isAiPlanned": false,
    "isManuallyEdited": true,
    "status": "approved",
    "isFixedAgreement": false,
    "lastEditedAt": "2026-10-22T18:56:03.136Z"
  }
];

const DEFAULT_WEEK_PLANS: WeekPlan[] = [
  {
    "id": "plan-template-1",
    "name": "Blankowoche Sommer",
    "status": "blanko",
    "courses": [
      {
        "id": "course-def-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-20",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-22",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-24",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-27",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-29",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-31",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-33",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-37",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-38",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-39",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-40",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-41",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-42",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-44",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-45",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-46",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-47",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-48",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-50",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-52",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-53",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-54",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-55",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-56",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-59",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-60",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-61",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-1",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-3",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-5",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-8",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-11",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-13",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-15",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "draft"
      },
      {
        "id": "course-def-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "draft"
      }
    ],
    "createdAt": "2026-08-01T08:00:00.000Z",
    "seminarLeaderIds": [],
    "deletedCourseIds": []
  },
  {
    "id": "plan-active-1",
    "name": "Kursplan (Genehmigt & Aktiv)",
    "status": "approved",
    "isApproved": true,
    "courses": [
      {
        "id": "course-def-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-20",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-22",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-24",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-27",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-29",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-31",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-33",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-37",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-38",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-39",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-40",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-41",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-42",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-44",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-45",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-46",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-47",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-48",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-50",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-52",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-53",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-54",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-55",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-56",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-59",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-60",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-61",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-1",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-3",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-5",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-8",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-11",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-13",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-15",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-def-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-08-27T13:40:31.218Z",
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W34",
    "name": "Vorplanung 2026-W34 (Automatisch)",
    "status": "approved",
    "targetWeekCode": "2026-W34",
    "courses": [
      {
        "id": "course-2026-W34-21",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-24",
        "name": "Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-26",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-31",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-33",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-35",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-37",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-39",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-41",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-44",
        "name": "Yin Yoga Anfängerstunde",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-walk-tue",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-47",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-48",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-49",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-50",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-51",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-52",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-54",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-55",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-56",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-59",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-60",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-61",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-7",
        "name": "Yoga Flow",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-11",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-12",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-13",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-15",
        "name": "Yoga Flow",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W34-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-08-15T06:20:33.191Z",
    "seminarLeaderIds": [],
    "isApproved": true,
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W35",
    "name": "Vorplanung 2026-W35 (Automatisch)",
    "status": "draft",
    "targetWeekCode": "2026-W35",
    "courses": [
      {
        "id": "course-2026-W35-21",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-24",
        "name": "Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-26",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-31",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-33",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-35",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-37",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-39",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-41",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-44",
        "name": "Yin Yoga Anfängerstunde",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-walk-tue",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "draft",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-47",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-48",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-49",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-50",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-51",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-52",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-54",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-55",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-56",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-59",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-60",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-61",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-6",
        "name": "Yin Yoga Anfängerstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-11",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-12",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-13",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W35-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-08-15T06:20:33.191Z",
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "isApproved": false,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W36",
    "name": "Vorplanung 2026-W36 (Automatisch)",
    "status": "approved",
    "isApproved": true,
    "isManualOnly": true,
    "hasManualEdits": true,
    "targetWeekCode": "2026-W36",
    "courses": [
      {
        "id": "course-2026-W36-21",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-22",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-23",
        "name": "Pavanmukt Asana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-24",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-25",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-marlene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-26",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-27",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-28",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-1",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-29",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-30",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-31",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-32",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-beate-menkarski",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-33",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-34",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-35",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-36",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-37",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-38",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-39",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-40",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-41",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-marlene",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-43",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-beate-menkarski",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-44",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-45",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-46",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-47",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-48",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-49",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-marlene",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-50",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-51",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-52",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-54",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-55",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-56",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-57",
        "name": "Asana Flow",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-58",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-beate-menkarski",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-59",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-60",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-61",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-marlene",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-11",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-12",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-13",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "isManuallyEdited": true,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-marlene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-sevaka-schulung",
        "name": "Sevaka-Schulung",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "14:00",
        "endTime": "16:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-mouniir-jaber, teacher-gen-harishakti, teacher-gen-adam-zmuda",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "additionalVisibilityTeacherIds": [
          "teacher-gen-mouniir-jaber",
          "teacher-gen-harishakti",
          "teacher-gen-adam-zmuda"
        ],
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W36-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-08-25T09:11:20.343Z",
    "seminarLeaderIds": [],
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W37",
    "name": "Vorplanung 2026-W37 (Automatisch)",
    "status": "approved",
    "targetWeekCode": "2026-W37",
    "courses": [
      {
        "id": "course-2026-W37-20",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-22",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-beate-menkarski",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-24",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-19",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-5",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-27",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-1",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-29",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-31",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-33",
        "name": "Anfänger Rückenstunde Yoga",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-37",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-38",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-39",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-40",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-41",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-42",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-44",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-puja-sivananda",
        "name": "Swami Sivanandas Geburtstag Puja",
        "style": "Puja",
        "dayOfWeek": 2,
        "startTime": "20:00",
        "endTime": "21:30",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-46",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-47",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-48",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-50",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-52",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-53",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-54",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-55",
        "name": "Anfänger Räkelyogastunde",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-erkan-batmaz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-56",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-59",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-60",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-61",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-5",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-beate-menkarski",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-11",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-13",
        "name": "Anfänger Räkelyogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-erkan-batmaz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-15",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-beate-menkarski",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-16",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W37-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-08-29T06:45:04.952Z",
    "isApproved": true,
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W38",
    "name": "Vorplanung 2026-W38 (Automatisch)",
    "status": "approved",
    "targetWeekCode": "2026-W38",
    "isApproved": true,
    "seminarLeaderIds": [],
    "courses": [
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "roomId": "room-1",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W38-39",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W38-40",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W38-43",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W38-44",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W38-46",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W38-59",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
      },
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
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
      }
    ],
    "createdAt": "2026-09-08T08:00:00.000Z",
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-auto-2026-W39",
    "name": "KW 39 (18.09. - 24.09.)",
    "status": "approved",
    "targetWeekCode": "2026-W39",
    "courses": [
      {
        "id": "course-ohxr6pbf1",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-i5coav19d",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-21",
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
        "id": "course-rf7msbe58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-23",
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
        "id": "course-s8xb2yx1z",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-25",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-9a440mjrk",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-5j5qnipxf",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-28",
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
        "id": "course-2026-W39-29",
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
        "id": "course-2026-W39-30",
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
        "id": "course-2026-W39-31",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-ws4m5e9es",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-33",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-y0o3r9ni7",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-35",
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
        "id": "course-m62q2bkq1",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-37",
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
        "id": "course-1z4sol34u",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-38",
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
        "id": "course-2026-W39-39",
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
        "id": "course-w3xumprtq",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-erkan-batmaz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-w0fmwmzef",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-pranava-joint",
        "name": "Gemeinsame Stunde",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-61ar5id8c",
        "name": "Gemeinsame Stunde",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-ld9o8y8el",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-45",
        "name": "Meditativer Spaziergang",
        "style": "Sonstiges",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-aw33hc57o",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-d0bcy97yk",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-48",
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
        "id": "course-2026-W39-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-ad83l3sdf",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-ftjblt5nw",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-cbgyx5t41",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-wwhm5vmw3",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-54",
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
        "id": "course-2026-W39-55",
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
        "id": "course-hyqmovtw8",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-o0ivm9k80",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-osdz3wc3d",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-59",
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
        "id": "course-2026-W39-60",
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
        "id": "course-lp5p31t8w",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-xzhgqyrpr",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-3",
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
        "id": "course-2026-W39-4",
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
        "id": "course-31ex16nvv",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1789642426502",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-rxgtchkcx",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-5",
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
        "id": "course-2026-W39-6",
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
        "id": "course-8ztmnt4m6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-dlypj9b7v",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-7",
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
        "id": "course-ceupdsy13",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-guest-1789642426502",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-9",
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
        "id": "course-2026-W39-10",
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
        "id": "course-45waa0mec",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-hjvgv4fzd",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-gopala",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-rvrz6hd5e",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-80m86l9yv",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-fb73m6bvy",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-qtr6j5zxi",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-guest-1789642426502",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W39-18",
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
    "createdAt": "2026-09-06T08:19:54.293Z",
    "isApproved": true,
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": [
      "course-2026-W39-61",
      "course-hkd2bucqb",
      "course-mgty1tan6"
    ]
  },
  {
    "id": "plan-auto-2026-W40",
    "name": "KW 40 (25.09. - 01.10.)",
    "status": "approved",
    "targetWeekCode": "2026-W40",
    "courses": [
      {
        "id": "course-g4qq6h4t2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-u715ah4pk",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-drmro1cf4",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-vz64r5e0y",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-4pyz6gvo0",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-irene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-5n1a2bh1p",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-fexruhrwq",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-0didsynbw",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-ofi2y1aqo",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-22tjhkwn0",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-p639hcf1w",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-0ln8xkt88",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-irene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-8v4epmzug",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-0bm3tk7dv",
        "name": "Anfänger Rückenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-dm0lqsw0h",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-sxdp5hg4u",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-lqr3m5v22",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2p051o8lr",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-h17uxoy5m",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-j933pdewp",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-lu6i6sjho",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-wbhw4rha5",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-irene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2t5c4x7em",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-9jsk3aa7i",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-gsx627q05",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-pkvvzhwof",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-6zlhlivo2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-o7ugw07s7",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-mppbwo405",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-irene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-mweaa845y",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-vfnq5fbpd",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-dr2vw80zv",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-va62fe9xo",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-ai6y08r73",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-mirjykbfz",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-ep2l9eevl",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-gj5hp646f",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-6dwvz60gz",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-vg4bsygd4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-kkisbf59f",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-zc3q4fq5b",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-mrgveb8gw",
        "name": "Entspannungsangebot:Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-mfitr41it",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-vm2kwaulv",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-aka4pivld",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-uc92ktkk8",
        "name": "Mittelstufe ",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1789642426502",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-0z1z5sxvs",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-ljaix8f0y",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-yyjabgbbh",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-guest-1789642426502",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-3v9hnssgb",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-80tq5l3b9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-sbwi06r4c",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-tbyz63i1z",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-avrbb6wdn",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-wwxixw3n7",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-cyi0hr594",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-odsgigepd",
        "name": "Mittelstufe ",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-av47uqpyh",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-guest-1789642426502",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-8s8etkjmg",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-09-06T08:19:54.300Z",
    "isApproved": true,
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W41",
    "name": "Vorplanung 2026-W41 (Automatisch)",
    "status": "approved",
    "targetWeekCode": "2026-W41",
    "courses": [
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
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-24",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-parashakti-kuettner",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "name": "Gemeinsame Stunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "id": "course-2026-W41-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-59",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-60",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-karma-irene",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-14",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-parashakti-kuettner",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-17",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W41-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    "createdAt": "2026-08-29T10:03:59.366Z",
    "isApproved": true,
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": [
      "course-2026-W41-44",
      "course-2026-W41-36",
      "course-2026-W41-45",
      "course-2026-W41-43"
    ]
  },
  {
    "id": "plan-pre-2026-W42",
    "name": "Vorplanung 2026-W42 (Automatisch)",
    "status": "approved",
    "targetWeekCode": "2026-W42",
    "courses": [
      {
        "id": "course-2026-W42-21",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-sukadev-bretz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-24",
        "name": "Anfänger Thema Glück",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-devani",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-26",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-guest-1791278735445",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-35",
        "name": "Anfänger ",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-krishnajyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "teacherName": "Krishnajyoti",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-39",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-40",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-41",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-krishnajyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "teacherName": "Krishnajyoti",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-46",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-48",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-adam-zmuda",
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
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-56",
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
        "id": "course-2026-W42-57",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-59",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "teacherName": "Narayani",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-60",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-61",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-sukadev-bretz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-guest-1790942126763",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-1791547991429",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-18",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-guest-1791278735445",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W42-19",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-sukadev-bretz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-08-29T10:03:59.366Z",
    "isApproved": true,
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "deletedCourseIds": [
      "course-2026-W42-17",
      "course-2026-W42-47"
    ]
  },
  {
    "id": "plan-blank-2026-W43",
    "name": "Blankowoche Sommer",
    "status": "approved",
    "courses": [
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "teacherName": "Mounir",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-27",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-karma-krishnajyoti",
        "teacherName": "Krishnajyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-mouniir-jaber",
        "teacherName": "Mounir",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-guest-1791278735445",
        "teacherName": "Suryani",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "teacherName": "Christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "teacherName": "Nirmaya",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-35",
        "name": "Anfänger ",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-krishnajyoti",
        "teacherName": "Krishnajyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-39",
        "name": "Entspannungsangebot Yoga Nidra",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-42",
        "name": "Anfänger Räkelyoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-erkan-batmaz",
        "teacherName": "Erkan Batmaz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-44",
        "name": "Anfänger ",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-45",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-48",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": true,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-51",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-52",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "teacherName": "! YL #",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-54",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-gen-yl",
        "teacherName": "! YL #",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-57",
        "name": "Anfänger Räkelyoga",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-erkan-batmaz",
        "teacherName": "Erkan Batmaz",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-schulung-yl-schulung--thema-3",
        "name": "YL-Schulung, Thema 3",
        "style": "Schulung",
        "dayOfWeek": 4,
        "startTime": "15:00",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-59",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-60",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-63",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "teacherName": "Christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-karma-krishnajyoti",
        "teacherName": "Krishnajyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-chandrashekara",
        "teacherName": "Chandrashekara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-schulung-yl-schulung--thema-2",
        "name": "YL-Schulung, Thema 2",
        "style": "Schulung",
        "dayOfWeek": 6,
        "startTime": "15:00",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W43-16",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-karma-krishnajyoti",
        "teacherName": "Krishnajyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
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
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-09-06T08:19:54.184Z",
    "isApproved": true,
    "seminarLeaderIds": [],
    "targetWeekCode": "2026-W43",
    "lastEditedAt": "2026-10-22T18:56:03.136Z",
    "isManualOnly": true,
    "hasManualEdits": true,
    "manuallyUnapproved": false,
    "deletedCourseIds": []
  },
  {
    "id": "plan-pre-2026-W44",
    "name": "Vorplanung 2026-W44 (Automatisch)",
    "status": "approved",
    "isApproved": true,
    "targetWeekCode": "2026-W44",
    "courses": [
      {
        "id": "course-2026-W44-12",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-13",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "teacherName": "Mounir",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "lastEditedAt": "2026-10-23T07:21:04.642Z",
        "status": "approved",
        "isFixedAgreement": false
      },
      {
        "id": "course-2026-W44-14",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-15",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-16",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-17",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-18",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-11",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-mouniir-jaber",
        "teacherName": "Mounir",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-19",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "teacherName": "Nirmaya",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-20",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "teacherName": "Christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-22",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-23",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-24",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "teacherName": "Nirmaya",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-25",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-26",
        "name": "Anfänger ",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-27",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-yl",
        "teacherName": "! YL #",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-28",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "teacherName": "Christopher",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-29",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-30",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-31",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-32",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-34",
        "name": "Gemeinsame Stunde",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-35",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "teacherName": "Abha",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-37",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-teresa-allgaeu",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-38",
        "name": "Meditativer Spaziergang",
        "style": "Entspannung",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:30",
        "roomId": "room-7",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-39",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-40",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-41",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-qigong-wed",
        "name": "Qigong",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "12:30",
        "endTime": "13:30",
        "roomId": "room-2",
        "teacherId": "teacher-custom-christina-und-roland",
        "teacherName": "Christina und Roland",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-23T14:35:00.000Z"
      },
      {
        "id": "course-2026-W44-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-44",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-45",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-custom-christina-und-roland",
        "teacherName": "Christina und Roland",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-23T14:35:00.000Z"
      },
      {
        "id": "course-2026-W44-46",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-47",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-48",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "teacherName": "Nirmaya",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-schulung-yl-schulung--thema-5",
        "name": "YL-Schulung, Thema 5",
        "style": "Schulung",
        "dayOfWeek": 4,
        "startTime": "15:00",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-50",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-51",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "teacherName": "Abha",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-52",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-zmuda",
        "teacherName": "Adam",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-53",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-54",
        "name": "Entspannungsangebot: Lachyoga",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-custom-christina-und-roland",
        "teacherName": "Christina und Roland",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-23T14:35:00.000Z"
      },
      {
        "id": "course-2026-W44-2",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-3",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-5",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-7",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-1",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 5,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": true,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-9",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-gefuehrte-meditation",
        "name": "Geführte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "teacherName": "Nirmaya",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-satsang-morgen",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "teacherName": "Alexander",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-gemeinsame-stunde",
        "name": "Gemeinsame Stunde für alle Gäste",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "10:15",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "teacherName": "Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-infopoint",
        "name": "Infopoint (nicht während der Yogastunden)",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "10:00",
        "endTime": "18:00",
        "roomId": "Infopoint",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "teacherName": "Nirmaya , Mounir, Anjali",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-rezeption",
        "name": "Rezeption (nicht während der Yogastunden)",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "10:00",
        "endTime": "18:00",
        "roomId": "Rezeption",
        "teacherId": "teacher-custom-melanie-jyoti",
        "teacherName": "Melanie , Jyoti",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-yogashop",
        "name": "Yoga-Shop (nicht während der Yogastunden)",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "10:00",
        "endTime": "18:00",
        "roomId": "Yoga-Shop",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava , Teresa",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-begruessung",
        "name": "Begrüßung",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "10:30",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-buffet-1",
        "name": "Vollwert-Buffet",
        "style": "Buffet",
        "dayOfWeek": 6,
        "startTime": "11:00",
        "endTime": "12:00",
        "roomId": "Speisesaal",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-einfuehrung-yoga",
        "name": "Einführung in ganzheitliches Yoga mit Vorführung",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "12:15",
        "endTime": "13:15",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-yoga-1330-anfaenger",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "13:30",
        "endTime": "15:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "teacherName": "! YL #",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-yoga-1330-mittelstufe",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "13:30",
        "endTime": "15:00",
        "roomId": "room-5",
        "teacherId": "teacher-custom-kalipriya",
        "teacherName": "Kalipriya",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-hausfuehrung",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "15:00",
        "endTime": "15:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-mouniir-jaber",
        "teacherName": "Mounir",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-lachyoga",
        "name": "Lachyoga",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "15:00",
        "endTime": "15:45",
        "roomId": "room-5",
        "teacherId": "teacher-custom-dashini",
        "teacherName": "Dashini",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-einfuehrung-meditation",
        "name": "Einführung in die Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "15:45",
        "endTime": "16:15",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "teacherName": "Mounir",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-yoga-1630-anfaenger",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "teacherName": "burnie",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-yoga-1630-klang",
        "name": "Klangyoga – Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "teacherName": "Pranava",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-buffet-2",
        "name": "Vollwert-Buffet",
        "style": "Buffet",
        "dayOfWeek": 6,
        "startTime": "18:00",
        "endTime": "19:00",
        "roomId": "Speisesaal",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved",
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-info-yla",
        "name": "Information Modelle Yoga-Ausbildung",
        "style": "Sonstiges",
        "dayOfWeek": 6,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-mantra-singen",
        "name": "Mantra-Singen",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-custom-shantara",
        "teacherName": "Shantara",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      },
      {
        "id": "course-2026-W44-tdot-satsang",
        "name": "Satsang – gemeinsames Meditieren, Mantrasingen, Lichtzeremonie",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "22:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "teacherName": "Karuna",
        "isAiPlanned": false,
        "isManuallyEdited": true,
        "status": "approved",
        "isFixedAgreement": false,
        "lastEditedAt": "2026-10-22T18:56:03.136Z"
      }
    ],
    "createdAt": "2026-10-22T11:11:53.162Z",
    "seminarLeaderIds": [],
    "isManualOnly": true,
    "hasManualEdits": true,
    "lastEditedAt": "2026-10-23T07:21:04.642Z",
    "deletedCourseIds": [
      "course-2026-W44-33"
    ]
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

function isReadOnlyUserRole(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const role = localStorage.getItem('rapla_user_role');
    return role === 'team' || role === 'viewer';
  } catch {
    return false;
  }
}

async function upsertKeyToCloud(key: string, serializedValue: string): Promise<boolean> {
  if (!supabase) return true;
  if (key === 'rapla_week_plans' && isReadOnlyUserRole()) {
    clearKeyPendingSync(key);
    return true;
  }
  const client = supabase;
  const task = (async () => {
    try {
      let finalValueToUpsert = serializedValue;

      // For rapla_week_plans, ALWAYS perform an atomic Read-Merge-Write against Supabase
      // so a stale tab or device can NEVER overwrite newer course edits in the cloud
      if (key === 'rapla_week_plans') {
        try {
          const { data: remoteRow, error: fetchErr } = await client
            .from('app_state')
            .select('value')
            .eq('key', 'rapla_week_plans')
            .maybeSingle();

          if (!fetchErr && remoteRow?.value) {
            const remotePlans: WeekPlan[] = JSON.parse(remoteRow.value);
            const localPlans: WeekPlan[] = JSON.parse(serializedValue);
            const { plans: merged } = mergeWeekPlansLists(remotePlans, localPlans, true);
            const { plans: reconciled } = reconcilePlansWithDefaults(merged);
            finalValueToUpsert = JSON.stringify(reconciled);
            inMemoryStore['rapla_week_plans'] = reconciled;
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('rapla_week_plans', finalValueToUpsert);
              } catch {}
            }
          }
        } catch (mergeErr) {
          console.warn('Could not pre-merge rapla_week_plans before upsert:', mergeErr);
        }
      } else if (key === 'rapla_teachers') {
        try {
          const { data: remoteRow, error: fetchErr } = await client
            .from('app_state')
            .select('value')
            .eq('key', 'rapla_teachers')
            .maybeSingle();

          if (!fetchErr && remoteRow?.value) {
            const remoteTeachers: Teacher[] = JSON.parse(remoteRow.value);
            const localTeachers: Teacher[] = JSON.parse(serializedValue);
            const { teachers: reconciled } = reconcileTeachersWithCloud(localTeachers, remoteTeachers, true);
            finalValueToUpsert = JSON.stringify(reconciled);
            inMemoryStore['rapla_teachers'] = reconciled;
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('rapla_teachers', finalValueToUpsert);
              } catch {}
            }
          }
        } catch (mergeErr) {
          console.warn('Could not pre-merge rapla_teachers before upsert:', mergeErr);
        }
      }

      const { error } = await client.from('app_state').upsert({ key, value: finalValueToUpsert }, { onConflict: 'key' });
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
  'teacher-guest-1790942064335',
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
    } else if (t.id === 'teacher-guest-1791727410561' || t.id === 'teacher-guest-1790942064335') {
      continue;
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
      stayStartDate: '2026-10-02',
      stayEndDate: '2026-10-28',
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
                           : rawId === 'teacher-guest-1790942064335' ? 'teacher-guest-1790942126763'
                           : rawId;
            if (isBogusTeacherId(targetId) || deletedIds.includes(targetId) || targetId === 'teacher-gen-yl') continue;
            const singleCourseTeacherName = individualIds.length === 1 ? c.teacherName : undefined;
            const exists = list.some(t => t.id === targetId || (singleCourseTeacherName && t.name.toLowerCase() === singleCourseTeacherName.toLowerCase()));
            if (!exists && targetId.startsWith('teacher-')) {
              const cleanName = singleCourseTeacherName || targetId.replace(/^teacher-(karma|guest|gen|custom)-/, '').replace(/-?\d+$/, '');
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

    let correctRole = t.roleType || 'external';
    if (t.id.startsWith('teacher-gen-') && SEVAKA_NAMES.includes(t.name)) {
      correctRole = 'sevaka';
    } else if (t.roleType !== 'sevaka' && t.roleType !== 'karma_yogi' && t.roleType !== 'guest_teacher') {
      correctRole = 'external';
    }

    if (t.roleType !== correctRole) {
      t.roleType = correctRole;
    }

    if (correctRole === 'sevaka') {
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

      // Chandrashekara rules (Tuesday afternoon off: 12:00 - 18:30, only Mittelstufe yoga, can lead meditation & ONN)
      if (nameLower.includes('chandrashekara') || t.id === 'teacher-gen-chandrashekara') {
        t.rules.onlyMittelstufeYoga = true;
        t.rules.prefersMittelstufe = true;
        t.rules.maxAnfaengerYogaPerWeek = 0;
        t.rules.canLeadMeditation = true;
        t.rules.canLeadOnn = true;
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

      const correctYogaTeacher = !['teresa', 'hu', 'mounir', 'adam', 'satyam', 'christopher'].some(n => nameLower.includes(n));
      if (t.isYogaTeacher !== correctYogaTeacher) {
        t.isYogaTeacher = correctYogaTeacher;
        t.specialties = correctYogaTeacher ? (t.specialties.length > 0 ? t.specialties : ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini']) : ['Meditation'];
      }
      t.availabilityMode = 'always';
      t.rules.availability = t.rules.availability.map(slot => {
        if (slot.start === '08:00' || slot.start === '06:30') {
          return { ...slot, start: '06:00' };
        }
        return slot;
      });

      if (t.id === 'teacher-gen-satyam') {
        t.isYogaTeacher = false;
        t.rules.availability = [];
        t.rules.canLeadHausfuehrung = false;
        t.rules.canLeadOnn = false;
      }

      t.rules.canLeadMeditation = ['pranava', 'harishakti', 'alexander', 'burnie', 'nirmaya', 'narayani', 'mounir', 'mouniir', 'hu', 'christopher', 'chandrashekara'].some(n => nameLower.includes(n));
      t.rules.canLeadSatsang = !['adam', 'hu', 'mounir', 'mouniir', 'teresa', 'satyam', 'ulrich', 'pranava'].some(n => nameLower.includes(n));
    } else {
      if (t.isYogaTeacher === undefined) {
        t.isYogaTeacher = true;
      }
      if (t.availabilityMode === undefined) {
        t.availabilityMode = 'always';
      }
    }

    if (t.rules.preferredDays === undefined) {
      t.rules.preferredDays = [];
    }

    if (t.id === 'teacher-guest-1790942126763') {
      t.name = 'Sathyam Bad Meinberg';
      t.roleType = 'karma_yogi';
      t.rules.canLeadMeditation = true;
      if (!t.stayStartDate) t.stayStartDate = '2026-10-02';
      if (!t.stayEndDate) t.stayEndDate = '2026-10-28';
    }

    if (t.id === 'teacher-karma-tanja-eichenmueller') {
      t.name = 'Tanja';
      t.roleType = 'karma_yogi';
      t.isYogaTeacher = true;
      t.rules.canLeadMeditation = true;
      if (!t.stayStartDate) t.stayStartDate = '2026-09-06';
      if (!t.stayEndDate) t.stayEndDate = '2026-09-20';
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
      t.rules.canLeadMeditation = true;
      if (!t.stayStartDate) t.stayStartDate = '2026-09-01';
      if (!t.stayEndDate) t.stayEndDate = '2026-09-10';
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
      t.rules.canLeadMeditation = true;
      t.rules.canLeadSatsang = true;
      if (!t.stayStartDate) t.stayStartDate = '2026-09-12';
      if (!t.stayEndDate) t.stayEndDate = '2026-09-26';
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

function isSameCourseSlot(a: Course, b: Course): boolean {
  if (a.id === b.id) return true;
  if (a.dayOfWeek === b.dayOfWeek && a.startTime === b.startTime) {
    const aName = (a.name || '').trim().toLowerCase();
    const bName = (b.name || '').trim().toLowerCase();
    if (aName === bName) {
      if (!a.roomId || !b.roomId || a.roomId === b.roomId) return true;
    }
    // Also match slots where both are relaxation offers or general classes at the exact same hour
    const isRelaxA = aName.includes('entspannung') || a.style?.toLowerCase().includes('entspannung') || aName.includes('klang') || aName.includes('lachyoga') || aName.includes('peziebälle') || aName.includes('fantasiereise');
    const isRelaxB = bName.includes('entspannung') || b.style?.toLowerCase().includes('entspannung') || bName.includes('klang') || bName.includes('lachyoga') || bName.includes('peziebälle') || bName.includes('fantasiereise');
    if (isRelaxA && isRelaxB) return true;
  }
  return false;
}

// Per-course timestamp-aware merge between authoritative base plans (e.g. cloud) and incoming plans (e.g. local tab)
export function mergeWeekPlansLists(
  basePlans: WeekPlan[],
  incomingPlans: WeekPlan[],
  allowIncomingEdits: boolean
): { plans: WeekPlan[]; hasMergedFromIncoming: boolean } {
  const hasIncomingManualEdits = Array.isArray(incomingPlans) && incomingPlans.some(p => p.hasManualEdits || p.isManualOnly || p.courses?.some(c => c.isManuallyEdited));
  if ((!allowIncomingEdits && !hasIncomingManualEdits) || !incomingPlans || incomingPlans.length === 0) {
    return { plans: JSON.parse(JSON.stringify(basePlans || [])), hasMergedFromIncoming: false };
  }

  let hasMergedFromIncoming = false;
  const merged: WeekPlan[] = (basePlans || []).map(remPlan => {
    const locPlan = incomingPlans.find(lp => isSamePlanIdentity(lp, remPlan));
    if (!locPlan) return JSON.parse(JSON.stringify(remPlan));

    const locPlanTime = locPlan.lastEditedAt ? new Date(locPlan.lastEditedAt).getTime() : 0;
    const remPlanTime = remPlan.lastEditedAt ? new Date(remPlan.lastEditedAt).getTime() : 0;

    // Merge deletedCourseIds (only accept newly deleted IDs if locPlanTime >= remPlanTime or locPlan has manual edits)
    const remDeleted = new Set(remPlan.deletedCourseIds || []);
    if ((locPlanTime >= remPlanTime || locPlan.hasManualEdits) && Array.isArray(locPlan.deletedCourseIds)) {
      for (const delId of locPlan.deletedCourseIds) {
        if (!remDeleted.has(delId)) {
          remDeleted.add(delId);
          hasMergedFromIncoming = true;
        }
      }
    }
    const mergedDeletedIds = Array.from(remDeleted);

    let anyCourseMerged = false;
    const baseCourses = (remPlan.courses || []).filter(rc => !remDeleted.has(rc.id));
    const mergedCourses: Course[] = baseCourses.map(rc => {
      const lc = (locPlan.courses || []).find(c => isSameCourseSlot(c, rc));
      if (!lc) return { ...rc };

      const lcTime = lc.lastEditedAt ? new Date(lc.lastEditedAt).getTime() : locPlanTime;
      const rcTime = rc.lastEditedAt ? new Date(rc.lastEditedAt).getTime() : 0;

      // RULE 1: If local course is manually edited but remote is not manually edited: local manual edit ALWAYS wins!
      if (lc.isManuallyEdited && !rc.isManuallyEdited) {
        if (JSON.stringify(lc) !== JSON.stringify(rc)) {
          anyCourseMerged = true;
          hasMergedFromIncoming = true;
        }
        return { ...lc };
      }

      // RULE 2: If both are manually edited: the newer one wins (or local wins if equal/newer)
      if (lc.isManuallyEdited && rc.isManuallyEdited) {
        if (lcTime >= rcTime) {
          if (JSON.stringify(lc) !== JSON.stringify(rc)) {
            anyCourseMerged = true;
            hasMergedFromIncoming = true;
          }
          return { ...lc };
        }
        return { ...rc };
      }

      // RULE 3: If local has a newer timestamp than remote:
      if (lcTime > rcTime && lcTime > 0) {
        if (JSON.stringify(lc) !== JSON.stringify(rc)) {
          anyCourseMerged = true;
          hasMergedFromIncoming = true;
        }
        return { ...lc };
      }

      return { ...rc };
    });

    // Also include newly created manual courses in locPlan that don't exist in remPlan yet
    for (const lc of (locPlan.courses || [])) {
      if (remDeleted.has(lc.id)) continue;
      const existsInMerged = mergedCourses.some(mc => isSameCourseSlot(mc, lc));
      if (!existsInMerged && lc.isManuallyEdited) {
        // ALWAYS keep manually added courses - a user explicitly created this course!
        mergedCourses.push({ ...lc });
        anyCourseMerged = true;
        hasMergedFromIncoming = true;
      }
    }

    const useLocPlanMeta = (locPlan.hasManualEdits || locPlan.isManualOnly) && locPlanTime > remPlanTime;
    if (useLocPlanMeta) {
      hasMergedFromIncoming = true;
    }

    return {
      ...remPlan,
      isApproved: useLocPlanMeta ? locPlan.isApproved : remPlan.isApproved,
      status: useLocPlanMeta ? locPlan.status : remPlan.status,
      isManualOnly: (useLocPlanMeta ? locPlan.isManualOnly : remPlan.isManualOnly) || anyCourseMerged || remPlan.isManualOnly,
      hasManualEdits: (useLocPlanMeta ? locPlan.hasManualEdits : remPlan.hasManualEdits) || anyCourseMerged || remPlan.hasManualEdits,
      seminarLeaderIds: useLocPlanMeta && locPlan.seminarLeaderIds ? [...locPlan.seminarLeaderIds] : (remPlan.seminarLeaderIds || []),
      deletedCourseIds: mergedDeletedIds,
      lastEditedAt: locPlanTime > remPlanTime ? locPlan.lastEditedAt : remPlan.lastEditedAt,
      courses: mergedCourses
    };
  });

  // Include any completely new plans created locally with manual edits
  for (const locPlan of incomingPlans) {
    if ((locPlan.hasManualEdits || locPlan.isManualOnly) && locPlan.lastEditedAt && !merged.some(mp => isSamePlanIdentity(mp, locPlan))) {
      merged.push(JSON.parse(JSON.stringify(locPlan)));
      hasMergedFromIncoming = true;
    }
  }

  return { plans: merged, hasMergedFromIncoming };
}

// Comprehensive, 100% Idempotent Reconciliation Function for Week Plans
// STRICT INVARIANT: Never overwrite any course assignment on a manually edited course OR on an approved / manually-edited plan.
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
      const { plans: mergedPair } = mergeWeekPlansLists([existing], [candidate], true);
      list[existingIdx] = mergedPair[0];
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

      if (Array.isArray(plan.deletedCourseIds) && plan.deletedCourseIds.length > 0) {
        const delSet = new Set(plan.deletedCourseIds);
        plan.courses = plan.courses.filter(c => !delSet.has(c.id));
      }

      const isPlanProtected = !!(plan.hasManualEdits || plan.isManualOnly || plan.isApproved || plan.status === 'approved');

      // Sync missing courses from defPlan without ever overwriting existing course assignments or re-injecting into protected plans
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

        const existingC = plan.courses.find(c => isSameCourseSlot(c, defC));

        if (!existingC) {
          if (isPlanProtected) {
            continue;
          }
          plan.courses.push(JSON.parse(JSON.stringify(defC)));
        } else {
          if (defC.additionalVisibilityTeacherIds && defC.additionalVisibilityTeacherIds.length > 0) {
            if (!existingC.additionalVisibilityTeacherIds || JSON.stringify(existingC.additionalVisibilityTeacherIds) !== JSON.stringify(defC.additionalVisibilityTeacherIds)) {
              existingC.additionalVisibilityTeacherIds = [...defC.additionalVisibilityTeacherIds];
            }
          }
          // Only fill in missing default assignment if the plan is NOT protected and the course is NOT manually edited
          if (!isPlanProtected && !existingC.isManuallyEdited && !existingC.teacherId && defC.teacherId) {
            const isSchulung = existingC.name.toLowerCase().includes('schulung') || existingC.style?.toLowerCase().includes('schulung');
            if (!isSchulung) {
              existingC.teacherId = defC.teacherId;
              existingC.isAiPlanned = defC.isAiPlanned;
            }
          }
        }
      }
    }
  }

  // 3. Apply universal normalizations across all plans (strictly respecting manual edits & approved plans)
  const APPROVED_WEEKS = new Set(['2026-W36', '2026-W37', '2026-W38', '2026-W39', '2026-W40', '2026-W41', '2026-W42', '2026-W43', '2026-W44']);

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

    // Always filter out any course ID explicitly recorded in deletedCourseIds
    if (Array.isArray(p.deletedCourseIds) && p.deletedCourseIds.length > 0) {
      const delSet = new Set(p.deletedCourseIds);
      p.courses = p.courses.filter(c => !delSet.has(c.id));
    }

    const isPlanProtected = !!(p.hasManualEdits || p.isManualOnly || p.isApproved || p.status === 'approved');

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
      if (c.teacherId === 'teacher-guest-1790942064335') {
        c.teacherId = 'teacher-guest-1790942126763';
        c.teacherName = 'Sathyam Bad Meinberg';
      }
      if (c.teacherId === 'teacher-karma-krishnajyoti' && !c.teacherName) {
        c.teacherName = 'Krishnajyoti';
      }
      // Ensure Chandrashekara is never auto-scheduled on Tuesday afternoon (12:00 - 18:30) on unedited draft plans
      if (!c.isManuallyEdited && !isPlanProtected && c.dayOfWeek === 2 && c.teacherId === 'teacher-gen-chandrashekara' && c.startTime >= '12:00' && c.startTime < '18:30') {
        c.teacherId = 'teacher-gen-narayani-kedenburg';
      }
      // Saturday evening Satsang always lasts until 22:00 (Langer Satsang) on unprotected plans
      if (!c.isManuallyEdited && !isPlanProtected && c.dayOfWeek === 6 && c.name.toLowerCase() === 'satsang' && c.startTime === '20:00' && c.endTime !== '22:00') {
        c.endTime = '22:00';
      }
      if (['Rezeption', 'Infopoint', 'Yoga-Shop', 'Speisesaal'].includes(c.roomId || '')) {
        c.roomId = 'room-7';
      }
      if (p.isApproved && c.status !== 'approved') {
        c.status = 'approved';
      }
    }

    if (p.targetWeekCode) {
      for (const c of p.courses) {
        const courseDate = getLocalDateForDay(p.targetWeekCode, c.dayOfWeek);
        const nameLower = c.name.toLowerCase();

        if (isDateInYlaRange(courseDate) && !isPlanProtected) {
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

    if (p.targetWeekCode === '2026-W44') {
      // Invariant protection for manual slots: Qigong (Wed 12:30), Klangreise (Wed 21:10), Lachyoga (Thu 21:10) with Christina und Roland in Radhakrishna
      // 1. Wednesday 12:30 Qigong in Radhakrishna
      const qigongId = 'course-2026-W44-qigong-wed';
      const existingQigong = p.courses.find(c => c.id === qigongId || (c.dayOfWeek === 3 && c.startTime === '12:30' && c.name.toLowerCase().includes('qigong')));
      if (!existingQigong && !p.deletedCourseIds?.includes(qigongId)) {
        p.courses.push({
          id: qigongId,
          name: 'Qigong',
          style: 'Entspannung',
          dayOfWeek: 3,
          startTime: '12:30',
          endTime: '13:30',
          roomId: 'room-2',
          teacherId: 'teacher-custom-christina-und-roland',
          teacherName: 'Christina und Roland',
          isAiPlanned: false,
          isManuallyEdited: true,
          status: 'approved',
          isFixedAgreement: false,
          lastEditedAt: new Date().toISOString()
        });
      } else if (existingQigong) {
        existingQigong.name = 'Qigong';
        existingQigong.dayOfWeek = 3;
        existingQigong.startTime = '12:30';
        existingQigong.endTime = '13:30';
        existingQigong.roomId = 'room-2';
        existingQigong.teacherId = 'teacher-custom-christina-und-roland';
        existingQigong.teacherName = 'Christina und Roland';
        existingQigong.isManuallyEdited = true;
        existingQigong.status = 'approved';
      }

      // 2. Wednesday 21:10 Klangreise in Radhakrishna
      const wed2110Course = p.courses.find(c => c.id === 'course-2026-W44-45' || (c.dayOfWeek === 3 && c.startTime === '21:10'));
      if (wed2110Course) {
        if (!wed2110Course.teacherName || wed2110Course.teacherName === 'Alexander' || wed2110Course.teacherId === 'teacher-gen-alexander-melior' || wed2110Course.name.toLowerCase().includes('klangschalen')) {
          wed2110Course.name = 'Entspannungsangebot: Klangreise';
          wed2110Course.roomId = 'room-2';
          wed2110Course.teacherId = 'teacher-custom-christina-und-roland';
          wed2110Course.teacherName = 'Christina und Roland';
          wed2110Course.isManuallyEdited = true;
          wed2110Course.status = 'approved';
        }
      }

      // 3. Thursday 21:10 Lachyoga in Radhakrishna
      const thu2110Course = p.courses.find(c => c.id === 'course-2026-W44-54' || (c.dayOfWeek === 4 && c.startTime === '21:10'));
      if (thu2110Course) {
        if (!thu2110Course.teacherName || thu2110Course.teacherId === 'teacher-gen-burnie-bansemer' || thu2110Course.name.toLowerCase().includes('peziebälle') || thu2110Course.name.toLowerCase().includes('fantasiereise')) {
          thu2110Course.name = 'Entspannungsangebot: Lachyoga';
          thu2110Course.roomId = 'room-2';
          thu2110Course.teacherId = 'teacher-custom-christina-und-roland';
          thu2110Course.teacherName = 'Christina und Roland';
          thu2110Course.isManuallyEdited = true;
          thu2110Course.status = 'approved';
        }
      }

      // On Saturday 24.10.2026 (Tag der offenen Tür), keep all Tag der offenen Tür courses and any manually edited custom courses
      const tdotIds = new Set(OPEN_DAY_2026_W44_SATURDAY_COURSES.map(tc => tc.id));
      p.courses = p.courses.filter(c => {
        if (c.dayOfWeek !== 6) return true;
        if (tdotIds.has(c.id)) return true;
        if (c.isManuallyEdited && !c.id.startsWith('course-2026-W44-') && !c.id.startsWith('course-def-')) {
          return true;
        }
        return false;
      });
      for (const tdotC of OPEN_DAY_2026_W44_SATURDAY_COURSES) {
        if (p.deletedCourseIds?.includes(tdotC.id)) continue;
        const existingTdot = p.courses.find(c => c.id === tdotC.id);
        if (!existingTdot) {
          p.courses.push(JSON.parse(JSON.stringify(tdotC)));
        } else if (!existingTdot.isManuallyEdited && !isPlanProtected) {
          existingTdot.name = tdotC.name;
          existingTdot.style = tdotC.style;
          existingTdot.startTime = tdotC.startTime;
          existingTdot.endTime = tdotC.endTime;
          existingTdot.roomId = tdotC.roomId;
        }
      }
    }

    if (p.targetWeekCode === '2026-W39') {
      p.courses = p.courses.filter(c =>
        c.isManuallyEdited || (
          !(c.dayOfWeek === 6 && c.startTime === '16:15' && (c.name.toLowerCase().includes('mantra') || c.id === 'course-2026-W39-16')) &&
          !(c.dayOfWeek === 2 && c.startTime === '16:15' && (c.name.toLowerCase().includes('anfänger') || c.name.toLowerCase().includes('mittelstufe') || c.id === 'course-2026-W39-42' || c.id === 'course-2026-W39-43'))
        )
      );
      const hasPranavaJoint = p.courses.some(c => c.dayOfWeek === 2 && c.startTime === '16:15' && (c.teacherId === 'teacher-gen-pranava-pauly' || c.name.toLowerCase().includes('gemeinsam')));
      if (!hasPranavaJoint && !p.deletedCourseIds?.includes('course-2026-W39-pranava-joint')) {
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
      if (!onnCourse && !p.deletedCourseIds?.includes(onnCourseId) && !isPlanProtected) {
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
      } else if (onnCourse && !onnCourse.isManuallyEdited && !isPlanProtected) {
        if (onnCourse.teacherId === 'teacher-gen-christopher') {
          onnCourse.teacherId = 'teacher-gen-chandrashekara';
        }
        onnCourse.roomId = 'room-2';
        onnCourse.startTime = '19:30';
        onnCourse.endTime = '20:00';
      }

      const pujaCourseId = 'course-2026-W37-puja-sivananda';
      const pujaCourse = p.courses.find(c => c.id === pujaCourseId || (c.dayOfWeek === 2 && (c.name.toLowerCase().includes('sivananda') || c.name.toLowerCase().includes('shivananda')) && c.startTime === '20:00'));
      if (!pujaCourse && !p.deletedCourseIds?.includes(pujaCourseId) && !isPlanProtected) {
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
      } else if (pujaCourse && !pujaCourse.isManuallyEdited && !isPlanProtected) {
        pujaCourse.teacherId = 'teacher-gen-karuna-wapke';
        pujaCourse.roomId = 'room-2';
        pujaCourse.startTime = '20:00';
        pujaCourse.endTime = '21:30';
        pujaCourse.name = 'Swami Sivanandas Geburtstag Puja';
        pujaCourse.style = 'Puja';
      }
    } else if (!isPlanProtected) {
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

    // Ensure special Schulung courses are injected into new/unprotected week plans if not present
    if (p.targetWeekCode && !isPlanProtected) {
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

const CURRENT_DB_VERSION = 148;

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
        // Flush pending debounce timers for non-plan keys; for rapla_week_plans, let the read-merge-write below handle it
        for (const [key, timer] of Object.entries(syncDebounceTimers)) {
          clearTimeout(timer);
          delete syncDebounceTimers[key];
          if (key !== 'rapla_week_plans' && inMemoryStore[key] !== undefined) {
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
                const hasLocalManualEdits = Array.isArray(localPlans) && localPlans.some(p => p.hasManualEdits || p.isManualOnly || p.courses?.some(c => c.isManuallyEdited));
                const allowLocalPlanEdits = hadLocalPlansInStorage && (isPendingLocalPlans || hasLocalManualEdits) && !isReadOnlyUserRole();

                const { plans: merged, hasMergedFromIncoming: needsCloudPush } = mergeWeekPlansLists(
                  remotePlans,
                  localPlans,
                  allowLocalPlanEdits
                );

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

                if (reconciledStr !== row.value && supabase && !isReadOnlyUserRole()) {
                  await upsertKeyToCloud('rapla_teachers', reconciledStr);
                } else {
                  clearKeyPendingSync('rapla_teachers');
                }
              } else if (row.key === 'rapla_rooms') {
                let remoteRooms: Room[] = JSON.parse(row.value);
                const VALID_ROOM_NAMES = ['Radhakrishna', 'Devi', 'Tripura', 'Sitaram', 'Hanuman', 'Eingangsbereich', 'Kaminzimmer'];
                const isOldRooms =
                  !Array.isArray(remoteRooms) ||
                  remoteRooms.length !== DEFAULT_ROOMS.length ||
                  remoteRooms.some(r => !VALID_ROOM_NAMES.includes(r.name));
                if (isOldRooms) {
                  remoteRooms = DEFAULT_ROOMS;
                }
                const roomsStr = JSON.stringify(remoteRooms);
                const currentStr = localStorage.getItem('rapla_rooms');
                if (currentStr !== roomsStr) {
                  changed = true;
                  localStorage.setItem('rapla_rooms', roomsStr);
                }
                inMemoryStore['rapla_rooms'] = remoteRooms;
                if (roomsStr !== row.value && supabase && !isReadOnlyUserRole()) {
                  await upsertKeyToCloud('rapla_rooms', roomsStr);
                } else {
                  clearKeyPendingSync('rapla_rooms');
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
    const VALID_ROOM_NAMES = ['Radhakrishna', 'Devi', 'Tripura', 'Sitaram', 'Hanuman', 'Eingangsbereich', 'Kaminzimmer'];
    const isOld =
      !Array.isArray(stored) ||
      stored.length !== DEFAULT_ROOMS.length ||
      stored.some(r => !VALID_ROOM_NAMES.includes(r.name));
    if (isOld) {
      inMemoryStore['rapla_rooms'] = DEFAULT_ROOMS;
      if (typeof window !== 'undefined' && localStorage.getItem('rapla_rooms') !== null) {
        try {
          localStorage.setItem('rapla_rooms', JSON.stringify(DEFAULT_ROOMS));
        } catch {}
      }
      setStored('rapla_rooms', DEFAULT_ROOMS, true);
      return DEFAULT_ROOMS;
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
    const nowIso = new Date().toISOString();
    plan.lastEditedAt = nowIso;
    if (index !== -1) {
      const existing = list[index];
      const deletedSet = new Set([...(existing.deletedCourseIds || []), ...(plan.deletedCourseIds || [])]);
      // Preserve any course in existing storage that has a strictly newer lastEditedAt than the incoming plan's copy
      const mergedCourses: Course[] = (plan.courses || []).map(incC => {
        const storedC = (existing.courses || []).find(sc => isSameCourseSlot(sc, incC));
        if (!storedC) return incC;
        const incTime = incC.lastEditedAt ? new Date(incC.lastEditedAt).getTime() : 0;
        const storedTime = storedC.lastEditedAt ? new Date(storedC.lastEditedAt).getTime() : 0;
        if (storedC.isManuallyEdited && storedTime > incTime) {
          return storedC;
        }
        return incC;
      });
      for (const storedC of (existing.courses || [])) {
        if (deletedSet.has(storedC.id)) continue;
        if (storedC.isManuallyEdited && !mergedCourses.some(mc => isSameCourseSlot(mc, storedC))) {
          mergedCourses.push(storedC);
        }
      }
      list[index] = {
        ...plan,
        deletedCourseIds: Array.from(deletedSet),
        courses: mergedCourses
      };
      db.saveWeekPlans(list);
    } else {
      list.push(plan);
      db.saveWeekPlans(list);
    }
  },
  upsertCourseInWeekPlan: (planIdOrWeekCode: string, course: Course, fallbackPlan?: WeekPlan): WeekPlan | undefined => {
    const list = db.getWeekPlans();
    const nowIso = new Date().toISOString();
    const updatedCourse: Course = {
      ...course,
      isManuallyEdited: true,
      isAiPlanned: false,
      lastEditedAt: nowIso
    };
    let index = list.findIndex(p => p.id === planIdOrWeekCode || (p.targetWeekCode && p.targetWeekCode === planIdOrWeekCode));
    if (index === -1 && fallbackPlan) {
      const newPlan: WeekPlan = {
        ...JSON.parse(JSON.stringify(fallbackPlan)),
        isManualOnly: true,
        hasManualEdits: true,
        lastEditedAt: nowIso
      };
      const cIdx = newPlan.courses.findIndex(c => c.id === updatedCourse.id);
      if (cIdx !== -1) {
        newPlan.courses[cIdx] = updatedCourse;
      } else {
        newPlan.courses.push(updatedCourse);
      }
      list.push(newPlan);
      db.saveWeekPlans(list);
      return newPlan;
    }
    if (index !== -1) {
      const plan = list[index];
      plan.isManualOnly = true;
      plan.hasManualEdits = true;
      plan.lastEditedAt = nowIso;
      if (plan.deletedCourseIds) {
        plan.deletedCourseIds = plan.deletedCourseIds.filter(id => id !== updatedCourse.id);
      }
      const cIdx = plan.courses.findIndex(c => c.id === updatedCourse.id);
      if (cIdx !== -1) {
        plan.courses[cIdx] = updatedCourse;
      } else {
        plan.courses.push(updatedCourse);
      }
      db.saveWeekPlans(list);
      return plan;
    }
    return undefined;
  },
  removeCourseFromWeekPlan: (planIdOrWeekCode: string, courseId: string, fallbackPlan?: WeekPlan): WeekPlan | undefined => {
    const list = db.getWeekPlans();
    const nowIso = new Date().toISOString();
    let index = list.findIndex(p => p.id === planIdOrWeekCode || (p.targetWeekCode && p.targetWeekCode === planIdOrWeekCode));
    if (index === -1 && fallbackPlan) {
      const newPlan: WeekPlan = {
        ...JSON.parse(JSON.stringify(fallbackPlan)),
        isManualOnly: true,
        hasManualEdits: true,
        lastEditedAt: nowIso,
        deletedCourseIds: Array.from(new Set([...(fallbackPlan.deletedCourseIds || []), courseId])),
        courses: (fallbackPlan.courses || []).filter(c => c.id !== courseId)
      };
      list.push(newPlan);
      db.saveWeekPlans(list);
      return newPlan;
    }
    if (index !== -1) {
      const plan = list[index];
      plan.isManualOnly = true;
      plan.hasManualEdits = true;
      plan.lastEditedAt = nowIso;
      if (!plan.deletedCourseIds) plan.deletedCourseIds = [];
      if (!plan.deletedCourseIds.includes(courseId)) {
        plan.deletedCourseIds.push(courseId);
      }
      plan.courses = plan.courses.filter(c => c.id !== courseId);
      db.saveWeekPlans(list);
      return plan;
    }
    return undefined;
  },
  deleteWeekPlan: (id: string): void => {
    const list = db.getWeekPlans();
    db.saveWeekPlans(list.filter(p => p.id !== id));
  },
  setWeekPlanApproval: (weekCodeOrPlanId: string, isApproved: boolean): WeekPlan | undefined => {
    const list = db.getWeekPlans();
    let plan = list.find(p => p.id === weekCodeOrPlanId || p.targetWeekCode === weekCodeOrPlanId);
    const nowIso = new Date().toISOString();
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
          status: isApproved ? 'approved' : 'draft',
          lastEditedAt: nowIso
        })) : [],
        createdAt: nowIso,
        lastEditedAt: nowIso
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
          status: isApproved ? 'approved' : 'draft',
          lastEditedAt: nowIso
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
        plan.courses = plan.courses.map(c => ({ ...c, status: 'approved', lastEditedAt: c.lastEditedAt || nowIso }));
      }
      plan.lastEditedAt = nowIso;
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
    db.upsertCourseInWeekPlan(id, course);
  },
  updateCourse: (course: Course, planId?: string): void => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    db.upsertCourseInWeekPlan(id, course);
  },
  deleteCourse: (id: string, planId?: string): void => {
    const plans = db.getWeekPlans();
    const pId = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    db.removeCourseFromWeekPlan(pId, id);
  },
  
  // Clear all planner data for a specific plan
  resetSchedule: (planId?: string): void => {
    const list = db.getWeekPlans();
    const pId = planId || list.find(p => p.status === 'approved')?.id || list[0]?.id || '';
    const plan = list.find(p => p.id === pId || p.targetWeekCode === pId);
    if (plan) {
      const nowIso = new Date().toISOString();
      plan.courses = plan.courses.map(c => ({ ...c, teacherId: null, isAiPlanned: false, isManuallyEdited: false, status: 'draft', lastEditedAt: nowIso }));
      plan.deletedCourseIds = [];
      plan.isManualOnly = false;
      plan.hasManualEdits = false;
      plan.lastEditedAt = nowIso;
      db.saveWeekPlans(list);
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

      // 1. FIRST: Sync Supabase cloud state (Week plans, YLA assignments, teachers, rooms, sevafrei, etc.)
      // Supabase is the single authoritative source of truth across all devices.
      await db.initializeCloudSync();

      // 2. Fallback: Only seed absences from server JSON if cloud & local sevafrei are completely empty
      const currentAbsences = db.getSevafrei();
      if (!currentAbsences || currentAbsences.length <= 1) {
        try {
          const absencesRes = await fetchWithTimeout(`/api/sevafrei?t=${timestamp}`);
          if (absencesRes.ok) {
            const serverAbsences = await absencesRes.json();
            if (serverAbsences && serverAbsences.length > 0) {
              const mergedAbsences = [...currentAbsences];
              let updated = false;
              for (const sAbs of serverAbsences) {
                if (!mergedAbsences.some((a: any) => a.id === sAbs.id)) {
                  mergedAbsences.push(sAbs);
                  updated = true;
                }
              }
              if (updated) {
                await setStored('rapla_sevafrei', mergedAbsences, true);
              }
            }
          }
        } catch (e) {
          console.warn('Absences fallback sync skipped or timed out:', e);
        }
      }

      // 3. Ensure week plans and teachers are verified in memory
      db.getWeekPlans();
      db.getTeachers();
      db.getRooms();

      // 4. Dispatch events so all active components (Wochenplan, YLA, Team views, Teachers) update immediately
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
