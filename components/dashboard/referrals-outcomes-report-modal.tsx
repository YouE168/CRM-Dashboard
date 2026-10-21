"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Download } from "lucide-react";
import {
  REFERRAL_TYPES,
  OUTCOME_TYPES,
  REFERRAL_STATUSES,
  CAPITAL_TYPES,
  outcomeLabel,
  buildReport,
  formatMoney,
  getReportSource,
  type ReportSource,
} from "@/lib/referrals-outcomes";
import { getAllPrograms } from "@/lib/supabase/dashboard-data";
import { COUNTIES } from "@/lib/analytics-constants";

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-80 mt-0.5">{label}</p>
    </div>
  );
}

export function ReferralsOutcomesReportModal({ onClose }: { onClose: () => void }) {
  const [source, setSource] = useState<ReportSource | null>(null);
  const [programs, setPrograms] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [county, setCounty] = useState("");
  const [program, setProgram] = useState("");

  useEffect(() => {
    getReportSource()
      .then(setSource)
      .catch((e) => {
        console.error("Failed to load report data:", e);
        setError("Couldn't load the report. Please try again.");
      });
    getAllPrograms()
      .then((p) => setPrograms(p.map((x) => x.name).sort()))
      .catch(() => {});
  }, []);

  const report = useMemo(
    () => (source ? buildReport(source, { from, to, county, program }) : null),
    [source, from, to, county, program],
  );

  const filterText = [
    from || to ? `${from || "start"} to ${to || "today"}` : "All dates",
    county ? `${county} County` : "All counties",
    program || "All programs",
  ].join(" | ");

  const downloadCsv = () => {
    if (!report) return;
    const rows: (string | number)[][] = [
      ["Referrals and Outcomes Report"],
      ["Filters", filterText],
      [],
      ["Summary"],
      ["Total referrals", report.referralsTotal],
      ["Total outcomes", report.outcomesTotal],
      ["Unique businesses or members helped", report.uniqueHelped],
      ["Total capital received", report.capitalTotal],
      ["Jobs created", report.jobsCreated],
      ["Jobs retained", report.jobsRetained],
      ["Internships completed", report.internshipsCompleted],
      [],
      ["Referrals by type", "Count"],
      ...REFERRAL_TYPES.map((t) => [t.label, report.referralsByType[t.id] ?? 0]),
      [],
      ["Referral status", "Count"],
      ...REFERRAL_STATUSES.map((s) => [s.label, report.referralsByStatus[s.id] ?? 0]),
      [],
      ["Outcomes by type", "Count"],
      ...OUTCOME_TYPES.map((t) => [t.label, report.outcomesByType[t.id] ?? 0]),
      [],
      ["Capital received by funding type", "Amount"],
      ...CAPITAL_TYPES.map((t) => [outcomeLabel(t), report.capitalByType[t] ?? 0]),
      ["Total capital received", report.capitalTotal],
    ];
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals-outcomes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const field =
    "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Referrals and Outcomes Report</h2>
            <p className="text-xs text-gray-500">{filterText}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCsv}
              disabled={!report}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">From</label>
            <input type="date" className={field} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">To</label>
            <input type="date" className={field} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">County</label>
            <select className={field} value={county} onChange={(e) => setCounty(e.target.value)}>
              <option value="">All counties</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-0.5">Program</label>
            <select className={field} value={program} onChange={(e) => setProgram(e.target.value)}>
              <option value="">All programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {(from || to || county || program) && (
            <button
              onClick={() => { setFrom(""); setTo(""); setCounty(""); setProgram(""); }}
              className="text-xs text-emerald-700 hover:underline pb-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !report ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Referrals made" value={String(report.referralsTotal)} tone="border-indigo-100 bg-indigo-50 text-indigo-900" />
                <Stat label="Outcomes achieved" value={String(report.outcomesTotal)} tone="border-emerald-100 bg-emerald-50 text-emerald-900" />
                <Stat label="Unique businesses or members helped" value={String(report.uniqueHelped)} tone="border-gray-200 bg-gray-50 text-gray-900" />
                <Stat label="Total capital received" value={formatMoney(report.capitalTotal)} tone="border-amber-100 bg-amber-50 text-amber-900" />
                <Stat label="Jobs created" value={String(report.jobsCreated)} tone="border-sky-100 bg-sky-50 text-sky-900" />
                <Stat label="Jobs retained" value={String(report.jobsRetained)} tone="border-sky-100 bg-sky-50 text-sky-900" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Referrals by type</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {REFERRAL_TYPES.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 text-gray-700">{t.label}</td>
                          <td className="py-1.5 text-right font-medium text-gray-900">
                            {report.referralsByType[t.id] ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 mt-2">
                    {REFERRAL_STATUSES.map((s) => `${s.label}: ${report.referralsByStatus[s.id] ?? 0}`).join(" · ")}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Outcomes by type</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {OUTCOME_TYPES.map((t) => (
                        <tr key={t.id} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 text-gray-700">{t.label}</td>
                          <td className="py-1.5 text-right font-medium text-gray-900">
                            {report.outcomesByType[t.id] ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Capital received by funding type
                </h3>
                <table className="w-full text-sm max-w-md">
                  <tbody>
                    {CAPITAL_TYPES.map((t) => (
                      <tr key={t} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-700">{outcomeLabel(t)}</td>
                        <td className="py-1.5 text-right font-medium text-gray-900">
                          {formatMoney(report.capitalByType[t] ?? 0)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 font-semibold text-gray-900">Total capital received</td>
                      <td className="py-2 text-right font-bold text-gray-900">
                        {formatMoney(report.capitalTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-1">
                  Calculated automatically from loans, grants, investment, and owner funds entered.
                  Each entry is counted once.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
