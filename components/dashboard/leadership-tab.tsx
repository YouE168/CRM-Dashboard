"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "./kpi-card";
import { AddActionModal } from "@/components/ui/add-action-modal";
import {
  getNextMeeting,
  updateNextMeeting,
  getActionItems,
  addActionItemRow,
  updateActionItemStatus,
  deleteActionItemRow,
  getRoundtableApplications,
  updateRoundtableApplicationStatus,
  subscribeToLeadershipChanges,
  type NextMeetingInfo,
  type ActionItemRow,
  type RoundtableApplicationRow,
} from "@/lib/supabase/dashboard-data";
import {
  Users,
  CalendarDays,
  ClipboardList,
  Trash2,
  X,
  BookOpen,
  Target,
  Lightbulb,
  MessageCircle,
  ArrowRight,
  Video,
  Copy,
  Check,
  XCircle,
  Mail,
  UserCheck,
  Pencil,
} from "lucide-react";

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

// ============================================================
// NOTE: This tab used to show a bunch of hardcoded/fake content -
// Total Members, Avg Attendance, Member Satisfaction, and a whole
// "Resources Invested" section pulled from a static snapshot table
// with no real data behind it, plus a hardcoded Past Meetings list,
// Member Spotlight, and Core Members block that were just literal
// values in the JSX. All of that has been removed. What's left:
// - Action Items: real, Supabase-backed (leadership_action_items)
// - Next Meeting: a single real, admin-editable announcement row
//   (leadership_stats.next_meeting) - not a fabricated metric
// - Roundtable Applications / Members: real, backed by the new
//   leadership_roundtable_applications table. "Apply to Join" now
//   actually saves something (it didn't before - it only flipped a
//   local boolean). Total Members below = applications approved here.
// ============================================================

// Learn More Modal Component - also reused by the "Join the Leadership
// Roundtable" card shown on mentee/entrepreneur/mentor/partner/coalition
// dashboards (see roundtable-join-card.tsx).
export function LearnMoreModal({ onClose }: { onClose: () => void }) {
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
              <BookOpen className="h-5 w-5 text-emerald-600" />
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

// Edit Next Meeting Modal - the only way to change this used to be
// running SQL directly against Supabase.
function EditMeetingModal({
  initial,
  onClose,
  onSave,
}: {
  initial: NextMeetingInfo;
  onClose: () => void;
  onSave: (meeting: NextMeetingInfo) => Promise<void>;
}) {
  const [form, setForm] = useState<NextMeetingInfo>(initial);
  const [saving, setSaving] = useState(false);

  const field = (
    label: string,
    key: keyof NextMeetingInfo,
    type: "text" | "number" = "text",
    placeholder?: string,
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={(form[key] as string | number | undefined) ?? ""}
        onChange={(e) =>
          setForm((p) => ({
            ...p,
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          }))
        }
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Next Meeting
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {field("Title", "title", "text", "e.g. Q3 Strategy & Impact Review")}
          <div className="grid grid-cols-2 gap-3">
            {field("Date label", "date", "text", "e.g. Aug 6, 2026")}
            {field("Time", "time", "text", "e.g. 2:00 PM")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Day of month", "day", "number", "e.g. 6")}
            {field("Month label", "month", "text", "e.g. Aug")}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              placeholder="What's this meeting about?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>
          {field(
            "Zoom Meeting ID",
            "zoomPlaceholder",
            "text",
            "e.g. 123 456 7890",
          )}
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(form);
                onClose();
              } finally {
                setSaving(false);
              }
            }}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
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
  const [nextMeeting, setNextMeeting] = useState<NextMeetingInfo | null>(null);
  const [actionItems, setActionItems] = useState<ActionItemRow[]>([]);
  const [applications, setApplications] = useState<RoundtableApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showEditMeeting, setShowEditMeeting] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [meetingData, itemsData, applicationsData] = await Promise.all([
        getNextMeeting(),
        getActionItems(),
        getRoundtableApplications(),
      ]);
      setNextMeeting(meetingData);
      setActionItems(itemsData);
      setApplications(applicationsData);
    } catch (err) {
      console.error("Failed to load leadership data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToLeadershipChanges(loadData);
    return unsubscribe;
  }, [loadData]);

  const toggleActionItemStatus = async (item: ActionItemRow) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      await updateActionItemStatus(item.id, newStatus);
      showToast(
        item.status === "completed"
          ? "Task marked as incomplete"
          : "Task marked as complete!",
        "success",
      );
    } catch (err) {
      console.error("Failed to update action item:", err);
    }
  };

  const deleteActionItem = async (id: string) => {
    try {
      await deleteActionItemRow(id);
      showToast("Action item deleted", "info");
    } catch (err) {
      console.error("Failed to delete action item:", err);
    }
  };

  const addActionItem = async (task: string) => {
    try {
      const due = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      await addActionItemRow(task, profileName, due);
      showToast(`✅ Action item added: "${task}"`, "success");
    } catch (err) {
      console.error("Failed to add action item:", err);
    }
  };

  const saveMeeting = async (meeting: NextMeetingInfo) => {
    try {
      await updateNextMeeting(meeting);
      await loadData();
      showToast("Next meeting updated", "success");
    } catch (err) {
      console.error("Failed to update next meeting:", err);
      showToast("Couldn't save the meeting details. Please try again.", "error");
      throw err;
    }
  };

  const reviewApplication = async (
    application: RoundtableApplicationRow,
    status: "approved" | "rejected",
  ) => {
    setReviewingId(application.id);
    try {
      await updateRoundtableApplicationStatus(application.id, status);
      await loadData();
      showToast(
        status === "approved"
          ? `${application.name} added to the roundtable`
          : `Application from ${application.name} declined`,
        "success",
      );
    } catch (err) {
      console.error("Failed to update application:", err);
      showToast("Couldn't update that application. Please try again.", "error");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Loading leadership roundtable…
      </div>
    );
  }

  const pendingApplications = applications.filter((a) => a.status === "pending");
  const approvedMembers = applications.filter((a) => a.status === "approved");

  const meeting = {
    date: nextMeeting?.date ?? "TBD",
    day: nextMeeting?.day ?? 0,
    month: nextMeeting?.month ?? "",
    time: nextMeeting?.time ?? "",
    title: nextMeeting?.title ?? "No meeting scheduled yet",
    description: nextMeeting?.description ?? "",
    zoomPlaceholder: nextMeeting?.zoomPlaceholder ?? "",
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

      {/* STATS ROW - real, derived from actual applications/action items */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <KPICard
          title="Total Members"
          value={approvedMembers.length}
          icon={Users}
          subtitle="approved applications"
        />
        <KPICard
          title="Pending Applications"
          value={pendingApplications.length}
          icon={ClipboardList}
          subtitle="awaiting review"
          variant={pendingApplications.length > 0 ? "warning" : undefined}
        />
        <KPICard
          title="Action Items"
          value={
            actionItems.filter((item) => item.status !== "completed").length
          }
          icon={ClipboardList}
          subtitle="in progress"
        />
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* NEXT MEETING */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Next Roundtable Meeting
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                    {meeting.date}
                  </span>
                  <button
                    onClick={() => setShowEditMeeting(true)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Edit meeting details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                  <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-3 text-center min-w-[100px] shadow-sm">
                    <div className="text-2xl font-bold text-emerald-700">
                      {meeting.day || "—"}
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
                    {meeting.description && (
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {meeting.description}
                      </p>
                    )}
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
                        placeholder={
                          meeting.zoomPlaceholder
                            ? `Zoom Meeting ID (e.g., ${meeting.zoomPlaceholder})`
                            : "Zoom Meeting ID"
                        }
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
                    <p className="text-xs text-gray-500 mt-3">
                      💡 The meeting ID will be sent via email
                    </p>
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
              {actionItems.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  No action items yet.
                </div>
              ) : (
                actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-5 py-3 flex items-center justify-between group hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.status === "completed"}
                        onChange={() => toggleActionItemStatus(item)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 cursor-pointer"
                      />
                      <div>
                        <p
                          className={`text-sm ${item.status === "completed" ? "text-gray-400 line-through" : "text-gray-700"}`}
                        >
                          {item.task}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.assignee} · Due {item.due_date}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteActionItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
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
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* PENDING APPLICATIONS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Pending Applications
              </h2>
              {pendingApplications.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {pendingApplications.length}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {pendingApplications.length === 0 ? (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">
                  No pending applications.
                </div>
              ) : (
                pendingApplications.map((app) => (
                  <div key={app.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {app.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {[app.organization, app.role, app.county]
                            .filter(Boolean)
                            .join(" · ") || app.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={reviewingId === app.id}
                          onClick={() => reviewApplication(app, "approved")}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          disabled={reviewingId === app.id}
                          onClick={() => reviewApplication(app, "rejected")}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50"
                          title="Decline"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {app.reason && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                        "{app.reason}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ROUNDTABLE MEMBERS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Roundtable Members
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {approvedMembers.length === 0 ? (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">
                  No members yet. Approve an application to add one.
                </div>
              ) : (
                approvedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="px-5 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {member.organization || member.role || "—"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => (window.location.href = `mailto:${member.email}`)}
                      className="text-gray-400 hover:text-emerald-600 shrink-0"
                      title={member.email}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
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
      {showEditMeeting && (
        <EditMeetingModal
          initial={nextMeeting ?? {}}
          onClose={() => setShowEditMeeting(false)}
          onSave={saveMeeting}
        />
      )}
    </>
  );
}
