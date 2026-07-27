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
      users:user_id ( name, email ),
      programs:program_id ( name )
    `,
    )
    .order("joined_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.users?.name ?? null,
    email: row.users?.email ?? null,
    program_name: row.programs?.name ?? null,
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
  matches_trend: number;
  avg_rating: number;
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

export async function getMentorsStats(): Promise<MentorsStats | null> {
  const { data, error } = await supabase
    .from("mentors_stats")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
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

export interface LeadershipStats {
  total_members: number;
  members_trend: number;
  new_signups: number;
  signups_trend: number;
  avg_attendance: number;
  attendance_trend: number;
  member_satisfaction: number;
  satisfaction_trend: number;
  grant_funding: number;
  mentor_hours: number;
  staff_members: number;
  in_kind_support: number;
  budget_utilization: number;
  personnel_cost: number;
  programming_cost: number;
  operations_cost: number;
  marketing_cost: number;
  next_meeting: {
    date?: string;
    day?: number;
    month?: string;
    time?: string;
    title?: string;
    description?: string;
    attendees?: number;
    zoomPlaceholder?: string;
  };
}

export interface ActionItemRow {
  id: string;
  task: string;
  assignee: string | null;
  due_date: string | null;
  status: string;
}

export async function getLeadershipStats(): Promise<LeadershipStats | null> {
  const { data, error } = await supabase
    .from("leadership_stats")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as LeadershipStats | null;
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
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
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
