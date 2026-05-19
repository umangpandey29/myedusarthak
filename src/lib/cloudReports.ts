import { supabase } from "@/integrations/supabase/client";

export type CloudReport = {
  id: string;
  user_id: string;
  report_type: string;
  student_name: string | null;
  class_sec: string | null;
  roll_no: string | null;
  session: string | null;
  percentage: string | null;
  image: string;
  created_at: string;
};

export async function listReports(): Promise<CloudReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CloudReport[];
}

export async function saveCloudReport(input: {
  report_type: "middle" | "high";
  student_name: string;
  class_sec: string;
  roll_no: string;
  session: string;
  percentage: string;
  image: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("reports").insert({
    ...input,
    user_id: user.id,
  });
  if (error) throw error;
}

export async function deleteCloudReport(id: string) {
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw error;
}
