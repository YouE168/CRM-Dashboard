// lib/supabase/config.ts
import { createClient } from '@supabase/supabase-js';

// Use type assertion to avoid TypeScript errors
const supabaseUrl = (process as any).env?.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = (process as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// For admin operations (server-side only)
export const getServiceClient = () => {
  const serviceKey = (process as any).env?.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl || 'https://placeholder.supabase.co', serviceKey);
};

// Export the config for debugging
export const supabaseConfig = {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? 'Set' : 'Not set',
  key: supabaseAnonKey ? 'Set' : 'Not set',
};