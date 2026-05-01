"use client";

import { useState } from "react";
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
import { outcomeKPIs } from "@/lib/mock-data";

interface AnalyticsTabProps {
  selectedProgram: string;
  setSelectedProgram: (program: string) => void;
  selectedCounty: string;
  setSelectedCounty: (county: string) => void;
}

export function AnalyticsTab({
  selectedProgram,
  setSelectedProgram,
  selectedCounty,
  setSelectedCounty,
}: AnalyticsTabProps) {
  const [activeMetricTab, setActiveMetricTab] = useState("Operational Metrics");

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
        />
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
              value={124}
              icon={Users}
              trend={{ value: 12, isPositive: true }}
              subtitle="across all programs"
            />
            <KPICard
              title="Active Mentor Matches"
              value={89}
              icon={Heart}
              trend={{ value: 8, isPositive: true }}
              subtitle="currently paired"
            />
            <KPICard
              title="Sessions This Month"
              value={156}
              icon={CalendarDays}
              trend={{ value: 15, isPositive: true }}
              subtitle="mentoring sessions"
            />
            <KPICard
              title="Hours Delivered"
              value={312}
              icon={Clock}
              subtitle="this month"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KPICard
              title="Outstanding Signatures"
              value={12}
              icon={FileSignature}
              subtitle="awaiting completion"
              variant="warning"
            />
            <KPICard
              title="Surveys Overdue"
              value={8}
              icon={ClipboardList}
              subtitle="need follow-up"
              variant="warning"
            />
            <KPICard
              title="Invoices Pending"
              value={5}
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
          <ParticipantsTable />
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
