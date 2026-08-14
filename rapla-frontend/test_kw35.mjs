import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aogwygeeapwsjgvppnpz.supabase.co',
  'sb_publishable_zy3vmo9BttNohbAjzHprSQ_v2oRliyR'
);

async function check() {
  const { data, error } = await supabase.from('app_state').select('*').eq('key', 'rapla_week_plans');
  if (error) { console.error("Error:", error); return; }
  
  let plans = typeof data[0].value === 'string' ? JSON.parse(data[0].value) : data[0].value;
  
  const weekPlan = plans.find(p => p.targetWeekCode === '2026-W35');
  
  if (weekPlan) {
    const dayCourses = weekPlan.courses.filter(c => c.dayOfWeek === 0);
    
    // Sort by start time
    dayCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    console.log(`\nKurse am Sonntag, 23.08.2026 (abgespeichert unter 2026-W35):\n`);
    dayCourses.forEach(c => {
      console.log(`${c.startTime} - ${c.endTime} | ${c.name} | Raum: ${c.roomId || 'Unbekannt'} | Lehrer: ${c.teacherId || 'Niemand'}`);
    });
    
  } else {
    console.log(`Plan for W35 not found in Supabase.`);
  }
}

check();
