"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Download, Search } from "lucide-react";
import { getMeetingTimeLog, type MeetingTimeLogRow } from "@/lib/supabase/dashboard-data";
import { downloadTimeLogCsv, formatTotalMinutes } from "@/lib/time-log-csv";

// Admin time log: every admin meeting + mentor session, filterable by
// person/business/mentor, program and meeting type, with CSV download of
// whatever is currently shown.

type TypeFilter = "all" | "Admin Meeting" | "Mentor Session";

interface PersonOption {
  key: string;
  label: string;
  group: string;
}

// A row can match a "person" pick two ways: who the meeting is about, or
// (for mentor sessions) which mentor ran it.
const aboutKey = (r: MeetingTimeLogRow) =>
  r.personId ? `${r.personType ?? "person"}:${r.personId}` : `name:${r.personName}`;
const mentorKey = (r: MeetingTimeLogRow) => `mentor:${r.withOrBy}`;

export function TimeLogModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<MeetingTimeLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [programs, setPrograms] = useState<string[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [peopleQ, setPeopleQ] = useState("");

  useEffect(() => {
    getMeetingTimeLog()
      .then(setRows)
      .catch((e) => {
        console.error("Failed to load time log:", e);
        setError("Couldn't load the time log. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const allPrograms = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.programNames))).sort(),
    [rows],
  );

  const personOptions = useMemo(() => {
    const map = new Map<string, PersonOption>();
    for (const r of rows) {
      if (r.personName) {
        const k = aboutKey(r);
        if (!map.has(k)) {
          map.set(k, {
            key: k,
            label: r.personName,
            group: r.personType === "business" ? "Businesses" : "Members",
          });
        }
      }
      if (r.type === "Mentor Session" && r.withOrBy) {
        const k = mentorKey(r);
        if (!map.has(k)) map.set(k, { key: k, label: r.withOrBy, group: "Mentors" });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const visibleOptions = personOptions.filter((o) =>
    o.label.toLowerCase().includes(peopleQ.trim().toLowerCase()),
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (typeFilter !== "all" && r.type !== typeFilter) return false;
        if (programs.length > 0 && !r.programNames.some((p) => programs.includes(p))) return false;
        if (people.length > 0) {
          const match =
            people.includes(aboutKey(r)) ||
            (r.type === "Mentor Session" && people.includes(mentorKey(r)));
          if (!match) return false;
        }
        return true;
      }),
    [rows, typeFilter, programs, people],
  );

  const totalMinutes = filtered.reduce((s, r) => s + (r.durationMinutes ?? 0), 0);
  const hasFilters = typeFilter !== "all" || programs.length > 0 || people.length > 0;

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const chip = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
      active
        ? "bg-emerald-600 text-white border-emerald-600"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Meeting Time Log</h2>
            <p className="text-sm text-gray-500">
              {filtered.length} meeting{filtered.length === 1 ? "" : "s"} ·{" "}
              {formatTotalMinutes(totalMinutes)} total
              {hasFilters ? " (filtered)" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={filtered.length === 0}
              onClick={() =>
                downloadTimeLogCsv(
                  filtered.map((r) => ({
                    type: r.type,
                    person: r.personName,
                    withOrBy: r.withOrBy,
                    date: r.date,
                    time: r.time,
                    durationMinutes: r.durationMinutes,
                    topic: r.topicOrNote,
                  })),
                )
              }
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Download CSV{hasFilters ? " (filtered)" : ""}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 space-y-3 overflow-y-auto max-h-[40vh]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 w-20">Type</span>
            {(["all", "Admin Meeting", "Mentor Session"] as TypeFilter[]).map((t) => (
              <button key={t} className={chip(typeFilter === t)} onClick={() => setTypeFilter(t)}>
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>

          {allPrograms.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 w-20">Program</span>
              {allPrograms.map((p) => (
                <button
                  key={p}
                  className={chip(programs.includes(p))}
                  onClick={() => toggle(programs, setPrograms, p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 w-20">People</span>
              <div className="relative flex-1 max-w-xs">
                <Search className="h-4 w-4 text-gray-400 absolute left-2.5 top-2" />
                <input
                  value={peopleQ}
                  onChange={(e) => setPeopleQ(e.target.value)}
                  placeholder="Search people, businesses, mentors…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              {people.length > 0 && (
                <span className="text-xs text-gray-500">{people.length} selected</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 ml-[88px] max-h-28 overflow-y-auto">
              {visibleOptions.slice(0, 80).map((o) => (
                <button
                  key={o.key}
                  className={chip(people.includes(o.key))}
                  onClick={() => toggle(people, setPeople, o.key)}
                  title={o.group}
                >
                  {o.label}
                  <span className="opacity-60"> · {o.group}</span>
                </button>
              ))}
              {visibleOptions.length > 80 && (
                <span className="text-xs text-gray-400 self-center">
                  Type to narrow {visibleOptions.length - 80} more…
                </span>
              )}
              {visibleOptions.length === 0 && (
                <span className="text-xs text-gray-400">No matches</span>
              )}
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setTypeFilter("all");
                setPrograms([]);
                setPeople([]);
              }}
              className="text-xs text-emerald-700 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500">No meetings match these filters.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Person</th>
                  <th className="px-3 py-2 font-medium">With/By</th>
                  <th className="px-3 py-2 font-medium text-right">Minutes</th>
                  <th className="px-3 py-2 font-medium">Topic/Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100 align-top">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.date || "—"}
                      {r.time ? ` ${r.time}` : ""}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.type}</td>
                    <td className="px-3 py-2">{r.personName}</td>
                    <td className="px-3 py-2">{r.withOrBy}</td>
                    <td className="px-3 py-2 text-right">{r.durationMinutes ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={r.topicOrNote}>
                      {r.topicOrNote}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
