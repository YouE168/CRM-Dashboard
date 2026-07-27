// app/api/admin/approve-access/route.ts
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

    // Create the account AND send the "set your password" email in
    // one call — this is Supabase Auth's built-in invite flow.
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { name, primary_role: requestedRole },
      });

    if (inviteError || !inviteData.user) {
      return NextResponse.json(
        { error: inviteError?.message || "Failed to invite user" },
        { status: 500 },
      );
    }

    // Create their public.users row with the approved role
    const { error: insertError } = await supabaseAdmin.from("users").upsert(
      {
        id: inviteData.user.id,
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("approve-access error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}