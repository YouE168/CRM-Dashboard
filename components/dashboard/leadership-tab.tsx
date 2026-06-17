"use client";

import { useState, useEffect } from "react";
import { KPICard } from "./kpi-card";
import { AddActionModal } from "@/components/ui/add-action-modal";
import { loadCMSData } from "@/lib/cms-data";
import {
  Users,
  CalendarDays,
  ClipboardList,
  Award,
  Trophy,
  Trash2,
  TrendingUp,
  X,
  BookOpen,
  Target,
  Lightbulb,
  MessageCircle,
  ArrowRight,
  Video,
  Copy,
  Plus,
} from "lucide-react";

interface ActionItemType {
  task: string;
  assignee: string;
  due: string;
  status: "pending" | "in-progress" | "completed" | "not-started";
}

interface LeadershipTabProps {
  profileName: string;
  profileEmail: string;
  onOpenSignup: () => void;
  isSignupOpen: boolean;
  onCloseSignup: () => void;
  showToast: (
    message: string,
    type: "success" | "error" | "info" | "warning",
    duration?: number,
  ) => void;
}

// Learn More Modal Component
function LearnMoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              About the Leadership Roundtable
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5">
            <p className="text-gray-700 leading-relaxed">
              Leadership Roundtable is a regional learning and action space for
              coalition leaders, community partners, and local changemakers
              across Southeast Kansas.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              The Purpose
            </h3>
            <p className="text-gray-600 leading-relaxed">
              To help local leaders strengthen their coalitions, better
              understand community needs, share what is working, and solve
              barriers together across county lines.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
              Key Questions Explored
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700">👥 Who are we serving?</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700">
                  📊 What are the real needs and barriers?
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700">
                  🤝 How do we build trust and engagement?
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700">
                  🔧 What resources, partners, and strategies are needed?
                </p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Who Should Attend
            </h3>
            <p className="text-gray-600 leading-relaxed">
              The roundtable is designed for people leading or supporting
              community coalitions, health equity teams, nonprofit initiatives,
              economic mobility efforts, and other local change work.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              What to Expect
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </div>
                <span className="text-gray-600">
                  Monthly learning and discussion sessions
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </div>
                <span className="text-gray-600">
                  Peer problem-solving with leaders from other counties
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </div>
                <span className="text-gray-600">
                  Practical tools for coalition planning and strategy
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </div>
                <span className="text-gray-600">
                  Space to share barriers, lessons learned, and community wins
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                  ✓
                </div>
                <span className="text-gray-600">
                  Support connecting local work to regional opportunities
                </span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Each session blends practical tools like the Business Model Canvas
              with adaptive leadership concepts from the Kansas Leadership
              Center.
            </p>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeadershipTab({
  profileName,
  profileEmail,
  onOpenSignup,
  isSignupOpen,
  onCloseSignup,
  showToast,
}: LeadershipTabProps) {
  const [actionItems, setActionItems] = useState<ActionItemType[]>([
    {
      task: "Finalize Q2 program budgets",
      assignee: "Michael Chen",
      due: "May 10",
      status: "in-progress",
    },
    {
      task: "Recruit 5 new mentors for Youth program",
      assignee: "Lisa Thompson",
      due: "May 15",
      status: "pending",
    },
    {
      task: "Prepare Q1 impact report for board",
      assignee: "Admin User",
      due: "May 20",
      status: "not-started",
    },
    {
      task: "Coordinate cross-program workshop",
      assignee: "David Park",
      due: "May 8",
      status: "completed",
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [cmsData, setCmsData] = useState(loadCMSData());
  const [showLearnMore, setShowLearnMore] = useState(false);

  useEffect(() => {
    setCmsData(loadCMSData());
  }, []);

  const toggleActionItemStatus = (index: number) => {
    setActionItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newStatus =
            item.status === "completed" ? "pending" : "completed";
          return { ...item, status: newStatus };
        }
        return item;
      }),
    );
    showToast(
      actionItems[index].status === "completed"
        ? "Task marked as incomplete"
        : "Task marked as complete!",
      "success",
    );
  };

  const deleteActionItem = (index: number) => {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
    showToast("Action item deleted", "info");
  };

  const addActionItem = (task: string) => {
    const newItem: ActionItemType = {
      task: task,
      assignee: profileName,
      due: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      status: "pending",
    };
    setActionItems((prev) => [...prev, newItem]);
    showToast(`✅ Action item added: "${task}"`, "success");
  };

  const pastMeetings = [
    {
      date: "Apr 17, 2026",
      title: "Q1 Impact Review & Planning",
      attendees: 18,
      notes: true,
    },
    {
      date: "Mar 20, 2026",
      title: "Mentor Program Expansion",
      attendees: 15,
      notes: true,
    },
    {
      date: "Feb 19, 2026",
      title: "Funding & Sustainability",
      attendees: 22,
      notes: false,
    },
  ];

  const coreMembers = [
    { name: "Michael Chen", role: "Lead Mentor", active: true },
    { name: "Lisa Thompson", role: "Youth Director", active: true },
    { name: "David Park", role: "Entrepreneurship Lead", active: true },
    { name: "Jennifer Lee", role: "Veterans Affairs", active: false },
  ];

  const resources = [
    {
      name: "Roundtable Charter",
      icon: "📋",
      description: "Leadership Roundtable governing document",
    },
    {
      name: "Meeting Minutes Archive",
      icon: "📝",
      description: "Past meeting notes and summaries",
    },
    {
      name: "Annual Impact Report",
      icon: "📊",
      description: "Yearly performance and outcomes report",
    },
    {
      name: "Strategic Plan 2026",
      icon: "🎯",
      description: "Annual goals and strategic initiatives",
    },
  ];

  // Get meeting data from CMS
  const meeting = cmsData.leadership?.nextMeeting || {
    date: "May 15, 2026",
    day: 15,
    month: "May",
    time: "2:00 PM",
    title: "Q2 Strategy & Impact Review",
    description:
      "Join us to review Q1 outcomes, discuss Q2 initiatives, and share best practices across programs.",
    attendees: 12,
    zoomPlaceholder: "123 456 7890",
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Leadership Roundtable
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monthly leadership gatherings for program directors and key
          stakeholders
        </p>
      </div>

      {/* JOIN CTA */}
      <div className="mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 md:py-6 md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Open for Applications
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Join the Leadership Roundtable
            </h2>
            <p className="text-emerald-100 mt-1 max-w-md">
              Program leaders, key stakeholders, and community champions — your
              voice matters.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-emerald-100">
              <span className="flex items-center gap-1">
                ✓ Monthly meetings
              </span>
              <span className="flex items-center gap-1">✓ Peer networking</span>
              <span className="flex items-center gap-1">✓ Strategic input</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenSignup}
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md text-sm"
            >
              Apply to Join →
            </button>
            <button
              onClick={() => setShowLearnMore(true)}
              className="px-6 py-3 bg-emerald-500/30 text-white font-medium rounded-xl hover:bg-emerald-500/40 transition-all text-sm border border-white/20 flex items-center gap-2"
            >
              Learn More <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KPICard
          title="Total Members"
          value={cmsData.leadership.totalMembers}
          icon={Users}
          trend={{ value: cmsData.leadership.membersTrend, isPositive: true }}
          subtitle="active members"
        />
        <KPICard
          title="New Signups"
          value={cmsData.leadership.newSignups}
          icon={Users}
          trend={{ value: cmsData.leadership.signupsTrend, isPositive: true }}
          subtitle="this month"
        />
        <KPICard
          title="Avg. Attendance"
          value={`${cmsData.leadership.avgAttendance}%`}
          icon={CalendarDays}
          trend={{
            value: cmsData.leadership.attendanceTrend,
            isPositive: true,
          }}
          subtitle="per session"
        />
        <KPICard
          title="Action Items"
          value={
            actionItems.filter((item) => item.status !== "completed").length
          }
          icon={ClipboardList}
          subtitle="in progress"
          variant="warning"
        />
        <KPICard
          title="Member Satisfaction"
          value={`${cmsData.leadership.memberSatisfaction}%`}
          icon={Award}
          trend={{
            value: cmsData.leadership.satisfactionTrend,
            isPositive: true,
          }}
          subtitle="positive rating"
        />
      </div>

      {/* RESOURCES INVESTED */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Resources Invested
            </h2>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                ${cmsData.leadership.grantFunding.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">Grant Funding</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {cmsData.leadership.mentorHours}
              </div>
              <div className="text-xs text-gray-500 mt-1">Mentor Hours</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {cmsData.leadership.staffMembers}
              </div>
              <div className="text-xs text-gray-500 mt-1">Staff Members</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                ${cmsData.leadership.inKindSupport.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">In-Kind Support</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Budget Utilization</span>
              <span className="text-gray-900 font-medium">
                {cmsData.leadership.budgetUtilization}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{ width: `${cmsData.leadership.budgetUtilization}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Personnel:</span>
                <span className="font-medium">
                  ${cmsData.leadership.personnelCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Programming:</span>
                <span className="font-medium">
                  ${cmsData.leadership.programmingCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Operations:</span>
                <span className="font-medium">
                  ${cmsData.leadership.operationsCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Marketing:</span>
                <span className="font-medium">
                  ${cmsData.leadership.marketingCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* NEXT MEETING - READ FROM CMS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Next Roundtable Meeting
                  </h2>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                  {meeting.date}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-3 text-center min-w-[100px] shadow-sm">
                    <div className="text-2xl font-bold text-emerald-700">
                      {meeting.day}
                    </div>
                    <div className="text-xs font-medium text-gray-600">
                      {meeting.month}
                    </div>
                    <div className="text-xs text-gray-500">{meeting.time}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {meeting.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {meeting.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex -space-x-2">
                        {["MC", "LT", "DP", "JL"].map((init, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm"
                          >
                            {init}
                          </div>
                        ))}
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                          +{meeting.attendees}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        confirmed attendees
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Join via Zoom
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            meeting.zoomPlaceholder,
                          );
                          showToast(
                            "Meeting ID copied to clipboard!",
                            "success",
                          );
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy ID
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        id="leadershipZoomId"
                        placeholder={`Zoom Meeting ID (e.g., ${meeting.zoomPlaceholder})`}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        id="leadershipZoomPassword"
                        placeholder="Passcode (if required)"
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const meetingId = (
                          document.getElementById(
                            "leadershipZoomId",
                          ) as HTMLInputElement
                        )?.value;
                        const password = (
                          document.getElementById(
                            "leadershipZoomPassword",
                          ) as HTMLInputElement
                        )?.value;
                        if (!meetingId || meetingId.trim() === "") {
                          showToast("Please enter the Zoom Meeting ID", "info");
                          return;
                        }
                        const cleanMeetingId = meetingId
                          .trim()
                          .replace(/\s/g, "");
                        let zoomUrl = `https://zoom.us/j/${cleanMeetingId}`;
                        if (password && password.trim() !== "")
                          zoomUrl += `?pwd=${encodeURIComponent(password.trim())}`;
                        window.open(zoomUrl, "_blank");
                      }}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Video className="h-4 w-4" />
                      Join Zoom Meeting
                    </button>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-500">
                        💡 The meeting ID will be sent via email
                      </p>
                      <button
                        onClick={() => {
                          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(meeting.title)}&dates=20260515T140000/20260515T153000&details=${encodeURIComponent(meeting.description)}`;
                          window.open(calendarUrl, "_blank");
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <CalendarDays className="h-3 w-3" />
                        Add to Calendar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION ITEMS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Action Items
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between group hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.status === "completed"}
                      onChange={() => toggleActionItemStatus(idx)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 cursor-pointer"
                    />
                    <div>
                      <p
                        className={`text-sm ${item.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}
                      >
                        {item.task}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.assignee} · Due {item.due}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteActionItem(idx)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <span className="text-lg">+</span> Add Action Item
              </button>
            </div>
          </div>

          {/* PAST MEETINGS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Past Meetings
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pastMeetings.map((meeting, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {meeting.date.split(",")[0]}
                      </div>
                      <div className="text-xs text-gray-400">
                        {meeting.date.split(",")[1]?.trim()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {meeting.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {meeting.attendees} attendees
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      showToast(
                        `📄 ${meeting.title}\n\nMeeting minutes available. Contact coordinator for access.`,
                        "info",
                      )
                    }
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    {meeting.notes ? "View Notes" : "Minutes"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600">
                Member Spotlight
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-lg font-bold">
                MC
              </div>
              <div>
                <p className="font-semibold text-gray-900">Michael Chen</p>
                <p className="text-xs text-gray-500">
                  Business Catalyst Lead Mentor
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              "Michael has been instrumental in launching 8 new businesses this
              quarter through one-on-one mentorship."
            </p>
            <div className="mt-3 text-xs text-emerald-600">
              🏆 Mentor of the Month
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Core Members
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {coreMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  {member.active && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={() =>
                  showToast("Full member directory coming soon!", "info")
                }
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All Members →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Resources
            </h2>
            <div className="space-y-2">
              {resources.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    showToast(
                      `📁 ${res.name}\n\n${res.description}\n\nThis resource will be available for download soon.`,
                      "info",
                    )
                  }
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <span className="text-lg">{res.icon}</span>
                  <div className="flex-1">
                    <span className="text-sm text-gray-700">{res.name}</span>
                    <p className="text-xs text-gray-400">{res.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddActionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addActionItem}
      />
      {showLearnMore && (
        <LearnMoreModal onClose={() => setShowLearnMore(false)} />
      )}
    </>
  );
}
