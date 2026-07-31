"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLiveResourceTotals,
  getLiveResourcesByProgram,
  subscribeToLiveDashboardData,
  type LiveResourceTotals,
  type LiveResourceByProgramRow,
} from "@/lib/supabase/dashboard-data";

export function ResourcesTab() {
  const [totals, setTotals] = useState<LiveResourceTotals | null>(null);
  const [resourcesByProgram, setResourcesByProgram] = useState<LiveResourceByProgramRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [totalsData, programsData] = await Promise.all([
        getLiveResourceTotals(),
        getLiveResourcesByProgram(),
      ]);
      setTotals(totalsData);
      setResourcesByProgram(programsData);
    } catch (err) {
      console.error("Failed to load resources data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToLiveDashboardData(loadData);
    return unsubscribe;
  }, [loadData]);

  if (loading || !totals) {
    return <div className="p-6 text-sm text-gray-400">Loading resources…</div>;
  }

  const totalParticipants = resourcesByProgram.reduce((sum, p) => sum + (p.participants || 0), 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resources Invested</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track financial and staff resources across all initiatives, entered by admin in Program Management → Tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-300 uppercase tracking-wide">Total Budget</p>
          <p className="text-2xl font-bold text-white mt-1">${totals.total_budget.toLocaleString()}</p>
        </div>
        <div className="bg-indigo-800 rounded-xl p-4">
          <p className="text-xs text-indigo-200 uppercase tracking-wide">Staff Hours</p>
          <p className="text-2xl font-bold text-white mt-1">{totals.total_hours.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-800 rounded-xl p-4">
          <p className="text-xs text-emerald-200 uppercase tracking-wide">Participants Served</p>
          <p className="text-2xl font-bold text-white mt-1">{totalParticipants.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Financial Resources</h2>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-300 uppercase tracking-wide">Total Budget</p>
            <p className="text-xl font-bold text-white mt-1">${totals.total_budget.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-800 rounded-xl p-4">
            <p className="text-xs text-emerald-200 uppercase tracking-wide">Grants Received</p>
            <p className="text-xl font-bold text-white mt-1">${totals.grants_received.toLocaleString()}</p>
            <p className="text-xs text-emerald-200 mt-1">
              {totals.total_budget > 0
                ? `${Math.round((totals.grants_received / totals.total_budget) * 100)}% of budget`
                : "of budget"}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Donations and Sponsorships were removed - there's no real data source for those yet.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-800">
          <h2 className="text-sm font-semibold text-white">Resources by Program</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Program</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">Budget</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">Staff Hours</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">Participants</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resourcesByProgram.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No programs yet.
                  </td>
                </tr>
              ) : (
                resourcesByProgram.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{program.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                      ${(program.budget || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{program.hours || 0}</td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {(program.participants || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          program.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : program.status === "Development"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {program.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {resourcesByProgram.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-5 py-3 font-semibold text-gray-800">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">
                    ${totals.total_budget.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">{totals.total_hours}</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">
                    {totalParticipants.toLocaleString()}
                  </td>
                  <td className="px-5 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-gray-400">
        Live from Program Management → Tracking data - updates as soon as admin enters numbers there.
      </div>
    </>
  );
}
