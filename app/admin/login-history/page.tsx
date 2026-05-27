"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface LoginRecord {
  email: string;
  timestamp: string;
  userAgent: string;
  loginDate: string;
  loginTime: string;
}

export default function LoginHistoryPage() {
  const router = useRouter();
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
      return;
    }

    // Get login history (no admin check for now)
    const history = JSON.parse(localStorage.getItem("loginHistory") || "[]");
    setLoginHistory(history.reverse());
    setIsLoading(false);
  }, [router]);

  const exportToCSV = () => {
    const headers = ["Email", "Login Date", "Login Time", "Device/Browser"];
    const csvData = loginHistory.map((log) => [
      log.email,
      log.loginDate || new Date(log.timestamp).toLocaleDateString(),
      log.loginTime || new Date(log.timestamp).toLocaleTimeString(),
      log.userAgent || "N/A",
    ]);
    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `login_history_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Login History
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              For state funding reporting
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              📊 Export to CSV
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">
              Login Records ({loginHistory.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">
                    Login Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">
                    Login Time
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">
                    Device Info
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loginHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No login history yet. Log in to see records.
                    </td>
                  </tr>
                ) : (
                  loginHistory.map((login, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {login.email}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {login.loginDate ||
                          new Date(login.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {login.loginTime ||
                          new Date(login.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs truncate max-w-md">
                        {login.userAgent || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
