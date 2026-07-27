#!/usr/bin/env python3
PATH = "app/admin/emails/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content
applied = []

# Remove the handleTestEmail function
old_handler = '''  const handleTestEmail = async () => {
    try {
      await insertTestEmailLog(`user${Math.floor(Math.random() * 1000)}@example.com`);
      setNotificationMessage("📨 New email sent!");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      await loadEmails();
    } catch (err) {
      console.error("Failed to send test email:", err);
    }
  };

'''

if old_handler in content:
    content = content.replace(old_handler, "")
    applied.append("Removed handleTestEmail function")
else:
    print("WARNING: handleTestEmail function not found")

# Remove the Test Email button
old_button = '''              <button
                onClick={handleTestEmail}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Test Email
              </button>

'''

if old_button in content:
    content = content.replace(old_button, "")
    applied.append("Removed Test Email button")
else:
    print("WARNING: Test Email button not found")

# Remove now-unused import
old_import_line = "  insertTestEmailLog,\n"
if old_import_line in content:
    content = content.replace(old_import_line, "")
    applied.append("Removed unused insertTestEmailLog import")

if content == original:
    print("\nNo changes made.")
else:
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\nPatched {PATH}")
    for a in applied:
        print(f"   {a}")
    print(f"\nTotal lines now: {len(content.splitlines())}")
