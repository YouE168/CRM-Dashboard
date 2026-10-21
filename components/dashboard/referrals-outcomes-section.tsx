"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Pencil, Trash2, Link2 } from "lucide-react";
import {
  REFERRAL_TYPES,
  OUTCOME_TYPES,
  REFERRAL_STATUSES,
  referralLabel,
  outcomeLabel,
  formatMoney,
  getReferralsFor,
  getOutcomesFor,
  addReferrals,
  addOutcomes,
  updateReferral,
  updateOutcome,
  deleteReferral,
  deleteOutcome,
  getLinkCandidates,
  type ReferralRecord,
  type OutcomeRecord,
  type LinkCandidate,
} from "@/lib/referrals-outcomes";
import { getAllPrograms } from "@/lib/supabase/dashboard-data";

const today = () => new Date().toISOString().slice(0, 10);

const inputCls =
  "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400";
const labelCls = "block text-[11px] font-medium text-gray-500 mb-0.5";

// ---------------------------------------------------------------------
// Dropdown with checkboxes (pick several)
// ---------------------------------------------------------------------
function CheckboxDropdown({
  label,
  options,
  selected,
  onToggle,
  color,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  color: "indigo" | "emerald";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const tone =
    color === "indigo"
      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 border rounded-xl px-3 py-2 text-sm font-medium ${tone}`}
      >
        <span>
          {label}
          {selected.length > 0 ? ` (${selected.length} selected)` : ""}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {options.map((o) => (
            <label
              key={o.id}
              className="flex items-start gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => onToggle(o.id)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Draft shapes (strings so inputs stay controlled)
// ---------------------------------------------------------------------
interface ReferralDraft {
  type: string;
  other_label: string;
  referred_date: string;
  referred_to: string;
  status: string;
  related_program: string;
  notes: string;
}
interface OutcomeDraft {
  type: string;
  other_label: string;
  achieved_date: string;
  related_program: string;
  description: string;
  confirmation: string;
  amount: string;
  funding_source: string;
  job_count: string;
  internship_count: string;
  referral_id: string;
}

const newReferralDraft = (type: string): ReferralDraft => ({
  type,
  other_label: "",
  referred_date: today(),
  referred_to: "",
  status: "pending",
  related_program: "",
  notes: "",
});
const newOutcomeDraft = (type: string): OutcomeDraft => ({
  type,
  other_label: "",
  achieved_date: today(),
  related_program: "",
  description: "",
  confirmation: "",
  amount: "",
  funding_source: "",
  job_count: "",
  internship_count: "",
  referral_id: "",
});

function ReferralFields({
  draft,
  onChange,
  programs,
}: {
  draft: ReferralDraft;
  onChange: (d: ReferralDraft) => void;
  programs: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {draft.type === "other" && (
        <div className="col-span-2">
          <label className={labelCls}>Other referral (describe) *</label>
          <input className={inputCls} value={draft.other_label}
            onChange={(e) => onChange({ ...draft, other_label: e.target.value })} />
        </div>
      )}
      <div>
        <label className={labelCls}>Date referred *</label>
        <input type="date" className={inputCls} value={draft.referred_date}
          onChange={(e) => onChange({ ...draft, referred_date: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Status *</label>
        <select className={inputCls} value={draft.status}
          onChange={(e) => onChange({ ...draft, status: e.target.value })}>
          {REFERRAL_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Person or organization referred to *</label>
        <input className={inputCls} value={draft.referred_to}
          onChange={(e) => onChange({ ...draft, referred_to: e.target.value })} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>Related program (optional)</label>
        <select className={inputCls} value={draft.related_program}
          onChange={(e) => onChange({ ...draft, related_program: e.target.value })}>
          <option value="">None</option>
          {programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
    </div>
  );
}

function OutcomeFields({
  draft,
  onChange,
  programs,
  referrals,
}: {
  draft: OutcomeDraft;
  onChange: (d: OutcomeDraft) => void;
  programs: string[];
  referrals: ReferralRecord[];
}) {
  const kind = OUTCOME_TYPES.find((t) => t.id === draft.type)?.kind ?? "none";
  return (
    <div className="grid grid-cols-2 gap-2">
      {kind === "other" && (
        <div className="col-span-2">
          <label className={labelCls}>Other measurable outcome (describe) *</label>
          <input className={inputCls} value={draft.other_label}
            onChange={(e) => onChange({ ...draft, other_label: e.target.value })} />
        </div>
      )}
      <div>
        <label className={labelCls}>Date achieved *</label>
        <input type="date" className={inputCls} value={draft.achieved_date}
          onChange={(e) => onChange({ ...draft, achieved_date: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>Related program (if applicable)</label>
        <select className={inputCls} value={draft.related_program}
          onChange={(e) => onChange({ ...draft, related_program: e.target.value })}>
          <option value="">None</option>
          {programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {kind === "funding" && (
        <>
          <div>
            <label className={labelCls}>Dollar amount *</label>
            <input type="number" min={0} step="0.01" className={inputCls} value={draft.amount}
              onChange={(e) => onChange({ ...draft, amount: e.target.value })} placeholder="25000" />
          </div>
          <div>
            <label className={labelCls}>Funding source *</label>
            <input className={inputCls} value={draft.funding_source}
              onChange={(e) => onChange({ ...draft, funding_source: e.target.value })}
              placeholder="e.g. Local bank" />
          </div>
        </>
      )}
      {kind === "contract" && (
        <div className="col-span-2">
          <label className={labelCls}>Dollar amount (if known)</label>
          <input type="number" min={0} step="0.01" className={inputCls} value={draft.amount}
            onChange={(e) => onChange({ ...draft, amount: e.target.value })} />
        </div>
      )}
      {kind === "jobs" && (
        <div className="col-span-2">
          <label className={labelCls}>Number of jobs *</label>
          <input type="number" min={0} step="1" className={inputCls} value={draft.job_count}
            onChange={(e) => onChange({ ...draft, job_count: e.target.value })} />
        </div>
      )}
      {kind === "internships" && (
        <div className="col-span-2">
          <label className={labelCls}>Number of internships *</label>
          <input type="number" min={0} step="1" className={inputCls} value={draft.internship_count}
            onChange={(e) => onChange({ ...draft, internship_count: e.target.value })} />
        </div>
      )}

      <div className="col-span-2">
        <label className={labelCls}>Short description of the result and how RCP helped *</label>
        <textarea rows={2} className={inputCls} value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })} />
      </div>
      <div className="col-span-2">
        <label className={labelCls}>How we confirmed it (client confirmation, documentation…) *</label>
        <input className={inputCls} value={draft.confirmation}
          onChange={(e) => onChange({ ...draft, confirmation: e.target.value })} />
      </div>
      {referrals.length > 0 && (
        <div className="col-span-2">
          <label className={labelCls}>Connect to an earlier referral (optional)</label>
          <select className={inputCls} value={draft.referral_id}
            onChange={(e) => onChange({ ...draft, referral_id: e.target.value })}>
            <option value="">Not linked</option>
            {referrals.map((r) => (
              <option key={r.id} value={r.id}>
                {referralLabel(r.referral_type)} · {new Date(r.referred_date + "T00:00:00").toLocaleDateString()}
                {r.referred_to ? ` · ${r.referred_to}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function referralProblem(d: ReferralDraft): string | null {
  if (d.type === "other" && !d.other_label.trim()) return "Describe the other referral.";
  if (!d.referred_date) return "Add the date referred.";
  if (!d.referred_to.trim()) return `Add who they were referred to (${referralLabel(d.type)}).`;
  return null;
}
function outcomeProblem(d: OutcomeDraft): string | null {
  const kind = OUTCOME_TYPES.find((t) => t.id === d.type)?.kind ?? "none";
  const name = outcomeLabel(d.type);
  if (!d.achieved_date) return `Add the date achieved (${name}).`;
  if (kind === "other" && !d.other_label.trim()) return "Describe the other outcome.";
  if (kind === "funding") {
    if (d.amount === "" || Number(d.amount) < 0) return `Add the dollar amount (${name}).`;
    if (!d.funding_source.trim()) return `Add the funding source (${name}).`;
  }
  if (kind === "jobs" && (d.job_count === "" || Number(d.job_count) < 0)) return `Add the number of jobs (${name}).`;
  if (kind === "internships" && (d.internship_count === "" || Number(d.internship_count) < 0))
    return `Add the number of internships (${name}).`;
  if (!d.description.trim()) return `Add a short description (${name}).`;
  if (!d.confirmation.trim()) return `Add how it was confirmed (${name}).`;
  return null;
}

// ---------------------------------------------------------------------
// The section
// ---------------------------------------------------------------------
export function ReferralsOutcomesSection({
  kind,
  entityId,
  entityName,
  canDelete = true,
}: {
  kind: "business" | "member";
  entityId: string;
  entityName: string;
  // Mentors can only delete what they created (enforced by the database too).
  canDelete?: boolean;
}) {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRecord[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<LinkCandidate[]>([]);
  const [alsoLink, setAlsoLink] = useState("");

  const [refTypes, setRefTypes] = useState<string[]>([]);
  const [outTypes, setOutTypes] = useState<string[]>([]);
  const [refDrafts, setRefDrafts] = useState<Record<string, ReferralDraft>>({});
  const [outDrafts, setOutDrafts] = useState<Record<string, OutcomeDraft>>({});

  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [editRefDraft, setEditRefDraft] = useState<ReferralDraft | null>(null);
  const [editingOut, setEditingOut] = useState<string | null>(null);
  const [editOutDraft, setEditOutDraft] = useState<OutcomeDraft | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r, o] = await Promise.all([
        getReferralsFor(kind, entityId),
        getOutcomesFor(kind, entityId),
      ]);
      setReferrals(r);
      setOutcomes(o);
    } catch (err) {
      console.error("Failed to load referrals/outcomes:", err);
    }
  }, [kind, entityId]);

  useEffect(() => {
    load();
    getAllPrograms()
      .then((p) => setPrograms(p.map((x) => x.name).sort()))
      .catch(() => {});
    getLinkCandidates(kind, entityId)
      .then(setCandidates)
      .catch(() => {});
  }, [load, kind, entityId]);

  const toggleRef = (id: string) => {
    setRefTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setRefDrafts((d) => (d[id] ? d : { ...d, [id]: newReferralDraft(id) }));
  };
  const toggleOut = (id: string) => {
    setOutTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setOutDrafts((d) => (d[id] ? d : { ...d, [id]: newOutcomeDraft(id) }));
  };

  const subject = useMemo(() => {
    const picked = candidates.find((c) => `${c.kind}:${c.id}` === alsoLink);
    return {
      business_id: kind === "business" ? entityId : picked?.kind === "business" ? picked.id : null,
      member_id: kind === "member" ? entityId : picked?.kind === "member" ? picked.id : null,
      subject_name: entityName,
    };
  }, [kind, entityId, entityName, candidates, alsoLink]);

  const saveReferrals = async () => {
    setError(null);
    for (const t of refTypes) {
      const p = referralProblem(refDrafts[t]);
      if (p) return setError(p);
    }
    setSaving(true);
    try {
      await addReferrals(
        refTypes.map((t) => {
          const d = refDrafts[t];
          return {
            ...subject,
            referral_type: t,
            other_label: t === "other" ? d.other_label.trim() : null,
            referred_date: d.referred_date,
            referred_to: d.referred_to.trim(),
            status: d.status as ReferralRecord["status"],
            related_program: d.related_program || null,
            notes: d.notes.trim() || null,
          };
        }),
      );
      setRefTypes([]);
      setRefDrafts({});
      await load();
    } catch (err) {
      console.error(err);
      setError("Couldn't save the referrals. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const outcomeRow = (t: string, d: OutcomeDraft) => {
    const k = OUTCOME_TYPES.find((x) => x.id === t)?.kind ?? "none";
    return {
      outcome_type: t,
      other_label: t === "other" ? d.other_label.trim() : null,
      achieved_date: d.achieved_date,
      related_program: d.related_program || null,
      description: d.description.trim(),
      confirmation: d.confirmation.trim(),
      amount: k === "funding" || k === "contract" ? (d.amount === "" ? null : Number(d.amount)) : null,
      funding_source: k === "funding" ? d.funding_source.trim() : null,
      job_count: k === "jobs" ? Number(d.job_count) : null,
      internship_count: k === "internships" ? Number(d.internship_count) : null,
      referral_id: d.referral_id || null,
    };
  };

  const saveOutcomes = async () => {
    setError(null);
    for (const t of outTypes) {
      const p = outcomeProblem(outDrafts[t]);
      if (p) return setError(p);
    }
    setSaving(true);
    try {
      await addOutcomes(outTypes.map((t) => ({ ...subject, ...outcomeRow(t, outDrafts[t]) })));
      setOutTypes([]);
      setOutDrafts({});
      await load();
    } catch (err) {
      console.error(err);
      setError("Couldn't save the outcomes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startEditRef = (r: ReferralRecord) => {
    setEditingRef(r.id);
    setEditRefDraft({
      type: r.referral_type,
      other_label: r.other_label ?? "",
      referred_date: r.referred_date,
      referred_to: r.referred_to ?? "",
      status: r.status,
      related_program: r.related_program ?? "",
      notes: r.notes ?? "",
    });
  };
  const startEditOut = (o: OutcomeRecord) => {
    setEditingOut(o.id);
    setEditOutDraft({
      type: o.outcome_type,
      other_label: o.other_label ?? "",
      achieved_date: o.achieved_date,
      related_program: o.related_program ?? "",
      description: o.description ?? "",
      confirmation: o.confirmation ?? "",
      amount: o.amount != null ? String(o.amount) : "",
      funding_source: o.funding_source ?? "",
      job_count: o.job_count != null ? String(o.job_count) : "",
      internship_count: o.internship_count != null ? String(o.internship_count) : "",
      referral_id: o.referral_id ?? "",
    });
  };

  const saveEditRef = async () => {
    if (!editingRef || !editRefDraft) return;
    const p = referralProblem(editRefDraft);
    if (p) return setError(p);
    try {
      await updateReferral(editingRef, {
        other_label: editRefDraft.type === "other" ? editRefDraft.other_label.trim() : null,
        referred_date: editRefDraft.referred_date,
        referred_to: editRefDraft.referred_to.trim(),
        status: editRefDraft.status as ReferralRecord["status"],
        related_program: editRefDraft.related_program || null,
      });
      setEditingRef(null);
      setError(null);
      await load();
    } catch {
      setError("Couldn't save that change.");
    }
  };
  const saveEditOut = async () => {
    if (!editingOut || !editOutDraft) return;
    const p = outcomeProblem(editOutDraft);
    if (p) return setError(p);
    try {
      const { outcome_type, ...fields } = outcomeRow(editOutDraft.type, editOutDraft);
      void outcome_type;
      await updateOutcome(editingOut, fields);
      setEditingOut(null);
      setError(null);
      await load();
    } catch {
      setError("Couldn't save that change.");
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">Referrals and Outcomes</h3>
        <p className="text-xs text-gray-500">
          For reporting only. Selecting these does not change anyone's access to programs.
        </p>
      </div>

      {candidates.length > 0 && (
        <div className="mb-3 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
          <Link2 className="h-4 w-4 text-gray-400 shrink-0" />
          <label className="text-xs text-gray-600 shrink-0">Also link new entries to:</label>
          <select
            value={alsoLink}
            onChange={(e) => setAlsoLink(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
          >
            <option value="">Just {entityName}</option>
            {candidates.map((c) => (
              <option key={`${c.kind}:${c.id}`} value={`${c.kind}:${c.id}`}>
                {c.kind === "business" ? "Business" : "Member"}: {c.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-gray-400 shrink-0">Counted once in reports</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CheckboxDropdown
          label="Referrals Made"
          color="indigo"
          options={REFERRAL_TYPES.map((t) => ({ id: t.id, label: t.label }))}
          selected={refTypes}
          onToggle={toggleRef}
        />
        <CheckboxDropdown
          label="Outcomes Achieved"
          color="emerald"
          options={OUTCOME_TYPES.map((t) => ({ id: t.id, label: t.label }))}
          selected={outTypes}
          onToggle={toggleOut}
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {refTypes.length > 0 && (
        <div className="mt-3 space-y-3">
          {refTypes.map((t) => (
            <div key={t} className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3">
              <p className="text-sm font-medium text-indigo-900 mb-2">{referralLabel(t)}</p>
              <ReferralFields
                draft={refDrafts[t]}
                onChange={(d) => setRefDrafts((prev) => ({ ...prev, [t]: d }))}
                programs={programs}
              />
            </div>
          ))}
          <button
            onClick={saveReferrals}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${refTypes.length} referral${refTypes.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {outTypes.length > 0 && (
        <div className="mt-3 space-y-3">
          {outTypes.map((t) => (
            <div key={t} className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-3">
              <p className="text-sm font-medium text-emerald-900 mb-2">{outcomeLabel(t)}</p>
              <OutcomeFields
                draft={outDrafts[t]}
                onChange={(d) => setOutDrafts((prev) => ({ ...prev, [t]: d }))}
                programs={programs}
                referrals={referrals}
              />
            </div>
          ))}
          <button
            onClick={saveOutcomes}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : `Save ${outTypes.length} outcome${outTypes.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {/* Saved records */}
      {(referrals.length > 0 || outcomes.length > 0) && (
        <div className="mt-4 space-y-4">
          {referrals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                Referrals made ({referrals.length})
              </p>
              <div className="space-y-1.5">
                {referrals.map((r) => (
                  <div key={r.id} className="bg-white border border-gray-100 rounded-lg p-2.5">
                    {editingRef === r.id && editRefDraft ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800">{referralLabel(r.referral_type)}</p>
                        <ReferralFields draft={editRefDraft} onChange={setEditRefDraft} programs={programs} />
                        <div className="flex gap-2">
                          <button onClick={saveEditRef}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg">Save</button>
                          <button onClick={() => setEditingRef(null)}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {referralLabel(r.referral_type)}
                            {r.referral_type === "other" && r.other_label ? `: ${r.other_label}` : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(r.referred_date + "T00:00:00").toLocaleDateString()}
                            {r.referred_to ? ` · to ${r.referred_to}` : ""}
                            {" · "}
                            {REFERRAL_STATUSES.find((s) => s.id === r.status)?.label}
                            {r.related_program ? ` · ${r.related_program}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditRef(r)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={async () => {
                                if (!window.confirm("Delete this referral? Linked outcomes will stay.")) return;
                                try { await deleteReferral(r.id); await load(); } catch { setError("Couldn't delete that referral."); }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {outcomes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                Outcomes achieved ({outcomes.length})
              </p>
              <div className="space-y-1.5">
                {outcomes.map((o) => (
                  <div key={o.id} className="bg-white border border-gray-100 rounded-lg p-2.5">
                    {editingOut === o.id && editOutDraft ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800">{outcomeLabel(o.outcome_type)}</p>
                        <OutcomeFields draft={editOutDraft} onChange={setEditOutDraft} programs={programs} referrals={referrals} />
                        <div className="flex gap-2">
                          <button onClick={saveEditOut}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg">Save</button>
                          <button onClick={() => setEditingOut(null)}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            {outcomeLabel(o.outcome_type)}
                            {o.outcome_type === "other" && o.other_label ? `: ${o.other_label}` : ""}
                            {o.amount != null ? ` · ${formatMoney(Number(o.amount))}` : ""}
                            {o.job_count != null ? ` · ${o.job_count} job${o.job_count === 1 ? "" : "s"}` : ""}
                            {o.internship_count != null ? ` · ${o.internship_count} internship${o.internship_count === 1 ? "" : "s"}` : ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(o.achieved_date + "T00:00:00").toLocaleDateString()}
                            {o.funding_source ? ` · ${o.funding_source}` : ""}
                            {o.related_program ? ` · ${o.related_program}` : ""}
                            {o.referral_id ? " · linked to a referral" : ""}
                          </p>
                          {o.description && <p className="text-xs text-gray-600 mt-0.5">{o.description}</p>}
                          {o.confirmation && (
                            <p className="text-[11px] text-gray-400 mt-0.5">Confirmed: {o.confirmation}</p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditOut(o)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={async () => {
                                if (!window.confirm("Delete this outcome?")) return;
                                try { await deleteOutcome(o.id); await load(); } catch { setError("Couldn't delete that outcome."); }
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
