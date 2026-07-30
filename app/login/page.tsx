"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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

// Main Login Page
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ✅ FIXED: Check authentication ONCE on mount, with proper cleanup
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        // Only redirect if still mounted and user exists
        if (isMounted && data.user) {
          // Get user role from Supabase
          const { data: userData } = await supabase
            .from("users")
            .select("primary_role")
            .eq("id", data.user.id)
            .single();

          const role = userData?.primary_role || "entrepreneur";

          if (role === "admin" || role === "staff") {
            router.replace("/admin/dashboard");
          } else if (role === "program_manager") {
            router.replace("/program-manager/dashboard");
          } else {
            router.replace("/");
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const handleSendResetLink = async (resetEmail: string): Promise<boolean> => {
    // Goes through our own API route (which uses generateLink + Resend)
    // instead of supabase.auth.resetPasswordForEmail() directly, so the
    // email is branded as Rural Community Partners / Jody instead of
    // Supabase's own default "Reset your password" email.
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const result = await res.json();
      return res.ok && result.success;
    } catch (err) {
      console.error("Failed to request password reset:", err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("primary_role, status")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (userError || !userRow) {
        setError(
          "Signed in, but couldn't load your profile. Contact an admin.",
        );
        setLoading(false);
        return;
      }

      if (userRow.status && userRow.status !== "active") {
        setError(
          userRow.status === "pending_approval"
            ? "Your account is pending approval."
            : userRow.status === "rejected"
              ? "Your access request has been rejected. Please contact support."
              : "Your account has been deactivated. Please contact support.",
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const userRole = userRow.primary_role || "entrepreneur";

      // ✅ Use replace instead of push to prevent back button issues
      if (userRole === "admin" || userRole === "staff") {
        router.replace("/admin/dashboard");
      } else if (userRole === "program_manager") {
        router.replace("/program-manager/dashboard");
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
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