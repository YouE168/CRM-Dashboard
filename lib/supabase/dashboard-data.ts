// lib/supabase/dashboard-data.ts
import { supabase } from './client';

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

export interface Program {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  progress: number;
  icon: string;
  color: string;
  contact_email: string;
  contact_phone: string;
  managed_by: string;
  resource_categories: string[];
}

export interface Participant {
  id: string;
  email: string;
  name: string;
  program_id: string;
  program_name: string;
  mentor: string;
  status: string;
  joined_at: string;
}

export interface AnalyticsDataPoint {
  program_id: string;
  county: string;
  date_range: string;
  value: number;
}

export interface SessionPerMonth {
  month: string;
  sessions: number;
}

export interface ClientByCounty {
  county: string;
  count: number;
}

export interface ClientByProgram {
  program_name: string;
  count: number;
}

export interface OutcomeKPI {
  key: string;
  value: number;
  change: number;
  label: string;
  icon: string;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

export async function fetchOverviewStats(): Promise<OverviewStats | null> {
  const { data, error } = await supabase
    .from('overview_stats')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching overview stats:', error);
    return null;
  }
  return data;
}

export async function fetchPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
  return data || [];
}

export async function fetchParticipants(): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching participants:', error);
    return [];
  }
  return data || [];
}

export async function fetchAnalyticsData(): Promise<AnalyticsDataPoint[]> {
  const { data, error } = await supabase
    .from('analytics_data')
    .select('*');

  if (error) {
    console.error('Error fetching analytics data:', error);
    return [];
  }
  return data || [];
}

export async function fetchSessionsPerMonth(): Promise<SessionPerMonth[]> {
  const { data, error } = await supabase
    .from('sessions_per_month')
    .select('*')
    .order('month');

  if (error) {
    console.error('Error fetching sessions per month:', error);
    return [];
  }
  return data || [];
}

export async function fetchClientsByCounty(): Promise<ClientByCounty[]> {
  const { data, error } = await supabase
    .from('clients_by_county')
    .select('*')
    .order('count', { ascending: false });

  if (error) {
    console.error('Error fetching clients by county:', error);
    return [];
  }
  return data || [];
}

export async function fetchClientsByProgram(): Promise<ClientByProgram[]> {
  const { data, error } = await supabase
    .from('clients_by_program')
    .select('*')
    .order('count', { ascending: false });

  if (error) {
    console.error('Error fetching clients by program:', error);
    return [];
  }
  return data || [];
}

export async function fetchOutcomeKPIs(): Promise<OutcomeKPI[]> {
  const { data, error } = await supabase
    .from('outcome_kpis')
    .select('*')
    .order('value', { ascending: false });

  if (error) {
    console.error('Error fetching outcome KPIs:', error);
    return [];
  }
  return data || [];
}

export async function fetchUserPrograms(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, programs(name)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user programs:', error);
    return [];
  }
  return data || [];
}

export async function updateOverviewStats(stats: Partial<OverviewStats>): Promise<boolean> {
  const { error } = await supabase
    .from('overview_stats')
    .update(stats)
    .eq('id', (await supabase.from('overview_stats').select('id').limit(1).single()).data?.id);

  if (error) {
    console.error('Error updating overview stats:', error);
    return false;
  }
  return true;
}

export async function updateProgram(programId: string, updates: Partial<Program>): Promise<boolean> {
  const { error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', programId);

  if (error) {
    console.error('Error updating program:', error);
    return false;
  }
  return true;
}

export async function addParticipant(participant: Partial<Participant>): Promise<Participant | null> {
  const { data, error } = await supabase
    .from('participants')
    .insert(participant)
    .select()
    .single();

  if (error) {
    console.error('Error adding participant:', error);
    return null;
  }
  return data;
}

export async function updateParticipant(participantId: string, updates: Partial<Participant>): Promise<boolean> {
  const { error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', participantId);

  if (error) {
    console.error('Error updating participant:', error);
    return false;
  }
  return true;
}

export async function deleteParticipant(participantId: string): Promise<boolean> {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', participantId);

  if (error) {
    console.error('Error deleting participant:', error);
    return false;
  }
  return true;
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export async function approveProgramForUser(userId: string, programId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_programs')
    .upsert({
      user_id: userId,
      program_id: programId,
      approved: true,
      approved_at: new Date().toISOString(),
    }, { onConflict: 'user_id,program_id' });

  if (error) {
    console.error('Error approving program for user:', error);
    return false;
  }
  return true;
}

export async function revokeProgramAccess(userId: string, programId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_programs')
    .update({ approved: false, approved_at: null })
    .eq('user_id', userId)
    .eq('program_id', programId);

  if (error) {
    console.error('Error revoking program access:', error);
    return false;
  }
  return true;
}

export async function getApprovedPrograms(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('programs(name)')
    .eq('user_id', userId)
    .eq('approved', true);

  if (error) {
    console.error('Error getting approved programs:', error);
    return [];
  }
  return data.map((item: any) => item.programs?.name).filter(Boolean);
}