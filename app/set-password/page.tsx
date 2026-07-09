// app/set-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Check, X, Shield, Loader2 } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [requestedRole, setRequestedRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setValidToken(false);
      return;
    }

    // Get access requests from localStorage
    const requests = JSON.parse(
      localStorage.getItem("access_requests") || "[]",
    );
    console.log("All requests:", requests); // Debug log

    // Find the request with matching token
    const request = requests.find((r: any) => r.verificationToken === token);
    console.log("Found request:", request); // Debug log

    if (request && request.status === "approved" && !request.passwordSet) {
      setValidToken(true);
      setUserEmail(request.email);
      setUserName(request.name);
      setRequestedRole(request.requestedRole);
    } else if (request && request.passwordSet) {
      setError("This link has already been used. Please request a new one.");
    } else {
      setValidToken(false);
    }

    setLoading(false);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem("users") || "[]");

      // Find or create user
      let userIndex = users.findIndex((u: any) => u.email === userEmail);

      if (userIndex !== -1) {
        // Update existing user
        users[userIndex].password = password;
        users[userIndex].passwordSet = true;
        users[userIndex].status = "active";
        users[userIndex].primaryRole = requestedRole;
      } else {
        // Create new user
        users.push({
          email: userEmail,
          password: password,
          fullName: userName,
          primaryRole: requestedRole,
          status: "active",
          passwordSet: true,
          createdAt: new Date().toISOString(),
        });
      }

      localStorage.setItem("users", JSON.stringify(users));

      // Mark request as passwordSet
      const requests = JSON.parse(
        localStorage.getItem("access_requests") || "[]",
      );
      const updatedRequests = requests.map((r: any) =>
        r.verificationToken === token ? { ...r, passwordSet: true } : r,
      );
      localStorage.setItem("access_requests", JSON.stringify(updatedRequests));

      // Also create profile for the user
      const profile = {
        name: userName,
        email: userEmail,
        primaryRole: requestedRole,
        userType: requestedRole,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`profile_${userEmail}`, JSON.stringify(profile));

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Error setting password:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Verifying your link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "Invalid verification token. Please contact Jody for a new link."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password Set!
          </h2>
          <p className="text-gray-600 mb-2">
            Your password has been set successfully!
          </p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Set Your Password
          </h2>
          <p className="text-gray-600 mt-2">
            Welcome, <strong>{userName}</strong>!
          </p>
          <p className="text-sm text-gray-500">
            You've been granted{" "}
            <span className="font-medium text-emerald-600">
              {requestedRole}
            </span>{" "}
            access.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Please set your password to activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-10"
                placeholder="Min. 8 characters"
                required
                minLength={8}
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
            <p className="text-xs text-gray-400 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
              <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting Password...
              </>
            ) : (
              "Set Password"
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          This link will expire in 24 hours. If you need a new link, please
          contact your administrator.
        </p>
      </div>
    </div>
  );
}
