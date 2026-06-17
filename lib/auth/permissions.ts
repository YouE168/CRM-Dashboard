// lib/auth/permissions.ts

export type UserRole = 
  | "admin" 
  | "program_manager" 
  | "mentor" 
  | "entrepreneur" 
  | "coalition" 
  | "partner" 
  | "staff";

export interface Permission {
  canViewCMS: boolean;
  canEditCMS: boolean;
  canViewAllPrograms: boolean;
  canEditPrograms: boolean;
  canViewUsers: boolean;
  canEditUsers: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canViewResources: boolean;
  canEditResources: boolean;
}

export const getPermissions = (role: UserRole): Permission => {
  switch (role) {
    case "admin":
      return {
        canViewCMS: true,
        canEditCMS: true,
        canViewAllPrograms: true,
        canEditPrograms: true,
        canViewUsers: true,
        canEditUsers: true,
        canViewReports: true,
        canExportData: true,
        canViewResources: true,
        canEditResources: true,
      };
    case "program_manager":
      return {
        canViewCMS: false,
        canEditCMS: false,
        canViewAllPrograms: false, // Only assigned programs
        canEditPrograms: true, // Only assigned programs
        canViewUsers: false,
        canEditUsers: false,
        canViewReports: true,
        canExportData: true,
        canViewResources: true,
        canEditResources: true, // Their program resources only
      };
    case "staff":
      return {
        canViewCMS: true,
        canEditCMS: false,
        canViewAllPrograms: true,
        canEditPrograms: false,
        canViewUsers: true,
        canEditUsers: false,
        canViewReports: true,
        canExportData: true,
        canViewResources: true,
        canEditResources: false,
      };
    case "mentor":
      return {
        canViewCMS: false,
        canEditCMS: false,
        canViewAllPrograms: false,
        canEditPrograms: false,
        canViewUsers: false,
        canEditUsers: false,
        canViewReports: false,
        canExportData: false,
        canViewResources: false,
        canEditResources: false,
      };
    case "entrepreneur":
      return {
        canViewCMS: false,
        canEditCMS: false,
        canViewAllPrograms: false,
        canEditPrograms: false,
        canViewUsers: false,
        canEditUsers: false,
        canViewReports: false,
        canExportData: false,
        canViewResources: false,
        canEditResources: false,
      };
    case "coalition":
      return {
        canViewCMS: false,
        canEditCMS: false,
        canViewAllPrograms: false,
        canEditPrograms: false,
        canViewUsers: false,
        canEditUsers: false,
        canViewReports: false,
        canExportData: false,
        canViewResources: false,
        canEditResources: false,
      };
    case "partner":
      return {
        canViewCMS: false,
        canEditCMS: false,
        canViewAllPrograms: false,
        canEditPrograms: false,
        canViewUsers: false,
        canEditUsers: false,
        canViewReports: false,
        canExportData: false,
        canViewResources: false,
        canEditResources: false,
      };
    default:
      return {
        canViewCMS: false,
        canEditCMS: false,
        canViewAllPrograms: false,
        canEditPrograms: false,
        canViewUsers: false,
        canEditUsers: false,
        canViewReports: false,
        canExportData: false,
        canViewResources: false,
        canEditResources: false,
      };
  }
};

// Get assigned programs for a user
export const getAssignedPrograms = (userEmail: string, role: UserRole): string[] => {
  if (role === "admin" || role === "staff") {
    return [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "Business Technical Assistance",
      "Parker Dewey Internships",
      "Workforce Development",
      "LHEATs",
      "Coalition Leadership Roundtable",
      "Rural Connect Magazine",
      "Park Upgrades",
      "Microloan Program",
      "MAZK Initiative",
    ];
  }
  
  // Load assignments from localStorage
  const assignments = localStorage.getItem(`program_assignments_${userEmail}`);
  if (assignments) {
    return JSON.parse(assignments);
  }
  
  // Default assignments based on role
  const defaultAssignments: Record<string, string[]> = {
    mentor: ["RCP Small Business Mentorship", "SEED Micro-Grant"],
    entrepreneur: [], // Entrepreneurs see their enrolled programs
    coalition: ["LHEATs", "Coalition Leadership Roundtable"],
    partner: ["Workforce Development", "Parker Dewey Internships", "MAZK Initiative"],
  };
  
  return defaultAssignments[role] || [];
};