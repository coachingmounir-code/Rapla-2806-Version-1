import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize Supabase if keys are provided and look somewhat valid
export const supabase = supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')
  ? createClient(supabaseUrl, supabaseKey)
  : null;
