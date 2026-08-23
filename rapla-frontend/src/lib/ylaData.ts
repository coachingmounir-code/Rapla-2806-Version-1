// 4-wöchige Yogalehrerausbildung (YLA) Data Store & Types
import ylaCurriculumData from './data/yla_curriculum.json' with { type: 'json' };

export interface YlaDay {
  col: string;
  headerRaw: string;
  dateStr: string;
  dayName: string;
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

/**
 * Returns all 4 weeks of the YLA curriculum
 */
export function getYlaWeeks(): YlaWeek[] {
  return ylaCurriculumData as YlaWeek[];
}

/**
 * Returns a specific week of the YLA curriculum by week number (1, 2, 3, 4)
 */
export function getYlaWeek(weekNumber: number): YlaWeek | undefined {
  return (ylaCurriculumData as YlaWeek[]).find(w => w.weekNumber === weekNumber);
}

/**
 * Performs a case-insensitive search across all 4 weeks of the YLA curriculum
 */
export function searchYlaCurriculum(query: string): YlaSearchResult[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: YlaSearchResult[] = [];

  for (const week of ylaCurriculumData as YlaWeek[]) {
    for (const slot of week.slots) {
      for (const day of week.days) {
        const entry = slot.entries[day.col];
        if (entry && entry.text && entry.text.toLowerCase().includes(q)) {
          results.push({
            weekNumber: week.weekNumber,
            weekSubtitle: week.weekSubtitle,
            dateStr: day.dateStr,
            dayName: day.dayName,
            slotLabel: slot.label,
            time: slot.time,
            badge: slot.badge,
            matchText: entry.text
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
