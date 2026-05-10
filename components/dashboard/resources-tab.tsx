"use client";

import { DollarSign, Clock, Users, TrendingUp, BarChart3 } from "lucide-react";

export function ResourcesTab() {
  const financialResources = {
    totalBudget: 245000,
    grantsReceived: 187500,
    donations: 32500,
    sponsorships: 25000,
  };

  const staffTime = {
    totalHours: 1240,
    facilitationHours: 420,
    coordinationHours: 380,
    adminHours: 440,
  };

  const resourcesByProgram = [
    {
      name: "RCP Small Business Mentorship",
      budget: 45000,
      hours: 320,
      participants: 45,
      status: "Active",
      type: "Business Support",
    },
    {
      name: "SEED Micro-Grant Program",
      budget: 35000,
      hours: 180,
      participants: 28,
      status: "Active",
      type: "Business Support",
    },
    {
      name: "Business Technical Assistance Hub",
      budget: 28000,
      hours: 240,
      participants: 32,
      status: "Active",
      type: "Business Support",
    },
    {
      name: "Parker Dewey Micro-Internship",
      budget: 25000,
      hours: 120,
      participants: 24,
      status: "Active",
      type: "Workforce",
    },
    {
      name: "Workforce Development & Navigation",
      budget: 32000,
      hours: 200,
      participants: 56,
      status: "Active",
      type: "Workforce",
    },
    {
      name: "Local Health Equity Action Teams",
      budget: 28000,
      hours: 180,
      participants: 45,
      status: "Active",
      type: "Community",
    },
    {
      name: "Coalition Leadership Roundtable",
      budget: 15000,
      hours: 60,
      participants: 24,
      status: "Active",
      type: "Community",
    },
    {
      name: "Rural Connect Magazine",
      budget: 18000,
      hours: 80,
      participants: 6000,
      status: "Active",
      type: "Media",
    },
    {
      name: "Park & Community Space Upgrades",
      budget: 75000,
      hours: 40,
      participants: 0,
      status: "Capital",
      type: "Infrastructure",
    },
    {
      name: "Cost Benefit & Feasibility Studies",
      budget: 12000,
      hours: 60,
      participants: 8,
      status: "Active",
      type: "Planning",
    },
    {
      name: "Microloan Program",
      budget: 50000,
      hours: 100,
      participants: 0,
      status: "Development",
      type: "Capital",
    },
    {
      name: "MAZK Initiative",
      budget: 25000,
      hours: 80,
      participants: 12,
      status: "Strategic",
      type: "Strategic",
    },
  ];

  // Calculate totals
  const totalBudget = resourcesByProgram.reduce((sum, p) => sum + p.budget, 0);
  const totalHours = resourcesByProgram.reduce((sum, p) => sum + p.hours, 0);
  const totalParticipants = resourcesByProgram.reduce(
    (sum, p) => sum + p.participants,
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

      {/* Summary Stats Row - 3 different dark colors */}
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

      {/* Financial Resources Section - all different colors */}
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
              ${financialResources.totalBudget.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">FY 2026</p>
          </div>
          <div className="bg-emerald-800 rounded-xl p-4">
            <p className="text-xs text-emerald-200 uppercase tracking-wide">
              Grants Received
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.grantsReceived.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-200 mt-1">76% of budget</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-4">
            <p className="text-xs text-blue-200 uppercase tracking-wide">
              Donations
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.donations.toLocaleString()}
            </p>
            <p className="text-xs text-blue-200 mt-1">Community support</p>
          </div>
          <div className="bg-amber-800 rounded-xl p-4">
            <p className="text-xs text-amber-200 uppercase tracking-wide">
              Sponsorships
            </p>
            <p className="text-xl font-bold text-white mt-1">
              ${financialResources.sponsorships.toLocaleString()}
            </p>
            <p className="text-xs text-amber-200 mt-1">Corporate partners</p>
          </div>
        </div>
      </div>

      {/* Staff Time Section - all different colors */}
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
              {staffTime.totalHours}
            </p>
            <p className="text-xs text-slate-300 mt-1">YTD</p>
          </div>
          <div className="bg-purple-800 rounded-xl p-4">
            <p className="text-xs text-purple-200 uppercase tracking-wide">
              Facilitation
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.facilitationHours}
            </p>
            <p className="text-xs text-purple-200 mt-1">34% of total</p>
          </div>
          <div className="bg-teal-800 rounded-xl p-4">
            <p className="text-xs text-teal-200 uppercase tracking-wide">
              Coordination
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.coordinationHours}
            </p>
            <p className="text-xs text-teal-200 mt-1">31% of total</p>
          </div>
          <div className="bg-rose-800 rounded-xl p-4">
            <p className="text-xs text-rose-200 uppercase tracking-wide">
              Administrative
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {staffTime.adminHours}
            </p>
            <p className="text-xs text-rose-200 mt-1">35% of total</p>
          </div>
        </div>
      </div>

      {/* Budget Utilization Bar */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800">
            Budget Utilization
          </h2>
          <span className="text-sm font-bold text-gray-800">68%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-slate-700 h-2 rounded-full"
            style={{ width: "68%" }}
          ></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
            <span className="text-gray-500">Personnel:</span>
            <span className="font-medium text-gray-800">$45,200</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
            <span className="text-gray-500">Programming:</span>
            <span className="font-medium text-gray-800">$32,500</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
            <span className="text-gray-500">Operations:</span>
            <span className="font-medium text-gray-800">$28,300</span>
          </div>
          <div className="flex justify-between p-2 bg-gray-100 rounded-lg">
            <span className="text-gray-500">Marketing:</span>
            <span className="font-medium text-gray-800">$18,500</span>
          </div>
        </div>
      </div>

      {/* Program Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-slate-800">
          <h2 className="text-sm font-semibold text-white">
            Resources by Program
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Program
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Budget
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Hours
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Participants
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resourcesByProgram.map((program, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {program.name}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
                      {program.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-800">
                    ${program.budget.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {program.hours}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {program.participants.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs ${
                        program.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {program.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-5 py-3 font-semibold text-gray-800">Total</td>
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
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Data updated quarterly • Last updated: May 2026
      </div>
    </>
  );
}
