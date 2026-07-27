"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "./kpi-card";
import { ClientsByProgramChart } from "./clients-by-program-chart";
import { ClientsByCountyChart } from "./clients-by-county-chart";
import { SessionsChart } from "./sessions-chart";
import { ParticipantsTable } from "./participants-table";
import { Users, UserCheck, CalendarDays, Award } from "lucide-react";
import {
  getOverviewStats,
  getParticipants,
  subscribeToDashboardChanges,
  type OverviewStats,
  type DashboardParticipant,
} from "@/lib/supabase/dashboard-data";

export function OverviewTab() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, participantsData] = await Promise.all([
        getOverviewStats(),
        getParticipants(),
      ]);
      setStats(statsData);
      setParticipants(participantsData);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDashboardChanges(loadData);
    return unsubscribe;
  }, [loadData]);

  if (loading || !stats) {
    return <div className="p-6 text-sm text-gray-400">Loading overview…</div>;
  }

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
          value={stats.total_participants}
          icon={Users}
          trend={{ value: stats.total_participants_change, isPositive: true }}
          subtitle="this quarter"
        />
        <KPICard
          title="Active Mentors"
          value={stats.active_mentors}
          icon={UserCheck}
          trend={{ value: stats.active_mentors_change, isPositive: true }}
          subtitle="currently active"
        />
        <KPICard
          title="Sessions This Month"
          value={stats.sessions_this_month}
          icon={CalendarDays}
          trend={{ value: stats.sessions_this_month_change, isPositive: true }}
          subtitle="mentoring sessions"
        />
        <KPICard
          title="Avg. Satisfaction"
          value={`${stats.avg_satisfaction}%`}
          icon={Award}
          trend={{ value: stats.avg_satisfaction_change, isPositive: true }}
          subtitle="participant rating"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ClientsByProgramChart />
        <ClientsByCountyChart />
        <SessionsChart />
      </div>
      <ParticipantsTable
        participants={participants.map((p) => ({
          id: p.id,
          name: p.name ?? "",
          program: p.program_name ?? "",
          county: "",
          stage: p.status,
          mentor: p.mentor ?? "",
        }))}
      />
    </>
  );
}
