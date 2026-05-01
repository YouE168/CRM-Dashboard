"use client";

import { KPICard } from "./kpi-card";
import { ParticipantsTable } from "./participants-table";
import { Users, UserCheck, ClipboardList, Award } from "lucide-react";
import { participants } from "@/lib/mock-data";

export function ParticipantsTab() {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500 mt-1">
            {participants.length} total participants across all programs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["Active", "Onboarding", "Alumni"].map((s) => (
            <span
              key={s}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                s === "Active"
                  ? "bg-emerald-100 text-emerald-700"
                  : s === "Onboarding"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {participants.filter((p) => p.stage === s).length} {s}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Participants"
          value={participants.length}
          icon={Users}
        />
        <KPICard
          title="Active"
          value={participants.filter((p) => p.stage === "Active").length}
          icon={UserCheck}
          variant="success"
        />
        <KPICard
          title="In Onboarding"
          value={participants.filter((p) => p.stage === "Onboarding").length}
          icon={ClipboardList}
          variant="warning"
        />
        <KPICard
          title="Alumni"
          value={participants.filter((p) => p.stage === "Alumni").length}
          icon={Award}
        />
      </div>
      <ParticipantsTable />
    </>
  );
}
