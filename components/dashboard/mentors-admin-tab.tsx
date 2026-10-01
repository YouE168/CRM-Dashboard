"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, X, Search, Star, Users as UsersIcon } from "lucide-react";
import {
  getMentors,
  setCrmMemberStatus,
  type MentorRow,
} from "@/lib/supabase/dashboard-data";
import { supabase } from "@/lib/supabase/client";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

// Admin-facing "Mentors" tab for Program Management: lets Jody see every
// mentor account, invite a brand new one (reuses the same
// /api/admin/add-member invite flow "Add New Member" already uses on the
// Business Professional Services page, just pre-set to memberType
// "mentor"), and deactivate/reactivate an existing mentor account.
// Deactivating (rather than deleting) keeps their login, past sessions,
// and mentee notes intact and reversible - mirrors how member status is
// already handled everywhere else in the app (setCrmMemberStatus).

function AddMentorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Your session expired. Please log in again.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/add-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          memberType: "mentor",
          programs: [],
          secondaryRole: null,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || "Couldn't add this mentor. Please try again.");
        setSaving(false);
        return;
      }
      if (!result.emailSent) {
        alert(
          `${name} was added, but the invite email couldn't be sent. They'll need a password-reset link to log in - try "Forgot password" on the login page with ${email}.`,
        );
      }
      onCreated();
    } catch (err) {
      console.error("Failed to add mentor:", err);
      setError("Couldn't add this mentor. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Mentor</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-500">
            This creates a real mentor account and emails them a link to set
            their password - same as approving an access request.
          </p>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add Mentor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MentorsAdminTab() {
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<MentorRow | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  const loadMentors = useCallback(async () => {
    try {
      const data = await getMentors();
      setMentors(data);
    } catch (err) {
      console.error("Failed to load mentors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const isActive = pendingStatusChange.status?.toLowerCase() !== "inactive";
    setStatusChanging(true);
    try {
      await setCrmMemberStatus("mentor", pendingStatusChange.id, isActive ? "inactive" : "active");
      setPendingStatusChange(null);
      await loadMentors();
    } catch (err) {
      console.error("Failed to change mentor status:", err);
      alert("Couldn't update that mentor. Please try again.");
    } finally {
      setStatusChanging(false);
    }
  };

  const filtered = mentors.filter((m) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      m.name.toLowerCase().includes(needle) ||
      (m.email || "").toLowerCase().includes(needle)
    );
  });

  const pendingIsActive =
    pendingStatusChange && pendingStatusChange.status?.toLowerCase() !== "inactive";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
            Mentors
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Every mentor account - add a new mentor (sends them a real invite
            to set their password), or deactivate one who's no longer active.
          </p>
        </div>
        <button
          onClick={() => setShowAddMentor(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Mentor
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search mentors…"
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading mentors…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No mentors found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Active Mentees</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isActive = m.status?.toLowerCase() !== "inactive";
                return (
                  <tr key={m.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-4 py-3 text-gray-600">{m.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{m.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <UsersIcon className="h-3.5 w-3.5 text-gray-400" />
                        {m.active_clients}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.rating > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          {m.rating}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setPendingStatusChange(m)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          isActive
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddMentor && (
        <AddMentorModal
          onClose={() => setShowAddMentor(false)}
          onCreated={() => {
            setShowAddMentor(false);
            loadMentors();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={pendingStatusChange !== null}
        title={pendingIsActive ? "Deactivate mentor" : "Reactivate mentor"}
        message={
          pendingStatusChange
            ? pendingIsActive
              ? `Deactivate ${pendingStatusChange.name}? They'll be marked inactive and dropped from the active roster. Their login, past sessions, and mentee notes stay intact, and you can reactivate them anytime.`
              : `Reactivate ${pendingStatusChange.name}? They'll show as active again.`
            : ""
        }
        confirmText={
          statusChanging ? "Saving…" : pendingIsActive ? "Deactivate" : "Reactivate"
        }
        cancelText="Cancel"
        type={pendingIsActive ? "danger" : "info"}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatusChange(null)}
      />
    </div>
  );
}
