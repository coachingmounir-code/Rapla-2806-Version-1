// LocalStorage Database helper for Yoga Studio Scheduler
import { supabase } from './supabaseClient';
import wochenplanRules from './data/wochenplan_rules.json' with { type: 'json' };
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
  isAiPlanned: boolean;
  status: 'draft' | 'approved';
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
}

// Default Data
const DEFAULT_ROOMS: Room[] = [
  { id: 'room-1', name: 'Devi', color: '#d32f2f' },
  { id: 'room-2', name: 'Radhakrisna', color: '#f57c00' },
  { id: 'room-3', name: 'Hanuman', color: '#388e3c' },
  { id: 'room-4', name: 'Sitaram', color: '#1976d2' },
  { id: 'room-5', name: 'Tripura', color: '#7b1fa2' }
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
  else if (name === "Burnie") id = "teacher-gen-burnie-bansemer";
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
  const isSevaka = SEVAKA_NAMES.includes(name);
  const isYogaTeacher = isSevaka ? !(
    name.toLowerCase().includes('teresa') || 
    name.toLowerCase().includes('hu') || 
    name.toLowerCase().includes('mounir') || 
    name.toLowerCase().includes('adam') ||
    name.toLowerCase().includes('satyam')
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
    name: 'Marlene',
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
    name: 'Tanja Eichenmüller',
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
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

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
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Burnie' },
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
    courses: DEFAULT_COURSES.map(c => ({ ...c, status: 'approved' })),
    createdAt: new Date().toISOString()
  },
  // --- PREPLANNED WEEKS ---
                                                                                      {
    id: "plan-pre-2026-W35",
    name: "Vorplanung 2026-W35 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W35",
    courses: [
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-4",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "isAiPlanned": true,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-19",
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
        "id": "course-2026-W35-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-46",
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
        "id": "course-2026-W35-47",
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
        "id": "course-2026-W35-48",
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
        "id": "course-2026-W35-49",
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
        "id": "course-2026-W35-50",
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
        "id": "course-2026-W35-51",
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
        "id": "course-2026-W35-52",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
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
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W35-61",
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
        "id": "course-2026-W35-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W36",
    name: "Vorplanung 2026-W36 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W36",
    courses: [
      {
        "id": "course-2026-W36-1",
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
        "id": "course-2026-W36-2",
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
        "id": "course-2026-W36-3",
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
        "id": "course-2026-W36-4",
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
        "id": "course-2026-W36-5",
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
        "id": "course-2026-W36-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
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
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-8",
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
        "id": "course-2026-W36-9",
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
        "id": "course-2026-W36-10",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
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
        "isAiPlanned": true,
        "status": "approved"
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
        "status": "approved"
      },
      {
        "id": "course-2026-W36-13",
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
        "id": "course-2026-W36-14",
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
        "id": "course-2026-W36-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-16",
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
        "id": "course-2026-W36-17",
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
        "id": "course-2026-W36-18",
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
        "id": "course-2026-W36-19",
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
        "id": "course-2026-W36-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-21",
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
        "id": "course-2026-W36-22",
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
        "id": "course-2026-W36-23",
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
        "id": "course-2026-W36-24",
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
        "id": "course-2026-W36-25",
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
        "id": "course-2026-W36-26",
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
        "id": "course-2026-W36-27",
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
        "id": "course-2026-W36-28",
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
        "id": "course-2026-W36-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-30",
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
        "id": "course-2026-W36-31",
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
        "id": "course-2026-W36-32",
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
        "id": "course-2026-W36-33",
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
        "id": "course-2026-W36-34",
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
        "id": "course-2026-W36-35",
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
        "id": "course-2026-W36-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-37",
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
        "id": "course-2026-W36-38",
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
        "id": "course-2026-W36-39",
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
        "id": "course-2026-W36-40",
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
        "id": "course-2026-W36-41",
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
        "id": "course-2026-W36-42",
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
        "id": "course-2026-W36-43",
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
        "id": "course-2026-W36-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-45",
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
        "id": "course-2026-W36-46",
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
        "id": "course-2026-W36-47",
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
        "id": "course-2026-W36-48",
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
        "id": "course-2026-W36-49",
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
        "id": "course-2026-W36-50",
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
        "id": "course-2026-W36-51",
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
        "id": "course-2026-W36-52",
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
        "id": "course-2026-W36-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-54",
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
        "id": "course-2026-W36-55",
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
        "id": "course-2026-W36-56",
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
        "id": "course-2026-W36-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-59",
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
        "id": "course-2026-W36-60",
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
        "id": "course-2026-W36-61",
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
        "id": "course-2026-W36-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
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
        "roomId": "room-5",
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
        "roomId": "room-2",
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
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-7",
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
        "id": "course-2026-W37-8",
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
        "id": "course-2026-W37-12",
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
        "id": "course-2026-W37-13",
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
        "id": "course-2026-W37-14",
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
        "id": "course-2026-W37-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-16",
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
        "id": "course-2026-W37-17",
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
        "id": "course-2026-W37-18",
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
        "id": "course-2026-W37-19",
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
        "id": "course-2026-W37-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-21",
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
        "id": "course-2026-W37-22",
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
        "id": "course-2026-W37-23",
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
        "id": "course-2026-W37-24",
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
        "id": "course-2026-W37-25",
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
        "id": "course-2026-W37-26",
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
        "id": "course-2026-W37-27",
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
        "id": "course-2026-W37-28",
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
        "id": "course-2026-W37-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-30",
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
        "id": "course-2026-W37-31",
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
        "id": "course-2026-W37-32",
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
        "id": "course-2026-W37-33",
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
        "id": "course-2026-W37-34",
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
        "id": "course-2026-W37-35",
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
        "id": "course-2026-W37-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-37",
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
        "id": "course-2026-W37-38",
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
        "id": "course-2026-W37-39",
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
        "id": "course-2026-W37-40",
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
        "id": "course-2026-W37-41",
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
        "id": "course-2026-W37-42",
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
        "id": "course-2026-W37-43",
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
        "id": "course-2026-W37-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-45",
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
        "id": "course-2026-W37-46",
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
        "id": "course-2026-W37-47",
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
        "id": "course-2026-W37-48",
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
        "id": "course-2026-W37-49",
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
        "id": "course-2026-W37-50",
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
        "id": "course-2026-W37-51",
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
        "id": "course-2026-W37-52",
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
        "id": "course-2026-W37-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-54",
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
        "id": "course-2026-W37-55",
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
        "id": "course-2026-W37-56",
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
        "id": "course-2026-W37-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-59",
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
        "id": "course-2026-W37-60",
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
        "id": "course-2026-W37-61",
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
        "id": "course-2026-W37-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W38",
    name: "Vorplanung 2026-W38 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W38",
    courses: [
      {
        "id": "course-2026-W38-1",
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
        "id": "course-2026-W38-2",
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
        "id": "course-2026-W38-3",
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
        "id": "course-2026-W38-4",
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
        "id": "course-2026-W38-5",
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
        "id": "course-2026-W38-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-7",
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
        "id": "course-2026-W38-8",
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
        "id": "course-2026-W38-12",
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
        "id": "course-2026-W38-13",
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
        "id": "course-2026-W38-14",
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
        "id": "course-2026-W38-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-16",
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
        "id": "course-2026-W38-17",
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
        "id": "course-2026-W38-18",
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
        "id": "course-2026-W38-19",
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
        "id": "course-2026-W38-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-21",
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
        "id": "course-2026-W38-22",
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
        "id": "course-2026-W38-23",
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
        "id": "course-2026-W38-24",
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
        "id": "course-2026-W38-25",
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
        "id": "course-2026-W38-26",
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
        "id": "course-2026-W38-27",
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
        "id": "course-2026-W38-28",
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
        "id": "course-2026-W38-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-30",
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
        "id": "course-2026-W38-31",
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
        "id": "course-2026-W38-32",
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
        "id": "course-2026-W38-33",
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
        "id": "course-2026-W38-34",
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
        "id": "course-2026-W38-35",
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
        "id": "course-2026-W38-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-37",
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
        "id": "course-2026-W38-38",
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
        "id": "course-2026-W38-39",
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
        "id": "course-2026-W38-40",
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
        "id": "course-2026-W38-41",
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
        "id": "course-2026-W38-42",
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
        "id": "course-2026-W38-43",
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
        "id": "course-2026-W38-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-45",
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
        "id": "course-2026-W38-46",
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
        "id": "course-2026-W38-47",
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
        "id": "course-2026-W38-48",
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
        "id": "course-2026-W38-49",
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
        "id": "course-2026-W38-50",
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
        "id": "course-2026-W38-51",
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
        "id": "course-2026-W38-52",
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
        "id": "course-2026-W38-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-54",
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
        "id": "course-2026-W38-55",
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
        "id": "course-2026-W38-56",
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
        "id": "course-2026-W38-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-59",
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
        "id": "course-2026-W38-60",
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
        "id": "course-2026-W38-61",
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
        "id": "course-2026-W38-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W39",
    name: "Vorplanung 2026-W39 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W39",
    courses: [
      {
        "id": "course-2026-W39-1",
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
        "id": "course-2026-W39-2",
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
        "id": "course-2026-W39-3",
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
        "id": "course-2026-W39-4",
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
        "id": "course-2026-W39-5",
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
        "id": "course-2026-W39-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-7",
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
        "id": "course-2026-W39-8",
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
        "id": "course-2026-W39-11",
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
        "id": "course-2026-W39-12",
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
        "id": "course-2026-W39-13",
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
        "id": "course-2026-W39-14",
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
        "id": "course-2026-W39-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-16",
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
        "id": "course-2026-W39-17",
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
        "id": "course-2026-W39-18",
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
        "id": "course-2026-W39-19",
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
        "id": "course-2026-W39-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-21",
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
        "id": "course-2026-W39-22",
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
        "id": "course-2026-W39-23",
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
        "id": "course-2026-W39-24",
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
        "id": "course-2026-W39-25",
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
        "id": "course-2026-W39-26",
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
        "id": "course-2026-W39-27",
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
        "id": "course-2026-W39-28",
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
        "id": "course-2026-W39-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-30",
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
        "id": "course-2026-W39-31",
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
        "id": "course-2026-W39-32",
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
        "id": "course-2026-W39-33",
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
        "id": "course-2026-W39-34",
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
        "id": "course-2026-W39-35",
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
        "id": "course-2026-W39-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-37",
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
        "id": "course-2026-W39-38",
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
        "id": "course-2026-W39-39",
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
        "id": "course-2026-W39-40",
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
        "id": "course-2026-W39-41",
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
        "id": "course-2026-W39-42",
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
        "id": "course-2026-W39-43",
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
        "id": "course-2026-W39-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-45",
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
        "id": "course-2026-W39-46",
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
        "id": "course-2026-W39-47",
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
        "id": "course-2026-W39-48",
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
        "id": "course-2026-W39-49",
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
        "id": "course-2026-W39-50",
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
        "id": "course-2026-W39-51",
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
        "id": "course-2026-W39-52",
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
        "id": "course-2026-W39-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-54",
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
        "id": "course-2026-W39-55",
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
        "id": "course-2026-W39-56",
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
        "id": "course-2026-W39-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-59",
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
        "id": "course-2026-W39-60",
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
        "id": "course-2026-W39-61",
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
        "id": "course-2026-W39-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W40",
    name: "Vorplanung 2026-W40 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W40",
    courses: [
      {
        "id": "course-2026-W40-1",
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
        "id": "course-2026-W40-2",
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
        "id": "course-2026-W40-3",
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
        "id": "course-2026-W40-4",
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
        "id": "course-2026-W40-5",
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
        "id": "course-2026-W40-6",
        "name": "Anfänger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-7",
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
        "id": "course-2026-W40-8",
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
        "id": "course-2026-W40-9",
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
        "id": "course-2026-W40-10",
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
        "id": "course-2026-W40-11",
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
        "id": "course-2026-W40-12",
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
        "id": "course-2026-W40-13",
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
        "id": "course-2026-W40-14",
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
        "id": "course-2026-W40-15",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-16",
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
        "id": "course-2026-W40-17",
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
        "id": "course-2026-W40-18",
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
        "id": "course-2026-W40-19",
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
        "id": "course-2026-W40-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-21",
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
        "id": "course-2026-W40-22",
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
        "id": "course-2026-W40-23",
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
        "id": "course-2026-W40-24",
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
        "id": "course-2026-W40-25",
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
        "id": "course-2026-W40-26",
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
        "id": "course-2026-W40-27",
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
        "id": "course-2026-W40-28",
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
        "id": "course-2026-W40-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-30",
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
        "id": "course-2026-W40-31",
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
        "id": "course-2026-W40-32",
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
        "id": "course-2026-W40-33",
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
        "id": "course-2026-W40-34",
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
        "id": "course-2026-W40-35",
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
        "id": "course-2026-W40-36",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-37",
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
        "id": "course-2026-W40-38",
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
        "id": "course-2026-W40-39",
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
        "id": "course-2026-W40-40",
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
        "id": "course-2026-W40-41",
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
        "id": "course-2026-W40-42",
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
        "id": "course-2026-W40-43",
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
        "id": "course-2026-W40-44",
        "name": "Anfänger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-45",
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
        "id": "course-2026-W40-46",
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
        "id": "course-2026-W40-47",
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
        "id": "course-2026-W40-48",
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
        "id": "course-2026-W40-49",
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
        "id": "course-2026-W40-50",
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
        "id": "course-2026-W40-51",
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
        "id": "course-2026-W40-52",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-54",
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
        "id": "course-2026-W40-55",
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
        "id": "course-2026-W40-56",
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
        "id": "course-2026-W40-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-59",
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
        "id": "course-2026-W40-60",
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
        "id": "course-2026-W40-61",
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
        "id": "course-2026-W40-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W41",
    name: "Vorplanung 2026-W41 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W41",
    courses: [
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
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
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
        "teacherId": "teacher-gen-karuna-wapke",
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
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
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
        "endTime": "21:00",
        "roomId": "room-2",
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
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
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
        "teacherId": "teacher-gen-nirmaya-fodor",
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
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
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
        "isAiPlanned": false,
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
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-47",
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
        "id": "course-2026-W41-48",
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
        "id": "course-2026-W41-49",
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
        "id": "course-2026-W41-50",
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
        "id": "course-2026-W41-51",
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
        "id": "course-2026-W41-52",
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
        "id": "course-2026-W41-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-54",
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
        "id": "course-2026-W41-55",
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
        "id": "course-2026-W41-56",
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
        "id": "course-2026-W41-57",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W41-59",
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
        "id": "course-2026-W41-60",
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
        "id": "course-2026-W41-61",
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
        "id": "course-2026-W41-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W42",
    name: "Vorplanung 2026-W42 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W42",
    courses: [
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
        "teacherId": "teacher-gen-alexander-melior",
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
        "id": "course-2026-W42-8",
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
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
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
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-19",
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
        "id": "course-2026-W42-20",
        "name": "Hausführung",
        "style": "Sonstiges",
        "dayOfWeek": 0,
        "startTime": "19:00",
        "endTime": "19:30",
        "roomId": "Rezeption",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": true,
        "status": "approved"
      },
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
        "id": "course-2026-W42-28",
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
        "id": "course-2026-W42-29",
        "name": "Satsang Einführung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
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
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
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
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
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
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
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
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-47",
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
        "id": "course-2026-W42-48",
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
        "id": "course-2026-W42-49",
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
        "id": "course-2026-W42-50",
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
        "id": "course-2026-W42-51",
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
        "id": "course-2026-W42-52",
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
        "id": "course-2026-W42-53",
        "name": "Entspannungsangebot: Yogageschichten am Kamin",
        "style": "Entspannung",
        "dayOfWeek": 3,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-54",
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
        "id": "course-2026-W42-55",
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
        "id": "course-2026-W42-56",
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
        "id": "course-2026-W42-57",
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
        "id": "course-2026-W42-58",
        "name": "Anfänger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W42-59",
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
        "id": "course-2026-W42-60",
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
        "id": "course-2026-W42-61",
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
        "id": "course-2026-W42-62",
        "name": "Entspannungsangebot: Peziebälle / Fantasiereise",
        "style": "Entspannung",
        "dayOfWeek": 4,
        "startTime": "21:10",
        "endTime": "22:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
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
  
  if (supabase && cloudInitialized) {
    if (inMemoryStore[key] !== undefined) {
      return inMemoryStore[key] as T;
    }
    return defaultValue;
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch (e) {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  if (supabase && cloudInitialized) {
    inMemoryStore[key] = value;
    // Asynchronously push to cloud
    supabase.from('app_state').upsert({ key, value: JSON.stringify(value) })
      .then(({ error }) => {
        if (error) console.error('Failed to sync to cloud', error);
      });
  }

  // Always write to local storage as fallback and offline cache
  localStorage.setItem(key, JSON.stringify(value));
}

const CURRENT_DB_VERSION = 72;

// Database Actions
export const db = {
  initializeCloudSync: async (): Promise<void> => {
    if (typeof window === 'undefined' || !supabase) return;
    try {
      const { data, error } = await supabase.from('app_state').select('*');
      if (!error && data) {
        let changed = false;
        for (const row of data) {
          try {
            const currentStr = localStorage.getItem(row.key);
            if (currentStr !== row.value) {
              changed = true;
              localStorage.setItem(row.key, row.value);
            }
            inMemoryStore[row.key] = JSON.parse(row.value);
          } catch(e) {}
        }
        cloudInitialized = true;
        if (changed) {
          // If cloud data is different from local cache, reload to ensure UI updates
          window.location.reload();
        }
      }
    } catch (e) {
      console.error('Failed to initialize cloud sync', e);
    }
  },
  getDefaultCourses: (): Course[] => DEFAULT_COURSES,
  getTeachers: (): Teacher[] => {
    const storedVersion = typeof window !== 'undefined' ? localStorage.getItem('rapla_db_version') : null;
    const isOutdated = !storedVersion || parseInt(storedVersion, 10) < CURRENT_DB_VERSION;

    const stored = getStored<Teacher[]>('rapla_teachers', DEFAULT_TEACHERS);
    let updated = false;
    const list = [...stored];

    // Migration to update existing Sevakas' names to first names
    for (const t of list) {
      if (t.id === "teacher-gen-abha-morkoetter" && t.name !== "Abha") { t.name = "Abha"; updated = true; }
      else if (t.id === "teacher-gen-adam-zmuda" && t.name !== "Adam") { t.name = "Adam"; updated = true; }
      else if (t.id === "teacher-gen-alexander-melior" && t.name !== "Alexander") { t.name = "Alexander"; updated = true; }
      else if (t.id === "teacher-gen-anjali-gelzleichter" && t.name !== "Anjali") { t.name = "Anjali"; updated = true; }
      else if (t.id === "teacher-gen-burnie-bansemer" && t.name !== "Burnie") { t.name = "Burnie"; updated = true; }
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
      } else if (isOutdated) {
        list[existingIdx].name = defT.name;
        list[existingIdx].rules = defT.rules;
        list[existingIdx].specialties = defT.specialties;
        list[existingIdx].roleType = defT.roleType;
        list[existingIdx].availabilityMode = defT.availabilityMode;
        list[existingIdx].isYogaTeacher = defT.isYogaTeacher;
        list[existingIdx].stayStartDate = defT.stayStartDate;
        list[existingIdx].stayEndDate = defT.stayEndDate;
        list[existingIdx].stayNotes = defT.stayNotes;
        updated = true;
      }
    }
    // Ensure all entries have the isYogaTeacher property (defaults to true)
    for (const t of list) {
      // Migration for Harishakti's rules
      if (t.name.toLowerCase().includes('harishakti')) {
        const hasMondayAvail = t.rules.availability.some(a => a.day === 1 && a.start === '06:30' && a.end === '22:00');
        const hasTuesdayAvail = t.rules.availability.some(a => a.day === 2 && a.end === '11:30');
        const hasWedAvail = t.rules.availability.some(a => a.day === 3);
        const hasThuAvail = t.rules.availability.some(a => a.day === 4);
        const hasFriAvail = t.rules.availability.some(a => a.day === 5 && a.end === '11:30');
        
        if (!hasMondayAvail || !hasTuesdayAvail || hasWedAvail || hasThuAvail || !hasFriAvail) {
          t.rules.availability = [
            { day: 1, start: '06:30', end: '22:00' }, // Monday
            { day: 2, start: '06:30', end: '11:30' }, // Tuesday
            // Wednesday: FREI
            // Thursday: no slot
            { day: 5, start: '06:30', end: '11:30' }  // Friday
          ];
          updated = true;
        }
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
        ? !['teresa', 'hu', 'mounir', 'adam'].some(n => nameLower.includes(n)) 
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
    const isOld = stored.length !== 5 || stored.some(r => r.name === 'Sivananda Saal');
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
    let updated = false;
    const list = [...stored];
    for (const defPlan of DEFAULT_WEEK_PLANS) {
      const idx = list.findIndex(p => p.id === defPlan.id);
      if (idx === -1) {
        list.push(defPlan);
        updated = true;
      } else if (isOutdated) {
        // Always force update all default plans on DB version mismatch to prevent stale state
        if (!list[idx].isManualOnly) {
          list[idx] = defPlan;
          updated = true;
        }
      }
    }
    for (const p of list) {
      if (p.seminarLeaderIds === undefined) {
        p.seminarLeaderIds = [];
        updated = true;
      }
      // Migration: Rebuild auto-generated plans to match the new blank week template if DB version is outdated
      if (isOutdated && p.id.startsWith('plan-auto-')) {
        p.courses = DEFAULT_COURSES.map(c => ({
          ...c,
          id: 'course-' + Math.random().toString(36).substr(2, 9),
          teacherId: c.teacherId,
          isAiPlanned: false,
          status: 'draft'
        }));
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
    list.push(plan);
    db.saveWeekPlans(list);
  },
  updateWeekPlan: (plan: WeekPlan): void => {
    const list = db.getWeekPlans();
    const index = list.findIndex(p => p.id === plan.id);
    if (index !== -1) {
      list[index] = plan;
      db.saveWeekPlans(list);
    }
  },
  deleteWeekPlan: (id: string): void => {
    const list = db.getWeekPlans();
    db.saveWeekPlans(list.filter(p => p.id !== id));
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
      plan.courses.push(course);
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
        plan.courses[index] = course;
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
      db.updateWeekPlan(plan);
    }
  },
  
  // Clear all planner data for a specific plan
  resetSchedule: (planId?: string): void => {
    const plans = db.getWeekPlans();
    const pId = planId || plans.find(p => p.status === 'approved')?.id || plans[0]?.id || '';
    const plan = db.getWeekPlan(pId);
    if (plan) {
      plan.courses = plan.courses.map(c => ({ ...c, teacherId: null, isAiPlanned: false, status: 'draft' }));
      db.updateWeekPlan(plan);
    }
  },

  syncDatabase: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rapla_teachers');
      // Do not clear rapla_week_plans entirely to preserve isManualOnly flags
      localStorage.removeItem('rapla_db_version');
      window.location.reload();
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
        plan = {
          id: `plan-auto-${weekCode}`,
          name: `KW ${weekNum} (${rangeLabel})`,
          status: 'draft',
          targetWeekCode: weekCode,
          courses: template.courses.map(c => ({
            ...c,
            id: 'course-' + Math.random().toString(36).substr(2, 9),
            teacherId: isAfterW40 ? null : c.teacherId,
            isAiPlanned: false,
            status: 'draft'
          })),
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
