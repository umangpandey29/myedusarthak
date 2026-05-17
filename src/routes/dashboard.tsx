import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Users, TrendingUp } from "lucide-react";
import { getSavedReports, type SavedReport } from "@/lib/savedReports";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — MyEduSarthak" }] }),
});

function Dashboard() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  useEffect(() => setReports(getSavedReports()), []);

  const classes = new Set(reports.map((r) => r.classSec).filter(Boolean)).size;
  const latest = reports[0];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <AppSidebar />
      <main className="flex-1 p-6 lg:p-8">
        {/* Hero */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">Hello, Teacher <span className="inline-block">👋</span></h1>
          <p className="text-white/90 text-sm mb-5">Welcome back to your dashboard. Ready to create some amazing report cards today?</p>
          <Link to="/">
            <Button variant="secondary" className="bg-white text-blue-600 hover:bg-white/90 font-medium">
              <Plus className="w-4 h-4 mr-1" />Create New Report
            </Button>
          </Link>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Copy className="w-5 h-5" />} tint="bg-blue-100 text-blue-600" label="Local Reports" value={reports.length} />
          <StatCard icon={<Users className="w-5 h-5" />} tint="bg-emerald-100 text-emerald-600" label="Classes Managed" value={classes} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} tint="bg-amber-100 text-amber-600" label="Latest Score" value={latest ? `${latest.percentage}%` : 0} />
        </div>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <Link to="/saved" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-sm text-muted-foreground shadow-sm">
              No reports yet. <Link to="/" className="text-blue-600 underline">Create your first report</Link>.
            </div>
          ) : (
            <ul className="space-y-2">
              {reports.slice(0, 5).map((r) => (
                <li key={r.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-lg">?</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{r.name || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">
                        Class: {r.classSec || "—"} · Roll: {r.rollNo || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{r.percentage}%</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${tint}`}>{icon}</div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
