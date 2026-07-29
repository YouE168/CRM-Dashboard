"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "./kpi-card";
import {
  Users,
  UserCheck,
  Heart,
  Award,
  Target,
  MessageCircle,
  CheckCircle,
  Circle,
  X,
  Calendar,
  Video,
  Send,
  Mail,
  Phone,
} from "lucide-react";
import {
  getMentors,
  getMentorsStats,
  getMenteesForMentor,
  subscribeToMentorsChanges,
  getGoalsForParticipant,
  getNotesForParticipant,
  addMenteeNote,
  getSessionsForParticipant,
  addMenteeSession,
  subscribeToMenteeData,
  type MentorRow,
  type MentorsStats,
  type MenteeGoalRow,
  type MenteeNoteRow,
  type MenteeSessionRow,
} from "@/lib/supabase/dashboard-data";
import { supabase } from "@/lib/supabase/client";

// Types
interface Mentee {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  status: string;
  sessionsCompleted: number;
}

// Goals, Notes, and Sessions in the mentee detail modal below now read
// and write through the real mentee_goals/mentee_notes/mentee_sessions
// tables (same ones the mentee's own dashboard uses), replacing the old
// localStorage("goals_*"/"mentee_notes_*"/"mentee_sessions_*") blobs -
// those keys were never written to by the real mentee-facing app, so the
// old version of this modal always showed stale or empty data.

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

// Schedule Session Modal
function ScheduleSessionModal({
  mentee,
  onClose,
  onSchedule,
}: {
  mentee: Mentee;
  onClose: () => void;
  onSchedule: (session: any) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !topic) {
      alert("Please fill in all required fields");
      return;
    }
    onSchedule({ date, time, topic, notes, meetingLink });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Schedule Session with {mentee.name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Business Plan Review"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zoom Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes (for mentee)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What will be covered? Any prep work?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              Schedule Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Mentee Details Modal Component
function MenteeDetailsModal({
  mentee,
  onClose,
  currentMentorName,
}: {
  mentee: Mentee;
  onClose: () => void;
  currentMentorName: string;
}) {
  const [goals, setGoals] = useState<MenteeGoalRow[]>([]);
  const [notes, setNotes] = useState<MenteeNoteRow[]>([]);
  const [sessions, setSessions] = useState<MenteeSessionRow[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      const [goalsData, notesData, sessionsData] = await Promise.all([
        getGoalsForParticipant(mentee.id),
        getNotesForParticipant(mentee.id),
        getSessionsForParticipant(mentee.id),
      ]);
      setGoals(goalsData);
      setNotes(notesData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Failed to load mentee details:", err);
    } finally {
      setLoadingDetails(false);
    }
  }, [mentee.id]);

  useEffect(() => {
    loadDetails();
    const unsubscribe = subscribeToMenteeData(loadDetails);
    return unsubscribe;
  }, [loadDetails]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addMenteeNote(mentee.id, newNote, currentMentorName);
      setNewNote("");
      await loadDetails();
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Couldn't save that note. Please try again.");
    }
  };

  const handleScheduleSession = async (session: {
    date: string;
    time: string;
    topic: string;
    notes: string;
    meetingLink: string;
  }) => {
    try {
      await addMenteeSession({
        participant_id: mentee.id,
        date: session.date,
        time: session.time,
        topic: session.topic,
        notes: session.notes,
        meeting_link: session.meetingLink,
        mentor_name: currentMentorName,
      });
      await loadDetails();
    } catch (err) {
      console.error("Failed to schedule session:", err);
      alert("Couldn't schedule that session. Please try again.");
    }
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const goalProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{mentee.name}</h2>
              <p className="text-sm text-gray-500">{mentee.program}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1"
              >
                <Calendar className="h-4 w-4" />
                Schedule
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {loadingDetails && (
              <p className="text-sm text-gray-400">Loading mentee details…</p>
            )}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">{mentee.email || "—"}</p>
                  {mentee.email && (
                    <button
                      onClick={() => (window.location.href = `mailto:${mentee.email}`)}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Mail className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">{mentee.phone || "—"}</p>
                  {mentee.phone && (
                    <button
                      onClick={() => (window.location.href = `tel:${mentee.phone}`)}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Phone className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sessions Completed</p>
                <p className="text-sm font-medium">{mentee.sessionsCompleted}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                  {mentee.status}
                </span>
              </div>
            </div>

            {sessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Scheduled Sessions</h3>
                </div>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{session.topic}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </p>
                          {session.notes && (
                            <p className="text-xs text-gray-600 mt-1">📝 {session.notes}</p>
                          )}
                        </div>
                        {session.meeting_link && (
                          <button
                            onClick={() => window.open(session.meeting_link!, "_blank")}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                          >
                            <Video className="h-3 w-3 inline mr-1" />
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Mentee's Goals</h3>
              </div>

              {goals.length === 0 ? (
                <p className="text-sm text-gray-400">No goals set yet.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Goal Progress</span>
                      <span className="text-emerald-600 font-medium">{goalProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-emerald-500 rounded-full"
                        style={{ width: `${goalProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {completedGoals} of {totalGoals} goals completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    {(showAllGoals ? goals : goals.slice(0, 5)).map((goal) => (
                      <div key={goal.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        {goal.completed ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className={`text-sm ${goal.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                            {goal.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {goal.due_date
                              ? `Due: ${new Date(goal.due_date).toLocaleDateString()}`
                              : "No due date"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {goals.length > 5 && (
                    <button
                      onClick={() => setShowAllGoals(!showAllGoals)}
                      className="mt-3 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      {showAllGoals ? "Show Less" : `View All ${goals.length} Goals →`}
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Notes for Mentee</h3>
              </div>

              <div className="flex gap-2 mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a note for your mentee (feedback, encouragement, reminders)..."
                  rows={2}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No notes yet. Add a note for your mentee.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-amber-700">{note.author}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleSessionModal
          mentee={mentee}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleSession}
        />
      )}
    </>
  );
}

export function MentorsTab() {
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [stats, setStats] = useState<MentorsStats | null>(null);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [showMenteeModal, setShowMenteeModal] = useState(false);
  const [currentMentorName, setCurrentMentorName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      let mentorName = "Mentor";
      if (authData.user) {
        const { data: userRow } = await supabase
          .from("users")
          .select("name")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (userRow?.name) mentorName = userRow.name;
      }
      setCurrentMentorName(mentorName);

      const [mentorsData, statsData, menteesData] = await Promise.all([
        getMentors(),
        getMentorsStats(),
        getMenteesForMentor(mentorName),
      ]);

      setMentors(mentorsData);
      setStats(statsData);
      setMentees(
        menteesData.map((m) => ({
          id: m.id,
          name: m.name ?? "",
          email: m.email ?? "",
          phone: m.phone ?? "",
          program: m.program_name ?? "",
          status: m.status,
          sessionsCompleted: m.sessions_completed,
        })),
      );
    } catch (err) {
      console.error("Failed to load mentors data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToMentorsChanges(loadData);
    return unsubscribe;
  }, [loadData]);

  const handleMenteeClick = (mentee: Mentee) => {
    setSelectedMentee(mentee);
    setShowMenteeModal(true);
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading mentors…</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentors</h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats?.total ?? 0} mentors · {stats?.active ?? 0} currently active
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Mentors" value={stats?.total ?? 0} icon={Users} />
        <KPICard
          title="Active Mentors"
          value={stats?.active ?? 0}
          icon={UserCheck}
          variant="success"
        />
        <KPICard
          title="Active Matches"
          value={stats?.active_matches ?? 0}
          icon={Heart}
          trend={{ value: stats?.matches_trend ?? 0, isPositive: true }}
          subtitle="paired"
        />
        <KPICard
          title="Avg. Rating"
          value={`${stats?.avg_rating ?? 0}★`}
          icon={Award}
          variant="success"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Mentor Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Mentor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Specialty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Active Clients</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mentors.map((m, i) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                        {initials(m.name)}
                      </div>
                      <span className="font-medium text-gray-900 whitespace-nowrap">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{m.specialty}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">{m.active_clients}</td>
                  <td className="px-5 py-3 text-amber-600 font-medium">{m.rating}★</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${m.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">My Mentees</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {mentees.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No mentees currently assigned to {currentMentorName}.
            </div>
          ) : (
            mentees.map((mentee, idx) => (
              <div
                key={mentee.id}
                className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleMenteeClick(mentee)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColors[idx % avatarColors.length]}`}>
                      {initials(mentee.name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mentee.name}</p>
                      <p className="text-xs text-gray-500">{mentee.program}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-emerald-600">
                          {mentee.sessionsCompleted} sessions completed
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenteeClick(mentee);
                    }}
                    className="px-3 py-1.5 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showMenteeModal && selectedMentee && (
        <MenteeDetailsModal
          mentee={selectedMentee}
          onClose={() => setShowMenteeModal(false)}
          currentMentorName={currentMentorName}
        />
      )}
    </>
  );
}
