"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import { AnalyticsTab } from "@/components/dashboard/analytics-tab";
import { ParticipantsTab } from "@/components/dashboard/participants-tab";
import { MentorsTab } from "@/components/dashboard/mentors-tab";
import { LeadershipTab } from "@/components/dashboard/leadership-tab";
import { ResourcesTab } from "@/components/dashboard/resources-tab";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { SlidePanel } from "@/components/slide-panel";
import { RoundtableSignupForm } from "@/components/roundtable-signup-form";
import {
  Bell,
  Settings,
  User,
  Check,
  Eye,
  EyeOff,
  ChevronLeft,
  X,
  LogOut,
} from "lucide-react";

type PanelType =
  | "notifications"
  | "settings"
  | "profile"
  | "edit-profile"
  | "change-password"
  | "leadership-signup"
  | null;

interface Notification {
  id: number;
  msg: string;
  time: string;
  read: boolean;
}

interface ProfileData {
  name: string;
  email: string;
  role: string;
}

interface SettingsData {
  emailNotifications: boolean;
  mentorAlerts: boolean;
  participantAlerts: boolean;
  reportAlerts: boolean;
  darkMode: boolean;
  twoFactorAuth: boolean;
  dashboardLayout: string;
}

interface TeamNote {
  id: number;
  author: string;
  content: string;
  time: string;
  pinned: boolean;
}

// Toggle component
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-200 ${
        value ? "bg-emerald-500" : "bg-gray-200"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// Password Input component
function PasswordInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-9"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [panel, setPanel] = useState<PanelType>(null);

  // CHECK AUTHENTICATION - THIS IS THE KEY PART YOU WERE MISSING!
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      msg: "James Williams completed onboarding",
      time: "2h ago",
      read: false,
    },
    {
      id: 2,
      msg: "3 surveys overdue for follow-up",
      time: "5h ago",
      read: false,
    },
    {
      id: 3,
      msg: "Invoice #INV-042 awaiting approval",
      time: "1d ago",
      read: false,
    },
    {
      id: 4,
      msg: "New mentor match: Susan White → Michael Martinez",
      time: "2d ago",
      read: false,
    },
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);

  // Settings
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    mentorAlerts: true,
    participantAlerts: true,
    reportAlerts: true,
    darkMode: false,
    twoFactorAuth: true,
    dashboardLayout: "comfortable",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const updateSetting = (key: keyof SettingsData, value: boolean | string) => {
    setSettings((p) => ({ ...p, [key]: value }));
    setSettingsSaved(false);
    if (key === "darkMode" && typeof value === "boolean") {
      document.documentElement.classList.toggle("dark", value);
    }
  };

  const saveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Profile
  const [profile, setProfile] = useState<ProfileData>({
    name: "Admin User",
    email: "admin@ruralcommunity.org",
    role: "Administrator",
  });
  const [editForm, setEditForm] = useState<ProfileData>(profile);
  const [editSaved, setEditSaved] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const saveProfile = () => {
    setProfile(editForm);
    setEditSaved(true);
    setTimeout(() => {
      setEditSaved(false);
      setPanel("profile");
    }, 1200);
  };

  const savePassword = () => {
    setPasswordError("");
    if (!passwords.current)
      return setPasswordError("Enter your current password.");
    if (passwords.newPass.length < 8)
      return setPasswordError("New password must be at least 8 characters.");
    if (passwords.newPass !== passwords.confirm)
      return setPasswordError("Passwords do not match.");
    setPasswordSaved(true);
    setPasswords({ current: "", newPass: "", confirm: "" });
    setTimeout(() => {
      setPasswordSaved(false);
      setPanel("profile");
    }, 1200);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      localStorage.removeItem("currentUser");
      router.push("/login");
    }
  };

  // Team Notes
  const [notes, setNotes] = useState<TeamNote[]>([
    {
      id: 1,
      author: "Admin User",
      content:
        "Monthly reports are due by the 5th. Please ensure all mentor hours are logged before submission.",
      time: "Today 9:14 AM",
      pinned: true,
    },
    {
      id: 2,
      author: "Lisa Thompson",
      content:
        "James Williams completed onboarding — ready to be matched with a mentor.",
      time: "Today 8:30 AM",
      pinned: false,
    },
    {
      id: 3,
      author: "Michael Chen",
      content:
        "Reminder: Q1 outcome metrics review call is scheduled for Friday at 2pm.",
      time: "Yesterday",
      pinned: false,
    },
  ]);

  const addNote = (content: string) => {
    setNotes((p) => [
      {
        id: Date.now(),
        author: profile.name,
        content,
        time: "Just now",
        pinned: false,
      },
      ...p,
    ]);
  };
  const deleteNote = (id: number) =>
    setNotes((p) => p.filter((n) => n.id !== id));
  const togglePin = (id: number) =>
    setNotes((p) =>
      p.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={unreadCount}
        onNotifications={() => setPanel("notifications")}
        onSettings={() => setPanel("settings")}
        onProfile={() => setPanel("profile")}
      />

      {/* Notifications Panel */}
      <SlidePanel
        open={panel === "notifications"}
        onClose={() => setPanel(null)}
        title="Notifications"
        icon={Bell}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400">{unreadCount} unread</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-600 hover:underline"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            No notifications
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border ${n.read ? "bg-white border-gray-100 opacity-60" : "bg-emerald-50 border-emerald-100"}`}
              >
                <p className="text-sm text-gray-700">{n.msg}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
            ))}
          </div>
        )}
      </SlidePanel>

      {/* Settings Panel*/}
      <SlidePanel
        open={panel === "settings"}
        onClose={() => setPanel(null)}
        title="Settings"
        icon={Settings}
      >
        <div className="space-y-6">
          {/* Profile Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Profile Settings
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Role
                </label>
                <select
                  value={profile.role}
                  onChange={(e) =>
                    setProfile({ ...profile, role: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Program Manager">Program Manager</option>
                  <option value="Mentor Coordinator">Mentor Coordinator</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Notification Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Notifications
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "emailNotifications",
                  label: "Email notifications",
                  desc: "Receive email alerts for key events",
                },
                {
                  key: "mentorAlerts",
                  label: "Mentor activity alerts",
                  desc: "Get notified when mentors log hours or update status",
                },
                {
                  key: "participantAlerts",
                  label: "Participant milestone alerts",
                  desc: "Get notified when participants complete stages",
                },
                {
                  key: "reportAlerts",
                  label: "Monthly report reminders",
                  desc: "Reminders when reports are due",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <Toggle
                    value={settings[item.key as keyof SettingsData] as boolean}
                    onChange={(v) =>
                      updateSetting(item.key as keyof SettingsData, v)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Appearance Settings*/}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Appearance
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">Dark mode</p>
                  <p className="text-xs text-gray-400">Switch to dark theme</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newDarkMode = !settings.darkMode;
                    updateSetting("darkMode", newDarkMode);
                    if (newDarkMode) {
                      document.documentElement.classList.add("dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                    }
                  }}
                  className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors duration-200 ${
                    settings.darkMode ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      settings.darkMode ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Dashboard Layout
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      updateSetting("dashboardLayout", "compact");
                      // Apply layout change (you can add CSS classes or zoom levels)
                      document.body.style.zoom = "0.9";
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      settings.dashboardLayout === "compact"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg mr-1">▦</span>
                    Compact
                  </button>
                  <button
                    onClick={() => {
                      updateSetting("dashboardLayout", "comfortable");
                      document.body.style.zoom = "1";
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      settings.dashboardLayout === "comfortable"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg mr-1">▣</span>
                    Comfortable
                  </button>
                  <button
                    onClick={() => {
                      updateSetting("dashboardLayout", "spacious");
                      document.body.style.zoom = "1.1";
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      settings.dashboardLayout === "spacious"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg mr-1">◧</span>
                    Spacious
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Current layout:{" "}
                  <span className="font-medium">
                    {settings.dashboardLayout}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Two-factor authentication
                  </p>
                  <p className="text-xs text-gray-400">
                    Extra security for your account
                  </p>
                </div>
                <Toggle
                  value={settings.twoFactorAuth}
                  onChange={(v) => updateSetting("twoFactorAuth", v)}
                />
              </div>
              <button
                onClick={() => setPanel("change-password")}
                className="w-full text-left px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Change Password →
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Data & Export */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Data & Export
            </h3>
            <div className="space-y-2">
              <button
                onClick={() =>
                  alert(
                    "Exporting all data as CSV...\n\nThis feature will be available soon.",
                  )
                }
                className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span>Export all data (CSV)</span>
                <span className="text-xs text-gray-400">↓</span>
              </button>
              <button
                onClick={() =>
                  alert(
                    "Export participant data...\n\nThis feature will be available soon.",
                  )
                }
                className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <span>Export participant list</span>
                <span className="text-xs text-gray-400">↓</span>
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure? This will reset all settings to default.",
                    )
                  ) {
                    setSettings({
                      emailNotifications: true,
                      mentorAlerts: true,
                      participantAlerts: true,
                      reportAlerts: true,
                      darkMode: false,
                      twoFactorAuth: true,
                      dashboardLayout: "comfortable",
                    });
                    alert("Settings reset to default!");
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Reset all settings to default
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Danger Zone */}
          <div>
            <h3 className="text-sm font-semibold text-red-600 mb-3">
              Danger Zone
            </h3>
            <button
              onClick={() => {
                if (
                  confirm(
                    "WARNING: This will clear all mock data. This action cannot be undone. Are you absolutely sure?",
                  )
                ) {
                  alert("Data cleared. Refresh to see changes.");
                }
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear all mock data (testing only)
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              onClick={saveSettings}
              className="w-full py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Save All Settings
            </button>
            {settingsSaved && (
              <p className="text-xs text-emerald-600 text-center mt-2">
                ✓ Settings saved successfully!
              </p>
            )}
          </div>
        </div>
      </SlidePanel>

      {/* Profile Panel with Logout */}
      <SlidePanel
        open={panel === "profile"}
        onClose={() => setPanel(null)}
        title="Profile"
        icon={User}
      >
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
            {profile.name.charAt(0)}
          </div>
          <p className="font-semibold text-gray-800">{profile.name}</p>
          <p className="text-xs text-gray-400">{profile.role}</p>
          <p className="text-sm text-gray-400">{profile.email}</p>
        </div>
        <div className="space-y-1 mt-2">
          <button
            onClick={() => {
              setEditForm(profile);
              setPanel("edit-profile");
            }}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              setPasswords({ current: "", newPass: "", confirm: "" });
              setPasswordError("");
              setPanel("change-password");
            }}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Change Password
          </button>
          <div className="border-t border-gray-100 my-2"></div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </SlidePanel>

      {/* Edit Profile Panel */}
      <SlidePanel
        open={panel === "edit-profile"}
        onClose={() => setPanel(null)}
        title="Edit Profile"
        icon={User}
        onBack={() => setPanel("profile")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Role
            </label>
            <input
              type="text"
              value={editForm.role}
              onChange={(e) =>
                setEditForm({ ...editForm, role: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button
            onClick={saveProfile}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors mt-2 ${editSaved ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
          >
            {editSaved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      </SlidePanel>

      {/* Change Password Panel */}
      <SlidePanel
        open={panel === "change-password"}
        onClose={() => setPanel(null)}
        title="Change Password"
        icon={User}
        onBack={() => setPanel("profile")}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Current Password
            </label>
            <PasswordInput
              placeholder="Enter current password"
              value={passwords.current}
              onChange={(v) => setPasswords({ ...passwords, current: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              New Password
            </label>
            <PasswordInput
              placeholder="Min. 8 characters"
              value={passwords.newPass}
              onChange={(v) => setPasswords({ ...passwords, newPass: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Confirm New Password
            </label>
            <PasswordInput
              placeholder="Repeat new password"
              value={passwords.confirm}
              onChange={(v) => setPasswords({ ...passwords, confirm: v })}
            />
          </div>
          {passwordError && (
            <p className="text-xs text-red-500">{passwordError}</p>
          )}
          <button
            onClick={savePassword}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors mt-2 ${passwordSaved ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
          >
            {passwordSaved ? "✓ Password Updated!" : "Update Password"}
          </button>
        </div>
      </SlidePanel>

      {/* Leadership Signup Panel */}
      <SlidePanel
        open={panel === "leadership-signup"}
        onClose={() => setPanel(null)}
        title="Apply to Leadership Roundtable"
        icon={User}
      >
        <RoundtableSignupForm
          profileName={profile.name}
          profileEmail={profile.email}
        />
      </SlidePanel>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {activeTab === "Overview" && <OverviewTab />}
        {activeTab === "Analytics" && (
          <AnalyticsTab
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedCounty={selectedCounty}
            setSelectedCounty={setSelectedCounty}
          />
        )}
        {activeTab === "Participants" && <ParticipantsTab />}
        {activeTab === "Mentors" && <MentorsTab />}
        {activeTab === "Leadership Roundtable" && (
          <LeadershipTab
            profileName={profile.name}
            profileEmail={profile.email}
            onOpenSignup={() => setPanel("leadership-signup")}
            isSignupOpen={panel === "leadership-signup"}
            onCloseSignup={() => setPanel(null)}
          />
        )}
        {activeTab === "Resources" && <ResourcesTab />}
        {activeTab === "Reports" && (
          <ReportsTab
            profileName={profile.name}
            notes={notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onTogglePin={togglePin}
          />
        )}
      </main>
    </div>
  );
}
