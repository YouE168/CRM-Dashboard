// components/user-program-modal.tsx
// for each user to edit their own "📋 Your Active Programs"

"use client";

import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  Video,
  FileText,
  ChevronRight,
  User,
  Award,
  Building2,
  BookOpen,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Target,
  Save,
  Edit2,
  Shield,
  Plus,
  Trash2,
} from "lucide-react";

interface UserProgramModalProps {
  program: any;
  onClose: () => void;
  userEmail?: string;
  userRole?: string;
  isJody?: boolean;
}

export default function UserProgramModal({
  program,
  onClose,
  userEmail,
  userRole,
  isJody = false,
}: UserProgramModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "tracking" | "sessions" | "resources"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    date: "",
    time: "",
    mentor: "",
    link: "",
  });

  // Load user's specific data for this program
  useEffect(() => {
    if (userEmail && program) {
      const saved = localStorage.getItem(
        `user_program_${userEmail}_${program.id}`,
      );
      if (saved) {
        try {
          setUserData(JSON.parse(saved));
        } catch {
          setUserData(null);
        }
      }
    }
  }, [userEmail, program]);

  if (!program) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Completed":
        return "bg-purple-100 text-purple-700";
      case "On Hold":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const isSEKCatalyst = program.name === "SEK Catalyst: Empowered by KU";
  const isBusinessProfessional =
    program.name === "Business Professional Services";

  // Get user's personal data or use defaults
  const userDataToUse = userData || {
    progress: program.progress || 0,
    tracking: {
      financial: {
        totalBudget: 0,
        spent: 0,
        remaining: 0,
        grantsReceived: 0,
        grantsPending: 0,
      },
      outcomes: {
        businessesLaunched: 0,
        businessesExpanded: 0,
        jobsCreated: 0,
        jobsRetained: 0,
        capitalAccessed: 0,
        revenueGrowth: 0,
      },
      sessions:
        program.upcomingSessions?.map((s: any) => ({
          ...s,
          attended: false,
          notes: "",
        })) || [],
    },
    milestones:
      program.tracking?.milestones?.map((m: any) => ({
        ...m,
        completed: false,
      })) || [],
  };

  // Save user's data
  const saveUserData = () => {
    if (!userEmail || !program) return;
    setIsSaving(true);

    const dataToSave = {
      ...userDataToUse,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(
      `user_program_${userEmail}_${program.id}`,
      JSON.stringify(dataToSave),
    );

    // Also update the main programs data for the user
    const programsData = JSON.parse(
      localStorage.getItem("entrepreneur_programs_data") || '{"programs":[]}',
    );
    const updatedPrograms = programsData.programs.map((p: any) => {
      if (p.id === program.id) {
        return {
          ...p,
          progress: userDataToUse.progress,
        };
      }
      return p;
    });
    localStorage.setItem(
      "entrepreneur_programs_data",
      JSON.stringify({ programs: updatedPrograms }),
    );

    setIsSaving(false);
    setIsEditing(false);
    alert("✅ Your progress has been saved!");
  };

  // Update user data field
  const updateUserField = (field: string, value: any) => {
    setUserData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update tracking field
  const updateTrackingField = (category: string, field: string, value: any) => {
    setUserData((prev: any) => ({
      ...prev,
      tracking: {
        ...prev?.tracking,
        [category]: {
          ...prev?.tracking?.[category],
          [field]: value,
        },
      },
    }));
  };

  // Update session
  const updateSession = (index: number, field: string, value: any) => {
    setUserData((prev: any) => ({
      ...prev,
      tracking: {
        ...prev?.tracking,
        sessions:
          prev?.tracking?.sessions?.map((s: any, i: number) =>
            i === index ? { ...s, [field]: value } : s,
          ) || [],
      },
    }));
  };

  // Toggle session attended
  const toggleAttended = (index: number) => {
    setUserData((prev: any) => ({
      ...prev,
      tracking: {
        ...prev?.tracking,
        sessions:
          prev?.tracking?.sessions?.map((s: any, i: number) =>
            i === index ? { ...s, attended: !s.attended } : s,
          ) || [],
      },
    }));
  };

  // Delete session
  const deleteSession = (index: number) => {
    if (!confirm("Delete this session?")) return;
    setUserData((prev: any) => ({
      ...prev,
      tracking: {
        ...prev?.tracking,
        sessions:
          prev?.tracking?.sessions?.filter(
            (_: any, i: number) => i !== index,
          ) || [],
      },
    }));
  };

  // Add new session
  const addSession = () => {
    if (!newSession.title || !newSession.date || !newSession.time) {
      alert("Please fill in title, date, and time for the session.");
      return;
    }

    const session = {
      id: `session-${Date.now()}`,
      title: newSession.title,
      date: newSession.date,
      time: newSession.time,
      mentor: newSession.mentor || "TBD",
      link: newSession.link || "",
      attended: false,
      notes: "",
    };

    setUserData((prev: any) => ({
      ...prev,
      tracking: {
        ...prev?.tracking,
        sessions: [...(prev?.tracking?.sessions || []), session],
      },
    }));

    setNewSession({
      title: "",
      date: "",
      time: "",
      mentor: "",
      link: "",
    });
    setIsAddingSession(false);
  };

  // Toggle milestone completion
  const toggleMilestone = (index: number) => {
    setUserData((prev: any) => ({
      ...prev,
      milestones:
        prev?.milestones?.map((m: any, i: number) =>
          i === index ? { ...m, completed: !m.completed } : m,
        ) || [],
    }));
  };

  // Calculate progress from completed milestones
  const calculateProgress = () => {
    if (!userDataToUse?.milestones || userDataToUse.milestones.length === 0) {
      return userDataToUse?.progress || 0;
    }
    const completed = userDataToUse.milestones.filter(
      (m: any) => m.completed,
    ).length;
    return Math.round((completed / userDataToUse.milestones.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              {isSEKCatalyst && <Award className="h-6 w-6 text-blue-600" />}
              {isBusinessProfessional && (
                <Building2 className="h-6 w-6 text-amber-600" />
              )}
              {!isSEKCatalyst && !isBusinessProfessional && (
                <BookOpen className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {program.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(program.status)}`}
                >
                  {program.status}
                </span>
                <span className="text-xs text-gray-400">
                  Started {program.startDate}
                </span>
                {program.badges?.isKUPartner && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    KU Partner
                  </span>
                )}
                {program.badges?.isJodyProgram && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                    👩‍💼 Jody's Program
                  </span>
                )}
                {program.badges?.isGrantFunded && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    💰 Grant Funded
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={saveUserData}
                disabled={isSaving}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>
            )}
            {!isJody && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <Edit2 className="h-4 w-4" />
                Edit Progress
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: BookOpen },
              { id: "tracking", label: "My Tracking", icon: TrendingUp },
              { id: "sessions", label: "My Sessions", icon: Calendar },
              { id: "resources", label: "Resources", icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  About This Program
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {program.description}
                </p>
              </div>

              {/* My Progress - Editable */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">My Overall Progress</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={userDataToUse.progress}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setUserData((prev: any) => ({
                            ...prev,
                            progress: Math.min(100, Math.max(0, val)),
                          }));
                        }}
                        className="w-16 border rounded px-2 py-1 text-sm text-emerald-600 font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  ) : (
                    <span className="font-medium text-emerald-600">
                      {progress}%
                    </span>
                  )}
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {isEditing && (
                  <p className="text-xs text-gray-400 mt-1">
                    💡 Enter your overall progress percentage (0-100)
                  </p>
                )}
              </div>

              {/* Quick Stats - Only Business Launched & Jobs Created */}
              <div className="grid grid-cols-2 gap-3">
                {userDataToUse?.milestones &&
                  userDataToUse.milestones.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium">
                        Milestones
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {
                          userDataToUse.milestones.filter(
                            (m: any) => m.completed,
                          ).length
                        }{" "}
                        / {userDataToUse.milestones.length}
                      </p>
                      <p className="text-xs text-blue-500">
                        {userDataToUse.milestones.filter(
                          (m: any) => m.completed,
                        ).length === userDataToUse.milestones.length
                          ? "✅ All completed"
                          : "In progress"}
                      </p>
                    </div>
                  )}

                {/* Businesses Launched - Editable */}
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium">
                    Businesses Launched
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={
                        userDataToUse.tracking.outcomes.businessesLaunched || 0
                      }
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setUserData((prev: any) => ({
                          ...prev,
                          tracking: {
                            ...prev?.tracking,
                            outcomes: {
                              ...prev?.tracking?.outcomes,
                              businessesLaunched: val,
                            },
                          },
                        }));
                      }}
                      className="w-full bg-transparent text-lg font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-emerald-700">
                      {userDataToUse.tracking.outcomes.businessesLaunched || 0}
                    </p>
                  )}
                </div>

                {/* Jobs Created - Editable */}
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-xs text-amber-600 font-medium">
                    Jobs Created
                  </p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={userDataToUse.tracking.outcomes.jobsCreated || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setUserData((prev: any) => ({
                          ...prev,
                          tracking: {
                            ...prev?.tracking,
                            outcomes: {
                              ...prev?.tracking?.outcomes,
                              jobsCreated: val,
                            },
                          },
                        }));
                      }}
                      className="w-full bg-transparent text-lg font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-amber-700">
                      {userDataToUse.tracking.outcomes.jobsCreated || 0}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 Update your progress, businesses launched, and jobs
                    created here. Click "Save" when you're done.
                  </p>
                </div>
              )}

              {/* Milestones */}
              {userDataToUse?.milestones &&
                userDataToUse.milestones.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      My Milestones
                    </h4>
                    <div className="space-y-2">
                      {userDataToUse.milestones.map(
                        (milestone: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <button
                              onClick={() => isEditing && toggleMilestone(idx)}
                              className={`p-1 rounded-full ${milestone.completed ? "text-emerald-500" : "text-gray-300"} ${isEditing ? "cursor-pointer" : "cursor-default"}`}
                            >
                              {milestone.completed ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                            </button>
                            <div>
                              <p
                                className={`text-sm ${milestone.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                              >
                                {milestone.title}
                              </p>
                              {milestone.description && (
                                <p className="text-xs text-gray-400">
                                  {milestone.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                      {isEditing && (
                        <p className="text-xs text-gray-400 italic">
                          Click the circle to mark milestones as complete
                        </p>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Tracking Tab - User's personal tracking */}
          {activeTab === "tracking" && (
            <div className="space-y-6">
              {/* Financial Tracking - User's own numbers */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  My Financial Data
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "totalBudget", label: "My Budget", prefix: "$" },
                    { key: "spent", label: "Spent", prefix: "$" },
                    { key: "remaining", label: "Remaining", prefix: "$" },
                    {
                      key: "grantsReceived",
                      label: "Grants Received",
                      prefix: "$",
                    },
                    {
                      key: "grantsPending",
                      label: "Grants Pending",
                      prefix: "$",
                    },
                  ].map((field) => {
                    const value =
                      userDataToUse?.tracking?.financial?.[field.key] || 0;
                    return (
                      <div
                        key={field.key}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <label className="text-xs text-gray-400 block">
                          {field.label}
                        </label>
                        {isEditing || isJody ? (
                          <input
                            type="number"
                            value={value}
                            onChange={(e) =>
                              updateTrackingField(
                                "financial",
                                field.key,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {field.prefix}
                            {value.toLocaleString()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Outcomes Tracking - User's own outcomes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  My Outcomes
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "businessesLaunched", label: "Businesses Launched" },
                    { key: "businessesExpanded", label: "Businesses Expanded" },
                    { key: "jobsCreated", label: "Jobs Created" },
                    { key: "jobsRetained", label: "Jobs Retained" },
                    {
                      key: "capitalAccessed",
                      label: "Capital Accessed",
                      prefix: "$",
                    },
                    {
                      key: "revenueGrowth",
                      label: "Revenue Growth",
                      suffix: "%",
                    },
                  ].map((field) => {
                    const value =
                      userDataToUse?.tracking?.outcomes?.[field.key] || 0;
                    return (
                      <div
                        key={field.key}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <label className="text-xs text-gray-400 block">
                          {field.label}
                        </label>
                        {isEditing || isJody ? (
                          <input
                            type="number"
                            value={value}
                            onChange={(e) =>
                              updateTrackingField(
                                "outcomes",
                                field.key,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded px-1"
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {field.prefix || ""}
                            {value}
                            {field.suffix || ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isEditing && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 Update your personal tracking data here. This helps you
                    track your own progress.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab - User's own sessions with Add and Delete */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {/* Add Session Button */}
              {!isAddingSession && (
                <button
                  onClick={() => setIsAddingSession(true)}
                  className="w-full p-3 border-2 border-dashed border-emerald-300 rounded-lg text-sm text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Session
                </button>
              )}

              {/* Add Session Form */}
              {isAddingSession && (
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-emerald-300">
                  <h4 className="font-medium text-gray-900 mb-3">
                    New Session
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Session Title *"
                      value={newSession.title}
                      onChange={(e) =>
                        setNewSession({ ...newSession, title: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={newSession.date}
                        onChange={(e) =>
                          setNewSession({ ...newSession, date: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="time"
                        value={newSession.time}
                        onChange={(e) =>
                          setNewSession({ ...newSession, time: e.target.value })
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Mentor (optional)"
                      value={newSession.mentor}
                      onChange={(e) =>
                        setNewSession({ ...newSession, mentor: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Zoom Link (optional)"
                      value={newSession.link}
                      onChange={(e) =>
                        setNewSession({ ...newSession, link: e.target.value })
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addSession}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                      >
                        Add Session
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingSession(false);
                          setNewSession({
                            title: "",
                            date: "",
                            time: "",
                            mentor: "",
                            link: "",
                          });
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Session List */}
              {userDataToUse?.tracking?.sessions &&
              userDataToUse.tracking.sessions.length > 0 ? (
                userDataToUse.tracking.sessions.map(
                  (session: any, idx: number) => (
                    <div
                      key={idx}
                      className={`bg-gray-50 rounded-xl p-4 border ${
                        session.attended
                          ? "border-green-200"
                          : "border-gray-100"
                      } hover:border-blue-200 transition-colors group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {session.title}
                            </h4>
                            {session.attended ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex-shrink-0">
                                ✅ Attended
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full flex-shrink-0">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {session.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {session.time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Mentor: {session.mentor}
                          </p>
                          {(isEditing || isJody) && (
                            <div className="mt-2">
                              <label className="text-xs text-gray-400 block">
                                My Notes
                              </label>
                              <textarea
                                value={session.notes || ""}
                                onChange={(e) =>
                                  updateSession(idx, "notes", e.target.value)
                                }
                                className="w-full bg-white border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                                placeholder="Add your notes about this session..."
                                rows={2}
                              />
                            </div>
                          )}
                          {!isEditing && !isJody && session.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              {session.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          {(isEditing || isJody) && (
                            <>
                              <button
                                onClick={() => toggleAttended(idx)}
                                className={`flex-shrink-0 px-2 py-1 text-xs rounded-lg ${
                                  session.attended
                                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                                }`}
                              >
                                {session.attended ? "Unmark" : "Mark"}
                              </button>
                              <button
                                onClick={() => deleteSession(idx)}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete session"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions added yet</p>
                  <p className="text-xs mt-1">
                    Click "Add New Session" to create one
                  </p>
                </div>
              )}

              {isEditing && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 Mark sessions as attended, add notes, or delete sessions
                    you no longer need.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab - ONLY Jody can edit these */}
          {activeTab === "resources" && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mb-4">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {isJody
                    ? "🔓 You can edit these resources as Jody"
                    : "📄 Resources are managed by Jody. Contact her for updates."}
                </p>
              </div>

              {program.resources && program.resources.length > 0 ? (
                program.resources.map((resource: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="p-2 bg-white rounded-lg flex-shrink-0">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isJody ? (
                        <input
                          type="text"
                          value={resource.name}
                          onChange={(e) => {
                            // Update resource name - only Jody can do this
                            const updatedResources = [...program.resources];
                            updatedResources[idx].name = e.target.value;
                            // Save to localStorage...
                          }}
                          className="w-full bg-transparent font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
                          placeholder="Resource name"
                        />
                      ) : (
                        <p className="font-medium text-gray-700 truncate">
                          {resource.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 capitalize">
                          {resource.type}
                        </span>
                        {resource.url && (
                          <button
                            onClick={() => {
                              if (resource.url) {
                                if (resource.url.startsWith("http")) {
                                  window.open(resource.url, "_blank");
                                } else {
                                  window.location.href = resource.url;
                                }
                              }
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            Open →
                          </button>
                        )}
                      </div>
                    </div>
                    {isJody && resource.url && (
                      <input
                        type="text"
                        value={resource.url || ""}
                        onChange={(e) => {
                          // Update resource URL - only Jody can do this
                          const updatedResources = [...program.resources];
                          updatedResources[idx].url = e.target.value;
                          // Save to localStorage...
                        }}
                        className="w-32 bg-white border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500"
                        placeholder="URL"
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No resources available</p>
                </div>
              )}

              {/* Contact - Only Jody can edit */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Program Contact
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Mail className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Email</p>
                      {isJody ? (
                        <input
                          type="email"
                          value={program.contactEmail}
                          onChange={(e) => {
                            // Update contact email - only Jody can do this
                          }}
                          className="w-full bg-transparent font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
                        />
                      ) : (
                        <p className="font-medium text-gray-700">
                          {program.contactEmail}
                        </p>
                      )}
                    </div>
                    {!isJody && (
                      <button
                        onClick={() =>
                          (window.location.href = `mailto:${program.contactEmail}`)
                        }
                        className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Send Email
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Phone</p>
                      {isJody ? (
                        <input
                          type="text"
                          value={program.contactPhone}
                          onChange={(e) => {
                            // Update contact phone - only Jody can do this
                          }}
                          className="w-full bg-transparent font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
                        />
                      ) : (
                        <p className="font-medium text-gray-700">
                          {program.contactPhone}
                        </p>
                      )}
                    </div>
                    {!isJody && (
                      <button
                        onClick={() =>
                          (window.location.href = `tel:${program.contactPhone}`)
                        }
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Call
                      </button>
                    )}
                  </div>
                </div>
                {isJody && (
                  <p className="text-xs text-amber-600 mt-2">
                    🔓 You can edit contact information as Jody.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
