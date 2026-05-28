// lib/cms-data.ts

export interface AnalyticsDataPoint {
  activeClients: number;
  activeMentorMatches: number;
  sessionsThisMonth: number;
  hoursDelivered: number;
  outstandingSignatures: number;
  surveysOverdue: number;
  invoicesPending: number;
}

export interface AnalyticsData {
  [program: string]: {
    [county: string]: {
      [dateRange: string]: AnalyticsDataPoint;
    };
  };
}

export interface CMSData {
  overview: {
    totalParticipants: number;
    participantsTrend: number;
    activeMentors: number;
    mentorsTrend: number;
    sessionsThisMonth: number;
    sessionsTrend: number;
    avgSatisfaction: number;
    satisfactionTrend: number;
    lastUpdated: string;
  };
  analyticsData: AnalyticsData;
  programs: string[];
  counties: string[];
  dateRanges: string[];
  participants: {
    total: number;
    active: number;
    onboarding: number;
    alumni: number;
    lastUpdated: string;
  };
  mentors: {
    total: number;
    active: number;
    activeMatches: number;
    matchesTrend: number;
    avgRating: number;
    lastUpdated: string;
  };
  leadership: {
    totalMembers: number;
    membersTrend: number;
    newSignups: number;
    signupsTrend: number;
    avgAttendance: number;
    attendanceTrend: number;
    memberSatisfaction: number;
    satisfactionTrend: number;
    grantFunding: number;
    mentorHours: number;
    staffMembers: number;
    inKindSupport: number;
    budgetUtilization: number;
    personnelCost: number;
    programmingCost: number;
    operationsCost: number;
    marketingCost: number;
    lastUpdated: string;
  };
  resources: {
    totalBudget: number;
    grantsReceived: number;
    donations: number;
    sponsorships: number;
    totalHours: number;
    facilitationHours: number;
    coordinationHours: number;
    adminHours: number;
    lastUpdated: string;
  };
  resourcesByProgram: {
    programs: Array<{
      name: string;
      budget: number;
      hours: number;
      participants: number;
      status: string;
      type: string;
    }>;
    lastUpdated: string;
  };

  //participants list
  participantsList: Array<{
    id: string;
    name: string;
    program: string;
    county: string;
    stage: string;
    mentor: string;
    email?: string;
    phone?: string;
    enrolledDate?: string;
  }>;

}

// Generate default analytics data for all combinations
function generateDefaultAnalyticsData(): AnalyticsData {
  const programs = [
    "RCP Small Business Mentorship Program",
    "SEED Micro-Grant Program",
    "Business Technical Assistance Hub",
    "Parker Dewey Micro-Internship Program",
    "Workforce Development & Navigation",
    "Local Health Equity Action Teams (LHEATs)",
    "Coalition Leadership Roundtable",
    "Rural Connect Magazine",
    "Park & Community Space Upgrades",
    "Cost Benefit & Feasibility Studies",
    "Microloan Program",
    "MAZK Initiative",
  ];
  
  const counties = [
    "Linn", "Bourbon", "Crawford", "Cherokee", "Labette",
    "Montgomery", "Woodson", "Wilson", "Allen", "Neosho", "Greenwood",
  ];
  
  const dateRanges = ["Last 30 days", "Last 3 months", "Last 6 months", "Last 12 months", "All time"];
  
  const data: AnalyticsData = {};
  
  for (const program of programs) {
    data[program] = {};
    for (const county of counties) {
      data[program][county] = {};
      for (const dateRange of dateRanges) {
        let baseValue = 100;
        if (program.includes("Small Business")) baseValue = 45;
        else if (program.includes("SEED")) baseValue = 28;
        else if (program.includes("Technical")) baseValue = 32;
        else if (program.includes("Internship")) baseValue = 24;
        else if (program.includes("Workforce")) baseValue = 56;
        else if (program.includes("Health")) baseValue = 45;
        else if (program.includes("Coalition")) baseValue = 24;
        else baseValue = 20;
        
        data[program][county][dateRange] = {
          activeClients: baseValue,
          activeMentorMatches: Math.floor(baseValue * 0.7),
          sessionsThisMonth: Math.floor(baseValue * 1.2),
          hoursDelivered: Math.floor(baseValue * 2.5),
          outstandingSignatures: Math.floor(baseValue * 0.1),
          surveysOverdue: Math.floor(baseValue * 0.06),
          invoicesPending: Math.floor(baseValue * 0.04),
        };
      }
    }
  }
  
  return data;
}

export const defaultCMSData: CMSData = {
  overview: {
    totalParticipants: 124,
    participantsTrend: 12,
    activeMentors: 7,
    mentorsTrend: 5,
    sessionsThisMonth: 156,
    sessionsTrend: 15,
    avgSatisfaction: 94,
    satisfactionTrend: 3,
    lastUpdated: new Date().toISOString(),
  },
  analyticsData: generateDefaultAnalyticsData(),
  programs: [
    "RCP Small Business Mentorship Program",
    "SEED Micro-Grant Program",
    "Business Technical Assistance Hub",
    "Parker Dewey Micro-Internship Program",
    "Workforce Development & Navigation",
    "Local Health Equity Action Teams (LHEATs)",
    "Coalition Leadership Roundtable",
    "Rural Connect Magazine",
    "Park & Community Space Upgrades",
    "Cost Benefit & Feasibility Studies",
    "Microloan Program",
    "MAZK Initiative",
  ],
  counties: [
    "Linn", "Bourbon", "Crawford", "Cherokee", "Labette",
    "Montgomery", "Woodson", "Wilson", "Allen", "Neosho", "Greenwood",
  ],
  dateRanges: [
    "Last 30 days",
    "Last 3 months",
    "Last 6 months",
    "Last 12 months",
    "All time",
  ],
  participants: {
    total: 124,
    active: 89,
    onboarding: 25,
    alumni: 10,
    lastUpdated: new Date().toISOString(),
  },
  mentors: {
    total: 8,
    active: 7,
    activeMatches: 89,
    matchesTrend: 8,
    avgRating: 4.7,
    lastUpdated: new Date().toISOString(),
  },
  leadership: {
    totalMembers: 24,
    membersTrend: 8,
    newSignups: 8,
    signupsTrend: 12,
    avgAttendance: 87,
    attendanceTrend: 5,
    memberSatisfaction: 96,
    satisfactionTrend: 2,
    grantFunding: 124500,
    mentorHours: 312,
    staffMembers: 8,
    inKindSupport: 18200,
    budgetUtilization: 68,
    personnelCost: 45200,
    programmingCost: 32500,
    operationsCost: 28300,
    marketingCost: 18500,
    lastUpdated: new Date().toISOString(),
  },
  resources: {
    totalBudget: 245000,
    grantsReceived: 187500,
    donations: 32500,
    sponsorships: 25000,
    totalHours: 1240,
    facilitationHours: 420,
    coordinationHours: 380,
    adminHours: 440,
    lastUpdated: new Date().toISOString(),
  },
  resourcesByProgram: {
    programs: [
      { name: "RCP Small Business Mentorship", budget: 45000, hours: 320, participants: 45, status: "Active", type: "Business Support" },
      { name: "SEED Micro-Grant Program", budget: 35000, hours: 180, participants: 28, status: "Active", type: "Business Support" },
      { name: "Business Technical Assistance Hub", budget: 28000, hours: 240, participants: 32, status: "Active", type: "Business Support" },
      { name: "Parker Dewey Micro-Internship", budget: 25000, hours: 120, participants: 24, status: "Active", type: "Workforce" },
      { name: "Workforce Development & Navigation", budget: 32000, hours: 200, participants: 56, status: "Active", type: "Workforce" },
      { name: "Local Health Equity Action Teams", budget: 28000, hours: 180, participants: 45, status: "Active", type: "Community" },
      { name: "Coalition Leadership Roundtable", budget: 15000, hours: 60, participants: 24, status: "Active", type: "Community" },
      { name: "Rural Connect Magazine", budget: 18000, hours: 80, participants: 6000, status: "Active", type: "Media" },
      { name: "Park & Community Space Upgrades", budget: 75000, hours: 40, participants: 0, status: "Capital", type: "Infrastructure" },
      { name: "Cost Benefit & Feasibility Studies", budget: 12000, hours: 60, participants: 8, status: "Active", type: "Planning" },
      { name: "Microloan Program", budget: 50000, hours: 100, participants: 0, status: "Development", type: "Capital" },
      { name: "MAZK Initiative", budget: 25000, hours: 80, participants: 12, status: "Strategic", type: "Strategic" },
    ],
    lastUpdated: new Date().toISOString(),
  },

  participantsList: [
    { id: "1", name: "Sarah Johnson", program: "Business Catalyst", county: "Bourbon", stage: "Active", mentor: "Michael Chen", enrolledDate: "2025-01-15" },
    { id: "2", name: "James Williams", program: "Youth Mentorship", county: "Linn", stage: "Onboarding", mentor: "Lisa Thompson", enrolledDate: "2025-02-01" },
    { id: "3", name: "Maria Garcia", program: "Women Entrepreneurs", county: "Crawford", stage: "Active", mentor: "David Park", enrolledDate: "2025-01-20" },
    { id: "4", name: "Robert Davis", program: "Veterans Initiative", county: "Cherokee", stage: "Completing", mentor: "Jennifer Lee", enrolledDate: "2024-11-10" },
    { id: "5", name: "Emily Brown", program: "Business Catalyst", county: "Labette", stage: "Active", mentor: "Tom Anderson", enrolledDate: "2025-01-25" },
    { id: "6", name: "Michael Martinez", program: "Youth Mentorship", county: "Montgomery", stage: "Matched", mentor: "Susan White", enrolledDate: "2025-02-10" },
    { id: "7", name: "Amanda Wilson", program: "Women Entrepreneurs", county: "Woodson", stage: "Active", mentor: "Chris Taylor", enrolledDate: "2025-01-18" },
    { id: "8", name: "Kevin Thomas", program: "Veterans Initiative", county: "Wilson", stage: "Alumni", mentor: "Rachel Green", enrolledDate: "2024-10-05" },
    { id: "9", name: "Jessica Rodriguez", program: "Business Catalyst", county: "Allen", stage: "Active", mentor: "Mark Johnson", enrolledDate: "2025-01-22" },
    { id: "10", name: "Daniel Lee", program: "Youth Mentorship", county: "Neosho", stage: "Onboarding", mentor: "Amy Chen", enrolledDate: "2025-02-05" },
    { id: "11", name: "Patricia Smith", program: "Business Catalyst", county: "Greenwood", stage: "Active", mentor: "Michael Chen", enrolledDate: "2025-01-28" },
    { id: "12", name: "Thomas Brown", program: "Veterans Initiative", county: "Bourbon", stage: "Active", mentor: "Jennifer Lee", enrolledDate: "2025-01-12" },
    { id: "13", name: "Jennifer Wilson", program: "Women Entrepreneurs", county: "Cherokee", stage: "Onboarding", mentor: "David Park", enrolledDate: "2025-02-08" },
    { id: "14", name: "Charles Jones", program: "Youth Mentorship", county: "Linn", stage: "Active", mentor: "Lisa Thompson", enrolledDate: "2025-01-30" },
    { id: "15", name: "Linda Garcia", program: "Business Catalyst", county: "Neosho", stage: "Completing", mentor: "Tom Anderson", enrolledDate: "2024-12-15" },
  ],
  
};

export function loadCMSData(): CMSData {
  if (typeof window === "undefined") return defaultCMSData;
  const saved = localStorage.getItem("cmsData");
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultCMSData;
}

export function saveCMSData(data: CMSData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("cmsData", JSON.stringify(data));
  window.dispatchEvent(new Event("cmsDataUpdated"));
}

export function getAnalyticsValue(
  cmsData: CMSData,
  program: string,
  county: string,
  dateRange: string,
  metric: keyof AnalyticsDataPoint
): number {
  try {
    return cmsData.analyticsData[program]?.[county]?.[dateRange]?.[metric] ?? 0;
  } catch {
    return 0;
  }
}