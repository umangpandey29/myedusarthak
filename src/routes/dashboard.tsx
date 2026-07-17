import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/Counter";
import { Plus, FileText, Users, TrendingUp, Sparkles, ArrowUpRight, Clock, Activity, BookOpen, GraduationCap } from "lucide-react";
import { listReports, REPORTS_QUERY_KEY } from "@/lib/cloudReports";
import { isToday, isWithinDays, bucketByDay } from "@/lib/analytics";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — MyEduSarthak" }] }),
});

function Dashboard() {
  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: REPORTS_QUERY_KEY,
    queryFn: listReports,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const stats = useMemo(() => {
    const classes = new Set(reports.map((r) => r.class_sec).filter(Boolean)).size;
    const today = reports.filter((r) => isToday(r.created_at)).length;
    const week = reports.filter((r) => isWithinDays(r.created_at, 7)).length;
    const avg = reports.length
      ? reports.reduce((s, r) => s + (parseFloat(r.percentage ?? "0") || 0), 0) / reports.length
      : 0;
    return { total: reports.length, classes, today, week, avg };
  }, [reports]);

  const series = useMemo(() => bucketByDay(reports, 14), [reports]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-10 min-w-0 max-w-[1400px] mx-auto w-full">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl hero-grad p-8 lg:p-10 mb-8 animate-fade-up">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative flex items-start justify-between flex-wrap gap-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-[0.15em] mb-4">
                <Sparkles className="w-3 h-3 text-primary" /> Executive Control Center
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                Hello, <span className="text-gradient">Teacher</span>
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base max-w-xl">
                Every marksheet you generate is stored securely and analyzed in real time. Let's make today count.
              </p>
              <div className="flex gap-3 mt-6 flex-wrap">
                <Link to="/">
                  <Button size="lg" className="primary-grad text-white hover:opacity-90 glow rounded-xl h-11">
                    <Plus className="w-4 h-4 mr-1.5" />Create New Report
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button size="lg" variant="outline" className="glass border-white/10 rounded-xl h-11 hover:bg-white/[0.06]">
                    <Activity className="w-4 h-4 mr-1.5" />View Analytics
                  </Button>
                </Link>
              </div>
            </div>
            <div className="glass rounded-2xl p-5 min-w-[220px]">
              <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Today</div>
              <div className="text-4xl font-bold tracking-tight mb-1"><Counter value={stats.today} /></div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                {stats.week} this week
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FileText className="w-4 h-4" />} label="Total Reports" value={stats.total} />
          <StatCard icon={<Users className="w-4 h-4" />} label="Classes Managed" value={stats.classes} />
          <StatCard icon={<Clock className="w-4 h-4" />} label="Last 7 Days" value={stats.week} />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Percentage" value={stats.avg} suffix="%" decimals={1} />
        </div>

        {/* Chart + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold">Report Generation · Last 14 Days</h2>
              <span className="text-[11px] text-muted-foreground">Realtime</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Daily output across your account.</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.17 285)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.17 285)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="oklch(0.6 0.02 270)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.19 0.035 275)", border: "1px solid oklch(0.28 0.04 275)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "oklch(0.9 0.01 260)" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="oklch(0.78 0.16 285)" strokeWidth={2} fill="url(#gradFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold mb-1">Quick Start</h2>
            <Link to="/report/middle" className="group glass rounded-xl p-4 hover:bg-white/[0.06] transition-colors flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Classes 6 – 8</div>
                <div className="text-[11px] text-muted-foreground">Junior report card</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link to="/report/high" className="group glass rounded-xl p-4 hover:bg-white/[0.06] transition-colors flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Classes 9 – 10</div>
                <div className="text-[11px] text-muted-foreground">High-school report</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
            <Link to="/saved" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {loading ? (
            <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
              No reports yet. <Link to="/" className="text-primary underline">Create your first report</Link>.
            </div>
          ) : (
            <div className="glass rounded-2xl divide-y divide-white/5 overflow-hidden">
              {reports.slice(0, 6).map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl primary-grad text-white flex items-center justify-center text-[10px] font-bold shrink-0">{r.report_type === "high" ? "9-10" : "6-8"}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{r.student_name || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">Class {r.class_sec || "—"} · Roll {r.roll_no || "—"}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">{r.percentage}%</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, suffix, decimals }: { icon: React.ReactNode; label: string; value: number; suffix?: string; decimals?: number }) {
  return (
    <div className="glass rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl lg:text-3xl font-bold tracking-tight">
        <Counter value={value} suffix={suffix} decimals={decimals ?? 0} />
      </div>
    </div>
  );
}
