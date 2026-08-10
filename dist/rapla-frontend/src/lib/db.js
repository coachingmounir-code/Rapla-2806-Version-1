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
var db_exports = {};
__export(db_exports, {
  db: () => db
});
module.exports = __toCommonJS(db_exports);
var import_wochenplan_rules = __toESM(require("./data/wochenplan_rules.json"), 1);
const DEFAULT_ROOMS = [
  { id: "room-1", name: "Devi", color: "#d32f2f" },
  { id: "room-2", name: "Radhakrisna", color: "#f57c00" },
  { id: "room-3", name: "Hanuman", color: "#388e3c" },
  { id: "room-4", name: "Sitaram", color: "#1976d2" },
  { id: "room-5", name: "Tripura", color: "#7b1fa2" }
];
const NEW_TEACHER_NAMES = [
  "! Assistenz #",
  "! Assistenz 2",
  "! Assistenz YLAB",
  "! SemBegl #",
  "! \xDCbersetzer #",
  "! YL #",
  "Abha",
  "Adam",
  "Adinatha Lang #",
  "Alexander",
  "Amyana Finkel",
  "Ananda Schaak",
  "Ananta Heussler",
  "Anantadas B\xFCsseler",
  "Anjali",
  "Annette Pritschow",
  "Aziza Lena Alemi",
  "Beate Menkarski",
  "Bhavani Jannausch",
  "Burnie",
  "Carina van Anken",
  "Christel Smaluhn",
  "Christopher",
  "Darshanie Sukhu",
  "David",
  "Devi Ruiz",
  "Elena",
  "Eric Vis Dieperink",
  "Erkan Batmaz",
  "Gruppe Mudita",
  "Hagit Noam",
  "Harishakti",
  "Hu",
  "Ingrid Seemann",
  "Jnanadev Wallaschkowski",
  "J\xF6rg L\xFCtzow",
  "J\xF6rg M\xFCller",
  "Julia Backhaus",
  "Jutta Kremer",
  "Jyoti Rudolphi #",
  "Karuna",
  "Klaus Schindler",
  "Larissa Gaertner",
  "Lilly",
  "Linda Silberbauer #",
  "Liu Jianshe",
  "Madhavi Broszinski",
  "Maharani Schons",
  "Maharani Fritsch",
  "Maria",
  "Martina Schloms #",
  "Matthias Physal #",
  "Melanie Vagt",
  "Michael B\xFCchel",
  "Michaela Hold",
  "Mirabai Seifert",
  "Monika",
  "Monika Adele Camara",
  "Mounir",
  "Narayani",
  "Nathalie Butscher",
  "Nina Pabst",
  "Nirmaya",
  "Parashakti K\xFCttner",
  "Petra Zimmermann",
  "Pranava",
  "Ramashakti Sikora",
  "Raphael Mousa",
  "Sarada Drautzburg",
  "Satyadevi Bretz",
  "Satyam",
  "Satyamitra",
  "Shankara Maune",
  "Shankara H\xFCbener",
  "Shankari Susanne Hill",
  "Shantara Nickler",
  "Shivakami Bretz",
  "Sivani",
  "Sukadev Bretz",
  "Susanne Sirringhaus",
  "Swami Tattvarupananda",
  "Swami Yatidharmananda",
  "Tanja Eichenm\xFCller",
  "Teresa",
  "Ulrich",
  "Venulo Broszinski",
  "Volker Horn",
  "Wolfgang Seemann",
  "Wolfgang Meisel",
  "Zofia Konchok Nyima"
];
const SEVAKA_NAMES = [
  "Abha",
  "Adam",
  "Alexander",
  "Anjali",
  "Burnie",
  "Harishakti",
  "Hu",
  "Karuna",
  "Mounir",
  "Narayani",
  "Nirmaya",
  "Pranava",
  "Satyam",
  "Teresa",
  "Ulrich"
];
function getTeacherAvailability(name, isSevaka) {
  const nameLower = name.toLowerCase().trim();
  if (!isSevaka) {
    return [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, start: "08:00", end: "22:00" }));
  }
  const teacherKey = Object.keys(import_wochenplan_rules.default.teachers).find((k) => nameLower.includes(k) || k.includes(nameLower));
  const tRules = teacherKey ? import_wochenplan_rules.default.teachers[teacherKey] : null;
  if (!tRules) {
    return [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, start: "06:00", end: "22:00" }));
  }
  if (tRules.preferredAvailability && tRules.preferredAvailability.length > 0) {
    return tRules.preferredAvailability;
  }
  const freeDays = tRules.freeDays || [];
  const availDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !freeDays.includes(d));
  let slots = availDays.map((d) => ({ day: d, start: "06:00", end: "22:00" }));
  if (tRules.availabilityRestrictions && tRules.availabilityRestrictions.length > 0) {
    slots = slots.map((slot) => {
      const rest = tRules.availabilityRestrictions.find((r) => r.day === slot.day && r.allowed === false);
      if (rest) {
        if (rest.timeAfter) {
          return { ...slot, end: rest.timeAfter };
        }
        if (rest.timeBefore) {
          return { ...slot, start: rest.timeBefore };
        }
      }
      return slot;
    });
  }
  return slots;
}
function getTeacherRules(name, isSevaka) {
  const nameLower = name.toLowerCase().trim();
  const teacherKey = Object.keys(import_wochenplan_rules.default.teachers).find((k) => nameLower.includes(k) || k.includes(nameLower));
  const tRules = teacherKey ? import_wochenplan_rules.default.teachers[teacherKey] : null;
  if (!isSevaka || !tRules) {
    return {
      maxClassesPerDay: 2,
      maxHoursPerWeek: 10,
      canLeadMeditation: false,
      canLeadSatsang: false,
      availability: getTeacherAvailability(name, isSevaka)
    };
  }
  const rules = {
    maxClassesPerDay: tRules.maxClassesPerDay || 2,
    maxHoursPerWeek: tRules.maxHoursPerWeek || 10,
    maxClassesPerWeek: tRules.maxClassesPerWeek || void 0,
    maxYogaClassesPerWeek: tRules.maxYogaClassesPerWeek || void 0,
    maxMeditationPerWeek: tRules.maxMeditationPerWeek !== null ? tRules.maxMeditationPerWeek : void 0,
    maxSatsangsPerWeek: tRules.maxSatsangsPerWeek !== null ? tRules.maxSatsangsPerWeek : void 0,
    maxMorningSatsangsPerWeek: tRules.maxMorningSatsangsPerWeek !== null ? tRules.maxMorningSatsangsPerWeek : void 0,
    maxOnnPerWeek: tRules.maxOnnPerWeek !== null ? tRules.maxOnnPerWeek : void 0,
    noTwoYogaSameDay: tRules.noTwoYogaSameDay || false,
    weekendAfternoonOnly: tRules.weekendAfternoonOnly || false,
    weekendAsBackupOnly: tRules.weekendAsBackupOnly || false,
    noYogaOnWeekend: tRules.noYogaOnWeekend || false,
    prefersMittelstufe: tRules.prefersMittelstufe || false,
    canLeadMeditation: import_wochenplan_rules.default.meditation.allowed.some((a) => nameLower.includes(a)),
    canLeadSatsang: isSevaka && !import_wochenplan_rules.default.satsang.forbidden.some((a) => nameLower.includes(a)),
    canLeadPranayama: tRules.canLeadPranayama || false,
    canLeadSatsangEinfuehrung: tRules.canLeadSatsangEinfuehrung || false,
    canLeadOnn: tRules.canLeadOnn !== void 0 ? tRules.canLeadOnn : true,
    customCourseNames: tRules.customCourseNames || []
  };
  return rules;
}
const GENERATED_TEACHERS = NEW_TEACHER_NAMES.map((name, index) => {
  const cleanIdName = name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  let id = `teacher-gen-${cleanIdName || index}`;
  if (name === "Abha") id = "teacher-gen-abha-morkoetter";
  else if (name === "Adam") id = "teacher-gen-adam-zmuda";
  else if (name === "Alexander") id = "teacher-gen-alexander-melior";
  else if (name === "Anjali") id = "teacher-gen-anjali-gelzleichter";
  else if (name === "Burnie") id = "teacher-gen-burnie-bansemer";
  else if (name === "Hu") id = "teacher-gen-hu-buerkle";
  else if (name === "Karuna") id = "teacher-gen-karuna-wapke";
  else if (name === "Mounir") id = "teacher-gen-mouniir-jaber";
  else if (name === "Narayani") id = "teacher-gen-narayani-kedenburg";
  else if (name === "Nirmaya") id = "teacher-gen-nirmaya-fodor";
  else if (name === "Pranava") id = "teacher-gen-pranava-pauly";
  else if (name === "Teresa") id = "teacher-gen-teresa-allgaeu";
  else if (name === "Ulrich") id = "teacher-gen-ulrich-nebel";
  const emailName = name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]/g, ".");
  const email = `${emailName}@yoga.de`.replace(/\.+/g, ".").replace(/^\.|\.$/g, "");
  const colors = [
    "from-pink-500 to-rose-500",
    "from-blue-500 to-indigo-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-600",
    "from-purple-500 to-indigo-600",
    "from-cyan-400 to-blue-500"
  ];
  const avatarColor = colors[index % colors.length];
  const isSevaka = SEVAKA_NAMES.includes(name);
  const isYogaTeacher = isSevaka ? !(name.toLowerCase().includes("teresa") || name.toLowerCase().includes("hu") || name.toLowerCase().includes("mounir") || name.toLowerCase().includes("adam")) : true;
  const tRules = getTeacherRules(name, isSevaka);
  return {
    id,
    name,
    email,
    phone: "",
    avatarColor,
    specialties: isYogaTeacher ? ["Hatha", "Vinyasa", "Yin", "Meditation", "Power Yoga", "Kundalini"] : ["Meditation"],
    isYogaTeacher,
    availabilityMode: isSevaka ? "always" : "seminar_only",
    roleType: isSevaka ? "sevaka" : "external",
    rules: {
      maxClassesPerDay: tRules.maxClassesPerDay || 2,
      maxHoursPerWeek: tRules.maxHoursPerWeek || 10,
      maxClassesPerWeek: tRules.maxClassesPerWeek,
      minRestTime: 30,
      preferredRooms: [],
      preferredDays: [],
      ...tRules,
      availability: getTeacherAvailability(name, isSevaka)
    }
  };
});
const DEFAULT_TEACHERS = [
  {
    id: "teacher-1",
    name: "Sarah Schmidt",
    email: "sarah.schmidt@yoga.de",
    phone: "+49 176 1234567",
    avatarColor: "from-pink-500 to-rose-500",
    specialties: ["Hatha", "Vinyasa", "Yin"],
    isYogaTeacher: true,
    availabilityMode: "always",
    roleType: "external",
    rules: {
      maxClassesPerDay: 2,
      maxHoursPerWeek: 12,
      minRestTime: 30,
      preferredRooms: ["room-1", "room-2"],
      preferredDays: [],
      availability: [
        { day: 1, start: "08:00", end: "14:00" },
        // Mon morning
        { day: 3, start: "08:00", end: "18:00" },
        // Wed all day
        { day: 5, start: "12:00", end: "20:00" }
        // Fri afternoon/evening
      ]
    }
  },
  {
    id: "teacher-2",
    name: "Michael M\xFCller",
    email: "michael.mueller@yoga.de",
    phone: "+49 172 9876543",
    avatarColor: "from-blue-500 to-indigo-500",
    specialties: ["Vinyasa", "Power Yoga", "Meditation"],
    isYogaTeacher: true,
    availabilityMode: "always",
    roleType: "external",
    rules: {
      maxClassesPerDay: 3,
      maxHoursPerWeek: 15,
      minRestTime: 45,
      preferredRooms: ["room-1", "room-3"],
      preferredDays: [],
      availability: [
        { day: 2, start: "10:00", end: "20:00" },
        // Tue all day
        { day: 4, start: "14:00", end: "21:00" },
        // Thu afternoon/evening
        { day: 6, start: "09:00", end: "16:00" }
        // Sat morning/afternoon
      ]
    }
  },
  {
    id: "teacher-3",
    name: "Elena Rostova",
    email: "elena.rostova@yoga.de",
    phone: "+49 179 4561230",
    avatarColor: "from-amber-400 to-orange-500",
    specialties: ["Yin", "Meditation", "Hatha"],
    isYogaTeacher: true,
    availabilityMode: "always",
    roleType: "external",
    rules: {
      maxClassesPerDay: 2,
      maxHoursPerWeek: 8,
      minRestTime: 30,
      preferredRooms: ["room-2", "room-3"],
      preferredDays: [],
      availability: [
        { day: 1, start: "14:00", end: "21:00" },
        // Mon afternoon/evening
        { day: 3, start: "14:00", end: "21:00" },
        // Wed afternoon/evening
        { day: 5, start: "08:00", end: "15:00" }
        // Fri morning/afternoon
      ]
    }
  },
  {
    id: "teacher-4",
    name: "Jan Nowak",
    email: "jan.nowak@yoga.de",
    phone: "+49 151 7894561",
    avatarColor: "from-emerald-400 to-teal-600",
    specialties: ["Hatha", "Meditation", "Kundalini"],
    isYogaTeacher: true,
    availabilityMode: "always",
    roleType: "external",
    rules: {
      maxClassesPerDay: 1,
      maxHoursPerWeek: 6,
      minRestTime: 60,
      preferredRooms: ["room-3"],
      preferredDays: [],
      availability: [
        { day: 2, start: "08:00", end: "12:00" },
        // Tue morning
        { day: 4, start: "08:00", end: "12:00" },
        // Thu morning
        { day: 0, start: "10:00", end: "18:00" }
        // Sun all day
      ]
    }
  },
  ...GENERATED_TEACHERS
];
const generateDefaultCourses = () => {
  const getTeacherIdByName = (shortName) => {
    if (!shortName) return null;
    const nameLower = shortName.toLowerCase();
    if (nameLower === "pranava") return "teacher-gen-pranava-pauly";
    if (nameLower === "nirmaya") return "teacher-gen-nirmaya-fodor";
    if (nameLower === "harishakti") return "teacher-gen-harishakti";
    if (nameLower === "abha") return "teacher-gen-abha-morkoetter";
    if (nameLower === "karuna") return "teacher-gen-karuna-wapke";
    if (nameLower === "adam") return "teacher-gen-adam-zmuda";
    if (nameLower === "anjali") return "teacher-gen-anjali-gelzleichter";
    if (nameLower === "yl") return "teacher-gen-yl";
    if (nameLower === "burnie") return "teacher-gen-burnie-bansemer";
    if (nameLower === "hu") return "teacher-gen-hu-buerkle";
    if (nameLower === "ulrich") return "teacher-gen-ulrich-nebel";
    if (nameLower === "alexander") return "teacher-gen-alexander-melior";
    if (nameLower === "narayani") return "teacher-gen-narayani-kedenburg";
    if (nameLower === "mouniir" || nameLower === "mounir") return "teacher-gen-mouniir-jaber";
    if (nameLower === "christopher") return "teacher-gen-christopher";
    return null;
  };
  const rawDefs = [
    // Friday (dayOfWeek: 5)
    { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 5, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Pranava" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 5, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Nirmaya" },
    { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 5, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Harishakti" },
    { name: "Mittelstufe Klangyogastunde", style: "Hatha", dayOfWeek: 5, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Pranava" },
    { name: "Anf\xE4nger Ankommensstunde", style: "Hatha", dayOfWeek: 5, startTime: "16:30", endTime: "18:00", roomId: "room-2", teacherName: "Abha" },
    { name: "Mittelstufe Ankommensstunde", style: "Hatha", dayOfWeek: 5, startTime: "16:30", endTime: "18:00", roomId: "room-5", teacherName: "Karuna" },
    { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 5, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Adam" },
    { name: "Satsang Einf\xFChrung", style: "Meditation", dayOfWeek: 5, startTime: "20:00", endTime: "20:35", roomId: "room-5", teacherName: "Pranava" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 5, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
    // Saturday (dayOfWeek: 6)
    { name: "Fortgeschrittenes Pranayama", style: "Hatha", dayOfWeek: 6, startTime: "06:00", endTime: "06:50", roomId: "room-2", teacherName: "Karuna" },
    { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 6, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Nirmaya" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 6, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Abha" },
    { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 6, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Pranava" },
    { name: "Mittelstufe", style: "Hatha", dayOfWeek: 6, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Abha" },
    { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 6, startTime: "16:15", endTime: "18:00", roomId: "room-2", teacherName: "YL" },
    { name: "Mittelstufe Mantrayogastunde", style: "Hatha", dayOfWeek: 6, startTime: "16:15", endTime: "18:00", roomId: "room-5", teacherName: "Anjali" },
    { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 6, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Anjali" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 6, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
    // Sunday (dayOfWeek: 0)
    { name: "Fortgeschrittenes Pranayama", style: "Hatha", dayOfWeek: 0, startTime: "06:00", endTime: "06:50", roomId: "room-2", teacherName: "burnie" },
    { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 0, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Harishakti" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 0, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "burnie" },
    { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 0, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "burnie" },
    { name: "Mittelstufe", style: "Hatha", dayOfWeek: 0, startTime: "09:15", endTime: "11:00", roomId: "room-5", teacherName: "Anjali" },
    { name: "Anf\xE4nger Ankommensstunde", style: "Hatha", dayOfWeek: 0, startTime: "16:30", endTime: "18:00", roomId: "room-2", teacherName: "Pranava" },
    { name: "Mittelstufe Ankommensstunde", style: "Hatha", dayOfWeek: 0, startTime: "16:30", endTime: "18:00", roomId: "room-5", teacherName: "Karuna" },
    { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 0, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "burnie" },
    { name: "Satsang Einf\xFChrung", style: "Meditation", dayOfWeek: 0, startTime: "20:00", endTime: "20:35", roomId: "room-5", teacherName: "" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 0, startTime: "20:00", endTime: "21:00", roomId: "room-2", teacherName: "Karuna" },
    // Monday (dayOfWeek: 1)
    { name: "Gef\xFChrte Meditation", style: "Meditation", dayOfWeek: 1, startTime: "07:00", endTime: "07:30", roomId: "room-5", teacherName: "Hu" },
    { name: "Satsang", style: "Meditation", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", roomId: "room-2", teacherName: "Anjali" },
    { name: "Anf\xE4nger", style: "Hatha", dayOfWeek: 1, startTime: "09:15", endTime: "11:00", roomId: "room-2", teacherName: "Burnie" },
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
    { name: "Om Namo Narayanaya", style: "Meditation", dayOfWeek: 2, startTime: "19:30", endTime: "20:00", roomId: "room-2", teacherName: "Mounir" },
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
  return rawDefs.map((d, index) => ({
    id: `course-def-${index + 1}`,
    name: d.name,
    style: d.style,
    dayOfWeek: d.dayOfWeek,
    startTime: d.startTime,
    endTime: d.endTime,
    roomId: d.roomId,
    teacherId: getTeacherIdByName(d.teacherName),
    isAiPlanned: false,
    status: "draft"
  }));
};
const DEFAULT_COURSES = generateDefaultCourses();
const DEFAULT_WEEK_PLANS = [
  {
    id: "plan-template-1",
    name: "Blankowoche Sommer",
    status: "blanko",
    courses: DEFAULT_COURSES.map((c) => ({ ...c, isAiPlanned: false, status: "draft" })),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-active-1",
    name: "Kursplan (Genehmigt & Aktiv)",
    status: "approved",
    courses: DEFAULT_COURSES.map((c) => ({ ...c, status: "approved" })),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // --- PREPLANNED WEEKS ---
  {
    id: "plan-pre-2026-W28",
    name: "Vorplanung 2026-W28 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W28",
    courses: [
      {
        "id": "course-2026-W28-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-55",
        "name": "Yoga Flow Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W28-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W29",
    name: "Vorplanung 2026-W29 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W29",
    courses: [
      {
        "id": "course-2026-W29-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-4",
        "name": "Yoga Flow",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W29-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W30",
    name: "Vorplanung 2026-W30 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W30",
    courses: [
      {
        "id": "course-2026-W30-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-42",
        "name": "Yoga Flow Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-47",
        "name": "Yoga Flow Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W30-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W31",
    name: "Vorplanung 2026-W31 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W31",
    courses: [
      {
        "id": "course-2026-W31-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-23",
        "name": "Yoga Flow Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W31-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W32",
    name: "Vorplanung 2026-W32 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W32",
    courses: [
      {
        "id": "course-2026-W32-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W32-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W33",
    name: "Vorplanung 2026-W33 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W33",
    courses: [
      {
        "id": "course-2026-W33-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-53",
        "name": "Yoga Flow Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W33-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W34",
    name: "Vorplanung 2026-W34 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W34",
    courses: [
      {
        "id": "course-2026-W34-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-14",
        "name": "Yoga Flow Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W34-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W35",
    name: "Vorplanung 2026-W35 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W35",
    courses: [
      {
        "id": "course-2026-W35-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": null,
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W35-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W36",
    name: "Vorplanung 2026-W36 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W36",
    courses: [
      {
        "id": "course-2026-W36-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W36-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W37",
    name: "Vorplanung 2026-W37 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W37",
    courses: [
      {
        "id": "course-2026-W37-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W37-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W38",
    name: "Vorplanung 2026-W38 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W38",
    courses: [
      {
        "id": "course-2026-W38-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W38-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W39",
    name: "Vorplanung 2026-W39 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W39",
    courses: [
      {
        "id": "course-2026-W39-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-jaber",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W39-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "plan-pre-2026-W40",
    name: "Vorplanung 2026-W40 (Automatisch)",
    status: "approved",
    targetWeekCode: "2026-W40",
    courses: [
      {
        "id": "course-2026-W40-1",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-2",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-3",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-4",
        "name": "Mittelstufe Klangyogastunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-5",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-6",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 5,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-7",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-adam-anjali",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-8",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-9",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 5,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-10",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-11",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-12",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-13",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-14",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-15",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-yl",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-16",
        "name": "Mittelstufe Mantrayogastunde",
        "style": "Hatha",
        "dayOfWeek": 6,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-17",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-18",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 6,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-19",
        "name": "Fortgeschrittenes Pranayama",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "06:00",
        "endTime": "06:50",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-20",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-21",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-22",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-23",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-24",
        "name": "Anf\xE4nger Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-25",
        "name": "Mittelstufe Ankommensstunde",
        "style": "Hatha",
        "dayOfWeek": 0,
        "startTime": "16:30",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-26",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-narayani",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-27",
        "name": "Satsang Einf\xFChrung",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "20:35",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-28",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 0,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-29",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-hu-buerkle",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-30",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-31",
        "name": "Yoga Vidya meets Pavanmuktasana",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-burnie-bansemer",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-32",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-33",
        "name": "Anf\xE4nger R\xFCckenstunde",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-pranava-pauly",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-34",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 1,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-35",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-36",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 1,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-37",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-38",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-39",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-40",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-41",
        "name": "Anf\xE4nger Yin Yoga",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-42",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 2,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-43",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 2,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-mouniir-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-44",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-45",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-46",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-47",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 3,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-48",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-satyam",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-49",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 3,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-narayani-kedenburg",
        "isAiPlanned": true,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-50",
        "name": "Gef\xFChrte Meditation",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "07:30",
        "roomId": "room-5",
        "teacherId": "teacher-gen-christopher",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-51",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "07:00",
        "endTime": "08:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-anjali-gelzleichter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-52",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-alexander-melior",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-53",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "09:15",
        "endTime": "11:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-abha-morkoetter",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-54",
        "name": "Anf\xE4nger",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-ulrich-nebel",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-55",
        "name": "Mittelstufe",
        "style": "Hatha",
        "dayOfWeek": 4,
        "startTime": "16:15",
        "endTime": "18:00",
        "roomId": "room-5",
        "teacherId": "teacher-gen-nirmaya-fodor",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-56",
        "name": "Om Namo Narayanaya",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "19:30",
        "endTime": "20:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-harishakti",
        "isAiPlanned": false,
        "status": "approved"
      },
      {
        "id": "course-2026-W40-57",
        "name": "Satsang",
        "style": "Meditation",
        "dayOfWeek": 4,
        "startTime": "20:00",
        "endTime": "21:00",
        "roomId": "room-2",
        "teacherId": "teacher-gen-karuna-wapke",
        "isAiPlanned": false,
        "status": "approved"
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
function getStored(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultValue;
  }
}
function setStored(key, value) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
const CURRENT_DB_VERSION = 42;
const db = {
  getDefaultCourses: () => DEFAULT_COURSES,
  getTeachers: () => {
    const storedVersion = typeof window !== "undefined" ? localStorage.getItem("rapla_db_version") : null;
    const isOutdated = !storedVersion || parseInt(storedVersion, 10) < CURRENT_DB_VERSION;
    const stored = getStored("rapla_teachers", DEFAULT_TEACHERS);
    let updated = false;
    const list = [...stored];
    for (const t of list) {
      if (t.id === "teacher-gen-abha-morkoetter" && t.name !== "Abha") {
        t.name = "Abha";
        updated = true;
      } else if (t.id === "teacher-gen-adam-zmuda" && t.name !== "Adam") {
        t.name = "Adam";
        updated = true;
      } else if (t.id === "teacher-gen-alexander-melior" && t.name !== "Alexander") {
        t.name = "Alexander";
        updated = true;
      } else if (t.id === "teacher-gen-anjali-gelzleichter" && t.name !== "Anjali") {
        t.name = "Anjali";
        updated = true;
      } else if (t.id === "teacher-gen-burnie-bansemer" && t.name !== "Burnie") {
        t.name = "Burnie";
        updated = true;
      } else if (t.id === "teacher-gen-hu-buerkle" && t.name !== "Hu") {
        t.name = "Hu";
        updated = true;
      } else if (t.id === "teacher-gen-karuna-wapke" && t.name !== "Karuna") {
        t.name = "Karuna";
        updated = true;
      } else if (t.id === "teacher-gen-mouniir-jaber" && t.name !== "Mounir") {
        t.name = "Mounir";
        updated = true;
      } else if (t.id === "teacher-gen-narayani-kedenburg" && t.name !== "Narayani") {
        t.name = "Narayani";
        updated = true;
      } else if (t.id === "teacher-gen-nirmaya-fodor" && t.name !== "Nirmaya") {
        t.name = "Nirmaya";
        updated = true;
      } else if (t.id === "teacher-gen-pranava-pauly" && t.name !== "Pranava") {
        t.name = "Pranava";
        updated = true;
      } else if (t.id === "teacher-gen-teresa-allgaeu" && t.name !== "Teresa") {
        t.name = "Teresa";
        updated = true;
      } else if (t.id === "teacher-gen-ulrich-nebel" && t.name !== "Ulrich") {
        t.name = "Ulrich";
        updated = true;
      }
    }
    for (const defT of DEFAULT_TEACHERS) {
      const existingIdx = list.findIndex((t) => t.id === defT.id || t.name === defT.name);
      if (existingIdx === -1) {
        list.push(defT);
        updated = true;
      } else if (isOutdated) {
        list[existingIdx].name = defT.name;
        list[existingIdx].rules = defT.rules;
        list[existingIdx].specialties = defT.specialties;
        list[existingIdx].roleType = defT.roleType;
        list[existingIdx].availabilityMode = defT.availabilityMode;
        list[existingIdx].isYogaTeacher = defT.isYogaTeacher;
        updated = true;
      }
    }
    for (const t of list) {
      if (t.name.toLowerCase().includes("harishakti")) {
        const hasMondayAvail = t.rules.availability.some((a) => a.day === 1 && a.start === "06:30" && a.end === "22:00");
        const hasTuesdayAvail = t.rules.availability.some((a) => a.day === 2 && a.end === "11:30");
        const hasWedAvail = t.rules.availability.some((a) => a.day === 3);
        const hasThuAvail = t.rules.availability.some((a) => a.day === 4);
        const hasFriAvail = t.rules.availability.some((a) => a.day === 5 && a.end === "11:30");
        if (!hasMondayAvail || !hasTuesdayAvail || hasWedAvail || hasThuAvail || !hasFriAvail) {
          t.rules.availability = [
            { day: 1, start: "06:30", end: "22:00" },
            // Monday
            { day: 2, start: "06:30", end: "11:30" },
            // Tuesday
            // Wednesday: FREI
            // Thursday: no slot
            { day: 5, start: "06:30", end: "11:30" }
            // Friday
          ];
          updated = true;
        }
      }
      if (t.name.toLowerCase().includes("karuna")) {
        const hasMondayAvail = t.rules.availability.some((a) => a.day === 1);
        const hasTuesdayAvail = t.rules.availability.some((a) => a.day === 2);
        if (hasMondayAvail || !hasTuesdayAvail || t.rules.maxHoursPerWeek < 30 || t.rules.maxClassesPerDay < 3) {
          t.rules.maxClassesPerDay = 3;
          t.rules.maxHoursPerWeek = 30;
          t.rules.availability = [
            { day: 2, start: "06:30", end: "22:00" },
            // Tuesday
            { day: 3, start: "06:30", end: "22:00" },
            // Wednesday
            { day: 4, start: "06:30", end: "22:00" },
            // Thursday
            { day: 5, start: "06:30", end: "22:00" },
            // Friday
            { day: 6, start: "06:30", end: "22:00" },
            // Saturday
            { day: 0, start: "06:30", end: "22:00" }
            // Sunday
          ];
          updated = true;
        }
      }
      const correctRole = SEVAKA_NAMES.includes(t.name) ? "sevaka" : "external";
      const nameLower = t.name.toLowerCase();
      const correctYogaTeacher = correctRole === "sevaka" ? !["teresa", "hu", "mounir", "adam"].some((n) => nameLower.includes(n)) : true;
      if (t.isYogaTeacher !== correctYogaTeacher) {
        t.isYogaTeacher = correctYogaTeacher;
        t.specialties = correctYogaTeacher ? ["Hatha", "Vinyasa", "Yin", "Meditation", "Power Yoga", "Kundalini"] : ["Meditation"];
        updated = true;
      }
      if (t.availabilityMode === void 0) {
        t.availabilityMode = "always";
        updated = true;
      }
      if (t.roleType !== correctRole) {
        t.roleType = correctRole;
        updated = true;
      }
      if (correctRole === "sevaka") {
        if (t.availabilityMode !== "always") {
          t.availabilityMode = "always";
          updated = true;
        }
        let availUpdated = false;
        t.rules.availability = t.rules.availability.map((slot) => {
          if (slot.start === "08:00") {
            availUpdated = true;
            return { ...slot, start: "06:30" };
          }
          return slot;
        });
        if (availUpdated) {
          updated = true;
        }
      }
      if (t.rules.preferredDays === void 0) {
        t.rules.preferredDays = [];
        updated = true;
      }
      const shouldLeadMeditation = ["pranava", "harishakti", "alexander", "burnie", "satyam", "nirmaya", "narayani", "mounir", "mouniir", "hu", "christopher"].some((n) => nameLower.includes(n));
      const shouldLeadSatsang = correctRole === "sevaka" && !["adam", "hu", "mounir", "mouniir", "teresa", "satyam", "ulrich", "pranava"].some((n) => nameLower.includes(n));
      if (t.rules.canLeadMeditation !== shouldLeadMeditation) {
        t.rules.canLeadMeditation = shouldLeadMeditation;
        updated = true;
      }
      if (t.rules.canLeadSatsang !== shouldLeadSatsang) {
        t.rules.canLeadSatsang = shouldLeadSatsang;
        updated = true;
      }
    }
    if (updated) {
      db.saveTeachers(list);
    }
    if (isOutdated && typeof window !== "undefined") {
      localStorage.setItem("rapla_db_version", CURRENT_DB_VERSION.toString());
    }
    return list;
  },
  saveTeachers: (teachers) => setStored("rapla_teachers", teachers),
  addTeacher: (teacher) => {
    const list = db.getTeachers();
    list.push(teacher);
    db.saveTeachers(list);
  },
  updateTeacher: (teacher) => {
    const list = db.getTeachers();
    const index = list.findIndex((t) => t.id === teacher.id);
    if (index !== -1) {
      list[index] = teacher;
      db.saveTeachers(list);
    }
  },
  deleteTeacher: (id) => {
    const list = db.getTeachers();
    db.saveTeachers(list.filter((t) => t.id !== id));
    const plans = db.getWeekPlans();
    const updated = plans.map((plan) => ({
      ...plan,
      courses: plan.courses.map((c) => c.teacherId === id ? { ...c, teacherId: null, isAiPlanned: false } : c)
    }));
    db.saveWeekPlans(updated);
  },
  getRooms: () => {
    const stored = getStored("rapla_rooms", DEFAULT_ROOMS);
    const isOld = stored.length !== 5 || stored.some((r) => r.name === "Sivananda Saal");
    if (isOld) {
      db.saveRooms(DEFAULT_ROOMS);
      return DEFAULT_ROOMS;
    }
    return stored;
  },
  saveRooms: (rooms) => setStored("rapla_rooms", rooms),
  // Week Plan Methods
  getWeekPlans: () => {
    const storedVersion = typeof window !== "undefined" ? localStorage.getItem("rapla_db_version") : null;
    const isOutdated = !storedVersion || parseInt(storedVersion, 10) < CURRENT_DB_VERSION;
    const stored = getStored("rapla_week_plans", DEFAULT_WEEK_PLANS);
    const hasOldCourses = stored.some((p) => p.courses.some((c) => c.name === "Morgen-Hatha Flow"));
    if (hasOldCourses) {
      db.saveWeekPlans(DEFAULT_WEEK_PLANS);
      return DEFAULT_WEEK_PLANS;
    }
    let updated = false;
    const list = [...stored];
    for (const defPlan of DEFAULT_WEEK_PLANS) {
      const idx = list.findIndex((p) => p.id === defPlan.id);
      if (idx === -1) {
        list.push(defPlan);
        updated = true;
      } else if (isOutdated || defPlan.id.startsWith("plan-pre-")) {
        list[idx] = defPlan;
        updated = true;
      }
    }
    for (const p of list) {
      if (p.seminarLeaderIds === void 0) {
        p.seminarLeaderIds = [];
        updated = true;
      }
      if (isOutdated && p.id.startsWith("plan-auto-")) {
        p.courses = DEFAULT_COURSES.map((c) => ({
          ...c,
          id: "course-" + Math.random().toString(36).substr(2, 9),
          teacherId: c.teacherId,
          isAiPlanned: false,
          status: "draft"
        }));
        updated = true;
      }
      const filteredCourses = p.courses.filter((c) => {
        const isAnkommen = c.name === "Ankommensmed." || c.name.includes("Ankommen");
        if (isAnkommen && c.dayOfWeek !== 5 && c.dayOfWeek !== 0) {
          return false;
        }
        return true;
      });
      if (filteredCourses.length !== p.courses.length) {
        p.courses = filteredCourses;
        updated = true;
      }
    }
    if (updated) {
      db.saveWeekPlans(list);
    }
    if (isOutdated && typeof window !== "undefined") {
      localStorage.setItem("rapla_db_version", CURRENT_DB_VERSION.toString());
    }
    return list;
  },
  saveWeekPlans: (plans) => setStored("rapla_week_plans", plans),
  getWeekPlan: (id) => db.getWeekPlans().find((p) => p.id === id),
  addWeekPlan: (plan) => {
    const list = db.getWeekPlans();
    list.push(plan);
    db.saveWeekPlans(list);
  },
  updateWeekPlan: (plan) => {
    const list = db.getWeekPlans();
    const index = list.findIndex((p) => p.id === plan.id);
    if (index !== -1) {
      list[index] = plan;
      db.saveWeekPlans(list);
    }
  },
  deleteWeekPlan: (id) => {
    const list = db.getWeekPlans();
    db.saveWeekPlans(list.filter((p) => p.id !== id));
  },
  // Courses API - maps to specific plan (defaults to first approved plan if no planId provided)
  getCourses: (planId) => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find((p) => p.status === "approved")?.id || plans[0]?.id || "";
    const plan = db.getWeekPlan(id);
    return plan ? plan.courses : [];
  },
  saveCourses: (courses, planId) => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find((p) => p.status === "approved")?.id || plans[0]?.id || "";
    const plan = db.getWeekPlan(id);
    if (plan) {
      plan.courses = courses;
      db.updateWeekPlan(plan);
    }
  },
  addCourse: (course, planId) => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find((p) => p.status === "approved")?.id || plans[0]?.id || "";
    const plan = db.getWeekPlan(id);
    if (plan) {
      plan.courses.push(course);
      db.updateWeekPlan(plan);
    }
  },
  updateCourse: (course, planId) => {
    const plans = db.getWeekPlans();
    const id = planId || plans.find((p) => p.status === "approved")?.id || plans[0]?.id || "";
    const plan = db.getWeekPlan(id);
    if (plan) {
      const index = plan.courses.findIndex((c) => c.id === course.id);
      if (index !== -1) {
        plan.courses[index] = course;
        db.updateWeekPlan(plan);
      }
    }
  },
  deleteCourse: (id, planId) => {
    const plans = db.getWeekPlans();
    const pId = planId || plans.find((p) => p.status === "approved")?.id || plans[0]?.id || "";
    const plan = db.getWeekPlan(pId);
    if (plan) {
      plan.courses = plan.courses.filter((c) => c.id !== id);
      db.updateWeekPlan(plan);
    }
  },
  // Clear all planner data for a specific plan
  resetSchedule: (planId) => {
    const plans = db.getWeekPlans();
    const pId = planId || plans.find((p) => p.status === "approved")?.id || plans[0]?.id || "";
    const plan = db.getWeekPlan(pId);
    if (plan) {
      plan.courses = plan.courses.map((c) => ({ ...c, teacherId: null, isAiPlanned: false, status: "draft" }));
      db.updateWeekPlan(plan);
    }
  },
  syncDatabase: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("rapla_teachers");
      localStorage.removeItem("rapla_week_plans");
      localStorage.removeItem("rapla_db_version");
      window.location.reload();
    }
  },
  getOrCreateUpcomingWeekPlans: () => {
    const plans = db.getWeekPlans();
    const upcoming = [];
    const today = /* @__PURE__ */ new Date();
    const currentDay = today.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    const getWeekNo = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
    };
    for (let w = 0; w < 4; w++) {
      const monday = new Date(today.getTime());
      monday.setDate(today.getDate() - daysSinceMonday + w * 7);
      const year = monday.getFullYear();
      const weekNum = getWeekNo(monday);
      const weekStr = weekNum.toString().padStart(2, "0");
      const weekCode = `${year}-W${weekStr}`;
      const friday = new Date(monday.getTime());
      friday.setDate(monday.getDate() - 3);
      const nextThursday = new Date(friday.getTime());
      nextThursday.setDate(friday.getDate() + 6);
      const startStr = friday.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
      const endStr = nextThursday.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
      const rangeLabel = `${startStr} - ${endStr}`;
      let plan = plans.find((p) => p.targetWeekCode === weekCode);
      if (!plan) {
        const template = plans.find((p) => p.id === "plan-template-1") || plans[0];
        const isAfterW40 = weekCode > "2026-W40";
        plan = {
          id: `plan-auto-${weekCode}`,
          name: `KW ${weekNum} (${rangeLabel})`,
          status: "draft",
          targetWeekCode: weekCode,
          courses: template.courses.map((c) => ({
            ...c,
            id: "course-" + Math.random().toString(36).substr(2, 9),
            teacherId: isAfterW40 ? null : c.teacherId,
            isAiPlanned: false,
            status: "draft"
          })),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        plans.push(plan);
        db.saveWeekPlans(plans);
      }
      upcoming.push(plan);
    }
    return upcoming;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  db
});
