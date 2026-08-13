// app/api/admin/add-member/route.ts
//
// "Add New Member" on the Business Professional Services page - lets an
// admin/staff user manually add someone straight to the CRM (a real
// login, not a placeholder row) instead of waiting for them to sign up
// on their own. Mirrors approve-access's invite flow (generateLink +
// branded email, no default Supabase email), and mirrors signup's
// account-mirroring steps (users/profiles/participants/mentors rows) so
// the new member shows up correctly everywhere the rest of the app
// expects them to.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendAccessInviteEmail } from "@/lib/email-service";

const VALID_TYPES = ["mentee", "entrepreneur", "partner", "coalition", "mentor"];

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

    const { name, email, phone, memberType } = await request.json();
    if (!name || !email || !memberType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(memberType)) {
      return NextResponse.json({ error: "Invalid member type" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          data: { name, primary_role: memberType },
          redirectTo: `${siteUrl}/set-password`,
        },
      });

    if (linkError || !linkData?.user) {
      return NextResponse.json(
        { error: linkError?.message || "Failed to create invite" },
        { status: 500 },
      );
    }

    // Same stale-row cleanup as approve-access: a re-invited email that
    // was previously deleted from Auth gets a brand new user id here, so
    // clear out any leftover public.users row under the old id first.
    const { data: staleRow } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .neq("id", linkData.user.id)
      .maybeSingle();
    if (staleRow) {
      await supabaseAdmin.from("users").delete().eq("id", staleRow.id);
    }

    const { error: userInsertError } = await supabaseAdmin.from("users").upsert(
      {
        id: linkData.user.id,
        email,
        name,
        primary_role: memberType,
        status: "active",
      },
      { onConflict: "id" },
    );
    if (userInsertError) {
      return NextResponse.json({ error: userInsertError.message }, { status: 500 });
    }

    await supabaseAdmin.from("profiles").upsert(
      {
        id: linkData.user.id,
        name,
        email,
        primary_role: memberType,
        phone: phone || "",
      },
      { onConflict: "id" },
    );

    let newMemberId: string | null = null;

    if (memberType === "mentor") {
      const { data: mentorRow, error: mentorError } = await supabaseAdmin
        .from("mentors")
        .insert({
          name,
          email,
          phone: phone || null,
          hourly_rate: 50,
          availability: [],
          expertise: [],
          status: "active",
        })
        .select("id")
        .single();
      if (mentorError) {
        return NextResponse.json({ error: mentorError.message }, { status: 500 });
      }
      newMemberId = mentorRow.id;
    } else {
      const { data: defaultProgram } = await supabaseAdmin
        .from("programs")
        .select("id, name")
        .eq("name", "Business Professional Services")
        .maybeSingle();

      const isOrgAccount = memberType === "partner" || memberType === "coalition";
      const orgProgramName =
        memberType === "coalition" ? "Coalition Organization" : "Partner Organization";

      const { data: participantRow, error: participantError } = await supabaseAdmin
        .from("participants")
        .insert({
          user_id: linkData.user.id,
          email,
          name,
          phone: phone || null,
          program_id: isOrgAccount ? null : (defaultProgram?.id ?? null),
          program_name: isOrgAccount ? orgProgramName : (defaultProgram?.name ?? null),
          mentor: null,
          status: "active",
        })
        .select("id")
        .single();
      if (participantError) {
        return NextResponse.json({ error: participantError.message }, { status: 500 });
      }
      newMemberId = participantRow.id;

      if (defaultProgram) {
        await supabaseAdmin.from("user_programs").insert({
          user_id: linkData.user.id,
          program_id: defaultProgram.id,
          approved: true,
          progress: 0,
        });
      }
    }

    let emailSent = true;
    const actionLink = linkData.properties?.action_link;
    if (actionLink) {
      emailSent = await sendAccessInviteEmail({
        to: email,
        name,
        role: memberType,
        actionLink,
      }).catch((err) => {
        console.error("Failed to send new-member invite email:", err);
        return false;
      });
    } else {
      console.error("No action_link returned from generateLink; invite email not sent.");
      emailSent = false;
    }

    return NextResponse.json({
      success: true,
      emailSent,
      member: { id: newMemberId, member_type: memberType },
    });
  } catch (err: any) {
    console.error("add-member error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
