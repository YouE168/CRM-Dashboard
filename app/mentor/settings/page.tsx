"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  getMentorProfileByEmail,
  createMentorProfile,
  updateMentorProfile,
  getMenteesForMentor,
  getAllSessionsForMentor,
  addMenteeSession,
  updateMenteeSession,
  deleteMenteeSession,
  subscribeToMenteeData,
  type MenteeSessionRow,
} from "@/lib/supabase/dashboard-data";
import {
  ArrowLeft,
  Save,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
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
}

interface MentorProfile {
  name: string;
  email: string;
  phone: string;
  expertise: string[];
  hourlyRate: number;
  availability: string[];
  bio: string;
}

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
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 0,
                })
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
  onSave: (
    menteeId: string,
    session: { date: string; topic: string; duration: number; notes: string },
  ) => void;
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
                <option key={mentee.id} value={mentee.id}>
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
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
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
  });
  const [mentorId, setMentorId] = useState<string | null>(null);
  // The name used to match mentee_sessions.mentor_name / participants -
  // pinned to what was loaded, since mentee_sessions links by name string
  // rather than a real foreign key. Renaming your profile won't retroactively
  // relink old sessions until the page is reloaded - a pre-existing fragility
  // in this table's design, not something fixed here.
  const [mentorName, setMentorName] = useState("");
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [sessions, setSessions] = useState<MenteeSessionRow[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  const [newAvailability, setNewAvailability] = useState("");
  const [selectedSession, setSelectedSession] = useState<{
    id: string;
    session: SessionHistory;
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

  const loadMenteesAndSessions = async (name: string) => {
    try {
      const [realMentees, realSessions] = await Promise.all([
        getMenteesForMentor(name),
        getAllSessionsForMentor(name),
      ]);
      setMentees(
        realMentees.map((m) => ({
          id: m.id,
          name: m.name ?? "",
          email: m.email ?? "",
        })),
      );
      setSessions(realSessions);
    } catch (err) {
      console.error("Failed to load mentees/sessions:", err);
    }
  };

  // Auth + load real mentor profile, mentees, and sessions from Supabase
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("name, email, primary_role, status")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (
        userError ||
        !userRow ||
        (userRow.status && userRow.status !== "active")
      ) {
        router.push("/login");
        return;
      }

      const fallbackName = userRow.name || userRow.email.split("@")[0];

      try {
        // Mentors added via the admin Mentors tab already have a row here.
        // Self-signed-up mentors won't yet - create one so the page works
        // either way.
        let mentorRow = await getMentorProfileByEmail(userRow.email);
        if (!mentorRow) {
          mentorRow = await createMentorProfile({
            name: fallbackName,
            email: userRow.email,
          });
        }

        if (cancelled) return;

        setMentorId(mentorRow.id);
        setMentorName(mentorRow.name);
        setProfile({
          name: mentorRow.name,
          email: mentorRow.email || userRow.email,
          phone: mentorRow.phone || "",
          expertise: mentorRow.expertise || [],
          hourlyRate: mentorRow.hourly_rate ?? 50,
          availability: mentorRow.availability || [],
          bio: mentorRow.bio || "",
        });

        await loadMenteesAndSessions(mentorRow.name);
      } catch (err) {
        console.error("Failed to load mentor profile:", err);
      }

      if (!cancelled) setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Keep mentees/sessions in sync with realtime changes (e.g. another tab
  // logging a session, or an admin editing the mentee list)
  useEffect(() => {
    if (!mentorName) return;
    const unsubscribe = subscribeToMenteeData(() => {
      loadMenteesAndSessions(mentorName);
    });
    return unsubscribe;
  }, [mentorName]);

  const saveProfile = async () => {
    if (!mentorId) return;
    setSaving(true);
    try {
      await updateMentorProfile(mentorId, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        bio: profile.bio,
        hourly_rate: profile.hourlyRate,
        availability: profile.availability,
        expertise: profile.expertise,
      });
      showToast("Profile saved successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      showToast("Failed to save profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
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

  // Log a new session against a real mentee (participant_id)
  const addSessionToMentee = async (
    menteeId: string,
    session: { date: string; topic: string; duration: number; notes: string },
  ) => {
    try {
      await addMenteeSession({
        participant_id: menteeId,
        date: session.date,
        topic: session.topic,
        duration: session.duration,
        notes: session.notes,
        mentor_name: mentorName,
      });
      showToast("Session logged successfully!");
      setShowSessionModal(false);
      await loadMenteesAndSessions(mentorName);
    } catch (err) {
      console.error("Failed to log session:", err);
      showToast("Failed to log session. Please try again.", "error");
    }
  };

  const updateSession = async (
    sessionId: string,
    updatedSession: SessionHistory,
  ) => {
    try {
      await updateMenteeSession(sessionId, {
        date: updatedSession.date,
        topic: updatedSession.topic,
        duration: updatedSession.duration,
        notes: updatedSession.notes,
      });
      showToast("Session updated successfully!");
      setShowEditSessionModal(false);
      await loadMenteesAndSessions(mentorName);
    } catch (err) {
      console.error("Failed to update session:", err);
      showToast("Failed to update session. Please try again.", "error");
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      await deleteMenteeSession(sessionId);
      showToast("Session deleted");
      await loadMenteesAndSessions(mentorName);
    } catch (err) {
      console.error("Failed to delete session:", err);
      showToast("Failed to delete session. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Get all sessions for display, joined with mentee names
  const menteeById = Object.fromEntries(mentees.map((m) => [m.id, m]));
  const allSessions = sessions
    .map((s) => ({
      id: s.id,
      date: s.date,
      topic: s.topic || "",
      duration: s.duration,
      notes: s.notes || "",
      menteeId: s.participant_id || "",
      menteeName:
        (s.participant_id && menteeById[s.participant_id]?.name) ||
        "Unknown mentee",
    }))
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
                    disabled
                    readOnly
                    className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This is your login email and can't be changed here.
                    Contact an admin if it needs to change.
                  </p>
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
                        hourlyRate: parseInt(e.target.value) || 0,
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
                {allSessions.map((session) => (
                  <div
                    key={session.id}
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
                              id: session.id,
                              session: {
                                date: session.date,
                                topic: session.topic,
                                duration: session.duration,
                                notes: session.notes || "",
                              },
                              menteeName: session.menteeName,
                            });
                            setShowEditSessionModal(true);
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
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
          onSave={(updated) => updateSession(selectedSession.id, updated)}
          onClose={() => setShowEditSessionModal(false)}
        />
      )}

      {/* Add Session Modal */}
      {showSessionModal && (
        <AddSessionModal
          mentees={mentees}
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
