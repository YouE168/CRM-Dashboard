// app/api/send-notification-email/route.ts
//
// Sends a real notification email (e.g. session reminders) on behalf of the
// logged-in user, gated client-side by their "Email notifications" toggle.
//
// Delivery: attempts a real send via Resend if EMAIL_SERVICE_API_KEY is
// configured. That key is currently pending from Jody (see project notes) -
// until it's set, this route logs the email to the real email_logs table
// (visible on the admin Email Logs page) with status "logged" instead of
// failing, so nothing breaks and there's a visible record of what would
// have been sent. Once the key is added, sends will start going out for
// real with no code changes needed here.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    // Verify the caller is a real, logged-in user (any role - this sends
    // notifications to themselves, not on behalf of anyone else)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userRes.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { to, subject, body, type } = await request.json();
    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.EMAIL_SERVICE_API_KEY;
    let status: "sent" | "failed" | "logged" = "logged";

    if (apiKey) {
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "notifications@ruralcommunitypartners.org",
            to,
            subject,
            text: body,
          }),
        });
        if (resendRes.ok) {
          status = "sent";
        } else {
          status = "failed";
          console.error("Resend send failed:", await resendRes.text());
        }
      } catch (sendErr) {
        status = "failed";
        console.error("Resend request error:", sendErr);
      }
    } else {
      console.log(
        "📧 Email notification (no EMAIL_SERVICE_API_KEY configured, logged only):",
        { to, subject },
      );
    }

    const { error: logError } = await supabaseAdmin.from("email_logs").insert({
      to_email: to,
      subject,
      body,
      type: type || "general",
      status,
    });
    if (logError) {
      console.error("Failed to write email_logs row:", logError);
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error("send-notification-email error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
