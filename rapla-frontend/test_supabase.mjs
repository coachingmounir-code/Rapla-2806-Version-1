import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aogwygeeapwsjgvppnpz.supabase.co',
  'sb_publishable_zy3vmo9BttNohbAjzHprSQ_v2oRliyR'
);

async function check() {
  const { data, error } = await supabase.from('app_state').select('*').eq('key', 'rapla_week_plans');
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log("No data found in Supabase.");
    return;
  }
  
  let plans = data[0].value;
  if (typeof plans === 'string') {
    plans = JSON.parse(plans);
  }
  
  const kw35 = plans.find(p => p.targetWeekCode === '2026-W35' || p.name.includes('KW35') || p.name.includes('KW 35'));
  
  if (kw35) {
    console.log("KW 35 found!");
    console.log("isManualOnly:", kw35.isManualOnly);
    console.log("Number of courses:", kw35.courses.length);
    console.log("Courses preview:", kw35.courses.map(c => c.name + " (" + (c.teacherId || 'Unassigned') + ")").join(', '));
  } else {
    console.log("KW 35 not found.");
    console.log("Available weeks:", plans.map(p => p.targetWeekCode).join(', '));
  }
}

check();
