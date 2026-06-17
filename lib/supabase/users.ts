// lib/supabase/users.ts

export interface User {
  id: string;
  email: string;
  password: string;
  roles: string[];
  roleLabels: string[];
  primaryRole?: string;
  fullName: string;
  phone?: string;
  organization?: string;
  position?: string;
  selectedPrograms: string[];
  goals?: string;
  status: "approved" | "rejected";  // Removed pending_approval
  createdAt: string;
  updatedAt?: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  roleLabel: string;
  phone?: string;
  address?: string;
  organization?: string;
  position?: string;
  organizationType?: string;
  yearsInRole?: string;
  selectedPrograms: string[];
  hearAbout?: string;
  goals?: string;
  agreeToTerms: boolean;
  receiveUpdates: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Storage keys
const STORAGE_KEYS = {
  USERS: "users",
  SIGNUPS: "programSignups",
  CURRENT_USER: "currentUser",
  LOGIN_HISTORY: "loginHistory",
  USER_PROFILES: "userProfiles",
};

// Helper function to generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Store signup data
export const submitSignup = async (signupData: SignupData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if user already exists
    const existingUsers = getUsers();
    if (existingUsers.find(u => u.email === signupData.email)) {
      return { success: false, error: "User with this email already exists" };
    }

    // Create new user - NOW APPROVED IMMEDIATELY
    const newUser: User = {
      id: generateId(),
      email: signupData.email,
      password: signupData.password,
      roles: [signupData.role],
      roleLabels: [signupData.roleLabel],
      fullName: `${signupData.firstName} ${signupData.lastName}`,
      phone: signupData.phone,
      organization: signupData.organization,
      position: signupData.position,
      selectedPrograms: signupData.selectedPrograms,
      goals: signupData.goals,
      status: "approved", // Immediately approved!
      createdAt: new Date().toISOString(),
    };

    // Save user
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));

    // Save signup details for record keeping
    const signupRecord = {
      ...signupData,
      submittedAt: new Date().toISOString(),
      status: "approved",
      userId: newUser.id,
    };
    const existingSignups = JSON.parse(localStorage.getItem(STORAGE_KEYS.SIGNUPS) || "[]");
    localStorage.setItem(STORAGE_KEYS.SIGNUPS, JSON.stringify([...existingSignups, signupRecord]));

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

// Get all users
export const getUsers = (): User[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
};

// Get pending signups (now just returns empty array since no pending)
export const getPendingSignups = (): any[] => {
  if (typeof window === "undefined") return [];
  return []; // No pending signups anymore
};

// Login user - NO APPROVAL CHECK
export const loginUser = (credentials: LoginCredentials): LoginResponse => {
  const users = getUsers();
  
  // Check for admin
  if (credentials.email === "admin@ruralcommunity.org" && credentials.password === "admin123") {
    const adminUser: User = {
      id: "admin-1",
      email: "admin@ruralcommunity.org",
      password: "admin123",
      roles: ["admin"],
      roleLabels: ["Staff / Admin"],
      fullName: "Admin User",
      selectedPrograms: ["All Programs"],
      status: "approved",
      createdAt: new Date().toISOString(),
    };
    return { success: true, user: adminUser };
  }

  // Check for regular user
  const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
  
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  // No pending approval check - all users are approved!

  // Track login history
  trackLoginHistory(credentials.email);

  return { success: true, user };
};

// Track login history for reporting
export const trackLoginHistory = (email: string): void => {
  const loginHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_HISTORY) || "[]");
  loginHistory.push({
    email,
    timestamp: new Date().toISOString(),
    loginDate: new Date().toLocaleDateString(),
    loginTime: new Date().toLocaleTimeString(),
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "Server",
  });
  localStorage.setItem(STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(loginHistory));
};

// Get current logged-in user
export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!email) return null;
  
  if (email === "admin@ruralcommunity.org") {
    return {
      id: "admin-1",
      email: "admin@ruralcommunity.org",
      password: "",
      roles: ["admin"],
      roleLabels: ["Staff / Admin"],
      fullName: "Admin User",
      selectedPrograms: ["All Programs"],
      status: "approved",
      createdAt: new Date().toISOString(),
    };
  }

  const users = getUsers();
  return users.find(u => u.email === email) || null;
};

// Set current user (on login)
export const setCurrentUser = (email: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, email);
};

// Logout user
export const logoutUser = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Get user profile
export const getUserProfile = (email: string): any => {
  if (typeof window === "undefined") return null;
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILES) || "{}");
  return profiles[email] || null;
};

// Save user profile
export const saveUserProfile = (email: string, profile: any): void => {
  if (typeof window === "undefined") return;
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILES) || "{}");
  profiles[email] = { ...profile, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
};

// Get login history for reporting
export const getLoginHistory = (): any[] => {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGIN_HISTORY) || "[]");
};

// Get signup stats (simplified)
export const getSignupStats = () => {
  const users = getUsers();
  
  return {
    totalUsers: users.length,
    approved: users.filter(u => u.status === "approved").length,
    totalSignups: users.length,
    byRole: users.reduce((acc: any, user) => {
      user.roleLabels.forEach(role => {
        acc[role] = (acc[role] || 0) + 1;
      });
      return acc;
    }, {}),
  };
};

// Helper functions for program access
export const hasProgramAccess = (user: User | null, programName: string): boolean => {
  if (!user) return false;
  if (user.roles.includes("admin")) return true;
  return user.selectedPrograms.includes(programName) || user.selectedPrograms.includes("All Programs");
};

export const getAccessiblePrograms = (user: User | null): string[] => {
  if (!user) return [];
  if (user.roles.includes("admin")) {
    return [
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
  }
  return user.selectedPrograms;
};