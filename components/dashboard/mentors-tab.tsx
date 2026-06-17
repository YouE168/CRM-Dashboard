"use client";

import { useState, useEffect } from "react";
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
  Eye,
  Calendar,
  Clock,
  Video,
  Plus,
  Send,
  Mail,
  Phone,
} from "lucide-react";
import { loadCMSData } from "@/lib/cms-data";

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

interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  category: string;
}

interface Note {
  id: number;
  date: string;
  note: string;
  author: string;
}

interface Session {
  id: number;
  date: string;
  time: string;
  topic: string;
  notes: string;
  meetingLink: string;
  mentorName: string;
  createdAt: string;
}

// Sample mentees data with real email mapping
const menteesList: Mentee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "(555) 111-2222",
    program: "Business Catalyst Program",
    status: "Active",
    sessionsCompleted: 4,
  },
  {
    id: "2",
    name: "Michael Martinez",
    email: "michael@example.com",
    phone: "(555) 333-4444",
    program: "Business Catalyst Program",
    status: "Active",
    sessionsCompleted: 3,
  },
  {
    id: "3",
    name: "Emily Brown",
    email: "emily@example.com",
    phone: "(555) 555-6666",
    program: "Women Entrepreneurs Program",
    status: "Active",
    sessionsCompleted: 5,
  },
  {
    id: "4",
    name: "Jessica Rodriguez",
    email: "jessica@example.com",
    phone: "(555) 777-8888",
    program: "Business Catalyst Program",
    status: "Active",
    sessionsCompleted: 2,
  },
  {
    id: "5",
    name: "Daniel Lee",
    email: "daniel@example.com",
    phone: "(555) 999-0000",
    program: "Youth Mentorship",
    status: "Active",
    sessionsCompleted: 1,
  },
];

// Get mentee goals from localStorage or return default
const getMenteeGoals = (menteeId: string): Goal[] => {
  const mentee = menteesList.find((m) => m.id === menteeId);
  if (mentee) {
    const savedGoals = localStorage.getItem(`goals_${mentee.email}`);
    if (savedGoals) {
      return JSON.parse(savedGoals);
    }
  }

  const defaultGoals: Record<string, Goal[]> = {
    "1": [
      {
        id: "g1",
        title: "Complete Business Profile",
        description: "Fill out complete business profile",
        dueDate: "2025-06-15",
        completed: true,
        category: "Onboarding",
      },
      {
        id: "g2",
        title: "First Mentor Session",
        description: "Schedule first mentoring session",
        dueDate: "2025-06-20",
        completed: true,
        category: "Mentorship",
      },
      {
        id: "g3",
        title: "Complete Business Plan",
        description: "Finish business plan",
        dueDate: "2025-06-30",
        completed: false,
        category: "Planning",
      },
      {
        id: "g4",
        title: "Financial Projections",
        description: "Create financial projections",
        dueDate: "2025-07-10",
        completed: false,
        category: "Financial",
      },
    ],
    "2": [
      {
        id: "g5",
        title: "Complete Business Profile",
        description: "Fill out complete business profile",
        dueDate: "2025-06-15",
        completed: true,
        category: "Onboarding",
      },
      {
        id: "g6",
        title: "First Mentor Session",
        description: "Schedule first mentoring session",
        dueDate: "2025-06-20",
        completed: false,
        category: "Mentorship",
      },
      {
        id: "g7",
        title: "Marketing Strategy",
        description: "Develop marketing plan",
        dueDate: "2025-07-15",
        completed: false,
        category: "Marketing",
      },
    ],
    "3": [
      {
        id: "g8",
        title: "Complete Business Profile",
        description: "Fill out complete business profile",
        dueDate: "2025-06-15",
        completed: true,
        category: "Onboarding",
      },
      {
        id: "g9",
        title: "First Mentor Session",
        description: "Schedule first mentoring session",
        dueDate: "2025-06-20",
        completed: true,
        category: "Mentorship",
      },
      {
        id: "g10",
        title: "Business Plan Review",
        description: "Review business plan with mentor",
        dueDate: "2025-06-25",
        completed: false,
        category: "Planning",
      },
      {
        id: "g11",
        title: "Financial Planning",
        description: "Create financial plan",
        dueDate: "2025-07-20",
        completed: false,
        category: "Financial",
      },
    ],
  };
  return defaultGoals[menteeId] || [];
};

// Get notes for a mentee from localStorage
const getMenteeNotes = (menteeId: string): Note[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(`mentee_notes_${menteeId}`);
  return saved ? JSON.parse(saved) : [];
};
// Save availability to localStorage for mentees to see
const saveAvailabilityToStorage = (availability: string[]) => {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) {
    const mentorProfile = JSON.parse(
      localStorage.getItem(`mentor_profile_${currentUser}`) || "{}",
    );
    mentorProfile.availability = availability;
    localStorage.setItem(
      `mentor_profile_${currentUser}`,
      JSON.stringify(mentorProfile),
    );
  }
};

// Save note for a mentee
const saveMenteeNote = (
  menteeId: string,
  note: string,
  author: string,
): Note => {
  const existingNotes = getMenteeNotes(menteeId);
  const newNote = {
    id: Date.now(),
    date: new Date().toISOString(),
    note: note,
    author: author,
  };
  existingNotes.unshift(newNote);
  localStorage.setItem(
    `mentee_notes_${menteeId}`,
    JSON.stringify(existingNotes),
  );
  return newNote;
};

// Save a session for a mentee
const saveSession = (
  menteeId: string,
  session: any,
  mentorName: string,
): Session => {
  const mentee = menteesList.find((m) => m.id === menteeId);
  if (!mentee) throw new Error("Mentee not found");

  const existingSessions = JSON.parse(
    localStorage.getItem(`mentee_sessions_${menteeId}`) || "[]",
  );
  const newSession: Session = {
    id: Date.now(),
    ...session,
    mentorName: mentorName,
    createdAt: new Date().toISOString(),
  };
  existingSessions.push(newSession);
  localStorage.setItem(
    `mentee_sessions_${menteeId}`,
    JSON.stringify(existingSessions),
  );

  const allSessions = JSON.parse(
    localStorage.getItem(`all_sessions_${mentee.email}`) || "[]",
  );
  allSessions.push(newSession);
  localStorage.setItem(
    `all_sessions_${mentee.email}`,
    JSON.stringify(allSessions),
  );

  return newSession;
};

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
  mentorName,
}: {
  mentee: Mentee;
  onClose: () => void;
  onSchedule: (session: any) => void;
  mentorName: string;
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
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zoom Meeting Link
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Notes (for mentee)
            </label>
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
  onAddNote,
  onScheduleSession,
  currentMentorName,
}: {
  mentee: Mentee;
  onClose: () => void;
  onAddNote: (note: string) => void;
  onScheduleSession: () => void;
  currentMentorName: string;
}) {
  const [goals, setGoals] = useState<Goal[]>(getMenteeGoals(mentee.id));
  const [notes, setNotes] = useState<Note[]>(getMenteeNotes(mentee.id));
  const [newNote, setNewNote] = useState("");
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const savedSessions = JSON.parse(
      localStorage.getItem(`mentee_sessions_${mentee.id}`) || "[]",
    );
    setSessions(savedSessions);
  }, [mentee.id]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      const savedNote = saveMenteeNote(mentee.id, newNote, currentMentorName);
      setNotes([savedNote, ...notes]);
      onAddNote(newNote);
      setNewNote("");
    }
  };

  const handleScheduleSession = (session: any) => {
    const newSession = saveSession(mentee.id, session, currentMentorName);
    setSessions([newSession, ...sessions]);
    onScheduleSession();
  };

  const completedGoals = goals.filter((g: Goal) => g.completed).length;
  const totalGoals = goals.length;
  const goalProgress =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mentee.name}
              </h2>
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
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Mentee Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">{mentee.email}</p>
                  <button
                    onClick={() =>
                      (window.location.href = `mailto:${mentee.email}`)
                    }
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Mail className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">{mentee.phone}</p>
                  <button
                    onClick={() =>
                      (window.location.href = `tel:${mentee.phone}`)
                    }
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <Phone className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sessions Completed</p>
                <p className="text-sm font-medium">
                  {mentee.sessionsCompleted}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                  {mentee.status}
                </span>
              </div>
            </div>

            {/* Upcoming Sessions */}
            {sessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Scheduled Sessions
                  </h3>
                </div>
                <div className="space-y-2">
                  {sessions.map((session: Session) => (
                    <div
                      key={session.id}
                      className="bg-blue-50 p-3 rounded-lg border border-blue-100"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {session.topic}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(session.date).toLocaleDateString()} at{" "}
                            {session.time}
                          </p>
                          {session.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              📝 {session.notes}
                            </p>
                          )}
                        </div>
                        {session.meetingLink && (
                          <button
                            onClick={() =>
                              window.open(session.meetingLink, "_blank")
                            }
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

            {/* Goals Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Mentee's Goals</h3>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Goal Progress</span>
                  <span className="text-emerald-600 font-medium">
                    {goalProgress}%
                  </span>
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
                {(showAllGoals ? goals : goals.slice(0, 5)).map(
                  (goal: Goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      {goal.completed ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm ${goal.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                        >
                          {goal.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          Due: {new Date(goal.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
              {goals.length > 5 && (
                <button
                  onClick={() => setShowAllGoals(!showAllGoals)}
                  className="mt-3 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  {showAllGoals
                    ? "Show Less"
                    : `View All ${goals.length} Goals →`}
                </button>
              )}
            </div>

            {/* Mentor Notes Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">
                  Notes for Mentee
                </h3>
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
                  notes.map((note: Note) => (
                    <div
                      key={note.id}
                      className="bg-amber-50 rounded-xl p-3 border border-amber-100"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-amber-700">
                          {note.author}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.date).toLocaleDateString()}
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

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <ScheduleSessionModal
          mentee={mentee}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleSession}
          mentorName={currentMentorName}
        />
      )}
    </>
  );
}

const mentors = [
  {
    name: "Michael Chen",
    specialty: "Business Strategy",
    clients: 8,
    rating: 4.9,
    status: "Active",
  },
  {
    name: "Lisa Thompson",
    specialty: "Youth Development",
    clients: 6,
    rating: 4.7,
    status: "Active",
  },
  {
    name: "David Park",
    specialty: "Entrepreneurship",
    clients: 5,
    rating: 4.8,
    status: "Active",
  },
  {
    name: "Jennifer Lee",
    specialty: "Veterans Affairs",
    clients: 7,
    rating: 4.6,
    status: "Active",
  },
  {
    name: "Tom Anderson",
    specialty: "Finance",
    clients: 4,
    rating: 4.5,
    status: "Active",
  },
  {
    name: "Susan White",
    specialty: "Leadership",
    clients: 6,
    rating: 4.9,
    status: "On Leave",
  },
  {
    name: "Chris Taylor",
    specialty: "Marketing",
    clients: 5,
    rating: 4.7,
    status: "Active",
  },
  {
    name: "Rachel Green",
    specialty: "Operations",
    clients: 3,
    rating: 4.8,
    status: "Active",
  },
];

export function MentorsTab() {
  const [cmsData, setCmsData] = useState(loadCMSData());
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [showMenteeModal, setShowMenteeModal] = useState(false);
  const [currentMentorName, setCurrentMentorName] = useState("");

  useEffect(() => {
    setCmsData(loadCMSData());

    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser}`);
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setCurrentMentorName(profile.name);
      } else {
        setCurrentMentorName("Mentor");
      }
    }
  }, []);

  const handleMenteeClick = (mentee: Mentee) => {
    setSelectedMentee(mentee);
    setShowMenteeModal(true);
  };

  const handleAddNote = (note: string) => {
    // Note already saved in modal
  };

  const handleScheduleSession = () => {
    // Session already saved in modal
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mentors</h1>
        <p className="text-sm text-gray-500 mt-1">
          {cmsData.mentors.total} mentors · {cmsData.mentors.active} currently
          active
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Mentors"
          value={cmsData.mentors.total}
          icon={Users}
        />
        <KPICard
          title="Active Mentors"
          value={cmsData.mentors.active}
          icon={UserCheck}
          variant="success"
        />
        <KPICard
          title="Active Matches"
          value={cmsData.mentors.activeMatches}
          icon={Heart}
          trend={{ value: cmsData.mentors.matchesTrend, isPositive: true }}
          subtitle="paired"
        />
        <KPICard
          title="Avg. Rating"
          value={`${cmsData.mentors.avgRating}★`}
          icon={Award}
          variant="success"
        />
      </div>

      {/* Mentors Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Mentor Directory
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Mentor
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Specialty
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Active Clients
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Rating
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mentors.map((m, i) => (
                <tr key={m.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColors[i % avatarColors.length]}`}
                      >
                        {initials(m.name)}
                      </div>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {m.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{m.specialty}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {m.clients}
                  </td>
                  <td className="px-5 py-3 text-amber-600 font-medium">
                    {m.rating}★
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${m.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Mentees Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">My Mentees</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {menteesList.map((mentee, idx) => (
            <div
              key={mentee.id}
              className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => handleMenteeClick(mentee)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColors[idx % avatarColors.length]}`}
                  >
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
          ))}
        </div>
      </div>

      {/* Mentee Details Modal */}
      {showMenteeModal && selectedMentee && (
        <MenteeDetailsModal
          mentee={selectedMentee}
          onClose={() => setShowMenteeModal(false)}
          onAddNote={handleAddNote}
          onScheduleSession={handleScheduleSession}
          currentMentorName={currentMentorName}
        />
      )}
    </>
  );
}
