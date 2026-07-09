// lib/email-service.ts

interface EmailData {
  to: string;
  subject: string;
  body: string;
  html?: string;
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
        from: process.env.EMAIL_FROM || 'admin@ruralcommunitypartners.org',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.body,
        html: emailData.html || emailData.body.replace(/\n/g, '<br/>'),
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