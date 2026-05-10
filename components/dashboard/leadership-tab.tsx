"use client";

import { useState } from "react";
import { KPICard } from "./kpi-card";
import {
  Users,
  CalendarDays,
  ClipboardList,
  Award,
  Trophy,
  Trash2,
  TrendingUp,
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
}

export function LeadershipTab({
  profileName,
  profileEmail,
  onOpenSignup,
  isSignupOpen,
  onCloseSignup,
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

  // Signups and Resources state
  const [totalMembers] = useState(24);
  const [newSignups] = useState(8);

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
  };

  const deleteActionItem = (index: number) => {
    setActionItems((prev) => prev.filter((_, i) => i !== index));
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
    { name: "Roundtable Charter", icon: "📋" },
    { name: "Meeting Minutes Archive", icon: "📝" },
    { name: "Annual Impact Report", icon: "📊" },
    { name: "Strategic Plan 2026", icon: "🎯" },
  ];

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

      {/* PROMINENT JOIN CTA AT TOP */}
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
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg text-sm"
            >
              Apply to Join →
            </button>
            <button
              onClick={() =>
                alert(
                  `The Leadership Roundtable is where leaders across Southeast Kansas come together to take on adaptive challenges. By combining the Business Model Canvas with Kansas Leadership Center principles, we're aligning strategy, building leadership capacity, and creating real momentum across communities.`,
                )
              }
              className="px-6 py-3 bg-emerald-500/30 text-white font-medium rounded-xl hover:bg-emerald-500/40 transition-all text-sm border border-white/20"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* SIGNUPS STATS ROW - New */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KPICard
          title="Total Members"
          value={totalMembers}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
          subtitle="active members"
        />
        <KPICard
          title="New Signups"
          value={newSignups}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          subtitle="this month"
        />
        <KPICard
          title="Avg. Attendance"
          value="87%"
          icon={CalendarDays}
          trend={{ value: 5, isPositive: true }}
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
          value="96%"
          icon={Award}
          trend={{ value: 2, isPositive: true }}
          subtitle="positive rating"
        />
      </div>

      {/* RESOURCES INVESTED SECTION - New */}
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
                $124,500
              </div>
              <div className="text-xs text-gray-500 mt-1">Grant Funding</div>
              <div className="text-[10px] text-gray-400 mt-0.5">FY 2026</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">312</div>
              <div className="text-xs text-gray-500 mt-1">Mentor Hours</div>
              <div className="text-[10px] text-gray-400 mt-0.5">YTD</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">8</div>
              <div className="text-xs text-gray-500 mt-1">Staff Members</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Dedicated</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">$18,200</div>
              <div className="text-xs text-gray-500 mt-1">In-Kind Support</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                Venue + Materials
              </div>
            </div>
          </div>

          {/* Budget Utilization Bar */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Budget Utilization</span>
              <span className="text-gray-900 font-medium">68%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{ width: "68%" }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Personnel:</span>
                <span className="font-medium">$45,200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Programming:</span>
                <span className="font-medium">$32,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Operations:</span>
                <span className="font-medium">$28,300</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Marketing:</span>
                <span className="font-medium">$18,500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Meeting */}
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
                  May 15, 2026
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                <div className="bg-gray-50 rounded-lg p-3 text-center min-w-[80px]">
                  <div className="text-2xl font-bold text-emerald-600">15</div>
                  <div className="text-xs text-gray-500">May</div>
                  <div className="text-xs text-gray-400">2:00 PM</div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Q2 Strategy & Impact Review
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Join us to review Q1 outcomes, discuss Q2 initiatives, and
                    share best practices across programs.
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex -space-x-2">
                      {["MC", "LT", "DP", "JL"].map((init, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
                        >
                          {init}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      +12 confirmed attendees
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    alert("Meeting link will be available on May 15, 2026")
                  }
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Join Meeting
                </button>
              </div>
            </div>
          </div>

          {/* Action Items */}
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
                onClick={() => {
                  const newTask = prompt("Enter new action item:");
                  if (newTask) addActionItem(newTask);
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                + Add Action Item
              </button>
            </div>
          </div>

          {/* Past Meetings */}
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
                    onClick={() => alert(`Viewing notes for: ${meeting.title}`)}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    {meeting.notes ? "View Notes" : "Minutes"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Member Spotlight */}
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

          {/* Core Members */}
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
                onClick={() => alert("Full member directory coming soon!")}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All Members →
              </button>
            </div>
          </div>

          {/* Resources */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Resources
            </h2>
            <div className="space-y-2">
              {resources.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => alert(`Opening: ${res.name}`)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="text-lg">{res.icon}</span>
                  <span className="text-sm text-gray-700">{res.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
