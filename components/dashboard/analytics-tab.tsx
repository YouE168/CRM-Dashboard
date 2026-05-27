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
import { outcomeKPIs, participants } from "@/lib/mock-data";
import {
  loadCMSData,
  getAnalyticsValue,
  type AnalyticsDataPoint,
} from "@/lib/cms-data";

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
  const [cmsData, setCmsData] = useState(loadCMSData());
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to reload data
  const reloadData = useCallback(() => {
    console.log("Reloading analytics data...");
    setCmsData(loadCMSData());
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Load data and listen for changes
  useEffect(() => {
    reloadData();

    // Listen for storage changes (when CMS Editor saves from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cmsData") {
        console.log("Storage event detected, reloading...");
        reloadData();
      }
    };

    // Listen for custom event (when CMS Editor saves from same tab)
    const handleCustomEvent = () => {
      console.log("Custom event detected, reloading...");
      reloadData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cmsDataUpdated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cmsDataUpdated", handleCustomEvent);
    };
  }, [reloadData]);

  // FILTER PARTICIPANTS based on selections (for the table only)
  const filteredParticipants = participants.filter((p) => {
    let match = true;
    if (selectedProgram !== "All Programs" && p.program !== selectedProgram) {
      match = false;
    }
    if (selectedCounty !== "All Counties" && p.county !== selectedCounty) {
      match = false;
    }
    return match;
  });

  // Helper to get value (handles aggregation)
  const getMetricValue = (metric: keyof AnalyticsDataPoint): number => {
    if (!cmsData?.analyticsData) {
      console.warn("No analytics data available");
      return 0;
    }

    // If both are "All", aggregate over everything
    if (
      selectedProgram === "All Programs" &&
      selectedCounty === "All Counties"
    ) {
      let total = 0;
      for (const program of cmsData.programs) {
        for (const county of cmsData.counties) {
          total += getAnalyticsValue(
            cmsData,
            program,
            county,
            selectedDateRange,
            metric,
          );
        }
      }
      return total;
    }

    // If only program is specific but county is "All"
    if (
      selectedProgram !== "All Programs" &&
      selectedCounty === "All Counties"
    ) {
      let total = 0;
      for (const county of cmsData.counties) {
        total += getAnalyticsValue(
          cmsData,
          selectedProgram,
          county,
          selectedDateRange,
          metric,
        );
      }
      return total;
    }

    // If only county is specific but program is "All"
    if (
      selectedProgram === "All Programs" &&
      selectedCounty !== "All Counties"
    ) {
      let total = 0;
      for (const program of cmsData.programs) {
        total += getAnalyticsValue(
          cmsData,
          program,
          selectedCounty,
          selectedDateRange,
          metric,
        );
      }
      return total;
    }

    // Specific program and county
    return getAnalyticsValue(
      cmsData,
      selectedProgram,
      selectedCounty,
      selectedDateRange,
      metric,
    );
  };

  const isAggregatedView =
    selectedProgram === "All Programs" && selectedCounty === "All Counties";
  const isProgramOnlyView =
    selectedProgram !== "All Programs" && selectedCounty === "All Counties";
  const isCountyOnlyView =
    selectedProgram === "All Programs" && selectedCounty !== "All Counties";

  // Get all metrics
  const activeClients = getMetricValue("activeClients");
  const activeMentorMatches = getMetricValue("activeMentorMatches");
  const sessionsThisMonth = getMetricValue("sessionsThisMonth");
  const hoursDelivered = getMetricValue("hoursDelivered");
  const outstandingSignatures = getMetricValue("outstandingSignatures");
  const surveysOverdue = getMetricValue("surveysOverdue");
  const invoicesPending = getMetricValue("invoicesPending");

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

      {/* Status Messages */}
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

      {/* Refresh indicator */}
      <div className="text-right mb-2">
        <button
          onClick={reloadData}
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
          <ParticipantsTable participants={filteredParticipants} />
        </>
      )}

      {activeMetricTab === "Outcome Metrics" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Businesses Served"
              value={outcomeKPIs.businessesServed}
              icon={BarChart3}
              trend={{ value: 8, isPositive: true }}
              subtitle="total this year"
            />
            <KPICard
              title="Referrals Completed"
              value={outcomeKPIs.referralsCompleted}
              icon={UserCheck}
              trend={{ value: 12, isPositive: true }}
              subtitle="successful referrals"
            />
            <KPICard
              title="Capital Access"
              value={outcomeKPIs.capitalAccessOutcomes}
              icon={TrendingUp}
              trend={{ value: 5, isPositive: true }}
              subtitle="funding outcomes"
            />
            <KPICard
              title="Business Launches"
              value={outcomeKPIs.businessLaunchMilestones}
              icon={Award}
              trend={{ value: 18, isPositive: true }}
              subtitle="new businesses"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Participant Satisfaction"
              value={`${outcomeKPIs.participantSatisfaction}%`}
              icon={Award}
              trend={{ value: 3, isPositive: true }}
              subtitle="avg. rating"
              variant="success"
            />
            <KPICard
              title="Mentor Retention"
              value={`${outcomeKPIs.mentorRetention}%`}
              icon={Heart}
              trend={{ value: 2, isPositive: true }}
              subtitle="retained mentors"
              variant="success"
            />
            <KPICard
              title="Catalyst Completion"
              value={`${outcomeKPIs.catalystCompletion}%`}
              icon={TrendingUp}
              subtitle="program completion"
              variant="success"
            />
            <KPICard
              title="Alumni Conversion"
              value={`${outcomeKPIs.alumniConversion}%`}
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
