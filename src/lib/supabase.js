import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getJwtRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch {
    return null;
  }
}

const configuredKeyRole = supabaseAnonKey ? getJwtRole(supabaseAnonKey) : null;

export const supabaseConfigError = !supabaseUrl || !supabaseAnonKey
  ? 'Supabase environment variables are not configured yet.'
  : configuredKeyRole && configuredKeyRole !== 'anon'
    ? `VITE_SUPABASE_ANON_KEY must use the Supabase anon public key. Current key role: ${configuredKeyRole}.`
    : '';

export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
