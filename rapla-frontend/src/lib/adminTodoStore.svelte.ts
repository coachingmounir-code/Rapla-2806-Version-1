// Store for Admin Seminar & Orga To-Do List (Yoga Vidya Nordsee)
// Pre-populated with tasks inspired by Yoga Vidya Aufgaben.pdf

export type AdminTodoCategory =
  | 'seminare'
  | 'dozenten'
  | 'orga'
  | 'kommunikation'
  | 'finanzen'
  | 'sevakas'
  | 'haus'
  | 'automatisierung';

export type AdminTodoPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface AdminSubtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface AdminTodoItem {
  id: string;
  title: string;
  notes?: string;
  category: AdminTodoCategory;
  priority: AdminTodoPriority;
  dueDate?: string; // YYYY-MM-DD (e.g. "2026-08-24")
  dueTime?: string; // HH:MM (e.g. "09:15")
  completed: boolean;
  completedAt?: string;
  assignee?: string; // e.g. "Karuna", "Susan", "Narayani"
  contactEmail?: string; // e.g. "maika.bauerfeind@gmx.de"
  linkUrl?: string; // e.g. "https://www.yoga-vidya.de/feedback-umfrage/"
  linkPassword?: string; // e.g. "Ganga108"
  recurringRule?: string; // e.g. "Jeden Mittwoch & Samstag"
  subtasks: AdminSubtask[];
  tags: string[];
  createdAt: string;
}

export const CATEGORY_CONFIG: Record<
  AdminTodoCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  seminare: {
    label: 'Seminar-Orga',
    icon: '🪷',
    color: '#960040',
    bg: '#fdf2f4'
  },
  dozenten: {
    label: 'Dozenten & Stunden',
    icon: '🧘',
    color: '#d97724',
    bg: '#fff7ed'
  },
  sevakas: {
    label: 'Sevakas & Schichten',
    icon: '👥',
    color: '#2563eb',
    bg: '#eff6ff'
  },
  kommunikation: {
    label: 'Absprachen & Mails',
    icon: '💬',
    color: '#0d9488',
    bg: '#f0fdfa'
  },
  finanzen: {
    label: 'Finanzen & Rechnungen',
    icon: '💰',
    color: '#16a34a',
    bg: '#f0fdf4'
  },
  orga: {
    label: 'Organisation & Planung',
    icon: '📋',
    color: '#7c3aed',
    bg: '#f5f3ff'
  },
  haus: {
    label: 'Haus, Räume & Fahrdienst',
    icon: '🏢',
    color: '#b45309',
    bg: '#fef3c7'
  },
  automatisierung: {
    label: 'KI & Automatisierung',
    icon: '🤖',
    color: '#4338ca',
    bg: '#eef2ff'
  }
};

export const PRIORITY_CONFIG: Record<
  AdminTodoPriority,
  { label: string; icon: string; badgeClass: string }
> = {
  urgent: { label: 'Dringend', icon: '💀', badgeClass: 'prio-urgent' },
  high: { label: 'Hoch', icon: '⚡', badgeClass: 'prio-high' },
  normal: { label: 'Normal', icon: '🟡', badgeClass: 'prio-normal' },
  low: { label: 'Niedrig', icon: '🟢', badgeClass: 'prio-low' }
};

export const DEFAULT_ADMIN_TODOS: AdminTodoItem[] = [
  {
    id: 'pdf-task-1',
    title: 'Ordnung schaffen und Entscheidungen treffen',
    notes: 'Allgemeine Strukturierung der anstehenden Seminar- und Teamaufgaben für die kommenden Wochen.',
    category: 'orga',
    priority: 'high',
    dueDate: '2026-08-24',
    completed: false,
    subtasks: [],
    tags: ['Leitung', 'Ordnung'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-2',
    title: 'Feedback-Umfrage auswerten & Feedback prüfen',
    notes: 'Rückmeldungen der Teilnehmer prüfen und Qualitätsmanagement anpassen.',
    category: 'orga',
    priority: 'normal',
    dueDate: '2026-08-24',
    completed: false,
    linkUrl: 'https://www.yoga-vidya.de/feedback-umfrage/',
    linkPassword: 'Password: Ganga108',
    subtasks: [],
    tags: ['Umfrage', 'Qualität'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-3',
    title: 'Suniti FeWo Spezial für Frauen mit Karuna besprechen',
    notes: 'In Wochen, in denen es kein FeWo gibt – Alternativprogramme und Abstimmung mit Karuna planen.',
    category: 'seminare',
    priority: 'high',
    dueDate: '2026-08-25',
    completed: false,
    assignee: 'Karuna & Suniti',
    subtasks: [
      { id: 'sub-3-1', text: 'Freie FeWo-Wochen im Jahresplan lokalisieren', completed: false },
      { id: 'sub-3-2', text: 'Terminabstimmung mit Karuna & Suniti', completed: false }
    ],
    tags: ['FeWo', 'Frauen Spezial', 'Absprache'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-4',
    title: 'Yin ÜL AB absagen',
    notes: 'Yin Yogalehrer-Übungsleiter Ausbildung absagen und betroffene Teilnehmer/Dozenten rechtzeitig benachrichtigen.',
    category: 'dozenten',
    priority: 'urgent',
    dueDate: '2026-08-24',
    completed: false,
    subtasks: [],
    tags: ['Absage', 'Ausbildung', 'Yin Yoga'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-5',
    title: 'Fahrdienst für Maharani Orga (18. – 20.09.26)',
    notes: 'Fahrdienst für Maharani Fritsch de Navarrete (Schamanismus als Medizin) organisieren.',
    category: 'haus',
    priority: 'high',
    dueDate: '2026-09-18',
    completed: false,
    assignee: 'Maharani',
    subtasks: [
      { id: 'sub-5-1', text: 'Ankunftszeit am Bahnhof erfragen', completed: false },
      { id: 'sub-5-2', text: 'Fahrer im Sevaka-Team eintragen', completed: false }
    ],
    tags: ['Fahrdienst', 'Logistik', 'Maharani'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-6',
    title: 'Marlen in Rapla miteinplanen',
    notes: 'Sie bleibt eine Woche länger. Unterrichtsstunden und Sevazeiten entsprechend im System verlängern.',
    category: 'sevakas',
    priority: 'high',
    dueDate: '2026-08-24',
    completed: false,
    assignee: 'Marlen',
    subtasks: [],
    tags: ['Rapla', 'Planung', 'Verlängerung'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-7',
    title: 'Narayani Wünsche für die Webseite einpflegen',
    notes: 'Profiltexte, Seminarbeschreibungen und Sonderwünsche von Narayani auf der Webseite aktualisieren.',
    category: 'kommunikation',
    priority: 'normal',
    dueDate: '2026-08-26',
    completed: false,
    assignee: 'Narayani',
    subtasks: [],
    tags: ['Webseite', 'Texte'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-8',
    title: 'Monika Camara einbuchen lassen & spezielle Wünsche einpflegen',
    notes: 'Buchung für Monika Adele Camara abschließen und Zimmer-/Unterrichtswünsche vermerken.',
    category: 'dozenten',
    priority: 'normal',
    dueDate: '2026-08-26',
    completed: false,
    assignee: 'Monika Adele Camara',
    subtasks: [],
    tags: ['Buchung', 'Sonderwünsche'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-9',
    title: 'Maika Bauerfeind antworten',
    notes: 'Rückantwort auf Anfrage bezüglich Seminarteilnahme und Unterbringung verfassen.',
    category: 'kommunikation',
    priority: 'high',
    dueDate: '2026-08-24',
    completed: false,
    contactEmail: 'maika.bauerfeind@gmx.de',
    subtasks: [],
    tags: ['Email', 'Teilnehmer'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-10',
    title: 'YLA To-Do Liste Chandrashekara delegieren',
    notes: 'Aufgabenpaket für die 4-wöchige Yogalehrer-Ausbildung übergeben.',
    category: 'seminare',
    priority: 'high',
    dueDate: '2026-08-25',
    completed: false,
    assignee: 'Chandrashekara',
    subtasks: [
      { id: 'sub-10-1', text: 'Bestand auffüllen mehr als nötig (Skripte, Matten, Kissen)', completed: false },
      { id: 'sub-10-2', text: 'Service Mail Adresse prüfen & Weiterleitung einrichten', completed: false },
      { id: 'sub-10-3', text: 'Taschen packen für Ausbildungs-Teilnehmer', completed: false }
    ],
    tags: ['YLA', 'Delegation', 'Material'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-11',
    title: 'Susan Atemyogastunde & Hormon Yoga planen',
    notes: 'Samstag 22.08: Susan Atem Yogastunde 9:15 Uhr | Sonntag: Hormon Yoga 9:15 Uhr eintragen.',
    category: 'dozenten',
    priority: 'high',
    dueDate: '2026-08-22',
    dueTime: '09:15',
    completed: true,
    assignee: 'Susan Holze',
    subtasks: [],
    tags: ['Stundenplan', 'Susan', 'Wochenende'],
    createdAt: '2026-08-20T08:00:00.000Z'
  },
  {
    id: 'pdf-task-12',
    title: 'Susan Seminare Weiterbildung Geburt Teilnehmer kontaktieren',
    notes: 'Teilnehmerliste für die Yogalehrer-Weiterbildung "Yoga rund um die Geburt" durchgehen und Vorab-Informationen senden.',
    category: 'kommunikation',
    priority: 'normal',
    dueDate: '2026-08-25',
    completed: false,
    assignee: 'Susan Holze',
    subtasks: [],
    tags: ['Weiterbildung', 'Geburt', 'Teilnehmer'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-13',
    title: 'Yogastunden neu vergeben: Atmaram, Marleen',
    notes: 'Offene Yogastunden in der kommenden Woche an Atmaram und Marleen zuteilen.',
    category: 'dozenten',
    priority: 'high',
    dueDate: '2026-08-24',
    completed: false,
    assignee: 'Atmaram, Marleen',
    subtasks: [],
    tags: ['Vertretung', 'Stundenvergabe'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-14',
    title: 'Hundesatz schreiben (siehe Honorar Email)',
    notes: 'Zusatzklausel / Vereinbarung bezüglich Hundehaltung und Honorarabzug formulieren.',
    category: 'finanzen',
    priority: 'normal',
    dueDate: '2026-08-26',
    completed: false,
    subtasks: [],
    tags: ['Honorar', 'Vertrag'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-15',
    title: 'Bei Yin Yoga Ferienwoche von Beate auf YIN YOGA Stunden achten',
    notes: 'Sicherstellen, dass im Wochenplan parallel zu Beates Yin Yoga Ferienwoche die passenden Einheiten eingeteilt sind.',
    category: 'dozenten',
    priority: 'high',
    dueDate: '2026-08-30',
    completed: false,
    assignee: 'Beate Menkarski',
    subtasks: [],
    tags: ['Yin Yoga', 'Ferienwoche', 'Planung'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-16',
    title: 'Narayana anrufen (Montag)',
    notes: 'Wichtige Rücksprache bezüglich anstehender Seminare und Termine.',
    category: 'kommunikation',
    priority: 'urgent',
    dueDate: '2026-08-24',
    completed: false,
    assignee: 'Narayana',
    subtasks: [],
    tags: ['Anruf', 'Montag', 'Dringend'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-17',
    title: 'Tanja für Rapla einplanen (06.09. bis 20.09.) & ihr antworten',
    notes: 'Zeitraum 06.09. – 20.09.2026 im Rapla-Plan hinterlegen und Bestätigungsmail an Tanja senden.',
    category: 'sevakas',
    priority: 'high',
    dueDate: '2026-09-06',
    completed: true,
    assignee: 'Tanja',
    subtasks: [
      { id: 'sub-17-1', text: 'Tanja als Karma Yogini / Yogalehrerin (06.09. – 20.09.2026) im Rapla-Plan hinterlegen', completed: true },
      { id: 'sub-17-2', text: 'Bestätigungsmail an Tanja senden', completed: false }
    ],
    tags: ['Rapla', 'Einteilung', 'Email'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-18',
    title: 'Rechnungen klären und verschicken (Mittwochs & Samstags)',
    notes: 'Regelmäßiger Abrechnungslauf: Eingegangene Belege prüfen, Dozentenhonorare und Rechnungen freigeben und versenden.',
    category: 'finanzen',
    priority: 'high',
    dueDate: '2026-08-26',
    completed: false,
    recurringRule: 'Jeden Mittwoch & Samstag',
    subtasks: [
      { id: 'sub-18-1', text: 'Offene Honorarabrechnungen abgleichen', completed: false },
      { id: 'sub-18-2', text: 'Rechnungen als PDF erstellen und versenden', completed: false }
    ],
    tags: ['Rechnungen', 'Abrechnung', 'Wiederkehrend'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-19',
    title: 'Gekürzten Text von Carina verschicken',
    notes: 'Zusammenfassende Version des Seminarleitfadens an Carina / Verteiler senden.',
    category: 'kommunikation',
    priority: 'normal',
    dueDate: '2026-08-25',
    completed: false,
    assignee: 'Carina',
    subtasks: [],
    tags: ['Texte', 'Carina'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-20',
    title: 'Rapla mit Küchendienst und Rezischichten abgleichen',
    notes: 'Schnittstelle zwischen Seminarunterricht, Küchendienst und Rezeptionsschichten synchronisieren, damit keine Doppelbelegungen entstehen.',
    category: 'sevakas',
    priority: 'high',
    dueDate: '2026-08-24',
    completed: false,
    subtasks: [
      { id: 'sub-20-1', text: 'Rezeptionszeiten für Wochenende prüfen', completed: false },
      { id: 'sub-20-2', text: 'Küchendienstzeiten mit Sevaka-Unterrichtsstunden abgleichen', completed: false }
    ],
    tags: ['Abgleich', 'Küche', 'Rezi'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-21',
    title: 'Jahresplan Liste anschauen',
    notes: 'Großes Gesamtbild für das laufende und kommende Halbjahr überprüfen.',
    category: 'orga',
    priority: 'normal',
    dueDate: '2026-08-27',
    completed: false,
    subtasks: [],
    tags: ['Jahresplan', 'Übersicht'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-22',
    title: 'Maha Siddhi Termine schicken für 2027',
    notes: 'Terminvorschläge und Raumkontingente für 2027 an Maha Siddhi übermitteln.',
    category: 'kommunikation',
    priority: 'normal',
    dueDate: '2026-08-28',
    completed: false,
    assignee: 'Maha Siddhi',
    subtasks: [],
    tags: ['Planung 2027', 'Termine'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-23',
    title: 'Seminaraufgaben erledigen (Checkliste)',
    notes: 'Kernaufgaben vor Start der neuen Seminarwoche.',
    category: 'seminare',
    priority: 'urgent',
    dueDate: '2026-08-24',
    completed: false,
    subtasks: [
      { id: 'sub-23-1', text: 'Seminarpläne + Teilnehmerlisten ausdrucken / bereitlegen', completed: false },
      { id: 'sub-23-2', text: 'Räume checken: YME od. YFEWO Tüte Radha Krsna', completed: false },
      { id: 'sub-23-3', text: 'Mit Seminarleiter reden (Ablauf, Raumbedarf klären)', completed: false },
      { id: 'sub-23-4', text: 'Seminare früh checken was gebraucht wird – Email Automatisierung einrichten', completed: false }
    ],
    tags: ['Seminarstart', 'Checkliste', 'Dringend'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-24',
    title: 'Yin Yoga Übungsleiter Ausbildung (04.10.) neubesetzen oder canceln',
    notes: 'Frist: Bis spätestens Ende Juli neubesetzen oder canceln -> Christian Bliedtner anrufen!',
    category: 'dozenten',
    priority: 'urgent',
    dueDate: '2026-08-24',
    completed: false,
    assignee: 'Christian Bliedtner',
    subtasks: [
      { id: 'sub-24-1', text: 'Christian anrufen und Verfügbarkeit klären', completed: false },
      { id: 'sub-24-2', text: 'Entscheidung treffen: Neuer Dozent oder Absage im System', completed: false }
    ],
    tags: ['Ausbildung', 'Christian', 'Frist'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-25',
    title: 'Schönen "Wer fehlt" Aushang machen',
    notes: 'Übersichtlichen Aushang für das Sevaka-Brett / Rezeption gestalten.',
    category: 'haus',
    priority: 'normal',
    dueDate: '2026-08-25',
    completed: false,
    subtasks: [],
    tags: ['Aushang', 'Information'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-26',
    title: 'FeWo Frauen Spezial: Karuna fragen / Suniti',
    notes: 'Abschlussgespräch mit Karuna führen über Suniti und die Frauen-Spezialwochen.',
    category: 'kommunikation',
    priority: 'normal',
    dueDate: '2026-08-25',
    completed: false,
    assignee: 'Karuna & Suniti',
    subtasks: [],
    tags: ['FeWo', 'Absprache'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-27',
    title: 'Kurkarten Automatisierung Daten einpflegen',
    notes: 'Schnittstellendaten und Meldescheine für die Kurkarten-Automatisierung vervollständigen.',
    category: 'automatisierung',
    priority: 'normal',
    dueDate: '2026-08-28',
    completed: false,
    subtasks: [],
    tags: ['Kurkarten', 'Automatisierung'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-28',
    title: '06.–08.11. YME Harishakti | 22.–27.11. FeWo planen',
    notes: 'Langfristige Belegung für November festzurren.',
    category: 'seminare',
    priority: 'normal',
    dueDate: '2026-09-01',
    completed: false,
    assignee: 'Harishakti',
    subtasks: [],
    tags: ['November', 'Planung'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-29',
    title: 'Kurzen Fragebogen bei Emailbestätigung umsetzen mit Google Antigravity',
    notes: 'Automatisierte Abfrage von Vorkenntnissen und Essenswünschen bei Buchungsbestätigung integrieren.',
    category: 'automatisierung',
    priority: 'high',
    dueDate: '2026-08-27',
    completed: false,
    subtasks: [],
    tags: ['KI', 'Google Antigravity', 'Email'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-30',
    title: 'Batterien & Uhren umdrehen (KI Assistenz)',
    notes: 'Rundgang durch die Seminarräume: Wanduhren prüfen, Batterien wechseln/drehen.',
    category: 'haus',
    priority: 'low',
    dueDate: '2026-08-29',
    completed: false,
    subtasks: [],
    tags: ['Hausmeister', 'Räume'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-31',
    title: 'Tüten checken Eingangsbereich (KI Assistenz)',
    notes: 'Eingangsbereich & Rezeption prüfen: Willkommenstüten und Begrüßungsmaterialien auffüllen.',
    category: 'haus',
    priority: 'low',
    dueDate: '2026-08-29',
    completed: false,
    subtasks: [],
    tags: ['Eingang', 'Empfang'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-32',
    title: 'Katalograum aufräumen',
    notes: 'Alte Flyer entsorgen, neue Broschüren und Bücherstapel ordnen.',
    category: 'haus',
    priority: 'low',
    dueDate: '2026-08-30',
    completed: false,
    subtasks: [],
    tags: ['Ordnung', 'Kataloge'],
    createdAt: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'pdf-task-33',
    title: 'Sukadev 09.10. planen – Karuna Email warten',
    notes: 'Raja Yoga 2 Seminar mit Sukadev Bretz & Karuna koordinieren, sobald Karunas Email mit dem Zeitplan eingegangen ist.',
    category: 'seminare',
    priority: 'high',
    dueDate: '2026-10-09',
    completed: false,
    assignee: 'Sukadev Bretz & Karuna',
    subtasks: [
      { id: 'sub-33-1', text: 'Email von Karuna prüfen', completed: false },
      { id: 'sub-33-2', text: 'Sitaram / Devi Raum vorbereiten', completed: false }
    ],
    tags: ['Sukadev', 'Raja Yoga', 'VIP'],
    createdAt: '2026-08-24T08:00:00.000Z'
  }
];

export class AdminTodoStore {
  todos = $state<AdminTodoItem[]>([]);
  isLoaded = $state(false);

  constructor() {
    this.load();
  }

  load() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('yoga_admin_todos');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.todos = parsed;
            this.isLoaded = true;
            return;
          }
        } catch (e) {
          console.error('Failed to parse admin todos from localStorage', e);
        }
      }
      // Initialize with default tasks from Yoga Vidya Aufgaben PDF
      this.todos = JSON.parse(JSON.stringify(DEFAULT_ADMIN_TODOS));
      this.save();
      this.isLoaded = true;
    }
  }

  save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('yoga_admin_todos', JSON.stringify(this.todos));
    }
  }

  resetToDefaults() {
    this.todos = JSON.parse(JSON.stringify(DEFAULT_ADMIN_TODOS));
    this.save();
  }

  addTodo(item: Omit<AdminTodoItem, 'id' | 'createdAt' | 'completed'>) {
    const newTodo: AdminTodoItem = {
      ...item,
      id: 'admin-todo-' + Math.random().toString(36).substr(2, 9),
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.todos.unshift(newTodo);
    this.save();
    return newTodo;
  }

  updateTodo(id: string, updates: Partial<AdminTodoItem>) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.todos[idx] = { ...this.todos[idx], ...updates };
      this.save();
    }
  }

  toggleTodo(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.completedAt = todo.completed ? new Date().toISOString() : undefined;
      this.save();
    }
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.save();
  }

  toggleSubtask(todoId: string, subtaskId: string) {
    const todo = this.todos.find(t => t.id === todoId);
    if (todo) {
      const sub = todo.subtasks.find(s => s.id === subtaskId);
      if (sub) {
        sub.completed = !sub.completed;
        this.save();
      }
    }
  }

  addSubtask(todoId: string, text: string) {
    if (!text.trim()) return;
    const todo = this.todos.find(t => t.id === todoId);
    if (todo) {
      todo.subtasks.push({
        id: 'sub-' + Math.random().toString(36).substr(2, 7),
        text: text.trim(),
        completed: false
      });
      this.save();
    }
  }

  deleteSubtask(todoId: string, subtaskId: string) {
    const todo = this.todos.find(t => t.id === todoId);
    if (todo) {
      todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
      this.save();
    }
  }

  // Statistics
  get totalCount() {
    return this.todos.length;
  }

  get completedCount() {
    return this.todos.filter(t => t.completed).length;
  }

  get pendingCount() {
    return this.todos.filter(t => !t.completed).length;
  }

  get urgentCount() {
    return this.todos.filter(t => !t.completed && (t.priority === 'urgent' || t.priority === 'high')).length;
  }

  get todayCount() {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.todos.filter(t => !t.completed && (!t.dueDate || t.dueDate <= todayStr)).length;
  }
}

export const adminTodoStore = new AdminTodoStore();
