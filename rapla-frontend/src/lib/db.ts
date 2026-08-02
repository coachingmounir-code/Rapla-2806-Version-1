// LocalStorage Database helper for Yoga Studio Scheduler
export interface TimeSlot {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface TeacherRules {
  maxClassesPerDay: number;
  maxHoursPerWeek: number;
  maxClassesPerWeek?: number;
  minRestTime: number; // in minutes
  preferredRooms: string[];
  preferredDays?: number[]; // list of days (0-6) where this teacher is prioritized
  nonPreferredDays?: number[]; // list of days (0-6) where this teacher prefers not to teach
  canLeadMeditation?: boolean;
  canLeadSatsang?: boolean;
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
  roleType?: 'sevaka' | 'external'; // 'sevaka' (core team) or 'external'
  rules: TeacherRules;
  customWishes?: string; // free text for comments/wishes
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
  "Tanja Eichenmüller",
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
  const nameLower = name.toLowerCase();
  
  if (!isSevaka) {
    // Non-Sevakas (externals) are available all week from 08:00 to 22:00
    return [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '08:00', end: '22:00' }));
  }

  // Sevakas by default are available from 06:00 to 22:00 on their active days
  if (nameLower.includes('burnie')) {
    // Free: Sat (6), Tue (2), Fri (5). Available: Sun (0), Mon (1), Wed (3), Thu (4)
    return [0, 1, 3, 4].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('satyam')) {
    // Free: Mon (1). Available: Sun (0), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6)
    return [0, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('teresa')) {
    // Free: Thu (4). Available: Sun (0), Mon (1), Tue (2), Wed (3), Fri (5), Sat (6)
    return [0, 1, 2, 3, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('abha')) {
    // Free: Sun (0), Wed (3). Available: Mon (1), Tue (2), Thu (4), Fri (5), Sat (6)
    return [1, 2, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('anjali')) {
    // Free: Wed (3). Tue (2) before 12:00, Thu (4) after 11:00.
    return [
      { day: 0, start: '06:00', end: '22:00' },
      { day: 1, start: '06:00', end: '22:00' },
      { day: 2, start: '06:00', end: '12:00' },
      { day: 4, start: '11:00', end: '22:00' },
      { day: 5, start: '06:00', end: '22:00' },
      { day: 6, start: '06:00', end: '22:00' }
    ];
  }
  if (nameLower.includes('karuna')) {
    // Free: Mon (1). Available: Sun (0), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6)
    return [0, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('hu')) {
    // Free: Tue (2). Mon (1) before 12:00, Wed (3) after 12:00.
    return [
      { day: 0, start: '06:00', end: '22:00' },
      { day: 1, start: '06:00', end: '12:00' },
      { day: 3, start: '12:00', end: '22:00' },
      { day: 4, start: '06:00', end: '22:00' },
      { day: 5, start: '06:00', end: '22:00' },
      { day: 6, start: '06:00', end: '22:00' }
    ];
  }
  if (nameLower.includes('mounir') || nameLower.includes('mouniir')) {
    // Free: Mon (1). Available: Sun (0), Tue (2), Wed (3), Thu (4), Fri (5), Sat (6)
    return [0, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('nirmaya')) {
    // Free: Tue (2), Wed (3). Available: Sun (0), Mon (1), Thu (4), Fri (5), Sat (6)
    return [0, 1, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('narayani')) {
    // Free: Fri (5), Sat (6). Sun (0) before 13:00.
    return [
      { day: 0, start: '06:00', end: '13:00' },
      { day: 1, start: '06:00', end: '22:00' },
      { day: 2, start: '06:00', end: '22:00' },
      { day: 3, start: '06:00', end: '22:00' },
      { day: 4, start: '06:00', end: '22:00' }
    ];
  }
  if (nameLower.includes('pranava')) {
    // Free: Tue (2), Wed (3). Available: Sun (0), Mon (1), Thu (4), Fri (5), Sat (6)
    return [0, 1, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('alexander')) {
    // Free: Sun (0), Mon (1). Available: Tue (2), Wed (3), Thu (4), Fri (5), Sat (6)
    return [2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('adam')) {
    // Free: Tue (2). Available: Sun (0), Mon (1), Wed (3), Thu (4), Fri (5), Sat (6)
    return [0, 1, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }
  if (nameLower.includes('harishakti')) {
    // Free: Wed (3), Thu (4), Sat (6), Sun (0). Available: Mon (1), Tue (2, before 11:30), Fri (5, before 11:30)
    return [
      { day: 1, start: '06:30', end: '22:00' },
      { day: 2, start: '06:30', end: '11:30' },
      { day: 5, start: '06:30', end: '11:30' }
    ];
  }
  if (nameLower.includes('ulrich')) {
    // Free: Tue (2), Sat (6). Available: Sun (0), Mon (1), Wed (3), Thu (4), Fri (5)
    return [0, 1, 3, 4, 5].map(d => ({ day: d, start: '06:00', end: '22:00' }));
  }

  // Default fallback for any other Sevaka
  return [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, start: '06:00', end: '22:00' }));
}

function getTeacherRules(name: string, isSevaka: boolean): {
  maxClassesPerDay: number;
  maxHoursPerWeek: number;
  maxClassesPerWeek?: number;
  canLeadMeditation: boolean;
  canLeadSatsang: boolean;
} {
  const nameLower = name.toLowerCase();
  const isKaruna = nameLower.includes('karuna');
  
  let maxClassesPerDay = isKaruna ? 3 : 2;
  let maxHoursPerWeek = isKaruna ? 30 : 10;
  let maxClassesPerWeek: number | undefined = undefined;

  if (nameLower.includes('satyam')) {
    maxClassesPerWeek = 2;
  } else if (nameLower.includes('teresa')) {
    maxClassesPerWeek = 1;
  } else if (nameLower.includes('abha')) {
    maxClassesPerWeek = 3;
  } else if (nameLower.includes('anjali')) {
    maxClassesPerWeek = 3;
  } else if (nameLower.includes('karuna')) {
    maxClassesPerWeek = 3; // for yoga classes
  } else if (nameLower.includes('nirmaya')) {
    maxClassesPerWeek = 2;
  } else if (nameLower.includes('narayani')) {
    maxClassesPerWeek = 3;
  } else if (nameLower.includes('pranava')) {
    maxClassesPerWeek = 4;
  } else if (nameLower.includes('alexander')) {
    maxClassesPerWeek = 2;
  } else if (nameLower.includes('harishakti')) {
    maxClassesPerWeek = 3;
  } else if (nameLower.includes('ulrich')) {
    maxClassesPerWeek = 4;
  }

  return {
    maxClassesPerDay,
    maxHoursPerWeek,
    maxClassesPerWeek,
    canLeadMeditation: isSevaka,
    canLeadSatsang: isSevaka
  };
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
  const isYogaTeacher = isSevaka ? !(name.toLowerCase().includes('teresa') || name.toLowerCase().includes('hu')) : true;

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
      maxClassesPerDay: tRules.maxClassesPerDay,
      maxHoursPerWeek: tRules.maxHoursPerWeek,
      maxClassesPerWeek: tRules.maxClassesPerWeek,
      minRestTime: 30,
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: tRules.canLeadMeditation,
      canLeadSatsang: tRules.canLeadSatsang,
      availability: getTeacherAvailability(name, isSevaka)
    }
  };
});

const DEFAULT_TEACHERS: Teacher[] = [
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
      maxClassesPerDay: 2,
      maxHoursPerWeek: 12,
      minRestTime: 30,
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
      maxClassesPerDay: 3,
      maxHoursPerWeek: 15,
      minRestTime: 45,
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
      maxClassesPerDay: 2,
      maxHoursPerWeek: 8,
      minRestTime: 30,
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
      maxClassesPerDay: 1,
      maxHoursPerWeek: 6,
      minRestTime: 60,
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
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 5, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Pranava' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 5, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Nirmaya' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 5, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Mittelstufe Klangyogastunde', style: 'Hatha', dayOfWeek: 5, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Anfänger AS', style: 'Hatha', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Mittelstufe AS', style: 'Hatha', dayOfWeek: 5, startTime: '16:30', endTime: '18:00', roomId: 'room-5', teacherName: 'Karuna' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 5, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Adam' },
    { name: 'Ankommensmedi.', style: 'Meditation', dayOfWeek: 5, startTime: '20:00', endTime: '20:35', roomId: 'room-5', teacherName: 'Pranava' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 5, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: '' },

    // Saturday (dayOfWeek: 6)
    { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 6, startTime: '06:00', endTime: '06:50', roomId: 'room-2', teacherName: 'Karuna' },
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Nirmaya' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'YL' },
    { name: 'Mittelstufe Mantrayogastunde', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 6, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Sunday (dayOfWeek: 0)
    { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 0, startTime: '06:00', endTime: '06:50', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 0, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 0, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 0, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 0, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Anfänger AS', style: 'Hatha', dayOfWeek: 0, startTime: '16:30', endTime: '18:15', roomId: 'room-2', teacherName: 'Karuna' },
    { name: 'Mittelstufe AS', style: 'Hatha', dayOfWeek: 0, startTime: '16:30', endTime: '18:00', roomId: 'room-5', teacherName: 'Pranava' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 0, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'burnie' },
    { name: 'Ankommensmedi.', style: 'Meditation', dayOfWeek: 0, startTime: '20:00', endTime: '20:35', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 0, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: '' },

    // Monday (dayOfWeek: 1)
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Hu' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Burnie' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Harishakti' },
    { name: 'Anfänger Rückenstunde', style: 'Hatha', dayOfWeek: 1, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 1, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Ulrich' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 1, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Nirmaya' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Narayani' },

    // Tuesday (dayOfWeek: 2)
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 2, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Alexander' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 2, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Harishakti' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 2, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Harishakti' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 2, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Anfänger Yin Yoga', style: 'Hatha', dayOfWeek: 2, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 2, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Narayani' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 2, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Mounir' },

    // Wednesday (dayOfWeek: 3)
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Mounir' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Narayani' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Narayani' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 3, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Thursday (dayOfWeek: 4)
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Burnie' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 4, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 4, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 4, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'Ulrich' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 4, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Nirmaya' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 4, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Harishakti' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 4, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' }
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
    id: "plan-pre-2026-W28",
    name: "Vorplanung 2026-W28 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W28",
    courses: [
          {
            "id": "course-2026-W28-1",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W28-2",
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
            "id": "course-2026-W28-3",
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
            "id": "course-2026-W28-4",
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
            "id": "course-2026-W28-5",
            "name": "Anfänger AS",
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
            "id": "course-2026-W28-6",
            "name": "Mittelstufe AS",
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
            "id": "course-2026-W28-7",
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
            "id": "course-2026-W28-8",
            "name": "Ankommensmedi.",
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
            "id": "course-2026-W28-9",
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
            "id": "course-2026-W28-10",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-11",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W28-12",
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
            "id": "course-2026-W28-13",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-14",
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
            "id": "course-2026-W28-15",
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
            "id": "course-2026-W28-16",
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
            "id": "course-2026-W28-17",
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
            "id": "course-2026-W28-18",
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
            "id": "course-2026-W28-19",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": "teacher-gen-burnie-narayani",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-20",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W28-21",
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
            "id": "course-2026-W28-22",
            "name": "Anfänger",
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
            "id": "course-2026-W28-23",
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
            "id": "course-2026-W28-24",
            "name": "Anfänger AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:15",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-25",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-26",
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
            "id": "course-2026-W28-27",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-harishakti",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-28",
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
            "id": "course-2026-W28-29",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W28-30",
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
            "id": "course-2026-W28-31",
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
            "id": "course-2026-W28-32",
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
            "id": "course-2026-W28-33",
            "name": "Anfänger Rückenstunde",
            "style": "Hatha",
            "dayOfWeek": 1,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-34",
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
            "id": "course-2026-W28-35",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-36",
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
            "id": "course-2026-W28-37",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-38",
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
            "id": "course-2026-W28-39",
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
            "id": "course-2026-W28-40",
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
            "id": "course-2026-W28-41",
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
            "id": "course-2026-W28-42",
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
            "id": "course-2026-W28-43",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-christopher",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-44",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-45",
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
            "id": "course-2026-W28-46",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 3,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-47",
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
            "id": "course-2026-W28-48",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-49",
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
            "id": "course-2026-W28-50",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-51",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-anjali-abha",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-52",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 4,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-53",
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
            "id": "course-2026-W28-54",
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
            "id": "course-2026-W28-55",
            "name": "Mittelstufe",
            "style": "Hatha",
            "dayOfWeek": 4,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-narayani-kedenburg",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W28-56",
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
            "id": "course-2026-W28-57",
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
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W29",
    name: "Vorplanung 2026-W29 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W29",
    courses: [
          {
            "id": "course-2026-W29-1",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-2",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-3",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-harishakti",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-4",
            "name": "Mittelstufe Klangyogastunde",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-5",
            "name": "Anfänger AS",
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
            "id": "course-2026-W29-6",
            "name": "Mittelstufe AS",
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
            "id": "course-2026-W29-7",
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
            "id": "course-2026-W29-8",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-9",
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
            "id": "course-2026-W29-10",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-11",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 6,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-12",
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
            "id": "course-2026-W29-13",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-14",
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
            "id": "course-2026-W29-15",
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
            "id": "course-2026-W29-16",
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
            "id": "course-2026-W29-17",
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
            "id": "course-2026-W29-18",
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
            "id": "course-2026-W29-19",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": "teacher-gen-burnie-narayani",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-20",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W29-21",
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
            "id": "course-2026-W29-22",
            "name": "Anfänger",
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
            "id": "course-2026-W29-23",
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
            "id": "course-2026-W29-24",
            "name": "Anfänger AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:15",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-25",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-26",
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
            "id": "course-2026-W29-27",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-harishakti",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-28",
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
            "id": "course-2026-W29-29",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-30",
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
            "id": "course-2026-W29-31",
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
            "id": "course-2026-W29-32",
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
            "id": "course-2026-W29-33",
            "name": "Anfänger Rückenstunde",
            "style": "Hatha",
            "dayOfWeek": 1,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-34",
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
            "id": "course-2026-W29-35",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-ulrich-nebel",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-36",
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
            "id": "course-2026-W29-37",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W29-38",
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
            "id": "course-2026-W29-39",
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
            "id": "course-2026-W29-40",
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
            "id": "course-2026-W29-41",
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
            "id": "course-2026-W29-42",
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
            "id": "course-2026-W29-43",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-christopher",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-44",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-45",
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
            "id": "course-2026-W29-46",
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
            "id": "course-2026-W29-47",
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
            "id": "course-2026-W29-48",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-49",
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
            "id": "course-2026-W29-50",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-51",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-anjali-abha",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W29-52",
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
            "id": "course-2026-W29-53",
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
            "id": "course-2026-W29-54",
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
            "id": "course-2026-W29-55",
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
            "id": "course-2026-W29-56",
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
            "id": "course-2026-W29-57",
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
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W30",
    name: "Vorplanung 2026-W30 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W30",
    courses: [
          {
            "id": "course-2026-W30-1",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W30-2",
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
            "id": "course-2026-W30-3",
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
            "id": "course-2026-W30-4",
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
            "id": "course-2026-W30-5",
            "name": "Anfänger AS",
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
            "id": "course-2026-W30-6",
            "name": "Mittelstufe AS",
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
            "id": "course-2026-W30-7",
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
            "id": "course-2026-W30-8",
            "name": "Ankommensmedi.",
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
            "id": "course-2026-W30-9",
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
            "id": "course-2026-W30-10",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-11",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W30-12",
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
            "id": "course-2026-W30-13",
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
            "id": "course-2026-W30-14",
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
            "id": "course-2026-W30-15",
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
            "id": "course-2026-W30-16",
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
            "id": "course-2026-W30-17",
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
            "id": "course-2026-W30-18",
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
            "id": "course-2026-W30-19",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-20",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W30-21",
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
            "id": "course-2026-W30-22",
            "name": "Anfänger",
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
            "id": "course-2026-W30-23",
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
            "id": "course-2026-W30-24",
            "name": "Anfänger AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:15",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-25",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-pranava-pauly",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-26",
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
            "id": "course-2026-W30-27",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-harishakti",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-28",
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
            "id": "course-2026-W30-29",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-30",
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
            "id": "course-2026-W30-31",
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
            "id": "course-2026-W30-32",
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
            "id": "course-2026-W30-33",
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
            "id": "course-2026-W30-34",
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
            "id": "course-2026-W30-35",
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
            "id": "course-2026-W30-36",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-37",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W30-38",
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
            "id": "course-2026-W30-39",
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
            "id": "course-2026-W30-40",
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
            "id": "course-2026-W30-41",
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
            "id": "course-2026-W30-42",
            "name": "Yoga Flow Mittelstufe",
            "style": "Hatha",
            "dayOfWeek": 2,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-43",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-christopher",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-44",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-45",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-46",
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
            "id": "course-2026-W30-47",
            "name": "Mittelstufe",
            "style": "Hatha",
            "dayOfWeek": 3,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-48",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-49",
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
            "id": "course-2026-W30-50",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-51",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-anjali-abha",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W30-52",
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
            "id": "course-2026-W30-53",
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
            "id": "course-2026-W30-54",
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
            "id": "course-2026-W30-55",
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
            "id": "course-2026-W30-56",
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
            "id": "course-2026-W30-57",
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
    createdAt: new Date().toISOString()
  },
  {
    id: "plan-pre-2026-W31",
    name: "Vorplanung 2026-W31 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W31",
    courses: [
          {
            "id": "course-2026-W31-1",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W31-2",
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
            "id": "course-2026-W31-3",
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
            "id": "course-2026-W31-4",
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
            "id": "course-2026-W31-5",
            "name": "Anfänger AS",
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
            "id": "course-2026-W31-6",
            "name": "Mittelstufe AS",
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
            "id": "course-2026-W31-7",
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
            "id": "course-2026-W31-8",
            "name": "Ankommensmedi.",
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
            "id": "course-2026-W31-9",
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
            "id": "course-2026-W31-10",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-11",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W31-12",
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
            "id": "course-2026-W31-13",
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
            "id": "course-2026-W31-14",
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
            "id": "course-2026-W31-15",
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
            "id": "course-2026-W31-16",
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
            "id": "course-2026-W31-17",
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
            "id": "course-2026-W31-18",
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
            "id": "course-2026-W31-19",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-2",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-20",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W31-21",
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
            "id": "course-2026-W31-22",
            "name": "Anfänger",
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
            "id": "course-2026-W31-23",
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
            "id": "course-2026-W31-24",
            "name": "Anfänger AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:15",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-25",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-pranava-pauly",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-26",
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
            "id": "course-2026-W31-27",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-harishakti",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-28",
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
            "id": "course-2026-W31-29",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W31-30",
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
            "id": "course-2026-W31-31",
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
            "id": "course-2026-W31-32",
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
            "id": "course-2026-W31-33",
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
            "id": "course-2026-W31-34",
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
            "id": "course-2026-W31-35",
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
            "id": "course-2026-W31-36",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-37",
            "name": "Gef. Meditation",
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
            "id": "course-2026-W31-38",
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
            "id": "course-2026-W31-39",
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
            "id": "course-2026-W31-40",
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
            "id": "course-2026-W31-41",
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
            "id": "course-2026-W31-42",
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
            "id": "course-2026-W31-43",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-christopher",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-44",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-45",
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
            "id": "course-2026-W31-46",
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
            "id": "course-2026-W31-47",
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
            "id": "course-2026-W31-48",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-abha-morkoetter",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-49",
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
            "id": "course-2026-W31-50",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-51",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-anjali-abha",
            "isAiPlanned": false,
            "status": "approved"
          },
          {
            "id": "course-2026-W31-52",
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
            "id": "course-2026-W31-53",
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
            "id": "course-2026-W31-54",
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
            "id": "course-2026-W31-55",
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
            "id": "course-2026-W31-56",
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
            "id": "course-2026-W31-57",
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
    createdAt: new Date().toISOString()
  }
];


// Helper functions for browser local storage
function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
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
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

const CURRENT_DB_VERSION = 11;

// Database Actions
export const db = {
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
        const hasTuesdayAvail = t.rules.availability.some(a => a.day === 2);
        
        if (hasMondayAvail || !hasTuesdayAvail || t.rules.maxHoursPerWeek < 30 || t.rules.maxClassesPerDay < 3) {
          t.rules.maxClassesPerDay = 3;
          t.rules.maxHoursPerWeek = 30;
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

      if (t.isYogaTeacher === undefined) {
        const defT = DEFAULT_TEACHERS.find(x => x.id === t.id || x.name === t.name);
        t.isYogaTeacher = defT ? defT.isYogaTeacher : true;
        updated = true;
      }
      if (t.availabilityMode === undefined) {
        t.availabilityMode = 'always';
        updated = true;
      }
      // Migration to set specific teachers as Sevakas and all others as external
      const correctRole = SEVAKA_NAMES.includes(t.name) ? 'sevaka' : 'external';
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
      const shouldLeadMeditation = correctRole === 'sevaka';
      const shouldLeadSatsang = correctRole === 'sevaka';
      if (t.rules.canLeadMeditation !== shouldLeadMeditation) {
        t.rules.canLeadMeditation = shouldLeadMeditation;
        updated = true;
      }
      if (t.rules.canLeadSatsang !== shouldLeadSatsang) {
        t.rules.canLeadSatsang = shouldLeadSatsang;
        updated = true;
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
      } else if (isOutdated || defPlan.id.startsWith('plan-pre-')) {
        // Always force update preplanned weeks or all default plans on DB version mismatch to prevent stale state
        list[idx] = defPlan;
        updated = true;
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
      localStorage.removeItem('rapla_week_plans');
      localStorage.removeItem('rapla_db_version');
      window.location.reload();
    }
  },

  getOrCreateUpcomingWeekPlans: (): WeekPlan[] => {
    const plans = db.getWeekPlans();
    const upcoming: WeekPlan[] = [];
    
    const today = new Date();
    const currentDay = today.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    
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
      const monday = new Date(today.getTime());
      monday.setDate(today.getDate() - daysSinceMonday + (w * 7));
      
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
        // Clone courses from plan-template-1 or standard
        const template = plans.find(p => p.id === 'plan-template-1') || plans[0];
        plan = {
          id: `plan-auto-${weekCode}`,
          name: `KW ${weekNum} (${rangeLabel})`,
          status: 'draft',
          targetWeekCode: weekCode,
          courses: template.courses.map(c => ({
            ...c,
            id: 'course-' + Math.random().toString(36).substr(2, 9),
            teacherId: c.teacherId,
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
