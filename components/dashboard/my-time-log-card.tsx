"use client";

import { useEffect, useState } from "react";
import { Clock, Download } from "lucide-react";
import { getMyTimeLog, type MyTimeLogRow } from "@/lib/supabase/dashboard-data";
import { downloadTimeLogCsv, formatTotalMinutes } from "@/lib/time-log-csv";

// "My Meeting Time Log" - shows the signed-in user the meetings they took
// part in (admin meetings about them/their business, mentor sessions).
// Never shows private notes. Renders nothing when there's nothing to show.
export function MyTimeLogCard() {
  const [rows, setRows] = useState<MyTimeLogRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyTimeLog()
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch((err) => console.error("Failed to load time log:", err))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || rows.length === 0) return null;

  const total = rows.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Meeting Time Log</h3>
          <span className="text-sm text-gray-500">
            {rows.length} meeting{rows.length === 1 ? "" : "s"} · {formatTotalMinutes(total)}
          </span>
        </div>
        <button
          onClick={() =>
            downloadTimeLogCsv(
              rows.map((r) => ({
                type: r.entry_type,
                person: r.person_name,
                withOrBy: r.with_or_by,
                date: r.meeting_date,
                time: r.meeting_time,
                durationMinutes: r.duration_minutes,
                topic: r.topic,
              })),
              "my-meeting-log",
            )
          }
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Person</th>
              <th className="px-3 py-2 font-medium">With/By</th>
              <th className="px-3 py-2 font-medium text-right">Minutes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.meeting_date || "—"}
                  {r.meeting_time ? ` ${r.meeting_time}` : ""}
                </td>
                <td className="px-3 py-2">{r.entry_type}</td>
                <td className="px-3 py-2">{r.person_name}</td>
                <td className="px-3 py-2">{r.with_or_by}</td>
                <td className="px-3 py-2 text-right">{r.duration_minutes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
