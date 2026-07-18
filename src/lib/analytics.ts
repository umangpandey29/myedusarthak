import { supabase } from "@/integrations/supabase/client";

export type LeaderboardRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  report_count: number;
  last_login_at: string | null;
  last_active_at: string | null;
  login_count: number;
};

export type SchoolSummary = {
  total_teachers: number;
  active_today: number;
  total_reports: number;
  reports_today: number;
  reports_week: number;
  reports_month: number;
};

export type DailyTotal = { day: string; count: number };

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("analytics_teacher_leaderboard");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, report_count: Number(r.report_count), login_count: Number(r.login_count ?? 0) }));
}

export async function fetchSchoolSummary(): Promise<SchoolSummary> {
  const { data, error } = await supabase.rpc("analytics_school_summary");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_teachers: Number(row?.total_teachers ?? 0),
    active_today: Number(row?.active_today ?? 0),
    total_reports: Number(row?.total_reports ?? 0),
    reports_today: Number(row?.reports_today ?? 0),
    reports_week: Number(row?.reports_week ?? 0),
    reports_month: Number(row?.reports_month ?? 0),
  };
}

export async function fetchDailyTotals(days = 30): Promise<DailyTotal[]> {
  const { data, error } = await supabase.rpc("analytics_daily_totals", { _days: days });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ day: r.day, count: Number(r.count) }));
}

export async function recordLogin(): Promise<void> {
  try { await supabase.rpc("record_login"); } catch (e) { console.warn("record_login failed", e); }
}
export async function touchActive(): Promise<void> {
  try { await supabase.rpc("touch_active"); } catch { /* noop */ }
}

// Query keys
export const LEADERBOARD_KEY = ["analytics", "leaderboard"] as const;
export const SUMMARY_KEY = ["analytics", "summary"] as const;
export const DAILY_KEY = (days: number) => ["analytics", "daily", days] as const;

// Helper for filling missing days
export function fillDaily(rows: DailyTotal[], days: number) {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  rows.forEach((r) => { if (map.has(r.day)) map.set(r.day, r.count); });
  return Array.from(map.entries()).map(([date, count]) => ({
    date, count,
    label: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));
}
