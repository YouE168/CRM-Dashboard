"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Mail,
  Send,
  ArrowLeft,
  CheckCircle,
  User,
  Briefcase,
} from "lucide-react";

export default function RequestAccessPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    requestedRole: "program_manager",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get existing requests
    const requests = JSON.parse(
      localStorage.getItem("access_requests") || "[]",
    );

    // Check if user already has a pending request
    const existingPending = requests.find(
      (r: any) => r.email === formData.email && r.status === "pending",
    );

    if (existingPending) {
      alert(
        "You already have a pending access request. Please wait for review.",
      );
      return;
    }

    // Add new request
    const newRequest = {
      ...formData,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    requests.push(newRequest);
    localStorage.setItem("access_requests", JSON.stringify(requests));

    // Also open email to Jody as backup
    const subject = `Access Request: ${formData.name} - ${formData.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"}`;
    const body = `
Access Request Details:
-----------------------
Name: ${formData.name}
Email: ${formData.email}
Requested Role: ${formData.requestedRole === "program_manager" ? "Program Manager" : "Staff/Admin"}
Reason: ${formData.reason}
Submitted: ${new Date().toLocaleString()}

Please review this request at: ${window.location.origin}/admin/dashboard
    `;

    window.location.href = `mailto:jody@hbcat.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Request Sent!</h2>
          <p className="text-gray-500 mt-2">
            Your request has been sent to Jody. You will receive an email once
            your account has been upgraded.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Request Access</h1>
          <p className="text-sm text-gray-500 mt-1">
            Need staff or admin access? Request it here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requested Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.requestedRole}
              onChange={(e) =>
                setFormData({ ...formData, requestedRole: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            >
              <option value="program_manager">
                📋 Program Manager - Manage specific programs
              </option>
              <option value="staff">
                🔐 Staff/Admin - Full access to CMS, reports, all programs
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Request <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={4}
              placeholder="Please explain why you need this access..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Submit Request
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Your request will be sent to Jody for review. You'll receive an email
          once approved.
        </p>
      </div>
    </div>
  );
}
