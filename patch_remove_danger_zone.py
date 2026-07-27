#!/usr/bin/env python3
PATH = "app/admin/dashboard/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content

old_block = '''          {/* Danger Zone - Admin Only */}
          {isAdmin && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-red-600 mb-3">
                Danger Zone
              </h3>
              <button
                onClick={() => {
                  showConfirmModal(
                    "⚠️ Danger Zone",
                    "WARNING: This will clear all mock data. This action cannot be undone. Are you absolutely sure?",
                    () => {
                      showConfirmModal(
                        "🔴 FINAL WARNING",
                        "All participant and program data will be permanently deleted.",
                        () => {
                          const confirmation = window.prompt(
                            'Type "DELETE" to confirm:',
                          );
                          if (confirmation === "DELETE") {
                            localStorage.removeItem("users");
                            localStorage.removeItem("currentUser");
                            showToast(
                              "All mock data has been cleared. The page will now refresh.",
                              "warning",
                            );
                            setTimeout(() => window.location.reload(), 1500);
                          } else {
                            showToast(
                              "Data clear cancelled. Incorrect confirmation text.",
                              "error",
                            );
                          }
                        },
                        "danger",
                      );
                    },
                    "danger",
                  );
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear all mock data (testing only)
              </button>
            </div>
          )}

          {/* Save Button */}'''

new_block = '''          {/* Save Button */}'''

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Removed Danger Zone section.")
    print(f"Total lines now: {len(content.splitlines())}")
else:
    print("WARNING: target block not found - no changes made.")
