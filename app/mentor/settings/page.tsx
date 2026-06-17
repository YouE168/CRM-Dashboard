"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Award,
  Target,
  BookOpen,
  MessageCircle,
  Eye,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface SessionHistory {
  date: string;
  topic: string;
  duration: number;
  notes: string;
}

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  startDate: string;
  sessionsCompleted: number;
  nextSession?: {
    date: string;
    time: string;
    topic: string;
  };
  sessionHistory: SessionHistory[];
}

interface MentorProfile {
  name: string;
  email: string;
  phone: string;
  expertise: string[];
  hourlyRate: number;
  availability: string[];
  bio: string;
  mentees: Mentee[];
}

interface User {
  email: string;
  password: string;
  roles: string[];
  roleLabels: string[];
  primaryRole: string;
  fullName: string;
  createdAt: string;
  status: string;
}

// Function to send notification to dashboard
const sendNotification = (
  message: string,
  type: string,
  actionLink?: string,
) => {
  const existingNotifs = localStorage.getItem("user_notifications");
  const notifications = existingNotifs ? JSON.parse(existingNotifs) : [];

  notifications.unshift({
    id: Date.now(),
    msg: message,
    time: "Just now",
    read: false,
    type: type,
    actionLink: actionLink,
  });

  const trimmed = notifications.slice(0, 50);
  localStorage.setItem("user_notifications", JSON.stringify(trimmed));
};

// Get real mentees from actual entrepreneur users
const getRealMentees = (): Mentee[] => {
  const allUsers: User[] = JSON.parse(localStorage.getItem("users") || "[]");

  // Filter users who are entrepreneurs (not admin, not mentor)
  const entrepreneurUsers = allUsers.filter(
    (user) =>
      user.email !== "admin@ruralcommunity.org" &&
      user.primaryRole !== "mentor" &&
      (user.roles?.includes("entrepreneur") ||
        user.primaryRole === "entrepreneur"),
  );

  // Get mentee goals and sessions from localStorage
  const mentees: Mentee[] = entrepreneurUsers.map((user, index) => {
    // Get saved sessions for this mentee
    const savedSessions = JSON.parse(
      localStorage.getItem(`mentee_sessions_${user.email}`) || "[]",
    );
    const savedGoals = JSON.parse(
      localStorage.getItem(`goals_${user.email}`) || "[]",
    );

    // Get profile for phone and program
    const userProfile = JSON.parse(
      localStorage.getItem(`profile_${user.email}`) || "{}",
    );

    // Calculate sessions completed from saved sessions
    const sessionsCompleted = savedSessions.length;

    // Get next session (first upcoming session)
    const today = new Date();
    const upcomingSessions = savedSessions.filter(
      (s: any) => new Date(s.date) >= today,
    );
    const nextSession =
      upcomingSessions.length > 0
        ? {
            date: upcomingSessions[0].date,
            time: upcomingSessions[0].time,
            topic: upcomingSessions[0].topic,
          }
        : undefined;

    // Convert saved sessions to session history format
    const sessionHistory: SessionHistory[] = savedSessions.map(
      (session: any) => ({
        date: session.date,
        topic: session.topic,
        duration: session.duration || 60,
        notes: session.notes || "",
      }),
    );

    return {
      id: index.toString(),
      name: user.fullName || user.email.split("@")[0],
      email: user.email,
      phone: userProfile.phone || "",
      program: userProfile.selectedPrograms?.[0] || "Business Catalyst Program",
      startDate:
        user.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
      sessionsCompleted: sessionsCompleted,
      nextSession: nextSession,
      sessionHistory: sessionHistory,
    };
  });

  return mentees;
};

// Get notes for a mentee from localStorage
const getMenteeNotes = (menteeEmail: string): any[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(`mentee_notes_${menteeEmail}`);
  return saved ? JSON.parse(saved) : [];
};

// Save note for a mentee
const saveMenteeNote = (menteeEmail: string, note: string, author: string) => {
  const existingNotes = getMenteeNotes(menteeEmail);
  const newNote = {
    id: Date.now(),
    date: new Date().toISOString(),
    note: note,
    author: author,
  };
  existingNotes.unshift(newNote);
  localStorage.setItem(
    `mentee_notes_${menteeEmail}`,
    JSON.stringify(existingNotes),
  );
  return newNote;
};

// Get profile for a user
const getUserProfile = (email: string): any => {
  const profile = localStorage.getItem(`profile_${email}`);
  if (profile) {
    return JSON.parse(profile);
  }
  return null;
};

// Edit Session Modal
function EditSessionModal({
  session,
  menteeName,
  onSave,
  onClose,
}: {
  session: SessionHistory;
  menteeName: string;
  onSave: (updatedSession: SessionHistory) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState(session);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Session: {menteeName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: parseInt(e.target.value) })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Session Modal
function AddSessionModal({
  mentees,
  onClose,
  onSave,
}: {
  mentees: Mentee[];
  onClose: () => void;
  onSave: (menteeId: string, session: any) => void;
}) {
  const [selectedMentee, setSelectedMentee] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentee || !topic) return;
    onSave(selectedMentee, { date, topic, duration, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Log New Session
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Mentee
            </label>
            <select
              value={selectedMentee}
              onChange={(e) => setSelectedMentee(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              required
            >
              <option value="">Choose a mentee...</option>
              {mentees.map((mentee) => (
                <option key={mentee.id} value={mentee.email}>
                  {mentee.name} ({mentee.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Business Plan Review"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What was discussed? What are next steps?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
            >
              Save Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Component that uses useSearchParams - wrapped in the main export
function MentorSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "sessions" | "availability"
  >(tabParam === "sessions" ? "sessions" : "profile");
  const [profile, setProfile] = useState<MentorProfile>({
    name: "",
    email: "",
    phone: "",
    expertise: [],
    hourlyRate: 50,
    availability: [],
    bio: "",
    mentees: [],
  });
  const [newExpertise, setNewExpertise] = useState("");
  const [newAvailability, setNewAvailability] = useState("");
  const [selectedSession, setSelectedSession] = useState<{
    session: SessionHistory;
    menteeId: string;
    menteeName: string;
  } | null>(null);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: string;
    visible: boolean;
  }>({ message: "", type: "success", visible: false });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type, visible: true });
    setTimeout(
      () => setToast({ message: "", type: "success", visible: false }),
      3000,
    );
  };

  // Load real mentees and profile
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Load mentor profile
    const savedMentorProfile = localStorage.getItem(
      `mentor_profile_${currentUser}`,
    );
    if (savedMentorProfile) {
      const parsedProfile = JSON.parse(savedMentorProfile);
      setProfile(parsedProfile);
    } else {
      // Get user's name from profile
      const userProfile = getUserProfile(currentUser);
      setProfile({
        name: userProfile?.name || currentUser.split("@")[0],
        email: currentUser,
        phone: userProfile?.phone || "",
        expertise: ["Business Strategy", "Marketing", "Financial Planning"],
        hourlyRate: 50,
        availability: ["Monday 2-5 PM", "Wednesday 10-12 PM", "Friday 1-4 PM"],
        bio: "Experienced business mentor helping entrepreneurs succeed.",
        mentees: [],
      });
    }

    setLoading(false);
  }, [router]);

  // Refresh mentees list (real data from entrepreneurs)
  const refreshMentees = () => {
    const realMentees = getRealMentees();
    setProfile((prev) => ({ ...prev, mentees: realMentees }));
  };

  useEffect(() => {
    refreshMentees();
  }, []);

  const saveProfile = () => {
    setSaving(true);
    const user = localStorage.getItem("currentUser");
    if (user) {
      // Save to mentor's personal profile
      localStorage.setItem(
        `mentor_profile_${user}`,
        JSON.stringify({
          ...profile,
          mentees: [], // Don't save mentees in profile, always get from real users
        }),
      );

      // ALSO SAVE TO CENTRAL LOCATION for entrepreneurs to read
      // This is the key change - saves to shared location
      const sharedProfile = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        hourlyRate: profile.hourlyRate,
        bio: profile.bio,
        expertise: profile.expertise,
        availability: profile.availability,
        rating: 4.8, // This could be calculated from actual ratings
        totalSessions: profile.mentees.reduce(
          (acc, mentee) => acc + mentee.sessionsCompleted,
          0,
        ),
      };
      localStorage.setItem(
        "mentor_profile_data",
        JSON.stringify(sharedProfile),
      );
    }
    setTimeout(() => {
      setSaving(false);
      showToast(
        "Profile saved successfully! Your mentees will see your updated info.",
      );
    }, 500);
  };

  const addExpertise = () => {
    if (
      newExpertise.trim() &&
      !profile.expertise.includes(newExpertise.trim())
    ) {
      setProfile({
        ...profile,
        expertise: [...profile.expertise, newExpertise.trim()],
      });
      setNewExpertise("");
    }
  };

  const removeExpertise = (index: number) => {
    setProfile({
      ...profile,
      expertise: profile.expertise.filter((_, i) => i !== index),
    });
  };

  const addAvailability = () => {
    if (
      newAvailability.trim() &&
      !profile.availability.includes(newAvailability.trim())
    ) {
      setProfile({
        ...profile,
        availability: [...profile.availability, newAvailability.trim()],
      });
      setNewAvailability("");
    }
  };

  const removeAvailability = (index: number) => {
    setProfile({
      ...profile,
      availability: profile.availability.filter((_, i) => i !== index),
    });
  };

  // Save a session for a mentee
  const saveSessionToMentee = (menteeEmail: string, session: any) => {
    const existingSessions = JSON.parse(
      localStorage.getItem(`mentee_sessions_${menteeEmail}`) || "[]",
    );
    const newSession = {
      id: Date.now(),
      date: session.date,
      time: session.time || "10:00 AM",
      topic: session.topic,
      duration: session.duration,
      notes: session.notes,
      createdAt: new Date().toISOString(),
    };
    existingSessions.push(newSession);
    localStorage.setItem(
      `mentee_sessions_${menteeEmail}`,
      JSON.stringify(existingSessions),
    );

    sendNotification(`✅ Session logged with ${profile.name}`, "session");
    showToast("Session logged successfully!");
    refreshMentees(); // Refresh to show new session
  };

  const addSessionToMentee = (menteeEmail: string, session: any) => {
    saveSessionToMentee(menteeEmail, session);
    setShowSessionModal(false);
  };

  const updateSession = (
    updatedSession: SessionHistory,
    menteeEmail: string,
    menteeName: string,
  ) => {
    const existingSessions = JSON.parse(
      localStorage.getItem(`mentee_sessions_${menteeEmail}`) || "[]",
    );
    const updatedSessions = existingSessions.map((s: any) =>
      s.date === updatedSession.date
        ? {
            ...s,
            topic: updatedSession.topic,
            duration: updatedSession.duration,
            notes: updatedSession.notes,
          }
        : s,
    );
    localStorage.setItem(
      `mentee_sessions_${menteeEmail}`,
      JSON.stringify(updatedSessions),
    );

    sendNotification(`✏️ Session updated for ${menteeName}`, "session");
    showToast("Session updated successfully!");
    refreshMentees();
    setShowEditSessionModal(false);
  };

  const deleteSession = (
    menteeEmail: string,
    sessionDate: string,
    menteeName: string,
  ) => {
    if (confirm("Delete this session?")) {
      const existingSessions = JSON.parse(
        localStorage.getItem(`mentee_sessions_${menteeEmail}`) || "[]",
      );
      const updatedSessions = existingSessions.filter(
        (s: any) => s.date !== sessionDate,
      );
      localStorage.setItem(
        `mentee_sessions_${menteeEmail}`,
        JSON.stringify(updatedSessions),
      );

      sendNotification(`🗑️ Session deleted for ${menteeName}`, "session");
      showToast("Session deleted");
      refreshMentees();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Get all sessions from all mentees for display
  const allSessions = profile.mentees
    .flatMap((mentee) =>
      mentee.sessionHistory.map((session) => ({
        ...session,
        menteeName: mentee.name,
        menteeEmail: mentee.email,
      })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Mentor Settings
                </h1>
                <p className="text-xs text-gray-500">
                  Manage your profile, sessions, and availability
                </p>
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
      </header>

      {toast.visible && (
        <div
          className={`fixed top-20 right-4 z-50 p-3 rounded-xl text-sm flex items-center gap-2 shadow-lg ${toast.type === "success" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
        >
          <Check className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === "profile" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500"}`}
            >
              👤 My Profile
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === "sessions" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500"}`}
            >
              📅 All Sessions ({allSessions.length})
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`py-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === "availability" ? "border-emerald-500 text-emerald-600" : "border-transparent text-gray-500"}`}
            >
              🕐 Availability
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate ($)
                  </label>
                  <input
                    type="number"
                    value={profile.hourlyRate}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        hourlyRate: parseInt(e.target.value),
                      })
                    }
                    className="w-32 border border-gray-200 rounded-xl px-4 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={4}
                    className="w-full max-w-2xl border border-gray-200 rounded-xl px-4 py-2.5"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Areas of Expertise
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm"
                  >
                    {exp}
                    <button onClick={() => removeExpertise(idx)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  placeholder="Add expertise"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2"
                />
                <button
                  onClick={addExpertise}
                  className="px-4 py-2 bg-gray-100 rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                All Session History
              </h2>
              <button
                onClick={() => setShowSessionModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Log New Session
              </button>
            </div>
            {allSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No sessions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click "Log New Session" to record your first mentoring session
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allSessions.map((session, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {session.menteeName}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(session.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-emerald-600 font-medium">
                          {session.topic}
                        </p>
                        {session.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {session.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {session.duration} minutes
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedSession({
                              session: {
                                date: session.date,
                                topic: session.topic,
                                duration: session.duration,
                                notes: session.notes || "",
                              },
                              menteeId: session.menteeEmail,
                              menteeName: session.menteeName,
                            });
                            setShowEditSessionModal(true);
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            deleteSession(
                              session.menteeEmail,
                              session.date,
                              session.menteeName,
                            )
                          }
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "availability" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Weekly Availability
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.availability.map((slot, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {slot}
                  <button onClick={() => removeAvailability(idx)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAvailability}
                onChange={(e) => setNewAvailability(e.target.value)}
                placeholder="Add availability (e.g., Tuesday 2-4 PM)"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2"
              />
              <button
                onClick={addAvailability}
                className="px-4 py-2 bg-gray-100 rounded-xl"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Session Modal */}
      {showEditSessionModal && selectedSession && (
        <EditSessionModal
          session={selectedSession.session}
          menteeName={selectedSession.menteeName}
          onSave={(updated) =>
            updateSession(
              updated,
              selectedSession.menteeId,
              selectedSession.menteeName,
            )
          }
          onClose={() => setShowEditSessionModal(false)}
        />
      )}

      {/* Add Session Modal */}
      {showSessionModal && (
        <AddSessionModal
          mentees={profile.mentees}
          onClose={() => setShowSessionModal(false)}
          onSave={addSessionToMentee}
        />
      )}
    </div>
  );
}

// Main export with Suspense boundary
export default function MentorSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <MentorSettingsContent />
    </Suspense>
  );
}
