"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, CheckCircle } from "lucide-react";
import { loginUser, setCurrentUser } from "@/lib/supabase/users";

// Forgot Password Modal Component
function ForgotPasswordModal({
  isOpen,
  onClose,
  onSend,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"form" | "sent" | "error">("form");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    const success = await onSend(email);

    if (success) {
      setStep("sent");
    } else {
      setStep("error");
      setError("Email not found. Please check and try again.");
    }

    setIsLoading(false);
  };

  const handleReset = () => {
    setStep("form");
    setEmail("");
    setError("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        {step === "form" && (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Reset Password
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "sent" && (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Check Your Email
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Click the link in the email to create a new password.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                handleReset();
              }}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Back to Sign In
            </button>
          </>
        )}

        {step === "error" && (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Email Not Found
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                We couldn't find an account with that email address.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  onClose();
                  handleReset();
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Reset Password Page Component
function ResetPasswordPage({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: (newPassword: string) => boolean;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    const resetSuccess = onReset(newPassword);
    setTimeout(() => {
      if (resetSuccess) setSuccess(true);
      else setError("Reset link expired. Please request a new one.");
      setIsLoading(false);
    }, 1000);
  };

  if (success) {
    return (
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Reset!
          </h2>
          <p className="text-gray-500 mb-6">
            Your password has been successfully reset.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl p-8">
      <button
        onClick={onClose}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sign In
      </button>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Password
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your new password below
        </p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              required
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
          <p className="text-xs text-gray-400 mt-1">
            Must be at least 6 characters
          </p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

// Main Login Page
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setResetToken(token);
      setShowResetPassword(true);
    }
  }, []);

  const handleSendResetLink = async (resetEmail: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userExists = users.some((u: any) => u.email === resetEmail);
    if (!userExists && resetEmail !== "admin@ruralcommunity.org") return false;
    const fakeToken = btoa(`${resetEmail}-${Date.now()}`);
    const resetRequests = JSON.parse(
      localStorage.getItem("passwordResets") || "[]",
    );
    resetRequests.push({
      email: resetEmail,
      token: fakeToken,
      expiresAt: Date.now() + 3600000,
    });
    localStorage.setItem("passwordResets", JSON.stringify(resetRequests));
    const resetLink = `${window.location.origin}/login?token=${fakeToken}`;
    console.log("📧 Password Reset Link:", resetLink);
    return true;
  };

  const handleResetPassword = (newPassword: string): boolean => {
    if (!resetToken) return false;
    const resetRequests = JSON.parse(
      localStorage.getItem("passwordResets") || "[]",
    );
    const request = resetRequests.find((r: any) => r.token === resetToken);
    if (request && request.expiresAt > Date.now()) {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map((u: any) =>
        u.email === request.email ? { ...u, password: newPassword } : u,
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      const remainingRequests = resetRequests.filter(
        (r: any) => r.token !== resetToken,
      );
      localStorage.setItem("passwordResets", JSON.stringify(remainingRequests));
      return true;
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = loginUser({ email, password });

    if (result.success && result.user) {
      setCurrentUser(email);

      // Redirect based on user role - NO APPROVAL CHECK
      const userRole =
        result.user.primaryRole || result.user.roles?.[0] || "entrepreneur";

      if (
        userRole === "admin" ||
        userRole === "staff" ||
        userRole === "program_manager"
      ) {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } else {
      setError(result.error || "Invalid email or password");
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
        <ResetPasswordPage
          onClose={() => {
            setShowResetPassword(false);
            setResetToken(null);
            window.history.replaceState({}, "", "/login");
          }}
          onReset={handleResetPassword}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="Rural Community Partners"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Rural Community Partners
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your dashboard
          </p>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
                required
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
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/signup")}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Don't have an account? Create one
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/admin/request-access")}
            className="text-xs text-emerald-600 hover:text-emerald-700"
          >
            Need Staff or Admin Access? Request here
          </button>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Need help? Contact{" "}
            <a
              href="mailto:jody@hbcat.org"
              className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
            >
              jody@hbcat.org
            </a>
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSend={handleSendResetLink}
      />
    </div>
  );
}

// Missing ArrowLeft import
const ArrowLeft = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
