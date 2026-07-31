"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "./kpi-card";
import { ClientsByProgramChart } from "./clients-by-program-chart";
import { SessionsChart } from "./sessions-chart";
import { ParticipantsTable } from "./participants-table";
import { Users, UserCheck, CalendarDays, Award } from "lucide-react";
import {
  getLiveOverviewStats,
  getParticipants,
  subscribeToLiveDashboardData,
  type LiveOverviewStats,
  type DashboardParticipant,
} from "@/lib/supabase/dashboard-data";

export function OverviewTab() {
  const [stats, setStats] = useState<LiveOverviewStats | null>(null);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, participantsData] = await Promise.all([
        getLiveOverviewStats(),
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
    const unsubscribe = subscribeToLiveDashboardData(loadData);
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
          trend={
            stats.total_participants_growth_pct !== null
              ? { value: stats.total_participants_growth_pct, isPositive: true }
              : undefined
          }
          subtitle="this quarter"
        />
        <KPICard
          title="Active Mentors"
          value={stats.active_mentors}
          icon={UserCheck}
          subtitle="currently active"
        />
        <KPICard
          title="Sessions This Month"
          value={stats.sessions_this_month}
          icon={CalendarDays}
          subtitle="mentoring sessions"
        />
        <KPICard
          title="Avg. Satisfaction"
          value={
            stats.avg_satisfaction_pct !== null ? `${stats.avg_satisfaction_pct}%` : "—"
          }
          icon={Award}
          subtitle={
            stats.avg_satisfaction_pct !== null ? "participant rating" : "no ratings yet"
          }
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ClientsByProgramChart />
        <SessionsChart />
      </div>
      <ParticipantsTable
        participants={participants.map((p) => ({
          id: p.id,
          name: p.name ?? "",
          program: p.program_name ?? "",
          stage: p.status,
          mentor: p.mentor ?? "",
        }))}
      />
    </>
  );
}
