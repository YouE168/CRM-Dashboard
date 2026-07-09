// lib/program-data.ts

export interface ProgramResource {
  id: string;
  name: string;
  type: "document" | "link" | "form" | "template";
  url?: string;
  description?: string;
}

export interface ProgramSession {
  id: string;
  title: string;
  date: string;
  time: string;
  mentor: string;
  link?: string;
  location?: string;
  description?: string;
}

export interface ProgramFinancial {
  totalBudget: number;
  spent: number;
  remaining: number;
  grantsReceived: number;
  grantsPending: number;
  sponsorships?: number;
  costPerParticipant?: number;
}

export interface ProgramParticipants {
  total: number;
  active: number;
  onboarding: number;
  alumni: number;
  applicants?: number;
  accepted?: number;
  completed?: number;
}

export interface ProgramOutcomes {
  businessesLaunched: number;
  businessesExpanded: number;
  jobsCreated: number;
  jobsRetained: number;
  capitalAccessed: number;
  revenueGrowth: number;
  clientSatisfaction?: number;
  completionRate?: number;
}

export interface ProgramStaff {
  totalHours: number;
  facilitationHours: number;
  coordinationHours: number;
  prepHours: number;
  costOfStaffTime?: number;
}

export interface ProgramPartner {
  name: string;
  type: "business" | "nonprofit" | "educational" | "government" | "other";
  referralsTo?: number;
  referralsFrom?: number;
  jointInitiatives?: string[];
}

export interface ProgramMilestone {
  title: string;
  description: string;
  dueDate?: string;
  completed: boolean;
  completedDate?: string;
}

export interface ProgramBadges {
  isKUPartner?: boolean;
  isJodyProgram?: boolean;
  isGrantFunded?: boolean;
}

export interface ProgramResourceTracking {
  financial: ProgramFinancial;
  participants: ProgramParticipants;
  outcomes: ProgramOutcomes;
  staff: ProgramStaff;
  partners: ProgramPartner[];
  milestones: ProgramMilestone[];
  documents: ProgramResource[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  category: "entrepreneurship" | "workforce" | "community" | "media" | "capital" | "strategic";
  status: "Active" | "On Hold" | "Completed" | "In Development";
  startDate: string;
  endDate?: string;
  progress: number;
  nextMilestone: string;
  nextMilestoneAction?: string;
  contactEmail: string;
  contactPhone: string;
  resources: ProgramResource[];
  upcomingSessions: ProgramSession[];
  tracking: ProgramResourceTracking;
  badges?: ProgramBadges;
}

export const ALL_PROGRAMS: Record<string, Program> = {
  "RCP Small Business Mentorship Program": {
    id: "prog-1",
    name: "RCP Small Business Mentorship Program",
    description: "Connects entrepreneurs with experienced local mentors, plus application support and one-on-one guidance.",
    category: "entrepreneurship",
    status: "Active",
    startDate: "January 2025",
    progress: 80,
    nextMilestone: "Complete your business profile",
    nextMilestoneAction: "https://forms.google.com/mentorship-profile",
    contactEmail: "mentorship@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0101",
    resources: [
      { id: "res-1", name: "Participant Application Form", type: "form", url: "/resources/mentorship/application" },
      { id: "res-2", name: "Business Intake Assessment", type: "form", url: "/resources/mentorship/intake" },
      { id: "res-3", name: "Mentor Application / Interest Form", type: "form", url: "/resources/mentorship/mentor-application" },
      { id: "res-4", name: "Mentor Agreement", type: "document", url: "/resources/mentorship/mentor-agreement.pdf" },
      { id: "res-5", name: "Mentor–Mentee Match Form", type: "form", url: "/resources/mentorship/match-form" },
      { id: "res-6", name: "Session Logs", type: "form", url: "/resources/mentorship/session-logs" },
      { id: "res-7", name: "Mentor Time Sheets", type: "form", url: "/resources/mentorship/timesheets" },
      { id: "res-8", name: "Mentor Payment Records", type: "document", url: "/resources/mentorship/payments" },
      { id: "res-9", name: "Midpoint Check-In Form", type: "form", url: "/resources/mentorship/midpoint-check" },
      { id: "res-10", name: "Final Evaluation", type: "form", url: "/resources/mentorship/final-evaluation" },
      { id: "res-11", name: "Exit Survey", type: "form", url: "/resources/mentorship/exit-survey" },
      { id: "res-12", name: "Success Story Intake Form", type: "form", url: "/resources/mentorship/success-story" },
    ],
    upcomingSessions: [
      {
        id: "session-1",
        title: "Business Plan Review",
        date: "June 10, 2025",
        time: "2:00 PM",
        mentor: "Michael Chen",
        link: "/mentor/settings?mentee=1",
      },
      {
        id: "session-2",
        title: "Marketing Strategy Session",
        date: "June 17, 2025",
        time: "2:00 PM",
        mentor: "Michael Chen",
        link: "/mentor/settings?mentee=1",
      },
    ],
    tracking: {
      financial: {
        totalBudget: 45000,
        spent: 29250,
        remaining: 15750,
        grantsReceived: 30000,
        grantsPending: 15000,
        costPerParticipant: 1000,
      },
      participants: {
        total: 45,
        active: 30,
        onboarding: 8,
        alumni: 7,
        applicants: 60,
        accepted: 45,
        completed: 7,
      },
      outcomes: {
        businessesLaunched: 8,
        businessesExpanded: 12,
        jobsCreated: 12,
        jobsRetained: 5,
        capitalAccessed: 45000,
        revenueGrowth: 28,
        clientSatisfaction: 4.8,
        completionRate: 85,
      },
      staff: {
        totalHours: 350,
        facilitationHours: 120,
        coordinationHours: 80,
        prepHours: 50,
        costOfStaffTime: 10500,
      },
      partners: [
        { name: "SBDC", type: "business", referralsTo: 8, referralsFrom: 5 },
        { name: "Network Kansas", type: "nonprofit", referralsTo: 4, referralsFrom: 3 },
      ],
      milestones: [
        { title: "Complete Business Profile", description: "Complete your business profile in the system", completed: true },
        { title: "Attend 3 Mentoring Sessions", description: "Complete at least 3 sessions with your mentor", completed: false },
        { title: "Submit Final Evaluation", description: "Complete the program evaluation", completed: false },
      ],
      documents: [
        { id: "doc-1", name: "Mentorship Agreement", type: "document", url: "/documents/mentorship-agreement.pdf" },
        { id: "doc-2", name: "Business Planning Template", type: "template", url: "/templates/business-plan.docx" },
      ],
    },
  },

  "SEED Micro-Grant Program": {
    id: "prog-2",
    name: "SEED Micro-Grant Program",
    description: "10-week SEK Catalyst cohort with mentorship and grant opportunities. Includes $250 participant support + $500 grants for top businesses.",
    category: "entrepreneurship",
    status: "Active",
    startDate: "January 2025",
    progress: 90,
    nextMilestone: "Complete cohort application",
    nextMilestoneAction: "https://forms.google.com/seed-application",
    contactEmail: "seed@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0102",
    resources: [
      { id: "res-1", name: "Cohort Calendar", type: "link", url: "/resources/seed-calendar" },
      { id: "res-2", name: "Grant Application Guide", type: "document", url: "/resources/grant-guide.pdf" },
      { id: "res-3", name: "Weekly Session Materials", type: "link", url: "/resources/seed-materials" },
      { id: "res-4", name: "Pitch Deck Template", type: "template", url: "/resources/pitch-template" },
    ],
    upcomingSessions: [
      {
        id: "session-1",
        title: "Weekly Cohort Meeting",
        date: "June 12, 2025",
        time: "10:00 AM",
        mentor: "David Park",
        link: "/zoom/seed-cohort",
      },
      {
        id: "session-2",
        title: "Grant Application Workshop",
        date: "June 19, 2025",
        time: "10:00 AM",
        mentor: "David Park",
        link: "/zoom/seed-workshop",
      },
    ],
    tracking: {
      financial: {
        totalBudget: 75000,
        spent: 45000,
        remaining: 30000,
        grantsReceived: 50000,
        grantsPending: 25000,
        sponsorships: 10000,
        costPerParticipant: 2500,
      },
      participants: {
        total: 30,
        active: 20,
        onboarding: 5,
        alumni: 5,
        applicants: 50,
        accepted: 30,
        completed: 5,
      },
      outcomes: {
        businessesLaunched: 12,
        businessesExpanded: 8,
        jobsCreated: 20,
        jobsRetained: 10,
        capitalAccessed: 85000,
        revenueGrowth: 35,
        clientSatisfaction: 4.9,
        completionRate: 90,
      },
      staff: {
        totalHours: 280,
        facilitationHours: 100,
        coordinationHours: 70,
        prepHours: 60,
        costOfStaffTime: 8400,
      },
      partners: [
        { name: "KU", type: "educational", referralsTo: 10, referralsFrom: 8 },
        { name: "SBDC", type: "business", referralsTo: 6, referralsFrom: 4 },
      ],
      milestones: [
        { title: "Complete Cohort Application", description: "Submit your application to the cohort", completed: true },
        { title: "Attend 6 Workshops", description: "Attend at least 6 of the 10 workshops", completed: false },
        { title: "Submit Final Grant Report", description: "Complete the final grant reporting", completed: false },
      ],
      documents: [
        { id: "doc-1", name: "SEED Grant Agreement", type: "document", url: "/documents/seed-agreement.pdf" },
        { id: "doc-2", name: "Cohort Handbook", type: "document", url: "/documents/seed-handbook.pdf" },
      ],
    },
    badges: {
      isGrantFunded: true,
    },
  },

  "Business Professional Services": {
    id: "prog-3",
    name: "Business Professional Services",
    description: "Financial modeling, startup support, and capital connection. Get expert help with cash flow, break-even analysis, and funding strategies.",
    category: "entrepreneurship",
    status: "Active",
    startDate: "January 2025",
    progress: 33,
    nextMilestone: "Schedule professional services call",
    nextMilestoneAction: "https://calendar.google.com/professional-services",
    contactEmail: "jody@hbcat.org",
    contactPhone: "(620) 555-0103",
    resources: [
      { id: "res-1", name: "Financial Templates", type: "template", url: "/resources/financial-templates" },
      { id: "res-2", name: "Capital Readiness Guide", type: "document", url: "/resources/capital-guide.pdf" },
      { id: "res-3", name: "Business Plan Template", type: "template", url: "/resources/business-plan.docx" },
      { id: "res-4", name: "Investor Pitch Guide", type: "document", url: "/resources/pitch-guide.pdf" },
    ],
    upcomingSessions: [
      {
        id: "session-1",
        title: "Financial Planning Session",
        date: "June 15, 2025",
        time: "1:00 PM",
        mentor: "Jody Program",
        link: "/zoom/financial-planning",
      },
    ],
    tracking: {
      financial: {
        totalBudget: 35000,
        spent: 15750,
        remaining: 19250,
        grantsReceived: 25000,
        grantsPending: 10000,
        costPerParticipant: 700,
      },
      participants: {
        total: 25,
        active: 15,
        onboarding: 6,
        alumni: 4,
        applicants: 35,
        accepted: 25,
        completed: 4,
      },
      outcomes: {
        businessesLaunched: 5,
        businessesExpanded: 10,
        jobsCreated: 8,
        jobsRetained: 6,
        capitalAccessed: 32000,
        revenueGrowth: 22,
        clientSatisfaction: 4.7,
        completionRate: 80,
      },
      staff: {
        totalHours: 200,
        facilitationHours: 80,
        coordinationHours: 50,
        prepHours: 40,
        costOfStaffTime: 6000,
      },
      partners: [
        { name: "Network Kansas", type: "nonprofit", referralsTo: 5, referralsFrom: 3 },
        { name: "Community Bank", type: "business", referralsTo: 3, referralsFrom: 2 },
      ],
      milestones: [
        { title: "Schedule Professional Services Call", description: "Schedule your initial consultation", completed: false },
        { title: "Complete Financial Analysis", description: "Complete the financial analysis session", completed: false },
        { title: "Submit Final Report", description: "Complete the final services report", completed: false },
      ],
      documents: [
        { id: "doc-1", name: "Service Agreement", type: "document", url: "/documents/services-agreement.pdf" },
        { id: "doc-2", name: "Financial Planning Template", type: "template", url: "/templates/financial-plan.xlsx" },
      ],
    },
    badges: {
      isJodyProgram: true,
    },
  },

  "Microloan Program": {
    id: "prog-4",
    name: "Microloan Program",
    description: "Access to capital for rural businesses. Designed to support startup and growth-stage entrepreneurs with flexible loan options.",
    category: "capital",
    status: "In Development",
    startDate: "January 2025",
    progress: 33,
    nextMilestone: "Check loan eligibility",
    nextMilestoneAction: "https://forms.google.com/microloan-eligibility",
    contactEmail: "loans@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0104",
    resources: [
      { id: "res-1", name: "Loan Application", type: "form", url: "/resources/loan-application" },
      { id: "res-2", name: "Eligibility Requirements", type: "document", url: "/resources/eligibility.pdf" },
      { id: "res-3", name: "Financial Documentation Guide", type: "document", url: "/resources/doc-guide.pdf" },
      { id: "res-4", name: "Interest Rate Calculator", type: "link", url: "/resources/rate-calculator" },
    ],
    upcomingSessions: [],
    tracking: {
      financial: {
        totalBudget: 100000,
        spent: 30000,
        remaining: 70000,
        grantsReceived: 60000,
        grantsPending: 40000,
        costPerParticipant: 5000,
      },
      participants: {
        total: 20,
        active: 12,
        onboarding: 5,
        alumni: 3,
        applicants: 30,
        accepted: 20,
        completed: 3,
      },
      outcomes: {
        businessesLaunched: 3,
        businessesExpanded: 6,
        jobsCreated: 6,
        jobsRetained: 4,
        capitalAccessed: 120000,
        revenueGrowth: 18,
        clientSatisfaction: 4.5,
        completionRate: 75,
      },
      staff: {
        totalHours: 150,
        facilitationHours: 40,
        coordinationHours: 60,
        prepHours: 30,
        costOfStaffTime: 4500,
      },
      partners: [
        { name: "Community Bank", type: "business", referralsTo: 8, referralsFrom: 5 },
        { name: "Network Kansas", type: "nonprofit", referralsTo: 3, referralsFrom: 2 },
      ],
      milestones: [
        { title: "Check Loan Eligibility", description: "Review your eligibility for the program", completed: false },
        { title: "Submit Loan Application", description: "Complete and submit your loan application", completed: false },
        { title: "Loan Approval", description: "Get approval for your loan", completed: false },
      ],
      documents: [
        { id: "doc-1", name: "Loan Agreement", type: "document", url: "/documents/loan-agreement.pdf" },
        { id: "doc-2", name: "Financial Projections Template", type: "template", url: "/templates/financial-projections.xlsx" },
      ],
    },
  },

  "SEK Catalyst: Empowered by KU": {
    id: "prog-5",
    name: "SEK Catalyst: Empowered by KU",
    description: "A comprehensive 12-week entrepreneurship program designed to help rural business owners launch and grow their ventures. Includes mentorship, workshops, and access to KU resources.",
    category: "entrepreneurship",
    status: "Active",
    startDate: "August 2025",
    progress: 0,
    nextMilestone: "Complete your onboarding session",
    nextMilestoneAction: "https://calendar.google.com/sek-catalyst-onboarding",
    contactEmail: "catalyst@ruralcommunitypartners.org",
    contactPhone: "(620) 555-0105",
    resources: [
      { id: "res-1", name: "Program Guide", type: "document", url: "/resources/sek-catalyst-guide.pdf" },
      { id: "res-2", name: "Workshop Schedule", type: "link", url: "/resources/sek-catalyst-schedule" },
      { id: "res-3", name: "KU Resources", type: "link", url: "/resources/ku-resources" },
      { id: "res-4", name: "Mentor Matching", type: "form", url: "/resources/mentor-matching" },
    ],
    upcomingSessions: [
      {
        id: "session-1",
        title: "Program Kickoff & Orientation",
        date: "September 5, 2025",
        time: "6:00 PM",
        mentor: "Jody Program",
        link: "/zoom/sek-catalyst",
      },
      {
        id: "session-2",
        title: "Business Planning Workshop",
        date: "September 12, 2025",
        time: "6:00 PM",
        mentor: "Tom Anderson",
        link: "/zoom/sek-catalyst-workshop",
      },
    ],
    tracking: {
      financial: {
        totalBudget: 50000,
        spent: 5000,
        remaining: 45000,
        grantsReceived: 30000,
        grantsPending: 20000,
        sponsorships: 15000,
        costPerParticipant: 2500,
      },
      participants: {
        total: 0,
        active: 0,
        onboarding: 0,
        alumni: 0,
        applicants: 0,
        accepted: 0,
        completed: 0,
      },
      outcomes: {
        businessesLaunched: 0,
        businessesExpanded: 0,
        jobsCreated: 0,
        jobsRetained: 0,
        capitalAccessed: 0,
        revenueGrowth: 0,
        clientSatisfaction: 0,
        completionRate: 0,
      },
      staff: {
        totalHours: 0,
        facilitationHours: 0,
        coordinationHours: 0,
        prepHours: 0,
        costOfStaffTime: 0,
      },
      partners: [
        { name: "KU", type: "educational", referralsTo: 0, referralsFrom: 0 },
      ],
      milestones: [
        { title: "Complete Onboarding Session", description: "Attend the onboarding session", completed: false },
        { title: "Complete 3 Workshops", description: "Attend at least 3 workshops", completed: false },
        { title: "Submit Final Project", description: "Complete your final project", completed: false },
      ],
      documents: [
        { id: "doc-1", name: "KU Partnership Agreement", type: "document", url: "/documents/ku-agreement.pdf" },
        { id: "doc-2", name: "Program Handbook", type: "document", url: "/documents/sek-handbook.pdf" },
      ],
    },
    badges: {
      isKUPartner: true,
    },
  },
};

// Helper function to get program by name
export function getProgramByName(name: string): Program | undefined {
  return ALL_PROGRAMS[name];
}

// Helper function to get all programs
export function getAllPrograms(): Program[] {
  return Object.values(ALL_PROGRAMS);
}

// Helper function to get programs by category
export function getProgramsByCategory(category: Program['category']): Program[] {
  return Object.values(ALL_PROGRAMS).filter(p => p.category === category);
}

// Helper function to get active programs
export function getActivePrograms(): Program[] {
  return Object.values(ALL_PROGRAMS).filter(p => p.status === "Active");
}