import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey && 
         supabaseUrl !== '' && supabaseAnonKey !== '' &&
         supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined';
};

// Check if running on client side
export const isClient = typeof window !== 'undefined';

// Create the Supabase client with proper types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);