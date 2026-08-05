"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageSquare, User, Megaphone } from "lucide-react";
import {
  getNotificationFeedForUser,
  getLastSeenNotificationsAt,
  markNotificationsSeen,
  subscribeToNotificationFeed,
  type NotificationFeedItem,
} from "@/lib/supabase/dashboard-data";

// Bell + dropdown shown on the mentee/entrepreneur/mentor/coalition/
// partner dashboards - a live view of "notes from other users" pulled
// from whichever of admin_notes/mentee_notes/direct_messages apply to
// this person's role (see getNotificationFeedForUser). Unread is based
// on a per-user "last seen" timestamp rather than a read flag on each
// note, since admin_notes/mentee_notes are broadcasts that more than one
// person can see.
export function NotificationBell({
  userId,
  role,
  participantId,
}: {
  userId: string;
  role: string;
  participantId?: string | null;
}) {
  const [items, setItems] = useState<NotificationFeedItem[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadFeed = useCallback(async () => {
    try {
      const feed = await getNotificationFeedForUser({ userId, role, participantId });
      setItems(feed);
    } catch (err) {
      console.error("Failed to load notification feed:", err);
    }
  }, [userId, role, participantId]);

  useEffect(() => {
    loadFeed();
    getLastSeenNotificationsAt(userId)
      .then(setLastSeenAt)
      .catch((err) => console.error("Failed to load last-seen state:", err));
    const unsubscribe = subscribeToNotificationFeed(role, loadFeed);
    return unsubscribe;
  }, [loadFeed, role, userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // lastSeenAt === null means this person has never opened the bell
  // before - everything currently in the feed counts as unread, not
  // nothing (see getLastSeenNotificationsAt).
  const isItemUnread = (createdAt: string) =>
    lastSeenAt === null || new Date(createdAt) > new Date(lastSeenAt);
  const unreadCount = items.filter((i) => isItemUnread(i.createdAt)).length;

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      try {
        await markNotificationsSeen(userId);
        setLastSeenAt(new Date().toISOString());
      } catch (err) {
        console.error("Failed to mark notifications seen:", err);
      }
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

  const sourceIcon = (source: NotificationFeedItem["source"]) => {
    switch (source) {
      case "mentor_note":
        return <User className="h-3.5 w-3.5 text-emerald-600" />;
      case "direct_message":
        return <MessageSquare className="h-3.5 w-3.5 text-blue-600" />;
      default:
        return <Megaphone className="h-3.5 w-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {items.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Bell className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              items.map((item) => {
                const isUnread = isItemUnread(item.createdAt);
                return (
                  <div
                    key={item.id}
                    className={`p-3 ${isUnread ? "bg-blue-50/40" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{sourceIcon(item.source)}</div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm text-gray-900 ${isUnread ? "font-medium" : ""}`}
                        >
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
