"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllMenteeEntrepreneurAccounts,
  subscribeToMenteeEntrepreneurAccounts,
  setProgramAccessByName,
  type ParticipantAccountRow,
} from "@/lib/supabase/dashboard-data";
import { Check } from "lucide-react";

// Shared list-plus-detail view for the admin Mentees and Entrepreneurs
// tabs in Program Management. Mirrors the Partners/Coalitions tab pattern
// (account list on the left, Programs approve/revoke chips on the right),
// scoped down to just what's needed here since mentee/entrepreneur
// accounts already have dedicated Program Access, Tracking, and Mentor
// Matching tabs elsewhere for everything else.
export function ParticipantAccessTab({
  title,
  description,
  emptyLabel,
  filter,
  showControls = false,
}: {
  title: string;
  description: string;
  emptyLabel: string;
  filter: (row: ParticipantAccountRow) => boolean;
  // Adds a search box + program filter and shows each person's programs
  // right in the list (used by the "All Participants" tab).
  showControls?: boolean;
}) {
  const [accounts, setAccounts] = useState<ParticipantAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [togglingProgram, setTogglingProgram] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const data = await getAllMenteeEntrepreneurAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load participant accounts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToMenteeEntrepreneurAccounts(loadData);
    return unsubscribe;
  }, [loadData]);

  const roleLabel = (a: ParticipantAccountRow) =>
    a.secondaryRole && a.secondaryRole !== a.primaryRole
      ? `${a.primaryRole === "mentee" ? "Mentee" : "Entrepreneur"} + ${
          a.secondaryRole === "mentee" ? "Mentee" : "Entrepreneur"
        }`
      : a.primaryRole === "mentee"
        ? "Mentee"
        : "Entrepreneur";

  const programOptions = Array.from(
    new Set(accounts.flatMap((a) => a.programs.map((p) => p.name))),
  ).sort();

  const filtered = accounts
    .filter(filter)
    .filter((a) => {
      if (!showControls) return true;
      const t = q.trim().toLowerCase();
      if (t && !a.name.toLowerCase().includes(t) && !a.email.toLowerCase().includes(t)) {
        return false;
      }
      if (programFilter !== "all" && !a.programs.some((p) => p.name === programFilter && p.approved)) {
        return false;
      }
      if (roleFilter === "mentee" && a.primaryRole !== "mentee" && a.secondaryRole !== "mentee") return false;
      if (roleFilter === "entrepreneur" && a.primaryRole !== "entrepreneur" && a.secondaryRole !== "entrepreneur") return false;
      return true;
    })
    .sort((x, y) => x.name.localeCompare(y.name));
  const selected = filtered.find((a) => a.userId === selectedId) || null;

  const toggleProgramAccess = async (programName: string, approved: boolean) => {
    if (!selected) return;
    setTogglingProgram(programName);
    try {
      await setProgramAccessByName(selected.userId, programName, !approved);
      await loadData();
    } catch (err) {
      console.error("Failed to update program access:", err);
    } finally {
      setTogglingProgram(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      {showControls && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700"
          >
            <option value="all">Mentees + Entrepreneurs</option>
            <option value="mentee">Mentee access</option>
            <option value="entrepreneur">Entrepreneur access</option>
          </select>
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700"
          >
            <option value="all">All programs</option>
            {programOptions.map((n) => (
              <option key={n} value={n}>
                In: {n}
              </option>
            ))}
          </select>
        </div>
      )}
      {showControls && (
        <p className="text-xs text-gray-500">
          {filtered.length} participant{filtered.length === 1 ? "" : "s"}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          {showControls && accounts.length > 0 ? "No one matches these filters." : emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {filtered.map((a) => (
              <button
                key={a.userId}
                onClick={() => setSelectedId(a.userId)}
                className={`w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors ${
                  selectedId === a.userId ? "bg-emerald-50" : ""
                }`}
              >
                <p className="font-medium text-gray-800 text-sm">{a.name}</p>
                <p className="text-xs text-gray-500">{a.email}</p>
                <div className="flex gap-2 mt-1 text-[11px] text-gray-400 flex-wrap">
                  <span>{roleLabel(a)}</span>
                  {a.mentor && <span>· Mentor: {a.mentor}</span>}
                </div>
                {showControls && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {a.programs.filter((p) => p.approved).map((p) => (
                      <span
                        key={p.user_program_id}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700"
                      >
                        {p.name}
                      </span>
                    ))}
                    {a.programs.some((p) => !p.approved) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        {a.programs.filter((p) => !p.approved).length} pending
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="md:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                Select an account to view their programs.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-gray-500">{selected.email}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {roleLabel(selected)}
                    </span>
                    {selected.status && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {selected.status}
                      </span>
                    )}
                    {selected.mentor && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Mentor: {selected.mentor}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    Programs
                  </h4>
                  <p className="text-[11px] text-gray-400 mb-2">
                    Click a program to approve or revoke access.
                  </p>
                  {selected.programs.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Not enrolled in any program yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selected.programs.map((p) => {
                        // Business Professional Services is auto-approved
                        // for every account at signup and can't be revoked -
                        // show it as a plain badge instead of a clickable
                        // toggle, since there's nothing to approve/revoke.
                        if (p.name === "Business Professional Services") {
                          return (
                            <span
                              key={p.user_program_id}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1"
                              title="Granted automatically to every account - not editable"
                            >
                              <Check className="h-3 w-3" />
                              {p.name}
                            </span>
                          );
                        }
                        const isApproved = p.approved;
                        return (
                          <button
                            key={p.user_program_id}
                            onClick={() => toggleProgramAccess(p.name, p.approved)}
                            disabled={togglingProgram === p.name}
                            className={`text-[11px] px-2 py-0.5 rounded-full transition-colors disabled:opacity-50 inline-flex items-center gap-1 ${
                              isApproved
                                ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                                : "bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-700"
                            }`}
                            title={
                              isApproved
                                ? "Click to revoke access"
                                : "Click to approve access"
                            }
                          >
                            {togglingProgram === p.name ? (
                              "…"
                            ) : (
                              <>
                                {isApproved && <Check className="h-3 w-3" />}
                                {p.name}
                                {!isApproved && " (pending)"}
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
