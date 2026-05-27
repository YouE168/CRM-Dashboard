// This file will be updated when Jody provides Supabase credentials
// For now, we're using localStorage for development

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};

// Flag to know if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseConfig.url && !!supabaseConfig.anonKey;
};