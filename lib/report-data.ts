// lib/report-data.ts

export interface ReportData {
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

export const defaultReportData: ReportData = {
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
      { name: "Sarah Johnson", program: "Business Catalyst", stage: "Active", progress: 75 },
      { name: "James Williams", program: "Youth Mentorship", stage: "Onboarding", progress: 30 },
      { name: "Maria Garcia", program: "Women Entrepreneurs", stage: "Active", progress: 60 },
      { name: "Robert Davis", program: "Veterans Initiative", stage: "Completing", progress: 90 },
      { name: "Emily Brown", program: "Business Catalyst", stage: "Active", progress: 45 },
      { name: "Michael Martinez", program: "Youth Mentorship", stage: "Matched", progress: 50 },
      { name: "Amanda Wilson", program: "Women Entrepreneurs", stage: "Active", progress: 70 },
      { name: "Kevin Thomas", program: "Veterans Initiative", stage: "Alumni", progress: 100 },
    ],
    lastUpdated: new Date().toISOString(),
  },
  mentorReport: {
    mentors: [
      { name: "Michael Chen", sessions: 24, hours: 48, rating: 4.9, mentees: 8 },
      { name: "Lisa Thompson", sessions: 18, hours: 36, rating: 4.7, mentees: 6 },
      { name: "David Park", sessions: 15, hours: 30, rating: 4.8, mentees: 5 },
      { name: "Jennifer Lee", sessions: 21, hours: 42, rating: 4.6, mentees: 7 },
      { name: "Tom Anderson", sessions: 12, hours: 24, rating: 4.5, mentees: 4 },
      { name: "Chris Taylor", sessions: 16, hours: 32, rating: 4.7, mentees: 5 },
      { name: "Rachel Green", sessions: 10, hours: 20, rating: 4.8, mentees: 3 },
    ],
    lastUpdated: new Date().toISOString(),
  },
  outcomeReport: {
    businessLaunches: 18,
    satisfaction: 94,
    mentorMatches: 89,
    referrals: 12,
    successStory: "8 new businesses launched with mentor support. $124,500 in capital accessed by participants.",
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

export function loadReportData(): ReportData {
  if (typeof window === "undefined") return defaultReportData;
  const saved = localStorage.getItem("reportData");
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultReportData;
}

export function saveReportData(data: ReportData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("reportData", JSON.stringify(data));
}