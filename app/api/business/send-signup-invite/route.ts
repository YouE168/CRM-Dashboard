// app/api/business/send-signup-invite/route.ts
//
// Sends the "create your account" email to a business contact (from
// the Businesses tab on Business Professional Services). Unlike
// add-member's invite, this is NOT a Supabase Auth generateLink - the
// contact isn't a real account yet, so there's no Auth user to invite.
// This is just a branded email pointing at the shortened signup form
// (/signup?inviteRole=...); the recipient fills in their own info and
// password there. Restricted to admin/staff, same as add-member.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendBusinessSignupInviteEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userRes, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userRes.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: callerRow, error: callerErr } = await supabaseAdmin
      .from("users")
      .select("primary_role")
      .eq("id", userRes.user.id)
      .maybeSingle();

    if (
      callerErr ||
      (callerRow?.primary_role !== "admin" && callerRow?.primary_role !== "staff")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { to, name, businessName, actionLink } = await request.json();
    if (!to || !actionLink) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const success = await sendBusinessSignupInviteEmail({
      to,
      name: name || "there",
      businessName: businessName || "",
      actionLink,
    });

    return NextResponse.json({ success, emailSent: success });
  } catch (err: any) {
    console.error("send-signup-invite error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
