"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, RefreshCw, Check, Edit, X } from "lucide-react";
import {
  loadCMSData,
  saveCMSData,
  defaultCMSData,
  type CMSData,
  type AnalyticsDataPoint,
} from "@/lib/cms-data";

export default function CMSAnalyticsPage() {
  const router = useRouter();
  const [cmsData, setCmsData] = useState<CMSData>(defaultCMSData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{
    program: string;
    county: string;
    dateRange: string;
    metric: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user !== "admin@ruralcommunity.org") {
      router.push("/");
      return;
    }
    setIsAdmin(true);
    const loadedData = loadCMSData();
    setCmsData(loadedData);

    // Set default selections
    if (loadedData.programs.length > 0)
      setSelectedProgram(loadedData.programs[0]);
    if (loadedData.counties.length > 0)
      setSelectedCounty(loadedData.counties[0]);
    if (loadedData.dateRanges.length > 0)
      setSelectedDateRange(loadedData.dateRanges[0]);

    setIsLoading(false);
  }, [router]);

  const handleSave = () => {
    saveCMSData(cmsData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset all analytics data to defaults?")) {
      setCmsData(defaultCMSData);
      saveCMSData(defaultCMSData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const updateValue = (
    program: string,
    county: string,
    dateRange: string,
    metric: string,
    value: number,
  ) => {
    setCmsData((prev) => ({
      ...prev,
      analyticsData: {
        ...prev.analyticsData,
        [program]: {
          ...prev.analyticsData[program],
          [county]: {
            ...prev.analyticsData[program]?.[county],
            [dateRange]: {
              ...prev.analyticsData[program]?.[county]?.[dateRange],
              [metric]: value,
            },
          },
        },
      },
    }));
  };

  const startEdit = (
    program: string,
    county: string,
    dateRange: string,
    metric: string,
    currentValue: number,
  ) => {
    setEditingCell({ program, county, dateRange, metric });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCell) {
      updateValue(
        editingCell.program,
        editingCell.county,
        editingCell.dateRange,
        editingCell.metric,
        editValue,
      );
      setEditingCell(null);
    }
  };

  const metrics = [
    { key: "activeClients", label: "Active Clients", color: "bg-blue-50" },
    {
      key: "activeMentorMatches",
      label: "Active Mentor Matches",
      color: "bg-green-50",
    },
    {
      key: "sessionsThisMonth",
      label: "Sessions This Month",
      color: "bg-purple-50",
    },
    { key: "hoursDelivered", label: "Hours Delivered", color: "bg-amber-50" },
    {
      key: "outstandingSignatures",
      label: "Outstanding Signatures",
      color: "bg-red-50",
    },
    { key: "surveysOverdue", label: "Surveys Overdue", color: "bg-orange-50" },
    { key: "invoicesPending", label: "Invoices Pending", color: "bg-pink-50" },
  ];

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const currentData = cmsData.analyticsData[selectedProgram]?.[
    selectedCounty
  ]?.[selectedDateRange] || {
    activeClients: 0,
    activeMentorMatches: 0,
    sessionsThisMonth: 0,
    hoursDelivered: 0,
    outstandingSignatures: 0,
    surveysOverdue: 0,
    invoicesPending: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/cms-editor")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analytics Data Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Edit numbers for each Program + County + Date Range combination
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save All Changes
            </button>
          </div>
        </div>

        {isSaved && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4" />
            All changes saved successfully!
          </div>
        )}

        {/* Filter Selection Row */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Combination to Edit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cmsData.programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cmsData.counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cmsData.dateRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 mb-6">
          <p className="text-sm text-emerald-800">
            <span className="font-semibold">Currently Editing:</span>{" "}
            {selectedProgram} → {selectedCounty} → {selectedDateRange}
          </p>
        </div>

        {/* Data Entry Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Analytics Numbers for Selected Combination
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => {
                const currentValue =
                  currentData[metric.key as keyof AnalyticsDataPoint];
                const isEditing =
                  editingCell?.metric === metric.key &&
                  editingCell?.program === selectedProgram &&
                  editingCell?.county === selectedCounty &&
                  editingCell?.dateRange === selectedDateRange;

                return (
                  <div
                    key={metric.key}
                    className={`${metric.color} rounded-xl p-4 border border-gray-100`}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {metric.label}
                    </label>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) =>
                            setEditValue(parseInt(e.target.value) || 0)
                          }
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCell(null)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {currentValue.toLocaleString()}
                        </span>
                        <button
                          onClick={() =>
                            startEdit(
                              selectedProgram,
                              selectedCounty,
                              selectedDateRange,
                              metric.key,
                              currentValue,
                            )
                          }
                          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Overview Table */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Overview (Current Selection)
            </h2>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2">Metric</th>
                  <th className="text-right px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.map((metric) => (
                  <tr key={metric.key}>
                    <td className="px-4 py-2 font-medium text-gray-700">
                      {metric.label}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-gray-900">
                      {currentData[
                        metric.key as keyof AnalyticsDataPoint
                      ].toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            📝 How to use this editor
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              • Select a Program, County, and Date Range from the dropdowns
              above
            </li>
            <li>
              • Click the Edit button (✏️) next to any number to change it
            </li>
            <li>• Enter the new value and click Save (✓)</li>
            <li>• Click "Save All Changes" at the top to save everything</li>
            <li>
              • Different combinations have different numbers - each is
              independent
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
