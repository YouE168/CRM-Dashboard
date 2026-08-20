// app/api/cron/reminder-notifications/route.ts
//
// Runs once a day (see vercel.json's crons entry) and emails whoever
// owns a "My Reminders" entry (admin_personal_notes) whose meeting_date
// is tomorrow - a real server-side scheduled job, not the client-side
// "only fires if the page happens to be open" pattern the session
// reminders use, so these actually arrive on time.
//
// Protected by CRON_SECRET: Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` when invoking scheduled functions
// if that env var is set on the project - reject anything else so this
// endpoint can't be triggered by a random request.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendReminderDueEmail } from "@/lib/email-service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().slice(0, 10);

    const { data: dueReminders, error: reminderError } = await supabaseAdmin
      .from("admin_personal_notes")
      .select("*")
      .eq("meeting_date", tomorrowDate)
      .eq("completed", false)
      .eq("reminder_sent", false);

    if (reminderError) {
      console.error("reminder-notifications: failed to load reminders:", reminderError);
      return NextResponse.json({ error: reminderError.message }, { status: 500 });
    }

    if (!dueReminders || dueReminders.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const adminIds = Array.from(new Set(dueReminders.map((r) => r.admin_id)));
    const { data: adminUsers, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .in("id", adminIds);

    if (usersError) {
      console.error("reminder-notifications: failed to load admin users:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const userById = Object.fromEntries((adminUsers ?? []).map((u) => [u.id, u]));

    let sent = 0;
    for (const reminder of dueReminders) {
      const owner = userById[reminder.admin_id];
      if (!owner?.email) continue;

      const success = await sendReminderDueEmail({
        to: owner.email,
        name: owner.name || "there",
        note: reminder.note,
        meetingDate: reminder.meeting_date,
        meetingTime: reminder.meeting_time,
        meetingLocation: reminder.meeting_location,
        meetingLink: reminder.meeting_link,
      }).catch((err) => {
        console.error(
          `reminder-notifications: failed to email reminder ${reminder.id}:`,
          err,
        );
        return false;
      });

      if (success) {
        sent += 1;
        await supabaseAdmin
          .from("admin_personal_notes")
          .update({ reminder_sent: true })
          .eq("id", reminder.id);
      }
    }

    // Business meeting notes (case_notes with member_type = 'business')
    // and business referral follow-up dates due tomorrow - both are
    // admin/staff-only concepts (no individual "owner" like My
    // Reminders has), so these go out to everyone with an admin/staff
    // account, same as the admin_notes broadcast pattern elsewhere.
    let businessSent = 0;
    let followUpSent = 0;

    const { data: staffUsers, error: staffError } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .in("primary_role", ["admin", "staff"]);
    if (staffError) {
      console.error("reminder-notifications: failed to load staff users:", staffError);
    }
    const staffRecipients = (staffUsers ?? []).filter((u) => u.email);

    if (staffRecipients.length > 0) {
      const { data: dueBusinessNotes, error: businessNotesError } = await supabaseAdmin
        .from("case_notes")
        .select("*")
        .eq("member_type", "business")
        .eq("meeting_date", tomorrowDate)
        .eq("reminder_sent", false);

      if (businessNotesError) {
        console.error(
          "reminder-notifications: failed to load business meeting notes:",
          businessNotesError,
        );
      } else {
        for (const note of dueBusinessNotes ?? []) {
          const results = await Promise.allSettled(
            staffRecipients.map((u) =>
              sendReminderDueEmail({
                to: u.email as string,
                name: u.name || "there",
                note: `Meeting with ${note.member_name}: ${note.note}`,
                meetingDate: note.meeting_date as string,
                meetingTime: note.meeting_time,
                meetingLocation: note.meeting_location,
                meetingLink: note.meeting_link,
              }),
            ),
          );
          const anySent = results.some((r) => r.status === "fulfilled" && r.value);
          if (anySent) {
            businessSent += 1;
            await supabaseAdmin
              .from("case_notes")
              .update({ reminder_sent: true })
              .eq("id", note.id);
          }
        }
      }

      const { data: dueFollowUps, error: followUpError } = await supabaseAdmin
        .from("business_referrals")
        .select("*, businesses(name)")
        .eq("follow_up_date", tomorrowDate)
        .eq("follow_up_reminder_sent", false);

      if (followUpError) {
        console.error(
          "reminder-notifications: failed to load referral follow-ups:",
          followUpError,
        );
      } else {
        for (const referral of dueFollowUps ?? []) {
          const businessName =
            (referral as any).businesses?.name || "a business";
          const results = await Promise.allSettled(
            staffRecipients.map((u) =>
              sendReminderDueEmail({
                to: u.email as string,
                name: u.name || "there",
                note: `Follow up with ${businessName} on their ${referral.program_name} referral (currently: ${referral.status.replace("_", " ")})${referral.notes ? `\n\n${referral.notes}` : ""}`,
                meetingDate: referral.follow_up_date as string,
                meetingTime: null,
                meetingLocation: null,
                meetingLink: null,
              }),
            ),
          );
          const anySent = results.some((r) => r.status === "fulfilled" && r.value);
          if (anySent) {
            followUpSent += 1;
            await supabaseAdmin
              .from("business_referrals")
              .update({ follow_up_reminder_sent: true })
              .eq("id", referral.id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      checked: dueReminders.length,
      businessSent,
      followUpSent,
    });
  } catch (err: any) {
    console.error("reminder-notifications error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
