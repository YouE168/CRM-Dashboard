"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Eye,
  EyeOff,
  Check,
  Camera,
  X,
  ChevronLeft,
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
  reportAlerts: boolean;
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
  onTogglePin,
}: {
  notes: any[];
  onClose: () => void;
  onTogglePin: (noteId: number) => void;
}) {
  const [filter, setFilter] = useState<"all" | "pinned">("all");

  const filteredNotes =
    filter === "all" ? notes : notes.filter((n) => n.pinned);

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

        {/* Filter Tabs */}
        <div className="px-5 pt-4 border-b border-gray-100">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter("all")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                filter === "all"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Notes ({notes.length})
            </button>
            <button
              onClick={() => setFilter("pinned")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                filter === "pinned"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📌 Pinned ({notes.filter((n) => n.pinned).length})
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No {filter === "pinned" ? "pinned" : ""} notes yet</p>
              {filter === "all" && (
                <p className="text-xs mt-1">
                  Your mentor will leave feedback here
                </p>
              )}
            </div>
          ) : (
            filteredNotes.map((note) => (
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
                  <button
                    onClick={() => onTogglePin(note.id)}
                    className={`p-1 rounded-lg transition-colors ${
                      note.pinned
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-gray-300 hover:text-gray-400"
                    }`}
                    title={note.pinned ? "Unpin note" : "Pin note"}
                  >
                    📌
                  </button>
                </div>
                <p className="text-gray-700">{note.note}</p>
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

// Program Details Modal
function ProgramDetailsModal({
  program,
  onClose,
}: {
  program: any;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!program) return null;

  const handleResourceClick = (link: string) => {
    if (link.startsWith("mailto:")) {
      window.location.href = link;
    } else if (link.startsWith("http")) {
      window.open(link, "_blank");
    } else {
      router.push(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {program.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs ${program.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
            >
              {program.status}
            </span>
            <span className="text-xs text-gray-400">
              Started {program.startDate}
            </span>
          </div>

          <p className="text-gray-600">{program.description}</p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Progress</h3>
            <div className="w-full h-3 bg-gray-200 rounded-full">
              <div
                className="h-3 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${program.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {program.progress}% Complete
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Next Milestone</h3>
            <button
              onClick={() =>
                program.nextMilestoneAction &&
                window.open(program.nextMilestoneAction, "_blank")
              }
              className="w-full text-left text-sm text-gray-600 bg-gray-50 p-3 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-between group"
            >
              <span>{program.nextMilestone}</span>
              <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </button>
          </div>

          {program.upcomingSessions && program.upcomingSessions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Upcoming Sessions
              </h3>
              <div className="space-y-2">
                {program.upcomingSessions.map((session: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() =>
                      session.link && window.open(session.link, "_blank")
                    }
                    className="w-full text-left bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <p className="font-medium">{session.topic}</p>
                    <p className="text-xs text-gray-500">
                      {session.date} at {session.time} with {session.mentor}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Resources</h3>
            <div className="space-y-2">
              {program.resources.map((resource: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleResourceClick(resource.link)}
                  className="w-full text-left p-2 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                >
                  <p className="text-sm">{resource.name}</p>
                  <span className="text-emerald-600 text-xs group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() =>
                  (window.location.href = `mailto:${program.contactEmail}`)
                }
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Mail className="h-4 w-4" />
                {program.contactEmail}
              </button>
              <button
                onClick={() =>
                  (window.location.href = `tel:${program.contactPhone}`)
                }
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
                {program.contactPhone}
              </button>
            </div>
          </div>
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
  receivedNotes,
  showAllNotes,
  setShowAllNotes,
  markNoteAsRead,
}: {
  showToast: (msg: string, type: any) => void;
  router: any;
  profile: any;
  receivedNotes: any[];
  showAllNotes: boolean;
  setShowAllNotes: (val: boolean) => void;
  markNoteAsRead: (id: number) => void;
}) {
  const [coalitionData, setCoalitionData] = useState(() => {
    const saved = localStorage.getItem("coalition_dashboard_data");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      id: "coalition-default",
      lastUpdated: new Date().toISOString(),
      hero: {
        title: "Welcome, Coalition Leader!",
        subtitle: "Leading change across Southeast Kansas",
        stats: {
          activeCoalitions: 2,
          countiesServed: 11,
          activeProjects: 5,
        },
      },
      metrics: {
        coalitionMembers: 24,
        meetingsHeld: 48,
        projectsInitiated: 23,
        residentsImpacted: 5200,
      },
      upcomingMeetings: [
        {
          id: "meeting-1",
          title: "LHEAT Coalition Meeting",
          date: "2026-06-14",
          time: "10:00 AM",
          type: "virtual",
          link: "https://zoom.us/j/123456789",
          meetingId: "123456789",
          passcode: "",
          location: "",
          description:
            "Monthly coalition meeting to discuss food access initiatives",
        },
        {
          id: "meeting-2",
          title: "Leadership Roundtable",
          date: "2026-06-22",
          time: "1:00 PM",
          type: "in-person",
          link: "",
          meetingId: "",
          passcode: "",
          location: "Main Street Community Center, 123 Main St",
          description: "Quarterly leadership meeting with all coalition heads",
        },
      ],
      activeInitiatives: [
        {
          id: "init-1",
          title: "Food Access Program",
          status: "In Progress",
          progress: 65,
          description:
            "Increasing food access in rural communities through mobile markets",
          startDate: "2026-01-15",
          targetDate: "2026-12-31",
        },
        {
          id: "init-2",
          title: "Childcare Coalition",
          status: "Planning",
          progress: 30,
          description:
            "Developing sustainable childcare solutions for working families",
          startDate: "2026-03-01",
          targetDate: "2026-09-30",
        },
        {
          id: "init-3",
          title: "Housing Initiative",
          status: "Proposed",
          progress: 10,
          description: "Affordable housing project for low-income residents",
          startDate: "2026-06-01",
          targetDate: "2027-06-30",
        },
      ],
      resources: [
        {
          id: "res-1",
          title: "Resource Sharing Guide",
          description: "Cross-county collaboration tools and best practices",
          link: "/resources/sharing-guide.pdf",
          type: "pdf",
          icon: "📚",
        },
        {
          id: "res-2",
          title: "Strategic Plan 2026",
          description: "Annual goals and initiatives for coalition work",
          link: "/resources/strategic-plan-2026.pdf",
          type: "pdf",
          icon: "🎯",
        },
        {
          id: "res-3",
          title: "Meeting Minutes Archive",
          description: "Past meeting notes and action items",
          link: "/resources/meeting-minutes",
          type: "internal",
          icon: "📝",
        },
      ],
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState<
    "meeting" | "initiative" | "resource" | null
  >(null);
  const [tempFormData, setTempFormData] = useState<any>({});

  const saveCoalitionData = (newData: any) => {
    const updatedData = {
      ...newData,
      lastUpdated: new Date().toISOString(),
    };
    setCoalitionData(updatedData);
    localStorage.setItem(
      "coalition_dashboard_data",
      JSON.stringify(updatedData),
    );
    showToast("Dashboard updated successfully!", "success");
  };

  // Meeting CRUD
  const addMeeting = () => {
    const newMeeting = {
      id: `meeting-${Date.now()}`,
      title: tempFormData.title || "New Meeting",
      date: tempFormData.date || new Date().toISOString().split("T")[0],
      time: tempFormData.time || "12:00 PM",
      type: tempFormData.type || "virtual",
      link: tempFormData.link || "",
      meetingId: tempFormData.meetingId || "",
      passcode: tempFormData.passcode || "",
      location: tempFormData.location || "",
      description: tempFormData.description || "",
    };
    const updated = {
      ...coalitionData,
      upcomingMeetings: [...coalitionData.upcomingMeetings, newMeeting],
    };
    saveCoalitionData(updated);
    setShowAddModal(null);
    setTempFormData({});
    showToast("Meeting added successfully!", "success");
  };

  const updateMeeting = (id: string, field: string, value: string) => {
    const updated = {
      ...coalitionData,
      upcomingMeetings: coalitionData.upcomingMeetings.map((m: any) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    };
    saveCoalitionData(updated);
  };

  const deleteMeeting = (id: string) => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      const updated = {
        ...coalitionData,
        upcomingMeetings: coalitionData.upcomingMeetings.filter(
          (m: any) => m.id !== id,
        ),
      };
      saveCoalitionData(updated);
      showToast("Meeting deleted successfully!", "info");
    }
  };

  const joinZoomMeeting = (meeting: any) => {
    if (meeting.type === "virtual") {
      let zoomUrl = `https://zoom.us/j/${
        meeting.meetingId || meeting.link?.split("/j/")[1] || ""
      }`;
      if (meeting.passcode) {
        zoomUrl += `?pwd=${encodeURIComponent(meeting.passcode)}`;
      }
      window.open(zoomUrl, "_blank");
    } else if (meeting.type === "in-person" && meeting.location) {
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(meeting.location)}`,
        "_blank",
      );
    } else {
      showToast("Meeting link or location not available yet", "info");
    }
  };

  // Initiative CRUD
  const addInitiative = () => {
    const newInitiative = {
      id: `init-${Date.now()}`,
      title: tempFormData.title || "New Initiative",
      status: tempFormData.status || "Proposed",
      progress: tempFormData.progress || 0,
      description: tempFormData.description || "",
      startDate:
        tempFormData.startDate || new Date().toISOString().split("T")[0],
      targetDate: tempFormData.targetDate || "",
    };
    const updated = {
      ...coalitionData,
      activeInitiatives: [...coalitionData.activeInitiatives, newInitiative],
    };
    saveCoalitionData(updated);
    setShowAddModal(null);
    setTempFormData({});
    showToast("Initiative added successfully!", "success");
  };

  const updateInitiative = (id: string, field: string, value: any) => {
    const updated = {
      ...coalitionData,
      activeInitiatives: coalitionData.activeInitiatives.map((i: any) =>
        i.id === id ? { ...i, [field]: value } : i,
      ),
    };
    saveCoalitionData(updated);
  };

  const deleteInitiative = (id: string) => {
    if (confirm("Are you sure you want to delete this initiative?")) {
      const updated = {
        ...coalitionData,
        activeInitiatives: coalitionData.activeInitiatives.filter(
          (i: any) => i.id !== id,
        ),
      };
      saveCoalitionData(updated);
      showToast("Initiative deleted successfully!", "info");
    }
  };

  // Resource CRUD
  const addResource = () => {
    const newResource = {
      id: `res-${Date.now()}`,
      title: tempFormData.title || "New Resource",
      description: tempFormData.description || "",
      link: tempFormData.link || "",
      type: tempFormData.type || "internal",
      icon: tempFormData.icon || "📄",
    };
    const updated = {
      ...coalitionData,
      resources: [...coalitionData.resources, newResource],
    };
    saveCoalitionData(updated);
    setShowAddModal(null);
    setTempFormData({});
    showToast("Resource added successfully!", "success");
  };

  const updateResource = (id: string, field: string, value: string) => {
    const updated = {
      ...coalitionData,
      resources: coalitionData.resources.map((r: any) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    };
    saveCoalitionData(updated);
  };

  const deleteResource = (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      const updated = {
        ...coalitionData,
        resources: coalitionData.resources.filter((r: any) => r.id !== id),
      };
      saveCoalitionData(updated);
      showToast("Resource deleted successfully!", "info");
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

                    {/* FIXED: Changed from <p> to <div> to avoid hydration error */}
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
                                value={meeting.meetingId || ""}
                                onChange={(e) =>
                                  updateMeeting(
                                    meeting.id,
                                    "meetingId",
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
                            {meeting.meetingId && (
                              <p className="text-sm text-gray-600">
                                Meeting ID:{" "}
                                <span className="font-mono">
                                  {meeting.meetingId}
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
                                const meetingIdInput = document.getElementById(
                                  `zoomMeetingId_${meeting.id}`,
                                ) as HTMLInputElement;
                                const passcodeInput = document.getElementById(
                                  `zoomPasscode_${meeting.id}`,
                                ) as HTMLInputElement;

                                const meetingId =
                                  meetingIdInput?.value || meeting.meetingId;
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
                              💡 Enter the Meeting ID and passcode provided by
                              your meeting host
                            </p>
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
                    {!isEditing && (
                      <span className="text-xs text-gray-400">
                        {formatDate(initiative.startDate)}
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
            {receivedNotes.length > 0 && (
              <button
                onClick={() => setShowAllNotes(!showAllNotes)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllNotes
                  ? "Show Less"
                  : `View All (${receivedNotes.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="p-5 space-y-3">
          {receivedNotes.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No notes from admin yet.</p>
              <p className="text-xs text-gray-400">
                Updates and announcements will appear here.
              </p>
            </div>
          ) : (
            (showAllNotes ? receivedNotes : receivedNotes.slice(0, 3)).map(
              (note: any) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    note.read
                      ? "bg-gray-50"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                  onClick={() => !note.read && markNoteAsRead(note.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-700">
                        {note.subject}
                      </span>
                      {!note.read && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(note.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From: {note.sentBy}
                  </p>
                </div>
              ),
            )
          )}
        </div>
      </div>

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
  receivedNotes,
  showAllNotes,
  setShowAllNotes,
  markNoteAsRead,
}: {
  showToast: (msg: string, type: any) => void;
  router: any;
  profile: any;
  receivedNotes: any[];
  showAllNotes: boolean;
  setShowAllNotes: (val: boolean) => void;
  markNoteAsRead: (id: number) => void;
}) {
  const [partnerData, setPartnerData] = useState(() => {
    const saved = localStorage.getItem("partner_dashboard_data");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      id: "partner-default",
      lastUpdated: new Date().toISOString(),
      hero: {
        title: profile?.organization || "Welcome, Partner Organization!",
        subtitle: "Collaborating for community impact",
        stats: {
          activePartners: 8,
          sharedResources: 12,
          activeReferrals: 24,
        },
      },
      metrics: {
        activeCollaborations: 3,
        internshipsPosted: 2,
        studentPlacements: 15,
      },
      collaborations: [
        {
          id: "collab-1",
          title: "Workforce Development Partnership",
          description: "Connecting job seekers with employers",
          referrals: 3,
          status: "Active",
          link: "/partnerships/workforce",
        },
        {
          id: "collab-2",
          title: "Internship Host Partner",
          description: "Providing internship opportunities for students",
          internships: 2,
          status: "Active",
          link: "/partnerships/internships",
        },
      ],
      sharedResources: [
        {
          id: "res-1",
          title: "Training Materials",
          description: "Business planning guides and templates",
          type: "Available",
          link: "/resources/training",
        },
        {
          id: "res-2",
          title: "Facility Access",
          description: "Meeting space available for events",
          type: "Pending",
          link: "/resources/facility",
        },
      ],
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState<
    "collaboration" | "resource" | null
  >(null);
  const [tempFormData, setTempFormData] = useState<any>({});

  const savePartnerData = (newData: any) => {
    const updatedData = { ...newData, lastUpdated: new Date().toISOString() };
    setPartnerData(updatedData);
    localStorage.setItem("partner_dashboard_data", JSON.stringify(updatedData));
    showToast("Dashboard updated successfully!", "success");
  };

  // Collaboration CRUD
  const addCollaboration = () => {
    const newCollab = {
      id: `collab-${Date.now()}`,
      title: tempFormData.title || "New Collaboration",
      description: tempFormData.description || "",
      referrals: 0,
      status: "Active",
      link: tempFormData.link || "",
    };
    const updated = {
      ...partnerData,
      collaborations: [...partnerData.collaborations, newCollab],
    };
    savePartnerData(updated);
    setShowAddModal(null);
    setTempFormData({});
    showToast("Collaboration added successfully!", "success");
  };

  const updateCollaboration = (id: string, field: string, value: string) => {
    const updated = {
      ...partnerData,
      collaborations: partnerData.collaborations.map((c: any) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    };
    savePartnerData(updated);
  };

  const deleteCollaboration = (id: string) => {
    if (confirm("Are you sure you want to delete this collaboration?")) {
      const updated = {
        ...partnerData,
        collaborations: partnerData.collaborations.filter(
          (c: any) => c.id !== id,
        ),
      };
      savePartnerData(updated);
      showToast("Collaboration deleted successfully!", "info");
    }
  };

  // Resource CRUD
  const addResource = () => {
    const newResource = {
      id: `res-${Date.now()}`,
      title: tempFormData.title || "New Resource",
      description: tempFormData.description || "",
      type: tempFormData.type || "Available",
      link: tempFormData.link || "",
    };
    const updated = {
      ...partnerData,
      sharedResources: [...partnerData.sharedResources, newResource],
    };
    savePartnerData(updated);
    setShowAddModal(null);
    setTempFormData({});
    showToast("Resource added successfully!", "success");
  };

  const updateResource = (id: string, field: string, value: string) => {
    const updated = {
      ...partnerData,
      sharedResources: partnerData.sharedResources.map((r: any) =>
        r.id === id ? { ...r, [field]: value } : r,
      ),
    };
    savePartnerData(updated);
  };

  const deleteResource = (id: string) => {
    if (confirm("Are you sure you want to delete this resource?")) {
      const updated = {
        ...partnerData,
        sharedResources: partnerData.sharedResources.filter(
          (r: any) => r.id !== id,
        ),
      };
      savePartnerData(updated);
      showToast("Resource deleted successfully!", "info");
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
                          value={collab.description}
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
                          value={collab.link}
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
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-gray-800">
                          {collab.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {collab.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {collab.referrals || collab.internships || 0} active
                          </span>
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

      {/* Notes from Admin Section - Partner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                📬 Notes from Admin
              </h3>
            </div>
            {receivedNotes.length > 0 && (
              <button
                onClick={() => setShowAllNotes(!showAllNotes)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllNotes
                  ? "Show Less"
                  : `View All (${receivedNotes.length})`}
              </button>
            )}
          </div>
        </div>
        <div className="p-5 space-y-3">
          {receivedNotes.length === 0 ? (
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No notes from admin yet.</p>
              <p className="text-xs text-gray-400">
                Updates and announcements will appear here.
              </p>
            </div>
          ) : (
            (showAllNotes ? receivedNotes : receivedNotes.slice(0, 3)).map(
              (note: any) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    note.read
                      ? "bg-gray-50"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                  onClick={() => !note.read && markNoteAsRead(note.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-700">
                        {note.subject}
                      </span>
                      {!note.read && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(note.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From: {note.sentBy}
                  </p>
                </div>
              ),
            )
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
    </div>
  );
}

// ============================================
// ROLE-BASED DASHBOARD CONTENT
// ============================================
function RoleBasedDashboardContent({
  showToast,
  router,
}: {
  showToast: (msg: string, type: any) => void;
  router: any;
}) {
  // ALL hooks at top level - no conditional hooks!
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [satisfactionRate, setSatisfactionRate] = useState(5);
  const [goalsCompleted, setGoalsCompleted] = useState(5);
  const [totalGoals, setTotalGoals] = useState(7);
  const [showAllNotesModal, setShowAllNotesModal] = useState(false);
  const [allNotes, setAllNotes] = useState<any[]>([]);

  // Mentor Info - Read from localStorage (shared with mentor settings)
  const [mentorInfo, setMentorInfo] = useState(() => {
    const saved = localStorage.getItem("mentor_profile_data");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      name: "Billi Hawk",
      email: "Billi@gmail.com",
      phone: "920-234-2345",
      hourlyRate: 50,
      bio: "Experienced business mentor helping entrepreneurs succeed.",
      expertise: ["Business Strategy", "Marketing", "Financial Planning"],
      availability: ["Monday 2-5 PM", "Wednesday 10-12 PM", "Friday 1-4 PM"],
      rating: 4.8,
      totalSessions: 47,
    };
  });

  // Entrepreneur program state
  const [programsData, setProgramsData] = useState(() => {
    const saved = localStorage.getItem("entrepreneur_programs_data");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      programs: [
        {
          id: "prog-1",
          name: "RCP Small Business Mentorship",
          status: "Active",
          startDate: "January 2025",
          progress: 33,
          nextMilestone: "Complete your business profile",
          nextMilestoneAction: "https://forms.google.com/mentorship-profile",
          resources: [
            { name: "Mentor Directory", link: "/resources/mentor-directory" },
            {
              name: "Business Planning Templates",
              link: "/resources/templates",
            },
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
        {
          id: "prog-2",
          name: "SEED Micro-Grant",
          status: "Active",
          startDate: "January 2025",
          progress: 33,
          nextMilestone: "Complete cohort application",
          nextMilestoneAction: "https://forms.google.com/seed-application",
          resources: [
            { name: "Cohort Calendar", link: "/resources/seed-calendar" },
            { name: "Grant Application Guide", link: "/resources/grant-guide" },
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
        {
          id: "prog-3",
          name: "Business Technical Assistance",
          status: "Active",
          startDate: "January 2025",
          progress: 33,
          nextMilestone: "Schedule technical assistance call",
          nextMilestoneAction: "https://calendar.google.com/tech-assistance",
          resources: [
            {
              name: "Financial Templates",
              link: "/resources/financial-templates",
            },
            {
              name: "Capital Readiness Guide",
              link: "/resources/capital-guide",
            },
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
        {
          id: "prog-4",
          name: "Microloan Program",
          status: "Active",
          startDate: "January 2025",
          progress: 33,
          nextMilestone: "Check loan eligibility",
          nextMilestoneAction: "https://forms.google.com/microloan-eligibility",
          resources: [
            { name: "Loan Application", link: "/resources/loan-application" },
            {
              name: "Eligibility Requirements",
              link: "/resources/eligibility",
            },
          ],
          upcomingSessions: [],
          contactEmail: "loans@ruralcommunitypartners.org",
          contactPhone: "(620) 555-0104",
        },
      ],
    };
  });

  const [isProgramEditing, setIsProgramEditing] = useState(false);
  const [showProgramAddModal, setShowProgramAddModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programFormData, setProgramFormData] = useState<any>({
    name: "",
    status: "Active",
    startDate: "",
    progress: 0,
    nextMilestone: "",
    nextMilestoneAction: "",
    contactEmail: "",
    contactPhone: "",
    resources: [],
    upcomingSessions: [],
  });

  // Notes state for all roles - MOVED TO TOP LEVEL
  const [coalitionReceivedNotes, setCoalitionReceivedNotes] = useState<any[]>(
    [],
  );
  const [coalitionShowAllNotes, setCoalitionShowAllNotes] = useState(false);

  const [partnerReceivedNotes, setPartnerReceivedNotes] = useState<any[]>([]);
  const [partnerShowAllNotes, setPartnerShowAllNotes] = useState(false);

  const [mentorReceivedNotes, setMentorReceivedNotes] = useState<any[]>([]);
  const [mentorShowAllNotes, setMentorShowAllNotes] = useState(false);

  // Mark read functions
  const markCoalitionNoteAsRead = (noteId: number) => {
    const updatedNotes = coalitionReceivedNotes.map((n: any) =>
      n.id === noteId ? { ...n, read: true } : n,
    );
    setCoalitionReceivedNotes(updatedNotes);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      localStorage.setItem(
        `notes_${currentUser}`,
        JSON.stringify(updatedNotes),
      );
    }
  };

  const markPartnerNoteAsRead = (noteId: number) => {
    const updatedNotes = partnerReceivedNotes.map((n: any) =>
      n.id === noteId ? { ...n, read: true } : n,
    );
    setPartnerReceivedNotes(updatedNotes);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      localStorage.setItem(
        `notes_${currentUser}`,
        JSON.stringify(updatedNotes),
      );
    }
  };

  const markMentorNoteAsRead = (noteId: number) => {
    const updatedNotes = mentorReceivedNotes.map((n: any) =>
      n.id === noteId ? { ...n, read: true } : n,
    );
    setMentorReceivedNotes(updatedNotes);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      localStorage.setItem(
        `notes_${currentUser}`,
        JSON.stringify(updatedNotes),
      );
    }
  };

  // Save programs data to localStorage
  const saveProgramsData = (newData: any) => {
    setProgramsData(newData);
    localStorage.setItem("entrepreneur_programs_data", JSON.stringify(newData));
    showToast("Programs updated successfully!", "success");
  };

  // Add new program
  const addProgram = () => {
    const newProgram = {
      id: `prog-${Date.now()}`,
      name: programFormData.name || "New Program",
      status: programFormData.status || "Active",
      startDate: programFormData.startDate || "January 2025",
      progress: programFormData.progress || 0,
      nextMilestone: programFormData.nextMilestone || "",
      nextMilestoneAction: programFormData.nextMilestoneAction || "",
      resources: programFormData.resources || [],
      upcomingSessions: programFormData.upcomingSessions || [],
      contactEmail: programFormData.contactEmail || "",
      contactPhone: programFormData.contactPhone || "",
    };
    const updated = {
      ...programsData,
      programs: [...programsData.programs, newProgram],
    };
    saveProgramsData(updated);
    setShowProgramAddModal(false);
    setProgramFormData({
      name: "",
      status: "Active",
      startDate: "",
      progress: 0,
      nextMilestone: "",
      nextMilestoneAction: "",
      contactEmail: "",
      contactPhone: "",
      resources: [],
      upcomingSessions: [],
    });
    showToast("Program added successfully!", "success");
  };

  // Update program
  const updateProgram = (id: string, field: string, value: any) => {
    const updated = {
      ...programsData,
      programs: programsData.programs.map((p: any) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    };
    saveProgramsData(updated);
  };

  // Update program progress
  const updateProgramProgress = (id: string, progress: number) => {
    const updated = {
      ...programsData,
      programs: programsData.programs.map((p: any) =>
        p.id === id
          ? { ...p, progress: Math.min(100, Math.max(0, progress)) }
          : p,
      ),
    };
    saveProgramsData(updated);
  };

  // Delete program
  const deleteProgram = (id: string) => {
    if (confirm("Are you sure you want to delete this program?")) {
      const updated = {
        ...programsData,
        programs: programsData.programs.filter((p: any) => p.id !== id),
      };
      saveProgramsData(updated);
      showToast("Program deleted successfully!", "info");
    }
  };

  // Edit program in modal
  const openEditProgram = (program: any) => {
    setEditingProgramId(program.id);
    setProgramFormData({
      name: program.name || "",
      status: program.status || "Active",
      startDate: program.startDate || "",
      progress: program.progress || 0,
      nextMilestone: program.nextMilestone || "",
      nextMilestoneAction: program.nextMilestoneAction || "",
      contactEmail: program.contactEmail || "",
      contactPhone: program.contactPhone || "",
      resources: program.resources || [],
      upcomingSessions: program.upcomingSessions || [],
    });
    setShowProgramAddModal(true);
  };

  // Save edited program
  const saveEditProgram = () => {
    if (editingProgramId) {
      const updated = {
        ...programsData,
        programs: programsData.programs.map((p: any) =>
          p.id === editingProgramId
            ? {
                ...p,
                name: programFormData.name || p.name,
                status: programFormData.status || p.status,
                startDate: programFormData.startDate || p.startDate,
                progress: programFormData.progress || p.progress,
                nextMilestone: programFormData.nextMilestone || p.nextMilestone,
                nextMilestoneAction:
                  programFormData.nextMilestoneAction || p.nextMilestoneAction,
                contactEmail: programFormData.contactEmail || p.contactEmail,
                contactPhone: programFormData.contactPhone || p.contactPhone,
                resources: programFormData.resources || p.resources,
                upcomingSessions:
                  programFormData.upcomingSessions || p.upcomingSessions,
              }
            : p,
        ),
      };
      saveProgramsData(updated);
      setShowProgramAddModal(false);
      setEditingProgramId(null);
      setProgramFormData({
        name: "",
        status: "Active",
        startDate: "",
        progress: 0,
        nextMilestone: "",
        nextMilestoneAction: "",
        contactEmail: "",
        contactPhone: "",
        resources: [],
        upcomingSessions: [],
      });
      showToast("Program updated successfully!", "success");
    }
  };

  // Reset and close modal
  const closeProgramModal = () => {
    setShowProgramAddModal(false);
    setEditingProgramId(null);
    setProgramFormData({
      name: "",
      status: "Active",
      startDate: "",
      progress: 0,
      nextMilestone: "",
      nextMilestoneAction: "",
      contactEmail: "",
      contactPhone: "",
      resources: [],
      upcomingSessions: [],
    });
  };

  // Main useEffect - ALL at top level
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser}`);
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
        // Load notes based on role
        const role = JSON.parse(savedProfile)?.primaryRole || "entrepreneur";
        const notes = JSON.parse(
          localStorage.getItem(`notes_${currentUser}`) || "[]",
        );

        if (role === "coalition") {
          setCoalitionReceivedNotes(notes);
        } else if (role === "partner") {
          setPartnerReceivedNotes(notes);
        } else if (role === "mentor") {
          setMentorReceivedNotes(notes);
        }
      } else {
        setProfile({
          name: "User",
          email: currentUser,
          primaryRole: "entrepreneur",
          selectedPrograms: [
            "RCP Small Business Mentorship",
            "SEED Micro-Grant",
            "Business Technical Assistance",
            "Microloan Program",
          ],
          createdAt: new Date().toISOString(),
        });
      }

      const savedSatisfaction = localStorage.getItem(
        `satisfaction_${currentUser}`,
      );
      if (savedSatisfaction) {
        setSatisfactionRate(parseInt(savedSatisfaction));
      }

      const savedGoals = localStorage.getItem(`goals_${currentUser}`);
      if (savedGoals) {
        const goalsData = JSON.parse(savedGoals);
        setGoalsCompleted(goalsData.filter((g: any) => g.completed).length);
        setTotalGoals(goalsData.length);
      }

      // Also refresh mentor info
      const savedMentorInfo = localStorage.getItem("mentor_profile_data");
      if (savedMentorInfo) {
        setMentorInfo(JSON.parse(savedMentorInfo));
      }
    }
    setLoading(false);
  }, []);

  // Listen for changes to mentor_profile_data
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mentor_profile_data") {
        const saved = e.newValue;
        if (saved) {
          setMentorInfo(JSON.parse(saved));
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const role = profile?.primaryRole || "entrepreneur";

  // Coalition Dashboard
  if (role === "coalition") {
    return (
      <CoalitionDashboard
        showToast={showToast}
        router={router}
        profile={profile}
        receivedNotes={coalitionReceivedNotes}
        showAllNotes={coalitionShowAllNotes}
        setShowAllNotes={setCoalitionShowAllNotes}
        markNoteAsRead={markCoalitionNoteAsRead}
      />
    );
  }

  // Partner Dashboard
  if (role === "partner") {
    return (
      <PartnerDashboard
        showToast={showToast}
        router={router}
        profile={profile}
        receivedNotes={partnerReceivedNotes}
        showAllNotes={partnerShowAllNotes}
        setShowAllNotes={setPartnerShowAllNotes}
        markNoteAsRead={markPartnerNoteAsRead}
      />
    );
  }

  // ============================================
  // ENTREPRENEUR DASHBOARD
  // ============================================
  if (role === "entrepreneur") {
    const programs = profile?.selectedPrograms || [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "Business Technical Assistance",
      "Microloan Program",
    ];

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
              <p className="text-emerald-100 mt-2">
                Your entrepreneurial journey is making progress
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                  <p className="text-sm opacity-90">Active Programs</p>
                  <p className="text-2xl font-bold">
                    {programsData.programs.length}
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                  <p className="text-sm opacity-90">Completion Rate</p>
                  <p className="text-2xl font-bold">
                    {programsData.programs.length > 0
                      ? Math.round(
                          programsData.programs.reduce(
                            (acc: number, p: any) => acc + p.progress,
                            0,
                          ) / programsData.programs.length,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  +15%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">4</p>
              <p className="text-sm text-gray-500">Mentoring Sessions</p>
            </div>

            <div
              onClick={() => router.push("/goals")}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {totalGoals - goalsCompleted} left
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">
                {goalsCompleted}
              </p>
              <p className="text-sm text-gray-500">Goals Completed</p>
            </div>

            <div
              onClick={() => router.push("/feedback")}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= satisfactionRate
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">
                {satisfactionRate}/5
              </p>
              <p className="text-sm text-gray-500">Satisfaction Rating</p>
            </div>
          </div>

          {/* Your Active Programs - WITH CRUD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">
                  📋 Your Active Programs
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Programs you're enrolled in
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsProgramEditing(!isProgramEditing)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    isProgramEditing
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {isProgramEditing ? "✓ Done" : "✎ Edit"}
                </button>
                {isProgramEditing && (
                  <button
                    onClick={() => {
                      setEditingProgramId(null);
                      setProgramFormData({
                        name: "",
                        status: "Active",
                        startDate: "",
                        progress: 0,
                        nextMilestone: "",
                        nextMilestoneAction: "",
                        contactEmail: "",
                        contactPhone: "",
                        resources: [],
                        upcomingSessions: [],
                      });
                      setShowProgramAddModal(true);
                    }}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {programsData.programs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No programs yet</p>
                  {isProgramEditing && (
                    <p className="text-xs mt-1">
                      Click "Add" to create a program
                    </p>
                  )}
                </div>
              ) : (
                programsData.programs.map((program: any) => (
                  <div
                    key={program.id}
                    className="p-5 hover:bg-gray-50 transition-colors group relative"
                  >
                    {isProgramEditing && (
                      <div className="absolute right-2 top-2 flex gap-1">
                        <button
                          onClick={() => openEditProgram(program)}
                          className="text-xs text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"
                          title="Edit program"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteProgram(program.id)}
                          className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                          title="Delete program"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isProgramEditing ? (
                              <input
                                type="text"
                                value={program.name}
                                onChange={(e) =>
                                  updateProgram(
                                    program.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="font-semibold text-gray-800 border rounded px-2 py-1 text-sm w-64"
                              />
                            ) : (
                              <p className="font-semibold text-gray-800">
                                {program.name}
                              </p>
                            )}
                            {isProgramEditing ? (
                              <select
                                value={program.status}
                                onChange={(e) =>
                                  updateProgram(
                                    program.id,
                                    "status",
                                    e.target.value,
                                  )
                                }
                                className="text-xs border rounded px-2 py-0.5"
                              >
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="On Hold">On Hold</option>
                              </select>
                            ) : (
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
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            {isProgramEditing ? (
                              <input
                                type="text"
                                value={program.startDate}
                                onChange={(e) =>
                                  updateProgram(
                                    program.id,
                                    "startDate",
                                    e.target.value,
                                  )
                                }
                                className="text-xs text-gray-500 border rounded px-2 py-0.5 w-32"
                                placeholder="Start date"
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  Started {program.startDate}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">
                                Overall Progress
                              </span>
                              {isProgramEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={program.progress}
                                    onChange={(e) =>
                                      updateProgramProgress(
                                        program.id,
                                        parseInt(e.target.value),
                                      )
                                    }
                                    className="w-32 h-1"
                                  />
                                  <span className="text-emerald-600 font-medium w-8 text-right">
                                    {program.progress}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-emerald-600 font-medium">
                                  {program.progress}%
                                </span>
                              )}
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${program.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          {isProgramEditing &&
                            program.nextMilestone !== undefined && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  value={program.nextMilestone || ""}
                                  onChange={(e) =>
                                    updateProgram(
                                      program.id,
                                      "nextMilestone",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Next milestone"
                                  className="text-xs text-gray-500 border rounded px-2 py-0.5 w-full"
                                />
                              </div>
                            )}
                          {!isProgramEditing && program.nextMilestone && (
                            <p className="text-xs text-gray-500 mt-1">
                              📌 Next: {program.nextMilestone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Join Your Next Session Board */}
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

          {/* Mentor Notes Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">
                    Notes from Your Mentor
                  </h3>
                </div>
                <button
                  onClick={() => {
                    const currentUser = localStorage.getItem("currentUser");
                    if (currentUser) {
                      const notes = JSON.parse(
                        localStorage.getItem(`mentee_notes_${currentUser}`) ||
                          "[]",
                      );
                      if (notes.length > 0) {
                        setAllNotes(notes);
                        setShowAllNotesModal(true);
                      } else {
                        showToast("No notes yet from your mentor", "info");
                      }
                    }
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  View All →
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {(() => {
                const currentUser = localStorage.getItem("currentUser");
                if (!currentUser) return null;

                let notes = JSON.parse(
                  localStorage.getItem(`mentee_notes_${currentUser}`) || "[]",
                );

                notes = notes.sort((a: any, b: any) => {
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return (
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                });

                const displayNotes = notes.slice(0, 3);

                if (notes.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No notes yet.</p>
                      <p className="text-xs text-gray-400">
                        Your mentor will leave feedback here.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    {displayNotes.map((note: any) => (
                      <div
                        key={note.id}
                        className="bg-amber-50 rounded-xl p-3 border border-amber-100 group"
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
                          <button
                            onClick={() => {
                              const currentUser =
                                localStorage.getItem("currentUser");
                              if (currentUser) {
                                const allNotes = JSON.parse(
                                  localStorage.getItem(
                                    `mentee_notes_${currentUser}`,
                                  ) || "[]",
                                );
                                const updatedNotes = allNotes.map((n: any) =>
                                  n.id === note.id
                                    ? { ...n, pinned: !n.pinned }
                                    : n,
                                );
                                localStorage.setItem(
                                  `mentee_notes_${currentUser}`,
                                  JSON.stringify(updatedNotes),
                                );
                                window.location.reload();
                              }
                            }}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg ${
                              note.pinned
                                ? "text-yellow-500"
                                : "text-gray-400 hover:text-gray-500"
                            }`}
                            title={note.pinned ? "Unpin note" : "Pin note"}
                          >
                            📌
                          </button>
                        </div>
                        <p className="text-sm text-gray-700">{note.note}</p>
                        {note.pinned && (
                          <div className="mt-2 text-xs text-yellow-600 flex items-center gap-1">
                            📌 Pinned note
                          </div>
                        )}
                      </div>
                    ))}
                    {notes.length > 3 && (
                      <button
                        onClick={() => {
                          const currentUser =
                            localStorage.getItem("currentUser");
                          if (currentUser) {
                            const allNotes = JSON.parse(
                              localStorage.getItem(
                                `mentee_notes_${currentUser}`,
                              ) || "[]",
                            );
                            setAllNotes(allNotes);
                            setShowAllNotesModal(true);
                          }
                        }}
                        className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 py-2"
                      >
                        View all {notes.length} notes →
                      </button>
                    )}
                  </>
                );
              })()}
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

        {/* Add/Edit Program Modal */}
        {showProgramAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProgramId ? "Edit Program" : "Add New Program"}
                </h2>
                <button
                  onClick={closeProgramModal}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Small Business Mentorship"
                    value={programFormData.name || ""}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={programFormData.status || "Active"}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        status: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., January 2025"
                    value={programFormData.startDate || ""}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
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
                    value={programFormData.progress || 0}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        progress: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Milestone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Complete business profile"
                    value={programFormData.nextMilestone || ""}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        nextMilestone: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="program@example.com"
                    value={programFormData.contactEmail || ""}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        contactEmail: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="(555) 123-4567"
                    value={programFormData.contactPhone || ""}
                    onChange={(e) =>
                      setProgramFormData({
                        ...programFormData,
                        contactPhone: e.target.value,
                      })
                    }
                    className="w-full border rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={closeProgramModal}
                  className="flex-1 py-2 border rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (editingProgramId) {
                      saveEditProgram();
                    } else {
                      addProgram();
                    }
                  }}
                  disabled={!programFormData.name}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingProgramId ? "Save Changes" : "Add Program"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Program Details Modal */}
        {showProgramModal && selectedProgram && (
          <ProgramDetailsModal
            program={selectedProgram}
            onClose={() => setShowProgramModal(false)}
          />
        )}

        {/* All Notes Modal */}
        {showAllNotesModal && (
          <AllNotesModal
            notes={allNotes}
            onClose={() => setShowAllNotesModal(false)}
            onTogglePin={(noteId) => {
              const currentUser = localStorage.getItem("currentUser");
              if (currentUser) {
                const notes = JSON.parse(
                  localStorage.getItem(`mentee_notes_${currentUser}`) || "[]",
                );
                const updatedNotes = notes.map((n: any) =>
                  n.id === noteId ? { ...n, pinned: !n.pinned } : n,
                );
                localStorage.setItem(
                  `mentee_notes_${currentUser}`,
                  JSON.stringify(updatedNotes),
                );
                setAllNotes(updatedNotes);
                window.location.reload();
              }
            }}
          />
        )}
      </>
    );
  }

  // ============================================
  // MENTOR DASHBOARD
  // ============================================
  if (role === "mentor") {
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
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Hours This Month</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Earnings</p>
                <p className="text-2xl font-bold">$600</p>
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
                  3 active
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-500">Active Mentees</p>
                  <p className="text-xs text-emerald-600 mt-1">View all →</p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 ring-2 ring-white">
                    SJ
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 ring-2 ring-white">
                    MM
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 ring-2 ring-white">
                    EB
                  </div>
                </div>
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
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-600">
                      SJ
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Sarah Johnson</p>
                    <p className="text-xs text-gray-500">
                      Today, 2:00 PM - Business Plan Review
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/mentor/settings?mentee=1&tab=sessions`)
                    }
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Log Session →
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-600">
                      MM
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      Michael Martinez
                    </p>
                    <p className="text-xs text-gray-500">
                      Tomorrow, 11:00 AM - Marketing Strategy
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/mentor/settings?mentee=2&tab=sessions`)
                    }
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Log Session →
                  </button>
                </div>
              </div>
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
              {mentorReceivedNotes.length > 0 && (
                <button
                  onClick={() => setMentorShowAllNotes(!mentorShowAllNotes)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {mentorShowAllNotes
                    ? "Show Less"
                    : `View All (${mentorReceivedNotes.length})`}
                </button>
              )}
            </div>
          </div>
          <div className="p-5 space-y-3">
            {mentorReceivedNotes.length === 0 ? (
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
              (mentorShowAllNotes
                ? mentorReceivedNotes
                : mentorReceivedNotes.slice(0, 3)
              ).map((note: any) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg transition-colors cursor-pointer ${
                    note.read
                      ? "bg-gray-50"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                  onClick={() => !note.read && markMentorNoteAsRead(note.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-blue-700">
                        {note.subject}
                      </span>
                      {!note.read && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(note.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{note.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From: {note.sentBy}
                  </p>
                </div>
              ))
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
    reportAlerts: true,
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

  const checkForUpcomingSessions = () => {
    const user = localStorage.getItem("currentUser");
    if (!user) return;

    const sessionRemindersEnabled =
      localStorage.getItem("session_reminders_enabled") === "true";
    const browserNotificationsEnabled =
      localStorage.getItem("browser_notifications_enabled") === "true";

    if (!sessionRemindersEnabled) return;

    const savedProfile = localStorage.getItem(`profile_${user}`);
    const profileData = savedProfile ? JSON.parse(savedProfile) : null;

    if (profileData?.primaryRole === "mentor") {
      const mentorProfile = localStorage.getItem(`mentor_profile_${user}`);
      if (mentorProfile) {
        const mentorData = JSON.parse(mentorProfile);
        const today = new Date();

        mentorData.mentees?.forEach((mentee: any) => {
          if (mentee.nextSession) {
            const sessionDate = new Date(mentee.nextSession.date);
            const hoursUntil =
              (sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60);

            if (hoursUntil <= 24 && hoursUntil > 0) {
              const reminderKey = `session_reminder_${mentee.id}_${mentee.nextSession.date}`;
              const sentReminders = JSON.parse(
                localStorage.getItem("sent_session_reminders") || "[]",
              );

              if (!sentReminders.includes(reminderKey)) {
                showToast(
                  `⏰ Reminder: Session with ${mentee.name} tomorrow at ${mentee.nextSession.time} - ${mentee.nextSession.topic}`,
                  "info",
                );

                if (
                  browserNotificationsEnabled &&
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("Upcoming Mentoring Session", {
                    body: `${mentee.name} - ${mentee.nextSession.topic} at ${mentee.nextSession.time}`,
                    icon: "/logo.png",
                  });
                }

                sentReminders.push(reminderKey);
                localStorage.setItem(
                  "sent_session_reminders",
                  JSON.stringify(sentReminders),
                );
              }
            }
          }
        });
      }
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
      return;
    }

    setIsAuthenticated(true);

    const savedProfile = localStorage.getItem(`profile_${user}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setEditForm(parsed);
    } else {
      const name = user.split("@")[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const newProfile = { name: displayName, email: user, role: "Member" };
      setProfile(newProfile);
      setEditForm(newProfile);
    }

    if (user === "admin@ruralcommunity.org") {
      router.push("/admin/dashboard");
    }

    const savedEmailNotifications = localStorage.getItem(
      "email_notifications_enabled",
    );
    const savedSessionReminders = localStorage.getItem(
      "session_reminders_enabled",
    );
    const savedBrowserNotifications = localStorage.getItem(
      "browser_notifications_enabled",
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
    if (savedBrowserNotifications !== null) {
      setSettings((prev) => ({
        ...prev,
        reportAlerts: savedBrowserNotifications === "true",
      }));
    }

    const sessionRemindersEnabled =
      localStorage.getItem("session_reminders_enabled") === "true";
    if (sessionRemindersEnabled) {
      setTimeout(() => checkForUpcomingSessions(), 2000);
    }

    const interval = setInterval(() => {
      if (localStorage.getItem("session_reminders_enabled") === "true") {
        checkForUpcomingSessions();
      }
    }, 3600000);

    return () => clearInterval(interval);
  }, [router]);

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
    if (passwords.newPass.length < 6)
      return setPasswordError("New password must be at least 6 characters.");
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

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Browser notifications
                  </p>
                  <p className="text-xs text-gray-400">
                    Show desktop alerts for important events
                  </p>
                </div>
                <Toggle
                  value={settings.reportAlerts}
                  onChange={(v) => {
                    updateSetting("reportAlerts", v);
                    if (v) {
                      if ("Notification" in window) {
                        if (Notification.permission === "default") {
                          Notification.requestPermission().then(
                            (permission) => {
                              if (permission === "granted") {
                                showToast(
                                  "Browser notifications enabled!",
                                  "success",
                                );
                                localStorage.setItem(
                                  "browser_notifications_enabled",
                                  "true",
                                );
                              }
                            },
                          );
                        } else if (Notification.permission === "granted") {
                          showToast(
                            "Browser notifications enabled!",
                            "success",
                          );
                          localStorage.setItem(
                            "browser_notifications_enabled",
                            "true",
                          );
                          new Notification("Notifications Enabled", {
                            body: "You'll now receive important updates.",
                            icon: "/logo.png",
                          });
                        } else {
                          showToast(
                            "Please allow notifications in your browser settings",
                            "error",
                          );
                          setSettings((prev) => ({
                            ...prev,
                            reportAlerts: false,
                          }));
                        }
                      } else {
                        showToast(
                          "Your browser doesn't support notifications",
                          "error",
                        );
                        setSettings((prev) => ({
                          ...prev,
                          reportAlerts: false,
                        }));
                      }
                    } else {
                      localStorage.setItem(
                        "browser_notifications_enabled",
                        "false",
                      );
                      showToast("Browser notifications disabled", "info");
                    }
                  }}
                />
              </div>
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {profile.name.charAt(0).toUpperCase()}
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
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
        <RoleBasedDashboardContent showToast={showToast} router={router} />
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
