var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_child_process = require("child_process");
var import_fs = __toESM(require("fs"));
var import_db = require("./rapla-frontend/src/lib/db.js");
var import_planningEngine = require("./rapla-frontend/src/lib/planningEngine.js");
var import_excel_absences = require("./rapla-frontend/src/lib/excel_absences.js");
try {
  console.log("[PREPLANNING] Triggering Wochenplan rules compilation...");
  (0, import_child_process.execSync)("node rapla-frontend/scripts/compile_rules.js", { stdio: "inherit" });
} catch (e) {
  console.error("[PREPLANNING ERROR] Failed compiling rules:", e);
}
global.window = {};
const mockLocalStorage = {};
global.localStorage = {
  getItem: (key) => mockLocalStorage[key] || null,
  setItem: (key, value) => {
    mockLocalStorage[key] = value;
  },
  removeItem: (key) => {
    delete mockLocalStorage[key];
  },
  clear: () => {
    for (const k in mockLocalStorage) delete mockLocalStorage[k];
  },
  length: 0,
  key: (index) => null
};
const teachers = import_db.db.getTeachers();
localStorage.setItem("rapla_teachers", JSON.stringify(teachers));
const sevafreiList = import_excel_absences.EXCEL_ABSENCES.map((abs, i) => {
  const match = teachers.find((t) => {
    const cleanExcel = abs.excelName.toLowerCase().trim();
    const dbName = t.name.toLowerCase().trim();
    if (cleanExcel === "abha" && dbName.includes("abha")) return true;
    if (cleanExcel === "adam" && dbName.includes("adam")) return true;
    if (cleanExcel === "alexander" && dbName.includes("alexander")) return true;
    if (cleanExcel === "anjali" && dbName.includes("anjali")) return true;
    if (cleanExcel === "burnie" && dbName.includes("burnie")) return true;
    if (cleanExcel === "harishakti" && dbName.includes("harishakti")) return true;
    if (cleanExcel === "hu" && dbName.includes("hu")) return true;
    if (cleanExcel === "karuna" && dbName.includes("karuna")) return true;
    if (cleanExcel === "mounir" && (dbName.includes("mouniir") || dbName.includes("mounir"))) return true;
    if (cleanExcel === "narayani" && dbName.includes("narayani")) return true;
    if (cleanExcel === "nirmaya" && dbName.includes("nirmaya")) return true;
    if (cleanExcel === "pranava" && dbName.includes("pranava")) return true;
    if (cleanExcel === "satyam" && dbName.includes("satyam")) return true;
    if (cleanExcel === "ulrich" && dbName.includes("ulrich")) return true;
    const firstName = dbName.split(" ")[0];
    if (firstName === "karuna" && cleanExcel !== "karuna") return false;
    return cleanExcel.includes(firstName) && firstName.length > 2;
  });
  return match ? {
    id: `excel-sf-${i}`,
    teacherId: match.id,
    teacherName: match.name,
    avatarColor: match.avatarColor || "#960040",
    startDate: abs.startDate,
    endDate: abs.endDate,
    type: abs.type,
    status: abs.status,
    note: abs.note
  } : null;
}).filter(Boolean);
const absencesPath = "./rapla-frontend/src/lib/data/sevafrei_absences.json";
if (import_fs.default.existsSync(absencesPath)) {
  try {
    const absencesData = import_fs.default.readFileSync(absencesPath, "utf-8");
    const customAbsences = JSON.parse(absencesData);
    if (Array.isArray(customAbsences)) {
      let mergedCount = 0;
      customAbsences.forEach((abs) => {
        const isDup = sevafreiList.some(
          (existing) => existing.teacherId === abs.teacherId && existing.startDate === abs.startDate && existing.endDate === abs.endDate
        );
        if (!isDup) {
          sevafreiList.push(abs);
          mergedCount++;
        }
      });
      console.log(`[PREPLANNING] ${mergedCount} zus\xE4tzliche Abwesenheiten aus JSON geladen.`);
    }
  } catch (e) {
    console.error("[PREPLANNING] Fehler beim Laden der Abwesenheiten:", e);
  }
}
localStorage.setItem("rapla_sevafrei", JSON.stringify(sevafreiList));
function getLocalDateForDay(weekCode, dayOfWeek) {
  const parts = weekCode.split("-W");
  const year = parseInt(parts[0], 10);
  const weekNum = parseInt(parts[1], 10);
  const jan4 = new Date(year, 0, 4);
  const dayNum = jan4.getDay() || 7;
  const monday = new Date(jan4.getTime());
  monday.setDate(jan4.getDate() - dayNum + 1);
  const targetMonday = new Date(monday.getTime());
  targetMonday.setDate(monday.getDate() + (weekNum - 1) * 7);
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
function planWeekWithAbsences(weekCode, standardCourses2) {
  console.log(`
======================================================`);
  console.log(`PLANNING FOR WEEK: ${weekCode}`);
  console.log(`======================================================`);
  const courses = standardCourses2.map((c, idx) => {
    const courseCopy = {
      ...c,
      id: `course-${weekCode}-${idx + 1}`,
      isAiPlanned: false,
      status: "approved"
    };
    if (!courseCopy.teacherId) return courseCopy;
    const teacher = teachers.find((t) => t.id === courseCopy.teacherId);
    if (!teacher) return courseCopy;
    const courseDate = getLocalDateForDay(weekCode, courseCopy.dayOfWeek);
    const namesToCheck = [];
    if (teacher.name.includes(",")) {
      teacher.name.split(",").forEach((n) => namesToCheck.push(n.trim().toLowerCase()));
    } else {
      namesToCheck.push(teacher.name.toLowerCase().trim());
    }
    let isAnyAbsent = false;
    for (const name of namesToCheck) {
      const activeAbsence = sevafreiList.find((entry) => {
        if (!entry) return false;
        const entryName = entry.teacherName.toLowerCase().trim();
        const isMatch = entryName.includes(name) || name.includes(entryName.split(" ")[0]);
        return isMatch && courseDate >= entry.startDate && courseDate <= entry.endDate;
      });
      if (activeAbsence) {
        console.log(`[ABSENCE] ${teacher.name} has absent member "${name}" on ${courseDate} (${activeAbsence.type}: ${activeAbsence.note || "no note"}).`);
        isAnyAbsent = true;
        break;
      }
    }
    if (isAnyAbsent) {
      courseCopy.teacherId = null;
      courseCopy.isAiPlanned = true;
    }
    return courseCopy;
  });
  const result = (0, import_planningEngine.runAiPlanning)(courses, teachers, [], weekCode);
  const replanned = result.plannedCourses.filter((c) => c.isAiPlanned);
  console.log(`Replanned ${replanned.length} courses:`);
  replanned.forEach((c) => {
    const origCourse = standardCourses2.find((orig) => orig.name === c.name && orig.dayOfWeek === c.dayOfWeek && orig.startTime === c.startTime);
    const origTeacher = teachers.find((t) => t.id === origCourse?.teacherId)?.name || "Unbesetzt";
    const newTeacher = teachers.find((t) => t.id === c.teacherId)?.name || "NONE";
    console.log(` - ${c.name} (${c.startTime}): ${origTeacher} -> ${newTeacher}`);
  });
  result.logs.forEach((log) => {
    if (log.includes("Kein passender") || log.includes("Warnung") || log.includes("Fehler") || log.includes("Replanung erforderlich")) {
      console.log(`  LOG: ${log}`);
    }
  });
  return result.plannedCourses;
}
const getTeacherIdByName = (shortName) => {
  if (!shortName) return null;
  const nameLower = shortName.toLowerCase().trim();
  if (nameLower === "pranava") return "teacher-gen-pranava-pauly";
  if (nameLower === "nirmaya") return "teacher-gen-nirmaya-fodor";
  if (nameLower === "harishakti") return "teacher-gen-harishakti";
  if (nameLower === "abha") return "teacher-gen-abha-morkoetter";
  if (nameLower === "karuna") return "teacher-gen-karuna-wapke";
  if (nameLower === "adam") return "teacher-gen-adam-zmuda";
  if (nameLower === "anjali") return "teacher-gen-anjali-gelzleichter";
  if (nameLower === "yl" || nameLower === "! yl" || nameLower === "! yl #") return "teacher-gen-yl";
  if (nameLower === "burnie") return "teacher-gen-burnie-bansemer";
  if (nameLower === "hu") return "teacher-gen-hu-buerkle";
  if (nameLower === "ulrich") return "teacher-gen-ulrich-nebel";
  if (nameLower === "alexander") return "teacher-gen-alexander-melior";
  if (nameLower === "narayani") return "teacher-gen-narayani-kedenburg";
  if (nameLower === "mouniir") return "teacher-gen-mouniir-jaber";
  if (nameLower === "christopher") return "teacher-gen-christopher";
  if (nameLower === "adam, anjali" || nameLower === "adam,anjali") return "teacher-gen-adam-anjali";
  if (nameLower === "burnie, narayani" || nameLower === "burnie,narayani") return "teacher-gen-burnie-narayani";
  if (nameLower === "mouniir, christopher" || nameLower === "mouniir,christopher") return "teacher-gen-mouniir-christopher";
  if (nameLower === "anjali, abha" || nameLower === "anjali,abha") return "teacher-gen-anjali-abha";
  return null;
};
const mockCompositeTeachers = [
  { name: "Adam, Anjali", id: "teacher-gen-adam-anjali" },
  { name: "burnie, Narayani", id: "teacher-gen-burnie-narayani" },
  { name: "Mouniir, Christopher", id: "teacher-gen-mouniir-christopher" },
  { name: "Anjali, Abha", id: "teacher-gen-anjali-abha" }
].map((t) => ({
  id: t.id,
  name: t.name,
  email: t.name.toLowerCase().replace(/[^a-z]/g, "") + "@yoga.de",
  phone: "",
  avatarColor: "from-purple-500 to-indigo-600",
  specialties: ["Hatha", "Vinyasa", "Yin", "Meditation", "Power Yoga", "Kundalini"],
  isYogaTeacher: true,
  availabilityMode: "always",
  roleType: "external",
  rules: {
    maxClassesPerDay: 2,
    maxHoursPerWeek: 10,
    minRestTime: 30,
    preferredRooms: [],
    preferredDays: [],
    canLeadMeditation: false,
    canLeadSatsang: false,
    availability: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, start: "06:00", end: "22:00" }))
  }
}));
teachers.push(...mockCompositeTeachers);
localStorage.setItem("rapla_teachers", JSON.stringify(teachers));
const standardCoursesDefs = [
  // Friday (dayOfWeek: 5)
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 5, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Pranava" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 5, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Nirmaya" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 5, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Harishakti" },
  { name: "Mittelstufe Klangyogastunde", style: "Hatha", dayOfWeek: 5, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Pranava" },
  { name: "Anf\xE4nger Ankommensstunde", style: "Hatha", dayOfWeek: 5, startTime: "16:30", endTime: "18:00", roomId: "room-2", teacherName: "Abha" },
  { name: "Mittelstufe Ankommensstunde", style: "Hatha", dayOfWeek: 5, startTime: "16:30", endTime: "18:00", roomId: "room-5", teacherName: "Karuna" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 5, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Adam, Anjali" },
  { name: "Satsang Einf\xFChrung", style: "Meditation", dayOfWeek: 5, startTime: "20:00", endTime: "20:35", roomId: "room-5", teacherName: "Pranava" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 5, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
  // Saturday (dayOfWeek: 6)
  { name: "Fortgeschrittenes Pranayama", style: "Hatha", dayOfWeek: 6, startTime: "06:00", endTime: "06:50", roomId: "room-2", teacherName: "Karuna" },
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 6, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Nirmaya" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 6, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Abha" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 6, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Pranava" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 6, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Abha" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 6, startTime: "16:15", endTime: "18:00", roomId: "room-2", teacherName: "! YL" },
  { name: "Mittelstufe Mantrayogastunde", style: "Hatha", dayOfWeek: 6, startTime: "16:15", endTime: "18:00", roomId: "room-5", teacherName: "Anjali" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 6, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Anjali" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 6, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
  // Sunday (dayOfWeek: 0)
  { name: "Fortgeschrittenes Pranayama", style: "Hatha", dayOfWeek: 0, startTime: "06:00", endTime: "06:50", roomId: "room-2", teacherName: "burnie, Narayani" },
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 0, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Harishakti" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 0, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "burnie" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 0, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "burnie" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 0, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Anjali" },
  { name: "Anf\xE4nger Ankommensstunde", style: "Hatha", dayOfWeek: 0, startTime: "16:30", endTime: "18:00", roomId: "room-2", teacherName: "Pranava" },
  { name: "Mittelstufe Ankommensstunde", style: "Hatha", dayOfWeek: 0, startTime: "16:30", endTime: "18:00", roomId: "room-5", teacherName: "Karuna" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 0, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "burnie, Narayani" },
  { name: "Satsang Einf\xFChrung", style: "Meditation", dayOfWeek: 0, startTime: "20:00", endTime: "20:35", roomId: "room-5", teacherName: "" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 0, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
  // Monday (dayOfWeek: 1)
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 1, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "hu" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Anjali" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 1, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "burnie" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 1, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Harishakti" },
  { name: "Anf\xE4nger R\xFCckenstunde", style: "Hatha", dayOfWeek: 1, startTime: "16:15", endTime: "18:00", roomId: "room-2", teacherName: "Pranava" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 1, startTime: "16:15", endTime: "18:00", roomId: "room-5", teacherName: "Ulrich" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 1, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Nirmaya" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 1, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Narayani" },
  // Tuesday (dayOfWeek: 2)
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 2, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Alexander" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 2, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Harishakti" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 2, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Harishakti" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 2, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Anjali" },
  { name: "Anf\xE4nger Yin Yoga", style: "Hatha", dayOfWeek: 2, startTime: "16:15", endTime: "18:00", roomId: "room-2", teacherName: "Abha" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 2, startTime: "16:15", endTime: "18:00", roomId: "room-5", teacherName: "Narayani" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 2, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Mouniir, Christopher" },
  // Wednesday (dayOfWeek: 3)
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 3, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Satyam" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 3, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Narayani" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 3, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Alexander" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 3, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Narayani" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 3, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Abha" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 3, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
  // Thursday (dayOfWeek: 4)
  { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 4, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Christopher" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 4, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Anjali" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 4, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Alexander" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 4, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Abha" },
  { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 4, startTime: "16:15", endTime: "18:00", roomId: "room-2", teacherName: "Ulrich" },
  { name: "Mittelstufe", style: "Hatha", dayOfWeek: 4, startTime: "16:15", endTime: "18:00", roomId: "room-5", teacherName: "Nirmaya" },
  { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 4, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Harishakti" },
  { name: "Satsang", style: "Meditation", dayOfWeek: 4, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" }
];
const standardCourses = standardCoursesDefs.map((c, index) => ({
  id: `course-def-${index + 1}`,
  name: c.name,
  style: c.style,
  dayOfWeek: c.dayOfWeek,
  startTime: c.startTime,
  endTime: c.endTime,
  roomId: c.roomId,
  teacherId: getTeacherIdByName(c.teacherName),
  isAiPlanned: false,
  status: "draft"
}));
const results = {};
for (const week of [
  "2026-W28",
  "2026-W29",
  "2026-W30",
  "2026-W31",
  "2026-W32",
  "2026-W33",
  "2026-W34",
  "2026-W35",
  "2026-W36",
  "2026-W37",
  "2026-W38",
  "2026-W39",
  "2026-W40"
]) {
  results[week] = planWeekWithAbsences(week, standardCourses);
}
function formatPlanCoursesCode(courses) {
  const lines = courses.map((c) => {
    return `      {
        "id": "${c.id}",
        "name": "${c.name}",
        "style": "${c.style}",
        "dayOfWeek": ${c.dayOfWeek},
        "startTime": "${c.startTime}",
        "endTime": "${c.endTime}",
        "roomId": "${c.roomId}",
        "teacherId": ${c.teacherId ? `"${c.teacherId}"` : "null"},
        "isAiPlanned": ${c.isAiPlanned},
        "status": "approved"
      }`;
  });
  return "[\n" + lines.join(",\n") + "\n    ]";
}
import_fs.default.writeFileSync(
  "planned_weeks_output.txt",
  Object.entries(results).map(([week, courses]) => `// === ${week} ===
${formatPlanCoursesCode(courses)}`).join("\n\n")
);
console.log("\nDone! Output written to planned_weeks_output.txt");
const plansCodeParts = Object.entries(results).map(([week, courses]) => {
  return `  {
    id: "plan-pre-${week}",
    name: "Vorplanung ${week} (Automatisch)",
    status: "approved",
    targetWeekCode: "${week}",
    courses: ${formatPlanCoursesCode(courses)},
    createdAt: new Date().toISOString()
  }`;
});
const plansCode = plansCodeParts.join(",\n");
const dbPath = "./rapla-frontend/src/lib/db.ts";
if (import_fs.default.existsSync(dbPath)) {
  let dbContent = import_fs.default.readFileSync(dbPath, "utf-8");
  const startIndex = dbContent.indexOf('    id: "plan-pre-2026-W28",');
  const braceStartIndex = dbContent.lastIndexOf("{", startIndex);
  const endPlanIndex = dbContent.indexOf('    id: "plan-pre-2026-W40",');
  const createdAtIndex = dbContent.indexOf("    createdAt:", endPlanIndex);
  const braceEndIndex = dbContent.indexOf("  }", createdAtIndex) + 3;
  if (braceStartIndex !== -1 && braceEndIndex !== -1 && startIndex !== -1 && endPlanIndex !== -1) {
    const before = dbContent.substring(0, braceStartIndex);
    const after = dbContent.substring(braceEndIndex);
    let updatedContent = before + plansCode + after;
    updatedContent = updatedContent.replace(
      /const CURRENT_DB_VERSION = \d+;/g,
      (match) => {
        const version = parseInt(match.match(/\d+/)[0], 10);
        return `const CURRENT_DB_VERSION = ${version + 1};`;
      }
    );
    import_fs.default.writeFileSync(dbPath, updatedContent);
    console.log(`[PREPLANNING] rapla-frontend/src/lib/db.ts wurde erfolgreich mit den neuen Wochenpl\xE4nen ab W28 aktualisiert (CURRENT_DB_VERSION erh\xF6ht).`);
  } else {
    console.error("[PREPLANNING] Fehler beim Finden des Ersetzungsbereichs in db.ts");
  }
} else {
  console.error("[PREPLANNING] db.ts Pfad existiert nicht.");
}
