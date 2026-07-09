// hooks/useSupabase.ts
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/config';

export function useSupabase() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(isSupabaseConfigured());
  }, []);

  return {
    supabase,
    isReady,
    isConfigured: isSupabaseConfigured(),
  };
}