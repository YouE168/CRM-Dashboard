"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Trash2,
  Copy,
  Bell,
  BellOff,
} from "lucide-react";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: "password_setup" | "notification" | "approval" | "general";
  status: "sent" | "delivered" | "failed" | "opened";
  sentAt: string;
  openedAt?: string;
  token?: string;
}

export default function EmailsPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "password_setup" | "notification" | "approval"
  >("all");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newEmailCount, setNewEmailCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Load emails from localStorage
  const loadEmails = useCallback(() => {
    const savedEmails = localStorage.getItem("email_logs");
    if (savedEmails) {
      try {
        const parsed = JSON.parse(savedEmails);
        // Check for new emails
        if (emails.length > 0 && parsed.length > emails.length) {
          const newEmails = parsed.slice(0, parsed.length - emails.length);
          setNewEmailCount((prev) => prev + newEmails.length);
          setNotificationMessage(
            `${newEmails.length} new email${newEmails.length > 1 ? "s" : ""} sent!`,
          );
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 4000);
        }
        setEmails(parsed);
      } catch {
        setEmails(getSampleEmails());
      }
    } else {
      const sampleEmails = getSampleEmails();
      localStorage.setItem("email_logs", JSON.stringify(sampleEmails));
      setEmails(sampleEmails);
    }
    setLastCheck(new Date());
    setLoading(false);
  }, [emails.length]);

  // Real-time update listener
  useEffect(() => {
    // Initial load
    loadEmails();

    // Listen for storage changes (emails added from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "email_logs") {
        const newData = JSON.parse(e.newValue || "[]");
        if (newData.length > emails.length) {
          const newEmails = newData.slice(0, newData.length - emails.length);
          setNewEmailCount((prev) => prev + newEmails.length);
          setNotificationMessage(
            `${newEmails.length} new email${newEmails.length > 1 ? "s" : ""} sent!`,
          );
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 4000);
        }
        setEmails(newData);
        setLastCheck(new Date());
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Auto-refresh every 10 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadEmails();
      }, 10000);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (interval) clearInterval(interval);
    };
  }, [loadEmails, autoRefresh, emails.length]);

  const getSampleEmails = (): EmailLog[] => {
    return [
      {
        id: "1",
        to: "sarah.johnson@example.com",
        subject: "Password Setup for Rural Community Partners",
        body: "Click the link below to set up your password:\n\nhttps://ruralcommunitypartners.com/set-password?token=sarah_token_abc123",
        type: "password_setup",
        status: "sent",
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        token: "sarah_token_abc123",
      },
      {
        id: "2",
        to: "michael.chen@example.com",
        subject: "Password Setup for Rural Community Partners",
        body: "Click the link below to set up your password:\n\nhttps://ruralcommunitypartners.com/set-password?token=michael_token_def456",
        type: "password_setup",
        status: "delivered",
        sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        openedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        token: "michael_token_def456",
      },
      {
        id: "3",
        to: "emily.rodriguez@example.com",
        subject: "Password Setup for Rural Community Partners",
        body: "Click the link below to set up your password:\n\nhttps://ruralcommunitypartners.com/set-password?token=emily_token_ghi789",
        type: "password_setup",
        status: "opened",
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        openedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        token: "emily_token_ghi789",
      },
    ];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "opened":
        return <Eye className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "opened":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "password_setup":
        return "Password Setup";
      case "notification":
        return "Notification";
      case "approval":
        return "Approval";
      default:
        return "General";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "password_setup":
        return "bg-indigo-100 text-indigo-700";
      case "notification":
        return "bg-emerald-100 text-emerald-700";
      case "approval":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredEmails = emails.filter(
    (email) => filter === "all" || email.type === filter,
  );

  const handleRefresh = () => {
    setLoading(true);
    loadEmails();
    setNewEmailCount(0);
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/set-password?token=${token}`;
    navigator.clipboard.writeText(link);
    // Show temporary success toast
    setNotificationMessage("✅ Password setup link copied!");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const handleDeleteEmail = (id: string) => {
    if (confirm("Are you sure you want to delete this email log?")) {
      const updatedEmails = emails.filter((e) => e.id !== id);
      localStorage.setItem("email_logs", JSON.stringify(updatedEmails));
      setEmails(updatedEmails);
      if (selectedEmail?.id === id) {
        setShowDetails(false);
        setSelectedEmail(null);
      }
      setNotificationMessage("🗑️ Email log deleted");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  };

  const handleResendEmail = (email: EmailLog) => {
    // In a real app, this would resend the email
    setNotificationMessage(`📧 Resending email to ${email.to}...`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);

    // Update status
    const updatedEmails = emails.map((e) =>
      e.id === email.id
        ? { ...e, status: "sent" as const, sentAt: new Date().toISOString() }
        : e,
    );
    localStorage.setItem("email_logs", JSON.stringify(updatedEmails));
    setEmails(updatedEmails);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Simulate a new email arriving (for demo purposes)
  const simulateNewEmail = () => {
    const newEmail: EmailLog = {
      id: `demo-${Date.now()}`,
      to: `user${Math.floor(Math.random() * 1000)}@example.com`,
      subject: "Password Setup for Rural Community Partners",
      body: "Click the link below to set up your password:\n\nhttps://ruralcommunitypartners.com/set-password?token=demo_token_abc123",
      type: "password_setup",
      status: "sent",
      sentAt: new Date().toISOString(),
      token: `demo_token_${Math.random().toString(36).substring(2, 15)}`,
    };

    const updatedEmails = [newEmail, ...emails];
    localStorage.setItem("email_logs", JSON.stringify(updatedEmails));
    setEmails(updatedEmails);
    setNewEmailCount((prev) => prev + 1);
    setNotificationMessage("📨 New email sent!");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Real-time Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-md animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Bell className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Real-time Update
              </p>
              <p className="text-sm text-gray-600">{notificationMessage}</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="h-6 w-6 text-purple-600" />
                  Email Logs
                  {newEmailCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      {newEmailCount} new
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time email tracking • Last updated:{" "}
                  {formatDate(lastCheck.toISOString())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-gray-100 text-gray-400"
                }`}
                title={autoRefresh ? "Auto-refresh on" : "Auto-refresh off"}
              >
                {autoRefresh ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </button>

              {/* Demo: Simulate new email */}
              <button
                onClick={simulateNewEmail}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Test Email
              </button>

              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{emails.length}</p>
            <p className="text-sm text-gray-500">Total Emails</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-emerald-600">
              {
                emails.filter(
                  (e) => e.status === "delivered" || e.status === "opened",
                ).length
              }
            </p>
            <p className="text-sm text-gray-500">Delivered/Opened</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-indigo-600">
              {emails.filter((e) => e.type === "password_setup").length}
            </p>
            <p className="text-sm text-gray-500">Password Setup Emails</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-red-600">
              {emails.filter((e) => e.status === "failed").length}
            </p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Emails
            </button>
            <button
              onClick={() => setFilter("password_setup")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "password_setup"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Password Setup
            </button>
            <button
              onClick={() => setFilter("notification")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "notification"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setFilter("approval")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "approval"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Approvals
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredEmails.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No emails found</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter !== "all"
                  ? `No ${filter} emails found`
                  : "No emails have been sent yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredEmails.map((email, index) => (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    index < 3 && email.status === "sent" ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => {
                    setSelectedEmail(email);
                    setShowDetails(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate">
                          {email.to}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(email.type)}`}
                        >
                          {getTypeLabel(email.type)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(email.status)}`}
                        >
                          {getStatusIcon(email.status)}
                          {getStatusLabel(email.status)}
                        </span>
                        {index < 3 && email.status === "sent" && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(email.sentAt)}
                        {email.openedAt &&
                          ` • Opened: ${formatDate(email.openedAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {email.type === "password_setup" && email.token && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(email.token!);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Copy password setup link"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResendEmail(email);
                        }}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Resend email"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmail(email.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Details Modal */}
        {showDetails && selectedEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-5 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Email Details
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedEmail(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      To
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedEmail.to}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Type
                    </label>
                    <p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${getTypeColor(selectedEmail.type)}`}
                      >
                        {getTypeLabel(selectedEmail.type)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Status
                    </label>
                    <p className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getStatusColor(selectedEmail.status)}`}
                      >
                        {getStatusIcon(selectedEmail.status)}
                        {getStatusLabel(selectedEmail.status)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Sent At
                    </label>
                    <p className="text-gray-900 text-sm">
                      {formatDate(selectedEmail.sentAt)}
                    </p>
                    {selectedEmail.openedAt && (
                      <p className="text-xs text-gray-400">
                        Opened: {formatDate(selectedEmail.openedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </label>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedEmail.subject}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Body
                  </label>
                  <div className="mt-1 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm text-gray-700">
                    {selectedEmail.body}
                  </div>
                </div>

                {selectedEmail.type === "password_setup" &&
                  selectedEmail.token && (
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <label className="text-xs font-medium text-indigo-700 uppercase">
                        Password Setup Link
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/set-password?token=${selectedEmail.token}`}
                          readOnly
                          className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm text-gray-700"
                        />
                        <button
                          onClick={() => handleCopyLink(selectedEmail.token!)}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedEmail(null);
                    }}
                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleResendEmail(selectedEmail);
                      setShowDetails(false);
                      setSelectedEmail(null);
                    }}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resend Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
