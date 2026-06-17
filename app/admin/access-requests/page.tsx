"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Shield,
} from "lucide-react";

interface AccessRequest {
  name: string;
  email: string;
  reason: string;
  requestedRole: string;
  submittedAt: string;
  status: string;
}

export default function AccessRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user !== "admin@ruralcommunity.org") {
      router.push("/");
      return;
    }
    setIsAdmin(true);

    const savedRequests = JSON.parse(
      localStorage.getItem("access_requests") || "[]",
    );
    setRequests(savedRequests);
  }, [router]);

  const handleApprove = (request: AccessRequest) => {
    // Update user's role in localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const updatedUsers = users.map((u: any) => {
      if (u.email === request.email) {
        return {
          ...u,
          primaryRole: request.requestedRole,
          roleLabels: [
            request.requestedRole === "program_manager"
              ? "Program Manager"
              : "Staff",
          ],
          userType: request.requestedRole,
          status: "approved",
        };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Also update profile
    const profile = JSON.parse(
      localStorage.getItem(`profile_${request.email}`) || "{}",
    );
    profile.primaryRole = request.requestedRole;
    profile.userType = request.requestedRole;
    profile.role =
      request.requestedRole === "program_manager" ? "Program Manager" : "Staff";
    localStorage.setItem(`profile_${request.email}`, JSON.stringify(profile));

    // Remove from requests
    const remainingRequests = requests.filter((r) => r.email !== request.email);
    setRequests(remainingRequests);
    localStorage.setItem("access_requests", JSON.stringify(remainingRequests));

    alert(
      `✅ Approved ${request.name} as ${request.requestedRole === "program_manager" ? "Program Manager" : "Staff"}`,
    );
  };

  const handleReject = (request: AccessRequest) => {
    if (confirm(`Reject ${request.name}'s access request?`)) {
      const remainingRequests = requests.filter(
        (r) => r.email !== request.email,
      );
      setRequests(remainingRequests);
      localStorage.setItem(
        "access_requests",
        JSON.stringify(remainingRequests),
      );
      alert(`❌ Rejected ${request.name}'s request`);
    }
  };

  if (!isAdmin) return null;

  const pendingRequests = requests.filter((r) => r.status !== "approved");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                Access Requests
              </h1>
              <p className="text-xs text-gray-500">
                Review and approve staff/admin access requests
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending access requests</p>
              <p className="text-xs mt-1">
                Users can request access from the login page
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingRequests.map((request, idx) => (
                <div key={idx} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {request.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          {request.requestedRole === "program_manager"
                            ? "Program Manager"
                            : "Staff/Admin"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Mail className="h-3 w-3" />
                        {request.email}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Reason:</span>{" "}
                        {request.reason}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted:{" "}
                        {new Date(request.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
