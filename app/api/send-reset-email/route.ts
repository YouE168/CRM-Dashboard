// app/api/send-reset-email/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, name, resetLink, role } = await request.json();

    // Validate required fields
    if (!email || !resetLink) {
      return NextResponse.json(
        { error: "Missing required fields: email and resetLink are required" },
        { status: 400 }
      );
    }

    // For development/testing - log the email
    console.log(`
      🔐 ========================================
      🔐 SENDING PASSWORD RESET EMAIL
      🔐 ========================================
      To: ${email}
      Name: ${name || "User"}
      Role: ${role || "User"}
      Reset Link: ${resetLink}
      🔐 ========================================
    `);

    // Store in localStorage for testing (dev only)
    if (typeof localStorage !== "undefined") {
      const resetEmails = JSON.parse(localStorage.getItem("reset_emails") || "[]");
      resetEmails.push({
        to: email,
        name: name || "User",
        role: role || "User",
        resetLink,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem("reset_emails", JSON.stringify(resetEmails));
    }

    // TODO: In production, use an email service to send the reset email
    // For now, return success (simulated)
    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully!",
      preview: {
        to: email,
        resetLink,
      },
    });
  } catch (error) {
    console.error("Error sending reset email:", error);
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}