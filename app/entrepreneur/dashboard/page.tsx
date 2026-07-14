// app/entrepreneur/dashboard/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgramDetailsModal from "@/components/program-details-modal";
import { RouteGuard } from "@/components/auth/route-guard";
import { USER_ROLES } from "@/lib/roles";
import {
  Briefcase,
  Target,
  BookOpen,
  Calendar,
  Star,
  MessageCircle,
  Video,
  Mail,
  User,
  ChevronRight,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  Users,
  Lock,
  DollarSign,
  Clock as ClockIcon,
  Users as UsersIcon,
  FileText,
  TrendingUp as TrendingUpIcon,
  BarChart,
  Handshake,
  GraduationCap,
  Building,
} from "lucide-react";

// ✅ ALL_PROGRAMS - This is the source of truth
const ALL_PROGRAMS = [
  {
    id: "prog-1",
    name: "RCP Small Business Mentorship",
    description:
      "Connect with experienced local mentors for one-on-one guidance. Get help with business planning, marketing, financial management, and more.",
    status: "Active",
    startDate: "January 2025",
    progress: 0, // ✅ Set to 0 for new users
    icon: "👨‍🏫",
    color: "from-emerald-500 to-teal-500",
    contactEmail: "mentorship@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0101",
    managedBy: "multiple_mentors",
    resourceCategories: [
      "Mentorship",
      "Business Planning",
      "Marketing",
      "Financial",
    ],
    upcomingSessions: [
      {
        date: "June 10, 2025",
        time: "2:00 PM",
        topic: "Business Plan Review",
        mentor: "Michael Chen",
      },
    ],
  },
  {
    id: "prog-2",
    name: "SEED Micro-Grant",
    description:
      "10-week SEK Catalyst cohort with mentorship and grant opportunities. Includes $250 participant support + $500 grants for top businesses.",
    status: "Active",
    startDate: "January 2025",
    progress: 0, // ✅ Set to 0 for new users
    icon: "💰",
    color: "from-blue-500 to-indigo-500",
    contactEmail: "seed@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0102",
    managedBy: "multiple_mentors",
    resourceCategories: ["Financial", "Grant Writing", "Cohort", "Pitching"],
    upcomingSessions: [
      {
        date: "June 12, 2025",
        time: "10:00 AM",
        topic: "Weekly Cohort Meeting",
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
    progress: 0, // ✅ Set to 0 for new users
    icon: "📊",
    color: "from-purple-500 to-pink-500",
    contactEmail: "jody@hbcat.org",
    contactPhone: "(620) 555-0103",
    managedBy: "jody",
    resourceCategories: [
      "Financial Modeling",
      "Startup Support",
      "Capital",
      "Strategy",
    ],
    upcomingSessions: [
      {
        date: "June 15, 2025",
        time: "1:00 PM",
        topic: "Financial Planning Session",
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
    progress: 0, // ✅ Set to 0 for new users
    icon: "🎯",
    color: "from-indigo-500 to-purple-500",
    contactEmail: "catalyst@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0105",
    managedBy: "multiple_mentors",
    resourceCategories: [
      "Curriculum",
      "Mentorship",
      "KU Resources",
      "Workshops",
    ],
    upcomingSessions: [
      {
        date: "September 5, 2025",
        time: "6:00 PM",
        topic: "Program Kickoff & Orientation",
        mentor: "Jody Program",
      },
    ],
  },
];

function EntrepreneurDashboardContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [satisfactionRate, setSatisfactionRate] = useState(5);
  const [mentorInfo, setMentorInfo] = useState<any>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);

  // Check if user has access to a program
  const hasProgramAccess = (programName: string): boolean => {
    // ✅ Only "Business Professional Services" is accessible by default
    if (programName === "Business Professional Services") {
      return true;
    }
    // All other programs require Jody's approval
    if (!profile) return false;
    const approvedPrograms = profile.approvedPrograms || [];
    return approvedPrograms.includes(programName);
  };

  // Check if program is locked for this user
  const isProgramLocked = (programName: string): boolean => {
    return !hasProgramAccess(programName);
  };

  // Handle program click - only allow if not locked
  const handleProgramClick = (program: any) => {
    if (isProgramLocked(program.name)) {
      alert(
        `"${program.name}" is locked. Please contact Jody to request access to this program.`,
      );
      return;
    }
    setSelectedProgram(program);
    setShowProgramModal(true);
  };

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Load profile
    const savedProfile = localStorage.getItem(`profile_${currentUser}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
    }

    // ✅ DIRECTLY USE ALL_PROGRAMS - no localStorage needed for the list
    console.log("📋 Loading ALL_PROGRAMS:", ALL_PROGRAMS.length);
    setPrograms(ALL_PROGRAMS);

    // Load goals
    const savedGoals = JSON.parse(
      localStorage.getItem(`goals_${currentUser}`) || "[]",
    );
    setGoals(savedGoals);

    // Load satisfaction
    const savedSatisfaction = localStorage.getItem(
      `satisfaction_${currentUser}`,
    );
    if (savedSatisfaction) {
      setSatisfactionRate(parseInt(savedSatisfaction));
    }

    // Load mentor info
    const savedMentorInfo = localStorage.getItem("mentor_profile_data");
    if (savedMentorInfo) {
      setMentorInfo(JSON.parse(savedMentorInfo));
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const completedGoals = goals.filter((g: any) => g.completed).length;
  const totalGoals = goals.length;
  const progress =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const accessiblePrograms = programs.filter((p) => hasProgramAccess(p.name));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">
              Welcome back, {profile?.name?.split(" ")[0] || "Entrepreneur"}! 🎉
            </h2>
            <p className="text-emerald-100 mt-2">
              Your entrepreneurial journey is making progress
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Available Programs</p>
                <p className="text-2xl font-bold">
                  {accessiblePrograms.length}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Total Programs</p>
                <p className="text-2xl font-bold">{programs.length}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Goals Progress</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            onClick={() => router.push("/goals")}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {completedGoals}
                </p>
                <p className="text-sm text-gray-500">Goals Completed</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
          </div>

          <div
            onClick={() => router.push("/feedback")}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {satisfactionRate}/5
                </p>
                <p className="text-sm text-gray-500">Satisfaction Rating</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
          </div>

          {profile?.primaryRole === "mentee" && (
            <div
              onClick={() => router.push("/mentee/dashboard")}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Mentee Dashboard</p>
                  <p className="text-xs text-gray-500">View your progress</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
              </div>
            </div>
          )}
        </div>

        {/* Programs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">📋 All Programs</h3>
              <p className="text-xs text-gray-500 mt-1">
                {accessiblePrograms.length > 0
                  ? `You have access to ${accessiblePrograms.length} program(s). Locked programs require Jody's approval.`
                  : "You have access to Business Professional Services. Contact Jody for more programs."}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                ✅ Available
              </span>
              <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full flex items-center gap-1">
                <Lock className="h-3 w-3" /> Locked
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {programs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No programs available</p>
              </div>
            ) : (
              programs.map((program: any) => {
                const locked = isProgramLocked(program.name);
                const isJodyProgram =
                  program.name === "Business Professional Services";

                return (
                  <div
                    key={program.id}
                    onClick={() => handleProgramClick(program)}
                    className={`p-5 transition-colors cursor-pointer ${
                      locked ? "hover:bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Program Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${program.color || "from-gray-500 to-gray-600"} flex items-center justify-center text-2xl flex-shrink-0`}
                      >
                        {program.icon || "📋"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`font-semibold ${locked ? "text-gray-500" : "text-gray-900"}`}
                              >
                                {program.name}
                              </h4>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  program.status === "Active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {program.status}
                              </span>
                              {locked && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Locked
                                </span>
                              )}
                              {isJodyProgram && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                  ✅ Available
                                </span>
                              )}
                              {program.managedBy === "jody" && (
                                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                  👩‍💼 Jody's Program
                                </span>
                              )}
                              {program.name ===
                                "SEK Catalyst: Empowered by KU" && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  KU Partner
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {program.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-400">
                                Started {program.startDate}
                              </span>
                              {program.upcomingSessions &&
                                program.upcomingSessions.length > 0 && (
                                  <span className="text-xs text-blue-600">
                                    📅 {program.upcomingSessions.length}{" "}
                                    upcoming sessions
                                  </span>
                                )}
                            </div>
                          </div>
                          {!locked && (
                            <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 ml-4" />
                          )}
                          {locked && (
                            <Lock className="h-5 w-5 text-gray-300 flex-shrink-0 ml-4" />
                          )}
                        </div>

                        {/* ✅ Only show progress bar for accessible programs */}
                        {!locked && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">
                                Overall Progress
                              </span>
                              <span className="text-emerald-600 font-medium">
                                {program.progress}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${program.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {locked && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              This program is locked. Contact Jody to request
                              access.
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href =
                                  "mailto:jody@hbcat.org?subject=Request%20Access%20to%20" +
                                  encodeURIComponent(program.name);
                              }}
                              className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              Request Access →
                            </button>
                          </div>
                        )}

                        {/* Resource Categories Tags */}
                        {!locked &&
                          program.resourceCategories &&
                          program.resourceCategories.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {program.resourceCategories.map(
                                (category: string) => (
                                  <span
                                    key={category}
                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                  >
                                    {category}
                                  </span>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Program Details Modal */}
        {showProgramModal &&
          selectedProgram &&
          !isProgramLocked(selectedProgram.name) && (
            <ProgramDetailsModal
              program={selectedProgram}
              onClose={() => {
                setShowProgramModal(false);
                setSelectedProgram(null);
              }}
              userEmail={profile?.email}
              userRole={profile?.primaryRole}
            />
          )}

        {/* Mentor Information */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Your Mentor</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                {mentorInfo?.name?.charAt(0) || "M"}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {mentorInfo?.name || "Billi Hawk"}
                </h4>
                <p className="text-sm text-gray-500">
                  {mentorInfo?.email || "Billi@gmail.com"}
                </p>
                <p className="text-sm text-gray-500">
                  {mentorInfo?.phone || "920-234-2345"}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {mentorInfo?.bio ||
                "Experienced business mentor helping entrepreneurs succeed."}
            </p>
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  mentorInfo?.expertise || [
                    "Business Strategy",
                    "Marketing",
                    "Financial Planning",
                  ]
                ).map((exp: string, idx: number) => (
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
                (window.location.href = `mailto:${mentorInfo?.email || "Billi@gmail.com"}`)
              }
              className="w-full py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Message Mentor
            </button>
          </div>
        </div>

        {/* Zoom Meeting Section */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Join Your Session</h3>
              <p className="text-sm text-gray-600">
                Enter your Zoom meeting ID and passcode to join your session
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Zoom Meeting ID
              </label>
              <input
                type="text"
                id="zoomMeetingId"
                placeholder="e.g., 123 456 7890"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Passcode (optional)
              </label>
              <input
                type="text"
                id="zoomPassword"
                placeholder="Enter Zoom passcode"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => {
              const meetingId = (
                document.getElementById("zoomMeetingId") as HTMLInputElement
              )?.value;
              const password = (
                document.getElementById("zoomPassword") as HTMLInputElement
              )?.value;
              if (!meetingId?.trim()) {
                alert("Please enter your Zoom Meeting ID");
                return;
              }
              const cleanMeetingId = meetingId.trim().replace(/\s/g, "");
              let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
              if (password?.trim()) {
                zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
              }
              window.open(zoomUrl, "_blank");
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Video className="h-4 w-4" />
            Join Zoom Meeting
          </button>
        </div>

        {/* Support Section */}
        <div
          onClick={() =>
            (window.location.href =
              "mailto:jody@hbcat.org?subject=Support Request from Rural Community Partners Dashboard")
          }
          className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Need personalized support?
                </h3>
                <p className="text-sm text-gray-600">
                  Click here to email Jody directly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>jody@hbcat.org</span>
              <Mail className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with Route Guard
export default function EntrepreneurDashboardPage() {
  return (
    <RouteGuard
      allowedRoles={[USER_ROLES.ENTREPRENEUR, USER_ROLES.MENTEE]}
      redirectTo="/"
    >
      <EntrepreneurDashboardContent />
    </RouteGuard>
  );
}
