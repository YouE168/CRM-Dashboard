"use client";

import { KPICard } from "./kpi-card";
import { ClientsByProgramChart } from "./clients-by-program-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import { SessionsChart } from "./sessions-chart";
import { ParticipantsTable } from "./participants-table";
import { Users, UserCheck, CalendarDays, Award } from "lucide-react";

const mentors = [
  { name: "Michael Chen", status: "Active" },
  { name: "Lisa Thompson", status: "Active" },
  { name: "David Park", status: "Active" },
  { name: "Jennifer Lee", status: "Active" },
  { name: "Tom Anderson", status: "Active" },
  { name: "Susan White", status: "On Leave" },
  { name: "Chris Taylor", status: "Active" },
  { name: "Rachel Green", status: "Active" },
];

export function OverviewTab() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          Program summary at a glance
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Participants"
          value={124}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          subtitle="this quarter"
        />
        <KPICard
          title="Active Mentors"
          value={mentors.filter((m) => m.status === "Active").length}
          icon={UserCheck}
          trend={{ value: 5, isPositive: true }}
          subtitle="currently active"
        />
        <KPICard
          title="Sessions This Month"
          value={156}
          icon={CalendarDays}
          trend={{ value: 15, isPositive: true }}
          subtitle="mentoring sessions"
        />
        <KPICard
          title="Avg. Satisfaction"
          value="94%"
          icon={Award}
          trend={{ value: 3, isPositive: true }}
          subtitle="participant rating"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ClientsByProgramChart />
        <ClientsByCountyChart />
        <SessionsChart />
      </div>
      <ParticipantsTable />
    </>
  );
}
