import { db, getLocalDateForDay, type Course, type Room, type Teacher, type WeekPlan } from './db';

export type CourseCategory =
  | 'Geführte Meditation'
  | 'Yogastunden'
  | 'Satsang'
  | 'ONN'
  | 'Pranayama'
  | 'Sonstiges';

export interface CategoryDelta {
  category: CourseCategory;
  soll: number;
  ist: number;
  diff: number;
}

export interface MissingFixedSlotInfo {
  course: Course;
  substituteName?: string;
  swappedToCourse?: Course;
}

export interface ChangeUiSummary {
  kind: 'missing' | 'added' | 'modified' | 'swap';
  text: string;
  badge?: string;
}

export interface TeacherDeviation {
  teacher: Teacher;
  mode: 'fixed_deviation' | 'manual_edit';
  fixedSlots: Course[];
  actualSlots: Course[];
  missingFixedSlots: MissingFixedSlotInfo[];
  extraSlots: Course[];
  categoryBreakdown: CategoryDelta[];
  uiChangeSummaries: ChangeUiSummary[];
  signature: string;
  alreadyNotified: boolean;
  lastNotifiedAt?: string;
  messageText: string;
}

export interface WhatsAppGatewayConfig {
  provider: 'wa_link_only' | 'green_api' | 'meta_cloud' | 'custom_webhook';
  greenApiInstanceId?: string;
  greenApiToken?: string;
  metaPhoneNumberId?: string;
  metaAccessToken?: string;
  customWebhookUrl?: string;
  baseAppUrl?: string;
}

const DEFAULT_GATEWAY_CONFIG: WhatsAppGatewayConfig = {
  provider: 'wa_link_only',
  greenApiInstanceId: '',
  greenApiToken: '',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  customWebhookUrl: '',
  baseAppUrl: ''
};

export function getWhatsAppGatewayConfig(): WhatsAppGatewayConfig {
  return db.getStored<WhatsAppGatewayConfig>('rapla_whatsapp_config', DEFAULT_GATEWAY_CONFIG);
}

export async function saveWhatsAppGatewayConfig(config: WhatsAppGatewayConfig): Promise<void> {
  await db.setStored('rapla_whatsapp_config', config, true);
}

const DAY_LABELS_SHORT: Record<number, string> = {
  5: 'Fr',
  6: 'Sa',
  0: 'So',
  1: 'Mo',
  2: 'Di',
  3: 'Mi',
  4: 'Do'
};

const DAY_LABELS_FULL: Record<number, string> = {
  5: 'Freitag',
  6: 'Samstag',
  0: 'Sonntag',
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag'
};

const MALE_FIRST_NAMES = new Set([
  'adam', 'adinatha', 'alexander', 'ananda', 'ananta', 'anantadas',
  'burnie', 'chandrashekara', 'christopher', 'david', 'eric', 'erkan',
  'gopala', 'hu', 'jnanadev', 'jörg', 'klaus', 'krishnajyoti', 'liu',
  'matthias', 'michael', 'mounir', 'mouniir', 'pranava', 'raphael', 'roland',
  'sathyam', 'satyam', 'satyamitra', 'shankara', 'sukadev', 'swami',
  'ulrich', 'venulo', 'volker', 'wolfgang'
]);

const PLACEHOLDER_TEACHER_NAMES = new Set([
  '',
  '! yl #',
  'offen',
  'unbesetzt',
  'nicht zugewiesen'
]);

// Permanently retired former team members per GEMINI.md rules
const EXCLUDED_FORMER_SEVAKAS = new Set(['teresa', 'harishakti', 'ulrich']);

export function formatPersonDisplayName(rawName: string): string {
  const clean = (rawName || '').trim();
  if (!clean) return '';
  if (clean.toLowerCase() === 'burnie') return 'Burnie';
  return clean;
}

function getSalutationForTeacher(fullName: string): string {
  const clean = (fullName || '').trim();
  const firstNameRaw = clean.split(/\s+/)[0] || clean;
  const lowerFirst = firstNameRaw.toLowerCase();
  const displayFirst =
    firstNameRaw.length > 0
      ? firstNameRaw[0].toUpperCase() + firstNameRaw.slice(1)
      : firstNameRaw;
  const adj = MALE_FIRST_NAMES.has(lowerFirst) ? 'lieber' : 'liebe';
  return `Om Om, ${adj} ${displayFirst},`;
}

const DAY_ORDER: Record<number, number> = {
  5: 0,
  6: 1,
  0: 2,
  1: 3,
  2: 4,
  3: 5,
  4: 6
};

export function isBuffetOrIgnoredCourse(course: Course): boolean {
  if (!course) return true;
  const name = (course.name || '').toLowerCase();
  const style = (course.style || '').toLowerCase();
  return name.includes('vollwert-buffet') || name.includes('vollwertbuffet') || style === 'buffet';
}

export function isSpecialNonRecurringCourse(course: Course): boolean {
  const id = (course?.id || '').toLowerCase();
  return id.includes('-tdot-') || id.includes('-schulung-');
}

export function getCourseCategory(course: Course): CourseCategory {
  const name = (course.name || '').toLowerCase();
  const style = (course.style || '').toLowerCase();

  if (name.includes('om namo') || name.includes('narayanaya') || name === 'onn') {
    return 'ONN';
  }
  if (name.includes('pranayama') || style.includes('pranayama')) {
    return 'Pranayama';
  }
  if (
    name.includes('geführte meditation') ||
    name.includes('ankommensmed') ||
    (course.startTime === '07:00' && name.includes('meditation'))
  ) {
    return 'Geführte Meditation';
  }
  if (name.includes('satsang') && !name.includes('einführung')) {
    return 'Satsang';
  }
  if (
    name.includes('anfänger') ||
    name.includes('pavanmukt') ||
    name.includes('mittelstufe') ||
    name.includes('ankommensstunde') ||
    name.includes('gemeinsame stunde') ||
    name.includes('hatha') ||
    name.includes('vinyasa') ||
    name.includes('yin') ||
    name.includes('rücken') ||
    style === 'hatha' ||
    style === 'vinyasa' ||
    style === 'yin' ||
    style === 'power yoga' ||
    style === 'kundalini'
  ) {
    if (!name.includes('lachyoga') && !name.includes('schulung') && !style.includes('schulung')) {
      return 'Yogastunden';
    }
  }
  return 'Sonstiges';
}

function isBeginnerYogaCourse(nameLower: string): boolean {
  return nameLower.includes('anfänger') || nameLower.includes('pavanmukt');
}

function isIntermediateYogaCourse(nameLower: string): boolean {
  return nameLower.includes('mittelstufe');
}

/**
 * Matches recurring weekly slots across weeks even if a Yoga class was renamed by teacher rules
 * (e.g. "Anfänger " vs "Anfänger Rückenstunde" vs "Anfänger Yin Yoga" vs "Pavanmukt Asana",
 * or "Mittelstufe" vs "Yoga Flow Mittelstufe").
 */
export function isMatchingWeeklySlot(a: Course, b: Course): boolean {
  if (!a || !b) return false;
  if (isBuffetOrIgnoredCourse(a) || isBuffetOrIgnoredCourse(b)) return false;
  if (isSpecialNonRecurringCourse(a) || isSpecialNonRecurringCourse(b)) return false;
  if (a.dayOfWeek !== b.dayOfWeek || a.startTime !== b.startTime) return false;

  const na = (a.name || '').trim().toLowerCase();
  const nb = (b.name || '').trim().toLowerCase();
  if (na === nb) return true;

  if (na.includes('einführung') !== nb.includes('einführung')) return false;
  if (na.includes('lachyoga') !== nb.includes('lachyoga')) return false;
  if (na.includes('puja') !== nb.includes('puja')) return false;
  if (na.includes('hausführung') !== nb.includes('hausführung')) return false;

  const aBeg = isBeginnerYogaCourse(na);
  const bBeg = isBeginnerYogaCourse(nb);
  const aInt = isIntermediateYogaCourse(na);
  const bInt = isIntermediateYogaCourse(nb);

  const aGemeinsam = na.includes('gemeinsame stunde');
  const bGemeinsam = nb.includes('gemeinsame stunde');
  if ((aGemeinsam && bBeg && a.roomId === b.roomId) || (bGemeinsam && aBeg && a.roomId === b.roomId)) {
    return true;
  }

  if (aBeg && bBeg && !aInt && !bInt) return true;
  if (aInt && bInt && !aBeg && !bBeg) return true;
  if (aBeg !== bBeg || aInt !== bInt) return false;

  const catA = getCourseCategory(a);
  const catB = getCourseCategory(b);
  if (catA === catB && catA !== 'Yogastunden' && catA !== 'Sonstiges') {
    return true;
  }

  return false;
}

export function normalizePhoneForWhatsApp(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '49' + cleaned.slice(1);
  }
  return cleaned;
}

export function buildWhatsAppDeepLink(phone: string, text: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

function sortCoursesChronologically(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.dayOfWeek] ?? 99) - (DAY_ORDER[b.dayOfWeek] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

function matchSingleTeacherByToken(tokenRaw: string, teachers: Teacher[]): Teacher[] {
  const token = (tokenRaw || '').trim();
  const lower = token.toLowerCase();
  if (!lower || lower === 'teacher-gen-yl' || PLACEHOLDER_TEACHER_NAMES.has(lower)) {
    return [];
  }

  // Handle combined Puja / team IDs used in Rapla
  if (lower === 'teacher-gen-mouniir-christopher') {
    return teachers.filter(
      t =>
        t.id === 'teacher-gen-mouniir-jaber' ||
        t.id === 'teacher-gen-christopher' ||
        t.name.toLowerCase() === 'mounir' ||
        t.name.toLowerCase() === 'christopher'
    );
  }
  if (lower === 'teacher-gen-burnie-narayani') {
    return teachers.filter(
      t =>
        t.id === 'teacher-gen-burnie-bansemer' ||
        t.id === 'teacher-gen-narayani-kedenburg' ||
        t.name.toLowerCase() === 'burnie' ||
        t.name.toLowerCase() === 'narayani'
    );
  }
  if (lower === 'teacher-gen-adam-anjali') {
    return teachers.filter(
      t =>
        t.id === 'teacher-gen-adam-zmuda' ||
        t.id === 'teacher-gen-anjali-gelzleichter' ||
        t.name.toLowerCase() === 'adam' ||
        t.name.toLowerCase() === 'anjali'
    );
  }

  // 1. Exact ID match
  const byId = teachers.find(t => t.id.toLowerCase() === lower);
  if (byId) return [byId];

  // 2. Exact name match (case-insensitive)
  const byName = teachers.find(t => t.name.trim().toLowerCase() === lower);
  if (byName) return [byName];

  // 3. First-name / alias match for Sevakas (e.g. "Alexander Melior" -> "Alexander", "Mouniir Jaber" -> "Mounir")
  const firstToken = lower.split(/\s+/)[0];
  const normalizedAlias = firstToken === 'mouniir' ? 'mounir' : firstToken;
  const sevakaMatch = teachers.find(
    t =>
      t.roleType === 'sevaka' &&
      (t.name.trim().toLowerCase() === normalizedAlias ||
        t.name.trim().toLowerCase().split(/\s+/)[0] === normalizedAlias)
  );
  if (sevakaMatch) return [sevakaMatch];

  return [];
}

/**
 * Resolves one or more Teacher objects from an ID string and/or display name string,
 * optionally synthesizing a lightweight fallback Teacher for custom guest names.
 */
export function resolveTeachersFromIdAndName(
  rawId: string | null | undefined,
  rawName: string | undefined,
  teachers: Teacher[],
  options: { preferIdOnly?: boolean; allowCustomFallback?: boolean } = {}
): Teacher[] {
  const resultMap = new Map<string, Teacher>();

  if (rawId && rawId !== 'teacher-gen-yl') {
    const idParts = rawId.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of idParts) {
      for (const matched of matchSingleTeacherByToken(part, teachers)) {
        resultMap.set(matched.id, matched);
      }
    }
  }

  // If course was AI-planned, course.teacherName might still hold a stale name from before AI planning;
  // only parse rawName when not restricted to ID-only (or when rawId matched nothing).
  if ((!options.preferIdOnly || resultMap.size === 0) && rawName && rawName.trim()) {
    const cleanRaw = rawName.trim();
    if (!PLACEHOLDER_TEACHER_NAMES.has(cleanRaw.toLowerCase())) {
      const nameParts = cleanRaw.split(/[,+/&]+/).map(s => s.trim()).filter(Boolean);
      // Only merge nameParts if rawName represents multiple co-teachers OR rawId didn't already resolve a different single teacher
      if (nameParts.length > 1 || resultMap.size === 0) {
        for (const part of nameParts) {
          const matchedList = matchSingleTeacherByToken(part, teachers);
          if (matchedList.length > 0) {
            for (const m of matchedList) {
              resultMap.set(m.id, m);
            }
          } else if (options.allowCustomFallback && !PLACEHOLDER_TEACHER_NAMES.has(part.toLowerCase())) {
            const customId =
              rawId && rawId.startsWith('teacher-custom-') && nameParts.length === 1
                ? rawId
                : `teacher-custom-${part.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            resultMap.set(customId, {
              id: customId,
              name: part,
              email: '',
              phone: '',
              avatarColor: 'from-amber-400 to-orange-500',
              specialties: [],
              roleType: 'external',
              rules: {
                preferredRooms: [],
                availability: []
              }
            });
          }
        }
      }
    }
  }

  return Array.from(resultMap.values());
}

/**
 * Resolves the agreed owner(s) of a fixed-agreement course (`isFixedAgreement === true`).
 */
export function resolveAgreedOwnersForCourse(course: Course, teachers: Teacher[]): Teacher[] {
  if (!course || !course.isFixedAgreement || course.fixedAgreementRemoved) return [];

  const hasExplicitAgreed =
    (course.agreedTeacherId && course.agreedTeacherId !== 'teacher-gen-yl') ||
    (course.agreedTeacherName && !PLACEHOLDER_TEACHER_NAMES.has(course.agreedTeacherName.trim().toLowerCase()));

  if (hasExplicitAgreed) {
    return resolveTeachersFromIdAndName(course.agreedTeacherId, course.agreedTeacherName, teachers);
  }
  return resolveTeachersFromIdAndName(course.teacherId, course.teacherName, teachers, {
    preferIdOnly: !!course.isAiPlanned
  });
}

/**
 * Resolves who is actually assigned to teach a course right now.
 */
export function resolveAssignedTeachersForCourse(
  course: Course | null | undefined,
  teachers: Teacher[],
  allowCustomFallback = false
): Teacher[] {
  if (!course || isBuffetOrIgnoredCourse(course)) return [];
  return resolveTeachersFromIdAndName(course.teacherId, course.teacherName, teachers, {
    preferIdOnly: !!course.isAiPlanned,
    allowCustomFallback
  });
}

export function getEffectiveAgreedTeacherId(course: Course): string | null {
  if (!course.isFixedAgreement || course.fixedAgreementRemoved) return null;
  if (course.agreedTeacherId && course.agreedTeacherId !== 'teacher-gen-yl') return course.agreedTeacherId;
  if (course.teacherId && course.teacherId !== 'teacher-gen-yl') return course.teacherId;
  return null;
}

/**
 * Collects canonical recurring fixed slots across all week plans (newest week plans first),
 * respecting slots that were explicitly unchecked (`fixedAgreementRemoved`).
 */
export function collectCanonicalFixedSlots(allPlans: WeekPlan[]): Course[] {
  if (!Array.isArray(allPlans) || allPlans.length === 0) return [];

  // Only consider active/modern plans (2026-W45+ and plan-template-1), never old pre-W45 weeks
  const eligiblePlans = allPlans.filter(
    p => p.id === 'plan-template-1' || (!!p.targetWeekCode && p.targetWeekCode >= '2026-W45')
  );

  const sortedPlans = [...eligiblePlans].sort((a, b) => {
    const aTime = a.lastEditedAt ? new Date(a.lastEditedAt).getTime() : 0;
    const bTime = b.lastEditedAt ? new Date(b.lastEditedAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    const aCode = a.targetWeekCode || '';
    const bCode = b.targetWeekCode || '';
    if (aCode !== bCode) return bCode.localeCompare(aCode);
    if (a.id === 'plan-template-1') return 1;
    if (b.id === 'plan-template-1') return -1;
    return 0;
  });

  const canonical: Course[] = [];
  const explicitlyRemoved: Course[] = [];

  for (const p of sortedPlans) {
    for (const c of p.courses || []) {
      if (isBuffetOrIgnoredCourse(c) || isSpecialNonRecurringCourse(c)) continue;
      if (c.fixedAgreementRemoved) {
        if (!explicitlyRemoved.some(r => isMatchingWeeklySlot(r, c))) {
          explicitlyRemoved.push(c);
        }
        continue;
      }
      if (c.isFixedAgreement) {
        const wasRemovedNewer = explicitlyRemoved.some(r => isMatchingWeeklySlot(r, c));
        const alreadyCollected = canonical.some(existing => isMatchingWeeklySlot(existing, c));
        if (!wasRemovedNewer && !alreadyCollected) {
          canonical.push({ ...c });
        }
      }
    }
  }

  return sortCoursesChronologically(canonical);
}

/**
 * Ensures a plan (`plan-template-1` or weeks >= `2026-W45`) carries canonical `isFixedAgreement`
 * metadata on matching slots without altering any assigned `teacherId`.
 */
export function syncCanonicalFixedSlotsToPlan(plan: WeekPlan | null | undefined, allPlans: WeekPlan[]): boolean {
  if (!plan || !Array.isArray(plan.courses)) return false;
  const appliesToPlan =
    plan.id === 'plan-template-1' || (!!plan.targetWeekCode && plan.targetWeekCode >= '2026-W45');
  if (!appliesToPlan) return false;

  const canonicalFixed = collectCanonicalFixedSlots(allPlans);
  if (canonicalFixed.length === 0) return false;

  let changed = false;

  for (const fixedTemplate of canonicalFixed) {
    const ownerId = fixedTemplate.agreedTeacherId || fixedTemplate.teacherId || null;
    const ownerName = fixedTemplate.agreedTeacherName || fixedTemplate.teacherName || undefined;
    if (!ownerId && !ownerName) continue;

    // Find best matching course in plan (prefer exact roomId match if multiple exist)
    const candidates = plan.courses.filter(c => isMatchingWeeklySlot(c, fixedTemplate));
    if (candidates.length === 0) continue;
    const target = candidates.find(c => c.roomId === fixedTemplate.roomId) || candidates[0];

    if (target.fixedAgreementRemoved) continue;

    if (!target.isFixedAgreement || (!target.agreedTeacherId && !target.agreedTeacherName)) {
      target.isFixedAgreement = true;
      target.agreedTeacherId = ownerId;
      target.agreedTeacherName = ownerName;
      if (fixedTemplate.agreementNotes && !target.agreementNotes) {
        target.agreementNotes = fixedTemplate.agreementNotes;
      }
      changed = true;
    }
  }

  return changed;
}

/**
 * Propagates a fixed agreement toggle/update to matching regular weekly slots across all plans
 * (including `plan-template-1` and upcoming weeks) using smart slot matching.
 */
export function propagateFixedAgreementAcrossPlans(updatedCourse: Course, currentPlanId: string): void {
  if (isSpecialNonRecurringCourse(updatedCourse) || isBuffetOrIgnoredCourse(updatedCourse)) {
    return;
  }
  const allPlans = db.getWeekPlans();
  const agreedOwnerId = updatedCourse.isFixedAgreement
    ? (updatedCourse.agreedTeacherId || updatedCourse.teacherId || null)
    : null;
  const agreedOwnerName = updatedCourse.isFixedAgreement
    ? (updatedCourse.agreedTeacherName || updatedCourse.teacherName || undefined)
    : undefined;

  let anyPlanChanged = false;
  const nowIso = new Date().toISOString();

  for (const plan of allPlans) {
    if (plan.id === currentPlanId) continue;
    // Do not retroactively mutate old historical weeks prior to 2026-W45 (except plan-template-1)
    if (plan.id !== 'plan-template-1' && plan.targetWeekCode && plan.targetWeekCode < '2026-W45') {
      continue;
    }

    const candidates = (plan.courses || []).filter(c => isMatchingWeeklySlot(c, updatedCourse));
    if (candidates.length === 0) continue;
    const target = candidates.find(c => c.roomId === updatedCourse.roomId) || candidates[0];

    if (updatedCourse.isFixedAgreement) {
      target.isFixedAgreement = true;
      target.fixedAgreementRemoved = false;
      target.agreedTeacherId = agreedOwnerId;
      target.agreedTeacherName = agreedOwnerName;
      if (updatedCourse.agreementNotes !== undefined) {
        target.agreementNotes = updatedCourse.agreementNotes;
      }
      anyPlanChanged = true;
    } else {
      if (target.isFixedAgreement || !target.fixedAgreementRemoved) {
        target.isFixedAgreement = false;
        target.fixedAgreementRemoved = true;
        target.agreedTeacherId = null;
        target.agreedTeacherName = undefined;
        target.lastEditedAt = nowIso;
        anyPlanChanged = true;
      }
    }
  }

  if (anyPlanChanged) {
    db.saveWeekPlans(allPlans);
  }
}

function getWeekHeaderMeta(plan: WeekPlan): { kwNumber: string; dateRangePart: string } {
  const weekCode = plan.targetWeekCode || '';
  const weekNumberMatch = weekCode.match(/-W(\d+)/);
  const kwNumber = weekNumberMatch ? parseInt(weekNumberMatch[1], 10).toString() : plan.name;

  let dateRangePart = '';
  if (weekCode && weekCode.includes('-W')) {
    const fri = getLocalDateForDay(weekCode, 5).split('-');
    const thu = getLocalDateForDay(weekCode, 4).split('-');
    if (fri.length === 3 && thu.length === 3) {
      dateRangePart = ` (${fri[2]}.${fri[1]}. – ${thu[2]}.${thu[1]}.)`;
    }
  }
  return { kwNumber, dateRangePart };
}

function formatCourseSlotForMessage(course: Course, rooms: Room[], includeEndTime = false): string {
  const dayFull = DAY_LABELS_FULL[course.dayOfWeek] || DAY_LABELS_SHORT[course.dayOfWeek] || 'Tag';
  const roomObj = rooms.find(r => r.id === course.roomId);
  const roomName = roomObj ? roomObj.name.split(' ')[0] : '';
  const roomPart = roomName ? ` (${roomName})` : '';
  const timePart = includeEndTime && course.endTime ? `${course.startTime}–${course.endTime}` : course.startTime;
  return `${dayFull}, ${timePart} Uhr – ${course.name.trim()}${roomPart}`;
}

function buildStandardWhatsAppEnvelope(
  teacherName: string,
  plan: WeekPlan,
  bulletLines: string[],
  changeCount?: number
): string {
  const { kwNumber, dateRangePart } = getWeekHeaderMeta(plan);
  const count = changeCount ?? bulletLines.length;
  const introLine =
    count === 1
      ? `folgende Stunde hat sich geändert bei der Kalenderwoche ${kwNumber}${dateRangePart}:`
      : `folgende Stunden haben sich geändert bei der Kalenderwoche ${kwNumber}${dateRangePart}:`;

  return [
    getSalutationForTeacher(teacherName),
    '',
    introLine,
    '',
    ...bulletLines,
    '',
    'Ist das okay für dich?',
    '',
    'Om Shanti, liebe Grüße,',
    'Mounir'
  ].join('\n');
}

export function buildWhatsAppDeviationMessage(
  teacher: Teacher,
  plan: WeekPlan,
  missingFixedSlots: MissingFixedSlotInfo[],
  rooms: Room[]
): string {
  const bulletLines: string[] = [];

  for (const m of missingFixedSlots) {
    if (m.swappedToCourse) {
      bulletLines.push(
        `• Statt deiner festen Stunde am ${formatCourseSlotForMessage(m.course, rooms)} bist du eingeteilt für: ${formatCourseSlotForMessage(m.swappedToCourse, rooms)}.`
      );
    } else {
      const subInfo = m.substituteName ? ` (übernimmt ${m.substituteName})` : '';
      bulletLines.push(
        `• Deine feste Stunde am ${formatCourseSlotForMessage(m.course, rooms)} entfällt für dich${subInfo}.`
      );
    }
  }

  return buildStandardWhatsAppEnvelope(teacher.name, plan, bulletLines, missingFixedSlots.length);
}

const ALL_CATEGORIES: CourseCategory[] = [
  'Geführte Meditation',
  'Yogastunden',
  'Satsang',
  'ONN',
  'Pranayama',
  'Sonstiges'
];

/**
 * MODE 1: Detects deviations from firmly agreed slots (`isFixedAgreement`) for a WeekPlan.
 * Used immediately upon initial week release ("Entwurf / Vorbereitung" -> "Genehmigt & Veröffentlicht")
 * and in the manual "📲 WhatsApp-Check" overview.
 *
 * Strictly checks ALL Sevakas (and any teacher with fixed agreements) and ONLY flags a person
 * when at least one of their firmly agreed slots deviates (not taught by them).
 * Regular variable weekly classes do NOT trigger false positives.
 */
export function detectDeviationsForPlan(
  plan: WeekPlan | null | undefined,
  teachers: Teacher[],
  rooms: Room[],
  allPlansOptional?: WeekPlan[]
): TeacherDeviation[] {
  if (!plan || !Array.isArray(plan.courses)) return [];

  const allPlans = allPlansOptional || db.getWeekPlans();
  const useCanonicalFallback =
    plan.id === 'plan-template-1' || (!!plan.targetWeekCode && plan.targetWeekCode >= '2026-W45');
  const canonicalFixed = useCanonicalFallback ? collectCanonicalFixedSlots(allPlans) : [];

  const validCourses = plan.courses.filter(c => !isBuffetOrIgnoredCourse(c));
  const deviations: TeacherDeviation[] = [];

  // Order Sevakas first so core team members always appear at the top, followed by any other teachers
  const orderedTeachers = [...teachers].sort((a, b) => {
    const aSev = a.roleType === 'sevaka' ? 0 : 1;
    const bSev = b.roleType === 'sevaka' ? 0 : 1;
    if (aSev !== bSev) return aSev - bSev;
    return a.name.localeCompare(b.name, 'de');
  });

  for (const teacher of orderedTeachers) {
    const firstLower = teacher.name.trim().toLowerCase().split(/\s+/)[0];
    if (EXCLUDED_FORMER_SEVAKAS.has(firstLower)) {
      continue;
    }

    // 1. Collect all fixed slots owned by this teacher in `plan.courses`
    const planFixedForTeacher: Course[] = validCourses.filter(c => {
      if (!c.isFixedAgreement || c.fixedAgreementRemoved) return false;
      const owners = resolveAgreedOwnersForCourse(c, teachers);
      return owners.some(o => o.id === teacher.id);
    });

    // 2. Also check canonical fixed slots (in case `plan` hasn't synced the flag yet or a fixed course was deleted from `plan`)
    const combinedFixed: Course[] = [...planFixedForTeacher];
    if (useCanonicalFallback) {
      for (const canonSlot of canonicalFixed) {
        const owners = resolveAgreedOwnersForCourse(canonSlot, teachers);
        if (!owners.some(o => o.id === teacher.id)) continue;

        const alreadyCovered = combinedFixed.some(cf => isMatchingWeeklySlot(cf, canonSlot));
        if (alreadyCovered) continue;

        const matchingInPlanCandidates = validCourses.filter(vc => isMatchingWeeklySlot(vc, canonSlot));
        const matchingInPlan =
          matchingInPlanCandidates.find(vc => vc.roomId === canonSlot.roomId) ||
          matchingInPlanCandidates[0];

        if (matchingInPlan) {
          if (!matchingInPlan.fixedAgreementRemoved) {
            combinedFixed.push(matchingInPlan);
          }
        } else if ((plan.deletedCourseIds || []).length > 0) {
          // Only treat a missing course from canonicalFixed as deleted if the user explicitly deleted courses in this plan
          // AND this teacher isn't already teaching another course at that exact day & startTime (e.g. Gemeinsame Stunde)
          const alreadyTeachingSameTime = validCourses.some(vc => {
            if (vc.dayOfWeek !== canonSlot.dayOfWeek || vc.startTime !== canonSlot.startTime) return false;
            return resolveAssignedTeachersForCourse(vc, teachers).some(a => a.id === teacher.id);
          });
          if (!alreadyTeachingSameTime) {
            combinedFixed.push({
              ...canonSlot,
              teacherId: null,
              teacherName: undefined
            });
          }
        }
      }
    }

    const fixedSlots = sortCoursesChronologically(combinedFixed);
    if (fixedSlots.length === 0) {
      continue;
    }

    // 3. Find all courses in this plan actually assigned to this teacher
    const actualSlots = sortCoursesChronologically(
      validCourses.filter(c => {
        const assigned = resolveAssignedTeachersForCourse(c, teachers);
        return assigned.some(a => a.id === teacher.id);
      })
    );

    const fixedIds = new Set(fixedSlots.map(c => c.id));

    // 4. Identify fixed slots where this teacher is NOT among the assigned teachers
    const missingFixedSlots: MissingFixedSlotInfo[] = [];
    const swappedCourseIds = new Set<string>();

    for (const fc of fixedSlots) {
      const assigned = resolveAssignedTeachersForCourse(fc, teachers, true);
      const isTaughtByOwner = assigned.some(a => a.id === teacher.id);
      if (isTaughtByOwner) continue;

      const subNames = assigned
        .filter(a => a.id !== teacher.id)
        .map(a => formatPersonDisplayName(a.name));
      const substituteName = subNames.length > 0 ? subNames.join(', ') : undefined;

      // Check if teacher was moved to a parallel non-fixed slot at the exact same day & startTime (e.g. Do 09:15 Anfänger <-> Mittelstufe)
      const parallelSwap = actualSlots.find(
        ac =>
          !fixedIds.has(ac.id) &&
          !swappedCourseIds.has(ac.id) &&
          ac.dayOfWeek === fc.dayOfWeek &&
          ac.startTime === fc.startTime
      );
      if (parallelSwap) {
        swappedCourseIds.add(parallelSwap.id);
      }

      missingFixedSlots.push({
        course: fc,
        substituteName,
        swappedToCourse: parallelSwap
      });
    }

    // STRICT FILTER: Only propose notification if >= 1 fixed slot actually deviated!
    if (missingFixedSlots.length === 0) {
      continue;
    }

    const extraSlots: Course[] = actualSlots.filter(c => swappedCourseIds.has(c.id));

    // Build UI summary badges strictly for the deviated fixed slots
    const uiChangeSummaries: ChangeUiSummary[] = missingFixedSlots.map(m => {
      const dayLabel = DAY_LABELS_FULL[m.course.dayOfWeek] || 'Tag';
      if (m.swappedToCourse) {
        return {
          kind: 'swap',
          text: `${dayLabel}, ${m.course.startTime} – ${m.swappedToCourse.name.trim()} statt fester Stunde ${m.course.name.trim()}`,
          badge: m.substituteName ? `${m.course.name.trim()} übernimmt ${m.substituteName}` : 'Slot-Tausch'
        };
      }
      return {
        kind: 'missing',
        text: `Fester Slot entfällt / Vertretung: ${dayLabel}, ${m.course.startTime} – ${m.course.name.trim()}`,
        badge: m.substituteName ? `übernommen von ${m.substituteName}` : 'unbesetzt'
      };
    });

    // Category breakdown strictly comparing fixed slots vs taught fixed/swapped slots
    const categoryBreakdown: CategoryDelta[] = [];
    const taughtFixedCountByCat = (cat: CourseCategory) =>
      fixedSlots.filter(fc => {
        if (getCourseCategory(fc) !== cat) return false;
        return !missingFixedSlots.some(m => m.course.id === fc.id && !m.swappedToCourse);
      }).length;

    for (const cat of ALL_CATEGORIES) {
      const soll = fixedSlots.filter(c => getCourseCategory(c) === cat).length;
      if (soll > 0) {
        const ist = taughtFixedCountByCat(cat);
        categoryBreakdown.push({
          category: cat,
          soll,
          ist,
          diff: ist - soll
        });
      }
    }

    const missingSig = missingFixedSlots
      .map(
        m =>
          `${m.course.dayOfWeek}-${m.course.startTime}-${m.course.name.trim()}-sub:${m.substituteName || 'none'}-swap:${m.swappedToCourse?.name.trim() || 'none'}`
      )
      .join('|');
    const signature = `FIXED_DEV::${missingSig}`;

    const logEntry = plan.whatsappNotifiedLog?.[teacher.id];
    const alreadyNotified = logEntry?.signature === signature;

    const messageText = buildWhatsAppDeviationMessage(teacher, plan, missingFixedSlots, rooms);

    deviations.push({
      teacher: { ...teacher, name: formatPersonDisplayName(teacher.name) },
      mode: 'fixed_deviation',
      fixedSlots,
      actualSlots,
      missingFixedSlots,
      extraSlots,
      categoryBreakdown,
      uiChangeSummaries,
      signature,
      alreadyNotified,
      lastNotifiedAt: logEntry?.timestamp,
      messageText
    });
  }

  return deviations;
}

/**
 * MODE 2: Builds targeted single-course WhatsApp notification proposals immediately after a manual
 * course edit, addition, or deletion in an ALREADY APPROVED & PUBLISHED week plan.
 *
 * Communicates ONLY the single changed hour (for removed teacher, newly assigned teacher,
 * or same teacher when time/day/room/title changed).
 */
export function buildManualEditProposals(
  plan: WeekPlan | null | undefined,
  prevCourse: Course | null | undefined,
  newCourse: Course | null | undefined,
  teachers: Teacher[],
  rooms: Room[]
): TeacherDeviation[] {
  if (!plan) return [];
  if (!prevCourse && !newCourse) return [];
  if (prevCourse && isBuffetOrIgnoredCourse(prevCourse) && (!newCourse || isBuffetOrIgnoredCourse(newCourse))) {
    return [];
  }

  const prevTeachers = prevCourse ? resolveAssignedTeachersForCourse(prevCourse, teachers, true) : [];
  const nextTeachers = newCourse ? resolveAssignedTeachersForCourse(newCourse, teachers, true) : [];

  const prevIds = new Set(prevTeachers.map(t => t.id));
  const nextIds = new Set(nextTeachers.map(t => t.id));

  const removedTeachers = prevTeachers.filter(t => !nextIds.has(t.id));
  const addedTeachers = nextTeachers.filter(t => !prevIds.has(t.id));
  const keptTeachers = nextTeachers.filter(t => prevIds.has(t.id));

  const scheduleDetailsChanged =
    !!prevCourse &&
    !!newCourse &&
    (prevCourse.dayOfWeek !== newCourse.dayOfWeek ||
      prevCourse.startTime !== newCourse.startTime ||
      prevCourse.endTime !== newCourse.endTime ||
      prevCourse.roomId !== newCourse.roomId ||
      prevCourse.name.trim() !== newCourse.name.trim());

  const proposals: TeacherDeviation[] = [];

  const shouldSkipPerson = (t: Teacher) => {
    const firstLower = t.name.trim().toLowerCase().split(/\s+/)[0];
    return EXCLUDED_FORMER_SEVAKAS.has(firstLower);
  };

  // 1. Teachers removed from this hour (or course was deleted)
  if (prevCourse) {
    const newAssignedLabel =
      nextTeachers.length > 0
        ? nextTeachers.map(t => formatPersonDisplayName(t.name)).join(', ')
        : undefined;
    const ownersOfPrev = resolveAgreedOwnersForCourse(prevCourse, teachers);

    for (const removed of removedTeachers) {
      if (shouldSkipPerson(removed)) continue;
      const wasFixedForRemoved = ownersOfPrev.some(o => o.id === removed.id);
      const stundeWord = wasFixedForRemoved ? 'Deine feste Stunde' : 'Deine Stunde';
      const subSuffix = newAssignedLabel ? ` (übernimmt ${newAssignedLabel})` : '';
      const bullet = `• ${stundeWord} am ${formatCourseSlotForMessage(prevCourse, rooms)} entfällt für dich${subSuffix}.`;

      const messageText = buildStandardWhatsAppEnvelope(removed.name, plan, [bullet], 1);
      const dayLabel = DAY_LABELS_FULL[prevCourse.dayOfWeek] || 'Tag';
      const signature = `MANUAL_REMOVED::${prevCourse.id}::${prevCourse.dayOfWeek}-${prevCourse.startTime}-${newAssignedLabel || 'none'}`;

      proposals.push({
        teacher: { ...removed, name: formatPersonDisplayName(removed.name) },
        mode: 'manual_edit',
        fixedSlots: [],
        actualSlots: [],
        missingFixedSlots: [{ course: prevCourse, substituteName: newAssignedLabel }],
        extraSlots: [],
        categoryBreakdown: [],
        uiChangeSummaries: [
          {
            kind: 'missing',
            text: `Stunde entfällt: ${dayLabel}, ${prevCourse.startTime} – ${prevCourse.name.trim()}`,
            badge: newCourse
              ? newAssignedLabel
                ? `übernimmt ${newAssignedLabel}`
                : 'jetzt unbesetzt'
              : 'Kurs gelöscht'
          }
        ],
        signature,
        alreadyNotified: false,
        messageText
      });
    }
  }

  // 2. Teachers newly assigned to this hour (reassignment or newly created course)
  if (newCourse) {
    const prevAssignedLabel =
      prevTeachers.length > 0
        ? prevTeachers.map(t => formatPersonDisplayName(t.name)).join(', ')
        : undefined;

    for (const added of addedTeachers) {
      if (shouldSkipPerson(added)) continue;
      const bullet = `• Du bist neu eingeteilt für: ${formatCourseSlotForMessage(newCourse, rooms)}.`;
      const messageText = buildStandardWhatsAppEnvelope(added.name, plan, [bullet], 1);
      const dayLabel = DAY_LABELS_FULL[newCourse.dayOfWeek] || 'Tag';
      const signature = `MANUAL_ADDED::${newCourse.id}::${newCourse.dayOfWeek}-${newCourse.startTime}-${newCourse.roomId}`;

      proposals.push({
        teacher: { ...added, name: formatPersonDisplayName(added.name) },
        mode: 'manual_edit',
        fixedSlots: [],
        actualSlots: [newCourse],
        missingFixedSlots: [],
        extraSlots: [newCourse],
        categoryBreakdown: [],
        uiChangeSummaries: [
          {
            kind: 'added',
            text: `Neu eingeteilt: ${dayLabel}, ${newCourse.startTime} – ${newCourse.name.trim()}`,
            badge: prevAssignedLabel ? `bisher ${prevAssignedLabel}` : 'neue Zuweisung'
          }
        ],
        signature,
        alreadyNotified: false,
        messageText
      });
    }
  }

  // 3. Same teacher stayed assigned, AND day, time, room, or course title changed
  if (prevCourse && newCourse && scheduleDetailsChanged) {
    for (const kept of keptTeachers) {
      if (shouldSkipPerson(kept)) continue;

      const onlyRoomChanged =
        prevCourse.dayOfWeek === newCourse.dayOfWeek &&
        prevCourse.startTime === newCourse.startTime &&
        prevCourse.endTime === newCourse.endTime &&
        prevCourse.name.trim() === newCourse.name.trim() &&
        prevCourse.roomId !== newCourse.roomId;

      let bullets: string[];
      if (onlyRoomChanged) {
        const oldRoom = rooms.find(r => r.id === prevCourse.roomId)?.name.split(' ')[0] || 'bisheriger Raum';
        const newRoom = rooms.find(r => r.id === newCourse.roomId)?.name.split(' ')[0] || 'neuer Raum';
        const dayFull = DAY_LABELS_FULL[newCourse.dayOfWeek] || 'Tag';
        bullets = [
          `• Raumänderung für deine Stunde am ${dayFull}, ${newCourse.startTime} Uhr – ${newCourse.name.trim()}: neu im Raum ${newRoom} (bisher ${oldRoom}).`
        ];
      } else {
        bullets = [
          `• Bisher: ${formatCourseSlotForMessage(prevCourse, rooms, true)}`,
          `• Neu: ${formatCourseSlotForMessage(newCourse, rooms, true)}`
        ];
      }

      const messageText = buildStandardWhatsAppEnvelope(kept.name, plan, bullets, 1);
      const signature = `MANUAL_MODIFIED::${newCourse.id}::${newCourse.dayOfWeek}-${newCourse.startTime}-${newCourse.endTime}-${newCourse.roomId}-${newCourse.name.trim()}`;

      proposals.push({
        teacher: { ...kept, name: formatPersonDisplayName(kept.name) },
        mode: 'manual_edit',
        fixedSlots: [],
        actualSlots: [newCourse],
        missingFixedSlots: [],
        extraSlots: [],
        categoryBreakdown: [],
        uiChangeSummaries: [
          {
            kind: 'modified',
            text: `Geändert auf: ${formatCourseSlotForMessage(newCourse, rooms, true)}`,
            badge: `bisher: ${DAY_LABELS_SHORT[prevCourse.dayOfWeek] || ''}, ${prevCourse.startTime}`
          }
        ],
        signature,
        alreadyNotified: false,
        messageText
      });
    }
  }

  return proposals;
}

export function markTeacherDeviationNotified(
  planId: string,
  teacherId: string,
  signature: string
): WeekPlan | undefined {
  const plan = db.getWeekPlan(planId);
  if (!plan) return undefined;
  if (!plan.whatsappNotifiedLog) {
    plan.whatsappNotifiedLog = {};
  }
  plan.whatsappNotifiedLog[teacherId] = {
    timestamp: new Date().toISOString(),
    signature
  };
  db.updateWeekPlan(plan);
  return plan;
}

export async function sendWhatsAppViaServerApi(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const config = getWhatsAppGatewayConfig();
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  if (!normalizedPhone) {
    return { success: false, error: 'Keine gültige Telefonnummer hinterlegt.' };
  }

  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalizedPhone,
        message,
        config
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Versand über API fehlgeschlagen.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Netzwerkfehler beim WhatsApp-Versand.' };
  }
}
