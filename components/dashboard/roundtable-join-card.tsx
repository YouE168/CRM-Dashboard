"use client";

import { useState, useEffect } from "react";
import { ArrowRight, X, User, Video, Calendar } from "lucide-react";
import { RoundtableSignupForm } from "@/components/roundtable-signup-form";
import { LearnMoreModal } from "@/components/dashboard/leadership-tab";
import {
  getRoundtableApplicationForEmail,
  getNextMeeting,
  type NextMeetingInfo,
} from "@/lib/supabase/dashboard-data";

// "Join the Leadership Roundtable" CTA, shown on every non-admin
// dashboard (mentee/entrepreneur, mentor, partner, coalition). For most
// users this is the generic "Apply to Join" pitch. Once someone's
// application is approved, it switches to showing the real next-meeting
// details (date, time, description, Zoom join) instead - previously that
// info only existed on the admin's own Leadership Roundtable tab, so an
// approved member had no in-app way to know when/how to join.
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
  const [isApprovedMember, setIsApprovedMember] = useState(false);
  const [nextMeeting, setNextMeeting] = useState<NextMeetingInfo | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profileEmail) {
        setCheckingMembership(false);
        return;
      }
      try {
        const application = await getRoundtableApplicationForEmail(profileEmail);
        if (cancelled) return;
        if (application?.status === "approved") {
          setIsApprovedMember(true);
          const meeting = await getNextMeeting();
          if (!cancelled) setNextMeeting(meeting);
        }
      } catch (err) {
        console.error("Failed to check roundtable membership:", err);
      } finally {
        if (!cancelled) setCheckingMembership(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileEmail]);

  if (checkingMembership) {
    return (
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg h-24 animate-pulse" />
    );
  }

  if (isApprovedMember) {
    return (
      <>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                ✓ Roundtable Member
              </span>
              <button
                onClick={() => setShowLearnMore(true)}
                className="text-xs text-emerald-100 hover:text-white flex items-center gap-1"
              >
                Learn More <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {nextMeeting?.title ? (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="h-4 w-4" />
                  <h3 className="font-semibold">{nextMeeting.title}</h3>
                </div>
                <p className="text-emerald-100 text-sm mt-1">
                  {[nextMeeting.date, nextMeeting.time]
                    .filter(Boolean)
                    .join(" · ") || "Date/time TBD"}
                </p>
                {nextMeeting.description && (
                  <p className="text-emerald-100 text-sm mt-2">
                    {nextMeeting.description}
                  </p>
                )}
                <div className="mt-3">
                  {nextMeeting.zoomLink || nextMeeting.zoomPlaceholder ? (
                    <>
                      {(nextMeeting.zoomPlaceholder || nextMeeting.zoomPasscode) && (
                        <p className="text-emerald-100 text-xs mb-2">
                          {nextMeeting.zoomPlaceholder &&
                            `Meeting ID: ${nextMeeting.zoomPlaceholder}`}
                          {nextMeeting.zoomPlaceholder && nextMeeting.zoomPasscode && "  ·  "}
                          {nextMeeting.zoomPasscode &&
                            `Passcode: ${nextMeeting.zoomPasscode}`}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          if (nextMeeting.zoomLink) {
                            window.open(nextMeeting.zoomLink, "_blank");
                            return;
                          }
                          const cleanId = nextMeeting.zoomPlaceholder!.replace(/\s/g, "");
                          let zoomUrl = `https://zoom.us/j/${cleanId}`;
                          if (nextMeeting.zoomPasscode)
                            zoomUrl += `?pwd=${encodeURIComponent(nextMeeting.zoomPasscode)}`;
                          window.open(zoomUrl, "_blank");
                        }}
                        className="px-4 py-2 bg-white text-emerald-700 font-medium rounded-lg hover:bg-gray-50 transition-all text-sm flex items-center gap-2"
                      >
                        <Video className="h-4 w-4" />
                        Join Zoom Meeting
                      </button>
                    </>
                  ) : (
                    <p className="text-emerald-100 text-xs">
                      Zoom details coming soon
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-emerald-100 text-sm">
                No meeting scheduled yet - check back soon.
              </p>
            )}
          </div>
        </div>

        {showLearnMore && (
          <LearnMoreModal onClose={() => setShowLearnMore(false)} />
        )}
      </>
    );
  }

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
