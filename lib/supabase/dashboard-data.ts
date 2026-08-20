// lib/supabase/dashboard-data.ts
import { supabase } from "./client";

export interface DashboardParticipant {
  id: string;
  name: string | null;
  email: string | null;
  program_name: string | null;
  role: string | null;
  mentor: string | null;
  status: string;
  joined_at: string;
  county: string | null;
}

export interface ChartRow {
  label: string;
  value: number;
}

export interface SessionMonthRow {
  month: string;
  sessions: number;
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
      county,
      users:user_id ( name, email, primary_role ),
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
    role: row.users?.primary_role ?? null,
    mentor: row.mentor,
    status: row.status,
    joined_at: row.joined_at,
    county: row.county ?? null,
  }));
}

// Admins set/edit this on the Participants tab; new signups can also set it
// going forward via the signup form. Nothing else writes to this column.
export async function updateParticipantCounty(
  id: string,
  county: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({ county })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Realtime ----------
// Call from a component's useEffect. Fires onChange whenever a participant
// row changes - from any device.
export function subscribeToDashboardChanges(onChange: () => void) {
  const channelName = `dashboard-changes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------
// LIVE computed replacements for the snapshot tables above.
// overview_stats / outcome_kpis / analytics_data / clients_by_program /
// clients_by_county / sessions_per_month / resource_stats /
// resources_by_program were all static numbers someone entered by hand in
// the old CMS editor (now removed) - they didn't reflect what's actually
// in participants/mentors/mentee_sessions/program_tracking, which is why
// Overview could say "124 participants" while the real Participants tab
// said "1". Everything below counts the real rows directly instead, so
// Overview/Analytics/Resources always match what Participants/Mentors show.
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
    // Same fix as the Participants tables: mentee/entrepreneur signups are
    // all tagged "Business Professional Services" by default, so group by
    // their real role instead of that generic program name.
    const label =
      p.role === "mentee"
        ? "Mentee"
        : p.role === "entrepreneur"
          ? "Entrepreneur"
          : p.program_name || "Unassigned";
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function getLiveClientsByCounty(
  participants?: DashboardParticipant[],
): Promise<ChartRow[]> {
  const rows = participants || (await getParticipants());
  const counts: Record<string, number> = {};
  for (const p of rows) {
    const label = p.county || "Unassigned";
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
  countyName: string = "All Counties",
): Promise<LiveOperationalMetrics> {
  const [participants, sessions] = await Promise.all([
    getParticipants(),
    getAllMenteeSessions(),
  ]);
  const filteredParticipants = participants.filter(
    (p) =>
      (programName === "All Programs" || p.program_name === programName) &&
      (countyName === "All Counties" || p.county === countyName),
  );
  const participantIds = new Set(filteredParticipants.map((p) => p.id));
  const isFiltered = programName !== "All Programs" || countyName !== "All Counties";
  const rangeStart = dateRangeStart(dateRangeLabel);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRangeSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    if (rangeStart && d < rangeStart) return false;
    if (isFiltered && s.participant_id && !participantIds.has(s.participant_id)) {
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

export async function getLiveOutcomeMetrics(
  programName: string,
  countyName: string = "All Counties",
): Promise<LiveOutcomeMetrics> {
  const [programs, tracking, participants, ratingsRes] = await Promise.all([
    getAllPrograms(),
    getAllProgramTracking(),
    getParticipants(),
    supabase.from("mentor_ratings").select("rating"),
  ]);
  if (ratingsRes.error) throw ratingsRes.error;

  const programId =
    programName === "All Programs" ? null : programs.find((p) => p.name === programName)?.id;
  let filteredTracking =
    programName === "All Programs" ? tracking : tracking.filter((t) => t.program_id === programId);
  const filteredParticipants = participants.filter(
    (p) =>
      (programName === "All Programs" || p.program_name === programName) &&
      (countyName === "All Counties" || p.county === countyName),
  );
  if (countyName !== "All Counties") {
    const participantIds = new Set(filteredParticipants.map((p) => p.id));
    filteredTracking = filteredTracking.filter((t) => participantIds.has(t.participant_id));
  }

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

// active_clients and rating on the mentors table itself are static
// columns that nothing ever writes to (they're whatever they were at
// signup, usually 0) - the real counts live in the participants table
// (participants.mentor) and mentor_ratings table respectively. Compute
// both live here so the Mentor Directory reflects real assignments and
// real submitted ratings instead of stale zeros. See also
// getLiveMentorActivityReport, which does the same thing for the
// Reports page.
export async function getMentors(): Promise<MentorRow[]> {
  const [mentorsRes, participantsRes, ratingsRes] = await Promise.all([
    supabase.from("mentors").select("*").order("name"),
    supabase.from("participants").select("mentor"),
    supabase.from("mentor_ratings").select("mentor_name, rating"),
  ]);
  if (mentorsRes.error) throw mentorsRes.error;
  if (participantsRes.error) throw participantsRes.error;
  if (ratingsRes.error) throw ratingsRes.error;

  const participants = participantsRes.data ?? [];
  const ratingsByMentor: Record<string, number[]> = {};
  for (const r of ratingsRes.data ?? []) {
    (ratingsByMentor[r.mentor_name] ||= []).push(r.rating);
  }

  return (mentorsRes.data ?? []).map((m) => {
    const active_clients = participants.filter((p) => p.mentor === m.name).length;
    const ratings = ratingsByMentor[m.name] || [];
    const rating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;
    return { ...m, active_clients, rating };
  });
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
    .on("postgres_changes", { event: "*", schema: "public", table: "mentor_ratings" }, onChange)
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
  zoomPlaceholder?: string; // Meeting ID
  zoomPasscode?: string;
  zoomLink?: string;
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

// Used by the "Join the Leadership Roundtable" card on every non-admin
// dashboard to check whether the signed-in user already has an approved
// application, so approved members see the real next-meeting details
// instead of the generic "Apply to Join" pitch. Most recent application
// for that email wins (in case someone applied more than once).
export async function getRoundtableApplicationForEmail(
  email: string,
): Promise<RoundtableApplicationRow | null> {
  if (!email) return null;
  const { data, error } = await supabase
    .from("leadership_roundtable_applications")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as RoundtableApplicationRow | null) ?? null;
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

// The Reports page's Monthly/Participant/Mentor/Outcome/County sections
// used to read from a report_data JSON blob, but that was only ever
// hand-edited once as a demo (via the old CMS editor's "Reports Data" tab,
// which actually only wrote to localStorage and was removed along with the
// rest of that page) and never updated again, so it drifted from reality.
// All of those sections are now computed live from the real tables the
// rest of the dashboard uses. Financial Summary was the last holdout since
// there was no real bookkeeping table to compute it from - financial_
// transactions below is that table, so report_data is no longer read or
// written anywhere in the app.

export type FinancialTransactionCategory =
  | "grants"
  | "donations"
  | "personnel"
  | "programming"
  | "operations";

export interface FinancialTransactionRow {
  id: string;
  category: FinancialTransactionCategory;
  amount: number;
  description: string | null;
  status: "pending" | "approved";
  transaction_date: string;
  created_by: string | null;
  created_at: string;
}

export async function getAllFinancialTransactions(): Promise<FinancialTransactionRow[]> {
  const { data, error } = await supabase
    .from("financial_transactions")
    .select("*")
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data as unknown as FinancialTransactionRow[];
}

export async function addFinancialTransaction(input: {
  category: FinancialTransactionCategory;
  amount: number;
  description: string;
  status: "pending" | "approved";
  transaction_date: string;
  created_by: string;
}): Promise<void> {
  const { error } = await supabase.from("financial_transactions").insert(input);
  if (error) throw error;
}

export async function deleteFinancialTransaction(id: string): Promise<void> {
  const { error } = await supabase.from("financial_transactions").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToFinancialTransactions(onChange: () => void) {
  const channelName = `financial-tx-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "financial_transactions" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export interface LiveFinancialSummary {
  grants: number;
  donations: number;
  personnel: number;
  programming: number;
  operations: number;
  totalRevenue: number;
  totalExpenses: number;
  netSurplus: number;
  pendingCount: number;
  pendingAmount: number;
}

// Computed for a given month from real logged transactions - only
// "approved" entries count toward the totals; "pending" ones are called
// out separately, same distinction the old manual fields used to draw.
export function computeFinancialSummary(
  transactions: FinancialTransactionRow[],
  monthStart: Date,
  monthEnd: Date,
): LiveFinancialSummary {
  const inMonth = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d >= monthStart && d < monthEnd;
  });

  const sum = (category: FinancialTransactionCategory) =>
    inMonth
      .filter((t) => t.category === category && t.status === "approved")
      .reduce((total, t) => total + Number(t.amount), 0);

  const grants = sum("grants");
  const donations = sum("donations");
  const personnel = sum("personnel");
  const programming = sum("programming");
  const operations = sum("operations");
  const pending = inMonth.filter((t) => t.status === "pending");

  return {
    grants,
    donations,
    personnel,
    programming,
    operations,
    totalRevenue: grants + donations,
    totalExpenses: personnel + programming + operations,
    netSurplus: grants + donations - (personnel + programming + operations),
    pendingCount: pending.length,
    pendingAmount: pending.reduce((total, t) => total + Number(t.amount), 0),
  };
}

export interface LiveMentorActivityRow {
  name: string;
  mentees: number;
  sessions: number;
  hours: number;
  rating: number | null;
}

// Per-mentor sessions/hours come from real mentee_sessions rows (matched
// by mentor_name); rating comes from the real mentor_ratings table, not
// the static mentors.rating column (nothing writes to that column - see
// getMentorAverageRating).
export async function getLiveMentorActivityReport(): Promise<LiveMentorActivityRow[]> {
  const [mentors, participants, sessions, ratingsRes] = await Promise.all([
    getMentors(),
    getParticipants(),
    getAllMenteeSessions(),
    supabase.from("mentor_ratings").select("mentor_name, rating"),
  ]);
  if (ratingsRes.error) throw ratingsRes.error;

  const ratingsByMentor: Record<string, number[]> = {};
  for (const r of ratingsRes.data || []) {
    (ratingsByMentor[r.mentor_name] ||= []).push(r.rating);
  }

  return mentors.map((m) => {
    const mentees = participants.filter((p) => p.mentor === m.name).length;
    const mentorSessions = sessions.filter((s) => s.mentor_name === m.name);
    const hours =
      Math.round((mentorSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60) * 10) / 10;
    const ratings = ratingsByMentor[m.name] || [];
    const rating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    return { name: m.name, mentees, sessions: mentorSessions.length, hours, rating };
  });
}

export interface LiveMentorIncomeRow {
  name: string;
  hourlyRate: number;
  hours: number;
  income: number;
}

// Accrued mentor earnings to date - real hours logged in mentee_sessions
// x their real hourly_rate from the mentors table. This is informational
// only ("what they've earned so far"), not an actual payout - there's no
// payment processing anywhere in this app, so nothing here moves money,
// marks anything as paid, or generates a 1099. Same all-time (not
// month-scoped) convention as getLiveMentorActivityReport above.
export async function getLiveMentorIncomeReport(): Promise<LiveMentorIncomeRow[]> {
  const [{ data: mentors, error: mentorsError }, sessions] = await Promise.all([
    supabase.from("mentors").select("name, hourly_rate"),
    getAllMenteeSessions(),
  ]);
  if (mentorsError) throw mentorsError;

  return (mentors || []).map((m) => {
    const mentorSessions = sessions.filter((s) => s.mentor_name === m.name);
    const hours =
      Math.round((mentorSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60) * 10) / 10;
    const hourlyRate = m.hourly_rate ?? 0;
    return {
      name: m.name,
      hourlyRate,
      hours,
      income: Math.round(hours * hourlyRate * 100) / 100,
    };
  });
}

export interface LiveOutcomeReport {
  businessLaunches: number;
  satisfactionPct: number | null;
  mentorMatches: number;
  referrals: number;
}

export async function getLiveOutcomeReport(): Promise<LiveOutcomeReport> {
  const [outcome, participants, referralsRes] = await Promise.all([
    getLiveOutcomeMetrics("All Programs"),
    getParticipants(),
    supabase.from("partner_collaborations").select("referrals"),
  ]);
  if (referralsRes.error) throw referralsRes.error;

  const referrals = (referralsRes.data || []).reduce((sum, r) => sum + (r.referrals || 0), 0);
  const mentorMatches = participants.filter((p) => p.mentor && p.mentor.trim() !== "").length;

  return {
    businessLaunches: outcome.businesses_launched,
    satisfactionPct: outcome.participant_satisfaction_pct,
    mentorMatches,
    referrals,
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

  // Broadcast note - email everyone currently in that role, matching who
  // the in-app notification bell shows this to. Best-effort: a failed
  // lookup or send here should never make the note itself fail to save.
  try {
    const { data: recipients } = await supabase
      .from("users")
      .select("email")
      .eq("primary_role", recipientType);
    await Promise.allSettled(
      (recipients ?? [])
        .filter((u) => u.email)
        .map((u) =>
          sendStaffNotificationEmail(
            subject || "New note from Rural Community Partners",
            message,
            "admin_note",
            u.email as string,
          ),
        ),
    );
  } catch (err) {
    console.error("Failed to email admin note recipients:", err);
  }
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
// DIRECT MESSAGES - private 1:1 chat between admin and a single coalition
// leader / mentor / partner. Separate from admin_notes above, which stays
// a one-way broadcast to a whole recipient type - this is a real
// back-and-forth conversation tied to one specific user_id.
// ============================================

export interface DirectMessageRow {
  id: string;
  user_id: string;
  sender_role: "admin" | "user";
  sender_name: string | null;
  message: string;
  created_at: string;
}

export interface MessageableUserRow {
  id: string;
  name: string | null;
  email: string | null;
  primaryRole: string;
}

// Every coalition/mentor/partner account admin can start or continue a
// conversation with - independent of whether any messages exist yet.
export async function getMessageableUsers(): Promise<MessageableUserRow[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, primary_role")
    .in("primary_role", ["coalition", "mentor", "partner"])
    .order("name");
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    primaryRole: u.primary_role || "",
  }));
}

// All conversations at once, for the admin inbox view (grouped/threaded
// client-side by user_id) - avoids one query per person.
export async function getAllDirectMessages(): Promise<DirectMessageRow[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as DirectMessageRow[];
}

// One person's thread - used on that person's own dashboard.
export async function getDirectMessagesForUser(
  userId: string,
): Promise<DirectMessageRow[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as DirectMessageRow[];
}

export async function sendDirectMessage(
  userId: string,
  senderRole: "admin" | "user",
  senderName: string,
  message: string,
): Promise<void> {
  const { error } = await supabase.from("direct_messages").insert({
    user_id: userId,
    sender_role: senderRole,
    sender_name: senderName,
    message,
  });
  if (error) throw error;

  // Only email when admin is the one sending - that's the direction the
  // in-app notification bell surfaces (a coalition/partner/mentor's own
  // reply doesn't need to email them back). Best-effort, never blocks
  // the message itself from sending.
  if (senderRole === "admin") {
    try {
      const { data: recipient } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      if (recipient?.email) {
        await sendStaffNotificationEmail(
          `Message from ${senderName}`,
          message,
          "direct_message",
          recipient.email,
        );
      }
    } catch (err) {
      console.error("Failed to email direct message recipient:", err);
    }
  }
}

export function subscribeToDirectMessages(onChange: () => void) {
  const channelName = `direct-messages-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "direct_messages" },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================
// NOTIFICATION BELL - unified feed of "notes from other users" for the
// mentee/entrepreneur/mentor/coalition/partner dashboards, pulled live
// from three existing tables that each already have their own UI
// elsewhere (mentee_notes, admin_notes, direct_messages). None of those
// tables track read/unread per person, so "unread" here is computed
// client-side: anything created after the viewer's last_seen_at (stored
// in notification_seen_state) counts as new.
// ============================================

export type NotificationSource = "mentor_note" | "admin_note" | "direct_message";

export interface NotificationFeedItem {
  id: string;
  source: NotificationSource;
  title: string;
  message: string;
  authorName: string | null;
  createdAt: string;
}

// Which roles see which sources: everyone sees admin_notes broadcast to
// their own role; mentee/entrepreneur additionally see notes from their
// mentor; coalition/partner/mentor additionally see their direct-message
// thread with admin (mentors have this too - see roundtable/notes work
// earlier in this project).
export async function getNotificationFeedForUser(params: {
  userId: string;
  role: string;
  participantId?: string | null;
}): Promise<NotificationFeedItem[]> {
  const { userId, role, participantId } = params;
  const items: NotificationFeedItem[] = [];

  const { data: adminNotes, error: adminNotesError } = await supabase
    .from("admin_notes")
    .select("*")
    .eq("recipient_type", role)
    .order("created_at", { ascending: false })
    .limit(30);
  if (adminNotesError) throw adminNotesError;
  for (const n of adminNotes || []) {
    items.push({
      id: `admin_note-${n.id}`,
      source: "admin_note",
      title: n.subject || "Note from Admin",
      message: n.message,
      authorName: n.sent_by,
      createdAt: n.created_at,
    });
  }

  if ((role === "mentee" || role === "entrepreneur") && participantId) {
    const { data: notes, error: notesError } = await supabase
      .from("mentee_notes")
      .select("*")
      .eq("participant_id", participantId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (notesError) throw notesError;
    for (const n of notes || []) {
      items.push({
        id: `mentor_note-${n.id}`,
        source: "mentor_note",
        title: "Note from your mentor",
        message: n.note,
        authorName: n.author,
        createdAt: n.created_at,
      });
    }
  }

  if (role === "coalition" || role === "partner" || role === "mentor") {
    const { data: messages, error: messagesError } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("user_id", userId)
      .eq("sender_role", "admin")
      .order("created_at", { ascending: false })
      .limit(30);
    if (messagesError) throw messagesError;
    for (const m of messages || []) {
      items.push({
        id: `direct_message-${m.id}`,
        source: "direct_message",
        title: `Message from ${m.sender_name || "Admin"}`,
        message: m.message,
        authorName: m.sender_name,
        createdAt: m.created_at,
      });
    }
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 30);
}

// Read-only - returns null if this user has never opened their
// notification bell before (in which case everything currently in their
// feed should count as unread, not just things from this exact moment
// forward). The row only gets created the first time they actually open
// the bell, via markNotificationsSeen below - never just from loading
// the page, or the badge would clear itself before they ever saw it.
export async function getLastSeenNotificationsAt(
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("notification_seen_state")
    .select("last_seen_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.last_seen_at ?? null;
}

export async function markNotificationsSeen(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notification_seen_state")
    .upsert({ user_id: userId, last_seen_at: now }, { onConflict: "user_id" });
  if (error) throw error;
}

export function subscribeToNotificationFeed(role: string, onChange: () => void) {
  const channelName = `notification-feed-${Math.random().toString(36).slice(2)}`;
  let channel = supabase.channel(channelName).on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "admin_notes" },
    onChange,
  );
  if (role === "mentee" || role === "entrepreneur") {
    channel = channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mentee_notes" },
      onChange,
    );
  }
  if (role === "coalition" || role === "partner" || role === "mentor") {
    channel = channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "direct_messages" },
      onChange,
    );
  }
  channel.subscribe();
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

  // Best-effort email to the mentee/entrepreneur this note is for -
  // never blocks the note itself from saving.
  try {
    const { data: participant } = await supabase
      .from("participants")
      .select("user_id")
      .eq("id", participantId)
      .maybeSingle();
    if (participant?.user_id) {
      const { data: recipient } = await supabase
        .from("users")
        .select("email")
        .eq("id", participant.user_id)
        .maybeSingle();
      if (recipient?.email) {
        await sendStaffNotificationEmail(
          `Note from ${author || "your mentor"}`,
          note,
          "mentor_note",
          recipient.email,
        );
      }
    }
  } catch (err) {
    console.error("Failed to email mentee note recipient:", err);
  }
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

// Real delete for the admin Program Management "Delete" button - previously
// this only wrote to localStorage("entrepreneur_programs_data") and never
// touched the real programs table, so a deleted program silently came back
// on the next page load. Clears out the tables that reference program_id
// first (user_programs, program_tracking, program_resources) since there's
// no ON DELETE CASCADE on those foreign keys, then deletes the program row
// itself. participants.program_id is left alone (set null) rather than
// deleting participant records - a participant shouldn't disappear just
// because the program they were tagged with was removed.
export async function deleteProgram(programId: string): Promise<void> {
  const [{ error: userProgramsError }, { error: trackingError }, { error: resourcesError }] =
    await Promise.all([
      supabase.from("user_programs").delete().eq("program_id", programId),
      supabase.from("program_tracking").delete().eq("program_id", programId),
      supabase.from("program_resources").delete().eq("program_id", programId),
    ]);
  if (userProgramsError) throw userProgramsError;
  if (trackingError) throw trackingError;
  if (resourcesError) throw resourcesError;

  const { error: participantsError } = await supabase
    .from("participants")
    .update({ program_id: null })
    .eq("program_id", programId);
  if (participantsError) throw participantsError;

  const { error } = await supabase.from("programs").delete().eq("id", programId);
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
  programNames: string[];
  mentor: string | null;
  status: string;
}

// Real participants table rows for the admin "Mentor Matching" tab - this
// is the actual mentorship enrollment/assignment record (mentor field),
// separate from user_programs (business-services approval).
//
// Eligibility used to be `participants.program_name === selectedProgram`,
// but every mentee/entrepreneur's participants row is tagged with
// "Business Professional Services" at signup regardless of which programs
// they actually picked (see signup/page.tsx) - so RCP/SEED/SEK's Matching
// tab always showed 0 participants even for approved users. The real
// per-program membership lives in user_programs (approved rows), so build
// each participant's list of approved program names from there instead.
export async function getAllParticipantsForMatching(): Promise<
  MentorMatchParticipantRow[]
> {
  const [
    { data: participants, error: participantsError },
    { data: enrollments, error: enrollError },
    { data: programs, error: programError },
  ] = await Promise.all([
    supabase
      .from("participants")
      .select("id, user_id, email, name, mentor, status")
      .order("name"),
    supabase.from("user_programs").select("user_id, program_id, approved"),
    supabase.from("programs").select("id, name"),
  ]);
  if (participantsError) throw participantsError;
  if (enrollError) throw enrollError;
  if (programError) throw programError;

  const programNameById = Object.fromEntries(
    (programs || []).map((p) => [p.id, p.name]),
  );
  const approvedProgramNamesByUser = (enrollments || []).reduce<
    Record<string, string[]>
  >((acc, e) => {
    if (!e.approved) return acc;
    const name = programNameById[e.program_id];
    if (!name) return acc;
    (acc[e.user_id] ||= []).push(name);
    return acc;
  }, {});

  return (participants || []).map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    programNames: p.user_id ? approvedProgramNamesByUser[p.user_id] || [] : [],
    mentor: p.mentor,
    status: p.status,
  }));
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

// Admin "Mentee"/"Entrepreneur" views - mirrors getAllPartnersOverview and
// getAllCoalitionsOverview, but for mentee/entrepreneur accounts. These two
// roles share one underlying account: a "mentee" primary_role account can
// toggle into an entrepreneur view (see the Entrepreneur Hub/Mentee Hub
// cards on their dashboard, "every mentee is also an entrepreneur"), so a
// mentee shows up in BOTH the admin Mentee tab and the admin Entrepreneur
// tab. A pure "entrepreneur" primary_role account only has its own
// entrepreneur page, so it only shows up in the Entrepreneur tab.
export interface ParticipantAccountRow {
  userId: string;
  name: string;
  email: string;
  primaryRole: string;
  mentor: string | null;
  status: string | null;
  programs: UserProgramRow[];
}

export async function getAllMenteeEntrepreneurAccounts(): Promise<
  ParticipantAccountRow[]
> {
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, email, primary_role")
    .in("primary_role", ["mentee", "entrepreneur"]);
  if (usersError) throw usersError;
  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.id);
  const [
    { data: participants, error: participantsError },
    { data: enrollments, error: enrollError },
    { data: allPrograms, error: programsError },
  ] = await Promise.all([
    supabase.from("participants").select("user_id, mentor, status").in("user_id", userIds),
    supabase.from("user_programs").select("*").in("user_id", userIds),
    supabase.from("programs").select("*"),
  ]);
  if (participantsError) throw participantsError;
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

  return users.map((u) => {
    const participant = (participants || []).find((p) => p.user_id === u.id);
    return {
      userId: u.id,
      name: u.name || u.email || "",
      email: u.email || "",
      primaryRole: u.primary_role || "",
      mentor: participant?.mentor ?? null,
      status: participant?.status ?? null,
      programs: programsByUser[u.id] || [],
    };
  });
}

export function subscribeToMenteeEntrepreneurAccounts(onChange: () => void) {
  const channelName = `admin-mentee-entrepreneur-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "user_programs" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
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

// Same real delivery path as sendMentorEmailNotification, but for
// notifying staff (Jody) about things that need her attention - new
// roundtable applications, new user signups, low ratings, etc. Does NOT
// gate on the current user's own "Email notifications" toggle, since
// that's the currently-signed-in person's personal preference (e.g. the
// applicant filling out a form) and has nothing to do with whether staff
// should be notified.
export async function sendStaffNotificationEmail(
  subject: string,
  body: string,
  type: string = "general",
  to: string = "jody@hbcat.org",
): Promise<boolean> {
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
    console.error("Failed to send staff notification email:", err);
    return false;
  }
}

// ---------------------------------------------------------------------
// "Business Professional Services" page - a unified roster across every
// CRM member type (mentee/entrepreneur/partner/coalition, which live in
// the participants table, plus mentor, which lives in the separate
// mentors table) so Jody/staff can see and take case-management notes on
// anyone regardless of role, in one place. See case_notes and
// admin_personal_notes in types/supabase.ts.
// ---------------------------------------------------------------------

export interface CrmMemberRow {
  id: string;
  member_type: string; // "mentee" | "entrepreneur" | "partner" | "coalition" | "mentor"
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  detail: string | null; // program name for participants, specialty for mentors
  mentor: string | null; // assigned mentor's name - participants only
  menteeCount: number | null; // mentors only
  entrepreneurCount: number | null; // mentors only
  programs: string[]; // every program this member is approved for - participants only
}

export async function getAllCrmMembers(): Promise<CrmMemberRow[]> {
  const [participantsRes, enrollmentsRes, catalogRes, mentors] = await Promise.all([
    supabase.from("participants").select(
      `
      id,
      status,
      program_name,
      mentor,
      users:user_id ( id, name, email, primary_role ),
      programs:program_id ( name )
    `,
    ),
    // Real approved-program list per user (same source as the admin
    // Program Access tab and Mentor Matching) - a member can be approved
    // for more than one program, which the single program_id/program_name
    // columns on participants can't represent.
    supabase.from("user_programs").select("user_id, program_id, approved"),
    supabase.from("programs").select("id, name"),
    getMentors(),
  ]);
  if (participantsRes.error) throw participantsRes.error;
  if (enrollmentsRes.error) throw enrollmentsRes.error;
  if (catalogRes.error) throw catalogRes.error;

  const participantRows = (participantsRes.data ?? []) as any[];
  const userIds = participantRows
    .map((row) => row.users?.id)
    .filter((id): id is string => Boolean(id));

  // Phone lives on profiles, not users - same join pattern as
  // getAllPartnersOverview's "organization" lookup.
  const { data: profiles, error: profilesError } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, phone").in("id", userIds)
      : { data: [] as { id: string; phone: string | null }[], error: null };
  if (profilesError) throw profilesError;
  const phoneByUserId = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.phone]),
  );

  const programNameById = Object.fromEntries(
    (catalogRes.data ?? []).map((p) => [p.id, p.name]),
  );
  const approvedProgramsByUserId = (enrollmentsRes.data ?? []).reduce<
    Record<string, string[]>
  >((acc, e) => {
    if (!e.approved) return acc;
    const name = programNameById[e.program_id];
    if (!name) return acc;
    (acc[e.user_id] ||= []).push(name);
    return acc;
  }, {});

  const participantMembers: CrmMemberRow[] = participantRows
    .filter((row) =>
      ["mentee", "entrepreneur", "partner", "coalition"].includes(
        row.users?.primary_role,
      ),
    )
    .map((row) => ({
      id: row.id,
      member_type: row.users.primary_role,
      name: row.users?.name ?? "Unknown",
      email: row.users?.email ?? null,
      phone: row.users?.id ? (phoneByUserId[row.users.id] ?? null) : null,
      status: row.status,
      detail: row.programs?.name ?? row.program_name ?? null,
      mentor: row.mentor || null,
      menteeCount: null,
      entrepreneurCount: null,
      programs: row.users?.id ? approvedProgramsByUserId[row.users.id] || [] : [],
    }));

  // Mentee/entrepreneur counts come from real participants.mentor
  // assignments (matched by name, same as everywhere else mentor
  // matching happens in this app) - not a stored count anywhere.
  const mentorMembers: CrmMemberRow[] = mentors.map((m) => {
    const assigned = participantMembers.filter((p) => p.mentor === m.name);
    return {
      id: m.id,
      member_type: "mentor",
      name: m.name,
      email: m.email,
      phone: m.phone,
      status: m.status,
      detail: m.specialty,
      mentor: null,
      menteeCount: assigned.filter((p) => p.member_type === "mentee").length,
      entrepreneurCount: assigned.filter((p) => p.member_type === "entrepreneur")
        .length,
      programs: [],
    };
  });

  return [...participantMembers, ...mentorMembers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export interface CaseNoteRow {
  id: string;
  member_type: string;
  member_id: string;
  member_name: string;
  note: string;
  author: string | null;
  // Optional details about the actual interaction/meeting this note is
  // about - separate from created_at, which is just when the note was
  // typed into the system. Mirrors the fields coalition_meetings already
  // uses for the "Upcoming Meetings" feature (date/time/link/location).
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  meeting_link: string | null;
  created_at: string;
}

export async function getCaseNotesForMember(
  memberId: string,
): Promise<CaseNoteRow[]> {
  const { data, error } = await supabase
    .from("case_notes")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Case notes with a meeting_date today or later, across every member -
// powers the "Upcoming Sessions" card on the Business Professional
// Services page.
export async function getUpcomingCaseNotes(
  limit: number = 5,
): Promise<CaseNoteRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("case_notes")
    .select("*")
    .gte("meeting_date", today)
    .order("meeting_date", { ascending: true })
    // Same-day entries also need to sort by time, or "Tomorrow at 2pm"
    // can end up listed before "Tomorrow at 1pm" - meeting_date alone
    // ties everything on the same day together in insert order.
    .order("meeting_time", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function addCaseNote(
  memberType: string,
  memberId: string,
  memberName: string,
  note: string,
  author: string,
  meetingDetails?: {
    date?: string;
    time?: string;
    location?: string;
    link?: string;
  },
): Promise<void> {
  const { error } = await supabase.from("case_notes").insert({
    member_type: memberType,
    member_id: memberId,
    member_name: memberName,
    note,
    author,
    meeting_date: meetingDetails?.date || null,
    meeting_time: meetingDetails?.time || null,
    meeting_location: meetingDetails?.location || null,
    meeting_link: meetingDetails?.link || null,
  });
  if (error) throw error;
}

export async function deleteCaseNote(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("case_notes")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  // A row-level security policy can silently block a delete (0 rows
  // affected, no error) instead of throwing, so check explicitly.
  if (!data || data.length === 0) {
    throw new Error(
      "Delete was blocked by a database permission. Run the case_notes delete policy SQL, then try again.",
    );
  }
}

export function subscribeToCaseNotes(onChange: () => void) {
  const channelName = `case-notes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "case_notes" },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------
// BUSINESSES - lead/client tracking for a business (not a CRM login
// account), with one or more contacts connected to it and a running
// list of program referrals with status + dates. Meeting notes for a
// business reuse case_notes (member_type = 'business', member_id =
// businesses.id) so they show up in the same "Upcoming Sessions" feed
// and Session History pattern every other member type already uses.
// ---------------------------------------------------------------------

export type ReferralStatus =
  | "referred"
  | "applied"
  | "enrolled"
  | "completed"
  | "not_selected";

export interface BusinessContactRow {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  created_at: string;
}

export interface BusinessReferralRow {
  id: string;
  business_id: string;
  program_id: string | null;
  program_name: string;
  status: string;
  referred_date: string;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessRow {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  created_at: string;
}

export interface BusinessWithDetails extends BusinessRow {
  contacts: BusinessContactRow[];
  referrals: BusinessReferralRow[];
}

export async function getAllBusinesses(): Promise<BusinessWithDetails[]> {
  const [businessesRes, contactsRes, referralsRes] = await Promise.all([
    supabase.from("businesses").select("*").order("name"),
    supabase.from("business_contacts").select("*").order("created_at"),
    supabase.from("business_referrals").select("*").order("created_at", { ascending: false }),
  ]);
  if (businessesRes.error) throw businessesRes.error;
  if (contactsRes.error) throw contactsRes.error;
  if (referralsRes.error) throw referralsRes.error;

  const contactsByBusiness: Record<string, BusinessContactRow[]> = {};
  for (const c of contactsRes.data ?? []) {
    (contactsByBusiness[c.business_id] ||= []).push(c);
  }
  const referralsByBusiness: Record<string, BusinessReferralRow[]> = {};
  for (const r of referralsRes.data ?? []) {
    (referralsByBusiness[r.business_id] ||= []).push(r);
  }

  return (businessesRes.data ?? []).map((b) => ({
    ...b,
    contacts: contactsByBusiness[b.id] ?? [],
    referrals: referralsByBusiness[b.id] ?? [],
  }));
}

export async function addBusiness(
  name: string,
  industry: string | null,
  createdBy: string,
  contacts: { name: string; email?: string; phone?: string; role_title?: string }[] = [],
): Promise<string> {
  const { data, error } = await supabase
    .from("businesses")
    .insert({ name, industry: industry || null, created_by: createdBy })
    .select("id")
    .single();
  if (error) throw error;

  const validContacts = contacts.filter((c) => c.name.trim());
  if (validContacts.length > 0) {
    const { error: contactsError } = await supabase.from("business_contacts").insert(
      validContacts.map((c) => ({
        business_id: data.id,
        name: c.name,
        email: c.email || null,
        phone: c.phone || null,
        role_title: c.role_title || null,
      })),
    );
    if (contactsError) throw contactsError;
  }

  return data.id;
}

export async function deleteBusiness(id: string): Promise<void> {
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) throw error;
}

export async function addBusinessContact(
  businessId: string,
  contact: { name: string; email?: string; phone?: string; role_title?: string },
): Promise<void> {
  const { error } = await supabase.from("business_contacts").insert({
    business_id: businessId,
    name: contact.name,
    email: contact.email || null,
    phone: contact.phone || null,
    role_title: contact.role_title || null,
  });
  if (error) throw error;
}

export async function deleteBusinessContact(id: string): Promise<void> {
  const { error } = await supabase.from("business_contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function addBusinessReferral(
  businessId: string,
  programId: string | null,
  programName: string,
  createdBy: string,
  opts?: { status?: string; referredDate?: string; followUpDate?: string; notes?: string },
): Promise<void> {
  const { error } = await supabase.from("business_referrals").insert({
    business_id: businessId,
    program_id: programId,
    program_name: programName,
    status: opts?.status || "referred",
    referred_date: opts?.referredDate || new Date().toISOString().slice(0, 10),
    follow_up_date: opts?.followUpDate || null,
    notes: opts?.notes || null,
    created_by: createdBy,
  });
  if (error) throw error;
}

export async function updateBusinessReferral(
  id: string,
  fields: { status?: string; followUpDate?: string | null; notes?: string },
): Promise<void> {
  const update: {
    updated_at: string;
    status?: string;
    follow_up_date?: string | null;
    notes?: string;
  } = { updated_at: new Date().toISOString() };
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.followUpDate !== undefined) update.follow_up_date = fields.followUpDate || null;
  if (fields.notes !== undefined) update.notes = fields.notes;
  const { error } = await supabase.from("business_referrals").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteBusinessReferral(id: string): Promise<void> {
  const { error } = await supabase.from("business_referrals").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToBusinesses(onChange: () => void) {
  const channelName = `businesses-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "business_contacts" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "business_referrals" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Personal reminder checklist - private to the admin/staff user viewing
// it (RLS restricts rows to admin_id = auth.uid()), not shared with
// anyone else and not tied to any participant. This is the "note to
// herself as a reminder" piece - a simple manual checklist, not an
// automated emailed reminder (that would need a scheduled job and is a
// bigger separate build).
export interface PersonalNoteRow {
  id: string;
  admin_id: string;
  note: string;
  completed: boolean;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  meeting_link: string | null;
  created_at: string;
}

export async function getMyPersonalNotes(
  adminId: string,
): Promise<PersonalNoteRow[]> {
  const { data, error } = await supabase
    .from("admin_personal_notes")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addPersonalNote(
  adminId: string,
  note: string,
  meetingDetails?: {
    date?: string;
    time?: string;
    location?: string;
    link?: string;
  },
): Promise<void> {
  const { error } = await supabase.from("admin_personal_notes").insert({
    admin_id: adminId,
    note,
    meeting_date: meetingDetails?.date || null,
    meeting_time: meetingDetails?.time || null,
    meeting_location: meetingDetails?.location || null,
    meeting_link: meetingDetails?.link || null,
  });
  if (error) throw error;
}

export async function togglePersonalNote(
  id: string,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("admin_personal_notes")
    .update({ completed })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePersonalNote(id: string): Promise<void> {
  const { error } = await supabase
    .from("admin_personal_notes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export function subscribeToPersonalNotes(adminId: string, onChange: () => void) {
  const channelName = `personal-notes-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "admin_personal_notes",
        filter: `admin_id=eq.${adminId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Free-form private notepad entries per admin/staff user - as many notes
// as they want, separate from the itemized reminder checklist above.
// Note text is rendered through linkifyText on display, so any URL
// pasted into a note becomes a clickable link. Private via RLS
// (admin_id = auth.uid()), same as admin_personal_notes.
export interface NotepadRow {
  id: string;
  admin_id: string;
  subject: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getMyNotepadEntries(
  adminId: string,
): Promise<NotepadRow[]> {
  const { data, error } = await supabase
    .from("admin_notepad")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addNotepadEntry(
  adminId: string,
  subject: string,
  content: string,
): Promise<void> {
  const { error } = await supabase
    .from("admin_notepad")
    .insert({ admin_id: adminId, subject, content });
  if (error) throw error;
}

export async function deleteNotepadEntry(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("admin_notepad")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "Delete was blocked by a database permission. Please try again.",
    );
  }
}

export function subscribeToNotepad(adminId: string, onChange: () => void) {
  const channelName = `notepad-${Math.random().toString(36).slice(2)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "admin_notepad",
        filter: `admin_id=eq.${adminId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
