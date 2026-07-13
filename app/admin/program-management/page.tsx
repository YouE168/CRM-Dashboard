// app/admin/program-management/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  email: string;
  name: string;
  programs: string[];
  mentor: string;
  status: string;
  joinedAt: string;
  role?: string;
  businessProfessionalStatus?: string;
}

interface Mentor {
  email: string;
  name: string;
  expertise?: string[];
  available?: boolean;
}

// ✅ DEFAULT PROGRAMS - These will always be available
const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "prog-1",
    name: "RCP Small Business Mentorship",
    description:
      "Connect with experienced local mentors for one-on-one guidance. Get help with business planning, marketing, financial management, and more.",
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
    name: "SEED Micro-Grant Program",
    description:
      "10-week SEK Catalyst cohort with mentorship and grant opportunities. Includes $250 participant support + $500 grants for top businesses.",
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
    description:
      "Financial modeling, startup support, and capital connection. Get expert help with cash flow, break-even analysis, and funding strategies.",
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
    description:
      "A comprehensive 12-week entrepreneurship program designed to help rural business owners launch and grow their ventures. Includes mentorship, workshops, and access to KU resources.",
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
  {
    id: "prog-5",
    name: "Microloan Program",
    description:
      "Access to capital for rural businesses. Designed to support startup and growth-stage entrepreneurs with flexible loan options.",
    status: "Active",
    startDate: "January 2025",
    contactEmail: "loans@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0104",
    managedBy: "admin",
    resources: [
      {
        id: "res-9",
        name: "Loan Application",
        type: "form",
        url: "/resources/loan-application",
      },
      {
        id: "res-10",
        name: "Eligibility Requirements",
        type: "document",
        url: "/resources/eligibility",
      },
    ],
    upcomingSessions: [],
  },
];

export default function ProgramManagementPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeTab, setActiveTab] = useState<string>("sessions");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [newSession, setNewSession] = useState<any>({});
  const [newResource, setNewResource] = useState<any>({});

  useEffect(() => {
    loadPrograms();
    loadParticipants();
    loadMentors();
  }, []);

  const loadPrograms = () => {
    let saved = localStorage.getItem("entrepreneur_programs_data");

    // If no saved data, initialize with defaults
    if (!saved) {
      console.log("📋 No programs found, initializing with defaults...");
      const defaultData = { programs: DEFAULT_PROGRAMS };
      localStorage.setItem(
        "entrepreneur_programs_data",
        JSON.stringify(defaultData),
      );
      setPrograms(DEFAULT_PROGRAMS);
      setLoading(false);
      return;
    }

    try {
      const data = JSON.parse(saved);
      console.log("📊 Loaded programs:", data.programs?.length || 0);
      setPrograms(data.programs || DEFAULT_PROGRAMS);
    } catch {
      setPrograms(DEFAULT_PROGRAMS);
    }
    setLoading(false);
  };

  const loadParticipants = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const loadedParticipants = users
      .filter(
        (u: any) =>
          u.primaryRole === "entrepreneur" || u.primaryRole === "mentee",
      )
      .map((u: any) => {
        const profile = JSON.parse(
          localStorage.getItem(`profile_${u.email}`) || "{}",
        );
        return {
          email: u.email,
          name: profile.name || u.fullName || u.email.split("@")[0],
          programs: profile.selectedPrograms || [],
          mentor: profile.mentor || "Not assigned",
          status: profile.status || "active",
          joinedAt: u.createdAt || new Date().toISOString(),
          role: u.primaryRole,
          businessProfessionalStatus:
            profile.businessProfessionalStatus || "pending",
        };
      });
    setParticipants(loadedParticipants);
  };

  const loadMentors = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const loadedMentors = users
      .filter((u: any) => u.primaryRole === "mentor")
      .map((u: any) => {
        const profile = JSON.parse(
          localStorage.getItem(`profile_${u.email}`) || "{}",
        );
        return {
          email: u.email,
          name: profile.name || u.fullName || u.email.split("@")[0],
          expertise: profile.expertise || [],
          available: true,
        };
      });
    setMentors(loadedMentors);
  };

  const savePrograms = (updatedPrograms: Program[]) => {
    localStorage.setItem(
      "entrepreneur_programs_data",
      JSON.stringify({ programs: updatedPrograms }),
    );
    setPrograms(updatedPrograms);
  };

  const handleEdit = (program: Program) => {
    console.log(
      "🖱️ Selected program:",
      program.name,
      "Managed By:",
      program.managedBy,
    );
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
      id: `session-${Date.now()}`,
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

  const addResource = () => {
    if (!selectedProgram) return;

    const resource = {
      id: `res-${Date.now()}`,
      name: newResource.name || "New Resource",
      type: newResource.type || "document",
      url: newResource.url || "",
      description: newResource.description || "",
    };

    const updatedProgram = {
      ...selectedProgram,
      resources: [...(selectedProgram.resources || []), resource],
    };

    const updatedPrograms = programs.map((p) =>
      p.id === selectedProgram.id ? updatedProgram : p,
    );
    savePrograms(updatedPrograms);
    setSelectedProgram(updatedProgram);
    setIsAddingResource(false);
    setNewResource({});
    alert("✅ Resource added successfully!");
  };

  const removeResource = (resourceId: string) => {
    if (!selectedProgram) return;
    if (!confirm("Remove this resource?")) return;

    const updatedProgram = {
      ...selectedProgram,
      resources: selectedProgram.resources.filter((r) => r.id !== resourceId),
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

  const updateParticipantMentor = (email: string, mentor: string) => {
    const profile = JSON.parse(
      localStorage.getItem(`profile_${email}`) || "{}",
    );
    profile.mentor = mentor;
    localStorage.setItem(`profile_${email}`, JSON.stringify(profile));

    setParticipants((prev) =>
      prev.map((p) => (p.email === email ? { ...p, mentor } : p)),
    );
  };

  const matchMentorToParticipant = (
    participantEmail: string,
    mentorEmail: string,
  ) => {
    if (!mentorEmail) {
      alert("Please select a mentor");
      return;
    }

    const mentorName =
      mentors.find((m) => m.email === mentorEmail)?.name || mentorEmail;
    updateParticipantMentor(participantEmail, mentorName);
    alert(`✅ ${mentorName} matched with participant!`);
  };

  const removeMentorMatch = (participantEmail: string) => {
    if (!confirm("Remove mentor assignment for this participant?")) return;
    updateParticipantMentor(participantEmail, "Not assigned");
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
              alert("🔄 Data refreshed!");
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

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
              {programs.map((program) => (
                <button
                  key={program.id}
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

          {/* Right Panel - Keep the same as your existing code */}
          <div className="lg:col-span-2">
            {selectedProgram ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* ... rest of your existing code ... */}
                {/* Keep all the existing tab content here */}
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
      </div>
    </div>
  );
}
