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
    const saved = localStorage.getItem("entrepreneur_programs_data");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        console.log(
          "📊 Loaded programs:",
          data.programs.map((p: any) => ({
            name: p.name,
            managedBy: p.managedBy,
          })),
        );
        setPrograms(data.programs || []);
      } catch {
        setPrograms([]);
      }
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
                  {/* SESSIONS TAB - Jody's Programs */}
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
                        <div className="text-center py-8 text-gray-400">
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

                  {/* APPROVALS TAB - Jody's Programs */}
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
                                  key={idx}
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

                  {/* MENTOR MATCHING TAB - Mentor Programs */}
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
                            mentors.map((mentor) => (
                              <span
                                key={mentor.email}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1"
                              >
                                {mentor.name}
                                <span className="text-xs text-blue-500">
                                  ({mentor.email})
                                </span>
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400">
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
                            {participants
                              .filter((p) =>
                                p.programs.includes(selectedProgram.name),
                              )
                              .map((p, idx) => (
                                <tr
                                  key={idx}
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
                                      className={`font-medium ${
                                        p.mentor !== "Not assigned"
                                          ? "text-emerald-600"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {p.mentor}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex gap-2">
                                      {p.mentor !== "Not assigned" ? (
                                        <button
                                          key={`unassign-${p.email}`}
                                          onClick={() =>
                                            removeMentorMatch(p.email)
                                          }
                                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                        >
                                          <UserMinus className="h-3 w-3" />
                                          Unassign
                                        </button>
                                      ) : (
                                        <select
                                          key={`assign-${p.email}`}
                                          onChange={(e) => {
                                            if (e.target.value) {
                                              matchMentorToParticipant(
                                                p.email,
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
                                              key={mentor.email}
                                              value={mentor.email}
                                            >
                                              {mentor.name}
                                            </option>
                                          ))}
                                        </select>
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

                  {/* RESOURCES TAB */}
                  {activeTab === "resources" && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Manage program resources
                        </p>
                      </div>

                      {selectedProgram.resources.length === 0 ? (
                        <div
                          key="no-resources"
                          className="text-center py-8 text-gray-400"
                        >
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No resources added yet</p>
                        </div>
                      ) : (
                        selectedProgram.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={resource.name}
                                  onChange={(e) => {
                                    const updated =
                                      selectedProgram.resources.map((r) =>
                                        r.id === resource.id
                                          ? { ...r, name: e.target.value }
                                          : r,
                                      );
                                    const prog = {
                                      ...selectedProgram,
                                      resources: updated,
                                    };
                                    setSelectedProgram(prog);
                                    savePrograms(
                                      programs.map((p) =>
                                        p.id === selectedProgram.id ? prog : p,
                                      ),
                                    );
                                  }}
                                  className="w-full bg-transparent font-medium text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-emerald-500"
                                  placeholder="Resource Name"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <select
                                    value={resource.type}
                                    onChange={(e) => {
                                      const updated =
                                        selectedProgram.resources.map((r) =>
                                          r.id === resource.id
                                            ? {
                                                ...r,
                                                type: e.target.value as any,
                                              }
                                            : r,
                                        );
                                      const prog = {
                                        ...selectedProgram,
                                        resources: updated,
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
                                  >
                                    <option value="document">Document</option>
                                    <option value="link">Link</option>
                                    <option value="form">Form</option>
                                    <option value="template">Template</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={resource.url || ""}
                                    onChange={(e) => {
                                      const updated =
                                        selectedProgram.resources.map((r) =>
                                          r.id === resource.id
                                            ? { ...r, url: e.target.value }
                                            : r,
                                        );
                                      const prog = {
                                        ...selectedProgram,
                                        resources: updated,
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
                                    placeholder="URL (optional)"
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() => removeResource(resource.id)}
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
                            <div className="flex gap-2">
                              <button
                                onClick={addResource}
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
                          onClick={() => {
                            alert("✅ Contact information saved!");
                          }}
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
      </div>
    </div>
  );
}
