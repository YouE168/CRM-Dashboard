"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Target,
  CheckCircle,
  Circle,
  MessageCircle,
  Star,
  Video,
  ArrowLeft,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";

interface MenteeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  startDate: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    phone: string;
    bio: string;
    expertise: string[];
    availability: string[];
  };
  goals: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    completed: boolean;
    category: string;
  }[];
  upcomingSessions: {
    id: string;
    date: string;
    time: string;
    topic: string;
    mentorNotes?: string;
    meetingLink?: string;
  }[];
  mentorNotes: {
    id: string;
    date: string;
    note: string;
    author: string;
  }[];
}

export default function MenteeDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MenteeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllGoals, setShowAllGoals] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Load mentee profile (this would come from your data store)
    const savedMenteeProfile = localStorage.getItem(
      `mentee_profile_${currentUser}`,
    );
    if (savedMenteeProfile) {
      setProfile(JSON.parse(savedMenteeProfile));
    } else {
      // Demo data
      setProfile({
        id: "mentee-1",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "(555) 123-4567",
        program: "Business Catalyst Program",
        startDate: "2025-01-15",
        mentor: {
          id: "mentor-1",
          name: "Michael Chen",
          email: "michael.chen@example.com",
          phone: "(555) 987-6543",
          bio: "Experienced business mentor with 10+ years in entrepreneurship and small business development.",
          expertise: ["Business Strategy", "Marketing", "Financial Planning"],
          availability: [
            "Monday 2-5 PM",
            "Wednesday 10-12 PM",
            "Friday 1-4 PM",
          ],
        },
        goals: [
          {
            id: "1",
            title: "Complete Business Profile",
            description: "Fill out complete business profile",
            dueDate: "2025-06-15",
            completed: true,
            category: "Onboarding",
          },
          {
            id: "2",
            title: "First Mentor Session",
            description: "Schedule and complete first mentoring session",
            dueDate: "2025-06-20",
            completed: true,
            category: "Mentorship",
          },
          {
            id: "3",
            title: "Complete Business Plan",
            description: "Finish business plan with mentor feedback",
            dueDate: "2025-06-30",
            completed: false,
            category: "Planning",
          },
          {
            id: "4",
            title: "Financial Projections",
            description: "Create 12-month financial projections",
            dueDate: "2025-07-10",
            completed: false,
            category: "Financial",
          },
          {
            id: "5",
            title: "Marketing Strategy",
            description: "Develop comprehensive marketing plan",
            dueDate: "2025-07-15",
            completed: false,
            category: "Marketing",
          },
        ],
        upcomingSessions: [
          {
            id: "s1",
            date: "2025-06-10",
            time: "2:00 PM",
            topic: "Business Plan Review",
            mentorNotes: "Please bring your draft business plan",
            meetingLink: "https://zoom.us/j/123456789",
          },
          {
            id: "s2",
            date: "2025-06-17",
            time: "11:00 AM",
            topic: "Marketing Strategy",
            mentorNotes: "Review target market analysis",
          },
        ],
        mentorNotes: [
          {
            id: "n1",
            date: "2025-05-20",
            note: "Great progress on business model! Keep up the good work.",
            author: "Michael Chen",
          },
          {
            id: "n2",
            date: "2025-05-13",
            note: "Need to work on customer discovery interviews.",
            author: "Michael Chen",
          },
        ],
      });
    }
    setLoading(false);
  }, [router]);

  const toggleGoal = (goalId: string) => {
    if (profile) {
      const updatedGoals = profile.goals.map((goal) =>
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal,
      );
      setProfile({ ...profile, goals: updatedGoals });
      // Save to localStorage
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        localStorage.setItem(
          `mentee_profile_${currentUser}`,
          JSON.stringify({ ...profile, goals: updatedGoals }),
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  const completedGoals = profile.goals.filter((g) => g.completed).length;
  const totalGoals = profile.goals.length;
  const goalProgress = Math.round((completedGoals / totalGoals) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-md">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                  Mentee Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  Welcome, {profile.name.split(" ")[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <User className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push("/login")}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold">
            Welcome back, {profile.name.split(" ")[0]}! 🎉
          </h2>
          <p className="text-emerald-100 mt-1">
            Your mentoring journey is progressing
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-sm opacity-90">Program</p>
              <p className="font-semibold">{profile.program}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-sm opacity-90">Mentor</p>
              <p className="font-semibold">{profile.mentor.name}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2">
              <p className="text-sm opacity-90">Started</p>
              <p className="font-semibold">
                {new Date(profile.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sessions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Upcoming Sessions
                  </h3>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {profile.upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex gap-4">
                        <div className="bg-blue-50 rounded-xl p-3 text-center min-w-[80px]">
                          <div className="text-2xl font-bold text-blue-600">
                            {new Date(session.date).getDate()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(session.date).toLocaleString("default", {
                              month: "short",
                            })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {session.time}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {session.topic}
                          </h4>
                          {session.mentorNotes && (
                            <p className="text-sm text-gray-500 mt-1">
                              📝 {session.mentorNotes}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            with {profile.mentor.name}
                          </p>
                        </div>
                      </div>
                      {session.meetingLink && (
                        <button
                          onClick={() =>
                            window.open(session.meetingLink, "_blank")
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Video className="h-4 w-4" />
                          Join Session
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor Notes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">
                    Notes from Your Mentor
                  </h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {profile.mentorNotes.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No notes yet. Your mentor will leave feedback here.
                  </p>
                ) : (
                  profile.mentorNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-amber-50 rounded-xl p-4 border border-amber-100"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-amber-700">
                          {note.author}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{note.note}</p>
                    </div>
                  ))
                )}
                <button
                  onClick={() => setShowNotesModal(true)}
                  className="w-full mt-2 text-center text-sm text-emerald-600 hover:text-emerald-700"
                >
                  View All Notes →
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Mentor Info & Goals */}
          <div className="space-y-6">
            {/* Mentor Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Your Mentor</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    {profile.mentor.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {profile.mentor.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {profile.mentor.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {profile.mentor.phone}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {profile.mentor.bio}
                </p>
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Expertise
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.mentor.expertise.map((exp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-50 text-purple-600 rounded-full text-xs"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() =>
                    (window.location.href = `mailto:${profile.mentor.email}`)
                  }
                  className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  Message Mentor
                </button>
              </div>
            </div>

            {/* Mentor Availability */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    Mentor Availability
                  </h3>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-2">
                  {profile.mentor.availability.map((slot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                    >
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">{slot}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() =>
                    (window.location.href = `mailto:${profile.mentor.email}?subject=Schedule a Session`)
                  }
                  className="w-full mt-4 py-2 border border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors"
                >
                  Request Session
                </button>
              </div>
            </div>

            {/* Goals Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Your Goals</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Overall Progress</span>
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
                </div>
                <div className="space-y-3">
                  {(showAllGoals
                    ? profile.goals
                    : profile.goals.slice(0, 3)
                  ).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => toggleGoal(goal.id)}
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
                  ))}
                </div>
                {profile.goals.length > 3 && (
                  <button
                    onClick={() => setShowAllGoals(!showAllGoals)}
                    className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 w-full text-center"
                  >
                    {showAllGoals
                      ? "Show Less"
                      : `View All ${profile.goals.length} Goals →`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                My Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profile.name.charAt(0)}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Full Name</label>
                <p className="font-medium">{profile.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Email</label>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Phone</label>
                <p className="font-medium">{profile.phone}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Program</label>
                <p className="font-medium">{profile.program}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Mentor</label>
                <p className="font-medium">{profile.mentor.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-400">Start Date</label>
                <p className="font-medium">
                  {new Date(profile.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                All Mentor Notes
              </h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              {profile.mentorNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-amber-50 rounded-xl p-4 border border-amber-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-amber-700">
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
          </div>
        </div>
      )}
    </div>
  );
}
