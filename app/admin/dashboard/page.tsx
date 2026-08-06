"use client";

import { ApprovalPopup } from "@/components/admin/approval-popup";
import { linkifyText } from "@/lib/linkify";
import {
  getAdminNotes,
  sendAdminNoteRow,
  subscribeToAdminNotes,
  getAllMenteeNotesWithContext,
  subscribeToMenteeData,
  type MenteeNoteWithContext,
  getMessageableUsers,
  getAllDirectMessages,
  sendDirectMessage,
  subscribeToDirectMessages,
  type MessageableUserRow,
  type DirectMessageRow,
} from "@/lib/supabase/dashboard-data";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { AvatarPositionEditor } from "@/components/dashboard/avatar-position-editor";
import {
  notificationService,
  NotificationHelpers,
} from "@/lib/notification-service";
import { ToastNotification } from "@/components/ui/toast-notification";
import { useRouter, useSearchParams } from "next/navigation";
import { OverviewTab } from "@/components/dashboard/overview-tab";
import AnalyticsTab from "@/components/dashboard/analytics-tab";
import { ParticipantsTab } from "@/components/dashboard/participants-tab";
import { MentorsTab } from "@/components/dashboard/mentors-tab";
import { BusinessProfessionalServicesTab } from "@/components/dashboard/business-professional-services-tab";
import { LeadershipTab } from "@/components/dashboard/leadership-tab";
import { ResourcesTab } from "@/components/dashboard/resources-tab";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { SlidePanel } from "@/components/slide-panel";
import { RoundtableSignupForm } from "@/components/roundtable-signup-form";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
// Add Supabase client:
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, Suspense } from "react";
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
  avatarPosition?: string;
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
  verificationToken?: string;
  passwordSet?: boolean;
}

// Get user role from profile
const getUserRole = (profile: any): string => {
  if (profile?.email === "admin@ruralcommunity.org") return "admin";
  const role = profile?.userType || profile?.primaryRole || "staff";

  // Map roles
  if (role === "program_manager") return "program_manager";
  if (role === "staff") return "staff";
  if (role === "coalition") return "coalition";
  if (role === "partner") return "partner";
  if (role === "mentor") return "mentor";
  if (role === "mentee") return "mentee";
  if (role === "entrepreneur") return "entrepreneur";

  return "staff";
};

const hasPermission = (userRole: string, requiredRole: string): boolean => {
  const roleLevel: Record<string, number> = {
    admin: 5,
    staff: 4,
    program_manager: 3,
    coalition: 2,
    partner: 2,
    mentor: 2,
    mentee: 1,
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

// Next.js requires any page that calls useSearchParams() to be wrapped in
// a Suspense boundary, or the build fails while prerendering this route
// (this page reads ?panel= for deep-linking into Access Requests). The
// actual page body lives in AdminDashboardContent below; this default
// export just supplies that boundary.
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  );
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [selectedCounty, setSelectedCounty] = useState("All Counties");
  const [panel, setPanel] = useState<PanelType>(null);

  // Allow deep-linking straight to the Access Requests panel, e.g. from
  // the old /admin/access-requests URL or an email link.
  useEffect(() => {
    if (searchParams.get("panel") === "access-requests") {
      setPanel("access-requests");
    }
  }, [searchParams]);
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

  // Approval Popup
  const [approvalPopup, setApprovalPopup] = useState<{
    isOpen: boolean;
    userName: string;
    userEmail: string;
    userRole: string;
    token: string;
  }>({
    isOpen: false,
    userName: "",
    userEmail: "",
    userRole: "",
    token: "",
  });

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

  // Real-time notifications
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updated) => {
      setUnreadCount(notificationService.getUnreadCount());
    });

    setUnreadCount(notificationService.getUnreadCount());

    return () => unsubscribe();
  }, []);

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

  // Load admin notes (Supabase, realtime)
  const loadAdminNotes = useCallback(async () => {
    try {
      const data = await getAdminNotes();
      setAdminNotes(data);
    } catch (err) {
      console.error("Failed to load admin notes:", err);
    }
  }, []);

  useEffect(() => {
    loadAdminNotes();
    const unsubscribe = subscribeToAdminNotes(loadAdminNotes);
    return unsubscribe;
  }, [loadAdminNotes]);

  // Oversight: notes mentors have sent to their mentees/entrepreneurs
  // (read-only here - mentors send these from their own dashboard)
  const [mentorMenteeNotes, setMentorMenteeNotes] = useState<
    MenteeNoteWithContext[]
  >([]);

  const loadMentorMenteeNotes = useCallback(async () => {
    try {
      const data = await getAllMenteeNotesWithContext();
      setMentorMenteeNotes(data);
    } catch (err) {
      console.error("Failed to load mentor-to-mentee notes:", err);
    }
  }, []);

  useEffect(() => {
    loadMentorMenteeNotes();
    const unsubscribe = subscribeToMenteeData(loadMentorMenteeNotes);
    return unsubscribe;
  }, [loadMentorMenteeNotes]);

  // Direct Messages - private 1:1 chat with each coalition/mentor/partner
  // account, separate from the admin_notes broadcast above.
  const [messageableUsers, setMessageableUsers] = useState<
    MessageableUserRow[]
  >([]);
  const [allDirectMessages, setAllDirectMessages] = useState<
    DirectMessageRow[]
  >([]);
  const [selectedMessageUserId, setSelectedMessageUserId] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    getMessageableUsers()
      .then(setMessageableUsers)
      .catch((err) => console.error("Failed to load messageable users:", err));
  }, []);

  const loadDirectMessages = useCallback(async () => {
    try {
      const data = await getAllDirectMessages();
      setAllDirectMessages(data);
    } catch (err) {
      console.error("Failed to load direct messages:", err);
    }
  }, []);

  useEffect(() => {
    loadDirectMessages();
    const unsubscribe = subscribeToDirectMessages(loadDirectMessages);
    return unsubscribe;
  }, [loadDirectMessages]);

  const handleSendDirectMessage = async () => {
    if (!messageInput.trim() || !selectedMessageUserId) return;
    setSendingMessage(true);
    try {
      await sendDirectMessage(
        selectedMessageUserId,
        "admin",
        profile.name || "Admin",
        messageInput.trim(),
      );
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
      showToast("Failed to send message.", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  // Send admin note
  const sendAdminNote = async () => {
    if (!noteMessage.trim()) {
      showToast("Please enter a message", "error");
      return;
    }

    try {
      await sendAdminNoteRow(
        noteSubject || "General Update",
        noteMessage,
        noteRecipientType,
        profile.name || "Admin",
      );

      setNoteMessage("");
      setNoteSubject("");
      setShowNoteModal(false);
      showToast("Note sent successfully!", "success");
    } catch (err) {
      console.error("Failed to send note:", err);
      showToast("Failed to send note.", "error");
    }
  };

  // CHECK AUTHENTICATION & GET USER ROLE (Supabase)
  useEffect(() => {
    let cancelled = false;

    const loadAuthAndProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const [{ data: userRow, error: userError }, { data: profileRow }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, name, email, primary_role, status")
            .eq("id", authData.user.id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("avatar, avatar_position")
            .eq("id", authData.user.id)
            .maybeSingle(),
        ]);

      if (cancelled) return;

      if (userError || !userRow) {
        router.push("/login");
        return;
      }

      if (userRow.status && userRow.status !== "active") {
        router.push("/login");
        return;
      }

      const roleLabel =
        userRow.primary_role === "admin"
          ? "Administrator"
          : userRow.primary_role === "program_manager"
            ? "Program Manager"
            : userRow.primary_role === "coalition"
              ? "Coalition Leader"
              : userRow.primary_role === "partner"
                ? "Partner"
                : "Staff";

      const loadedProfile = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role: roleLabel,
        primaryRole: userRow.primary_role ?? undefined,
        userType: userRow.primary_role ?? undefined,
        avatar: profileRow?.avatar ?? undefined,
        avatarPosition: profileRow?.avatar_position ?? "50% 50%",
      };

      setProfile(loadedProfile);
      setEditForm(loadedProfile);
      const role = getUserRole(loadedProfile);
      setUserRole(role);

      // If not admin/staff/program_manager/coalition/partner, redirect to regular dashboard
      if (!hasPermission(role, "coalition")) {
        router.push("/");
        return;
      }

      setIsAuthenticated(true);

      // Load signups count
      const savedSignups = JSON.parse(
        localStorage.getItem("programSignups") || "[]",
      );
      setSignupsCount(savedSignups.length);
    };

    loadAuthAndProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // LOAD ACCESS REQUESTS (Supabase, realtime)
  useEffect(() => {
    const loadAccessRequests = async () => {
      const { data, error } = await supabase
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load access requests:", error);
        return;
      }

      const mapped: any[] = (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        reason: r.reason,
        requestedRole: r.requested_role,
        submittedAt: r.created_at,
        status: r.status,
        verificationToken: r.verification_token,
        passwordSet: r.password_set,
      }));
      setAccessRequests(mapped);
    };

    loadAccessRequests();

    const channelName = `access-requests-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "access_requests" },
        loadAccessRequests,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ============================================
  // HANDLE APPROVE REQUEST - Updated with Modern Popup
  // ============================================
  const handleApproveRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Approve Access Request",
      `Are you sure you want to approve ${request.name} for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access?\n\nThey will be able to ${request.requestedRole === "program_manager" ? "manage specific programs" : "access CMS, reports, and all programs"}.\n\nThey will receive an email to set their password.`,
      async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) {
            showToast("Your session expired. Please log in again.", "error");
            return;
          }

          const res = await fetch("/api/admin/approve-access", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              requestId: (request as any).id,
              name: request.name,
              email: request.email,
              requestedRole: request.requestedRole,
            }),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            showToast(result.error || "Failed to approve request.", "error");
            return;
          }

          // Add real-time notification
          notificationService.addNotification(
            "inapp",
            "general",
            `Access Approved: ${request.name}`,
            result.emailSent === false
              ? `${request.name} was approved, but the invite email failed to send. Check server logs.`
              : `${request.name} was approved for ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"} access. They've been emailed a link to set their password.`,
            { user: request },
          );

          if (result.emailSent === false) {
            showToast(
              `${request.name}'s access was approved, but the invite email failed to send. Check server logs.`,
              "error",
            );
          } else {
            showToast(
              `${request.name}'s access has been approved! They'll receive an email to set their password.`,
              "success",
            );
          }

          setShowRequestDetails(false);
        } catch (err) {
          console.error("Approve request error:", err);
          showToast("Something went wrong approving this request.", "error");
        }
      },
      "info",
    );
  };

  // Add this function to close the popup
  const closeApprovalPopup = () => {
    setApprovalPopup({
      isOpen: false,
      userName: "",
      userEmail: "",
      userRole: "",
      token: "",
    });
  };

  // Handle Reject Request
  const handleRejectRequest = (request: AccessRequest) => {
    showConfirmModal(
      "Reject Access Request",
      `Are you sure you want to reject ${request.name}'s access request?`,
      async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) {
            showToast("Your session expired. Please log in again.", "error");
            return;
          }

          const res = await fetch("/api/admin/reject-access", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ requestId: (request as any).id }),
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            showToast(result.error || "Failed to reject request.", "error");
            return;
          }

          // Add real-time notification
          notificationService.addNotification(
            "inapp",
            "general",
            `Access Rejected: ${request.name}`,
            `${request.name}'s access request was rejected.`,
            { user: request },
          );

          showToast(
            `Access request from ${request.name} has been rejected.`,
            "info",
          );
          setShowRequestDetails(false);
        } catch (err) {
          console.error("Reject request error:", err);
          showToast("Something went wrong rejecting this request.", "error");
        }
      },
      "danger",
    );
  };

  // Profile is now loaded by the Supabase auth effect above -
  // this duplicate localStorage-based effect has been removed.

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

  const saveProfile = async () => {
    setProfile(editForm);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { error } = await supabase
        .from("users")
        .update({ name: editForm.name })
        .eq("id", authData.user.id);
      if (error) {
        console.error("Failed to save profile:", error);
        showToast("Failed to save profile.", "error");
        return;
      }
      if (
        editForm.avatar !== profile.avatar ||
        editForm.avatarPosition !== profile.avatarPosition
      ) {
        const { error: avatarError } = await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            avatar: editForm.avatar || null,
            avatar_position: editForm.avatarPosition || "50% 50%",
          },
          { onConflict: "id" },
        );
        if (avatarError) {
          console.error("Failed to save avatar:", avatarError);
          showToast("Failed to save profile photo.", "error");
          return;
        }
      }
    }
    setEditSaved(true);
    showToast("Profile updated successfully!", "success");
    setTimeout(() => {
      setEditSaved(false);
      setPanel("profile");
    }, 1200);
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
      // Verify the current password before changing it, since Supabase's
      // updateUser() doesn't check it on its own (it trusts the existing
      // session).
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

  const handleLogout = () => {
    showConfirmModal(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        await supabase.auth.signOut();
        router.push("/login");
      },
      "warning",
    );
  };


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
      tabs.push(
        "Business Professional Services",
        "Leadership Roundtable",
        "Resources",
        "Reports",
        "Notes",
      );
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

      {/* Approval Popup */}
      <ApprovalPopup
        isOpen={approvalPopup.isOpen}
        onClose={closeApprovalPopup}
        userName={approvalPopup.userName}
        userEmail={approvalPopup.userEmail}
        userRole={approvalPopup.userRole}
        token={approvalPopup.token}
        onEmailSent={() => {
          showToast("Password setup link sent to user's email!", "success");
        }}
      />

      {/* Notifications Panel - Slide Panel */}
      <SlidePanel
        open={panel === "notifications"}
        onClose={() => setPanel(null)}
        title="Notifications"
        icon={Bell}
      >
        <NotificationPanel />
      </SlidePanel>

      {/* Settings Panel*/}
      <SlidePanel
        open={panel === "settings"}
        onClose={() => setPanel(null)}
        title="Settings"
        icon={Settings}
      >
        <div className="space-y-6">
          {/* 📋 Program Signups & Access Requests Section */}
          <div>
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
              <span>📋 View All Program Signups →</span>
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
                <span>Review Access Requests →</span>
              </div>
              {pendingRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                  {pendingRequestsCount} new
                </span>
              )}
            </button>
          </div>

          {/* Admin/Staff Only tools */}
          {(isAdmin || isStaff) && (
            <>
              {/* Program Management */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  📋 Program Management
                </h3>
                <button
                  onClick={() => router.push("/admin/program-management")}
                  className="w-full text-left px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-between"
                >
                  <span>📊 Manage All Programs →</span>
                </button>
              </div>

              {/* ✅ Email Logs */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  📧 Email Logs
                </h3>
                <button
                  onClick={() => router.push("/admin/emails")}
                  className="w-full text-left px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-between"
                >
                  <span>📧 View Sent Emails →</span>
                </button>
              </div>
            </>
          )}

          {/* Notification Settings */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Notification Settings
              <span className="text-xs font-normal text-gray-400 ml-2">
                Real-time
              </span>
            </h3>
            <div className="space-y-3">
              {[
                {
                  key: "emailNotifications",
                  label: "Email notifications",
                  desc: "Receive email alerts for key events",
                  action: async (value: boolean) => {
                    localStorage.setItem(
                      "email_notifications_enabled",
                      String(value),
                    );
                    if (value) {
                      await notificationService.sendEmail({
                        to: profile.email || "admin@ruralcommunity.org",
                        subject: "Email Notifications Enabled",
                        body: "You will now receive email notifications for important events.",
                        type: "general",
                      });
                      showToast(
                        "Email notifications enabled! Test email sent.",
                        "success",
                      );
                    } else {
                      showToast("Email notifications disabled", "info");
                    }
                  },
                },
                {
                  key: "mentorAlerts",
                  label: "Mentor activity alerts",
                  desc: "Get notified when mentors log hours or update status",
                  action: async (value: boolean) => {
                    localStorage.setItem(
                      "mentor_alerts_enabled",
                      String(value),
                    );
                    if (value) {
                      await NotificationHelpers.notifyMentorActivity(
                        "Test Mentor",
                        "logged_hours",
                        "2 hours logged",
                      );
                      showToast(
                        "Mentor alerts enabled! Test notification sent.",
                        "success",
                      );
                    } else {
                      showToast("Mentor alerts disabled", "info");
                    }
                  },
                },
                {
                  key: "participantAlerts",
                  label: "Participant milestone alerts",
                  desc: "Get notified when participants complete stages",
                  action: async (value: boolean) => {
                    localStorage.setItem(
                      "participant_alerts_enabled",
                      String(value),
                    );
                    if (value) {
                      await NotificationHelpers.notifyParticipantMilestone(
                        "Test Participant",
                        "Onboarding Complete",
                        "Business Catalyst",
                      );
                      showToast(
                        "Participant alerts enabled! Test notification sent.",
                        "success",
                      );
                    } else {
                      showToast("Participant alerts disabled", "info");
                    }
                  },
                },
                {
                  key: "reportAlerts",
                  label: "Monthly report reminders",
                  desc: "Reminders when reports are due",
                  action: async (value: boolean) => {
                    localStorage.setItem(
                      "report_alerts_enabled",
                      String(value),
                    );
                    if (value) {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      await NotificationHelpers.sendReportReminder(
                        nextMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        }),
                        "5th of the month",
                      );
                      showToast(
                        "Report alerts enabled! Test notification sent.",
                        "success",
                      );
                    } else {
                      showToast("Report alerts disabled", "info");
                    }
                  },
                },
              ].map((item) => {
                const currentValue =
                  localStorage.getItem(item.key) === "true" ||
                  settings[item.key as keyof SettingsData] === true;

                return (
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
                      value={currentValue}
                      onChange={async (v) => {
                        updateSetting(item.key as keyof SettingsData, v);
                        await item.action(v);
                        setUnreadCount(notificationService.getUnreadCount());
                      }}
                    />
                  </div>
                );
              })}
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
                  style={{ objectPosition: profile.avatarPosition || "50% 50%" }}
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
                            { id: authData.user.id, avatar: avatarUrl },
                            { onConflict: "id" },
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
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
              <AvatarPositionEditor
                src={editForm.avatar}
                position={editForm.avatarPosition || "50% 50%"}
                onPositionChange={(pos) =>
                  setEditForm({ ...editForm, avatarPosition: pos })
                }
                size={80}
                fallback={editForm.name.charAt(0).toUpperCase()}
              />
            </div>
            {editForm.avatar && (
              <p className="text-[11px] text-gray-400">Drag photo to reposition</p>
            )}
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Your login email can't be changed here.
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Contact another admin to change your role.
            </p>
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
          onSuccess={() => {
            showToast("Application submitted - review it under Pending Applications", "success");
            setTimeout(() => setPanel(null), 1200);
          }}
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
        {(isAdmin || isStaff) &&
          activeTab === "Business Professional Services" && (
            <BusinessProfessionalServicesTab />
          )}
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
          <ReportsTab showToast={showToast} profileName={profile.name || "Admin"} />
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
                  n.recipient_type === noteRecipientType,
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
                      n.recipient_type === noteRecipientType,
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
                              From: {note.sent_by}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.created_at).toLocaleString()}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              To:{" "}
                              {note.recipient_type === "all"
                                ? "All"
                                : note.recipient_type.charAt(0).toUpperCase() +
                                  note.recipient_type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                        {linkifyText(note.message)}
                      </p>
                    </div>
                  ))
              )}
            </div>

            {/* ============================================ */}
            {/* Direct Messages - private 1:1 chat, separate from the */}
            {/* broadcast announcements above. Sending here never touches */}
            {/* admin_notes. */}
            {/* ============================================ */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                💬 Direct Messages
              </h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Private conversations with Coalition Leaders, Mentors, and
                Partners - they can reply, unlike the announcements above
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* People list */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-1">
                  <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                    {messageableUsers.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-400">
                        No coalition, mentor, or partner accounts yet.
                      </div>
                    ) : (
                      messageableUsers.map((u) => {
                        const thread = allDirectMessages.filter(
                          (m) => m.user_id === u.id,
                        );
                        const last = thread[thread.length - 1];
                        return (
                          <button
                            key={u.id}
                            onClick={() => setSelectedMessageUserId(u.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              selectedMessageUserId === u.id
                                ? "bg-emerald-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {(u.name || u.email || "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {u.name || u.email}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize shrink-0">
                                    {u.primaryRole}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {last ? last.message : "No messages yet"}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Thread */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
                  {!selectedMessageUserId ? (
                    <div className="flex-1 flex items-center justify-center py-16 text-sm text-gray-400">
                      Select a person to view the conversation
                    </div>
                  ) : (
                    (() => {
                      const person = messageableUsers.find(
                        (u) => u.id === selectedMessageUserId,
                      );
                      const thread = allDirectMessages.filter(
                        (m) => m.user_id === selectedMessageUserId,
                      );
                      return (
                        <>
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                            <h3 className="font-semibold text-gray-900">
                              {person?.name || person?.email}
                            </h3>
                            <p className="text-xs text-gray-400 capitalize">
                              {person?.primaryRole}
                            </p>
                          </div>
                          <div className="p-5 space-y-3 max-h-[380px] overflow-y-auto">
                            {thread.length === 0 ? (
                              <div className="text-center py-8 text-gray-400 text-sm">
                                No messages yet. Say hello!
                              </div>
                            ) : (
                              thread.map((m) => (
                                <div
                                  key={m.id}
                                  className={`flex ${
                                    m.sender_role === "admin"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-xl px-3 py-2 ${
                                      m.sender_role === "admin"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span
                                        className={`text-xs font-medium ${
                                          m.sender_role === "admin"
                                            ? "text-emerald-100"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {m.sender_role === "admin"
                                          ? m.sender_name || "Admin"
                                          : person?.name || "Them"}
                                      </span>
                                      <span
                                        className={`text-[10px] ${
                                          m.sender_role === "admin"
                                            ? "text-emerald-100"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {new Date(
                                          m.created_at,
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">
                                      {linkifyText(m.message)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <textarea
                              value={messageInput}
                              onChange={(e) =>
                                setMessageInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                                  handleSendDirectMessage();
                              }}
                              placeholder={`Message ${person?.name || "them"}… (⌘Enter to send)`}
                              rows={2}
                              className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                            <div className="flex justify-end mt-2">
                              <button
                                onClick={handleSendDirectMessage}
                                disabled={sendingMessage || !messageInput.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                <Send className="h-3 w-3" />
                                Send
                              </button>
                            </div>
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* ============================================ */}
            {/* Mentor -> Mentee/Entrepreneur Notes (read-only oversight) */}
            {/* ============================================ */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                📬 Notes from Mentors to Mentees & Entrepreneurs
              </h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Notes mentors have sent to the entrepreneurs they guide, sent
                from each mentor's own dashboard
              </p>
              {mentorMenteeNotes.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No notes sent yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Notes mentors send to their mentees will show up here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentorMenteeNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-700">
                          From: {note.mentorName}
                        </span>
                        <span className="text-xs text-gray-300">→</span>
                        <span className="text-xs font-medium text-gray-700">
                          To: {note.menteeName}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {linkifyText(note.note)}
                      </p>
                    </div>
                  ))}
                </div>
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
                      <p className="text-xs text-gray-400 mt-1">
                        Tip: paste a link (https://...) and it'll show up
                        clickable once sent.
                      </p>
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
