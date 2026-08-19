// lib/role-programs.ts
//
// Which real catalog programs are relevant to each account type. Used by
// the admin "Add New Member" flow so Jody picks from the handful of
// programs that actually apply to the role she's adding, instead of the
// full 9-program catalog every time. Names here must match the real
// `programs` table exactly (see rename_lheats_to_coalitions.sql - the
// coalition program is "Coalitions", not "LHEATs").
export interface RoleProgramOption {
  id: string;
  label: string;
  programs: string[];
}

export const ROLE_PROGRAM_OPTIONS: RoleProgramOption[] = [
  {
    id: "mentee",
    label: "Mentee / Program Participant",
    programs: [
      "Business Professional Services",
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "SEK Catalyst: Empowered by KU",
    ],
  },
  {
    id: "entrepreneur",
    label: "Entrepreneur / Business Owner",
    programs: [
      "Business Professional Services",
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "SEK Catalyst: Empowered by KU",
    ],
  },
  {
    id: "mentor",
    label: "Mentor / Business Advisor",
    programs: ["RCP Small Business Mentorship", "SEED Micro-Grant"],
  },
  {
    id: "coalition",
    label: "Coalition Leader",
    programs: ["Coalitions", "Coalition Leadership Roundtable"],
  },
  {
    id: "partner",
    label: "Partner Organization",
    programs: [
      "Workforce Development & Navigation",
      "Parker Dewey Micro-Internship",
      "MAZK Initiative",
    ],
  },
];

export function getProgramsForRole(roleId: string): string[] {
  return ROLE_PROGRAM_OPTIONS.find((r) => r.id === roleId)?.programs ?? [];
}

// Programs pre-checked by default when Jody picks that role - matches
// what individual accounts got automatically before this picker existed.
// Org accounts (partner/coalition) had no default, so she picks from
// scratch for those.
export function getDefaultProgramsForRole(roleId: string): string[] {
  if (roleId === "mentee" || roleId === "entrepreneur") {
    return ["Business Professional Services"];
  }
  return [];
}
