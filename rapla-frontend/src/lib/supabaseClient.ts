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

const noStoreFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  if (!headers.has('Pragma')) {
    headers.set('Pragma', 'no-cache');
  }
  return fetch(input, {
    ...init,
    cache: 'no-store',
    headers
  });
};

// Only initialize Supabase if keys are provided and look somewhat valid
export const supabase = supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')
  ? createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: noStoreFetch
      }
    })
  : null;


