// lib/email-service.ts

interface EmailData {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // For development, just log and return success
    if (isDevelopment) {
      console.log("📧 Email (dev mode):", {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
      });
      
      // Store in email logs
      if (typeof window !== 'undefined') {
        const emailLogs = JSON.parse(localStorage.getItem('email_logs') || '[]');
        emailLogs.unshift({
          id: `email-${Date.now()}`,
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          type: 'notification',
          status: 'sent',
          sentAt: new Date().toISOString(),
        });
        localStorage.setItem('email_logs', JSON.stringify(emailLogs));
      }
      
      return true;
    }

    // Production: Use Resend API
    const apiKey = process.env.EMAIL_SERVICE_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ Email service not configured");
      // Still log in development
      if (isDevelopment) {
        console.log("📧 Email (no API key):", emailData);
        return true;
      }
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailData.from || process.env.EMAIL_FROM || 'admin@ruralcommunitypartners.org',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.html || emailData.body.replace(/\n/g, '<br/>'),
        ...(emailData.replyTo ? { reply_to: emailData.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      console.error('Email send failed:', await response.text());
      return false;
    }

    // Log to email logs
    if (typeof window !== 'undefined') {
      const emailLogs = JSON.parse(localStorage.getItem('email_logs') || '[]');
      emailLogs.unshift({
        id: `email-${Date.now()}`,
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        type: 'notification',
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem('email_logs', JSON.stringify(emailLogs));
    }

    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}

// Helper: Send notification to Jody about new user registration
export async function notifyJodyNewUser(userData: {
  name: string;
  email: string;
  role: string;
  registrationDate: string;
}) {
  const subject = `🔔 New User Registration: ${userData.name}`;
  const body = `
A new user has registered on Rural Community Partners.

User Details:
- Name: ${userData.name}
- Email: ${userData.email}
- Role: ${userData.role}
- Registered: ${new Date(userData.registrationDate).toLocaleString()}

Please review and approve their access if needed.

---
Rural Community Partners System
  `;

  return await sendEmail({
    to: 'jody@hbcat.org',
    subject: subject,
    body: body,
  });
}

// Helper: Notify Jody when a participant rates their mentor 3 stars or
// less, so she can follow up. Called from the real /feedback page.
export async function notifyJodyLowMentorRating(ratingData: {
  mentorName: string;
  rating: number;
  comment?: string;
}) {
  const subject = `⚠️ Low Satisfaction Rating for ${ratingData.mentorName}`;
  const body = `
A participant rated their experience with their mentor 3 stars or less.

Mentor: ${ratingData.mentorName}
Rating: ${ratingData.rating}/5 stars
${ratingData.comment ? `Comment: ${ratingData.comment}\n` : ""}
Please follow up to address their concerns.

---
Rural Community Partners System
  `;

  return await sendEmail({
    to: "jody@hbcat.org",
    subject: subject,
    body: body,
  });
}

// Helper: Notify Jody when someone submits a staff/program-manager access
// request from the login page, so she doesn't have to be staring at the
// admin dashboard to notice it.
export async function notifyJodyAccessRequest(requestData: {
  name: string;
  email: string;
  requestedRole: string;
  reason: string;
}) {
  const roleLabel =
    requestData.requestedRole === "program_manager"
      ? "Program Manager"
      : "Staff/Admin";
  const subject = `🔐 Access Request: ${requestData.name} (${roleLabel})`;
  const body = `
${requestData.name} has requested ${roleLabel} access to Rural Community Partners.

Name: ${requestData.name}
Email: ${requestData.email}
Requested Role: ${roleLabel}
Reason: ${requestData.reason}

Review and approve or reject this request from Admin Dashboard > Access Requests.

---
Rural Community Partners System
  `;

  return await sendEmail({
    to: "jody@hbcat.org",
    subject: subject,
    body: body,
  });
}

// Helper: Notify Jody when someone applies to the Leadership Roundtable,
// so she sees it even if she isn't actively looking at the admin
// dashboard's Pending Applications panel.
export async function notifyJodyRoundtableApplication(applicationData: {
  name: string;
  email: string;
  organization?: string;
  county?: string;
  role?: string;
  reason?: string;
}) {
  const subject = `🤝 New Leadership Roundtable Application: ${applicationData.name}`;
  const body = `
${applicationData.name} just applied to join the Leadership Roundtable.

Name: ${applicationData.name}
Email: ${applicationData.email}
${applicationData.organization ? `Organization: ${applicationData.organization}\n` : ""}${applicationData.county ? `County: ${applicationData.county}\n` : ""}${applicationData.role ? `Role/Title: ${applicationData.role}\n` : ""}${applicationData.reason ? `Why they want to join: ${applicationData.reason}\n` : ""}
Review and approve or decline this application from Admin Dashboard > Leadership Roundtable > Pending Applications.

---
Rural Community Partners System
  `;

  return await sendEmail({
    to: "jody@hbcat.org",
    subject: subject,
    body: body,
  });
}

// Helper: Send access approval email
export async function sendAccessApprovalEmail(emailData: {
  to: string;
  name: string;
  token: string;
  role: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const setupLink = `${baseUrl}/set-password?token=${emailData.token}`;
  
  const subject = `✅ Access Approved - Rural Community Partners`;
  const body = `
Dear ${emailData.name},

Your access request for ${emailData.role} has been approved!

Please set up your password by visiting the following link:
${setupLink}

This link will expire in 7 days.

Thank you,
Rural Community Partners Team

---
Note: This is an automated message. Please do not reply to this email.
  `;

  return await sendEmail({
    to: emailData.to,
    subject: subject,
    body: body,
  });
}

// Helper: Send the real access-approval invite email, branded as Rural
// Community Partners and sent/replied-to as Jody, using a real Supabase
// auth invite link (generated with admin.generateLink, NOT
// admin.inviteUserByEmail - that call sends Supabase's own default email
// from noreply@mail.app.supabase.io, which is what this replaces).
//
// Note: the "from" address must be on a domain verified for sending in
// Resend. hbcat.org isn't verified there (adding it requires a paid plan),
// so this sends from the already-verified ruralcommunitypartners.org
// instead, with Jody's name in the display and her real hbcat.org address
// set as reply-to - replies still land in her real inbox. Once hbcat.org
// gets verified in Resend (or on a paid plan), just set EMAIL_FROM to
// "Jody at Rural Community Partners <jody@hbcat.org>" to switch the actual
// sending address over - no other code change needed.
export async function sendAccessInviteEmail(emailData: {
  to: string;
  name: string;
  role: string;
  actionLink: string;
}) {
  const roleDisplay =
    emailData.role === "program_manager"
      ? "Program Manager"
      : emailData.role === "staff"
        ? "Staff/Admin"
        : emailData.role.charAt(0).toUpperCase() + emailData.role.slice(1);

  const subject = `Welcome to Rural Community Partners - Set Your Password`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">🏠 Rural Community Partners</h1>
            <p style="margin: 5px 0 0; color: #ffffff;">Welcome to the team!</p>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h2>Hello ${emailData.name}! 👋</h2>
            <p>Your access request has been <strong>approved</strong> as a <strong>${roleDisplay}</strong>.</p>
            <p>Click the button below to set your password and activate your account:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${emailData.actionLink}" style="display: inline-block; background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                🔑 Set Your Password
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">Or copy this link into your browser:</p>
            <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; font-family: monospace; border: 1px solid #e5e7eb;">${emailData.actionLink}</div>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-weight: 600;">Rural Community Partners</p>
            <p style="margin: 5px 0 0; color: #9ca3af;">Questions? Just reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hello ${emailData.name},

Your access request for Rural Community Partners has been approved as a ${roleDisplay}.

Set your password here:
${emailData.actionLink}

Questions? Just reply to this email.

---
Rural Community Partners
  `;

  return await sendEmail({
    to: emailData.to,
    subject,
    body: text,
    html,
    from:
      process.env.EMAIL_FROM ||
      "Jody at Rural Community Partners <jody@ruralcommunitypartners.org>",
    replyTo: "jody@hbcat.org",
  });
}

// Helper: Send a "reminder coming up tomorrow" email for a My Reminders
// entry that has a date set - triggered by the daily cron job at
// app/api/cron/reminder-notifications/route.ts, not by anything
// client-side, so it goes out even if nobody has the app open.
export async function sendReminderDueEmail(emailData: {
  to: string;
  name: string;
  note: string;
  meetingDate: string;
  meetingTime?: string | null;
  meetingLocation?: string | null;
  meetingLink?: string | null;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const whenLabel = new Date(emailData.meetingDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  const subject = `⏰ Reminder for tomorrow: ${emailData.note.slice(0, 60)}`;

  const detailsHtml = `
    ${emailData.meetingTime ? `<p style="margin: 4px 0;"><strong>Time:</strong> ${emailData.meetingTime}</p>` : ""}
    ${emailData.meetingLocation ? `<p style="margin: 4px 0;"><strong>Location:</strong> ${emailData.meetingLocation}</p>` : ""}
    ${emailData.meetingLink ? `<p style="margin: 4px 0;"><strong>Link:</strong> <a href="${emailData.meetingLink}">${emailData.meetingLink}</a></p>` : ""}
  `;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">🏠 Rural Community Partners</h1>
            <p style="margin: 5px 0 0; color: #ffffff;">You have a reminder coming up tomorrow</p>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h2>Hi ${emailData.name}!</h2>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">${whenLabel}</p>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0;">
              <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${emailData.note}</p>
              ${detailsHtml.trim() ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #4b5563;">${detailsHtml}</div>` : ""}
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${baseUrl}/admin/business-professional-services" style="display: inline-block; background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Open My Reminders
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-weight: 600;">Rural Community Partners</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${emailData.name},

You have a reminder coming up tomorrow (${whenLabel}):

${emailData.note}
${emailData.meetingTime ? `Time: ${emailData.meetingTime}\n` : ""}${emailData.meetingLocation ? `Location: ${emailData.meetingLocation}\n` : ""}${emailData.meetingLink ? `Link: ${emailData.meetingLink}\n` : ""}
Open My Reminders: ${baseUrl}/admin/business-professional-services

---
Rural Community Partners
  `;

  return await sendEmail({
    to: emailData.to,
    subject,
    body: text,
    html,
    from:
      process.env.EMAIL_FROM ||
      "Jody at Rural Community Partners <jody@ruralcommunitypartners.org>",
    replyTo: "jody@hbcat.org",
  });
}

// Helper: Send a branded "reset your password" email using a real Supabase
// recovery link (generated with admin.generateLink({ type: "recovery" }),
// NOT auth.resetPasswordForEmail() - that call sends Supabase's own
// default "Reset your password" email from noreply@mail.app.supabase.io,
// which is what this replaces). Mirrors sendAccessInviteEmail.
export async function sendPasswordResetEmail(emailData: {
  to: string;
  name: string;
  actionLink: string;
}) {
  const subject = `Reset Your Password - Rural Community Partners`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">🏠 Rural Community Partners</h1>
            <p style="margin: 5px 0 0; color: #ffffff;">Password reset request</p>
          </div>
          <div style="padding: 30px; background: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h2>Hello${emailData.name ? ` ${emailData.name}` : ""}!</h2>
            <p>We received a request to reset your password. Click the button below to choose a new one:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${emailData.actionLink}" style="display: inline-block; background-color: #059669; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                🔑 Reset Your Password
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280;">Or copy this link into your browser:</p>
            <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; font-family: monospace; border: 1px solid #e5e7eb;">${emailData.actionLink}</div>
            <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <p style="margin: 0; font-weight: 600;">Rural Community Partners</p>
            <p style="margin: 5px 0 0; color: #9ca3af;">Questions? Just reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hello${emailData.name ? ` ${emailData.name}` : ""},

We received a request to reset your Rural Community Partners password.

Reset it here:
${emailData.actionLink}

If you didn't request this, you can safely ignore this email.

---
Rural Community Partners
  `;

  return await sendEmail({
    to: emailData.to,
    subject,
    body: text,
    html,
    from:
      process.env.EMAIL_FROM ||
      "Jody at Rural Community Partners <jody@ruralcommunitypartners.org>",
    replyTo: "jody@hbcat.org",
  });
}