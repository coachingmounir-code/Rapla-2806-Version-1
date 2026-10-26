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
}

export interface TeacherDeviation {
  teacher: Teacher;
  fixedSlots: Course[];
  actualSlots: Course[];
  missingFixedSlots: MissingFixedSlotInfo[];
  extraSlots: Course[];
  categoryBreakdown: CategoryDelta[];
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
    name.includes('mittelstufe') ||
    name.includes('ankommensstunde') ||
    name.includes('gemeinsame stunde') ||
    name.includes('hatha') ||
    name.includes('vinyasa') ||
    name.includes('yin') ||
    name.includes('rücken') ||
    (style === 'hatha' || style === 'vinyasa' || style === 'yin' || style === 'power yoga' || style === 'kundalini')
  ) {
    if (!name.includes('lachyoga') && !name.includes('schulung') && !style.includes('schulung')) {
      return 'Yogastunden';
    }
  }
  return 'Sonstiges';
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

function formatCourseLine(course: Course, rooms: Room[], suffix = ''): string {
  const dayLabel = DAY_LABELS_SHORT[course.dayOfWeek] || 'Tag';
  const roomObj = rooms.find(r => r.id === course.roomId);
  const roomName = roomObj ? roomObj.name.split(' ')[0] : '';
  const roomPart = roomName ? ` (${roomName})` : '';
  return `• ${dayLabel}, ${course.startTime} Uhr – ${course.name}${roomPart}${suffix}`;
}

export function getEffectiveAgreedTeacherId(course: Course): string | null {
  if (!course.isFixedAgreement) return null;
  if (course.agreedTeacherId) return course.agreedTeacherId;
  if (course.teacherId && course.teacherId !== 'teacher-gen-yl') return course.teacherId;
  return null;
}

/**
 * Propagates a fixed agreement toggle/update to matching regular weekly slots across plans
 * so that once a Sevaka's fixed slots are marked as "Fest vereinbart", other weeks know the owner too.
 */
export function propagateFixedAgreementAcrossPlans(updatedCourse: Course, currentPlanId: string): void {
  if ((updatedCourse.id || '').includes('-tdot-') || (updatedCourse.id || '').includes('-schulung-')) {
    return;
  }
  const allPlans = db.getWeekPlans();
  const category = getCourseCategory(updatedCourse);
  const agreedOwnerId = updatedCourse.isFixedAgreement
    ? (updatedCourse.agreedTeacherId || updatedCourse.teacherId || null)
    : null;
  const agreedOwnerName = updatedCourse.isFixedAgreement
    ? (updatedCourse.agreedTeacherName || updatedCourse.teacherName || undefined)
    : undefined;

  let anyPlanChanged = false;

  for (const plan of allPlans) {
    if (plan.id === currentPlanId) continue;
    for (const c of plan.courses || []) {
      if ((c.id || '').includes('-tdot-') || (c.id || '').includes('-schulung-')) continue;
      if (c.dayOfWeek === updatedCourse.dayOfWeek && c.startTime === updatedCourse.startTime) {
        const cCat = getCourseCategory(c);
        const sameSlotType =
          cCat === category &&
          (c.name.trim().toLowerCase() === updatedCourse.name.trim().toLowerCase() || cCat !== 'Yogastunden');
        if (!sameSlotType) continue;

        if (updatedCourse.isFixedAgreement) {
          if (!c.isFixedAgreement || !c.agreedTeacherId) {
            c.isFixedAgreement = true;
            c.agreedTeacherId = agreedOwnerId;
            c.agreedTeacherName = agreedOwnerName;
            if (updatedCourse.agreementNotes && !c.agreementNotes) {
              c.agreementNotes = updatedCourse.agreementNotes;
            }
            anyPlanChanged = true;
          }
        } else {
          const prevOwner = c.agreedTeacherId || c.teacherId;
          const targetPrevOwner = updatedCourse.agreedTeacherId || updatedCourse.teacherId;
          if (c.isFixedAgreement && (!targetPrevOwner || prevOwner === targetPrevOwner)) {
            c.isFixedAgreement = false;
            c.agreedTeacherId = null;
            c.agreedTeacherName = undefined;
            anyPlanChanged = true;
          }
        }
      }
    }
  }

  if (anyPlanChanged) {
    db.saveWeekPlans(allPlans);
  }
}

export function buildWhatsAppDeviationMessage(
  teacher: Teacher,
  plan: WeekPlan,
  fixedSlots: Course[],
  actualSlots: Course[],
  missingFixedSlots: MissingFixedSlotInfo[],
  extraSlots: Course[],
  categoryBreakdown: CategoryDelta[],
  rooms: Room[]
): string {
  const weekCode = plan.targetWeekCode || '';
  const weekNumberMatch = weekCode.match(/-W(\d+)/);
  const kwLabel = weekNumberMatch ? `KW ${parseInt(weekNumberMatch[1], 10)}` : plan.name;

  let dateRangePart = '';
  if (weekCode && weekCode.includes('-W')) {
    const fri = getLocalDateForDay(weekCode, 5).split('-');
    const thu = getLocalDateForDay(weekCode, 4).split('-');
    if (fri.length === 3 && thu.length === 3) {
      dateRangePart = ` (${fri[2]}.${fri[1]}. – ${thu[2]}.${thu[1]}.)`;
    }
  }

  const lines: string[] = [];
  lines.push(`Namaste ${teacher.name} 🙏,`);
  lines.push(
    `im genehmigten Wochenplan für *${kwLabel}${dateRangePart}* gibt es eine Abweichung von deinen fest vereinbarten Slots:`
  );
  lines.push('');

  lines.push('📊 *Dein Überblick (Soll → Ist):*');
  for (const item of categoryBreakdown) {
    let statusNote = '✅ wie vereinbart';
    if (item.diff > 0) {
      statusNote = `⚡ +${item.diff} zusätzlich`;
    } else if (item.diff < 0) {
      statusNote = `⚠️ ${Math.abs(item.diff)} weniger`;
    } else {
      // Same count, check if slots in this category were swapped
      const missingInCat = missingFixedSlots.some(m => getCourseCategory(m.course) === item.category);
      const extraInCat = extraSlots.some(e => getCourseCategory(e) === item.category);
      if (missingInCat || extraInCat) {
        statusNote = '🔄 zeitlich verschoben';
      }
    }
    lines.push(`• ${item.category}: ${item.soll} → ${item.ist} (${statusNote})`);
  }

  if (missingFixedSlots.length > 0 || extraSlots.length > 0) {
    lines.push('');
    lines.push('🔄 *Details zur Abweichung:*');
    for (const m of missingFixedSlots) {
      const subInfo = m.substituteName ? ` [Vertretung: ${m.substituteName}]` : ' [entfällt / anderweitig vergeben]';
      lines.push(formatCourseLine(m.course, rooms, ` ❌${subInfo}`));
    }
    for (const e of extraSlots) {
      lines.push(formatCourseLine(e, rooms, ' ➕ [NEU eingeteilt]'));
    }
  }

  const sortedActual = sortCoursesChronologically(actualSlots);
  lines.push('');
  if (sortedActual.length === 0) {
    lines.push(`📅 *Deine Einteilung in ${kwLabel}:*`);
    lines.push('• Keine Slots in dieser Woche eingeteilt.');
  } else {
    lines.push(`📅 *Alle deine Termine in ${kwLabel} (${sortedActual.length}):*`);
    const extraIds = new Set(extraSlots.map(e => e.id));
    for (const c of sortedActual) {
      const tag = extraIds.has(c.id) ? ' *(+ neu)*' : ' *(fest)*';
      lines.push(formatCourseLine(c, rooms, tag));
    }
  }

  const cfg = getWhatsAppGatewayConfig();
  const origin =
    cfg.baseAppUrl?.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  if (origin) {
    const cleanOrigin = origin.replace(/\/+$/, '');
    const planLink = `${cleanOrigin}/wochenplan?teacher=${encodeURIComponent(teacher.name)}&onlyMySlots=true`;
    lines.push('');
    lines.push(`👉 *Dein Wochenplan:* ${planLink}`);
  }

  return lines.join('\n');
}

const ALL_CATEGORIES: CourseCategory[] = [
  'Geführte Meditation',
  'Yogastunden',
  'Satsang',
  'ONN',
  'Pranayama',
  'Sonstiges'
];

export function detectDeviationsForPlan(
  plan: WeekPlan | null | undefined,
  teachers: Teacher[],
  rooms: Room[]
): TeacherDeviation[] {
  if (!plan || !Array.isArray(plan.courses)) return [];

  const validCourses = plan.courses.filter(c => !isBuffetOrIgnoredCourse(c));
  const deviations: TeacherDeviation[] = [];

  for (const teacher of teachers) {
    // 1. Find all courses in this plan that are marked as "Fest vereinbart" for this teacher
    const fixedSlots = sortCoursesChronologically(
      validCourses.filter(c => {
        if (!c.isFixedAgreement) return false;
        const ownerId = getEffectiveAgreedTeacherId(c);
        return ownerId === teacher.id;
      })
    );

    // Only check teachers who actually have at least 1 fixed slot marked
    if (fixedSlots.length === 0) {
      continue;
    }

    // 2. Find all courses in this plan actually assigned to this teacher
    const actualSlots = sortCoursesChronologically(
      validCourses.filter(c => c.teacherId === teacher.id)
    );

    const fixedIds = new Set(fixedSlots.map(c => c.id));

    // 3. Identify fixed slots where this teacher is NOT assigned anymore
    const missingFixedSlots: MissingFixedSlotInfo[] = fixedSlots
      .filter(c => c.teacherId !== teacher.id)
      .map(c => {
        let substituteName: string | undefined;
        if (c.teacherId && c.teacherId !== 'teacher-gen-yl') {
          const subTeacher = teachers.find(t => t.id === c.teacherId);
          substituteName = subTeacher?.name || c.teacherName;
        } else if (c.teacherName && c.teacherName !== '! YL #' && c.teacherName !== 'Offen') {
          substituteName = c.teacherName;
        }
        return { course: c, substituteName };
      });

    // 4. Identify extra slots assigned to this teacher that are NOT part of their fixed slots
    const extraSlots: Course[] = actualSlots.filter(c => !fixedIds.has(c.id));

    // 5. If neither missing nor extra slots exist, there is NO deviation
    if (missingFixedSlots.length === 0 && extraSlots.length === 0) {
      continue;
    }

    // 6. Build category breakdown (Soll vs. Ist)
    const categoryBreakdown: CategoryDelta[] = [];
    for (const cat of ALL_CATEGORIES) {
      const soll = fixedSlots.filter(c => getCourseCategory(c) === cat).length;
      const ist = actualSlots.filter(c => getCourseCategory(c) === cat).length;
      if (soll > 0 || ist > 0) {
        categoryBreakdown.push({
          category: cat,
          soll,
          ist,
          diff: ist - soll
        });
      }
    }

    // 7. Compute deterministic signature for deduplication
    const fixedSig = fixedSlots.map(c => `${c.dayOfWeek}-${c.startTime}-${c.name}-${c.teacherId || 'none'}`).join('|');
    const actualSig = actualSlots.map(c => `${c.dayOfWeek}-${c.startTime}-${c.name}`).join('|');
    const signature = `F:[${fixedSig}]::A:[${actualSig}]`;

    const logEntry = plan.whatsappNotifiedLog?.[teacher.id];
    const alreadyNotified = logEntry?.signature === signature;

    const messageText = buildWhatsAppDeviationMessage(
      teacher,
      plan,
      fixedSlots,
      actualSlots,
      missingFixedSlots,
      extraSlots,
      categoryBreakdown,
      rooms
    );

    deviations.push({
      teacher,
      fixedSlots,
      actualSlots,
      missingFixedSlots,
      extraSlots,
      categoryBreakdown,
      signature,
      alreadyNotified,
      lastNotifiedAt: logEntry?.timestamp,
      messageText
    });
  }

  return deviations;
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
