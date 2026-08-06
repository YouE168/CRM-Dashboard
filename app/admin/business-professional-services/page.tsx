// app/admin/business-professional-services/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { BusinessProfessionalServicesTab } from "@/components/dashboard/business-professional-services-tab";

export default function BusinessProfessionalServicesPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      // Admin/staff only - this page shows case notes across every
      // member, so it needs the same gate as the "Business Professional
      // Services" launch link on the main dashboard (which is itself only
      // shown to isAdmin || isStaff). Without this check, anyone who knew
      // the URL could load the page, even though the actual note data
      // underneath is already protected separately by case_notes' RLS
      // policies (admin/staff-only reads and writes).
      const { data: userRow } = await supabase
        .from("users")
        .select("primary_role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (userRow?.primary_role !== "admin" && userRow?.primary_role !== "staff") {
        router.push("/admin/dashboard");
        return;
      }

      setCheckingAuth(false);
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-sm text-emerald-600 hover:text-emerald-700 mb-6 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <BusinessProfessionalServicesTab />
      </div>
    </div>
  );
}
