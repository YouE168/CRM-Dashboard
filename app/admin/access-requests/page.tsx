// app/admin/access-requests/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This used to be a separate, fully mock access-requests review page
// (localStorage("access_requests"), a hardcoded admin@ruralcommunity.org
// check). The real, Supabase-backed review UI - with realtime updates and
// a proper approve flow that emails a real "set your password" invite -
// lives inside the admin dashboard itself. This just redirects there so
// no stale mock version can ever render.
export default function AccessRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard?panel=access-requests");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}
