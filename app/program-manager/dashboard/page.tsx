"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastNotification } from "@/components/ui/toast-notification";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import { ParticipantsTab } from "@/components/dashboard/participants-tab";
import { MentorsTab } from "@/components/dashboard/mentors-tab";
import { SlidePanel } from "@/components/slide-panel";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Eye,
  EyeOff,
  ChevronLeft,
  X,
  Camera,
  Shield,
  LayoutGrid,
} from "lucide-react";

type PanelType =
  | "notifications"
  | "settings"
  | "profile"
  | "edit-profile"
  | "change-password"
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
  avatar?: string;
  userType?: string;
  primaryRole?: string;
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

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  visible: boolean;
  duration?: number;
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

export default function ProgramManagerDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  // ✅ Only 4 tabs - NO Program Management
  const tabs = ["Overview", "Analytics", "Participants", "Mentors"];
  const [activeTab, setActiveTab] = useState("Overview");

  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [panel, setPanel] = useState<PanelType>(null);
  const [selectedDateRange, setSelectedDateRange] = useState("Last 12 months");
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    role: "",
  });

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
    duration?: number,
  ) => {
    setToast({ message, type, visible: true, duration });
  };

  const hideToast = () => {
    setToast({ message: "", type: "info", visible: false });
  };

  // CHECK AUTHENTICATION & GET USER ROLE
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
      return;
    }

    // Load user profile to get role
    const savedProfile = localStorage.getItem(`profile_${user}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);

      // Check if user has program manager role
      const role = parsed.userType || parsed.primaryRole || "staff";
      if (role !== "program_manager" && role !== "admin" && role !== "staff") {
        router.push("/");
        return;
      }
      setUserRole(role);
    } else {
      // Default to staff
      setUserRole("staff");
    }

    setIsAuthenticated(true);
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
  const [editForm, setEditForm] = useState<ProfileData>(profile);
  const [editSaved, setEditSaved] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const updateSetting = (key: keyof SettingsData, value: boolean | string) => {
    setSettings((p) => ({ ...p, [key]: value }));
    setSettingsSaved(false);
    if (key === "darkMode" && typeof value === "boolean") {
      if (value) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const saveSettings = () => {
    setSettingsSaved(true);
    showToast("Settings saved successfully!", "success");
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const saveProfile = () => {
    setProfile(editForm);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      localStorage.setItem(`profile_${currentUser}`, JSON.stringify(editForm));
    }
    setEditSaved(true);
    showToast("Profile updated successfully!", "success");
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
    showToast("Password updated successfully!", "success");
    setPasswords({ current: "", newPass: "", confirm: "" });
    setTimeout(() => {
      setPasswordSaved(false);
      setPanel("profile");
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  // LOAD USER PROFILE FROM LOCALSTORAGE
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser}`);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setEditForm(parsedProfile);
      } else {
        const userName = currentUser.split("@")[0];
        const displayName =
          userName.charAt(0).toUpperCase() + userName.slice(1);
        const newProfile = {
          name: displayName,
          email: currentUser,
          role: "Program Manager",
        };
        setProfile(newProfile);
        setEditForm(newProfile);
      }
    }
  }, []);

  // Apply saved settings on load
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    if (settings.dashboardLayout === "compact") {
      document.body.style.zoom = "0.9";
    } else if (settings.dashboardLayout === "spacious") {
      document.body.style.zoom = "1.1";
    } else {
      document.body.style.zoom = "1";
    }
  }, []);

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
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg overflow-hidden shadow-md">
                <img
                  src="/logo.png"
                  alt="Rural Community Partners"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "h-full w-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg";
                      fallback.textContent = "RCP";
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Rural Community Partners
                </h1>
              </div>
            </div>

            {/* Navigation Tabs - Only 4 tabs */}
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

            {/* Icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPanel("notifications")}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPanel("settings")}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={() => setPanel("profile")}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast.visible && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}

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
                  <option value="Program Manager">Program Manager</option>
                  <option value="Senior Program Manager">
                    Senior Program Manager
                  </option>
                  <option value="Program Coordinator">
                    Program Coordinator
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-t pt-4">
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

          {/* Appearance Settings */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Appearance
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">Dark mode</p>
                  <p className="text-xs text-gray-400">Switch to dark theme</p>
                </div>
                <Toggle
                  value={settings.darkMode}
                  onChange={(v) => updateSetting("darkMode", v)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Dashboard Layout
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      updateSetting("dashboardLayout", "compact");
                      document.body.style.zoom = "0.9";
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      settings.dashboardLayout === "compact"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg mr-1">▦</span>Compact
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
                    <span className="text-lg mr-1">▣</span>Comfortable
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
                    <span className="text-lg mr-1">◧</span>Spacious
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
          <div className="border-t pt-4">
            <div className="space-y-3">
              <button
                onClick={() => setPanel("change-password")}
                className="w-full text-left px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Change Password →
              </button>
            </div>
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

      {/* Profile Panel */}
      <SlidePanel
        open={panel === "profile"}
        onClose={() => setPanel(null)}
        title="Profile"
        icon={User}
      >
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>
            <button
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const avatarUrl = event.target?.result as string;
                      const updatedProfile = { ...profile, avatar: avatarUrl };
                      setProfile(updatedProfile);
                      const currentUser = localStorage.getItem("currentUser");
                      if (currentUser) {
                        localStorage.setItem(
                          `profile_${currentUser}`,
                          JSON.stringify(updatedProfile),
                        );
                      }
                      showToast("Profile picture updated!", "success");
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md hover:bg-gray-50 transition-colors"
              title="Change profile picture"
            >
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
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
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {editForm.avatar ? (
                <img
                  src={editForm.avatar}
                  alt={editForm.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                editForm.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

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
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Profile Picture
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const avatarUrl = event.target?.result as string;
                        setEditForm({ ...editForm, avatar: avatarUrl });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="flex-1 px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Upload Picture
              </button>
              {editForm.avatar && (
                <button
                  onClick={() =>
                    setEditForm({ ...editForm, avatar: undefined })
                  }
                  className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
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

      {/* Main Content - Only 4 tabs */}
      <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {activeTab === "Overview" && <OverviewTab />}
        {activeTab === "Analytics" && (
          <AnalyticsTab
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedCounty={selectedCounty}
            setSelectedCounty={setSelectedCounty}
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
          />
        )}
        {activeTab === "Participants" && <ParticipantsTab />}
        {activeTab === "Mentors" && <MentorsTab />}
      </main>
    </div>
  );
}
