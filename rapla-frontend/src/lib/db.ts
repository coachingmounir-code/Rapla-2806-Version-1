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
      maxClassesPerDay: 2,
      maxHoursPerWeek: 10,
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
  const list: Course[] = [];
  let idCounter = 1;

  // Weekdays: 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 0 = Sun
  const weekdays = [1, 2, 3, 4, 5, 6, 0];

  weekdays.forEach(day => {
    // 1. Daily morning Meditation & Satsang (07:00)
    list.push({
      id: `course-def-${idCounter++}`,
      name: 'Gef. Meditation',
      style: 'Meditation',
      dayOfWeek: day,
      startTime: '07:00',
      endTime: '07:30',
      roomId: 'room-5', // Tripura
      teacherId: null,
      isAiPlanned: false,
      status: 'draft'
    });
    list.push({
      id: `course-def-${idCounter++}`,
      name: 'Satsang',
      style: 'Meditation',
      dayOfWeek: day,
      startTime: '07:00',
      endTime: '08:00',
      roomId: 'room-2', // Radhakrisna
      teacherId: null,
      isAiPlanned: false,
      status: 'draft'
    });

    // 2. Daily morning yoga classes (09:15 - 11:00)
    list.push({
      id: `course-def-${idCounter++}`,
      name: 'Mittelstufe',
      style: 'Hatha',
      dayOfWeek: day,
      startTime: '09:15',
      endTime: '11:00',
      roomId: 'room-5', // Tripura
      teacherId: null,
      isAiPlanned: false,
      status: 'draft'
    });
    list.push({
      id: `course-def-${idCounter++}`,
      name: 'Anfänger',
      style: 'Hatha',
      dayOfWeek: day,
      startTime: '09:15',
      endTime: '11:00',
      roomId: 'room-2', // Radhakrisna
      teacherId: null,
      isAiPlanned: false,
      status: 'draft'
    });

    // 3. Afternoon yoga classes
    if (day !== 3) {
      let startTime = '16:15';
      let endTime = '18:00';
      if (day === 5 || day === 0) {
        startTime = '16:30';
        endTime = '18:00';
      }
      list.push({
        id: `course-def-${idCounter++}`,
        name: 'Mittelstufe',
        style: 'Hatha',
        dayOfWeek: day,
        startTime,
        endTime,
        roomId: 'room-5', // Tripura
        teacherId: null,
        isAiPlanned: false,
        status: 'draft'
      });
      list.push({
        id: `course-def-${idCounter++}`,
        name: 'Anfänger',
        style: 'Hatha',
        dayOfWeek: day,
        startTime,
        endTime,
        roomId: 'room-2', // Radhakrisna
        teacherId: null,
        isAiPlanned: false,
        status: 'draft'
      });
    }

    // 4. Daily evening Meditation & Satsang (19:30 / 20:00)
    list.push({
      id: `course-def-${idCounter++}`,
      name: 'Om Namo Narayanaya',
      style: 'Meditation',
      dayOfWeek: day,
      startTime: '19:30',
      endTime: '20:00',
      roomId: 'room-2', // Radhakrisna
      teacherId: null,
      isAiPlanned: false,
      status: 'draft'
    });
    if (day === 5 || day === 0) {
      list.push({
        id: `course-def-${idCounter++}`,
        name: 'Ankommensmed.',
        style: 'Meditation',
        dayOfWeek: day,
        startTime: '20:00',
        endTime: '20:35',
        roomId: 'room-5', // Tripura
        teacherId: null,
        isAiPlanned: false,
        status: 'draft'
      });
    }
    list.push({
      id: `course-def-${idCounter++}`,
      name: 'Satsang',
      style: 'Meditation',
      dayOfWeek: day,
      startTime: '20:00',
      endTime: '21:00',
      roomId: 'room-2', // Radhakrisna
      teacherId: null,
      isAiPlanned: false,
      status: 'draft'
    });
  });

  return list;
};

const DEFAULT_COURSES = generateDefaultCourses();

const DEFAULT_WEEK_PLANS: WeekPlan[] = [
  {
    id: 'plan-template-1',
    name: 'Blankowoche Sommer',
    status: 'blanko',
    courses: DEFAULT_COURSES.map(c => ({ ...c, teacherId: null, isAiPlanned: false, status: 'draft' })),
    createdAt: new Date().toISOString()
  },
  {
    id: 'plan-active-1',
    name: 'Kursplan (Genehmigt & Aktiv)',
    status: 'approved',
    courses: DEFAULT_COURSES.map((c, i) => {
      const tIds = ['teacher-gen-adam-zmuda', 'teacher-gen-amyana-finkel', 'teacher-gen-ananda-schaak', 'teacher-gen-ananta-heussler'];
      return { ...c, teacherId: tIds[i % tIds.length], status: 'approved' };
    }),
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
                "id": "course-pre-s23f7blwy",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-lb6xmc979",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-itlr8nsb7",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-zbe0lwcyv",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-k116cb39y",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-d7izq25h9",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-harishakti",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-s6p4fn3xq",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-a0fwtzgn2",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-5i51rbhba",
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
                "id": "course-pre-7cgu8ule8",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-miqp0v10x",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-h3qhtoixk",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-ul2iv6m7m",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-v1vj4lnkw",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-l3l20spn9",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1hmynjt0g",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-tqri87hxn",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-hstu8yba8",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-2euz42zqb",
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
                "id": "course-pre-bjsi80u9k",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 3,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-8lnibs0ja",
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
                "id": "course-pre-oa9faax42",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-rizo0uofz",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-osme58amj",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-qdrknmbyn",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-xx29nphbq",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-nrdswxyj5",
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
                "id": "course-pre-hv8yhh2fr",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-gt998vzmu",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-86loo21p0",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-w1tib24ak",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mo3ptd900",
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
                "id": "course-pre-ok0tl397i",
                "name": "Mittelstufe",
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
                "id": "course-pre-acrabq0ao",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-e5vgllj9c",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-cph1smseq",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-i7q2u9cic",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-zs3g2pwmv",
                "name": "Ankommensmed.",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "20:00",
                "endTime": "20:35",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-487vkufz6",
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
                "id": "course-pre-gvggnm7ij",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mkxp8z159",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-hoelsacpe",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mtmtpe4rf",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-je4rqwn6g",
                "name": "Mittelstufe",
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
                "id": "course-pre-wg1obrthg",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-szyn45kif",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-qvqiaaut0",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-tzrlgc5jx",
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
                "id": "course-pre-wlxpab6a4",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-eg36oz635",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mrk2e937f",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-gnhc7u8y6",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7ayx63d6x",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-wmzgfzwdm",
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
                "id": "course-pre-jorc2yo5v",
                "name": "Ankommensmed.",
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
                "id": "course-pre-2v25qehon",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          }
    ],
    createdAt: "2026-07-09T11:56:46.780Z"
  },
  {
    id: "plan-pre-2026-W29",
    name: "Vorplanung 2026-W29 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W29",
    courses: [
          {
                "id": "course-pre-bju0e6n6e",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-sx7b2ci2i",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-r8zx0xjbb",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-r7azu732u",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-9w8odsf2r",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-rlqw1gujz",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-harishakti",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-radh0inq3",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-aj9b16k9e",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-bq0a2npnj",
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
                "id": "course-pre-qrasae69n",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-r1wm0rpzn",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-sbrrz025a",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-reelte6vy",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-qrns5h9i6",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-wqptvpff1",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mm8jzitkv",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-n0smuvw08",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-dcvqe31s3",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-ehhcdvanb",
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
                "id": "course-pre-lqoxet7dt",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 3,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1vb8kw0ou",
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
                "id": "course-pre-alakipvoa",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-q60xzehcn",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-k138jbxxo",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1z6lp2lka",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-6hre147o7",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0fncauc2r",
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
                "id": "course-pre-qp4gm5gus",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-udyx60z75",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0p9u0nwa6",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0mdf2lc6b",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-wizgfy625",
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
                "id": "course-pre-u66l59rvd",
                "name": "Mittelstufe",
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
                "id": "course-pre-vc3nd4hu8",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-yqio4908p",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0d3gkrin1",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-xhhz4ttz6",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-wac3fcuti",
                "name": "Ankommensmed.",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "20:00",
                "endTime": "20:35",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-yeogeu2sa",
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
                "id": "course-pre-b0r1f0a71",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-y1l1btm2z",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-96b00ji1f",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7o359ov6s",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-m5b0feskg",
                "name": "Mittelstufe",
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
                "id": "course-pre-qemck8g3m",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-06a90mm8b",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-fzwnktqmu",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-agbepvr9b",
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
                "id": "course-pre-6etb0607s",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-ow5n3squu",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-v6n3g4owb",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-8fq8fqfmp",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-d551cjiiq",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-q6vqt554r",
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
                "id": "course-pre-nnwdi9aij",
                "name": "Ankommensmed.",
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
                "id": "course-pre-fp4prl64a",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          }
    ],
    createdAt: "2026-07-09T11:56:46.809Z"
  },
  {
    id: "plan-pre-2026-W30",
    name: "Vorplanung 2026-W30 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W30",
    courses: [
          {
                "id": "course-pre-y8abic99p",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-gtsp3etzf",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-cpjr6oz99",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-igurdfh2x",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-vg8ath1v2",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-nwoegxb5w",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-harishakti",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-42su2cudz",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-fvad0t2vm",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-v6y6sb9hy",
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
                "id": "course-pre-nnvft7rm8",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-j8dk9izoc",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-78ik0nv80",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-y3a9tcyeo",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-604owopf1",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-z0bd9itl0",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-njo8k5b88",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-93wts29w7",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7a83derp9",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-nfwvxtef5",
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
                "id": "course-pre-6q62qb4m7",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 3,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-h0lt1u4rv",
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
                "id": "course-pre-vqnnspz0y",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-nzo83edbs",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-xhavr4qb0",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-oqszarfsh",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7iz4s87ym",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0f8fdyu49",
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
                "id": "course-pre-2etfj8vsf",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-b37e02z9r",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7inppnrnx",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-kqqrpu66y",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1s02vxh56",
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
                "id": "course-pre-ckxk0o73g",
                "name": "Mittelstufe",
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
                "id": "course-pre-9wu0eqebm",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-z62ou3xcq",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-qrcok74bc",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-3d8d9viam",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1zy0ht4o7",
                "name": "Ankommensmed.",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "20:00",
                "endTime": "20:35",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-3dwl6z4jf",
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
                "id": "course-pre-pkwp8unet",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-yc5qssfd7",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-df8nsgfiu",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-yhjav1o6c",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-4wwq3lag5",
                "name": "Mittelstufe",
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
                "id": "course-pre-mrnnt3xin",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0rcr381gs",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-pew14sdvw",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1qcroz2m6",
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
                "id": "course-pre-f24wf64nw",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mfyl7oy41",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-5quq4vy08",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-qldh89cm8",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-tn4gatfyx",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-6euvawd1t",
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
                "id": "course-pre-ks062blf1",
                "name": "Ankommensmed.",
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
                "id": "course-pre-ic4pz9gi2",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          }
    ],
    createdAt: "2026-07-09T11:56:46.825Z"
  },
  {
    id: "plan-pre-2026-W31",
    name: "Vorplanung 2026-W31 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W31",
    courses: [
          {
                "id": "course-pre-b2zuhxejz",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-kolxw3feb",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-9fsmt97nv",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-tpgzvoxsq",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-anxakcniu",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-pgzmmiq6z",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 1,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-harishakti",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-p5liealga",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-4etdkcegb",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 1,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-wr2tqvqy4",
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
                "id": "course-pre-gix8x28hv",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-ikjp1y6qr",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-lyrskv9p1",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-k87oror3v",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 2,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-luwd50jgd",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-hv35pc1f6",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-z8cr0hf7x",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 2,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-b9hivmfbt",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-bbpxz01ot",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1f414blfy",
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
                "id": "course-pre-zwg9xytue",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 3,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-yfygok384",
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
                "id": "course-pre-h8rvahzv4",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 3,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-nfctzn4c3",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-w7l78y6x2",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-pn8lqfzd3",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-sb4141cy1",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-pranava-pauly",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-tq0vmb2mk",
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
                "id": "course-pre-jpx6monyt",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 4,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-wf3oxk5za",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-adam-zmuda",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-43wxpde4n",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 4,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-hu-buerkle",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-0r3jly7iw",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-xala07fr2",
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
                "id": "course-pre-wpd46r99x",
                "name": "Mittelstufe",
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
                "id": "course-pre-fga1eswmn",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-mouniir-jaber",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-mpol9c8b8",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-b2x27n9fe",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 5,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-bvvbryngc",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7h2yrg30n",
                "name": "Ankommensmed.",
                "style": "Meditation",
                "dayOfWeek": 5,
                "startTime": "20:00",
                "endTime": "20:35",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-m6lmqfyp4",
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
                "id": "course-pre-h5v03y96o",
                "name": "Gef. Meditation",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "07:30",
                "roomId": "room-5",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-6woev8f1i",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-fxc2b0aoy",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-nirmaya-fodor",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-pi5m33gt5",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-burnie-bansemer",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-7pinugov3",
                "name": "Mittelstufe",
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
                "id": "course-pre-ll7chc5uk",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 6,
                "startTime": "16:15",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-satyam",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-oosu6piut",
                "name": "Om Namo Narayanaya",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "19:30",
                "endTime": "20:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-2gwjs8xix",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 6,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-2kkn92itv",
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
                "id": "course-pre-56fq5f4o4",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "07:00",
                "endTime": "08:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-ulrich-nebel",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-l00jezttb",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "09:15",
                "endTime": "11:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-abha-morkoetter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-56etee3e5",
                "name": "Anf\u00e4nger",
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
                "id": "course-pre-uuxfk567y",
                "name": "Mittelstufe",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-5",
                "teacherId": "teacher-gen-anjali-gelzleichter",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-w1egkykfh",
                "name": "Anf\u00e4nger",
                "style": "Hatha",
                "dayOfWeek": 0,
                "startTime": "16:30",
                "endTime": "18:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-karuna-wapke",
                "isAiPlanned": true,
                "status": "approved"
          },
          {
                "id": "course-pre-1f5674cjw",
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
                "id": "course-pre-e9eldacsp",
                "name": "Ankommensmed.",
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
                "id": "course-pre-drxq4wn2t",
                "name": "Satsang",
                "style": "Meditation",
                "dayOfWeek": 0,
                "startTime": "20:00",
                "endTime": "21:00",
                "roomId": "room-2",
                "teacherId": "teacher-gen-alexander-melior",
                "isAiPlanned": true,
                "status": "approved"
          }
    ],
    createdAt: "2026-07-09T11:56:46.844Z"
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

// Database Actions
export const db = {
  getTeachers: (): Teacher[] => {
    const stored = getStored<Teacher[]>('rapla_teachers', DEFAULT_TEACHERS);
    let updated = false;
    const list = [...stored];
    for (const defT of DEFAULT_TEACHERS) {
      if (!list.some(t => t.name === defT.name)) {
        list.push(defT);
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
      } else if (defPlan.id.startsWith('plan-pre-')) {
        // Always force update preplanned weeks from default week plans code to prevent stale or corrupt local storage state
        list[idx] = defPlan;
        updated = true;
      }
    }
    for (const p of list) {
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
    }
    if (updated) {
      db.saveWeekPlans(list);
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
            teacherId: null,
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
