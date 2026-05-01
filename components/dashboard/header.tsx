"use client";

import { Bell, Settings, User } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  onNotifications?: () => void;
  onSettings?: () => void;
  onProfile?: () => void;
}

const navTabs = [
  "Overview",
  "Analytics",
  "Participants",
  "Mentors",
  "Leadership Roundtable",
  "Reports",
];

export function Header({
  activeTab,
  setActiveTab,
  unreadCount = 0,
  onNotifications,
  onSettings,
  onProfile,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center min-w-[120px]">
          <span className="text-sm font-bold text-gray-900">
            Rural <span className="text-emerald-600">Community</span>
          </span>
        </div>

        {/* Nav tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeTab === tab
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Icon buttons — plain <button> tags, no shadcn dependency */}
        <div className="flex items-center gap-1 min-w-[120px] justify-end">
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={onNotifications}
              className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          <button
            type="button"
            aria-label="Settings"
            onClick={onSettings}
            className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Profile"
            onClick={onProfile}
            className="flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
