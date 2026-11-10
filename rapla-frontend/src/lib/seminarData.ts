import { type RoomReservation, getLocalDateForDay } from './db';

export interface SeminarSlot {
  id: string;
  seminarId: string;
  dayIndex: number; // 0 = Start-Freitag, 1 = Samstag, 2 = Sonntag, 3 = Montag, 4 = Dienstag, 5 = Mittwoch, 6 = Donnerstag, 7 = End-Freitag
  dayOfWeek: number; // 0 = So, 1 = Mo, 2 = Di, 3 = Mi, 4 = Do, 5 = Fr, 6 = Sa
  dayName: string;  // 'Sonntag', 'Montag', ...
  dateStr: string;  // '2026-11-01', ...
  timeLabel: string; // '08:10 Uhr Vortrag' or 'Nachmittags-Programm'
  startTime: string; // '08:10'
  endTime: string;   // '09:00'
  title: string;
  description?: string;
  isOrange: boolean; // True = feste Seminar-Einheit im Seminarraum (oben benannt)
  roomName?: string; // 'Sitaram Raum' or null
  roomId?: string;   // 'room-4' for Sitaram
  teacher?: string;  // 'Narayani Kedenburg'
  locationHint?: string; // e.g. "Treffpunkt: Eingang"
  category: 'lecture' | 'yoga' | 'meditation' | 'satsang' | 'meal' | 'afternoon' | 'evening' | 'departure';
}

export interface Seminar {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  leader: string;
  roomName: string;
  roomId: string;
  color: string; // Hex color for seminar branding (e.g. orange for Narayani, green for Ayurveda, rose for Faceyoga)
  startDate: string; // '2026-11-01'
  endDate: string;   // '2026-11-06'
  startDayName: string; // 'Sonntag'
  endDayName: string;   // 'Freitag'
  weeks: string[]; // ['2026-W45', '2026-W46']
  type: 'fewo' | 'seminar';
  isBlueprint: boolean;
  isCancelled?: boolean;      // True if seminar is cancelled (Storniert)
  isHiddenFromTeam?: boolean; // True if hidden from Team view (automatically true when cancelled)
  slots: SeminarSlot[];
  peaceChant?: {
    time: string;
    room: string;
    title: string;
  };
  notes?: string[];
}

export function isSeminarVisibleInTeam(seminar: Seminar): boolean {
  return !seminar.isCancelled && !seminar.isHiddenFromTeam;
}

export const DAYS_FEWO = [
  { index: 0, dayIndex: 0, dayOfWeek: 5, label: 'Freitag', short: 'Fr', dateStr: '2026-10-30', weekCode: '2026-W44', isStartFriday: true },
  { index: 1, dayIndex: 1, dayOfWeek: 6, label: 'Samstag', short: 'Sa', dateStr: '2026-10-31', weekCode: '2026-W44' },
  { index: 2, dayIndex: 2, dayOfWeek: 0, label: 'Sonntag', short: 'So', dateStr: '2026-11-01', weekCode: '2026-W45' },
  { index: 3, dayIndex: 3, dayOfWeek: 1, label: 'Montag', short: 'Mo', dateStr: '2026-11-02', weekCode: '2026-W45' },
  { index: 4, dayIndex: 4, dayOfWeek: 2, label: 'Dienstag', short: 'Di', dateStr: '2026-11-03', weekCode: '2026-W45' },
  { index: 5, dayIndex: 5, dayOfWeek: 3, label: 'Mittwoch', short: 'Mi', dateStr: '2026-11-04', weekCode: '2026-W45' },
  { index: 6, dayIndex: 6, dayOfWeek: 4, label: 'Donnerstag', short: 'Do', dateStr: '2026-11-05', weekCode: '2026-W45' },
  { index: 7, dayIndex: 7, dayOfWeek: 5, label: 'Freitag', short: 'Fr', dateStr: '2026-11-06', weekCode: '2026-W46', isEndFriday: true }
];

export function getDaysForSeminarWeek(weekCode: string) {
  return [
    { index: 0, dayIndex: 0, dayOfWeek: 5, label: 'Freitag', short: 'Fr', dateStr: getLocalDateForDay(weekCode, 5, false), weekCode, isStartFriday: true },
    { index: 1, dayIndex: 1, dayOfWeek: 6, label: 'Samstag', short: 'Sa', dateStr: getLocalDateForDay(weekCode, 6), weekCode, isStartFriday: false },
    { index: 2, dayIndex: 2, dayOfWeek: 0, label: 'Sonntag', short: 'So', dateStr: getLocalDateForDay(weekCode, 0), weekCode, isStartFriday: false },
    { index: 3, dayIndex: 3, dayOfWeek: 1, label: 'Montag', short: 'Mo', dateStr: getLocalDateForDay(weekCode, 1), weekCode, isStartFriday: false },
    { index: 4, dayIndex: 4, dayOfWeek: 2, label: 'Dienstag', short: 'Di', dateStr: getLocalDateForDay(weekCode, 2), weekCode, isStartFriday: false },
    { index: 5, dayIndex: 5, dayOfWeek: 3, label: 'Mittwoch', short: 'Mi', dateStr: getLocalDateForDay(weekCode, 3), weekCode, isStartFriday: false },
    { index: 6, dayIndex: 6, dayOfWeek: 4, label: 'Donnerstag', short: 'Do', dateStr: getLocalDateForDay(weekCode, 4), weekCode, isStartFriday: false },
    { index: 7, dayIndex: 7, dayOfWeek: 5, label: 'Freitag', short: 'Fr', dateStr: getLocalDateForDay(weekCode, 5, true), weekCode, isEndFriday: true }
  ];
}

export const TIME_ROWS_FEWO = [
  { id: 't-0700', label: '7:00 Uhr', subLabel: 'Meditation & Satsang', defaultStart: '07:00', defaultEnd: '08:00' },
  { id: 't-0810', label: '8:10 Uhr Vortrag', subLabel: 'Feste Seminar-Einheit', defaultStart: '08:10', defaultEnd: '09:00' },
  { id: 't-0915', label: '9:15 Uhr Yoga', subLabel: 'Offenes Hausprogramm', defaultStart: '09:15', defaultEnd: '10:45' },
  { id: 't-1100', label: '11:00 Uhr', subLabel: 'Vollwert-Brunch & Freizeit', defaultStart: '11:00', defaultEnd: '12:30' },
  { id: 't-afternoon', label: 'Nachmittags-Programm', subLabel: 'Ausflüge / Entspannung', defaultStart: '13:00', defaultEnd: '16:00' },
  { id: 't-1615', label: '16:15 Uhr / 16:30 Uhr', subLabel: 'Yogastunde / Ankommen', defaultStart: '16:15', defaultEnd: '17:45' },
  { id: 't-1800', label: '18:00 Uhr', subLabel: 'Vollwert-Abendessen', defaultStart: '18:00', defaultEnd: '19:30' },
  { id: 't-2000', label: '20:00 Uhr Satsang', subLabel: 'Mantra-Singen & Meditation', defaultStart: '20:00', defaultEnd: '21:00' },
  { id: 't-2115', label: 'Nach Satsang (ca. 21:15)', subLabel: 'Begrüßung / Abendprogramm', defaultStart: '21:15', defaultEnd: '22:00' }
];

// --- 1. BLAUPAUSE: YOGA FERIENWOCHE (NARAYANI KEDENBURG im SITARAM RAUM) ---
export const NARAYANI_FEWO_SLOTS: SeminarSlot[] = [
  // Sonntag
  {
    id: 'fewo-so-ankommen',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 0,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '16:15 Uhr / 16:30 Uhr',
    startTime: '16:30',
    endTime: '18:00',
    title: '16:30 Uhr: Ankommens-Yogastunde',
    description: 'Sanftes Ankommen im Haus Yoga Vidya Nordsee (Mittelstufe / Einsteiger laut Tagesaushang).',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-so-dinner',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 0,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Abendessen und Freizeit',
    description: 'Reichhaltiges biologisch-vegetarisches Vollwert-Buffet im Speisesaal.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-so-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 0,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '20:00',
    endTime: '21:00',
    title: 'Meditieren Mantrasingen Satsang',
    description: 'Mantra-Singen, stille Meditation und traditionelles Arati (siehe Aushang Tagesplan).',
    isOrange: false,
    category: 'satsang'
  },
  {
    id: 'fewo-so-begruessung',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 0,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Begrüßungsrunde / Seminarplan',
    description: 'Offizielle Begrüßung der Seminar-Gruppe durch Narayani, Vorstellung des Wochenplans und Raum für persönliche Fragen.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'evening'
  },

  // Montag
  {
    id: 'fewo-mo-morgen-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Stille Meditation oder geführte Meditation / Satsang',
    description: 'Morgendlicher Satsang mit Meditation und Kirtan (siehe Aushang Tagesplan).',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'fewo-mo-vortrag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Vortrag: Einführung in die Meditation',
    description: 'Theorie und Praxis: Grundlagen einer stabilen Meditationshaltung, Atemführung, Konzentration und Geistestraining.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'lecture'
  },
  {
    id: 'fewo-mo-yoga-vormittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Offenes Hausprogramm: Anfänger- oder Mittelstunden nach individueller Wahl laut Aushang.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-mo-brunch',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Brunch und Freizeit',
    description: 'Vollwert-Buffet und Zeit zur freien Erholung an der Nordseeluft.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-mo-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: 'Nachmittags-Programm',
    startTime: '13:00',
    endTime: '15:00',
    title: '13:00 Uhr: Spaziergang nach Horumersiel',
    description: 'Gemeinsamer Deichspaziergang nach Horumersiel. Treffpunkt: Rezeption / Haupteingang.',
    isOrange: true,
    roomName: 'Treffpunkt Eingang',
    locationHint: 'Treffpunkt: Rezeption / Eingang',
    teacher: 'Narayani Kedenburg',
    category: 'afternoon'
  },
  {
    id: 'fewo-mo-yoga-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '16:15 Uhr / 16:30 Uhr',
    startTime: '16:15',
    endTime: '17:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Nachmittags-Yogastunde (siehe Hausaushang).',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-mo-dinner',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Abendessen und Freizeit',
    description: 'Vollwert-Abendessen.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-mo-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '20:00',
    endTime: '21:00',
    title: 'Meditieren Mantrasingen Satsang',
    description: 'Abendlicher Satsang (siehe Aushang Tagesplan).',
    isOrange: false,
    category: 'satsang'
  },
  {
    id: 'fewo-mo-abendprogramm',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Abendprogramm (siehe Aushang Tagesplan)',
    description: 'Gemeinsames Abendprogramm und Vertiefung im Seminarraum Sitaram.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'evening'
  },

  // Dienstag
  {
    id: 'fewo-di-morgen-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Stille Meditation oder geführte Meditation / Satsang',
    description: 'Morgendlicher Satsang laut Tagesplan.',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'fewo-di-vortrag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Vortrag: Die 6 Yoga Wege',
    description: 'Ein fundierter Einblick in die sechs klassischen Wege des Yoga: Raja, Jnana, Bhakti, Karma, Kundalini und Hatha Yoga.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'lecture'
  },
  {
    id: 'fewo-di-yoga-vormittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Offene Yogastunde laut Hausplan.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-di-brunch',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Brunch und Freizeit',
    description: 'Vollwert-Brunch.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-di-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: 'Nachmittags-Programm',
    startTime: '15:00',
    endTime: '16:00',
    title: '15:00 – 16:00 Uhr: Entspannung und Meditation mit Bodyscan',
    description: 'Geführte Tiefenentspannung und intensive Achtsamkeitspraxis durch systematische Körperreise im Sitaram Raum.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'afternoon'
  },
  {
    id: 'fewo-di-yoga-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '16:15 Uhr / 16:30 Uhr',
    startTime: '16:15',
    endTime: '17:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Nachmittags-Yogastunde laut Tagesplan.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-di-dinner',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Abendessen und Freizeit',
    description: 'Vollwert-Abendessen.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-di-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '19:30',
    endTime: '20:30',
    title: '19:30 – 20:30 Uhr: Meditativer Spaziergang',
    description: 'Gemeinsames Gehen in der Stille an der frischen Nordseeluft.',
    isOrange: false,
    category: 'satsang'
  },
  {
    id: 'fewo-di-abendprogramm',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Freier Abend',
    description: 'Freie Gestaltung, Entspannung oder Sauna.',
    isOrange: false,
    category: 'evening'
  },

  // Mittwoch
  {
    id: 'fewo-mi-morgen-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Stille Meditation oder geführte Meditation / Satsang',
    description: 'Morgenpraxis im Schweigen.',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'fewo-mi-vortrag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Vortrag: Yoga Vidya Grundreihe',
    description: 'Aufbau, energetische und anatomische Wirkungen der 12 klassischen Yoga Vidya Asanas.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'lecture'
  },
  {
    id: 'fewo-mi-yoga-vormittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Vertiefende Vormittags-Yogastunde.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-mi-brunch',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Brunch und Freizeit (Schweigen bis 12 Uhr)',
    description: 'Achtsamer Brunch in der Stille.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-mi-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: 'Nachmittags-Programm',
    startTime: '13:00',
    endTime: '18:00',
    title: 'Mittwochvormittag bis 12 Uhr Schweigen · Freier Nachmittag',
    description: 'Freier Nachmittag für Erholung, Wattwanderung oder Ausflüge in die Region.',
    isOrange: false,
    category: 'afternoon'
  },
  {
    id: 'fewo-mi-dinner',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Abendessen und Freizeit',
    description: 'Vollwert-Abendessen.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-mi-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '20:00',
    endTime: '21:00',
    title: 'Meditieren Mantrasingen Satsang',
    description: 'Gemeinsamer Abend-Satsang (siehe Aushang).',
    isOrange: false,
    category: 'satsang'
  },
  {
    id: 'fewo-mi-abendprogramm',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Abendprogramm (siehe Aushang Tagesplan)',
    description: 'Seminar-Abendprogramm mit Narayani im Sitaram Raum.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'evening'
  },

  // Donnerstag
  {
    id: 'fewo-do-morgen-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Stille Meditation oder geführte Meditation / Satsang',
    description: 'Morgen-Satsang laut Tagesplan.',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'fewo-do-vortrag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Vortrag: Vertiefung Meditation und 6 Yogawege',
    description: 'Vertiefende Betrachtung der Yoga-Philosophie und deren lebendige Übertragung in den modernen Alltag.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'lecture'
  },
  {
    id: 'fewo-do-yoga-vormittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Vormittags-Yogastunde.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-do-brunch',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Brunch und Freizeit',
    description: 'Vollwert-Brunch.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-do-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: 'Nachmittags-Programm',
    startTime: '13:30',
    endTime: '15:30',
    title: 'Nach Absprache: Spaziergang Wangermeer oder Strand',
    description: 'Gemeinsamer Spaziergang ans Wangermeer oder an den Nordseestrand (Absprache am Vormittag).',
    isOrange: true,
    roomName: 'Treffpunkt Eingang',
    locationHint: 'Nach Absprache: Wangermeer oder Strand',
    teacher: 'Narayani Kedenburg',
    category: 'afternoon'
  },
  {
    id: 'fewo-do-yoga-nachmittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '16:15 Uhr / 16:30 Uhr',
    startTime: '16:15',
    endTime: '17:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Nachmittags-Yogastunde laut Tagesplan.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-do-dinner',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Abendessen und Freizeit',
    description: 'Vollwert-Abendessen.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-do-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '20:00',
    endTime: '21:00',
    title: 'Meditieren Mantrasingen Satsang',
    description: 'Abendlicher Satsang (siehe Aushang Tagesplan).',
    isOrange: false,
    category: 'satsang'
  },
  {
    id: 'fewo-do-abendprogramm',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Abendprogramm (siehe Aushang Tagesplan)',
    description: 'Seminar-Abendprogramm und Abschlussvorbereitung im Sitaram Raum.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'evening'
  },

  // Freitag
  {
    id: 'fewo-fr-morgen-satsang',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Stille Meditation oder geführte Meditation / Satsang',
    description: 'Abschluss-Morgenmeditation.',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'fewo-fr-vortrag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Abschlussrunde / Tipps für die weitere Praxis',
    description: 'Gemeinsame Abschluss- und Feedbackrunde mit Narayani, Beantwortung von Fragen und wertvolle Impulse für die tägliche Praxis zu Hause.',
    isOrange: true,
    roomName: 'Sitaram Raum',
    roomId: 'room-4',
    teacher: 'Narayani Kedenburg',
    category: 'lecture'
  },
  {
    id: 'fewo-fr-yoga-vormittag',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: 'Yogastunde (siehe Aushang Tagesplan)',
    description: 'Abschließende Yogastunde laut Hausaushang.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'fewo-fr-brunch',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:00',
    title: 'Brunch',
    description: 'Gemeinsamer Abschluss-Brunch.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'fewo-fr-abreise',
    seminarId: 'seminar-fewo-narayani-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: 'Nachmittags-Programm',
    startTime: '12:00',
    endTime: '12:30',
    title: 'Bei Abreise bitte Zimmer bis 12:30 Uhr räumen',
    description: 'Das Yoga Vidya Team wünscht dir eine gute und gesegnete Heimfahrt!',
    isOrange: false,
    category: 'departure'
  }
];

export const NARAYANI_FEWO_SEMINAR: Seminar = {
  id: 'seminar-fewo-narayani-2026-11-01',
  title: 'Yoga Ferienwoche',
  shortTitle: 'FEWO Narayani',
  subtitle: 'So. 01.11. bis Fr. 06.11.2026',
  leader: 'Narayani Kedenburg',
  roomName: 'Sitaram Raum',
  roomId: 'room-4',
  color: '#ea580c', // Warm Amber / Orange
  startDate: '2026-11-01',
  endDate: '2026-11-06',
  startDayName: 'Sonntag',
  endDayName: 'Freitag',
  weeks: ['2026-W45', '2026-W46'],
  type: 'fewo',
  isBlueprint: true,
  slots: NARAYANI_FEWO_SLOTS,
  peaceChant: {
    time: '19:30 - 20:00 Uhr',
    room: 'Radha Krishna Raum',
    title: 'Om Namonarayanaya Singen (Singen für den Weltfrieden)'
  },
  notes: [
    'Die orangenen Slots finden exklusiv im Sitaram Raum statt und sind fest als Raumbelegung hinterlegt.',
    'Die weiß hinterlegten Slots sind freie Programmpunkte und beziehen sich auf das offene Hausprogramm laut Wochenplan.',
    'Kurzfristige Änderungen vorbehalten.'
  ]
};

// --- 2. PARALLEL-SEMINAR: AYURVEDA WOHLFÜHL-RETREAT (DR. PHIL. MARLENE VOGEL im HANUMAN RAUM) ---
export const MARLENE_AYURVEDA_SLOTS: SeminarSlot[] = [
  {
    id: 'ayur-so-begruessung',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 0,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Begrüßung & Einführung in die Doshas',
    description: 'Kennenlernrunde und Überblick über das Ayurveda-Wohlfühl-Retreat im Hanuman Raum.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'evening'
  },
  {
    id: 'ayur-mo-vortrag',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Ayurveda-Vortrag: Die drei Bioenergien (Vata, Pitta, Kapha)',
    description: 'Einführung in die Grundlagen der ayurvedischen Typenlehre und individuelle Balance.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'lecture'
  },
  {
    id: 'ayur-mo-nachmittag',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: 'Nachmittags-Programm',
    startTime: '14:30',
    endTime: '16:00',
    title: 'Workshop: Ayurvedische Selbstmassage & Morgenroutine (Dinacharya)',
    description: 'Praktisches Erlernen von Selbstmassage-Techniken und wohltuenden Ritualen.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'afternoon'
  },
  {
    id: 'ayur-di-vortrag',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Ayurveda-Vortrag: Agni – Das Verdauungsfeuer stärken',
    description: 'Ernährungslehre im Ayurveda: Richtige Kombinationen und Gewürze für vitale Energie.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'lecture'
  },
  {
    id: 'ayur-di-nachmittag',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: 'Nachmittags-Programm',
    startTime: '14:30',
    endTime: '16:00',
    title: 'Praxis-Workshop: Ayurvedische Hausmittel & Kräuterkunde',
    description: 'Zubereitung von stärkenden Tees, Gewürzmischungen und kleinen Hausmitteln.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'afternoon'
  },
  {
    id: 'ayur-mi-vortrag',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Ayurveda-Vortrag: Geistige Balance & die Gunas im Ayurveda',
    description: 'Sattva, Rajas und Tamas verstehen und seelische Ausgeglichenheit fördern.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'lecture'
  },
  {
    id: 'ayur-do-vortrag',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Ayurveda-Vortrag: Rasayana – Regeneration & Verjüngung',
    description: 'Wie man Langlebigkeit, Immunkraft (Ojas) und Lebensfreude im Alltag bewahrt.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'lecture'
  },
  {
    id: 'ayur-do-abend',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Abend-Ritual: Ojas-Aufbau & Klangentspannung',
    description: 'Sanfter abendlicher Ausklang im Hanuman Raum.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'evening'
  },
  {
    id: 'ayur-fr-abschluss',
    seminarId: 'seminar-ayurveda-marlene-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Abschlussrunde: Mein individueller Ayurveda-Plan für zu Hause',
    description: 'Zusammenfassung, persönliche Reflexion und Übergabe der Empfehlungen.',
    isOrange: true,
    roomName: 'Hanuman Raum',
    roomId: 'room-3',
    teacher: 'Dr. phil. Marlene Vogel',
    category: 'lecture'
  }
];

export const MARLENE_AYURVEDA_SEMINAR: Seminar = {
  id: 'seminar-ayurveda-marlene-2026-11-01',
  title: 'Ayurveda Wohlfühl-Retreat',
  shortTitle: 'Ayurveda Retreat',
  subtitle: 'So. 01.11. bis Fr. 06.11.2026',
  leader: 'Dr. phil. Marlene Vogel',
  roomName: 'Hanuman Raum',
  roomId: 'room-3',
  color: '#16a34a', // Soft Forest Green
  startDate: '2026-11-01',
  endDate: '2026-11-06',
  startDayName: 'Sonntag',
  endDayName: 'Freitag',
  weeks: ['2026-W45', '2026-W46'],
  type: 'seminar',
  isBlueprint: false,
  slots: MARLENE_AYURVEDA_SLOTS,
  notes: [
    'Die Praxiseinheiten und Vorträge finden exklusiv im Hanuman Raum statt.',
    'Teilnehmer nehmen an den gemeinsamen Mahlzeiten und Morgen-/Abendsatsangs teil.'
  ]
};

// --- 3. PARALLEL-SEMINAR: GANZHEITLICHE FACEYOGA AUSBILDUNG (CHARRY DEVI RUIZ im DEVI RAUM) ---
export const CHARRY_FACEYOGA_SLOTS: SeminarSlot[] = [
  {
    id: 'face-so-begruessung',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 0,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Begrüßungsrunde & Lehrgangsübersicht',
    description: 'Einführung in die Ausbildungsstruktur und Vorstellung im Devi Raum.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'evening'
  },
  {
    id: 'face-mo-vortrag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Theorie: Anatomie der mimischen Gesichtsmuskulatur',
    description: 'Muskelketten, Verspannungsmuster und biomechanische Grundlagen des Faceyoga.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'lecture'
  },
  {
    id: 'face-mo-nachmittag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 1,
    dayOfWeek: 1,
    dayName: 'Montag',
    dateStr: '2026-11-02',
    timeLabel: 'Nachmittags-Programm',
    startTime: '14:00',
    endTime: '16:00',
    title: 'Praxis-Modul 1: Stirn-, Schläfen- und Augenpartie',
    description: 'Gezielte Übungen zur Entspannung von Zornesfalten und Straffung der Augenregion.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'afternoon'
  },
  {
    id: 'face-di-vortrag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Theorie: Lymphdrainage & Faszienstimulation im Gesicht',
    description: 'Aktivierung des Lymphflusses zur Reduktion von Schwellungen und Förderung des Teints.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'lecture'
  },
  {
    id: 'face-di-nachmittag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 2,
    dayOfWeek: 2,
    dayName: 'Dienstag',
    dateStr: '2026-11-03',
    timeLabel: 'Nachmittags-Programm',
    startTime: '14:00',
    endTime: '16:00',
    title: 'Praxis-Modul 2: Wangen-, Mund- und Kieferentspannung',
    description: 'Lösen von Bruxismus (Zähneknirschen) und Stärkung der Wangenmuskulatur.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'afternoon'
  },
  {
    id: 'face-mi-vortrag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 3,
    dayOfWeek: 3,
    dayName: 'Mittwoch',
    dateStr: '2026-11-04',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Theorie: Hals, Dekolleté und ganzheitliche Körperhaltung',
    description: 'Zusammenhang zwischen Nacken-Ausrichtung, Schulterspannung und Gesichtsausdruck.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'lecture'
  },
  {
    id: 'face-do-vortrag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Didaktik: Stundenaufbau & Unterrichten von Faceyoga',
    description: 'Methodik für Einzelcoachings und Gruppenkurse im Devi Raum.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'lecture'
  },
  {
    id: 'face-do-nachmittag',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 4,
    dayOfWeek: 4,
    dayName: 'Donnerstag',
    dateStr: '2026-11-05',
    timeLabel: 'Nachmittags-Programm',
    startTime: '14:00',
    endTime: '16:00',
    title: 'Lehrproben & Feedbackrunde (Modul 3)',
    description: 'Praktische Unterrichtsübungen der Teilnehmerinnen unter Anleitung.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'afternoon'
  },
  {
    id: 'face-fr-abschluss',
    seminarId: 'seminar-faceyoga-charry-2026-11-01',
    dayIndex: 5,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-11-06',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Zertifikatsübergabe & feierlicher Ausbildungsabschluss',
    description: 'Abschlussrunde und Aushändigung der Zertifikate im Devi Raum.',
    isOrange: true,
    roomName: 'Devi Raum',
    roomId: 'room-1',
    teacher: 'Charry Devi Ruiz',
    category: 'lecture'
  }
];

export const CHARRY_FACEYOGA_SEMINAR: Seminar = {
  id: 'seminar-faceyoga-charry-2026-11-01',
  title: 'Ganzheitliche Faceyoga Ausbildung',
  shortTitle: 'Faceyoga Ausbildung',
  subtitle: 'So. 01.11. bis Fr. 06.11.2026',
  leader: 'Charry Devi Ruiz',
  roomName: 'Devi Raum',
  roomId: 'room-1',
  color: '#e11d48', // Elegant Rose / Crimson
  startDate: '2026-11-01',
  endDate: '2026-11-06',
  startDayName: 'Sonntag',
  endDayName: 'Freitag',
  weeks: ['2026-W45', '2026-W46'],
  type: 'seminar',
  isBlueprint: false,
  slots: CHARRY_FACEYOGA_SLOTS,
  notes: [
    'Alle Ausbildungsmodule finden im Devi Raum statt.',
    'Gemeinsame Teilnahme am allgemeinen Hausprogramm.'
  ]
};

// --- 4. WOCHENEND-SEMINAR: YOGA UND MEDITATION EINFÜHRUNG (GOPALA im TRIPURA RAUM) ---
export const WEEKEND_YOGA_INTRO_SLOTS: SeminarSlot[] = [
  // Freitag 30.10.
  {
    id: 'we-fr-ankommen',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 0,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-10-30',
    timeLabel: '16:15 Uhr / 16:30 Uhr',
    startTime: '16:30',
    endTime: '18:00',
    title: '16:30 Uhr: Ankommens-Yogastunde (WE-Seminar)',
    description: 'Sanftes Ankommen im Haus Yoga Vidya Nordsee (Mittelstufe / Anfänger).',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'we-fr-dinner',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 0,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-10-30',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Abendessen & Zimmerbezug',
    description: 'Biologisch-vegetarisches Vollwert-Buffet im Speisesaal.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'we-fr-satsang',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 0,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-10-30',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '20:00',
    endTime: '21:00',
    title: 'Gemeinsamer Abend-Satsang im Sivananda Saal',
    description: 'Meditation, Kirtan-Singen, Friedensgebete und Arati.',
    isOrange: false,
    category: 'satsang'
  },
  {
    id: 'we-fr-begruessung',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 0,
    dayOfWeek: 5,
    dayName: 'Freitag',
    dateStr: '2026-10-30',
    timeLabel: 'Nach Satsang (ca. 21:15)',
    startTime: '21:15',
    endTime: '22:00',
    title: 'Eröffnungsrunde & Seminar-Einführung',
    description: 'Kennenlernen und Vorstellung des Wochenend-Retreats im Tripura Raum.',
    isOrange: true,
    roomName: 'Tripura Raum',
    roomId: 'room-5',
    teacher: 'Gopala Kirill Serov',
    category: 'evening'
  },

  // Samstag 31.10.
  {
    id: 'we-sa-morgensatsang',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Morgenmeditation, Mantra-Singen & Satsang',
    description: 'Stille Meditation und gemeinsames Kirtan-Singen im Sivananda Saal.',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'we-sa-vortrag',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Vortrag: Die 4 Yoga-Wege & Philosophie',
    description: 'Jnana, Raja, Bhakti und Karma Yoga im täglichen Leben.',
    isOrange: true,
    roomName: 'Tripura Raum',
    roomId: 'room-5',
    teacher: 'Gopala Kirill Serov',
    category: 'lecture'
  },
  {
    id: 'we-sa-yoga',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: '9:15 Uhr Yogastunde: Sanfte Praxis für Körper & Geist',
    description: 'Asana-Praxis für Einsteiger und Entspannungssuchende.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'we-sa-brunch',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Vollwert-Brunch & Entspannungspause',
    description: 'Pause für Strandspaziergang oder Entspannung.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'we-sa-workshop',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: 'Nachmittags-Programm',
    startTime: '14:30',
    endTime: '16:00',
    title: 'Workshop: Yoga-Atem (Pranayama) & Tiefenentspannung',
    description: 'Praktisches Erlernen von Wechselatmung, Kapalabhati und Yoga Nidra.',
    isOrange: true,
    roomName: 'Tripura Raum',
    roomId: 'room-5',
    teacher: 'Gopala Kirill Serov',
    category: 'afternoon'
  },
  {
    id: 'we-sa-yoga-nachmittag',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '16:15 Uhr / 16:30 Uhr',
    startTime: '16:15',
    endTime: '17:45',
    title: '16:15 Uhr: Yogastunde am Nachmittag',
    description: 'Vertiefung der Asana-Praxis im offenen Hausprogramm.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'we-sa-dinner',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '18:00 Uhr',
    startTime: '18:00',
    endTime: '19:30',
    title: 'Vollwert-Abendessen',
    description: 'Speisesaal-Buffet.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'we-sa-satsang',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 1,
    dayOfWeek: 6,
    dayName: 'Samstag',
    dateStr: '2026-10-31',
    timeLabel: '20:00 Uhr Satsang',
    startTime: '20:00',
    endTime: '22:00',
    title: 'Großer Fest-Satsang am Samstagabend',
    description: 'Meditation, Kirtan-Konzert und Segenswünsche.',
    isOrange: false,
    category: 'satsang'
  },

  // Sonntag 01.11. (Abschluss WE-Seminar)
  {
    id: 'we-so-morgensatsang',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 2,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '7:00 Uhr',
    startTime: '07:00',
    endTime: '08:00',
    title: 'Morgenmeditation & Satsang',
    description: 'Gemeinsamer Start in den Sonntag.',
    isOrange: false,
    category: 'meditation'
  },
  {
    id: 'we-so-vortrag',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 2,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '8:10 Uhr Vortrag',
    startTime: '08:10',
    endTime: '09:00',
    title: 'Vortrag: Yoga im Alltag integrieren & Meditation',
    description: 'Tipps für eine nachhaltige eigene Praxis nach der Abreise.',
    isOrange: true,
    roomName: 'Tripura Raum',
    roomId: 'room-5',
    teacher: 'Gopala Kirill Serov',
    category: 'lecture'
  },
  {
    id: 'we-so-yoga',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 2,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '9:15 Uhr Yoga',
    startTime: '09:15',
    endTime: '10:45',
    title: 'Abschluss-Yogastunde (WE-Seminar)',
    description: 'Inspirierende Abschluss-Yogastunde vor der Heimreise.',
    isOrange: false,
    category: 'yoga'
  },
  {
    id: 'we-so-brunch',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 2,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: '11:00 Uhr',
    startTime: '11:00',
    endTime: '12:30',
    title: 'Vollwert-Brunch & Verabschiedung',
    description: 'Brunchbuffet vor der Abreise.',
    isOrange: false,
    category: 'meal'
  },
  {
    id: 'we-so-abschluss',
    seminarId: 'seminar-we-yoga-intro-2026-10-30',
    dayIndex: 2,
    dayOfWeek: 0,
    dayName: 'Sonntag',
    dateStr: '2026-11-01',
    timeLabel: 'Nachmittags-Programm',
    startTime: '12:30',
    endTime: '13:30',
    title: 'Abschlusskreis & Seminarabschluss (Abreise WE-Seminar)',
    description: 'Gemeinsames Singen und Segen für den Heimweg im Tripura Raum.',
    isOrange: true,
    roomName: 'Tripura Raum',
    roomId: 'room-5',
    teacher: 'Gopala Kirill Serov',
    category: 'departure'
  }
];

export const WEEKEND_YOGA_INTRO_SEMINAR: Seminar = {
  id: 'seminar-we-yoga-intro-2026-10-30',
  title: 'Yoga und Meditation Einführung (Wochenend-Seminar)',
  shortTitle: 'Yoga & Meditation Einführung (WE)',
  subtitle: 'Fr. 30.10. bis So. 01.11.2026',
  leader: 'Gopala Kirill Serov',
  roomName: 'Tripura Raum',
  roomId: 'room-5',
  color: '#8b5cf6', // Violet
  startDate: '2026-10-30',
  endDate: '2026-11-01',
  startDayName: 'Freitag',
  endDayName: 'Sonntag',
  weeks: ['2026-W44', '2026-W45'],
  type: 'seminar',
  isBlueprint: false,
  slots: WEEKEND_YOGA_INTRO_SLOTS,
  notes: [
    'Die Praxiseinheiten und Vorträge finden exklusiv im Tripura Raum statt.',
    'Abreise erfolgt Sonntag nach dem Brunch / Abschlusskreis (ca. 13:30 Uhr).'
  ]
};

// --- CORE ASHRAM SEMINAR ROOMS (matching RoomOccupancyView) ---
export const SEMINAR_ROOMS = [
  { id: 'room-2', name: 'Radakrishna-Raum', shortName: 'Radakrishna', icon: '🟠' },
  { id: 'room-4', name: 'Sitaram-Raum', shortName: 'Sitaram', icon: '🔵' },
  { id: 'room-3', name: 'Hanuman-Raum', shortName: 'Hanuman', icon: '🟢' },
  { id: 'room-5', name: 'Tripura-Raum', shortName: 'Tripura', icon: '🟣' },
  { id: 'room-1', name: 'Devi-Raum', shortName: 'Devi', icon: '🔴' }
] as const;

export function getSeminarRoomDisplayName(roomId?: string | null, fallbackName?: string): string {
  if (roomId) {
    const found = SEMINAR_ROOMS.find(r => r.id === roomId);
    if (found) return found.name;
  }
  if (!fallbackName) return '';
  const norm = fallbackName.toLowerCase().replace(/[^a-z]/g, '');
  if (norm === 'radhakrishnaraum' || norm === 'radakrishnaraum' || norm === 'radhakrishna' || norm === 'radakrishna') return 'Radakrishna-Raum';
  if (norm === 'sitaramraum' || norm === 'sitaram') return 'Sitaram-Raum';
  if (norm === 'hanumanraum' || norm === 'hanuman') return 'Hanuman-Raum';
  if (norm === 'tripuraraum' || norm === 'tripura') return 'Tripura-Raum';
  if (norm === 'deviraum' || norm === 'devi') return 'Devi-Raum';
  return fallbackName;
}

export function getSeminarRoomShortName(roomId?: string | null, fallbackName?: string): string {
  if (roomId) {
    const found = SEMINAR_ROOMS.find(r => r.id === roomId);
    if (found) return found.shortName;
  }
  if (!fallbackName) return '';
  return fallbackName.replace(/-?Raum$/i, '').replace(/\s+Raum$/i, '').trim();
}

export function getLeaderShortName(leader?: string | null): string {
  if (!leader || !leader.trim()) return 'Offen';
  const cleaned = leader
    .trim()
    .replace(/^(?:Prof\.|Dr\.|phil\.|med\.|rer\.|nat\.|Dipl\.-[A-Za-z]+\.?)\s*/gi, '')
    .replace(/^(?:Prof\.|Dr\.|phil\.|med\.|rer\.|nat\.)\s*/gi, '')
    .trim();
  const parts = (cleaned || leader.trim()).split(/\s+/);
  if (parts[0]?.toLowerCase() === 'swami' && parts[1]) {
    return `Swami ${parts[1]}`;
  }
  return parts[0] || leader.trim();
}

export function isIndoorSeminarRoomSlot(slot: SeminarSlot): boolean {
  if (!slot.isOrange) return false;
  if (slot.roomId && SEMINAR_ROOMS.some(r => r.id === slot.roomId)) return true;
  const titleLower = (slot.title || '').toLowerCase();
  const roomLower = (slot.roomName || '').toLowerCase();
  if (!slot.roomId && (titleLower.includes('spaziergang') || roomLower.includes('treffpunkt'))) {
    return false;
  }
  return true;
}

export function replaceRoomMentionInText(text: string | undefined, newRoomName: string): string | undefined {
  if (!text || !newRoomName) return text;
  return text
    .replace(/\bSeminarraum\s+(?:Radha[\s-]?Krishna|Radhakrishna|Radakrishna|Sita[\s-]?Ram|Sitaram|Hanuman|Tripura|Devi)\b/gi, newRoomName)
    .replace(/\b(?:Radha[\s-]?Krishna|Radhakrishna|Radakrishna|Sita[\s-]?Ram|Sitaram|Hanuman|Tripura|Devi)[\s-]Raum\b/gi, newRoomName);
}

// Normalize legacy 6-day dayIndex (0=So..5=Fr) to 8-day Friday-to-Friday dayIndex (2=So..7=End-Fr)
function normalizeWeeklySlotsDayIndex(slots: SeminarSlot[]): SeminarSlot[] {
  const mapByDow: Record<number, number> = { 0: 2, 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 1 };
  return slots.map(sl => ({
    ...sl,
    dayIndex: mapByDow[sl.dayOfWeek] ?? sl.dayIndex
  }));
}

NARAYANI_FEWO_SEMINAR.slots = normalizeWeeklySlotsDayIndex(NARAYANI_FEWO_SLOTS);
MARLENE_AYURVEDA_SEMINAR.slots = normalizeWeeklySlotsDayIndex(MARLENE_AYURVEDA_SLOTS);
CHARRY_FACEYOGA_SEMINAR.slots = normalizeWeeklySlotsDayIndex(CHARRY_FACEYOGA_SLOTS);

export function getIsoWeekCodeFromDateStr(dateStr: string): string {
  const parts = (dateStr || '').split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return '2026-W45';
  const utc = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function enumerateDatesInclusive(startDateStr: string, endDateStr: string): string[] {
  const result: string[] = [];
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  if (!sy || !ey) return result;
  const cur = new Date(sy, sm - 1, sd, 12, 0, 0);
  const end = new Date(ey, em - 1, ed, 12, 0, 0);
  while (cur.getTime() <= end.getTime() && result.length < 40) {
    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    result.push(`${yyyy}-${mm}-${dd}`);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

const GERMAN_DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const SEMINAR_ACCENT_PALETTE = ['#8b5cf6', '#16a34a', '#0284c7', '#e11d48', '#d97706', '#0d9488'];

function formatGermanShortRange(startDateStr: string, endDateStr: string): string {
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);
  const sDate = new Date(sy, sm - 1, sd, 12, 0, 0);
  const eDate = new Date(ey, em - 1, ed, 12, 0, 0);
  const sDow = GERMAN_DAY_NAMES[sDate.getDay()]?.slice(0, 2) || '';
  const eDow = GERMAN_DAY_NAMES[eDate.getDay()]?.slice(0, 2) || '';
  return `${sDow}. ${String(sd).padStart(2, '0')}.${String(sm).padStart(2, '0')}. bis ${eDow}. ${String(ed).padStart(2, '0')}.${String(em).padStart(2, '0')}.${ey}`;
}

interface NordseeSeminarSeed {
  id: string;
  title: string;
  shortTitle?: string;
  startDate: string;
  endDate: string;
  isWE: boolean;
  leader: string;
  colorIndex?: number;
}

function buildNordseeBlueprintSeminar(seed: NordseeSeminarSeed): Seminar {
  const isFewo = /ferienwoche|yogaferien/i.test(seed.title);
  const leaderClean = (seed.leader || '').trim() || 'Offen';
  const color = isFewo
    ? '#ea580c'
    : SEMINAR_ACCENT_PALETTE[(seed.colorIndex ?? 0) % SEMINAR_ACCENT_PALETTE.length];

  const dates = enumerateDatesInclusive(seed.startDate, seed.endDate);
  const weekSet = new Set<string>();
  const slots: SeminarSlot[] = [];

  dates.forEach((dateStr, idx) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d, 12, 0, 0);
    const dow = dt.getDay();
    const dayName = GERMAN_DAY_NAMES[dow] || 'Tag';
    weekSet.add(getIsoWeekCodeFromDateStr(dateStr));
    // Friday dates also belong to the next ISO week's Friday-to-Friday view
    if (dow === 5) {
      const nextMon = new Date(y, m - 1, d + 3, 12, 0, 0);
      const nextMonStr = `${nextMon.getFullYear()}-${String(nextMon.getMonth() + 1).padStart(2, '0')}-${String(nextMon.getDate()).padStart(2, '0')}`;
      weekSet.add(getIsoWeekCodeFromDateStr(nextMonStr));
    }

    const isFirstDay = idx === 0;
    const isLastDay = idx === dates.length - 1;
    const dayIndex = seed.isWE
      ? (dow === 5 ? 0 : dow === 6 ? 1 : 2)
      : (dow === 0 ? 2 : dow === 1 ? 3 : dow === 2 ? 4 : dow === 3 ? 5 : dow === 4 ? 6 : 7);

    if (isFirstDay) {
      slots.push({
        id: `${seed.id}-${dateStr}-welcome`,
        seminarId: seed.id,
        dayIndex,
        dayOfWeek: dow,
        dayName,
        dateStr,
        timeLabel: 'Nach Satsang (ca. 21:15)',
        startTime: '21:15',
        endTime: '22:00',
        title: seed.isWE ? 'Eröffnungsrunde & Seminar-Einführung' : 'Begrüßungsrunde / Seminarplan',
        description: `Begrüßung und Vorstellung des Seminarablaufs (${seed.title}).`,
        isOrange: true,
        roomName: 'Laut Tagesaushang',
        teacher: leaderClean,
        category: 'evening'
      });
    } else if (isLastDay) {
      slots.push({
        id: `${seed.id}-${dateStr}-closing`,
        seminarId: seed.id,
        dayIndex,
        dayOfWeek: dow,
        dayName,
        dateStr,
        timeLabel: '8:10 Uhr Vortrag',
        startTime: '08:10',
        endTime: '09:00',
        title: 'Abschlussrunde & Praxis-Impulse für zu Hause',
        description: `Gemeinsamer Abschluss und Ausblick (${seed.title}).`,
        isOrange: true,
        roomName: 'Laut Tagesaushang',
        teacher: leaderClean,
        category: 'lecture'
      });
      if (seed.isWE) {
        slots.push({
          id: `${seed.id}-${dateStr}-we-departure`,
          seminarId: seed.id,
          dayIndex,
          dayOfWeek: dow,
          dayName,
          dateStr,
          timeLabel: 'Nachmittags-Programm',
          startTime: '12:30',
          endTime: '13:30',
          title: 'Abschlusskreis & Seminarabschluss (Abreise WE-Seminar)',
          description: `Verabschiedung der Wochenend-Seminargruppe (${seed.title}).`,
          isOrange: true,
          roomName: 'Laut Tagesaushang',
          teacher: leaderClean,
          category: 'departure'
        });
      }
    } else {
      slots.push({
        id: `${seed.id}-${dateStr}-morning`,
        seminarId: seed.id,
        dayIndex,
        dayOfWeek: dow,
        dayName,
        dateStr,
        timeLabel: '8:10 Uhr Vortrag',
        startTime: '08:10',
        endTime: '09:00',
        title: isFewo ? 'Vortrag & Praxisimpulse (Ferienwoche)' : 'Morgen-Vortrag / Seminar-Einheit',
        description: `Morgendliche Theorie- und Praxiseinheit (${seed.title}).`,
        isOrange: true,
        roomName: 'Laut Tagesaushang',
        teacher: leaderClean,
        category: 'lecture'
      });
      slots.push({
        id: `${seed.id}-${dateStr}-afternoon`,
        seminarId: seed.id,
        dayIndex,
        dayOfWeek: dow,
        dayName,
        dateStr,
        timeLabel: 'Nachmittags-Programm',
        startTime: isFewo ? '13:30' : '14:15',
        endTime: isFewo ? '15:30' : '15:45',
        title: isFewo ? 'Nachmittags-Programm / Ausflug' : 'Workshop & Vertiefung',
        description: `Nachmittagseinheit im Rahmen von „${seed.title}“.`,
        isOrange: true,
        roomName: isFewo ? 'Treffpunkt Eingang' : 'Laut Tagesaushang',
        teacher: leaderClean,
        category: 'afternoon'
      });
      if (!seed.isWE && (dow === 2 || dow === 4)) {
        slots.push({
          id: `${seed.id}-${dateStr}-evening`,
          seminarId: seed.id,
          dayIndex,
          dayOfWeek: dow,
          dayName,
          dateStr,
          timeLabel: 'Nach Satsang (ca. 21:15)',
          startTime: '21:15',
          endTime: '22:00',
          title: 'Seminar-Abendprogramm',
          description: `Abendvertiefung / Austausch (${seed.title}).`,
          isOrange: true,
          roomName: 'Laut Tagesaushang',
          teacher: leaderClean,
          category: 'evening'
        });
      }
    }
  });

  const [sy, sm, sd] = seed.startDate.split('-').map(Number);
  const [ey, em, ed] = seed.endDate.split('-').map(Number);
  const startDowName = GERMAN_DAY_NAMES[new Date(sy, sm - 1, sd, 12, 0, 0).getDay()] || 'Sonntag';
  const endDowName = GERMAN_DAY_NAMES[new Date(ey, em - 1, ed, 12, 0, 0).getDay()] || 'Freitag';

  const defaultShort = seed.shortTitle
    || (isFewo
      ? (seed.title === 'Yoga Ferienwoche' ? `FEWO ${getLeaderShortName(leaderClean)}` : seed.title)
      : (seed.title.length > 30 ? `${seed.title.slice(0, 28).trim()}…` : seed.title));

  return {
    id: seed.id,
    title: seed.title,
    shortTitle: defaultShort,
    subtitle: formatGermanShortRange(seed.startDate, seed.endDate),
    leader: leaderClean,
    roomName: 'Laut Tagesaushang',
    roomId: '',
    color,
    startDate: seed.startDate,
    endDate: seed.endDate,
    startDayName: startDowName,
    endDayName: endDowName,
    weeks: Array.from(weekSet),
    type: isFewo ? 'fewo' : 'seminar',
    isBlueprint: true,
    slots,
    notes: [
      'Seminareinheiten laut Tagesaushang im Haus Yoga Vidya Nordsee.',
      'Gemeinsame Teilnahme am offenen Hausprogramm (Morgen-/Abend-Satsang, Yogastunden, Vollwert-Buffet).'
    ]
  };
}

// Real Nordsee seminars from KommendeSeminare (09.08.2026 – 30.10.2026) without unverified room locks
const NORDSEE_CALENDAR_SEMINAR_SEEDS: NordseeSeminarSeed[] = [
  // 09.08. – 16.08.2026
  { id: 'sem-2026-08-09-fewo-beate', title: 'Yoga Ferienwoche', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, leader: 'Beate Menkarski' },
  { id: 'sem-2026-08-09-inselyoga', title: 'Insel-Yoga', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, leader: 'Ananda Schaak', colorIndex: 1 },
  { id: 'sem-2026-08-09-kinder', title: 'Yoga für Kinder 7-12 Jahre', shortTitle: 'Kinderyoga (7–12 J.)', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, leader: 'Suniti Jacob', colorIndex: 2 },
  { id: 'sem-2026-08-09-ruecken', title: 'Yoga für den Rücken', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, leader: 'Kamala Lubina', colorIndex: 3 },
  { id: 'sem-2026-08-09-yinyoga', title: 'Yin Yoga', startDate: '2026-08-09', endDate: '2026-08-14', isWE: false, leader: 'Cornelia Surya Haag', colorIndex: 4 },
  { id: 'sem-2026-08-14-we-trommeln', title: 'Die Satsang-Trommeln der Kirtan-Musik', shortTitle: 'Satsang-Trommeln (WE)', startDate: '2026-08-14', endDate: '2026-08-16', isWE: true, leader: 'Bernardo Juni', colorIndex: 0 },
  { id: 'sem-2026-08-14-we-vinyasa', title: 'Vinyasa Power Yoga - Meditation in Bewegung', shortTitle: 'Vinyasa Power Yoga (WE)', startDate: '2026-08-14', endDate: '2026-08-16', isWE: true, leader: 'Kamala Lubina', colorIndex: 3 },
  { id: 'sem-2026-08-14-we-augen', title: 'Weg mit der Brille - Yoga für die Augen', shortTitle: 'Augen-Yoga (WE)', startDate: '2026-08-14', endDate: '2026-08-16', isWE: true, leader: 'Susan Holze', colorIndex: 5 },

  // 16.08. – 23.08.2026
  { id: 'sem-2026-08-16-fewo-ananda', title: 'Yoga Ferienwoche', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, leader: 'Ananda Schaak' },
  { id: 'sem-2026-08-16-shakti', title: 'Shakti Yoga - Erwecke die Kraft deiner Weiblichkeit', shortTitle: 'Shakti Yoga', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, leader: 'Susan Holze', colorIndex: 3 },
  { id: 'sem-2026-08-16-swings', title: 'Swings, Vibrations, Rotations', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, leader: 'Monika Adele Camara', colorIndex: 1 },
  { id: 'sem-2026-08-16-surfen', title: 'Yogaferien mit Surfen', startDate: '2026-08-16', endDate: '2026-08-21', isWE: false, leader: 'Abha Morkötter', colorIndex: 2 },
  { id: 'sem-2026-08-21-we-intro', title: 'Yoga und Meditation Einführung', shortTitle: 'Yoga & Meditation (WE)', startDate: '2026-08-21', endDate: '2026-08-23', isWE: true, leader: 'Jnanadev David Ianni', colorIndex: 0 },
  { id: 'sem-2026-08-21-we-hula', title: 'Hawaiianischer Tanz und Yoga am Meer', shortTitle: 'Hawaiianischer Tanz (WE)', startDate: '2026-08-21', endDate: '2026-08-23', isWE: true, leader: 'Monika Adele Camara', colorIndex: 4 },
  { id: 'sem-2026-08-21-we-atemwege', title: 'Yogatherapie für die Atemwege an der Nordsee', shortTitle: 'Yogatherapie Atemwege (WE)', startDate: '2026-08-21', endDate: '2026-08-23', isWE: true, leader: 'Susan Holze', colorIndex: 5 },

  // 23.08. – 30.08.2026
  { id: 'sem-2026-08-23-fewo-jnanadev', title: 'Yoga Ferienwoche', startDate: '2026-08-23', endDate: '2026-08-28', isWE: false, leader: 'Jnanadev David Ianni' },
  { id: 'sem-2026-08-23-geburt', title: 'Yoga rund um die Geburt - Yogalehrer Weiterbildung', shortTitle: 'Yoga rund um die Geburt', startDate: '2026-08-23', endDate: '2026-08-30', isWE: false, leader: 'Susan Holze', colorIndex: 3 },
  { id: 'sem-2026-08-23-kundalini', title: 'Schamanisches Kundalini Retreat', shortTitle: 'Kundalini Retreat', startDate: '2026-08-23', endDate: '2026-08-28', isWE: false, leader: 'Satyadevi Bretz, Yogita Sari', colorIndex: 0 },
  { id: 'sem-2026-08-23-wandern', title: 'Yoga, Wandern und Fahrradfahren', shortTitle: 'Yoga, Wandern & Rad', startDate: '2026-08-23', endDate: '2026-08-28', isWE: false, leader: 'Ananda Schaak', colorIndex: 1 },
  { id: 'sem-2026-08-28-we-intro', title: 'Yoga und Meditation Einführung', shortTitle: 'Yoga & Meditation (WE)', startDate: '2026-08-28', endDate: '2026-08-30', isWE: true, leader: 'Offen', colorIndex: 0 },
  { id: 'sem-2026-08-28-we-qigong', title: 'Meditation und Qi Gong', shortTitle: 'Meditation & Qi Gong (WE)', startDate: '2026-08-28', endDate: '2026-08-30', isWE: true, leader: 'Michael Büchel', colorIndex: 2 },

  // 30.08. – 06.09.2026
  { id: 'sem-2026-08-30-fewo-yin', title: 'Yoga Ferienwoche - Yin Yoga', shortTitle: 'FEWO Yin Yoga', startDate: '2026-08-30', endDate: '2026-09-04', isWE: false, leader: 'Beate Menkarski' },
  { id: 'sem-2026-08-30-rituale', title: 'Themenwoche: Indische Rituale und Rezitationen mit Swami Nivedanananda', shortTitle: 'Indische Rituale & Rezitation', startDate: '2026-08-30', endDate: '2026-09-04', isWE: false, leader: 'Swami Nivedanananda', colorIndex: 4 },
  { id: 'sem-2026-09-04-we-intro', title: 'Yoga und Meditation Einführung', shortTitle: 'Yoga & Meditation (WE)', startDate: '2026-09-04', endDate: '2026-09-06', isWE: true, leader: 'Offen', colorIndex: 0 },
  { id: 'sem-2026-09-04-we-bauchraum', title: 'Erleben mit dem Bauchraum', shortTitle: 'Erleben mit dem Bauchraum (WE)', startDate: '2026-09-04', endDate: '2026-09-06', isWE: true, leader: 'Erkan Batmaz', colorIndex: 1 },

  // 06.09. – 13.09.2026
  { id: 'sem-2026-09-06-fewo-erkan', title: 'Yoga Ferienwoche', startDate: '2026-09-06', endDate: '2026-09-11', isWE: false, leader: 'Erkan Batmaz' },
  { id: 'sem-2026-09-06-inselyoga', title: 'Insel-Yoga', startDate: '2026-09-06', endDate: '2026-09-11', isWE: false, leader: 'Pranava Heinz Pauly', colorIndex: 2 },
  { id: 'sem-2026-09-11-we-harmonium', title: 'Harmonium Lernseminar', shortTitle: 'Harmonium Seminar (WE)', startDate: '2026-09-11', endDate: '2026-09-13', isWE: true, leader: 'Jürgen Wade', colorIndex: 4 },

  // 13.09. – 20.09.2026
  { id: 'sem-2026-09-13-fewo-madhavi', title: 'Yoga Ferienwoche', shortTitle: 'FEWO Madhavi & Gopala', startDate: '2026-09-13', endDate: '2026-09-18', isWE: false, leader: 'Madhavi Füllen, Gopala Kirill Serov' },
  { id: 'sem-2026-09-13-wandern', title: 'Yoga, Wandern und Fahrradfahren', shortTitle: 'Yoga, Wandern & Rad', startDate: '2026-09-13', endDate: '2026-09-18', isWE: false, leader: 'Pranava Heinz Pauly', colorIndex: 1 },
  { id: 'sem-2026-09-18-we-intro', title: 'Yoga und Meditation Einführung', shortTitle: 'Yoga & Meditation (WE)', startDate: '2026-09-18', endDate: '2026-09-20', isWE: true, leader: 'Gopala Kirill Serov', colorIndex: 0 },
  { id: 'sem-2026-09-18-we-schamanismus', title: 'Schamanismus als Medizin', shortTitle: 'Schamanismus als Medizin (WE)', startDate: '2026-09-18', endDate: '2026-09-20', isWE: true, leader: 'Maharani Fritsch de Navarrete', colorIndex: 3 },

  // 20.09. – 27.09.2026
  { id: 'sem-2026-09-20-fewo-chandradevi', title: 'Yoga Ferienwoche', startDate: '2026-09-20', endDate: '2026-09-25', isWE: false, leader: 'Chandradevi Winterhalter' },
  { id: 'sem-2026-09-25-we-acro', title: 'Acro Yoga', shortTitle: 'Acro Yoga (WE)', startDate: '2026-09-25', endDate: '2026-09-27', isWE: true, leader: 'Jnanadev Wallaschkowski', colorIndex: 2 },
  { id: 'sem-2026-09-25-we-mudita', title: 'Freude im Herzen - Mantra Singen und Yoga', shortTitle: 'Mantra Singen & Yoga (WE)', startDate: '2026-09-25', endDate: '2026-09-27', isWE: true, leader: 'Gruppe Mudita', colorIndex: 4 },
  { id: 'sem-2026-09-25-we-yla-pruefung', title: 'YLA Prüfungswochenende', shortTitle: 'YLA Prüfungswochenende', startDate: '2026-09-25', endDate: '2026-09-27', isWE: true, leader: 'Karuna M. Wapke', colorIndex: 0 },

  // 27.09. – 04.10.2026
  { id: 'sem-2026-09-27-fewo-gita', title: 'Yoga Ferienwoche', startDate: '2026-09-27', endDate: '2026-10-02', isWE: false, leader: 'Gita Irene Hofmann' },
  { id: 'sem-2026-09-27-fasten', title: 'Ayurvedisches Fasten für Pitta und Vata', shortTitle: 'Ayurvedisches Fasten', startDate: '2026-09-27', endDate: '2026-10-02', isWE: false, leader: 'Satyananda Wahl, Aziza Lena Alemi', colorIndex: 1 },
  { id: 'sem-2026-10-02-we-schulter', title: 'Ayur-Yoga-Therapie für Schultern und Nacken', shortTitle: 'Ayur-Yoga Schulter/Nacken (WE)', startDate: '2026-10-02', endDate: '2026-10-04', isWE: true, leader: 'Gita Irene Hofmann', colorIndex: 5 },
  { id: 'sem-2026-10-02-we-intro', title: 'Yoga und Meditation Einführung', shortTitle: 'Yoga & Meditation (WE)', startDate: '2026-10-02', endDate: '2026-10-04', isWE: true, leader: 'Parashakti Küttner', colorIndex: 0 },
  { id: 'sem-2026-10-02-we-schweigend', title: 'Meditation Intensiv Schweigend', shortTitle: 'Meditation Schweigend (WE)', startDate: '2026-10-02', endDate: '2026-10-04', isWE: true, leader: 'Karuna M. Wapke', colorIndex: 2 },

  // 04.10. – 11.10.2026
  { id: 'sem-2026-10-04-aufrichtung', title: 'Aufrichtung in der Asana erleben und verstehen', shortTitle: 'Aufrichtung in der Asana', startDate: '2026-10-04', endDate: '2026-10-09', isWE: false, leader: 'Gita Irene Hofmann', colorIndex: 2 },
  { id: 'sem-2026-10-04-wellness', title: 'Wellnesswoche: Ayurveda, Massagen, Yoga & Medi(t)', shortTitle: 'Ayurveda Wellnesswoche', startDate: '2026-10-04', endDate: '2026-10-09', isWE: false, leader: 'Madhavi Veronika Broszinski, Venulo Bernd Broszinski', colorIndex: 1 },
  { id: 'sem-2026-10-04-yin-ausbildung', title: 'Yin Yoga Übungsleiter Ausbildung', shortTitle: 'Yin Yoga Ausbildung', startDate: '2026-10-04', endDate: '2026-10-16', isWE: false, leader: 'Offen', colorIndex: 3 },
  { id: 'sem-2026-10-09-we-rajayoga', title: 'Raja Yoga 2', shortTitle: 'Raja Yoga 2 (WE)', startDate: '2026-10-09', endDate: '2026-10-11', isWE: true, leader: 'Karuna M. Wapke, Sukadev Bretz', colorIndex: 0 },

  // 11.10. – 18.10.2026
  { id: 'sem-2026-10-11-fewo-shankara', title: 'Yoga Ferienwoche', startDate: '2026-10-11', endDate: '2026-10-16', isWE: false, leader: 'Shankara Stefan Maune' },
  { id: 'sem-2026-10-11-frauentempel', title: 'Stärke deine Weiblichkeit im Frauentempel', shortTitle: 'Frauentempel', startDate: '2026-10-11', endDate: '2026-10-16', isWE: false, leader: 'Rajeshwari Gemnich', colorIndex: 3 },
  { id: 'sem-2026-10-16-we-intro', title: 'Yoga und Meditation Einführung', shortTitle: 'Yoga & Meditation (WE)', startDate: '2026-10-16', endDate: '2026-10-18', isWE: true, leader: 'Pranava Heinz Pauly', colorIndex: 0 },
  { id: 'sem-2026-10-16-we-jnana', title: 'Jnana Yoga, Vedanta, Meditation und Schweigen', shortTitle: 'Jnana Yoga & Vedanta (WE)', startDate: '2026-10-16', endDate: '2026-10-18', isWE: true, leader: 'Karuna M. Wapke', colorIndex: 2 },
  { id: 'sem-2026-10-16-we-ukulele', title: 'Mantra-Begleitung mit Ukulele | Aufbauseminar', shortTitle: 'Mantra & Ukulele (WE)', startDate: '2026-10-16', endDate: '2026-10-18', isWE: true, leader: 'Shankari Susanne Hill', colorIndex: 4 },

  // 18.10. – 25.10.2026
  { id: 'sem-2026-10-18-fewo-erkan', title: 'Yoga Ferienwoche', startDate: '2026-10-18', endDate: '2026-10-23', isWE: false, leader: 'Erkan Batmaz' },
  { id: 'sem-2026-10-18-klang', title: 'Nordsee Special: Yoga und Klangthemenwoche', shortTitle: 'Yoga & Klangthemenwoche', startDate: '2026-10-18', endDate: '2026-10-23', isWE: false, leader: 'Wolfgang Meisel, Jutta Kremer', colorIndex: 5 },
  { id: 'sem-2026-10-18-timeout', title: 'Time out statt Burn out', startDate: '2026-10-18', endDate: '2026-10-23', isWE: false, leader: 'Nicole Padmini Neumann', colorIndex: 1 },

  // 25.10. – 30.10.2026 (endet am Start-Freitag 30.10. von KW 45)
  { id: 'sem-2026-10-25-fewo-praevention', title: 'Hatha Yoga Prävention Ferienwoche', shortTitle: 'Hatha Prävention FEWO', startDate: '2026-10-25', endDate: '2026-10-30', isWE: false, leader: 'Pranava Heinz Pauly' },
  { id: 'sem-2026-10-25-yin-vipassana', title: 'Yin Yoga meets Vipassana', startDate: '2026-10-25', endDate: '2026-10-30', isWE: false, leader: 'Christian Bliedtner', colorIndex: 2 }
];

export const HISTORICAL_NORDSEE_SEMINARS: Seminar[] = NORDSEE_CALENDAR_SEMINAR_SEEDS.map(buildNordseeBlueprintSeminar);

// --- DEFAULT LIST OF ALL SEMINARS ---
export const DEFAULT_SEMINARS: Seminar[] = [
  ...HISTORICAL_NORDSEE_SEMINARS,
  WEEKEND_YOGA_INTRO_SEMINAR,
  NARAYANI_FEWO_SEMINAR,
  MARLENE_AYURVEDA_SEMINAR,
  CHARRY_FACEYOGA_SEMINAR
];

// Helper to get all seminars
export function getRegisteredSeminars(): Seminar[] {
  if (typeof window === 'undefined') return DEFAULT_SEMINARS;
  try {
    const raw = localStorage.getItem('rapla_seminars');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SEMINARS));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingIds = new Set(parsed.map((s: Seminar) => s.id));
      const merged = [...parsed];
      for (const defSem of DEFAULT_SEMINARS) {
        if (!existingIds.has(defSem.id)) {
          merged.push(JSON.parse(JSON.stringify(defSem)));
        }
      }
      return merged;
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_SEMINARS));
}

export function getSeminarFridayRange(weekCode: string): { startFr: string; endFr: string } {
  return {
    startFr: getLocalDateForDay(weekCode, 5, false),
    endFr: getLocalDateForDay(weekCode, 5, true)
  };
}

export function getSeminarTransitionType(
  seminar: Seminar,
  weekCode: string
): 'departing-start-fr' | 'arriving-end-fr' | null {
  const { startFr, endFr } = getSeminarFridayRange(weekCode);
  if (seminar.endDate === startFr && seminar.startDate < startFr) {
    return 'departing-start-fr';
  }
  if (seminar.startDate === endFr && seminar.endDate > endFr) {
    return 'arriving-end-fr';
  }
  return null;
}

// Helper to get active seminars overlapping the Friday-to-Friday cycle of a given week code (e.g. '2026-W45')
export function getSeminarsForWeek(
  weekCode: string,
  seminarsInput?: Seminar[],
  options?: { includeHidden?: boolean }
): Seminar[] {
  const all = seminarsInput || getRegisteredSeminars();
  const includeHidden = options?.includeHidden ?? false;
  const { startFr, endFr } = getSeminarFridayRange(weekCode);

  const matching = all.filter(s => {
    if (!includeHidden && !isSeminarVisibleInTeam(s)) return false;
    if (s.startDate && s.endDate) {
      if (s.startDate <= endFr && s.endDate >= startFr) return true;
    }
    return Array.isArray(s.slots) && s.slots.some(sl => sl.dateStr && sl.dateStr >= startFr && sl.dateStr <= endFr);
  });

  return matching.sort((a, b) => {
    const visA = isSeminarVisibleInTeam(a) ? 0 : 1;
    const visB = isSeminarVisibleInTeam(b) ? 0 : 1;
    if (visA !== visB) return visA - visB;
    const transA = getSeminarTransitionType(a, weekCode);
    const transB = getSeminarTransitionType(b, weekCode);
    const rankA = transA === null ? 0 : transA === 'departing-start-fr' ? 1 : 2;
    const rankB = transB === null ? 0 : transB === 'departing-start-fr' ? 1 : 2;
    if (rankA !== rankB) return rankA - rankB;
    if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
    if (a.type !== b.type) return a.type === 'fewo' ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

// Standard open Ashram Hausprogramm synthesizer for active seminar days that only store fixed seminar units
export function getEffectiveSeminarSlotsForDay(
  seminar: Seminar,
  day: { dateStr: string; dayIndex: number; dayOfWeek: number; label: string }
): SeminarSlot[] {
  const explicitDaySlots = seminar.slots.filter(sl =>
    sl.dateStr ? sl.dateStr === day.dateStr : sl.dayIndex === day.dayIndex
  );

  // Outside seminar date range, only return any explicitly dated slots
  if (!day.dateStr || day.dateStr < seminar.startDate || day.dateStr > seminar.endDate) {
    return explicitDaySlots;
  }

  // If this seminar already defines open Hausprogramm slots on this date, return as-is
  if (explicitDaySlots.some(sl => !sl.isOrange)) {
    return explicitDaySlots;
  }

  const isArrivalDay = day.dateStr === seminar.startDate;
  const isDepartureDay = day.dateStr === seminar.endDate;
  const isSundayDeparture = isDepartureDay && day.dayOfWeek === 0;
  const generatedHouse: SeminarSlot[] = [];

  const pushHouseSlot = (
    suffix: string,
    startTime: string,
    endTime: string,
    timeLabel: string,
    title: string,
    description: string,
    category: SeminarSlot['category']
  ) => {
    generatedHouse.push({
      id: `house-${seminar.id}-${day.dateStr}-${suffix}`,
      seminarId: seminar.id,
      dayIndex: day.dayIndex,
      dayOfWeek: day.dayOfWeek,
      dayName: day.label,
      dateStr: day.dateStr,
      timeLabel,
      startTime,
      endTime,
      title,
      description,
      isOrange: false,
      category
    });
  };

  if (!isArrivalDay) {
    pushHouseSlot(
      '0700',
      '07:00',
      '08:00',
      '7:00 Uhr',
      'Stille Meditation oder geführte Meditation / Satsang',
      'Morgendlicher Satsang mit Meditation und Kirtan laut Tagesplan.',
      'meditation'
    );
    pushHouseSlot(
      '0915',
      '09:15',
      '10:45',
      '9:15 Uhr Yoga',
      'Yogastunde (siehe Aushang Tagesplan)',
      'Offene Vormittags-Yogastunde im Hausprogramm.',
      'yoga'
    );
    pushHouseSlot(
      '1100',
      '11:00',
      isDepartureDay && !isSundayDeparture ? '12:00' : '12:30',
      '11:00 Uhr',
      isDepartureDay ? 'Vollwert-Brunch & Verabschiedung' : 'Brunch und Freizeit',
      'Reichhaltiges biologisch-vegetarisches Vollwert-Buffet im Speisesaal.',
      'meal'
    );
    if (isDepartureDay && !isSundayDeparture) {
      pushHouseSlot(
        '1200-abreise',
        '12:00',
        '12:30',
        'Nachmittags-Programm',
        'Bei Abreise bitte Zimmer bis 12:30 Uhr räumen',
        'Das Yoga Vidya Team wünscht eine gute und gesegnete Heimfahrt.',
        'departure'
      );
    }
  }

  if (!isDepartureDay) {
    pushHouseSlot(
      '1615',
      isArrivalDay ? '16:30' : '16:15',
      isArrivalDay ? '18:00' : '17:45',
      '16:15 Uhr / 16:30 Uhr',
      isArrivalDay ? 'Ankommens-Yogastunde' : 'Yogastunde (siehe Aushang Tagesplan)',
      isArrivalDay
        ? 'Sanftes Ankommen im Haus Yoga Vidya Nordsee (laut Tagesaushang).'
        : 'Offene Nachmittags-Yogastunde laut Tagesplan.',
      'yoga'
    );
    pushHouseSlot(
      '1800',
      '18:00',
      '19:30',
      '18:00 Uhr',
      'Abendessen und Freizeit',
      'Reichhaltiges biologisch-vegetarisches Vollwert-Buffet im Speisesaal.',
      'meal'
    );
    pushHouseSlot(
      '2000',
      '20:00',
      day.dayOfWeek === 6 ? '21:30' : '21:00',
      '20:00 Uhr Satsang',
      day.dayOfWeek === 6 ? 'Großer Fest-Satsang am Samstagabend' : 'Meditieren Mantrasingen Satsang',
      'Gemeinsamer Abend-Satsang mit Meditation, Mantra-Singen und Arati.',
      'satsang'
    );
  }

  return [...explicitDaySlots, ...generatedHouse].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// Generates the standard room reservations for ashram wide room occupancy
export function getSeminarRoomReservations(seminar: Seminar): RoomReservation[] {
  if (!isSeminarVisibleInTeam(seminar)) return [];
  const reservations: RoomReservation[] = [];

  for (const slot of seminar.slots) {
    // Only orange slots located in a specific ashram room reserve room occupancy
    if (!slot.isOrange || !slot.roomId) continue;

    const weekCode = slot.dateStr
      ? getIsoWeekCodeFromDateStr(slot.dateStr)
      : (slot.dayOfWeek === 5 ? '2026-W46' : '2026-W45');
    const displayRoom = getSeminarRoomDisplayName(slot.roomId, slot.roomName || seminar.roomName);

    reservations.push({
      id: `res-seminar-${seminar.id}-${slot.id}`,
      roomId: slot.roomId,
      weekCode: weekCode,
      dayOfWeek: slot.dayOfWeek,
      date: slot.dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: `${slot.title} (${seminar.shortTitle})`,
      reservedBy: slot.teacher || seminar.leader,
      notes: `Seminar-Raumbelegung (${displayRoom}): ${slot.description || slot.title}`,
      createdAt: new Date().toISOString()
    });
  }

  return reservations;
}

// Combined room reservations for seminars (defaults to DEFAULT_SEMINARS)
export function getAllSeminarRoomReservations(seminars: Seminar[] = DEFAULT_SEMINARS): RoomReservation[] {
  const allRes: RoomReservation[] = [];
  for (const sem of seminars) {
    allRes.push(...getSeminarRoomReservations(sem));
  }
  return allRes;
}

export function parseSeminarReservationId(
  resId: string,
  seminars: Seminar[]
): { seminar: Seminar; slot: SeminarSlot } | null {
  if (!resId || !resId.startsWith('res-seminar-')) return null;
  for (const sem of seminars) {
    const prefix = `res-seminar-${sem.id}-`;
    if (resId.startsWith(prefix)) {
      const slotId = resId.slice(prefix.length);
      const slot = sem.slots.find(s => s.id === slotId);
      if (slot) return { seminar: sem, slot };
    }
  }
  return null;
}

export const DEFAULT_SEMINAR_RESERVATIONS: RoomReservation[] = getAllSeminarRoomReservations();

export interface SeminarTeacherWeekSlot {
  id: string;
  name: string;
  style: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  dayIndex?: number; // 0 = Start-Freitag .. 7 = End-Freitag
  isEndFriday?: boolean;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  roomId: string;
  roomName: string;
  teacherId: string;
  teacherName: string;
  isAiPlanned: boolean;
  status: 'approved';
  isSeminarSlot: true;
  seminarId: string;
  seminarTitle: string;
  seminarShortTitle: string;
  seminarColor: string;
  seminarType: 'fewo' | 'seminar';
  slotId: string;
  slotTitle: string;
  slotDescription?: string;
  locationHint?: string;
  category: SeminarSlot['category'];
  dateStr: string;
  dayName: string;
}

function tokenizePersonName(raw: string): string[] {
  if (!raw) return [];
  return raw
    .toLowerCase()
    .replace(/^(?:prof\.|dr\.|phil\.|med\.|rer\.|nat\.|dipl\.-[a-z]+\.?)\s*/gi, '')
    .replace(/\b(?:prof|dr|phil|med|rer|nat|dipl)\b\.?/gi, '')
    .replace(/[#?!()]/g, ' ')
    .split(/[\s\-]+/)
    .map(t => t.replace(/^\.+|\.+$/g, '').trim())
    .filter(t => t.length >= 2 && t !== 'offen' && t !== 'unbesetzt' && t !== 'de' && t !== 'van' && t !== 'und');
}

export function doesSeminarPersonMatchTeacher(
  slotPersonRaw: string | undefined | null,
  teacherName: string | undefined | null,
  teacherId?: string | null
): boolean {
  if (!slotPersonRaw || !teacherName) return false;
  const targetTokens = tokenizePersonName(teacherName);
  if (targetTokens.length === 0) return false;

  const subPersons = slotPersonRaw
    .split(/[,+/&]+|\bund\b/i)
    .map(s => s.trim())
    .filter(Boolean);

  for (const sub of subPersons) {
    const personTokens = tokenizePersonName(sub);
    if (personTokens.length === 0) continue;
    const allTargetInPerson = targetTokens.every(tt => personTokens.includes(tt));
    const allPersonInTarget = personTokens.every(pt => targetTokens.includes(pt));
    if (allTargetInPerson || allPersonInTarget) return true;
  }

  if (teacherId && (teacherId === 'teacher-karma-gopala' || teacherId.includes('gopala'))) {
    if (slotPersonRaw.toLowerCase().includes('gopala')) return true;
  }
  return false;
}

export function cleanSeminarSlotTitle(rawTitle: string): string {
  return (rawTitle || '')
    .replace(/^\d{1,2}:\d{2}(?:\s*[–\-]\s*\d{1,2}:\d{2})?\s*Uhr\s*:?\s*/i, '')
    .replace(/^\d{1,2}:\d{2}\s*Uhr\s+/i, '')
    .trim();
}

/**
 * Resolves all internal seminar slots (isOrange === true) assigned to a specific teacher
 * within a target 8-day Wochenplan week (Friday-to-Friday cycle).
 */
export function getSeminarSlotsForTeacherAndWeek(
  teacherName: string,
  targetWeekCode: string,
  teacherId?: string,
  seminarsInput?: Seminar[]
): SeminarTeacherWeekSlot[] {
  if (!teacherName || !targetWeekCode) return [];

  const activeSeminars = getSeminarsForWeek(targetWeekCode, seminarsInput, { includeHidden: false });
  if (activeSeminars.length === 0) return [];

  const result: SeminarTeacherWeekSlot[] = [];
  // 8-day Rapla week cycle: Start-Friday (dayIndex 0) through End-Friday (dayIndex 7)
  const weekDays = getDaysForSeminarWeek(targetWeekCode);

  for (const day of weekDays) {
    const dayVal = day.dayOfWeek;
    const isoDate = day.dateStr;
    if (!isoDate) continue;

    for (const seminar of activeSeminars) {
      if (!isSeminarVisibleInTeam(seminar)) continue;

      const daySlots = (seminar.slots || []).filter(sl => {
        // ONLY internal/fixed seminar slots, never open Hausprogramm slots
        if (!sl.isOrange) return false;
        if (sl.dateStr) {
          return sl.dateStr === isoDate;
        }
        if (seminar.startDate && seminar.endDate && (isoDate < seminar.startDate || isoDate > seminar.endDate)) {
          return false;
        }
        return sl.dayOfWeek === dayVal;
      });

      for (const slot of daySlots) {
        const effectivePerson = (slot.teacher || seminar.leader || '').trim();
        if (!doesSeminarPersonMatchTeacher(effectivePerson, teacherName, teacherId)) continue;

        const cleanTitle = cleanSeminarSlotTitle(slot.title);
        const resolvedRoomName = slot.roomId
          ? getSeminarRoomDisplayName(slot.roomId, slot.roomName || seminar.roomName)
          : (slot.roomName || seminar.roomName || 'Laut Tagesaushang');

        result.push({
          id: `sem-slot-${seminar.id}-${slot.id}-${isoDate}`,
          name: `${seminar.shortTitle}: ${cleanTitle}`,
          style: 'Seminar',
          dayOfWeek: dayVal,
          dayIndex: day.dayIndex,
          isEndFriday: !!day.isEndFriday,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomId: slot.roomId || seminar.roomId || 'room-seminar',
          roomName: resolvedRoomName,
          teacherId: teacherId || teacherName,
          teacherName: effectivePerson,
          isAiPlanned: false,
          status: 'approved',
          isSeminarSlot: true,
          seminarId: seminar.id,
          seminarTitle: seminar.title,
          seminarShortTitle: seminar.shortTitle,
          seminarColor: seminar.color || '#ea580c',
          seminarType: seminar.type,
          slotId: slot.id,
          slotTitle: cleanTitle,
          slotDescription: slot.description,
          locationHint: slot.locationHint,
          category: slot.category,
          dateStr: isoDate,
          dayName: slot.dayName || GERMAN_DAY_NAMES[dayVal] || ''
        });
      }
    }
  }

  return result.sort((a, b) => {
    const idxA = a.dayIndex ?? 0;
    const idxB = b.dayIndex ?? 0;
    if (idxA !== idxB) return idxA - idxB;
    return a.startTime.localeCompare(b.startTime);
  });
}
