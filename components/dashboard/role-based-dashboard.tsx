"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  User,
  Users,
  Handshake,
  Shield,
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle,
  TrendingUp,
  BookOpen,
  MessageCircle,
  FileText,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  roles: string[];
  primaryRole: string;
  userTypes: string[];
  phone?: string;
  organization?: string;
  position?: string;
  selectedPrograms: string[];
  createdAt: string;
}

// Program-specific content
const PROGRAM_CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    resources: string[];
    milestones: string[];
    nextSteps: string[];
  }
> = {
  "RCP Small Business Mentorship": {
    title: "Small Business Mentorship",
    description:
      "Connect with experienced local mentors for one-on-one guidance",
    resources: [
      "Mentor Directory",
      "Business Planning Templates",
      "Application Support",
    ],
    milestones: [
      "Complete Intake",
      "Meet Your Mentor",
      "First Session Completed",
      "Midpoint Review",
      "Program Completion",
    ],
    nextSteps: [
      "Complete your business profile",
      "Schedule your first mentor meeting",
      "Review mentorship goals",
    ],
  },
  "SEED Micro-Grant": {
    title: "SEED Micro-Grant Program",
    description:
      "10-week SEK Catalyst cohort with mentorship and grant opportunities",
    resources: [
      "Cohort Calendar",
      "Grant Application Guide",
      "Weekly Session Materials",
    ],
    milestones: [
      "Application Submitted",
      "Accepted to Cohort",
      "Week 1-10 Progress",
      "Final Pitch",
      "Grant Awarded",
    ],
    nextSteps: [
      "Complete cohort application",
      "Prepare your business pitch",
      "Review grant requirements",
    ],
  },
  "Business Technical Assistance": {
    title: "Business Technical Assistance",
    description: "Financial modeling, startup support, and capital connection",
    resources: [
      "Financial Templates",
      "Capital Readiness Guide",
      "Business Plan Template",
    ],
    milestones: [
      "Initial Consultation",
      "Financial Analysis Complete",
      "Capital Connection Made",
      "Business Expansion",
    ],
    nextSteps: [
      "Schedule technical assistance call",
      "Prepare your financial questions",
      "Review capital options",
    ],
  },
  "Microloan Program": {
    title: "Microloan Program",
    description: "Access to capital for rural businesses",
    resources: [
      "Loan Application",
      "Eligibility Requirements",
      "Financial Documentation Guide",
    ],
    milestones: [
      "Application Submitted",
      "Underwriting Complete",
      "Loan Approved",
      "Funds Disbursed",
    ],
    nextSteps: [
      "Check loan eligibility",
      "Prepare financial documents",
      "Complete application",
    ],
  },
  LHEATs: {
    title: "Local Health Equity Action Teams",
    description:
      "Community-led coalitions addressing health and economic priorities",
    resources: [
      "Meeting Schedule",
      "Community Assessment Tools",
      "Project Templates",
    ],
    milestones: [
      "Joined Coalition",
      "Attended First Meeting",
      "Project Initiated",
      "Community Impact",
    ],
    nextSteps: [
      "Review upcoming meetings",
      "Connect with coalition leads",
      "Share community priorities",
    ],
  },
  "Coalition Leadership Roundtable": {
    title: "Coalition Leadership Roundtable",
    description: "Regional leadership group aligning strategy across counties",
    resources: ["Strategic Plan", "Resource Sharing Guide", "Meeting Minutes"],
    milestones: [
      "Leadership Orientation",
      "Strategy Session",
      "Regional Initiative Launched",
    ],
    nextSteps: [
      "Review strategic priorities",
      "Connect with regional leads",
      "Share resources",
    ],
  },
  "Workforce Development": {
    title: "Workforce Development & Navigation",
    description: "Connecting residents to training, jobs, and career pathways",
    resources: ["Training Directory", "Job Board", "Career Assessment Tools"],
    milestones: [
      "Initial Assessment",
      "Training Enrolled",
      "Job Placement",
      "Career Advancement",
    ],
    nextSteps: [
      "Complete career assessment",
      "Explore training options",
      "Connect with workforce navigator",
    ],
  },
  "Parker Dewey Internships": {
    title: "Parker Dewey Micro-Internships",
    description: "Short-term, paid student projects for your business",
    resources: ["Project Template", "Student Directory", "Internship Guide"],
    milestones: [
      "Project Posted",
      "Student Matched",
      "Internship Completed",
      "Project Delivered",
    ],
    nextSteps: [
      "Post your first project",
      "Review student applications",
      "Define project scope",
    ],
  },
  "MAZK Initiative": {
    title: "MAZK Initiative",
    description: "Regional strategy around advanced and bio-based materials",
    resources: [
      "Industry Reports",
      "Partner Directory",
      "Funding Opportunities",
    ],
    milestones: [
      "Initial Engagement",
      "Partner Connection",
      "Project Initiated",
    ],
    nextSteps: [
      "Review industry reports",
      "Connect with partners",
      "Explore funding options",
    ],
  },
  "Rural Connect Magazine": {
    title: "Rural Connect Magazine",
    description:
      "Regional publication highlighting entrepreneurs and community progress",
    resources: ["Submission Guidelines", "Past Issues", "Distribution Map"],
    milestones: ["Story Pitched", "Interview Completed", "Story Published"],
    nextSteps: [
      "Submit your story idea",
      "Share community achievements",
      "Nominate local businesses",
    ],
  },
};

// Entrepreneur-specific dashboard
function EntrepreneurDashboard({ profile }: { profile: UserProfile }) {
  const [activeProgram, setActiveProgram] = useState(
    profile.selectedPrograms[0] || "",
  );
  const programContent = PROGRAM_CONTENT[activeProgram];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome back, {profile.name.split(" ")[0]}! 👋
        </h2>
        <p className="text-emerald-100 mt-1">
          Your entrepreneurial journey is progressing
        </p>
        <div className="mt-4 flex gap-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm">Active Programs</p>
            <p className="text-2xl font-bold">
              {profile.selectedPrograms.length}
            </p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-sm">Member Since</p>
            <p className="text-lg font-bold">
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Program Selector */}
      {profile.selectedPrograms.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Switch Program View
          </label>
          <div className="flex flex-wrap gap-2">
            {profile.selectedPrograms.map((program) => (
              <button
                key={program}
                onClick={() => setActiveProgram(program)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeProgram === program
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {program}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Program Dashboard */}
      {programContent && (
        <>
          {/* Program Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {programContent.title}
            </h3>
            <p className="text-gray-500 mt-1">{programContent.description}</p>
          </div>

          {/* Progress Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Milestones */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Your Milestones</h3>
              </div>
              <div className="space-y-3">
                {programContent.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        idx === 0
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {idx === 0 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${idx === 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}
                    >
                      {milestone}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900">Next Steps</h3>
              </div>
              <div className="space-y-3">
                {programContent.nextSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">
                Available Resources
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {programContent.resources.map((resource, idx) => (
                <button
                  key={idx}
                  className="text-left p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors group"
                >
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-600">
                    {resource}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click to access →
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Support Section */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-800">Need help?</h3>
            <p className="text-sm text-amber-700">
              Contact your program coordinator or schedule a support call
            </p>
          </div>
          <button className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">
            Get Support
          </button>
        </div>
      </div>
    </div>
  );
}

// Mentor-specific dashboard
function MentorDashboard({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          Welcome, Mentor {profile.name.split(" ")[0]}! 👨‍🏫
        </h2>
        <p className="text-blue-100 mt-1">Your guidance makes a difference</p>
        <div className="mt-4 grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm">Active Mentees</p>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm">Hours This Month</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Mentees</h3>
          <div className="space-y-3">
            {["Sarah Johnson", "Michael Martinez", "Emily Brown"].map(
              (mentee, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{mentee}</p>
                    <p className="text-xs text-gray-500">
                      Business Catalyst Program
                    </p>
                  </div>
                  <button className="px-3 py-1 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    Log Session
                  </button>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Upcoming Sessions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Sarah Johnson</p>
                <p className="text-xs text-gray-500">
                  Today, 2:00 PM - Business Plan Review
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Michael Martinez</p>
                <p className="text-xs text-gray-500">
                  Tomorrow, 11:00 AM - Marketing Strategy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Session Logging</h3>
        <p className="text-sm text-gray-500 mb-4">
          Track your mentoring hours for payment ($50/hr)
        </p>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          + Log New Session
        </button>
      </div>
    </div>
  );
}

// Coalition Participant dashboard
function CoalitionDashboard({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome, Coalition Member!</h2>
        <p className="text-purple-100 mt-1">
          Working together for stronger communities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Upcoming Meetings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">LHEAT Coalition Meeting</p>
                <p className="text-xs text-gray-500">
                  June 15, 2026 - 10:00 AM
                </p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Virtual
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Leadership Roundtable</p>
                <p className="text-xs text-gray-500">June 22, 2026 - 1:00 PM</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                In Person
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Active Initiatives
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Food Access Program</span>
              <span className="text-xs text-emerald-600">In Progress</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Childcare Coalition</span>
              <span className="text-xs text-emerald-600">Planning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Partner Organization dashboard
function PartnerDashboard({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          {profile.organization || "Partner Organization"}
        </h2>
        <p className="text-orange-100 mt-1">
          Collaborating for community impact
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Active Collaborations
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">Workforce Development Partnership</p>
              <p className="text-xs text-gray-500">3 active referrals</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">Internship Host Partner</p>
              <p className="text-xs text-gray-500">2 internships posted</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Resources Shared</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Training Materials</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Available
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Facility Access</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that renders the correct dashboard based on user role
export default function RoleBasedDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const savedProfile = localStorage.getItem(`profile_${currentUser}`);
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      // Fallback profile
      setProfile({
        name: "User",
        email: currentUser,
        roles: ["entrepreneur"],
        primaryRole: "entrepreneur",
        userTypes: ["entrepreneur"],
        selectedPrograms: ["RCP Small Business Mentorship"],
        createdAt: new Date().toISOString(),
      });
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Determine which dashboard to show based on user's primary role
  const primaryRole =
    profile.primaryRole || profile.userTypes?.[0] || "entrepreneur";

  // Render the appropriate dashboard
  switch (primaryRole) {
    case "mentor":
      return <MentorDashboard profile={profile} />;
    case "coalition":
      return <CoalitionDashboard profile={profile} />;
    case "partner":
      return <PartnerDashboard profile={profile} />;
    case "staff":
    case "admin":
      // Admin sees the full dashboard (you can keep your existing dashboard)
      // For now, redirect to the main page which has the full dashboard
      return (
        <div className="p-8">
          <div className="bg-yellow-50 rounded-xl p-6 text-center">
            <p className="text-yellow-700">Admin dashboard with full access</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg"
            >
              Go to Full Dashboard
            </button>
          </div>
        </div>
      );
    default:
      return <EntrepreneurDashboard profile={profile} />;
  }
}
