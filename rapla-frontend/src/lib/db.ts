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
        { day: 2, start: '06:30', end: '22:00' }, // Dienstag
        { day: 3, start: '06:30', end: '22:00' }, // Mittwoch
        { day: 4, start: '06:30', end: '22:00' }, // Donnerstag
        { day: 5, start: '06:30', end: '22:00' }, // Freitag
        { day: 6, start: '06:30', end: '22:00' }, // Samstag
        { day: 0, start: '06:30', end: '22:00' }  // Sonntag
      ] : [
        { day: 1, start: isSevaka ? '06:30' : '08:00', end: '22:00' },
        { day: 2, start: isSevaka ? '06:30' : '08:00', end: '22:00' },
        { day: 3, start: isSevaka ? '06:30' : '08:00', end: '22:00' },
        { day: 4, start: isSevaka ? '06:30' : '08:00', end: '22:00' },
        { day: 5, start: isSevaka ? '06:30' : '08:00', end: '22:00' },
        { day: 6, start: isSevaka ? '06:30' : '08:00', end: '22:00' },
        { day: 0, start: isSevaka ? '06:30' : '08:00', end: '22:00' }
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
    { name: 'Om Namo Narayanaya', style: 'Meditation', dayOfWeek: 4, startTime: '18:30', endTime: '20:00', roomId: 'room-2', teacherName: 'Harishakti' },
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
            "id": "course-gxi2pforc",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-alexander-melior",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-63gpce6f0",
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
            "id": "course-7lrj8yl4n",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-pranava-pauly",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-ck1nf6438",
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
            "id": "course-k12cz7fwn",
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
            "id": "course-9w3pn10ew",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-rdj0zedkz",
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
            "id": "course-7rdiwtt5v",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-alexander-melior",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-l4ltvlq5a",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-e29ul6n09",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-ankzu8cai",
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
            "id": "course-q967i2txp",
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
            "id": "course-mmx1up0qy",
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
            "id": "course-t9pal2d68",
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
            "id": "course-sboq1t0s8",
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
            "id": "course-4xdgin7ub",
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
            "id": "course-zlm8smxfn",
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
            "id": "course-hjkjwugpg",
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
            "id": "course-7khbmu2fa",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-ie29prfbz",
            "name": "Gef. Meditation",
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
            "id": "course-h16auttld",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-92fji1f6z",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-dq8cav8i5",
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
            "id": "course-u8a5d5w0m",
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
            "id": "course-32cwn2zpq",
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
            "id": "course-x8jp9idi3",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-4pabtjwuy",
            "name": "Ankommensmedi.",
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
            "id": "course-2ea7am638",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-u7lp5req2",
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
            "id": "course-wxtxzzszs",
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
            "id": "course-qrhvo7mz9",
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
            "id": "course-nbtbywwqk",
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
            "id": "course-x0mo1ixjq",
            "name": "Anfänger Rückenstunde",
            "style": "Hatha",
            "dayOfWeek": 1,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-c24plor7d",
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
            "id": "course-qrh6jjww6",
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
            "id": "course-kug693kdp",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-vm63nics3",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 2,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-krdcu11ps",
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
            "id": "course-n63el6djm",
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
            "id": "course-4na1qfg15",
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
            "id": "course-d55bzehcs",
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
            "id": "course-1oplfpht2",
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
            "id": "course-w7wj05iqa",
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
            "id": "course-qu56avxht",
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
            "id": "course-njqnd3157",
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
            "id": "course-8yet3vdpv",
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
            "id": "course-7aoj3p0n1",
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
            "id": "course-sqn2bakgn",
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
            "id": "course-njjl5com1",
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
            "id": "course-ip7wnghjc",
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
            "id": "course-5wt7a2egl",
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
            "id": "course-c5sn4ro9b",
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
            "id": "course-sy7259snr",
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
            "id": "course-85su6m1r7",
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
            "id": "course-oaof0h3d4",
            "name": "Mittelstufe",
            "style": "Hatha",
            "dayOfWeek": 4,
            "startTime": "16:15",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-1axe4bidi",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "18:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-ulrich-nebel",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-co2s9e4qq",
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
            "id": "course-dwhpme7is",
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
            "id": "course-f5v4yyoxf",
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
            "id": "course-wjs60i2gq",
            "name": "Anfänger",
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
            "id": "course-e8jbrsqrs",
            "name": "Mittelstufe Klangyogastunde",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-a47nc129s",
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
            "id": "course-6m9lhpg59",
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
            "id": "course-ec599x47t",
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
            "id": "course-bm1r1fxei",
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
            "id": "course-1bbj45z36",
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
            "id": "course-mbw0f6eaz",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-t7tbjaqy5",
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
            "id": "course-2maloouki",
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
            "id": "course-jbe4qo455",
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
            "id": "course-8ynhrbegu",
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
            "id": "course-yt4nzi7ag",
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
            "id": "course-jftmswnsb",
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
            "id": "course-2hdoqf9pg",
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
            "id": "course-057exhx8n",
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
            "id": "course-8m269cl68",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-5rmviu2eo",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-ubs6ucnjj",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-muh943izm",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-nvxvddycr",
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
            "id": "course-sg34vzq3g",
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
            "id": "course-itosdjz9h",
            "name": "Mittelstufe AS",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "16:30",
            "endTime": "18:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-7cw83nhar",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-slcpqb2d4",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-s8fa6hgqd",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-qooz0sfvt",
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
            "id": "course-ud9dz70h8",
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
            "id": "course-15m9ievkg",
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
            "id": "course-ctzwf1r8y",
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
            "id": "course-d2s3d5961",
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
            "id": "course-0ivm74m3o",
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
            "id": "course-992gogkar",
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
            "id": "course-xfciaykwq",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-bcb6u4ve9",
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
            "id": "course-faiqh3sfi",
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
            "id": "course-nevul7j9i",
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
            "id": "course-0pu1q4fu0",
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
            "id": "course-r4mv1woju",
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
            "id": "course-z96lnffoq",
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
            "id": "course-k31bf9q3j",
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
            "id": "course-wvryvt2f5",
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
            "id": "course-alfu72efh",
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
            "id": "course-ek5eiom6h",
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
            "id": "course-73elyhfdi",
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
            "id": "course-cw4w1v1q2",
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
            "id": "course-c5nvztk2r",
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
            "id": "course-18sb9pdlx",
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
            "id": "course-o78ppioy1",
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
            "id": "course-s694nby5q",
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
            "id": "course-68rtm2qjy",
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
            "id": "course-nleen8j6v",
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
            "id": "course-sd6ljlcmq",
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
            "id": "course-gxt2e1gk6",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "18:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-pranava-pauly",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-nfr1cpojy",
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
            "id": "course-unhjlr9zr",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-hm2qnd1v4",
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
            "id": "course-cd01nsldk",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-g9hj3cayy",
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
            "id": "course-sx1wbhh6s",
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
            "id": "course-d7rsfe023",
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
            "id": "course-fvctqr2hu",
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
            "id": "course-ywbpkmcia",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-qe48njxe5",
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
            "id": "course-iyllqa7pm",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-7g6171i1n",
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
            "id": "course-2bov25tak",
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
            "id": "course-g10gpb0z1",
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
            "id": "course-xqlyxwjj0",
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
            "id": "course-7xzgmkh4o",
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
            "id": "course-x4gdf14z4",
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
            "id": "course-l76im882v",
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
            "id": "course-ds1javhfu",
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
            "id": "course-lglfetfz2",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-t40mrcc2k",
            "name": "Gef. Meditation",
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
            "id": "course-b4eownl37",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-5yqlmfl8p",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-tcjy4xsug",
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
            "id": "course-xxskc7nk3",
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
            "id": "course-rkds698a2",
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
            "id": "course-ry7c6qdnw",
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
            "id": "course-u4yqw23z4",
            "name": "Ankommensmedi.",
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
            "id": "course-rtdkia3ds",
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
            "id": "course-p62651mnu",
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
            "id": "course-iozcb1vet",
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
            "id": "course-a6fnxdydb",
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
            "id": "course-wf41mttjk",
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
            "id": "course-8duw5g0we",
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
            "id": "course-8inhma7ha",
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
            "id": "course-dqiz579q4",
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
            "id": "course-eehzcnxl5",
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
            "id": "course-dvvqdbs15",
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
            "id": "course-vtxhma4ft",
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
            "id": "course-hqfs80r43",
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
            "id": "course-0yf71baou",
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
            "id": "course-qcce6a543",
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
            "id": "course-j9cwjkbj5",
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
            "id": "course-t16xsax1a",
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
            "id": "course-owzhxys5q",
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
            "id": "course-bqw3zkq6j",
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
            "id": "course-zguqu5nbm",
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
            "id": "course-61xm2acch",
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
            "id": "course-z98zqfbuz",
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
            "id": "course-uikim8hyj",
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
            "id": "course-o41ryj5gk",
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
            "id": "course-7oreeirva",
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
            "id": "course-x8wrn9u3c",
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
            "id": "course-bq3qwq667",
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
            "id": "course-nby4sp0ck",
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
            "id": "course-3t6qwzmhg",
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
            "id": "course-cp8fqbgoh",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "18:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-gtd8ixp3s",
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
            "id": "course-z8iedxg9z",
            "name": "Gef. Meditation",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "07:00",
            "endTime": "07:30",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-uunxcvcmh",
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
            "id": "course-a7qh7mddj",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-5",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-ge0qmp45n",
            "name": "Mittelstufe Klangyogastunde",
            "style": "Hatha",
            "dayOfWeek": 5,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-dhxms5b21",
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
            "id": "course-opfhepzo3",
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
            "id": "course-ij582ph4z",
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
            "id": "course-uszg879c0",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 5,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-i1pqoc83m",
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
            "id": "course-78cu1vau4",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 6,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-uc4jo506n",
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
            "id": "course-76o59wcmx",
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
            "id": "course-1asv73lri",
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
            "id": "course-08qct6gy5",
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
            "id": "course-zyafajncq",
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
            "id": "course-wwhiteak0",
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
            "id": "course-f4yshoqg5",
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
            "id": "course-uwp0q7bqf",
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
            "id": "course-gv8zznox6",
            "name": "Fortgeschrittenes Pranayama",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "06:00",
            "endTime": "06:50",
            "roomId": "room-5",
            "teacherId": null,
            "isAiPlanned": false,
            "status": "approved"
      },
      {
            "id": "course-ejutozvlk",
            "name": "Gef. Meditation",
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
            "id": "course-vmtqn4he2",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-6e9piha51",
            "name": "Anfänger",
            "style": "Hatha",
            "dayOfWeek": 0,
            "startTime": "09:15",
            "endTime": "11:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-llw2hja5j",
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
            "id": "course-thbf8j0wl",
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
            "id": "course-bsl4nhmy6",
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
            "id": "course-s7zvrpjiu",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "19:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-3ar2w5aeq",
            "name": "Ankommensmedi.",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "20:35",
            "roomId": "room-5",
            "teacherId": "teacher-gen-karuna-wapke",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-tczvuqser",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 0,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-adam-zmuda",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-vne7ikgtj",
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
            "id": "course-29ggw82ts",
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
            "id": "course-ickyvrk62",
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
            "id": "course-d60q1u28t",
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
            "id": "course-nf2gfjbds",
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
            "id": "course-ixhlulswv",
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
            "id": "course-sldhneh94",
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
            "id": "course-5by928n01",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 1,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-wqevxbjb8",
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
            "id": "course-27yfmkiwx",
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
            "id": "course-8sqv60h98",
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
            "id": "course-t012ac4u5",
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
            "id": "course-x6rw9bdlc",
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
            "id": "course-x9wcyponx",
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
            "id": "course-wgh2kl4so",
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
            "id": "course-jhozzjjgy",
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
            "id": "course-wh9ngl2a8",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "07:00",
            "endTime": "08:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-burnie-bansemer",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-77utpowq9",
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
            "id": "course-7jgvsenw8",
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
            "id": "course-1eqrdsda9",
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
            "id": "course-dw6fsqxis",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 3,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-hu-buerkle",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-d8zg9jkxy",
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
            "id": "course-vggtc4jyl",
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
            "id": "course-9m7pfbi8l",
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
            "id": "course-2ck0i8po4",
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
            "id": "course-5rbnqxnax",
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
            "id": "course-yk40pp79x",
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
            "id": "course-77faztmqo",
            "name": "Om Namo Narayanaya",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "18:30",
            "endTime": "20:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-satyam",
            "isAiPlanned": true,
            "status": "approved"
      },
      {
            "id": "course-prrmtzql2",
            "name": "Satsang",
            "style": "Meditation",
            "dayOfWeek": 4,
            "startTime": "20:00",
            "endTime": "21:00",
            "roomId": "room-2",
            "teacherId": "teacher-gen-mouniir-jaber",
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

const CURRENT_DB_VERSION = 7;

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
