// lib/supabase/dashboard-data.ts
import { supabase } from "./client";

export interface OverviewStats {
  total_participants: number;
  total_participants_change: number;
  active_mentors: number;
  active_mentors_change: number;
  sessions_this_month: number;
  sessions_this_month_change: number;
  avg_satisfaction: number;
  avg_satisfaction_change: number;
}

export interface DashboardParticipant {
  id: string;
  name: string | null;
  email: string | null;
  program_name: string | null;
  mentor: string | null;
  status: string;
  joined_at: string;
}

export interface OutcomeKPI {
  key: string;
  value: number;
  change: number;
  label: string | null;
  icon: string | null;
}

export interface ChartRow {
  label: string;
  value: number;
}

export interface SessionMonthRow {
  month: string;
  sessions: number;
}

// ---------- Overview tab ----------
export async function getOverviewStats(): Promise<OverviewStats | null> {
  const { data, error } = await supabase
    .from("overview_stats")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- Analytics tab ----------
export async function getOutcomeKPIs(): Promise<OutcomeKPI[]> {
  const { data, error } = await supabase.from("outcome_kpis").select("*");
  if (error) throw error;
  return data;
}

// ---------- Participants tab ----------
// NOTE: the real `participants` table is a junction table
// (id, program_id, user_id, mentor, status, progress, joined_at) —
// name/email live on `users`, program name lives on `programs`.
// We join both in one query using Supabase's FK embedding.
export async function getParticipants(): Promise<DashboardParticipant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select(
      `
      id,
      mentor,
      status,
      joined_at,
      program_name,
      users:user_id ( name, email ),
      programs:program_id ( name )
    `,
    )
    .order("joined_at", { ascending: false });

  if (error) throw error;

  // Prefer the joined catalog program name (real programs table), but
  // fall back to the participants row's own program_name text column -
  // partner/coalition accounts intentionally have no program_id (they're
  // not enrolled in a catalog program), so they're only ever labeled via
  // that text column ("Partner Organization" / "Coalition Organization").
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.users?.name ?? null,
    email: row.users?.email ?? null,
    program_name: row.programs?.name ?? row.program_name ?? null,
    mentor: row.mentor,
    status: row.status,
    joined_at: row.joined_at,
  }));
}

// ---------- Charts ----------
export async function getClientsByProgramChart(): Promise<ChartRow[]> {
  const { data, error } = await supabase
    .from("clients_by_program")
    .select("program_name, count");
  if (error) throw error;
  return data.map((r) => ({ label: r.program_name, value: r.count }));
}

export async function getClientsByCountyChart(): Promise<ChartRow[]> {
  const { data, error } = await supabase
    .from("clients_by_county")
    .select("county, count");
  if (error) throw error;
  return data.map((r) => ({ label: r.county, value: r.count }));
}

export async function getSessionsPerMonth(): Promise<SessionMonthRow[]> {
  const { data, error } = await supabase
    .from("sessions_per_month")
    .select("month, sessions");
  if (error) throw error;
  return data;
}

// ---------- Realtime ----------
// Call from a component's useEffect. Fires onChange whenever any admin
// edits dashboard data — from any device.
export function subscribeToDashboardChanges(onChange: () => void) {
  const channelName = `dashboard-changes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "overview_stats" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "outcome_kpis" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "clients_by_program" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "clients_by_county" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sessions_per_month" }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------
// LIVE computed replacements for the snapshot tables above.
// overview_stats / outcome_kpis / analytics_data / clients_by_program /
// clients_by_county / sessions_per_month / resource_stats /
// resources_by_program are all static numbers someone enters by hand in
// the CMS editor (app/admin/cms-editor) - they don't reflect what's
// actually in participants/mentors/mentee_sessions/program_tracking, which
// is why Overview could say "124 participants" while the real Participants
// tab said "1". Everything below counts the real rows directly instead, so
// Overview/Analytics/Resources always match what Participants/Mentors show.
// The CMS editor page still exists but no longer affects these tabs.
// ---------------------------------------------------------------------

export async function getAllMenteeSessions(): Promise<MenteeSessionRow[]> {
  const { data, error } = await supabase
    .from("mentee_sessions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllProgramTracking(): Promise<ProgramTrackingRow[]> {
  const { data, error } = await supabase.from("program_tracking").select("*");
  if (error) throw error;
  return data;
}

export interface LiveOverviewStats {
  total_participants: number;
  total_participants_growth_pct: number | null;
  active_mentors: number;
  sessions_this_month: number;
  avg_satisfaction_pct: number | null;
}

export async function getLiveOverviewStats(): Promise<LiveOverviewStats> {
  const [participants, mentors, sessions, ratingsRes] = await Promise.all([
    getParticipants(),
    getMentors(),
    getAllMenteeSessions(),
    supabase.from("mentor_ratings").select("rating"),
  ]);
  if (ratingsRes.error) throw ratingsRes.error;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const sessionsThisMonth = sessions.filter((s) => new Date(s.date) >= monthStart).length;

  const newThisQuarter = participants.filter(
    (p) => p.joined_at && new Date(p.joined_at) >= quarterStart,
  ).length;
  const beforeThisQuarter = participants.length - newThisQuarter;
  const growthPct =
    beforeThisQuarter > 0 ? Math.round((newThisQuarter / beforeThisQuarter) * 100) : null;

  const ratingRows = ratingsRes.data || [];
  const avgSatisfaction =
    ratingRows.length > 0
      ? Math.round(
          (ratingRows.reduce((sum, r) => sum + r.rating, 0) / ratingRows.length / 5) * 100,
        )
      : null;

  return {
    total_participants: participants.length,
    total_participants_growth_pct: growthPct,
    active_mentors: mentors.filter((m) => m.status === "active").length,
    sessions_this_month: sessionsThisMonth,
    avg_satisfaction_pct: avgSatisfaction,
  };
}

export async function getLiveClientsByProgram(
  participants?: DashboardParticipant[],
): Promise<ChartRow[]> {
  const rows = participants || (await getParticipants());
  const counts: Record<string, number> = {};
  for (const p of rows) {
    const label = p.program_name || "Unassigned";
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getLiveSessionsPerMonth(
  sessions?: MenteeSessionRow[],
): Promise<SessionMonthRow[]> {
  const rows = sessions || (await getAllMenteeSessions());
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  const counts: Record<string, number> = {};
  for (const s of rows) {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return months.map((m) => ({ month: m.label, sessions: counts[m.key] || 0 }));
}

function dateRangeStart(label: string): Date | null {
  const now = new Date();
  switch (label) {
    case "Last 30 days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "Last 3 months":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "Last 6 months":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "Last 12 months":
      return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    default:
      return null; // "All time"
  }
}

export interface LiveOperationalMetrics {
  active_clients: number;
  active_mentor_matches: number;
  sessions_this_month: number;
  hours_delivered: number;
}

export async function getLiveOperationalMetrics(
  programName: string,
  dateRangeLabel: string,
): Promise<LiveOperationalMetrics> {
  const [participants, sessions] = await Promise.all([
    getParticipants(),
    getAllMenteeSessions(),
  ]);
  const filteredParticipants = participants.filter(
    (p) => programName === "All Programs" || p.program_name === programName,
  );
  const participantIds = new Set(filteredParticipants.map((p) => p.id));
  const rangeStart = dateRangeStart(dateRangeLabel);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRangeSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    if (rangeStart && d < rangeStart) return false;
    if (programName !== "All Programs" && s.participant_id && !participantIds.has(s.participant_id)) {
      return false;
    }
    return true;
  });

  const sessionsThisMonth = inRangeSessions.filter((s) => new Date(s.date) >= monthStart).length;
  const hoursDelivered = Math.round(
    inRangeSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
  );

  return {
    active_clients: filteredParticipants.length,
    active_mentor_matches: filteredParticipants.filter((p) => !!p.mentor).length,
    sessions_this_month: sessionsThisMonth,
    hours_delivered: hoursDelivered,
  };
}

export interface LiveOutcomeMetrics {
  businesses_served: number;
  capital_accessed: number;
  businesses_launched: number;
  participant_satisfaction_pct: number | null;
  alumni_conversion_pct: number | null;
}

export async function getLiveOutcomeMetrics(programName: string): Promise<LiveOutcomeMetrics> {
  const [programs, tracking, participants, ratingsRes] = await Promise.all([
    getAllPrograms(),
    getAllProgramTracking(),
    getParticipants(),
    supabase.from("mentor_ratings").select("rating"),
  ]);
  if (ratingsRes.error) throw ratingsRes.error;

  const programId =
    programName === "All Programs" ? null : programs.find((p) => p.name === programName)?.id;
  const filteredTracking =
    programName === "All Programs" ? tracking : tracking.filter((t) => t.program_id === programId);
  const filteredParticipants = participants.filter(
    (p) => programName === "All Programs" || p.program_name === programName,
  );

  const ratingRows = ratingsRes.data || [];
  const satisfactionPct =
    ratingRows.length > 0
      ? Math.round(
          (ratingRows.reduce((sum, r) => sum + r.rating, 0) / ratingRows.length / 5) * 100,
        )
      : null;

  const alumni = filteredParticipants.filter((p) => p.status === "alumni").length;
  const alumniPct =
    filteredParticipants.length > 0
      ? Math.round((alumni / filteredParticipants.length) * 100)
      : null;

  return {
    businesses_served: new Set(filteredTracking.map((t) => t.participant_id)).size,
    capital_accessed: filteredTracking.reduce((sum, t) => sum + (t.capital_accessed || 0), 0),
    businesses_launched: filteredTracking.reduce((sum, t) => sum + (t.businesses_launched || 0), 0),
    participant_satisfaction_pct: satisfactionPct,
    alumni_conversion_pct: alumniPct,
  };
}

export interface LiveResourceByProgramRow {
  id: string;
  name: string;
  budget: number;
  hours: number;
  participants: number;
  status: string;
}

export async function getLiveResourcesByProgram(): Promise<LiveResourceByProgramRow[]> {
  const [programs, tracking, participants] = await Promise.all([
    getAllPrograms(),
    getAllProgramTracking(),
    getParticipants(),
  ]);
  return programs.map((program) => {
    const rows = tracking.filter((t) => t.program_id === program.id);
    const participantCount = participants.filter((p) => p.program_name === program.name).length;
    return {
      id: program.id,
      name: program.name,
      budget: rows.reduce((sum, r) => sum + (r.budget || 0), 0),
      hours: rows.reduce((sum, r) => sum + (r.staff_hours || 0), 0),
      participants: participantCount,
      status: program.status,
    };
  });
}

export interface LiveResourceTotals {
  total_budget: number;
  grants_received: number;
  total_hours: number;
}

export async function getLiveResourceTotals(): Promise<LiveResourceTotals> {
  const tracking = await getAllProgramTracking();
  return {
    total_budget: tracking.reduce((sum, t) => sum + (t.budget || 0), 0),
    grants_received: tracking.reduce((sum, t) => sum + (t.grants_received || 0), 0),
    total_hours: tracking.reduce((sum, t) => sum + (t.staff_hours || 0), 0),
  };
}

export function subscribeToLiveDashboardData(onChange: () => void) {
  const channelName = `live-dashboard-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentors" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentee_sessions" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentor_ratings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "program_tracking" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "programs" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface EmailLogRow {
  id: string;
  to_email: string;
  subject: string | null;
  body: string | null;
  type: string | null;
  status: string;
  token: string | null;
  sent_at: string;
  opened_at: string | null;
}

export async function getEmailLogs(): Promise<EmailLogRow[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteEmailLog(id: string): Promise<void> {
  const { error } = await supabase.from("email_logs").delete().eq("id", id);
  if (error) throw error;
}

export async function resendEmailLog(id: string): Promise<void> {
  const { error } = await supabase
    .from("email_logs")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function insertTestEmailLog(toEmail: string): Promise<void> {
  const { error } = await supabase.from("email_logs").insert({
    to_email: toEmail,
    subject: "Password Setup for Rural Community Partners",
    body: "Click the link below to set up your password.",
    type: "password_setup",
    status: "sent",
    token: `demo_token_${Math.random().toString(36).slice(2, 15)}`,
  });
  if (error) throw error;
}

export function subscribeToEmailLogs(onChange: () => void) {
  const channelName = `email-logs-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "email_logs" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface MentorRow {
  id: string;
  name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  active_clients: number;
  rating: number;
  status: string;
}

export interface MentorsStats {
  total: number;
  active: number;
  active_matches: number;
  avg_rating: number | null;
}

export interface MenteeRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  program_name: string | null;
  status: string;
  sessions_completed: number;
}

export async function getMentors(): Promise<MentorRow[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

// LIVE - computed from the real mentors + participants tables instead
// of the old static mentors_stats snapshot row (which held made-up
// numbers like "89 active matches" that had no connection to anything
// real). active_matches counts participants with a mentor assigned;
// avg_rating only averages mentors who have actually been rated (a
// freshly self-registered mentor starts at rating 0, which would drag
// a naive average down for no real reason).
export async function getMentorsStats(): Promise<MentorsStats> {
  const [mentorsRes, participantsRes] = await Promise.all([
    supabase.from("mentors").select("status, rating"),
    supabase.from("participants").select("mentor"),
  ]);
  if (mentorsRes.error) throw mentorsRes.error;
  if (participantsRes.error) throw participantsRes.error;

  const mentors = mentorsRes.data ?? [];
  const participants = participantsRes.data ?? [];

  const total = mentors.length;
  const active = mentors.filter(
    (m) => (m.status ?? "").toLowerCase() === "active",
  ).length;
  const active_matches = participants.filter(
    (p) => p.mentor && p.mentor.trim() !== "",
  ).length;

  const rated = mentors.filter((m) => (m.rating ?? 0) > 0);
  const avg_rating =
    rated.length > 0
      ? Math.round(
          (rated.reduce((sum, m) => sum + (m.rating ?? 0), 0) / rated.length) * 10,
        ) / 10
      : null;

  return { total, active, active_matches, avg_rating };
}

// "My Mentees" = participants assigned to this mentor by name
export async function getMenteesForMentor(mentorName: string): Promise<MenteeRow[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("id, name, email, phone, program_name, status, sessions_completed")
    .eq("mentor", mentorName)
    .order("name");
  if (error) throw error;
  return data;
}

export interface MyParticipantRow {
  id: string;
  mentor: string | null;
  program_name: string | null;
  status: string;
}

// Find this logged-in entrepreneur/mentee's own participant record(s), so
// we know their real participant_id (used for mentee_notes/mentee_goals/
// mentee_sessions) and which mentor (if any) they're assigned to. Matches
// by user_id first, falling back to email for older rows that predate the
// user_id link.
export async function getParticipantRecordsForUser(
  userId: string,
  email: string,
): Promise<MyParticipantRow[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("id, mentor, program_name, status")
    .or(`user_id.eq.${userId},email.eq.${email}`)
    .order("joined_at", { ascending: false });
  if (error) throw error;
  return data;
}

export function subscribeToMentorsChanges(onChange: () => void) {
  const channelName = `mentors-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentors" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentors_stats" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Everything this table used to hold (Total Members, Avg Attendance,
// Member Satisfaction, Resources Invested/budget breakdown, etc.) was a
// static, hand-entered snapshot with no real data source behind it - no
// roundtable-membership or attendance table exists anywhere in the
// schema to compute those from. Only next_meeting is kept: a single,
// admin-editable "what's the next meeting" announcement, which is
// legitimate manually-set content rather than a fabricated metric.
// Update it directly in Supabase (leadership_stats, id = 1) until an
// in-app editor exists for it.
export interface NextMeetingInfo {
  date?: string;
  day?: number;
  month?: string;
  time?: string;
  title?: string;
  description?: string;
  zoomPlaceholder?: string;
}

export interface ActionItemRow {
  id: string;
  task: string;
  assignee: string | null;
  due_date: string | null;
  status: string;
}

export async function getNextMeeting(): Promise<NextMeetingInfo | null> {
  const { data, error } = await supabase
    .from("leadership_stats")
    .select("next_meeting")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.next_meeting as NextMeetingInfo | undefined) ?? null;
}

// Real in-app editor for the Next Meeting announcement - previously the
// only way to change this was running SQL directly against Supabase.
export async function updateNextMeeting(meeting: NextMeetingInfo): Promise<void> {
  const { error } = await supabase
    .from("leadership_stats")
    .upsert({ id: 1, next_meeting: meeting as unknown as Record<string, unknown> }, { onConflict: "id" });
  if (error) throw error;
}

export async function getActionItems(): Promise<ActionItemRow[]> {
  const { data, error } = await supabase
    .from("leadership_action_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addActionItemRow(
  task: string,
  assignee: string,
  dueDate: string,
): Promise<void> {
  const { error } = await supabase.from("leadership_action_items").insert({
    task,
    assignee,
    due_date: dueDate,
    status: "pending",
  });
  if (error) throw error;
}

export async function updateActionItemStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("leadership_action_items")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteActionItemRow(id: string): Promise<void> {
  const { error } = await supabase.from("leadership_action_items").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToLeadershipChanges(onChange: () => void) {
  const channelName = `leadership-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "leadership_stats" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "leadership_action_items" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "leadership_roundtable_applications" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Real backing for the "Apply to Join" form on the Leadership Roundtable
// tab. Previously that form only set local React state to true on submit
// and never saved anything anywhere - this is the actual persistence
// layer for it. Total Members / Pending Applications on the Leadership
// tab are now derived from this table (status = 'approved' / 'pending')
// instead of a disconnected static snapshot.
export interface RoundtableApplicationRow {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  county: string | null;
  role: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function submitRoundtableApplication(input: {
  name: string;
  email: string;
  organization: string;
  county: string;
  role: string;
  reason: string;
}): Promise<void> {
  const { error } = await supabase.from("leadership_roundtable_applications").insert({
    name: input.name,
    email: input.email,
    organization: input.organization || null,
    county: input.county || null,
    role: input.role || null,
    reason: input.reason || null,
    status: "pending",
  });
  if (error) throw error;
}

export async function getRoundtableApplications(): Promise<RoundtableApplicationRow[]> {
  const { data, error } = await supabase
    .from("leadership_roundtable_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as RoundtableApplicationRow[];
}

export async function updateRoundtableApplicationStatus(
  id: string,
  status: "approved" | "rejected" | "pending",
): Promise<void> {
  const { error } = await supabase
    .from("leadership_roundtable_applications")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export interface ResourceStats {
  total_budget: number;
  grants_received: number;
  donations: number;
  sponsorships: number;
  total_hours: number;
  facilitation_hours: number;
  coordination_hours: number;
  admin_hours: number;
  updated_at: string;
}

export interface ResourceByProgramRow {
  id: string;
  name: string;
  budget: number;
  hours: number;
  participants: number;
  status: string;
  type: string;
}

export async function getResourceStats(): Promise<ResourceStats | null> {
  const { data, error } = await supabase
    .from("resource_stats")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getResourcesByProgram(): Promise<ResourceByProgramRow[]> {
  const { data, error } = await supabase
    .from("resources_by_program")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export function subscribeToResourcesChanges(onChange: () => void) {
  const channelName = `resources-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "resource_stats" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "resources_by_program" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface ReportData {
  monthlyReport: {
    totalParticipants: number;
    sessions: number;
    satisfaction: number;
    highlights: string[];
  };
  participantReport: {
    participants: Array<{ name: string; program: string; stage: string; progress: number }>;
  };
  mentorReport: {
    mentors: Array<{ name: string; sessions: number; hours: number; rating: number; mentees: number }>;
  };
  outcomeReport: {
    businessLaunches: number;
    satisfaction: number;
    mentorMatches: number;
    referrals: number;
    successStory: string;
  };
  financialReport: {
    grants: number;
    donations: number;
    personnel: number;
    programming: number;
    operations: number;
    netSurplus: number;
    pendingInvoices: number;
    pendingAmount: number;
  };
  countyReport: {
    counties: Array<{ name: string; count: number; percentage: number }>;
  };
}

export async function getReportData(): Promise<ReportData | null> {
  const { data, error } = await supabase
    .from("report_data")
    .select("data")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as unknown as ReportData) ?? null;
}

export function subscribeToReportData(onChange: () => void) {
  const channelName = `report-data-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "report_data" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface AdminNoteRow {
  id: string;
  subject: string | null;
  message: string;
  recipient_type: string;
  sent_by: string | null;
  created_at: string;
}

export async function getAdminNotes(): Promise<AdminNoteRow[]> {
  const { data, error } = await supabase
    .from("admin_notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function sendAdminNoteRow(
  subject: string,
  message: string,
  recipientType: string,
  sentBy: string,
): Promise<void> {
  const { error } = await supabase.from("admin_notes").insert({
    subject,
    message,
    recipient_type: recipientType,
    sent_by: sentBy,
  });
  if (error) throw error;
}

export function subscribeToAdminNotes(onChange: () => void) {
  const channelName = `admin-notes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "admin_notes" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// PARTNER DASHBOARD - real Supabase-backed replacement for what used to be
// entirely localStorage("partner_dashboard_data"). Each partner user gets
// one profile-data row (hero/metrics) plus their own collaborations and
// shared-resources lists.
// ============================================

export interface PartnerProfileData {
  user_id: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  stat_active_partners: number;
  stat_shared_resources: number;
  stat_active_referrals: number;
  metric_active_collaborations: number;
  metric_internships_posted: number;
  metric_student_placements: number;
  updated_at: string;
}

export async function getPartnerProfileData(
  userId: string,
): Promise<PartnerProfileData | null> {
  const { data, error } = await supabase
    .from("partner_profile_data")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function savePartnerProfileData(
  userId: string,
  fields: Partial<Omit<PartnerProfileData, "user_id" | "updated_at">>,
): Promise<void> {
  const { error } = await supabase.from("partner_profile_data").upsert(
    { user_id: userId, ...fields, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export interface PartnerCollaborationRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  referrals: number | null;
  internships: number | null;
  link: string | null;
  // Matches the "Business Engagement" fields Jody tracks for the Parker
  // Dewey Micro-Internship program: project_type is the kind of work
  // (Marketing/Video/Research/Admin/Other), org_type is what kind of
  // partner this is (Business/Nonprofit/Coalition), hours_worked is the
  // student's total logged hours on this engagement.
  project_type: string | null;
  org_type: string | null;
  hours_worked: number | null;
  // Ties this collaboration to a real row in the programs catalog (the
  // same programs a partner picked "Program Interests" for at signup, via
  // user_programs). Nullable so older free-text entries keep working.
  program_id: string | null;
  created_at: string;
}

export const PARTNER_PROJECT_TYPES = [
  "Marketing",
  "Video",
  "Research",
  "Admin",
  "Other",
] as const;

export const PARTNER_ORG_TYPES = ["Business", "Nonprofit", "Coalition"] as const;

export async function getPartnerCollaborations(
  userId: string,
): Promise<PartnerCollaborationRow[]> {
  const { data, error } = await supabase
    .from("partner_collaborations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addPartnerCollaboration(
  userId: string,
  fields: {
    title: string;
    description?: string;
    link?: string;
    project_type?: string;
    org_type?: string;
    hours_worked?: number;
    program_id?: string;
  },
): Promise<void> {
  const { error } = await supabase.from("partner_collaborations").insert({
    user_id: userId,
    title: fields.title,
    description: fields.description || null,
    link: fields.link || null,
    project_type: fields.project_type || null,
    org_type: fields.org_type || null,
    hours_worked: fields.hours_worked ?? null,
    program_id: fields.program_id || null,
    status: "Active",
    referrals: 0,
  });
  if (error) throw error;
}

export async function updatePartnerCollaboration(
  id: string,
  fields: Partial<
    Pick<
      PartnerCollaborationRow,
      | "title"
      | "description"
      | "status"
      | "referrals"
      | "internships"
      | "link"
      | "project_type"
      | "org_type"
      | "hours_worked"
      | "program_id"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("partner_collaborations")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePartnerCollaboration(id: string): Promise<void> {
  const { error } = await supabase
    .from("partner_collaborations")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export interface PartnerResourceRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  link: string | null;
  created_at: string;
}

export async function getPartnerResources(
  userId: string,
): Promise<PartnerResourceRow[]> {
  const { data, error } = await supabase
    .from("partner_resources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addPartnerResource(
  userId: string,
  fields: { title: string; description?: string; type?: string; link?: string },
): Promise<void> {
  const { error } = await supabase.from("partner_resources").insert({
    user_id: userId,
    title: fields.title,
    description: fields.description || null,
    type: fields.type || "Available",
    link: fields.link || null,
  });
  if (error) throw error;
}

export async function updatePartnerResource(
  id: string,
  fields: Partial<Pick<PartnerResourceRow, "title" | "description" | "type" | "link">>,
): Promise<void> {
  const { error } = await supabase
    .from("partner_resources")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePartnerResource(id: string): Promise<void> {
  const { error } = await supabase.from("partner_resources").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToPartnerData(onChange: () => void) {
  const channelName = `partner-data-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "partner_profile_data" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "partner_collaborations" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "partner_resources" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------
// Admin "Partners" view - lets Jody/staff see every partner org's
// self-reported numbers in one place instead of logging in as each one.
// Relies on the "staff read/write all partner_* rows" RLS policies (see
// partner_dashboard_schema.sql) - admin/staff/program_manager only.
// ---------------------------------------------------------------------
export interface PartnerOverviewRow {
  userId: string;
  name: string;
  email: string;
  organization: string | null;
  profile: PartnerProfileData | null;
  collaborations: PartnerCollaborationRow[];
  resources: PartnerResourceRow[];
  programs: UserProgramRow[];
}

export async function getAllPartnersOverview(): Promise<PartnerOverviewRow[]> {
  const { data: partnerUsers, error: usersError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("primary_role", "partner");
  if (usersError) throw usersError;
  if (!partnerUsers || partnerUsers.length === 0) return [];

  const userIds = partnerUsers.map((u) => u.id);
  // "organization" lives on the profiles table, not users.
  const [
    { data: orgProfiles, error: orgError },
    { data: profiles, error: profilesError },
    { data: collabs, error: collabsError },
    { data: resources, error: resourcesError },
    { data: enrollments, error: enrollError },
    { data: allPrograms, error: programsError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, organization").in("id", userIds),
    supabase.from("partner_profile_data").select("*").in("user_id", userIds),
    supabase
      .from("partner_collaborations")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("partner_resources")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase.from("user_programs").select("*").in("user_id", userIds),
    supabase.from("programs").select("*"),
  ]);
  if (orgError) throw orgError;
  if (profilesError) throw profilesError;
  if (collabsError) throw collabsError;
  if (resourcesError) throw resourcesError;
  if (enrollError) throw enrollError;
  if (programsError) throw programsError;

  const programById = Object.fromEntries((allPrograms || []).map((p) => [p.id, p]));
  const programsByUser = (enrollments || []).reduce<Record<string, UserProgramRow[]>>(
    (acc, e) => {
      const program = programById[e.program_id];
      if (!program) return acc;
      const row: UserProgramRow = {
        user_program_id: e.id,
        program_id: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
        start_date: program.start_date,
        end_date: program.end_date,
        icon: program.icon,
        color: program.color,
        contact_email: program.contact_email,
        contact_phone: program.contact_phone,
        progress: e.progress,
        approved: e.approved,
      };
      (acc[e.user_id] ||= []).push(row);
      return acc;
    },
    {},
  );

  return partnerUsers.map((u) => ({
    userId: u.id,
    name: u.name || u.email,
    email: u.email,
    organization:
      (orgProfiles || []).find((p) => p.id === u.id)?.organization || null,
    profile: (profiles || []).find((p) => p.user_id === u.id) || null,
    collaborations: (collabs || []).filter((c) => c.user_id === u.id),
    resources: (resources || []).filter((r) => r.user_id === u.id),
    programs: programsByUser[u.id] || [],
  }));
}

export function subscribeToAllPartnersData(onChange: () => void) {
  const channelName = `admin-partners-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "partner_profile_data" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "partner_collaborations" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "partner_resources" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------
// Coalition dashboard - real Supabase backing, mirrors the partner
// section above exactly. Previously the entire Coalition Leader
// dashboard ran on localStorage("coalition_dashboard_data") - hero
// numbers, meetings, initiatives, and resources were all fake and never
// touched the database.
// ---------------------------------------------------------------------
export interface CoalitionProfileData {
  user_id: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  stat_active_coalitions: number;
  stat_counties_served: number;
  stat_active_projects: number;
  metric_coalition_members: number;
  metric_meetings_held: number;
  metric_projects_initiated: number;
  metric_residents_impacted: number;
  updated_at: string;
}

export async function getCoalitionProfileData(
  userId: string,
): Promise<CoalitionProfileData | null> {
  const { data, error } = await supabase
    .from("coalition_profile_data")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveCoalitionProfileData(
  userId: string,
  fields: Partial<Omit<CoalitionProfileData, "user_id" | "updated_at">>,
): Promise<void> {
  const { error } = await supabase.from("coalition_profile_data").upsert(
    { user_id: userId, ...fields, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export interface CoalitionMeetingRow {
  id: string;
  user_id: string;
  title: string;
  date: string | null;
  time: string | null;
  type: string;
  link: string | null;
  meeting_id: string | null;
  passcode: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
}

export async function getCoalitionMeetings(
  userId: string,
): Promise<CoalitionMeetingRow[]> {
  const { data, error } = await supabase
    .from("coalition_meetings")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function addCoalitionMeeting(
  userId: string,
  fields: {
    title: string;
    date?: string;
    time?: string;
    type?: string;
    link?: string;
    meeting_id?: string;
    passcode?: string;
    location?: string;
    description?: string;
  },
): Promise<void> {
  const { error } = await supabase.from("coalition_meetings").insert({
    user_id: userId,
    title: fields.title,
    date: fields.date || null,
    time: fields.time || null,
    type: fields.type || "virtual",
    link: fields.link || null,
    meeting_id: fields.meeting_id || null,
    passcode: fields.passcode || null,
    location: fields.location || null,
    description: fields.description || null,
  });
  if (error) throw error;
}

export async function updateCoalitionMeeting(
  id: string,
  fields: Partial<
    Pick<
      CoalitionMeetingRow,
      | "title"
      | "date"
      | "time"
      | "type"
      | "link"
      | "meeting_id"
      | "passcode"
      | "location"
      | "description"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("coalition_meetings")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoalitionMeeting(id: string): Promise<void> {
  const { error } = await supabase.from("coalition_meetings").delete().eq("id", id);
  if (error) throw error;
}

export interface CoalitionInitiativeRow {
  id: string;
  user_id: string;
  title: string;
  status: string;
  progress: number;
  description: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
}

export async function getCoalitionInitiatives(
  userId: string,
): Promise<CoalitionInitiativeRow[]> {
  const { data, error } = await supabase
    .from("coalition_initiatives")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addCoalitionInitiative(
  userId: string,
  fields: {
    title: string;
    status?: string;
    progress?: number;
    description?: string;
    start_date?: string;
    target_date?: string;
  },
): Promise<void> {
  const { error } = await supabase.from("coalition_initiatives").insert({
    user_id: userId,
    title: fields.title,
    status: fields.status || "Proposed",
    progress: fields.progress ?? 0,
    description: fields.description || null,
    start_date: fields.start_date || null,
    target_date: fields.target_date || null,
  });
  if (error) throw error;
}

export async function updateCoalitionInitiative(
  id: string,
  fields: Partial<
    Pick<
      CoalitionInitiativeRow,
      "title" | "status" | "progress" | "description" | "start_date" | "target_date"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("coalition_initiatives")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoalitionInitiative(id: string): Promise<void> {
  const { error } = await supabase
    .from("coalition_initiatives")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export interface CoalitionResourceRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  link: string | null;
  created_at: string;
}

export async function getCoalitionResources(
  userId: string,
): Promise<CoalitionResourceRow[]> {
  const { data, error } = await supabase
    .from("coalition_resources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addCoalitionResource(
  userId: string,
  fields: { title: string; description?: string; type?: string; link?: string },
): Promise<void> {
  const { error } = await supabase.from("coalition_resources").insert({
    user_id: userId,
    title: fields.title,
    description: fields.description || null,
    type: fields.type || "Available",
    link: fields.link || null,
  });
  if (error) throw error;
}

export async function updateCoalitionResource(
  id: string,
  fields: Partial<Pick<CoalitionResourceRow, "title" | "description" | "type" | "link">>,
): Promise<void> {
  const { error } = await supabase
    .from("coalition_resources")
    .update(fields)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoalitionResource(id: string): Promise<void> {
  const { error } = await supabase.from("coalition_resources").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToCoalitionData(onChange: () => void) {
  const channelName = `coalition-data-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_profile_data" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_meetings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_initiatives" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_resources" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Admin "Coalitions" view - mirrors getAllPartnersOverview exactly.
export interface CoalitionOverviewRow {
  userId: string;
  name: string;
  email: string;
  organization: string | null;
  profile: CoalitionProfileData | null;
  meetings: CoalitionMeetingRow[];
  initiatives: CoalitionInitiativeRow[];
  resources: CoalitionResourceRow[];
  programs: UserProgramRow[];
}

export async function getAllCoalitionsOverview(): Promise<CoalitionOverviewRow[]> {
  const { data: coalitionUsers, error: usersError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("primary_role", "coalition");
  if (usersError) throw usersError;
  if (!coalitionUsers || coalitionUsers.length === 0) return [];

  const userIds = coalitionUsers.map((u) => u.id);
  const [
    { data: orgProfiles, error: orgError },
    { data: profiles, error: profilesError },
    { data: meetings, error: meetingsError },
    { data: initiatives, error: initiativesError },
    { data: resources, error: resourcesError },
    { data: enrollments, error: enrollError },
    { data: allPrograms, error: programsError },
  ] = await Promise.all([
    supabase.from("profiles").select("id, organization").in("id", userIds),
    supabase.from("coalition_profile_data").select("*").in("user_id", userIds),
    supabase
      .from("coalition_meetings")
      .select("*")
      .in("user_id", userIds)
      .order("date", { ascending: true }),
    supabase
      .from("coalition_initiatives")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("coalition_resources")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase.from("user_programs").select("*").in("user_id", userIds),
    supabase.from("programs").select("*"),
  ]);
  if (orgError) throw orgError;
  if (profilesError) throw profilesError;
  if (meetingsError) throw meetingsError;
  if (initiativesError) throw initiativesError;
  if (resourcesError) throw resourcesError;
  if (enrollError) throw enrollError;
  if (programsError) throw programsError;

  const programById = Object.fromEntries((allPrograms || []).map((p) => [p.id, p]));
  const programsByUser = (enrollments || []).reduce<Record<string, UserProgramRow[]>>(
    (acc, e) => {
      const program = programById[e.program_id];
      if (!program) return acc;
      const row: UserProgramRow = {
        user_program_id: e.id,
        program_id: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
        start_date: program.start_date,
        end_date: program.end_date,
        icon: program.icon,
        color: program.color,
        contact_email: program.contact_email,
        contact_phone: program.contact_phone,
        progress: e.progress,
        approved: e.approved,
      };
      (acc[e.user_id] ||= []).push(row);
      return acc;
    },
    {},
  );

  return coalitionUsers.map((u) => ({
    userId: u.id,
    name: u.name || u.email,
    email: u.email,
    organization:
      (orgProfiles || []).find((p) => p.id === u.id)?.organization || null,
    profile: (profiles || []).find((p) => p.user_id === u.id) || null,
    meetings: (meetings || []).filter((m) => m.user_id === u.id),
    initiatives: (initiatives || []).filter((i) => i.user_id === u.id),
    resources: (resources || []).filter((r) => r.user_id === u.id),
    programs: programsByUser[u.id] || [],
  }));
}

export function subscribeToAllCoalitionsData(onChange: () => void) {
  const channelName = `admin-coalitions-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_profile_data" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_meetings" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_initiatives" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "coalition_resources" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface AnalyticsDataRow {
  program: string;
  county: string;
  date_range: string;
  active_clients: number;
  active_mentor_matches: number;
  sessions_this_month: number;
  hours_delivered: number;
  outstanding_signatures: number;
  surveys_overdue: number;
  invoices_pending: number;
}

// Fetches the whole program x county grid for one date range so the
// component can aggregate client-side across program/county filters,
// same behavior as the original CMS-based version.
export async function getAnalyticsGrid(dateRange: string): Promise<AnalyticsDataRow[]> {
  const { data, error } = await supabase
    .from("analytics_data")
    .select("program, county, date_range, active_clients, active_mentor_matches, sessions_this_month, hours_delivered, outstanding_signatures, surveys_overdue, invoices_pending")
    .eq("date_range", dateRange);
  if (error) throw error;
  return data;
}

export function subscribeToAnalyticsGrid(onChange: () => void) {
  const channelName = `analytics-grid-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "analytics_data" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getOverviewStatsForEdit(): Promise<(OverviewStats & { id: string }) | null> {
  const { data, error } = await supabase
    .from("overview_stats")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as (OverviewStats & { id: string }) | null;
}

export async function updateOverviewStats(
  id: string,
  updates: Partial<OverviewStats>,
): Promise<void> {
  const { error } = await supabase
    .from("overview_stats")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export interface MentorProfileRow {
  id: string;
  name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  hourly_rate: number;
  availability: string[];
  expertise: string[];
  active_clients: number;
  rating: number;
  status: string;
}

export async function getMentorProfileByName(name: string): Promise<MentorProfileRow | null> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMentorProfileByEmail(email: string): Promise<MentorProfileRow | null> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMentorProfile(
  id: string,
  updates: Partial<Omit<MentorProfileRow, "id">>,
): Promise<void> {
  const { error } = await supabase.from("mentors").update(updates).eq("id", id);
  if (error) throw error;
}

// Self-signup mentors don't automatically get a row in the `mentors` roster
// table (that's normally added by an admin via the Mentors tab). This lets
// the mentor settings page create one on first visit so the profile/session
// features work even before an admin has added them.
export async function createMentorProfile(mentor: {
  name: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  hourly_rate?: number;
  availability?: string[];
  expertise?: string[];
}): Promise<MentorProfileRow> {
  const { data, error } = await supabase
    .from("mentors")
    .insert({
      name: mentor.name,
      email: mentor.email,
      phone: mentor.phone ?? null,
      bio: mentor.bio ?? null,
      hourly_rate: mentor.hourly_rate ?? 50,
      availability: mentor.availability ?? [],
      expertise: mentor.expertise ?? [],
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export interface MenteeGoalRow {
  id: string;
  participant_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  category: string | null;
}

export async function getGoalsForParticipant(participantId: string): Promise<MenteeGoalRow[]> {
  const { data, error } = await supabase
    .from("mentee_goals")
    .select("*")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function toggleGoalCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase
    .from("mentee_goals")
    .update({ completed, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function addMenteeGoal(goal: {
  participant_id: string;
  title: string;
  description?: string;
  due_date?: string;
  category?: string;
}): Promise<void> {
  const { error } = await supabase.from("mentee_goals").insert({
    participant_id: goal.participant_id,
    title: goal.title,
    description: goal.description ?? null,
    due_date: goal.due_date ?? null,
    category: goal.category ?? null,
    completed: false,
  });
  if (error) throw error;
}

export async function updateMenteeGoal(
  id: string,
  updates: Partial<{
    title: string;
    description: string;
    due_date: string;
    category: string;
  }>,
): Promise<void> {
  const { error } = await supabase.from("mentee_goals").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteMenteeGoal(id: string): Promise<void> {
  const { error } = await supabase.from("mentee_goals").delete().eq("id", id);
  if (error) throw error;
}

export interface MenteeNoteRow {
  id: string;
  participant_id: string | null;
  note: string;
  author: string | null;
  created_at: string;
}

export async function getNotesForParticipant(participantId: string): Promise<MenteeNoteRow[]> {
  const { data, error } = await supabase
    .from("mentee_notes")
    .select("*")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMenteeNote(
  participantId: string,
  note: string,
  author: string,
): Promise<void> {
  const { error } = await supabase.from("mentee_notes").insert({
    participant_id: participantId,
    note,
    author,
  });
  if (error) throw error;
}

// Notes across a set of mentees at once - used by the mentor's own "Notes
// for Mentees and Entrepreneurs" card to show what they've recently sent
// across all their mentees, not just one at a time.
export async function getNotesForParticipants(
  participantIds: string[],
): Promise<MenteeNoteRow[]> {
  if (participantIds.length === 0) return [];
  const { data, error } = await supabase
    .from("mentee_notes")
    .select("*")
    .in("participant_id", participantIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export interface MenteeNoteWithContext extends MenteeNoteRow {
  menteeName: string;
  mentorName: string;
}

// Admin oversight: every mentor-to-mentee note across the whole system,
// joined with the mentee's name (author already stores the mentor's name).
export async function getAllMenteeNotesWithContext(): Promise<
  MenteeNoteWithContext[]
> {
  const [{ data: notes, error: notesError }, { data: participants, error: participantsError }] =
    await Promise.all([
      supabase
        .from("mentee_notes")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("participants").select("id, name, mentor"),
    ]);
  if (notesError) throw notesError;
  if (participantsError) throw participantsError;

  const participantById = Object.fromEntries(
    (participants || []).map((p) => [p.id, p]),
  );

  return (notes || []).map((n) => {
    const participant = n.participant_id ? participantById[n.participant_id] : null;
    return {
      ...n,
      menteeName: participant?.name || "Unknown mentee",
      mentorName: n.author || participant?.mentor || "Unknown mentor",
    };
  });
}

export interface MenteeSessionRow {
  id: string;
  participant_id: string | null;
  date: string;
  time: string | null;
  topic: string | null;
  notes: string | null;
  duration: number;
  meeting_link: string | null;
  mentor_name: string | null;
  created_at: string;
}

export async function getSessionsForParticipant(participantId: string): Promise<MenteeSessionRow[]> {
  const { data, error } = await supabase
    .from("mentee_sessions")
    .select("*")
    .eq("participant_id", participantId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllSessionsForMentor(mentorName: string): Promise<MenteeSessionRow[]> {
  const { data, error } = await supabase
    .from("mentee_sessions")
    .select("*")
    .eq("mentor_name", mentorName)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMenteeSession(session: {
  participant_id: string | null;
  date: string;
  time?: string;
  topic: string;
  notes?: string;
  duration?: number;
  meeting_link?: string;
  mentor_name: string;
}): Promise<void> {
  const { error } = await supabase.from("mentee_sessions").insert(session);
  if (error) throw error;
}

export async function updateMenteeSession(
  id: string,
  updates: Partial<{
    date: string;
    time: string;
    topic: string;
    notes: string;
    duration: number;
    meeting_link: string;
  }>,
): Promise<void> {
  const { error } = await supabase.from("mentee_sessions").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteMenteeSession(id: string): Promise<void> {
  const { error } = await supabase.from("mentee_sessions").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToMenteeData(onChange: () => void) {
  const channelName = `mentee-data-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentee_goals" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentee_notes" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentee_sessions" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "mentors" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface ProgramRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  managed_by: string;
}

// Real programs catalog for the admin Program Management page -
// replaces the old localStorage("entrepreneur_programs_data") /
// DEFAULT_PROGRAMS mock array, so the ids used there line up with the
// real programs.id referenced by user_programs/program_tracking/
// program_resources.
export async function getAllPrograms(): Promise<ProgramRow[]> {
  const { data, error } = await supabase
    .from("programs")
    .select(
      "id, name, description, status, start_date, end_date, contact_email, contact_phone, managed_by",
    )
    .order("name");
  if (error) throw error;
  return data;
}

export async function updateProgramContact(
  programId: string,
  fields: { contact_email?: string; contact_phone?: string },
): Promise<void> {
  const { error } = await supabase
    .from("programs")
    .update(fields)
    .eq("id", programId);
  if (error) throw error;
}

export interface UserProgramRow {
  user_program_id: string;
  program_id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  icon: string | null;
  color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  progress: number;
  approved: boolean;
}

// Real enrolled programs for a user - joins user_programs (per-user
// enrollment + progress + approval) with programs (the shared catalog).
// Replaces the old localStorage("entrepreneur_programs_data") blob, which
// let users create arbitrary custom programs with no real backing.
export async function getProgramsForUser(userId: string): Promise<UserProgramRow[]> {
  const [{ data: enrollments, error: enrollError }, { data: programs, error: programError }] =
    await Promise.all([
      supabase.from("user_programs").select("*").eq("user_id", userId),
      supabase.from("programs").select("*"),
    ]);
  if (enrollError) throw enrollError;
  if (programError) throw programError;

  const programById = Object.fromEntries((programs || []).map((p) => [p.id, p]));

  return (enrollments || [])
    .map((e) => {
      const program = programById[e.program_id];
      if (!program) return null;
      return {
        user_program_id: e.id,
        program_id: program.id,
        name: program.name,
        description: program.description,
        status: program.status,
        start_date: program.start_date,
        end_date: program.end_date,
        icon: program.icon,
        color: program.color,
        contact_email: program.contact_email,
        contact_phone: program.contact_phone,
        progress: e.progress,
        approved: e.approved,
      };
    })
    .filter((p): p is UserProgramRow => p !== null);
}

export interface MentorMatchParticipantRow {
  id: string;
  email: string | null;
  name: string | null;
  program_name: string | null;
  mentor: string | null;
  status: string;
}

// Real participants table rows for the admin "Mentor Matching" tab -
// this is the actual mentorship enrollment/assignment record (also used
// by getParticipantRecordsForUser and getMenteesForMentor), separate
// from user_programs (business-services approval).
export async function getAllParticipantsForMatching(): Promise<
  MentorMatchParticipantRow[]
> {
  const { data, error } = await supabase
    .from("participants")
    .select("id, email, name, program_name, mentor, status")
    .order("name");
  if (error) throw error;
  return data;
}

// Assign (or clear, with mentorName = null) the mentor for a participant.
// This is the one real write behind "Your Mentor" on the mentee dashboard.
export async function assignParticipantMentor(
  participantId: string,
  mentorName: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({ mentor: mentorName })
    .eq("id", participantId);
  if (error) throw error;
}

export interface ProgramAccessParticipant {
  user_id: string;
  email: string;
  name: string;
  primary_role: string;
  approvedProgramNames: string[];
}

// Real participant list for the admin "Program Access" panel - every
// entrepreneur/mentee account plus which programs they're approved for
// (from user_programs.approved), replacing the old
// localStorage("users")/localStorage(`profile_${email}`) reads that were
// always empty under real Supabase auth.
export async function getProgramAccessParticipants(): Promise<
  ProgramAccessParticipant[]
> {
  const [{ data: users, error: usersError }, { data: enrollments, error: enrollError }, { data: programs, error: programError }] =
    await Promise.all([
      // Any role that can pick programs at signup (see the "Program
      // Interests" step in app/signup/page.tsx) needs to show up here,
      // not just entrepreneur/mentee - partner and coalition accounts go
      // through the same flow and were previously missing entirely.
      supabase
        .from("users")
        .select("id, email, name, primary_role")
        .in("primary_role", ["entrepreneur", "mentee", "partner", "coalition"]),
      supabase.from("user_programs").select("user_id, program_id, approved"),
      supabase.from("programs").select("id, name"),
    ]);
  if (usersError) throw usersError;
  if (enrollError) throw enrollError;
  if (programError) throw programError;

  const programNameById = Object.fromEntries(
    (programs || []).map((p) => [p.id, p.name]),
  );

  return (users || []).map((u) => ({
    user_id: u.id,
    email: u.email || "",
    name: u.name || u.email || "",
    primary_role: u.primary_role || "",
    approvedProgramNames: (enrollments || [])
      .filter((e) => e.user_id === u.id && e.approved)
      .map((e) => programNameById[e.program_id])
      .filter((name): name is string => !!name),
  }));
}

// Approve/revoke a user's access to a specific program by name. Looks up
// the program's id, then upserts the user_programs row (in case the user
// signed up before this program existed and never got an enrollment row).
export async function setProgramAccessByName(
  userId: string,
  programName: string,
  approved: boolean,
  approvedByUserId?: string,
): Promise<void> {
  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("id")
    .eq("name", programName)
    .maybeSingle();
  if (programError) throw programError;
  if (!program) throw new Error(`Program "${programName}" not found`);

  const { error } = await supabase.from("user_programs").upsert(
    {
      user_id: userId,
      program_id: program.id,
      approved,
      approved_by: approved ? approvedByUserId || null : null,
      approved_at: approved ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,program_id" },
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Program tracking - admin-entered financial/outcomes numbers, one row
// per (program, participant) since budget/grants/outcomes are specific
// to each entrepreneur, not a single program-wide number. Jody selects
// a participant from the admin Program Management Tracking tab and
// enters their numbers; that participant sees them read-only in
// "My Tracking".
// ---------------------------------------------------------------------
export interface ProgramTrackingRow {
  program_id: string;
  participant_id: string;
  budget: number;
  spent: number;
  grants_received: number;
  grants_pending: number;
  businesses_launched: number;
  businesses_expanded: number;
  jobs_created: number;
  jobs_retained: number;
  capital_accessed: number;
  revenue_growth_pct: number;
  // Staff time and free-text outcomes recur across every program Jody
  // tracks (SEED, Parker Dewey, LHEATs, etc.) but each has its own set of
  // very specific fields (attendance, session counts, loan pipeline...).
  // Rather than modeling a separate schema per program, staff_hours covers
  // the universal "how much staff time went into this" number, and
  // outcomes_notes is a free-text field for whatever's specific to that
  // program/participant that isn't worth its own column.
  staff_hours: number;
  outcomes_notes: string | null;
  updated_at: string;
}

export async function getProgramTracking(
  programId: string,
  participantId: string,
): Promise<ProgramTrackingRow | null> {
  const { data, error } = await supabase
    .from("program_tracking")
    .select("*")
    .eq("program_id", programId)
    .eq("participant_id", participantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// All tracking rows entered so far for a program, keyed by participant_id -
// used by the admin Tracking tab to show which participants already have
// numbers entered when picking who to edit.
export async function getProgramTrackingForProgram(
  programId: string,
): Promise<Record<string, ProgramTrackingRow>> {
  const { data, error } = await supabase
    .from("program_tracking")
    .select("*")
    .eq("program_id", programId);
  if (error) throw error;
  return Object.fromEntries(
    (data || []).map((row) => [row.participant_id, row]),
  );
}

export async function upsertProgramTracking(
  programId: string,
  participantId: string,
  fields: Partial<
    Omit<ProgramTrackingRow, "program_id" | "participant_id" | "updated_at">
  >,
): Promise<void> {
  const { error } = await supabase.from("program_tracking").upsert(
    {
      program_id: programId,
      participant_id: participantId,
      ...fields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "program_id,participant_id" },
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Program resources - admin-managed documents/links per program.
// ---------------------------------------------------------------------
export interface ProgramResourceRow {
  id: string;
  program_id: string;
  name: string;
  type: string;
  url: string | null;
  description: string | null;
}

export async function getProgramResources(
  programId: string,
): Promise<ProgramResourceRow[]> {
  const { data, error } = await supabase
    .from("program_resources")
    .select("id, program_id, name, type, url, description")
    .eq("program_id", programId)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function addProgramResource(resource: {
  program_id: string;
  name: string;
  type: string;
  url?: string;
  description?: string;
}): Promise<void> {
  const { error } = await supabase.from("program_resources").insert({
    program_id: resource.program_id,
    name: resource.name,
    type: resource.type,
    url: resource.url || null,
    description: resource.description || null,
  });
  if (error) throw error;
}

export async function deleteProgramResource(id: string): Promise<void> {
  const { error } = await supabase
    .from("program_resources")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Mentor ratings - one updatable 1-5 rating per participant->mentor pair,
// set by the mentee/entrepreneur from their real "Your Mentor" card.
// ---------------------------------------------------------------------
export async function getMentorRatingForParticipant(
  participantId: string,
  mentorName: string,
): Promise<{ rating: number; comment: string | null } | null> {
  const { data, error } = await supabase
    .from("mentor_ratings")
    .select("rating, comment")
    .eq("participant_id", participantId)
    .eq("mentor_name", mentorName)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setMentorRating(
  participantId: string,
  mentorName: string,
  rating: number,
  comment?: string,
): Promise<void> {
  const { error } = await supabase.from("mentor_ratings").upsert(
    {
      participant_id: participantId,
      mentor_name: mentorName,
      rating,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id,mentor_name" },
  );
  if (error) throw error;
}

// Real average rating for a mentor, computed from mentor_ratings rather
// than trusting the static mentors.rating column (which nothing writes
// to). Falls back to null if no one has rated them yet - callers should
// fall back to the stored mentors.rating in that case.
export async function getMentorAverageRating(
  mentorName: string,
): Promise<{ average: number; count: number } | null> {
  const { data, error } = await supabase
    .from("mentor_ratings")
    .select("rating")
    .eq("mentor_name", mentorName);
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / data.length, count: data.length };
}

// Sends a real notification email via /api/send-notification-email, gated
// by the user's "Email notifications" toggle. Attempts real delivery via
// Resend server-side if configured; otherwise the API route logs it to the
// real email_logs table instead of failing. Returns false without hitting
// the network at all if the toggle is off.
export async function sendMentorEmailNotification(
  to: string,
  subject: string,
  body: string,
  type: string = "general",
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("email_notifications_enabled") !== "true") {
    return false;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return false;

    const res = await fetch("/api/send-notification-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, subject, body, type }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to send email notification:", err);
    return false;
  }
}
