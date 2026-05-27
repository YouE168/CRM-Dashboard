"use client";

import { useState, useEffect } from "react";
import { KPICard } from "./kpi-card";
import { ClientsByProgramChart } from "./clients-by-program-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import { SessionsChart } from "./sessions-chart";
import { ParticipantsTable } from "./participants-table";
import { Users, UserCheck, CalendarDays, Award } from "lucide-react";
import { participants } from "@/lib/mock-data";
import { loadCMSData } from "@/lib/cms-data";

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
  const [cmsData, setCmsData] = useState(loadCMSData());

  useEffect(() => {
    setCmsData(loadCMSData());
    // Listen for storage changes from CMS editor
    const handleStorageChange = () => {
      setCmsData(loadCMSData());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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
          value={cmsData.overview.totalParticipants}
          icon={Users}
          trend={{
            value: cmsData.overview.participantsTrend,
            isPositive: true,
          }}
          subtitle="this quarter"
        />
        <KPICard
          title="Active Mentors"
          value={cmsData.overview.activeMentors}
          icon={UserCheck}
          trend={{ value: cmsData.overview.mentorsTrend, isPositive: true }}
          subtitle="currently active"
        />
        <KPICard
          title="Sessions This Month"
          value={cmsData.overview.sessionsThisMonth}
          icon={CalendarDays}
          trend={{ value: cmsData.overview.sessionsTrend, isPositive: true }}
          subtitle="mentoring sessions"
        />
        <KPICard
          title="Avg. Satisfaction"
          value={`${cmsData.overview.avgSatisfaction}%`}
          icon={Award}
          trend={{
            value: cmsData.overview.satisfactionTrend,
            isPositive: true,
          }}
          subtitle="participant rating"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ClientsByProgramChart />
        <ClientsByCountyChart />
        <SessionsChart />
      </div>
      <ParticipantsTable participants={participants} />
    </>
  );
}
