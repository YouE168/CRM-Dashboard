// app/admin/program-management/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  getProgramAccessParticipants,
  setProgramAccessByName,
  getAllParticipantsForMatching,
  assignParticipantMentor,
  getMentors,
  type MentorMatchParticipantRow,
  getAllPrograms,
  updateProgramContact,
  getProgramTracking,
  getProgramTrackingForProgram,
  upsertProgramTracking,
  type ProgramTrackingRow,
  getProgramResources,
  addProgramResource,
  deleteProgramResource,
  type ProgramResourceRow,
} from "@/lib/supabase/dashboard-data";
import { PartnersTab } from "@/components/dashboard/partners-tab";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronRight,
  FileText,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  User,
  RefreshCw,
  Users,
  Check,
  X,
  UserMinus,
  Lock,
  Unlock,
  BarChart3,
  DollarSign,
  Clock,
} from "lucide-react";

interface ProgramResource {
  id: string;
  name: string;
  type: "document" | "link" | "form" | "template";
  url?: string;
  description?: string;
}

interface ProgramSession {
  id: string;
  title: string;
  date: string;
  time: string;
  mentor: string;
  link?: string;
  location?: string;
  description?: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  status: "Active" | "On Hold" | "Completed" | "In Development";
  startDate: string;
  contactEmail: string;
  contactPhone: string;
  managedBy: "jody" | "multiple_mentors" | "admin";
  resources: ProgramResource[];
  upcomingSessions: ProgramSession[];
}

interface Participant {
  user_id?: string;
  email: string;
  name: string;
  programs: string[];
  mentor: string;
  status: string;
  joinedAt: string;
  role?: string;
  businessProfessionalStatus?: string;
  approvedPrograms?: string[];
}

interface Mentor {
  id: string;
  email: string;
  name: string;
  expertise?: string[];
  available?: boolean;
}

const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "prog-1",
    name: "RCP Small Business Mentorship",
    description:
      "Connect with experienced local mentors for one-on-one guidance.",
    status: "Active",
    startDate: "January 2025",
    contactEmail: "mentorship@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0101",
    managedBy: "multiple_mentors",
    resources: [
      {
        id: "res-1",
        name: "Mentor Directory",
        type: "link",
        url: "/resources/mentor-directory",
      },
      {
        id: "res-2",
        name: "Business Planning Templates",
        type: "template",
        url: "/resources/templates",
      },
    ],
    upcomingSessions: [
      {
        id: "session-1",
        title: "Business Plan Review",
        date: "June 10, 2025",
        time: "2:00 PM",
        mentor: "Michael Chen",
      },
    ],
  },
  {
    id: "prog-2",
    name: "SEED Micro-Grant",
    description:
      "10-week SEK Catalyst cohort with mentorship and grant opportunities.",
    status: "Active",
    startDate: "January 2025",
    contactEmail: "seed@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0102",
    managedBy: "multiple_mentors",
    resources: [
      {
        id: "res-3",
        name: "Cohort Calendar",
        type: "document",
        url: "/resources/seed-calendar",
      },
      {
        id: "res-4",
        name: "Grant Application Guide",
        type: "document",
        url: "/resources/grant-guide",
      },
    ],
    upcomingSessions: [
      {
        id: "session-2",
        title: "Weekly Cohort Meeting",
        date: "June 12, 2025",
        time: "10:00 AM",
        mentor: "David Park",
      },
    ],
  },
  {
    id: "prog-3",
    name: "Business Professional Services",
    description: "Financial modeling, startup support, and capital connection.",
    status: "Active",
    startDate: "January 2025",
    contactEmail: "jody@hbcat.org",
    contactPhone: "(620) 555-0103",
    managedBy: "jody",
    resources: [
      {
        id: "res-5",
        name: "Financial Templates",
        type: "template",
        url: "/resources/financial-templates",
      },
      {
        id: "res-6",
        name: "Capital Readiness Guide",
        type: "document",
        url: "/resources/capital-guide",
      },
    ],
    upcomingSessions: [
      {
        id: "session-3",
        title: "Financial Planning Session",
        date: "June 15, 2025",
        time: "1:00 PM",
        mentor: "Tom Anderson",
      },
    ],
  },
  {
    id: "prog-4",
    name: "SEK Catalyst: Empowered by KU",
    description: "12-week entrepreneurship program with KU resources.",
    status: "Active",
    startDate: "August 2025",
    contactEmail: "catalyst@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0105",
    managedBy: "multiple_mentors",
    resources: [
      {
        id: "res-7",
        name: "Program Guide",
        type: "document",
        url: "/resources/sek-catalyst-guide",
      },
      {
        id: "res-8",
        name: "Workshop Schedule",
        type: "document",
        url: "/resources/sek-catalyst-schedule",
      },
    ],
    upcomingSessions: [
      {
        id: "session-4",
        title: "Program Kickoff & Orientation",
        date: "September 5, 2025",
        time: "6:00 PM",
        mentor: "Jody Program",
      },
    ],
  },
];

const AVAILABLE_PROGRAMS = [
  "RCP Small Business Mentorship",
  "SEED Micro-Grant",
  "SEK Catalyst: Empowered by KU",
];

export default function ProgramManagementPage() {
  const router = useRouter();
  // Top-level view: "programs" is the existing per-program management
  // (Participants/Program Access/Tracking come from user_programs +
  // program_tracking - entrepreneur & mentee accounts). "partners" is a
  // completely separate data source (partner_profile_data/
  // partner_collaborations/partner_resources, one row per partner org,
  // self-reported by the partner) - looks similar (programs, hours,
  // outcomes) but is not the same records or the same table.
  const [pageView, setPageView] = useState<"programs" | "partners">(
    "programs",
  );
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState<string>("sessions");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [matchingParticipants, setMatchingParticipants] = useState<
    MentorMatchParticipantRow[]
  >([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newSession, setNewSession] = useState<any>({});
  const [newResource, setNewResource] = useState<any>({});
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [currentAdminUserId, setCurrentAdminUserId] = useState<string | null>(
    null,
  );
  const [programResourcesAdmin, setProgramResourcesAdmin] = useState<
    ProgramResourceRow[]
  >([]);
  // Tracking is per (program, participant) - budget/grants/outcomes differ
  // for each entrepreneur, so Jody picks a participant from a dropdown
  // before entering their numbers. programTrackingByParticipant holds every
  // participant's row already entered for the selected program, keyed by
  // participant_id, so the dropdown can show who already has data.
  const [programTrackingByParticipant, setProgramTrackingByParticipant] =
    useState<Record<string, ProgramTrackingRow>>({});
  const [trackingParticipantId, setTrackingParticipantId] = useState<
    string | null
  >(null);
  const [trackingForm, setTrackingForm] = useState<any>({});
  const [loadingProgramExtras, setLoadingProgramExtras] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);

  const emptyTrackingForm = {
    budget: 0,
    spent: 0,
    grants_received: 0,
    grants_pending: 0,
    businesses_launched: 0,
    businesses_expanded: 0,
    jobs_created: 0,
    jobs_retained: 0,
    capital_accessed: 0,
    revenue_growth_pct: 0,
    staff_hours: 0,
    outcomes_notes: "",
  };

  // Load real tracking (all participants) + resources whenever a
  // different program is selected in the left-hand list.
  useEffect(() => {
    if (!selectedProgram) {
      setProgramResourcesAdmin([]);
      setProgramTrackingByParticipant({});
      setTrackingParticipantId(null);
      setTrackingForm({});
      return;
    }
    let cancelled = false;
    setLoadingProgramExtras(true);
    setTrackingParticipantId(null);
    Promise.all([
      getProgramTrackingForProgram(selectedProgram.id).catch(() => ({})),
      getProgramResources(selectedProgram.id).catch(() => []),
    ]).then(([tracking, resources]) => {
      if (cancelled) return;
      setProgramTrackingByParticipant(tracking);
      setProgramResourcesAdmin(resources);
      setLoadingProgramExtras(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedProgram?.id]);

  // Load the selected participant's own numbers (or a blank form) into the
  // editable fields whenever the participant picker changes.
  useEffect(() => {
    if (!trackingParticipantId) {
      setTrackingForm({});
      return;
    }
    setTrackingForm(
      programTrackingByParticipant[trackingParticipantId] || emptyTrackingForm,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingParticipantId, programTrackingByParticipant]);

  const reloadProgramResources = async () => {
    if (!selectedProgram) return;
    try {
      const resources = await getProgramResources(selectedProgram.id);
      setProgramResourcesAdmin(resources);
    } catch (err) {
      console.error("Failed to reload resources:", err);
    }
  };

  const saveTracking = async () => {
    if (!selectedProgram || !trackingParticipantId) return;
    setSavingTracking(true);
    try {
      await upsertProgramTracking(selectedProgram.id, trackingParticipantId, {
        budget: Number(trackingForm.budget) || 0,
        spent: Number(trackingForm.spent) || 0,
        grants_received: Number(trackingForm.grants_received) || 0,
        grants_pending: Number(trackingForm.grants_pending) || 0,
        businesses_launched: Number(trackingForm.businesses_launched) || 0,
        businesses_expanded: Number(trackingForm.businesses_expanded) || 0,
        jobs_created: Number(trackingForm.jobs_created) || 0,
        jobs_retained: Number(trackingForm.jobs_retained) || 0,
        capital_accessed: Number(trackingForm.capital_accessed) || 0,
        revenue_growth_pct: Number(trackingForm.revenue_growth_pct) || 0,
        staff_hours: Number(trackingForm.staff_hours) || 0,
        outcomes_notes: trackingForm.outcomes_notes || null,
      });
      const refreshed = await getProgramTrackingForProgram(selectedProgram.id);
      setProgramTrackingByParticipant(refreshed);
      alert("✅ Tracking data saved!");
    } catch (err) {
      console.error("Failed to save tracking:", err);
      alert("Failed to save tracking data. Please try again.");
    } finally {
      setSavingTracking(false);
    }
  };

  const addResourceReal = async () => {
    if (!selectedProgram || !newResource.name) return;
    try {
      await addProgramResource({
        program_id: selectedProgram.id,
        name: newResource.name,
        type: newResource.type || "document",
        url: newResource.url,
        description: newResource.description,
      });
      await reloadProgramResources();
      setIsAddingResource(false);
      setNewResource({});
    } catch (err) {
      console.error("Failed to add resource:", err);
      alert("Failed to add resource. Please try again.");
    }
  };

  const removeResourceReal = async (id: string) => {
    if (!confirm("Remove this resource?")) return;
    try {
      await deleteProgramResource(id);
      await reloadProgramResources();
    } catch (err) {
      console.error("Failed to remove resource:", err);
      alert("Failed to remove resource. Please try again.");
    }
  };

  const saveContactInfo = async () => {
    if (!selectedProgram) return;
    try {
      await updateProgramContact(selectedProgram.id, {
        contact_email: selectedProgram.contactEmail,
        contact_phone: selectedProgram.contactPhone,
      });
      alert("✅ Contact information saved!");
    } catch (err) {
      console.error("Failed to save contact info:", err);
      alert("Failed to save contact info. Please try again.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      if (cancelled) return;
      setCurrentAdminUserId(authData.user.id);

      loadPrograms();
      loadParticipants();
      loadMentors();
      loadMatchingParticipants();
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Real programs from the programs table - replaces the old
  // localStorage("entrepreneur_programs_data")/DEFAULT_PROGRAMS mock,
  // which used fake ids ("prog-1") that never matched the real
  // programs.id used by user_programs/program_tracking/program_resources.
  const loadPrograms = async () => {
    try {
      const real = await getAllPrograms();
      setPrograms(
        real.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          status: (p.status as Program["status"]) || "Active",
          startDate: p.start_date
            ? new Date(p.start_date).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : "",
          contactEmail: p.contact_email || "",
          contactPhone: p.contact_phone || "",
          managedBy: (p.managed_by as Program["managedBy"]) || "admin",
          resources: [],
          upcomingSessions: [],
        })),
      );
    } catch (err) {
      console.error("Failed to load programs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real participant list + real program approvals from Supabase
  // (user_programs.approved), replacing the old
  // localStorage("users")/localStorage(`profile_${email}`) reads, which
  // are always empty now that signup/login use real Supabase auth. Note:
  // the "programs" (self-reported interest), "mentor", and
  // "businessProfessionalStatus" fields below have no real backing table
  // yet, so the Approvals and Mentor Matching tabs (which filter on
  // "programs") will still show empty until those are wired up too - only
  // the Program Access tab is fully real right now.
  const loadParticipants = async () => {
    try {
      const real = await getProgramAccessParticipants();
      setParticipants(
        real.map((p) => ({
          user_id: p.user_id,
          email: p.email,
          name: p.name,
          programs: [],
          mentor: "Not assigned",
          status: "active",
          joinedAt: "",
          role: p.primary_role,
          businessProfessionalStatus: "pending",
          approvedPrograms: p.approvedProgramNames,
        })),
      );
    } catch (err) {
      console.error("Failed to load participants:", err);
    }
  };

  const loadMentors = async () => {
    try {
      const real = await getMentors();
      setMentors(
        real.map((m) => ({
          id: m.id,
          email: m.email || "",
          name: m.name,
          expertise: m.specialty ? [m.specialty] : [],
          available: m.status === "active",
        })),
      );
    } catch (err) {
      console.error("Failed to load mentors:", err);
    }
  };

  // Real participants table rows for mentor matching - this is the
  // actual mentorship enrollment record, separate from the
  // users/user_programs data behind the Program Access tab.
  const loadMatchingParticipants = async () => {
    try {
      const real = await getAllParticipantsForMatching();
      setMatchingParticipants(real);
    } catch (err) {
      console.error("Failed to load participants for matching:", err);
    }
  };

  const savePrograms = (updatedPrograms: Program[]) => {
    localStorage.setItem(
      "entrepreneur_programs_data",
      JSON.stringify({ programs: updatedPrograms }),
    );
    setPrograms(updatedPrograms);
  };

  // Real writes to user_programs.approved via Supabase. Takes the whole
  // participant object (not just email) since we need their real user_id.
  const approveProgramAccess = async (
    participant: Participant,
    programName: string,
  ) => {
    if (!participant.user_id) return;
    try {
      await setProgramAccessByName(
        participant.user_id,
        programName,
        true,
        currentAdminUserId || undefined,
      );
      setParticipants((prev) =>
        prev.map((p) =>
          p.email === participant.email
            ? {
                ...p,
                approvedPrograms: Array.from(
                  new Set([...(p.approvedPrograms || []), programName]),
                ),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Failed to approve program access:", err);
      alert("Failed to approve program access. Please try again.");
    }
  };

  const removeProgramAccess = async (
    participant: Participant,
    programName: string,
  ) => {
    if (!participant.user_id) return;
    try {
      await setProgramAccessByName(participant.user_id, programName, false);
      setParticipants((prev) =>
        prev.map((p) =>
          p.email === participant.email
            ? {
                ...p,
                approvedPrograms: (p.approvedPrograms || []).filter(
                  (name) => name !== programName,
                ),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("Failed to remove program access:", err);
      alert("Failed to remove program access. Please try again.");
    }
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    if (program.managedBy === "jody") {
      setActiveTab("sessions");
    } else if (program.managedBy === "multiple_mentors") {
      setActiveTab("matching");
    } else {
      setActiveTab("resources");
    }
  };

  const handleDelete = (programId: string) => {
    if (confirm("Are you sure you want to delete this program?")) {
      const updatedPrograms = programs.filter((p) => p.id !== programId);
      savePrograms(updatedPrograms);
      if (selectedProgram?.id === programId) {
        setSelectedProgram(null);
      }
    }
  };

  const addSession = () => {
    if (!selectedProgram) return;
    const session = {
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: newSession.title || "New Session",
      date: newSession.date || new Date().toISOString().split("T")[0],
      time: newSession.time || "12:00 PM",
      mentor: newSession.mentor || "Jody Love",
      link: newSession.link || "",
      location: newSession.location || "",
      description: newSession.description || "",
    };
    const updatedProgram = {
      ...selectedProgram,
      upcomingSessions: [...(selectedProgram.upcomingSessions || []), session],
    };
    const updatedPrograms = programs.map((p) =>
      p.id === selectedProgram.id ? updatedProgram : p,
    );
    savePrograms(updatedPrograms);
    setSelectedProgram(updatedProgram);
    setIsAddingSession(false);
    setNewSession({});
    alert("✅ Session added successfully!");
  };

  const removeSession = (sessionId: string) => {
    if (!selectedProgram) return;
    if (!confirm("Remove this session?")) return;
    const updatedProgram = {
      ...selectedProgram,
      upcomingSessions: selectedProgram.upcomingSessions.filter(
        (s) => s.id !== sessionId,
      ),
    };
    const updatedPrograms = programs.map((p) =>
      p.id === selectedProgram.id ? updatedProgram : p,
    );
    savePrograms(updatedPrograms);
    setSelectedProgram(updatedProgram);
  };

  const updateParticipantStatus = (
    email: string,
    status: "approved" | "pending" | "rejected",
  ) => {
    const profile = JSON.parse(
      localStorage.getItem(`profile_${email}`) || "{}",
    );
    profile.businessProfessionalStatus = status;
    localStorage.setItem(`profile_${email}`, JSON.stringify(profile));
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u: any) => {
      if (u.email === email) {
        return { ...u, businessProfessionalStatus: status };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setParticipants((prev) =>
      prev.map((p) =>
        p.email === email ? { ...p, businessProfessionalStatus: status } : p,
      ),
    );
    alert(
      `✅ ${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"} ${email}`,
    );
  };

  // Real write to participants.mentor - this is what the mentee/
  // entrepreneur dashboard's "Your Mentor" card reads.
  const updateParticipantMentorReal = async (
    participantId: string,
    mentor: string | null,
  ) => {
    try {
      await assignParticipantMentor(participantId, mentor);
      setMatchingParticipants((prev) =>
        prev.map((p) => (p.id === participantId ? { ...p, mentor } : p)),
      );
    } catch (err) {
      console.error("Failed to update mentor match:", err);
      alert("Failed to update mentor assignment. Please try again.");
    }
  };

  const matchMentorToParticipant = (
    participantId: string,
    mentorId: string,
  ) => {
    if (!mentorId) {
      alert("Please select a mentor");
      return;
    }
    const mentorName = mentors.find((m) => m.id === mentorId)?.name;
    if (!mentorName) {
      alert("Couldn't find that mentor. Please try again.");
      return;
    }
    updateParticipantMentorReal(participantId, mentorName);
  };

  const removeMentorMatch = (participantId: string) => {
    if (!confirm("Remove mentor assignment for this participant?")) return;
    updateParticipantMentorReal(participantId, null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading programs...</p>
        </div>
      </div>
    );
  }

  const isJodyProgram = selectedProgram?.managedBy === "jody";
  const isMentorProgram = selectedProgram?.managedBy === "multiple_mentors";
  // Participants enrolled in the currently selected program - used by the
  // Tracking tab's "select a participant" dropdown, since each
  // entrepreneur's budget/grants/outcomes are entered individually.
  const trackingProgramParticipants = selectedProgram
    ? matchingParticipants.filter(
        (p) => p.program_name === selectedProgram.name,
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-sm text-emerald-600 hover:text-emerald-700 mb-2 block flex items-center gap-1"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              📋 Program Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage program sessions, resources, and mentor matching
            </p>
          </div>
          <button
            onClick={() => {
              loadPrograms();
              loadParticipants();
              loadMentors();
              loadMatchingParticipants();
              alert("🔄 Data refreshed!");
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Programs vs Partners - two different data sources that both
            talk about "programs," so the toggle is labeled explicitly to
            avoid confusion. */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setPageView("programs")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pageView === "programs"
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            📋 Programs (Participants)
          </button>
          <button
            onClick={() => setPageView("partners")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pageView === "partners"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            🤝 Partners
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          {pageView === "programs"
            ? "Sessions, Program Access, Tracking, and Resources for mentee & entrepreneur participants enrolled in a program."
            : "Self-reported collaborations, internships, and shared resources from partner organizations - a separate set of accounts and data from the participants above, even though both reference the same programs catalog."}
        </p>

        {pageView === "partners" ? (
          <PartnersTab />
        ) : (
        <>
        {/* Program List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="font-semibold text-gray-900">Programs</h2>
              <p className="text-xs text-gray-500">
                {programs.length} programs
              </p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {programs.map((program, idx) => (
                <button
                  key={program.id ?? `program-${idx}`}
                  onClick={() => handleEdit(program)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    selectedProgram?.id === program.id
                      ? "bg-emerald-50 border-l-4 border-emerald-500"
                      : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {program.name}
                      </p>
                      {program.managedBy === "jody" && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full flex-shrink-0">
                          👩‍💼 Jody
                        </span>
                      )}
                      {program.managedBy === "multiple_mentors" && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                          👨‍🏫 Mentors
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
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
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2">
            {selectedProgram ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-semibold text-gray-900 truncate">
                        {selectedProgram.name}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedProgram.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
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
                        <span className="text-xs text-gray-400">
                          Started {selectedProgram.startDate}
                        </span>
                        {selectedProgram.managedBy === "jody" && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            👩‍💼 Jody's Program
                          </span>
                        )}
                        {selectedProgram.managedBy === "multiple_mentors" && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            👨‍🏫 Mentor Program
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(selectedProgram.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex gap-2 overflow-x-auto">
                    {isJodyProgram && (
                      <button
                        key="tab-sessions"
                        onClick={() => setActiveTab("sessions")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                          activeTab === "sessions"
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        Sessions
                      </button>
                    )}
                    {isJodyProgram && (
                      <button
                        key="tab-approvals"
                        onClick={() => setActiveTab("participants")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                          activeTab === "participants"
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        Approvals
                      </button>
                    )}
                    {isJodyProgram && (
                      <button
                        key="tab-program-approvals"
                        onClick={() => setActiveTab("program-approvals")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                          activeTab === "program-approvals"
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Lock className="h-4 w-4" />
                        Program Access
                      </button>
                    )}
                    {isMentorProgram && (
                      <button
                        key="tab-matching"
                        onClick={() => setActiveTab("matching")}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                          activeTab === "matching"
                            ? "border-emerald-500 text-emerald-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        Mentor Matching
                      </button>
                    )}
                    <button
                      key="tab-tracking"
                      onClick={() => setActiveTab("tracking")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "tracking"
                          ? "border-emerald-500 text-emerald-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Tracking
                    </button>
                    <button
                      key="tab-resources"
                      onClick={() => setActiveTab("resources")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "resources"
                          ? "border-emerald-500 text-emerald-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      Resources
                    </button>
                    <button
                      key="tab-contact"
                      onClick={() => setActiveTab("contact")}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === "contact"
                          ? "border-emerald-500 text-emerald-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 max-h-[600px] overflow-y-auto">
                  {/* SESSIONS TAB */}
                  {activeTab === "sessions" && isJodyProgram && (
                    <div className="space-y-4">
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mb-4">
                        <p className="text-sm text-amber-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Jody's sessions for this program. These will appear in
                          participants' dashboards.
                        </p>
                      </div>
                      {selectedProgram.upcomingSessions.length === 0 ? (
                        <div
                          key="no-sessions"
                          className="text-center py-8 text-gray-400"
                        >
                          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No sessions added yet</p>
                          <p className="text-xs mt-1">
                            Click "Add Session" to create one
                          </p>
                        </div>
                      ) : (
                        selectedProgram.upcomingSessions.map((session) => (
                          <div
                            key={session.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                          >
                            {/* Session content */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={session.title}
                                  onChange={(e) => {
                                    const updated =
                                      selectedProgram.upcomingSessions.map(
                                        (s) =>
                                          s.id === session.id
                                            ? { ...s, title: e.target.value }
                                            : s,
                                      );
                                    const prog = {
                                      ...selectedProgram,
                                      upcomingSessions: updated,
                                    };
                                    setSelectedProgram(prog);
                                    savePrograms(
                                      programs.map((p) =>
                                        p.id === selectedProgram.id ? prog : p,
                                      ),
                                    );
                                  }}
                                  className="w-full bg-transparent font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-emerald-500"
                                  placeholder="Session title"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <input
                                    type="text"
                                    value={session.date}
                                    onChange={(e) => {
                                      const updated =
                                        selectedProgram.upcomingSessions.map(
                                          (s) =>
                                            s.id === session.id
                                              ? { ...s, date: e.target.value }
                                              : s,
                                        );
                                      const prog = {
                                        ...selectedProgram,
                                        upcomingSessions: updated,
                                      };
                                      setSelectedProgram(prog);
                                      savePrograms(
                                        programs.map((p) =>
                                          p.id === selectedProgram.id
                                            ? prog
                                            : p,
                                        ),
                                      );
                                    }}
                                    className="bg-white border rounded-lg px-2 py-1 text-sm"
                                    placeholder="Date"
                                  />
                                  <input
                                    type="text"
                                    value={session.time}
                                    onChange={(e) => {
                                      const updated =
                                        selectedProgram.upcomingSessions.map(
                                          (s) =>
                                            s.id === session.id
                                              ? { ...s, time: e.target.value }
                                              : s,
                                        );
                                      const prog = {
                                        ...selectedProgram,
                                        upcomingSessions: updated,
                                      };
                                      setSelectedProgram(prog);
                                      savePrograms(
                                        programs.map((p) =>
                                          p.id === selectedProgram.id
                                            ? prog
                                            : p,
                                        ),
                                      );
                                    }}
                                    className="bg-white border rounded-lg px-2 py-1 text-sm"
                                    placeholder="Time"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={session.mentor}
                                  onChange={(e) => {
                                    const updated =
                                      selectedProgram.upcomingSessions.map(
                                        (s) =>
                                          s.id === session.id
                                            ? { ...s, mentor: e.target.value }
                                            : s,
                                      );
                                    const prog = {
                                      ...selectedProgram,
                                      upcomingSessions: updated,
                                    };
                                    setSelectedProgram(prog);
                                    savePrograms(
                                      programs.map((p) =>
                                        p.id === selectedProgram.id ? prog : p,
                                      ),
                                    );
                                  }}
                                  className="w-full bg-white border rounded-lg px-2 py-1 text-sm mt-2"
                                  placeholder="Mentor name"
                                />
                                <input
                                  type="text"
                                  value={session.link || ""}
                                  onChange={(e) => {
                                    const updated =
                                      selectedProgram.upcomingSessions.map(
                                        (s) =>
                                          s.id === session.id
                                            ? { ...s, link: e.target.value }
                                            : s,
                                      );
                                    const prog = {
                                      ...selectedProgram,
                                      upcomingSessions: updated,
                                    };
                                    setSelectedProgram(prog);
                                    savePrograms(
                                      programs.map((p) =>
                                        p.id === selectedProgram.id ? prog : p,
                                      ),
                                    );
                                  }}
                                  className="w-full bg-white border rounded-lg px-2 py-1 text-sm mt-1"
                                  placeholder="Zoom Link (optional)"
                                />
                              </div>
                              <button
                                onClick={() => removeSession(session.id)}
                                className="text-gray-400 hover:text-red-600 ml-2 p-1 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      {isAddingSession ? (
                        <div
                          key="add-session-form"
                          className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-emerald-300"
                        >
                          <h4 className="font-medium text-gray-900 mb-3">
                            New Session
                          </h4>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Session Title *"
                              value={newSession.title || ""}
                              onChange={(e) =>
                                setNewSession({
                                  ...newSession,
                                  title: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="date"
                                value={newSession.date || ""}
                                onChange={(e) =>
                                  setNewSession({
                                    ...newSession,
                                    date: e.target.value,
                                  })
                                }
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                              <input
                                type="time"
                                value={newSession.time || ""}
                                onChange={(e) =>
                                  setNewSession({
                                    ...newSession,
                                    time: e.target.value,
                                  })
                                }
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Mentor (optional)"
                              value={newSession.mentor || "Jody Love"}
                              onChange={(e) =>
                                setNewSession({
                                  ...newSession,
                                  mentor: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Zoom Link (optional)"
                              value={newSession.link || ""}
                              onChange={(e) =>
                                setNewSession({
                                  ...newSession,
                                  link: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={addSession}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              >
                                Add Session
                              </button>
                              <button
                                onClick={() => {
                                  setIsAddingSession(false);
                                  setNewSession({});
                                }}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          key="add-session-btn"
                          onClick={() => setIsAddingSession(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <Plus className="h-4 w-4 inline mr-1" />
                          Add Session
                        </button>
                      )}
                    </div>
                  )}

                  {/* APPROVALS TAB */}
                  {activeTab === "participants" && isJodyProgram && (
                    <div>
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mb-4">
                        <p className="text-sm text-amber-700 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Approve or reject participants for this program.
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Participant
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Email
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Status
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants
                              .filter((p) =>
                                p.programs.includes(selectedProgram.name),
                              )
                              .map((p, idx) => (
                                <tr
                                  key={`participant-${p.email}-${idx}`}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900">
                                    {p.name}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-500">
                                    {p.email}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        p.businessProfessionalStatus ===
                                          "approved" ||
                                        p.businessProfessionalStatus ===
                                          "active"
                                          ? "bg-green-100 text-green-700"
                                          : p.businessProfessionalStatus ===
                                              "rejected"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {p.businessProfessionalStatus ||
                                        "pending"}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex gap-2">
                                      {p.businessProfessionalStatus !==
                                        "approved" &&
                                        p.businessProfessionalStatus !==
                                          "active" && (
                                          <button
                                            key={`approve-${p.email}`}
                                            onClick={() =>
                                              updateParticipantStatus(
                                                p.email,
                                                "approved",
                                              )
                                            }
                                            className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                          >
                                            <Check className="h-3 w-3" />
                                            Approve
                                          </button>
                                        )}
                                      {p.businessProfessionalStatus !==
                                        "rejected" && (
                                        <button
                                          key={`reject-${p.email}`}
                                          onClick={() =>
                                            updateParticipantStatus(
                                              p.email,
                                              "rejected",
                                            )
                                          }
                                          className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 flex items-center gap-1"
                                        >
                                          <X className="h-3 w-3" />
                                          Reject
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PROGRAM ACCESS TAB */}
                  {activeTab === "program-approvals" && isJodyProgram && (
                    <div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Manage which programs participants can access. Only
                          "Business Professional Services" is available by
                          default.
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Participant
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Email
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Approved Programs
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.length === 0 ? (
                              <tr key="no-participants">
                                <td
                                  colSpan={4}
                                  className="text-center py-8 text-gray-400"
                                >
                                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>No participants found</p>
                                </td>
                              </tr>
                            ) : (
                              participants.map((p, idx) => (
                                <tr
                                  key={`program-approval-${p.email}-${idx}`}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900">
                                    {p.name}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-500">
                                    {p.email}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {p.approvedPrograms &&
                                      p.approvedPrograms.length > 0 ? (
                                        p.approvedPrograms.map(
                                          (prog: string) => (
                                            <span
                                              key={`approved-${p.email}-${prog}`}
                                              className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1"
                                            >
                                              <Check className="h-3 w-3" />
                                              {prog.length > 20
                                                ? prog.substring(0, 20) + "..."
                                                : prog}
                                            </span>
                                          ),
                                        )
                                      ) : (
                                        <span
                                          key={`no-approved-${p.email}`}
                                          className="text-xs text-gray-400"
                                        >
                                          Only Business Professional Services
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {AVAILABLE_PROGRAMS.map((programName) => {
                                        const isApproved =
                                          p.approvedPrograms?.includes(
                                            programName,
                                          ) || false;
                                        return (
                                          <div
                                            key={`action-wrapper-${p.email}-${programName}`}
                                            className="inline-block"
                                          >
                                            <button
                                              onClick={() => {
                                                if (isApproved) {
                                                  removeProgramAccess(
                                                    p,
                                                    programName,
                                                  );
                                                } else {
                                                  approveProgramAccess(
                                                    p,
                                                    programName,
                                                  );
                                                }
                                              }}
                                              className={`text-xs px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                                                isApproved
                                                  ? "bg-green-500 text-white hover:bg-green-600"
                                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                              }`}
                                            >
                                              {isApproved ? (
                                                <>
                                                  <Check className="h-3 w-3" />
                                                  {programName.length > 15
                                                    ? programName.substring(
                                                        0,
                                                        15,
                                                      ) + "..."
                                                    : programName}
                                                </>
                                              ) : (
                                                <>
                                                  <Lock className="h-3 w-3" />
                                                  {programName.length > 15
                                                    ? programName.substring(
                                                        0,
                                                        15,
                                                      ) + "..."
                                                    : programName}
                                                </>
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* MENTOR MATCHING TAB */}
                  {activeTab === "matching" && isMentorProgram && (
                    <div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Match mentors with participants.
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          Available Mentors
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {mentors.length > 0 ? (
                            mentors.map((mentor, idx) => (
                              <span
                                key={mentor.id || `mentor-${idx}`}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                              >
                                {mentor.name}
                                <span className="text-xs text-blue-500">
                                  ({mentor.email || "no email"})
                                </span>
                              </span>
                            ))
                          ) : (
                            <p
                              key="no-mentors"
                              className="text-sm text-gray-400"
                            >
                              No mentors registered yet
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Participant
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Email
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Assigned Mentor
                              </th>
                              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchingParticipants.length === 0 ? (
                              <tr key="no-matching-participants">
                                <td
                                  colSpan={4}
                                  className="text-center py-8 text-gray-400"
                                >
                                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>No participants found</p>
                                  <p className="text-xs mt-1">
                                    Participants show up here once they have
                                    a record in the participants table
                                  </p>
                                </td>
                              </tr>
                            ) : (
                              matchingParticipants
                                .filter(
                                  (p) => p.program_name === selectedProgram.name,
                                )
                                .map((p) => (
                                  <tr
                                    key={`matching-${p.id}`}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">
                                      {p.name}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-500">
                                      {p.email}
                                    </td>
                                    <td className="py-2 px-3 text-sm">
                                      <span
                                        className={`font-medium ${p.mentor ? "text-emerald-600" : "text-gray-400"}`}
                                      >
                                        {p.mentor || "Not assigned"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex gap-2">
                                        {p.mentor ? (
                                          <button
                                            key={`unassign-${p.id}`}
                                            onClick={() =>
                                              removeMentorMatch(p.id)
                                            }
                                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                          >
                                            <UserMinus className="h-3 w-3" />
                                            Unassign
                                          </button>
                                        ) : (
                                          <select
                                            key={`assign-${p.id}`}
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                matchMentorToParticipant(
                                                  p.id,
                                                  e.target.value,
                                                );
                                              }
                                            }}
                                            className="text-xs border rounded-lg px-2 py-1 bg-white"
                                            defaultValue=""
                                          >
                                            <option value="">
                                              Assign mentor...
                                            </option>
                                            {mentors.map((mentor) => (
                                              <option
                                                key={mentor.id}
                                                value={mentor.id}
                                              >
                                                {mentor.name}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TRACKING TAB */}
                  {activeTab === "tracking" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Each participant's budget, grants and outcomes are
                          tracked individually — select who you're entering
                          numbers for.
                        </p>
                      </div>
                      {loadingProgramExtras ? (
                        <div className="text-center py-8 text-gray-400">
                          Loading...
                        </div>
                      ) : trackingProgramParticipants.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm font-medium text-gray-500">
                            No participants enrolled in this program yet
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Approve someone for this program first, then come
                            back to enter their tracking numbers.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Participant
                            </label>
                            <select
                              value={trackingParticipantId || ""}
                              onChange={(e) =>
                                setTrackingParticipantId(
                                  e.target.value || null,
                                )
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                            >
                              <option value="">Select a participant...</option>
                              {trackingProgramParticipants.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name || p.email || "Unnamed"}
                                  {programTrackingByParticipant[p.id]
                                    ? " ✓ has data"
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          {!trackingParticipantId ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                              Pick a participant above to view or edit their
                              tracking numbers.
                            </div>
                          ) : (
                            <>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Budget &amp; Grants
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {(
                                    [
                                      ["budget", "Budget ($)"],
                                      ["spent", "Spent ($)"],
                                      [
                                        "grants_received",
                                        "Grants Received ($)",
                                      ],
                                      ["grants_pending", "Grants Pending ($)"],
                                      [
                                        "capital_accessed",
                                        "Capital Accessed ($)",
                                      ],
                                      [
                                        "revenue_growth_pct",
                                        "Revenue Growth (%)",
                                      ],
                                    ] as const
                                  ).map(([key, label]) => (
                                    <div key={key}>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        {label}
                                      </label>
                                      <input
                                        type="number"
                                        value={trackingForm[key] ?? 0}
                                        onChange={(e) =>
                                          setTrackingForm({
                                            ...trackingForm,
                                            [key]: e.target.value,
                                          })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Staff Time
                                </h4>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Staff Hours
                                  </label>
                                  <input
                                    type="number"
                                    value={trackingForm.staff_hours ?? 0}
                                    onChange={(e) =>
                                      setTrackingForm({
                                        ...trackingForm,
                                        staff_hours: e.target.value,
                                      })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-3">
                                  Outcomes
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  {(
                                    [
                                      [
                                        "businesses_launched",
                                        "Businesses Launched",
                                      ],
                                      [
                                        "businesses_expanded",
                                        "Businesses Expanded",
                                      ],
                                      ["jobs_created", "Jobs Created"],
                                      ["jobs_retained", "Jobs Retained"],
                                    ] as const
                                  ).map(([key, label]) => (
                                    <div key={key}>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">
                                        {label}
                                      </label>
                                      <input
                                        type="number"
                                        value={trackingForm[key] ?? 0}
                                        onChange={(e) =>
                                          setTrackingForm({
                                            ...trackingForm,
                                            [key]: e.target.value,
                                          })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3">
                                  <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Notes (attendance, session counts, loan
                                    pipeline, or anything else specific to
                                    this program)
                                  </label>
                                  <textarea
                                    value={trackingForm.outcomes_notes ?? ""}
                                    onChange={(e) =>
                                      setTrackingForm({
                                        ...trackingForm,
                                        outcomes_notes: e.target.value,
                                      })
                                    }
                                    rows={3}
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={saveTracking}
                                disabled={savingTracking}
                                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {savingTracking
                                  ? "Saving..."
                                  : "💾 Save Tracking Data"}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* RESOURCES TAB */}
                  {activeTab === "resources" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Manage program resources
                        </p>
                      </div>
                      {loadingProgramExtras ? (
                        <div className="text-center py-8 text-gray-400">
                          Loading...
                        </div>
                      ) : programResourcesAdmin.length === 0 ? (
                        <div
                          key="no-resources"
                          className="text-center py-8 text-gray-400"
                        >
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No resources added yet</p>
                        </div>
                      ) : (
                        programResourcesAdmin.map((resource) => (
                          <div
                            key={resource.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {resource.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs bg-white border rounded-full px-2 py-0.5 text-gray-500 capitalize">
                                    {resource.type}
                                  </span>
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-emerald-600 hover:underline truncate"
                                    >
                                      {resource.url}
                                    </a>
                                  )}
                                </div>
                                {resource.description && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {resource.description}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => removeResourceReal(resource.id)}
                                className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      {isAddingResource ? (
                        <div
                          key="add-resource-form"
                          className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-emerald-300"
                        >
                          <h4 className="font-medium text-gray-900 mb-3">
                            New Resource
                          </h4>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Resource Name *"
                              value={newResource.name || ""}
                              onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  name: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <select
                              value={newResource.type || "document"}
                              onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  type: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            >
                              <option value="document">Document</option>
                              <option value="link">Link</option>
                              <option value="form">Form</option>
                              <option value="template">Template</option>
                            </select>
                            <input
                              type="text"
                              placeholder="URL (optional)"
                              value={newResource.url || ""}
                              onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  url: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Description (optional)"
                              value={newResource.description || ""}
                              onChange={(e) =>
                                setNewResource({
                                  ...newResource,
                                  description: e.target.value,
                                })
                              }
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={addResourceReal}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              >
                                Add Resource
                              </button>
                              <button
                                onClick={() => {
                                  setIsAddingResource(false);
                                  setNewResource({});
                                }}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          key="add-resource-btn"
                          onClick={() => setIsAddingResource(true)}
                          className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          <Plus className="h-4 w-4 inline mr-1" />
                          Add Resource
                        </button>
                      )}
                    </div>
                  )}

                  {/* CONTACT TAB */}
                  {activeTab === "contact" && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Contact Information
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={selectedProgram.contactEmail}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedProgram,
                                  contactEmail: e.target.value,
                                };
                                setSelectedProgram(updated);
                                savePrograms(
                                  programs.map((p) =>
                                    p.id === selectedProgram.id ? updated : p,
                                  ),
                                );
                              }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Phone
                            </label>
                            <input
                              type="text"
                              value={selectedProgram.contactPhone}
                              onChange={(e) => {
                                const updated = {
                                  ...selectedProgram,
                                  contactPhone: e.target.value,
                                };
                                setSelectedProgram(updated);
                                savePrograms(
                                  programs.map((p) =>
                                    p.id === selectedProgram.id ? updated : p,
                                  ),
                                );
                              }}
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={saveContactInfo}
                          className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          💾 Save Contact Info
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                key="no-selection"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center"
              >
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  Select a Program
                </h3>
                <p className="text-gray-400 mt-1">
                  Choose a program from the list to start editing
                </p>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
