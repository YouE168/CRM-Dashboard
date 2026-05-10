// Mock data for the Mentoring Management Platform Dashboard
import { COUNTY_LIST } from "./constants";
export const counties = ["All Counties", ...COUNTY_LIST];

export const programs = [
  "All Programs",
  // Entrepreneurship & Business Support
  "RCP Small Business Mentorship Program",
  "SEED Micro-Grant Program",
  "Business Technical Assistance Hub",
  // Workforce & Talent Development
  "Parker Dewey Micro-Internship Program",
  "Workforce Development & Navigation",
  // Community & Coalition-Based Work
  "Local Health Equity Action Teams (LHEATs)",
  "Coalition Leadership Roundtable",
  // Media, Storytelling & Outreach
  "Rural Connect Magazine",
  // Investing in Communities
  "Park & Community Space Upgrades",
  "Cost Benefit & Feasibility Studies",
  // Capital & Access to Funding
  "Microloan Program",
  // Emerging / Strategic Initiatives
  "MAZK (Materials Alliance Zone of Kansas)",
];

// Operational KPIs
export const operationalKPIs = {
  activeClientsByProgram: {
    "RCP Small Business Mentorship Program": 45,
    "SEED Micro-Grant Program": 28,
    "Business Technical Assistance Hub": 32,
    "Parker Dewey Micro-Internship Program": 24,
    "Workforce Development & Navigation": 56,
    "Local Health Equity Action Teams (LHEATs)": 45,
    "Coalition Leadership Roundtable": 24,
    "Rural Connect Magazine": 6000,
    "Park & Community Space Upgrades": 0,
    "Cost Benefit & Feasibility Studies": 8,
    "Microloan Program": 0,
    "MAZK (Materials Alliance Zone of Kansas)": 12,
  },
  // 11 counties with realistic distribution
  clientsByCounty: {
    Linn: 24,
    Bourbon: 31,
    Crawford: 18,
    Cherokee: 27,
    Labette: 24,
    Montgomery: 15,
    Woodson: 12,
    Wilson: 20,
    Allen: 19,
    Neosho: 22,
    Greenwood: 16,
  },
  activeMentorMatches: 89,
  sessionsThisMonth: 156,
  hoursThisMonth: 312,
  outstandingSignatures: 12,
  surveysOverdue: 8,
  invoicesAwaitingApproval: 5,
};

// Outcome KPIs
export const outcomeKPIs = {
  businessesServed: 234,
  referralsCompleted: 156,
  capitalAccessOutcomes: 42,
  businessLaunchMilestones: 28,
  participantSatisfaction: 94,
  mentorRetention: 87,
  catalystCompletion: 76,
  alumniConversion: 45,
};

// Sessions per month data for line chart
export const sessionsPerMonth = [
  { month: "Jan", sessions: 120 },
  { month: "Feb", sessions: 135 },
  { month: "Mar", sessions: 142 },
  { month: "Apr", sessions: 128 },
  { month: "May", sessions: 156 },
  { month: "Jun", sessions: 168 },
  { month: "Jul", sessions: 145 },
  { month: "Aug", sessions: 172 },
  { month: "Sep", sessions: 189 },
  { month: "Oct", sessions: 176 },
  { month: "Nov", sessions: 165 },
  { month: "Dec", sessions: 156 },
];

// Clients by program for bar chart
export const clientsByProgramChart = [
  { program: "RCP Small Business Mentorship Program", clients: 45, fill: "var(--color-chart-1)" },
  { program: "SEED Micro-Grant Program", clients: 28, fill: "var(--color-chart-2)" },
  { program: "Business Technical Assistance Hub", clients: 32, fill: "var(--color-chart-3)" },
  { program: "Parker Dewey Micro-Internship Program", clients: 24, fill: "var(--color-chart-4)" },
];

// Clients by county for pie chart - 11 counties
export const clientsByCountyChart = [
  { county: "Linn", clients: 24, fill: "var(--color-chart-1)" },
  { county: "Bourbon", clients: 31, fill: "var(--color-chart-2)" },
  { county: "Crawford", clients: 18, fill: "var(--color-chart-3)" },
  { county: "Cherokee", clients: 27, fill: "var(--color-chart-4)" },
  { county: "Labette", clients: 24, fill: "var(--color-chart-5)" },
  { county: "Montgomery", clients: 15, fill: "var(--color-chart-1)" },
  { county: "Woodson", clients: 12, fill: "var(--color-chart-2)" },
  { county: "Wilson", clients: 20, fill: "var(--color-chart-3)" },
  { county: "Allen", clients: 19, fill: "var(--color-chart-4)" },
  { county: "Neosho", clients: 22, fill: "var(--color-chart-5)" },
  { county: "Greenwood", clients: 16, fill: "var(--color-chart-1)" },
];

// Updated participants table data with new counties
export const participants = [
  {
    id: "1",
    name: "Sarah Johnson",
    program: "RCP Small Business Mentorship Program",
    county: "Bourbon",
    stage: "Active",
    mentor: "Michael Chen",
  },
  {
    id: "2",
    name: "James Williams",
    program: "Workforce Development & Navigation",
    county: "Linn",
    stage: "Onboarding",
    mentor: "Lisa Thompson",
  },
  {
    id: "3",
    name: "Maria Garcia",
    program: "SEED Micro-Grant Program",
    county: "Crawford",
    stage: "Active",
    mentor: "David Park",
  },
  {
    id: "4",
    name: "Robert Davis",
    program: "Business Technical Assistance Hub",
    county: "Cherokee",
    stage: "Completing",
    mentor: "Jennifer Lee",
  },
  {
    id: "5",
    name: "Emily Brown",
    program: "Parker Dewey Micro-Internship Program",
    county: "Labette",
    stage: "Active",
    mentor: "Tom Anderson",
  },
  {
    id: "6",
    name: "Michael Martinez",
    program: "Local Health Equity Action Teams (LHEATs)",
    county: "Montgomery",
    stage: "Matched",
    mentor: "Susan White",
  },
  {
    id: "7",
    name: "Amanda Wilson",
    program: "Coalition Leadership Roundtable",
    county: "Woodson",
    stage: "Active",
    mentor: "Chris Taylor",
  },
  {
    id: "8",
    name: "Kevin Thomas",
    program: "Rural Connect Magazine",
    county: "Wilson",
    stage: "Alumni",
    mentor: "Rachel Green",
  },
  {
    id: "9",
    name: "Jessica Rodriguez",
    program: "MAZK (Materials Alliance Zone of Kansas)",
    county: "Allen",
    stage: "Active",
    mentor: "Mark Johnson",
  },
  {
    id: "10",
    name: "Daniel Lee",
    program: "Cost Benefit & Feasibility Studies",
    county: "Neosho",
    stage: "Onboarding",
    mentor: "Amy Chen",
  },
  {
    id: "11",
    name: "Patricia Smith",
    program: "RCP Small Business Mentorship Program",
    county: "Greenwood",
    stage: "Active",
    mentor: "Michael Chen",
  },
  {
    id: "12",
    name: "Thomas Brown",
    program: "Business Technical Assistance Hub",
    county: "Bourbon",
    stage: "Active",
    mentor: "Jennifer Lee",
  },
  {
    id: "13",
    name: "Jennifer Wilson",
    program: "SEED Micro-Grant Program",
    county: "Cherokee",
    stage: "Onboarding",
    mentor: "David Park",
  },
  {
    id: "14",
    name: "Charles Jones",
    program: "Workforce Development & Navigation",
    county: "Linn",
    stage: "Active",
    mentor: "Lisa Thompson",
  },
  {
    id: "15",
    name: "Linda Garcia",
    program: "RCP Small Business Mentorship Program",
    county: "Neosho",
    stage: "Completing",
    mentor: "Tom Anderson",
  },
];