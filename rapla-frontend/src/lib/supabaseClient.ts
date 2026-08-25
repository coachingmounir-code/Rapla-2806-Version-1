import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://aogwygeeapwsjgvppnpz.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_zy3vmo9BttNohbAjzHprSQ_v2oRliyR';

// Only initialize Supabase if keys are provided and look somewhat valid
export const supabase = supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')
  ? createClient(supabaseUrl, supabaseKey)
  : null;

