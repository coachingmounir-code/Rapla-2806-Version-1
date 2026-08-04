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
  targetWeekCode?: string,
  teachers?: Teacher[]
): ConflictMessage[] {
  const conflicts: ConflictMessage[] = [];

  // 0a. Check active Sevafrei / Abwesenheiten (Hard)
  if (typeof window !== 'undefined' && targetWeekCode) {
    try {
      const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
      const saved = localStorage.getItem('rapla_sevafrei');
      if (saved) {
        const sevafreiList = JSON.parse(saved);
        
        // Support composite teacher names (e.g. "Adam, Anjali")
        const namesToCheck: string[] = [];
        if (teacher.name.includes(',')) {
          teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
        } else {
          namesToCheck.push(teacher.name.toLowerCase().trim());
        }
        
        for (const name of namesToCheck) {
          const activeAbsence = sevafreiList.find((entry: any) => {
            const entryName = entry.teacherName.toLowerCase().trim();
            const isMatch = entryName.includes(name) || name.includes(entryName.split(' ')[0]);
            return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
          });
          
          if (activeAbsence) {
            const isSatsang = course.name.toLowerCase().includes('satsang');
            const isBypassedType = ['seminartage'].includes(activeAbsence.type.toLowerCase());
            if (isSatsang && isBypassedType) {
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

  // --- SEVAKA RULES FROM TXT FILE ---
  const isSevaka = teacher.roleType === 'sevaka';
  const teacherNameLower = teacher.name.toLowerCase();
  const courseNameLower = course.name.toLowerCase();
  const courseStyleLower = course.style.toLowerCase();

  // Categorize course types
  const isMeditationForSevaka = (courseNameLower.includes('meditation') || courseNameLower.includes('medi.') || courseStyleLower.includes('meditation')) && !courseNameLower.includes('satsang');
  const isSatsangForSevaka = courseNameLower.includes('satsang');
  const isOnnForSevaka = courseNameLower.includes('om namo');
  const isYogaClassForSevaka = !isMeditationForSevaka && !isSatsangForSevaka && !isOnnForSevaka;

  // Let's filter the other assignments for the weekly counts
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

  // Pranayama constraints: only Karuna, Burnie, Narayani, Abha
  const isPranayama = courseNameLower.includes('pranayama') || courseStyleLower.includes('pranayama');
  if (isPranayama) {
    const allowed = ['karuna', 'burnie', 'narayani', 'abha'];
    const isAllowed = allowed.some(a => teacherNameLower.includes(a));
    if (!isAllowed) {
      conflicts.push({
        type: 'hard',
        message: `Pranayama darf nur von Karuna, Burnie, Narayani oder Abha unterrichtet werden.`
      });
    }
  }

  // Satsang Einführung rule: Friday only Pranava, Sunday only Nirmaya, Anjali, Hu, Mounir
  const isSatsangEinfuehrung = courseNameLower.includes('satsang einführung') || courseNameLower.includes('satsang-einführung') || courseNameLower.includes('satsangeinführung');
  if (isSatsangEinfuehrung) {
    if (course.dayOfWeek === 5) {
      let isPranavaAbsent = false;
      const pranava = (teachers || db.getTeachers()).find(t => t.name.toLowerCase().includes('pranava'));
      if (typeof window !== 'undefined' && targetWeekCode && pranava) {
        try {
          const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
          const saved = localStorage.getItem('rapla_sevafrei');
          if (saved) {
            const sevafreiList = JSON.parse(saved);
            const activeAbsence = sevafreiList.find((entry: any) =>
              entry.teacherId === pranava.id &&
              courseDate >= entry.startDate &&
              courseDate <= entry.endDate
            );
            if (activeAbsence) {
              isPranavaAbsent = true;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (!teacherNameLower.includes('pranava') && !isPranavaAbsent) {
        conflicts.push({
          type: 'hard',
          message: `Freitags darf die Satsang Einführung nur von Pranava geleitet werden.`
        });
      }
    } else if (course.dayOfWeek === 0) {
      const allowed = ['nirmaya', 'anjali', 'hu', 'mounir'];
      const isAllowed = allowed.some(a => teacherNameLower.includes(a));
      if (!isAllowed) {
        conflicts.push({
          type: 'hard',
          message: `Sonntags darf die Satsang Einführung nur von Nirmaya, Anjali, Hu oder Mounir geleitet werden.`
        });
      }
    }
  }

  // --- SATSANG REGELN ---
  const isSatsangCourse = course.name === 'Satsang';

  if (isSatsangCourse) {
    // Regel 4: Folgende Personen werden nie für einen Satsang eingeteilt: Adam, Hu, Mounir, Teresa, Satyam, Ulrich, Pranava
    const forbiddenForSatsang = ['adam', 'hu', 'mounir', 'mouniir', 'teresa', 'satyam', 'ulrich', 'pranava'];
    const isForbidden = forbiddenForSatsang.some(name => teacherNameLower.includes(name));
    if (isForbidden) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf laut Satsang-Regel 4 nie für einen Satsang eingeteilt werden.`
      });
    }

    // Regel 1: Dienstagabends gibt es nie einen Satsang
    if (course.dayOfWeek === 2 && course.startTime === '20:00') {
      conflicts.push({
        type: 'hard',
        message: `Dienstagabends gibt es nie einen Satsang (Satsang-Regel 1).`
      });
    }

    // Regel 3: Morgens um 7.00Uhr bis 8.00Uhr werden folgende Personen immer wieder eingeteilt: Anjali, Nirmaya, Burnie, Harishakti, Narayani, Abha, Alexander
    if (course.startTime === '07:00') {
      const allowedMorningSatsang = ['anjali', 'nirmaya', 'burnie', 'harishakti', 'narayani', 'abha', 'alexander'];
      const isAllowedMorning = allowedMorningSatsang.some(name => teacherNameLower.includes(name));
      if (!isAllowedMorning) {
        conflicts.push({
          type: 'hard',
          message: `${teacher.name} darf morgens keinen Satsang leiten. Nur Anjali, Nirmaya, Burnie, Harishakti, Narayani, Abha und Alexander sind dafür eingeteilt (Satsang-Regel 3).`
        });
      }
    }

    // Regel 2: Abend-Satsang (20:00 - 21:00)
    if (course.startTime === '20:00') {
      // Mittwochs bis sonntags (3, 4, 5, 6, 0) leitet Karuna den Satsang am Abend
      if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
        let isKarunaAbsent = false;
        const karuna = (teachers || db.getTeachers()).find(t => t.name.toLowerCase().includes('karuna'));
        if (typeof window !== 'undefined' && targetWeekCode && karuna) {
          try {
            const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
            const saved = localStorage.getItem('rapla_sevafrei');
            if (saved) {
              const sevafreiList = JSON.parse(saved);
              const activeAbsence = sevafreiList.find((entry: any) =>
                entry.teacherId === karuna.id &&
                courseDate >= entry.startDate &&
                courseDate <= entry.endDate &&
                !['seminartage'].includes(entry.type.toLowerCase())
              );
              if (activeAbsence) {
                isKarunaAbsent = true;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (!teacherNameLower.includes('karuna')) {
          if (!isKarunaAbsent) {
            conflicts.push({
              type: 'hard',
              message: `Karuna leitet mittwochs bis sonntags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt (Satsang-Regel 2).`
            });
          } else {
            // Wenn Karuna abwesend ist, werden Narayani, Abha und Anjali bevorzugt
            const preferredBackups = ['narayani', 'abha', 'anjali'];
            const isPreferredBackup = preferredBackups.some(name => teacherNameLower.includes(name));
            if (!isPreferredBackup) {
              conflicts.push({
                type: 'soft',
                message: `${teacher.name} ist nicht die bevorzugte Vertretung (Narayani, Abha, Anjali) für Karuna am Abend (Satsang-Regel 2).`
              });
            }
          }
        }
      }

      // Montag abends um 20.00Uhr leitet Narayani den Satsang
      if (course.dayOfWeek === 1) {
        let isNarayaniAbsent = false;
        const narayani = (teachers || db.getTeachers()).find(t => t.name.toLowerCase().includes('narayani'));
        if (typeof window !== 'undefined' && targetWeekCode && narayani) {
          try {
            const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
            const saved = localStorage.getItem('rapla_sevafrei');
            if (saved) {
              const sevafreiList = JSON.parse(saved);
              const activeAbsence = sevafreiList.find((entry: any) =>
                entry.teacherId === narayani.id &&
                courseDate >= entry.startDate &&
                courseDate <= entry.endDate &&
                !['seminartage'].includes(entry.type.toLowerCase())
              );
              if (activeAbsence) {
                isNarayaniAbsent = true;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (!teacherNameLower.includes('narayani') && !isNarayaniAbsent) {
          conflicts.push({
            type: 'hard',
            message: `Narayani leitet montags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt (Satsang-Regel 2).`
          });
        }
      }
    }
  }

  // Teresa & Hu cannot lead yoga classes (hard constraint)
  if ((teacher.isYogaTeacher === false || teacherNameLower.includes('teresa') || teacherNameLower.includes('hu')) && isYogaClassForSevaka) {
    conflicts.push({
      type: 'hard',
      message: `${teacher.name} gibt keine Yogastunden.`
    });
  }

  // 1. Burnie
  if (teacherNameLower.includes('burnie')) {
    // Samstag, Dienstag, Freitag are free
    if ([2, 5, 6].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat samstags, dienstags und freitags frei.`
      });
    }
    // Max 1 Satsang am Morgen
    if (isSatsangForSevaka && course.startTime.toLowerCase() < '12:00') {
      const morningSatsangs = otherSevakaAssignments.filter(c => c.name.toLowerCase().includes('satsang') && c.startTime.toLowerCase() < '12:00');
      if (morningSatsangs.length >= 1) {
        conflicts.push({
          type: 'hard',
          message: `${teacher.name} kann nur einmal wöchentlich für einen Satsang am Morgen eingeteilt werden.`
        });
      }
    }
    // Max 1 geführte Meditation per week
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann nur einmal wöchentlich für eine geführte Meditation eingeteilt werden.`
      });
    }
  }

  // 2. Satyam
  if (teacherNameLower.includes('satyam')) {
    if (course.dayOfWeek === 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat montags frei.`
      });
    }
    // Max 2 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 2) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann maximal zweimal wöchentlich für Yogastunden eingeteilt werden.`
      });
    }
  }

  // 3. Teresa
  if (teacherNameLower.includes('teresa')) {
    if (course.dayOfWeek === 4) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat donnerstags frei.`
      });
    }
    // Max 1 ONN per week
    if (isOnnForSevaka && counts.onnCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} leitet Om Namo Narayanaya maximal einmal wöchentlich.`
      });
    }
  }

  // 4. Abha
  if (teacherNameLower.includes('abha')) {
    if ([0, 3].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat sonntags und mittwochs frei.`
      });
    }
    // Yin Yoga Anfängerstunde: max 1 per week
    const isYinAnfaenger = courseNameLower.includes('anfänger') && courseStyleLower.includes('yin');
    if (isYinAnfaenger) {
      const otherYinAnfaenger = otherSevakaAssignments.filter(c => c.name.toLowerCase().includes('anfänger') && c.style.toLowerCase().includes('yin'));
      if (otherYinAnfaenger.length >= 1) {
        conflicts.push({
          type: 'hard',
          message: `${teacher.name} kann nur einmal wöchentlich für eine Yin Yoga Anfängerstunde eingeteilt werden.`
        });
      }
    }
    // Max 3 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 3 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
  }

  // 5. Anjali
  if (teacherNameLower.includes('anjali')) {
    if (course.dayOfWeek === 3) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat mittwochs frei.`
      });
    }
    // Tue after 12:00 and Thu before 11:00
    if (course.dayOfWeek === 2 && timeToMinutes(course.startTime) >= timeToMinutes('12:00')) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist dienstags ab 12.00 Uhr nicht einteilbar.`
      });
    }
    if (course.dayOfWeek === 4 && timeToMinutes(course.startTime) < timeToMinutes('11:00')) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist donnerstags bis 11.00 Uhr nicht einteilbar.`
      });
    }
    // Max 3 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 3 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
  }

  // 7. Hu
  if (teacherNameLower.includes('hu')) {
    if (course.dayOfWeek === 2) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat dienstags frei.`
      });
    }
    // Mon after 12:00 and Wed before 12:00
    if (course.dayOfWeek === 1 && timeToMinutes(course.startTime) >= timeToMinutes('12:00')) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist montags nur bis 12.00 Uhr einplanbar.`
      });
    }
    if (course.dayOfWeek === 3 && timeToMinutes(course.startTime) < timeToMinutes('12:00')) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist mittwochs erst ab 12.00 Uhr einplanbar.`
      });
    }
  }

  // 8. Mounir
  if (teacherNameLower.includes('mounir') || teacherNameLower.includes('mouniir')) {
    if (course.dayOfWeek === 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat montags frei.`
      });
    }
  }

  // 9. Nirmaya
  if (teacherNameLower.includes('nirmaya')) {
    if ([2, 3].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat dienstags und mittwochs frei.`
      });
    }
    // Max 1 guided meditation per week
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann jede Woche nur für eine geführte Meditation eingeteilt werden.`
      });
    }
    // Max 1 morning satsang per week
    if (isSatsangForSevaka && course.startTime.toLowerCase() < '12:00' && counts.satsangCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann jede Woche nur für einen Satsang am Morgen eingeteilt werden.`
      });
    }
    // Max 2 Anfänger yoga classes per week
    const isAnfaengerYoga = isYogaClassForSevaka && courseNameLower.includes('anfänger');
    if (isAnfaengerYoga) {
      const otherAnfaengerYoga = otherSevakaAssignments.filter(c => {
        const cName = c.name.toLowerCase();
        const cStyle = c.style.toLowerCase();
        const cIsYoga = !cName.includes('meditation') && !cName.includes('medi.') && !cStyle.includes('meditation') && !cName.includes('satsang') && !cName.includes('om namo');
        return cIsYoga && cName.includes('anfänger');
      });
      if (otherAnfaengerYoga.length >= 2) {
        conflicts.push({
          type: 'hard',
          message: `${teacher.name} kann maximal zweimal wöchentlich für eine Anfängerstunde eingeteilt werden.`
        });
      }
    }
    // No yoga classes on Fridays, Saturdays, Sundays
    if (isYogaClassForSevaka && [5, 6, 0].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} unterrichtet freitags, samstags und sonntags keine Yogastunden.`
      });
    }
  }

  // 10. Narayani
  if (teacherNameLower.includes('narayani')) {
    if ([5, 6].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat freitags und samstags frei.`
      });
    }
    // Sun after 13:00
    if (course.dayOfWeek === 0 && timeToMinutes(course.startTime) >= timeToMinutes('13:00')) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} ist sonntags ab 13.00 Uhr nicht mehr einteilbar.`
      });
    }
    // Max 3 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 3 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
  }

  // 11. Pranava
  if (teacherNameLower.includes('pranava')) {
    if ([2, 3].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat dienstags und mittwochs frei.`
      });
    }
    // Max 4 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 4) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 4 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
    // Max 1 guided meditation per week
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann maximal einmal wöchentlich für eine geführte Meditation eingeteilt werden.`
      });
    }
  }

  // 12. Alexander
  if (teacherNameLower.includes('alexander')) {
    if ([0, 1].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat sonntags und montags frei.`
      });
    }
    // Max 1 Satsang per week
    if (isSatsangForSevaka && counts.satsangCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann maximal einmal wöchentlich für einen Satsang eingeteilt werden.`
      });
    }
    // Max 1 guided meditation per week
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} kann maximal einmal wöchentlich für eine geführte Meditation eingeteilt werden.`
      });
    }
    // Max 2 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 2) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 2 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
  }

  // 13. Adam
  if (teacherNameLower.includes('adam')) {
    if (course.dayOfWeek === 2) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat dienstags frei.`
      });
    }
    // Max 1 ONN per week
    if (isOnnForSevaka && counts.onnCount > 1) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} leitet Om Namo Narayanaya maximal einmal wöchentlich.`
      });
    }
  }

  // 14. Harishakti
  if (teacherNameLower.includes('harishakti')) {
    // Max 3 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 3 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
  }

  // 15. Ulrich
  if (teacherNameLower.includes('ulrich')) {
    if ([2, 6].includes(course.dayOfWeek)) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} hat dienstags und samstags frei.`
      });
    }
    // Max 4 yoga classes per week
    if (isYogaClassForSevaka && counts.yogaCount > 4) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} darf für maximal 4 Yogastunden wöchentlich eingeteilt werden.`
      });
    }
  }

  // 0. Check if active Yoga Teacher (Soft)
  if (teacher.isYogaTeacher === false) {
    conflicts.push({
      type: 'soft',
      message: `${teacher.name} ist nicht als aktiver Yogalehrer markiert (z. B. Seminarleiter).`
    });
  }

  // 0x. Check non-preferred weekdays (Soft)
  if (!isSevaka) {
    const nonPreferredDays = teacher.rules.nonPreferredDays || [];
    if (nonPreferredDays.includes(course.dayOfWeek)) {
      const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      const dayName = dayNames[course.dayOfWeek] || course.dayOfWeek.toString();
      conflicts.push({
        type: 'soft',
        message: `${teacher.name} möchte am ${dayName} bevorzugt nicht unterrichten (nicht bevorzugter Wochentag).`
      });
    }
  }

  // 0y. Expose custom wishes/notes (Soft)
  if (teacher.customWishes && teacher.customWishes.trim().length > 0) {
    conflicts.push({
      type: 'soft',
      message: `Spezifischer Wunsch von ${teacher.name}: "${teacher.customWishes}"`
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
  if (!isSevaka) {
    const isMeditationCourse = course.name === 'Gef. Meditation';

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
  }

  // 2. Check Availability (Hard)
  if (!isSevaka) {
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
  if (!isSevaka) {
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
  }

  // 5. Check Daily Class Limit (Hard)
  if (!isSevaka) {
    const classesOnDay = otherAssignments.length + 1; // plus the current one
    if (classesOnDay > teacher.rules.maxClassesPerDay) {
      conflicts.push({
        type: 'hard',
        message: `${teacher.name} überschreitet das Tageslimit von ${teacher.rules.maxClassesPerDay} Einheiten.`
      });
    }
  }

  // 6. Check Weekly Hours Limit (Hard)
  if (!isSevaka) {
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
  }

  // 7. Check Room Preference (Soft)
  if (!isSevaka) {
    if (teacher.rules.preferredRooms.length > 0) {
      const isPreferredRoom = teacher.rules.preferredRooms.includes(course.roomId);
      if (!isPreferredRoom) {
        conflicts.push({
          type: 'soft',
          message: `${teacher.name} unterrichtet bevorzugt in anderen Räumen.`
        });
      }
    }
  }

  // 8. Check Room Rules from Raum Regeln.txt (Hard)
  const roomConflicts = validateRoomRules(course, allCourses, teachers || db.getTeachers());
  conflicts.push(...roomConflicts);

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
      // Validate room rules even if no teacher is assigned
      validationMap[course.id] = validateRoomRules(course, courses, teachers);
      return;
    }
    const teacher = teachers.find(t => t.id === course.teacherId);
    if (!teacher) {
      validationMap[course.id] = validateRoomRules(course, courses, teachers);
      return;
    }
    validationMap[course.id] = validateAssignment(teacher, course, courses, seminarLeaderIds, targetWeekCode, teachers);
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
  
  // Find which courses need planning: either unassigned, marked for AI planning, or having an active absence (sevafrei/urlaub) for their pre-assigned teacher
  const coursesToPlan = workingCourses.filter(c => {
    if (c.teacherId === null || c.isAiPlanned) return true;
    const teacher = teachers.find(t => t.id === c.teacherId);
    if (!teacher) return true;
    
    // Simulate layout with this assignment and auto-adjust rooms
    const tempLayout = workingCourses.map(x => x.id === c.id ? { ...x, teacherId: teacher.id } : { ...x });
    adjustRoomsForRules(tempLayout, teachers);
    const adjustedCourse = tempLayout.find(x => x.id === c.id)!;

    const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers);
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
    // Revert custom course names to original template names
    if (c.name === 'Yoga Vidya meets Pavanmuktasana' || c.name === 'Anfänger Yin Yoga') {
      c.name = 'Anfänger';
    } else if (c.name === 'Yoga Flow Mittelstufe') {
      c.name = 'Mittelstufe';
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

      const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers);
      
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

      // Non-preferred day penalty
      const nonPreferredDaysVal = teacher.rules.nonPreferredDays || [];
      if (nonPreferredDaysVal.includes(course.dayOfWeek)) {
        score -= 40; // Deduct points if the teacher prefers not to teach on this day!
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

        // 2. Ankommensyogastunden (Friday and Sunday at 16:30, Hatha style/Mittelstufe name)
        const isAnkommYoga = isYogaClass &&
                             (course.name === 'Mittelstufe Ankommensstunde' || course.name === 'Mittelstufe AS' || course.name === 'Mittelstufe') &&
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

      // Custom scoring rules for Narayani: prefers Mittelstufe
      if (teacher.name.toLowerCase().includes('narayani')) {
        if (course.name.toLowerCase().includes('mittelstufe')) {
          score += 150; // High bonus for her preferred style
        }
      }

      // Custom scoring rules for Mounir: Wednesday morning meditation backup only
      if (teacher.name.toLowerCase().includes('mounir') || teacher.name.toLowerCase().includes('mouniir')) {
        if (course.name === 'Gef. Meditation' && course.dayOfWeek === 3 && course.startTime < '12:00') {
          score -= 150; // Large penalty so others are preferred
        }
      }

      // Custom scoring rules for Pranayama: prioritize Karuna and Burnie first, then Narayani and Abha
      const isPranayamaCourse = course.name.toLowerCase().includes('pranayama') || course.style.toLowerCase().includes('pranayama');
      if (isPranayamaCourse) {
        if (teacher.name.toLowerCase().includes('karuna') || teacher.name.toLowerCase().includes('burnie')) {
          score += 1000; // Prioritize Karuna and Burnie
        } else if (teacher.name.toLowerCase().includes('narayani') || teacher.name.toLowerCase().includes('abha')) {
          score += 200; // Secondary option
        }
      }

      // Custom scoring rules for Sunday Satsang Einführung: only Nirmaya, Anjali, Hu, Mounir
      const isSatsangEinfuehrungCourse = course.name.toLowerCase().includes('satsang einführung') || course.name.toLowerCase().includes('satsang-einführung');
      if (isSatsangEinfuehrungCourse && course.dayOfWeek === 0) {
        const allowed = ['nirmaya', 'anjali', 'hu', 'mounir'];
        const tNameLower = teacher.name.toLowerCase();
        const isAllowed = allowed.some(a => tNameLower.includes(a));
        if (isAllowed) {
          score += 500; // Prioritize these four
          
          // Parse week number for rotation
          let weekNum = 0;
          if (targetWeekCode) {
            const match = targetWeekCode.match(/-W(\d+)/);
            if (match) {
              weekNum = parseInt(match[1], 10);
            }
          }
          if (weekNum > 0) {
            // Rotate preferred teacher based on week index
            const preferredIndex = weekNum % allowed.length;
            const preferredName = allowed[preferredIndex];
            if (tNameLower.includes(preferredName)) {
              score += 1000; // Huge bonus for the rotating preference
            }
          }
        }
      }

      // --- SATSANG SCORING RULES ---
      if (course.name === 'Satsang') {
        const tNameLower = teacher.name.toLowerCase();
        
        // Morgen-Satsang (07:00):
        if (course.startTime === '07:00') {
          const allowedMorningSatsang = ['anjali', 'nirmaya', 'burnie', 'harishakti', 'narayani', 'abha', 'alexander'];
          if (allowedMorningSatsang.some(name => tNameLower.includes(name))) {
            score += 500; // Priorisiere erlaubte Morgen-Satsang-Leiter
          } else {
            score -= 10000; // Andere stark abwerten (obwohl harter Konflikt sie filtert)
          }
        }
        
        // Abend-Satsang (20:00):
        if (course.startTime === '20:00') {
          // Mittwochs bis sonntags: Karuna ist Standard
          if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
            if (tNameLower.includes('karuna')) {
              score += 10000; // Extrem hohe Priorität für Karuna
            } else {
              // Prüfe ob Karuna abwesend ist
              let isKarunaAbsent = false;
              const karuna = (teachers || db.getTeachers()).find(t => t.name.toLowerCase().includes('karuna'));
              if (targetWeekCode && karuna) {
                const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
                const saved = typeof window !== 'undefined' ? localStorage.getItem('rapla_sevafrei') : null;
                if (saved) {
                  const sevafreiList = JSON.parse(saved);
                  const activeAbsence = sevafreiList.find((entry: any) =>
                    entry.teacherId === karuna.id &&
                    courseDate >= entry.startDate &&
                    courseDate <= entry.endDate &&
                    !['seminartage'].includes(entry.type.toLowerCase())
                  );
                  if (activeAbsence) {
                    isKarunaAbsent = true;
                  }
                }
              }
              
              if (isKarunaAbsent) {
                // Wenn Karuna abwesend ist, werden Narayani, Abha und Anjali bevorzugt
                if (tNameLower.includes('narayani')) {
                  score += 8000; // Höchste Vertretungs-Priorität
                } else if (tNameLower.includes('abha') || tNameLower.includes('anjali')) {
                  score += 6000; // Zweithöchste Vertretungs-Priorität
                } else {
                  score += 100; // Niedrige Priorität für andere erlaubte Lehrer
                }
              } else {
                score -= 10000; // Karuna ist nicht abwesend und Lehrer ist nicht Karuna
              }
            }
          }
          
          // Montag: Narayani ist Standard
          if (course.dayOfWeek === 1) {
            if (tNameLower.includes('narayani')) {
              score += 10000; // Extrem hohe Priorität für Narayani
            } else {
              // Prüfe ob Narayani abwesend ist
              let isNarayaniAbsent = false;
              const narayani = (teachers || db.getTeachers()).find(t => t.name.toLowerCase().includes('narayani'));
              if (targetWeekCode && narayani) {
                const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
                const saved = typeof window !== 'undefined' ? localStorage.getItem('rapla_sevafrei') : null;
                if (saved) {
                  const sevafreiList = JSON.parse(saved);
                  const activeAbsence = sevafreiList.find((entry: any) =>
                    entry.teacherId === narayani.id &&
                    courseDate >= entry.startDate &&
                    courseDate <= entry.endDate &&
                    !['seminartage'].includes(entry.type.toLowerCase())
                  );
                  if (activeAbsence) {
                    isNarayaniAbsent = true;
                  }
                }
              }
              
              if (isNarayaniAbsent) {
                score += 500; // Erlaubt wenn Narayani abwesend ist
              } else {
                score -= 10000; // Narayani ist nicht abwesend und Lehrer ist nicht Narayani
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

    if (candidateScores.length > 0) {
      const bestCandidate = candidateScores[0];
      const index = workingCourses.findIndex(c => c.id === course.id);
      if (index !== -1) {
        workingCourses[index].teacherId = bestCandidate.teacher.id;
        workingCourses[index].isAiPlanned = true;

        // Apply custom course name based on Sevaka rules
        const tNameLower = bestCandidate.teacher.name.toLowerCase();
        if (tNameLower.includes('burnie') && workingCourses[index].name === 'Anfänger') {
          workingCourses[index].name = 'Yoga Vidya meets Pavanmuktasana';
        } else if (tNameLower.includes('satyam') && workingCourses[index].name === 'Mittelstufe') {
          workingCourses[index].name = 'Yoga Flow Mittelstufe';
        } else if (tNameLower.includes('abha') && workingCourses[index].name === 'Anfänger') {
          const hasYin = workingCourses.some(wc => wc.teacherId === bestCandidate.teacher.id && wc.name === 'Anfänger Yin Yoga');
          if (!hasYin) {
            workingCourses[index].name = 'Anfänger Yin Yoga';
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
