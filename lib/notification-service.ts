// lib/notification-service.ts

interface NotificationItem {
  id: string;
  type: "email" | "browser" | "inapp";
  category: "mentor" | "participant" | "report" | "general";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  type: "mentor_alert" | "participant_milestone" | "report_reminder" | "general";
}

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];
  private isClient = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isClient = true;
      this.loadNotifications();
    }
  }

  private loadNotifications() {
    if (!this.isClient) return;
    try {
      const saved = localStorage.getItem("notification_items");
      if (saved) {
        this.notifications = JSON.parse(saved);
      } else {
        // Initialize with clean, professional sample notifications
        this.notifications = [
          {
            id: `notif-${Date.now()}-1`,
            type: "inapp",
            category: "general",
            title: "Welcome to Admin Dashboard",
            message: "Real-time notifications are now active.",
            timestamp: new Date().toISOString(),
            read: false,
          },
          {
            id: `notif-${Date.now()}-2`,
            type: "inapp",
            category: "mentor",
            title: "Mentor Activity Update",
            message: "Sarah Johnson logged 3 hours today.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false,
          },
          {
            id: `notif-${Date.now()}-3`,
            type: "inapp",
            category: "participant",
            title: "Participant Milestone",
            message: "Michael Chen completed Business Plan module.",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            read: false,
          },
          {
            id: `notif-${Date.now()}-4`,
            type: "inapp",
            category: "report",
            title: "Report Reminder",
            message: "Monthly reports are due by the 5th.",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            read: false,
          },
        ];
        this.saveNotifications();
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveNotifications() {
    if (!this.isClient) return;
    try {
      localStorage.setItem("notification_items", JSON.stringify(this.notifications));
      this.listeners.forEach(listener => listener(this.notifications));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }

  subscribe(callback: (notifications: NotificationItem[]) => void) {
    this.listeners.push(callback);
    callback(this.notifications);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  addNotification(
    type: NotificationItem["type"],
    category: NotificationItem["category"],
    title: string,
    message: string,
    data?: any
  ) {
    const notification: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      category,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      data,
    };

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.showBrowserNotification(notification);
    return notification;
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
  }

  private showBrowserNotification(notification: NotificationItem) {
    if (!this.isClient) return;
    
    const browserEnabled = localStorage.getItem("browser_notifications_enabled") === "true";
    if (!browserEnabled) return;

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/logo.png",
      });
    }
  }

  async sendEmail(emailData: EmailNotification): Promise<boolean> {
    if (!this.isClient) return false;

    try {
      const emailEnabled = localStorage.getItem("email_notifications_enabled") === "true";
      if (!emailEnabled) {
        console.log("Email notifications are disabled");
        return false;
      }

      console.log("Sending email:", emailData);

      const emailLogs = JSON.parse(localStorage.getItem("email_logs") || "[]");
      emailLogs.unshift({
        id: `email-${Date.now()}`,
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        type: emailData.type,
        status: "sent",
        sentAt: new Date().toISOString(),
      });
      localStorage.setItem("email_logs", JSON.stringify(emailLogs));

      this.addNotification(
        "email",
        "general",
        `Email Sent: ${emailData.subject}`,
        `To: ${emailData.to}`,
        { email: emailData }
      );

      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }
}

export const notificationService = typeof window !== 'undefined' 
  ? new NotificationService() 
  : new NotificationService();

export const NotificationHelpers = {
  async notifyMentorActivity(
    mentorName: string,
    action: "logged_hours" | "updated_status" | "completed_session",
    details: string
  ) {
    const title = `Mentor Activity: ${mentorName}`;
    const messages = {
      logged_hours: `${mentorName} logged new hours: ${details}`,
      updated_status: `${mentorName} updated their status: ${details}`,
      completed_session: `${mentorName} completed a session: ${details}`,
    };

    notificationService.addNotification(
      "inapp",
      "mentor",
      title,
      messages[action] || `${mentorName} ${action}: ${details}`
    );

    const emailEnabled = typeof window !== 'undefined' && localStorage.getItem("email_notifications_enabled") === "true";
    if (emailEnabled) {
      await notificationService.sendEmail({
        to: "admin@ruralcommunity.org",
        subject: title,
        body: messages[action] || `${mentorName} ${action}: ${details}`,
        type: "mentor_alert",
      });
    }
  },

  async notifyParticipantMilestone(
    participantName: string,
    milestone: string,
    program: string
  ) {
    const title = `Participant Milestone: ${participantName}`;
    const message = `${participantName} completed "${milestone}" in ${program}`;

    notificationService.addNotification(
      "inapp",
      "participant",
      title,
      message
    );

    const emailEnabled = typeof window !== 'undefined' && localStorage.getItem("email_notifications_enabled") === "true";
    if (emailEnabled) {
      await notificationService.sendEmail({
        to: "admin@ruralcommunity.org",
        subject: title,
        body: message,
        type: "participant_milestone",
      });
    }
  },

  async sendReportReminder(month: string, dueDate: string) {
    const title = "Monthly Report Reminder";
    const message = `Reports for ${month} are due by ${dueDate}. Please submit your reports.`;

    notificationService.addNotification(
      "inapp",
      "report",
      title,
      message
    );

    const emailEnabled = typeof window !== 'undefined' && localStorage.getItem("email_notifications_enabled") === "true";
    if (emailEnabled) {
      await notificationService.sendEmail({
        to: "admin@ruralcommunity.org",
        subject: title,
        body: message,
        type: "report_reminder",
      });
    }
  },
};