// app/api/auth/request-password-reset/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email-service";

// Public endpoint (no auth header required - this IS the "forgot password"
// flow, called before the person can log in). Mirrors the pattern used for
// access-request invites: generate the real Supabase link server-side
// with the service role so we control the email ourselves via Resend,
// instead of calling supabase.auth.resetPasswordForEmail() from the
// browser, which always sends Supabase's own default-branded email from
// noreply@mail.app.supabase.io.
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("email", email)
      .maybeSingle();

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${siteUrl}/set-password`,
        },
      });

    if (linkError || !linkData?.properties?.action_link) {
      // Don't reveal whether the email exists or not to the caller.
      console.error("request-password-reset generateLink error:", linkError);
      return NextResponse.json({ success: true });
    }

    await sendPasswordResetEmail({
      to: email,
      name: userRow?.name || "",
      actionLink: linkData.properties.action_link,
    }).catch((err) => {
      console.error("Failed to send password reset email:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("request-password-reset error:", err);
    // Still respond success-shaped to avoid leaking account existence via
    // error messages; log server-side for debugging.
    return NextResponse.json({ success: true });
  }
}
