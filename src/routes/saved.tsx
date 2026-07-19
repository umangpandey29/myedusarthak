import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Eye, Calendar, Download, X, FolderOpen, Pencil } from "lucide-react";
import { listReports, deleteCloudReport, REPORTS_QUERY_KEY, type CloudReport } from "@/lib/cloudReports";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved Reports — MyEduSarthak" }] }),
});

function SavedPage() {
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<CloudReport | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const edit = (r: CloudReport) => navigate({
    to: r.report_type === "high" ? "/report/high" : "/report/middle",
    search: { edit: r.id } as any,
  });
  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: REPORTS_QUERY_KEY,
    queryFn: listReports,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      (r.student_name || "").toLowerCase().includes(q) || (r.class_sec || "").toLowerCase().includes(q)
    );
  }, [reports, query]);

  const remove = async (id: string) => { await deleteCloudReport(id); qc.invalidateQueries({ queryKey: REPORTS_QUERY_KEY }); };
  const download = (r: CloudReport) => {
    const link = document.createElement("a");
    link.href = r.image; link.download = `${r.student_name || "marksheet"}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-10 min-w-0 max-w-[1400px] mx-auto w-full">

        <div className="flex items-end justify-between gap-4 flex-wrap mb-8 animate-fade-up">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-[0.15em] mb-3">
              <FolderOpen className="w-3 h-3 text-primary" /> Vault
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Saved <span className="text-gradient">Reports</span></h1>
            <p className="text-sm text-muted-foreground mt-1">All reports you've generated, stored securely in your account.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or class…"
              className="pl-10 h-11 rounded-xl glass border-white/10" />
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-14 text-center text-sm text-muted-foreground">
            No saved reports yet. <Link to="/" className="text-primary underline">Create one</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5 hover:bg-white/[0.05] hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="px-2.5 py-1 rounded-lg primary-grad text-white text-[10px] font-bold tracking-wider">{r.report_type === "high" ? "CLASS 9-10" : "CLASS 6-8"}</div>
                  <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-white/5" aria-label="Delete report">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="font-bold text-lg tracking-tight truncate">{r.student_name || "Untitled"}</div>
                <div className="text-xs text-muted-foreground">Class {r.class_sec || "—"} · Roll {r.roll_no || "—"}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
                  <Calendar className="w-3 h-3" />{new Date(r.created_at).toLocaleDateString()}
                </div>
                <div className="border-t border-white/5 mt-4 pt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">कुल प्रतिशत</div>
                    <div className="text-2xl font-bold tracking-tight">{r.percentage}<span className="text-sm text-muted-foreground font-normal">%</span></div>
                  </div>
                  <Button size="sm" onClick={() => setViewing(r)} className="rounded-xl primary-grad text-white hover:opacity-90">
                    <Eye className="w-3.5 h-3.5 mr-1" />View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {viewing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up" onClick={() => setViewing(null)}>
          <div className="glass-strong rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="font-semibold text-sm">{viewing.student_name || "Report"}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => download(viewing)} className="primary-grad text-white hover:opacity-90 rounded-lg">
                  <Download className="w-4 h-4 mr-1" />Download
                </Button>
                <button onClick={() => setViewing(null)} className="p-2 rounded-md hover:bg-white/5" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-auto p-4 bg-black/30">
              <img src={viewing.image} alt={viewing.student_name ?? ""} className="max-w-full mx-auto rounded shadow-2xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
