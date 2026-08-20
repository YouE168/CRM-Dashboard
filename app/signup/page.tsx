"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle,
  Briefcase,
  User,
  Users,
  Handshake,
  Shield,
  Building,
  MapPin,
  Phone,
  Target,
} from "lucide-react";
import { notifyJodyNewUser } from "@/lib/email-service";
import {
  supabase,
  isSupabaseConfigured,
  isClient,
} from "@/lib/supabase/client";
import { linkBusinessContactToUser } from "@/lib/supabase/dashboard-data";
import { COUNTIES } from "@/lib/analytics-constants";

// Define the Role type
interface Role {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  programs: string[];
}

// User Roles - Updated with Mentee
const USER_ROLES = [
  {
    id: "mentee",
    label: "Mentee / Program Participant",
    icon: User,
    description:
      "Access mentorship, business programs, and entrepreneurial support",
    programs: [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "Business Professional Services",
    ],
  },
  {
    id: "entrepreneur",
    label: "Entrepreneur / Business Owner",
    icon: Briefcase,
    description: "Access mentorship, grants, and business support programs",
    programs: [
      "RCP Small Business Mentorship",
      "SEED Micro-Grant",
      "Business Professional Services",
    ],
  },
  {
    id: "mentor",
    label: "Mentor / Business Advisor",
    icon: User,
    description: "Guide entrepreneurs and earn $50/hr for mentoring",
    programs: ["RCP Small Business Mentorship", "SEED Micro-Grant"],
  },
  {
    id: "coalition",
    label: "Coalition Leader",
    icon: Users,
    description: "Lead Coalitions and Leadership Roundtable initiatives",
    programs: [
      "Coalitions",
      "Coalition Leadership Roundtable",
      "Rural Connect Magazine",
    ],
  },
  {
    id: "partner",
    label: "Partner Organization",
    icon: Handshake,
    description: "Collaborate on workforce, grants, and community initiatives",
    programs: [
      "Workforce Development",
      "Parker Dewey Internships",
      "MAZK Initiative",
    ],
  },
];

// Define Selected Role type
interface SelectedRole {
  id: string;
  label: string;
  programs: string[];
}

// Form steps
const STEPS = [
  "Select Roles",
  "Personal Info",
  "Organization Info",
  "Program Interests",
  "Review",
];

// Helper function to save signup to localStorage (fallback)
const saveSignup = (formData: any) => {
  const signups = JSON.parse(localStorage.getItem("programSignups") || "[]");
  signups.push({
    ...formData,
    submittedAt: new Date().toISOString(),
    status: "pending_review",
  });
  localStorage.setItem("programSignups", JSON.stringify(signups));
  return true;
};

// useSearchParams() requires a Suspense boundary during Next.js's build
// export/prerender step, or the build fails outright (confirmed by a
// real Vercel build error: "Error occurred prerendering page /signup").
// export const dynamic = "force-dynamic" above only affects runtime
// rendering, not this build-time requirement - so the actual page logic
// lives in SignupPageInner, and this default export just wraps it.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Business-invite mode: someone clicked a "Send Invite" link from a
  // business contact record (Business Professional Services > Businesses
  // tab). The role is already decided by whoever sent the invite, so we
  // skip "Select Roles" and "Program Interests" entirely and jump
  // straight from Personal Info -> Organization Info -> Review. See
  // components/dashboard/business-professional-services-tab.tsx's
  // handleSendInvite for how this link gets built.
  const [isBusinessInvite, setIsBusinessInvite] = useState(false);
  const [inviteContactId, setInviteContactId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    selectedRoles: [] as SelectedRole[],
    primaryRole: "",
    firstName: "",
    lastName: "",
    phone: "",
    county: "",
    address: "",
    organization: "",
    position: "",
    organizationType: "",
    yearsInRole: "",
    selectedPrograms: [] as string[],
    hearAbout: "",
    goals: "",
  });

  useEffect(() => {
    const inviteRoleId = searchParams.get("inviteRole");
    if (!inviteRoleId) return;
    const role = USER_ROLES.find((r) => r.id === inviteRoleId);
    if (!role) return;

    const prefillEmail = searchParams.get("email") || "";
    const prefillName = searchParams.get("name") || "";
    const prefillBusiness = searchParams.get("business") || "";
    const contactId = searchParams.get("contactId");
    const [firstName, ...rest] = prefillName.trim().split(/\s+/);

    setFormData((prev) => ({
      ...prev,
      email: prefillEmail,
      firstName: firstName || "",
      lastName: rest.join(" "),
      organization: prefillBusiness,
      selectedRoles: [{ id: role.id, label: role.label, programs: role.programs }],
      primaryRole: role.id,
      selectedPrograms: role.programs,
    }));
    setInviteContactId(contactId);
    setIsBusinessInvite(true);
    setCurrentStep(1);
    // Only ever needs to run once, off the URL this page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (role: Role) => {
    setFormData((prev) => {
      const isSelected = prev.selectedRoles.some((r) => r.id === role.id);
      let newSelectedRoles: SelectedRole[];

      if (isSelected) {
        newSelectedRoles = prev.selectedRoles.filter((r) => r.id !== role.id);
      } else {
        newSelectedRoles = [
          ...prev.selectedRoles,
          { id: role.id, label: role.label, programs: role.programs },
        ];
      }

      return {
        ...prev,
        selectedRoles: newSelectedRoles,
        primaryRole: prev.primaryRole || newSelectedRoles[0]?.id || "",
      };
    });
  };

  const setPrimaryRole = (roleId: string) => {
    setFormData((prev) => ({ ...prev, primaryRole: roleId }));
  };

  const handleProgramToggle = (program: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPrograms: prev.selectedPrograms.includes(program)
        ? prev.selectedPrograms.filter((p) => p !== program)
        : [...prev.selectedPrograms, program],
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (formData.selectedRoles.length === 0) {
          setError("Please select at least one role");
          return false;
        }
        if (!formData.primaryRole) {
          setError("Please select your primary role");
          return false;
        }
        break;
      case 1:
        if (!formData.firstName.trim()) {
          setError("First name is required");
          return false;
        }
        if (!formData.lastName.trim()) {
          setError("Last name is required");
          return false;
        }
        if (!formData.email.trim() || !formData.email.includes("@")) {
          setError("Valid email is required");
          return false;
        }
        if (!formData.password || formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return false;
        }
        break;
      case 2:
        break;
      case 3:
        if (formData.selectedPrograms.length === 0) {
          setError("Please select at least one program you're interested in");
          return false;
        }
        break;
      case 4:
        break;
    }
    setError("");
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      // Business-invite mode skips "Program Interests" (step 3) - jump
      // straight from Organization Info (2) to Review (4).
      if (isBusinessInvite && currentStep === 2) {
        setCurrentStep(4);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (isBusinessInvite && currentStep === 4) {
      setCurrentStep(2);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError("");

    try {
      // Check if Supabase is configured
      const useSupabase = isSupabaseConfigured() && isClient;

      if (useSupabase) {
        // ============================================
        // SUPABASE REGISTRATION
        // ============================================

        // 1. Create the real Supabase Auth account first, then mirror
        // it into public.users (no plaintext password stored - the
        // password lives only in Supabase Auth's own secure store).
        const { data: authSignupData, error: authSignupError } =
          await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: `${formData.firstName} ${formData.lastName}`,
                primary_role: formData.primaryRole,
              },
            },
          });

        if (authSignupError || !authSignupData.user) {
          console.error("Supabase auth signup error:", authSignupError);
          setError(
            authSignupError?.message ||
              "Failed to create account. Please try again.",
          );
          setIsSubmitting(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .insert({
            id: authSignupData.user.id,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
            primary_role: formData.primaryRole,
            status: "active",
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (userError) {
          console.error("Supabase user creation error:", userError);
          setError("Failed to create account. Please try again.");
          setIsSubmitting(false);
          return;
        }

        // 2. Create profile in Supabase
        // Note: the real profiles table's primary key IS the user id (no
        // separate user_id column), and it has no "position" column - that
        // field currently has no home in the schema.
        const { error: profileError } = await supabase.from("profiles").insert({
          id: userData.id,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          primary_role: formData.primaryRole,
          phone: formData.phone || "",
          organization: formData.organization || "",
          created_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error("Supabase profile creation error:", profileError);
          // Continue anyway - profile can be created later
        }

        // 3. ✅ Get all programs and create user_programs entries
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name");

        if (programsError) {
          console.error("Error fetching programs:", programsError);
        }

        if (programsData && programsData.length > 0) {
          // Only give this account rows for the programs relevant to
          // whichever role(s) they picked in the "Program Interests" step
          // (formData.selectedRoles[].programs) - not literally every
          // program in the catalog. Matching is a loose substring check
          // since the short labels shown at signup ("Workforce
          // Development", "Parker Dewey Internships") don't always exactly
          // match the full real program names ("Workforce Development &
          // Navigation", "Parker Dewey Micro-Internship"). Business
          // Professional Services is universal and always included.
          const selectedProgramKeywords = formData.selectedRoles.flatMap(
            (r) => r.programs,
          );
          const relevantPrograms = programsData.filter((program: any) => {
            if (program.name === "Business Professional Services") return true;
            return selectedProgramKeywords.some(
              (keyword: string) =>
                program.name.toLowerCase().includes(keyword.toLowerCase()) ||
                keyword.toLowerCase().includes(program.name.toLowerCase()),
            );
          });

          // ✅ Create user_programs only for the relevant programs
          // Only "Business Professional Services" is approved by default
          const userPrograms = relevantPrograms.map((program: any) => ({
            user_id: userData.id,
            program_id: program.id,
            approved: program.name === "Business Professional Services",
            progress: 0,
            created_at: new Date().toISOString(),
          }));

          const { error: userProgramsError } = await supabase
            .from("user_programs")
            .insert(userPrograms);

          if (userProgramsError) {
            console.error("Error creating user programs:", userProgramsError);
          } else {
            console.log(
              `✅ Created ${userPrograms.length} user_programs entries`,
            );
            console.log(`✅ Only "Business Professional Services" is approved`);
          }

          // 3b. ✅ Create a participants row so this person is immediately
          // visible in admin Mentor Matching / Tracking / Sessions and can
          // rate their mentor once assigned. Without this row nothing in
          // the mentoring system (mentor assignment, goals, sessions,
          // tracking, ratings) can ever find them. Scoped to "Business
          // Professional Services" since that's the program that's
          // auto-approved and where Jody's onboarding meeting happens -
          // mentor stays unassigned until she matches them there.
          //
          // Partner/coalition accounts don't go through mentor matching
          // at all (they have their own Partner dashboard/data model), so
          // tagging them with "Business Professional Services" here is
          // misleading on the admin Participants list - label them by
          // account type instead, with no program_id since it isn't a
          // real catalog program.
          //
          // Mentors are staff/contractors, not clients - they should never
          // show up in the Participants list or "Clients by Program"
          // chart, so no participants row is created for them at all
          // (they get a row in the separate `mentors` table instead, via
          // createMentorProfile() on their settings page).
          const isMentor = formData.primaryRole === "mentor";
          const isOrgAccount =
            formData.primaryRole === "partner" ||
            formData.primaryRole === "coalition";
          const defaultProgram = programsData.find(
            (p: any) => p.name === "Business Professional Services",
          );
          const orgProgramName =
            formData.primaryRole === "coalition"
              ? "Coalition Organization"
              : "Partner Organization";
          if (!isMentor && (isOrgAccount || defaultProgram)) {
            const { error: participantError } = await supabase
              .from("participants")
              .insert({
                user_id: userData.id,
                email: formData.email,
                name: `${formData.firstName} ${formData.lastName}`,
                phone: formData.phone || null,
                county: formData.county || null,
                program_id: isOrgAccount ? null : defaultProgram!.id,
                program_name: isOrgAccount
                  ? orgProgramName
                  : defaultProgram!.name,
                mentor: null,
                status: "active",
              });

            if (participantError) {
              console.error(
                "Error creating participant record:",
                participantError,
              );
            }
          }
        }

        // 3c. If this signup came from a business contact's "Send
        // Invite" link, link that contact back to the real account they
        // just created, so Jody can see the lead converted. Best-effort -
        // should never block the account itself from finishing.
        if (isBusinessInvite && inviteContactId) {
          try {
            await linkBusinessContactToUser(inviteContactId, userData.id);
          } catch (linkError) {
            console.error("Failed to link business contact to new user:", linkError);
          }
        }

        // 4. Send notification to Jody
        try {
          await notifyJodyNewUser({
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            role: formData.primaryRole,
            registrationDate: new Date().toISOString(),
          });
        } catch (emailError) {
          console.warn("Email notification failed:", emailError);
        }

        setSuccess(
          "✅ Account created successfully! You now have access to Business Professional Services. Jody has been notified. You will receive access to other programs once approved.",
        );
      } else {
        // ============================================
        // LOCALSTORAGE REGISTRATION (Fallback)
        // ============================================

        const users = JSON.parse(localStorage.getItem("users") || "[]");

        if (users.find((u: any) => u.email === formData.email)) {
          setError("User already exists with this email");
          setIsSubmitting(false);
          return;
        }

        // Create user with correct role assignment
        const newUser = {
          email: formData.email,
          password: formData.password,
          roles: formData.selectedRoles.map((r) => r.id),
          roleLabels: formData.selectedRoles.map((r) => r.label),
          primaryRole: formData.primaryRole,
          userType: formData.primaryRole,
          fullName: `${formData.firstName} ${formData.lastName}`,
          name: `${formData.firstName} ${formData.lastName}`,
          createdAt: new Date().toISOString(),
          status: "pending_approval",
          passwordSet: true,
          approvedPrograms: [], // Empty by default
        };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));

        // Save profile with correct role
        const userProfile = {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          roles: formData.selectedRoles.map((r) => r.label),
          primaryRole: formData.primaryRole,
          userType: formData.primaryRole,
          userTypes: formData.selectedRoles.map((r) => r.id),
          phone: formData.phone || "",
          organization: formData.organization || "",
          position: formData.position || "",
          selectedPrograms: formData.selectedPrograms,
          approvedPrograms: [], // Empty by default
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(
          `profile_${formData.email}`,
          JSON.stringify(userProfile),
        );

        saveSignup(formData);

        // Send notification to Jody
        try {
          await notifyJodyNewUser({
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            role: formData.primaryRole,
            registrationDate: new Date().toISOString(),
          });
        } catch (emailError) {
          console.warn("Email notification failed:", emailError);
        }

        setSuccess(
          "✅ Account created successfully! You now have access to Business Professional Services. Jody has been notified. You will receive access to other programs once approved.",
        );
      }

      // Redirect to login after success
      setTimeout(() => {
        router.push("/login");
      }, 5000);
    } catch (err) {
      console.error("Signup error:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const getAllProgramsFromRoles = (): string[] => {
    const programs = new Set<string>();
    formData.selectedRoles.forEach((role) => {
      role.programs.forEach((program) => {
        if (program !== "All Programs") {
          programs.add(program);
        }
      });
    });
    return Array.from(programs);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Your Roles
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Select ALL roles that apply to you. You can participate in
              multiple programs!
            </p>

            {formData.selectedRoles.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-emerald-700 font-medium mb-2">
                  You've selected:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedRoles.map((role) => (
                    <span
                      key={role.id}
                      className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                    >
                      {role.label}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-xs text-emerald-700 font-medium block mb-1">
                    Which is your primary role?
                  </label>
                  <select
                    value={formData.primaryRole}
                    onChange={(e) => setPrimaryRole(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select primary role</option>
                    {formData.selectedRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {USER_ROLES.map((role) => {
                const IconComponent = role.icon;
                const isSelected = formData.selectedRoles.some(
                  (r) => r.id === role.id,
                );
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium ${isSelected ? "text-emerald-700" : "text-gray-700"}`}
                        >
                          {role.label}
                        </p>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {role.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                County
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                  value={formData.county}
                  onChange={(e) => handleInputChange("county", e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 appearance-none bg-white"
                >
                  <option value="">Select county (optional)</option>
                  {COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Organization Information
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tell us about your organization (if applicable)
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization/Business Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) =>
                    handleInputChange("organization", e.target.value)
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your organization or business name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Position/Title
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., Founder, Director, Manager"
              />
            </div>
          </div>
        );

      case 3:
        const availablePrograms = getAllProgramsFromRoles();
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Program Interests
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Based on your selected roles, click to select the programs you're
              interested in.
            </p>

            {availablePrograms.length === 0 ? (
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-600">
                  Please go back and select at least one role to see available
                  programs.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availablePrograms.map((program) => {
                  const isSelected =
                    formData.selectedPrograms.includes(program);
                  return (
                    <button
                      key={program}
                      type="button"
                      onClick={() => handleProgramToggle(program)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Target
                          className={`h-4 w-4 ${isSelected ? "text-emerald-600" : "text-gray-400"}`}
                        />
                        <span
                          className={`text-sm ${isSelected ? "text-emerald-700 font-medium" : "text-gray-700"}`}
                        >
                          {program}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What are your goals?
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) => handleInputChange("goals", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Tell us what you hope to achieve through our programs..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Review Your Information
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-900 font-medium">
                  {formData.firstName} {formData.lastName}
                </span>

                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900">{formData.email}</span>

                <span className="text-gray-500">Primary Role:</span>
                <span className="text-gray-900">
                  {formData.selectedRoles.find(
                    (r) => r.id === formData.primaryRole,
                  )?.label || formData.primaryRole}
                </span>

                <span className="text-gray-500">All Roles:</span>
                <span className="text-gray-900">
                  {formData.selectedRoles.map((r) => r.label).join(", ")}
                </span>

                {formData.organization && (
                  <>
                    <span className="text-gray-500">Organization:</span>
                    <span className="text-gray-900">
                      {formData.organization}
                    </span>
                  </>
                )}

                <span className="text-gray-500">Selected Programs:</span>
                <span className="text-gray-900">
                  {formData.selectedPrograms.join(", ")}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps - business-invite mode only shows Personal
            Info, Organization Info, and Review (Select Roles and
            Program Interests are skipped since the role's already
            decided by whoever sent the invite), renumbered 1-2-3. */}
        <div className="mb-8">
          <div className="flex justify-between">
            {(isBusinessInvite ? [1, 2, 4] : [0, 1, 2, 3, 4]).map(
              (index, position) => (
                <div key={STEPS[index]} className="flex-1 text-center">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStep
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {position + 1}
                  </div>
                  <p
                    className={`text-xs mt-2 ${index <= currentStep ? "text-emerald-600 font-medium" : "text-gray-400"}`}
                  >
                    {STEPS[index]}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Rural Community Partners"
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              {isBusinessInvite
                ? "Create Your Account"
                : "Join Rural Community Partners"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isBusinessInvite
                ? "You've been invited to Rural Community Partners - just a few details to get you set up."
                : "Complete the form to get started"}
            </p>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 text-sm rounded-lg">
              <CheckCircle className="h-5 w-5 inline mr-2" />
              {success}
              <p className="text-xs text-green-600 mt-1">
                Redirecting to login page...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              {renderStepContent()}

              <div className="flex justify-between gap-3 mt-8 pt-4 border-t">
                {currentStep > (isBusinessInvite ? 1 : 0) && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Back
                  </button>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                )}
              </div>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <a href="/login" className="text-emerald-600 hover:underline">
                  Sign in
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
