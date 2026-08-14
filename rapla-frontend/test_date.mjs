import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aogwygeeapwsjgvppnpz.supabase.co',
  'sb_publishable_zy3vmo9BttNohbAjzHprSQ_v2oRliyR'
);

function getWeekNo(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function check() {
  const targetDate = new Date('2026-08-23');
  const targetDayOfWeek = targetDate.getDay(); // Sunday is 0
  
  // Wait, week code might be W34 or W35 depending on ISO week.
  // Aug 23, 2026 is Sunday. ISO week is W34.
  const weekNum = getWeekNo(targetDate);
  const targetWeekCode = `2026-W${weekNum}`;
  console.log(`Looking for week code: ${targetWeekCode} (Day ${targetDayOfWeek})`);
  
  const { data, error } = await supabase.from('app_state').select('*').eq('key', 'rapla_week_plans');
  if (error) { console.error("Error:", error); return; }
  
  let plans = typeof data[0].value === 'string' ? JSON.parse(data[0].value) : data[0].value;
  
  const weekPlan = plans.find(p => p.targetWeekCode === targetWeekCode);
  
  if (weekPlan) {
    const dayCourses = weekPlan.courses.filter(c => c.dayOfWeek === targetDayOfWeek);
    
    // Sort by start time
    dayCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    console.log(`\nKurse am Sonntag, 23.08.2026 (${targetWeekCode}):\n`);
    dayCourses.forEach(c => {
      console.log(`${c.startTime} - ${c.endTime} | ${c.name} | Raum: ${c.roomId || 'Unbekannt'} | Lehrer: ${c.teacherId || 'Niemand'}`);
    });
    
  } else {
    console.log(`Plan for ${targetWeekCode} not found in Supabase.`);
  }
}

check();
