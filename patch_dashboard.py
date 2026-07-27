#!/usr/bin/env python3
"""
Patches app/admin/dashboard/page.tsx:
  1. Replaces the localStorage auth-check useEffect with a Supabase one
  2. Removes the duplicate localStorage profile-loading useEffect
  3. Makes saveProfile() write to Supabase instead of localStorage
  4. Makes handleLogout() call supabase.auth.signOut()

Everything else in the file (Notes, Access Requests, Settings, avatar
upload, etc.) is left completely untouched.

Usage: python3 patch_dashboard.py
Run this from your project root (same folder as package.json).
"""

import sys

PATH = "app/admin/dashboard/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original_content = content
patches_applied = []

# ---------------------------------------------------------------
# Patch 1: main auth-check effect
# ---------------------------------------------------------------
old_auth_effect = '''  // CHECK AUTHENTICATION & GET USER ROLE
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
      return;
    }

    // Load user profile to get role
    const savedProfile = localStorage.getItem(`profile_${user}`);
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      const role = getUserRole(parsed);
      setUserRole(role);

      // If not admin/staff/program_manager/coalition/partner, redirect to regular dashboard
      if (!hasPermission(role, "coalition")) {
        router.push("/");
        return;
      }
    } else {
      // Default to staff
      setUserRole("staff");
    }

    setIsAuthenticated(true);

    // Load signups count
    const savedSignups = JSON.parse(
      localStorage.getItem("programSignups") || "[]",
    );
    setSignupsCount(savedSignups.length);
  }, [router]);'''

new_auth_effect = '''  // CHECK AUTHENTICATION & GET USER ROLE (Supabase)
  useEffect(() => {
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

      const roleLabel =
        userRow.primary_role === "admin"
          ? "Administrator"
          : userRow.primary_role === "program_manager"
            ? "Program Manager"
            : userRow.primary_role === "coalition"
              ? "Coalition Leader"
              : userRow.primary_role === "partner"
                ? "Partner"
                : "Staff";

      const loadedProfile = {
        name: userRow.name || userRow.email.split("@")[0],
        email: userRow.email,
        role: roleLabel,
        primaryRole: userRow.primary_role,
        userType: userRow.primary_role,
      };

      setProfile(loadedProfile);
      setEditForm(loadedProfile);
      const role = getUserRole(loadedProfile);
      setUserRole(role);

      // If not admin/staff/program_manager/coalition/partner, redirect to regular dashboard
      if (!hasPermission(role, "coalition")) {
        router.push("/");
        return;
      }

      setIsAuthenticated(true);

      // Load signups count
      const savedSignups = JSON.parse(
        localStorage.getItem("programSignups") || "[]",
      );
      setSignupsCount(savedSignups.length);
    };

    loadAuthAndProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);'''

if old_auth_effect in content:
    content = content.replace(old_auth_effect, new_auth_effect)
    patches_applied.append("1. Auth-check effect -> Supabase")
else:
    print("WARNING: Patch 1 (auth-check effect) target text not found - skipped.")

# ---------------------------------------------------------------
# Patch 2: remove duplicate localStorage profile-loading effect
# ---------------------------------------------------------------
old_dup_effect = '''  // LOAD USER PROFILE FROM LOCALSTORAGE
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const savedProfile = localStorage.getItem(`profile_${currentUser}`);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setEditForm(parsedProfile);
      } else if (currentUser !== "admin@ruralcommunity.org") {
        const userName = currentUser.split("@")[0];
        const displayName =
          userName.charAt(0).toUpperCase() + userName.slice(1);
        const newProfile = {
          name: displayName,
          email: currentUser,
          role: "Staff",
        };
        setProfile(newProfile);
        setEditForm(newProfile);
      } else {
        setProfile({
          name: "Admin User",
          email: "admin@ruralcommunity.org",
          role: "Administrator",
        });
        setEditForm({
          name: "Admin User",
          email: "admin@ruralcommunity.org",
          role: "Administrator",
        });
      }
    }
  }, []);'''

new_dup_effect = '''  // Profile is now loaded by the Supabase auth effect above -
  // this duplicate localStorage-based effect has been removed.'''

if old_dup_effect in content:
    content = content.replace(old_dup_effect, new_dup_effect)
    patches_applied.append("2. Removed duplicate localStorage profile effect")
else:
    print("WARNING: Patch 2 (duplicate profile effect) target text not found - skipped.")

# ---------------------------------------------------------------
# Patch 3: saveProfile() -> Supabase
# ---------------------------------------------------------------
old_save_profile = '''  const saveProfile = () => {
    setProfile(editForm);
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      localStorage.setItem(`profile_${currentUser}`, JSON.stringify(editForm));
    }
    setEditSaved(true);
    showToast("Profile updated successfully!", "success");
    setTimeout(() => {
      setEditSaved(false);
      setPanel("profile");
    }, 1200);
  };'''

new_save_profile = '''  const saveProfile = async () => {
    setProfile(editForm);
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const { error } = await supabase
        .from("users")
        .update({ name: editForm.name })
        .eq("id", authData.user.id);
      if (error) {
        console.error("Failed to save profile:", error);
        showToast("Failed to save profile.", "error");
        return;
      }
    }
    setEditSaved(true);
    showToast("Profile updated successfully!", "success");
    setTimeout(() => {
      setEditSaved(false);
      setPanel("profile");
    }, 1200);
  };'''

if old_save_profile in content:
    content = content.replace(old_save_profile, new_save_profile)
    patches_applied.append("3. saveProfile() -> Supabase")
else:
    print("WARNING: Patch 3 (saveProfile) target text not found - skipped.")

# ---------------------------------------------------------------
# Patch 4: handleLogout() -> supabase.auth.signOut()
# ---------------------------------------------------------------
old_logout = '''  const handleLogout = () => {
    showConfirmModal(
      "Sign Out",
      "Are you sure you want to sign out?",
      () => {
        localStorage.removeItem("currentUser");
        router.push("/login");
      },
      "warning",
    );
  };'''

new_logout = '''  const handleLogout = () => {
    showConfirmModal(
      "Sign Out",
      "Are you sure you want to sign out?",
      async () => {
        await supabase.auth.signOut();
        router.push("/login");
      },
      "warning",
    );
  };'''

if old_logout in content:
    content = content.replace(old_logout, new_logout)
    patches_applied.append("4. handleLogout() -> supabase.auth.signOut()")
else:
    print("WARNING: Patch 4 (handleLogout) target text not found - skipped.")

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
    patches_applied.append("5. Added supabase client import")

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
