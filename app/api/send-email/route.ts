// app/api/send-email/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { to, subject, html, text } = await request.json();

    // Validate required fields
    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to and subject are required" },
        { status: 400 }
      );
    }

    // For development/testing - log the email
    console.log(`
      📧 ========================================
      📧 SENDING EMAIL
      📧 ========================================
      To: ${to}
      Subject: ${subject}
      Body: ${text || html}
      📧 ========================================
    `);

    // Store in localStorage for testing (dev only)
    if (typeof localStorage !== "undefined") {
      const sentEmails = JSON.parse(localStorage.getItem("sent_emails") || "[]");
      sentEmails.push({
        to,
        subject,
        body: text || html,
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem("sent_emails", JSON.stringify(sentEmails));
    }

    // TODO: In production, use an email service like:
    // - Resend (recommended for Next.js)
    // - SendGrid
    // - AWS SES
    // - Nodemailer

    // For now, return success (simulated)
    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      preview: {
        to,
        subject,
        bodyPreview: (text || html)?.substring(0, 100) + "...",
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}