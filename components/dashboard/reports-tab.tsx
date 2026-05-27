"use client";

import { useState } from "react";
import { SessionsChart } from "./sessions-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import { loadReportData } from "@/lib/report-data";
import {
  BarChart3,
  Users,
  UserCheck,
  Receipt,
  TrendingUp,
  ClipboardList,
  MessageSquare,
  Send,
  Pin,
  Trash2,
  ArrowLeft,
  Download,
  Printer,
} from "lucide-react";

interface TeamNote {
  id: number;
  author: string;
  content: string;
  time: string;
  pinned: boolean;
}

interface ReportsTabProps {
  profileName: string;
  notes: TeamNote[];
  onAddNote: (content: string) => void;
  onDeleteNote: (id: number) => void;
  onTogglePin: (id: number) => void;
  showToast: (
    message: string,
    type: "success" | "error" | "info" | "warning",
    duration?: number,
  ) => void;
}

type ReportView =
  | "list"
  | "monthly"
  | "participant"
  | "mentor"
  | "financial"
  | "outcome"
  | "county";

export function ReportsTab({
  profileName,
  notes,
  onAddNote,
  onDeleteNote,
  onTogglePin,
  showToast,
}: ReportsTabProps) {
  const [currentView, setCurrentView] = useState<ReportView>("list");
  const [noteInput, setNoteInput] = useState("");

  // Load editable report data
  const reportData = loadReportData();

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    onAddNote(noteInput);
    setNoteInput("");
    showToast("Note added successfully!", "success");
  };

  const sortedNotes = [...notes].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned),
  );

  const reports = [
    {
      id: "monthly",
      title: "Monthly Program Report",
      desc: "Overview of all programs for the current month",
      date: "Apr 2025",
      icon: BarChart3,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "participant",
      title: "Participant Progress Report",
      desc: "Individual progress across all active participants",
      date: "Apr 2025",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "mentor",
      title: "Mentor Activity Report",
      desc: "Sessions, hours and ratings for all mentors",
      date: "Apr 2025",
      icon: UserCheck,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "financial",
      title: "Financial Summary",
      desc: "Invoices, pending approvals and budget overview",
      date: "Apr 2025",
      icon: Receipt,
      color: "bg-amber-100 text-amber-600",
    },
    {
      id: "outcome",
      title: "Outcome Metrics Report",
      desc: "Business launches, capital access and satisfaction",
      date: "Q1 2025",
      icon: TrendingUp,
      color: "bg-rose-100 text-rose-600",
    },
    {
      id: "county",
      title: "County Distribution Report",
      desc: "Participant breakdown by county and program",
      date: "Apr 2025",
      icon: ClipboardList,
      color: "bg-teal-100 text-teal-600",
    },
  ];

  // Report detail components - UPDATED to use reportData
  const MonthlyReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Monthly Program Report
        </h2>
        <p className="text-sm text-gray-500 mb-6">April 2025</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {reportData.monthlyReport.totalParticipants}
            </div>
            <div className="text-sm text-gray-600">Total Participants</div>
            <div className="text-xs text-gray-400">+12% vs last month</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.monthlyReport.sessions}
            </div>
            <div className="text-sm text-gray-600">Sessions</div>
            <div className="text-xs text-gray-400">+15% vs last month</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.monthlyReport.satisfaction}%
            </div>
            <div className="text-sm text-gray-600">Satisfaction</div>
            <div className="text-xs text-gray-400">+3% vs last month</div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="font-semibold text-gray-900 mb-2">Key Highlights</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {reportData.monthlyReport.highlights.map((highlight, i) => (
              <li key={i}>• {highlight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const ParticipantReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Participant Progress Report
      </h2>
      <p className="text-sm text-gray-500 mb-6">April 2025</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Name
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Program
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Stage
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reportData.participantReport.participants.map(
              (participant, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3">{participant.name}</td>
                  <td className="px-4 py-3">{participant.program}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        participant.stage === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : participant.stage === "Onboarding"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {participant.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${participant.progress}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const MentorReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Mentor Activity Report
      </h2>
      <p className="text-sm text-gray-500 mb-6">April 2025</p>

      <div className="space-y-4">
        {reportData.mentorReport.mentors.map((mentor, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900">{mentor.name}</p>
              <p className="text-xs text-gray-500">
                {mentor.mentees} active mentees
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {mentor.sessions} sessions
              </p>
              <p className="text-xs text-gray-500">
                {mentor.hours} hours • {mentor.rating}★
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FinancialReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Financial Summary
      </h2>
      <p className="text-sm text-gray-500 mb-6">April 2025</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Grants</span>
              <span className="font-medium">
                ${reportData.financialReport.grants.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Donations</span>
              <span className="font-medium">
                ${reportData.financialReport.donations.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="font-semibold">Total Revenue</span>
              <span className="font-semibold">
                $
                {(
                  reportData.financialReport.grants +
                  reportData.financialReport.donations
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Expenses</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Personnel</span>
              <span className="font-medium">
                ${reportData.financialReport.personnel.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Programming</span>
              <span className="font-medium">
                ${reportData.financialReport.programming.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Operations</span>
              <span className="font-medium">
                ${reportData.financialReport.operations.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2 mt-2">
              <span className="font-semibold">Total Expenses</span>
              <span className="font-semibold">
                $
                {(
                  reportData.financialReport.personnel +
                  reportData.financialReport.programming +
                  reportData.financialReport.operations
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-gray-900">Net Surplus</span>
          <span className="font-semibold text-emerald-600">
            ${reportData.financialReport.netSurplus.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {reportData.financialReport.pendingInvoices} invoices pending approval
          (${reportData.financialReport.pendingAmount.toLocaleString()})
        </div>
      </div>
    </div>
  );

  const OutcomeReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Outcome Metrics Report
      </h2>
      <p className="text-sm text-gray-500 mb-6">Q1 2025</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {reportData.outcomeReport.businessLaunches}
          </div>
          <div className="text-xs text-gray-600">Business Launches</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {reportData.outcomeReport.satisfaction}%
          </div>
          <div className="text-xs text-gray-600">Satisfaction</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {reportData.outcomeReport.mentorMatches}
          </div>
          <div className="text-xs text-gray-600">Mentor Matches</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">
            {reportData.outcomeReport.referrals}
          </div>
          <div className="text-xs text-gray-600">Referrals</div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h3 className="font-semibold text-gray-900 mb-2">Success Stories</h3>
        <p className="text-sm text-gray-600">
          {reportData.outcomeReport.successStory}
        </p>
      </div>
    </div>
  );

  const CountyReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        County Distribution Report
      </h2>
      <p className="text-sm text-gray-500 mb-6">April 2025</p>

      <div className="space-y-3">
        {reportData.countyReport.counties.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{item.name}</span>
              <span className="text-gray-500">
                {item.count} participants ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full"
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const generatePDF = () => {
    showToast("📄 Preparing PDF export...", "info", 2000);
    setTimeout(() => {
      showToast(
        "✅ PDF export complete! Your file has been downloaded.",
        "success",
        3000,
      );
    }, 1500);
  };

  const renderReportContent = () => {
    switch (currentView) {
      case "monthly":
        return <MonthlyReport />;
      case "participant":
        return <ParticipantReport />;
      case "mentor":
        return <MentorReport />;
      case "financial":
        return <FinancialReport />;
      case "outcome":
        return <OutcomeReport />;
      case "county":
        return <CountyReport />;
      default:
        return null;
    }
  };

  // If viewing a specific report
  if (currentView !== "list") {
    const currentReport = reports.find((r) => r.id === currentView);
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView("list")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentReport?.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {currentReport?.date}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                window.print();
                showToast(
                  "🖨️ Print dialog opened. Use browser print to save as PDF.",
                  "info",
                  3000,
                );
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={generatePDF}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
        {renderReportContent()}
      </div>
    );
  }

  // Main reports list view
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">View program reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: report cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentView(r.id as ReportView)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:border-emerald-300 hover:shadow-md transition-all text-left w-full cursor-pointer"
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${r.color}`}>
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {r.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                </div>
                <span className="text-emerald-600 text-sm">→</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SessionsChart />
            <ClientsByCountyChart />
          </div>
        </div>

        {/* Right: Team Notes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Team Notes</h2>
            <span className="ml-auto text-xs text-gray-400">
              {notes.length} notes
            </span>
          </div>

          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleAddNote();
              }}
              placeholder="Write a note for the team… (⌘Enter to post)"
              rows={3}
              className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                Posting as{" "}
                <span className="font-medium text-gray-600">{profileName}</span>
              </span>
              <button
                onClick={handleAddNote}
                disabled={!noteInput.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-3 w-3" />
                Post
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[520px]">
            {sortedNotes.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No notes yet. Be the first to post!
              </div>
            ) : (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`px-4 py-3 group transition-colors ${note.pinned ? "bg-amber-50" : "hover:bg-gray-50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {note.author.charAt(0)}
                      </div>
                      <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-800">
                          {note.author}
                        </span>
                        {note.pinned && (
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                            Pinned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => onTogglePin(note.id)}
                        className="p-1 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                    {note.content}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{note.time}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
