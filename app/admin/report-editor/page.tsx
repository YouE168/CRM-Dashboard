"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, RefreshCw, Check } from "lucide-react";

interface ReportData {
  monthlyReport: {
    totalParticipants: number;
    sessions: number;
    satisfaction: number;
    highlights: string[];
    lastUpdated: string;
  };
  participantReport: {
    participants: Array<{
      name: string;
      program: string;
      stage: string;
      progress: number;
    }>;
    lastUpdated: string;
  };
  mentorReport: {
    mentors: Array<{
      name: string;
      sessions: number;
      hours: number;
      rating: number;
      mentees: number;
    }>;
    lastUpdated: string;
  };
  outcomeReport: {
    businessLaunches: number;
    satisfaction: number;
    mentorMatches: number;
    referrals: number;
    successStory: string;
    lastUpdated: string;
  };
  financialReport: {
    grants: number;
    donations: number;
    totalRevenue: number;
    personnel: number;
    programming: number;
    operations: number;
    totalExpenses: number;
    netSurplus: number;
    pendingInvoices: number;
    pendingAmount: number;
    lastUpdated: string;
  };
  countyReport: {
    counties: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
    lastUpdated: string;
  };
}

const defaultReportData: ReportData = {
  monthlyReport: {
    totalParticipants: 124,
    sessions: 156,
    satisfaction: 94,
    highlights: [
      "12 new participants joined this month",
      "8 businesses launched through the program",
      "3 new mentors completed training",
      "92% of participants would recommend the program",
    ],
    lastUpdated: new Date().toISOString(),
  },
  participantReport: {
    participants: [
      {
        name: "Sarah Johnson",
        program: "Business Catalyst",
        stage: "Active",
        progress: 75,
      },
      {
        name: "James Williams",
        program: "Youth Mentorship",
        stage: "Onboarding",
        progress: 30,
      },
      {
        name: "Maria Garcia",
        program: "Women Entrepreneurs",
        stage: "Active",
        progress: 60,
      },
      {
        name: "Robert Davis",
        program: "Veterans Initiative",
        stage: "Completing",
        progress: 90,
      },
      {
        name: "Emily Brown",
        program: "Business Catalyst",
        stage: "Active",
        progress: 45,
      },
    ],
    lastUpdated: new Date().toISOString(),
  },
  mentorReport: {
    mentors: [
      {
        name: "Michael Chen",
        sessions: 24,
        hours: 48,
        rating: 4.9,
        mentees: 8,
      },
      {
        name: "Lisa Thompson",
        sessions: 18,
        hours: 36,
        rating: 4.7,
        mentees: 6,
      },
      { name: "David Park", sessions: 15, hours: 30, rating: 4.8, mentees: 5 },
      {
        name: "Jennifer Lee",
        sessions: 21,
        hours: 42,
        rating: 4.6,
        mentees: 7,
      },
      {
        name: "Tom Anderson",
        sessions: 12,
        hours: 24,
        rating: 4.5,
        mentees: 4,
      },
    ],
    lastUpdated: new Date().toISOString(),
  },
  outcomeReport: {
    businessLaunches: 18,
    satisfaction: 94,
    mentorMatches: 89,
    referrals: 12,
    successStory:
      "8 new businesses launched with mentor support. $124,500 in capital accessed by participants.",
    lastUpdated: new Date().toISOString(),
  },
  financialReport: {
    grants: 124500,
    donations: 18200,
    totalRevenue: 142700,
    personnel: 45200,
    programming: 32500,
    operations: 28300,
    totalExpenses: 106000,
    netSurplus: 36700,
    pendingInvoices: 5,
    pendingAmount: 12450,
    lastUpdated: new Date().toISOString(),
  },
  countyReport: {
    counties: [
      { name: "Bourbon", count: 31, percentage: 14 },
      { name: "Cherokee", count: 27, percentage: 12 },
      { name: "Linn", count: 24, percentage: 11 },
      { name: "Labette", count: 24, percentage: 11 },
      { name: "Neosho", count: 22, percentage: 10 },
      { name: "Wilson", count: 20, percentage: 9 },
      { name: "Allen", count: 19, percentage: 9 },
      { name: "Crawford", count: 18, percentage: 8 },
      { name: "Greenwood", count: 16, percentage: 7 },
      { name: "Montgomery", count: 15, percentage: 7 },
      { name: "Woodson", count: 12, percentage: 5 },
    ],
    lastUpdated: new Date().toISOString(),
  },
};

function loadReportData(): ReportData {
  if (typeof window === "undefined") return defaultReportData;
  const saved = localStorage.getItem("reportData");
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultReportData;
}

function saveReportData(data: ReportData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("reportData", JSON.stringify(data));
}

export default function ReportEditorPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData>(defaultReportData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user !== "admin@ruralcommunity.org") {
      router.push("/");
      return;
    }
    setIsAdmin(true);

    const reportData = loadReportData();
    setData(reportData);
    setIsLoading(false);
  }, [router]);

  const handleSave = () => {
    const updatedData = {
      ...data,
      monthlyReport: {
        ...data.monthlyReport,
        lastUpdated: new Date().toISOString(),
      },
      participantReport: {
        ...data.participantReport,
        lastUpdated: new Date().toISOString(),
      },
      mentorReport: {
        ...data.mentorReport,
        lastUpdated: new Date().toISOString(),
      },
      outcomeReport: {
        ...data.outcomeReport,
        lastUpdated: new Date().toISOString(),
      },
      financialReport: {
        ...data.financialReport,
        lastUpdated: new Date().toISOString(),
      },
      countyReport: {
        ...data.countyReport,
        lastUpdated: new Date().toISOString(),
      },
    };
    saveReportData(updatedData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset all report data to defaults?")) {
      setData(defaultReportData);
      saveReportData(defaultReportData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
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
                Report Editor
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Edit numbers and text for all reports
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

        {/* Monthly Report Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Program Report
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Participants
                </label>
                <input
                  type="number"
                  value={data.monthlyReport.totalParticipants}
                  onChange={(e) =>
                    setData({
                      ...data,
                      monthlyReport: {
                        ...data.monthlyReport,
                        totalParticipants: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sessions
                </label>
                <input
                  type="number"
                  value={data.monthlyReport.sessions}
                  onChange={(e) =>
                    setData({
                      ...data,
                      monthlyReport: {
                        ...data.monthlyReport,
                        sessions: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satisfaction (%)
                </label>
                <input
                  type="number"
                  value={data.monthlyReport.satisfaction}
                  onChange={(e) =>
                    setData({
                      ...data,
                      monthlyReport: {
                        ...data.monthlyReport,
                        satisfaction: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Highlights (one per line)
              </label>
              <textarea
                value={data.monthlyReport.highlights.join("\n")}
                onChange={(e) =>
                  setData({
                    ...data,
                    monthlyReport: {
                      ...data.monthlyReport,
                      highlights: e.target.value
                        .split("\n")
                        .filter((h) => h.trim()),
                    },
                  })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Participant Report Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Participant Progress Report
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Program</th>
                    <th className="text-left px-3 py-2">Stage</th>
                    <th className="text-left px-3 py-2">Progress (%)</th>
                    <th className="text-center px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.participantReport.participants.map(
                    (participant, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={participant.name}
                            onChange={(e) => {
                              const newParticipants = [
                                ...data.participantReport.participants,
                              ];
                              newParticipants[idx].name = e.target.value;
                              setData({
                                ...data,
                                participantReport: {
                                  ...data.participantReport,
                                  participants: newParticipants,
                                },
                              });
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={participant.program}
                            onChange={(e) => {
                              const newParticipants = [
                                ...data.participantReport.participants,
                              ];
                              newParticipants[idx].program = e.target.value;
                              setData({
                                ...data,
                                participantReport: {
                                  ...data.participantReport,
                                  participants: newParticipants,
                                },
                              });
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          >
                            <option>Business Catalyst</option>
                            <option>Youth Mentorship</option>
                            <option>Women Entrepreneurs</option>
                            <option>Veterans Initiative</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={participant.stage}
                            onChange={(e) => {
                              const newParticipants = [
                                ...data.participantReport.participants,
                              ];
                              newParticipants[idx].stage = e.target.value;
                              setData({
                                ...data,
                                participantReport: {
                                  ...data.participantReport,
                                  participants: newParticipants,
                                },
                              });
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          >
                            <option>Active</option>
                            <option>Onboarding</option>
                            <option>Completing</option>
                            <option>Alumni</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={participant.progress}
                            onChange={(e) => {
                              const newParticipants = [
                                ...data.participantReport.participants,
                              ];
                              newParticipants[idx].progress = parseInt(
                                e.target.value,
                              );
                              setData({
                                ...data,
                                participantReport: {
                                  ...data.participantReport,
                                  participants: newParticipants,
                                },
                              });
                            }}
                            className="w-20 px-2 py-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => {
                              const newParticipants =
                                data.participantReport.participants.filter(
                                  (_, i) => i !== idx,
                                );
                              setData({
                                ...data,
                                participantReport: {
                                  ...data.participantReport,
                                  participants: newParticipants,
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
                const newParticipants = [
                  ...data.participantReport.participants,
                  {
                    name: "New Participant",
                    program: "Business Catalyst",
                    stage: "Active",
                    progress: 0,
                  },
                ];
                setData({
                  ...data,
                  participantReport: {
                    ...data.participantReport,
                    participants: newParticipants,
                  },
                });
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              + Add Participant
            </button>
          </div>
        </div>

        {/* Mentor Report Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Mentor Activity Report
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Sessions</th>
                    <th className="text-left px-3 py-2">Hours</th>
                    <th className="text-left px-3 py-2">Rating</th>
                    <th className="text-left px-3 py-2">Mentees</th>
                    <th className="text-center px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.mentorReport.mentors.map((mentor, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={mentor.name}
                          onChange={(e) => {
                            const newMentors = [...data.mentorReport.mentors];
                            newMentors[idx].name = e.target.value;
                            setData({
                              ...data,
                              mentorReport: {
                                ...data.mentorReport,
                                mentors: newMentors,
                              },
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={mentor.sessions}
                          onChange={(e) => {
                            const newMentors = [...data.mentorReport.mentors];
                            newMentors[idx].sessions = parseInt(e.target.value);
                            setData({
                              ...data,
                              mentorReport: {
                                ...data.mentorReport,
                                mentors: newMentors,
                              },
                            });
                          }}
                          className="w-20 px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={mentor.hours}
                          onChange={(e) => {
                            const newMentors = [...data.mentorReport.mentors];
                            newMentors[idx].hours = parseInt(e.target.value);
                            setData({
                              ...data,
                              mentorReport: {
                                ...data.mentorReport,
                                mentors: newMentors,
                              },
                            });
                          }}
                          className="w-20 px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.1"
                          value={mentor.rating}
                          onChange={(e) => {
                            const newMentors = [...data.mentorReport.mentors];
                            newMentors[idx].rating = parseFloat(e.target.value);
                            setData({
                              ...data,
                              mentorReport: {
                                ...data.mentorReport,
                                mentors: newMentors,
                              },
                            });
                          }}
                          className="w-20 px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={mentor.mentees}
                          onChange={(e) => {
                            const newMentors = [...data.mentorReport.mentors];
                            newMentors[idx].mentees = parseInt(e.target.value);
                            setData({
                              ...data,
                              mentorReport: {
                                ...data.mentorReport,
                                mentors: newMentors,
                              },
                            });
                          }}
                          className="w-20 px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            const newMentors = data.mentorReport.mentors.filter(
                              (_, i) => i !== idx,
                            );
                            setData({
                              ...data,
                              mentorReport: {
                                ...data.mentorReport,
                                mentors: newMentors,
                              },
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => {
                const newMentors = [
                  ...data.mentorReport.mentors,
                  {
                    name: "New Mentor",
                    sessions: 0,
                    hours: 0,
                    rating: 0,
                    mentees: 0,
                  },
                ];
                setData({
                  ...data,
                  mentorReport: { ...data.mentorReport, mentors: newMentors },
                });
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              + Add Mentor
            </button>
          </div>
        </div>

        {/* Outcome Report Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Outcome Metrics Report
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Launches
                </label>
                <input
                  type="number"
                  value={data.outcomeReport.businessLaunches}
                  onChange={(e) =>
                    setData({
                      ...data,
                      outcomeReport: {
                        ...data.outcomeReport,
                        businessLaunches: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Satisfaction (%)
                </label>
                <input
                  type="number"
                  value={data.outcomeReport.satisfaction}
                  onChange={(e) =>
                    setData({
                      ...data,
                      outcomeReport: {
                        ...data.outcomeReport,
                        satisfaction: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentor Matches
                </label>
                <input
                  type="number"
                  value={data.outcomeReport.mentorMatches}
                  onChange={(e) =>
                    setData({
                      ...data,
                      outcomeReport: {
                        ...data.outcomeReport,
                        mentorMatches: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Referrals
                </label>
                <input
                  type="number"
                  value={data.outcomeReport.referrals}
                  onChange={(e) =>
                    setData({
                      ...data,
                      outcomeReport: {
                        ...data.outcomeReport,
                        referrals: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Success Story Text
              </label>
              <textarea
                value={data.outcomeReport.successStory}
                onChange={(e) =>
                  setData({
                    ...data,
                    outcomeReport: {
                      ...data.outcomeReport,
                      successStory: e.target.value,
                    },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Financial Report Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Financial Summary
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Revenue
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Grants ($)
                    </label>
                    <input
                      type="number"
                      value={data.financialReport.grants}
                      onChange={(e) =>
                        setData({
                          ...data,
                          financialReport: {
                            ...data.financialReport,
                            grants: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Donations ($)
                    </label>
                    <input
                      type="number"
                      value={data.financialReport.donations}
                      onChange={(e) =>
                        setData({
                          ...data,
                          financialReport: {
                            ...data.financialReport,
                            donations: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Expenses
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Personnel ($)
                    </label>
                    <input
                      type="number"
                      value={data.financialReport.personnel}
                      onChange={(e) =>
                        setData({
                          ...data,
                          financialReport: {
                            ...data.financialReport,
                            personnel: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Programming ($)
                    </label>
                    <input
                      type="number"
                      value={data.financialReport.programming}
                      onChange={(e) =>
                        setData({
                          ...data,
                          financialReport: {
                            ...data.financialReport,
                            programming: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Operations ($)
                    </label>
                    <input
                      type="number"
                      value={data.financialReport.operations}
                      onChange={(e) =>
                        setData({
                          ...data,
                          financialReport: {
                            ...data.financialReport,
                            operations: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Pending Invoices (count)
                </label>
                <input
                  type="number"
                  value={data.financialReport.pendingInvoices}
                  onChange={(e) =>
                    setData({
                      ...data,
                      financialReport: {
                        ...data.financialReport,
                        pendingInvoices: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Pending Amount ($)
                </label>
                <input
                  type="number"
                  value={data.financialReport.pendingAmount}
                  onChange={(e) =>
                    setData({
                      ...data,
                      financialReport: {
                        ...data.financialReport,
                        pendingAmount: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* County Report Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              County Distribution Report
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">County</th>
                    <th className="text-left px-3 py-2">Participants</th>
                    <th className="text-left px-3 py-2">Percentage (%)</th>
                    <th className="text-center px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.countyReport.counties.map((county, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={county.name}
                          onChange={(e) => {
                            const newCounties = [...data.countyReport.counties];
                            newCounties[idx].name = e.target.value;
                            setData({
                              ...data,
                              countyReport: {
                                ...data.countyReport,
                                counties: newCounties,
                              },
                            });
                          }}
                          className="w-full px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={county.count}
                          onChange={(e) => {
                            const newCounties = [...data.countyReport.counties];
                            newCounties[idx].count = parseInt(e.target.value);
                            setData({
                              ...data,
                              countyReport: {
                                ...data.countyReport,
                                counties: newCounties,
                              },
                            });
                          }}
                          className="w-24 px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={county.percentage}
                          onChange={(e) => {
                            const newCounties = [...data.countyReport.counties];
                            newCounties[idx].percentage = parseInt(
                              e.target.value,
                            );
                            setData({
                              ...data,
                              countyReport: {
                                ...data.countyReport,
                                counties: newCounties,
                              },
                            });
                          }}
                          className="w-20 px-2 py-1 border border-gray-200 rounded"
                        />
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => {
                            const newCounties =
                              data.countyReport.counties.filter(
                                (_, i) => i !== idx,
                              );
                            setData({
                              ...data,
                              countyReport: {
                                ...data.countyReport,
                                counties: newCounties,
                              },
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => {
                const newCounties = [
                  ...data.countyReport.counties,
                  { name: "New County", count: 0, percentage: 0 },
                ];
                setData({
                  ...data,
                  countyReport: { ...data.countyReport, counties: newCounties },
                });
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              + Add County
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">
            📝 How to use this editor
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Edit any number or text above</li>
            <li>• Click "Save All Changes" when done</li>
            <li>• Changes will appear immediately on the Reports page</li>
            <li>• Click "Reset to Defaults" to restore original data</li>
            <li>
              • You can add/remove rows in Participant, Mentor, and County
              reports
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
