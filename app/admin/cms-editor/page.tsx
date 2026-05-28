"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, RefreshCw, Check } from "lucide-react";
import {
  loadCMSData,
  saveCMSData,
  defaultCMSData,
  type CMSData,
} from "@/lib/cms-data";
import {
  loadReportData,
  saveReportData,
  defaultReportData,
  type ReportData,
} from "@/lib/report-data";

type TabType =
  | "overview"
  | "analytics"
  | "participants"
  | "participantsList"
  | "mentors"
  | "leadership"
  | "resources"
  | "reports";

export default function CMSEditorPage() {
  const router = useRouter();
  const [cmsData, setCmsData] = useState<CMSData>(defaultCMSData);
  const [reportData, setReportData] = useState<ReportData>(defaultReportData);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newProgram, setNewProgram] = useState("");
  const [newCounty, setNewCounty] = useState("");
  const [newDateRange, setNewDateRange] = useState("");

  // TOAST STATE
  const [toast, setToast] = useState<{
    message: string;
    type: string;
    visible: boolean;
  }>({
    message: "",
    type: "success",
    visible: false,
  });

  // TOAST FUNCTION
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ message: "", type: "success", visible: false });
    }, 3000);
  };

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user !== "admin@ruralcommunity.org") {
      router.push("/");
      return;
    }
    setIsAdmin(true);

    const loadedCmsData = loadCMSData();
    setCmsData(loadedCmsData);
    setReportData(loadReportData());
    setIsLoading(false);
  }, [router]);

  const handleSave = () => {
    const updatedCmsData = {
      ...cmsData,
      overview: { ...cmsData.overview, lastUpdated: new Date().toISOString() },
      participants: {
        ...cmsData.participants,
        lastUpdated: new Date().toISOString(),
      },
      participantsList: cmsData.participantsList,
      mentors: { ...cmsData.mentors, lastUpdated: new Date().toISOString() },
      leadership: {
        ...cmsData.leadership,
        lastUpdated: new Date().toISOString(),
      },
      resources: {
        ...cmsData.resources,
        lastUpdated: new Date().toISOString(),
      },
      resourcesByProgram: {
        ...cmsData.resourcesByProgram,
        lastUpdated: new Date().toISOString(),
      },
    };
    saveCMSData(updatedCmsData);

    const updatedReportData = {
      ...reportData,
      monthlyReport: {
        ...reportData.monthlyReport,
        lastUpdated: new Date().toISOString(),
      },
      participantReport: {
        ...reportData.participantReport,
        lastUpdated: new Date().toISOString(),
      },
      mentorReport: {
        ...reportData.mentorReport,
        lastUpdated: new Date().toISOString(),
      },
      outcomeReport: {
        ...reportData.outcomeReport,
        lastUpdated: new Date().toISOString(),
      },
      financialReport: {
        ...reportData.financialReport,
        lastUpdated: new Date().toISOString(),
      },
      countyReport: {
        ...reportData.countyReport,
        lastUpdated: new Date().toISOString(),
      },
    };
    saveReportData(updatedReportData);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset all data to defaults?")) {
      setCmsData(defaultCMSData);
      setReportData(defaultReportData);
      saveCMSData(defaultCMSData);
      saveReportData(defaultReportData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const addProgram = () => {
    if (newProgram.trim() && !cmsData.programs.includes(newProgram.trim())) {
      setCmsData({
        ...cmsData,
        programs: [...cmsData.programs, newProgram.trim()],
      });
      setNewProgram("");
    }
  };

  const removeProgram = (index: number) => {
    const newPrograms = cmsData.programs.filter((_, i) => i !== index);
    setCmsData({ ...cmsData, programs: newPrograms });
  };

  const addCounty = () => {
    if (newCounty.trim() && !cmsData.counties.includes(newCounty.trim())) {
      setCmsData({
        ...cmsData,
        counties: [...cmsData.counties, newCounty.trim()],
      });
      setNewCounty("");
    }
  };

  const removeCounty = (index: number) => {
    const newCounties = cmsData.counties.filter((_, i) => i !== index);
    setCmsData({ ...cmsData, counties: newCounties });
  };

  const addDateRange = () => {
    if (
      newDateRange.trim() &&
      !cmsData.dateRanges.includes(newDateRange.trim())
    ) {
      setCmsData({
        ...cmsData,
        dateRanges: [...cmsData.dateRanges, newDateRange.trim()],
      });
      setNewDateRange("");
    }
  };

  const removeDateRange = (index: number) => {
    const newRanges = cmsData.dateRanges.filter((_, i) => i !== index);
    setCmsData({ ...cmsData, dateRanges: newRanges });
  };

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "participants", label: "Participants", icon: "👥" },
    { id: "participantsList", label: "Participants List", icon: "📋" },
    { id: "mentors", label: "Mentors", icon: "👨‍🏫" },
    { id: "leadership", label: "Leadership", icon: "🏆" },
    { id: "resources", label: "Resources", icon: "💰" },
    { id: "reports", label: "Reports Data", icon: "📊" },
  ];

  const programs = cmsData.programs || [];
  const counties = cmsData.counties || [];
  const dateRanges = cmsData.dateRanges || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Content Management System
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Edit all numbers and text across the dashboard
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

        {/* Save Success Notification */}
        {isSaved && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4" />
            All changes saved successfully!
          </div>
        )}

        {/* Toast Notification for CSV Export */}
        {toast.visible && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-green-50 text-green-600 border border-green-200"
                : toast.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
            }`}
          >
            <Check className="h-4 w-4" />
            {toast.message}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Overview Page Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Participants
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.totalParticipants ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        totalParticipants: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participants Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.participantsTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        participantsTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Mentors
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.activeMentors ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        activeMentors: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentors Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.mentorsTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        mentorsTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sessions This Month
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.sessionsThisMonth ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        sessionsThisMonth: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sessions Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.sessionsTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        sessionsTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Satisfaction (%)
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.avgSatisfaction ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        avgSatisfaction: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satisfaction Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.overview?.satisfactionTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      overview: {
                        ...cmsData.overview,
                        satisfactionTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    📊 Analytics Data Management
                  </h2>
                  <p className="text-sm text-gray-600">
                    Edit numbers for each Program + County + Date Range
                    combination
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Different programs, counties, and date ranges can have
                    different values.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/admin/cms-analytics")}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <span>📊</span>
                  Go to Analytics Data Editor →
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Programs List
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                These programs appear in the filter dropdowns
              </p>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newProgram}
                  onChange={(e) => setNewProgram(e.target.value)}
                  placeholder="New program name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={addProgram}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Program
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {programs.map((program, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">{program}</span>
                    <button
                      onClick={() => removeProgram(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📍 Counties List
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                These counties appear in the filter dropdowns
              </p>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newCounty}
                  onChange={(e) => setNewCounty(e.target.value)}
                  placeholder="New county name"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={addCounty}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add County
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {counties.map((county, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">{county}</span>
                    <button
                      onClick={() => removeCounty(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📅 Date Ranges
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                These date ranges appear in the filter dropdowns
              </p>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newDateRange}
                  onChange={(e) => setNewDateRange(e.target.value)}
                  placeholder="New date range"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                />
                <button
                  onClick={addDateRange}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Date Range
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dateRanges.map((range, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">{range}</span>
                    <button
                      onClick={() => removeDateRange(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === "participants" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Participants Page Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Participants
                </label>
                <input
                  type="number"
                  value={cmsData.participants?.total ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      participants: {
                        ...cmsData.participants,
                        total: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Participants
                </label>
                <input
                  type="number"
                  value={cmsData.participants?.active ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      participants: {
                        ...cmsData.participants,
                        active: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onboarding Participants
                </label>
                <input
                  type="number"
                  value={cmsData.participants?.onboarding ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      participants: {
                        ...cmsData.participants,
                        onboarding: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alumni
                </label>
                <input
                  type="number"
                  value={cmsData.participants?.alumni ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      participants: {
                        ...cmsData.participants,
                        alumni: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Participants List Tab */}
        {activeTab === "participantsList" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  👥 Participants List
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Add, edit, or remove participants. Changes appear on Overview
                  and Participants pages.
                </p>
              </div>
              <button
                onClick={() => {
                  const newId = Date.now().toString();
                  const newParticipant = {
                    id: newId,
                    name: "New Participant",
                    program:
                      cmsData.programs[0] ||
                      "RCP Small Business Mentorship Program",
                    county: cmsData.counties[0] || "Linn",
                    stage: "Active",
                    mentor: "TBD",
                    enrolledDate: new Date().toISOString().split("T")[0],
                  };
                  setCmsData({
                    ...cmsData,
                    participantsList: [
                      ...(cmsData.participantsList || []),
                      newParticipant,
                    ],
                  });
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <span>+</span> Add Participant
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Program</th>
                    <th className="text-left px-3 py-2">County</th>
                    <th className="text-left px-3 py-2">Stage</th>
                    <th className="text-left px-3 py-2">Mentor</th>
                    <th className="text-left px-3 py-2">Enrolled Date</th>
                    <th className="text-center px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(cmsData.participantsList || []).map((participant, idx) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={participant.name}
                          onChange={(e) => {
                            const newList = [
                              ...(cmsData.participantsList || []),
                            ];
                            newList[idx] = {
                              ...newList[idx],
                              name: e.target.value,
                            };
                            setCmsData({
                              ...cmsData,
                              participantsList: newList,
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={participant.program}
                          onChange={(e) => {
                            const newList = [
                              ...(cmsData.participantsList || []),
                            ];
                            newList[idx] = {
                              ...newList[idx],
                              program: e.target.value,
                            };
                            setCmsData({
                              ...cmsData,
                              participantsList: newList,
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          {cmsData.programs.map((prog) => (
                            <option key={prog} value={prog}>
                              {prog}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={participant.county}
                          onChange={(e) => {
                            const newList = [
                              ...(cmsData.participantsList || []),
                            ];
                            newList[idx] = {
                              ...newList[idx],
                              county: e.target.value,
                            };
                            setCmsData({
                              ...cmsData,
                              participantsList: newList,
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          {cmsData.counties.map((county) => (
                            <option key={county} value={county}>
                              {county}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={participant.stage}
                          onChange={(e) => {
                            const newList = [
                              ...(cmsData.participantsList || []),
                            ];
                            newList[idx] = {
                              ...newList[idx],
                              stage: e.target.value,
                            };
                            setCmsData({
                              ...cmsData,
                              participantsList: newList,
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          <option value="Active">Active</option>
                          <option value="Onboarding">Onboarding</option>
                          <option value="Completing">Completing</option>
                          <option value="Matched">Matched</option>
                          <option value="Alumni">Alumni</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={participant.mentor}
                          onChange={(e) => {
                            const newList = [
                              ...(cmsData.participantsList || []),
                            ];
                            newList[idx] = {
                              ...newList[idx],
                              mentor: e.target.value,
                            };
                            setCmsData({
                              ...cmsData,
                              participantsList: newList,
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          placeholder="Mentor name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={participant.enrolledDate || ""}
                          onChange={(e) => {
                            const newList = [
                              ...(cmsData.participantsList || []),
                            ];
                            newList[idx] = {
                              ...newList[idx],
                              enrolledDate: e.target.value,
                            };
                            setCmsData({
                              ...cmsData,
                              participantsList: newList,
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Remove "${participant.name}" from participants?`,
                              )
                            ) {
                              const newList = (
                                cmsData.participantsList || []
                              ).filter((_, i) => i !== idx);
                              setCmsData({
                                ...cmsData,
                                participantsList: newList,
                              });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete participant"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!cmsData.participantsList ||
              cmsData.participantsList.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                No participants yet. Click "Add Participant" to get started.
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  const headers = [
                    "Name",
                    "Program",
                    "County",
                    "Stage",
                    "Mentor",
                    "Enrolled Date",
                  ];
                  const csvData = (cmsData.participantsList || []).map((p) => [
                    p.name,
                    p.program,
                    p.county,
                    p.stage,
                    p.mentor,
                    p.enrolledDate || "",
                  ]);
                  const csvContent = [headers, ...csvData]
                    .map((row) => row.join(","))
                    .join("\n");
                  const blob = new Blob([csvContent], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `participants_export_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast("Participants exported to CSV!", "success");
                }}
                className="px-4 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                📥 Export to CSV
              </button>
              <p className="text-xs text-gray-400">
                Total: {(cmsData.participantsList || []).length} participants
              </p>
            </div>
          </div>
        )}

        {/* Mentors Tab */}
        {activeTab === "mentors" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mentors Page Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Mentors
                </label>
                <input
                  type="number"
                  value={cmsData.mentors?.total ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      mentors: {
                        ...cmsData.mentors,
                        total: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Mentors
                </label>
                <input
                  type="number"
                  value={cmsData.mentors?.active ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      mentors: {
                        ...cmsData.mentors,
                        active: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Matches
                </label>
                <input
                  type="number"
                  value={cmsData.mentors?.activeMatches ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      mentors: {
                        ...cmsData.mentors,
                        activeMatches: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matches Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.mentors?.matchesTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      mentors: {
                        ...cmsData.mentors,
                        matchesTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cmsData.mentors?.avgRating ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      mentors: {
                        ...cmsData.mentors,
                        avgRating: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Leadership Tab */}
        {activeTab === "leadership" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Leadership Roundtable Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Members
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.totalMembers ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        totalMembers: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Members Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.membersTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        membersTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Signups
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.newSignups ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        newSignups: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Signups Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.signupsTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        signupsTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avg Attendance (%)
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.avgAttendance ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        avgAttendance: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.attendanceTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        attendanceTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Satisfaction (%)
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.memberSatisfaction ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        memberSatisfaction: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satisfaction Trend (+%)
                </label>
                <input
                  type="number"
                  value={cmsData.leadership?.satisfactionTrend ?? 0}
                  onChange={(e) =>
                    setCmsData({
                      ...cmsData,
                      leadership: {
                        ...cmsData.leadership,
                        satisfactionTrend: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === "resources" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resources Page Numbers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Budget ($)
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.totalBudget ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          totalBudget: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grants Received ($)
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.grantsReceived ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          grantsReceived: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Donations ($)
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.donations ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          donations: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sponsorships ($)
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.sponsorships ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          sponsorships: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Hours
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.totalHours ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          totalHours: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facilitation Hours
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.facilitationHours ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          facilitationHours: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coordination Hours
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.coordinationHours ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          coordinationHours: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Administrative Hours
                  </label>
                  <input
                    type="number"
                    value={cmsData.resources?.adminHours ?? 0}
                    onChange={(e) =>
                      setCmsData({
                        ...cmsData,
                        resources: {
                          ...cmsData.resources,
                          adminHours: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Resources by Program
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Edit program resources below (these affect totals on Resources
                page)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Program Name</th>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Budget ($)</th>
                      <th className="text-left px-3 py-2">Staff Hours</th>
                      <th className="text-left px-3 py-2">Participants</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-center px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cmsData.resourcesByProgram?.programs || []).map(
                      (program, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={program.name}
                              onChange={(e) => {
                                const newPrograms = [
                                  ...(cmsData.resourcesByProgram?.programs ||
                                    []),
                                ];
                                newPrograms[idx] = {
                                  ...newPrograms[idx],
                                  name: e.target.value,
                                };
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 border border-gray-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={program.type}
                              onChange={(e) => {
                                const newPrograms = [
                                  ...(cmsData.resourcesByProgram?.programs ||
                                    []),
                                ];
                                newPrograms[idx] = {
                                  ...newPrograms[idx],
                                  type: e.target.value,
                                };
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 border border-gray-200 rounded"
                            >
                              <option>Business Support</option>
                              <option>Workforce</option>
                              <option>Community</option>
                              <option>Media</option>
                              <option>Infrastructure</option>
                              <option>Planning</option>
                              <option>Capital</option>
                              <option>Strategic</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={program.budget}
                              onChange={(e) => {
                                const newPrograms = [
                                  ...(cmsData.resourcesByProgram?.programs ||
                                    []),
                                ];
                                newPrograms[idx] = {
                                  ...newPrograms[idx],
                                  budget: parseInt(e.target.value) || 0,
                                };
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="w-24 px-2 py-1 border border-gray-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={program.hours}
                              onChange={(e) => {
                                const newPrograms = [
                                  ...(cmsData.resourcesByProgram?.programs ||
                                    []),
                                ];
                                newPrograms[idx] = {
                                  ...newPrograms[idx],
                                  hours: parseInt(e.target.value) || 0,
                                };
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="w-24 px-2 py-1 border border-gray-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={program.participants}
                              onChange={(e) => {
                                const newPrograms = [
                                  ...(cmsData.resourcesByProgram?.programs ||
                                    []),
                                ];
                                newPrograms[idx] = {
                                  ...newPrograms[idx],
                                  participants: parseInt(e.target.value) || 0,
                                };
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="w-24 px-2 py-1 border border-gray-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={program.status}
                              onChange={(e) => {
                                const newPrograms = [
                                  ...(cmsData.resourcesByProgram?.programs ||
                                    []),
                                ];
                                newPrograms[idx] = {
                                  ...newPrograms[idx],
                                  status: e.target.value,
                                };
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 border border-gray-200 rounded"
                            >
                              <option>Active</option>
                              <option>Capital</option>
                              <option>Development</option>
                              <option>Strategic</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => {
                                const newPrograms = (
                                  cmsData.resourcesByProgram?.programs || []
                                ).filter((_, i) => i !== idx);
                                setCmsData({
                                  ...cmsData,
                                  resourcesByProgram: {
                                    ...cmsData.resourcesByProgram,
                                    programs: newPrograms,
                                  },
                                });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => {
                  const newPrograms = [
                    ...(cmsData.resourcesByProgram?.programs || []),
                    {
                      name: "New Program",
                      budget: 0,
                      hours: 0,
                      participants: 0,
                      status: "Active",
                      type: "Business Support",
                    },
                  ];
                  setCmsData({
                    ...cmsData,
                    resourcesByProgram: {
                      ...cmsData.resourcesByProgram,
                      programs: newPrograms,
                    },
                  });
                }}
                className="mt-4 text-sm text-emerald-600 hover:text-emerald-700"
              >
                + Add Program
              </button>
            </div>
          </div>
        )}

        {/* Reports Tab - Simplified version */}
        {activeTab === "reports" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Report Data
            </h2>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                Report editing is available. Use the CMS to manage all report
                data including monthly reports, participant progress, mentor
                activity, financial summaries, outcome metrics, and county
                distribution.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            📝 How to use this CMS
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Edit any number in any tab above</li>
            <li>• Click "Save All Changes" when done</li>
            <li>• Changes appear immediately on the live dashboard</li>
            <li>• Click "Reset to Defaults" to restore original data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
