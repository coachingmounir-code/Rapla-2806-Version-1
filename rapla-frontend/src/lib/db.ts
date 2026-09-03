// LocalStorage Database helper for Yoga Studio Scheduler
import { supabase } from './supabaseClient';
import wochenplanRules from './data/wochenplan_rules.json' with { type: 'json' };
import { isDateInYlaRange } from './ylaData';

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
  additionalVisibilityTeacherIds?: string[]; // teachers for whom this course is additionally visible (e.g. mandatory participation / Schulung)
  isAiPlanned: boolean;
  status: 'draft' | 'approved';
  isManuallyEdited?: boolean;
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
}

// Default Data
const DEFAULT_ROOMS: Room[] = [
  { id: 'room-1', name: 'Devi', color: '#d32f2f' },
  { id: 'room-2', name: 'Radhakrisna', color: '#f57c00' },
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
    slots = slots.map(slot => {
      const rest = tRules.availabilityRestrictions.find((r: any) => r.day === slot.day && r.allowed === false);
      if (rest) {
        if (rest.timeAfter) {
          // If not allowed after timeAfter, end is timeAfter
          return { ...slot, end: rest.timeAfter };
        }
        if (rest.timeBefore) {
          // If not allowed before timeBefore, start is timeBefore
          return { ...slot, start: rest.timeBefore };
        }
      }
      return slot;
    });
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
    { name: 'Entspannungsangebot: Klangreise', style: 'Entspannung', dayOfWeek: 1, startTime: '21:10', endTime: '22:00', roomId: 'room-5', teacherName: '' },

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

const DEFAULT_WEEK_PLANS: WeekPlan[] = [
  {
    id: 'plan-template-1',
    name: 'Blankowoche Sommer',
    status: 'blanko',
    courses: DEFAULT_COURSES.map(c => ({ ...c, isAiPlanned: false, status: 'draft' })),
    createdAt: new Date().toISOString()
  },
  {
    id: 'plan-active-1',
    name: 'Kursplan (Genehmigt & Aktiv)',
    status: 'approved',
    isApproved: true,
    courses: DEFAULT_COURSES.map(c => ({ ...c, status: 'approved' })),
    createdAt: new Date().toISOString()
  },
  // --- PREPLANNED WEEKS ---
                                                                                                                {
    id: "plan-pre-2026-W37",
    name: "Vorplanung 2026-W37 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W37",
    courses: [
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
        "status": "approved"
      },
      {
        "id": "course-2026-W37-2",
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
        "id": "course-2026-W37-3",
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
        "id": "course-2026-W37-4",
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
        "id": "course-2026-W37-5",
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
        "id": "course-2026-W37-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-chandrashekara",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-7",
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
        "id": "course-2026-W37-8",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W37-12",
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
        "id": "course-2026-W37-13",
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
        "id": "course-2026-W37-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-15",
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
        "id": "course-2026-W37-16",
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
        "id": "course-2026-W37-17",
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
        "id": "course-2026-W37-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-19",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-20",
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
        "id": "course-2026-W37-21",
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
        "id": "course-2026-W37-22",
        "name": "Pavanmukt Asana",
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
        "id": "course-2026-W37-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-24",
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
        "id": "course-2026-W37-25",
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
        "id": "course-2026-W37-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-27",
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
        "id": "course-2026-W37-28",
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
        "id": "course-2026-W37-29",
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
        "id": "course-2026-W37-30",
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
        "id": "course-2026-W37-31",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-33",
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
        "id": "course-2026-W37-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-35",
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
        "id": "course-2026-W37-36",
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
        "id": "course-2026-W37-37",
        "name": "Entspannungsangebot: Klangreise",
        "style": "Entspannung",
        "dayOfWeek": 1,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W37-39",
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
        "id": "course-2026-W37-40",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-4",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-41",
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
        "id": "course-2026-W37-42",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-4",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-43",
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
        "id": "course-2026-W37-44",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W37-47",
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
        "id": "course-2026-W37-48",
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
        "id": "course-2026-W37-49",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-50",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-1",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W37-52",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-6",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W37-55",
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
        "id": "course-2026-W37-56",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-swantje",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-57",
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
        "id": "course-2026-W37-58",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-3",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-59",
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
        "id": "course-2026-W37-60",
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
        "id": "course-2026-W37-61",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-karma-tanja-eichenmueller",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  }
];


// Cloud-aware storage
const inMemoryStore: Record<string, any> = {};
let cloudInitialized = false;

// Helper functions for storage
function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  if (inMemoryStore[key] !== undefined) {
    return inMemoryStore[key] as T;
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    inMemoryStore[key] = defaultValue;
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(stored) as T;
    inMemoryStore[key] = parsed;
    return parsed;
  } catch (e) {
    inMemoryStore[key] = defaultValue;
    return defaultValue;
  }
}

let syncDebounceTimer: any = null;
let eventDebounceTimer: any = null;

function setStored<T>(key: string, value: T, immediate = false): void {
  if (typeof window === 'undefined') return;
  
  inMemoryStore[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  if (supabase) {
    const client = supabase;
    if (immediate) {
      client.from('app_state').upsert({ key, value: JSON.stringify(value) })
        .then(({ error }) => {
          if (error) console.error('Failed to sync to cloud', error);
        });
    } else {
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      syncDebounceTimer = setTimeout(() => {
        if (client) {
          client.from('app_state').upsert({ key, value: JSON.stringify(value) })
            .then(({ error }) => {
              if (error) console.error('Failed to sync to cloud', error);
            });
        }
      }, 300);
    }
  }

  if (eventDebounceTimer) clearTimeout(eventDebounceTimer);
  eventDebounceTimer = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('rapla-data-synced'));
  }, 50);
}

// Comprehensive Reconciliation Function to guarantee default week plans & courses are ALWAYS preserved and merged
export function reconcilePlansWithDefaults(plans: WeekPlan[]): { plans: WeekPlan[]; hasChanges: boolean } {
  let hasChanges = false;
  const list = [...(plans || [])];

  for (const defPlan of DEFAULT_WEEK_PLANS) {
    const idx = list.findIndex(p => p.id === defPlan.id || p.targetWeekCode === defPlan.targetWeekCode);
    if (idx === -1) {
      list.push(JSON.parse(JSON.stringify(defPlan)));
      hasChanges = true;
    } else {
      const plan = list[idx];
      if (defPlan.targetWeekCode && plan.targetWeekCode !== defPlan.targetWeekCode) {
        plan.targetWeekCode = defPlan.targetWeekCode;
        hasChanges = true;
      }
      if (defPlan.isApproved && plan.isApproved !== true) {
        plan.isApproved = true;
        plan.status = 'approved';
        hasChanges = true;
      }

      if (defPlan.targetWeekCode === '2026-W37' && !plan.hasManualEdits && !plan.isManualOnly) {
        if (JSON.stringify(plan.courses) !== JSON.stringify(defPlan.courses)) {
          plan.courses = JSON.parse(JSON.stringify(defPlan.courses));
          hasChanges = true;
        }
      }

      if (plan.targetWeekCode === '2026-W37') {
        const preLen = plan.courses.length;
        plan.courses = plan.courses.filter(c => !(c.dayOfWeek === 2 && c.name.toLowerCase().includes('spaziergang')));
        if (plan.courses.length !== preLen) {
          hasChanges = true;
        }
      }

      for (const defC of defPlan.courses) {
        const existingC = plan.courses.find(c => 
          c.id === defC.id || 
          (c.dayOfWeek === defC.dayOfWeek && c.startTime === defC.startTime && c.name === defC.name)
        );

        if (!existingC) {
          plan.courses.push(JSON.parse(JSON.stringify(defC)));
          hasChanges = true;
        } else {
          if (defC.additionalVisibilityTeacherIds && defC.additionalVisibilityTeacherIds.length > 0) {
            if (!existingC.additionalVisibilityTeacherIds || JSON.stringify(existingC.additionalVisibilityTeacherIds) !== JSON.stringify(defC.additionalVisibilityTeacherIds)) {
              existingC.additionalVisibilityTeacherIds = [...defC.additionalVisibilityTeacherIds];
              hasChanges = true;
            }
          }
          if (defC.id === 'course-2026-W36-sevaka-schulung') {
            if (existingC.roomId !== defC.roomId || existingC.teacherId !== defC.teacherId || existingC.startTime !== defC.startTime || existingC.endTime !== defC.endTime) {
              existingC.roomId = defC.roomId;
              existingC.teacherId = defC.teacherId;
              existingC.startTime = defC.startTime;
              existingC.endTime = defC.endTime;
              hasChanges = true;
            }
          }
        }
      }

      const beforeLen = plan.courses.length;
      plan.courses = plan.courses.filter(c => c.id !== 'course-2026-W36-mittelstufe-pflicht');
      if (plan.courses.length !== beforeLen) {
        hasChanges = true;
      }

      plan.courses.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
      });
    }
  }

  return { plans: list, hasChanges };
}

const CURRENT_DB_VERSION = 110;

// Database Actions
export const db = {
  getStored,
  setStored,
  initializeCloudSync: async (): Promise<void> => {
    if (typeof window === 'undefined' || !supabase) return;
    try {
      const { data, error } = await supabase.from('app_state').select('*');
      if (!error && data && data.length > 0) {
        let changed = false;
        let needsCloudPush = false;
        for (const row of data) {
          try {
            if (row.key === 'rapla_week_plans') {
              const remotePlans: WeekPlan[] = JSON.parse(row.value);
              const localPlans = getStored<WeekPlan[]>('rapla_week_plans', DEFAULT_WEEK_PLANS);
              
              const merged: WeekPlan[] = remotePlans.map(remPlan => {
                const locPlan = localPlans.find(lp => lp.id === remPlan.id || lp.targetWeekCode === remPlan.targetWeekCode);
                if (!locPlan) return remPlan;

                // If local has manual edits or is locked manual, check if local edits should be preserved
                if (locPlan.hasManualEdits || locPlan.isManualOnly) {
                  const locTime = locPlan.lastEditedAt ? new Date(locPlan.lastEditedAt).getTime() : 0;
                  const remTime = remPlan.lastEditedAt ? new Date(remPlan.lastEditedAt).getTime() : 0;
                  if (locTime > remTime) {
                    needsCloudPush = true;
                    return locPlan;
                  }
                  // Even if remote timestamp is newer, preserve individually manually edited slots if remote hasn't touched them
                  const mergedCourses = remPlan.courses.map(rc => {
                    const lc = locPlan.courses.find(c => c.id === rc.id || (c.dayOfWeek === rc.dayOfWeek && c.startTime === rc.startTime && c.roomId === rc.roomId));
                    if (lc && lc.isManuallyEdited && !rc.isManuallyEdited) {
                      needsCloudPush = true;
                      return lc;
                    }
                    return rc;
                  });
                  return { ...remPlan, courses: mergedCourses };
                }
                return remPlan;
              });

              // Apply universal reconciliation with codebase defaults
              const { plans: reconciled, hasChanges: reconciledChanged } = reconcilePlansWithDefaults(merged);
              if (reconciledChanged) {
                needsCloudPush = true;
                changed = true;
              }

              const mergedStr = JSON.stringify(reconciled);
              const currentStr = localStorage.getItem('rapla_week_plans');
              if (currentStr !== mergedStr) {
                changed = true;
                localStorage.setItem('rapla_week_plans', mergedStr);
              }
              inMemoryStore['rapla_week_plans'] = reconciled;

              if (needsCloudPush && supabase) {
                supabase.from('app_state').upsert({ key: 'rapla_week_plans', value: mergedStr }).then(() => {});
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
          } catch(e) {
            console.error('Error processing row in initializeCloudSync:', row.key, e);
          }
        }
        cloudInitialized = true;
        if (changed) {
          // Dispatch event so active components refresh their state smoothly without reloading the window
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
                  const current = localStorage.getItem(key);
                  if (current !== val) {
                    if (key === 'rapla_week_plans') {
                      const remotePlans: WeekPlan[] = JSON.parse(val);
                      const { plans: reconciled } = reconcilePlansWithDefaults(remotePlans);
                      const reconciledStr = JSON.stringify(reconciled);
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
    }
  },
  getSevafrei: (): any[] => getStored<any[]>('rapla_sevafrei', []),
  saveSevafrei: (list: any[]): void => setStored('rapla_sevafrei', list),
  getDefaultCourses: (): Course[] => DEFAULT_COURSES,
  getTeachers: (): Teacher[] => {
    const storedVersion = typeof window !== 'undefined' ? localStorage.getItem('rapla_db_version') : null;
    const isOutdated = !storedVersion || parseInt(storedVersion, 10) < CURRENT_DB_VERSION;

    const stored = getStored<Teacher[]>('rapla_teachers', DEFAULT_TEACHERS);
    let updated = false;
    const list = [...stored];

    // Migration to update existing Sevakas' and Karma Yogis' names to correct format
    for (const t of list) {
      if ((t.id === "teacher-karma-marlene" || t.name === "Marlene") && t.name !== "Marlen") { t.name = "Marlen"; updated = true; }
      else if (t.id === "teacher-gen-abha-morkoetter" && t.name !== "Abha") { t.name = "Abha"; updated = true; }
      else if (t.id === "teacher-gen-adam-zmuda" && t.name !== "Adam") { t.name = "Adam"; updated = true; }
      else if (t.id === "teacher-gen-alexander-melior" && t.name !== "Alexander") { t.name = "Alexander"; updated = true; }
      else if (t.id === "teacher-gen-anjali-gelzleichter" && t.name !== "Anjali") { t.name = "Anjali"; updated = true; }
      else if ((t.id === "teacher-gen-burnie-bansemer" || t.name === "Burnie") && t.name !== "burnie") { t.name = "burnie"; updated = true; }
      else if (t.id === "teacher-gen-chandrashekara" && t.name !== "Chandrashekara") { t.name = "Chandrashekara"; updated = true; }
      else if (t.id === "teacher-gen-hu-buerkle" && t.name !== "Hu") { t.name = "Hu"; updated = true; }
      else if (t.id === "teacher-gen-karuna-wapke" && t.name !== "Karuna") { t.name = "Karuna"; updated = true; }
      else if (t.id === "teacher-gen-mouniir-jaber" && t.name !== "Mounir") { t.name = "Mounir"; updated = true; }
      else if (t.id === "teacher-gen-narayani-kedenburg" && t.name !== "Narayani") { t.name = "Narayani"; updated = true; }
      else if (t.id === "teacher-gen-nirmaya-fodor" && t.name !== "Nirmaya") { t.name = "Nirmaya"; updated = true; }
      else if (t.id === "teacher-gen-pranava-pauly" && t.name !== "Pranava") { t.name = "Pranava"; updated = true; }
      else if (t.id === "teacher-gen-teresa-allgaeu" && t.name !== "Teresa") { t.name = "Teresa"; updated = true; }
      else if (t.id === "teacher-gen-ulrich-nebel" && t.name !== "Ulrich") { t.name = "Ulrich"; updated = true; }
    }

    for (const defT of DEFAULT_TEACHERS) {
      const existingIdx = list.findIndex(t => t.id === defT.id || t.name === defT.name);
      if (existingIdx === -1) {
        list.push(defT);
        updated = true;
      }
    }
    // Ensure all entries have the isYogaTeacher property (defaults to true)
    for (const t of list) {
      // Migration for Harishakti's rules
      if (t.name.toLowerCase().includes('harishakti')) {
        t.rules.availability = [
          { day: 0, start: '06:00', end: '22:00' }, // Sunday
          { day: 1, start: '06:00', end: '22:00' }, // Monday
          { day: 2, start: '06:00', end: '22:00' }, // Tuesday
          // Wednesday: FREI
          { day: 4, start: '06:00', end: '22:00' }, // Thursday
          { day: 5, start: '06:00', end: '22:00' }, // Friday
          { day: 6, start: '06:00', end: '22:00' }  // Saturday
        ];
        updated = true;
      }

      // Migration for Karuna's rules
      if (t.name.toLowerCase().includes('karuna')) {
        const hasMondayAvail = t.rules.availability.some(a => a.day === 1);
        if (hasMondayAvail) {
          t.rules.availability = [
            { day: 2, start: '06:30', end: '22:00' }, // Tuesday
            { day: 3, start: '06:30', end: '22:00' }, // Wednesday
            { day: 4, start: '06:30', end: '22:00' }, // Thursday
            { day: 5, start: '06:30', end: '22:00' }, // Friday
            { day: 6, start: '06:30', end: '22:00' }, // Saturday
            { day: 0, start: '06:30', end: '22:00' }  // Sunday
          ];
          updated = true;
        }
      }

      let correctRole = t.roleType || 'external';
      if (SEVAKA_NAMES.includes(t.name)) {
        correctRole = 'sevaka';
      } else if (t.roleType !== 'karma_yogi' && t.roleType !== 'guest_teacher') {
        correctRole = 'external';
      }
      const nameLower = t.name.toLowerCase();
      const correctYogaTeacher = correctRole === 'sevaka' 
        ? !['teresa', 'hu', 'mounir', 'adam', 'satyam', 'christopher'].some(n => nameLower.includes(n)) 
        : (t.isYogaTeacher !== undefined ? t.isYogaTeacher : true);
      if (t.isYogaTeacher !== correctYogaTeacher) {
        t.isYogaTeacher = correctYogaTeacher;
        t.specialties = correctYogaTeacher ? (t.specialties.length > 0 ? t.specialties : ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini']) : ['Meditation'];
        updated = true;
      }
      if (t.availabilityMode === undefined) {
        t.availabilityMode = 'always';
        updated = true;
      }
      // Migration to set specific teachers as Sevakas and preserve others
      if (t.roleType !== correctRole) {
        t.roleType = correctRole;
        updated = true;
      }
      
      // Sevakas should also be marked as always available by default
      if (correctRole === 'sevaka') {
        if (t.availabilityMode !== 'always') {
          t.availabilityMode = 'always';
          updated = true;
        }
        // Force availability to start at 06:30 for Sevakas to cover Satsangs/Meditation
        let availUpdated = false;
        t.rules.availability = t.rules.availability.map(slot => {
          if (slot.start === '08:00') {
            availUpdated = true;
            return { ...slot, start: '06:30' };
          }
          return slot;
        });
        if (availUpdated) {
          updated = true;
        }
      }

      if (t.rules.preferredDays === undefined) {
        t.rules.preferredDays = [];
        updated = true;
      }
      if (nameLower.includes('satyam')) {
        if (t.isYogaTeacher !== false) {
          t.isYogaTeacher = false;
          updated = true;
        }
        if (t.rules.availability && t.rules.availability.length > 0) {
          t.rules.availability = [];
          updated = true;
        }
        if (t.rules.canLeadHausfuehrung) {
          t.rules.canLeadHausfuehrung = false;
          updated = true;
        }
        if (t.rules.canLeadOnn) {
          t.rules.canLeadOnn = false;
          updated = true;
        }
      }
      const shouldLeadMeditation = ['pranava', 'harishakti', 'alexander', 'burnie', 'nirmaya', 'narayani', 'mounir', 'mouniir', 'hu', 'christopher'].some(n => nameLower.includes(n));
      const shouldLeadSatsang = correctRole === 'sevaka' && !['adam', 'hu', 'mounir', 'mouniir', 'teresa', 'satyam', 'ulrich', 'pranava'].some(n => nameLower.includes(n));
      if (t.rules.canLeadMeditation !== shouldLeadMeditation) {
        t.rules.canLeadMeditation = shouldLeadMeditation;
        updated = true;
      }
      if (t.rules.canLeadSatsang !== shouldLeadSatsang) {
        t.rules.canLeadSatsang = shouldLeadSatsang;
        updated = true;
      }

      if (nameLower.includes('tanja') || t.id.includes('tanja')) {
        if (t.id !== 'teacher-karma-tanja-eichenmueller') {
          t.id = 'teacher-karma-tanja-eichenmueller';
          updated = true;
        }
        if (t.name !== 'Tanja') {
          t.name = 'Tanja';
          updated = true;
        }
        if (t.roleType !== 'karma_yogi') {
          t.roleType = 'karma_yogi';
          updated = true;
        }
        if (t.isYogaTeacher !== true) {
          t.isYogaTeacher = true;
          updated = true;
        }
        if (t.stayStartDate !== '2026-09-06') {
          t.stayStartDate = '2026-09-06';
          updated = true;
        }
        if (t.stayEndDate !== '2026-09-20') {
          t.stayEndDate = '2026-09-20';
          updated = true;
        }
        if (!t.stayNotes) {
          t.stayNotes = 'Karma Yogini als Yogalehrerin (06.09. bis 20.09.2026).';
          updated = true;
        }
        if (t.availabilityMode !== 'always') {
          t.availabilityMode = 'always';
          updated = true;
        }
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
          updated = true;
        }
      }

      if (t.id === 'teacher-karma-swantje' || t.id === 'teacher-karma-neu-september' || nameLower === 'swantje' || (t.roleType === 'karma_yogi' && (nameLower === 'karma yogini' || nameLower === 'neue karma yogini'))) {
        if (t.id !== 'teacher-karma-swantje') {
          t.id = 'teacher-karma-swantje';
          updated = true;
        }
        if (t.name !== 'Swantje') {
          t.name = 'Swantje';
          updated = true;
        }
        if (t.email !== 'swantje@yoga.de') {
          t.email = 'swantje@yoga.de';
          updated = true;
        }
        if (t.roleType !== 'karma_yogi') {
          t.roleType = 'karma_yogi';
          updated = true;
        }
        if (t.isYogaTeacher !== true) {
          t.isYogaTeacher = true;
          updated = true;
        }
        if (t.stayStartDate !== '2026-09-01') {
          t.stayStartDate = '2026-09-01';
          updated = true;
        }
        if (t.stayEndDate !== '2026-09-10') {
          t.stayEndDate = '2026-09-10';
          updated = true;
        }
        if (!t.stayNotes || t.stayNotes.includes('Karma Yogini – unterrichtet')) {
          t.stayNotes = 'Swantje – Karma Yogini als Yogalehrerin (01.09. bis 10.09.2026).';
          updated = true;
        }
        if (t.availabilityMode !== 'always') {
          t.availabilityMode = 'always';
          updated = true;
        }
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
          updated = true;
        }
      }

      if (nameLower === 'marlen' || nameLower === 'marlene' || t.id === 'teacher-karma-marlene') {
        if (t.name !== 'Marlen') {
          t.name = 'Marlen';
          updated = true;
        }
        if (t.roleType !== 'karma_yogi') {
          t.roleType = 'karma_yogi';
          updated = true;
        }
        if (t.isYogaTeacher !== true) {
          t.isYogaTeacher = true;
          updated = true;
        }
      }
    }
    if (updated) {
      db.saveTeachers(list);
    }
    if (isOutdated && typeof window !== 'undefined') {
      localStorage.setItem('rapla_db_version', CURRENT_DB_VERSION.toString());
    }
    return list;
  },
  saveTeachers: (teachers: Teacher[]): void => setStored('rapla_teachers', teachers),
  addTeacher: (teacher: Teacher): void => {
    const list = db.getTeachers();
    list.push(teacher);
    db.saveTeachers(list);
  },
  updateTeacher: (teacher: Teacher): void => {
    const list = db.getTeachers();
    const index = list.findIndex(t => t.id === teacher.id);
    if (index !== -1) {
      list[index] = teacher;
      db.saveTeachers(list);
    }
  },
  deleteTeacher: (id: string): void => {
    const list = db.getTeachers();
    db.saveTeachers(list.filter(t => t.id !== id));
    
    // Clean up course assignments across all plans for deleted teacher
    const plans = db.getWeekPlans();
    const updated = plans.map(plan => ({
      ...plan,
      courses: plan.courses.map(c => c.teacherId === id ? { ...c, teacherId: null, isAiPlanned: false } : c)
    }));
    db.saveWeekPlans(updated);
  },
  
  getRooms: (): Room[] => {
    const stored = getStored<Room[]>('rapla_rooms', DEFAULT_ROOMS);
    const isOld = stored.length !== DEFAULT_ROOMS.length || stored.some(r => r.name === 'Sivananda Saal') || !stored.some(r => r.name === 'am Kamin') || !stored.some(r => r.name === 'vor dem Eingang');
    if (isOld) {
      db.saveRooms(DEFAULT_ROOMS);
      return DEFAULT_ROOMS;
    }
    return stored;
  },
  saveRooms: (rooms: Room[]): void => setStored('rapla_rooms', rooms),
  
  // Week Plan Methods
  getWeekPlans: (): WeekPlan[] => {
    const storedVersion = typeof window !== 'undefined' ? localStorage.getItem('rapla_db_version') : null;
    const isOutdated = !storedVersion || parseInt(storedVersion, 10) < CURRENT_DB_VERSION;

    const stored = getStored<WeekPlan[]>('rapla_week_plans', DEFAULT_WEEK_PLANS);
    const hasOldCourses = stored.some(p => p.courses.some(c => c.name === 'Morgen-Hatha Flow'));
    if (hasOldCourses) {
      db.saveWeekPlans(DEFAULT_WEEK_PLANS);
      return DEFAULT_WEEK_PLANS;
    }

    const { plans: list, hasChanges } = reconcilePlansWithDefaults(stored);
    let updated = hasChanges;

    if (isOutdated && typeof window !== 'undefined') {
      localStorage.setItem('rapla_db_version', CURRENT_DB_VERSION.toString());
      updated = true;
    }
    for (const p of list) {
      if (p.targetWeekCode === '2026-W36') {
        p.isApproved = true;
        p.status = 'approved';
        p.isManualOnly = true;
        p.hasManualEdits = true;
      } else if (p.isApproved === undefined || (isOutdated && !p.hasManualEdits && !p.isManualOnly)) {
        if (p.targetWeekCode === '2026-W35' || (p.targetWeekCode && p.targetWeekCode > '2026-W36')) {
          p.isApproved = false;
          p.status = 'draft';
        } else if (p.status === 'approved' && p.targetWeekCode !== '2026-W35') {
          p.isApproved = true;
        } else {
          p.isApproved = false;
          p.status = 'draft';
        }
        updated = true;
      }
      if (p.seminarLeaderIds === undefined) {
        p.seminarLeaderIds = [];
        updated = true;
      }
      // Migration: Remove Ankommensmed. from any day other than Friday (5) and Sunday (0)
      const filteredCourses = p.courses.filter(c => {
        const isAnkommen = c.name === 'Ankommensmed.' || c.name.includes('Ankommen');
        if (isAnkommen && c.dayOfWeek !== 5 && c.dayOfWeek !== 0) {
          return false;
        }
        return true;
      });
      if (filteredCourses.length !== p.courses.length) {
        p.courses = filteredCourses;
        updated = true;
      }
      // Migration & Rule: Remove Pranayama during the 4-week Yogalehrerausbildung (30.08.2026 – 27.09.2026)
      if (p.targetWeekCode) {
        // Migration & Rule: Satsang times & YLA congruence
        for (const c of p.courses) {
          const courseDate = getLocalDateForDay(p.targetWeekCode, c.dayOfWeek);
          const nameLower = c.name.toLowerCase();

          // Saturday evening Satsang always lasts until 22:00 (Langer Satsang)
          if (c.dayOfWeek === 6 && nameLower === 'satsang' && c.startTime === '20:00' && c.endTime !== '22:00') {
            c.endTime = '22:00';
            updated = true;
          }

          if (isDateInYlaRange(courseDate) && !p.isManualOnly && !p.hasManualEdits) {
            // Om Namo Narayanaya takes place in Devi room (room-1) during YLA (except Sunday start in Tripura, and except 08.09 in Radha-Krishna)
            if (c.dayOfWeek !== 0 && !(p.targetWeekCode === '2026-W37' && c.dayOfWeek === 2) && (nameLower.includes('om namo') || nameLower.includes('narayanaya')) && c.roomId !== 'room-1' && !c.isManuallyEdited) {
              c.roomId = 'room-1';
              updated = true;
            }

            // Abha does not teach regular courses during the 4-week YLA (unless manually assigned by admin)
            if (!c.isManuallyEdited && (c.teacherId === 'teacher-gen-abha-morkoetter' || c.teacherId === 'abha')) {
              c.teacherId = null;
              c.isAiPlanned = false;
              updated = true;
            }

            // Morning 7:00 Satsang during 1st week of YLA matches the YLA morning teacher if not manually overridden
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
                updated = true;
              }
            }
          }
        }
        
        const preLen = p.courses.length;
        p.courses = p.courses.filter(c => {
          const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
          if (isPranayama) {
            const courseDate = getLocalDateForDay(p.targetWeekCode!, c.dayOfWeek);
            if (isDateInYlaRange(courseDate)) {
              return false;
            }
          }
          return true;
        });
        if (p.courses.length !== preLen) {
          updated = true;
        }
      }

      // Migration: On Tuesday 08.09 (2026-W37), remove Tuesday Meditativer Spaziergang, keep Om Namo Narayanaya in room-2 (19:30-20:00), and add Swami Sivanandas Geburtstag Puja (20:00-21:30)
      if (p.targetWeekCode === '2026-W37') {
        const preCoursesLen = p.courses.length;
        p.courses = p.courses.filter(c => !(c.dayOfWeek === 2 && c.name.toLowerCase().includes('spaziergang')));
        
        // Ensure Om Namo Narayanaya is present on Tuesday in room-2
        const onnCourse = p.courses.find(c => c.dayOfWeek === 2 && (c.name.toLowerCase().includes('om namo') || c.name.toLowerCase().includes('narayanaya')));
        if (!onnCourse) {
          p.courses.push({
            id: 'course-2026-W37-44',
            name: 'Om Namo Narayanaya',
            style: 'Meditation',
            dayOfWeek: 2,
            startTime: '19:30',
            endTime: '20:00',
            roomId: 'room-2',
            teacherId: 'teacher-gen-christopher',
            isAiPlanned: false,
            status: p.status === 'approved' ? 'approved' : 'draft'
          });
          updated = true;
        } else {
          if (onnCourse.roomId !== 'room-2' || onnCourse.startTime !== '19:30' || onnCourse.endTime !== '20:00') {
            onnCourse.roomId = 'room-2';
            onnCourse.startTime = '19:30';
            onnCourse.endTime = '20:00';
            updated = true;
          }
        }

        const pujaCourse = p.courses.find(c => c.id === 'course-2026-W37-puja-sivananda' || (c.dayOfWeek === 2 && (c.name.toLowerCase().includes('sivananda') || c.name.toLowerCase().includes('shivananda')) && c.startTime === '20:00'));
        if (!pujaCourse) {
          p.courses.push({
            id: 'course-2026-W37-puja-sivananda',
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
          updated = true;
        } else {
          if (pujaCourse.teacherId !== 'teacher-gen-karuna-wapke' || pujaCourse.roomId !== 'room-2' || pujaCourse.startTime !== '20:00' || pujaCourse.endTime !== '21:30') {
            pujaCourse.teacherId = 'teacher-gen-karuna-wapke';
            pujaCourse.roomId = 'room-2';
            pujaCourse.startTime = '20:00';
            pujaCourse.endTime = '21:30';
            pujaCourse.name = 'Swami Sivanandas Geburtstag Puja';
            pujaCourse.style = 'Puja';
            updated = true;
          }
        }

        p.courses.sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
          return a.startTime.localeCompare(b.startTime);
        });

        if (p.courses.length !== preCoursesLen) {
          updated = true;
        }
      } else {
        // Migration: Ensure Tuesday 19:30 Meditativer Spaziergang is present in every week plan
        const walkCourse = p.courses.find(c => c.dayOfWeek === 2 && (c.name.toLowerCase().includes('spaziergang') || c.roomId === 'room-7'));
        if (!walkCourse) {
          p.courses.push({
            id: `course-${p.targetWeekCode || p.id}-walk-tue`,
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
          p.courses.sort((a, b) => {
            if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
            return a.startTime.localeCompare(b.startTime);
          });
          updated = true;
        } else {
          if (walkCourse.startTime !== '19:30' || walkCourse.endTime !== '20:30' || walkCourse.roomId !== 'room-7' || walkCourse.name !== 'Meditativer Spaziergang') {
            walkCourse.name = 'Meditativer Spaziergang';
            walkCourse.startTime = '19:30';
            walkCourse.endTime = '20:30';
            walkCourse.roomId = 'room-7';
            if (!walkCourse.teacherId) walkCourse.teacherId = 'teacher-gen-pranava-pauly';
            p.courses.sort((a, b) => {
              if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
              return a.startTime.localeCompare(b.startTime);
            });
            updated = true;
          }
        }
      }
    }
    if (updated) {
      db.saveWeekPlans(list);
    }
    if (isOutdated && typeof window !== 'undefined') {
      localStorage.setItem('rapla_db_version', CURRENT_DB_VERSION.toString());
    }
    return list;
  },
  saveWeekPlans: (plans: WeekPlan[]): void => setStored('rapla_week_plans', plans),
  getWeekPlan: (id: string): WeekPlan | undefined => db.getWeekPlans().find(p => p.id === id),
  addWeekPlan: (plan: WeekPlan): void => {
    const list = db.getWeekPlans();
    plan.lastEditedAt = new Date().toISOString();
    list.push(plan);
    db.saveWeekPlans(list);
  },
  updateWeekPlan: (plan: WeekPlan): void => {
    const list = db.getWeekPlans();
    const index = list.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      plan.lastEditedAt = new Date().toISOString();
      list[index] = plan;
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
      list.push(plan);
    } else {
      plan.isApproved = isApproved;
      plan.status = isApproved ? 'approved' : 'draft';
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

      // 1. Sync wishes from server JSON to localStorage & teachers (bypassing any browser HTTP cache)
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
                teachers[idx].rules = { ...teachers[idx].rules, ...wish.rules };
                if (wish.availabilityMode) teachers[idx].availabilityMode = wish.availabilityMode;
                if (wish.specialties) teachers[idx].specialties = wish.specialties;
                teachers[idx].customWishes = wish.customWishes;
                updated = true;
              }
            }
            if (updated) {
              db.saveTeachers(teachers);
            }
          }
        }
      } catch (e) {
        console.warn('Wishes sync skipped or timed out:', e);
      }

      // 2. Sync absences from server JSON to localStorage & sevafrei (bypassing any browser HTTP cache)
      try {
        const absencesRes = await fetchWithTimeout(`/api/sevafrei?t=${timestamp}`);
        if (absencesRes.ok) {
          const serverAbsences = await absencesRes.json();
          if (serverAbsences && serverAbsences.length > 0) {
            const localAbsences = db.getSevafrei();
            let updated = false;
            for (const sAbs of serverAbsences) {
              const idx = localAbsences.findIndex((a: any) => a.id === sAbs.id);
              if (idx !== -1) {
                localAbsences[idx] = sAbs;
                updated = true;
              } else {
                localAbsences.push(sAbs);
                updated = true;
              }
            }
            if (updated) {
              db.saveSevafrei(localAbsences);
            }
          }
        }
      } catch (e) {
        console.warn('Absences sync skipped or timed out:', e);
      }

      // 3. Sync Supabase cloud state (Week plans, YLA assignments, teachers, rooms, etc.)
      await db.initializeCloudSync();
      
      // 4. Ensure week plans are verified and latest migrations applied
      db.getWeekPlans();

      // 5. Dispatch events so all active components (Wochenplan, YLA, Team views, Teachers) update immediately
      window.dispatchEvent(new CustomEvent('rapla-data-synced'));
      window.dispatchEvent(new CustomEvent('yla-assignment-changed'));
      window.dispatchEvent(new Event('storage'));
      return { success: true, message: 'Daten erfolgreich synchronisiert' };
    } catch (err: any) {
      console.error('Sync error:', err);
      return { success: false, message: err?.message || 'Fehler bei der Synchronisation' };
    }
  },

  syncDatabase: (): void => {
    // Safe sync without deleting user edits
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
                if (nameLower.includes('anfänger')) roomId = 'room-4';
                else if (nameLower.includes('mittelstufe')) roomId = 'room-3';
              }
              return {
                ...c,
                id: 'course-' + Math.random().toString(36).substr(2, 9),
                roomId,
                teacherId: (isAfterW40 || isAbhaInYla) ? null : c.teacherId,
                isAiPlanned: false,
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
