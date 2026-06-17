"use client";

import { useState, useEffect } from "react";
import { participants } from "@/lib/mock-data";
import { ToastNotification } from "@/components/ui/toast-notification";
import { useRouter } from "next/navigation";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import { ParticipantsTab } from "@/components/dashboard/participants-tab";
import { MentorsTab } from "@/components/dashboard/mentors-tab";
import { LeadershipTab } from "@/components/dashboard/leadership-tab";
import { ResourcesTab } from "@/components/dashboard/resources-tab";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { SlidePanel } from "@/components/slide-panel";
import { RoundtableSignupForm } from "@/components/roundtable-signup-form";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  MessageCircle,
  Send,
  Users,
  UserCheck,
  Building2,
  Award,
} from "lucide-react";
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
  Camera,
  Shield,
} from "lucide-react";

type PanelType =
  | "notifications"
  | "settings"
  | "profile"
  | "edit-profile"
  | "change-password"
  | "leadership-signup"
  | "access-requests"
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

interface TeamNote {
  id: number;
  author: string;
  content: string;
  time: string;
  pinned: boolean;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  visible: boolean;
  duration?: number;
}

interface ConfirmModalState {
  isOpen: boolean;
  type: "danger" | "warning" | "info";
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AccessRequest {
  name: string;
  email: string;
  reason: string;
  requestedRole: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

// Get user role from profile
const getUserRole = (profile: any): string => {
  if (profile?.email === "admin@ruralcommunity.org") return "admin";
  const role = profile?.userType || profile?.primaryRole || "staff";

  // Map roles correctly
  if (role === "program_manager") return "program_manager";
  if (role === "staff") return "staff";
  if (role === "coalition") return "coalition";
  if (role === "partner") return "partner";
  if (role === "mentor") return "mentor";
  if (role === "entrepreneur") return "entrepreneur";

  return "staff";
};

// Check if user has permission
const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleLevel: Record<string, number> = {
    admin: 5,
    staff: 4,
    program_manager: 3,
    coalition: 2,
    partner: 2,
    mentor: 1,
    entrepreneur: 1,
  };
  return (roleLevel[userRole] || 0) >= (roleLevel[requiredRole] || 0);
};

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [panel, setPanel] = useState<PanelType>(null);
  const [selectedDateRange, setSelectedDateRange] = useState("Last 12 months");
  const [signupsCount, setSignupsCount] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    role: "",
  });

  // Admin Notes state
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [noteRecipientType, setNoteRecipientType] = useState<
    "all" | "coalition" | "mentor" | "partner"
  >("all");
  const [noteMessage, setNoteMessage] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Access Requests state
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [accessRequestFilter, setAccessRequestFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(
    null,
  );
  const [showRequestDetails, setShowRequestDetails] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: () => {},
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

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "danger" | "warning" | "info" = "warning",
  ) => {
    setConfirmModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Helper function to get recipients
  const getRecipientsForType = (type: string) => {
    const allUsers: any[] = JSON.parse(localStorage.getItem("users") || "[]");

    if (type === "all") {
      return allUsers.filter(
        (u: any) =>
          u.primaryRole === "coalition" ||
          u.primaryRole === "mentor" ||
          u.primaryRole === "partner",
      );
    }

    return allUsers.filter((u: any) => u.primaryRole === type);
  };

  // Send admin note
  const sendAdminNote = () => {
    if (!noteMessage.trim()) {
      showToast("Please enter a message", "error");
      return;
    }

    const newNote = {
      id: Date.now(),
      subject: noteSubject || "General Update",
      message: noteMessage,
      recipientType: noteRecipientType,
      sentBy: profile.name || "Admin",
      sentAt: new Date().toISOString(),
      readBy: [],
    };

    const updatedNotes = [newNote, ...adminNotes];
    setAdminNotes(updatedNotes);
    localStorage.setItem("admin_notes", JSON.stringify(updatedNotes));

    // Also save to individual recipient buckets
    const recipients = getRecipientsForType(noteRecipientType);
    recipients.forEach((recipient: any) => {
      const existingNotes = JSON.parse(
        localStorage.getItem(`notes_${recipient.email}`) || "[]",
      );
      existingNotes.push({
        ...newNote,
        recipientEmail: recipient.email,
      });
      localStorage.setItem(
        `notes_${recipient.email}`,
        JSON.stringify(existingNotes),
      );
    });

    setNoteMessage("");
    setNoteSubject("");
    setShowNoteModal(false);
    showToast("Note sent successfully!", "success");
  };

  // Load admin notes
  useEffect(() => {
    const savedNotes = localStorage.getItem("admin_notes");
    if (savedNotes) {
      setAdminNotes(JSON.parse(savedNotes));
    }
  }, []);

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
      const role = getUserRole(parsed);
      setUserRole(role);

      // If not admin/staff/program_manager/coalition/partner, redirect to regular dashboard
      if (!hasPermission(role, "coalition")) {
        router.push("/");
        return;
      }
    } else {
      // Default to staff
      setUserRole("staff");
    }

    setIsAuthenticated(true);

    // Load signups count
    const savedSignups = JSON.parse(
      localStorage.getItem("programSignups") || "[]",
    );
    setSignupsCount(savedSignups.length);
  }, [router]);

  // LOAD ACCESS REQUESTS
  useEffect(() => {
    const loadAccessRequests = () => {
      const stored = localStorage.getItem("access_requests");
      if (stored) {
        const requests = JSON.parse(stored);
        setAccessRequests(requests);
      } else {
        // Add some sample requests for testing
        const sampleRequests: AccessRequest[] = [
          {
            name: "Sarah Johnson",
            email: "sarah.johnson@example.com",
            reason:
              "I need to manage the Business Catalyst program participants and track their progress. As a program coordinator, I would benefit from having access to view participant data and generate reports.",
            requestedRole: "program_manager",
            submittedAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "pending",
          },
          {
            name: "Michael Chen",
            email: "michael.chen@example.com",
            reason:
              "As a coalition leader, I need access to view participant data across all programs to better coordinate resources and support.",
            requestedRole: "staff",
            submittedAt: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "pending",
          },
          {
            name: "Emily Rodriguez",
            email: "emily.rodriguez@example.com",
            reason:
              "I'm the new program manager for SEED Micro-Grant and need to manage applications and track participant progress.",
            requestedRole: "program_manager",
            submittedAt: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            status: "pending",
          },
        ];
        localStorage.setItem("access_requests", JSON.stringify(sampleRequests));
        setAccessRequests(sampleRequests);
      }
    };

    loadAccessRequests();

    // Listen for storage events to update in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_requests") {
        const updated = JSON.parse(e.newValue || "[]");
        setAccessRequests(updated);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Handle Approve Request
  const handleApproveRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Approve Access Request",
      `Are you sure you want to approve ${request.name} for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access?\n\nThey will be able to ${request.requestedRole === "program_manager" ? "manage specific programs" : "access CMS, reports, and all programs"}.`,
      () => {
        const updatedRequests = accessRequests.map((r) =>
          r.email === request.email && r.submittedAt === request.submittedAt
            ? { ...r, status: "approved" as const }
            : r,
        );
        localStorage.setItem(
          "access_requests",
          JSON.stringify(updatedRequests),
        );
        setAccessRequests(updatedRequests);

        // Update the user's profile in localStorage
        const existingProfile = localStorage.getItem(
          `profile_${request.email}`,
        );
        if (existingProfile) {
          const profile = JSON.parse(existingProfile);
          profile.userType =
            request.requestedRole === "program_manager"
              ? "program_manager"
              : "staff";
          profile.primaryRole =
            request.requestedRole === "program_manager"
              ? "program_manager"
              : "staff";
          localStorage.setItem(
            `profile_${request.email}`,
            JSON.stringify(profile),
          );
        }

        showToast(
          `${request.name}'s access has been approved! They now have ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} permissions.`,
          "success",
        );
        setShowRequestDetails(false);
      },
      "info",
    );
  };

  // Handle Reject Request
  const handleRejectRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Reject Access Request",
      `Are you sure you want to reject ${request.name}'s access request?`,
      () => {
        const updatedRequests = accessRequests.map((r) =>
          r.email === request.email && r.submittedAt === request.submittedAt
            ? { ...r, status: "rejected" as const }
            : r,
        );
        localStorage.setItem(
          "access_requests",
          JSON.stringify(updatedRequests),
        );
        setAccessRequests(updatedRequests);
        showToast(
          `Access request from ${request.name} has been rejected.`,
          "info",
        );
        setShowRequestDetails(false);
      },
      "danger",
    );
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
      } else if (currentUser !== "admin@ruralcommunity.org") {
        const userName = currentUser.split("@")[0];
        const displayName =
          userName.charAt(0).toUpperCase() + userName.slice(1);
        const newProfile = {
          name: displayName,
          email: currentUser,
          role: "Staff",
        };
        setProfile(newProfile);
        setEditForm(newProfile);
      } else {
        setProfile({
          name: "Admin User",
          email: "admin@ruralcommunity.org",
          role: "Administrator",
        });
        setEditForm({
          name: "Admin User",
          email: "admin@ruralcommunity.org",
          role: "Administrator",
        });
      }
    }
  }, []);

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
      author: "Michael Chen",
      content:
        "Reminder: Q1 outcome metrics review call is scheduled for Friday at 2pm.",
      time: "Yesterday",
      pinned: false,
    },
  ]);

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
    showConfirmModal(
      "Sign Out",
      "Are you sure you want to sign out?",
      () => {
        localStorage.removeItem("currentUser");
        router.push("/login");
      },
      "warning",
    );
  };

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
    showToast("Note added successfully!", "success");
  };
  const deleteNote = (id: number) => {
    setNotes((p) => p.filter((n) => n.id !== id));
    showToast("Note deleted", "info");
  };
  const togglePin = (id: number) =>
    setNotes((p) =>
      p.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );

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

  const isAdmin = userRole === "admin";
  const isStaff = userRole === "staff";
  const isProgramManager = userRole === "program_manager";
  const isCoalition = userRole === "coalition";
  const isPartner = userRole === "partner";

  // Count pending requests
  const pendingRequestsCount = accessRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedRequestsCount = accessRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedRequestsCount = accessRequests.filter(
    (r) => r.status === "rejected",
  ).length;

  // Define tabs based on role
  const getTabs = () => {
    const tabs = ["Overview"];

    if (isAdmin || isStaff || isProgramManager) {
      tabs.push("Analytics", "Participants", "Mentors");
    }

    if (isAdmin || isStaff) {
      tabs.push("Leadership Roundtable", "Resources", "Reports", "Notes");
    }

    return tabs;
  };

  const tabs = getTabs();

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

            {/* Navigation Tabs */}
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
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {pendingRequestsCount}
                  </span>
                )}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={() => {
          confirmModal.onConfirm();
          hideConfirmModal();
        }}
        onCancel={hideConfirmModal}
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

      {/* Settings Panel - With Access Requests Section */}
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

          {/* 📋 Program Signups & Access Requests Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>📋 Program Signups & Access Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  {pendingRequestsCount} pending
                </span>
              )}
            </h3>

            {/* Program Signups Button */}
            <button
              onClick={() => router.push("/admin/program-signups")}
              className="w-full text-left px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-between mb-2"
            >
              <span>📋 View All Program Signups</span>
              <span className="text-xs bg-emerald-200 px-2 py-0.5 rounded-full">
                {signupsCount}
              </span>
            </button>

            {/* Access Requests Button */}
            <button
              onClick={() => setPanel("access-requests")}
              className="w-full text-left px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Review Access Requests</span>
              </div>
              {pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  {pendingRequestsCount} new
                </span>
              )}
            </button>
          </div>

          {/* Content Management - Admin/Staff Only */}
          {(isAdmin || isStaff) && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  📝 Content Management
                </h3>
                <button
                  onClick={() => router.push("/admin/cms-editor")}
                  className="w-full text-left px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Manage All Dashboard Content →
                </button>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  👥 User Activity
                </h3>
                <button
                  onClick={() => router.push("/admin/login-history")}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📊 View Login History →
                </button>
              </div>
            </>
          )}

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

          {/* Danger Zone - Admin Only */}
          {isAdmin && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-red-600 mb-3">
                Danger Zone
              </h3>
              <button
                onClick={() => {
                  showConfirmModal(
                    "⚠️ Danger Zone",
                    "WARNING: This will clear all mock data. This action cannot be undone. Are you absolutely sure?",
                    () => {
                      showConfirmModal(
                        "🔴 FINAL WARNING",
                        "All participant and program data will be permanently deleted.",
                        () => {
                          const confirmation = window.prompt(
                            'Type "DELETE" to confirm:',
                          );
                          if (confirmation === "DELETE") {
                            localStorage.removeItem("users");
                            localStorage.removeItem("currentUser");
                            showToast(
                              "All mock data has been cleared. The page will now refresh.",
                              "warning",
                            );
                            setTimeout(() => window.location.reload(), 1500);
                          } else {
                            showToast(
                              "Data clear cancelled. Incorrect confirmation text.",
                              "error",
                            );
                          }
                        },
                        "danger",
                      );
                    },
                    "danger",
                  );
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear all mock data (testing only)
              </button>
            </div>
          )}

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

      {/* Access Requests Panel */}
      <SlidePanel
        open={panel === "access-requests"}
        onClose={() => setPanel(null)}
        title="Access Requests"
        icon={Shield}
        onBack={() => setPanel("settings")}
      >
        <div>
          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200 mb-3">
            {[
              {
                key: "pending",
                label: "Pending",
                count: pendingRequestsCount,
                color: "bg-yellow-100 text-yellow-700",
              },
              {
                key: "approved",
                label: "Approved",
                count: approvedRequestsCount,
                color: "bg-green-100 text-green-700",
              },
              {
                key: "rejected",
                label: "Rejected",
                count: rejectedRequestsCount,
                color: "bg-red-100 text-red-700",
              },
              {
                key: "all",
                label: "All",
                count: accessRequests.length,
                color: "bg-gray-100 text-gray-700",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAccessRequestFilter(tab.key as any)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  accessRequestFilter === tab.key
                    ? "text-purple-600 border-b-2 border-purple-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${tab.color}`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-2">
            {accessRequests.filter((r) =>
              accessRequestFilter === "all"
                ? true
                : r.status === accessRequestFilter,
            ).length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No {accessRequestFilter !== "all"
                  ? accessRequestFilter
                  : ""}{" "}
                access requests found
              </div>
            ) : (
              accessRequests
                .filter((r) =>
                  accessRequestFilter === "all"
                    ? true
                    : r.status === accessRequestFilter,
                )
                .sort(
                  (a, b) =>
                    new Date(b.submittedAt).getTime() -
                    new Date(a.submittedAt).getTime(),
                )
                .map((request, idx) => (
                  <div
                    key={`${request.email}-${idx}`}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRequestDetails(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {request.name}
                          </p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : request.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {request.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            {request.requestedRole === "program_manager"
                              ? "Program Manager"
                              : "Staff/Admin"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {request.reason}
                        </p>
                      </div>
                      {request.status === "pending" && (
                        <div
                          className="flex gap-1 ml-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleApproveRequest(request)}
                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
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

      {/* Request Details Modal */}
      {showRequestDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Access Request
                </h2>
              </div>
              <button
                onClick={() => setShowRequestDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Full Name
                </label>
                <p className="text-gray-900 font-medium mt-1">
                  {selectedRequest.name}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Email Address
                </label>
                <p className="text-gray-900 font-medium mt-1">
                  {selectedRequest.email}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Requested Role
                </label>
                <p className="mt-1">
                  <span className="inline-block px-2 py-1 text-sm rounded-lg bg-purple-100 text-purple-700">
                    {selectedRequest.requestedRole === "program_manager"
                      ? "Program Manager"
                      : "Staff/Admin"}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedRequest.requestedRole === "program_manager"
                    ? "Can manage specific programs but not full system settings"
                    : "Full access to CMS, reports, and all programs"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Reason for Request
                </label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {selectedRequest.reason}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Submitted
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedRequest.submittedAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Status
                </label>
                <p className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 text-sm rounded-lg ${
                      selectedRequest.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : selectedRequest.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() +
                      selectedRequest.status.slice(1)}
                  </span>
                </p>
              </div>

              {selectedRequest.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleApproveRequest(selectedRequest)}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    ✓ Approve Request
                  </button>
                  <button
                    onClick={() => handleRejectRequest(selectedRequest)}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    ✗ Reject Request
                  </button>
                </div>
              )}

              {selectedRequest.status !== "pending" && (
                <button
                  onClick={() => setShowRequestDetails(false)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
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
        {(isAdmin || isStaff) && activeTab === "Leadership Roundtable" && (
          <LeadershipTab
            profileName={profile.name}
            profileEmail={profile.email}
            onOpenSignup={() => setPanel("leadership-signup")}
            isSignupOpen={panel === "leadership-signup"}
            onCloseSignup={() => setPanel(null)}
            showToast={showToast}
          />
        )}
        {(isAdmin || isStaff) && activeTab === "Resources" && <ResourcesTab />}
        {(isAdmin || isStaff) && activeTab === "Reports" && (
          <ReportsTab
            profileName={profile.name}
            notes={notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onTogglePin={togglePin}
            showToast={showToast}
          />
        )}

        {/* ============================================ */}
        {/* NOTES TAB - Admin Notes Section */}
        {/* ============================================ */}
        {(isAdmin || isStaff) && activeTab === "Notes" && (
          <div className="space-y-6">
            {/* Send Note Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  📝 Admin Notes
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Send updates and announcements to Coalition Leaders, Mentors,
                  and Partners
                </p>
              </div>
              <button
                onClick={() => setShowNoteModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send New Note
              </button>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All Notes", icon: Users },
                {
                  key: "coalition",
                  label: "Coalition Leaders",
                  icon: UserCheck,
                },
                { key: "mentor", label: "Mentors", icon: Award },
                { key: "partner", label: "Partners", icon: Building2 },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setNoteRecipientType(filter.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    noteRecipientType === filter.key
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <filter.icon className="h-4 w-4" />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {adminNotes.filter(
                (n) =>
                  noteRecipientType === "all" ||
                  n.recipientType === noteRecipientType,
              ).length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No notes sent yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Send New Note" to send an announcement
                  </p>
                </div>
              ) : (
                adminNotes
                  .filter(
                    (n) =>
                      noteRecipientType === "all" ||
                      n.recipientType === noteRecipientType,
                  )
                  .map((note) => (
                    <div
                      key={note.id}
                      className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {note.subject}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-500">
                              From: {note.sentBy}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.sentAt).toLocaleString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              To:{" "}
                              {note.recipientType === "all"
                                ? "All"
                                : note.recipientType.charAt(0).toUpperCase() +
                                  note.recipientType.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                        {note.message}
                      </p>
                    </div>
                  ))
              )}
            </div>

            {/* Send Note Modal */}
            {showNoteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Send New Note
                    </h2>
                    <button
                      onClick={() => setShowNoteModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-xl"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recipients
                      </label>
                      <select
                        value={noteRecipientType}
                        onChange={(e) =>
                          setNoteRecipientType(e.target.value as any)
                        }
                        className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">
                          All (Coalition, Mentor, Partner)
                        </option>
                        <option value="coalition">
                          Coalition Leaders Only
                        </option>
                        <option value="mentor">Mentors Only</option>
                        <option value="partner">Partners Only</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {noteRecipientType === "all"
                          ? "Sending to all Coalition Leaders, Mentors, and Partners"
                          : `Sending to ${noteRecipientType} users only`}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        placeholder="Note subject..."
                        value={noteSubject}
                        onChange={(e) => setNoteSubject(e.target.value)}
                        className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                      </label>
                      <textarea
                        placeholder="Write your message here..."
                        value={noteMessage}
                        onChange={(e) => setNoteMessage(e.target.value)}
                        rows={5}
                        className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => setShowNoteModal(false)}
                      className="flex-1 py-2 border rounded-xl hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendAdminNote}
                      disabled={!noteMessage.trim()}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Send Note
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message for Coalition/Partner users - they only see Overview tab */}
        {(isCoalition || isPartner) && activeTab === "Overview" && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              Welcome to your dashboard. As a{" "}
              {isCoalition ? "Coalition Leader" : "Partner"}, you can view
              program data but cannot edit CMS content. For full access, please
              contact an administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
