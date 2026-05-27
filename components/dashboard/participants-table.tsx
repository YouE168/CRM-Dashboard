"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  program: string;
  county: string;
  stage: string;
  mentor: string;
}

interface ParticipantsTableProps {
  participants: Participant[];
}

const stageBadge: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Onboarding: "bg-amber-100 text-amber-700",
  Matched: "bg-purple-100 text-purple-700",
  Completing: "bg-blue-100 text-blue-700",
  Alumni: "bg-gray-100 text-gray-600",
};

const avatarColor: Record<number, string> = {
  0: "bg-emerald-100 text-emerald-700",
  1: "bg-blue-100 text-blue-700",
  2: "bg-purple-100 text-purple-700",
  3: "bg-amber-100 text-amber-700",
  4: "bg-rose-100 text-rose-700",
};

function initials(name: string) {
  const p = name.split(" ");
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0][0];
}

export function ParticipantsTable({ participants }: ParticipantsTableProps) {
  const [q, setQ] = useState("");

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Participants</h2>
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search participants..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Name", "Program", "County", "Stage", "Assigned Mentor"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-gray-400"
                >
                  No participants found.
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor[i % 5]}`}
                      >
                        {initials(p.name)}
                      </div>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {p.program}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{p.county}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${stageBadge[p.stage] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {p.stage}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                    {p.mentor}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
