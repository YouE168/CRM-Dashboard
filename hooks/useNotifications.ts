// hooks/useNotifications.ts
"use client";

import { useState, useEffect } from "react";
import { notificationService } from "@/lib/notification-service";

interface Notification {
  id: string;
  type: "email" | "browser" | "inapp";
  category: "mentor" | "participant" | "report" | "general";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
    setLoading(false);

    // Subscribe to updates
    const unsubscribe = notificationService.subscribe((updated) => {
      setNotifications(updated);
      setUnreadCount(notificationService.getUnreadCount());
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const addNotification = (
    type: Notification["type"],
    category: Notification["category"],
    title: string,
    message: string,
    data?: any
  ) => {
    return notificationService.addNotification(type, category, title, message, data);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}