import { EXCEL_ABSENCES } from './rapla-frontend/src/lib/excel_absences.js';

const startDate = new Date('2026-07-10');
const endDate = new Date('2026-08-06');

console.log("Absences between 2026-07-10 and 2026-08-06:");
const activeAbsences = EXCEL_ABSENCES.filter(abs => {
  const start = new Date(abs.startDate);
  const end = new Date(abs.endDate);
  return (start <= endDate && end >= startDate);
});

console.log(JSON.stringify(activeAbsences, null, 2));
