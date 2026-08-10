"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var planningEngine_exports = {};
__export(planningEngine_exports, {
  adjustCoursesForRules: () => adjustCoursesForRules,
  adjustNamesForRules: () => adjustNamesForRules,
  adjustRoomsForRules: () => adjustRoomsForRules,
  getAbsenceDetails: () => getAbsenceDetails,
  getDayName: () => getDayName,
  getLocalDateForDay: () => getLocalDateForDay,
  isOverlapping: () => isOverlapping,
  isTeacherAbsent: () => isTeacherAbsent,
  runAiPlanning: () => runAiPlanning,
  timeToMinutes: () => timeToMinutes,
  validateAllCourses: () => validateAllCourses,
  validateAssignment: () => validateAssignment,
  validateRoomRules: () => validateRoomRules
});
module.exports = __toCommonJS(planningEngine_exports);
var import_db = require("./db");
var import_wochenplan_rules = __toESM(require("./data/wochenplan_rules.json"), 1);
function timeToMinutes(timeStr) {
  const [hrs, mins] = timeStr.split(":").map(Number);
  return hrs * 60 + mins;
}
function isOverlapping(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}
function getLocalDateForDay(weekCode, dayOfWeek) {
  const [yearStr, weekStr] = weekCode.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
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
  const mm = (targetDate.getMonth() + 1).toString().padStart(2, "0");
  const dd = targetDate.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function getDayName(day) {
  const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return dayNames[day] || "";
}
function getAbsenceDetails(teacherName, dayOfWeek, targetWeekCode, absences) {
  if (!targetWeekCode) return null;
  const courseDate = getLocalDateForDay(targetWeekCode, dayOfWeek);
  if (absences && absences.length > 0) {
    const entry = absences.find((entry2) => {
      if (!entry2) return false;
      const entryName = entry2.teacherName.toLowerCase().trim();
      const isMatch = entryName.includes(teacherName) || teacherName.includes(entryName.split(" ")[0]);
      return isMatch && courseDate >= entry2.startDate && courseDate <= entry2.endDate;
    });
    if (entry) return entry;
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("rapla_sevafrei");
      if (saved) {
        const sevafreiList = JSON.parse(saved);
        const entry = sevafreiList.find((entry2) => {
          if (!entry2) return false;
          const entryName = entry2.teacherName.toLowerCase().trim();
          const isMatch = entryName.includes(teacherName) || teacherName.includes(entryName.split(" ")[0]);
          return isMatch && courseDate >= entry2.startDate && courseDate <= entry2.endDate;
        });
        if (entry) return entry;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return null;
}
function isTeacherAbsent(teacherName, dayOfWeek, targetWeekCode, absences) {
  return getAbsenceDetails(teacherName, dayOfWeek, targetWeekCode, absences) !== null;
}
function validateAssignment(teacher, course, allCourses, seminarLeaderIds = [], targetWeekCode, teachers, absences) {
  const conflicts = [];
  if (targetWeekCode) {
    const namesToCheck = [];
    if (teacher.name.includes(",")) {
      teacher.name.split(",").forEach((n) => namesToCheck.push(n.trim().toLowerCase()));
    } else {
      namesToCheck.push(teacher.name.toLowerCase().trim());
    }
    for (const name of namesToCheck) {
      const activeAbsence = getAbsenceDetails(name, course.dayOfWeek, targetWeekCode, absences);
      if (activeAbsence) {
        const isSatsang = course.name.toLowerCase().includes("satsang");
        const isBypassedType = ["seminartage"].includes(activeAbsence.type.toLowerCase());
        if (isSatsang && isBypassedType) {
        } else {
          conflicts.push({
            type: "hard",
            message: `${teacher.name} ist an diesem Datum (${getLocalDateForDay(targetWeekCode, course.dayOfWeek)}) abwesend (${activeAbsence.type}: ${activeAbsence.note || "Keine Angabe"}).`
          });
          break;
        }
      }
    }
  }
  const teacherNameLower = teacher.name.toLowerCase();
  const courseNameLower = course.name.toLowerCase();
  const courseStyleLower = course.style.toLowerCase();
  const isSevaka = teacher.roleType === "sevaka";
  const isMeditationForSevaka = (courseNameLower.includes("meditation") || courseNameLower.includes("medi.") || courseStyleLower.includes("meditation")) && !courseNameLower.includes("satsang");
  const isSatsangForSevaka = courseNameLower.includes("satsang");
  const isOnnForSevaka = courseNameLower.includes("om namo");
  const isYogaClassForSevaka = !isMeditationForSevaka && !isSatsangForSevaka && !isOnnForSevaka;
  const otherSevakaAssignments = allCourses.filter(
    (c) => c.teacherId === teacher.id && c.id !== course.id
  );
  const getWeeklyCounts = () => {
    let yogaCount = isYogaClassForSevaka ? 1 : 0;
    let meditationCount = isMeditationForSevaka ? 1 : 0;
    let satsangCount = isSatsangForSevaka ? 1 : 0;
    let onnCount = isOnnForSevaka ? 1 : 0;
    otherSevakaAssignments.forEach((c) => {
      const cName = c.name.toLowerCase();
      const cStyle = c.style.toLowerCase();
      const cIsMed = (cName.includes("meditation") || cName.includes("medi.") || cStyle.includes("meditation")) && !cName.includes("satsang");
      const cIsSat = cName.includes("satsang");
      const cIsOnn = cName.includes("om namo");
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
  const teacherKey = Object.keys(import_wochenplan_rules.default.teachers).find((k) => teacherNameLower.includes(k) || k.includes(teacherNameLower));
  const tRules = teacherKey ? import_wochenplan_rules.default.teachers[teacherKey] : null;
  const courseStart = timeToMinutes(course.startTime);
  const courseEnd = timeToMinutes(course.endTime);
  const daySlots = teacher.rules.availability.filter((slot) => slot.day === course.dayOfWeek);
  const fitsAvailability = daySlots.some((slot) => {
    const availStart = timeToMinutes(slot.start);
    const availEnd = timeToMinutes(slot.end);
    return courseStart >= availStart && courseEnd <= availEnd;
  });
  if (!fitsAvailability) {
    const isWalk = courseNameLower.includes("spaziergang");
    const isPranava = teacherNameLower.includes("pranava");
    if (!(isWalk && isPranava)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist am ${getDayName(course.dayOfWeek)} zur Kurszeit (${course.startTime} - ${course.endTime}) laut Regeln/Freitagen nicht verf\xFCgbar.`
      });
    }
  }
  const otherAssignments = allCourses.filter(
    (c) => c.teacherId === teacher.id && c.id !== course.id && c.dayOfWeek === course.dayOfWeek
  );
  const hasOverlap = otherAssignments.some(
    (other) => isOverlapping(course.startTime, course.endTime, other.startTime, other.endTime)
  );
  if (hasOverlap) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} hat zur gleichen Zeit bereits eine andere Klasse zugeteilt.`
    });
  }
  if (targetWeekCode) {
    try {
      const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
      const saved = typeof window !== "undefined" ? localStorage.getItem("rapla_sevafrei") : null;
      let activeAbsence = null;
      const checkList = absences || (saved ? JSON.parse(saved) : []);
      if (checkList && checkList.length > 0) {
        const namesToCheck = [];
        if (teacher.name.includes(",")) {
          teacher.name.split(",").forEach((n) => namesToCheck.push(n.trim().toLowerCase()));
        } else {
          namesToCheck.push(teacher.name.toLowerCase().trim());
        }
        for (const name of namesToCheck) {
          activeAbsence = checkList.find((entry) => {
            if (!entry) return false;
            const entryName = entry.teacherName.toLowerCase().trim();
            const isMatch = entryName.includes(name) || name.includes(entryName.split(" ")[0]);
            return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
          });
          if (activeAbsence) {
            if (activeAbsence.type.toLowerCase() === "seminartage" && isSatsangForSevaka) {
            } else {
              conflicts.push({
                type: "hard",
                message: `${teacher.name} ist an diesem Datum (${courseDate}) abwesend (${activeAbsence.type}: ${activeAbsence.note || "Keine Angabe"}).`
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error("Error during Sevafrei validation", e);
    }
  }
  const isPranayama = courseNameLower.includes("pranayama") || courseStyleLower.includes("pranayama");
  if (isPranayama) {
    const allowed = import_wochenplan_rules.default.pranayama.allowed;
    const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
    if (!isAllowed) {
      conflicts.push({
        type: "hard",
        message: `Pranayama darf nur von ${allowed.join(", ").toUpperCase()} unterrichtet werden.`
      });
    }
  }
  const isSatsangEinfuehrung = courseNameLower.includes("satsang einf\xFChrung") || courseNameLower.includes("satsang-einf\xFChrung") || courseNameLower.includes("satsangeinf\xFChrung");
  if (isSatsangEinfuehrung) {
    const generalAllowed = import_wochenplan_rules.default.satsangEinfuehrung.allowed;
    const isGeneralAllowed = generalAllowed.some((a) => teacherNameLower.includes(a));
    if (!isGeneralAllowed) {
      conflicts.push({
        type: "hard",
        message: `Die Satsang Einf\xFChrung darf nur von ${generalAllowed.join(", ").toUpperCase()} geleitet werden.`
      });
    }
    if (course.dayOfWeek === 5) {
      const primary = import_wochenplan_rules.default.satsangEinfuehrung.friday;
      const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
      if (!teacherNameLower.includes(primary) && !isPrimaryAbsent) {
        conflicts.push({
          type: "hard",
          message: `Freitags darf die Satsang Einf\xFChrung nur von ${primary.toUpperCase()} geleitet werden.`
        });
      }
    } else if (course.dayOfWeek === 0) {
      const allowed = import_wochenplan_rules.default.satsangEinfuehrung.sunday;
      const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
      if (!isAllowed) {
        conflicts.push({
          type: "hard",
          message: `Sonntags darf die Satsang Einf\xFChrung nur von ${allowed.join(", ").toUpperCase()} geleitet werden.`
        });
      }
    }
  }
  const isSatsangCourse = course.name === "Satsang";
  if (isSatsangCourse) {
    const forbiddenForSatsang = import_wochenplan_rules.default.satsang.forbidden;
    const isForbidden = forbiddenForSatsang.some((name) => teacherNameLower.includes(name));
    if (isForbidden) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf laut Satsang-Regeln nie f\xFCr einen Satsang eingeteilt werden.`
      });
    }
    if (course.dayOfWeek === 2 && course.startTime === "20:00") {
      conflicts.push({
        type: "hard",
        message: `Dienstagabends gibt es nie einen Satsang.`
      });
    }
    if (course.startTime === "07:00") {
      const allowedMorningSatsang = import_wochenplan_rules.default.satsang.morningAllowed;
      const isAllowedMorning = allowedMorningSatsang.some((name) => teacherNameLower.includes(name));
      if (!isAllowedMorning) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} darf morgens keinen Satsang leiten. Nur ${allowedMorningSatsang.join(", ").toUpperCase()} sind daf\xFCr eingeteilt.`
        });
      } else {
        const canDoTwo = import_wochenplan_rules.default.satsang.morningMaxTwo.some((name) => teacherNameLower.includes(name));
        const maxMorningSatsangs = canDoTwo ? 2 : 1;
        const otherMorningSatsangs = otherSevakaAssignments.filter((c) => c.name === "Satsang" && c.startTime === "07:00");
        if (otherMorningSatsangs.length >= maxMorningSatsangs) {
          conflicts.push({
            type: "hard",
            message: `${teacher.name} darf maximal ${maxMorningSatsangs} mal pro Woche f\xFCr einen Satsang am Morgen eingeteilt werden.`
          });
        }
      }
    }
    if (course.startTime === "20:00") {
      if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
        const primary = import_wochenplan_rules.default.satsang.evening.wedSun.primary;
        const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
        if (!teacherNameLower.includes(primary)) {
          if (!isPrimaryAbsent) {
            conflicts.push({
              type: "hard",
              message: `${primary.toUpperCase()} leitet mittwochs bis sonntags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt.`
            });
          } else {
            const backups = import_wochenplan_rules.default.satsang.evening.wedSun.backups;
            const isBackup = backups.some((name) => teacherNameLower.includes(name));
            if (!isBackup) {
              conflicts.push({
                type: "hard",
                message: `${teacher.name} darf ${primary.toUpperCase()}s Abend-Satsang nicht vertreten. Nur ${backups.join(", ").toUpperCase()} sind als Vertretung erlaubt.`
              });
            }
          }
        }
      }
      if (course.dayOfWeek === 1) {
        const primary = import_wochenplan_rules.default.satsang.evening.mon.primary;
        const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
        if (!teacherNameLower.includes(primary)) {
          if (!isPrimaryAbsent) {
            conflicts.push({
              type: "hard",
              message: `${primary.toUpperCase()} leitet montags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt.`
            });
          } else {
            const backups = import_wochenplan_rules.default.satsang.evening.mon.backups;
            const isBackup = backups.some((name) => teacherNameLower.includes(name));
            if (!isBackup) {
              conflicts.push({
                type: "hard",
                message: `${teacher.name} darf ${primary.toUpperCase()}s Abend-Satsang nicht vertreten. Nur ${backups.join(", ").toUpperCase()} sind als Vertretung erlaubt.`
              });
            }
          }
        }
      }
    }
  }
  if (isMeditationForSevaka && course.startTime === "07:00") {
    const primaryName = import_wochenplan_rules.default.meditation.dailyPrimary[course.dayOfWeek];
    if (primaryName) {
      const isPrimaryAbsent = isTeacherAbsent(primaryName, course.dayOfWeek, targetWeekCode, absences);
      if (!isPrimaryAbsent && !teacherNameLower.includes(primaryName)) {
        conflicts.push({
          type: "hard",
          message: `Die gef\xFChrte Meditation am ${getDayName(course.dayOfWeek)} darf nur von ${primaryName.toUpperCase()} geleitet werden (es sei denn, ${primaryName.toUpperCase()} ist laut sevafrei-Kalender abwesend).`
        });
      }
    }
  }
  const isMittelstufeAnkommen = (course.dayOfWeek === 5 || course.dayOfWeek === 0) && course.startTime === "16:30" && courseNameLower.includes("mittelstufe");
  if (isMittelstufeAnkommen) {
    const primary = import_wochenplan_rules.default.yoga.fridayMittelstufeAnkommen.primary;
    const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
    if (!isPrimaryAbsent) {
      if (!teacherNameLower.includes(primary)) {
        conflicts.push({
          type: "hard",
          message: `${primary.toUpperCase()} muss die Mittelstufe Ankommensstunde leiten, da sie laut sevafrei-Kalender verf\xFCgbar ist.`
        });
      }
    } else if (course.dayOfWeek === 0) {
      const backups = import_wochenplan_rules.default.yoga.sundayMittelstufeAnkommen.backups;
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
          type: "hard",
          message: `Da ${primary.toUpperCase()} abwesend ist, muss ${assignedBackup.toUpperCase()} die Mittelstufe Ankommensstunde am Sonntag leiten.`
        });
      }
    }
  }
  const isFridayMorningAnfaenger = course.dayOfWeek === 5 && course.startTime === "09:15" && courseNameLower.includes("anf\xE4nger");
  if (isFridayMorningAnfaenger) {
    const primary = import_wochenplan_rules.default.yoga.fridayMorningAnfaenger.primary;
    const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
    if (!isPrimaryAbsent) {
      if (!teacherNameLower.includes(primary)) {
        conflicts.push({
          type: "hard",
          message: `${primary.toUpperCase()} muss die Anf\xE4ngerstunde am Freitag um 09:15 Uhr leiten, da sie verf\xFCgbar ist.`
        });
      }
    } else {
      const backup = import_wochenplan_rules.default.yoga.fridayMorningAnfaenger.backup;
      const isBackupAbsent = isTeacherAbsent(backup, course.dayOfWeek, targetWeekCode, absences);
      if (!isBackupAbsent && !teacherNameLower.includes(backup)) {
        conflicts.push({
          type: "hard",
          message: `Da ${primary.toUpperCase()} abwesend ist, muss ${backup.toUpperCase()} die Anf\xE4ngerstunde am Freitag um 09:15 Uhr leiten.`
        });
      }
    }
  }
  if (teacher.isYogaTeacher === false && isYogaClassForSevaka) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} gibt keine Yogastunden.`
    });
  }
  if (teacher.rules.canLeadSatsang === false && isSatsangForSevaka) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} leitet nie Satsangs.`
    });
  }
  if (teacher.rules.maxYogaClassesPerWeek !== void 0 && isYogaClassForSevaka && counts.yogaCount > teacher.rules.maxYogaClassesPerWeek) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} darf f\xFCr maximal ${teacher.rules.maxYogaClassesPerWeek} Yogastunden w\xF6chentlich eingeteilt werden.`
    });
  }
  if (teacher.rules.maxMeditationPerWeek !== void 0 && isMeditationForSevaka && counts.meditationCount > teacher.rules.maxMeditationPerWeek) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} kann maximal ${teacher.rules.maxMeditationPerWeek} mal pro Woche f\xFCr eine gef\xFChrte Meditation eingeteilt werden.`
    });
  }
  if (teacher.rules.maxMorningSatsangsPerWeek !== void 0 && isSatsangForSevaka && course.startTime < "12:00") {
    const morningSatsangs = otherSevakaAssignments.filter((c) => c.name.toLowerCase().includes("satsang") && c.startTime < "12:00").length + 1;
    if (morningSatsangs > teacher.rules.maxMorningSatsangsPerWeek) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann maximal ${teacher.rules.maxMorningSatsangsPerWeek} mal pro Woche f\xFCr einen Satsang am Morgen eingeteilt werden.`
      });
    }
  }
  if (teacher.rules.maxOnnPerWeek !== void 0 && isOnnForSevaka && counts.onnCount > teacher.rules.maxOnnPerWeek) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} leitet Om Namo Narayanaya maximal ${teacher.rules.maxOnnPerWeek} mal w\xF6chentlich.`
    });
  }
  if (teacher.rules.noYogaOnWeekend && isYogaClassForSevaka && [5, 6, 0].includes(course.dayOfWeek)) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} unterrichtet freitags, samstags und sonntags keine Yogastunden.`
    });
  }
  if (teacher.rules.noTwoYogaSameDay && isYogaClassForSevaka) {
    const otherYogaOnDay = otherSevakaAssignments.some((c) => {
      const cName = c.name.toLowerCase();
      const cStyle = c.style.toLowerCase();
      const cIsYoga = !cName.includes("meditation") && !cName.includes("medi.") && !cStyle.includes("meditation") && !cName.includes("satsang") && !cName.includes("om namo");
      return cIsYoga && c.dayOfWeek === course.dayOfWeek;
    });
    if (otherYogaOnDay) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf nicht zwei Yogastunden am selben Tag leiten.`
      });
    }
  }
  if (teacher.rules.weekendAfternoonOnly && isYogaClassForSevaka && [5, 6, 0].includes(course.dayOfWeek)) {
    const isAfternoon = timeToMinutes(course.startTime) >= timeToMinutes("12:00");
    if (!isAfternoon) {
      conflicts.push({
        type: "hard",
        message: `Am Wochenende darf ${teacher.name} nur am Nachmittag f\xFCr eine Yogastunde eingeteilt werden.`
      });
    }
  }
  if (tRules && tRules.maxYinYogaAnfaengerPerWeek !== void 0) {
    const isYinAnfaenger = courseNameLower.includes("anf\xE4nger") && courseStyleLower.includes("yin");
    if (isYinAnfaenger) {
      const otherYinAnfaenger = otherSevakaAssignments.filter((c) => c.name.toLowerCase().includes("anf\xE4nger") && c.style.toLowerCase().includes("yin")).length + 1;
      if (otherYinAnfaenger > tRules.maxYinYogaAnfaengerPerWeek) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} kann nur ${tRules.maxYinYogaAnfaengerPerWeek} mal w\xF6chentlich f\xFCr eine Yin Yoga Anf\xE4ngerstunde eingeteilt werden.`
        });
      }
    }
  }
  if (tRules && tRules.maxAnfaengerYogaPerWeek !== void 0 && isYogaClassForSevaka && courseNameLower.includes("anf\xE4nger")) {
    const anfaengerYogaCount = otherSevakaAssignments.filter((c) => {
      const cName = c.name.toLowerCase();
      const cStyle = c.style.toLowerCase();
      const cIsYoga = !cName.includes("meditation") && !cName.includes("medi.") && !cStyle.includes("meditation") && !cName.includes("satsang") && !cName.includes("om namo");
      return cIsYoga && cName.includes("anf\xE4nger");
    }).length + 1;
    if (anfaengerYogaCount > tRules.maxAnfaengerYogaPerWeek) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann maximal ${tRules.maxAnfaengerYogaPerWeek} mal w\xF6chentlich f\xFCr eine Anf\xE4ngerstunde eingeteilt werden.`
      });
    }
  }
  const roomConflicts = validateRoomRules(course, allCourses, teachers || import_db.db.getTeachers());
  conflicts.push(...roomConflicts);
  return conflicts;
}
function validateAllCourses(courses, teachers, seminarLeaderIds = [], targetWeekCode, absences) {
  const validationMap = {};
  courses.forEach((course) => {
    if (!course.teacherId) {
      validationMap[course.id] = validateRoomRules(course, courses, teachers);
      return;
    }
    const teacher = teachers.find((t) => t.id === course.teacherId);
    if (!teacher) {
      validationMap[course.id] = validateRoomRules(course, courses, teachers);
      return;
    }
    validationMap[course.id] = validateAssignment(teacher, course, courses, seminarLeaderIds, targetWeekCode, teachers, absences);
  });
  return validationMap;
}
function runAiPlanning(courses, teachers, seminarLeaderIds = [], targetWeekCode, customConstraints = [], absences) {
  const logs = [];
  logs.push("Starte automatischen KI-Planungsalgorithmus...");
  const yogaTeachers = teachers.filter(
    (t) => t.roleType === "sevaka"
  );
  logs.push(`Ber\xFCcksichtige ${yogaTeachers.length} Sevakas (Kernteam) f\xFCr die KI-Vorplanung.`);
  let workingCourses = courses.map((c) => ({ ...c }));
  const coursesToPlan = workingCourses.filter((c) => {
    if (c.teacherId === null || c.isAiPlanned) return true;
    const teacher = teachers.find((t) => t.id === c.teacherId);
    if (!teacher) return true;
    const tempLayout = workingCourses.map((x) => x.id === c.id ? { ...x, teacherId: teacher.id } : { ...x });
    adjustRoomsForRules(tempLayout, teachers);
    const adjustedCourse = tempLayout.find((x) => x.id === c.id);
    const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
    const hasAbsenceConflict = conflicts.some((conf) => conf.type === "hard" && conf.message.includes("abwesend"));
    if (hasAbsenceConflict) {
      const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
      const dayName = dayNames[c.dayOfWeek] || c.dayOfWeek.toString();
      logs.push(`Replanung erforderlich f\xFCr "${c.name}" am ${dayName} (${c.startTime}), da ${teacher.name} abwesend/sevafrei ist.`);
      return true;
    }
    return false;
  });
  logs.push(`${coursesToPlan.length} Kurse m\xFCssen verplant werden.`);
  coursesToPlan.forEach((c) => {
    c.teacherId = null;
    c.isAiPlanned = false;
    const templateCourse = import_db.db.getDefaultCourses?.().find((tc) => tc.dayOfWeek === c.dayOfWeek && tc.startTime === c.startTime && tc.roomId === c.roomId);
    if (templateCourse) {
      c.name = templateCourse.name;
    } else {
      if (c.name === "Yoga Vidya meets Pavanmuktasana" || c.name === "Yoga Vidya Pavanmuktasana" || c.name === "Anf\xE4nger Yin Yoga") {
        c.name = "Anf\xE4nger";
      } else if (c.name === "Yoga Flow Mittelstufe") {
        c.name = "Mittelstufe";
      }
    }
  });
  for (const course of coursesToPlan) {
    logs.push(`Analysiere Eignung f\xFCr Kurs: "${course.name}" (${course.startTime} - ${course.endTime}, ${course.style})`);
    const candidateScores = [];
    for (const teacher of yogaTeachers) {
      const tempLayout = workingCourses.map((x) => x.id === course.id ? { ...x, teacherId: teacher.id } : { ...x });
      adjustRoomsForRules(tempLayout, teachers);
      const adjustedCourse = tempLayout.find((x) => x.id === course.id);
      const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
      const teacherNameLower = teacher.name.toLowerCase();
      const hardConflicts = conflicts.filter((c) => c.type === "hard");
      const softConflicts = conflicts.filter((c) => c.type === "soft");
      if (hardConflicts.length > 0) {
        continue;
      }
      let customExcluded = false;
      let customForced = false;
      let forceOther = false;
      if (customConstraints && customConstraints.length > 0) {
        for (const rule of customConstraints) {
          const ruleTeacherId = rule.teacherId;
          if (!ruleTeacherId) continue;
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
          let matchCourse = true;
          if (rDay !== void 0 && rDay !== null && course.dayOfWeek !== rDay) matchCourse = false;
          if (rStart !== void 0 && rStart !== null && course.startTime !== rStart) matchCourse = false;
          if (rCourseName !== void 0 && rCourseName !== null && !course.name.toLowerCase().includes(rCourseName.toLowerCase())) matchCourse = false;
          if (rCourseStyle !== void 0 && rCourseStyle !== null && !course.style.toLowerCase().includes(rCourseStyle.toLowerCase())) matchCourse = false;
          if (matchCourse) {
            if (rule.type === "exclude" && matchTeacher) {
              customExcluded = true;
              logs.push(`  [KI-REGEL-JS] Schlie\xDFe ${teacher.name} f\xFCr Kurs "${course.name}" (${course.startTime}) aus.`);
            }
            if (rule.type === "include") {
              if (matchTeacher) {
                customForced = true;
                logs.push(`  [KI-REGEL-JS] Zwinge Zuweisung von ${teacher.name} f\xFCr Kurs "${course.name}" (${course.startTime}).`);
              } else {
                forceOther = true;
              }
            }
          }
        }
      }
      if (customExcluded || forceOther) {
        continue;
      }
      let score = 100;
      if (customForced) {
        score += 1e5;
      }
      const plannedHours = workingCourses.filter((c) => c.teacherId === teacher.id).reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
      score -= plannedHours * 5;
      if (teacher.rules.prefersMittelstufe && course.name.toLowerCase().includes("mittelstufe")) {
        score += 150;
      }
      if (teacher.rules.weekendAsBackupOnly && [5, 6, 0].includes(course.dayOfWeek) && course.style.toLowerCase() !== "meditation") {
        if (timeToMinutes(course.startTime) >= timeToMinutes("12:00")) {
          score -= 1e3;
        }
      }
      const yogaRules = import_wochenplan_rules.default.yoga;
      if (course.dayOfWeek === 5 && course.startTime === "09:15" && course.name.toLowerCase().includes("anf\xE4nger")) {
        if (teacherNameLower.includes(yogaRules.fridayMorningAnfaenger.primary)) {
          score += 1e4;
        } else if (teacherNameLower.includes(yogaRules.fridayMorningAnfaenger.backup)) {
          score += 5e3;
        }
      }
      if (course.dayOfWeek === 5 && course.startTime === "09:15" && course.name.toLowerCase().includes("mittelstufe")) {
        if (teacherNameLower.includes(yogaRules.fridayMorningMittelstufe.primary)) {
          score += 1e4;
        }
      }
      const isMittelstufeAnkommen = (course.dayOfWeek === 5 || course.dayOfWeek === 0) && course.startTime === "16:30" && course.name.toLowerCase().includes("mittelstufe");
      if (isMittelstufeAnkommen) {
        const primary = yogaRules.fridayMittelstufeAnkommen.primary;
        if (teacherNameLower.includes(primary)) {
          score += 1e4;
        } else if (course.dayOfWeek === 0) {
          const backups = yogaRules.sundayMittelstufeAnkommen.backups;
          const idx = backups.findIndex((b) => teacherNameLower.includes(b));
          if (idx !== -1) {
            score += 5e3 - idx * 2500;
            if (backups[idx] === "ulrich") {
              score += 2e3;
            }
          }
        }
      }
      const isPranayamaCourse = course.name.toLowerCase().includes("pranayama") || course.style.toLowerCase().includes("pranayama");
      if (isPranayamaCourse) {
        const prioritized = import_wochenplan_rules.default.pranayama.prioritized || [];
        const allowed = import_wochenplan_rules.default.pranayama.allowed || [];
        if (prioritized.some((n) => teacherNameLower.includes(n))) {
          score += 1e3;
        } else if (allowed.some((n) => teacherNameLower.includes(n))) {
          score += 200;
        }
      }
      const isSatsangEinfuehrungCourse = course.name.toLowerCase().includes("satsang einf\xFChrung") || course.name.toLowerCase().includes("satsang-einf\xFChrung");
      if (isSatsangEinfuehrungCourse && course.dayOfWeek === 0) {
        const allowed = import_wochenplan_rules.default.satsangEinfuehrung.sunday;
        const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
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
              score += 1e3;
            }
          }
        }
      }
      const isMeditationCourse = course.name === "Gef\xFChrte Meditation" || course.style.toLowerCase() === "meditation";
      if (isMeditationCourse) {
        const allowed = import_wochenplan_rules.default.meditation.allowed;
        const forbidden = import_wochenplan_rules.default.meditation.forbidden;
        const isAllowed = allowed.some((name) => teacherNameLower.includes(name));
        const isForbidden = forbidden.some((name) => teacherNameLower.includes(name));
        if (isForbidden) {
          score -= 1e4;
        } else if (isAllowed) {
          score += 100;
          const primaryName = import_wochenplan_rules.default.meditation.dailyPrimary[course.dayOfWeek];
          if (primaryName && teacherNameLower.includes(primaryName)) {
            score += 1e4;
          }
        } else if (teacher.roleType === "sevaka") {
          score -= 1e4;
        }
      }
      if (course.name === "Satsang") {
        if (course.startTime === "07:00") {
          const allowedMorningSatsang = import_wochenplan_rules.default.satsang.morningAllowed;
          if (allowedMorningSatsang.some((name) => teacherNameLower.includes(name))) {
            score += 500;
          } else {
            score -= 1e4;
          }
        }
        if (course.startTime === "20:00") {
          if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
            const primary = import_wochenplan_rules.default.satsang.evening.wedSun.primary;
            if (teacherNameLower.includes(primary)) {
              score += 1e4;
            } else {
              const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
              if (isPrimaryAbsent) {
                const backups = import_wochenplan_rules.default.satsang.evening.wedSun.backups;
                const isBackup = backups.some((name) => teacherNameLower.includes(name));
                if (isBackup) {
                  score += 8e3;
                  const eveningSatsangCount = workingCourses.filter(
                    (c) => c.teacherId === teacher.id && c.name === "Satsang" && c.startTime === "20:00"
                  ).length;
                  score -= eveningSatsangCount * 2e3;
                } else {
                  score -= 1e4;
                }
              } else {
                score -= 1e4;
              }
            }
          }
          if (course.dayOfWeek === 1) {
            const primary = import_wochenplan_rules.default.satsang.evening.mon.primary;
            if (teacherNameLower.includes(primary)) {
              score += 1e4;
            } else {
              const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
              if (isPrimaryAbsent) {
                const backups = import_wochenplan_rules.default.satsang.evening.mon.backups;
                const isBackup = backups.some((name) => teacherNameLower.includes(name));
                if (isBackup) {
                  score += 8e3;
                  const eveningSatsangCount = workingCourses.filter(
                    (c) => c.teacherId === teacher.id && c.name === "Satsang" && c.startTime === "20:00"
                  ).length;
                  score -= eveningSatsangCount * 2e3;
                } else {
                  score -= 1e4;
                }
              } else {
                score -= 1e4;
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
    candidateScores.sort((a, b) => b.score - a.score);
    if (candidateScores.length === 0 && course.name === "Satsang") {
      logs.push(`  [NOTFALL] Kein konfliktfreier Lehrer f\xFCr Satsang am Tag ${course.dayOfWeek} um ${course.startTime} gefunden. Versuche Regeln zu lockern...`);
      for (const teacher of yogaTeachers) {
        const teacherNameLower = teacher.name.toLowerCase();
        const forbiddenForSatsang = ["adam", "hu", "mounir", "mouniir", "teresa", "satyam", "ulrich", "pranava"];
        if (forbiddenForSatsang.some((name) => teacherNameLower.includes(name))) {
          continue;
        }
        const tempLayout = workingCourses.map((x) => x.id === course.id ? { ...x, teacherId: teacher.id } : { ...x });
        adjustRoomsForRules(tempLayout, teachers);
        const adjustedCourse = tempLayout.find((x) => x.id === course.id);
        const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
        const nonRelaxableConflicts = conflicts.filter((c) => {
          if (c.type !== "hard") return false;
          const msg = c.message.toLowerCase();
          return msg.includes("abwesend") || msg.includes("urlaub") || msg.includes("krank") || msg.includes("satsang-regel 4") || msg.includes("nie f\xFCr einen satsang");
        });
        if (nonRelaxableConflicts.length === 0) {
          let score = 100;
          const plannedHours = workingCourses.filter((c) => c.teacherId === teacher.id).reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
          score -= plannedHours * 5;
          const hardConflictsToRelax = conflicts.filter((c) => c.type === "hard");
          score -= hardConflictsToRelax.length * 1e4;
          const combinedSoftConflicts = conflicts.map((c) => {
            if (c.type === "hard") {
              return { type: "soft", message: `[Regellockerung] ${c.message}` };
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
      candidateScores.sort((a, b) => b.score - a.score);
    }
    if (candidateScores.length > 0) {
      const bestCandidate = candidateScores[0];
      const index = workingCourses.findIndex((c) => c.id === course.id);
      if (index !== -1) {
        workingCourses[index].teacherId = bestCandidate.teacher.id;
        workingCourses[index].isAiPlanned = true;
        const tNameLower = bestCandidate.teacher.name.toLowerCase();
        const isYoga = !workingCourses[index].name.toLowerCase().includes("meditation") && !workingCourses[index].name.toLowerCase().includes("medi.") && !workingCourses[index].style.toLowerCase().includes("meditation") && !workingCourses[index].name.toLowerCase().includes("satsang") && !workingCourses[index].name.toLowerCase().includes("om namo");
        if (tNameLower.includes("burnie") && isYoga && workingCourses[index].name.toLowerCase().includes("anf\xE4nger")) {
          workingCourses[index].name = "Yoga Vidya Pavanmuktasana";
        } else if (tNameLower.includes("satyam") && workingCourses[index].name === "Mittelstufe") {
          workingCourses[index].name = "Yoga Flow Mittelstufe";
        } else if (tNameLower.includes("abha") && workingCourses[index].name === "Anf\xE4nger") {
          const hasYin = workingCourses.some((wc) => wc.teacherId === bestCandidate.teacher.id && wc.name === "Anf\xE4nger Yin Yoga");
          if (!hasYin) {
            workingCourses[index].name = "Anf\xE4nger Yin Yoga";
          }
        }
        if (workingCourses[index].dayOfWeek === 5 && workingCourses[index].startTime === "09:15" && workingCourses[index].name.toLowerCase().includes("mittelstufe")) {
          if (tNameLower.includes("pranava")) {
            workingCourses[index].name = "Mittelstufe Klangyogastunde";
          } else {
            workingCourses[index].name = "Mittelstufe";
          }
        }
        logs.push(`\u2713 Zuweisung erfolgreich: ${bestCandidate.teacher.name} (Score: ${bestCandidate.score.toFixed(0)})`);
        if (bestCandidate.conflicts.length > 0) {
          logs.push(`  Hinweis: ${bestCandidate.conflicts[0].message}`);
        }
      }
    } else {
      logs.push(`\u26A0\uFE0F Kein passender Yogalehrer ohne harte Konflikte f\xFCr "${course.name}" gefunden.`);
    }
  }
  workingCourses.forEach((c) => {
    if (!c.teacherId) return;
    const teacher = teachers.find((t) => t.id === c.teacherId);
    if (!teacher) return;
    const tNameLower = teacher.name.toLowerCase();
    const teacherKey = Object.keys(import_wochenplan_rules.default.teachers).find((k) => tNameLower.includes(k) || k.includes(tNameLower));
    const tRules = teacherKey ? import_wochenplan_rules.default.teachers[teacherKey] : null;
    if (tRules && tRules.customCourseNames && tRules.customCourseNames.length > 0) {
      tRules.customCourseNames.forEach((item) => {
        if (c.name.trim() === item.originalName.trim()) {
          c.name = item.customName;
        }
      });
    }
  });
  adjustRoomsForRules(workingCourses, teachers);
  const assignedCount = workingCourses.filter((c) => c.teacherId !== null && c.isAiPlanned).length;
  logs.push(`Planung abgeschlossen. ${assignedCount} von ${coursesToPlan.length} Kursen wurden erfolgreich zugewiesen.`);
  return {
    plannedCourses: workingCourses,
    logs
  };
}
function validateRoomRules(course, allCourses, teachers) {
  const conflicts = [];
  const nameLower = course.name.toLowerCase();
  const styleLower = course.style.toLowerCase();
  if (nameLower.includes("pranayama") || styleLower.includes("pranayama")) {
    if (course.roomId !== "room-2") {
      conflicts.push({
        type: "hard",
        message: `Pranayama-Stunden m\xFCssen im Radhakrishna Raum stattfinden.`
      });
    }
  }
  if (nameLower.includes("anf\xE4nger")) {
    const hasParallelPranavaKlang = allCourses.some((c) => {
      if (c.id === course.id) return false;
      if (c.dayOfWeek !== course.dayOfWeek || c.startTime !== course.startTime) return false;
      if (!c.name.toLowerCase().includes("mittelstufe") || !c.name.toLowerCase().includes("klang")) return false;
      if (!c.teacherId) return false;
      const t = teachers.find((x) => x.id === c.teacherId);
      return t && t.name.toLowerCase().includes("pranava");
    });
    if (hasParallelPranavaKlang) {
      if (course.roomId !== "room-5") {
        conflicts.push({
          type: "hard",
          message: `Da parallel eine Klangyogastunde Mittelstufe von Pranava stattfindet, muss die Anf\xE4ngerstunde im Tripura Raum stattfinden.`
        });
      }
    } else {
      if (course.roomId !== "room-2") {
        conflicts.push({
          type: "hard",
          message: `Yoga-Anf\xE4ngerstunden m\xFCssen im Radhakrishna Raum stattfinden.`
        });
      }
    }
  }
  if (nameLower.includes("mittelstufe")) {
    const isKlang = nameLower.includes("klang");
    let isPranava = false;
    if (course.teacherId) {
      const t = teachers.find((x) => x.id === course.teacherId);
      if (t && t.name.toLowerCase().includes("pranava")) {
        isPranava = true;
      }
    }
    if (isKlang && isPranava) {
      if (course.roomId !== "room-2") {
        conflicts.push({
          type: "hard",
          message: `Klangyogastunden Mittelstufe von Pranava m\xFCssen im Radhakrishna Raum stattfinden.`
        });
      }
    } else {
      if (course.roomId !== "room-5") {
        conflicts.push({
          type: "hard",
          message: `Yoga-Mittelstufen m\xFCssen im Tripura Raum stattfinden.`
        });
      }
    }
  }
  return conflicts;
}
function adjustRoomsForRules(courses, teachers) {
  courses.forEach((course) => {
    const nameLower = course.name.toLowerCase();
    const styleLower = course.style.toLowerCase();
    if (nameLower.includes("pranayama") || styleLower.includes("pranayama")) {
      course.roomId = "room-2";
      return;
    }
    const isBeginner = nameLower.includes("anf\xE4nger");
    const isIntermediate = nameLower.includes("mittelstufe");
    if (isBeginner) {
      const hasParallelPranavaKlang = courses.some((c) => {
        if (c.id === course.id) return false;
        if (c.dayOfWeek !== course.dayOfWeek || c.startTime !== course.startTime) return false;
        if (!c.name.toLowerCase().includes("mittelstufe") || !c.name.toLowerCase().includes("klang")) return false;
        if (!c.teacherId) return false;
        const t = teachers.find((x) => x.id === c.teacherId);
        return t && t.name.toLowerCase().includes("pranava");
      });
      if (hasParallelPranavaKlang) {
        course.roomId = "room-5";
      } else {
        course.roomId = "room-2";
      }
    } else if (isIntermediate) {
      const isKlang = nameLower.includes("klang");
      let isPranava = false;
      if (course.teacherId) {
        const t = teachers.find((x) => x.id === course.teacherId);
        if (t && t.name.toLowerCase().includes("pranava")) {
          isPranava = true;
        }
      }
      if (isKlang && isPranava) {
        course.roomId = "room-2";
      } else {
        course.roomId = "room-5";
      }
    }
  });
  return courses;
}
function adjustNamesForRules(courses, teachers) {
  courses.forEach((course) => {
    if (!course.teacherId) {
      if (course.name === "Yoga Vidya Pavanmuktasana" || course.name === "Yoga Flow Mittelstufe" || course.name === "Anf\xE4nger Yin Yoga") {
        course.name = course.name.toLowerCase().includes("anf\xE4nger") ? "Anf\xE4nger" : "Mittelstufe";
      }
      if (course.dayOfWeek === 5 && course.startTime === "09:15" && course.name === "Mittelstufe Klangyogastunde") {
        course.name = "Mittelstufe";
      }
      return;
    }
    const teacher = teachers.find((t) => t.id === course.teacherId);
    if (!teacher) return;
    const tNameLower = teacher.name.toLowerCase();
    const isYoga = !course.name.toLowerCase().includes("meditation") && !course.name.toLowerCase().includes("medi.") && !course.style.toLowerCase().includes("meditation") && !course.name.toLowerCase().includes("satsang") && !course.name.toLowerCase().includes("om namo");
    if (isYoga) {
      if (tNameLower.includes("burnie") && course.name.toLowerCase().includes("anf\xE4nger")) {
        course.name = "Yoga Vidya Pavanmuktasana";
      } else if (tNameLower.includes("satyam") && course.name.toLowerCase().includes("mittelstufe")) {
        course.name = "Yoga Flow Mittelstufe";
      } else if (tNameLower.includes("abha") && course.name.toLowerCase().includes("anf\xE4nger")) {
        course.name = "Anf\xE4nger Yin Yoga";
      } else {
        if (course.name === "Yoga Vidya Pavanmuktasana" || course.name === "Yoga Flow Mittelstufe" || course.name === "Anf\xE4nger Yin Yoga") {
          if (course.dayOfWeek === 5 || course.dayOfWeek === 0) {
            if (course.startTime === "16:30") {
              course.name = course.name.toLowerCase().includes("anf\xE4nger") ? "Anf\xE4nger Ankommensstunde" : "Mittelstufe Ankommensstunde";
            } else {
              course.name = course.name.toLowerCase().includes("anf\xE4nger") ? "Anf\xE4nger" : "Mittelstufe";
            }
          } else {
            course.name = course.name.toLowerCase().includes("anf\xE4nger") ? "Anf\xE4nger" : "Mittelstufe";
          }
        }
      }
    }
    if (course.dayOfWeek === 5 && course.startTime === "09:15" && course.name.toLowerCase().includes("mittelstufe")) {
      if (tNameLower.includes("pranava")) {
        course.name = "Mittelstufe Klangyogastunde";
      } else {
        course.name = "Mittelstufe";
      }
    }
  });
  return courses;
}
function adjustCoursesForRules(courses, teachers) {
  adjustNamesForRules(courses, teachers);
  adjustRoomsForRules(courses, teachers);
  return courses;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adjustCoursesForRules,
  adjustNamesForRules,
  adjustRoomsForRules,
  getAbsenceDetails,
  getDayName,
  getLocalDateForDay,
  isOverlapping,
  isTeacherAbsent,
  runAiPlanning,
  timeToMinutes,
  validateAllCourses,
  validateAssignment,
  validateRoomRules
});
