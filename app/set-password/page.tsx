// app/set-password/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// Landing page for a real Supabase invite link (see
// app/api/admin/approve-access/route.ts, which generates the invite via
// supabaseAdmin.auth.admin.generateLink({ type: "invite", ... , options:
// { redirectTo: ".../set-password" } }) and emails it via
// sendAccessInviteEmail). Clicking the link in that email auto-authenticates
// the browser with a real Supabase session - but the account still has NO
// password set, so this page's only job is to force the user to set one
// via supabase.auth.updateUser before they're allowed into the app.
//
// This replaces an older page that only understood a homegrown
// localStorage("access_requests") verification-token scheme, which never
// matched what the real invite flow actually sends.
export default function SetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      // The Supabase client auto-detects the invite tokens in the URL and
      // establishes a session on load, but that can take a tick - give it
      // a moment, then check.
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setHasSession(true);
        setName(
          (data.user.user_metadata?.name as string | undefined) ||
            data.user.email ||
            "",
        );
      }
      setChecking(false);
    };

    checkSession();

    // In case the session finishes establishing itself just after the
    // initial check.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setHasSession(true);
        setName(
          (session.user.user_metadata?.name as string | undefined) ||
            session.user.email ||
            "",
        );
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message || "Failed to set password.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);

      // Route them to the dashboard that matches their role, same logic
      // used at login.
      const { data: authData } = await supabase.auth.getUser();
      let destination = "/";
      if (authData.user) {
        const { data: userRow } = await supabase
          .from("users")
          .select("primary_role")
          .eq("id", authData.user.id)
          .maybeSingle();
        const role = userRow?.primary_role || "entrepreneur";
        if (role === "admin" || role === "staff") {
          destination = "/admin/dashboard";
        } else if (role === "program_manager") {
          destination = "/program-manager/dashboard";
        }
      }

      setTimeout(() => {
        router.replace(destination);
      }, 1500);
    } catch (err) {
      console.error("Error setting password:", err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Verifying your invite link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            {success
              ? "Your password has been set successfully!"
              : hasSession
                ? `Welcome${name ? `, ${name}` : ""} — create a password to activate your account`
                : "This invite link is invalid or has expired"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-600">
                ✅ Password set! Taking you to your dashboard...
              </p>
            </div>
          </div>
        ) : hasSession ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Minimum 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Setting password..." : "Set Password"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-700">
                This link is invalid or has expired. Please contact Jody for a new invite,
                or log in if you've already set your password.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
