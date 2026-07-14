import { supabase } from "@/integrations/supabase/client";
import type { CloudReport } from "@/lib/cloudReports";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  assigned_classes: string[];
  assigned_sections: string[];
};

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("id, full_name, email, assigned_classes, assigned_sections");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function listAllReports(): Promise<CloudReport[]> {
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudReport[];
}

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const isToday = (iso: string) => startOfDay(new Date(iso)).getTime() === startOfDay(new Date()).getTime();
export const isWithinDays = (iso: string, days: number) => (Date.now() - new Date(iso).getTime()) < days * 86400000;

export function bucketByDay(reports: { created_at: string }[], days: number) {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  reports.forEach((r) => {
    const key = new Date(r.created_at).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([date, count]) => ({
    date,
    label: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count,
  }));
}
