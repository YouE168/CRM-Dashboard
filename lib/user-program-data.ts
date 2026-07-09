// lib/user-program-data.ts

export interface UserProgramResource {
  id: string;
  name: string;
  type: "document" | "link" | "form" | "template";
  url?: string;
  required?: boolean;
  completed?: boolean;
}

export interface UserProgramSession {
  id: string;
  title: string;
  date: string;
  time: string;
  mentor: string;
  link?: string;
  attended?: boolean;
  notes?: string;
}

export interface UserProgramBadges {
  isKUPartner?: boolean;
  isJodyProgram?: boolean;
  isGrantFunded?: boolean;
}

export interface UserProgram {
  id: string;
  name: string;
  description?: string;
  status: "Active" | "Completed" | "On Hold";
  startDate: string;
  progress: number;
  nextMilestone: string;
  nextMilestoneAction?: string;
  contactEmail: string;
  contactPhone: string;
  resources: UserProgramResource[];
  upcomingSessions: UserProgramSession[];
  completionDate?: string;
  badges?: UserProgramBadges;
}

// Helper function to get user's enrolled programs
export function getUserEnrolledPrograms(userEmail: string): UserProgram[] {
  // In a real app, this would come from your database
  // For now, we'll use localStorage
  const saved = localStorage.getItem(`user_programs_${userEmail}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // If parsing fails, return default
      return getDefaultPrograms();
    }
  }
  
  return getDefaultPrograms();
}

// Save user's enrolled programs
export function saveUserEnrolledPrograms(userEmail: string, programs: UserProgram[]): void {
  localStorage.setItem(`user_programs_${userEmail}`, JSON.stringify(programs));
}

// Get default programs for a new user
function getDefaultPrograms(): UserProgram[] {
  return [
    {
      id: "prog-1",
      name: "RCP Small Business Mentorship",
      description: "Connect with experienced local mentors for one-on-one guidance.",
      status: "Active",
      startDate: "January 2025",
      progress: 80,
      nextMilestone: "Complete your business profile",
      nextMilestoneAction: "https://forms.google.com/mentorship-profile",
      contactEmail: "mentorship@ruralcommunitypartners.org",
      contactPhone: "(620) 555-0101",
      resources: [
        { 
          id: "res-1", 
          name: "Mentorship Agreement", 
          type: "document", 
          url: "/documents/mentorship-agreement.pdf", 
          required: true, 
          completed: true 
        },
        { 
          id: "res-2", 
          name: "Business Planning Template", 
          type: "template", 
          url: "/templates/business-plan.docx", 
          required: false, 
          completed: false 
        },
        { 
          id: "res-3", 
          name: "Session Logs", 
          type: "form", 
          url: "/resources/mentorship/session-logs", 
          required: true, 
          completed: false 
        },
      ],
      upcomingSessions: [
        {
          id: "session-1",
          title: "Business Plan Review",
          date: "June 10, 2025",
          time: "2:00 PM",
          mentor: "Michael Chen",
          link: "/mentor/settings?mentee=1",
          attended: false,
        },
        {
          id: "session-2",
          title: "Marketing Strategy Session",
          date: "June 17, 2025",
          time: "2:00 PM",
          mentor: "Michael Chen",
          link: "/mentor/settings?mentee=1",
          attended: false,
        },
      ],
      badges: {},
    },
    {
      id: "prog-2",
      name: "SEED Micro-Grant",
      description: "10-week SEK Catalyst cohort with mentorship and grant opportunities.",
      status: "Active",
      startDate: "January 2025",
      progress: 90,
      nextMilestone: "Complete cohort application",
      nextMilestoneAction: "https://forms.google.com/seed-application",
      contactEmail: "seed@ruralcommunitypartners.org",
      contactPhone: "(620) 555-0102",
      resources: [
        { 
          id: "res-1", 
          name: "SEED Grant Agreement", 
          type: "document", 
          url: "/documents/seed-agreement.pdf", 
          required: true, 
          completed: true 
        },
        { 
          id: "res-2", 
          name: "Cohort Handbook", 
          type: "document", 
          url: "/documents/seed-handbook.pdf", 
          required: false, 
          completed: false 
        },
      ],
      upcomingSessions: [
        {
          id: "session-1",
          title: "Weekly Cohort Meeting",
          date: "June 12, 2025",
          time: "10:00 AM",
          mentor: "David Park",
          link: "/zoom/seed-cohort",
          attended: false,
        },
        {
          id: "session-2",
          title: "Grant Application Workshop",
          date: "June 19, 2025",
          time: "10:00 AM",
          mentor: "David Park",
          link: "/zoom/seed-workshop",
          attended: false,
        },
      ],
      badges: {
        isGrantFunded: true,
      },
    },
    {
      id: "prog-3",
      name: "Business Professional Services",
      description: "Financial modeling, startup support, and capital connection.",
      status: "Active",
      startDate: "January 2025",
      progress: 33,
      nextMilestone: "Schedule professional services call",
      nextMilestoneAction: "https://calendar.google.com/professional-services",
      contactEmail: "jody@hbcat.org",
      contactPhone: "(620) 555-0103",
      resources: [
        { 
          id: "res-1", 
          name: "Service Agreement", 
          type: "document", 
          url: "/documents/services-agreement.pdf", 
          required: true, 
          completed: false 
        },
        { 
          id: "res-2", 
          name: "Financial Planning Template", 
          type: "template", 
          url: "/templates/financial-plan.xlsx", 
          required: false, 
          completed: false 
        },
      ],
      upcomingSessions: [
        {
          id: "session-1",
          title: "Financial Planning Session",
          date: "June 15, 2025",
          time: "1:00 PM",
          mentor: "Jody Program",
          link: "/zoom/financial-planning",
          attended: false,
        },
      ],
      badges: {
        isJodyProgram: true,
      },
    },
    {
      id: "prog-4",
      name: "SEK Catalyst: Empowered by KU",
      description: "A comprehensive 12-week entrepreneurship program with KU resources.",
      status: "Active",
      startDate: "August 2025",
      progress: 0,
      nextMilestone: "Complete your onboarding session",
      nextMilestoneAction: "https://calendar.google.com/sek-catalyst-onboarding",
      contactEmail: "catalyst@ruralcommunitypartners.org",
      contactPhone: "(620) 555-0105",
      resources: [
        { 
          id: "res-1", 
          name: "KU Partnership Agreement", 
          type: "document", 
          url: "/documents/ku-agreement.pdf", 
          required: true, 
          completed: false 
        },
        { 
          id: "res-2", 
          name: "Program Handbook", 
          type: "document", 
          url: "/documents/sek-handbook.pdf", 
          required: false, 
          completed: false 
        },
      ],
      upcomingSessions: [
        {
          id: "session-1",
          title: "Program Kickoff & Orientation",
          date: "September 5, 2025",
          time: "6:00 PM",
          mentor: "Jody Program",
          link: "/zoom/sek-catalyst",
          attended: false,
        },
        {
          id: "session-2",
          title: "Business Planning Workshop",
          date: "September 12, 2025",
          time: "6:00 PM",
          mentor: "Tom Anderson",
          link: "/zoom/sek-catalyst-workshop",
          attended: false,
        },
      ],
      badges: {
        isKUPartner: true,
      },
    },
  ];
}

// Helper to update a specific program for a user
export function updateUserProgram(
  userEmail: string, 
  programId: string, 
  updates: Partial<UserProgram>
): UserProgram[] {
  const programs = getUserEnrolledPrograms(userEmail);
  const updated = programs.map(p => 
    p.id === programId ? { ...p, ...updates } : p
  );
  saveUserEnrolledPrograms(userEmail, updated);
  return updated;
}

// Helper to mark a resource as completed
export function markResourceComplete(
  userEmail: string, 
  programId: string, 
  resourceId: string
): UserProgram[] {
  const programs = getUserEnrolledPrograms(userEmail);
  const updated = programs.map(p => {
    if (p.id === programId) {
      const updatedResources = p.resources.map(r => 
        r.id === resourceId ? { ...r, completed: true } : r
      );
      return { ...p, resources: updatedResources };
    }
    return p;
  });
  saveUserEnrolledPrograms(userEmail, updated);
  return updated;
}

// Helper to mark a session as attended
export function markSessionAttended(
  userEmail: string, 
  programId: string, 
  sessionId: string
): UserProgram[] {
  const programs = getUserEnrolledPrograms(userEmail);
  const updated = programs.map(p => {
    if (p.id === programId) {
      const updatedSessions = p.upcomingSessions.map(s => 
        s.id === sessionId ? { ...s, attended: true } : s
      );
      return { ...p, upcomingSessions: updatedSessions };
    }
    return p;
  });
  saveUserEnrolledPrograms(userEmail, updated);
  return updated;
}