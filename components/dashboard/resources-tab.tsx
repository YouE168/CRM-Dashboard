"use client";

import { useState, useEffect } from "react";
import { loadCMSData } from "@/lib/cms-data";

export function ResourcesTab() {
  const [cmsData, setCmsData] = useState(loadCMSData());

  useEffect(() => {
    setCmsData(loadCMSData());

    // Listen for updates from CMS Editor
    const handleStorageChange = () => {
      setCmsData(loadCMSData());
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("cmsDataUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cmsDataUpdated", handleStorageChange);
    };
  }, []);

  // Get resources by program from CMS data
  const resourcesByProgram = cmsData.resourcesByProgram?.programs || [];

  // Calculate totals from the program data (these will update when CMS changes)
  const totalBudget = resourcesByProgram.reduce(
    (sum, p) => sum + (p.budget || 0),
    0,
  );
  const totalHours = resourcesByProgram.reduce(
    (sum, p) => sum + (p.hours || 0),
    0,
  );
  const totalParticipants = resourcesByProgram.reduce(
    (sum, p) => sum + (p.participants || 0),
    0,
  );

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resources Invested</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track financial, staff, and program resources across all initiatives
        </p>
      </div>

      {/* Summary Stats Row - These come from Resources by Program totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-300 uppercase tracking-wide">
            Total Investment
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            ${totalBudget.toLocaleString()}
          </p>
        </div>
        <div className="bg-indigo-800 rounded-xl p-4">
          <p className="text-xs text-indigo-200 uppercase tracking-wide">
            Staff Hours
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalHours.toLocaleString()}
          </p>
        </div>
        <div className="bg-emerald-800 rounded-xl p-4">
          <p className="text-xs text-emerald-200 uppercase tracking-wide">
            Participants Served
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalParticipants.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Financial Resources Section - From CMS resources */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Financial Resources
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-300 uppercase tracking-wide">
              Total Budget
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${(cmsData.resources?.totalBudget || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">FY 2026</p>
          </div>
          <div className="bg-emerald-800 rounded-xl p-4">
            <p className="text-xs text-emerald-200 uppercase tracking-wide">
              Grants Received
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${(cmsData.resources?.grantsReceived || 0).toLocaleString()}
            </p>
            <p className="text-xs text-emerald-200 mt-1">76% of budget</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-4">
            <p className="text-xs text-blue-200 uppercase tracking-wide">
              Donations
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${(cmsData.resources?.donations || 0).toLocaleString()}
            </p>
            <p className="text-xs text-blue-200 mt-1">Community support</p>
          </div>
          <div className="bg-amber-800 rounded-xl p-4">
            <p className="text-xs text-amber-200 uppercase tracking-wide">
              Sponsorships
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${(cmsData.resources?.sponsorships || 0).toLocaleString()}
            </p>
            <p className="text-xs text-amber-200 mt-1">Corporate partners</p>
          </div>
        </div>
      </div>

      {/* Staff Time Section - From CMS resources */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Staff & Volunteer Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-300 uppercase tracking-wide">
              Total Hours
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {cmsData.resources?.totalHours || 0}
            </p>
            <p className="text-xs text-slate-300 mt-1">YTD</p>
          </div>
          <div className="bg-purple-800 rounded-xl p-4">
            <p className="text-xs text-purple-200 uppercase tracking-wide">
              Facilitation
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {cmsData.resources?.facilitationHours || 0}
            </p>
            <p className="text-xs text-purple-200 mt-1">34% of total</p>
          </div>
          <div className="bg-teal-800 rounded-xl p-4">
            <p className="text-xs text-teal-200 uppercase tracking-wide">
              Coordination
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {cmsData.resources?.coordinationHours || 0}
            </p>
            <p className="text-xs text-teal-200 mt-1">31% of total</p>
          </div>
          <div className="bg-rose-800 rounded-xl p-4">
            <p className="text-xs text-rose-200 uppercase tracking-wide">
              Administrative
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {cmsData.resources?.adminHours || 0}
            </p>
            <p className="text-xs text-rose-200 mt-1">35% of total</p>
          </div>
        </div>
      </div>

      {/* Resources by Program Table - Connected to CMS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-800">
          <h2 className="text-sm font-semibold text-white">
            Resources by Program
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                  Program
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                  Type
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                  Budget
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                  Hours
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600">
                  Participants
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resourcesByProgram.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-gray-400"
                  >
                    No program data available. Add programs in the CMS Resources
                    tab.
                  </td>
                </tr>
              ) : (
                resourcesByProgram.map((program, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {program.name}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          program.type === "Business Support"
                            ? "bg-blue-100 text-blue-700"
                            : program.type === "Workforce"
                              ? "bg-purple-100 text-purple-700"
                              : program.type === "Community"
                                ? "bg-green-100 text-green-700"
                                : program.type === "Media"
                                  ? "bg-pink-100 text-pink-700"
                                  : program.type === "Infrastructure"
                                    ? "bg-amber-100 text-amber-700"
                                    : program.type === "Planning"
                                      ? "bg-cyan-100 text-cyan-700"
                                      : program.type === "Capital"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {program.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-800">
                      ${(program.budget || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {program.hours || 0}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {(program.participants || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          program.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : program.status === "Capital"
                              ? "bg-blue-100 text-blue-700"
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
                  <td className="px-5 py-3 font-semibold text-gray-800">
                    Total
                  </td>
                  <td className="px-5 py-3"></td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">
                    ${totalBudget.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">
                    {totalHours}
                  </td>
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

      {/* Footer note */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Data updated quarterly • Last updated:{" "}
        {new Date(
          cmsData.resources?.lastUpdated || Date.now(),
        ).toLocaleDateString()}
      </div>
    </>
  );
}
