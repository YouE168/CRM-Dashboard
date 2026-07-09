// lib/roles.ts
export const USER_ROLES = {
  MENTEE: "mentee",
  ENTREPRENEUR: "entrepreneur",
  MENTOR: "mentor",
  COALITION: "coalition",
  PARTNER: "partner",
  ADMIN: "admin",
  STAFF: "staff",
  PROGRAM_MANAGER: "program_manager",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface RoleConfig {
  id: UserRole;
  label: string;
  icon: any;
  description: string;
  programs: string[];
  permissions: {
    canAccessMenteeDashboard: boolean;
    canAccessEntrepreneurHub: boolean;
    canAccessMentorFeatures: boolean;
    canAccessAdminFeatures: boolean;
    canManagePrograms: boolean;
  };
  redirects: {
    default: string;
    menteeDashboard?: string;
    entrepreneurHub?: string;
  };
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  [USER_ROLES.MENTEE]: {
    id: USER_ROLES.MENTEE,
    label: "Mentee / Program Participant",
    icon: null,
    description: "Access mentorship, business programs, and entrepreneurial support",
    programs: [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "Business Professional Services",
      "Microloan Program",
      "SEK Catalyst: Empowered by KU",
    ],
    permissions: {
      canAccessMenteeDashboard: true,
      canAccessEntrepreneurHub: true,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: false,
      canManagePrograms: false,
    },
    redirects: {
      default: "/",
      menteeDashboard: "/mentee/dashboard",
    },
  },
  [USER_ROLES.ENTREPRENEUR]: {
    id: USER_ROLES.ENTREPRENEUR,
    label: "Entrepreneur / Business Owner",
    icon: null,
    description: "Access mentorship, grants, and business support programs",
    programs: [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "Business Professional Services",
      "Microloan Program",
      "SEK Catalyst: Empowered by KU",
    ],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: true,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: false,
      canManagePrograms: false,
    },
    redirects: {
      default: "/",
      entrepreneurHub: "/",
    },
  },
  [USER_ROLES.MENTOR]: {
    id: USER_ROLES.MENTOR,
    label: "Mentor / Business Advisor",
    icon: null,
    description: "Guide entrepreneurs and earn $50/hr for mentoring",
    programs: [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
    ],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: false,
      canAccessMentorFeatures: true,
      canAccessAdminFeatures: false,
      canManagePrograms: false,
    },
    redirects: {
      default: "/",
    },
  },
  [USER_ROLES.COALITION]: {
    id: USER_ROLES.COALITION,
    label: "Coalition Leader",
    icon: null,
    description: "Lead LHEATs and Leadership Roundtable initiatives",
    programs: [
      "LHEATs",
      "Coalition Leadership Roundtable",
      "Rural Connect Magazine",
    ],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: false,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: false,
      canManagePrograms: false,
    },
    redirects: {
      default: "/",
    },
  },
  [USER_ROLES.PARTNER]: {
    id: USER_ROLES.PARTNER,
    label: "Partner Organization",
    icon: null,
    description: "Collaborate on workforce, grants, and community initiatives",
    programs: [
      "Workforce Development",
      "Parker Dewey Internships",
      "MAZK Initiative",
    ],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: false,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: false,
      canManagePrograms: false,
    },
    redirects: {
      default: "/",
    },
  },
  [USER_ROLES.ADMIN]: {
    id: USER_ROLES.ADMIN,
    label: "Administrator",
    icon: null,
    description: "Full system access and management",
    programs: [],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: false,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: true,
      canManagePrograms: true,
    },
    redirects: {
      default: "/admin/dashboard",
    },
  },
  [USER_ROLES.STAFF]: {
    id: USER_ROLES.STAFF,
    label: "Staff",
    icon: null,
    description: "Access CMS, reports, and program management",
    programs: [],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: false,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: true,
      canManagePrograms: true,
    },
    redirects: {
      default: "/admin/dashboard",
    },
  },
  [USER_ROLES.PROGRAM_MANAGER]: {
    id: USER_ROLES.PROGRAM_MANAGER,
    label: "Program Manager",
    icon: null,
    description: "Manage specific programs, participants, and outcomes",
    programs: [],
    permissions: {
      canAccessMenteeDashboard: false,
      canAccessEntrepreneurHub: false,
      canAccessMentorFeatures: false,
      canAccessAdminFeatures: false,
      canManagePrograms: true,
    },
    redirects: {
      default: "/program-manager/dashboard",
    },
  },
};

export function getUserRole(profile: any): UserRole {
  if (profile?.email === "admin@ruralcommunity.org") return USER_ROLES.ADMIN;
  const role = profile?.userType || profile?.primaryRole || USER_ROLES.STAFF;
  return role as UserRole;
}

export function hasPermission(role: UserRole, permission: keyof RoleConfig['permissions']): boolean {
  const config = ROLE_CONFIGS[role];
  return config?.permissions?.[permission] || false;
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const config = ROLE_CONFIGS[role];
  if (!config) return false;

  // Route-specific checks
  if (route === "/mentee/dashboard") {
    return config.permissions.canAccessMenteeDashboard;
  }
  
  if (route === "/entrepreneur/hub" || route.includes("?view=entrepreneur")) {
    return config.permissions.canAccessEntrepreneurHub;
  }

  // Admin routes
  if (route.startsWith("/admin")) {
    return config.permissions.canAccessAdminFeatures;
  }

  // Program Manager routes
  if (route.startsWith("/program-manager")) {
    return config.permissions.canManagePrograms;
  }

  // Default: allow access to / and other routes
  return true;
}