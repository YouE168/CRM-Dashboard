// app/request-access/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Duplicate of the real request form at /admin/request-access (the one
// actually linked from the login page). Kept as a redirect so an old
// bookmark or link doesn't land on a stale, localStorage-only copy.
export default function RequestAccessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/request-access");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}
