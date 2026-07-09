"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (!token) {
      setError("Invalid or missing verification token. Please contact Jody for a new link.");
      setValidToken(false);
      return;
    }

    // Check if token exists and is valid
    const requests = JSON.parse(localStorage.getItem("access_requests") || "[]");
    const request = requests.find((r: any) => r.verificationToken === token);

    if (request && request.status === "approved" && !request.passwordSet) {
      setValidToken(true);
      setError("");
    } else if (request && request.passwordSet) {
      setError("Your password has already been set. Please login.");
      setValidToken(false);
    } else {
      setError("Invalid verification token. Please contact Jody for a new link.");
      setValidToken(false);
    }
  }, [token]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Get all users
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Find the user with this token
      const requests = JSON.parse(localStorage.getItem("access_requests") || "[]");
      const request = requests.find((r: any) => r.verificationToken === token);
      
      if (!request) {
        setError("Invalid request. Please contact Jody.");
        setLoading(false);
        return;
      }

      // Find and update the user
      const userIndex = users.findIndex((u: any) => u.email === request.email);
      
      if (userIndex === -1) {
        // Create the user if they don't exist
        users.push({
          email: request.email,
          name: request.name,
          password: password,
          passwordSet: true,
          primaryRole: request.requestedRole,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      } else {
        // Update existing user
        users[userIndex].password = password;
        users[userIndex].passwordSet = true;
        users[userIndex].status = "active";
      }
      
      localStorage.setItem("users", JSON.stringify(users));

      // Mark request as passwordSet
      const updatedRequests = requests.map((r: any) =>
        r.verificationToken === token ? { ...r, passwordSet: true } : r
      );
      localStorage.setItem("access_requests", JSON.stringify(updatedRequests));

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Error setting password:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (validToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Verifying your token...</p>
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
              : "Create a secure password for your account"}
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
                ✅ Password set successfully! Redirecting to login...
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : validToken ? (
          <form onSubmit={handleSetPassword} className="space-y-4">
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
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting password..." : "Set Password"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
            <button
              onClick={() => router.push("/request-access")}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Request New Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
