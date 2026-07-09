// components/dashboard/notification-panel.tsx
"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Clock, Mail, Eye, EyeOff } from "lucide-react";
import { notificationService } from "@/lib/notification-service";

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

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const clearAll = () => {
    notificationService.clearAll();
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "mentor":
        return "Mentor";
      case "participant":
        return "Participant";
      case "report":
        return "Report";
      default:
        return "General";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 5);

  if (!isMounted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-red-400 hover:text-red-500"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showAll ? "Show less" : "View all"}
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
            <p className="text-xs mt-1">Notifications will appear here</p>
          </div>
        ) : (
          displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                !notification.read ? "bg-blue-50/30" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${!notification.read ? "font-medium" : ""}`}
                    >
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {getTimeAgo(notification.timestamp)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getCategoryLabel(notification.category)}
                    </span>
                    {notification.type === "email" && (
                      <span className="text-xs text-purple-600 flex items-center gap-0.5">
                        <Mail className="h-3 w-3" />
                        Email
                      </span>
                    )}
                    {notification.type === "browser" && (
                      <span className="text-xs text-green-600 flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        Browser
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
