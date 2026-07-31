"use client";

import { useState, useEffect, useCallback } from "react";
import { Filters } from "./filters";
import { KPICard } from "./kpi-card";
import { ClientsByProgramChart } from "./clients-by-program-chart";
import { SessionsChart } from "./sessions-chart";
import { ParticipantsTable } from "./participants-table";
import {
  Users,
  Heart,
  CalendarDays,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  getParticipants,
  getLiveOperationalMetrics,
  getLiveOutcomeMetrics,
  subscribeToLiveDashboardData,
  type DashboardParticipant,
  type LiveOperationalMetrics,
  type LiveOutcomeMetrics,
} from "@/lib/supabase/dashboard-data";

interface AnalyticsTabProps {
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
  selectedCounty: string;
  setSelectedCounty: (county: string) => void;
  selectedDateRange?: string;
  setSelectedDateRange?: (range: string) => void;
}

export default function AnalyticsTab({
  selectedProgram,
  setSelectedProgram,
  selectedCounty,
  setSelectedCounty,
  selectedDateRange = "Last 12 months",
  setSelectedDateRange = () => {},
}: AnalyticsTabProps) {
  const [activeMetricTab, setActiveMetricTab] = useState("Operational Metrics");
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [operational, setOperational] = useState<LiveOperationalMetrics | null>(null);
  const [outcomes, setOutcomes] = useState<LiveOutcomeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const [participantsData, operationalData, outcomeData] = await Promise.all([
        getParticipants(),
        getLiveOperationalMetrics(selectedProgram, selectedDateRange),
        getLiveOutcomeMetrics(selectedProgram),
      ]);
      setParticipants(participantsData);
      setOperational(operationalData);
      setOutcomes(outcomeData);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProgram, selectedDateRange]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const unsubscribe = subscribeToLiveDashboardData(loadAll);
    return unsubscribe;
  }, [loadAll]);

  // Participants table can only filter by program - the real
  // `participants` table has no county column.
  const filteredParticipants = participants.filter((p) => {
    if (
      selectedProgram !== "All Programs" &&
      p.program_name !== selectedProgram
    ) {
      return false;
    }
    return true;
  });

  if (loading || !operational || !outcomes) {
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

      <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
        📊{" "}
        {selectedProgram === "All Programs"
          ? `Showing live totals across all programs for ${selectedDateRange}`
          : `Showing live totals for "${selectedProgram}" for ${selectedDateRange}`}
      </div>

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Active Clients"
              value={operational.active_clients}
              icon={Users}
              subtitle={
                selectedProgram === "All Programs"
                  ? "across all programs"
                  : selectedProgram
              }
            />
            <KPICard
              title="Active Mentor Matches"
              value={operational.active_mentor_matches}
              icon={Heart}
              subtitle="currently paired"
            />
            <KPICard
              title="Sessions This Month"
              value={operational.sessions_this_month}
              icon={CalendarDays}
              subtitle="mentoring sessions"
            />
            <KPICard
              title="Hours Delivered"
              value={operational.hours_delivered}
              icon={Clock}
              subtitle={selectedDateRange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <ClientsByProgramChart />
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
              value={outcomes.businesses_served}
              icon={Users}
              subtitle="have tracking data entered"
            />
            <KPICard
              title="Capital Accessed"
              value={`$${outcomes.capital_accessed.toLocaleString()}`}
              icon={TrendingUp}
              subtitle="funding outcomes"
            />
            <KPICard
              title="Business Launches"
              value={outcomes.businesses_launched}
              icon={Award}
              subtitle="new businesses"
            />
            <KPICard
              title="Alumni Conversion"
              value={
                outcomes.alumni_conversion_pct !== null
                  ? `${outcomes.alumni_conversion_pct}%`
                  : "—"
              }
              icon={Users}
              subtitle={
                outcomes.alumni_conversion_pct !== null ? "became alumni" : "no participants yet"
              }
              variant="success"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Participant Satisfaction"
              value={
                outcomes.participant_satisfaction_pct !== null
                  ? `${outcomes.participant_satisfaction_pct}%`
                  : "—"
              }
              icon={Award}
              subtitle={
                outcomes.participant_satisfaction_pct !== null
                  ? "avg. rating, all programs"
                  : "no ratings yet"
              }
              variant="success"
            />
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Businesses Served, Capital Accessed, and Business Launches come from
            Program Management → Tracking. Enter numbers there to see them
            reflected here. Referrals Completed, Mentor Retention, and Catalyst
            Completion were removed - there's no real data source for those yet.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SessionsChart />
            <ClientsByProgramChart />
          </div>
        </>
      )}
    </>
  );
}
