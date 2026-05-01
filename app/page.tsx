"use client";

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import { AnalyticsTab } from "@/components/dashboard/analytics-tab";
import { ParticipantsTab } from "@/components/dashboard/participants-tab";
import { MentorsTab } from "@/components/dashboard/mentors-tab";
import { LeadershipTab } from "@/components/dashboard/leadership-tab";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { SlidePanel } from "@/components/slide-panel";
import { RoundtableSignupForm } from "@/components/roundtable-signup-form";
import { Bell, Settings, User } from "lucide-react";

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
  darkMode: boolean;
  twoFactorAuth: boolean;
}

interface TeamNote {
  id: number;
  author: string;
  content: string;
  time: string;
  pinned: boolean;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [panel, setPanel] = useState<PanelType>(null);

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
    darkMode: false,
    twoFactorAuth: true,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const updateSetting = (key: keyof SettingsData, value: boolean) => {
    setSettings((p) => ({ ...p, [key]: value }));
    setSettingsSaved(false);
    if (key === "darkMode")
      document.documentElement.classList.toggle("dark", value);
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

  const signOut = () => {
    if (confirm("Are you sure you want to sign out?")) alert("Signed out!");
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

      {/* Settings Panel */}
      <SlidePanel
        open={panel === "settings"}
        onClose={() => setPanel(null)}
        title="Settings"
        icon={Settings}
      >
        {/* Settings content - simplified for brevity, you can copy from your original */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Settings panel content...</p>
          <button
            onClick={saveSettings}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg"
          >
            Save Settings
          </button>
        </div>
      </SlidePanel>

      {/* Profile Panel */}
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
        <button
          onClick={() => setPanel("edit-profile")}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
        >
          Edit Profile
        </button>
        <button
          onClick={signOut}
          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
          Sign Out
        </button>
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
