import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Counter } from "@/components/Counter";
import { listAllReports, listProfiles, bucketByDay, type Profile } from "@/lib/analytics";
import type { CloudReport } from "@/lib/cloudReports";
import { BarChart3, Trophy, Users, FileText, TrendingUp, Medal, Crown, Award } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Teacher Analytics — MyEduSarthak" }] }),
});

type Row = {
  id: string;
  name: string;
  email: string;
  classes: string;
  count: number;
  avgPct: number;
};

function AnalyticsPage() {
  const [reports, setReports] = useState<CloudReport[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAllReports(), listProfiles()])
      .then(([r, p]) => { setReports(r); setProfiles(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo<Row[]>(() => {
    const profById = new Map(profiles.map((p) => [p.id, p]));
    // include teachers who have profiles OR who appear as authors in reports
    const authorIds = new Set([...profiles.map((p) => p.id), ...reports.map((r) => r.user_id)]);
    return Array.from(authorIds).map((id) => {
      const p = profById.get(id);
      const mine = reports.filter((r) => r.user_id === id);
      const pcts = mine.map((r) => parseFloat(r.percentage ?? "0") || 0).filter((n) => n > 0);
      const avgPct = pcts.length ? pcts.reduce((s, n) => s + n, 0) / pcts.length : 0;
      const classes = p?.assigned_classes?.length
        ? p.assigned_classes.join(", ")
        : Array.from(new Set(mine.map((m) => m.class_sec).filter(Boolean))).slice(0, 4).join(", ") || "—";
      return {
        id,
        name: p?.full_name || p?.email?.split("@")[0] || "Teacher",
        email: p?.email || "—",
        classes,
        count: mine.length,
        avgPct,
      };
    }).sort((a, b) => b.count - a.count);
  }, [reports, profiles]);

  const totals = useMemo(() => ({
    teachers: rows.length,
    reports: reports.length,
    active: rows.filter((r) => r.count > 0).length,
    avg: rows.length ? rows.reduce((s, r) => s + r.avgPct, 0) / Math.max(1, rows.filter((r) => r.avgPct > 0).length) : 0,
  }), [rows, reports]);

  const series = useMemo(() => bucketByDay(reports, 30), [reports]);
  const top5 = rows.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-10 min-w-0 max-w-[1400px] mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-[0.15em] mb-3">
            <BarChart3 className="w-3 h-3 text-primary" /> Teacher Reports & Analytics
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Performance <span className="text-gradient">Overview</span></h1>
          <p className="text-sm text-muted-foreground">Cross-teacher activity, output, and average class performance in real time.</p>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Loading analytics…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Kpi icon={<Users className="w-4 h-4" />} label="Teachers" value={totals.teachers} />
              <Kpi icon={<FileText className="w-4 h-4" />} label="Total Reports" value={totals.reports} />
              <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Active Teachers" value={totals.active} />
              <Kpi icon={<Trophy className="w-4 h-4" />} label="Avg %" value={totals.avg} decimals={1} suffix="%" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-6">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold mb-1">Reports Generated · Last 30 Days</h2>
                <p className="text-xs text-muted-foreground mb-4">Aggregated across all teachers.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" stroke="oklch(0.6 0.02 270)" fontSize={10} tickLine={false} axisLine={false} interval={3} />
                      <YAxis stroke="oklch(0.6 0.02 270)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                        contentStyle={{ background: "oklch(0.19 0.035 275)", border: "1px solid oklch(0.28 0.04 275)", borderRadius: 12, fontSize: 12 }}
                      />
                      <Bar dataKey="count" fill="oklch(0.72 0.17 285)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Top Contributors</h2>
                {top5.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No activity yet.</div>
                ) : (
                  <ol className="space-y-3">
                    {top5.map((r, i) => (
                      <li key={r.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          i === 0 ? "bg-amber-400/20 text-amber-300" :
                          i === 1 ? "bg-slate-300/20 text-slate-200" :
                          i === 2 ? "bg-orange-500/20 text-orange-300" :
                          "bg-white/5 text-muted-foreground"
                        }`}>{i === 0 ? <Crown className="w-4 h-4" /> : i === 1 ? <Medal className="w-4 h-4" /> : i === 2 ? <Award className="w-4 h-4" /> : `#${i + 1}`}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{r.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{r.email}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold">{r.count}</div>
                          <div className="text-[10px] text-muted-foreground">reports</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Leaderboard table */}
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5">
                <h2 className="text-sm font-semibold">Full Leaderboard</h2>
                <p className="text-xs text-muted-foreground">Ranked by total reports generated.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground bg-white/[0.02]">
                      <th className="text-left px-5 py-3 font-medium">Rank</th>
                      <th className="text-left px-5 py-3 font-medium">Teacher</th>
                      <th className="text-left px-5 py-3 font-medium">Assigned Classes</th>
                      <th className="text-right px-5 py-3 font-medium">Reports</th>
                      <th className="text-right px-5 py-3 font-medium">Avg %</th>
                      <th className="text-right px-5 py-3 font-medium pr-6">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-xs text-muted-foreground">No teachers yet.</td></tr>
                    ) : rows.map((r, i) => {
                      const score = r.count * 10 + Math.round(r.avgPct);
                      return (
                        <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3">
                            <span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-bold ${
                              i === 0 ? "bg-amber-400/20 text-amber-300" :
                              i === 1 ? "bg-slate-300/15 text-slate-200" :
                              i === 2 ? "bg-orange-500/20 text-orange-300" : "bg-white/5 text-muted-foreground"
                            }`}>{i + 1}</span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-medium">{r.name}</div>
                            <div className="text-[10px] text-muted-foreground">{r.email}</div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-xs max-w-[220px] truncate">{r.classes}</td>
                          <td className="px-5 py-3 text-right font-semibold">{r.count}</td>
                          <td className="px-5 py-3 text-right">{r.avgPct.toFixed(1)}%</td>
                          <td className="px-5 py-3 text-right pr-6">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-primary/15 text-primary text-xs font-semibold">{score}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ icon, label, value, suffix, decimals }: { icon: React.ReactNode; label: string; value: number; suffix?: string; decimals?: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-3">{icon}</div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl lg:text-3xl font-bold tracking-tight"><Counter value={value} suffix={suffix} decimals={decimals ?? 0} /></div>
    </div>
  );
}
