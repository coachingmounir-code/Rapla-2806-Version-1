// 4-wöchige Yogalehrerausbildung (YLA) Data Store & Types
import ylaCurriculumData from './data/yla_curriculum.json' with { type: 'json' };

export const YLA_TEACHERS = [
  'Abba',
  'Anjali',
  'Burnie',
  'Hu',
  'Karuna',
  'Narayani',
  'Pranava'
] as const;

export type YlaTeacherName = (typeof YLA_TEACHERS)[number];

export interface YlaTeacherMeta {
  name: YlaTeacherName;
  alias: string[];
  avatar: string;
  color: string;
  badgeBg: string;
}

export const YLA_TEACHERS_META: Record<YlaTeacherName, YlaTeacherMeta> = {
  Abba: {
    name: 'Abba',
    alias: ['abba', 'abha'],
    avatar: '🧘',
    color: '#8e24aa',
    badgeBg: '#f3e5f5'
  },
  Anjali: {
    name: 'Anjali',
    alias: ['anjali'],
    avatar: '🧘‍♀️',
    color: '#c2185b',
    badgeBg: '#fce4ec'
  },
  Burnie: {
    name: 'Burnie',
    alias: ['burnie', 'bernie', 'bintje'],
    avatar: '🧘‍♂️',
    color: '#1976d2',
    badgeBg: '#e3f2fd'
  },
  Hu: {
    name: 'Hu',
    alias: ['hu'],
    avatar: '🧘‍♂️',
    color: '#00796b',
    badgeBg: '#e0f2f1'
  },
  Karuna: {
    name: 'Karuna',
    alias: ['karuna', 'kamuna'],
    avatar: '🧘‍♀️',
    color: '#e65100',
    badgeBg: '#fff3e0'
  },
  Narayani: {
    name: 'Narayani',
    alias: ['narayani'],
    avatar: '🧘‍♀️',
    color: '#512da8',
    badgeBg: '#ede7f6'
  },
  Pranava: {
    name: 'Pranava',
    alias: ['pranava'],
    avatar: '🧘‍♂️',
    color: '#3949ab',
    badgeBg: '#e8eaf6'
  }
};

export interface YlaDay {
  col: string;
  headerRaw: string;
  dateStr: string;
  dayName: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  isoDate: string;   // YYYY-MM-DD
  specialFocus: string;
}

export interface YlaDayEntry {
  shortTitle?: string;
  keywords?: string[];
  fullText?: string;
  hasMore?: boolean;
  time?: string;
  text: string;
  isMerged: boolean;
  rawText: string;
  assignedTeacher?: string | null;
}

export interface YlaSlot {
  rowNumber: number;
  type: string;
  label: string;
  time: string;
  badge: string;
  entries: Record<string, YlaDayEntry>;
}

export interface YlaAbbr {
  abbr: string;
  meaning: string;
}

export interface YlaWeek {
  weekNumber: number;
  title: string;
  weekSubtitle: string;
  dateRange: string;
  contactInfo: string;
  abbreviations: YlaAbbr[];
  days: YlaDay[];
  slots: YlaSlot[];
  merges: string[];
  rawCells: Record<string, string>;
}

export interface YlaSearchResult {
  weekNumber: number;
  weekSubtitle: string;
  dateStr: string;
  dayName: string;
  slotLabel: string;
  time: string;
  badge: string;
  matchText: string;
}

export interface YlaConflictDetail {
  weekNumber: number;
  dateStr: string;
  dayName: string;
  dayOfWeek: number;
  isoDate: string;
  slotLabel: string;
  shortTitle: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  teacherName: string;
}

const STORAGE_KEY = 'rapla_yla_assignments';

/**
 * Normalizes teacher display name (e.g. Bintje/Bernie -> Burnie, Kamuna -> Karuna, Abha -> Abba)
 */
export function normalizeTeacherDisplayName(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  if (n === 'bintje' || n === 'bernie' || n === 'burnie') return 'Burnie';
  if (n === 'abba' || n === 'abha') return 'Abba';
  if (n === 'kamuna' || n === 'karuna') return 'Karuna';
  if (n === 'anjali') return 'Anjali';
  if (n === 'hu') return 'Hu';
  if (n === 'narayani') return 'Narayani';
  if (n === 'pranava') return 'Pranava';
  return name.trim();
}

/**
 * Extracts default assigned teachers from yla_curriculum.json
 */
export function getDefaultYlaAssignments(): Record<string, string> {
  const defaults: Record<string, string> = {};
  const weeks = ylaCurriculumData as unknown as YlaWeek[];
  for (const week of weeks) {
    for (const slot of week.slots) {
      for (const day of week.days) {
        const entry = slot.entries[day.col];
        if (entry && entry.assignedTeacher) {
          const key = `${week.weekNumber}_${day.col}_${slot.rowNumber}`;
          defaults[key] = normalizeTeacherDisplayName(entry.assignedTeacher) || entry.assignedTeacher;
        }
      }
    }
  }
  return defaults;
}

/**
 * Returns all 4 weeks of the YLA curriculum enriched with current assigned teachers
 */
export function getYlaWeeks(): YlaWeek[] {
  const assignments = getYlaAssignments();
  const weeks = JSON.parse(JSON.stringify(ylaCurriculumData)) as YlaWeek[];
  
  for (const week of weeks) {
    for (const slot of week.slots) {
      for (const day of week.days) {
        const entry = slot.entries[day.col];
        if (entry) {
          const key = `${week.weekNumber}_${day.col}_${slot.rowNumber}`;
          const assigned = assignments[key] || entry.assignedTeacher || null;
          entry.assignedTeacher = normalizeTeacherDisplayName(assigned) || null;
        }
      }
    }
  }
  return weeks;
}

/**
 * Returns a specific week of the YLA curriculum by week number (1, 2, 3, 4)
 */
export function getYlaWeek(weekNumber: number): YlaWeek | undefined {
  return getYlaWeeks().find(w => w.weekNumber === weekNumber);
}

/**
 * Read assignments mapping from localStorage merged with curriculum defaults
 */
export function getYlaAssignments(): Record<string, string> {
  const defaults = getDefaultYlaAssignments();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const custom = JSON.parse(raw);
    const merged = { ...defaults };
    for (const [k, v] of Object.entries(custom)) {
      if (v === '__NONE__' || !v) {
        delete merged[k];
      } else {
        merged[k] = normalizeTeacherDisplayName(v as string) || (v as string);
      }
    }
    return merged;
  } catch (e) {
    console.error('Error reading YLA assignments from localStorage', e);
    return defaults;
  }
}

/**
 * Save an assignment for a specific slot in a day
 */
export function setYlaAssignment(weekNumber: number, dayCol: string, rowNumber: number, teacherName: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom = raw ? JSON.parse(raw) : {};
    const key = `${weekNumber}_${dayCol}_${rowNumber}`;
    const normalized = normalizeTeacherDisplayName(teacherName);
    if (normalized && normalized.trim()) {
      custom[key] = normalized.trim();
    } else {
      custom[key] = '__NONE__';
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    window.dispatchEvent(new CustomEvent('yla-assignment-changed', { detail: { weekNumber, dayCol, rowNumber, teacherName: normalized } }));
  } catch (e) {
    console.error('Error saving YLA assignment to localStorage', e);
  }
}

/**
 * Normalizes teacher name for alias comparisons (e.g. Abba/Abha, Bernie/Burnie/Bintje, Karuna/Kamuna)
 */
export function normalizeTeacherName(name: string): string {
  const n = name.toLowerCase().trim();
  if (n === 'abba' || n === 'abha') return 'abba';
  if (n === 'bernie' || n === 'burnie' || n === 'bintje') return 'burnie';
  if (n === 'anjali') return 'anjali';
  if (n === 'hu') return 'hu';
  if (n === 'karuna' || n === 'kamuna') return 'karuna';
  if (n === 'narayani') return 'narayani';
  if (n === 'pranava') return 'pranava';
  return n;
}

/**
 * Returns exact start and end times for any YLA slot
 */
export function getYlaSlotTimeRange(slotType: string, slotTime: string, entryTime?: string): { start: string; end: string } {
  // If entry has a specific time (e.g. 17:35h, 15:30h, 8:30-12:30)
  if (entryTime) {
    const m = entryTime.match(/(\d{1,2})[\.:](\d{2})/g);
    if (m && m.length >= 2) {
      const p1 = m[0].replace('.', ':');
      const p2 = m[1].replace('.', ':');
      return { start: p1.padStart(5, '0'), end: p2.padStart(5, '0') };
    } else if (m && m.length === 1) {
      const p1 = m[0].replace('.', ':');
      const [h, min] = p1.split(':').map(Number);
      const endH = (h + 1).toString().padStart(2, '0');
      return { start: p1.padStart(5, '0'), end: `${endH}:${min.toString().padStart(2, '0')}` };
    }
  }

  // Check slot time string (e.g. "06:00 - 08:35")
  if (slotTime) {
    const m = slotTime.match(/(\d{1,2})[\.:](\d{2})/g);
    if (m && m.length >= 2) {
      const p1 = m[0].replace('.', ':');
      const p2 = m[1].replace('.', ':');
      return { start: p1.padStart(5, '0'), end: p2.padStart(5, '0') };
    }
  }

  // Fallbacks by slot type
  switch (slotType) {
    case 'morning_lecture': return { start: '06:00', end: '08:35' };
    case 'morning_practice': return { start: '08:45', end: '11:00' };
    case 'early_practice': return { start: '06:00', end: '08:35' };
    case 'mantra_init':
    case 'midday_event': return { start: '11:30', end: '12:30' };
    case 'gita': return { start: '14:00', end: '14:35' };
    case 'afternoon_lecture':
    case 'mantras': return { start: '14:35', end: '15:30' };
    case 'reading_basic':
    case 'reading_advanced': return { start: '15:30', end: '16:00' };
    case 'teaching_practice': return { start: '16:00', end: '18:30' };
    case 'teaching_review':
    case 'teaching_review_1':
    case 'teaching_review_2': return { start: '17:35', end: '18:35' };
    case 'evening_lecture': return { start: '19:00', end: '19:50' };
    case 'satsang': return { start: '20:00', end: '22:00' };
    case 'special_evening': return { start: '21:45', end: '22:45' };
    case 'study_exam': return { start: '08:30', end: '12:30' };
    case 'exam_lunch': return { start: '11:00', end: '12:30' };
    default: return { start: '08:00', end: '09:00' };
  }
}



function timeToMins(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMins(start1);
  const e1 = timeToMins(end1);
  const s2 = timeToMins(start2);
  const e2 = timeToMins(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

/**
 * Checks if a teacher is busy with a YLA session at the given day/date and time
 */
export function getYlaConflictForTeacher(
  teacherName: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  targetWeekCode?: string
): YlaConflictDetail | null {
  if (!teacherName) return null;
  const assignments = getYlaAssignments();
  if (Object.keys(assignments).length === 0) return null;

  const namesToCheck = teacherName.includes(',')
    ? teacherName.split(',').map(n => normalizeTeacherName(n))
    : [normalizeTeacherName(teacherName)];

  const weeks = ylaCurriculumData as unknown as YlaWeek[];

  let targetCourseDate = '';
  if (targetWeekCode && targetWeekCode.includes('-W')) {
    const [yearStr, weekStr] = targetWeekCode.split('-W');
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    if (!isNaN(year) && !isNaN(week)) {
      const jan4 = new Date(year, 0, 4);
      const daysToMonday = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1;
      const mondayOfW1 = new Date(jan4.getTime());
      mondayOfW1.setDate(jan4.getDate() - daysToMonday);

      const targetMonday = new Date(mondayOfW1.getTime());
      targetMonday.setDate(mondayOfW1.getDate() + (week - 1) * 7);

      const targetFriday = new Date(targetMonday.getTime());
      targetFriday.setDate(targetMonday.getDate() - 3);

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
      targetCourseDate = `${yyyy}-${mm}-${dd}`;
    }
  }

  for (const week of weeks) {
    for (const slot of week.slots) {
      for (const day of week.days) {
        const key = `${week.weekNumber}_${day.col}_${slot.rowNumber}`;
        const assigned = assignments[key];
        if (!assigned) continue;

        const normAssigned = normalizeTeacherName(assigned);
        const matchesTeacher = namesToCheck.some(
          name => name === normAssigned || normAssigned.includes(name) || name.includes(normAssigned)
        );
        if (!matchesTeacher) continue;

        // Check if date or day matches
        let matchesDate = false;
        if (targetCourseDate && day.isoDate) {
          matchesDate = (day.isoDate === targetCourseDate);
        } else {
          matchesDate = (day.dayOfWeek === dayOfWeek);
        }

        if (!matchesDate) continue;

        const slotTimeRange = getYlaSlotTimeRange(slot.type, slot.time, slot.entries[day.col]?.time);

        if (timesOverlap(startTime, endTime, slotTimeRange.start, slotTimeRange.end)) {
          const entry = slot.entries[day.col];
          return {
            weekNumber: week.weekNumber,
            dateStr: day.dateStr,
            dayName: day.dayName,
            dayOfWeek: day.dayOfWeek,
            isoDate: day.isoDate,
            slotLabel: slot.label,
            shortTitle: entry?.shortTitle || slot.label,
            timeRange: `${slotTimeRange.start} – ${slotTimeRange.end} Uhr`,
            startTime: slotTimeRange.start,
            endTime: slotTimeRange.end,
            teacherName: assigned
          };
        }
      }
    }
  }

  return null;
}

/**
 * Cell render info for HTML table rowspan layout and deduplication
 */
export interface YlaCellRenderInfo {
  shouldRender: boolean;
  rowSpan: number;
  entry: YlaDayEntry | null;
  rootSlot: YlaSlot;
  displayTime: string;
  isSpanned: boolean;
}

/**
 * Calculates rowspan and render eligibility for a timetable cell in a week
 */
export function getYlaCellRenderInfo(week: YlaWeek, col: string, slotIdx: number): YlaCellRenderInfo {
  const slots = week.slots;
  const slot = slots[slotIdx];
  const entry = slot?.entries[col] || null;

  // If this entry is marked as merged, verify if it's covered by an earlier slot
  if (entry && entry.isMerged) {
    let p = slotIdx - 1;
    while (p >= 0) {
      const prevSlot = slots[p];
      const prevEntry = prevSlot?.entries[col];
      if (prevEntry && (
        prevEntry.fullText === entry.fullText ||
        prevEntry.text === entry.text ||
        (entry.shortTitle && prevEntry.shortTitle === entry.shortTitle)
      )) {
        if (!prevEntry.isMerged) {
          // Covered by root at index p
          return {
            shouldRender: false,
            rowSpan: 1,
            entry: null,
            rootSlot: slot,
            displayTime: '',
            isSpanned: false
          };
        }
        p--;
      } else {
        break;
      }
    }
  }

  // Calculate forward rowSpan for root entry
  let rowSpan = 1;
  if (entry && (entry.text || entry.shortTitle)) {
    let k = slotIdx + 1;
    while (k < slots.length) {
      const nextSlot = slots[k];
      const nextEntry = nextSlot?.entries[col];
      if (nextEntry && nextEntry.isMerged && (
        nextEntry.fullText === entry.fullText ||
        nextEntry.text === entry.text ||
        (entry.shortTitle && nextEntry.shortTitle === entry.shortTitle)
      )) {
        rowSpan++;
        k++;
      } else {
        break;
      }
    }
  }

  let displayTime = entry?.time || slot?.time || '';
  if (!displayTime && rowSpan > 1) {
    const endSlot = slots[slotIdx + rowSpan - 1];
    if (slot?.time && endSlot?.time) {
      displayTime = `${slot.time.split('-')[0].trim()} – ${endSlot.time.split('-').pop()?.trim()}`;
    }
  }

  return {
    shouldRender: true,
    rowSpan,
    entry,
    rootSlot: slot,
    displayTime,
    isSpanned: rowSpan > 1
  };
}

/**
 * Performs a case-insensitive search across all 4 weeks of the YLA curriculum
 */
export function searchYlaCurriculum(query: string): YlaSearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: YlaSearchResult[] = [];

  for (const week of getYlaWeeks()) {
    for (let sIdx = 0; sIdx < week.slots.length; sIdx++) {
      const slot = week.slots[sIdx];
      for (const day of week.days) {
        const cellInfo = getYlaCellRenderInfo(week, day.col, sIdx);
        if (!cellInfo.shouldRender) continue; // Skip duplicate merged rows

        const entry = cellInfo.entry;
        if (entry && (
          (entry.text && entry.text.toLowerCase().includes(q)) ||
          (entry.shortTitle && entry.shortTitle.toLowerCase().includes(q)) ||
          (entry.assignedTeacher && entry.assignedTeacher.toLowerCase().includes(q)) ||
          (entry.keywords && entry.keywords.some(k => k.toLowerCase().includes(q)))
        )) {
          results.push({
            weekNumber: week.weekNumber,
            weekSubtitle: week.weekSubtitle,
            dateStr: day.dateStr,
            dayName: day.dayName,
            slotLabel: slot.label,
            time: cellInfo.displayTime || slot.time,
            badge: slot.badge,
            matchText: `${entry.assignedTeacher ? `[👤 ${entry.assignedTeacher}] ` : ''}${getYlaCleanShortTitle(entry, slot.label)}`
          });
        }
      }
    }
    
    // Also check special focus on days
    for (const day of week.days) {
      if (day.specialFocus && day.specialFocus.toLowerCase().includes(q)) {
        results.push({
          weekNumber: week.weekNumber,
          weekSubtitle: week.weekSubtitle,
          dateStr: day.dateStr,
          dayName: day.dayName,
          slotLabel: 'Tages-Schwerpunkt',
          time: 'Ganztägig',
          badge: 'Besonderheit',
          matchText: day.specialFocus
        });
      }
    }
  }

  return results;
}

/**
 * Returns metadata and styling for a teacher (core team or custom)
 */
export function getYlaTeacherMeta(teacherName?: string | null): { name: string; avatar: string; color: string; badgeBg: string } {
  if (!teacherName) {
    return { name: '', avatar: '👤', color: '#64748b', badgeBg: '#f1f5f9' };
  }
  const norm = normalizeTeacherName(teacherName);
  for (const t of YLA_TEACHERS) {
    const meta = YLA_TEACHERS_META[t];
    if (meta.name.toLowerCase() === norm || meta.alias.includes(norm)) {
      return {
        name: meta.name,
        avatar: meta.avatar,
        color: meta.color,
        badgeBg: meta.badgeBg
      };
    }
  }

  // Consistent pleasant color for external/other teachers
  const colors = [
    { color: '#0284c7', badgeBg: '#e0f2fe', avatar: '🧘' },
    { color: '#7c3aed', badgeBg: '#ede9fe', avatar: '🧘‍♀️' },
    { color: '#059669', badgeBg: '#d1fae5', avatar: '🧘‍♂️' },
    { color: '#d97706', badgeBg: '#fef3c7', avatar: '🧘' },
    { color: '#db2777', badgeBg: '#fce7f3', avatar: '🧘‍♀️' },
    { color: '#4f46e5', badgeBg: '#e0e7ff', avatar: '🧘‍♂️' }
  ];
  let hash = 0;
  for (let i = 0; i < teacherName.length; i++) {
    hash = teacherName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const picked = colors[Math.abs(hash) % colors.length];
  return {
    name: teacherName,
    avatar: picked.avatar,
    color: picked.color,
    badgeBg: picked.badgeBg
  };
}

/**
 * Returns a concise, clean short title for any YLA entry
 */
export function getYlaCleanShortTitle(entry?: YlaDayEntry | null, slotLabel?: string): string {
  if (!entry) return slotLabel || '—';
  if (entry.shortTitle && entry.shortTitle.trim().length > 0) {
    const st = entry.shortTitle.trim();
    if (st.toLowerCase() === 'komb') return 'Komb. Mantra-Meditation';
    if (st === '11-12') return 'Mittagessen (11:00–12:30)';
    if (st === 'Korr') return 'Bewegungslehre: Flexion, Extension & Asanas';
    if (st.toLowerCase().startsWith('8.30 bis ca. 11.00h')) return 'Abschlussfeier & Diplomverleihung';
    return st;
  }
  if (entry.text && entry.text.trim().length > 0) {
    const clean = entry.text.split(/[\n\r\.;]/)[0].trim();
    if (clean.length <= 40) return clean;
    const words = clean.split(/\s+/);
    if (words.length <= 6) return clean;
    return words.slice(0, 5).join(' ') + '…';
  }
  return slotLabel || '—';
}
