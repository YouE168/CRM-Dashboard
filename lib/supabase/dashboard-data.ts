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
