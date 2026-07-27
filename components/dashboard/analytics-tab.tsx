"use client";

import { useState, useEffect, useCallback } from "react";
import { Filters } from "./filters";
import { KPICard } from "./kpi-card";
import { ClientsByProgramChart } from "./clients-by-program-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import { SessionsChart } from "./sessions-chart";
import { ParticipantsTable } from "./participants-table";
import {
  Users,
  Heart,
  CalendarDays,
  Clock,
  FileSignature,
  ClipboardList,
  Receipt,
  TrendingUp,
  Award,
  UserCheck,
  BarChart3,
} from "lucide-react";
import {
  getAnalyticsGrid,
  subscribeToAnalyticsGrid,
  getOutcomeKPIs,
  getParticipants,
  type AnalyticsDataRow,
  type OutcomeKPI,
  type DashboardParticipant,
} from "@/lib/supabase/dashboard-data";
import { PROGRAMS, COUNTIES } from "@/lib/analytics-constants";

interface AnalyticsTabProps {
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
  selectedCounty: string;
  setSelectedCounty: (county: string) => void;
  selectedDateRange?: string;
  setSelectedDateRange?: (range: string) => void;
}

type MetricKey =
  | "active_clients"
  | "active_mentor_matches"
  | "sessions_this_month"
  | "hours_delivered"
  | "outstanding_signatures"
  | "surveys_overdue"
  | "invoices_pending";

export default function AnalyticsTab({
  selectedProgram,
  setSelectedProgram,
  selectedCounty,
  setSelectedCounty,
  selectedDateRange = "Last 12 months",
  setSelectedDateRange = () => {},
}: AnalyticsTabProps) {
  const [activeMetricTab, setActiveMetricTab] = useState("Operational Metrics");
  const [grid, setGrid] = useState<AnalyticsDataRow[]>([]);
  const [outcomeKpis, setOutcomeKpis] = useState<OutcomeKPI[]>([]);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGrid = useCallback(async () => {
    try {
      const data = await getAnalyticsGrid(selectedDateRange);
      setGrid(data);
    } catch (err) {
      console.error("Failed to load analytics grid:", err);
    }
  }, [selectedDateRange]);

  const loadAll = useCallback(async () => {
    try {
      const [gridData, kpiData, participantsData] = await Promise.all([
        getAnalyticsGrid(selectedDateRange),
        getOutcomeKPIs(),
        getParticipants(),
      ]);
      setGrid(gridData);
      setOutcomeKpis(kpiData);
      setParticipants(participantsData);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDateRange]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const unsubscribe = subscribeToAnalyticsGrid(loadGrid);
    return unsubscribe;
  }, [loadGrid]);

  const kpi = (key: string) => outcomeKpis.find((k) => k.key === key);

  // Participants table can only filter by program — the real
  // `participants` table has no county column yet.
  const filteredParticipants = participants.filter((p) => {
    if (
      selectedProgram !== "All Programs" &&
      p.program_name !== selectedProgram
    ) {
      return false;
    }
    return true;
  });

  // Aggregate the grid the same way the original CMS version did —
  // sum matching rows for whichever program/county filters are active.
  const getMetricValue = (metric: MetricKey): number => {
    const rows = grid.filter((row) => {
      const programMatch =
        selectedProgram === "All Programs" || row.program === selectedProgram;
      const countyMatch =
        selectedCounty === "All Counties" || row.county === selectedCounty;
      return programMatch && countyMatch;
    });
    return rows.reduce((sum, row) => sum + (row[metric] ?? 0), 0);
  };

  const isAggregatedView =
    selectedProgram === "All Programs" && selectedCounty === "All Counties";
  const isProgramOnlyView =
    selectedProgram !== "All Programs" && selectedCounty === "All Counties";
  const isCountyOnlyView =
    selectedProgram === "All Programs" && selectedCounty !== "All Counties";

  const activeClients = getMetricValue("active_clients");
  const activeMentorMatches = getMetricValue("active_mentor_matches");
  const sessionsThisMonth = getMetricValue("sessions_this_month");
  const hoursDelivered = getMetricValue("hours_delivered");
  const outstandingSignatures = getMetricValue("outstanding_signatures");
  const surveysOverdue = getMetricValue("surveys_overdue");
  const invoicesPending = getMetricValue("invoices_pending");

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading analytics…</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track program performance and participant outcomes
          </p>
        </div>
        <Filters
          selectedProgram={selectedProgram}
          setSelectedProgram={setSelectedProgram}
          selectedCounty={selectedCounty}
          setSelectedCounty={setSelectedCounty}
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
        />
      </div>

      {isAggregatedView && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
          📊 Showing AGGREGATED data across all programs and counties for{" "}
          {selectedDateRange}
        </div>
      )}

      {isProgramOnlyView && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          📊 Showing totals for "{selectedProgram}" across all counties for{" "}
          {selectedDateRange}
        </div>
      )}

      {isCountyOnlyView && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          📊 Showing totals for {selectedCounty} county across all programs for{" "}
          {selectedDateRange}
        </div>
      )}

      {!isAggregatedView &&
        !isProgramOnlyView &&
        !isCountyOnlyView &&
        selectedProgram !== "All Programs" &&
        selectedCounty !== "All Counties" && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            Showing data for: {selectedProgram} in {selectedCounty} (
            {selectedDateRange})
          </div>
        )}

      <div className="text-right mb-2">
        <button
          onClick={loadAll}
          className="text-xs text-gray-400 hover:text-emerald-600 transition-colors"
        >
          ↻ Refresh data
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {["Operational Metrics", "Outcome Metrics"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveMetricTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
              activeMetricTab === tab
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeMetricTab === "Operational Metrics" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <KPICard
              title="Active Clients"
              value={activeClients}
              icon={Users}
              trend={{ value: 12, isPositive: true }}
              subtitle="across all programs"
            />
            <KPICard
              title="Active Mentor Matches"
              value={activeMentorMatches}
              icon={Heart}
              trend={{ value: 8, isPositive: true }}
              subtitle="currently paired"
            />
            <KPICard
              title="Sessions This Month"
              value={sessionsThisMonth}
              icon={CalendarDays}
              trend={{ value: 15, isPositive: true }}
              subtitle="mentoring sessions"
            />
            <KPICard
              title="Hours Delivered"
              value={hoursDelivered}
              icon={Clock}
              subtitle="this month"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KPICard
              title="Outstanding Signatures"
              value={outstandingSignatures}
              icon={FileSignature}
              subtitle="awaiting completion"
              variant="warning"
            />
            <KPICard
              title="Surveys Overdue"
              value={surveysOverdue}
              icon={ClipboardList}
              subtitle="need follow-up"
              variant="warning"
            />
            <KPICard
              title="Invoices Pending"
              value={invoicesPending}
              icon={Receipt}
              subtitle="awaiting approval"
              variant="warning"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ClientsByProgramChart />
            <ClientsByCountyChart />
            <SessionsChart />
          </div>
          <ParticipantsTable
            participants={filteredParticipants.map((p) => ({
              id: p.id,
              name: p.name ?? "",
              program: p.program_name ?? "",
              county: "",
              stage: p.status,
              mentor: p.mentor ?? "",
            }))}
          />
        </>
      )}

      {activeMetricTab === "Outcome Metrics" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Businesses Served"
              value={kpi("businessesServed")?.value ?? 0}
              icon={BarChart3}
              trend={{
                value: kpi("businessesServed")?.change ?? 0,
                isPositive: true,
              }}
              subtitle="total this year"
            />
            <KPICard
              title="Referrals Completed"
              value={kpi("referralsCompleted")?.value ?? 0}
              icon={UserCheck}
              trend={{
                value: kpi("referralsCompleted")?.change ?? 0,
                isPositive: true,
              }}
              subtitle="successful referrals"
            />
            <KPICard
              title="Capital Access"
              value={kpi("capitalAccessOutcomes")?.value ?? 0}
              icon={TrendingUp}
              trend={{
                value: kpi("capitalAccessOutcomes")?.change ?? 0,
                isPositive: true,
              }}
              subtitle="funding outcomes"
            />
            <KPICard
              title="Business Launches"
              value={kpi("businessLaunchMilestones")?.value ?? 0}
              icon={Award}
              trend={{
                value: kpi("businessLaunchMilestones")?.change ?? 0,
                isPositive: true,
              }}
              subtitle="new businesses"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Participant Satisfaction"
              value={`${kpi("participantSatisfaction")?.value ?? 0}%`}
              icon={Award}
              trend={{
                value: kpi("participantSatisfaction")?.change ?? 0,
                isPositive: true,
              }}
              subtitle="avg. rating"
              variant="success"
            />
            <KPICard
              title="Mentor Retention"
              value={`${kpi("mentorRetention")?.value ?? 0}%`}
              icon={Heart}
              trend={{
                value: kpi("mentorRetention")?.change ?? 0,
                isPositive: true,
              }}
              subtitle="retained mentors"
              variant="success"
            />
            <KPICard
              title="Catalyst Completion"
              value={`${kpi("catalystCompletion")?.value ?? 0}%`}
              icon={TrendingUp}
              subtitle="program completion"
              variant="success"
            />
            <KPICard
              title="Alumni Conversion"
              value={`${kpi("alumniConversion")?.value ?? 0}%`}
              icon={Users}
              subtitle="became alumni"
              variant="success"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SessionsChart />
            <ClientsByProgramChart />
          </div>
        </>
      )}
    </>
  );
}
