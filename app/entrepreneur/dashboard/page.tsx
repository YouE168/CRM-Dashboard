// app/entrepreneur/dashboard/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This used to be a separate, fully mock entrepreneur dashboard (localStorage
// "currentUser" auth, hardcoded "Billi Hawk" mentor, DEFAULT_PROGRAMS
// fallback, its own ProgramDetailsModal). Nothing in the live app ever
// linked here - login and signup both send users to "/" - and because it
// depended on localStorage("currentUser"), which nothing sets anymore,
// visiting it directly just bounced back to /login anyway. The real,
// Supabase-connected entrepreneur experience (programs, tracking, resources,
// mentor rating) lives in app/page.tsx, shared with the mentee dashboard.
// This now just redirects there so no stale/mock version can ever render.
export default function EntrepreneurDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?view=entrepreneur");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}
