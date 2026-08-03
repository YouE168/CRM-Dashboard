"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  getMentorProfileByEmail,
  getMentorProfileByName,
  getAllSessionsForMentor,
  getMenteesForMentor,
  getParticipantRecordsForUser,
  getNotesForParticipant,
  getNotesForParticipants,
  addMenteeNote,
  subscribeToMenteeData,
  sendMentorEmailNotification,
  getGoalsForParticipant,
  getProgramsForUser,
  type UserProgramRow,
  type MyParticipantRow,
  getSessionsForParticipant,
  type MenteeSessionRow,
  getProgramTracking,
  type ProgramTrackingRow,
  getProgramResources,
  type ProgramResourceRow,
  getMentorRatingForParticipant,
  getPartnerProfileData,
  savePartnerProfileData,
  type PartnerProfileData,
  getPartnerCollaborations,
  addPartnerCollaboration,
  updatePartnerCollaboration,
  deletePartnerCollaboration,
  type PartnerCollaborationRow,
  PARTNER_PROJECT_TYPES,
  PARTNER_ORG_TYPES,
  getPartnerResources,
  addPartnerResource,
  updatePartnerResource,
  deletePartnerResource,
  type PartnerResourceRow,
  subscribeToPartnerData,
  getAdminNotes,
  subscribeToAdminNotes,
  type AdminNoteRow,
  getCoalitionProfileData,
  saveCoalitionProfileData,
  type CoalitionProfileData,
  getCoalitionMeetings,
  addCoalitionMeeting,
  updateCoalitionMeeting,
  deleteCoalitionMeeting,
  type CoalitionMeetingRow,
  getCoalitionInitiatives,
  addCoalitionInitiative,
  updateCoalitionInitiative,
  deleteCoalitionInitiative,
  type CoalitionInitiativeRow,
  getCoalitionResources,
  addCoalitionResource,
  updateCoalitionResource,
  deleteCoalitionResource,
  type CoalitionResourceRow,
  subscribeToCoalitionData,
} from "@/lib/supabase/dashboard-data";
import { RoundtableJoinCard } from "@/components/dashboard/roundtable-join-card";
import { linkifyText } from "@/lib/linkify";
import { useRouter } from "next/navigation";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  BookOpen,
  Calendar,
  Star,
  Award,
  Clock,
  MessageCircle,
  Briefcase,
  Users,
  Handshake,
  Shield,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Video,
  Link as LinkIcon,
  DollarSign,
  FileText,
} from "lucide-react";

// Types
interface ProfileData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  primaryRole?: string;
  selectedPrograms?: string[];
  phone?: string;
  organization?: string;
}

interface SettingsData {
  emailNotifications: boolean;
  mentorAlerts: boolean;
  participantAlerts: boolean;
  darkMode: boolean;
  twoFactorAuth: boolean;
  dashboardLayout: string;
}

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  visible: boolean;
}

// Program details for modals
const PROGRAM_DETAILS: Record<string, any> = {
  "RCP Small Business Mentorship": {
    title: "RCP Small Business Mentorship",
    description:
      "Connect with experienced local mentors for one-on-one guidance. Get help with business planning, marketing, financial management, and more.",
    status: "Active",
    startDate: "January 2025",
    progress: 33,
    nextMilestone: "Complete your business profile",
    nextMilestoneAction: "https://forms.google.com/mentorship-profile",
    resources: [
      { name: "Mentor Directory", link: "/resources/mentor-directory" },
      { name: "Business Planning Templates", link: "/resources/templates" },
      {
        name: "Application Support",
        link: "mailto:support@ruralcommunitypartners.org",
      },
      { name: "Success Story Guide", link: "/resources/success-stories" },
    ],
    upcomingSessions: [
      {
        date: "June 10, 2025",
        time: "2:00 PM",
        topic: "Business Plan Review",
        mentor: "Michael Chen",
        link: "/mentor/settings?mentee=1",
      },
    ],
    contactEmail: "mentorship@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0101",
  },
  "SEED Micro-Grant": {
    title: "SEED Micro-Grant Program",
    description:
      "10-week SEK Catalyst cohort with mentorship and grant opportunities. Includes $250 participant support + $500 grants for top businesses.",
    status: "Active",
    startDate: "January 2025",
    progress: 33,
    nextMilestone: "Complete cohort application",
    nextMilestoneAction: "https://forms.google.com/seed-application",
    resources: [
      { name: "Cohort Calendar", link: "/resources/seed-calendar" },
      { name: "Grant Application Guide", link: "/resources/grant-guide" },
      { name: "Weekly Session Materials", link: "/resources/seed-materials" },
      { name: "Pitch Deck Template", link: "/resources/pitch-template" },
    ],
    upcomingSessions: [
      {
        date: "June 12, 2025",
        time: "10:00 AM",
        topic: "Weekly Cohort Meeting",
        mentor: "David Park",
        link: "/zoom/seed-cohort",
      },
    ],
    contactEmail: "seed@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0102",
  },
  "Business Technical Assistance": {
    title: "Business Technical Assistance Hub",
    description:
      "Financial modeling, startup support, and capital connection. Get expert help with cash flow, break-even analysis, and funding strategies.",
    status: "Active",
    startDate: "January 2025",
    progress: 33,
    nextMilestone: "Schedule technical assistance call",
    nextMilestoneAction: "https://calendar.google.com/tech-assistance",
    resources: [
      { name: "Financial Templates", link: "/resources/financial-templates" },
      { name: "Capital Readiness Guide", link: "/resources/capital-guide" },
      { name: "Business Plan Template", link: "/resources/business-plan" },
      { name: "Investor Pitch Guide", link: "/resources/pitch-guide" },
    ],
    upcomingSessions: [
      {
        date: "June 15, 2025",
        time: "1:00 PM",
        topic: "Financial Planning Session",
        mentor: "Tom Anderson",
        link: "/zoom/financial-planning",
      },
    ],
    contactEmail: "techassist@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0103",
  },
  "Microloan Program": {
    title: "Microloan Program",
    description:
      "Access to capital for rural businesses. Designed to support startup and growth-stage entrepreneurs with flexible loan options.",
    status: "Active",
    startDate: "January 2025",
    progress: 33,
    nextMilestone: "Check loan eligibility",
    nextMilestoneAction: "https://forms.google.com/microloan-eligibility",
    resources: [
      { name: "Loan Application", link: "/resources/loan-application" },
      { name: "Eligibility Requirements", link: "/resources/eligibility" },
      { name: "Financial Documentation Guide", link: "/resources/doc-guide" },
      { name: "Interest Rate Calculator", link: "/resources/rate-calculator" },
    ],
    upcomingSessions: [],
    contactEmail: "loans@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0104",
  },
  "SEK Catalyst: Empowered by KU": {
    title: "SEK Catalyst: Empowered by KU",
    description:
      "A comprehensive 12-week entrepreneurship program designed to help rural business owners launch and grow their ventures. Includes mentorship, workshops, and access to KU resources.",
    status: "Active",
    startDate: "August 2025",
    progress: 0,
    nextMilestone: "Complete your onboarding session",
    nextMilestoneAction: "https://calendar.google.com/sek-catalyst-onboarding",
    resources: [
      { name: "Program Guide", link: "/resources/sek-catalyst-guide" },
      { name: "Workshop Schedule", link: "/resources/sek-catalyst-schedule" },
      { name: "KU Resources", link: "/resources/ku-resources" },
      { name: "Mentor Matching", link: "/resources/mentor-matching" },
    ],
    upcomingSessions: [
      {
        date: "September 5, 2025",
        time: "6:00 PM",
        topic: "Program Kickoff & Orientation",
        mentor: "Jody Program",
        link: "/zoom/sek-catalyst",
      },
      {
        date: "September 12, 2025",
        time: "6:00 PM",
        topic: "Business Planning Workshop",
        mentor: "Tom Anderson",
        link: "/zoom/sek-catalyst-workshop",
      },
    ],
    contactEmail: "catalyst@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0105",
  },
};

// Toggle Component
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
      className={`w-11 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${
        value ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// Password Input Component
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
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// Slide Panel Component
function SlidePanel({
  open,
  onClose,
  title,
  icon: Icon,
  children,
  onBack,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: any;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Icon className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto h-[calc(100%-80px)]">
          {children}
        </div>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .fixed.right-0 {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

// All Notes Modal Component
function AllNotesModal({
  notes,
  onClose,
}: {
  notes: { id: string; note: string; author: string; date: string }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              All Mentor Notes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Notes and feedback from your mentor
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notes yet</p>
              <p className="text-xs mt-1">
                Your mentor will leave feedback here
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-emerald-600">
                      {note.author}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(note.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{linkifyText(note.note)}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COALITION DASHBOARD COMPONENT
// ============================================
function CoalitionDashboard({
  showToast,
  router,
  profile,
}: {
  showToast: (msg: string, type: any) => void;
  router: any;
  profile: any;
}) {
  // Real Supabase-backed state - replaces the old
  // localStorage("coalition_dashboard_data") blob. Mirrors the Partner
  // dashboard rebuild: one profile-data row per coalition user (hero/
  // metrics) plus their own meetings/initiatives/resources lists.
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<CoalitionProfileData | null>(
    null,
  );
  const [meetings, setMeetings] = useState<CoalitionMeetingRow[]>([]);
  const [initiatives, setInitiatives] = useState<CoalitionInitiativeRow[]>([]);

  // Real "Notes from Admin" - same admin_notes table/realtime the admin
  // dashboard's own Notes tab uses (mirrors the Partner dashboard's
  // setup), filtered to broadcasts addressed to "all" or "coalition".
  // Read/unread is tracked client-side only (this table has no
  // per-recipient row to mark read against), scoped per signed-in user.
  const [coalitionAdminNotes, setCoalitionAdminNotes] = useState<
    AdminNoteRow[]
  >([]);
  const [showAllCoalitionNotes, setShowAllCoalitionNotes] = useState(false);
  const [readCoalitionNoteIds, setReadCoalitionNoteIds] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const all = await getAdminNotes();
        setCoalitionAdminNotes(
          all.filter(
            (n) =>
              n.recipient_type === "all" || n.recipient_type === "coalition",
          ),
        );
      } catch (err) {
        console.error("Failed to load admin notes:", err);
      }
    };
    loadNotes();
    const unsubscribe = subscribeToAdminNotes(loadNotes);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const saved = localStorage.getItem(`coalition_read_notes_${userId}`);
    if (saved) {
      try {
        setReadCoalitionNoteIds(new Set(JSON.parse(saved)));
      } catch {
        // ignore malformed cache
      }
    }
  }, [userId]);

  const markCoalitionNoteRead = (id: string) => {
    setReadCoalitionNoteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (userId && typeof window !== "undefined") {
        localStorage.setItem(
          `coalition_read_notes_${userId}`,
          JSON.stringify([...next]),
        );
      }
      return next;
    });
  };
  const [resourcesList, setResourcesList] = useState<CoalitionResourceRow[]>(
    [],
  );
  const [loadingCoalitionData, setLoadingCoalitionData] = useState(true);
  // The real programs this coalition leader selected/was approved for at
  // signup (user_programs joined with the programs catalog) - locked until
  // Jody approves, except Business Professional Services which is
  // auto-approved for every account.
  const [myPrograms, setMyPrograms] = useState<UserProgramRow[]>([]);

  const loadCoalitionData = useCallback(
    async (uid: string) => {
      try {
        const [profileRow, meetingRows, initiativeRows, resourceRows, programRows] =
          await Promise.all([
            getCoalitionProfileData(uid),
            getCoalitionMeetings(uid),
            getCoalitionInitiatives(uid),
            getCoalitionResources(uid),
            getProgramsForUser(uid).catch(() => []),
          ]);
        setMyPrograms(programRows);
        setProfileData(
          profileRow || {
            user_id: uid,
            hero_title:
              profile?.organization ||
              profile?.name ||
              "Welcome, Coalition Leader!",
            hero_subtitle: "Leading change across Southeast Kansas",
            stat_active_coalitions: 0,
            stat_counties_served: 0,
            stat_active_projects: 0,
            metric_coalition_members: 0,
            metric_meetings_held: 0,
            metric_projects_initiated: 0,
            metric_residents_impacted: 0,
            updated_at: new Date().toISOString(),
          },
        );
        setMeetings(meetingRows);
        setInitiatives(initiativeRows);
        setResourcesList(resourceRows);
      } catch (err) {
        console.error("Failed to load coalition dashboard data:", err);
      } finally {
        setLoadingCoalitionData(false);
      }
    },
    [profile?.organization, profile?.name],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setUserId(data.user.id);
        await loadCoalitionData(data.user.id);
      } else {
        setLoadingCoalitionData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCoalitionData]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToCoalitionData(() =>
      loadCoalitionData(userId),
    );
    return unsubscribe;
  }, [userId, loadCoalitionData]);

  // Composed shape the render below already expects, built live from the
  // real state above instead of one JSON blob.
  const coalitionData = {
    hero: {
      title: profileData?.hero_title || "Welcome, Coalition Leader!",
      subtitle: profileData?.hero_subtitle || "",
      stats: {
        activeCoalitions: profileData?.stat_active_coalitions ?? 0,
        countiesServed: profileData?.stat_counties_served ?? 0,
        activeProjects: profileData?.stat_active_projects ?? 0,
      },
    },
    metrics: {
      coalitionMembers: profileData?.metric_coalition_members ?? 0,
      meetingsHeld: profileData?.metric_meetings_held ?? 0,
      projectsInitiated: profileData?.metric_projects_initiated ?? 0,
      residentsImpacted: profileData?.metric_residents_impacted ?? 0,
    },
    upcomingMeetings: meetings,
    activeInitiatives: initiatives,
    resources: resourcesList,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState<
    "meeting" | "initiative" | "resource" | null
  >(null);
  const [tempFormData, setTempFormData] = useState<any>({});
  const [showCoalitionProgramModal, setShowCoalitionProgramModal] =
    useState(false);
  const [selectedCoalitionProgram, setSelectedCoalitionProgram] =
    useState<UserProgramRow | null>(null);

  // Debounce writes so typing in an edit field doesn't fire a Supabase
  // request on every keystroke.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const debouncedWrite = (key: string, fn: () => Promise<void>) => {
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      fn().catch((err) => {
        console.error(`Failed to save (${key}):`, err);
        showToast("Failed to save that change.", "error");
      });
    }, 600);
  };

  // Hero/metrics edits funnel through here - meetings/initiatives/resources
  // have their own dedicated CRUD functions below that write straight to
  // Supabase instead.
  const saveCoalitionData = (newData: any) => {
    if (!userId) return;
    const fields = {
      hero_title: newData.hero.title,
      hero_subtitle: newData.hero.subtitle,
      stat_active_coalitions: newData.hero.stats.activeCoalitions,
      stat_counties_served: newData.hero.stats.countiesServed,
      stat_active_projects: newData.hero.stats.activeProjects,
      metric_coalition_members: newData.metrics.coalitionMembers,
      metric_meetings_held: newData.metrics.meetingsHeld,
      metric_projects_initiated: newData.metrics.projectsInitiated,
      metric_residents_impacted: newData.metrics.residentsImpacted,
    };
    setProfileData((prev) => ({ ...(prev as CoalitionProfileData), ...fields }));
    debouncedWrite("profile", () => saveCoalitionProfileData(userId, fields));
  };

  // Meeting CRUD - real Supabase writes.
  const addMeeting = async () => {
    if (!userId) return;
    try {
      await addCoalitionMeeting(userId, {
        title: tempFormData.title || "New Meeting",
        date: tempFormData.date || new Date().toISOString().split("T")[0],
        time: tempFormData.time || "12:00 PM",
        type: tempFormData.type || "virtual",
        link: tempFormData.link || "",
        meeting_id: tempFormData.meetingId || "",
        passcode: tempFormData.passcode || "",
        location: tempFormData.location || "",
        description: tempFormData.description || "",
      });
      setMeetings(await getCoalitionMeetings(userId));
      setShowAddModal(null);
      setTempFormData({});
      showToast("Meeting added successfully!", "success");
    } catch (err) {
      console.error("Failed to add meeting:", err);
      showToast("Failed to add meeting. Please try again.", "error");
    }
  };

  const updateMeeting = (id: string, field: string, value: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
    debouncedWrite(`meeting-${id}-${field}`, () =>
      updateCoalitionMeeting(id, { [field]: value } as any),
    );
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await deleteCoalitionMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      showToast("Meeting deleted successfully!", "info");
    } catch (err) {
      console.error("Failed to delete meeting:", err);
      showToast("Failed to delete. Please try again.", "error");
    }
  };

  // Initiative CRUD - real Supabase writes.
  const addInitiative = async () => {
    if (!userId) return;
    try {
      await addCoalitionInitiative(userId, {
        title: tempFormData.title || "New Initiative",
        status: tempFormData.status || "Proposed",
        progress: tempFormData.progress || 0,
        description: tempFormData.description || "",
        start_date:
          tempFormData.startDate || new Date().toISOString().split("T")[0],
        target_date: tempFormData.targetDate || "",
      });
      setInitiatives(await getCoalitionInitiatives(userId));
      setShowAddModal(null);
      setTempFormData({});
      showToast("Initiative added successfully!", "success");
    } catch (err) {
      console.error("Failed to add initiative:", err);
      showToast("Failed to add initiative. Please try again.", "error");
    }
  };

  const updateInitiative = (id: string, field: string, value: any) => {
    setInitiatives((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
    debouncedWrite(`initiative-${id}-${field}`, () =>
      updateCoalitionInitiative(id, { [field]: value } as any),
    );
  };

  const deleteInitiative = async (id: string) => {
    if (!confirm("Are you sure you want to delete this initiative?")) return;
    try {
      await deleteCoalitionInitiative(id);
      setInitiatives((prev) => prev.filter((i) => i.id !== id));
      showToast("Initiative deleted successfully!", "info");
    } catch (err) {
      console.error("Failed to delete initiative:", err);
      showToast("Failed to delete. Please try again.", "error");
    }
  };

  // Resource CRUD - real Supabase writes.
  const addResource = async () => {
    if (!userId) return;
    try {
      await addCoalitionResource(userId, {
        title: tempFormData.title || "New Resource",
        description: tempFormData.description || "",
        link: tempFormData.link || "",
        type: tempFormData.type || "Available",
      });
      setResourcesList(await getCoalitionResources(userId));
      setShowAddModal(null);
      setTempFormData({});
      showToast("Resource added successfully!", "success");
    } catch (err) {
      console.error("Failed to add resource:", err);
      showToast("Failed to add resource. Please try again.", "error");
    }
  };

  const updateResource = (id: string, field: string, value: string) => {
    setResourcesList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
    debouncedWrite(`resource-${id}-${field}`, () =>
      updateCoalitionResource(id, { [field]: value } as any),
    );
  };

  const deleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deleteCoalitionResource(id);
      setResourcesList((prev) => prev.filter((r) => r.id !== id));
      showToast("Resource deleted successfully!", "info");
    } catch (err) {
      console.error("Failed to delete resource:", err);
      showToast("Failed to delete. Please try again.", "error");
    }
  };

  const handleResourceClick = (resource: any) => {
    if (resource.link) {
      if (resource.link.startsWith("http")) {
        window.open(resource.link, "_blank");
      } else {
        router.push(resource.link);
      }
    } else {
      showToast("Resource link coming soon", "info");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-green-100 text-green-700";
      case "Planning":
        return "bg-yellow-100 text-yellow-700";
      case "Proposed":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loadingCoalitionData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            isEditing
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isEditing ? "✓ Done Editing" : "✎ Edit Dashboard"}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          {isEditing ? (
            <>
              <input
                type="text"
                value={coalitionData.hero.title}
                onChange={(e) => {
                  const updated = { ...coalitionData };
                  updated.hero.title = e.target.value;
                  saveCoalitionData(updated);
                }}
                className="text-3xl font-bold bg-transparent border-b border-white/30 focus:outline-none focus:border-white mb-2 w-full"
              />
              <input
                type="text"
                value={coalitionData.hero.subtitle}
                onChange={(e) => {
                  const updated = { ...coalitionData };
                  updated.hero.subtitle = e.target.value;
                  saveCoalitionData(updated);
                }}
                className="text-purple-100 bg-transparent border-b border-white/30 focus:outline-none focus:border-white w-full"
              />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold">{coalitionData.hero.title}</h2>
              <p className="text-purple-100 mt-2">
                {coalitionData.hero.subtitle}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <p className="text-sm opacity-90">Active Coalitions</p>
              {isEditing ? (
                <input
                  type="number"
                  value={coalitionData.hero.stats.activeCoalitions}
                  onChange={(e) => {
                    const updated = { ...coalitionData };
                    updated.hero.stats.activeCoalitions = parseInt(
                      e.target.value,
                    );
                    saveCoalitionData(updated);
                  }}
                  className="text-2xl font-bold bg-transparent w-20 border-b border-white/30"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {coalitionData.hero.stats.activeCoalitions}
                </p>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <p className="text-sm opacity-90">Counties Served</p>
              {isEditing ? (
                <input
                  type="number"
                  value={coalitionData.hero.stats.countiesServed}
                  onChange={(e) => {
                    const updated = { ...coalitionData };
                    updated.hero.stats.countiesServed = parseInt(
                      e.target.value,
                    );
                    saveCoalitionData(updated);
                  }}
                  className="text-2xl font-bold bg-transparent w-20 border-b border-white/30"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {coalitionData.hero.stats.countiesServed}
                </p>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <p className="text-sm opacity-90">Active Projects</p>
              {isEditing ? (
                <input
                  type="number"
                  value={coalitionData.hero.stats.activeProjects}
                  onChange={(e) => {
                    const updated = { ...coalitionData };
                    updated.hero.stats.activeProjects = parseInt(
                      e.target.value,
                    );
                    saveCoalitionData(updated);
                  }}
                  className="text-2xl font-bold bg-transparent w-20 border-b border-white/30"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {coalitionData.hero.stats.activeProjects}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            key: "coalitionMembers",
            label: "Coalition Members",
            value: coalitionData.metrics.coalitionMembers,
            icon: "👥",
          },
          {
            key: "meetingsHeld",
            label: "Meetings Held",
            value: coalitionData.metrics.meetingsHeld,
            icon: "📅",
          },
          {
            key: "projectsInitiated",
            label: "Projects Initiated",
            value: coalitionData.metrics.projectsInitiated,
            icon: "🚀",
          },
          {
            key: "residentsImpacted",
            label: "Residents Impacted",
            value: coalitionData.metrics.residentsImpacted,
            icon: "🏠",
          },
        ].map((metric) => (
          <div
            key={metric.key}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative group"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{metric.icon}</span>
              {isEditing && (
                <button
                  onClick={() => {
                    const newValue = prompt(
                      `Enter new ${metric.label.toLowerCase()}:`,
                      String(metric.value),
                    );
                    if (newValue && !isNaN(Number(newValue))) {
                      const updated = {
                        ...coalitionData.metrics,
                        [metric.key]: Number(newValue),
                      };
                      saveCoalitionData({ ...coalitionData, metrics: updated });
                    }
                  }}
                  className="text-gray-400 hover:text-emerald-600 text-sm"
                >
                  ✎
                </button>
              )}
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-3">
              {metric.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Your Active Programs - the real programs this coalition leader
          selected/was approved for at signup (user_programs), locked until
          Jody approves. Business Professional Services is auto-approved for
          every account at signup so it's always accessible. */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            📋 Your Active Programs
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Click on a program to view details
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {myPrograms.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No programs yet</p>
              <p className="text-xs mt-1">
                Contact Jody to get added to a program
              </p>
            </div>
          ) : (
            myPrograms.map((p) => {
              // Business Professional Services is auto-approved for every
              // account at signup - always show it as approved.
              const isApproved =
                p.approved || p.name === "Business Professional Services";
              return (
                <div
                  key={p.user_program_id}
                  onClick={() => {
                    setSelectedCoalitionProgram(p);
                    setShowCoalitionProgramModal(true);
                  }}
                  className="p-5 hover:bg-gray-50 transition-colors group relative cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                          {p.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : p.status === "Completed"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.status}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {isApproved && <Check className="h-3 w-3" />}
                          {isApproved ? "Approved" : "Pending approval"}
                        </span>
                      </div>
                      {p.start_date && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Started{" "}
                              {new Date(p.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              📅 Upcoming Meetings
            </h3>
            {isEditing && (
              <button
                onClick={() => {
                  setTempFormData({});
                  setShowAddModal("meeting");
                }}
                className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-200 flex items-center gap-1"
              >
                <span className="text-lg">+</span> Add Meeting
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {coalitionData.upcomingMeetings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No meetings scheduled</p>
                {isEditing && (
                  <p className="text-xs mt-1">
                    Click "Add Meeting" to create one
                  </p>
                )}
              </div>
            ) : (
              coalitionData.upcomingMeetings.map((meeting: any) => (
                <div
                  key={meeting.id}
                  className="p-4 hover:bg-gray-50 transition-colors group relative"
                >
                  {isEditing && (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMeeting(meeting.id);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={meeting.title}
                        onChange={(e) =>
                          updateMeeting(meeting.id, "title", e.target.value)
                        }
                        className="font-medium text-gray-800 border rounded px-2 py-1 text-sm w-full mb-1"
                      />
                    ) : (
                      <p className="font-medium text-gray-800">
                        {meeting.title}
                      </p>
                    )}

                    <div className="text-sm text-gray-500 mt-1">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={meeting.date}
                            onChange={(e) =>
                              updateMeeting(meeting.id, "date", e.target.value)
                            }
                            className="border rounded px-2 py-1 text-xs"
                          />
                          <input
                            type="text"
                            value={meeting.time}
                            onChange={(e) =>
                              updateMeeting(meeting.id, "time", e.target.value)
                            }
                            className="border rounded px-2 py-1 text-xs w-24"
                          />
                        </div>
                      ) : (
                        `${formatDate(meeting.date)} - ${meeting.time}`
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {isEditing ? (
                        <select
                          value={meeting.type}
                          onChange={(e) =>
                            updateMeeting(meeting.id, "type", e.target.value)
                          }
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="virtual">💻 Virtual</option>
                          <option value="in-person">📍 In Person</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            meeting.type === "virtual"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {meeting.type === "virtual"
                            ? "💻 Virtual"
                            : "📍 In Person"}
                        </span>
                      )}
                    </div>

                    {/* Zoom Meeting Input - Always visible for virtual meetings */}
                    {meeting.type === "virtual" && (
                      <div className="mt-3 space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        {isEditing ? (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Zoom Meeting ID *
                              </label>
                              <input
                                type="text"
                                value={meeting.meeting_id || ""}
                                onChange={(e) =>
                                  updateMeeting(
                                    meeting.id,
                                    "meeting_id",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter Zoom Meeting ID"
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Passcode (optional)
                              </label>
                              <input
                                type="text"
                                value={meeting.passcode || ""}
                                onChange={(e) =>
                                  updateMeeting(
                                    meeting.id,
                                    "passcode",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter Zoom passcode"
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Zoom Meeting
                              </span>
                            </div>
                            {meeting.link ? (
                              // Jody (or the coalition leader) already
                              // provided a full Zoom link for this meeting -
                              // skip the manual Meeting ID/passcode entry
                              // and go straight to it.
                              <button
                                onClick={() =>
                                  window.open(meeting.link!, "_blank")
                                }
                                className="w-full px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                              >
                                <Video className="h-3 w-3" />
                                Join Zoom Meeting
                              </button>
                            ) : (
                              <>
                                {meeting.meeting_id && (
                                  <p className="text-sm text-gray-600">
                                    Meeting ID:{" "}
                                    <span className="font-mono">
                                      {meeting.meeting_id}
                                    </span>
                                  </p>
                                )}
                                {meeting.passcode && (
                                  <p className="text-sm text-gray-600">
                                    Passcode:{" "}
                                    <span className="font-mono">
                                      {meeting.passcode}
                                    </span>
                                  </p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <input
                                    type="text"
                                    id={`zoomMeetingId_${meeting.id}`}
                                    placeholder="Enter Zoom Meeting ID"
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    id={`zoomPasscode_${meeting.id}`}
                                    placeholder="Passcode"
                                    className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const meetingIdInput =
                                      document.getElementById(
                                        `zoomMeetingId_${meeting.id}`,
                                      ) as HTMLInputElement;
                                    const passcodeInput =
                                      document.getElementById(
                                        `zoomPasscode_${meeting.id}`,
                                      ) as HTMLInputElement;

                                    const meetingId =
                                      meetingIdInput?.value ||
                                      meeting.meeting_id;
                                    const passcode =
                                      passcodeInput?.value || meeting.passcode;

                                    if (!meetingId) {
                                      showToast(
                                        "Please enter a Zoom Meeting ID",
                                        "error",
                                      );
                                      return;
                                    }

                                    let zoomUrl = `https://zoom.us/j/${meetingId}`;
                                    if (passcode) {
                                      zoomUrl += `?pwd=${encodeURIComponent(
                                        passcode,
                                      )}`;
                                    }
                                    window.open(zoomUrl, "_blank");
                                  }}
                                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                  <Video className="h-3 w-3" />
                                  Join Zoom Meeting
                                </button>
                                <p className="text-xs text-gray-400 mt-1">
                                  💡 Enter the Meeting ID and passcode provided
                                  by your meeting host
                                </p>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {isEditing && meeting.type === "in-person" && (
                      <input
                        type="text"
                        value={meeting.location}
                        onChange={(e) =>
                          updateMeeting(meeting.id, "location", e.target.value)
                        }
                        placeholder="Location address"
                        className="mt-2 w-full border rounded px-2 py-1 text-xs"
                      />
                    )}
                    {!isEditing &&
                      meeting.type === "in-person" &&
                      meeting.location && (
                        <button
                          onClick={() => {
                            window.open(
                              `https://maps.google.com/?q=${encodeURIComponent(
                                meeting.location,
                              )}`,
                              "_blank",
                            );
                          }}
                          className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          Get directions →
                        </button>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Initiatives */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              🎯 Active Initiatives
            </h3>
            {isEditing && (
              <button
                onClick={() => {
                  setTempFormData({});
                  setShowAddModal("initiative");
                }}
                className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-200 flex items-center gap-1"
              >
                <span className="text-lg">+</span> Add Initiative
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {coalitionData.activeInitiatives.map((initiative: any) => (
              <div key={initiative.id} className="p-4 group relative">
                {isEditing && (
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => deleteInitiative(initiative.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                )}
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={initiative.title}
                      onChange={(e) =>
                        updateInitiative(initiative.id, "title", e.target.value)
                      }
                      className="font-semibold text-gray-800 border rounded px-2 py-1 text-sm w-full mb-1"
                    />
                  ) : (
                    <p className="font-semibold text-gray-800">
                      {initiative.title}
                    </p>
                  )}
                  {isEditing ? (
                    <textarea
                      value={initiative.description}
                      onChange={(e) =>
                        updateInitiative(
                          initiative.id,
                          "description",
                          e.target.value,
                        )
                      }
                      className="text-sm text-gray-500 border rounded px-2 py-1 w-full mt-1"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      {initiative.description}
                    </p>
                  )}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={initiative.progress}
                          onChange={(e) =>
                            updateInitiative(
                              initiative.id,
                              "progress",
                              parseInt(e.target.value),
                            )
                          }
                          className="text-purple-600 border rounded px-1 w-12 text-right"
                        />
                      ) : (
                        <span className="text-purple-600 font-medium">
                          {initiative.progress}%
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-purple-500 rounded-full transition-all"
                        style={{ width: `${initiative.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    {isEditing ? (
                      <select
                        value={initiative.status}
                        onChange={(e) =>
                          updateInitiative(
                            initiative.id,
                            "status",
                            e.target.value,
                          )
                        }
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="Proposed">Proposed</option>
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(initiative.status)}`}
                      >
                        {initiative.status}
                      </span>
                    )}
                    {!isEditing && initiative.start_date && (
                      <span className="text-xs text-gray-400">
                        {formatDate(initiative.start_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            📚 Coalition Resources
          </h3>
          {isEditing && (
            <button
              onClick={() => {
                setTempFormData({});
                setShowAddModal("resource");
              }}
              className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-200 flex items-center gap-1"
            >
              <span className="text-lg">+</span> Add Resource
            </button>
          )}
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {coalitionData.resources.map((resource: any) => (
              <div
                key={resource.id}
                onClick={() => !isEditing && handleResourceClick(resource)}
                className={`p-3 bg-gray-50 rounded-lg transition-colors relative group ${
                  !isEditing ? "hover:bg-purple-50 cursor-pointer" : ""
                }`}
              >
                {isEditing && (
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResource(resource.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                )}
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={resource.title}
                      onChange={(e) =>
                        updateResource(resource.id, "title", e.target.value)
                      }
                      className="font-medium text-gray-800 border rounded px-2 py-1 text-sm w-full mb-1"
                    />
                    <input
                      type="text"
                      value={resource.description}
                      onChange={(e) =>
                        updateResource(
                          resource.id,
                          "description",
                          e.target.value,
                        )
                      }
                      className="text-xs text-gray-500 border rounded px-2 py-1 w-full"
                    />
                    <input
                      type="text"
                      value={resource.link}
                      onChange={(e) =>
                        updateResource(resource.id, "link", e.target.value)
                      }
                      placeholder="Link URL"
                      className="text-xs text-purple-600 border rounded px-2 py-1 w-full mt-1"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{resource.icon || "📄"}</span>
                      <p className="font-medium text-gray-800">
                        {resource.title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {resource.description}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Click to open →
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes from Admin Section - Coalition */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                📬 Notes from Admin
              </h3>
            </div>
            {coalitionAdminNotes.length > 0 && (
              <button
                onClick={() => setShowAllCoalitionNotes(!showAllCoalitionNotes)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllCoalitionNotes
                  ? "Show Less"
                  : `View All (${coalitionAdminNotes.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="p-5 space-y-3">
          {coalitionAdminNotes.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No notes from admin yet.</p>
              <p className="text-xs text-gray-400">
                Updates and announcements will appear here.
              </p>
            </div>
          ) : (
            (showAllCoalitionNotes
              ? coalitionAdminNotes
              : coalitionAdminNotes.slice(0, 3)
            ).map((note) => {
              const isRead = readCoalitionNoteIds.has(note.id);
              return (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isRead ? "bg-gray-50" : "bg-blue-50 border border-blue-200"
                  }`}
                  onClick={() => !isRead && markCoalitionNoteRead(note.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-700">
                        {note.subject}
                      </span>
                      {!isRead && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{linkifyText(note.message)}</p>
                  {note.sent_by && (
                    <p className="text-xs text-gray-400 mt-1">
                      From: {note.sent_by}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Zoom Meeting Section - Coalition */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Join Your Meeting</h3>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-3">
            Enter your Zoom meeting ID and passcode to join your session
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Zoom Meeting ID
              </label>
              <input
                type="text"
                id="coalitionZoomMeetingId"
                placeholder="e.g., 123 456 7890"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Passcode (optional)
              </label>
              <input
                type="text"
                id="coalitionZoomPassword"
                placeholder="Enter Zoom passcode"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const meetingId = (
                document.getElementById(
                  "coalitionZoomMeetingId",
                ) as HTMLInputElement
              )?.value;
              const password = (
                document.getElementById(
                  "coalitionZoomPassword",
                ) as HTMLInputElement
              )?.value;

              if (!meetingId || meetingId.trim() === "") {
                showToast("Please enter your Zoom Meeting ID", "error");
                return;
              }

              const cleanMeetingId = meetingId.trim().replace(/\s/g, "");
              let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
              if (password && password.trim() !== "") {
                zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
              }

              window.open(zoomUrl, "_blank");
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Video className="h-4 w-4" />
            Join Zoom Meeting
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Tip: Your meeting host should provide the Meeting ID and passcode
          </p>
        </div>
      </div>

      <RoundtableJoinCard
        profileName={profile?.name ?? ""}
        profileEmail={profile?.email ?? ""}
        showToast={showToast}
      />

      {/* Support Section */}
      <div
        onClick={() =>
          window.open(
            "mailto:jody@hbcat.org?subject=Coalition Support Request",
            "_blank",
          )
        }
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
              <MessageCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Need coalition support?
              </h3>
              <p className="text-sm text-gray-600">
                Contact Jody for assistance
              </p>
            </div>
          </div>
          <button className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700">
            Contact Support →
          </button>
        </div>
      </div>

      {/* Add Meeting Modal */}
      {showAddModal === "meeting" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Meeting
              </h2>
              <button
                onClick={() => setShowAddModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Monthly Coalition Meeting"
                  value={tempFormData.title || ""}
                  onChange={(e) =>
                    setTempFormData({ ...tempFormData, title: e.target.value })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={tempFormData.date || ""}
                  onChange={(e) =>
                    setTempFormData({ ...tempFormData, date: e.target.value })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10:00 AM"
                  value={tempFormData.time || ""}
                  onChange={(e) =>
                    setTempFormData({ ...tempFormData, time: e.target.value })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Type *
                </label>
                <select
                  value={tempFormData.type || "virtual"}
                  onChange={(e) =>
                    setTempFormData({ ...tempFormData, type: e.target.value })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="virtual">💻 Virtual (Zoom)</option>
                  <option value="in-person">📍 In Person</option>
                </select>
              </div>
              {tempFormData.type === "virtual" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zoom Meeting ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 123456789"
                      value={tempFormData.meetingId || ""}
                      onChange={(e) =>
                        setTempFormData({
                          ...tempFormData,
                          meetingId: e.target.value,
                        })
                      }
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zoom Passcode (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter passcode if required"
                      value={tempFormData.passcode || ""}
                      onChange={(e) =>
                        setTempFormData({
                          ...tempFormData,
                          passcode: e.target.value,
                        })
                      }
                      className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              {tempFormData.type === "in-person" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Community Center, 123 Main St"
                    value={tempFormData.location || ""}
                    onChange={(e) =>
                      setTempFormData({
                        ...tempFormData,
                        location: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModal(null)}
                className="flex-1 py-2 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addMeeting}
                disabled={
                  !tempFormData.title ||
                  !tempFormData.date ||
                  !tempFormData.time ||
                  (tempFormData.type === "virtual" && !tempFormData.meetingId)
                }
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Initiative Modal */}
      {showAddModal === "initiative" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Initiative
              </h2>
              <button
                onClick={() => setShowAddModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initiative Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Food Access Program"
                  value={tempFormData.title || ""}
                  onChange={(e) =>
                    setTempFormData({ ...tempFormData, title: e.target.value })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  placeholder="What is this initiative about?"
                  value={tempFormData.description || ""}
                  onChange={(e) =>
                    setTempFormData({
                      ...tempFormData,
                      description: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={tempFormData.status || "Proposed"}
                  onChange={(e) =>
                    setTempFormData({ ...tempFormData, status: e.target.value })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="Proposed">Proposed</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={tempFormData.progress || 0}
                  onChange={(e) =>
                    setTempFormData({
                      ...tempFormData,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddModal(null)}
                className="flex-1 py-2 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addInitiative}
                disabled={!tempFormData.title || !tempFormData.description}
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Initiative
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal === "resource" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Resource
              </h2>
              <button
                onClick={() => setShowAddModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                placeholder="Resource Title"
                value={tempFormData.title || ""}
                onChange={(e) =>
                  setTempFormData({ ...tempFormData, title: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={tempFormData.description || ""}
                onChange={(e) =>
                  setTempFormData({
                    ...tempFormData,
                    description: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Link URL (optional)"
                value={tempFormData.link || ""}
                onChange={(e) =>
                  setTempFormData({ ...tempFormData, link: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(null)}
                className="flex-1 py-2 border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addResource}
                disabled={!tempFormData.title}
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
              >
                Add Resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Details Modal - locked until Jody approves, same pattern
          as the mentee/entrepreneur program modal. Business Professional
          Services is force-shown as approved regardless of the underlying
          approved flag. */}
      {showCoalitionProgramModal && selectedCoalitionProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedCoalitionProgram.name}
                </h2>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedCoalitionProgram.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : selectedCoalitionProgram.status === "Completed"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedCoalitionProgram.status}
                  </span>
                  {selectedCoalitionProgram.approved ||
                  selectedCoalitionProgram.name ===
                    "Business Professional Services" ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Approved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      Pending approval
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCoalitionProgramModal(false);
                  setSelectedCoalitionProgram(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!(
                selectedCoalitionProgram.approved ||
                selectedCoalitionProgram.name ===
                  "Business Professional Services"
              ) ? (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
                  <p className="text-sm text-amber-800 font-medium">
                    🔒 You don't have access to this program yet
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Jody reviews and approves access to each program. You'll
                    be notified once you're approved.
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = `mailto:jody@hbcat.org?subject=Requesting access to ${encodeURIComponent(selectedCoalitionProgram.name)}`)
                    }
                    className="mt-3 w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                  >
                    Ask Jody for access
                  </button>
                </div>
              ) : (
                <>
                  {selectedCoalitionProgram.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        About This Program
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedCoalitionProgram.description}
                      </p>
                    </div>
                  )}

                  {(selectedCoalitionProgram.start_date ||
                    selectedCoalitionProgram.end_date) && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {selectedCoalitionProgram.start_date &&
                        `Started ${new Date(selectedCoalitionProgram.start_date).toLocaleDateString()}`}
                      {selectedCoalitionProgram.start_date &&
                        selectedCoalitionProgram.end_date &&
                        " · "}
                      {selectedCoalitionProgram.end_date &&
                        `Ends ${new Date(selectedCoalitionProgram.end_date).toLocaleDateString()}`}
                    </div>
                  )}

                  {(selectedCoalitionProgram.contact_email ||
                    selectedCoalitionProgram.contact_phone) && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        Program Contact
                      </h4>
                      {selectedCoalitionProgram.contact_email && (
                        <button
                          onClick={() =>
                            (window.location.href = `mailto:${selectedCoalitionProgram.contact_email}`)
                          }
                          className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-100 text-left"
                        >
                          <Mail className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {selectedCoalitionProgram.contact_email}
                          </span>
                        </button>
                      )}
                      {selectedCoalitionProgram.contact_phone && (
                        <button
                          onClick={() =>
                            (window.location.href = `tel:${selectedCoalitionProgram.contact_phone}`)
                          }
                          className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-purple-50 transition-colors border border-gray-100 text-left"
                        >
                          <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {selectedCoalitionProgram.contact_phone}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PARTNER DASHBOARD COMPONENT
// ============================================
function PartnerDashboard({
  showToast,
  router,
  profile,
}: {
  showToast: (msg: string, type: any) => void;
  router: any;
  profile: any;
}) {
  // Real Supabase-backed state - replaces the old
  // localStorage("partner_dashboard_data") blob. One profile-data row per
  // partner user (hero/metrics) plus their own collaborations/resources
  // lists.
  const [userId, setUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<PartnerProfileData | null>(
    null,
  );
  const [collaborations, setCollaborations] = useState<
    PartnerCollaborationRow[]
  >([]);
  const [resources, setResources] = useState<PartnerResourceRow[]>([]);
  const [loadingPartnerData, setLoadingPartnerData] = useState(true);
  // The real programs this partner selected/was approved for at signup
  // (user_programs joined with the programs catalog) - lets collaborations
  // be tied to an actual program instead of a free-text title only.
  const [myPrograms, setMyPrograms] = useState<UserProgramRow[]>([]);

  const loadPartnerData = useCallback(
    async (uid: string) => {
      try {
        const [profileRow, collabRows, resourceRows, programRows] =
          await Promise.all([
            getPartnerProfileData(uid),
            getPartnerCollaborations(uid),
            getPartnerResources(uid),
            getProgramsForUser(uid).catch(() => []),
          ]);
        setMyPrograms(programRows);
        setProfileData(
          profileRow || {
            user_id: uid,
            hero_title:
              profile?.organization ||
              profile?.name ||
              "Welcome, Partner Organization!",
            hero_subtitle: "Collaborating for community impact",
            stat_active_partners: 0,
            stat_shared_resources: 0,
            stat_active_referrals: 0,
            metric_active_collaborations: 0,
            metric_internships_posted: 0,
            metric_student_placements: 0,
            updated_at: new Date().toISOString(),
          },
        );
        setCollaborations(collabRows);
        setResources(resourceRows);
      } catch (err) {
        console.error("Failed to load partner dashboard data:", err);
      } finally {
        setLoadingPartnerData(false);
      }
    },
    [profile?.organization, profile?.name],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setUserId(data.user.id);
        await loadPartnerData(data.user.id);
      } else {
        setLoadingPartnerData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPartnerData]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToPartnerData(() => loadPartnerData(userId));
    return unsubscribe;
  }, [userId, loadPartnerData]);

  // Real "Notes from Admin" - same admin_notes table/realtime the admin
  // dashboard's own Notes tab uses, filtered to broadcasts addressed to
  // "all" or "partner". Read/unread is tracked client-side only (this
  // table has no per-recipient row to mark read against), scoped per
  // signed-in user.
  const [partnerAdminNotes, setPartnerAdminNotes] = useState<AdminNoteRow[]>(
    [],
  );
  const [showAllPartnerNotes, setShowAllPartnerNotes] = useState(false);
  const [readPartnerNoteIds, setReadPartnerNoteIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const all = await getAdminNotes();
        setPartnerAdminNotes(
          all.filter(
            (n) => n.recipient_type === "all" || n.recipient_type === "partner",
          ),
        );
      } catch (err) {
        console.error("Failed to load admin notes:", err);
      }
    };
    loadNotes();
    const unsubscribe = subscribeToAdminNotes(loadNotes);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    const saved = localStorage.getItem(`partner_read_notes_${userId}`);
    if (saved) {
      try {
        setReadPartnerNoteIds(new Set(JSON.parse(saved)));
      } catch {
        // ignore malformed cache
      }
    }
  }, [userId]);

  const markPartnerNoteRead = (id: string) => {
    setReadPartnerNoteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (userId && typeof window !== "undefined") {
        localStorage.setItem(
          `partner_read_notes_${userId}`,
          JSON.stringify([...next]),
        );
      }
      return next;
    });
  };

  // Composed shape the render below already expects, built live from the
  // real state above instead of one JSON blob.
  const partnerData = {
    hero: {
      title: profileData?.hero_title || "Welcome, Partner Organization!",
      subtitle: profileData?.hero_subtitle || "",
      stats: {
        activePartners: profileData?.stat_active_partners ?? 0,
        sharedResources: profileData?.stat_shared_resources ?? 0,
        activeReferrals: profileData?.stat_active_referrals ?? 0,
      },
    },
    metrics: {
      activeCollaborations: profileData?.metric_active_collaborations ?? 0,
      internshipsPosted: profileData?.metric_internships_posted ?? 0,
      studentPlacements: profileData?.metric_student_placements ?? 0,
    },
    collaborations,
    sharedResources: resources,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState<
    "collaboration" | "resource" | null
  >(null);
  const [tempFormData, setTempFormData] = useState<any>({});
  const [showPartnerProgramModal, setShowPartnerProgramModal] = useState(false);
  const [selectedPartnerProgram, setSelectedPartnerProgram] =
    useState<UserProgramRow | null>(null);

  // Debounce writes so typing in an edit field doesn't fire a Supabase
  // request on every keystroke - local state (above) updates instantly for
  // a responsive feel, the network write follows ~600ms after typing stops.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const debouncedWrite = (key: string, fn: () => Promise<void>) => {
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      fn().catch((err) => {
        console.error(`Failed to save (${key}):`, err);
        showToast("Failed to save that change.", "error");
      });
    }, 600);
  };

  // Hero/metrics edits funnel through here - collaborations/resources have
  // their own dedicated CRUD functions below that write straight to
  // Supabase instead.
  const savePartnerData = (newData: any) => {
    if (!userId) return;
    const fields = {
      hero_title: newData.hero.title,
      hero_subtitle: newData.hero.subtitle,
      stat_active_partners: newData.hero.stats.activePartners,
      stat_shared_resources: newData.hero.stats.sharedResources,
      stat_active_referrals: newData.hero.stats.activeReferrals,
      metric_active_collaborations: newData.metrics.activeCollaborations,
      metric_internships_posted: newData.metrics.internshipsPosted,
      metric_student_placements: newData.metrics.studentPlacements,
    };
    setProfileData((prev) => ({ ...(prev as PartnerProfileData), ...fields }));
    debouncedWrite("profile", () => savePartnerProfileData(userId, fields));
  };

  // Collaboration CRUD - real Supabase writes.
  const addCollaboration = async () => {
    if (!userId) return;
    try {
      await addPartnerCollaboration(userId, {
        title: tempFormData.title || "New Collaboration",
        description: tempFormData.description || "",
        link: tempFormData.link || "",
        project_type: tempFormData.project_type || undefined,
        org_type: tempFormData.org_type || undefined,
        hours_worked: tempFormData.hours_worked
          ? Number(tempFormData.hours_worked)
          : undefined,
        program_id: tempFormData.program_id || undefined,
      });
      setCollaborations(await getPartnerCollaborations(userId));
      setShowAddModal(null);
      setTempFormData({});
      showToast("Collaboration added successfully!", "success");
    } catch (err) {
      console.error("Failed to add collaboration:", err);
      showToast("Failed to add collaboration. Please try again.", "error");
    }
  };

  const updateCollaboration = (id: string, field: string, value: string) => {
    const storedValue: string | number | null =
      field === "hours_worked"
        ? value === ""
          ? null
          : Number(value)
        : field === "program_id"
          ? value === ""
            ? null
            : value
          : value;
    setCollaborations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: storedValue } : c)),
    );
    debouncedWrite(`collab-${id}-${field}`, () =>
      updatePartnerCollaboration(id, { [field]: storedValue } as any),
    );
  };

  const deleteCollaboration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collaboration?"))
      return;
    try {
      await deletePartnerCollaboration(id);
      setCollaborations((prev) => prev.filter((c) => c.id !== id));
      showToast("Collaboration deleted successfully!", "info");
    } catch (err) {
      console.error("Failed to delete collaboration:", err);
      showToast("Failed to delete. Please try again.", "error");
    }
  };

  // Resource CRUD - same pattern.
  const addResource = async () => {
    if (!userId) return;
    try {
      await addPartnerResource(userId, {
        title: tempFormData.title || "New Resource",
        description: tempFormData.description || "",
        type: tempFormData.type || "Available",
        link: tempFormData.link || "",
      });
      setResources(await getPartnerResources(userId));
      setShowAddModal(null);
      setTempFormData({});
      showToast("Resource added successfully!", "success");
    } catch (err) {
      console.error("Failed to add resource:", err);
      showToast("Failed to add resource. Please try again.", "error");
    }
  };

  const updateResource = (id: string, field: string, value: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
    debouncedWrite(`resource-${id}-${field}`, () =>
      updatePartnerResource(id, { [field]: value } as any),
    );
  };

  const deleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await deletePartnerResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      showToast("Resource deleted successfully!", "info");
    } catch (err) {
      console.error("Failed to delete resource:", err);
      showToast("Failed to delete. Please try again.", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Available":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Handle click on collaboration
  const handleCollaborationClick = (collab: any) => {
    if (collab.link && collab.link.startsWith("http")) {
      window.open(collab.link, "_blank");
    } else {
      showToast(`📋 ${collab.title}: ${collab.description}`, "info");
    }
  };

  // Handle click on resource
  const handleResourceClick = (resource: any) => {
    if (resource.link && resource.link.startsWith("http")) {
      window.open(resource.link, "_blank");
    } else {
      showToast(`📄 ${resource.title}: ${resource.description}`, "info");
    }
  };

  if (loadingPartnerData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            isEditing
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isEditing ? "✓ Done Editing" : "✎ Edit Dashboard"}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          {isEditing ? (
            <>
              <input
                type="text"
                value={partnerData.hero.title}
                onChange={(e) => {
                  const updated = { ...partnerData };
                  updated.hero.title = e.target.value;
                  savePartnerData(updated);
                }}
                className="text-3xl font-bold bg-transparent border-b border-white/30 focus:outline-none focus:border-white mb-2 w-full"
              />
              <input
                type="text"
                value={partnerData.hero.subtitle}
                onChange={(e) => {
                  const updated = { ...partnerData };
                  updated.hero.subtitle = e.target.value;
                  savePartnerData(updated);
                }}
                className="text-orange-100 bg-transparent border-b border-white/30 focus:outline-none focus:border-white w-full"
              />
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold">{partnerData.hero.title}</h2>
              <p className="text-orange-100 mt-2">
                {partnerData.hero.subtitle}
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <p className="text-sm opacity-90">Active Partners</p>
              {isEditing ? (
                <input
                  type="number"
                  value={partnerData.hero.stats.activePartners}
                  onChange={(e) => {
                    const updated = { ...partnerData };
                    updated.hero.stats.activePartners = parseInt(
                      e.target.value,
                    );
                    savePartnerData(updated);
                  }}
                  className="text-2xl font-bold bg-transparent w-20 border-b border-white/30"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {partnerData.hero.stats.activePartners}
                </p>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <p className="text-sm opacity-90">Shared Resources</p>
              {isEditing ? (
                <input
                  type="number"
                  value={partnerData.hero.stats.sharedResources}
                  onChange={(e) => {
                    const updated = { ...partnerData };
                    updated.hero.stats.sharedResources = parseInt(
                      e.target.value,
                    );
                    savePartnerData(updated);
                  }}
                  className="text-2xl font-bold bg-transparent w-20 border-b border-white/30"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {partnerData.hero.stats.sharedResources}
                </p>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <p className="text-sm opacity-90">Active Referrals</p>
              {isEditing ? (
                <input
                  type="number"
                  value={partnerData.hero.stats.activeReferrals}
                  onChange={(e) => {
                    const updated = { ...partnerData };
                    updated.hero.stats.activeReferrals = parseInt(
                      e.target.value,
                    );
                    savePartnerData(updated);
                  }}
                  className="text-2xl font-bold bg-transparent w-20 border-b border-white/30"
                />
              ) : (
                <p className="text-2xl font-bold">
                  {partnerData.hero.stats.activeReferrals}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            key: "activeCollaborations",
            label: "Active Collaborations",
            value: partnerData.metrics.activeCollaborations,
            icon: "🤝",
          },
          {
            key: "internshipsPosted",
            label: "Internships Posted",
            value: partnerData.metrics.internshipsPosted,
            icon: "💼",
          },
          {
            key: "studentPlacements",
            label: "Student Placements",
            value: partnerData.metrics.studentPlacements,
            icon: "🎓",
          },
        ].map((metric) => (
          <div
            key={metric.key}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{metric.icon}</span>
              {isEditing && (
                <button
                  onClick={() => {
                    const newValue = prompt(
                      `Enter new ${metric.label.toLowerCase()}:`,
                      String(metric.value),
                    );
                    if (newValue && !isNaN(Number(newValue))) {
                      const updated = {
                        ...partnerData.metrics,
                        [metric.key]: Number(newValue),
                      };
                      savePartnerData({ ...partnerData, metrics: updated });
                    }
                  }}
                  className="text-gray-400 hover:text-emerald-600 text-sm"
                >
                  ✎
                </button>
              )}
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-3">
              {metric.value.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Your Active Programs - the real programs this partner selected/was
          approved for at signup (user_programs), styled to match the
          mentee/entrepreneur "Your Active Programs" list so it's clear
          which programs collaborations below can be tied to. */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            📋 Your Active Programs
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Click on a program to view details
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {myPrograms.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No programs yet</p>
              <p className="text-xs mt-1">
                Contact Jody to get added to a program
              </p>
            </div>
          ) : (
            myPrograms.map((p) => {
              // Business Professional Services is auto-approved for every
              // account at signup - always show it as approved.
              const isApproved =
                p.approved || p.name === "Business Professional Services";
              return (
                <div
                  key={p.user_program_id}
                  onClick={() => {
                    setSelectedPartnerProgram(p);
                    setShowPartnerProgramModal(true);
                  }}
                  className="p-5 hover:bg-gray-50 transition-colors group relative cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                          {p.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : p.status === "Completed"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {p.status}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isApproved
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {isApproved && <Check className="h-3 w-3" />}
                          {isApproved ? "Approved" : "Pending approval"}
                        </span>
                      </div>
                      {p.start_date && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Started{" "}
                              {new Date(p.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Collaborations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              🤝 Active Collaborations
            </h3>
            {isEditing && (
              <button
                onClick={() => {
                  setTempFormData({});
                  setShowAddModal("collaboration");
                }}
                className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-200"
              >
                + Add Collaboration
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {partnerData.collaborations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Handshake className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No collaborations yet</p>
                {isEditing && (
                  <p className="text-xs mt-1">
                    Click "Add Collaboration" to create one
                  </p>
                )}
              </div>
            ) : (
              partnerData.collaborations.map((collab: any) => (
                <div key={collab.id} className="p-4 group relative">
                  {isEditing && (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        onClick={() => deleteCollaboration(collab.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  <div
                    onClick={() =>
                      !isEditing && handleCollaborationClick(collab)
                    }
                  >
                    {isEditing ? (
                      <>
                        <select
                          value={collab.program_id || ""}
                          onChange={(e) =>
                            updateCollaboration(
                              collab.id,
                              "program_id",
                              e.target.value,
                            )
                          }
                          className="text-xs border rounded px-2 py-1 w-full mb-1 bg-orange-50"
                        >
                          <option value="">No program linked</option>
                          {myPrograms.map((p) => (
                            <option key={p.program_id} value={p.program_id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={collab.title}
                          onChange={(e) =>
                            updateCollaboration(
                              collab.id,
                              "title",
                              e.target.value,
                            )
                          }
                          className="font-medium text-gray-800 border rounded px-2 py-1 text-sm w-full mb-1"
                        />
                        <textarea
                          value={collab.description || ""}
                          onChange={(e) =>
                            updateCollaboration(
                              collab.id,
                              "description",
                              e.target.value,
                            )
                          }
                          className="text-xs text-gray-500 border rounded px-2 py-1 w-full mt-1"
                          rows={2}
                        />
                        <input
                          type="text"
                          value={collab.link || ""}
                          onChange={(e) =>
                            updateCollaboration(
                              collab.id,
                              "link",
                              e.target.value,
                            )
                          }
                          placeholder="Link URL"
                          className="text-xs text-orange-600 border rounded px-2 py-1 w-full mt-1"
                        />
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          <select
                            value={collab.project_type || ""}
                            onChange={(e) =>
                              updateCollaboration(
                                collab.id,
                                "project_type",
                                e.target.value,
                              )
                            }
                            className="text-xs border rounded px-1 py-1"
                          >
                            <option value="">Project type...</option>
                            {PARTNER_PROJECT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <select
                            value={collab.org_type || ""}
                            onChange={(e) =>
                              updateCollaboration(
                                collab.id,
                                "org_type",
                                e.target.value,
                              )
                            }
                            className="text-xs border rounded px-1 py-1"
                          >
                            <option value="">Org type...</option>
                            {PARTNER_ORG_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={collab.hours_worked ?? ""}
                            onChange={(e) =>
                              updateCollaboration(
                                collab.id,
                                "hours_worked",
                                e.target.value,
                              )
                            }
                            placeholder="Hours"
                            className="text-xs border rounded px-1 py-1 w-full"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {collab.program_id && (
                          <span className="inline-block text-[11px] font-medium bg-orange-600 text-white px-2 py-0.5 rounded-full mb-1">
                            {myPrograms.find(
                              (p) => p.program_id === collab.program_id,
                            )?.name || "Program"}
                          </span>
                        )}
                        <p className="font-medium text-gray-800">
                          {collab.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {collab.description}
                        </p>
                        {(collab.project_type ||
                          collab.org_type ||
                          collab.hours_worked) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {collab.project_type && (
                              <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                                {collab.project_type}
                              </span>
                            )}
                            {collab.org_type && (
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {collab.org_type}
                              </span>
                            )}
                            {collab.hours_worked ? (
                              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {collab.hours_worked} hrs
                              </span>
                            ) : null}
                          </div>
                        )}
                        <div className="flex items-center justify-end mt-2">
                          <span className="text-xs text-orange-600 cursor-pointer hover:text-orange-700">
                            View Details →
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shared Resources */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">📚 Shared Resources</h3>
            {isEditing && (
              <button
                onClick={() => {
                  setTempFormData({});
                  setShowAddModal("resource");
                }}
                className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-lg hover:bg-orange-200"
              >
                + Add Resource
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {partnerData.sharedResources.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No resources yet</p>
                {isEditing && (
                  <p className="text-xs mt-1">
                    Click "Add Resource" to create one
                  </p>
                )}
              </div>
            ) : (
              partnerData.sharedResources.map((resource: any) => (
                <div key={resource.id} className="p-4 group relative">
                  {isEditing && (
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        onClick={() => deleteResource(resource.id)}
                        className="text-xs text-red-500 hover:text-red-700 p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  <div
                    onClick={() => !isEditing && handleResourceClick(resource)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={resource.title}
                              onChange={(e) =>
                                updateResource(
                                  resource.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                              className="font-medium text-gray-800 border rounded px-2 py-1 text-sm w-full mb-1"
                            />
                            <input
                              type="text"
                              value={resource.description || ""}
                              onChange={(e) =>
                                updateResource(
                                  resource.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="text-xs text-gray-500 border rounded px-2 py-1 w-full"
                            />
                            <input
                              type="text"
                              value={resource.link || ""}
                              onChange={(e) =>
                                updateResource(
                                  resource.id,
                                  "link",
                                  e.target.value,
                                )
                              }
                              placeholder="Link URL"
                              className="text-xs text-orange-600 border rounded px-2 py-1 w-full mt-1"
                            />
                            <select
                              value={resource.type}
                              onChange={(e) =>
                                updateResource(
                                  resource.id,
                                  "type",
                                  e.target.value,
                                )
                              }
                              className="text-xs border rounded px-2 py-1 mt-1"
                            >
                              <option value="Available">Available</option>
                              <option value="Pending">Pending</option>
                            </select>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-gray-800">
                              {resource.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {resource.description}
                            </p>
                            <span
                              className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getStatusColor(resource.type)}`}
                            >
                              {resource.type}
                            </span>
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <span className="ml-4 text-xs text-orange-600 cursor-pointer hover:text-orange-700">
                          {resource.type === "Available"
                            ? "View →"
                            : "Request →"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Notes from Admin Section - Partner. Real admin_notes table (same
          one the admin dashboard's Notes tab writes to), filtered to
          broadcasts addressed to "all" or "partner". Replaces the old
          version which depended on a dead localStorage("currentUser")
          effect and so was always empty for real logged-in users. */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                📬 Notes from Admin
              </h3>
            </div>
            {partnerAdminNotes.length > 0 && (
              <button
                onClick={() => setShowAllPartnerNotes(!showAllPartnerNotes)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllPartnerNotes
                  ? "Show Less"
                  : `View All (${partnerAdminNotes.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="p-5 space-y-3">
          {partnerAdminNotes.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No notes from admin yet.</p>
              <p className="text-xs text-gray-400">
                Updates and announcements will appear here.
              </p>
            </div>
          ) : (
            (showAllPartnerNotes
              ? partnerAdminNotes
              : partnerAdminNotes.slice(0, 3)
            ).map((note) => {
              const isRead = readPartnerNoteIds.has(note.id);
              return (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    isRead ? "bg-gray-50" : "bg-blue-50 border border-blue-200"
                  }`}
                  onClick={() => !isRead && markPartnerNoteRead(note.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-700">
                        {note.subject}
                      </span>
                      {!isRead && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{linkifyText(note.message)}</p>
                  {note.sent_by && (
                    <p className="text-xs text-gray-400 mt-1">
                      From: {note.sent_by}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Zoom Meeting Section - Partner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Join Your Meeting</h3>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-3">
            Enter your Zoom meeting ID and passcode to join your session
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Zoom Meeting ID
              </label>
              <input
                type="text"
                id="partnerZoomMeetingId"
                placeholder="e.g., 123 456 7890"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Passcode (optional)
              </label>
              <input
                type="text"
                id="partnerZoomPassword"
                placeholder="Enter Zoom passcode"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const meetingId = (
                document.getElementById(
                  "partnerZoomMeetingId",
                ) as HTMLInputElement
              )?.value;
              const password = (
                document.getElementById(
                  "partnerZoomPassword",
                ) as HTMLInputElement
              )?.value;

              if (!meetingId || meetingId.trim() === "") {
                showToast("Please enter your Zoom Meeting ID", "error");
                return;
              }

              const cleanMeetingId = meetingId.trim().replace(/\s/g, "");
              let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
              if (password && password.trim() !== "") {
                zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
              }

              window.open(zoomUrl, "_blank");
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Video className="h-4 w-4" />
            Join Zoom Meeting
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            Tip: Your meeting host should provide the Meeting ID and passcode
          </p>
        </div>
      </div>

      <RoundtableJoinCard
        profileName={profile?.name ?? ""}
        profileEmail={profile?.email ?? ""}
        showToast={showToast}
      />

      {/* Support Section */}
      <div
        onClick={() =>
          window.open(
            "mailto:jody@hbcat.org?subject=Partner Support Request",
            "_blank",
          )
        }
        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100 cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
              <MessageCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Need partnership support?
              </h3>
              <p className="text-sm text-gray-600">
                Contact Jody for collaboration opportunities
              </p>
            </div>
          </div>
          <button className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700">
            Contact Support →
          </button>
        </div>
      </div>

      {/* Add Collaboration Modal */}
      {showAddModal === "collaboration" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Collaboration
              </h2>
              <button
                onClick={() => setShowAddModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <select
                value={tempFormData.program_id || ""}
                onChange={(e) =>
                  setTempFormData({
                    ...tempFormData,
                    program_id: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 bg-orange-50"
              >
                <option value="">
                  {myPrograms.length === 0
                    ? "No programs on your account yet"
                    : "Which program is this for? (optional)"}
                </option>
                {myPrograms.map((p) => (
                  <option key={p.program_id} value={p.program_id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Collaboration Title"
                value={tempFormData.title || ""}
                onChange={(e) =>
                  setTempFormData({ ...tempFormData, title: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
              <textarea
                placeholder="Description"
                value={tempFormData.description || ""}
                onChange={(e) =>
                  setTempFormData({
                    ...tempFormData,
                    description: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
              <input
                type="text"
                placeholder="Link URL (optional)"
                value={tempFormData.link || ""}
                onChange={(e) =>
                  setTempFormData({ ...tempFormData, link: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={tempFormData.project_type || ""}
                  onChange={(e) =>
                    setTempFormData({
                      ...tempFormData,
                      project_type: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Project type (optional)</option>
                  {PARTNER_PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={tempFormData.org_type || ""}
                  onChange={(e) =>
                    setTempFormData({
                      ...tempFormData,
                      org_type: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Org type (optional)</option>
                  {PARTNER_ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                placeholder="Hours worked (optional)"
                value={tempFormData.hours_worked || ""}
                onChange={(e) =>
                  setTempFormData({
                    ...tempFormData,
                    hours_worked: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(null)}
                className="flex-1 py-2 border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addCollaboration}
                disabled={!tempFormData.title}
                className="flex-1 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal === "resource" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Add Resource
              </h2>
              <button
                onClick={() => setShowAddModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                placeholder="Resource Title"
                value={tempFormData.title || ""}
                onChange={(e) =>
                  setTempFormData({ ...tempFormData, title: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={tempFormData.description || ""}
                onChange={(e) =>
                  setTempFormData({
                    ...tempFormData,
                    description: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="text"
                placeholder="Link URL (optional)"
                value={tempFormData.link || ""}
                onChange={(e) =>
                  setTempFormData({ ...tempFormData, link: e.target.value })
                }
                className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(null)}
                className="flex-1 py-2 border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addResource}
                disabled={!tempFormData.title}
                className="flex-1 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Details Modal - same design as the mentee/entrepreneur
          version, minus the Tracking/Sessions tabs since those are scoped
          to a participant record partners don't have. */}
      {showPartnerProgramModal && selectedPartnerProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedPartnerProgram.name}
                </h2>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedPartnerProgram.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : selectedPartnerProgram.status === "Completed"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedPartnerProgram.status}
                  </span>
                  {selectedPartnerProgram.approved ||
                  selectedPartnerProgram.name === "Business Professional Services" ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Approved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      Pending approval
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPartnerProgramModal(false);
                  setSelectedPartnerProgram(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {selectedPartnerProgram.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    About This Program
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedPartnerProgram.description}
                  </p>
                </div>
              )}

              {(selectedPartnerProgram.start_date ||
                selectedPartnerProgram.end_date) && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {selectedPartnerProgram.start_date &&
                    `Started ${new Date(selectedPartnerProgram.start_date).toLocaleDateString()}`}
                  {selectedPartnerProgram.start_date &&
                    selectedPartnerProgram.end_date &&
                    " · "}
                  {selectedPartnerProgram.end_date &&
                    `Ends ${new Date(selectedPartnerProgram.end_date).toLocaleDateString()}`}
                </div>
              )}

              {(selectedPartnerProgram.contact_email ||
                selectedPartnerProgram.contact_phone) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    Program Contact
                  </h4>
                  {selectedPartnerProgram.contact_email && (
                    <button
                      onClick={() =>
                        (window.location.href = `mailto:${selectedPartnerProgram.contact_email}`)
                      }
                      className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-orange-50 transition-colors border border-gray-100 text-left"
                    >
                      <Mail className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {selectedPartnerProgram.contact_email}
                      </span>
                    </button>
                  )}
                  {selectedPartnerProgram.contact_phone && (
                    <button
                      onClick={() =>
                        (window.location.href = `tel:${selectedPartnerProgram.contact_phone}`)
                      }
                      className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-orange-50 transition-colors border border-gray-100 text-left"
                    >
                      <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {selectedPartnerProgram.contact_phone}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ROLE-BASED DASHBOARD CONTENT
// ============================================
function RoleBasedDashboardContent({
  showToast,
  router,
  authProfile,
}: {
  showToast: (msg: string, type: any) => void;
  router: any;
  authProfile?: { name?: string; email?: string; primaryRole?: string } | null;
}) {
  // ALL hooks at top level - no conditional hooks!
  const [viewMode, setViewMode] = useState<string>("default");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programModalTab, setProgramModalTab] = useState<
    "overview" | "tracking" | "sessions" | "resources"
  >("overview");
  const [programTracking, setProgramTracking] =
    useState<ProgramTrackingRow | null>(null);
  const [programResources, setProgramResources] = useState<
    ProgramResourceRow[]
  >([]);
  const [programSessions, setProgramSessions] = useState<MenteeSessionRow[]>(
    [],
  );
  const [loadingProgramDetails, setLoadingProgramDetails] = useState(false);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [totalGoals, setTotalGoals] = useState(0);
  const [showAllNotesModal, setShowAllNotesModal] = useState(false);

  // Redirect state - handle redirects without useEffect
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  // useEffect to check for view parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "entrepreneur") {
      setViewMode("entrepreneur");
    }
  }, []);

  // Handle redirects in a single useEffect - at the top level
  useEffect(() => {
    if (shouldRedirect) {
      router.push(shouldRedirect);
    }
  }, [shouldRedirect, router]);

  // Real mentor stats (Hours This Month / Earnings) for the purple welcome
  // banner - computed from the real mentee_sessions + mentors tables rather
  // than hardcoded, so it updates as the mentor logs sessions.
  const [mentorMonthlyStats, setMentorMonthlyStats] = useState<{
    hoursThisMonth: number;
    earnings: number;
    loading: boolean;
  }>({ hoursThisMonth: 0, earnings: 0, loading: true });

  // Real mentees + upcoming sessions for the quick-view cards below the
  // purple banner - replaces the hardcoded Sarah Johnson / Michael Martinez /
  // "3 active mentees" placeholders that used to live there.
  const [realMentees, setRealMentees] = useState<
    { id: string; name: string }[]
  >([]);
  const [upcomingSessions, setUpcomingSessions] = useState<
    { id: string; menteeId: string; menteeName: string; date: string; topic: string }[]
  >([]);

  // "Notes for Mentees and Entrepreneurs" - lets the mentor write a note to
  // one mentee or all of them, reusing the same mentee_notes table that
  // already powers "Notes from Your Mentor" on the mentee's own dashboard.
  const [menteeNoteTarget, setMenteeNoteTarget] = useState("all");
  const [menteeNoteMessage, setMenteeNoteMessage] = useState("");
  const [sendingMenteeNote, setSendingMenteeNote] = useState(false);
  const [mentorSentNotes, setMentorSentNotes] = useState<
    { id: string; note: string; created_at: string; menteeName: string }[]
  >([]);

  const loadMentorSentNotes = async (
    menteesList: { id: string; name: string }[],
  ) => {
    if (menteesList.length === 0) {
      setMentorSentNotes([]);
      return;
    }
    try {
      const notes = await getNotesForParticipants(
        menteesList.map((m) => m.id),
      );
      const menteeById = Object.fromEntries(
        menteesList.map((m) => [m.id, m]),
      );
      setMentorSentNotes(
        notes.map((n) => ({
          id: n.id,
          note: n.note,
          created_at: n.created_at,
          menteeName:
            (n.participant_id && menteeById[n.participant_id]?.name) ||
            "Unknown mentee",
        })),
      );
    } catch (err) {
      console.error("Failed to load sent mentee notes:", err);
    }
  };

  const sendMenteeNote = async () => {
    if (!menteeNoteMessage.trim() || !authProfile?.name) return;
    setSendingMenteeNote(true);
    try {
      const targets =
        menteeNoteTarget === "all"
          ? realMentees
          : realMentees.filter((m) => m.id === menteeNoteTarget);
      await Promise.all(
        targets.map((m) =>
          addMenteeNote(m.id, menteeNoteMessage.trim(), authProfile.name!),
        ),
      );
      setMenteeNoteMessage("");
      showToast("Note sent!", "success");
      await loadMentorSentNotes(realMentees);
    } catch (err) {
      console.error("Failed to send mentee note:", err);
      showToast("Failed to send note. Please try again.", "error");
    } finally {
      setSendingMenteeNote(false);
    }
  };

  useEffect(() => {
    if (authProfile?.primaryRole !== "mentor" || !authProfile?.email) {
      return;
    }
    let cancelled = false;

    const loadMentorStats = async () => {
      try {
        const mentorRow = await getMentorProfileByEmail(authProfile.email!);
        if (!mentorRow) {
          if (!cancelled) setMentorMonthlyStats((s) => ({ ...s, loading: false }));
          return;
        }

        const [sessions, realMentees] = await Promise.all([
          getAllSessionsForMentor(mentorRow.name),
          getMenteesForMentor(mentorRow.name),
        ]);

        const now = new Date();
        const thisMonthMinutes = sessions
          .filter((s) => {
            const d = new Date(s.date);
            return (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth()
            );
          })
          .reduce((sum, s) => sum + (s.duration || 0), 0);

        const hours = thisMonthMinutes / 60;
        const earnings = hours * (mentorRow.hourly_rate || 0);

        if (!cancelled) {
          setMentorMonthlyStats({
            hoursThisMonth: Math.round(hours * 10) / 10,
            earnings: Math.round(earnings),
            loading: false,
          });

          setRealMentees(
            realMentees.map((m) => ({ id: m.id, name: m.name ?? "" })),
          );

          const menteeById = Object.fromEntries(
            realMentees.map((m) => [m.id, m]),
          );
          const todayStr = now.toISOString().split("T")[0];
          const upcoming = sessions
            .filter((s) => s.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 2)
            .map((s) => ({
              id: s.id,
              menteeId: s.participant_id || "",
              menteeName:
                (s.participant_id && menteeById[s.participant_id]?.name) ||
                "Unknown mentee",
              date: s.date,
              topic: s.topic || "Mentoring session",
            }));
          setUpcomingSessions(upcoming);

          const menteeList = realMentees.map((m) => ({
            id: m.id,
            name: m.name ?? "",
          }));
          await loadMentorSentNotes(menteeList);
        }
      } catch (err) {
        console.error("Failed to load mentor monthly stats:", err);
        if (!cancelled) setMentorMonthlyStats((s) => ({ ...s, loading: false }));
      }
    };

    loadMentorStats();

    // Keep in sync with real-time changes to sessions/mentor rate, same
    // pattern as subscribeToMenteeData elsewhere in the app.
    const channelName = `mentor-monthly-stats-${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentee_sessions" },
        loadMentorStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentors" },
        loadMentorStats,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentee_notes" },
        loadMentorStats,
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [authProfile?.primaryRole, authProfile?.email]);

  // Real "my mentor" + "notes from my mentor" for the entrepreneur/mentee
  // view - resolved via this user's own participants row (which carries the
  // assigned mentor's name), replacing the old localStorage("mentor_profile_data")
  // blob, which wasn't even personalized - every mentee saw whichever
  // mentor last saved their settings.
  const [myMentorProfile, setMyMentorProfile] = useState<{
    name: string;
    email: string;
    phone: string;
    bio: string;
    expertise: string[];
  } | null>(null);
  const [myMentorNotes, setMyMentorNotes] = useState<
    { id: string; note: string; author: string; date: string }[]
  >([]);
  const [loadingMyMentor, setLoadingMyMentor] = useState(true);
  // This user's own participants.id - the real key used to fetch their
  // goals (mentee_goals) and, later, their program enrollments
  // (user_programs). Resolved once here and reused everywhere else so we
  // don't re-derive it in multiple places.
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [myGoalsPreview, setMyGoalsPreview] = useState<
    { id: string; title: string; due_date: string | null; completed: boolean }[]
  >([]);
  // This participant's rating of their current mentor (mentor_ratings) -
  // one updatable rating per participant/mentor pair. Displayed on the
  // "Satisfaction Rating" dashboard tile and the "Your Mentor" card;
  // actually set on the dedicated /feedback page.
  const [myMentorRating, setMyMentorRating] = useState<number | null>(null);

  useEffect(() => {
    const role = authProfile?.primaryRole;
    if (!authProfile?.email || (role !== "entrepreneur" && role !== "mentee")) {
      setLoadingMyMentor(false);
      return;
    }
    let cancelled = false;

    const loadMyMentorAndNotes = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) {
          if (!cancelled) setLoadingMyMentor(false);
          return;
        }
        // Program enrollments (user_programs) are keyed directly off the
        // auth user, independent of whether a participants row exists -
        // fetch them regardless of the mentor/goals lookup below.
        getProgramsForUser(userId)
          .then((programs) => {
            if (!cancelled) {
              setMyPrograms(programs);
              setMyProgramsError(null);
            }
          })
          .catch((err) => {
            console.error("Failed to load programs:", err);
            if (!cancelled) {
              setMyProgramsError(
                err?.message || "Couldn't load your programs.",
              );
            }
          });

        const records = await getParticipantRecordsForUser(
          userId,
          authProfile.email!,
        );
        if (!cancelled) setMyParticipantRecords(records);
        const myRecord = records.find((r) => r.mentor) || records[0] || null;

        if (!myRecord) {
          if (!cancelled) {
            setMyParticipantId(null);
            setGoalsCompleted(0);
            setTotalGoals(0);
            setMyGoalsPreview([]);
            setLoadingMyMentor(false);
          }
          return;
        }

        if (!cancelled) setMyParticipantId(myRecord.id);

        const [notes, mentorRow, goals, myRating] = await Promise.all([
          getNotesForParticipant(myRecord.id),
          myRecord.mentor
            ? getMentorProfileByName(myRecord.mentor)
            : Promise.resolve(null),
          getGoalsForParticipant(myRecord.id),
          myRecord.mentor
            ? getMentorRatingForParticipant(myRecord.id, myRecord.mentor)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setMyMentorRating(myRating?.rating ?? null);

        setMyMentorNotes(
          notes.map((n) => ({
            id: n.id,
            note: n.note,
            author: n.author || myRecord.mentor || "Your mentor",
            date: n.created_at,
          })),
        );

        if (mentorRow) {
          setMyMentorProfile({
            name: mentorRow.name,
            email: mentorRow.email || "",
            phone: mentorRow.phone || "",
            bio: mentorRow.bio || "",
            expertise: mentorRow.expertise || [],
          });
        }

        setGoalsCompleted(goals.filter((g) => g.completed).length);
        setTotalGoals(goals.length);
        setMyGoalsPreview(
          goals.slice(0, 3).map((g) => ({
            id: g.id,
            title: g.title,
            due_date: g.due_date,
            completed: g.completed,
          })),
        );

        setLoadingMyMentor(false);
      } catch (err) {
        console.error("Failed to load mentor/notes:", err);
        if (!cancelled) setLoadingMyMentor(false);
      }
    };

    loadMyMentorAndNotes();

    const unsubscribe = subscribeToMenteeData(loadMyMentorAndNotes);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [authProfile?.primaryRole, authProfile?.email]);

  // Entrepreneur/mentee program enrollments - real data from the
  // programs + user_programs tables (see getProgramsForUser), loaded in
  // the loadMyMentorAndNotes effect below alongside goals/mentor/notes.
  // Replaces the old localStorage("entrepreneur_programs_data") blob and
  // its full add/edit/delete CRUD, which had no real backing table for
  // arbitrary user-created programs - programs are admin-managed and
  // users are enrolled into them, not authors of them.
  const [myPrograms, setMyPrograms] = useState<UserProgramRow[]>([]);
  const [myProgramsError, setMyProgramsError] = useState<string | null>(null);
  const [myParticipantRecords, setMyParticipantRecords] = useState<
    MyParticipantRow[]
  >([]);

  // Fetch this program's real details whenever the program modal opens -
  // admin-entered tracking numbers, admin-managed resources, and this
  // user's own mentoring sessions (matched to the program via their
  // participants row's program_name, since mentee_sessions is keyed by
  // participant, not directly by program).
  useEffect(() => {
    if (!showProgramModal || !selectedProgram) return;
    let cancelled = false;
    setProgramModalTab("overview");
    setLoadingProgramDetails(true);

    const matchingRecord = myParticipantRecords.find(
      (r) => r.program_name === selectedProgram.name,
    );

    Promise.all([
      // Tracking is per (program, participant) - budget/grants/outcomes
      // are specific to this person, so we need their own participant
      // record matched to this program, not just the program id.
      matchingRecord
        ? getProgramTracking(
            selectedProgram.program_id,
            matchingRecord.id,
          ).catch(() => null)
        : Promise.resolve(null),
      getProgramResources(selectedProgram.program_id).catch(() => []),
      matchingRecord
        ? getSessionsForParticipant(matchingRecord.id).catch(() => [])
        : Promise.resolve([]),
    ]).then(([tracking, resources, sessions]) => {
      if (cancelled) return;
      setProgramTracking(tracking);
      setProgramResources(resources);
      setProgramSessions(sessions);
      setLoadingProgramDetails(false);
    });

    return () => {
      cancelled = true;
    };
  }, [showProgramModal, selectedProgram, myParticipantRecords]);

  // Real "Notes from Admin" for Mentor - same admin_notes table/realtime
  // the admin dashboard's own Notes tab uses (mirrors the Partner
  // dashboard's setup), filtered to broadcasts addressed to "all" or
  // "mentor". Read/unread is tracked client-side only (this table has no
  // per-recipient row to mark read against), scoped per signed-in user's
  // email. Replaces the old version, which depended on a dead
  // localStorage("currentUser") effect and so was always empty for real
  // logged-in users.
  const [mentorAdminNotes, setMentorAdminNotes] = useState<AdminNoteRow[]>([]);
  const [showAllMentorNotes, setShowAllMentorNotes] = useState(false);
  const [readMentorNoteIds, setReadMentorNoteIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (authProfile?.primaryRole !== "mentor") return;
    const loadNotes = async () => {
      try {
        const all = await getAdminNotes();
        setMentorAdminNotes(
          all.filter(
            (n) => n.recipient_type === "all" || n.recipient_type === "mentor",
          ),
        );
      } catch (err) {
        console.error("Failed to load admin notes:", err);
      }
    };
    loadNotes();
    const unsubscribe = subscribeToAdminNotes(loadNotes);
    return unsubscribe;
  }, [authProfile?.primaryRole]);

  useEffect(() => {
    if (!authProfile?.email || typeof window === "undefined") return;
    const saved = localStorage.getItem(
      `mentor_read_notes_${authProfile.email}`,
    );
    if (saved) {
      try {
        setReadMentorNoteIds(new Set(JSON.parse(saved)));
      } catch {
        // ignore malformed cache
      }
    }
  }, [authProfile?.email]);

  const markMentorNoteRead = (id: string) => {
    setReadMentorNoteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (authProfile?.email && typeof window !== "undefined") {
        localStorage.setItem(
          `mentor_read_notes_${authProfile.email}`,
          JSON.stringify([...next]),
        );
      }
      return next;
    });
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  // Sync the real, Supabase-authenticated profile (passed down from
  // DashboardPage) into local state. The effect above only reads the old
  // localStorage("currentUser") key, which nothing sets anymore now that
  // login/signup use real Supabase auth - without this, profile stays null
  // and every user sees the generic "User" / entrepreneur fallback below,
  // regardless of their real name or role.
  useEffect(() => {
    if (authProfile?.email) {
      setProfile((prev: any) => ({
        ...(prev || {}),
        name: authProfile.name || prev?.name,
        email: authProfile.email,
        primaryRole:
          authProfile.primaryRole || prev?.primaryRole || "entrepreneur",
      }));
    }
  }, [authProfile?.name, authProfile?.email, authProfile?.primaryRole]);

  //  Check for redirects in a useEffect that always runs
  useEffect(() => {
    const role = profile?.primaryRole || "entrepreneur";
    const currentRole =
      role === "mentee" && viewMode === "entrepreneur" ? "entrepreneur" : role;

    if (currentRole === "program_manager") {
      setShouldRedirect("/program-manager/dashboard");
    } else {
      setShouldRedirect(null);
    }
  }, [profile, viewMode]);

  // Handle the redirect in the render
  if (shouldRedirect) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Get the role from profile
  let role = profile?.primaryRole || "entrepreneur";

  // If user is mentee and viewMode is entrepreneur, show entrepreneur view
  const effectiveRole =
    role === "mentee" && viewMode === "entrepreneur" ? "entrepreneur" : role;

  // Coalition Dashboard
  if (effectiveRole === "coalition") {
    return (
      <CoalitionDashboard
        showToast={showToast}
        router={router}
        profile={profile}
      />
    );
  }

  // Partner Dashboard
  if (effectiveRole === "partner") {
    return (
      <PartnerDashboard
        showToast={showToast}
        router={router}
        profile={profile}
      />
    );
  }
  //================================
  // Program Manager Dashboard
  //================================
  if (effectiveRole === "program_manager") {
    // ✅ CORRECT: No hooks here, just show loading
    // The redirect is handled by the useEffect above
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        <p className="text-sm text-gray-500 ml-3">
          Redirecting to Program Manager Dashboard...
        </p>
      </div>
    );
  }

  // Mentor Dashboard
  if (effectiveRole === "mentor") {
    const mentees = [
      {
        id: "1",
        name: "Sarah Johnson",
        program: "Business Catalyst Program",
        sessionsCompleted: 4,
        nextTopic: "Business Plan Review",
        nextDate: "Today, 2:00 PM",
      },
      {
        id: "2",
        name: "Michael Martinez",
        program: "Business Catalyst Program",
        sessionsCompleted: 3,
        nextTopic: "Marketing Strategy",
        nextDate: "Tomorrow, 11:00 AM",
      },
      {
        id: "3",
        name: "Emily Brown",
        program: "Women Entrepreneurs Program",
        sessionsCompleted: 5,
        nextTopic: "Financial Projections",
        nextDate: "Not scheduled",
      },
    ];

    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">
              Welcome, {profile?.name?.split(" ")[0] || "Mentor"}! 👨‍🏫
            </h2>
            <p className="text-blue-100 mt-2">
              Your guidance is transforming lives
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Active Mentees</p>
                <p className="text-2xl font-bold">{realMentees.length}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Hours This Month</p>
                <p className="text-2xl font-bold">
                  {mentorMonthlyStats.loading
                    ? "…"
                    : mentorMonthlyStats.hoursThisMonth}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Earnings</p>
                <p className="text-2xl font-bold">
                  {mentorMonthlyStats.loading
                    ? "…"
                    : `$${mentorMonthlyStats.earnings}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => router.push("/mentor/dashboard")}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Your Mentees</h3>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {realMentees.length} active
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {realMentees.length}
                  </p>
                  <p className="text-sm text-gray-500">Active Mentees</p>
                  <p className="text-xs text-emerald-600 mt-1">View all →</p>
                </div>
                {realMentees.length > 0 && (
                  <div className="flex -space-x-2">
                    {realMentees.slice(0, 3).map((mentee, idx) => {
                      const initials = mentee.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")
                        .toUpperCase();
                      const colors = [
                        { bg: "bg-emerald-100", text: "text-emerald-700" },
                        { bg: "bg-blue-100", text: "text-blue-700" },
                        { bg: "bg-purple-100", text: "text-purple-700" },
                      ][idx % 3];
                      return (
                        <div
                          key={mentee.id}
                          className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-xs font-bold ${colors.text} ring-2 ring-white`}
                        >
                          {initials || "?"}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">
                  Upcoming Sessions
                </h3>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingSessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No upcoming sessions logged yet.
                </div>
              ) : (
                upcomingSessions.map((session, idx) => {
                  const initials = session.menteeName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  const colors = [
                    { bg: "bg-emerald-100", text: "text-emerald-600" },
                    { bg: "bg-purple-100", text: "text-purple-600" },
                  ][idx % 2];

                  const sessionDate = new Date(session.date + "T00:00:00");
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  let whenLabel = sessionDate.toLocaleDateString();
                  if (sessionDate.getTime() === today.getTime()) {
                    whenLabel = "Today";
                  } else if (sessionDate.getTime() === tomorrow.getTime()) {
                    whenLabel = "Tomorrow";
                  }

                  return (
                    <div className="p-4" key={session.id}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}
                        >
                          <span
                            className={`text-sm font-bold ${colors.text}`}
                          >
                            {initials || "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {session.menteeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {whenLabel} - {session.topic}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            router.push(
                              `/mentor/settings?mentee=${session.menteeId}&tab=sessions`,
                            )
                          }
                          className="text-xs text-emerald-600 hover:text-emerald-700"
                        >
                          Log Session →
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Session Logging</h3>
                <p className="text-sm text-gray-600">
                  Track your mentoring hours for payment ($50/hr)
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/mentor/settings?tab=sessions")}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              + Log New Session
            </button>
          </div>
        </div>

        {/* Zoom Meeting Section - Mentor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Join Your Mentoring Session
              </h3>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 mb-3">
              Enter your Zoom meeting ID and passcode to join your session
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Zoom Meeting ID
                </label>
                <input
                  type="text"
                  id="mentorZoomMeetingId"
                  placeholder="e.g., 123 456 7890"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Passcode (optional)
                </label>
                <input
                  type="text"
                  id="mentorZoomPassword"
                  placeholder="Enter Zoom passcode"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => {
                const meetingId = (
                  document.getElementById(
                    "mentorZoomMeetingId",
                  ) as HTMLInputElement
                )?.value;
                const password = (
                  document.getElementById(
                    "mentorZoomPassword",
                  ) as HTMLInputElement
                )?.value;

                if (!meetingId || meetingId.trim() === "") {
                  showToast("Please enter your Zoom Meeting ID", "error");
                  return;
                }

                const cleanMeetingId = meetingId.trim().replace(/\s/g, "");
                let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
                if (password && password.trim() !== "") {
                  zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
                }

                window.open(zoomUrl, "_blank");
              }}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Video className="h-4 w-4" />
              Join Zoom Meeting
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              💡 Tip: Your meeting host should provide the Meeting ID and
              passcode
            </p>
          </div>
        </div>

        {/* Notes for Mentees and Entrepreneurs - Mentor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-gray-900">
                📬 Notes for Mentees and Entrepreneurs
              </h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Send an update or encouragement to a mentee or all of them at
              once
            </p>
          </div>
          <div className="p-5 space-y-4">
            {realMentees.length === 0 ? (
              <p className="text-sm text-gray-400">
                You don't have any mentees assigned yet, so there's no one to
                send a note to.
              </p>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-3">
                  <select
                    value={menteeNoteTarget}
                    onChange={(e) => setMenteeNoteTarget(e.target.value)}
                    className="w-full md:w-56 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="all">All My Mentees</option>
                    {realMentees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={menteeNoteMessage}
                    onChange={(e) => setMenteeNoteMessage(e.target.value)}
                    placeholder="Write your note here..."
                    rows={2}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  onClick={sendMenteeNote}
                  disabled={sendingMenteeNote || !menteeNoteMessage.trim()}
                  className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50"
                >
                  {sendingMenteeNote ? "Sending..." : "Send Note"}
                </button>
              </>
            )}

            {mentorSentNotes.length > 0 && (
              <div className="divide-y divide-gray-100 border-t border-gray-100 pt-3 mt-2">
                {mentorSentNotes.slice(0, 5).map((note) => (
                  <div key={note.id} className="py-3 first:pt-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        To: {note.menteeName}
                      </span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
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
        </div>

        {/* Notes from Admin Section - Mentor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  📬 Notes from Admin
                </h3>
              </div>
              {mentorAdminNotes.length > 0 && (
                <button
                  onClick={() => setShowAllMentorNotes(!showAllMentorNotes)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showAllMentorNotes
                    ? "Show Less"
                    : `View All (${mentorAdminNotes.length})`}
                </button>
              )}
            </div>
          </div>
          <div className="p-5 space-y-3">
            {mentorAdminNotes.length === 0 ? (
              <div className="text-center py-6">
                <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  No notes from admin yet.
                </p>
                <p className="text-xs text-gray-400">
                  Updates and announcements will appear here.
                </p>
              </div>
            ) : (
              (showAllMentorNotes
                ? mentorAdminNotes
                : mentorAdminNotes.slice(0, 3)
              ).map((note) => {
                const isRead = readMentorNoteIds.has(note.id);
                return (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg transition-colors cursor-pointer ${
                      isRead ? "bg-gray-50" : "bg-blue-50 border border-blue-200"
                    }`}
                    onClick={() => !isRead && markMentorNoteRead(note.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-blue-700">
                          {note.subject}
                        </span>
                        {!isRead && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{linkifyText(note.message)}</p>
                    {note.sent_by && (
                      <p className="text-xs text-gray-400 mt-1">
                        From: {note.sent_by}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          onClick={() =>
            (window.location.href =
              "mailto:jody@hbcat.org?subject=Mentor Support Request")
          }
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                <MessageCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Need help with a mentee?
                </h3>
                <p className="text-sm text-gray-600">
                  Contact Jody for support
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-amber-600 group-hover:translate-x-1 transition-transform">
              <span>Email Jody →</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MENTEE & ENTREPRENEUR DASHBOARD
  // (Shared dashboard - both get mentor features)
  // ============================================
  if (effectiveRole === "mentee" || effectiveRole === "entrepreneur") {
    const isMentee = effectiveRole === "mentee";
    const welcomeMessage = isMentee
      ? "Your mentorship and entrepreneurial journey is making progress"
      : "Your entrepreneurial journey is making progress";

    return (
      <>
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold">
                Welcome back, {profile?.name?.split(" ")[0] || "User"}! 🎉
              </h2>
              <p className="text-emerald-100 mt-2">{welcomeMessage}</p>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                  <p className="text-sm opacity-90">Active Programs</p>
                  <p className="text-2xl font-bold">{myPrograms.length}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                  <p className="text-sm opacity-90">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {myPrograms.length > 0
                      ? Math.round(
                          myPrograms.reduce((acc, p) => acc + p.progress, 0) /
                            myPrograms.length,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 ${role === "mentee" ? "lg:grid-cols-3" : ""} gap-4`}
          >
            {/* Goals Card */}
            <div
              onClick={() => router.push("/goals")}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {goalsCompleted}
                  </p>
                  <p className="text-sm text-gray-500">Goals Completed</p>
                </div>
              </div>
            </div>

            {/* Satisfaction Rating Card - real rating from mentor_ratings,
                set on the dedicated /feedback page. */}
            <div
              onClick={() => router.push("/feedback")}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {myMentorRating != null ? `${myMentorRating}/5` : "—"}
                  </p>
                  <p className="text-sm text-gray-500">Satisfaction Rating</p>
                </div>
              </div>
            </div>

            {/* Third Card - Toggle between Mentee and Entrepreneur views.
                Every mentee is also an entrepreneur, so from the mentee
                dashboard they can jump into the entrepreneur view, and
                from the entrepreneur view (when their real role is
                mentee) they can jump back. Pure entrepreneur accounts
                don't get this card since they have no mentee view. */}
            {isMentee && (
              <div
                onClick={() => {
                  window.location.href = "/?view=entrepreneur";
                }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Entrepreneur Hub
                    </p>
                    <p className="text-xs text-gray-500">Access all programs</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </div>
            )}

            {/* Reverse toggle - shown when a mentee is currently viewing
                the entrepreneur side, so they can get back. */}
            {!isMentee && role === "mentee" && (
              <div
                onClick={() => {
                  window.location.href = "/";
                }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Handshake className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mentee Hub</p>
                    <p className="text-xs text-gray-500">
                      Back to your mentorship dashboard
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </div>
              </div>
            )}
          </div>
          {/* Your Active Programs - real read-only list from user_programs.
              Programs are admin-managed and users are enrolled into them,
              so there's no add/edit/delete here - just what you're
              actually enrolled in. */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">
                  📋 Your Active Programs
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Click on a program to view details
                </p>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {myProgramsError ? (
                <div className="p-8 text-center text-red-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Couldn't load your programs</p>
                  <p className="text-xs mt-1">{myProgramsError}</p>
                </div>
              ) : myPrograms.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No programs yet</p>
                  <p className="text-xs mt-1">
                    Reach out to your program coordinator to get enrolled
                  </p>
                </div>
              ) : (
                myPrograms.map((program) => (
                  <div
                    key={program.user_program_id}
                    onClick={() => {
                      setSelectedProgram(program);
                      setShowProgramModal(true);
                    }}
                    className="p-5 hover:bg-gray-50 transition-colors group relative cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                              {program.name}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                program.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : program.status === "Completed"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {program.status}
                            </span>
                            {program.approved ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Approved
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                Pending approval
                              </span>
                            )}
                          </div>
                          {program.start_date && (
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  Started{" "}
                                  {new Date(
                                    program.start_date,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">
                                Overall Progress
                              </span>
                              <span className="text-emerald-600 font-medium">
                                {program.progress}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${program.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <RoundtableJoinCard
            profileName={profile?.name ?? ""}
            profileEmail={profile?.email ?? ""}
            showToast={showToast}
          />

          {/* JOIN YOUR MENTORING SESSION - ZOOM MEETING */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 transition-all">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Join Your Mentoring Session
                </h3>
                <p className="text-sm text-gray-600">
                  Enter your Zoom meeting ID and passcode to join your session
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Zoom Meeting ID
                </label>
                <input
                  type="text"
                  id="zoomMeetingId"
                  placeholder="e.g., 123 456 7890"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Passcode (optional)
                </label>
                <input
                  type="text"
                  id="zoomPassword"
                  placeholder="Enter Zoom passcode"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const meetingId = (
                  document.getElementById("zoomMeetingId") as HTMLInputElement
                )?.value;
                const password = (
                  document.getElementById("zoomPassword") as HTMLInputElement
                )?.value;

                if (!meetingId || meetingId.trim() === "") {
                  alert("Please enter your Zoom Meeting ID");
                  return;
                }

                const cleanMeetingId = meetingId.trim().replace(/\s/g, "");
                let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
                if (password && password.trim() !== "") {
                  zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
                }

                window.open(zoomUrl, "_blank");
              }}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Video className="h-4 w-4" />
              Join Zoom Meeting
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              💡 Tip: Your mentor should provide the Meeting ID and passcode
            </p>
          </div>

          {/* TWO COLUMN LAYOUT - Mentor Info & Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mentor Card - real data only. Mentor assignment is
                Jody's call via the admin Program Management "Mentor
                Matching" tab (participants.mentor), so until she's
                matched this person to someone, we show a waiting state
                instead of fake placeholder data. */}
            <div
              id="your-mentor-card"
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-6"
            >
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Your Mentor</h3>
                </div>
              </div>
              <div className="p-5">
                {loadingMyMentor ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                  </div>
                ) : myMentorProfile ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                        {myMentorProfile.name?.charAt(0) || "M"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {myMentorProfile.name}
                        </h4>
                        {myMentorProfile.email && (
                          <p className="text-sm text-gray-500">
                            {myMentorProfile.email}
                          </p>
                        )}
                        {myMentorProfile.phone && (
                          <p className="text-sm text-gray-500">
                            {myMentorProfile.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {myMentorProfile.bio && (
                      <p className="text-sm text-gray-600 mb-4">
                        {myMentorProfile.bio}
                      </p>
                    )}
                    {myMentorProfile.expertise.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Expertise
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {myMentorProfile.expertise.map((exp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full text-xs"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {myMentorProfile.email && (
                      <button
                        onClick={() =>
                          (window.location.href = `mailto:${myMentorProfile.email}`)
                        }
                        className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                      >
                        Message Mentor
                      </button>
                    )}
                    <button
                      onClick={() => router.push("/feedback")}
                      className="w-full mt-3 py-2 border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      {myMentorRating
                        ? `Your Rating: ${myMentorRating}/5 — Update`
                        : "Rate Your Mentor"}
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <User className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-gray-500">
                      No mentor assigned yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Jody matches new members with a mentor after your
                      onboarding meeting.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Goals Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Your Goals</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="text-emerald-600 font-medium">
                      {totalGoals > 0
                        ? Math.round((goalsCompleted / totalGoals) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-emerald-500 rounded-full"
                      style={{
                        width: `${totalGoals > 0 ? Math.round((goalsCompleted / totalGoals) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  {myGoalsPreview.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No goals set yet</p>
                      <p className="text-xs">
                        Click "Goals" above to create some
                      </p>
                    </div>
                  ) : (
                    myGoalsPreview.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg"
                      >
                        {goal.completed ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <p
                            className={`text-sm ${goal.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                          >
                            {goal.title}
                          </p>
                          {goal.due_date && (
                            <p className="text-xs text-gray-400">
                              Due: {new Date(goal.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => router.push("/goals")}
                  className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 w-full text-center"
                >
                  View All Goals →
                </button>
              </div>
            </div>
          </div>

          {/* Mentor Notes Section - For both Entrepreneur and Mentee */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">
                    📝 Notes from Your Mentor
                  </h3>
                </div>
                <button
                  onClick={() => {
                    if (myMentorNotes.length > 0) {
                      setShowAllNotesModal(true);
                    } else {
                      showToast("No notes yet from your mentor", "info");
                    }
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View All →
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {myMentorNotes.length === 0 ? (
                <div className="text-center py-6">
                  <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No notes yet.</p>
                  <p className="text-xs text-gray-400">
                    Your mentor will leave feedback here.
                  </p>
                </div>
              ) : (
                <>
                  {myMentorNotes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className="bg-amber-50 rounded-xl p-3 border border-amber-100"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-amber-700">
                            {note.author}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{linkifyText(note.note)}</p>
                    </div>
                  ))}
                  {myMentorNotes.length > 3 && (
                    <button
                      onClick={() => setShowAllNotesModal(true)}
                      className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 py-2"
                    >
                      View all {myMentorNotes.length} notes →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Support Section */}
          <div
            onClick={() =>
              (window.location.href =
                "mailto:jody@hbcat.org?subject=Support Request from Rural Community Partners Dashboard")
            }
            className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                  <MessageCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Need personalized support?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Click here to email Jody directly
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>jody@hbcat.org</span>
                <Mail className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Program Details Modal - built from real data: programs/
            user_programs for the overview, program_tracking (admin-
            entered) for tracking, mentee_sessions for sessions, and
            program_resources for resources. All read-only from the
            user's side - programs are admin-managed. */}
        {showProgramModal && selectedProgram && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedProgram.name}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedProgram.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : selectedProgram.status === "Completed"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {selectedProgram.status}
                    </span>
                    {selectedProgram.approved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Approved
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Pending approval
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowProgramModal(false);
                    setSelectedProgram(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedProgram.approved && (
                <div className="px-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex gap-1 overflow-x-auto">
                    {(
                      [
                        { id: "overview", label: "Overview" },
                        { id: "tracking", label: "My Tracking" },
                        { id: "sessions", label: "My Sessions" },
                        { id: "resources", label: "Resources" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setProgramModalTab(tab.id)}
                        className={`px-3 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                          programModalTab === tab.id
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5 space-y-4">
                {!selectedProgram.approved ? (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
                    <p className="text-sm text-amber-800 font-medium">
                      🔒 You don't have access to this program yet
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Jody reviews and approves access to each program.
                      You'll be notified once you're approved.
                    </p>
                    <button
                      onClick={() =>
                        (window.location.href = `mailto:jody@hbcat.org?subject=Requesting access to ${encodeURIComponent(selectedProgram.name)}`)
                      }
                      className="mt-3 w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                    >
                      Ask Jody for access
                    </button>
                  </div>
                ) : programModalTab === "overview" ? (
                  <>
                    {selectedProgram.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          About This Program
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {selectedProgram.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          Overall Progress
                        </span>
                        <span className="font-medium text-emerald-600">
                          {selectedProgram.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${selectedProgram.progress}%` }}
                        />
                      </div>
                    </div>

                    {(selectedProgram.start_date ||
                      selectedProgram.end_date) && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {selectedProgram.start_date &&
                          `Started ${new Date(selectedProgram.start_date).toLocaleDateString()}`}
                        {selectedProgram.start_date &&
                          selectedProgram.end_date &&
                          " · "}
                        {selectedProgram.end_date &&
                          `Ends ${new Date(selectedProgram.end_date).toLocaleDateString()}`}
                      </div>
                    )}

                    {(selectedProgram.contact_email ||
                      selectedProgram.contact_phone) && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          Program Contact
                        </h4>
                        {selectedProgram.contact_email && (
                          <button
                            onClick={() =>
                              (window.location.href = `mailto:${selectedProgram.contact_email}`)
                            }
                            className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-emerald-50 transition-colors border border-gray-100 text-left"
                          >
                            <Mail className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">
                              {selectedProgram.contact_email}
                            </span>
                          </button>
                        )}
                        {selectedProgram.contact_phone && (
                          <button
                            onClick={() =>
                              (window.location.href = `tel:${selectedProgram.contact_phone}`)
                            }
                            className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg hover:bg-emerald-50 transition-colors border border-gray-100 text-left"
                          >
                            <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {selectedProgram.contact_phone}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : programModalTab === "tracking" ? (
                  loadingProgramDetails ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                    </div>
                  ) : !programTracking ? (
                    <div className="text-center py-10 text-gray-400">
                      <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium text-gray-500">
                        No tracking data yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Jody updates program budget and outcomes from the
                        admin panel.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          Financial
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Budget</p>
                            <p className="text-lg font-bold text-gray-900">
                              ${programTracking.budget.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">Spent</p>
                            <p className="text-lg font-bold text-gray-900">
                              ${programTracking.spent.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Grants Received
                            </p>
                            <p className="text-lg font-bold text-emerald-600">
                              $
                              {programTracking.grants_received.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Grants Pending
                            </p>
                            <p className="text-lg font-bold text-amber-600">
                              $
                              {programTracking.grants_pending.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          Outcomes
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Businesses Launched
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {programTracking.businesses_launched}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Businesses Expanded
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {programTracking.businesses_expanded}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Jobs Created
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {programTracking.jobs_created}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Jobs Retained
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {programTracking.jobs_retained}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Capital Accessed
                            </p>
                            <p className="text-lg font-bold text-emerald-600">
                              $
                              {programTracking.capital_accessed.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400">
                              Revenue Growth
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {programTracking.revenue_growth_pct}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : programModalTab === "sessions" ? (
                  loadingProgramDetails ? (
                    <div className="flex justify-center py-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                    </div>
                  ) : programSessions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-medium text-gray-500">
                        No sessions yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Sessions your mentor logs will show up here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {programSessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {session.topic || "Mentoring Session"}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(
                                    session.date,
                                  ).toLocaleDateString()}
                                </span>
                                {session.time && <span>{session.time}</span>}
                                <span>{session.duration} min</span>
                              </div>
                              {session.mentor_name && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Mentor: {session.mentor_name}
                                </p>
                              )}
                              {session.notes && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                            {session.meeting_link && (
                              <button
                                onClick={() =>
                                  window.open(session.meeting_link!, "_blank")
                                }
                                className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : loadingProgramDetails ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                  </div>
                ) : programResources.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-gray-500">
                      No resources yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {programResources.map((resource) => (
                      <button
                        key={resource.id}
                        onClick={() => {
                          if (!resource.url) return;
                          if (resource.url.startsWith("mailto:")) {
                            window.location.href = resource.url;
                          } else {
                            window.open(resource.url, "_blank");
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-white rounded-lg flex-shrink-0">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {resource.name}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {resource.type}
                              {resource.description
                                ? ` · ${resource.description}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 group-hover:text-emerald-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowProgramModal(false);
                    setSelectedProgram(null);
                  }}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Notes Modal - For Mentor Notes */}
        {showAllNotesModal && (
          <AllNotesModal
            notes={myMentorNotes}
            onClose={() => setShowAllNotesModal(false)}
          />
        )}
      </>
    );
  }

  // Default fallback
  return (
    <div className="bg-white rounded-xl p-8 text-center">
      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-900">
        Welcome to Your Dashboard
      </h3>
      <p className="text-gray-500 mt-1">
        Contact support to set up your personalized dashboard.
      </p>
      <button
        onClick={() => (window.location.href = "mailto:jody@hbcat.org")}
        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        Contact Support
      </button>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    role: "",
  });
  // checkForUpcomingSessions is called from setTimeout/setInterval callbacks
  // created once inside a mount-only useEffect, which would otherwise close
  // over the stale initial `profile` (still {name:"",email:"",...} at that
  // point). This ref always holds the latest value so those callbacks see
  // real data once auth loads.
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  const [panel, setPanel] = useState<
    "settings" | "profile" | "edit-profile" | "change-password" | null
  >(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    mentorAlerts: true,
    participantAlerts: true,
    darkMode: false,
    twoFactorAuth: true,
    dashboardLayout: "comfortable",
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

  // ✅ showToast defined BEFORE the useEffect that uses it
  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setToast({ message, type, visible: true });
    setTimeout(
      () => setToast({ message: "", type: "info", visible: false }),
      3000,
    );
  };

  // ✅ This useEffect can now use showToast because it's defined above
  useEffect(() => {
    const error = localStorage.getItem("route_error");
    if (error) {
      showToast(error, "error");
      localStorage.removeItem("route_error");
    }
  }, []);

  // Checks the real mentee_sessions data (same source as the Upcoming
  // Sessions card) for anything happening today or tomorrow, and fires an
  // in-app toast + optional browser notification once per session. Reads
  // profileRef instead of `profile` directly since this can be called from
  // callbacks created once at mount, before the real profile has loaded.
  const checkForUpcomingSessions = async () => {
    const currentProfile = profileRef.current;
    if (!currentProfile?.email || currentProfile.primaryRole !== "mentor") {
      return;
    }

    const sessionRemindersEnabled =
      localStorage.getItem("session_reminders_enabled") === "true";
    if (!sessionRemindersEnabled) return;

    try {
      const mentorRow = await getMentorProfileByEmail(currentProfile.email);
      if (!mentorRow) return;

      const [sessions, mentees] = await Promise.all([
        getAllSessionsForMentor(mentorRow.name),
        getMenteesForMentor(mentorRow.name),
      ]);
      const menteeById = Object.fromEntries(mentees.map((m) => [m.id, m]));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const todayStr = today.toISOString().split("T")[0];
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const sentReminders: string[] = JSON.parse(
        localStorage.getItem("sent_session_reminders") || "[]",
      );
      let updated = false;

      const dueSessions = sessions.filter(
        (s) => s.date === todayStr || s.date === tomorrowStr,
      );

      for (const s of dueSessions) {
        const reminderKey = `session_reminder_${s.id}`;
        if (sentReminders.includes(reminderKey)) continue;

        const menteeName =
          (s.participant_id && menteeById[s.participant_id]?.name) ||
          "your mentee";
        const whenLabel = s.date === todayStr ? "today" : "tomorrow";
        const timeLabel = s.time ? ` at ${s.time}` : "";
        const topic = s.topic || "Mentoring session";
        const message = `Session with ${menteeName} ${whenLabel}${timeLabel} - ${topic}`;

        showToast(`⏰ Reminder: ${message}`, "info");

        // Real email attempt, gated by the Email notifications toggle -
        // no-ops instantly if it's off. Also logs to the real email_logs
        // table (visible in admin > Email Logs) regardless of whether
        // Resend is configured yet.
        sendMentorEmailNotification(
          currentProfile.email,
          `Upcoming Mentoring Session ${whenLabel === "today" ? "Today" : "Tomorrow"}`,
          `You have a mentoring session ${message}.`,
          "mentor_alert",
        ).catch((err) =>
          console.error("Failed to send session reminder email:", err),
        );

        sentReminders.push(reminderKey);
        updated = true;
      }

      if (updated) {
        localStorage.setItem(
          "sent_session_reminders",
          JSON.stringify(sentReminders),
        );
      }
    } catch (err) {
      console.error("Failed to check for upcoming sessions:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadAuthAndProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
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

      // Admin/staff belong on the admin dashboard, program managers on
      // their own dashboard - neither belongs here.
      if (
        userRow.primary_role === "admin" ||
        userRow.primary_role === "staff"
      ) {
        router.push("/admin/dashboard");
        return;
      }
      if (userRow.primary_role === "program_manager") {
        router.push("/program-manager/dashboard");
        return;
      }

      // Best-effort avatar fetch - profiles row may not exist for every
      // account (see the signup RLS note from earlier), so don't block
      // login on it.
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("avatar")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      const loadedProfile = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role: userRow.primary_role || "Member",
        primaryRole: userRow.primary_role ?? undefined,
        avatar: profileRow?.avatar ?? undefined,
      };

      setProfile(loadedProfile);
      setEditForm(loadedProfile);
      setIsAuthenticated(true);

      // Local UI preferences (not sensitive, fine to keep in localStorage)
      const savedEmailNotifications = localStorage.getItem(
        "email_notifications_enabled",
      );
      const savedSessionReminders = localStorage.getItem(
        "session_reminders_enabled",
      );

      if (savedEmailNotifications !== null) {
        setSettings((prev) => ({
          ...prev,
          emailNotifications: savedEmailNotifications === "true",
        }));
      }
      if (savedSessionReminders !== null) {
        setSettings((prev) => ({
          ...prev,
          mentorAlerts: savedSessionReminders === "true",
        }));
      }

      const sessionRemindersEnabled =
        localStorage.getItem("session_reminders_enabled") === "true";
      if (sessionRemindersEnabled) {
        setTimeout(() => checkForUpcomingSessions(), 2000);
      }
    };

    loadAuthAndProfile();

    const interval = setInterval(() => {
      if (localStorage.getItem("session_reminders_enabled") === "true") {
        checkForUpcomingSessions();
      }
    }, 3600000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

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

      // Best-effort: keep the profiles table in sync too, but don't block
      // on it - some accounts may not have a profiles row yet (see the
      // signup RLS note from earlier).
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: trimmedName })
        .eq("id", authData.user.id);
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
    if (passwords.newPass.length < 6)
      return setPasswordError("New password must be at least 6 characters.");
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const updateSetting = (key: keyof SettingsData, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "darkMode" && typeof value === "boolean") {
      if (value) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    if (key === "dashboardLayout" && typeof value === "string") {
      if (value === "compact") document.body.style.zoom = "0.9";
      else if (value === "spacious") document.body.style.zoom = "1.1";
      else document.body.style.zoom = "1";
    }
  };

  const saveSettings = () => {
    showToast("All settings saved!", "success");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isMentor = profile?.primaryRole === "mentor";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Rural Community Partners
                </h1>
                <p className="text-xs text-gray-500">My Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPanel("settings")}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
              >
                <Settings className="h-5 w-5" />
              </button>

              <button
                onClick={() => setPanel("profile")}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-20 right-4 z-50 p-3 rounded-xl text-sm flex items-center gap-2 shadow-lg animate-slide-down ${
            toast.type === "success"
              ? "bg-green-50 text-green-600 border border-green-200"
              : toast.type === "error"
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-blue-50 text-blue-600 border border-blue-200"
          }`}
        >
          <Check className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      {/* Settings Panel */}
      <SlidePanel
        open={panel === "settings"}
        onClose={() => setPanel(null)}
        title="Settings"
        icon={Settings}
      >
        <div className="space-y-6">
          {isMentor && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                👨‍🏫 Mentor Tools
              </h3>
              <button
                onClick={() => router.push("/mentor/settings")}
                className="w-full text-left px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Manage Mentees & Sessions →
              </button>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Email notifications
                  </p>
                  <p className="text-xs text-gray-400">
                    Receive email alerts for key events
                  </p>
                </div>
                <Toggle
                  value={settings.emailNotifications}
                  onChange={(v) => {
                    updateSetting("emailNotifications", v);
                    if (v) {
                      showToast(
                        "Email notifications enabled. You'll receive important updates via email.",
                        "success",
                      );
                      localStorage.setItem(
                        "email_notifications_enabled",
                        "true",
                      );
                    } else {
                      showToast("Email notifications disabled", "info");
                      localStorage.setItem(
                        "email_notifications_enabled",
                        "false",
                      );
                    }
                  }}
                />
              </div>

              {isMentor && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Session reminders
                    </p>
                    <p className="text-xs text-gray-400">
                      Get notified about upcoming sessions (24h before)
                    </p>
                  </div>
                  <Toggle
                    value={settings.mentorAlerts}
                    onChange={(v) => {
                      updateSetting("mentorAlerts", v);
                      if (v) {
                        showToast(
                          "Session reminders enabled. You'll be notified before upcoming sessions.",
                          "success",
                        );
                        localStorage.setItem(
                          "session_reminders_enabled",
                          "true",
                        );
                        setTimeout(() => checkForUpcomingSessions(), 1000);
                      } else {
                        showToast("Session reminders disabled", "info");
                        localStorage.setItem(
                          "session_reminders_enabled",
                          "false",
                        );
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => updateSetting("dashboardLayout", "compact")}
                    className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${settings.dashboardLayout === "compact" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() =>
                      updateSetting("dashboardLayout", "comfortable")
                    }
                    className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${settings.dashboardLayout === "comfortable" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    Comfortable
                  </button>
                  <button
                    onClick={() => updateSetting("dashboardLayout", "spacious")}
                    className={`px-3 py-1.5 text-sm rounded-xl border transition-all ${settings.dashboardLayout === "spacious" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    Spacious
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => setPanel("change-password")}
              className="w-full text-left px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              Change Password →
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={saveSettings}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md"
            >
              Save All Settings
            </button>
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
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
              className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </div>
          <p className="font-semibold text-gray-800 text-lg">{profile.name}</p>
          <p className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {profile.role || "Member"}
          </p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
        <div className="space-y-1 mt-2">
          <button
            onClick={() => {
              setEditForm(profile);
              setPanel("edit-profile");
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              setPasswords({ current: "", newPass: "", confirm: "" });
              setPasswordError("");
              setPanel("change-password");
            }}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Change Password
          </button>
          <div className="border-t border-gray-100 my-2"></div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Sign Out
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Contact an admin to change your role.
            </p>
          </div>
          <button
            onClick={saveProfile}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${editSaved ? "bg-emerald-100 text-emerald-700" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md"}`}
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
          <PasswordInput
            placeholder="Current password"
            value={passwords.current}
            onChange={(v) => setPasswords({ ...passwords, current: v })}
          />
          <PasswordInput
            placeholder="New password (min 6 chars)"
            value={passwords.newPass}
            onChange={(v) => setPasswords({ ...passwords, newPass: v })}
          />
          <PasswordInput
            placeholder="Confirm new password"
            value={passwords.confirm}
            onChange={(v) => setPasswords({ ...passwords, confirm: v })}
          />
          {passwordError && (
            <p className="text-xs text-red-500">{passwordError}</p>
          )}
          <button
            onClick={savePassword}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${passwordSaved ? "bg-emerald-100 text-emerald-700" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md"}`}
          >
            {passwordSaved ? "✓ Password Updated!" : "Update Password"}
          </button>
        </div>
      </SlidePanel>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <RoleBasedDashboardContent
          showToast={showToast}
          router={router}
          authProfile={profile}
        />
      </main>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
