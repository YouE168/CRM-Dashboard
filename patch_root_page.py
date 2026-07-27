#!/usr/bin/env python3
"""
Patches app/page.tsx:
  1. Replaces the localStorage auth-check useEffect with Supabase
     (also redirects admin/staff/program_manager straight to /admin/dashboard)
  2. Makes handleLogout() call supabase.auth.signOut()
  3. Adds the supabase client import if missing

Everything else (Settings, Profile editing, notifications UI) is left
completely untouched.

Usage: python3 patch_root_page.py
Run this from your project root (same folder as package.json).
"""

import sys

PATH = "app/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original_content = content
patches_applied = []

# ---------------------------------------------------------------
# Patch 1: main auth-check effect
# ---------------------------------------------------------------
old_auth_effect = '''  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
      return;
    }

    setIsAuthenticated(true);

    const savedProfile = localStorage.getItem(`profile_${user}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setEditForm(parsed);
    } else {
      const name = user.split("@")[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      const newProfile = { name: displayName, email: user, role: "Member" };
      setProfile(newProfile);
      setEditForm(newProfile);
    }

    if (user === "admin@ruralcommunity.org") {
      router.push("/admin/dashboard");
    }

    const savedEmailNotifications = localStorage.getItem(
      "email_notifications_enabled",
    );
    const savedSessionReminders = localStorage.getItem(
      "session_reminders_enabled",
    );
    const savedBrowserNotifications = localStorage.getItem(
      "browser_notifications_enabled",
    );

    if (savedEmailNotifications !== null) {
      setSettings((prev) => ({
        ...prev,
        emailNotifications: savedEmailNotifications === "true",
      }));
    }
    if (savedSessionReminders !== null) {
      setSettings((prev) => ({
        ...prev,
        mentorAlerts: savedSessionReminders === "true",
      }));
    }
    if (savedBrowserNotifications !== null) {
      setSettings((prev) => ({
        ...prev,
        reportAlerts: savedBrowserNotifications === "true",
      }));
    }

    const sessionRemindersEnabled =
      localStorage.getItem("session_reminders_enabled") === "true";
    if (sessionRemindersEnabled) {
      setTimeout(() => checkForUpcomingSessions(), 2000);
    }

    const interval = setInterval(() => {
      if (localStorage.getItem("session_reminders_enabled") === "true") {
        checkForUpcomingSessions();
      }
    }, 3600000);

    return () => clearInterval(interval);
  }, [router]);'''

new_auth_effect = '''  useEffect(() => {
    let cancelled = false;

    const loadAuthAndProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, name, email, primary_role, status")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (userError || !userRow) {
        router.push("/login");
        return;
      }

      if (userRow.status && userRow.status !== "active") {
        router.push("/login");
        return;
      }

      // Admin/staff/program_manager belong on the admin dashboard, not here
      if (
        userRow.primary_role === "admin" ||
        userRow.primary_role === "staff" ||
        userRow.primary_role === "program_manager"
      ) {
        router.push("/admin/dashboard");
        return;
      }

      const loadedProfile = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role: userRow.primary_role || "Member",
        primaryRole: userRow.primary_role,
      };

      setProfile(loadedProfile);
      setEditForm(loadedProfile);
      setIsAuthenticated(true);

      // Local UI preferences (not sensitive, fine to keep in localStorage)
      const savedEmailNotifications = localStorage.getItem(
        "email_notifications_enabled",
      );
      const savedSessionReminders = localStorage.getItem(
        "session_reminders_enabled",
      );
      const savedBrowserNotifications = localStorage.getItem(
        "browser_notifications_enabled",
      );

      if (savedEmailNotifications !== null) {
        setSettings((prev) => ({
          ...prev,
          emailNotifications: savedEmailNotifications === "true",
        }));
      }
      if (savedSessionReminders !== null) {
        setSettings((prev) => ({
          ...prev,
          mentorAlerts: savedSessionReminders === "true",
        }));
      }
      if (savedBrowserNotifications !== null) {
        setSettings((prev) => ({
          ...prev,
          reportAlerts: savedBrowserNotifications === "true",
        }));
      }

      const sessionRemindersEnabled =
        localStorage.getItem("session_reminders_enabled") === "true";
      if (sessionRemindersEnabled) {
        setTimeout(() => checkForUpcomingSessions(), 2000);
      }
    };

    loadAuthAndProfile();

    const interval = setInterval(() => {
      if (localStorage.getItem("session_reminders_enabled") === "true") {
        checkForUpcomingSessions();
      }
    }, 3600000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);'''

if old_auth_effect in content:
    content = content.replace(old_auth_effect, new_auth_effect)
    patches_applied.append("1. Auth-check effect -> Supabase (fixes redirect loop)")
else:
    print("WARNING: Patch 1 (auth-check effect) target text not found - skipped.")

# ---------------------------------------------------------------
# Patch 2: handleLogout() -> supabase.auth.signOut()
# ---------------------------------------------------------------
old_logout = '''  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/login");
  };'''

new_logout = '''  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };'''

if old_logout in content:
    content = content.replace(old_logout, new_logout)
    patches_applied.append("2. handleLogout() -> supabase.auth.signOut()")
else:
    print("WARNING: Patch 2 (handleLogout) target text not found - skipped.")

# ---------------------------------------------------------------
# Ensure the supabase client is imported
# ---------------------------------------------------------------
if 'from "@/lib/supabase/client"' not in content:
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("import "):
            lines.insert(i + 1, 'import { supabase } from "@/lib/supabase/client";')
            break
    content = "\n".join(lines)
    patches_applied.append("3. Added supabase client import")

# ---------------------------------------------------------------
# Write result
# ---------------------------------------------------------------
if content == original_content:
    print("\nNo changes made - none of the target patterns matched.")
    print("This likely means the file differs from what was shared in chat.")
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nPatched {PATH}")
for p in patches_applied:
    print(f"   {p}")
print(f"\nTotal lines now: {len(content.splitlines())}")
