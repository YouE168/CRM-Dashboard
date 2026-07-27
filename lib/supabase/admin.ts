// lib/supabase/admin.ts
//
// SERVER-ONLY. Never import this from a "use client" component or any
// browser-executed code — the service role key bypasses Row Level
// Security entirely. Only import this from API routes (app/api/**).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});