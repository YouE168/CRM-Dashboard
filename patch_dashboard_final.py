#!/usr/bin/env python3
PATH = "app/admin/dashboard/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content
applied = []

# 1. Fix null -> undefined type mismatch on loadedProfile
old_profile = '''      const loadedProfile = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role: roleLabel,
        primaryRole: userRow.primary_role,
        userType: userRow.primary_role,
      };'''

new_profile = '''      const loadedProfile = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role: roleLabel,
        primaryRole: userRow.primary_role ?? undefined,
        userType: userRow.primary_role ?? undefined,
      };'''

if old_profile in content:
    content = content.replace(old_profile, new_profile)
    applied.append("1. Fixed loadedProfile null->undefined type mismatch")
else:
    print("WARNING: block 1 (loadedProfile) not found - skipped.")

# 2. Remove stale props from <AnalyticsTab> call (component is now self-contained)
old_analytics = '''        {activeTab === "Analytics" && (
          <AnalyticsTab
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedCounty={selectedCounty}
            setSelectedCounty={setSelectedCounty}
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
          />
        )}'''

new_analytics = '''        {activeTab === "Analytics" && <AnalyticsTab />}'''

if old_analytics in content:
    content = content.replace(old_analytics, new_analytics)
    applied.append("2. Removed stale props from <AnalyticsTab />")
else:
    print("WARNING: block 2 (AnalyticsTab call) not found - skipped.")

# 3. Remove the Test Notifications section entirely
old_test_notif = '''          {/* Test Notifications */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Test Notifications
              <span className="text-xs font-normal text-gray-400 ml-2">
                Send a test alert
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  await NotificationHelpers.notifyMentorActivity(
                    "Sarah Johnson",
                    "logged_hours",
                    "3 hours logged",
                  );
                  showToast("Test mentor notification sent.", "success");
                }}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                Mentor Alert
              </button>
              <button
                onClick={async () => {
                  await NotificationHelpers.notifyParticipantMilestone(
                    "Michael Chen",
                    "Business Plan Complete",
                    "SEED Micro-Grant",
                  );
                  showToast("Test milestone notification sent.", "success");
                }}
                className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                Milestone
              </button>
              <button
                onClick={async () => {
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  await NotificationHelpers.sendReportReminder(
                    nextMonth.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    }),
                    "5th of the month",
                  );
                  showToast("Test report reminder sent.", "success");
                }}
                className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm"
              >
                Report Reminder
              </button>
              <button
                onClick={async () => {
                  await notificationService.sendEmail({
                    to: profile.email || "admin@ruralcommunity.org",
                    subject: "Test Email Notification",
                    body: "This is a test email from the notification system.",
                    type: "general",
                  });
                  showToast("Test email sent.", "success");
                }}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm"
              >
                Test Email
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Click a button to send a test notification
            </p>
          </div>

          {/* Appearance Settings */}'''

new_test_notif = '''          {/* Appearance Settings */}'''

if old_test_notif in content:
    content = content.replace(old_test_notif, new_test_notif)
    applied.append("3. Removed Test Notifications section")
else:
    print("WARNING: block 3 (Test Notifications) not found - skipped.")

if content == original:
    print("\nNo changes made.")
else:
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nPatched {PATH}")
    for a in applied:
        print(f"   {a}")
    print(f"\nTotal lines now: {len(content.splitlines())}")
