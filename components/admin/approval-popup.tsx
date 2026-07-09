// components/admin/approval-popup.tsx
"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Copy,
  Check,
  X,
  Send,
  User,
  Mail,
  Loader2,
} from "lucide-react";

interface ApprovalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userRole: string;
  token: string;
  baseUrl?: string;
  onEmailSent?: () => void;
}

export function ApprovalPopup({
  isOpen,
  onClose,
  userName,
  userEmail,
  userRole,
  token,
  baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000",
  onEmailSent,
}: ApprovalPopupProps) {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const setupLink = `${baseUrl}/set-password?token=${token}`;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(setupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = setupLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setEmailError("");

    try {
      const roleDisplay =
        userRole === "program_manager"
          ? "Program Manager"
          : userRole === "staff"
            ? "Staff/Admin"
            : userRole.charAt(0).toUpperCase() + userRole.slice(1);

      // Create HTML email content
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { 
                background: linear-gradient(135deg, #059669, #0d9488); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
                border-radius: 12px 12px 0 0; 
              }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 5px 0 0; opacity: 0.9; }
              .content { 
                padding: 30px; 
                background: #f9fafb; 
                border-left: 1px solid #e5e7eb;
                border-right: 1px solid #e5e7eb;
              }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #059669, #0d9488); 
                color: white !important; 
                padding: 14px 35px; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: bold;
                margin: 20px 0;
                box-shadow: 0 4px 6px rgba(5, 150, 105, 0.3);
              }
              .button:hover { opacity: 0.9; }
              .link-box { 
                background: #f3f4f6; 
                padding: 15px; 
                border-radius: 6px; 
                word-break: break-all;
                font-size: 14px;
                font-family: monospace;
                border: 1px solid #e5e7eb;
              }
              .footer { 
                text-align: center; 
                padding: 20px; 
                font-size: 12px; 
                color: #6b7280;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 12px 12px;
              }
              .badge {
                display: inline-block;
                background: #d1fae5;
                color: #065f46;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
              }
              .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 12px;
                border-radius: 6px;
                margin: 15px 0;
                font-size: 14px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 Rural Community Partners</h1>
                <p>Welcome to the team!</p>
              </div>
              <div class="content">
                <h2>Hello ${userName}! 👋</h2>
                <p>Your access request has been <strong>approved</strong>!</p>
                <p>
                  You've been granted access as a 
                  <span class="badge" style="margin-left: 8px;">${roleDisplay}</span>
                </p>
                
                <p style="margin-top: 20px;">
                  Please click the button below to set up your password and activate your account:
                </p>
                
                <div style="text-align: center;">
                  <a href="${setupLink}" class="button">
                    🔑 Set Your Password
                  </a>
                </div>
                
                <p>Or copy this link into your browser:</p>
                <div class="link-box">${setupLink}</div>
                
                <div class="warning">
                  ⏰ <strong>Important:</strong> This link will expire in <strong>24 hours</strong>.
                  If you need a new link, please contact your administrator.
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <p style="font-size: 14px; color: #6b7280;">
                  <strong>What happens next?</strong>
                </p>
                <ul style="font-size: 14px; color: #6b7280; padding-left: 20px;">
                  <li>Set your password using the link above</li>
                  <li>Log in to your dashboard</li>
                  <li>Start managing your programs!</li>
                </ul>
              </div>
              <div class="footer">
                <p style="margin: 0; font-weight: 600;">Rural Community Partners</p>
                <p style="margin: 5px 0 0; color: #9ca3af;">
                  Supporting Rural Communities
                </p>
                <p style="margin: 10px 0 0; color: #9ca3af; font-size: 11px;">
                  If you didn't request this access, please ignore this email.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userEmail,
          subject: `🎉 Welcome! Set Your Password - Rural Community Partners`,
          html: emailHtml,
          text: `
Welcome to Rural Community Partners!

Hello ${userName}!

Your access request has been approved! You've been granted ${roleDisplay} access.

Please set your password by visiting this link:
${setupLink}

This link will expire in 24 hours.

What happens next?
- Set your password using the link above
- Log in to your dashboard
- Start managing your programs!

If you didn't request this access, please ignore this email.

---
Rural Community Partners
Supporting Rural Communities
          `,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        if (onEmailSent) onEmailSent();
        setTimeout(() => {
          setEmailSent(false);
          handleClose();
        }, 3000);
      } else {
        setEmailError(data.error || "Failed to send email. Please try again.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailError("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const roleDisplay =
    userRole === "program_manager"
      ? "Program Manager"
      : userRole === "staff"
        ? "Staff/Admin"
        : userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-200 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className={`relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transition-all duration-300 ${
            isClosing
              ? "scale-95 opacity-0 translate-y-4"
              : "scale-100 opacity-100 translate-y-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Success Icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Access Approved
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {roleDisplay} access is ready
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

            {/* User info */}
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{userName}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                {userEmail}
              </span>
              <span className="ml-auto px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                {roleDisplay}
              </span>
            </div>

            {/* Link section */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Password Setup Link
              </label>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <input
                  type="text"
                  value={setupLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none font-mono truncate"
                  aria-label="Password setup link"
                />
                <button
                  onClick={handleCopy}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    copied
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Email Actions */}
            <div className="mt-4">
              <button
                onClick={handleSendEmail}
                disabled={isSending || emailSent}
                className={`w-full py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
                  emailSent
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default"
                    : isSending
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-wait"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                }`}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : emailSent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Sent Successfully!
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send via Email
                  </>
                )}
              </button>
              {emailError && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  {emailError}
                </p>
              )}
              <p className="text-xs text-gray-400 text-center mt-2">
                The user will receive an email with their password setup link
              </p>
            </div>

            {/* Instruction */}
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <Send className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Send this link to <strong>{userName}</strong> so they can set
                  their password and activate their account.
                </span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
