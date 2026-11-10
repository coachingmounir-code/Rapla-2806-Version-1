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

const SUPABASE_FETCH_TIMEOUT_MS = 10000;

async function fetchAttemptWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = init?.signal;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(init?.headers || {});
    return await fetch(input, {
      ...init,
      cache: 'no-store',
      headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

// Resilient fetch wrapper: prevents half-open HTTP/2 or QUIC sockets from hanging after a Wi-Fi switch
const resilientNoStoreFetch: typeof fetch = async (input, init) => {
  try {
    return await fetchAttemptWithTimeout(input, init, SUPABASE_FETCH_TIMEOUT_MS);
  } catch (firstErr) {
    // Do not retry if explicitly aborted by caller
    if (init?.signal?.aborted) {
      throw firstErr;
    }
    // Retry once on a fresh connection (essential right after switching Wi-Fi networks)
    await new Promise((resolve) => setTimeout(resolve, 350));
    return await fetchAttemptWithTimeout(input, init, SUPABASE_FETCH_TIMEOUT_MS);
  }
};

// Only initialize Supabase if keys are provided and look somewhat valid
export const supabase = supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: resilientNoStoreFetch
      }
    })
  : null;
