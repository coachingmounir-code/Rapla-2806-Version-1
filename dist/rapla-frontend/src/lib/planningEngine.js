"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeToMinutes = timeToMinutes;
exports.isOverlapping = isOverlapping;
exports.getLocalDateForDay = getLocalDateForDay;
exports.getDayName = getDayName;
exports.getAbsenceDetails = getAbsenceDetails;
exports.isTeacherAbsent = isTeacherAbsent;
exports.validateAssignment = validateAssignment;
exports.validateAllCourses = validateAllCourses;
exports.runAiPlanning = runAiPlanning;
exports.validateRoomRules = validateRoomRules;
exports.adjustRoomsForRules = adjustRoomsForRules;
exports.adjustNamesForRules = adjustNamesForRules;
exports.adjustCoursesForRules = adjustCoursesForRules;
const db_1 = require("./db");
const wochenplan_rules_json_1 = __importDefault(require("./data/wochenplan_rules.json"));
const ylaData_1 = require("./ylaData");
// Convert "HH:MM" string to minutes from start of day
function timeToMinutes(timeStr) {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
}
// Check if two time ranges overlap
function isOverlapping(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
}
// Convert ISO week code (e.g. "2026-W28") to actual date string for a specific day of the week
function getLocalDateForDay(weekCode, dayOfWeek) {
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
    if (dayOfWeek === 5)
        offset = 0;
    else if (dayOfWeek === 6)
        offset = 1;
    else if (dayOfWeek === 0)
        offset = 2;
    else if (dayOfWeek === 1)
        offset = 3;
    else if (dayOfWeek === 2)
        offset = 4;
    else if (dayOfWeek === 3)
        offset = 5;
    else if (dayOfWeek === 4)
        offset = 6;
    const targetDate = new Date(targetFriday.getTime());
    targetDate.setDate(targetFriday.getDate() + offset);
    const yyyy = targetDate.getFullYear();
    const mm = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const dd = targetDate.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
function getDayName(day) {
    const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return dayNames[day] || '';
}
function getAbsenceDetails(teacherName, dayOfWeek, targetWeekCode, absences) {
    if (!targetWeekCode)
        return null;
    const courseDate = getLocalDateForDay(targetWeekCode, dayOfWeek);
    // Abha is completely unavailable during the 4 weeks of Yogalehrerausbildung (YLA: 30.08.2026 - 27.09.2026)
    if (teacherName.toLowerCase().includes('abha') && (0, ylaData_1.isDateInYlaRange)(courseDate)) {
        return {
            teacherName: 'Abha',
            type: 'Yogalehrerausbildung',
            startDate: '2026-08-30',
            endDate: '2026-09-27',
            note: 'In den 4 Wochen der Yogalehrerausbildung steht Abha komplett nicht zur Verfügung.'
        };
    }
    if (absences && absences.length > 0) {
        const entry = absences.find((entry) => {
            if (!entry)
                return false;
            const entryName = entry.teacherName.toLowerCase().trim();
            const isMatch = entryName.includes(teacherName) || teacherName.includes(entryName.split(' ')[0]);
            return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
        });
        if (entry)
            return entry;
    }
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('rapla_sevafrei');
            if (saved) {
                const sevafreiList = JSON.parse(saved);
                const entry = sevafreiList.find((entry) => {
                    if (!entry)
                        return false;
                    const entryName = entry.teacherName.toLowerCase().trim();
                    const isMatch = entryName.includes(teacherName) || teacherName.includes(entryName.split(' ')[0]);
                    return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
                });
                if (entry)
                    return entry;
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    return null;
}
function isTeacherAbsent(teacherName, dayOfWeek, targetWeekCode, absences) {
    return getAbsenceDetails(teacherName, dayOfWeek, targetWeekCode, absences) !== null;
}
// Validate a single assignment and return all conflict messages
function validateAssignment(teacher, course, allCourses, seminarLeaderIds = [], targetWeekCode, teachers, absences) {
    const conflicts = [];
    // 0a. Check active Sevafrei / Abwesenheiten (Hard)
    if (targetWeekCode) {
        // Support composite teacher names (e.g. "Adam, Anjali")
        const namesToCheck = [];
        if (teacher.name.includes(',')) {
            teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
        }
        else {
            namesToCheck.push(teacher.name.toLowerCase().trim());
        }
        for (const name of namesToCheck) {
            const activeAbsence = getAbsenceDetails(name, course.dayOfWeek, targetWeekCode, absences);
            if (activeAbsence) {
                const isSatsang = course.name.toLowerCase().includes('satsang');
                const isBypassedType = ['seminartage'].includes(activeAbsence.type.toLowerCase());
                if (isSatsang && isBypassedType) {
                    // Bypassed for Satsangs
                }
                else {
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
    // 0b. Check stay window for Karma-Yogis and Guest Teachers (Hard)
    if (targetWeekCode && (teacher.stayStartDate || teacher.stayEndDate)) {
        const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
        if (teacher.stayStartDate && courseDate < teacher.stayStartDate) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist am ${courseDate} noch nicht im Haus (Aufenthaltszeitraum: ${teacher.stayStartDate} bis ${teacher.stayEndDate || 'offen'}).`
            });
        }
        else if (teacher.stayEndDate && courseDate > teacher.stayEndDate) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist am ${courseDate} nicht mehr im Haus (Aufenthaltszeitraum endete am ${teacher.stayEndDate}).`
            });
        }
    }
    // --- SEVAKA RULES FROM JSON ---
    const isSevaka = teacher.roleType === 'sevaka';
    // Categorize course types
    const isOnnForSevaka = courseNameLower.includes('om namo') || courseNameLower.includes('narayanaya');
    const isMeditationForSevaka = (courseNameLower.includes('meditation') || courseNameLower.includes('medi.') || (courseStyleLower.includes('meditation') && !isOnnForSevaka)) && !courseNameLower.includes('satsang') && !isOnnForSevaka;
    const isSatsangForSevaka = courseNameLower.includes('satsang');
    const isEntspannungForSevaka = courseStyleLower.includes('entspannung') || courseNameLower.includes('entspannung');
    const isSonstigesForSevaka = courseStyleLower.includes('sonstiges') || courseNameLower.includes('hausführung') || courseNameLower.includes('hausfuehrung');
    const isYogaClassForSevaka = !isMeditationForSevaka && !isSatsangForSevaka && !isOnnForSevaka && !isEntspannungForSevaka && !isSonstigesForSevaka;
    // Complete exclusion for Satyam
    if (teacherNameLower.includes('satyam')) {
        conflicts.push({
            type: 'hard',
            message: `${teacher.name} ist komplett herausgenommen und darf für keine Stunden oder Dienste eingeteilt werden.`
        });
    }
    // Qualifications for Karma-Yogis and Guest Teachers
    if (teacher.roleType === 'karma_yogi' || teacher.roleType === 'guest_teacher') {
        if (isYogaClassForSevaka && teacher.isYogaTeacher === false) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist nicht für das Unterrichten von Yogastunden eingeteilt.`
            });
        }
        if (isMeditationForSevaka && teacher.rules.canLeadMeditation === false) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist nicht für das Anleiten von geführten Meditationen eingetragen.`
            });
        }
        if (isSatsangForSevaka && teacher.rules.canLeadSatsang === false) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist nicht für das Leiten von Satsangs eingetragen.`
            });
        }
    }
    const otherSevakaAssignments = allCourses.filter(c => c.teacherId === teacher.id && c.id !== course.id);
    const getWeeklyCounts = () => {
        let yogaCount = isYogaClassForSevaka ? 1 : 0;
        let meditationCount = isMeditationForSevaka ? 1 : 0;
        let satsangCount = isSatsangForSevaka ? 1 : 0;
        let onnCount = isOnnForSevaka ? 1 : 0;
        otherSevakaAssignments.forEach(c => {
            const cName = c.name.toLowerCase();
            const cStyle = c.style.toLowerCase();
            const cIsOnn = cName.includes('om namo') || cName.includes('narayanaya');
            const cIsMed = (cName.includes('meditation') || cName.includes('medi.') || (cStyle.includes('meditation') && !cIsOnn)) && !cName.includes('satsang') && !cIsOnn;
            const cIsSat = cName.includes('satsang');
            const cIsEntspannung = cStyle.includes('entspannung') || cName.includes('entspannung');
            const cIsSonstiges = cStyle.includes('sonstiges') || cName.includes('hausführung') || cName.includes('hausfuehrung');
            if (!cIsMed && !cIsSat && !cIsOnn && !cIsEntspannung && !cIsSonstiges) {
                yogaCount++;
            }
            else if (cIsMed) {
                meditationCount++;
            }
            else if (cIsSat) {
                satsangCount++;
            }
            else if (cIsOnn) {
                onnCount++;
            }
        });
        return { yogaCount, meditationCount, satsangCount, onnCount };
    };
    const counts = getWeeklyCounts();
    // Look up teacher rules dynamically from wochenplanRules.teachers
    const teacherKey = Object.keys(wochenplan_rules_json_1.default.teachers).find(k => teacherNameLower.includes(k) || k.includes(teacherNameLower));
    const tRules = teacherKey ? wochenplan_rules_json_1.default.teachers[teacherKey] : null;
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
        if (!(isWalk && isPranava) && !isOnnForSevaka) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} ist am ${getDayName(course.dayOfWeek)} zur Kurszeit (${course.startTime} - ${course.endTime}) laut Regeln/Freitagen nicht verfügbar.`
            });
        }
    }
    // 2. Check Overlapping Classes (Hard)
    const otherAssignments = allCourses.filter(c => c.teacherId === teacher.id && c.id !== course.id && c.dayOfWeek === course.dayOfWeek);
    const hasOverlap = otherAssignments.some(other => isOverlapping(course.startTime, course.endTime, other.startTime, other.endTime));
    if (hasOverlap) {
        conflicts.push({
            type: 'hard',
            message: `${teacher.name} hat zur gleichen Zeit bereits eine andere Klasse zugeteilt.`
        });
    }
    // 2b. Check Yogalehrer-Ausbildung (YLA) Overlap (Hard)
    const ylaConflict = (0, ylaData_1.getYlaConflictForTeacher)(teacher.name, course.dayOfWeek, course.startTime, course.endTime, targetWeekCode);
    if (ylaConflict) {
        conflicts.push({
            type: 'hard',
            message: `${teacher.name} ist zeitgleich in der Yogalehrer-Ausbildung (YLA ${ylaConflict.weekNumber}. Woche: „${ylaConflict.shortTitle || ylaConflict.slotLabel}“ von ${ylaConflict.timeRange}) eingeteilt und steht nicht zur Verfügung.`
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
                const namesToCheck = [];
                if (teacher.name.includes(',')) {
                    teacher.name.split(',').forEach(n => namesToCheck.push(n.trim().toLowerCase()));
                }
                else {
                    namesToCheck.push(teacher.name.toLowerCase().trim());
                }
                for (const name of namesToCheck) {
                    activeAbsence = checkList.find((entry) => {
                        if (!entry)
                            return false;
                        const entryName = entry.teacherName.toLowerCase().trim();
                        const isMatch = entryName.includes(name) || name.includes(entryName.split(' ')[0]);
                        return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
                    });
                    if (activeAbsence) {
                        // Check if this is a composite teacher or if they are bypassed
                        if (activeAbsence.type.toLowerCase() === 'seminartage' && isSatsangForSevaka) {
                            // Bypassed for Satsangs
                        }
                        else {
                            conflicts.push({
                                type: 'hard',
                                message: `${teacher.name} ist an diesem Datum (${courseDate}) abwesend (${activeAbsence.type}: ${activeAbsence.note || 'Keine Angabe'}).`
                            });
                            break;
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error('Error during Sevafrei validation', e);
        }
    }
    // 3. Pranayama constraints
    const isPranayama = courseNameLower.includes('pranayama') || courseStyleLower.includes('pranayama');
    if (isPranayama) {
        if (targetWeekCode) {
            const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
            if ((0, ylaData_1.isDateInYlaRange)(courseDate)) {
                conflicts.push({
                    type: 'hard',
                    message: `Im Zeitraum der 4-wöchigen Yogalehrerausbildung (${courseDate}) finden keine Pranayama-Stunden statt.`
                });
            }
        }
        const allowed = wochenplan_rules_json_1.default.pranayama.allowed;
        const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
        if (!isAllowed) {
            conflicts.push({
                type: 'hard',
                message: `Pranayama darf nur von ${allowed.join(', ').toUpperCase()} unterrichtet werden.`
            });
        }
        // 3.5 Pranayama Sunday Rule (Burnie must be assigned if available)
        if (course.dayOfWeek === 0) {
            const isBurnieAbsent = isTeacherAbsent('burnie', course.dayOfWeek, targetWeekCode, absences);
            if (!isBurnieAbsent) {
                if (!teacherNameLower.includes('burnie')) {
                    conflicts.push({
                        type: 'hard',
                        message: `Burnie steht am Sonntag zur Verfügung und muss für Pranayama eingeteilt werden.`
                    });
                }
            }
        }
    }
    // 4. Satsang Einführung rule
    const isSatsangEinfuehrung = courseNameLower.includes('satsang einführung') || courseNameLower.includes('satsang-einführung') || courseNameLower.includes('satsangeinführung');
    if (isSatsangEinfuehrung) {
        const generalAllowed = wochenplan_rules_json_1.default.satsangEinfuehrung.allowed;
        const isGeneralAllowed = generalAllowed.some((a) => teacherNameLower.includes(a));
        if (!isGeneralAllowed) {
            conflicts.push({
                type: 'hard',
                message: `Die Satsang Einführung darf nur von ${generalAllowed.join(', ').toUpperCase()} geleitet werden.`
            });
        }
        if (course.dayOfWeek === 5) {
            const primary = wochenplan_rules_json_1.default.satsangEinfuehrung.friday;
            const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
            if (!teacherNameLower.includes(primary) && !isPrimaryAbsent) {
                conflicts.push({
                    type: 'hard',
                    message: `Freitags darf die Satsang Einführung nur von ${primary.toUpperCase()} geleitet werden.`
                });
            }
        }
        else if (course.dayOfWeek === 0) {
            const allowed = wochenplan_rules_json_1.default.satsangEinfuehrung.sunday;
            const isAllowed = allowed.some((a) => teacherNameLower.includes(a));
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
        const forbiddenForSatsang = wochenplan_rules_json_1.default.satsang.forbidden;
        const isForbidden = forbiddenForSatsang.some((name) => teacherNameLower.includes(name));
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
            const allowedMorningSatsang = wochenplan_rules_json_1.default.satsang.morningAllowed;
            const isAllowedMorning = allowedMorningSatsang.some((name) => teacherNameLower.includes(name));
            if (!isAllowedMorning) {
                conflicts.push({
                    type: 'hard',
                    message: `${teacher.name} darf morgens keinen Satsang leiten. Nur ${allowedMorningSatsang.join(', ').toUpperCase()} sind dafür eingeteilt.`
                });
            }
            else {
                const canDoTwo = wochenplan_rules_json_1.default.satsang.morningMaxTwo.some((name) => teacherNameLower.includes(name));
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
                const primary = wochenplan_rules_json_1.default.satsang.evening.wedSun.primary;
                const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
                if (!teacherNameLower.includes(primary)) {
                    if (!isPrimaryAbsent) {
                        conflicts.push({
                            type: 'hard',
                            message: `${primary.toUpperCase()} leitet mittwochs bis sonntags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt.`
                        });
                    }
                    else {
                        const backups = wochenplan_rules_json_1.default.satsang.evening.wedSun.backups;
                        const isBackup = backups.some((name) => teacherNameLower.includes(name));
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
                const primary = wochenplan_rules_json_1.default.satsang.evening.mon.primary;
                const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
                if (!teacherNameLower.includes(primary)) {
                    if (!isPrimaryAbsent) {
                        conflicts.push({
                            type: 'hard',
                            message: `${primary.toUpperCase()} leitet montags den Abend-Satsang. Nur wenn sie laut sevafrei-Kalender nicht kann, werden andere eingeteilt.`
                        });
                    }
                    else {
                        const backups = wochenplan_rules_json_1.default.satsang.evening.mon.backups;
                        const isBackup = backups.some((name) => teacherNameLower.includes(name));
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
        const primaryName = wochenplan_rules_json_1.default.meditation.dailyPrimary[course.dayOfWeek];
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
        const primary = wochenplan_rules_json_1.default.yoga.fridayMittelstufeAnkommen.primary;
        const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
        if (!isPrimaryAbsent) {
            if (!teacherNameLower.includes(primary)) {
                conflicts.push({
                    type: 'hard',
                    message: `${primary.toUpperCase()} muss die Mittelstufe Ankommensstunde leiten, da sie laut sevafrei-Kalender verfügbar ist.`
                });
            }
        }
        else if (course.dayOfWeek === 0) {
            const backups = wochenplan_rules_json_1.default.yoga.sundayMittelstufeAnkommen.backups;
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
        const primary = wochenplan_rules_json_1.default.yoga.fridayMorningAnfaenger.primary;
        const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
        if (!isPrimaryAbsent) {
            if (!teacherNameLower.includes(primary)) {
                conflicts.push({
                    type: 'hard',
                    message: `${primary.toUpperCase()} muss die Anfängerstunde am Freitag um 09:15 Uhr leiten, da sie verfügbar ist.`
                });
            }
        }
        else {
            const backup = wochenplan_rules_json_1.default.yoga.fridayMorningAnfaenger.backup;
            const isBackupAbsent = isTeacherAbsent(backup, course.dayOfWeek, targetWeekCode, absences);
            if (!isBackupAbsent && !teacherNameLower.includes(backup)) {
                conflicts.push({
                    type: 'hard',
                    message: `Da ${primary.toUpperCase()} abwesend ist, muss ${backup.toUpperCase()} die Anfängerstunde am Freitag um 09:15 Uhr leiten.`
                });
            }
        }
    }
    // 8.5 Hausführung rules
    const isHausfuehrung = courseNameLower.includes('hausführung') || courseNameLower.includes('hausfuehrung');
    if (isHausfuehrung) {
        const rules = wochenplan_rules_json_1.default.hausfuehrung;
        if (rules) {
            const isAllowed = rules.allowed.some((a) => teacherNameLower.includes(a));
            if (!isAllowed) {
                conflicts.push({
                    type: 'hard',
                    message: `Für die Hausführung dürfen nur ${rules.allowed.join(', ').toUpperCase()} eingeteilt werden.`
                });
            }
            if (course.dayOfWeek === 5) { // Freitag
                const primary = rules.friday.primary;
                const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
                if (!isPrimaryAbsent) {
                    if (!teacherNameLower.includes(primary)) {
                        conflicts.push({
                            type: 'hard',
                            message: `Freitags muss ${primary.toUpperCase()} die Hausführung übernehmen, da er verfügbar ist.`
                        });
                    }
                }
                else {
                    const backup = rules.friday.backup;
                    const isBackupAbsent = isTeacherAbsent(backup, course.dayOfWeek, targetWeekCode, absences);
                    if (!isBackupAbsent) {
                        if (!teacherNameLower.includes(backup)) {
                            conflicts.push({
                                type: 'hard',
                                message: `Da ${primary.toUpperCase()} abwesend ist, muss ${backup.toUpperCase()} die Hausführung am Freitag übernehmen.`
                            });
                        }
                    }
                }
            }
            else if (course.dayOfWeek === 0) { // Sonntag
                if (targetWeekCode) {
                    const weekNum = parseInt(targetWeekCode.split('-W')[1], 10);
                    const alts = rules.sunday.alternating;
                    let availableAlts = [];
                    for (const alt of alts) {
                        if (!isTeacherAbsent(alt, course.dayOfWeek, targetWeekCode, absences)) {
                            availableAlts.push(alt);
                        }
                    }
                    if (availableAlts.length > 0 && alts.length > 0) {
                        let turnIndex = weekNum % alts.length;
                        let primaryTurn = alts[turnIndex];
                        let assignedPrimary = null;
                        if (availableAlts.includes(primaryTurn)) {
                            assignedPrimary = primaryTurn;
                        }
                        else if (availableAlts.length > 0) {
                            assignedPrimary = availableAlts[0];
                        }
                        if (assignedPrimary && !teacherNameLower.includes(assignedPrimary)) {
                            conflicts.push({
                                type: 'hard',
                                message: `Sonntags muss abwechselnd ${alts.join(' oder ').toUpperCase()} eingeteilt werden. Für diese Woche ist ${assignedPrimary.toUpperCase()} an der Reihe (und verfügbar).`
                            });
                        }
                    }
                }
                else {
                    const alts = rules.sunday.alternating;
                    const isAnyAlt = alts.some((a) => teacherNameLower.includes(a));
                    if (!isAnyAlt) {
                        conflicts.push({
                            type: 'hard',
                            message: `Sonntags muss ${alts.join(' oder ').toUpperCase()} eingeteilt werden, sofern sie können.`
                        });
                    }
                }
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
    if (teacher.rules.maxYogaClassesPerWeek !== undefined && teacher.rules.maxYogaClassesPerWeek !== null && isYogaClassForSevaka && counts.yogaCount > teacher.rules.maxYogaClassesPerWeek) {
        conflicts.push({
            type: 'hard',
            message: `${teacher.name} darf für maximal ${teacher.rules.maxYogaClassesPerWeek} Yogastunden wöchentlich eingeteilt werden.`
        });
    }
    if (teacher.rules.maxMeditationPerWeek !== undefined && teacher.rules.maxMeditationPerWeek !== null && isMeditationForSevaka && counts.meditationCount > teacher.rules.maxMeditationPerWeek) {
        conflicts.push({
            type: 'hard',
            message: `${teacher.name} kann maximal ${teacher.rules.maxMeditationPerWeek} mal pro Woche für eine geführte Meditation eingeteilt werden.`
        });
    }
    if (teacher.rules.maxMorningSatsangsPerWeek !== undefined && teacher.rules.maxMorningSatsangsPerWeek !== null && isSatsangForSevaka && course.startTime < '12:00') {
        const morningSatsangs = otherSevakaAssignments.filter(c => c.name.toLowerCase().includes('satsang') && c.startTime < '12:00').length + 1;
        if (morningSatsangs > teacher.rules.maxMorningSatsangsPerWeek) {
            conflicts.push({
                type: 'hard',
                message: `${teacher.name} kann maximal ${teacher.rules.maxMorningSatsangsPerWeek} mal pro Woche für einen Satsang am Morgen eingeteilt werden.`
            });
        }
    }
    // Om Namo Narayanaya is an independent category freed from rule limits; only the Sevafrei calendar applies.
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
            const cIsYoga = !cName.includes('meditation') && !cName.includes('medi.') && !cStyle.includes('meditation') && !cName.includes('satsang') && !cName.includes('om namo') && !cName.includes('narayanaya');
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
    if (tRules && tRules.maxYinYogaAnfaengerPerWeek !== undefined && tRules.maxYinYogaAnfaengerPerWeek !== null) {
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
    if (tRules && tRules.maxAnfaengerYogaPerWeek !== undefined && tRules.maxAnfaengerYogaPerWeek !== null && isYogaClassForSevaka && courseNameLower.includes('anfänger')) {
        const anfaengerYogaCount = otherSevakaAssignments.filter(c => {
            const cName = c.name.toLowerCase();
            const cStyle = c.style.toLowerCase();
            const cIsYoga = !cName.includes('meditation') && !cName.includes('medi.') && !cStyle.includes('meditation') && !cName.includes('satsang') && !cName.includes('om namo') && !cName.includes('narayanaya');
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
    const roomConflicts = validateRoomRules(course, allCourses, teachers || db_1.db.getTeachers(), targetWeekCode);
    conflicts.push(...roomConflicts);
    return conflicts;
}
// Check validation for all courses in a list and return a map of courseId -> conflicts
function validateAllCourses(courses, teachers, seminarLeaderIds = [], targetWeekCode, absences) {
    const validationMap = {};
    courses.forEach(course => {
        if (!course.teacherId) {
            // Validate room rules even if no teacher is assigned
            validationMap[course.id] = validateRoomRules(course, courses, teachers, targetWeekCode);
            return;
        }
        const teacher = teachers.find(t => t.id === course.teacherId);
        if (!teacher) {
            validationMap[course.id] = validateRoomRules(course, courses, teachers, targetWeekCode);
            return;
        }
        validationMap[course.id] = validateAssignment(teacher, course, courses, seminarLeaderIds, targetWeekCode, teachers, absences);
    });
    return validationMap;
}
// AI Pre-planning Core Heuristic Engine
function runAiPlanning(courses, teachers, seminarLeaderIds = [], targetWeekCode, customConstraints = [], absences) {
    const logs = [];
    logs.push('Starte automatischen KI-Planungsalgorithmus...');
    // Only plan with Sevakas (Kernteam)
    const yogaTeachers = teachers.filter(t => t.roleType === 'sevaka');
    logs.push(`Berücksichtige ${yogaTeachers.length} Sevakas (Kernteam) für die KI-Vorplanung.`);
    // Clone courses to avoid modifying original array until approved
    let workingCourses = courses.map(c => ({ ...c }));
    // Exclude Pranayama courses during the 4-week Yogalehrerausbildung (30.08.2026 – 27.09.2026)
    if (targetWeekCode) {
        workingCourses = workingCourses.filter(c => {
            const isPranayama = c.name.toLowerCase().includes('pranayama') || c.style.toLowerCase().includes('pranayama');
            if (isPranayama) {
                const courseDate = getLocalDateForDay(targetWeekCode, c.dayOfWeek);
                if ((0, ylaData_1.isDateInYlaRange)(courseDate)) {
                    logs.push(`[YLA-Regel] "${c.name}" (${c.startTime}) am ${courseDate} (${targetWeekCode}) entfällt wegen der 4-wöchigen Yogalehrerausbildung.`);
                    return false;
                }
            }
            return true;
        });
    }
    // Find which courses need planning: either unassigned, marked for AI planning, or having an active absence (sevafrei/urlaub) for their pre-assigned teacher
    const coursesToPlan = workingCourses.filter(c => {
        if (c.teacherId === null || c.isAiPlanned)
            return true;
        const teacher = teachers.find(t => t.id === c.teacherId);
        if (!teacher)
            return true;
        // Simulate layout with this assignment and auto-adjust rooms
        const tempLayout = workingCourses.map(x => x.id === c.id ? { ...x, teacherId: teacher.id } : { ...x });
        adjustRoomsForRules(tempLayout, teachers, targetWeekCode);
        const adjustedCourse = tempLayout.find(x => x.id === c.id);
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
        const templateCourse = db_1.db.getDefaultCourses?.().find(tc => tc.dayOfWeek === c.dayOfWeek && tc.startTime === c.startTime && tc.roomId === c.roomId);
        if (templateCourse) {
            c.name = templateCourse.name;
        }
        else {
            if (c.name === 'Yoga Vidya meets Pavanmuktasana' || c.name === 'Yoga Vidya Pavanmuktasana' || c.name === 'Anfänger Yin Yoga') {
                c.name = 'Anfänger';
            }
            else if (c.name === 'Yoga Flow Mittelstufe') {
                c.name = 'Mittelstufe';
            }
        }
    });
    // Plan course by course
    for (const course of coursesToPlan) {
        logs.push(`Analysiere Eignung für Kurs: "${course.name}" (${course.startTime} - ${course.endTime}, ${course.style})`);
        const candidateScores = [];
        // Score every teacher
        for (const teacher of yogaTeachers) {
            // Get conflicts for assigning this teacher to this course in the current layout
            // Simulate layout with this assignment and auto-adjust rooms
            const tempLayout = workingCourses.map(x => x.id === course.id ? { ...x, teacherId: teacher.id } : { ...x });
            adjustRoomsForRules(tempLayout, teachers, targetWeekCode);
            const adjustedCourse = tempLayout.find(x => x.id === course.id);
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
                    if (!ruleTeacherId)
                        continue;
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
                    if (rDay !== undefined && rDay !== null && course.dayOfWeek !== rDay)
                        matchCourse = false;
                    if (rStart !== undefined && rStart !== null && course.startTime !== rStart)
                        matchCourse = false;
                    if (rCourseName !== undefined && rCourseName !== null && !course.name.toLowerCase().includes(rCourseName.toLowerCase()))
                        matchCourse = false;
                    if (rCourseStyle !== undefined && rCourseStyle !== null && !course.style.toLowerCase().includes(rCourseStyle.toLowerCase()))
                        matchCourse = false;
                    if (matchCourse) {
                        if (rule.type === 'exclude' && matchTeacher) {
                            customExcluded = true;
                            logs.push(`  [KI-REGEL-JS] Schließe ${teacher.name} für Kurs "${course.name}" (${course.startTime}) aus.`);
                        }
                        if (rule.type === 'include') {
                            if (matchTeacher) {
                                customForced = true;
                                logs.push(`  [KI-REGEL-JS] Zwinge Zuweisung von ${teacher.name} für Kurs "${course.name}" (${course.startTime}).`);
                            }
                            else {
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
            if (teacher.rules.weekendAsBackupOnly && [5, 6, 0].includes(course.dayOfWeek) && course.style.toLowerCase() !== 'meditation' && !course.name.toLowerCase().includes('om namo') && !course.name.toLowerCase().includes('narayanaya')) {
                if (timeToMinutes(course.startTime) >= timeToMinutes('12:00')) {
                    score -= 1000;
                }
            }
            // Rule 8: Friday morning (09:15) Beginner class from compiled rules
            const yogaRules = wochenplan_rules_json_1.default.yoga;
            if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name.toLowerCase().includes('anfänger')) {
                if (teacherNameLower.includes(yogaRules.fridayMorningAnfaenger.primary)) {
                    score += 10000;
                }
                else if (teacherNameLower.includes(yogaRules.fridayMorningAnfaenger.backup)) {
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
                }
                else if (course.dayOfWeek === 0) { // Backup priorities only on Sunday
                    const backups = yogaRules.sundayMittelstufeAnkommen.backups;
                    const idx = backups.findIndex((b) => teacherNameLower.includes(b));
                    if (idx !== -1) {
                        score += 5000 - idx * 2500;
                        if (backups[idx] === 'ulrich') {
                            score += 2000; // offset Ulrich's standard weekend penalty
                        }
                    }
                }
            }
            // Hausführung Scoring
            const isHausfuehrungCourse = course.name.toLowerCase().includes('hausführung') || course.name.toLowerCase().includes('hausfuehrung');
            if (isHausfuehrungCourse) {
                const rules = wochenplan_rules_json_1.default.hausfuehrung;
                if (rules) {
                    if (course.dayOfWeek === 5) { // Freitag
                        if (teacherNameLower.includes(rules.friday.primary)) {
                            score += 10000;
                        }
                        else if (teacherNameLower.includes(rules.friday.backup)) {
                            score += 5000;
                        }
                    }
                    else if (course.dayOfWeek === 0) { // Sonntag
                        let weekNum = 0;
                        if (targetWeekCode) {
                            const match = targetWeekCode.match(/-W(\d+)/);
                            if (match) {
                                weekNum = parseInt(match[1], 10);
                            }
                        }
                        const alts = rules.sunday.alternating;
                        if (alts && alts.length > 0) {
                            const turnIndex = weekNum % alts.length;
                            const primaryTurn = alts[turnIndex];
                            if (teacherNameLower.includes(primaryTurn)) {
                                score += 10000;
                            }
                            else if (alts.some((a) => teacherNameLower.includes(a))) {
                                score += 5000; // The other alternating person
                            }
                        }
                    }
                }
            }
            // Custom scoring rules for Pranayama from compiled rules
            const isPranayamaCourse = course.name.toLowerCase().includes('pranayama') || course.style.toLowerCase().includes('pranayama');
            if (isPranayamaCourse) {
                const allowed = wochenplan_rules_json_1.default.pranayama.allowed || [];
                const isAllowed = allowed.some((n) => teacherNameLower.includes(n));
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
                        // Rule 4: Burnie is primarily assigned on Sundays.
                        if (course.dayOfWeek === 0) {
                            if (teacherNameLower.includes('burnie')) {
                                score += 2000;
                            }
                            else {
                                // If Burnie is sevafrei, rotate the others
                                const backups = ["karuna", "narayani", "abha"];
                                const teacherIdx = backups.findIndex((n) => teacherNameLower.includes(n));
                                if (teacherIdx !== -1) {
                                    const targetIndex = (weekNum + 1) % 3;
                                    const distance = (teacherIdx - targetIndex + 3) % 3;
                                    score += 1000 - distance * 300;
                                }
                            }
                        }
                        else if (course.dayOfWeek === 6) {
                            // On Saturdays, rotate the remaining eligible teachers
                            const backups = ["karuna", "narayani", "abha"];
                            const teacherIdx = backups.findIndex((n) => teacherNameLower.includes(n));
                            if (teacherIdx !== -1) {
                                const targetIndex = weekNum % 3;
                                const distance = (teacherIdx - targetIndex + 3) % 3;
                                score += 1000 - distance * 300;
                            }
                        }
                    }
                }
            }
            // Custom scoring rules for Sunday Satsang Einführung from compiled rules
            const isSatsangEinfuehrungCourse = course.name.toLowerCase().includes('satsang einführung') || course.name.toLowerCase().includes('satsang-einführung');
            if (isSatsangEinfuehrungCourse && course.dayOfWeek === 0) {
                const allowed = wochenplan_rules_json_1.default.satsangEinfuehrung.sunday;
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
                            score += 1000;
                        }
                    }
                }
            }
            // Custom scoring rules for Entspannungsangebot from compiled rules
            const isEntspannungsangebot = course.name.toLowerCase().includes('entspannung') ||
                course.name.toLowerCase().includes('klangreise') ||
                course.name.toLowerCase().includes('yogageschichten am kamin') ||
                course.name.toLowerCase().includes('peziebälle') ||
                course.name.toLowerCase().includes('fantasiereise');
            if (isEntspannungsangebot && wochenplan_rules_json_1.default.entspannungsangebot) {
                const erules = wochenplan_rules_json_1.default.entspannungsangebot;
                let isDesignatedTeacher = false;
                if (course.dayOfWeek === 1 && erules.montag?.primary) {
                    if (teacherNameLower.includes(erules.montag.primary.toLowerCase())) {
                        score += 10000;
                        isDesignatedTeacher = true;
                    }
                }
                else if (course.dayOfWeek === 3 && erules.mittwoch?.primary) {
                    if (teacherNameLower.includes(erules.mittwoch.primary.toLowerCase())) {
                        score += 10000;
                        isDesignatedTeacher = true;
                    }
                }
                else if (course.dayOfWeek === 4 && erules.donnerstag?.alternating) {
                    const allowed = erules.donnerstag.alternating;
                    const isAllowed = allowed.some((a) => teacherNameLower.includes(a.toLowerCase()));
                    if (isAllowed) {
                        score += 5000;
                        isDesignatedTeacher = true;
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
                if (!isDesignatedTeacher) {
                    score -= 20000; // Nobody else is allowed to teach this!
                }
            }
            // --- GEFÜHRTE MEDITATION SCORING RULES ---
            const isMeditationCourse = (course.name === 'Geführte Meditation' || course.style.toLowerCase() === 'meditation') && !course.name.toLowerCase().includes('om namo') && !course.name.toLowerCase().includes('narayanaya');
            if (isMeditationCourse) {
                const allowed = wochenplan_rules_json_1.default.meditation.allowed;
                const forbidden = wochenplan_rules_json_1.default.meditation.forbidden;
                const isAllowed = allowed.some((name) => teacherNameLower.includes(name));
                const isForbidden = forbidden.some((name) => teacherNameLower.includes(name));
                if (isForbidden) {
                    score -= 10000;
                }
                else if (isAllowed) {
                    score += 100;
                    const primaryName = wochenplan_rules_json_1.default.meditation.dailyPrimary[course.dayOfWeek];
                    if (primaryName && teacherNameLower.includes(primaryName)) {
                        score += 10000;
                    }
                }
                else if (teacher.roleType === 'sevaka') {
                    score -= 10000;
                }
            }
            // --- OM NAMO NARAYANAYA SCORING RULES ---
            const isOmNamoCourse = course.name.toLowerCase().includes('om namo') || course.name.toLowerCase().includes('narayanaya');
            if (isOmNamoCourse) {
                // ONN is its own category, freed from all restrictions except Sevafrei calendar.
                score += 100;
            }
            // --- SATSANG SCORING RULES ---
            if (course.name === 'Satsang') {
                // Morgen-Satsang (07:00):
                if (course.startTime === '07:00') {
                    const allowedMorningSatsang = wochenplan_rules_json_1.default.satsang.morningAllowed;
                    if (allowedMorningSatsang.some((name) => teacherNameLower.includes(name))) {
                        score += 500;
                        if (teacherNameLower.includes('burnie') && course.dayOfWeek === 1) {
                            score += 2000;
                        }
                    }
                    else {
                        score -= 10000;
                    }
                }
                // Abend-Satsang (20:00):
                if (course.startTime === '20:00') {
                    // Mittwochs bis sonntags: Karuna ist Standard
                    if ([3, 4, 5, 6, 0].includes(course.dayOfWeek)) {
                        const primary = wochenplan_rules_json_1.default.satsang.evening.wedSun.primary;
                        if (teacherNameLower.includes(primary)) {
                            score += 10000;
                        }
                        else {
                            const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
                            if (isPrimaryAbsent) {
                                const backups = wochenplan_rules_json_1.default.satsang.evening.wedSun.backups;
                                const isBackup = backups.some((name) => teacherNameLower.includes(name));
                                if (isBackup) {
                                    score += 8000;
                                    const eveningSatsangCount = workingCourses.filter(c => c.teacherId === teacher.id &&
                                        c.name === 'Satsang' &&
                                        c.startTime === '20:00').length;
                                    score -= eveningSatsangCount * 2000;
                                }
                                else {
                                    score -= 10000;
                                }
                            }
                            else {
                                score -= 10000;
                            }
                        }
                    }
                    // Montag: Narayani ist Standard
                    if (course.dayOfWeek === 1) {
                        const primary = wochenplan_rules_json_1.default.satsang.evening.mon.primary;
                        if (teacherNameLower.includes(primary)) {
                            score += 10000;
                        }
                        else {
                            const isPrimaryAbsent = isTeacherAbsent(primary, course.dayOfWeek, targetWeekCode, absences);
                            if (isPrimaryAbsent) {
                                const backups = wochenplan_rules_json_1.default.satsang.evening.mon.backups;
                                const isBackup = backups.some((name) => teacherNameLower.includes(name));
                                if (isBackup) {
                                    score += 8000;
                                    const eveningSatsangCount = workingCourses.filter(c => c.teacherId === teacher.id &&
                                        c.name === 'Satsang' &&
                                        c.startTime === '20:00').length;
                                    score -= eveningSatsangCount * 2000;
                                }
                                else {
                                    score -= 10000;
                                }
                            }
                            else {
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
                adjustRoomsForRules(tempLayout, teachers, targetWeekCode);
                const adjustedCourse = tempLayout.find(x => x.id === course.id);
                const conflicts = validateAssignment(teacher, adjustedCourse, tempLayout, seminarLeaderIds, targetWeekCode, teachers, absences);
                // Hard conflicts that are physical absence (cannot be relaxed under any circumstance)
                const nonRelaxableConflicts = conflicts.filter(c => {
                    if (c.type !== 'hard')
                        return false;
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
                            return { type: 'soft', message: `[Regellockerung] ${c.message}` };
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
                    !workingCourses[index].name.toLowerCase().includes('om namo') &&
                    !workingCourses[index].name.toLowerCase().includes('narayanaya');
                // Rule 5: Burnie beginner class rename
                if (tNameLower.includes('burnie') && isYoga && workingCourses[index].name.toLowerCase().includes('anfänger')) {
                    const hasPavan = workingCourses.some(wc => wc.teacherId === bestCandidate.teacher.id && (wc.name === 'Pavanmukt Asana' || wc.name === 'Yoga Vidya meets Pavanmuktasana' || wc.name === 'Yoga Vidya Pavanmuktasana'));
                    if (!hasPavan) {
                        workingCourses[index].name = 'Pavanmukt Asana';
                    }
                }
                else if (tNameLower.includes('satyam') && workingCourses[index].name === 'Mittelstufe') {
                    workingCourses[index].name = 'Yoga Flow Mittelstufe';
                }
                else if (tNameLower.includes('abha') && workingCourses[index].name === 'Anfänger') {
                    const hasYin = workingCourses.some(wc => wc.teacherId === bestCandidate.teacher.id && wc.name === 'Anfänger Yin Yoga');
                    if (!hasYin) {
                        workingCourses[index].name = 'Anfänger Yin Yoga';
                    }
                }
                // Rule 9: Friday morning (09:15) intermediate class rename based on Pranava assignment
                if (workingCourses[index].dayOfWeek === 5 && workingCourses[index].startTime === '09:15' && workingCourses[index].name.toLowerCase().includes('mittelstufe')) {
                    if (tNameLower.includes('pranava')) {
                        workingCourses[index].name = 'Mittelstufe Klangyogastunde';
                    }
                    else {
                        workingCourses[index].name = 'Mittelstufe';
                    }
                }
                logs.push(`✓ Zuweisung erfolgreich: ${bestCandidate.teacher.name} (Score: ${bestCandidate.score.toFixed(0)})`);
                if (bestCandidate.conflicts.length > 0) {
                    logs.push(`  Hinweis: ${bestCandidate.conflicts[0].message}`);
                }
            }
        }
        else {
            logs.push(`⚠️ Kein passender Yogalehrer ohne harte Konflikte für "${course.name}" gefunden.`);
        }
    }
    // Final name sweep to ensure custom names are consistently applied
    workingCourses.forEach(c => {
        if (!c.teacherId)
            return;
        const teacher = teachers.find(t => t.id === c.teacherId);
        if (!teacher)
            return;
        const tNameLower = teacher.name.toLowerCase();
        // Look up teacher custom course renames dynamically
        const teacherKey = Object.keys(wochenplan_rules_json_1.default.teachers).find(k => tNameLower.includes(k) || k.includes(tNameLower));
        const tRules = teacherKey ? wochenplan_rules_json_1.default.teachers[teacherKey] : null;
        if (tRules && tRules.customCourseNames && tRules.customCourseNames.length > 0) {
            tRules.customCourseNames.forEach((item) => {
                if (c.name.toLowerCase().includes(item.originalName.toLowerCase())) {
                    c.name = item.customName;
                }
            });
        }
    });
    // Post-process Burnie's Pavanmukt Asana rule across ALL courses (static and AI-planned)
    const burnieClasses = workingCourses.filter(c => {
        if (!c.teacherId)
            return false;
        const teacher = teachers.find(t => t.id === c.teacherId);
        return teacher && teacher.name.toLowerCase().includes('burnie');
    });
    // Sort them so we consistently pick the "first" one (e.g., by day and time)
    burnieClasses.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek)
            return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
    });
    let pavanCount = 0;
    burnieClasses.forEach(c => {
        if (c.name === 'Pavanmukt Asana' || c.name === 'Yoga Vidya meets Pavanmuktasana' || c.name === 'Yoga Vidya Pavanmuktasana') {
            pavanCount++;
            if (pavanCount > 1) {
                c.name = 'Anfänger'; // Revert any extra ones back to Anfänger
            }
            else {
                c.name = 'Pavanmukt Asana'; // Ensure exact correct name
            }
        }
    });
    if (pavanCount === 0) {
        // If he doesn't have one yet, rename his first Anfänger class
        const firstAnfaenger = burnieClasses.find(c => {
            const isYoga = !c.name.toLowerCase().includes('meditation') && !c.style.toLowerCase().includes('meditation') && !c.name.toLowerCase().includes('satsang') && !c.name.toLowerCase().includes('om namo') && !c.name.toLowerCase().includes('narayanaya');
            return isYoga && c.name.toLowerCase().includes('anfänger');
        });
        if (firstAnfaenger) {
            firstAnfaenger.name = 'Pavanmukt Asana';
        }
    }
    // Apply room rules to auto-adjust rooms based on final teacher assignments
    adjustRoomsForRules(workingCourses, teachers, targetWeekCode);
    const assignedCount = workingCourses.filter(c => c.teacherId !== null && c.isAiPlanned).length;
    logs.push(`Planung abgeschlossen. ${assignedCount} von ${coursesToPlan.length} Kursen wurden erfolgreich zugewiesen.`);
    return {
        plannedCourses: workingCourses,
        logs
    };
}
// Room rule validation from Raum Regeln.txt
function validateRoomRules(course, allCourses, teachers, targetWeekCode) {
    const conflicts = [];
    const nameLower = course.name.toLowerCase();
    const styleLower = course.style.toLowerCase();
    const isBeginner = nameLower.includes('anfänger');
    const isIntermediate = nameLower.includes('mittelstufe');

    // Check 4-week Yogalehrerausbildung (YLA: 30.08.2026 – 27.09.2026)
    if (targetWeekCode) {
        const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
        if ((0, ylaData_1.isDateInYlaRange)(courseDate)) {
            if (isBeginner) {
                if (course.roomId !== 'room-4') { // Sitaram
                    conflicts.push({
                        type: 'hard',
                        message: `Während der 4-wöchigen Yogalehrerausbildung müssen alle Anfängerstunden im Sitaram Raum stattfinden.`
                    });
                }
            } else if (isIntermediate) {
                if (course.roomId !== 'room-3') { // Hanuman
                    conflicts.push({
                        type: 'hard',
                        message: `Während der 4-wöchigen Yogalehrerausbildung müssen alle Mittelstufenstunden im Hanuman Raum stattfinden.`
                    });
                }
            }
            return conflicts;
        }
    }

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
    if (isBeginner) {
        // Check if there is a parallel Klangyogastunde taught by Pranava
        const hasParallelPranavaKlang = allCourses.some(c => {
            if (c.id === course.id)
                return false;
            if (c.dayOfWeek !== course.dayOfWeek || c.startTime !== course.startTime)
                return false;
            if (!c.name.toLowerCase().includes('mittelstufe') || !c.name.toLowerCase().includes('klang'))
                return false;
            if (!c.teacherId)
                return false;
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
        }
        else {
            if (course.roomId !== 'room-2') {
                conflicts.push({
                    type: 'hard',
                    message: `Yoga-Anfängerstunden müssen im Radhakrishna Raum stattfinden.`
                });
            }
        }
    }
    // 3. Intermediate rule: Yoga intermediate classes in Tripura (room-5), except when taught by Pranava as Klangyogastunde (then Radhakrishna room-2)
    if (isIntermediate) {
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
        }
        else {
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
function adjustRoomsForRules(courses, teachers, targetWeekCode) {
    courses.forEach(course => {
        const nameLower = course.name.toLowerCase();
        const styleLower = course.style.toLowerCase();
        const isBeginner = nameLower.includes('anfänger');
        const isIntermediate = nameLower.includes('mittelstufe');

        // Check 4-week Yogalehrerausbildung (YLA: 30.08.2026 – 27.09.2026)
        if (targetWeekCode) {
            const courseDate = getLocalDateForDay(targetWeekCode, course.dayOfWeek);
            if ((0, ylaData_1.isDateInYlaRange)(courseDate)) {
                if (isBeginner) {
                    course.roomId = 'room-4'; // Sitaram
                } else if (isIntermediate) {
                    course.roomId = 'room-3'; // Hanuman
                }
                return;
            }
        }

        // 1. Pranayama rule
        if (nameLower.includes('pranayama') || styleLower.includes('pranayama')) {
            course.roomId = 'room-2'; // Radhakrisna
            return;
        }
        // 2. Beginner/Intermediate rules
        if (isBeginner) {
            // Look for a parallel Klangyogastunde taught by Pranava
            const hasParallelPranavaKlang = courses.some(c => {
                if (c.id === course.id)
                    return false;
                if (c.dayOfWeek !== course.dayOfWeek || c.startTime !== course.startTime)
                    return false;
                if (!c.name.toLowerCase().includes('mittelstufe') || !c.name.toLowerCase().includes('klang'))
                    return false;
                if (!c.teacherId)
                    return false;
                const t = teachers.find(x => x.id === c.teacherId);
                return t && t.name.toLowerCase().includes('pranava');
            });
            if (hasParallelPranavaKlang) {
                course.roomId = 'room-5'; // Tripura
            }
            else {
                course.roomId = 'room-2'; // Radhakrisna
            }
        }
        else if (isIntermediate) {
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
            }
            else {
                course.roomId = 'room-5'; // Tripura
            }
        }
    });
    return courses;
}
// Name auto-adjustment logic
function adjustNamesForRules(courses, teachers) {
    courses.forEach(course => {
        if (!course.teacherId) {
            // Revert to template name if possible, or keep original
            if (course.name === 'Yoga Vidya meets Pavanmuktasana' || course.name === 'Yoga Vidya Pavanmuktasana' || course.name === 'Yoga Flow Mittelstufe' || course.name === 'Anfänger Yin Yoga') {
                course.name = course.name.includes('Mittelstufe') ? 'Mittelstufe' : 'Anfänger';
            }
            if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name === 'Mittelstufe Klangyogastunde') {
                course.name = 'Mittelstufe';
            }
            return;
        }
        const teacher = teachers.find(t => t.id === course.teacherId);
        if (!teacher)
            return;
        const tNameLower = teacher.name.toLowerCase();
        const isYoga = !course.name.toLowerCase().includes('meditation') &&
            !course.name.toLowerCase().includes('medi.') &&
            !course.style.toLowerCase().includes('meditation') &&
            !course.name.toLowerCase().includes('satsang') &&
            !course.name.toLowerCase().includes('om namo') &&
            !course.name.toLowerCase().includes('narayanaya');
        if (isYoga) {
            // Identify base type
            let baseType = 'Unknown';
            if (course.name.toLowerCase().includes('anfänger') || course.name === 'Yoga Vidya meets Pavanmuktasana' || course.name === 'Yoga Vidya Pavanmuktasana' || course.name === 'Anfänger Yin Yoga') {
                baseType = 'Anfänger';
            }
            else if (course.name.toLowerCase().includes('mittelstufe') || course.name === 'Yoga Flow Mittelstufe' || course.name === 'Mittelstufe Klangyogastunde') {
                baseType = 'Mittelstufe';
            }
            if (baseType !== 'Unknown') {
                const isFridayOrSundayAfternoonAnkommen = (course.dayOfWeek === 5 || course.dayOfWeek === 0) && course.startTime === '16:30';
                if (isFridayOrSundayAfternoonAnkommen) {
                    course.name = baseType === 'Anfänger' ? 'Anfänger Ankommensstunde' : 'Mittelstufe Ankommensstunde';
                }
                else {
                    // Step 1: Revert all custom names to their standard template names based on time for non-Ankommensstunden
                    if (course.name === 'Yoga Vidya meets Pavanmuktasana' || course.name === 'Yoga Vidya Pavanmuktasana' || course.name === 'Yoga Flow Mittelstufe' || course.name === 'Anfänger Yin Yoga' || course.name === 'Mittelstufe Klangyogastunde') {
                        course.name = baseType;
                    }
                    // Step 2: Apply specific sevaka rules for other times
                    if (tNameLower.includes('burnie') && baseType === 'Anfänger') {
                        const hasPavan = courses.some(wc => wc.teacherId === course.teacherId && (wc.name === 'Yoga Vidya meets Pavanmuktasana' || wc.name === 'Yoga Vidya Pavanmuktasana'));
                        if (!hasPavan) {
                            course.name = 'Yoga Vidya meets Pavanmuktasana';
                        }
                    }
                    else if (tNameLower.includes('satyam') && baseType === 'Mittelstufe') {
                        course.name = 'Yoga Flow Mittelstufe';
                    }
                    else if (tNameLower.includes('abha') && baseType === 'Anfänger') {
                        const hasYin = courses.some(wc => wc.teacherId === course.teacherId && wc.name === 'Anfänger Yin Yoga');
                        if (!hasYin) {
                            course.name = 'Anfänger Yin Yoga';
                        }
                    }
                }
            }
        }
        // 4. Friday morning (09:15) intermediate class rename based on Pranava assignment
        if (course.dayOfWeek === 5 && course.startTime === '09:15' && course.name.toLowerCase().includes('mittelstufe')) {
            if (tNameLower.includes('pranava')) {
                course.name = 'Mittelstufe Klangyogastunde';
            }
            else {
                course.name = 'Mittelstufe';
            }
        }
    });
    return courses;
}
// Combined adjustment logic
function adjustCoursesForRules(courses, teachers, targetWeekCode) {
    adjustNamesForRules(courses, teachers);
    adjustRoomsForRules(courses, teachers, targetWeekCode);
    return courses;
}
