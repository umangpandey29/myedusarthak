import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Plus, TrendingUp } from "lucide-react";
import { getSavedReports, type SavedReport } from "@/lib/savedReports";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — MyEduSarthak" }] }),
});

function Dashboard() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  useEffect(() => setReports(getSavedReports()), []);

  const avg = reports.length
    ? (reports.reduce((a, r) => a + parseFloat(r.percentage || "0"), 0) / reports.length).toFixed(2)
    : "0.00";

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <Link to="/">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Report</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Stat icon={<FolderOpen className="w-5 h-5" />} label="Saved Reports" value={String(reports.length)} />
          <Stat icon={<TrendingUp className="w-5 h-5" />} label="Average %" value={`${avg}%`} />
          <Stat icon={<FileText className="w-5 h-5" />} label="Latest" value={reports[0]?.name || "—"} />
        </div>

        <section className="bg-card rounded-xl p-5 border border-border">
          <h2 className="font-semibold text-sm mb-4">Recent Reports</h2>
          {reports.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">
              No reports yet. <Link to="/" className="text-primary underline">Create your first report</Link>.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {reports.slice(0, 5).map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">
                      Class {r.classSec || "—"} • Roll {r.rollNo || "—"} • {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{r.percentage}%</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-base font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
