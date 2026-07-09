// components/auth/role-navigation.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Briefcase,
  ChevronRight,
  Home,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";
import { USER_ROLES, UserRole, hasPermission, ROLE_CONFIGS } from "@/lib/roles";

interface NavigationItem {
  label: string;
  href: string;
  icon: any;
  show: boolean;
}

export function RoleNavigation() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [showEntrepreneurHub, setShowEntrepreneurHub] = useState(false);
  const [showMenteeDashboard, setShowMenteeDashboard] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) return;

    const savedProfile = localStorage.getItem(`profile_${currentUser}`);
    if (!savedProfile) return;

    const profile = JSON.parse(savedProfile);
    const userRole =
      profile.primaryRole || profile.userType || USER_ROLES.STAFF;
    setRole(userRole);

    // Determine navigation items based on role
    const items: NavigationItem[] = [];

    // Home is always shown
    items.push({
      label: "Dashboard",
      href: "/",
      icon: Home,
      show: true,
    });

    // Mentee Dashboard - only for mentees
    if (userRole === USER_ROLES.MENTEE) {
      items.push({
        label: "Mentee Dashboard",
        href: "/mentee/dashboard",
        icon: User,
        show: true,
      });
      setShowMenteeDashboard(true);
    }

    // Entrepreneur Hub - for entrepreneurs and mentees
    if (
      userRole === USER_ROLES.ENTREPRENEUR ||
      userRole === USER_ROLES.MENTEE
    ) {
      items.push({
        label: "Entrepreneur Hub",
        href: "/?view=entrepreneur",
        icon: Briefcase,
        show: true,
      });
      setShowEntrepreneurHub(true);
    }

    // Admin features
    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.STAFF) {
      items.push({
        label: "Admin Dashboard",
        href: "/admin/dashboard",
        icon: Shield,
        show: true,
      });
    }

    // Settings for all
    items.push({
      label: "Settings",
      href: "/settings",
      icon: Settings,
      show: true,
    });

    setNavigationItems(items);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden">
              <img
                src="/logo.png"
                alt="RCP"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Rural Community Partners
              </h1>
              {role && (
                <p className="text-xs text-gray-500">
                  {ROLE_CONFIGS[role]?.label || role}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {navigationItems
              .filter((item) => item.show)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Quick Access - Mobile friendly navigation */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 md:hidden">
          {navigationItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-emerald-100 transition-colors whitespace-nowrap"
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
