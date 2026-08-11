import { db, type Teacher, type Course, type Room, type TimeSlot } from './db';
import wochenplanRules from './data/wochenplan_rules.json' with { type: 'json' };

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

export function getDayName(day: number): string {
  const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return dayNames[day] || '';
}

export function getAbsenceDetails(teacherName: string, dayOfWeek: number, targetWeekCode?: string, absences?: any[]): any | null {
  if (!targetWeekCode) return null;
  const courseDate = getLocalDateForDay(targetWeekCode, dayOfWeek);
  
  if (absences && absences.length > 0) {
    const entry = absences.find((entry: any) => {
      if (!entry) return false;
      const entryName = entry.teacherName.toLowerCase().trim();
      const isMatch = entryName.includes(teacherName) || teacherName.includes(entryName.split(' ')[0]);
      return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
    });
    if (entry) return entry;
  }
  
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('rapla_sevafrei');
      if (saved) {
        const sevafreiList = JSON.parse(saved);
        const entry = sevafreiList.find((entry: any) => {
          if (!entry) return false;
          const entryName = entry.teacherName.toLowerCase().trim();
          const isMatch = entryName.includes(teacherName) || teacherName.includes(entryName.split(' ')[0]);
          return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
        });
        if (entry) return entry;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return null;
}

export function isTeacherAbsent(teacherName: string, dayOfWeek: number, targetWeekCode?: string, absences?: any[]): boolean {
  return getAbsenceDetails(teacherName, dayOfWeek, targetWeekCode, absences) !== null;
}

// Validate a single assignment and return all conflict messages
export function validateAssignment(
  teacher: Teacher,
  course: Course,
  allCourses: Course[],
  seminarLeaderIds: string[] = [],
  targetWeekCode?: string,
  teachers?: Teacher[],
  absences?: any[]
): ConflictMessage[] {
  const conflicts: ConflictMessage[] = [];

  // 0a. Check active Sevafrei / Abwesenheiten (Hard)
  if (targetWeekCode) {
    // Support composite teacher names (e.g. "Adam, Anjali")
    const namesToCheck: string[] = [];
    if (teacher.name.includes(',')) {
      teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
    } else {
      namesToCheck.push(teacher.name.toLowerCase().trim());
    }
    
    for (const name of namesToCheck) {
      const activeAbsence = getAbsenceDetails(name, course.dayOfWeek, targetWeekCode, absences);
      if (activeAbsence) {
        const isSatsang = course.name.toLowerCase().includes('satsang');
        const isBypassedType = ['seminartage'].includes(activeAbsence.type.toLowerCase());
        if (isSatsang && isBypassedType) {
          // Bypassed for Satsangs
        } else {
          conflicts.push({
            type: 'hard',
            message: `${teacher.name} ist an diesem Datum (${getLocalDateForDay(targetWeekCode, course.dayOfWeek)}) abwesend (${activeAbsence.type}: ${activeAbsence.note || 'Keine Angabe'}).`
          });
          break;
        }
      }
    }
  }

  const teacherNameLower = teacher.name.toLowerCase();
  const courseNameLower = course.name.toLowerCase();
  const courseStyleLower = course.style.toLowerCase();

  // --- SEVAKA RULES FROM JSON ---
  const isSevaka = teacher.roleType === 'sevaka';
  
  // Categorize course types
  const isMeditationForSevaka = (courseNameLower.includes('meditation') || courseNameLower.includes('medi.') || courseStyleLower.includes('meditation')) && !courseNameLower.includes('satsang');
  const isSatsangForSevaka = courseNameLower.includes('satsang');
  const isOnnForSevaka = courseNameLower.includes('om namo');
  const isYogaClassForSevaka = !isMeditationForSevaka && !isSatsangForSevaka && !isOnnForSevaka;

  const otherSevakaAssignments = allCourses.filter(
    c => c.teacherId === teacher.id && c.id !== course.id
  );

  const getWeeklyCounts = () => {
    let yogaCount = isYogaClassForSevaka ? 1 : 0;
    let meditationCount = isMeditationForSevaka ? 1 : 0;
    let satsangCount = isSatsangForSevaka ? 1 : 0;
    let onnCount = isOnnForSevaka ? 1 : 0;

    otherSevakaAssignments.forEach(c => {
      const cName = c.name.toLowerCase();
      const cStyle = c.style.toLowerCase();
      const cIsMed = (cName.includes('meditation') || cName.includes('medi.') || cStyle.includes('meditation')) && !cName.includes('satsang');
      const cIsSat = cName.includes('satsang');
      const cIsOnn = cName.includes('om namo');

      if (!cIsMed && !cIsSat && !cIsOnn) {
        yogaCount++;
      } else if (cIsMed) {
        meditationCount++;
      } else if (cIsSat) {
        satsangCount++;
      } else if (cIsOnn) {
        onnCount++;
      }
    });

    return { yogaCount, meditationCount, satsangCount, onnCount };
  };

  const counts = getWeeklyCounts();

  // Look up teacher rules dynamically from wochenplanRules.teachers
  const teacherKey = Object.keys(wochenplanRules.teachers).find(k => teacherNameLower.includes(k) || k.includes(teacherNameLower));
  const tRules = teacherKey ? (wochenplanRules.teachers as any)[teacherKey] : null;

  // 1. Check availability / Free days (Hard)
  const courseStart = timeToMinutes(course.startTime);
  const courseEnd = timeToMinutes(course.endTime);
  const daySlots = teacher.rules.availability.filter(slot => slot.day === course.dayOfWeek);
  
  const fitsAvailability = daySlots.some(slot => {
    const availStart = timeToMinutes(slot.start);
    const availEnd = timeToMinutes(slot.end);
    return courseStart >= availStart && courseEnd <= availEnd;
  });

  if (!fitsAvailability) {
    const isWalk = courseNameLower.includes('spaziergang');
    const isPranava = teacherNameLower.includes('pranava');
    if (!(isWalk && isPranava)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist am ${getDayName(course.dayOfWeek)} zur Kurszeit (${course.startTime} - ${course.endTime}) laut Regeln/Freitagen nicht verfügbar.`
      });
    }
  }

  // 2. Check Overlapping Classes (Hard)
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

  // Check absence
  if (targetWeekCode) {
    try {
      const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
      const saved = typeof window !== 'undefined' ? localStorage.getItem('rapla_sevafrei') : null;
      let activeAbsence = null;
      
      const checkList = absences || (saved ? JSON.parse(saved) : []);
      if (checkList && checkList.length > 0) {
        // Handle composite names
        const namesToCheck: string[] = [];
        if (teacher.name.includes(',')) {
          teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
        } else {
          namesToCheck.push(teacher.name.toLowerCase().trim());
        }

        for (const name of namesToCheck) {
          activeAbsence = checkList.find((entry: any) => {
            if (!entry) return false;
            const entryName = entry.teacherName.toLowerCase().trim();
            const isMatch = entryName.includes(name) || name.includes(entryName.split(' ')[0]);
            return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
          });
          if (activeAbsence) {
            // Check if this is a composite teacher or if they are bypassed
            if (activeAbsence.type.toLowerCase() === 'seminartage' && isSatsangForSevaka) {
              // Bypassed for Satsangs
            } else {
              conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist an diesem Datum (${courseDate}) abwesend (${activeAbsence.type}: ${activeAbsence.note || 'Keine Angabe'}).`
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error during Sevafrei validation', e);
    }
  }

  // 3. Pranayama constraints
  const isPranayama = courseNameLower.includes('pranayama') || courseStyleLower.includes('pranayama');
  if (isPranayama) {
    const allowed = wochenplanRules.pranayama.allowed;
    const isAllowed = allowed.some((a: string) => teacherNameLower.includes(a));
    if (!isAllowed) {
      conflicts.push({
        type: 'hard',
        message: `Pranayama darf nur von ${allowed.join(', ').toUpperCase()} unterrichtet werden.`
      });
    }
  }

  // 4. Satsang Einführung rule
  const isSatsangEinfuehrung = courseNameLower.includes('satsang einführung') || courseNameLower.includes('satsang-einführung') || courseNameLower.includes('satsangeinführung');
  if (isSatsangEinfuehrung) {
    const generalAllowed = wochenplanRules.satsangEinfuehrung.allowed;
    const isGeneralAllowed = generalAllowed.some((a: string) => teacherNameLower.includes(a));
    if (!isGeneralAllowed) {
      conflicts.push({
        type: 'hard',
        message: `Die Satsang Einführung darf nur von ${generalAllowed.join(', ').toUpperCase()} geleitet werden.`
      });
    }

    if (course.dayOfWeek === 5) {
      const primary = wochenplanRules.satsangEinfuehrung.friday;
      const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
      if (!teacherNameLower.includes(primary) && !isPrimaryAbsent) {
        conflicts.push({
          type: 'hard',
          message: `Freitags darf die Satsang Einführung nur von ${primary.toUpperCase()} geleitet werden.`
        });
      }
    } else if (course.dayOfWeek === 0) {
      const allowed = wochenplanRules.satsangEinfuehrung.sunday;
      const isAllowed = allowed.some((a: string) => teacherNameLower.includes(a));
      if (!isAllowed) {
        conflicts.push({
          type: 'hard',
          message: `Sonntags darf die Satsang Einführung nur von ${allowed.join(', ').toUpperCase()} geleitet werden.`
        });
      }
    }
  }

  // 5. Satsang rules
  const isSatsangCourse = course.name === 'Satsang';
  if (isSatsangCourse) {
    const forbiddenForSatsang = wochenplanRules.satsang.forbidden;
    const isForbidden = forbiddenForSatsang.some((name: string) => teacherNameLower.includes(name));
    if (isForbidden) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf laut Satsang-Regeln nie für einen Satsang eingeteilt werden.`
      });
    }

    if (course.dayOfWeek === 2 && course.startTime === '20:00') {
      conflicts.push({
        type: 'hard',
        message: `Dienstagabends gibt es nie einen Satsang.`
      });
    }

    if (course.startTime === '07:00') {
      const allowedMorningSatsang = wochenplanRules.satsang.morningAllowed;
      const isAllowedMorning = allowedMorningSatsang.some((name: string) => teacherNameLower.includes(name));
      if (!isAllowedMorning) {
        conflicts.push({
          type: 'hard',
          message: `${teacher.name} darf morgens keinen Satsang leiten. Nur ${allowedMorningSatsang.join(', ').toUpperCase()} sind dafür eingeteilt.`
        });
      } else {
        const canDoTwo = wochenplanRules.satsang.morningMaxTwo.some((name: string) => teacherNameLower.includes(name));
        const maxMorningSatsangs = canDoTwo ? 2 : 1;
        const otherMorningSatsangs = otherSevakaAssignments.filter(c => c.name === 'Satsang' && c.startTime === '07:00');
        if (otherMorningSatsangs.length >= maxMorningSatsangs) {
          conflicts.push({
            type: 'hard',
            message: `${teacher.name} darf maximal ${maxMorningSatsangs} mal pro Woche für einen Satsang am Morgen eingeteilt werden.`
          });
        }
      }
    }

    if (course.startTime === '20:00') {
      if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
        const primary = wochenplanRules.satsang.evening.wedSun.primary;
        const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
        if (!teacherNameLower.includes(primary)) {
          if (!isPrimaryAbsent) {
            conflicts.push({
              type: 'hard',
              message: `${primary.toUpperCase()} leitet mittwochs bis sonntags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt.`
            });
          } else {
            const backups = wochenplanRules.satsang.evening.wedSun.backups;
            const isBackup = backups.some((name: string) => teacherNameLower.includes(name));
            if (!isBackup) {
              conflicts.push({
                type: 'hard',
                message: `${teacher.name} darf ${primary.toUpperCase()}s Abend-Satsang nicht vertreten. Nur ${backups.join(', ').toUpperCase()} sind als Vertretung erlaubt.`
              });
            }
          }
        }
      }

      if (course.dayOfWeek === 1) {
        const primary = wochenplanRules.satsang.evening.mon.primary;
        const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
        if (!teacherNameLower.includes(primary)) {
          if (!isPrimaryAbsent) {
            conflicts.push({
              type: 'hard',
              message: `${primary.toUpperCase()} leitet montags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt.`
            });
          } else {
            const backups = wochenplanRules.satsang.evening.mon.backups;
            const isBackup = backups.some((name: string) => teacherNameLower.includes(name));
            if (!isBackup) {
              conflicts.push({
                type: 'hard',
                message: `${teacher.name} darf ${primary.toUpperCase()}s Abend-Satsang nicht vertreten. Nur ${backups.join(', ').toUpperCase()} sind als Vertretung erlaubt.`
              });
            }
          }
        }
      }
    }
  }

  // 6. Meditation daily primary
  if (isMeditationForSevaka && course.startTime === '07:00') {
    const primaryName = (wochenplanRules.meditation.dailyPrimary as any)[course.dayOfWeek];
    if (primaryName) {
      const isPrimaryAbsent = isTeacherAbsent(primaryName, course.dayOfWeek, targetWeekCode, absences);
      if (!isPrimaryAbsent && !teacherNameLower.includes(primaryName)) {
        conflicts.push({
          type: 'hard',
          message: `Die geführte Meditation am ${getDayName(course.dayOfWeek)} darf nur von ${primaryName.toUpperCase()} geleitet werden (es sei denn, ${primaryName.toUpperCase()} ist laut sevafrei-Kalender abwesend).`
        });
      }
    }
  }

  // 7. Mittelstufe Ankommensstunde rules
  const isMittelstufeAnkommen = (course.dayOfWeek === 5 || course.dayOfWeek === 0) &&
                                course.startTime === '16:30' &&
                                courseNameLower.includes('mittelstufe');
  if (isMittelstufeAnkommen) {
    const primary = wochenplanRules.yoga.fridayMittelstufeAnkommen.primary;
    const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
    if (!isPrimaryAbsent) {
      if (!teacherNameLower.includes(primary)) {
        conflicts.push({
          type: 'hard',
          message: `${primary.toUpperCase()} muss die Mittelstufe Ankommensstunde leiten, da sie laut sevafrei-Kalender verfügbar ist.`
        });
      }
    } else if (course.dayOfWeek === 0) {
      const backups = wochenplanRules.yoga.sundayMittelstufeAnkommen.backups;
      let assignedBackup = null;
      for (const backupName of backups) {
        const isBackupAbsent = isTeacherAbsent(backupName, course.dayOfWeek, targetWeekCode, absences);
        if (!isBackupAbsent) {
          assignedBackup = backupName;
          break;
        }
      }
      if (assignedBackup && !teacherNameLower.includes(assignedBackup)) {
        conflicts.push({
          type: 'hard',
          message: `Da ${primary.toUpperCase()} abwesend ist, muss ${assignedBackup.toUpperCase()} die Mittelstufe Ankommensstunde am Sonntag leiten.`
        });
      }
    }
  }

  // 8. Friday 09:15 Anfängerstunde
  const isFridayMorningAnfaenger = course.dayOfWeek === 5 &&
                                   course.startTime === '09:15' &&
                                   courseNameLower.includes('anfänger');
  if (isFridayMorningAnfaenger) {
    const primary = wochenplanRules.yoga.fridayMorningAnfaenger.primary;
    const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
    if (!isPrimaryAbsent) {
      if (!teacherNameLower.includes(primary)) {
        conflicts.push({
          type: 'hard',
          message: `${primary.toUpperCase()} muss die Anfängerstunde am Freitag um 09:15 Uhr leiten, da sie verfügbar ist.`
        });
      }
    } else {
      const backup = wochenplanRules.yoga.fridayMorningAnfaenger.backup;
      const isBackupAbsent = isTeacherAbsent(backup, course.dayOfWeek, targetWeekCode, absences);
      if (!isBackupAbsent && !teacherNameLower.includes(backup)) {
        conflicts.push({
          type: 'hard',
          message: `Da ${primary.toUpperCase()} abwesend ist, muss ${backup.toUpperCase()} die Anfängerstunde am Freitag um 09:15 Uhr leiten.`
        });
      }
    }
  }

  // 9. Generic limits from JSON
  if (teacher.isYogaTeacher === false && isYogaClassForSevaka) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} gibt keine Yogastunden.`
    });
  }

  if (teacher.rules.canLeadSatsang === false && isSatsangForSevaka) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} leitet nie Satsangs.`
    });
  }

  if (teacher.rules.maxYogaClassesPerWeek !== undefined && isYogaClassForSevaka && counts.yogaCount > teacher.rules.maxYogaClassesPerWeek) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} darf für maximal ${teacher.rules.maxYogaClassesPerWeek} Yogastunden wöchentlich eingeteilt werden.`
    });
  }

  if (teacher.rules.maxMeditationPerWeek !== undefined && isMeditationForSevaka && counts.meditationCount > teacher.rules.maxMeditationPerWeek) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} kann maximal ${teacher.rules.maxMeditationPerWeek} mal pro Woche für eine geführte Meditation eingeteilt werden.`
    });
  }

  if (teacher.rules.maxMorningSatsangsPerWeek !== undefined && isSatsangForSevaka && course.startTime < '12:00') {
    const morningSatsangs = otherSevakaAssignments.filter(c => c.name.toLowerCase().includes('satsang') && c.startTime < '12:00').length + 1;
    if (morningSatsangs > teacher.rules.maxMorningSatsangsPerWeek) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann maximal ${teacher.rules.maxMorningSatsangsPerWeek} mal pro Woche für einen Satsang am Morgen eingeteilt werden.`
      });
    }
  }

  if (teacher.rules.maxOnnPerWeek !== undefined && isOnnForSevaka && counts.onnCount > teacher.rules.maxOnnPerWeek) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} leitet Om Namo Narayanaya maximal ${teacher.rules.maxOnnPerWeek} mal wöchentlich.`
    });
  }

  if (teacher.rules.noYogaOnWeekend && isYogaClassForSevaka && [5, 6, 0].includes(course.dayOfWeek)) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} unterrichtet freitags, samstags und sonntags keine Yogastunden.`
    });
  }

  if (teacher.rules.noTwoYogaSameDay && isYogaClassForSevaka) {
    const otherYogaOnDay = otherSevakaAssignments.some(c => {
      const cName = c.name.toLowerCase();
      const cStyle = c.style.toLowerCase();
      const cIsYoga = !cName.includes('meditation') && !cName.includes('medi.') && !cStyle.includes('meditation') && !cName.includes('satsang') && !cName.includes('om namo');
      return cIsYoga && c.dayOfWeek === course.dayOfWeek;
    });
    if (otherYogaOnDay) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf nicht zwei Yogastunden am selben Tag leiten.`
      });
    }
  }

  if (teacher.rules.weekendAfternoonOnly && isYogaClassForSevaka && [5, 6, 0].includes(course.dayOfWeek)) {
    const isAfternoon = timeToMinutes(course.startTime) >= timeToMinutes('12:00');
    if (!isAfternoon) {
      conflicts.push({
        type: 'hard',
        message: `Am Wochenende darf ${teacher.name} nur am Nachmittag für eine Yogastunde eingeteilt werden.`
      });
    }
  }

  if (tRules && tRules.maxYinYogaAnfaengerPerWeek !== undefined) {
    const isYinAnfaenger = courseNameLower.includes('anfänger') && courseStyleLower.includes('yin');
    if (isYinAnfaenger) {
      const otherYinAnfaenger = otherSevakaAssignments.filter(c => c.name.toLowerCase().includes('anfänger') && c.style.toLowerCase().includes('yin')).length + 1;
      if (otherYinAnfaenger > tRules.maxYinYogaAnfaengerPerWeek) {
        conflicts.push({
          type: 'hard',
          message: `${teacher.name} kann nur ${tRules.maxYinYogaAnfaengerPerWeek} mal wöchentlich für eine Yin Yoga Anfängerstunde eingeteilt werden.`
        });
      }
    }
  }

  if (tRules && tRules.maxAnfaengerYogaPerWeek !== undefined && isYogaClassForSevaka && courseNameLower.includes('anfänger')) {
    const anfaengerYogaCount = otherSevakaAssignments.filter(c => {
      const cName = c.name.toLowerCase();
      const cStyle = c.style.toLowerCase();
      const cIsYoga = !cName.includes('meditation') && !cName.includes('medi.') && !cStyle.includes('meditation') && !cName.includes('satsang') && !cName.includes('om namo');
      return cIsYoga && cName.includes('anfänger');
    }).length + 1;
    if (anfaengerYogaCount > tRules.maxAnfaengerYogaPerWeek) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann maximal ${tRules.maxAnfaengerYogaPerWeek} mal wöchentlich für eine Anfängerstunde eingeteilt werden.`
      });
    }
  }

  // 10. Check Room Rules from Raum Regeln.txt (Hard)
  const roomConflicts = validateRoomRules(course, allCourses, teachers || db.getTeachers());
  conflicts.push(...roomConflicts);

  return conflicts;
}

// Check validation for all courses in a list and return a map of courseId -> conflicts
export function validateAllCourses(
  courses: Course[],
  teachers: Teacher[],
  seminarLeaderIds: string[] = [],
  targetWeekCode?: string,
  absences?: any[]
): Record<string, ConflictMessage[]> {
  const validationMap: Record<string, ConflictMessage[]> = {};
  
  courses.forEach(course => {
    if (!course.teacherId) {
      // Validate room rules even if no teacher is assigned
      validationMap[course.id] = validateRoomRules(course, courses, teachers);
      return;
    }
    const teacher = teachers.find(t => t.id === course.teacherId);
    if (!teacher) {
      validationMap[course.id] = validateRoomRules(course, courses, teachers);
      return;
    }
    validationMap[course.id] = validateAssignment(teacher, course, courses, seminarLeaderIds, targetWeekCode, teachers, absences);
  });
  
  return validationMap;
}

// AI Pre-planning Core Heuristic Engine
export function runAiPlanning(
  courses: Course[],
  teachers: Teacher[],
  seminarLeaderIds: string[] = [],
  targetWeekCode?: string,
  customConstraints: any[] = [],
  absences?: any[]
): {
  plannedCourses: Course[];
  logs: string[];
} {
  const logs: string[] = [];
  logs.push('Starte automatischen KI-Planungsalgorithmus...');
  
  // Only plan with Sevakas (Kernteam)
  const yogaTeachers = teachers.filter(t => 
    t.roleType === 'sevaka'
  );
  logs.push(`Berücksichtige ${yogaTeachers.length} Sevakas (Kernteam) für die KI-Vorplanung.`);
  
  // Clone courses to avoid modifying original array until approved
  let workingCourses = courses.map(c => ({ ...c }));
  
  // Find which courses need planning: either unassigned, marked for AI planning, or having an active absence (sevafrei/urlaub) for their pre-assigned teacher
  const coursesToPlan = workingCourses.filter(c => {
    if (c.teacherId === null || c.isAiPlanned) return true;
    const teacher = teachers.find(t => t.id === c.teacherId);
    if (!teacher) return true;
    
    // Simulate layout with this assignment and auto-adjust rooms
    const tempLayout = workingCourses.map(x => x.id === c.id ? { ...x, teacherId: teacher.id } : { ...x });
    adjustRoomsForRules(tempLayout, teachers);
    const adjustedCourse = tempLayout.find(x => x.id === c.id)!;

    const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
    const hasAbsenceConflict = conflicts.some(conf => conf.type === 'hard' && conf.message.includes('abwesend'));
    if (hasAbsenceConflict) {
      const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      const dayName = dayNames[c.dayOfWeek] || c.dayOfWeek.toString();
      logs.push(`Replanung erforderlich für "${c.name}" am ${dayName} (${c.startTime}), da ${teacher.name} abwesend/sevafrei ist.`);
      return true;
    }
    return false;
  });
  
  logs.push(`${coursesToPlan.length} Kurse müssen verplant werden.`);
  
  // Clear existing AI planning tags
  coursesToPlan.forEach(c => {
    c.teacherId = null;
    c.isAiPlanned = false;
    // Revert custom course names to original template names using template lookup
    const templateCourse = db.getDefaultCourses?.().find(tc => tc.dayOfWeek === c.dayOfWeek && tc.startTime === c.startTime && tc.roomId === c.roomId);
    if (templateCourse) {
      c.name = templateCourse.name;
    } else {
      if (c.name === 'Yoga Vidya meets Pavanmuktasana' || c.name === 'Yoga Vidya Pavanmuktasana' || c.name === 'Anfänger Yin Yoga') {
        c.name = 'Anfänger';
      } else if (c.name === 'Yoga Flow Mittelstufe') {
        c.name = 'Mittelstufe';
      }
    }
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
      // Simulate layout with this assignment and auto-adjust rooms
      const tempLayout = workingCourses.map(x => x.id === course.id ? { ...x, teacherId: teacher.id } : { ...x });
      adjustRoomsForRules(tempLayout, teachers);
      const adjustedCourse = tempLayout.find(x => x.id === course.id)!;

      const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
      const teacherNameLower = teacher.name.toLowerCase();
      
      const hardConflicts = conflicts.filter(c => c.type === 'hard');
      const softConflicts = conflicts.filter(c => c.type === 'soft');
      
      if (hardConflicts.length > 0) {
        // Teacher has hard conflicts, skip them or give them negative/zero scoring
        continue;
      }

      // Apply custom constraints (parsed from Gemini)
      let customExcluded = false;
      let customForced = false;
      let forceOther = false;

      if (customConstraints && customConstraints.length > 0) {
        for (const rule of customConstraints) {
          const ruleTeacherId = rule.teacherId;
          if (!ruleTeacherId) continue;

          // Fuzzy match candidate teacher
          let matchTeacher = false;
          const tIdLower = teacher.id.toLowerCase();
          const tNameLower = teacher.name.toLowerCase();
          const rIdLower = ruleTeacherId.toLowerCase();
          if (tIdLower === rIdLower || rIdLower.includes(tIdLower) || rIdLower.includes(tNameLower) || tNameLower.includes(rIdLower)) {
            matchTeacher = true;
          }

          const rDay = rule.dayOfWeek;
          const rStart = rule.startTime;
          const rCourseName = rule.courseName;
          const rCourseStyle = rule.courseStyle;

          // Check if course matches rule
          let matchCourse = true;
          if (rDay !== undefined && rDay !== null && course.dayOfWeek !== rDay) matchCourse = false;
          if (rStart !== undefined && rStart !== null && course.startTime !== rStart) matchCourse = false;
          if (rCourseName !== undefined && rCourseName !== null && !course.name.toLowerCase().includes(rCourseName.toLowerCase())) matchCourse = false;
          if (rCourseStyle !== undefined && rCourseStyle !== null && !course.style.toLowerCase().includes(rCourseStyle.toLowerCase())) matchCourse = false;

          if (matchCourse) {
            if (rule.type === 'exclude' && matchTeacher) {
              customExcluded = true;
              logs.push(`  [KI-REGEL-JS] Schließe ${teacher.name} für Kurs "${course.name}" (${course.startTime}) aus.`);
            }
            if (rule.type === 'include') {
              if (matchTeacher) {
                customForced = true;
                logs.push(`  [KI-REGEL-JS] Zwinge Zuweisung von ${teacher.name} für Kurs "${course.name}" (${course.startTime}).`);
              } else {
                forceOther = true;
              }
            }
          }
        }
      }

      if (customExcluded || forceOther) {
        continue; // Skip this teacher for this course
      }
      
      // Calculate score base (starts at 100)
      let score = 100;
      if (customForced) {
        score += 100000;
      }
      
      // Preference: distribute hours evenly (favour teachers with fewer planned hours)
      const plannedHours = workingCourses
        .filter(c => c.teacherId === teacher.id)
        .reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
      
      score -= plannedHours * 5; // deduct points to encourage balance (e.g. -5 points per planned hour)
      
      // Custom scoring rules from compiled rules: prefers Mittelstufe
      if (teacher.rules.prefersMittelstufe && course.name.toLowerCase().includes('mittelstufe')) {
        score += 150;
      }

      // Custom scoring rules from compiled rules: weekend as backup only
      if (teacher.rules.weekendAsBackupOnly && [5, 6, 0].includes(course.dayOfWeek) && course.style.toLowerCase() !== 'meditation') {
        if (timeToMinutes(course.startTime) >= timeToMinutes('12:00')) {
          score -= 1000;
        }
      }

      // Rule 8: Friday morning (09:15) Beginner class from compiled rules
      const yogaRules = wochenplanRules.yoga;
      if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name.toLowerCase().includes('anfänger')) {
        if (teacherNameLower.includes(yogaRules.fridayMorningAnfaenger.primary)) {
          score += 10000;
        } else if (teacherNameLower.includes(yogaRules.fridayMorningAnfaenger.backup)) {
          score += 5000;
        }
      }

      // Rule 9: Friday morning (09:15) Intermediate class from compiled rules
      if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name.toLowerCase().includes('mittelstufe')) {
        if (teacherNameLower.includes(yogaRules.fridayMorningMittelstufe.primary)) {
          score += 10000;
        }
      }

      // Rule 6 & 7: Friday and Sunday 16:30 Mittelstufe Ankommensstunde from compiled rules
      const isMittelstufeAnkommen = (course.dayOfWeek === 5 || course.dayOfWeek === 0) && 
                                    course.startTime === '16:30' && 
                                    course.name.toLowerCase().includes('mittelstufe');
      if (isMittelstufeAnkommen) {
        const primary = yogaRules.fridayMittelstufeAnkommen.primary;
        if (teacherNameLower.includes(primary)) {
          score += 10000;
        } else if (course.dayOfWeek === 0) { // Backup priorities only on Sunday
          const backups = yogaRules.sundayMittelstufeAnkommen.backups;
          const idx = backups.findIndex((b: string) => teacherNameLower.includes(b));
          if (idx !== -1) {
            score += 5000 - idx * 2500;
            if (backups[idx] === 'ulrich') {
              score += 2000; // offset Ulrich's standard weekend penalty
            }
          }
        }
      }

      // Custom scoring rules for Pranayama from compiled rules
      const isPranayamaCourse = course.name.toLowerCase().includes('pranayama') || course.style.toLowerCase().includes('pranayama');
      if (isPranayamaCourse) {
        const allowed = wochenplanRules.pranayama.allowed || [];
        const isAllowed = allowed.some((n: string) => teacherNameLower.includes(n));
        if (isAllowed) {
          score += 500;
          
          let weekNum = 0;
          if (targetWeekCode) {
            const match = targetWeekCode.match(/-W(\d+)/);
            if (match) {
              weekNum = parseInt(match[1], 10);
            }
          }
          if (weekNum > 0) {
            // Rotate the 4 teachers (Karuna, Burnie, Narayani, Abha) evenly.
            // On a given week, assign different teachers to Saturday (day 6) and Sunday (day 0).
            const orderedAllowed = ["karuna", "burnie", "narayani", "abha"];
            const teacherIdx = orderedAllowed.findIndex((n: string) => teacherNameLower.includes(n));
            if (teacherIdx !== -1) {
              const dayOffset = course.dayOfWeek === 6 ? 0 : 1;
              const targetIndexForDay = (2 * weekNum + dayOffset) % 4;
              // Circular distance (how many weeks away from this teacher being primary)
              const distance = (teacherIdx - targetIndexForDay + 4) % 4;
              // Distance 0 is highest priority (boost +1000), distance 3 is lowest priority (boost +250)
              score += 1000 - distance * 250;
            }
          }
        }
      }

      // Custom scoring rules for Sunday Satsang Einführung from compiled rules
      const isSatsangEinfuehrungCourse = course.name.toLowerCase().includes('satsang einführung') || course.name.toLowerCase().includes('satsang-einführung');
      if (isSatsangEinfuehrungCourse && course.dayOfWeek === 0) {
        const allowed = wochenplanRules.satsangEinfuehrung.sunday;
        const isAllowed = allowed.some((a: string) => teacherNameLower.includes(a));
        if (isAllowed) {
          score += 500;
          
          let weekNum = 0;
          if (targetWeekCode) {
            const match = targetWeekCode.match(/-W(\d+)/);
            if (match) {
              weekNum = parseInt(match[1], 10);
            }
          }
          if (weekNum > 0) {
            const preferredIndex = weekNum % allowed.length;
            const preferredName = allowed[preferredIndex];
            if (teacherNameLower.includes(preferredName)) {
              score += 1000;
            }
          }
        }
      }

      // Custom scoring rules for Entspannungsangebot from compiled rules
      const isEntspannungsangebot = 
        course.name.toLowerCase().includes('entspannung') ||
        course.name.toLowerCase().includes('klangreise') ||
        course.name.toLowerCase().includes('yogageschichten am kamin') ||
        course.name.toLowerCase().includes('peziebälle') ||
        course.name.toLowerCase().includes('fantasiereise');
        
      if (isEntspannungsangebot && wochenplanRules.entspannungsangebot) {
        const erules = wochenplanRules.entspannungsangebot;
        if (course.dayOfWeek === 1 && erules.montag?.primary) {
          if (teacherNameLower.includes(erules.montag.primary.toLowerCase())) {
            score += 10000;
          }
        } else if (course.dayOfWeek === 3 && erules.mittwoch?.primary) {
          if (teacherNameLower.includes(erules.mittwoch.primary.toLowerCase())) {
            score += 10000;
          }
        } else if (course.dayOfWeek === 4 && erules.donnerstag?.alternating) {
          const allowed = erules.donnerstag.alternating;
          const isAllowed = allowed.some((a: string) => teacherNameLower.includes(a.toLowerCase()));
          if (isAllowed) {
            score += 5000;
            let weekNum = 0;
            if (targetWeekCode) {
              const match = targetWeekCode.match(/-W(\d+)/);
              if (match) {
                weekNum = parseInt(match[1], 10);
              }
            }
            if (weekNum > 0) {
              const preferredIndex = weekNum % allowed.length;
              const preferredName = allowed[preferredIndex];
              if (teacherNameLower.includes(preferredName.toLowerCase())) {
                score += 5000;
              }
            }
          }
        }
      }

      // --- GEFÜHRTE MEDITATION SCORING RULES ---
      const isMeditationCourse = course.name === 'Geführte Meditation' || course.style.toLowerCase() === 'meditation';
      if (isMeditationCourse) {
        const allowed = wochenplanRules.meditation.allowed;
        const forbidden = wochenplanRules.meditation.forbidden;
        const isAllowed = allowed.some((name: string) => teacherNameLower.includes(name));
        const isForbidden = forbidden.some((name: string) => teacherNameLower.includes(name));
        
        if (isForbidden) {
          score -= 10000;
        } else if (isAllowed) {
          score += 100;
          
          const primaryName = (wochenplanRules.meditation.dailyPrimary as any)[course.dayOfWeek];
          if (primaryName && teacherNameLower.includes(primaryName)) {
            score += 10000;
          }
        } else if (teacher.roleType === 'sevaka') {
          score -= 10000;
        }
      }

      // --- SATSANG SCORING RULES ---
      if (course.name === 'Satsang') {
        // Morgen-Satsang (07:00):
        if (course.startTime === '07:00') {
          const allowedMorningSatsang = wochenplanRules.satsang.morningAllowed;
          if (allowedMorningSatsang.some((name: string) => teacherNameLower.includes(name))) {
            score += 500;
          } else {
            score -= 10000;
          }
        }
        
        // Abend-Satsang (20:00):
        if (course.startTime === '20:00') {
          // Mittwochs bis sonntags: Karuna ist Standard
          if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
            const primary = wochenplanRules.satsang.evening.wedSun.primary;
            if (teacherNameLower.includes(primary)) {
              score += 10000;
            } else {
              const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
              if (isPrimaryAbsent) {
                const backups = wochenplanRules.satsang.evening.wedSun.backups;
                const isBackup = backups.some((name: string) => teacherNameLower.includes(name));
                if (isBackup) {
                  score += 8000;
                  const eveningSatsangCount = workingCourses.filter(c => 
                    c.teacherId === teacher.id && 
                    c.name === 'Satsang' && 
                    c.startTime === '20:00'
                  ).length;
                  score -= eveningSatsangCount * 2000;
                } else {
                  score -= 10000;
                }
              } else {
                score -= 10000;
              }
            }
          }
          
          // Montag: Narayani ist Standard
          if (course.dayOfWeek === 1) {
            const primary = wochenplanRules.satsang.evening.mon.primary;
            if (teacherNameLower.includes(primary)) {
              score += 10000;
            } else {
              const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
              if (isPrimaryAbsent) {
                const backups = wochenplanRules.satsang.evening.mon.backups;
                const isBackup = backups.some((name: string) => teacherNameLower.includes(name));
                if (isBackup) {
                  score += 8000;
                  const eveningSatsangCount = workingCourses.filter(c => 
                    c.teacherId === teacher.id && 
                    c.name === 'Satsang' && 
                    c.startTime === '20:00'
                  ).length;
                  score -= eveningSatsangCount * 2000;
                } else {
                  score -= 10000;
                }
              } else {
                score -= 10000;
              }
            }
          }
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

    // Fallback: If no candidate without hard conflicts was found for a Satsang, try again by relaxing rules
    if (candidateScores.length === 0 && course.name === 'Satsang') {
      logs.push(`  [NOTFALL] Kein konfliktfreier Lehrer für Satsang am Tag ${course.dayOfWeek} um ${course.startTime} gefunden. Versuche Regeln zu lockern...`);
      for (const teacher of yogaTeachers) {
        const teacherNameLower = teacher.name.toLowerCase();
        
        // Regel 4: Folgende Personen werden nie für einen Satsang eingeteilt: Adam, Hu, Mounir, Teresa, Satyam, Ulrich, Pranava
        const forbiddenForSatsang = ['adam', 'hu', 'mounir', 'mouniir', 'teresa', 'satyam', 'ulrich', 'pranava'];
        if (forbiddenForSatsang.some(name => teacherNameLower.includes(name))) {
          continue; // Absolut verboten!
        }

        const tempLayout = workingCourses.map(x => x.id === course.id ? { ...x, teacherId: teacher.id } : { ...x });
        adjustRoomsForRules(tempLayout, teachers);
        const adjustedCourse = tempLayout.find(x => x.id === course.id)!;

        const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
        
        // Hard conflicts that are physical absence (cannot be relaxed under any circumstance)
        const nonRelaxableConflicts = conflicts.filter(c => {
          if (c.type !== 'hard') return false;
          const msg = c.message.toLowerCase();
          return msg.includes('abwesend') || msg.includes('urlaub') || msg.includes('krank') || msg.includes('satsang-regel 4') || msg.includes('nie für einen satsang');
        });

        if (nonRelaxableConflicts.length === 0) {
          // Calculate score with high penalty for relaxed conflicts
          let score = 100;
          
          const plannedHours = workingCourses
            .filter(c => c.teacherId === teacher.id)
            .reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
          score -= plannedHours * 5;

          // Huge penalty for each hard conflict we relaxed
          const hardConflictsToRelax = conflicts.filter(c => c.type === 'hard');
          score -= hardConflictsToRelax.length * 10000;

          const combinedSoftConflicts = conflicts.map(c => {
            if (c.type === 'hard') {
              return { type: 'soft' as const, message: `[Regellockerung] ${c.message}` };
            }
            return c;
          });

          candidateScores.push({
            teacher,
            score,
            conflicts: combinedSoftConflicts
          });
        }
      }

      // Sort fallback candidates by score descending
      candidateScores.sort((a, b) => b.score - a.score);
    }

    if (candidateScores.length > 0) {
      const bestCandidate = candidateScores[0];
      const index = workingCourses.findIndex(c => c.id === course.id);
      if (index !== -1) {
        workingCourses[index].teacherId = bestCandidate.teacher.id;
        workingCourses[index].isAiPlanned = true;

        // Apply custom course name based on Sevaka rules
        const tNameLower = bestCandidate.teacher.name.toLowerCase();
        const isYoga = !workingCourses[index].name.toLowerCase().includes('meditation') &&
                       !workingCourses[index].name.toLowerCase().includes('medi.') &&
                       !workingCourses[index].style.toLowerCase().includes('meditation') &&
                       !workingCourses[index].name.toLowerCase().includes('satsang') &&
                       !workingCourses[index].name.toLowerCase().includes('om namo');

        // Rule 5: Burnie beginner class rename
        if (tNameLower.includes('burnie') && isYoga && workingCourses[index].name.toLowerCase().includes('anfänger')) {
          workingCourses[index].name = 'Yoga Vidya Pavanmuktasana';
        } else if (tNameLower.includes('satyam') && workingCourses[index].name === 'Mittelstufe') {
          workingCourses[index].name = 'Yoga Flow Mittelstufe';
        } else if (tNameLower.includes('abha') && workingCourses[index].name === 'Anfänger') {
          const hasYin = workingCourses.some(wc => wc.teacherId === bestCandidate.teacher.id && wc.name === 'Anfänger Yin Yoga');
          if (!hasYin) {
            workingCourses[index].name = 'Anfänger Yin Yoga';
          }
        }

        // Rule 9: Friday morning (09:15) intermediate class rename based on Pranava assignment
        if (workingCourses[index].dayOfWeek === 5 && workingCourses[index].startTime === '09:15' && workingCourses[index].name.toLowerCase().includes('mittelstufe')) {
          if (tNameLower.includes('pranava')) {
            workingCourses[index].name = 'Mittelstufe Klangyogastunde';
          } else {
            workingCourses[index].name = 'Mittelstufe';
          }
        }
        
        logs.push(`✓ Zuweisung erfolgreich: ${bestCandidate.teacher.name} (Score: ${bestCandidate.score.toFixed(0)})`);
        if (bestCandidate.conflicts.length > 0) {
          logs.push(`  Hinweis: ${bestCandidate.conflicts[0].message}`);
        }
      }
    } else {
      logs.push(`⚠️ Kein passender Yogalehrer ohne harte Konflikte für "${course.name}" gefunden.`);
    }
  }

  // Final name sweep to ensure custom names are consistently applied
  workingCourses.forEach(c => {
    if (!c.teacherId) return;
    const teacher = teachers.find(t => t.id === c.teacherId);
    if (!teacher) return;
    const tNameLower = teacher.name.toLowerCase();

    // Look up teacher custom course renames dynamically
    const teacherKey = Object.keys(wochenplanRules.teachers).find(k => tNameLower.includes(k) || k.includes(tNameLower));
    const tRules = teacherKey ? (wochenplanRules.teachers as any)[teacherKey] : null;
    if (tRules && tRules.customCourseNames && tRules.customCourseNames.length > 0) {
      tRules.customCourseNames.forEach((item: any) => {
        if (c.name.trim() === item.originalName.trim()) {
          c.name = item.customName;
        }
      });
    }
  });

  // Apply room rules to auto-adjust rooms based on final teacher assignments
  adjustRoomsForRules(workingCourses, teachers);

  const assignedCount = workingCourses.filter(c => c.teacherId !== null && c.isAiPlanned).length;
  logs.push(`Planung abgeschlossen. ${assignedCount} von ${coursesToPlan.length} Kursen wurden erfolgreich zugewiesen.`);
  
  return {
    plannedCourses: workingCourses,
    logs
  };
}

// Room rule validation from Raum Regeln.txt
export function validateRoomRules(
  course: Course,
  allCourses: Course[],
  teachers: Teacher[]
): ConflictMessage[] {
  const conflicts: ConflictMessage[] = [];
  const nameLower = course.name.toLowerCase();
  const styleLower = course.style.toLowerCase();

  // 1. Pranayama rule: Pranayama always in Radhakrishna (room-2)
  if (nameLower.includes('pranayama') || styleLower.includes('pranayama')) {
    if (course.roomId !== 'room-2') {
      conflicts.push({
        type: 'hard',
        message: `Pranayama-Stunden müssen im Radhakrishna Raum stattfinden.`
      });
    }
  }

  // 2. Beginner rule: Yoga beginner classes in Radhakrishna (room-2), except when parallel to Pranava's Klangyogastunde Mittelstufe (then Tripura room-5)
  if (nameLower.includes('anfänger')) {
    // Check if there is a parallel Klangyogastunde taught by Pranava
    const hasParallelPranavaKlang = allCourses.some(c => {
      if (c.id === course.id) return false;
      if (c.dayOfWeek !== course.dayOfWeek || c.startTime !== course.startTime) return false;
      if (!c.name.toLowerCase().includes('mittelstufe') || !c.name.toLowerCase().includes('klang')) return false;
      if (!c.teacherId) return false;
      const t = teachers.find(x => x.id === c.teacherId);
      return t && t.name.toLowerCase().includes('pranava');
    });

    if (hasParallelPranavaKlang) {
      if (course.roomId !== 'room-5') {
        conflicts.push({
          type: 'hard',
          message: `Da parallel eine Klangyogastunde Mittelstufe von Pranava stattfindet, muss die Anfängerstunde im Tripura Raum stattfinden.`
        });
      }
    } else {
      if (course.roomId !== 'room-2') {
        conflicts.push({
          type: 'hard',
          message: `Yoga-Anfängerstunden müssen im Radhakrishna Raum stattfinden.`
        });
      }
    }
  }

  // 3. Intermediate rule: Yoga intermediate classes in Tripura (room-5), except when taught by Pranava as Klangyogastunde (then Radhakrishna room-2)
  if (nameLower.includes('mittelstufe')) {
    const isKlang = nameLower.includes('klang');
    let isPranava = false;
    if (course.teacherId) {
      const t = teachers.find(x => x.id === course.teacherId);
      if (t && t.name.toLowerCase().includes('pranava')) {
        isPranava = true;
      }
    }

    if (isKlang && isPranava) {
      if (course.roomId !== 'room-2') {
        conflicts.push({
          type: 'hard',
          message: `Klangyogastunden Mittelstufe von Pranava müssen im Radhakrishna Raum stattfinden.`
        });
      }
    } else {
      if (course.roomId !== 'room-5') {
        conflicts.push({
          type: 'hard',
          message: `Yoga-Mittelstufen müssen im Tripura Raum stattfinden.`
        });
      }
    }
  }

  return conflicts;
}

// Room auto-adjustment logic
export function adjustRoomsForRules(courses: Course[], teachers: Teacher[]): Course[] {
  courses.forEach(course => {
    const nameLower = course.name.toLowerCase();
    const styleLower = course.style.toLowerCase();

    // 1. Pranayama rule
    if (nameLower.includes('pranayama') || styleLower.includes('pranayama')) {
      course.roomId = 'room-2'; // Radhakrisna
      return;
    }

    // 2. Beginner/Intermediate rules
    const isBeginner = nameLower.includes('anfänger');
    const isIntermediate = nameLower.includes('mittelstufe');

    if (isBeginner) {
      // Look for a parallel Klangyogastunde taught by Pranava
      const hasParallelPranavaKlang = courses.some(c => {
        if (c.id === course.id) return false;
        if (c.dayOfWeek !== course.dayOfWeek || c.startTime !== course.startTime) return false;
        if (!c.name.toLowerCase().includes('mittelstufe') || !c.name.toLowerCase().includes('klang')) return false;
        if (!c.teacherId) return false;
        const t = teachers.find(x => x.id === c.teacherId);
        return t && t.name.toLowerCase().includes('pranava');
      });

      if (hasParallelPranavaKlang) {
        course.roomId = 'room-5'; // Tripura
      } else {
        course.roomId = 'room-2'; // Radhakrisna
      }
    } else if (isIntermediate) {
      const isKlang = nameLower.includes('klang');
      let isPranava = false;
      if (course.teacherId) {
        const t = teachers.find(x => x.id === course.teacherId);
        if (t && t.name.toLowerCase().includes('pranava')) {
          isPranava = true;
        }
      }

      if (isKlang && isPranava) {
        course.roomId = 'room-2'; // Radhakrisna
      } else {
        course.roomId = 'room-5'; // Tripura
      }
    }
  });

  return courses;
}

// Name auto-adjustment logic
export function adjustNamesForRules(courses: Course[], teachers: Teacher[]): Course[] {
  courses.forEach(course => {
    if (!course.teacherId) {
      // Revert to template name if possible, or keep original
      if (course.name === 'Yoga Vidya Pavanmuktasana' || course.name === 'Yoga Flow Mittelstufe' || course.name === 'Anfänger Yin Yoga') {
        course.name = course.name.toLowerCase().includes('anfänger') ? 'Anfänger' : 'Mittelstufe';
      }
      if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name === 'Mittelstufe Klangyogastunde') {
        course.name = 'Mittelstufe';
      }
      return;
    }
    const teacher = teachers.find(t => t.id === course.teacherId);
    if (!teacher) return;
    const tNameLower = teacher.name.toLowerCase();

    const isYoga = !course.name.toLowerCase().includes('meditation') &&
                   !course.name.toLowerCase().includes('medi.') &&
                   !course.style.toLowerCase().includes('meditation') &&
                   !course.name.toLowerCase().includes('satsang') &&
                   !course.name.toLowerCase().includes('om namo');

    if (isYoga) {
      // 1. Burnie Anfänger Yoga
      if (tNameLower.includes('burnie') && course.name.toLowerCase().includes('anfänger')) {
        course.name = 'Yoga Vidya Pavanmuktasana';
      }
      // 2. Satyam Mittelstufe
      else if (tNameLower.includes('satyam') && course.name.toLowerCase().includes('mittelstufe')) {
        course.name = 'Yoga Flow Mittelstufe';
      }
      // 3. Abha Anfänger -> Anfänger Yin Yoga
      else if (tNameLower.includes('abha') && course.name.toLowerCase().includes('anfänger')) {
        course.name = 'Anfänger Yin Yoga';
      }
      // Revert if someone else is assigned to these custom courses
      else {
        if (course.name === 'Yoga Vidya Pavanmuktasana' || course.name === 'Yoga Flow Mittelstufe' || course.name === 'Anfänger Yin Yoga') {
          if (course.dayOfWeek === 5 || course.dayOfWeek === 0) {
            if (course.startTime === '16:30') {
              course.name = course.name.toLowerCase().includes('anfänger') ? 'Anfänger Ankommensstunde' : 'Mittelstufe Ankommensstunde';
            } else {
              course.name = course.name.toLowerCase().includes('anfänger') ? 'Anfänger' : 'Mittelstufe';
            }
          } else {
            course.name = course.name.toLowerCase().includes('anfänger') ? 'Anfänger' : 'Mittelstufe';
          }
        }
      }
    }

    // 4. Friday morning (09:15) intermediate class rename based on Pranava assignment
    if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name.toLowerCase().includes('mittelstufe')) {
      if (tNameLower.includes('pranava')) {
        course.name = 'Mittelstufe Klangyogastunde';
      } else {
        course.name = 'Mittelstufe';
      }
    }
  });

  return courses;
}

// Combined adjustment logic
export function adjustCoursesForRules(courses: Course[], teachers: Teacher[]): Course[] {
  adjustNamesForRules(courses, teachers);
  adjustRoomsForRules(courses, teachers);
  return courses;
}
