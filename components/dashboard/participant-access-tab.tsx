"use client";

import { useState, useEffect, useCallback } from "react";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  getAllPrograms,
  type ProgramRow,
  getAllMenteeEntrepreneurAccounts,
  subscribeToMenteeEntrepreneurAccounts,
  setProgramAccessByName,
  type ParticipantAccountRow,
} from "@/lib/supabase/dashboard-data";

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
  const [allPrograms, setAllPrograms] = useState<ProgramRow[]>([]);
  const [pendingRevokeBps, setPendingRevokeBps] = useState(false);
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
    getAllPrograms()
      .then(setAllPrograms)
      .catch((err) => console.error("Failed to load programs:", err));
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
                    Program access
                  </h4>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Turn a program on to allow access, or off to remove it.
                  </p>
                  {allPrograms.length === 0 ? (
                    <p className="text-xs text-gray-400">Loading programs…</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {[...allPrograms]
                        .sort((x, y) => x.name.localeCompare(y.name))
                        .map((prog) => {
                          const row = selected.programs.find(
                            (p) => p.program_id === prog.id,
                          );
                          const isOn = !!row?.approved;
                          const busy = togglingProgram === prog.name;
                          return (
                            <div
                              key={prog.id}
                              className="flex items-center justify-between py-2.5 gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm text-gray-800 truncate">
                                  {prog.name}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {isOn
                                    ? "Allowed"
                                    : row
                                      ? "Pending / not allowed"
                                      : "Not allowed"}
                                </p>
                              </div>
                              <button
                                role="switch"
                                aria-checked={isOn}
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    isOn &&
                                    prog.name === "Business Professional Services"
                                  ) {
                                    setPendingRevokeBps(true);
                                  } else {
                                    toggleProgramAccess(prog.name, isOn);
                                  }
                                }}
                                className={`relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                                  isOn ? "bg-emerald-500" : "bg-gray-300"
                                }`}
                                title={isOn ? "Click to turn off" : "Click to turn on"}
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                    isOn ? "translate-x-5" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
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
      <ConfirmationModal
        isOpen={pendingRevokeBps}
        title="Turn off Business Professional Services?"
        message={`${selected?.name ?? "This person"} will lose access to Business Professional Services. This is normally on for every account.`}
        confirmText="Turn off"
        cancelText="Cancel"
        type="warning"
        onConfirm={() => {
          setPendingRevokeBps(false);
          toggleProgramAccess("Business Professional Services", true);
        }}
        onCancel={() => setPendingRevokeBps(false)}
      />
    </div>
  );
}
