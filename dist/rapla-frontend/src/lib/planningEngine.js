"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var planningEngine_exports = {};
__export(planningEngine_exports, {
  adjustRoomsForRules: () => adjustRoomsForRules,
  getLocalDateForDay: () => getLocalDateForDay,
  isOverlapping: () => isOverlapping,
  runAiPlanning: () => runAiPlanning,
  timeToMinutes: () => timeToMinutes,
  validateAllCourses: () => validateAllCourses,
  validateAssignment: () => validateAssignment,
  validateRoomRules: () => validateRoomRules
});
module.exports = __toCommonJS(planningEngine_exports);
var import_db = require("./db");
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
function validateAssignment(teacher, course, allCourses, seminarLeaderIds = [], targetWeekCode, teachers) {
  const conflicts = [];
  if (typeof window !== "undefined" && targetWeekCode) {
    try {
      const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
      const saved = localStorage.getItem("rapla_sevafrei");
      if (saved) {
        const sevafreiList = JSON.parse(saved);
        const namesToCheck = [];
        if (teacher.name.includes(",")) {
          teacher.name.split(",").forEach((n) => namesToCheck.push(n.trim().toLowerCase()));
        } else {
          namesToCheck.push(teacher.name.toLowerCase().trim());
        }
        for (const name of namesToCheck) {
          const activeAbsence = sevafreiList.find((entry) => {
            const entryName = entry.teacherName.toLowerCase().trim();
            const isMatch = entryName.includes(name) || name.includes(entryName.split(" ")[0]);
            return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
          });
          if (activeAbsence) {
            const isSatsang = course.name.toLowerCase().includes("satsang");
            const isBypassedType = ["seminartage"].includes(activeAbsence.type.toLowerCase());
            if (isSatsang && isBypassedType) {
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
  const isSevaka = teacher.roleType === "sevaka";
  const teacherNameLower = teacher.name.toLowerCase();
  const courseNameLower = course.name.toLowerCase();
  const courseStyleLower = course.style.toLowerCase();
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
  const isPranayama = courseNameLower.includes("pranayama") || courseStyleLower.includes("pranayama");
  if (isPranayama) {
    const allowed = ["karuna", "burnie", "narayani", "abha"];
    const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
    if (!isAllowed) {
      conflicts.push({
        type: "hard",
        message: `Pranayama darf nur von Karuna, Burnie, Narayani oder Abha unterrichtet werden.`
      });
    }
  }
  const isSatsangEinfuehrung = courseNameLower.includes("satsang einf\xFChrung") || courseNameLower.includes("satsang-einf\xFChrung") || courseNameLower.includes("satsangeinf\xFChrung");
  if (isSatsangEinfuehrung) {
    if (course.dayOfWeek === 5) {
      let isPranavaAbsent = false;
      const pranava = (teachers || import_db.db.getTeachers()).find((t) => t.name.toLowerCase().includes("pranava"));
      if (typeof window !== "undefined" && targetWeekCode && pranava) {
        try {
          const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
          const saved = localStorage.getItem("rapla_sevafrei");
          if (saved) {
            const sevafreiList = JSON.parse(saved);
            const activeAbsence = sevafreiList.find(
              (entry) => entry.teacherId === pranava.id && courseDate >= entry.startDate && courseDate <= entry.endDate
            );
            if (activeAbsence) {
              isPranavaAbsent = true;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (!teacherNameLower.includes("pranava") && !isPranavaAbsent) {
        conflicts.push({
          type: "hard",
          message: `Freitags darf die Satsang Einf\xFChrung nur von Pranava geleitet werden.`
        });
      }
    } else if (course.dayOfWeek === 0) {
      const allowed = ["nirmaya", "anjali", "hu", "mounir"];
      const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
      if (!isAllowed) {
        conflicts.push({
          type: "hard",
          message: `Sonntags darf die Satsang Einf\xFChrung nur von Nirmaya, Anjali, Hu oder Mounir geleitet werden.`
        });
      }
    }
  }
  const isSatsangCourse = course.name === "Satsang";
  if (isSatsangCourse) {
    const forbiddenForSatsang = ["adam", "hu", "mounir", "mouniir", "teresa", "satyam", "ulrich", "pranava"];
    const isForbidden = forbiddenForSatsang.some((name) => teacherNameLower.includes(name));
    if (isForbidden) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf laut Satsang-Regel 4 nie f\xFCr einen Satsang eingeteilt werden.`
      });
    }
    if (course.dayOfWeek === 2 && course.startTime === "20:00") {
      conflicts.push({
        type: "hard",
        message: `Dienstagabends gibt es nie einen Satsang (Satsang-Regel 1).`
      });
    }
    if (course.startTime === "07:00") {
      const allowedMorningSatsang = ["anjali", "nirmaya", "burnie", "harishakti", "narayani", "abha", "alexander"];
      const isAllowedMorning = allowedMorningSatsang.some((name) => teacherNameLower.includes(name));
      if (!isAllowedMorning) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} darf morgens keinen Satsang leiten. Nur Anjali, Nirmaya, Burnie, Harishakti, Narayani, Abha und Alexander sind daf\xFCr eingeteilt (Satsang-Regel 3).`
        });
      } else {
        const canDoTwo = ["harishakti", "burnie", "alexander", "anjali"].some((name) => teacherNameLower.includes(name));
        const maxMorningSatsangs = canDoTwo ? 2 : 1;
        const otherMorningSatsangs = otherSevakaAssignments.filter((c) => c.name === "Satsang" && c.startTime === "07:00");
        if (otherMorningSatsangs.length >= maxMorningSatsangs) {
          conflicts.push({
            type: "hard",
            message: `${teacher.name} darf maximal ${maxMorningSatsangs} mal pro Woche f\xFCr einen Satsang am Morgen eingeteilt werden (Satsang-Regel 3).`
          });
        }
      }
    }
    if (course.startTime === "20:00") {
      if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
        let isKarunaAbsent = false;
        const karuna = (teachers || import_db.db.getTeachers()).find((t) => t.name.toLowerCase().includes("karuna"));
        if (typeof window !== "undefined" && targetWeekCode && karuna) {
          try {
            const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
            const saved = localStorage.getItem("rapla_sevafrei");
            if (saved) {
              const sevafreiList = JSON.parse(saved);
              const activeAbsence = sevafreiList.find(
                (entry) => entry.teacherId === karuna.id && courseDate >= entry.startDate && courseDate <= entry.endDate && !["seminartage"].includes(entry.type.toLowerCase())
              );
              if (activeAbsence) {
                isKarunaAbsent = true;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (!teacherNameLower.includes("karuna")) {
          if (!isKarunaAbsent) {
            conflicts.push({
              type: "hard",
              message: `Karuna leitet mittwochs bis sonntags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt (Satsang-Regel 2).`
            });
          } else {
            const preferredBackups = ["narayani", "abha", "anjali"];
            const isPreferredBackup = preferredBackups.some((name) => teacherNameLower.includes(name));
            if (!isPreferredBackup) {
              conflicts.push({
                type: "hard",
                message: `${teacher.name} darf Karunas Abend-Satsang nicht vertreten. Nur Narayani, Abha und Anjali sind als Vertretung erlaubt (Satsang-Regel 2).`
              });
            }
          }
        }
      }
      if (course.dayOfWeek === 1) {
        let isNarayaniAbsent = false;
        const narayani = (teachers || import_db.db.getTeachers()).find((t) => t.name.toLowerCase().includes("narayani"));
        if (typeof window !== "undefined" && targetWeekCode && narayani) {
          try {
            const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
            const saved = localStorage.getItem("rapla_sevafrei");
            if (saved) {
              const sevafreiList = JSON.parse(saved);
              const activeAbsence = sevafreiList.find(
                (entry) => entry.teacherId === narayani.id && courseDate >= entry.startDate && courseDate <= entry.endDate && !["seminartage"].includes(entry.type.toLowerCase())
              );
              if (activeAbsence) {
                isNarayaniAbsent = true;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (!teacherNameLower.includes("narayani")) {
          if (!isNarayaniAbsent) {
            conflicts.push({
              type: "hard",
              message: `Narayani leitet montags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt (Satsang-Regel 2).`
            });
          } else {
            const preferredBackups = ["abha", "anjali"];
            const isPreferredBackup = preferredBackups.some((name) => teacherNameLower.includes(name));
            if (!isPreferredBackup) {
              conflicts.push({
                type: "hard",
                message: `${teacher.name} darf Narayanis Abend-Satsang nicht vertreten. Nur Abha und Anjali sind als Vertretung erlaubt (Satsang-Regel 2).`
              });
            }
          }
        }
      }
    }
  }
  if ((teacher.isYogaTeacher === false || teacherNameLower.includes("teresa") || teacherNameLower.includes("hu") || teacherNameLower.includes("mounir") || teacherNameLower.includes("mouniir") || teacherNameLower.includes("adam")) && isYogaClassForSevaka) {
    conflicts.push({
      type: "hard",
      message: `${teacher.name} gibt keine Yogastunden.`
    });
  }
  if (teacherNameLower.includes("burnie")) {
    if ([2, 5, 6].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat samstags, dienstags und freitags frei.`
      });
    }
    if (isSatsangForSevaka && course.startTime.toLowerCase() < "12:00") {
      const morningSatsangs = otherSevakaAssignments.filter((c) => c.name.toLowerCase().includes("satsang") && c.startTime.toLowerCase() < "12:00");
      if (morningSatsangs.length >= 2) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} kann maximal zweimal w\xF6chentlich f\xFCr einen Satsang am Morgen eingeteilt werden.`
        });
      }
    }
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann nur einmal w\xF6chentlich f\xFCr eine gef\xFChrte Meditation eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("satyam")) {
    if (course.dayOfWeek === 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat montags frei.`
      });
    }
    if (isYogaClassForSevaka && counts.yogaCount > 2) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann maximal zweimal w\xF6chentlich f\xFCr Yogastunden eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("teresa")) {
    if (course.dayOfWeek === 4) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat donnerstags frei.`
      });
    }
    if (isOnnForSevaka && counts.onnCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} leitet Om Namo Narayanaya maximal einmal w\xF6chentlich.`
      });
    }
  }
  if (teacherNameLower.includes("abha")) {
    if ([0, 3].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat sonntags und mittwochs frei.`
      });
    }
    const isYinAnfaenger = courseNameLower.includes("anf\xE4nger") && courseStyleLower.includes("yin");
    if (isYinAnfaenger) {
      const otherYinAnfaenger = otherSevakaAssignments.filter((c) => c.name.toLowerCase().includes("anf\xE4nger") && c.style.toLowerCase().includes("yin"));
      if (otherYinAnfaenger.length >= 1) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} kann nur einmal w\xF6chentlich f\xFCr eine Yin Yoga Anf\xE4ngerstunde eingeteilt werden.`
        });
      }
    }
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 3 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("anjali")) {
    if (course.dayOfWeek === 3) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat mittwochs frei.`
      });
    }
    if (course.dayOfWeek === 2 && timeToMinutes(course.startTime) >= timeToMinutes("12:00")) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist dienstags ab 12.00 Uhr nicht einteilbar.`
      });
    }
    if (course.dayOfWeek === 4 && timeToMinutes(course.startTime) < timeToMinutes("11:00")) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist donnerstags bis 11.00 Uhr nicht einteilbar.`
      });
    }
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 3 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("hu")) {
    if (course.dayOfWeek === 2) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat dienstags frei.`
      });
    }
    if (course.dayOfWeek === 1 && timeToMinutes(course.startTime) >= timeToMinutes("12:00")) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist montags nur bis 12.00 Uhr einplanbar.`
      });
    }
    if (course.dayOfWeek === 3 && timeToMinutes(course.startTime) < timeToMinutes("12:00")) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist mittwochs erst ab 12.00 Uhr einplanbar.`
      });
    }
  }
  if (teacherNameLower.includes("mounir") || teacherNameLower.includes("mouniir")) {
    if (course.dayOfWeek === 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat montags frei.`
      });
    }
    if (isYogaClassForSevaka) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} gibt keine Yogastunden.`
      });
    }
    if (course.name === "Gef\xFChrte Meditation" && course.dayOfWeek !== 3) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf gef\xFChrte Meditationen nur mittwochs leiten.`
      });
    }
    if (isSatsangForSevaka) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} leitet nie Satsangs.`
      });
    }
  }
  if (teacherNameLower.includes("nirmaya")) {
    if ([2, 3].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat dienstags und mittwochs frei.`
      });
    }
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann jede Woche nur f\xFCr eine gef\xFChrte Meditation eingeteilt werden.`
      });
    }
    if (isSatsangForSevaka && course.startTime.toLowerCase() < "12:00" && counts.satsangCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann jede Woche nur f\xFCr einen Satsang am Morgen eingeteilt werden.`
      });
    }
    const isAnfaengerYoga = isYogaClassForSevaka && courseNameLower.includes("anf\xE4nger");
    if (isAnfaengerYoga) {
      const otherAnfaengerYoga = otherSevakaAssignments.filter((c) => {
        const cName = c.name.toLowerCase();
        const cStyle = c.style.toLowerCase();
        const cIsYoga = !cName.includes("meditation") && !cName.includes("medi.") && !cStyle.includes("meditation") && !cName.includes("satsang") && !cName.includes("om namo");
        return cIsYoga && cName.includes("anf\xE4nger");
      });
      if (otherAnfaengerYoga.length >= 2) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} kann maximal zweimal w\xF6chentlich f\xFCr eine Anf\xE4ngerstunde eingeteilt werden.`
        });
      }
    }
    if (isYogaClassForSevaka && [5, 6, 0].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} unterrichtet freitags, samstags und sonntags keine Yogastunden.`
      });
    }
  }
  if (teacherNameLower.includes("narayani")) {
    if ([5, 6].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat freitags und samstags frei.`
      });
    }
    if (course.dayOfWeek === 0 && timeToMinutes(course.startTime) >= timeToMinutes("13:00")) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist sonntags ab 13.00 Uhr nicht mehr einteilbar.`
      });
    }
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 3 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("pranava")) {
    if ([2, 3].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat dienstags und mittwochs frei.`
      });
    }
    if (isYogaClassForSevaka && counts.yogaCount > 4) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 4 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann maximal einmal w\xF6chentlich f\xFCr eine gef\xFChrte Meditation eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("alexander")) {
    if ([0, 1].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat sonntags und montags frei.`
      });
    }
    if (isSatsangForSevaka && counts.satsangCount > 2) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann maximal zweimal w\xF6chentlich f\xFCr einen Satsang eingeteilt werden.`
      });
    }
    if (isMeditationForSevaka && counts.meditationCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} kann maximal einmal w\xF6chentlich f\xFCr eine gef\xFChrte Meditation eingeteilt werden.`
      });
    }
    if (isYogaClassForSevaka && counts.yogaCount > 2) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 2 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("adam")) {
    if (course.dayOfWeek === 2) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat dienstags frei.`
      });
    }
    if (isOnnForSevaka && counts.onnCount > 1) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} leitet Om Namo Narayanaya maximal einmal w\xF6chentlich.`
      });
    }
    if (isYogaClassForSevaka) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} gibt keine Yogastunden.`
      });
    }
    if (isSatsangForSevaka) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} leitet nie Satsangs.`
      });
    }
  }
  if (teacherNameLower.includes("harishakti")) {
    if (isYogaClassForSevaka && counts.yogaCount > 3) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 3 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
  }
  if (teacherNameLower.includes("ulrich")) {
    if ([2, 6].includes(course.dayOfWeek)) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} hat dienstags und samstags frei.`
      });
    }
    if (isYogaClassForSevaka && counts.yogaCount > 4) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} darf f\xFCr maximal 4 Yogastunden w\xF6chentlich eingeteilt werden.`
      });
    }
    if (isOnnForSevaka) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} leitet nie Om Namo Narayanaya.`
      });
    }
    if (isYogaClassForSevaka) {
      const otherYogaSameDay = otherSevakaAssignments.some((c) => {
        const cName = c.name.toLowerCase();
        const cStyle = c.style.toLowerCase();
        const cIsMed = (cName.includes("meditation") || cName.includes("medi.") || cStyle.includes("meditation")) && !cName.includes("satsang");
        const cIsSat = cName.includes("satsang");
        const cIsOnn = cName.includes("om namo");
        const cIsYoga = !cIsMed && !cIsSat && !cIsOnn;
        return cIsYoga && c.dayOfWeek === course.dayOfWeek;
      });
      if (otherYogaSameDay) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} darf nicht zwei Yogastunden am selben Tag leiten.`
        });
      }
    }
    if (isYogaClassForSevaka && [5, 0].includes(course.dayOfWeek)) {
      if (timeToMinutes(course.startTime) < timeToMinutes("12:00")) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} darf freitags und sonntags nur am Nachmittag f\xFCr eine Yogastunde eingeteilt werden.`
        });
      }
    }
  }
  if (teacherNameLower.includes("karuna")) {
    if (isOnnForSevaka) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} leitet nie Om Namo Narayanaya.`
      });
    }
  }
  if (teacher.isYogaTeacher === false) {
    conflicts.push({
      type: "soft",
      message: `${teacher.name} ist nicht als aktiver Yogalehrer markiert (z. B. Seminarleiter).`
    });
  }
  if (!isSevaka) {
    const nonPreferredDays = teacher.rules.nonPreferredDays || [];
    if (nonPreferredDays.includes(course.dayOfWeek)) {
      const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
      const dayName = dayNames[course.dayOfWeek] || course.dayOfWeek.toString();
      conflicts.push({
        type: "soft",
        message: `${teacher.name} m\xF6chte am ${dayName} bevorzugt nicht unterrichten (nicht bevorzugter Wochentag).`
      });
    }
  }
  if (teacher.customWishes && teacher.customWishes.trim().length > 0) {
    conflicts.push({
      type: "soft",
      message: `Spezifischer Wunsch von ${teacher.name}: "${teacher.customWishes}"`
    });
  }
  if (teacher.availabilityMode === "seminar_only" && !seminarLeaderIds.includes(teacher.id)) {
    conflicts.push({
      type: "soft",
      message: `${teacher.name} ist als externer Seminarleiter markiert, leitet aber in dieser Woche kein Seminar.`
    });
  }
  if (!isSevaka) {
    const isMeditationCourse = course.name === "Gef\xFChrte Meditation";
    if (isMeditationCourse) {
      if (!teacher.rules.canLeadMeditation) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} ist nicht f\xFCr gef\xFChrte Meditationen qualifiziert.`
        });
      }
    } else if (isSatsangCourse) {
      if (!teacher.rules.canLeadSatsang) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} ist nicht f\xFCr Satsang-Leitungen qualifiziert.`
        });
      }
    } else {
      const isQualified = teacher.specialties.some(
        (spec) => spec.toLowerCase() === course.style.toLowerCase()
      );
      if (!isQualified) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} hat keine Spezialisierung f\xFCr den Yoga-Stil "${course.style}".`
        });
      }
    }
  }
  if (!isSevaka) {
    const courseStart = timeToMinutes(course.startTime);
    const courseEnd = timeToMinutes(course.endTime);
    const daySlots = teacher.rules.availability.filter((slot) => slot.day === course.dayOfWeek);
    const fitsAvailability = daySlots.some((slot) => {
      const availStart = timeToMinutes(slot.start);
      const availEnd = timeToMinutes(slot.end);
      return courseStart >= availStart && courseEnd <= availEnd;
    });
    if (!fitsAvailability) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} ist am gew\xE4hlten Wochentag zur Kurszeit (${course.startTime} - ${course.endTime}) laut Arbeitszeiten nicht verf\xFCgbar.`
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
  if (!isSevaka) {
    const restTime = teacher.rules.minRestTime;
    if (restTime > 0) {
      const hasBufferConflict = otherAssignments.some((other) => {
        const c1Start = timeToMinutes(course.startTime);
        const c1End = timeToMinutes(course.endTime);
        const c2Start = timeToMinutes(other.startTime);
        const c2End = timeToMinutes(other.endTime);
        let gap = 0;
        if (c1Start >= c2End) {
          gap = c1Start - c2End;
        } else if (c2Start >= c1End) {
          gap = c2Start - c1End;
        } else {
          return true;
        }
        return gap < restTime;
      });
      if (hasBufferConflict) {
        conflicts.push({
          type: "hard",
          message: `${teacher.name} ben\xF6tigt zwischen den Kursen eine Mindestpause von ${restTime} Minuten.`
        });
      }
    }
  }
  if (!isSevaka) {
    const classesOnDay = otherAssignments.length + 1;
    if (classesOnDay > teacher.rules.maxClassesPerDay) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} \xFCberschreitet das Tageslimit von ${teacher.rules.maxClassesPerDay} Einheiten.`
      });
    }
  }
  if (!isSevaka) {
    const courseDurationMins = timeToMinutes(course.endTime) - timeToMinutes(course.startTime);
    const weeklyDurationMins = allCourses.filter((c) => c.teacherId === teacher.id && c.id !== course.id).reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)), 0) + courseDurationMins;
    const weeklyHours = weeklyDurationMins / 60;
    if (weeklyHours > teacher.rules.maxHoursPerWeek) {
      conflicts.push({
        type: "hard",
        message: `${teacher.name} \xFCberschreitet die w\xF6chentliche maximale Arbeitszeit von ${teacher.rules.maxHoursPerWeek} Std. (Geplant: ${weeklyHours.toFixed(1)} Std.).`
      });
    }
  }
  if (!isSevaka) {
    if (teacher.rules.preferredRooms.length > 0) {
      const isPreferredRoom = teacher.rules.preferredRooms.includes(course.roomId);
      if (!isPreferredRoom) {
        conflicts.push({
          type: "soft",
          message: `${teacher.name} unterrichtet bevorzugt in anderen R\xE4umen.`
        });
      }
    }
  }
  const roomConflicts = validateRoomRules(course, allCourses, teachers || import_db.db.getTeachers());
  conflicts.push(...roomConflicts);
  return conflicts;
}
function validateAllCourses(courses, teachers, seminarLeaderIds = [], targetWeekCode) {
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
    validationMap[course.id] = validateAssignment(teacher, course, courses, seminarLeaderIds, targetWeekCode, teachers);
  });
  return validationMap;
}
function runAiPlanning(courses, teachers, seminarLeaderIds = [], targetWeekCode) {
  const logs = [];
  logs.push("Starte automatischen KI-Planungsalgorithmus...");
  const yogaTeachers = teachers.filter(
    (t) => t.roleType === "sevaka" && t.isYogaTeacher !== false
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
    const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers);
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
    if (c.name === "Yoga Vidya meets Pavanmuktasana" || c.name === "Anf\xE4nger Yin Yoga") {
      c.name = "Anf\xE4nger";
    } else if (c.name === "Yoga Flow Mittelstufe") {
      c.name = "Mittelstufe";
    }
  });
  for (const course of coursesToPlan) {
    logs.push(`Analysiere Eignung f\xFCr Kurs: "${course.name}" (${course.startTime} - ${course.endTime}, ${course.style})`);
    const candidateScores = [];
    for (const teacher of yogaTeachers) {
      const tempLayout = workingCourses.map((x) => x.id === course.id ? { ...x, teacherId: teacher.id } : { ...x });
      adjustRoomsForRules(tempLayout, teachers);
      const adjustedCourse = tempLayout.find((x) => x.id === course.id);
      const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers);
      const hardConflicts = conflicts.filter((c) => c.type === "hard");
      const softConflicts = conflicts.filter((c) => c.type === "soft");
      if (hardConflicts.length > 0) {
        continue;
      }
      let score = 100;
      const prefersRoom = teacher.rules.preferredRooms.includes(course.roomId);
      if (prefersRoom) {
        score += 30;
      }
      const preferredDays = teacher.rules.preferredDays || [];
      if (preferredDays.includes(course.dayOfWeek)) {
        score += 50;
      }
      const nonPreferredDaysVal = teacher.rules.nonPreferredDays || [];
      if (nonPreferredDaysVal.includes(course.dayOfWeek)) {
        score -= 40;
      }
      const plannedHours = workingCourses.filter((c) => c.teacherId === teacher.id).reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
      const capacityRatio = plannedHours / teacher.rules.maxHoursPerWeek;
      score -= capacityRatio * 50;
      if (teacher.name.toLowerCase().includes("karuna")) {
        const isYogaClass = course.style.toLowerCase() !== "meditation";
        const isAnkommYoga = isYogaClass && (course.name === "Mittelstufe Ankommensstunde" || course.name === "Mittelstufe AS" || course.name === "Mittelstufe") && (course.dayOfWeek === 5 || course.dayOfWeek === 0) && course.startTime === "16:30";
        if (isAnkommYoga) {
          score += 1e3;
        }
        if (isYogaClass && course.dayOfWeek === 6) {
          score -= 500;
        }
        if (isYogaClass && !isAnkommYoga && course.dayOfWeek !== 6) {
          score -= 200;
        }
      }
      if (teacher.name.toLowerCase().includes("narayani")) {
        if (course.name.toLowerCase().includes("mittelstufe")) {
          score += 150;
        }
      }
      if (teacher.name.toLowerCase().includes("mounir") || teacher.name.toLowerCase().includes("mouniir")) {
        if (course.name === "Gef\xFChrte Meditation" && course.dayOfWeek === 3 && course.startTime < "12:00") {
          score -= 150;
        }
      }
      if (teacher.name.toLowerCase().includes("ulrich")) {
        const isYogaClass = course.style.toLowerCase() !== "meditation";
        if (isYogaClass && [5, 0].includes(course.dayOfWeek)) {
          if (timeToMinutes(course.startTime) >= timeToMinutes("12:00")) {
            score -= 1e3;
          }
        }
      }
      const isPranayamaCourse = course.name.toLowerCase().includes("pranayama") || course.style.toLowerCase().includes("pranayama");
      if (isPranayamaCourse) {
        if (teacher.name.toLowerCase().includes("karuna") || teacher.name.toLowerCase().includes("burnie")) {
          score += 1e3;
        } else if (teacher.name.toLowerCase().includes("narayani") || teacher.name.toLowerCase().includes("abha")) {
          score += 200;
        }
      }
      const isSatsangEinfuehrungCourse = course.name.toLowerCase().includes("satsang einf\xFChrung") || course.name.toLowerCase().includes("satsang-einf\xFChrung");
      if (isSatsangEinfuehrungCourse && course.dayOfWeek === 0) {
        const allowed = ["nirmaya", "anjali", "hu", "mounir"];
        const tNameLower = teacher.name.toLowerCase();
        const isAllowed = allowed.some((a) => tNameLower.includes(a));
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
            if (tNameLower.includes(preferredName)) {
              score += 1e3;
            }
          }
        }
      }
      if (course.name === "Satsang") {
        const tNameLower = teacher.name.toLowerCase();
        if (course.startTime === "07:00") {
          const allowedMorningSatsang = ["anjali", "nirmaya", "burnie", "harishakti", "narayani", "abha", "alexander"];
          if (allowedMorningSatsang.some((name) => tNameLower.includes(name))) {
            score += 500;
          } else {
            score -= 1e4;
          }
        }
        if (course.startTime === "20:00") {
          if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
            if (tNameLower.includes("karuna")) {
              score += 1e4;
            } else {
              let isKarunaAbsent = false;
              const karuna = (teachers || import_db.db.getTeachers()).find((t) => t.name.toLowerCase().includes("karuna"));
              if (targetWeekCode && karuna) {
                const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
                const saved = typeof window !== "undefined" ? localStorage.getItem("rapla_sevafrei") : null;
                if (saved) {
                  const sevafreiList = JSON.parse(saved);
                  const activeAbsence = sevafreiList.find(
                    (entry) => entry.teacherId === karuna.id && courseDate >= entry.startDate && courseDate <= entry.endDate && !["seminartage"].includes(entry.type.toLowerCase())
                  );
                  if (activeAbsence) {
                    isKarunaAbsent = true;
                  }
                }
              }
              if (isKarunaAbsent) {
                const isBackup = ["narayani", "abha", "anjali"].some((name) => tNameLower.includes(name));
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
            if (tNameLower.includes("narayani")) {
              score += 1e4;
            } else {
              let isNarayaniAbsent = false;
              const narayani = (teachers || import_db.db.getTeachers()).find((t) => t.name.toLowerCase().includes("narayani"));
              if (targetWeekCode && narayani) {
                const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
                const saved = typeof window !== "undefined" ? localStorage.getItem("rapla_sevafrei") : null;
                if (saved) {
                  const sevafreiList = JSON.parse(saved);
                  const activeAbsence = sevafreiList.find(
                    (entry) => entry.teacherId === narayani.id && courseDate >= entry.startDate && courseDate <= entry.endDate && !["seminartage"].includes(entry.type.toLowerCase())
                  );
                  if (activeAbsence) {
                    isNarayaniAbsent = true;
                  }
                }
              }
              if (isNarayaniAbsent) {
                const isBackup = ["abha", "anjali"].some((name) => tNameLower.includes(name));
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
        const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers);
        const nonRelaxableConflicts = conflicts.filter((c) => {
          if (c.type !== "hard") return false;
          const msg = c.message.toLowerCase();
          return msg.includes("abwesend") || msg.includes("urlaub") || msg.includes("krank") || msg.includes("satsang-regel 4") || msg.includes("nie f\xFCr einen satsang");
        });
        if (nonRelaxableConflicts.length === 0) {
          let score = 100;
          const prefersRoom = teacher.rules.preferredRooms.includes(course.roomId);
          if (prefersRoom) score += 30;
          const preferredDays = teacher.rules.preferredDays || [];
          if (preferredDays.includes(course.dayOfWeek)) score += 50;
          const nonPreferredDaysVal = teacher.rules.nonPreferredDays || [];
          if (nonPreferredDaysVal.includes(course.dayOfWeek)) score -= 40;
          const plannedHours = workingCourses.filter((c) => c.teacherId === teacher.id).reduce((sum, c) => sum + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime)) / 60, 0);
          const capacityRatio = plannedHours / teacher.rules.maxHoursPerWeek;
          score -= capacityRatio * 50;
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
        if (tNameLower.includes("burnie") && workingCourses[index].name === "Anf\xE4nger") {
          workingCourses[index].name = "Yoga Vidya meets Pavanmuktasana";
        } else if (tNameLower.includes("satyam") && workingCourses[index].name === "Mittelstufe") {
          workingCourses[index].name = "Yoga Flow Mittelstufe";
        } else if (tNameLower.includes("abha") && workingCourses[index].name === "Anf\xE4nger") {
          const hasYin = workingCourses.some((wc) => wc.teacherId === bestCandidate.teacher.id && wc.name === "Anf\xE4nger Yin Yoga");
          if (!hasYin) {
            workingCourses[index].name = "Anf\xE4nger Yin Yoga";
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adjustRoomsForRules,
  getLocalDateForDay,
  isOverlapping,
  runAiPlanning,
  timeToMinutes,
  validateAllCourses,
  validateAssignment,
  validateRoomRules
});
