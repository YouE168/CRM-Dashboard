#!/usr/bin/env python3
PATH = "app/admin/program-management/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content
applied = []

old_block = '''  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login");
      return;
    }
    loadPrograms();
    loadParticipants();
    loadMentors();
  }, [router]);'''

new_block = '''  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push("/login");
        return;
      }

      if (cancelled) return;

      loadPrograms();
      loadParticipants();
      loadMentors();
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);'''

if old_block in content:
    content = content.replace(old_block, new_block)
    applied.append("Auth check -> Supabase")
else:
    print("WARNING: target block not found in program-management/page.tsx")

if 'from "@/lib/supabase/client"' not in content:
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("import "):
            lines.insert(i + 1, 'import { supabase } from "@/lib/supabase/client";')
            break
    content = "\n".join(lines)
    applied.append("Added supabase client import")

if content == original:
    print("\nNo changes made.")
else:
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nPatched {PATH}")
    for a in applied:
        print(f"   {a}")
