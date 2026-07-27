#!/usr/bin/env python3
PATH = "app/admin/dashboard/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

old_block = '''              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  👥 User Activity
                </h3>
                <button
                  onClick={() => router.push("/admin/login-history")}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  📊 View Login History →
                </button>
              </div>

              {/* Program Management */}'''

new_block = '''              {/* Program Management */}'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Removed the Login History nav button.")
    print(f"Total lines now: {len(content.splitlines())}")
else:
    print("WARNING: target block not found - no changes made.")
