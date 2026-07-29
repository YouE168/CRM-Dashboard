"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Target,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  X,
  Send,
  Eye,
  Award,
  TrendingUp,
  Star,
  Mail,
  Phone,
  User,
  Plus,
} from "lucide-react";

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  status: string;
  sessionsCompleted: number;
  startDate: string;
  avatar?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  category: string;
}

interface Note {
  id: string;
  date: string;
  note: string;
  author: string;
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

// Goals/Notes/Profile now come from Supabase directly (see the
// component-level effects below) - these old localStorage helpers
// have been removed.

const avatarColors = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

function initials(name: string): string {
  const p = name.split(" ");
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0][0];
}

// Mentee Detail Modal Component
function MenteeDetailModal({
  mentee,
  onClose,
  mentorName,
}: {
  mentee: Mentee;
  onClose: () => void;
  mentorName: string;
}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [activeTab, setActiveTab] = useState<"goals" | "notes" | "info">(
    "goals",
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [goalRows, noteRows] = await Promise.all([
          getGoalsForParticipant(mentee.id),
          getNotesForParticipant(mentee.id),
        ]);
        if (cancelled) return;
        setGoals(
          goalRows.map((g) => ({
            id: g.id,
            title: g.title,
            description: g.description ?? "",
            dueDate: g.due_date ?? "",
            completed: g.completed,
            category: g.category ?? "",
          })),
        );
        setNotes(
          noteRows.map((n) => ({
            id: n.id,
            date: n.created_at,
            note: n.note,
            author: n.author ?? "",
          })),
        );
      } catch (err) {
        console.error("Failed to load goals/notes:", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [mentee.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addMenteeNote(mentee.id, newNote, mentorName);
      const noteRows = await getNotesForParticipant(mentee.id);
      setNotes(
        noteRows.map((n) => ({
          id: n.id,
          date: n.created_at,
          note: n.note,
          author: n.author ?? "",
        })),
      );
      setNewNote("");
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const goalProgress =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${avatarColors[Math.abs(parseInt(mentee.id) || 0) % avatarColors.length]}`}
              >
                {initials(mentee.name)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {mentee.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {mentee.program} • Started{" "}
                  {new Date(mentee.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-100">
            <button
              onClick={() => setActiveTab("goals")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === "goals"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Target className="h-4 w-4 inline mr-1" />
              Goals & Milestones
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === "notes"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-1" />
              Notes ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === "info"
                  ? "text-emerald-600 border-b-2 border-emerald-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="h-4 w-4 inline mr-1" />
              Contact Info
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Goals Tab */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Overall Progress
                  </h3>
                  <span className="text-2xl font-bold text-emerald-600">
                    {goalProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mb-3">
                  <div
                    className="h-2 bg-emerald-500 rounded-full"
                    style={{ width: `${goalProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {completedGoals} of {totalGoals} goals completed
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">All Goals</h3>
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No goals set yet</p>
                    <p className="text-xs">Mentee hasn't created any goals</p>
                  </div>
                ) : (
                  (showAllGoals ? goals : goals.slice(0, 5)).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      {goal.completed ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium ${goal.completed ? "text-gray-400 line-through" : "text-gray-800"}`}
                        >
                          {goal.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {goal.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">
                            {goal.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            Due: {new Date(goal.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {goals.length > 5 && (
                <button
                  onClick={() => setShowAllGoals(!showAllGoals)}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  {showAllGoals
                    ? "Show Less"
                    : `View All ${goals.length} Goals →`}
                </button>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Write a Note
                </h3>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write feedback, encouragement, or reminders for your mentee..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Note to Mentee
                </button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Note History
                </h3>
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notes yet</p>
                    <p className="text-xs">Write your first note above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium text-emerald-600">
                            {note.author}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(note.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{mentee.email}</span>
                    <button
                      onClick={() =>
                        (window.location.href = `mailto:${mentee.email}`)
                      }
                      className="ml-auto text-emerald-600 text-sm hover:underline"
                    >
                      Send Email
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {mentee.phone || "Not provided"}
                    </span>
                    {mentee.phone && (
                      <button
                        onClick={() =>
                          (window.location.href = `tel:${mentee.phone}`)
                        }
                        className="ml-auto text-emerald-600 text-sm hover:underline"
                      >
                        Call
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      Started: {new Date(mentee.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {mentee.sessionsCompleted} sessions completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Mentor Dashboard Component
import { supabase } from "@/lib/supabase/client";
import {
  getMenteesForMentor,
  getGoalsForParticipant,
  getNotesForParticipant,
  addMenteeNote,
  getMentorProfileByEmail,
  getMentorAverageRating,
} from "@/lib/supabase/dashboard-data";

export default function MentorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [mentorRating, setMentorRating] = useState<number | null>(null);
  const [mentorRatingCount, setMentorRatingCount] = useState(0);
  const [menteeGoalsMap, setMenteeGoalsMap] = useState<Record<string, { completed: boolean }[]>>({});
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadMentorAndMentees = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
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

      if (userError || !userRow || (userRow.status && userRow.status !== "active")) {
        router.push("/login");
        return;
      }

      const mentorName = userRow.name || userRow.email.split("@")[0];

      setProfile({
        name: mentorName,
        email: userRow.email,
        role: "Mentor",
        primaryRole: userRow.primary_role,
      });

      try {
        const [realMentees, mentorRow, avgRating] = await Promise.all([
          getMenteesForMentor(mentorName),
          getMentorProfileByEmail(userRow.email),
          getMentorAverageRating(mentorName).catch(() => null),
        ]);
        const menteeList: Mentee[] = realMentees.map((m) => ({
          id: m.id,
          name: m.name ?? "",
          email: m.email ?? "",
          phone: m.phone ?? "",
          program: m.program_name ?? "Business Catalyst Program",
          status: m.status || "Active",
          sessionsCompleted: m.sessions_completed ?? 0,
          startDate: new Date().toISOString().split("T")[0],
        }));
        if (!cancelled) {
          setMentees(menteeList);
          // Prefer the real, live average from mentor_ratings (participants
          // rating this mentor in-app) once at least one rating exists;
          // otherwise fall back to the static mentors.rating column.
          if (avgRating && avgRating.count > 0) {
            setMentorRating(avgRating.average);
            setMentorRatingCount(avgRating.count);
          } else {
            setMentorRating(mentorRow?.rating ?? null);
            setMentorRatingCount(0);
          }
        }
      } catch (err) {
        console.error("Failed to load mentees:", err);
      }

      if (!cancelled) setLoading(false);
    };

    loadMentorAndMentees();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (mentees.length === 0) return;
    let cancelled = false;
    const loadAllGoals = async () => {
      try {
        const entries = await Promise.all(
          mentees.map(async (m) => {
            const goals = await getGoalsForParticipant(m.id);
            return [m.id, goals.map((g) => ({ completed: g.completed }))] as const;
          }),
        );
        if (!cancelled) setMenteeGoalsMap(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load mentee goals:", err);
      }
    };
    loadAllGoals();
    return () => {
      cancelled = true;
    };
  }, [mentees]);

  const filteredMentees = mentees.filter((mentee) => {
    const matchesSearch =
      mentee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentee.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalMentees = mentees.length;

  // Calculate average goal progress across all mentees
  let avgProgressSum = 0;
  mentees.forEach((mentee) => {
    const goals = menteeGoalsMap[mentee.id] || [];
    const completed = goals.filter((g) => g.completed).length;
    avgProgressSum += goals.length > 0 ? (completed / goals.length) * 100 : 0;
  });
  const avgProgress =
    mentees.length > 0 ? Math.round(avgProgressSum / mentees.length) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Mentor Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  Manage your mentees and sessions
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/")}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalMentees}
                </p>
                <p className="text-sm text-gray-500">Active Mentees</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {avgProgress}%
                </p>
                <p className="text-sm text-gray-500">Avg Goal Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {mentorRating != null ? mentorRating.toFixed(1) : "—"}
                </p>
                <p className="text-sm text-gray-500">
                  Mentor Rating
                  {mentorRatingCount > 0 &&
                    ` (${mentorRatingCount} rating${mentorRatingCount === 1 ? "" : "s"})`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search mentees by name, email, or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Mentees List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Mentees</h2>
          {filteredMentees.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No mentees found</p>
              <p className="text-sm text-gray-400 mt-1">
                Entrepreneurs who sign up will appear here
              </p>
            </div>
          ) : (
            filteredMentees.map((mentee, idx) => {
              const goals = menteeGoalsMap[mentee.id] || [];
              const completedGoals = goals.filter((g) => g.completed).length;
              const progress =
                goals.length > 0
                  ? Math.round((completedGoals / goals.length) * 100)
                  : 0;

              return (
                <div
                  key={mentee.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedMentee(mentee)}
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${avatarColors[idx % avatarColors.length]}`}
                      >
                        {initials(mentee.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {mentee.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {mentee.program}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-emerald-600">
                            {mentee.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="text-emerald-600">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-1.5 bg-emerald-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMentee(mentee);
                        }}
                        className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <MessageCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quick Tips</h3>
                <p className="text-sm text-gray-600">
                  Click on any mentee to view their goals and leave feedback
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              💡 Your notes help mentees stay motivated!
            </div>
          </div>
        </div>
      </main>

      {/* Mentee Detail Modal */}
      {selectedMentee && (
        <MenteeDetailModal
          mentee={selectedMentee}
          onClose={() => setSelectedMentee(null)}
          mentorName={profile?.name || "Mentor"}
        />
      )}
    </div>
  );
}
