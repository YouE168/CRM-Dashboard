"use client";
export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      "Microloan Program",
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
      "Microloan Program",
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
    description: "Lead LHEATs and Leadership Roundtable initiatives",
    programs: [
      "LHEATs",
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

// Helper function to save signup
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

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    address: "",
    organization: "",
    position: "",
    organizationType: "",
    yearsInRole: "",
    selectedPrograms: [] as string[],
    hearAbout: "",
    goals: "",
  });

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
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");

      if (users.find((u: any) => u.email === formData.email)) {
        setError("User already exists with this email");
        setIsSubmitting(false);
        return;
      }

      const newUser = {
        email: formData.email,
        password: formData.password,
        roles: formData.selectedRoles.map((r) => r.id),
        roleLabels: formData.selectedRoles.map((r) => r.label),
        primaryRole: formData.primaryRole,
        fullName: `${formData.firstName} ${formData.lastName}`,
        createdAt: new Date().toISOString(),
        status: "pending_approval",
      };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      const userProfile = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        roles: formData.selectedRoles.map((r) => r.label),
        primaryRole: formData.primaryRole,
        userTypes: formData.selectedRoles.map((r) => r.id),
        phone: formData.phone,
        organization: formData.organization,
        position: formData.position,
        selectedPrograms: formData.selectedPrograms,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(
        `profile_${formData.email}`,
        JSON.stringify(userProfile),
      );

      saveSignup(formData);

      setSuccess(
        "Account created successfully! Your request has been sent for approval.",
      );

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
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

                <span className="text-gray-500">Roles:</span>
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
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex-1 text-center">
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <p
                  className={`text-xs mt-2 ${index <= currentStep ? "text-emerald-600 font-medium" : "text-gray-400"}`}
                >
                  {step}
                </p>
              </div>
            ))}
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
              Join Rural Community Partners
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Complete the form to get started
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
                {currentStep > 0 && (
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
