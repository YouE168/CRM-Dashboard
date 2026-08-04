"use client";

import { useState, useEffect, useCallback } from "react";
import { KPICard } from "./kpi-card";
import { ParticipantsTable } from "./participants-table";
import { Users, UserCheck, ClipboardList, Award } from "lucide-react";
import {
  getParticipants,
  subscribeToDashboardChanges,
  updateParticipantCounty,
  type DashboardParticipant,
} from "@/lib/supabase/dashboard-data";

export function ParticipantsTab() {
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await getParticipants();
      setParticipants(data);
    } catch (err) {
      console.error("Failed to load participants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDashboardChanges(loadData);
    return unsubscribe;
  }, [loadData]);

  const handleCountyChange = async (id: string, county: string | null) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, county } : p)),
    );
    try {
      await updateParticipantCounty(id, county);
    } catch (err) {
      console.error("Failed to update county:", err);
      loadData();
    }
  };

  const total = participants.length;
  const active = participants.filter((p) => p.status === "active").length;
  const onboarding = participants.filter(
    (p) => p.status === "onboarding",
  ).length;
  const alumni = participants.filter((p) => p.status === "alumni").length;

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-400">Loading participants…</div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} total participants across all programs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            {active} Active
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            {onboarding} Onboarding
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {alumni} Alumni
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Participants" value={total} icon={Users} />
        <KPICard
          title="Active"
          value={active}
          icon={UserCheck}
          variant="success"
        />
        <KPICard
          title="In Onboarding"
          value={onboarding}
          icon={ClipboardList}
          variant="warning"
        />
        <KPICard title="Alumni" value={alumni} icon={Award} />
      </div>
      <ParticipantsTable
        participants={participants.map((p) => ({
          id: p.id,
          name: p.name ?? "",
          program: p.program_name ?? "",
          stage: p.status,
          mentor: p.mentor ?? "",
          county: p.county,
        }))}
        onCountyChange={handleCountyChange}
      />
    </>
  );
}
