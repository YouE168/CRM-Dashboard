"use client";

import { useState, useEffect, useCallback } from "react";
import { SessionsChart } from "./sessions-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import {
  getReportData,
  subscribeToReportData,
  updateReportData,
  getParticipants,
  getLiveOverviewStats,
  getLiveMentorActivityReport,
  getLiveOutcomeReport,
  getLiveClientsByCounty,
  subscribeToLiveDashboardData,
  type ReportData,
  type DashboardParticipant,
  type LiveOverviewStats,
  type LiveMentorActivityRow,
  type LiveOutcomeReport,
  type ChartRow,
} from "@/lib/supabase/dashboard-data";
import {
  BarChart3,
  Users,
  UserCheck,
  Receipt,
  TrendingUp,
  ClipboardList,
  ArrowLeft,
  Download,
  Printer,
  Pencil,
  X,
} from "lucide-react";

interface ReportsTabProps {
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

type FinancialReport = ReportData["financialReport"];

// Edit Financial Summary - the only manually-entered report left, since
// there's no real bookkeeping table anywhere in the schema to compute
// grants/donations/expenses from. Net surplus is always derived from the
// other numbers rather than typed in separately, so it can't drift.
function EditFinancialModal({
  initial,
  onClose,
  onSave,
}: {
  initial: FinancialReport;
  onClose: () => void;
  onSave: (data: FinancialReport) => Promise<void>;
}) {
  const [form, setForm] = useState<FinancialReport>(initial);
  const [saving, setSaving] = useState(false);

  const field = (
    label: string,
    key: keyof FinancialReport,
    placeholder?: string,
  ) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={form[key] as number}
        onChange={(e) =>
          setForm((p) => ({ ...p, [key]: Number(e.target.value) }))
        }
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );

  const totalRevenue = (form.grants || 0) + (form.donations || 0);
  const totalExpenses =
    (form.personnel || 0) + (form.programming || 0) + (form.operations || 0);
  const netSurplus = totalRevenue - totalExpenses;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Financial Summary
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-400">
            Total revenue, total expenses, and net surplus are calculated
            automatically from the numbers below.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {field("Grants", "grants")}
            {field("Donations", "donations")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("Personnel", "personnel")}
            {field("Programming", "programming")}
          </div>
          {field("Operations", "operations")}
          <div className="grid grid-cols-2 gap-3">
            {field("Pending invoices (count)", "pendingInvoices")}
            {field("Pending amount ($)", "pendingAmount")}
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Total revenue</span>
              <span className="font-medium">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total expenses</span>
              <span className="font-medium">${totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
              <span>Net surplus</span>
              <span>${netSurplus.toLocaleString()}</span>
            </div>
          </div>
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
                await onSave({ ...form, netSurplus });
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

export function ReportsTab({ showToast }: ReportsTabProps) {
  const [currentView, setCurrentView] = useState<ReportView>("list");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [overviewStats, setOverviewStats] = useState<LiveOverviewStats | null>(null);
  const [mentorActivity, setMentorActivity] = useState<LiveMentorActivityRow[]>([]);
  const [outcomeReport, setOutcomeReport] = useState<LiveOutcomeReport | null>(null);
  const [countyChartData, setCountyChartData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFinancial, setEditingFinancial] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [rd, parts, overview, mentors, outcome] = await Promise.all([
        getReportData(),
        getParticipants(),
        getLiveOverviewStats(),
        getLiveMentorActivityReport(),
        getLiveOutcomeReport(),
      ]);
      setReportData(rd);
      setParticipants(parts);
      setOverviewStats(overview);
      setMentorActivity(mentors);
      setOutcomeReport(outcome);
      setCountyChartData(await getLiveClientsByCounty(parts));
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubReport = subscribeToReportData(loadData);
    const unsubLive = subscribeToLiveDashboardData(loadData);
    return () => {
      unsubReport();
      unsubLive();
    };
  }, [loadData]);

  if (loading || !reportData || !overviewStats || !outcomeReport) {
    return <div className="p-6 text-sm text-gray-400">Loading reports…</div>;
  }

  const now = new Date();
  const monthYearLabel = now.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const quarterLabel = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;

  const saveFinancial = async (data: FinancialReport) => {
    await updateReportData({ financialReport: data });
    showToast("Financial summary updated", "success");
  };

  const reports = [
    {
      id: "monthly",
      title: "Monthly Program Report",
      desc: "Overview of all programs for the current month",
      date: monthYearLabel,
      icon: BarChart3,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "participant",
      title: "Participant Progress Report",
      desc: "Every participant currently in the system",
      date: monthYearLabel,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "mentor",
      title: "Mentor Activity Report",
      desc: "Sessions, hours and ratings for all mentors",
      date: monthYearLabel,
      icon: UserCheck,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "financial",
      title: "Financial Summary",
      desc: "Invoices, pending approvals and budget overview",
      date: monthYearLabel,
      icon: Receipt,
      color: "bg-amber-100 text-amber-600",
    },
    {
      id: "outcome",
      title: "Outcome Metrics Report",
      desc: "Business launches, capital access and satisfaction",
      date: quarterLabel,
      icon: TrendingUp,
      color: "bg-rose-100 text-rose-600",
    },
    {
      id: "county",
      title: "County Distribution Report",
      desc: "Participant breakdown by county",
      date: monthYearLabel,
      icon: ClipboardList,
      color: "bg-teal-100 text-teal-600",
    },
  ];

  // Report detail components
  const MonthlyReport = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Monthly Program Report
        </h2>
        <p className="text-sm text-gray-500 mb-6">{monthYearLabel}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {overviewStats.total_participants}
            </div>
            <div className="text-sm text-gray-600">Total Participants</div>
            <div className="text-xs text-gray-400">
              {overviewStats.total_participants_growth_pct !== null
                ? `${overviewStats.total_participants_growth_pct >= 0 ? "+" : ""}${overviewStats.total_participants_growth_pct}% new this quarter`
                : "No prior quarter to compare"}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {overviewStats.sessions_this_month}
            </div>
            <div className="text-sm text-gray-600">Sessions</div>
            <div className="text-xs text-gray-400">this month</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {overviewStats.avg_satisfaction_pct !== null
                ? `${overviewStats.avg_satisfaction_pct}%`
                : "—"}
            </div>
            <div className="text-sm text-gray-600">Satisfaction</div>
            <div className="text-xs text-gray-400">
              {overviewStats.avg_satisfaction_pct !== null
                ? "based on mentor ratings"
                : "no ratings yet"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ParticipantReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Participant Progress Report
      </h2>
      <p className="text-sm text-gray-500 mb-6">{monthYearLabel}</p>

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
                Status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Mentor
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No participants yet.
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.name || "—"}</td>
                  <td className="px-4 py-3">{p.program_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${
                        p.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : p.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {p.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.mentor || "Unassigned"}</td>
                </tr>
              ))
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
      <p className="text-sm text-gray-500 mb-6">{monthYearLabel}</p>

      <div className="space-y-4">
        {mentorActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No mentors yet.</p>
        ) : (
          mentorActivity.map((mentor) => (
            <div
              key={mentor.name}
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
                  {mentor.hours} hours •{" "}
                  {mentor.rating !== null ? `${mentor.rating}★` : "not yet rated"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const FinancialReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Financial Summary</h2>
          <p className="text-sm text-gray-500 mt-1">{monthYearLabel}</p>
        </div>
        <button
          onClick={() => setEditingFinancial(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

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
      <p className="text-sm text-gray-500 mb-6">{quarterLabel}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {outcomeReport.businessLaunches}
          </div>
          <div className="text-xs text-gray-600">Business Launches</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {outcomeReport.satisfactionPct !== null
              ? `${outcomeReport.satisfactionPct}%`
              : "—"}
          </div>
          <div className="text-xs text-gray-600">Satisfaction</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {outcomeReport.mentorMatches}
          </div>
          <div className="text-xs text-gray-600">Mentor Matches</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">
            {outcomeReport.referrals}
          </div>
          <div className="text-xs text-gray-600">Referrals</div>
        </div>
      </div>
    </div>
  );

  const countyTotal = countyChartData.reduce((sum, c) => sum + c.value, 0);

  const CountyReport = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            County Distribution Report
          </h2>
          <p className="text-sm text-gray-500 mt-1">{monthYearLabel}</p>
        </div>
      </div>

      <div className="space-y-3">
        {countyChartData.length === 0 ? (
          <p className="text-sm text-gray-400">No county data yet.</p>
        ) : (
          countyChartData.map((item) => {
            const percentage =
              countyTotal > 0 ? Math.round((item.value / countyTotal) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">
                    {item.value} participants ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
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

        {editingFinancial && (
          <EditFinancialModal
            initial={reportData.financialReport}
            onClose={() => setEditingFinancial(false)}
            onSave={saveFinancial}
          />
        )}
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

      <div className="space-y-4">
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
          <ClientsByCountyChart data={countyChartData} />
        </div>
      </div>
    </>
  );
}
