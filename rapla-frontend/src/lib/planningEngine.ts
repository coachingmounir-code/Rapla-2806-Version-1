import { db, type Teacher, type Course, type Room, type TimeSlot } from './db';

export interface ConflictMessage {
  type: 'hard' | 'soft'; // hard = invalid assignment, soft = warning/preference
  message: string;
}

// Convert "HH:MM" string to minutes from start of day
export function timeToMinutes(timeStr: string): number {
  const [hrs, mins] = timeStr.split(':').map(Number);
  return hrs * 60 + mins;
}

// Check if two time ranges overlap
export function isOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// Convert ISO week code (e.g. "2026-W28") to actual date string for a specific day of the week
export function getLocalDateForDay(weekCode: string, dayOfWeek: number): string {
  const [yearStr, weekStr] = weekCode.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Jan 4 is always in week 1
  const jan4 = new Date(year, 0, 4);
  const daysToMonday = jan4.getDay() === 0 ? 6 : jan4.getDay() - 1;
  const mondayOfW1 = new Date(jan4.getTime());
  mondayOfW1.setDate(jan4.getDate() - daysToMonday);

  // Monday of target week
  const targetMonday = new Date(mondayOfW1.getTime());
  targetMonday.setDate(mondayOfW1.getDate() + (week - 1) * 7);

  // Friday of target week (Monday - 3)
  const targetFriday = new Date(targetMonday.getTime());
  targetFriday.setDate(targetMonday.getDate() - 3);

  // Offset from Friday
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
  return `${yyyy}-${mm}-${dd}`;
}

// Validate a single assignment and return all conflict messages
export function validateAssignment(
  teacher: Teacher,
  course: Course,
  allCourses: Course[],
  seminarLeaderIds: string[] = [],
  targetWeekCode?: string
): ConflictMessage[] {
  const conflicts: ConflictMessage[] = [];

  // 0a. Check active Sevafrei / Abwesenheiten (Hard)
  if (typeof window !== 'undefined' && targetWeekCode) {
    try {
      const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
      const saved = localStorage.getItem('rapla_sevafrei');
      if (saved) {
        const sevafreiList = JSON.parse(saved);
        const activeAbsence = sevafreiList.find((entry: any) =>
          entry.teacherId === teacher.id &&
          courseDate >= entry.startDate &&
          courseDate <= entry.endDate
        );
        if (activeAbsence) {
          conflicts.push({
            type: 'hard',
            message: `${teacher.name} ist an diesem Datum (${courseDate}) abwesend (${activeAbsence.type}: ${activeAbsence.note || 'Keine Angabe'}).`
          });
        }
      }
    } catch (e) {
      console.error('Error during Sevafrei validation', e);
    }
  }

  // 0c. Custom rules for Harishakti (Rezi and Yoga classes coordination)
  if (teacher.name.toLowerCase().includes('harishakti')) {
    const day = course.dayOfWeek;
    const courseStart = timeToMinutes(course.startTime);
    
    if (day === 1) { // Montag
      // Yoga in the morning OR afternoon, not both!
      const otherMondayAssignments = allCourses.filter(
        c => c.teacherId === teacher.id && c.id !== course.id && c.dayOfWeek === 1
      );
      if (otherMondayAssignments.length > 0) {
        conflicts.push({
          type: 'hard',
          message: `Harishakti darf am Montag nur entweder vormittags ODER nachmittags Yoga unterrichten (nicht beides).`
        });
      }
    } else if (day === 2) { // Dienstag
      // Tuesday morning only, afternoon no services
      if (courseStart >= timeToMinutes('12:00')) {
        conflicts.push({
          type: 'hard',
          message: `Harishakti hat am Dienstag ab 12 Uhr Rezeption und danach Buchungsarbeiten (nachmittags keine Dienste).`
        });
      }
    } else if (day === 3) { // Mittwoch
      // Mittwoch is completely free!
      conflicts.push({
        type: 'hard',
        message: `Mittwoch ist Harishaktis freier Wochentag.`
      });
    } else if (day === 4) { // Donnerstag
      // Donnerstag unavailable for Yoga
      conflicts.push({
        type: 'hard',
        message: `Harishakti ist am Donnerstag nicht für Yogastunden verfügbar (vormittags frei, 12 Uhr Sevakarunde, nachmittags Buchungen, ab 18:45 Uhr Spätrezeption).`
      });
    } else if (day === 5) { // Freitag
      // Friday morning Yoga ONLY if Melanie is on duty on Friday
      if (courseStart < timeToMinutes('12:00')) {
        const melanieActiveOnFriday = allCourses.some(c => {
          if (c.dayOfWeek !== 5 || !c.teacherId) return false;
          const t = db.getTeachers().find(x => x.id === c.teacherId);
          return t && t.name.toLowerCase().includes('melanie');
        });
        if (!melanieActiveOnFriday) {
          conflicts.push({
            type: 'hard',
            message: `Harishakti darf am Freitag Vormittag nur unterrichten, wenn Melanie im Dienst ist.`
          });
        }
      } else {
        // Afternoon/evening has Telefondienst and Spätrezeption
        conflicts.push({
          type: 'hard',
          message: `Harishakti hat am Freitag ab 16 Uhr Telefondienst und danach Spätrezeption (nachmittags/abends kein Yoga).`
        });
      }
    }
  }

  // 0d. Custom rules for Karuna (Seminarhausleitung)
  if (teacher.name.toLowerCase().includes('karuna')) {
    const day = course.dayOfWeek;
    const isYogaClass = course.style.toLowerCase() !== 'meditation';

    // Rule: Ruhetag Montag (absolute Planungssperre für alle Programme)
    if (day === 1) {
      conflicts.push({
        type: 'hard',
        message: `Montag ist Karunas wöchentlicher Ruhetag. Es gilt eine absolute Planungssperre.`
      });
    }

    // Rule: Tagesmaximum 1 Yogastunde (ausnahmslos)
    if (isYogaClass) {
      const otherYogaClassesOnDay = allCourses.filter(
        c => c.teacherId === teacher.id && c.id !== course.id && c.dayOfWeek === day && c.style.toLowerCase() !== 'meditation'
      );
      if (otherYogaClassesOnDay.length >= 1) {
        conflicts.push({
          type: 'hard',
          message: `Karuna darf maximal 1 Yogastunde pro Tag unterrichten (Tageslimit überschritten).`
        });
      }
      
      // Rule: Wochenmaximum 3 Yogastunden insgesamt (Satsänge zählen separat und werden darüber hinaus eingeplant)
      const weeklyYogaClasses = allCourses.filter(
        c => c.teacherId === teacher.id && c.id !== course.id && c.style.toLowerCase() !== 'meditation'
      );
      if (weeklyYogaClasses.length >= 3) {
        conflicts.push({
          type: 'hard',
          message: `Karuna darf maximal 3 Yogastunden pro Woche unterrichten (Wochenlimit von 3 Yogastunden überschritten).`
        });
      }
    }
  }

  // 0. Check if active Yoga Teacher (Soft)
  if (teacher.isYogaTeacher === false) {
    conflicts.push({
      type: 'soft',
      message: `${teacher.name} ist nicht als aktiver Yogalehrer markiert (z. B. Seminarleiter).`
    });
  }

  // 0b. Check if external seminar-only teacher is conducting a seminar this week
  if (teacher.availabilityMode === 'seminar_only' && !seminarLeaderIds.includes(teacher.id)) {
    conflicts.push({
      type: 'soft',
      message: `${teacher.name} ist als externer Seminarleiter markiert, leitet aber in dieser Woche kein Seminar.`
    });
  }
  
  // 1. Check Specialty (Hard) & Meditation/Satsang Qualifications
  const isMeditationCourse = course.name === 'Gef. Meditation';
  const isSatsangCourse = course.name === 'Satsang';

  if (isMeditationCourse) {
    if (!teacher.rules.canLeadMeditation) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist nicht für geführte Meditationen qualifiziert.`
      });
    }
  } else if (isSatsangCourse) {
    if (!teacher.rules.canLeadSatsang) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist nicht für Satsang-Leitungen qualifiziert.`
      });
    }
  } else {
    const isQualified = teacher.specialties.some(
      spec => spec.toLowerCase() === course.style.toLowerCase()
    );
    if (!isQualified) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat keine Spezialisierung für den Yoga-Stil "${course.style}".`
      });
    }
  }

  // 2. Check Availability (Hard)
  const courseStart = timeToMinutes(course.startTime);
  const courseEnd = timeToMinutes(course.endTime);
  const daySlots = teacher.rules.availability.filter(slot => slot.day === course.dayOfWeek);
  
  const fitsAvailability = daySlots.some(slot => {
    const availStart = timeToMinutes(slot.start);
    const availEnd = timeToMinutes(slot.end);
    return courseStart >= availStart && courseEnd <= availEnd;
  });

  if (!fitsAvailability) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} ist am gewählten Wochentag zur Kurszeit (${course.startTime} - ${course.endTime}) laut Arbeitszeiten nicht verfügbar.`
    });
  }

  // 3. Check Overlapping Classes (Hard)
  const otherAssignments = allCourses.filter(
    c => c.teacherId === teacher.id && c.id !== course.id && c.dayOfWeek === course.dayOfWeek
  );

  const hasOverlap = otherAssignments.some(other =>
    isOverlapping(course.startTime, course.endTime, other.startTime, other.endTime)
  );

  if (hasOverlap) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} hat zur gleichen Zeit bereits eine andere Klasse zugeteilt.`
    });
  }

  // 4. Check Buffer / Rest Time (Hard)
  const restTime = teacher.rules.minRestTime;
  if (restTime > 0) {
    const hasBufferConflict = otherAssignments.some(other => {
      const c1Start = timeToMinutes(course.startTime);
      const c1End = timeToMinutes(course.endTime);
      const c2Start = timeToMinutes(other.startTime);
      const c2End = timeToMinutes(other.endTime);
      
      // Calculate gap between them
      let gap = 0;
      if (c1Start >= c2End) {
        gap = c1Start - c2End;
      } else if (c2Start >= c1End) {
        gap = c2Start - c1End;
      } else {
        return true; // overlapping, handled above but also counts as buffer conflict
      }
      return gap < restTime;
    });

    if (hasBufferConflict) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} benötigt zwischen den Kursen eine Mindestpause von ${restTime} Minuten.`
      });
    }
  }

  // 5. Check Daily Class Limit (Hard)
  const classesOnDay = otherAssignments.length + 1; // plus the current one
  if (classesOnDay > teacher.rules.maxClassesPerDay) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} überschreitet das Tageslimit von ${teacher.rules.maxClassesPerDay} Einheiten.`
    });
  }

  // 6. Check Weekly Hours Limit (Soft/Hard depending on preferences, here we treat as Hard to be thorough)
  const courseDurationMins = timeToMinutes(course.endTime) - timeToMinutes(course.startTime);
  const weeklyDurationMins = allCourses
    .filter(c => c.teacherId === teacher.id && c.id !== course.id)
    .reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)), 0) + courseDurationMins;
  
  const weeklyHours = weeklyDurationMins / 60;
  if (weeklyHours > teacher.rules.maxHoursPerWeek) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} überschreitet die wöchentliche maximale Arbeitszeit von ${teacher.rules.maxHoursPerWeek} Std. (Geplant: ${weeklyHours.toFixed(1)} Std.).`
    });
  }

  // 7. Check Room Preference (Soft)
  if (teacher.rules.preferredRooms.length > 0) {
    const isPreferredRoom = teacher.rules.preferredRooms.includes(course.roomId);
    if (!isPreferredRoom) {
      conflicts.push({
        type: 'soft',
        message: `${teacher.name} unterrichtet bevorzugt in anderen Räumen.`
      });
    }
  }

  return conflicts;
}

// Check validation for all courses in a list and return a map of courseId -> conflicts
export function validateAllCourses(
  courses: Course[],
  teachers: Teacher[],
  seminarLeaderIds: string[] = [],
  targetWeekCode?: string
): Record<string, ConflictMessage[]> {
  const validationMap: Record<string, ConflictMessage[]> = {};
  
  courses.forEach(course => {
    if (!course.teacherId) {
      validationMap[course.id] = [];
      return;
    }
    const teacher = teachers.find(t => t.id === course.teacherId);
    if (!teacher) {
      validationMap[course.id] = [];
      return;
    }
    validationMap[course.id] = validateAssignment(teacher, course, courses, seminarLeaderIds, targetWeekCode);
  });
  
  return validationMap;
}

// AI Pre-planning Core Heuristic Engine
export function runAiPlanning(
  courses: Course[],
  teachers: Teacher[],
  seminarLeaderIds: string[] = [],
  targetWeekCode?: string
): {
  plannedCourses: Course[];
  logs: string[];
} {
  const logs: string[] = [];
  logs.push('Starte automatischen KI-Planungsalgorithmus...');
  
  // Only plan with Sevakas (Kernteam) that are active yoga teachers
  const yogaTeachers = teachers.filter(t => 
    t.roleType === 'sevaka' && 
    t.isYogaTeacher !== false
  );
  logs.push(`Berücksichtige ${yogaTeachers.length} Sevakas (Kernteam) für die KI-Vorplanung.`);
  
  // Clone courses to avoid modifying original array until approved
  let workingCourses = courses.map(c => ({ ...c }));
  
  // Sort courses by "difficulty" - first those in studios with few teacher options, then by length or early times
  const coursesToPlan = workingCourses.filter(c => c.teacherId === null || c.isAiPlanned);
  
  logs.push(`${coursesToPlan.length} Kurse müssen verplant werden.`);
  
  // Clear existing AI planning tags
  coursesToPlan.forEach(c => {
    c.teacherId = null;
    c.isAiPlanned = false;
  });

  // Plan course by course
  for (const course of coursesToPlan) {
    logs.push(`Analysiere Eignung für Kurs: "${course.name}" (${course.startTime} - ${course.endTime}, ${course.style})`);
    
    interface TeacherScore {
      teacher: Teacher;
      score: number;
      conflicts: ConflictMessage[];
    }
    
    const candidateScores: TeacherScore[] = [];

    // Score every teacher
    for (const teacher of yogaTeachers) {
      // Get conflicts for assigning this teacher to this course in the current layout
      const conflicts = validateAssignment(teacher, course, workingCourses, seminarLeaderIds, targetWeekCode);
      
      const hardConflicts = conflicts.filter(c => c.type === 'hard');
      const softConflicts = conflicts.filter(c => c.type === 'soft');
      
      if (hardConflicts.length > 0) {
        // Teacher has hard conflicts, skip them or give them negative/zero scoring
        continue;
      }
      
      // Calculate score base (starts at 100)
      let score = 100;
      
      // Preferred room bonus
      const prefersRoom = teacher.rules.preferredRooms.includes(course.roomId);
      if (prefersRoom) {
        score += 30; // prefer room match
      }

      // Prioritized day bonus
      const preferredDays = teacher.rules.preferredDays || [];
      if (preferredDays.includes(course.dayOfWeek)) {
        score += 50; // Give a large bonus to prioritize this teacher for courses on this day!
      }
      
      // Preference: distribute hours evenly (favour teachers with fewer planned hours)
      const plannedHours = workingCourses
        .filter(c => c.teacherId === teacher.id)
        .reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
      
      const capacityRatio = plannedHours / teacher.rules.maxHoursPerWeek;
      score -= capacityRatio * 50; // deduct points if close to max capacity to encourage balance
      
      // Custom scoring rules for Karuna (Seminarhausleitung)
      if (teacher.name.toLowerCase().includes('karuna')) {
        const isYogaClass = course.style.toLowerCase() !== 'meditation';

        // 1. Satsang Wednesday to Sunday: Standard & high priority
        if (course.name === 'Satsang' && [3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
          score += 1000;
        }

        // 2. Ankommensyogastunden (Friday and Sunday at 16:30, Hatha style/Mittelstufe name)
        const isAnkommYoga = isYogaClass &&
                             course.name === 'Mittelstufe' &&
                             (course.dayOfWeek === 5 || course.dayOfWeek === 0) &&
                             course.startTime === '16:30';
        if (isAnkommYoga) {
          score += 1000;
        }

        // 3. Saturday Yoga class: Emergency backup option ONLY
        if (isYogaClass && course.dayOfWeek === 6) {
          score -= 500;
        }

        // 4. Other Yoga classes on normal weekdays: Penalize slightly to avoid preempting other teachers
        if (isYogaClass && !isAnkommYoga && course.dayOfWeek !== 6) {
          score -= 200;
        }
      }
      
      candidateScores.push({
        teacher,
        score,
        conflicts: softConflicts
      });
    }

    // Sort candidates by score descending
    candidateScores.sort((a, b) => b.score - a.score);

    if (candidateScores.length > 0) {
      const bestCandidate = candidateScores[0];
      const index = workingCourses.findIndex(c => c.id === course.id);
      if (index !== -1) {
        workingCourses[index].teacherId = bestCandidate.teacher.id;
        workingCourses[index].isAiPlanned = true;
        
        logs.push(`✓ Zuweisung erfolgreich: ${bestCandidate.teacher.name} (Score: ${bestCandidate.score.toFixed(0)})`);
        if (bestCandidate.conflicts.length > 0) {
          logs.push(`  Hinweis: ${bestCandidate.conflicts[0].message}`);
        }
      }
    } else {
      logs.push(`⚠️ Kein passender Yogalehrer ohne harte Konflikte für "${course.name}" gefunden.`);
    }
  }

  const assignedCount = workingCourses.filter(c => c.teacherId !== null && c.isAiPlanned).length;
  logs.push(`Planung abgeschlossen. ${assignedCount} von ${coursesToPlan.length} Kursen wurden erfolgreich zugewiesen.`);
  
  return {
    plannedCourses: workingCourses,
    logs
  };
}
