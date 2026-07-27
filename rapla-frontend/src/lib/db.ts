// LocalStorage Database helper for Yoga Studio Scheduler
export interface TimeSlot {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface TeacherRules {
  maxClassesPerDay: number;
  maxHoursPerWeek: number;
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
  "Abha Morkötter #",
  "Adam Zmuda",
  "Adinatha Lang #",
  "Alexander Melior #",
  "Amyana Finkel",
  "Ananda Schaak",
  "Ananta Heussler",
  "Anantadas Büsseler",
  "Anjali Gelzleichter #",
  "Annette Pritschow",
  "Aziza Lena Alemi",
  "Beate Menkarski",
  "Bhavani Jannausch",
  "burnie Bansemer",
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
  "hu bürkle #",
  "Ingrid Seemann",
  "Jnanadev Wallaschkowski",
  "Jörg Lützow",
  "Jörg Müller",
  "Julia Backhaus",
  "Jutta Kremer",
  "Jyoti Rudolphi #",
  "Karuna Wapke #",
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
  "Mouniir Jaber #",
  "Narayani Kedenburg",
  "Nathalie Butscher",
  "Nina Pabst",
  "Nirmaya Fodor #",
  "Parashakti Küttner",
  "Petra Zimmermann",
  "Pranava Pauly",
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
  "Teresa Allgäu",
  "Ulrich Nebel #",
  "Venulo Broszinski",
  "Volker Horn",
  "Wolfgang Seemann",
  "Wolfgang Meisel",
  "Zofia Konchok Nyima"
];

const SEVAKA_NAMES = [
  "Abha Morkötter #",
  "Adam Zmuda",
  "Alexander Melior #",
  "Anjali Gelzleichter #",
  "burnie Bansemer",
  "Harishakti",
  "hu bürkle #",
  "Karuna Wapke #",
  "Mouniir Jaber #",
  "Narayani Kedenburg",
  "Nirmaya Fodor #",
  "Pranava Pauly",
  "Satyam",
  "Ulrich Nebel #"
];

const GENERATED_TEACHERS: Teacher[] = NEW_TEACHER_NAMES.map((name, index) => {
  const cleanIdName = name.toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const id = `teacher-gen-${cleanIdName || index}`;
  
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

  return {
    id,
    name,
    email,
    phone: '',
    avatarColor,
    specialties: ['Hatha', 'Vinyasa', 'Yin', 'Meditation', 'Power Yoga', 'Kundalini'],
    isYogaTeacher: true,
    availabilityMode: isSevaka ? 'always' : 'seminar_only',
    roleType: isSevaka ? 'sevaka' : 'external',
    rules: {
      maxClassesPerDay: name.toLowerCase().includes('karuna') ? 3 : 2,
      maxHoursPerWeek: name.toLowerCase().includes('karuna') ? 30 : 10,
      minRestTime: 30,
      preferredRooms: [],
      preferredDays: [],
      canLeadMeditation: isSevaka,
      canLeadSatsang: isSevaka,
      availability: name.toLowerCase().includes('harishakti') ? [
        { day: 1, start: '06:30', end: '22:00' }, // Monday (morgens ODER nachmittags - checked in validator)
        { day: 2, start: '06:30', end: '11:30' }, // Tuesday (vormittags, bis 11:30)
        // Wednesday: FREI
        // Thursday: no slot
        { day: 5, start: '06:30', end: '11:30' }  // Friday (vormittags, bis 11:30)
      ] : name.toLowerCase().includes('karuna') ? [
        // Montag (1) ist Ruhetag (absolute Planungssperre)
        { day: 2, start: '06:00', end: '22:00' }, // Dienstag
        { day: 3, start: '06:00', end: '22:00' }, // Mittwoch
        { day: 4, start: '06:00', end: '22:00' }, // Donnerstag
        { day: 5, start: '06:00', end: '22:00' }, // Freitag
        { day: 6, start: '06:00', end: '22:00' }, // Samstag
        { day: 0, start: '06:00', end: '22:00' }  // Sonntag
      ] : [
        { day: 1, start: isSevaka ? '06:00' : '08:00', end: '22:00' },
        { day: 2, start: isSevaka ? '06:00' : '08:00', end: '22:00' },
        { day: 3, start: isSevaka ? '06:00' : '08:00', end: '22:00' },
        { day: 4, start: isSevaka ? '06:00' : '08:00', end: '22:00' },
        { day: 5, start: isSevaka ? '06:00' : '08:00', end: '22:00' },
        { day: 6, start: isSevaka ? '06:00' : '08:00', end: '22:00' },
        { day: 0, start: isSevaka ? '06:00' : '08:00', end: '22:00' }
      ]
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
    if (nameLower === 'mouniir') return 'teacher-gen-mouniir-jaber';
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
    { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 6, startTime: '06:00', endTime: '06:50', roomId: 'room-5', teacherName: 'Karuna' },
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Nirmaya' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Pranava' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 6, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Abha' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-2', teacherName: 'YL' },
    { name: 'Mittelstufe Mantrayogastunde', style: 'Hatha', dayOfWeek: 6, startTime: '16:15', endTime: '18:00', roomId: 'room-5', teacherName: 'Anjali' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 6, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 6, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Sunday (dayOfWeek: 0)
    { name: 'Fortgeschrittenes Pranayama', style: 'Hatha', dayOfWeek: 0, startTime: '06:00', endTime: '06:50', roomId: 'room-5', teacherName: 'burnie' },
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
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'hu' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Anjali' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 1, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'burnie' },
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
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 2, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Mouniir' },

    // Wednesday (dayOfWeek: 3)
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'Mouniir' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '07:00', endTime: '08:00', roomId: 'room-2', teacherName: 'Narayani' },
    { name: 'Anfänger', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-2', teacherName: 'Alexander' },
    { name: 'Mittelstufe', style: 'Hatha', dayOfWeek: 3, startTime: '09:15', endTime: '11:00', roomId: 'room-5', teacherName: 'Narayani' },
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 3, startTime: '19:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Abha' },
    { name: 'Satsang', style: 'Meditation', dayOfWeek: 3, startTime: '20:00', endTime: '21:00', roomId: 'room-2', teacherName: 'Karuna' },

    // Thursday (dayOfWeek: 4)
    { name: 'Gef. Meditation', style: 'Meditation', dayOfWeek: 4, startTime: '07:00', endTime: '07:30', roomId: 'room-5', teacherName: 'burnie' },
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
            "id": "course-v74kc8drf",
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
            "id": "course-xnl2kbui0",
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
            "id": "course-tliqody19",
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
            "id": "course-ae79o7wob",
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
            "id": "course-i8ppyie9t",
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
            "id": "course-ksly4vnts",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-alexander-melior",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-wcamvkrpr",
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
            "id": "course-p8ph8kkqm",
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
            "id": "course-f1feo1lan",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-t41us8fms",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-4om6rwdkz",
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
            "id": "course-nc3h92ylm",
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
            "id": "course-4izgyvlhk",
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
            "id": "course-zto4fz9rg",
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
            "id": "course-fh821q04z",
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
            "id": "course-2czq4we4p",
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
            "id": "course-am2ycbce0",
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
            "id": "course-l7txoacov",
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
            "id": "course-swgxapcho",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-al5ud9hc3",
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
            "id": "course-g1510gg57",
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
            "id": "course-3aewxbkv4",
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
            "id": "course-fcsvgb0py",
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
            "id": "course-kifw6no81",
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
            "id": "course-me76bluzf",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-yzurra5w0",
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
            "id": "course-plej07egc",
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
            "id": "course-7i63es5xa",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-37s0r4ave",
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
            "id": "course-jupyv4zfw",
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
            "id": "course-s3nz1wg9w",
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
            "id": "course-06vdawx2h",
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
            "id": "course-eu37tx1yk",
            "name": "Anfänger Rückenstunde",
            "style": "Hatha",
            "dayOfWeek": 1,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-xiwg2ejb2",
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
            "id": "course-yzod7e0wt",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-5tlj846ze",
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
            "id": "course-2aefzzo98",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-mrxjfq3a9",
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
            "id": "course-jmfl9bd3o",
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
            "id": "course-hspd02z53",
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
            "id": "course-vnzdk6tjs",
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
            "id": "course-s3nemkgc2",
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
            "id": "course-xp0eg7f1v",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-hzgrac7cc",
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
            "id": "course-t81yw5b5a",
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
            "id": "course-nodld38jo",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 3,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-hij6osy2d",
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
            "id": "course-zmaadwbip",
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
            "id": "course-a74a6ocn1",
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
            "id": "course-slhd4epz0",
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
            "id": "course-rs8lj615r",
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
            "id": "course-9xqa5sb8e",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 4,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-3f3o9h3dk",
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
            "id": "course-0dyuhmazu",
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
            "id": "course-n2fblsvzj",
            "name": "Mittelstufe",
            "style": "Hatha",
            "dayOfWeek": 4,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-8j5ew2sbm",
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
            "id": "course-ayu3wrm3o",
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
            "id": "course-571b29x3y",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-edb5s10oo",
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
            "id": "course-wyy6xh94g",
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
            "id": "course-awlltqtxk",
            "name": "Mittelstufe Klangyogastunde",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-rlbw99gcm",
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
            "id": "course-wm7q2hc20",
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
            "id": "course-n7pyi3atj",
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
            "id": "course-4xkagzg9b",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-wbdp158g9",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-l02qn5kc2",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-2a1nsyuo9",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 6,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-gaen5rkjy",
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
            "id": "course-a88qi60wb",
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
            "id": "course-hfnxxchi7",
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
            "id": "course-jcjx48l3q",
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
            "id": "course-14582mox8",
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
            "id": "course-gv6kj41v3",
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
            "id": "course-ed166f993",
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
            "id": "course-j4w4w6upo",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-rjc8azo0x",
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
            "id": "course-l0b2hn4ao",
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
            "id": "course-l0l3vk5sm",
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
            "id": "course-6dm5vcxsj",
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
            "id": "course-9m4q5aq7s",
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
            "id": "course-ze0xe6x7c",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-ruig3glez",
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
            "id": "course-fsinohh23",
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
            "id": "course-grv78mw4y",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-ewmlw0v6t",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-2q8ota0f5",
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
            "id": "course-hu4w18atf",
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
            "id": "course-8pd6pw1y0",
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
            "id": "course-ptuwlas4p",
            "name": "Anfänger Rückenstunde",
            "style": "Hatha",
            "dayOfWeek": 1,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-0xk4yqduv",
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
            "id": "course-subfmvbu0",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-bfn8fnhil",
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
            "id": "course-mvj40zsl1",
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
            "id": "course-ktfky57nk",
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
            "id": "course-ebw35otta",
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
            "id": "course-fmfwglqjs",
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
            "id": "course-2c3lya9nz",
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
            "id": "course-85o7q281z",
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
            "id": "course-udyyh7irx",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-n8midhky5",
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
            "id": "course-s1wq5p1b1",
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
            "id": "course-2gr5mi6kl",
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
            "id": "course-qa2artmh6",
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
            "id": "course-o32a7ly8w",
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
            "id": "course-ifliwx8nf",
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
            "id": "course-cavpvd28v",
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
            "id": "course-dvo5bq9jo",
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
            "id": "course-2oxhwzqhv",
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
            "id": "course-idfyn277q",
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
            "id": "course-8gbtzc28a",
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
            "id": "course-l6y6205x1",
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
            "id": "course-t2x5sjg8j",
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
            "id": "course-u0vpny5lh",
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
            "id": "course-nvz6sjpkw",
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
            "id": "course-htkrtafm4",
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
            "id": "course-yk1ia10sf",
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
            "id": "course-ptbg22uzv",
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
            "id": "course-8vb81m7wb",
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
            "id": "course-qsakz8jr1",
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
            "id": "course-idk987cm3",
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
            "id": "course-87wry1vtw",
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
            "id": "course-tu2roz96y",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-uxxearl4w",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-c2o9ukhux",
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
            "id": "course-bfqy8f134",
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
            "id": "course-0bbqk6v0t",
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
            "id": "course-yhd69pp0h",
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
            "id": "course-ujg0cp7ui",
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
            "id": "course-4m5n011rj",
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
            "id": "course-x57vdj585",
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
            "id": "course-7uz9u4mub",
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
            "id": "course-bzjcp4puk",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-2639fl4qt",
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
            "id": "course-nwf6ajmbp",
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
            "id": "course-nosr66nil",
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
            "id": "course-r1vz40i8k",
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
            "id": "course-4b17icl7v",
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
            "id": "course-km7ts2swd",
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
            "id": "course-ck3m0itgl",
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
            "id": "course-osfil6g6f",
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
            "id": "course-c40029l0z",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-q6rfqfs9q",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-6yitda8xl",
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
            "id": "course-44x8ehod6",
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
            "id": "course-ev14iw8e1",
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
            "id": "course-6dyp0iwgc",
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
            "id": "course-262hrwmol",
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
            "id": "course-5k5hkmf8s",
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
            "id": "course-kr2x6cblw",
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
            "id": "course-vkskckt6s",
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
            "id": "course-bz1ub58do",
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
            "id": "course-ev06ejc2y",
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
            "id": "course-h4lqk7mvy",
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
            "id": "course-p5m5hnun7",
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
            "id": "course-sy0qk137x",
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
            "id": "course-oxsi377xh",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-jy0mqgsfm",
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
            "id": "course-4s5igqld6",
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
            "id": "course-tikqhuy1v",
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
            "id": "course-8t7r8r8x6",
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
            "id": "course-zxebeps3n",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-5lo9z0sp7",
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
            "id": "course-sndj7fgte",
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
            "id": "course-34ew43iyy",
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
            "id": "course-se03wn767",
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
            "id": "course-1je5jb0in",
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
            "id": "course-atsx3kc1r",
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
            "id": "course-ecbhjo3d4",
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
            "id": "course-gnmus0418",
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
            "id": "course-r4z9n6ruu",
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
            "id": "course-42odxooba",
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
            "id": "course-9k3bp050n",
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
            "id": "course-ru5vet47u",
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
            "id": "course-pky50luaj",
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
            "id": "course-v888uq5iv",
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
            "id": "course-x9i24lud1",
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
            "id": "course-k6qdflo3i",
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
            "id": "course-opxl77ohw",
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
            "id": "course-lmggmywqm",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-hoaiy1out",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-85n2zwoyl",
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
            "id": "course-vjyke9nwq",
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
            "id": "course-e5vn94w62",
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
            "id": "course-4mrs3poef",
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
            "id": "course-xg4rg352a",
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
            "id": "course-326kfceu7",
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
            "id": "course-uqqad6a2t",
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
            "id": "course-wym7qoapr",
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
            "id": "course-p5owrze6a",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-2vqwidna2",
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
            "id": "course-o34nx2mxa",
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
            "id": "course-859wtok5y",
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
            "id": "course-g1ytbl4u2",
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
            "id": "course-i3dpi0xq8",
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
            "id": "course-iuhsv5y9m",
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
            "id": "course-8yebavr36",
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
            "id": "course-b389yivtf",
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
            "id": "course-q8754cqbd",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-9rb4uuzl8",
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
            "id": "course-sqldqhiv6",
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
            "id": "course-u1wnbqwup",
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
            "id": "course-vxho8mg80",
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
            "id": "course-1ml2hem8i",
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
            "id": "course-5ma41i4tm",
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
            "id": "course-phiqvw69j",
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
            "id": "course-2yds0bbf9",
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
            "id": "course-i05g1nzrf",
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
            "id": "course-zdnvmwi9p",
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
            "id": "course-mjrxkflga",
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
            "id": "course-jehid0ntf",
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
            "id": "course-b8ar1z52y",
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
            "id": "course-rpuplc5wg",
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
            "id": "course-0udubnr63",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-7p7ge61mr",
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
            "id": "course-34iu3x2xm",
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
            "id": "course-uwb8w7vx5",
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
            "id": "course-nuulom6ko",
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
            "id": "course-rpt29l2se",
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
            "id": "course-pnpx75lso",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-7lhl0pzh5",
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
            "id": "course-gwp4cex80",
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
            "id": "course-xc5tu6bor",
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
            "id": "course-nnjze1esf",
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
            "id": "course-28xdr2te9",
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
            "id": "course-nqs3vabzm",
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
            "id": "course-t6sigct5l",
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
            "id": "course-5rgdaywb0",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
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

const CURRENT_DB_VERSION = 9;

// Database Actions
export const db = {
  getTeachers: (): Teacher[] => {
    const storedVersion = typeof window !== 'undefined' ? localStorage.getItem('rapla_db_version') : null;
    const isOutdated = !storedVersion || parseInt(storedVersion, 10) < CURRENT_DB_VERSION;

    const stored = getStored<Teacher[]>('rapla_teachers', DEFAULT_TEACHERS);
    let updated = false;
    const list = [...stored];
    for (const defT of DEFAULT_TEACHERS) {
      const existingIdx = list.findIndex(t => t.id === defT.id || t.name === defT.name);
      if (existingIdx === -1) {
        list.push(defT);
        updated = true;
      } else if (isOutdated) {
        list[existingIdx].rules = defT.rules;
        list[existingIdx].specialties = defT.specialties;
        list[existingIdx].roleType = defT.roleType;
        list[existingIdx].availabilityMode = defT.availabilityMode;
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
        t.isYogaTeacher = true;
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
