// components/dashboard/notification-tester.tsx
"use client";

import { useState } from "react";
import { Bell, Mail, User, Award, Calendar, Send } from "lucide-react";
import {
  notificationService,
  NotificationHelpers,
} from "@/lib/notification-service";

export function NotificationTester() {
  const [loading, setLoading] = useState<string | null>(null);

  const testNotification = async (
    type: string,
    action: () => Promise<void>,
  ) => {
    setLoading(type);
    try {
      await action();
    } catch (error) {
      console.error("Error sending test notification:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Bell className="h-5 w-5 text-emerald-600" />
        Test Notifications
        <span className="text-xs font-normal text-gray-400">(Real-time)</span>
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            testNotification("mentor", async () => {
              await NotificationHelpers.notifyMentorActivity(
                "Sarah Johnson",
                "logged_hours",
                "3 hours logged",
              );
            })
          }
          disabled={loading === "mentor"}
          className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm flex items-center justify-center gap-1"
        >
          {loading === "mentor" ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
          ) : (
            <>
              <User className="h-4 w-4" />
              Test Mentor Alert
            </>
          )}
        </button>

        <button
          onClick={() =>
            testNotification("participant", async () => {
              await NotificationHelpers.notifyParticipantMilestone(
                "Michael Chen",
                "Business Plan Complete",
                "SEED Micro-Grant",
              );
            })
          }
          disabled={loading === "participant"}
          className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm flex items-center justify-center gap-1"
        >
          {loading === "participant" ? (
            <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent" />
          ) : (
            <>
              <Award className="h-4 w-4" />
              Test Milestone
            </>
          )}
        </button>

        <button
          onClick={() =>
            testNotification("report", async () => {
              const nextMonth = new Date();
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              await NotificationHelpers.sendReportReminder(
                nextMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                }),
                "5th of the month",
              );
            })
          }
          disabled={loading === "report"}
          className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm flex items-center justify-center gap-1"
        >
          {loading === "report" ? (
            <div className="animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent" />
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              Test Report Reminder
            </>
          )}
        </button>

        <button
          onClick={() =>
            testNotification("email", async () => {
              await notificationService.sendEmail({
                to: "test@example.com",
                subject: "Test Email Notification",
                body: "This is a test email from the notification system.",
                type: "general",
              });
            })
          }
          disabled={loading === "email"}
          className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm flex items-center justify-center gap-1"
        >
          {loading === "email" ? (
            <div className="animate-spin h-4 w-4 border-2 border-emerald-500 rounded-full border-t-transparent" />
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Test Email
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">
        Click any button to test real-time notifications
      </p>
    </div>
  );
}
