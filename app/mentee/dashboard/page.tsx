// app/mentee/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MenteeDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to entrepreneur dashboard with mentee view
    router.push("/?view=entrepreneur");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}
