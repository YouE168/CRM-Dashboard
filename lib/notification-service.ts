// lib/notification-service.ts
import { supabase } from "@/lib/supabase/client";

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

function mapRow(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    title: row.title,
    message: row.message,
    timestamp: row.created_at,
    read: row.read,
    data: row.data,
  };
}

class NotificationService {
  private notifications: NotificationItem[] = [];
  private listeners: ((notifications: NotificationItem[]) => void)[] = [];
  private isClient = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.isClient = true;
      this.init();
    }
  }

  private async init() {
    await this.loadNotifications();
    this.subscribeRealtime();
  }

  private async loadNotifications() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load notifications:", error);
      return;
    }

    this.notifications = (data ?? []).map(mapRow);
    this.notifyListeners();
  }

  private subscribeRealtime() {
    const channelName = `notifications-${Math.random().toString(36).slice(2)}`;
    supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          this.loadNotifications();
        },
      )
      .subscribe();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.notifications));
  }

  subscribe(callback: (notifications: NotificationItem[]) => void) {
    this.listeners.push(callback);
    callback(this.notifications);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async addNotification(
    type: NotificationItem["type"],
    category: NotificationItem["category"],
    title: string,
    message: string,
    data?: any,
  ) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return null;

    const { data: inserted, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        category,
        title,
        message,
        read: false,
        data: data ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add notification:", error);
      return null;
    }

    const mapped = mapRow(inserted);
    this.showBrowserNotification(mapped);
    // The realtime subscription refreshes the local list automatically —
    // no need to manually update this.notifications here.
    return mapped;
  }

  async markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) console.error("Failed to mark notification as read:", error);
  }

  async markAllAsRead() {
    const ids = this.notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids);
    if (error) console.error("Failed to mark all as read:", error);
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  async clearAll() {
    const ids = this.notifications.map((n) => n.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("notifications").delete().in("id", ids);
    if (error) console.error("Failed to clear notifications:", error);
  }

  private showBrowserNotification(notification: NotificationItem) {
    if (!this.isClient) return;
    const browserEnabled =
      localStorage.getItem("browser_notifications_enabled") === "true";
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

    const emailEnabled =
      localStorage.getItem("email_notifications_enabled") === "true";
    if (!emailEnabled) {
      console.log("Email notifications are disabled");
      return false;
    }

    // Writes into the same email_logs table the Email Logs admin page reads
    const { error } = await supabase.from("email_logs").insert({
      to_email: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      type: emailData.type,
      status: "sent",
    });

    if (error) {
      console.error("Failed to send email:", error);
      return false;
    }

    await this.addNotification(
      "email",
      "general",
      `Email Sent: ${emailData.subject}`,
      `To: ${emailData.to}`,
      { email: emailData },
    );

    return true;
  }
}

export const notificationService = new NotificationService();

export const NotificationHelpers = {
  async notifyMentorActivity(
    mentorName: string,
    action: "logged_hours" | "updated_status" | "completed_session",
    details: string,
  ) {
    const title = `Mentor Activity: ${mentorName}`;
    const messages = {
      logged_hours: `${mentorName} logged new hours: ${details}`,
      updated_status: `${mentorName} updated their status: ${details}`,
      completed_session: `${mentorName} completed a session: ${details}`,
    };

    await notificationService.addNotification(
      "inapp",
      "mentor",
      title,
      messages[action] || `${mentorName} ${action}: ${details}`,
    );

    const emailEnabled =
      typeof window !== "undefined" &&
      localStorage.getItem("email_notifications_enabled") === "true";
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
    program: string,
  ) {
    const title = `Participant Milestone: ${participantName}`;
    const message = `${participantName} completed "${milestone}" in ${program}`;

    await notificationService.addNotification("inapp", "participant", title, message);

    const emailEnabled =
      typeof window !== "undefined" &&
      localStorage.getItem("email_notifications_enabled") === "true";
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

    await notificationService.addNotification("inapp", "report", title, message);

    const emailEnabled =
      typeof window !== "undefined" &&
      localStorage.getItem("email_notifications_enabled") === "true";
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