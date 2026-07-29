"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Send, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { notifyJodyAccessRequest } from "@/lib/email-service";

export default function RequestAccessPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    requestedRole: "program_manager",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Don't let someone pile up duplicate pending requests for the same
      // email - this is best-effort (a race between two submissions could
      // still slip through, but that's fine, the admin just sees two rows).
      const { data: existing } = await supabase
        .from("access_requests")
        .select("id")
        .eq("email", formData.email)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        setError(
          "You already have a pending access request. Please wait for review.",
        );
        setSubmitting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("access_requests")
        .insert({
          name: formData.name,
          email: formData.email,
          reason: formData.reason,
          requested_role: formData.requestedRole,
          status: "pending",
        });

      if (insertError) {
        console.error("Failed to submit access request:", insertError);
        setError("Something went wrong submitting your request. Please try again.");
        setSubmitting(false);
        return;
      }

      // Best-effort heads-up email to Jody - the request is already real
      // and visible on her admin dashboard either way.
      notifyJodyAccessRequest({
        name: formData.name,
        email: formData.email,
        requestedRole: formData.requestedRole,
        reason: formData.reason,
      }).catch((err) =>
        console.error("Failed to send access request notification:", err),
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Access request error:", err);
      setError("Something went wrong submitting your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            Your request has been sent to Jody for review. You'll receive an
            email with instructions to set your password once approved.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6"
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
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requested Role *
            </label>
            <select
              value={formData.requestedRole}
              onChange={(e) =>
                setFormData({ ...formData, requestedRole: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="program_manager">
                Program Manager - Manage specific programs
              </option>
              <option value="staff">
                Staff/Admin - Full access to CMS, reports, all programs
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Request *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              placeholder="Please explain why you need this access..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
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
