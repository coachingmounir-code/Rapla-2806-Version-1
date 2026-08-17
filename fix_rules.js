import fs from 'fs';

const path = './rapla-frontend/src/lib/data/wochenplan_rules.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const eligibleOnn = ['nirmaya', 'abha', 'anjali', 'narayani', 'burnie', 'christopher', 'teresa', 'adam', 'harishakti'];

for (const teacherKey in data.teachers) {
  if (eligibleOnn.includes(teacherKey)) {
    data.teachers[teacherKey].canLeadOnn = true;
  } else {
    data.teachers[teacherKey].canLeadOnn = false;
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('wochenplan_rules.json updated successfully with canLeadOnn flags.');
