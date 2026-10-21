// Referrals and Outcomes - reporting-only records (they never change anyone's
// program access). A record belongs to a business and/or a member; when it
// is linked to both it is still ONE row, so it is only counted once.
import { supabase } from "@/lib/supabase/client";

const db = supabase as any;

// ---------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------
export const REFERRAL_TYPES = [
  { id: "real_estate", label: "Real estate agent or commercial property resource" },
  { id: "financing", label: "Bank, lender, or other financing resource" },
  { id: "grant", label: "Grant opportunity" },
  { id: "advising", label: "Business advising or technical assistance" },
  { id: "mentor", label: "Mentor" },
  { id: "training", label: "Business training or education" },
  { id: "micro_internship", label: "Kansas Micro-Internship Program" },
  { id: "workforce", label: "Workforce or employee recruitment services" },
  { id: "marketing", label: "Marketing or website assistance" },
  { id: "professional_services", label: "Legal, accounting, or insurance services" },
  { id: "community", label: "Community organization or support service" },
  { id: "other", label: "Other referral" },
] as const;

export type OutcomeFieldKind = "funding" | "jobs" | "internships" | "contract" | "other" | "none";

export const OUTCOME_TYPES: { id: string; label: string; kind: OutcomeFieldKind }[] = [
  { id: "business_started", label: "Business started", kind: "none" },
  { id: "business_expanded", label: "Business expanded", kind: "none" },
  { id: "business_purchased", label: "Existing business purchased or ownership transferred", kind: "none" },
  { id: "business_remained_open", label: "Business remained open after receiving assistance", kind: "none" },
  { id: "space_leased", label: "Commercial space leased", kind: "none" },
  { id: "property_purchased", label: "Commercial property purchased", kind: "none" },
  { id: "loan", label: "Loan received", kind: "funding" },
  { id: "grant", label: "Grant received", kind: "funding" },
  { id: "investment", label: "Investment received", kind: "funding" },
  { id: "owner_funds", label: "Owner invested personal funds in the business", kind: "funding" },
  { id: "jobs_created", label: "Jobs created", kind: "jobs" },
  { id: "jobs_retained", label: "Jobs retained", kind: "jobs" },
  { id: "internship_completed", label: "Internship completed", kind: "internships" },
  { id: "training_completed", label: "Training or certification completed", kind: "none" },
  { id: "mentorship_started", label: "Mentorship started", kind: "none" },
  { id: "mentorship_completed", label: "Mentorship completed", kind: "none" },
  { id: "website_launched", label: "Website or online store launched", kind: "none" },
  { id: "contract_secured", label: "New customer contract or sale secured", kind: "contract" },
  { id: "license_obtained", label: "Business license, permit, or registration obtained", kind: "none" },
  { id: "community_service", label: "Community support service received", kind: "none" },
  { id: "other", label: "Other measurable outcome", kind: "other" },
];

// The four outcomes that add up to "capital received".
export const CAPITAL_TYPES = ["loan", "grant", "investment", "owner_funds"] as const;

export const REFERRAL_STATUSES = [
  { id: "pending", label: "Pending" },
  { id: "connected", label: "Connected" },
  { id: "did_not_move_forward", label: "Did Not Move Forward" },
] as const;

export const referralLabel = (id: string) =>
  REFERRAL_TYPES.find((t) => t.id === id)?.label ?? id;
export const outcomeLabel = (id: string) =>
  OUTCOME_TYPES.find((t) => t.id === id)?.label ?? id;

// ---------------------------------------------------------------------
// Row types
// ---------------------------------------------------------------------
export interface ReferralRecord {
  id: string;
  business_id: string | null;
  member_id: string | null;
  subject_name: string | null;
  referral_type: string;
  other_label: string | null;
  referred_date: string;
  referred_to: string | null;
  status: "pending" | "connected" | "did_not_move_forward";
  related_program: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface OutcomeRecord {
  id: string;
  business_id: string | null;
  member_id: string | null;
  subject_name: string | null;
  outcome_type: string;
  other_label: string | null;
  achieved_date: string;
  related_program: string | null;
  description: string | null;
  confirmation: string | null;
  amount: number | null;
  funding_source: string | null;
  job_count: number | null;
  internship_count: number | null;
  referral_id: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export type NewReferral = Omit<ReferralRecord, "id" | "created_at" | "created_by" | "created_by_name">;
export type NewOutcome = Omit<OutcomeRecord, "id" | "created_at" | "created_by" | "created_by_name">;

export interface SubjectRef {
  business_id: string | null;
  member_id: string | null;
  subject_name: string;
}

// ---------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------
async function me(): Promise<{ id: string; name: string }> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const { data: row } = await supabase
    .from("users")
    .select("name")
    .eq("id", data.user.id)
    .maybeSingle();
  return { id: data.user.id, name: row?.name || data.user.email || "" };
}

function subjectFilter(kind: "business" | "member", id: string) {
  return kind === "business" ? { col: "business_id", id } : { col: "member_id", id };
}

export async function getReferralsFor(kind: "business" | "member", id: string): Promise<ReferralRecord[]> {
  const f = subjectFilter(kind, id);
  const { data, error } = await db
    .from("rcp_referrals")
    .select("*")
    .eq(f.col, f.id)
    .order("referred_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReferralRecord[];
}

export async function getOutcomesFor(kind: "business" | "member", id: string): Promise<OutcomeRecord[]> {
  const f = subjectFilter(kind, id);
  const { data, error } = await db
    .from("rcp_outcomes")
    .select("*")
    .eq(f.col, f.id)
    .order("achieved_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as OutcomeRecord[];
}

export async function addReferrals(rows: NewReferral[]): Promise<void> {
  if (rows.length === 0) return;
  const user = await me();
  const { error } = await db.from("rcp_referrals").insert(
    rows.map((r) => ({ ...r, created_by: user.id, created_by_name: user.name })),
  );
  if (error) throw error;
}

export async function addOutcomes(rows: NewOutcome[]): Promise<void> {
  if (rows.length === 0) return;
  const user = await me();
  const { error } = await db.from("rcp_outcomes").insert(
    rows.map((r) => ({ ...r, created_by: user.id, created_by_name: user.name })),
  );
  if (error) throw error;
}

export async function updateReferral(id: string, fields: Partial<NewReferral>): Promise<void> {
  const { error } = await db
    .from("rcp_referrals")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateOutcome(id: string, fields: Partial<NewOutcome>): Promise<void> {
  const { error } = await db
    .from("rcp_outcomes")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReferral(id: string): Promise<void> {
  const { error } = await db.from("rcp_referrals").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteOutcome(id: string): Promise<void> {
  const { error } = await db.from("rcp_outcomes").delete().eq("id", id);
  if (error) throw error;
}

// "Also link to" candidates: for a business, its contacts who have an
// account (members); for a member, the businesses they're a contact of.
export interface LinkCandidate {
  kind: "business" | "member";
  id: string;
  name: string;
}

export async function getLinkCandidates(
  kind: "business" | "member",
  id: string,
): Promise<LinkCandidate[]> {
  if (kind === "business") {
    const { data: contacts } = await supabase
      .from("business_contacts")
      .select("user_id")
      .eq("business_id", id)
      .not("user_id", "is", null);
    const userIds = (contacts ?? []).map((c) => c.user_id as string);
    if (userIds.length === 0) return [];
    const { data: parts } = await supabase
      .from("participants")
      .select("id, name")
      .in("user_id", userIds);
    return (parts ?? []).map((p) => ({ kind: "member" as const, id: p.id, name: p.name || "Member" }));
  }
  const { data: part } = await supabase
    .from("participants")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!part?.user_id) return [];
  const { data: contacts } = await supabase
    .from("business_contacts")
    .select("business_id")
    .eq("user_id", part.user_id);
  const ids = (contacts ?? []).map((c) => c.business_id);
  if (ids.length === 0) return [];
  const { data: businesses } = await supabase.from("businesses").select("id, name").in("id", ids);
  return (businesses ?? []).map((b) => ({ kind: "business" as const, id: b.id, name: b.name }));
}

// Everything the admin report needs in one go.
export interface ReportSource {
  referrals: ReferralRecord[];
  outcomes: OutcomeRecord[];
  businessCounty: Record<string, string | null>;
  memberCounty: Record<string, string | null>;
}

export async function getReportSource(): Promise<ReportSource> {
  const [refRes, outRes, bizRes, partRes] = await Promise.all([
    db.from("rcp_referrals").select("*"),
    db.from("rcp_outcomes").select("*"),
    supabase.from("businesses").select("id, county"),
    supabase.from("participants").select("id, county"),
  ]);
  if (refRes.error) throw refRes.error;
  if (outRes.error) throw outRes.error;
  const businessCounty: Record<string, string | null> = {};
  for (const b of (bizRes.data ?? []) as any[]) businessCounty[b.id] = b.county ?? null;
  const memberCounty: Record<string, string | null> = {};
  for (const p of (partRes.data ?? []) as any[]) memberCounty[p.id] = p.county ?? null;
  return {
    referrals: (refRes.data ?? []) as ReferralRecord[],
    outcomes: (outRes.data ?? []) as OutcomeRecord[],
    businessCounty,
    memberCounty,
  };
}

// ---------------------------------------------------------------------
// Report math (pure - easy to test)
// ---------------------------------------------------------------------
export interface ReportFilters {
  from: string; // yyyy-mm-dd or ""
  to: string; // yyyy-mm-dd or ""
  county: string; // "" = all
  program: string; // "" = all
}

export interface ReportResult {
  referralsTotal: number;
  outcomesTotal: number;
  referralsByType: Record<string, number>;
  referralsByStatus: Record<string, number>;
  outcomesByType: Record<string, number>;
  uniqueHelped: number;
  capitalTotal: number;
  capitalByType: Record<string, number>;
  jobsCreated: number;
  jobsRetained: number;
  internshipsCompleted: number;
  outcomesLinkedToReferrals: number;
}

type Subject = { business_id: string | null; member_id: string | null };

// One key per business/member so a record linked to both counts once.
// A record with a business is keyed by the business.
export function subjectKey(r: Subject): string {
  return r.business_id ? `b:${r.business_id}` : `m:${r.member_id}`;
}

export function buildReport(src: ReportSource, f: ReportFilters): ReportResult {
  const countyOf = (r: Subject): string | null => {
    const biz = r.business_id ? src.businessCounty[r.business_id] : null;
    if (biz) return biz;
    return r.member_id ? src.memberCounty[r.member_id] ?? null : null;
  };
  const inRange = (d: string) => (!f.from || d >= f.from) && (!f.to || d <= f.to);
  const keep = (r: Subject, date: string, program: string | null) =>
    inRange(date) &&
    (!f.county || countyOf(r) === f.county) &&
    (!f.program || program === f.program);

  const referrals = src.referrals.filter((r) => keep(r, r.referred_date, r.related_program));
  const outcomes = src.outcomes.filter((o) => keep(o, o.achieved_date, o.related_program));

  const referralsByType: Record<string, number> = {};
  const referralsByStatus: Record<string, number> = {};
  for (const r of referrals) {
    referralsByType[r.referral_type] = (referralsByType[r.referral_type] ?? 0) + 1;
    referralsByStatus[r.status] = (referralsByStatus[r.status] ?? 0) + 1;
  }

  const outcomesByType: Record<string, number> = {};
  const capitalByType: Record<string, number> = {};
  let capitalTotal = 0;
  let jobsCreated = 0;
  let jobsRetained = 0;
  let internshipsCompleted = 0;
  let linked = 0;
  for (const o of outcomes) {
    outcomesByType[o.outcome_type] = (outcomesByType[o.outcome_type] ?? 0) + 1;
    if ((CAPITAL_TYPES as readonly string[]).includes(o.outcome_type)) {
      const amt = Number(o.amount) || 0;
      capitalByType[o.outcome_type] = (capitalByType[o.outcome_type] ?? 0) + amt;
      capitalTotal += amt; // total is computed here, never typed in
    }
    if (o.outcome_type === "jobs_created") jobsCreated += o.job_count ?? 0;
    if (o.outcome_type === "jobs_retained") jobsRetained += o.job_count ?? 0;
    if (o.outcome_type === "internship_completed") internshipsCompleted += o.internship_count ?? 0;
    if (o.referral_id) linked += 1;
  }

  const helped = new Set<string>();
  for (const r of referrals) helped.add(subjectKey(r));
  for (const o of outcomes) helped.add(subjectKey(o));

  return {
    referralsTotal: referrals.length,
    outcomesTotal: outcomes.length,
    referralsByType,
    referralsByStatus,
    outcomesByType,
    uniqueHelped: helped.size,
    capitalTotal,
    capitalByType,
    jobsCreated,
    jobsRetained,
    internshipsCompleted,
    outcomesLinkedToReferrals: linked,
  };
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
