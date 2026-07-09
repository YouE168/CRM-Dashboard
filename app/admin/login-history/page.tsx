"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if user is already logged in
    const user = localStorage.getItem("currentUser");
    if (user) {
      router.push("/");
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(
      (u: any) => u.email === email && u.password === password,
    );

    if (!user) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    // Check if user is pending approval
    if (user.status === "pending_approval") {
      setError(
        "Your account is pending approval. Please wait for Jody to approve your access.",
      );
      setLoading(false);
      return;
    }

    // Check if user is rejected
    if (user.status === "rejected") {
      setError(
        "Your access request has been rejected. Please contact Jody for assistance.",
      );
      setLoading(false);
      return;
    }

    // Check if user is approved but password not set
    if (user.status === "approved" && !user.passwordSet) {
      setError(
        "Please set your password first. Check your email for the activation link, or contact Jody.",
      );
      setLoading(false);
      return;
    }

    // Check if user is active or approved
    if (user.status !== "active" && user.status !== "approved") {
      setError("Your account has been deactivated. Please contact support.");
      setLoading(false);
      return;
    }

    // Record login history
    const loginHistory = JSON.parse(
      localStorage.getItem("loginHistory") || "[]",
    );
    const now = new Date();
    loginHistory.push({
      email: user.email,
      timestamp: now.toISOString(),
      loginDate: now.toLocaleDateString(),
      loginTime: now.toLocaleTimeString(),
      userAgent: navigator.userAgent || "Unknown",
    });
    localStorage.setItem("loginHistory", JSON.stringify(loginHistory));

    // Login successful
    localStorage.setItem("currentUser", user.email);

    // If user is admin, redirect to admin dashboard
    if (user.primaryRole === "admin") {
      router.push("/admin/dashboard");
    }
    // If user is program manager, redirect to program manager dashboard
    else if (user.primaryRole === "program_manager") {
      router.push("/program-manager/dashboard");
    }
    // Otherwise go to main dashboard
    else {
      router.push("/");
    }

    setLoading(false);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your Rural Community Partners account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <a
              href="/signup"
              className="text-emerald-600 hover:underline font-medium"
            >
              Sign up
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Need staff access?{" "}
            <a
              href="/request-access"
              className="text-emerald-600 hover:underline"
            >
              Request Access
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
