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
            "id": "course-99uwhb0j9",
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
            "id": "course-4tmay67zw",
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
            "id": "course-pm5nb5h21",
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
            "id": "course-gbdhyhk2z",
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
            "id": "course-ym59yv5q1",
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
            "id": "course-bc2a8qduq",
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
            "id": "course-lds5glown",
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
            "id": "course-c7lfoxu8g",
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
            "id": "course-edmhyixz7",
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
            "id": "course-nuel2p8dt",
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
            "id": "course-zch621t4n",
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
            "id": "course-2grn7gj0y",
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
            "id": "course-7qf2jll0i",
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
            "id": "course-lcrtvijxk",
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
            "id": "course-fxhog8jp2",
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
            "id": "course-emmwb6317",
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
            "id": "course-pwo71f3me",
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
            "id": "course-p68ickadv",
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
            "id": "course-xzkc45f0m",
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
            "id": "course-pp3sn61qy",
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
            "id": "course-bcamfns3z",
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
            "id": "course-bogqqwe9h",
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
            "id": "course-hi1fnajrn",
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
            "id": "course-xursadid4",
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
            "id": "course-2jxgasfx4",
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
            "id": "course-vd13l105s",
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
            "id": "course-broo1bgnx",
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
            "id": "course-bh9s2ah0g",
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
            "id": "course-rytb8qosy",
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
            "id": "course-s2vihl28b",
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
            "id": "course-8i3pac0ym",
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
            "id": "course-i2enm57mi",
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
            "id": "course-7uogb565a",
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
            "id": "course-8dayxo0ed",
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
            "id": "course-rn4s65caw",
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
            "id": "course-2jq0gigh0",
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
            "id": "course-m1ubftrss",
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
            "id": "course-vkc3i1f2r",
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
            "id": "course-g3s1hnmgu",
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
            "id": "course-r394tj7fq",
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
            "id": "course-d3w8kii6k",
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
            "id": "course-a7nkkswmj",
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
            "id": "course-9n7xt017m",
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
            "id": "course-bw49gmtns",
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
            "id": "course-q37vexweh",
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
            "id": "course-v8dl69xmc",
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
            "id": "course-4eer8vokt",
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
            "id": "course-5iyxf4lrb",
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
            "id": "course-of7eodcqt",
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
            "id": "course-7szg2k8k8",
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
            "id": "course-q6nbx5174",
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
            "id": "course-ycfk0tnlh",
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
            "id": "course-qyhssdeub",
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
            "id": "course-6wntddd40",
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
            "id": "course-o18wl24mx",
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
            "id": "course-btwpq3ya0",
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
            "id": "course-vw3atitzn",
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
            "id": "course-xg1fnf2p3",
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
            "id": "course-ss0tc48xf",
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
            "id": "course-3ojfzfas5",
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
            "id": "course-1vepaypfu",
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
            "id": "course-tllh60135",
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
            "id": "course-7pdgtticw",
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
            "id": "course-a2razccwo",
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
            "id": "course-4gibbmwc3",
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
            "id": "course-ebph5llyq",
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
            "id": "course-t0agt60v6",
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
            "id": "course-xyjk3i124",
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
            "id": "course-1sf97kjwh",
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
            "id": "course-aejsmpqxr",
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
            "id": "course-xtehgbbpp",
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
            "id": "course-5bb3rh09w",
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
            "id": "course-avd5zmy3q",
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
            "id": "course-r27hk51vr",
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
            "id": "course-tyyotjcbq",
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
            "id": "course-qkony2klc",
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
            "id": "course-8dnn7d637",
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
            "id": "course-rlc5uc72f",
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
            "id": "course-vrw6op71n",
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
            "id": "course-twoh7a4k8",
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
            "id": "course-b7mc2uyvd",
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
            "id": "course-w6wpicdvq",
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
            "id": "course-u8wmzdqet",
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
            "id": "course-9z00nhwi6",
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
            "id": "course-4p5d6rl5u",
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
            "id": "course-9gq92ypt6",
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
            "id": "course-kd7h51saw",
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
            "id": "course-tftqzao2e",
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
            "id": "course-gd1buqv4k",
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
            "id": "course-tj9ybbgp9",
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
            "id": "course-o2jaumx1h",
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
            "id": "course-4ttaxunco",
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
            "id": "course-vd1a7lid8",
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
            "id": "course-c90jz78bg",
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
            "id": "course-g7u0ehorp",
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
            "id": "course-fjoqywfuu",
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
            "id": "course-ku1996nkp",
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
            "id": "course-53oqh3ar0",
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
            "id": "course-peiiz4l5l",
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
            "id": "course-4b7qskd9n",
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
            "id": "course-enf3amptb",
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
            "id": "course-ocireo1y4",
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
            "id": "course-ym8mwjuhr",
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
            "id": "course-zflfarzbj",
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
            "id": "course-q5tlfjity",
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
            "id": "course-kz799kmgq",
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
            "id": "course-2sv3hdxcz",
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
            "id": "course-vpe3oop9x",
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
            "id": "course-fk6by3e9q",
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
            "id": "course-vhbio2e3y",
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
            "id": "course-m5h0bn04r",
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
            "id": "course-1fbshennl",
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
            "id": "course-9d56za0rf",
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
            "id": "course-7g4e0o1ao",
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
            "id": "course-0nt9hx0nk",
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
            "id": "course-nig4e846t",
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
            "id": "course-62lxurbox",
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
            "id": "course-0dfgji0yo",
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
            "id": "course-vhlp0f3ab",
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
            "id": "course-kn15z1vt3",
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
            "id": "course-4lqhcgh4g",
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
            "id": "course-il4rj5qws",
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
            "id": "course-zjhr51xg5",
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
            "id": "course-h5og2x1p6",
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
            "id": "course-cfwywlafk",
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
            "id": "course-v3hre7kgr",
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
            "id": "course-o10xgx1ki",
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
            "id": "course-ow8g7gicw",
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
            "id": "course-ehahym0n0",
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
            "id": "course-ano3hc3p3",
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
            "id": "course-kbfghypjr",
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
            "id": "course-z7haxsx79",
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
            "id": "course-scu1pl4bq",
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
            "id": "course-zal27gm57",
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
            "id": "course-08l6zsgfd",
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
            "id": "course-kiqjilhca",
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
            "id": "course-5ubhz3o9z",
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
            "id": "course-mv1xauzjp",
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
            "id": "course-j0jo1393p",
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
            "id": "course-jvfub7592",
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
            "id": "course-ougdso0xj",
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
            "id": "course-n6aqu5cs7",
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
            "id": "course-55hd5v6lt",
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
            "id": "course-697vcceac",
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
            "id": "course-cuqyvn4ji",
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
            "id": "course-traph2urb",
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
            "id": "course-0f8qznqwa",
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
            "id": "course-v9au3gfyw",
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
            "id": "course-m0fxl50dz",
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
            "id": "course-jwjvrlqm1",
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
            "id": "course-8p4j51h1o",
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
            "id": "course-gaenbj5xo",
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
            "id": "course-jomszfoto",
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
            "id": "course-yy9wuv2or",
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
            "id": "course-q3key7pqq",
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
            "id": "course-3dd8oac9o",
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
            "id": "course-xrqxd7mgf",
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
            "id": "course-vgh77vvf9",
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
            "id": "course-ahiw48fdg",
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
            "id": "course-ki19es5e0",
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
            "id": "course-x9v5zxbzz",
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
            "id": "course-k9m7hjafg",
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
            "id": "course-ixqrbheap",
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
            "id": "course-qjx8fle21",
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
            "id": "course-wa7j0bnqd",
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
            "id": "course-nllp353hq",
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
            "id": "course-piflajiot",
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
            "id": "course-uc9lr24ri",
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
            "id": "course-huuhw1hno",
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
            "id": "course-69isyg416",
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
            "id": "course-nwr7sa4pq",
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
            "id": "course-uh5s0vgec",
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
            "id": "course-17kjs88g3",
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
            "id": "course-xalhgxuc5",
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
            "id": "course-zer1yqugv",
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
            "id": "course-hc7r48t1l",
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
            "id": "course-39qpfaztm",
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
            "id": "course-22f3ghkke",
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
            "id": "course-emqunceav",
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
            "id": "course-8rodwjnrh",
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
            "id": "course-genllsien",
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
            "id": "course-ry41z10l9",
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
            "id": "course-radjus89p",
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
            "id": "course-qbebdyiu6",
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
            "id": "course-ioww0jnd4",
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
            "id": "course-ja4zs9iiu",
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
            "id": "course-j2oh8x07q",
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
            "id": "course-pupadn98i",
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
            "id": "course-43bgkp2hr",
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
            "id": "course-x1zpanq9r",
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
            "id": "course-980c1ttmc",
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
            "id": "course-v6oykdiof",
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
            "id": "course-dennawb22",
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
            "id": "course-7gclic50c",
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
            "id": "course-6sfcr7854",
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
            "id": "course-47uk6ishr",
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
            "id": "course-vznccwyc5",
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
            "id": "course-kk3zq4y4y",
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
            "id": "course-1ujfrdmjy",
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
            "id": "course-cdgsphqyf",
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
            "id": "course-43gveycwr",
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
            "id": "course-2rzqfjg6l",
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
            "id": "course-4ebdmn14a",
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
            "id": "course-csdq0pnts",
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
            "id": "course-pgddh2pmx",
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
            "id": "course-s6y3t3jyz",
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
            "id": "course-fpx9fwghf",
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
            "id": "course-won2lays7",
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
            "id": "course-dg7axwngl",
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
            "id": "course-bn6pik3ya",
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
            "id": "course-7kpoh6cv9",
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
            "id": "course-zmg3wrurp",
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
            "id": "course-rx0mh1gp9",
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
            "id": "course-vtu8h5ok6",
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
            "id": "course-bq545f63h",
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
            "id": "course-agpj1jhx0",
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
            "id": "course-nognt2s7k",
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
            "id": "course-5h14rdbjw",
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
            "id": "course-ldj09b0mh",
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
            "id": "course-9rbtccfwc",
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
            "id": "course-vdp5iipd2",
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
            "id": "course-i9k976nvl",
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
            "id": "course-3iud9lybs",
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
            "id": "course-1z45gw1um",
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
            "id": "course-dynwukv5v",
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
            "id": "course-bgr3s33cl",
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
            "id": "course-efespc2ui",
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
            "id": "course-tdfn9hdqe",
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

const CURRENT_DB_VERSION = 8;

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
