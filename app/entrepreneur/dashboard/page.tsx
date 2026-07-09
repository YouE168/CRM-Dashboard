// app/entrepreneur/dashboard/page.tsx
"use client";

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
} from "lucide-react";

// Entrepreneur-specific dashboard content
function EntrepreneurDashboardContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [satisfactionRate, setSatisfactionRate] = useState(5);
  const [mentorInfo, setMentorInfo] = useState<any>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const savedProfile = localStorage.getItem(`profile_${currentUser}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
    }

    // Load entrepreneur programs - ensure SEK Catalyst is included
    const programData = JSON.parse(
      localStorage.getItem("entrepreneur_programs_data") ||
        JSON.stringify({
          programs: [
            {
              id: "prog-1",
              name: "RCP Small Business Mentorship",
              status: "Active",
              startDate: "January 2025",
              progress: 33,
              nextMilestone: "Complete your business profile",
              nextMilestoneAction:
                "https://forms.google.com/mentorship-profile",
              resources: [
                {
                  name: "Mentor Directory",
                  link: "/resources/mentor-directory",
                },
                {
                  name: "Business Planning Templates",
                  link: "/resources/templates",
                },
              ],
              upcomingSessions: [
                {
                  date: "June 10, 2025",
                  time: "2:00 PM",
                  topic: "Business Plan Review",
                  mentor: "Michael Chen",
                  link: "/mentor/settings?mentee=1",
                },
              ],
              contactEmail: "mentorship@ruralcommunitypartners.org",
              contactPhone: "(620) 555-0101",
            },
            {
              id: "prog-2",
              name: "SEED Micro-Grant",
              status: "Active",
              startDate: "January 2025",
              progress: 33,
              nextMilestone: "Complete cohort application",
              nextMilestoneAction: "https://forms.google.com/seed-application",
              resources: [
                { name: "Cohort Calendar", link: "/resources/seed-calendar" },
                {
                  name: "Grant Application Guide",
                  link: "/resources/grant-guide",
                },
              ],
              upcomingSessions: [
                {
                  date: "June 12, 2025",
                  time: "10:00 AM",
                  topic: "Weekly Cohort Meeting",
                  mentor: "David Park",
                  link: "/zoom/seed-cohort",
                },
              ],
              contactEmail: "seed@ruralcommunitypartners.org",
              contactPhone: "(620) 555-0102",
            },
            {
              id: "prog-3",
              name: "Business Professional Services",
              status: "Active",
              startDate: "January 2025",
              progress: 33,
              nextMilestone: "Schedule professional services call",
              nextMilestoneAction:
                "https://calendar.google.com/professional-services",
              resources: [
                {
                  name: "Financial Templates",
                  link: "/resources/financial-templates",
                },
                {
                  name: "Capital Readiness Guide",
                  link: "/resources/capital-guide",
                },
              ],
              upcomingSessions: [
                {
                  date: "June 15, 2025",
                  time: "1:00 PM",
                  topic: "Financial Planning Session",
                  mentor: "Jody Program",
                  link: "/zoom/financial-planning",
                },
              ],
              contactEmail: "jody@hbcat.org",
              contactPhone: "(620) 555-0103",
            },
            {
              id: "prog-4",
              name: "Microloan Program",
              status: "Active",
              startDate: "January 2025",
              progress: 33,
              nextMilestone: "Check loan eligibility",
              nextMilestoneAction:
                "https://forms.google.com/microloan-eligibility",
              resources: [
                {
                  name: "Loan Application",
                  link: "/resources/loan-application",
                },
                {
                  name: "Eligibility Requirements",
                  link: "/resources/eligibility",
                },
              ],
              upcomingSessions: [],
              contactEmail: "loans@ruralcommunitypartners.org",
              contactPhone: "(620) 555-0104",
            },
            {
              id: "prog-5",
              name: "SEK Catalyst: Empowered by KU",
              status: "Active",
              startDate: "August 2025",
              progress: 0,
              nextMilestone: "Complete your onboarding session",
              nextMilestoneAction:
                "https://calendar.google.com/sek-catalyst-onboarding",
              resources: [
                {
                  name: "Program Guide",
                  link: "/resources/sek-catalyst-guide",
                },
                {
                  name: "Workshop Schedule",
                  link: "/resources/sek-catalyst-schedule",
                },
                { name: "KU Resources", link: "/resources/ku-resources" },
                { name: "Mentor Matching", link: "/resources/mentor-matching" },
              ],
              upcomingSessions: [
                {
                  date: "September 5, 2025",
                  time: "6:00 PM",
                  topic: "Program Kickoff & Orientation",
                  mentor: "Jody Program",
                  link: "/zoom/sek-catalyst",
                },
                {
                  date: "September 12, 2025",
                  time: "6:00 PM",
                  topic: "Business Planning Workshop",
                  mentor: "Tom Anderson",
                  link: "/zoom/sek-catalyst-workshop",
                },
              ],
              contactEmail: "catalyst@ruralcommunitypartners.org",
              contactPhone: "(620) 555-0105",
            },
          ],
        }),
    );
    setPrograms(programData.programs || []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold">
              Welcome back, {profile?.name?.split(" ")[0] || "Entrepreneur"}! 🚀
            </h2>
            <p className="text-emerald-100 mt-2">
              Your entrepreneurial journey is making progress
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Active Programs</p>
                <p className="text-2xl font-bold">{programs.length}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-sm opacity-90">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {programs.length > 0
                    ? Math.round(
                        programs.reduce(
                          (acc: number, p: any) => acc + p.progress,
                          0,
                        ) / programs.length,
                      )
                    : 0}
                  %
                </p>
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
          {/* Goals Card */}
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

          {/* Feedback Card */}
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

          {/* Mentee Dashboard Link - Only for Mentees */}
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

        {/* Active Programs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              📋 Your Active Programs
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Programs you're enrolled in
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {programs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No programs yet</p>
                <p className="text-xs mt-1">Browse programs to get started</p>
              </div>
            ) : (
              programs.map((program: any) => (
                <div
                  key={program.id}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">
                            {program.name}
                          </p>
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
                          {/* SEK Catalyst Badge */}
                          {program.name === "SEK Catalyst: Empowered by KU" && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              KU Partner
                            </span>
                          )}
                          {/* Jody's Program Badge */}
                          {program.name ===
                            "Business Professional Services" && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                              👩‍💼 Jody's Program
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Started {program.startDate}
                            </span>
                          </div>
                        </div>
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
                        {program.nextMilestone && (
                          <p className="text-xs text-gray-500 mt-1">
                            📌 Next: {program.nextMilestone}
                          </p>
                        )}
                        {/* Show Jody's contact for Business Professional Services */}
                        {program.name === "Business Professional Services" && (
                          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                            <p className="text-xs text-amber-700 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Contact Jody for assistance:{" "}
                              <a
                                href="mailto:jody@hbcat.org"
                                className="font-medium hover:underline"
                              >
                                jody@hbcat.org
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 transition-all">
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

              if (!meetingId || meetingId.trim() === "") {
                alert("Please enter your Zoom Meeting ID");
                return;
              }

              const cleanMeetingId = meetingId.trim().replace(/\s/g, "");
              let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
              if (password && password.trim() !== "") {
                zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
              }

              window.open(zoomUrl, "_blank");
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Video className="h-4 w-4" />
            Join Zoom Meeting
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            💡 Tip: Your session host should provide the Meeting ID and passcode
          </p>
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
