// components/auth/route-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  requirePermission,
}: RouteGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const savedProfile = localStorage.getItem(`profile_${currentUser}`);
      if (!savedProfile) {
        router.push("/login");
        return;
      }

      const profile = JSON.parse(savedProfile);
      const role = profile.primaryRole || profile.userType || USER_ROLES.STAFF;

      // Check if role is allowed
      if (allowedRoles && !allowedRoles.includes(role)) {
        // Show error message before redirect
        const message = `You do not have permission to access this page. This page is for: ${allowedRoles.join(", ")}`;
        localStorage.setItem("route_error", message);
        router.push(redirectTo);
        return;
      }

      // Check route-specific permissions
      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!canAccessRoute(role, currentPath)) {
          const message = `You do not have permission to access this page.`;
          localStorage.setItem("route_error", message);
          router.push(redirectTo);
          return;
        }
      }

      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
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
