"use client";

import { useState, useEffect } from "react";
import { Bell, Settings, User, LogOut } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  onNotifications: () => void;
  onSettings: () => void;
  onProfile: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  unreadCount,
  onNotifications,
  onSettings,
  onProfile,
}: HeaderProps) {
  const [pendingSignupsCount, setPendingSignupsCount] = useState(0);

  // Check for pending signups
  useEffect(() => {
    const checkPendingSignups = () => {
      const signups = JSON.parse(
        localStorage.getItem("programSignups") || "[]",
      );
      const pendingCount = signups.filter(
        (s: any) => s.status === "pending_review",
      ).length;
      setPendingSignupsCount(pendingCount);
    };

    checkPendingSignups();

    // Listen for changes
    window.addEventListener("storage", checkPendingSignups);
    return () => window.removeEventListener("storage", checkPendingSignups);
  }, []);

  const tabs = [
    "Overview",
    "Analytics",
    "Participants",
    "Mentors",
    "Leadership Roundtable",
    "Resources",
    "Reports",
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RCP Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Rural Community Partners
              </h1>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Admin Only: Pending Signups Alert */}
            {pendingSignupsCount > 0 && (
              <button
                onClick={() =>
                  (window.location.href = "/admin/pending-signups")
                }
                className="relative p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                title={`${pendingSignupsCount} pending signup${pendingSignupsCount > 1 ? "s" : ""} need review`}
              >
                <span className="text-lg">📋</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {pendingSignupsCount}
                </span>
              </button>
            )}

            <button
              onClick={onNotifications}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={onSettings}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="h-5 w-5" />
            </button>

            <button
              onClick={onProfile}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
