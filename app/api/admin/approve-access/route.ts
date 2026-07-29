// app/api/admin/approve-access/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendAccessInviteEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    // Verify the caller's identity using their own access token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userRes.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Confirm the caller is actually an admin
    const { data: callerRow, error: callerErr } = await supabaseAdmin
      .from("users")
      .select("primary_role")
      .eq("id", userRes.user.id)
      .maybeSingle();

    if (callerErr || callerRow?.primary_role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { requestId, name, email, requestedRole } = await request.json();
    if (!requestId || !email || !requestedRole) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Create the account and generate a real Supabase invite link, but do
    // NOT let Supabase send its own default email for it. inviteUserByEmail
    // does both in one call and always emails from
    // noreply@mail.app.supabase.io with generic, unbranded copy and no
    // forced password-creation step on our end. generateLink creates the
    // same real, secure invite session without emailing anyone - we send
    // our own branded email (from/reply-to Jody) below instead, and point
    // the invite at /set-password so the user is forced to actually create
    // a password before landing in the app.
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { name, primary_role: requestedRole },
          redirectTo: `${siteUrl}/set-password`,
        },
      });

    if (linkError || !linkData?.user) {
      return NextResponse.json(
        { error: linkError?.message || "Failed to create invite" },
        { status: 500 },
      );
    }

    // Create their public.users row with the approved role
    const { error: insertError } = await supabaseAdmin.from("users").upsert(
      {
        id: linkData.user.id,
        email,
        name,
        primary_role: requestedRole,
        status: "active",
      },
      { onConflict: "id" },
    );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Mark the access request approved
    const { error: updateError } = await supabaseAdmin
      .from("access_requests")
      .update({
        status: "approved",
        approved_by: userRes.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Must be awaited: this is a serverless function, and anything left
    // unawaited when the response is returned gets killed before it runs.
    // (That was the actual bug - the approval itself always worked, but
    // the "fire and forget" email call below never got to finish.)
    let emailSent = true;
    const actionLink = linkData.properties?.action_link;
    if (actionLink) {
      emailSent = await sendAccessInviteEmail({
        to: email,
        name,
        role: requestedRole,
        actionLink,
      }).catch((err) => {
        console.error("Failed to send access invite email:", err);
        return false;
      });
    } else {
      console.error("No action_link returned from generateLink; invite email not sent.");
      emailSent = false;
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (err: any) {
    console.error("approve-access error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}