#!/usr/bin/env python3
PATH = "app/admin/dashboard/page.tsx"

with open(PATH, "r", encoding="utf-8") as f:
    content = f.read()

original = content
applied = []

# 1. Replace getRecipientsForType + sendAdminNote + load-notes effect
old_block = '''  // Helper function to get recipients
  const getRecipientsForType = (type: string) => {
    const allUsers: any[] = JSON.parse(localStorage.getItem("users") || "[]");

    if (type === "all") {
      return allUsers.filter(
        (u: any) =>
          u.primaryRole === "coalition" ||
          u.primaryRole === "mentor" ||
          u.primaryRole === "partner",
      );
    }

    return allUsers.filter((u: any) => u.primaryRole === type);
  };

  // Send admin note
  const sendAdminNote = () => {
    if (!noteMessage.trim()) {
      showToast("Please enter a message", "error");
      return;
    }

    const newNote = {
      id: Date.now(),
      subject: noteSubject || "General Update",
      message: noteMessage,
      recipientType: noteRecipientType,
      sentBy: profile.name || "Admin",
      sentAt: new Date().toISOString(),
      readBy: [],
    };

    const updatedNotes = [newNote, ...adminNotes];
    setAdminNotes(updatedNotes);
    localStorage.setItem("admin_notes", JSON.stringify(updatedNotes));

    // Also save to individual recipient buckets
    const recipients = getRecipientsForType(noteRecipientType);
    recipients.forEach((recipient: any) => {
      const existingNotes = JSON.parse(
        localStorage.getItem(`notes_${recipient.email}`) || "[]",
      );
      existingNotes.push({
        ...newNote,
        recipientEmail: recipient.email,
      });
      localStorage.setItem(
        `notes_${recipient.email}`,
        JSON.stringify(existingNotes),
      );
    });

    setNoteMessage("");
    setNoteSubject("");
    setShowNoteModal(false);
    showToast("Note sent successfully!", "success");
  };

  // Load admin notes
  useEffect(() => {
    const savedNotes = localStorage.getItem("admin_notes");
    if (savedNotes) {
      setAdminNotes(JSON.parse(savedNotes));
    }
  }, []);'''

new_block = '''  // Load admin notes (Supabase, realtime)
  const loadAdminNotes = useCallback(async () => {
    try {
      const data = await getAdminNotes();
      setAdminNotes(data);
    } catch (err) {
      console.error("Failed to load admin notes:", err);
    }
  }, []);

  useEffect(() => {
    loadAdminNotes();
    const unsubscribe = subscribeToAdminNotes(loadAdminNotes);
    return unsubscribe;
  }, [loadAdminNotes]);

  // Send admin note
  const sendAdminNote = async () => {
    if (!noteMessage.trim()) {
      showToast("Please enter a message", "error");
      return;
    }

    try {
      await sendAdminNoteRow(
        noteSubject || "General Update",
        noteMessage,
        noteRecipientType,
        profile.name || "Admin",
      );

      setNoteMessage("");
      setNoteSubject("");
      setShowNoteModal(false);
      showToast("Note sent successfully!", "success");
    } catch (err) {
      console.error("Failed to send note:", err);
      showToast("Failed to send note.", "error");
    }
  };'''

if old_block in content:
    content = content.replace(old_block, new_block)
    applied.append("1. sendAdminNote/load notes -> Supabase + realtime")
else:
    print("WARNING: block 1 not found - skipped.")

# 2. Field renames in the notes list JSX
renames = [
    (
        '''              {adminNotes.filter(
                (n) =>
                  noteRecipientType === "all" ||
                  n.recipientType === noteRecipientType,
              ).length === 0 ? (''',
        '''              {adminNotes.filter(
                (n) =>
                  noteRecipientType === "all" ||
                  n.recipient_type === noteRecipientType,
              ).length === 0 ? (''',
    ),
    (
        '''                adminNotes
                  .filter(
                    (n) =>
                      noteRecipientType === "all" ||
                      n.recipientType === noteRecipientType,
                  )''',
        '''                adminNotes
                  .filter(
                    (n) =>
                      noteRecipientType === "all" ||
                      n.recipient_type === noteRecipientType,
                  )''',
    ),
    (
        '''                              From: {note.sentBy}''',
        '''                              From: {note.sent_by}''',
    ),
    (
        '''                              {new Date(note.sentAt).toLocaleString()}''',
        '''                              {new Date(note.created_at).toLocaleString()}''',
    ),
    (
        '''                              {note.recipientType === "all"
                                ? "All"
                                : note.recipientType.charAt(0).toUpperCase() +
                                  note.recipientType.slice(1)}''',
        '''                              {note.recipient_type === "all"
                                ? "All"
                                : note.recipient_type.charAt(0).toUpperCase() +
                                  note.recipient_type.slice(1)}''',
    ),
]

rename_count = 0
for old, new in renames:
    if old in content:
        content = content.replace(old, new)
        rename_count += 1
    else:
        print(f"WARNING: a field-rename target not found (skipped one occurrence).")

if rename_count > 0:
    applied.append(f"2. Field renames in notes JSX ({rename_count}/5 applied)")

# 3. Add the import if missing
if "getAdminNotes" not in content.split("export function ReportsTab")[0] if "export function ReportsTab" in content else True:
    pass  # no-op guard, real check below

if 'from "@/lib/supabase/dashboard-data"' not in content or "getAdminNotes" not in content:
    lines = content.split("\n")
    inserted = False
    for i, line in enumerate(lines):
        if line.startswith("import ") and not inserted:
            lines.insert(i + 1, 'import { getAdminNotes, sendAdminNoteRow, subscribeToAdminNotes } from "@/lib/supabase/dashboard-data";')
            inserted = True
            break
    content = "\n".join(lines)
    applied.append("3. Added dashboard-data import for admin notes functions")

# 4. Ensure useCallback is imported (needed for loadAdminNotes)
if "useCallback" not in content.split("\n")[1:5][0] if len(content.split("\n")) > 4 else True:
    # Simple check: look at the react import line specifically
    pass

react_import_old_variants = [
    'import { useState, useEffect } from "react";',
]
for variant in react_import_old_variants:
    if variant in content:
        content = content.replace(variant, 'import { useState, useEffect, useCallback } from "react";', 1)
        applied.append("4. Added useCallback to React import")
        break

if content == original:
    print("\\nNo changes made.")
else:
    with open(PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"\\nPatched {PATH}")
    for a in applied:
        print(f"   {a}")
    print(f"\\nTotal lines now: {len(content.splitlines())}")
