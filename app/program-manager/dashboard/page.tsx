"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ToastNotification } from "@/components/ui/toast-notification";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import { ParticipantsTab } from "@/components/dashboard/participants-tab";
import { MentorsTab } from "@/components/dashboard/mentors-tab";
import { SlidePanel } from "@/components/slide-panel";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { notificationService } from "@/lib/notification-service";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";

type PanelType =
  | "notifications"
  | "settings"
  | "profile"
  | "edit-profile"
  | "change-password"
  | null;

interface ProfileData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface SettingsData {
  emailNotifications: boolean;
  mentorAlerts: boolean;
  participantAlerts: boolean;
  reportAlerts: boolean;
  darkMode: boolean;
  dashboardLayout: string;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  visible: boolean;
  duration?: number;
}

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

  const tabs = ["Overview", "Analytics", "Participants", "Mentors"];
  const [activeTab, setActiveTab] = useState("Overview");

  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [panel, setPanel] = useState<PanelType>(null);
  const [selectedDateRange, setSelectedDateRange] = useState("Last 12 months");
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    role: "Program Manager",
  });

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

  // Real auth + role check - replaces the old localStorage("currentUser")
  // check, which never matched anything since real login doesn't set that
  // key. Only admin/staff/program_manager may land here; everyone else
  // gets bounced to their real home ("/").
  useEffect(() => {
    let cancelled = false;

    const loadAuthAndProfile = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, name, email, primary_role, status")
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

      if (
        userRow.primary_role !== "program_manager" &&
        userRow.primary_role !== "admin" &&
        userRow.primary_role !== "staff"
      ) {
        router.push("/");
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("avatar")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      const loadedProfile: ProfileData = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role:
          userRow.primary_role === "program_manager"
            ? "Program Manager"
            : userRow.primary_role === "admin"
              ? "Admin"
              : "Staff",
        avatar: profileRow?.avatar ?? undefined,
      };

      setProfile(loadedProfile);
      setEditForm(loadedProfile);
      setIsAuthenticated(true);
    };

    loadAuthAndProfile();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Real notifications, same notifications table + service the admin
  // dashboard uses (backed by public.notifications, RLS-scoped to the
  // signed-in user). Replaces the hardcoded sample feed that used to live
  // here.
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount());
    });
    setUnreadCount(notificationService.getUnreadCount());
    return () => unsubscribe();
  }, []);

  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    mentorAlerts: true,
    participantAlerts: true,
    reportAlerts: true,
    darkMode: false,
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

  const saveProfile = async () => {
    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      showToast("Name can't be empty.", "error");
      return;
    }
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        showToast("You're not signed in. Please log in again.", "error");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({ name: trimmedName })
        .eq("id", authData.user.id);
      if (error) throw error;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: trimmedName })
        .eq("user_id", authData.user.id);
      if (profileError) {
        console.warn("Failed to sync profiles table:", profileError);
      }

      const updated = { ...profile, name: trimmedName };
      setProfile(updated);
      setEditForm(updated);
      setEditSaved(true);
      showToast("Profile updated successfully!", "success");
      setTimeout(() => {
        setEditSaved(false);
        setPanel("profile");
      }, 1200);
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("Failed to save profile. Please try again.", "error");
    }
  };

  const savePassword = async () => {
    setPasswordError("");
    if (!passwords.current)
      return setPasswordError("Enter your current password.");
    if (passwords.newPass.length < 8)
      return setPasswordError("New password must be at least 8 characters.");
    if (passwords.newPass !== passwords.confirm)
      return setPasswordError("Passwords do not match.");

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwords.current,
      });
      if (reauthError) {
        setPasswordError("Current password is incorrect.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwords.newPass,
      });
      if (error) {
        setPasswordError(error.message || "Failed to update password.");
        return;
      }

      setPasswordSaved(true);
      showToast("Password updated successfully!", "success");
      setPasswords({ current: "", newPass: "", confirm: "" });
      setTimeout(() => {
        setPasswordSaved(false);
        setPanel("profile");
      }, 1200);
    } catch (err) {
      console.error("Failed to update password:", err);
      setPasswordError("Something went wrong. Please try again.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
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
                <p className="text-xs text-gray-500">Program Manager</p>
              </div>
            </div>

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
        <NotificationPanel />
      </SlidePanel>

      {/* Settings Panel */}
      <SlidePanel
        open={panel === "settings"}
        onClose={() => setPanel(null)}
        title="Settings"
        icon={Settings}
      >
        <div className="space-y-6">
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
                    Spacious
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => setPanel("change-password")}
              className="w-full text-left px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Change Password →
            </button>
          </div>

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
                    reader.onload = async (event) => {
                      const avatarUrl = event.target?.result as string;
                      const updatedProfile = { ...profile, avatar: avatarUrl };
                      setProfile(updatedProfile);
                      const { data: authData } = await supabase.auth.getUser();
                      if (authData.user) {
                        const { error } = await supabase
                          .from("profiles")
                          .upsert(
                            { user_id: authData.user.id, avatar: avatarUrl },
                            { onConflict: "user_id" },
                          );
                        if (error) {
                          console.error("Failed to save avatar:", error);
                          showToast("Failed to save profile picture.", "error");
                          return;
                        }
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
              disabled
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              This is your login email and can't be changed here.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Role
            </label>
            <input
              type="text"
              value={editForm.role}
              disabled
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Contact an admin to change your role.
            </p>
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

      {/* Main Content - Only 4 tabs, real data via dashboard-data.ts */}
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
