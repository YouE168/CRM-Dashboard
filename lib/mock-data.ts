// Mock data for the Mentoring Management Platform Dashboard
import { COUNTY_LIST } from "./constants";
export const counties = ["All Counties", ...COUNTY_LIST];

export const programs = [
  "All Programs",
  "Business Catalyst",
  "Youth Mentorship",
  "Women Entrepreneurs",
  "Veterans Initiative",
];

// Operational KPIs
export const operationalKPIs = {
  activeClientsByProgram: {
    "Business Catalyst": 45,
    "Youth Mentorship": 32,
    "Women Entrepreneurs": 28,
    "Veterans Initiative": 19,
  },
  //  11 counties with realistic distribution
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
  { program: "Business Catalyst", clients: 45, fill: "var(--color-chart-1)" },
  { program: "Youth Mentorship", clients: 32, fill: "var(--color-chart-2)" },
  { program: "Women Entrepreneurs", clients: 28, fill: "var(--color-chart-3)" },
  { program: "Veterans Initiative", clients: 19, fill: "var(--color-chart-4)" },
];

// UPDATED: Clients by county for pie chart - 11 counties
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

// UPDATED: Participants table data with new counties
export const participants = [
  {
    id: "1",
    name: "Sarah Johnson",
    program: "Business Catalyst",
    county: "Bourbon",
    stage: "Active",
    mentor: "Michael Chen",
  },
  {
    id: "2",
    name: "James Williams",
    program: "Youth Mentorship",
    county: "Linn",
    stage: "Onboarding",
    mentor: "Lisa Thompson",
  },
  {
    id: "3",
    name: "Maria Garcia",
    program: "Women Entrepreneurs",
    county: "Crawford",
    stage: "Active",
    mentor: "David Park",
  },
  {
    id: "4",
    name: "Robert Davis",
    program: "Veterans Initiative",
    county: "Cherokee",
    stage: "Completing",
    mentor: "Jennifer Lee",
  },
  {
    id: "5",
    name: "Emily Brown",
    program: "Business Catalyst",
    county: "Labette",
    stage: "Active",
    mentor: "Tom Anderson",
  },
  {
    id: "6",
    name: "Michael Martinez",
    program: "Youth Mentorship",
    county: "Montgomery",
    stage: "Matched",
    mentor: "Susan White",
  },
  {
    id: "7",
    name: "Amanda Wilson",
    program: "Women Entrepreneurs",
    county: "Woodson",
    stage: "Active",
    mentor: "Chris Taylor",
  },
  {
    id: "8",
    name: "Kevin Thomas",
    program: "Veterans Initiative",
    county: "Wilson",
    stage: "Alumni",
    mentor: "Rachel Green",
  },
  {
    id: "9",
    name: "Jessica Rodriguez",
    program: "Business Catalyst",
    county: "Allen",
    stage: "Active",
    mentor: "Mark Johnson",
  },
  {
    id: "10",
    name: "Daniel Lee",
    program: "Youth Mentorship",
    county: "Neosho",
    stage: "Onboarding",
    mentor: "Amy Chen",
  },
  // Added more participants to distribute across counties
  {
    id: "11",
    name: "Patricia Smith",
    program: "Business Catalyst",
    county: "Greenwood",
    stage: "Active",
    mentor: "Michael Chen",
  },
  {
    id: "12",
    name: "Thomas Brown",
    program: "Veterans Initiative",
    county: "Bourbon",
    stage: "Active",
    mentor: "Jennifer Lee",
  },
  {
    id: "13",
    name: "Jennifer Wilson",
    program: "Women Entrepreneurs",
    county: "Cherokee",
    stage: "Onboarding",
    mentor: "David Park",
  },
  {
    id: "14",
    name: "Charles Jones",
    program: "Youth Mentorship",
    county: "Linn",
    stage: "Active",
    mentor: "Lisa Thompson",
  },
  {
    id: "15",
    name: "Linda Garcia",
    program: "Business Catalyst",
    county: "Neosho",
    stage: "Completing",
    mentor: "Tom Anderson",
  },
];