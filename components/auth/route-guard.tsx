// components/auth/route-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { USER_ROLES, UserRole, canAccessRoute } from "@/lib/roles";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requirePermission?: string;
}

export function RouteGuard({
  children,
  allowedRoles,
  redirectTo = "/",
}: RouteGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("primary_role, status")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (userError || !userRow) {
        router.push("/login");
        return;
      }

      if (userRow.status && userRow.status !== "active") {
        router.push("/login");
        return;
      }

      const role = (userRow.primary_role as UserRole) || USER_ROLES.STAFF;

      // Check if role is allowed
      if (allowedRoles && !allowedRoles.includes(role)) {
        const message = `You do not have permission to access this page. This page is for: ${allowedRoles.join(", ")}`;
        sessionStorage.setItem("route_error", message);
        router.push(redirectTo);
        return;
      }

      // Check route-specific permissions
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!canAccessRoute(role, currentPath)) {
          const message = `You do not have permission to access this page.`;
          sessionStorage.setItem("route_error", message);
          router.push(redirectTo);
          return;
        }
      }

      if (!cancelled) {
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };

    checkAuth();

    // Re-check if auth state changes (e.g. sign out in another tab)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.push("/login");
        }
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [router, allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
