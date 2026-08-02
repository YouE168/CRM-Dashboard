"use client";

import { useState } from "react";
import { ArrowRight, X, User } from "lucide-react";
import { RoundtableSignupForm } from "@/components/roundtable-signup-form";
import { LearnMoreModal } from "@/components/dashboard/leadership-tab";

// "Join the Leadership Roundtable" CTA, shown on every non-admin
// dashboard (mentee/entrepreneur, mentor, partner, coalition). Mirrors
// the same card admin sees, minus the management tools (Action Items,
// applications review, etc.) which stay admin-only under Program
// Management > Leadership Roundtable.
export function RoundtableJoinCard({
  profileName,
  profileEmail,
  showToast,
}: {
  profileName: string;
  profileEmail: string;
  showToast: (
    message: string,
    type: "success" | "error" | "info" | "warning",
    duration?: number,
  ) => void;
}) {
  const [showApply, setShowApply] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 md:py-6 md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Open for Applications
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Join the Leadership Roundtable
            </h2>
            <p className="text-emerald-100 mt-1 max-w-md">
              Program leaders, key stakeholders, and community champions — your
              voice matters.
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-emerald-100">
              <span className="flex items-center gap-1">
                ✓ Monthly meetings
              </span>
              <span className="flex items-center gap-1">✓ Peer networking</span>
              <span className="flex items-center gap-1">✓ Strategic input</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowApply(true)}
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md text-sm"
            >
              Apply to Join →
            </button>
            <button
              onClick={() => setShowLearnMore(true)}
              className="px-6 py-3 bg-emerald-500/30 text-white font-medium rounded-xl hover:bg-emerald-500/40 transition-all text-sm border border-white/20 flex items-center gap-2"
            >
              Learn More <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showApply && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Apply to Leadership Roundtable
                </h2>
              </div>
              <button
                onClick={() => setShowApply(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <RoundtableSignupForm
                profileName={profileName}
                profileEmail={profileEmail}
                onSuccess={() => {
                  showToast(
                    "Application submitted - Jody's team will follow up soon",
                    "success",
                  );
                  setTimeout(() => setShowApply(false), 1200);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showLearnMore && (
        <LearnMoreModal onClose={() => setShowLearnMore(false)} />
      )}
    </>
  );
}
