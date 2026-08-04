"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send } from "lucide-react";
import { linkifyText } from "@/lib/linkify";
import {
  getDirectMessagesForUser,
  sendDirectMessage,
  subscribeToDirectMessages,
  type DirectMessageRow,
} from "@/lib/supabase/dashboard-data";

// Real, private 1:1 chat with admin - shown on the Coalition/Mentor/Partner
// dashboards, right below the (one-way, broadcast) "Notes from Admin" card.
// Separate feature, separate table (direct_messages) - sending a reply
// here never touches the admin_notes announcements.
export function DirectMessageChat({
  userId,
  userName,
}: {
  userId: string | null;
  userName: string;
}) {
  const [messages, setMessages] = useState<DirectMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await getDirectMessagesForUser(userId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeToDirectMessages(loadMessages);
    return unsubscribe;
  }, [loadMessages]);

  const handleSend = async () => {
    if (!input.trim() || !userId || sending) return;
    setSending(true);
    try {
      await sendDirectMessage(userId, "user", userName, input.trim());
      setInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-900">💬 Message Admin</h3>
      </div>

      <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-6">
            <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No messages yet.</p>
            <p className="text-xs text-gray-400">
              Send a message and admin will see it here.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  m.sender_role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-xs font-medium ${
                      m.sender_role === "user"
                        ? "text-emerald-100"
                        : "text-gray-500"
                    }`}
                  >
                    {m.sender_role === "admin"
                      ? m.sender_name || "Admin"
                      : "You"}
                  </span>
                  <span
                    className={`text-[10px] ${
                      m.sender_role === "user"
                        ? "text-emerald-100"
                        : "text-gray-400"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {linkifyText(m.message)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
          placeholder="Write a message to admin… (⌘Enter to send)"
          rows={2}
          className="w-full text-sm text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-3 w-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
