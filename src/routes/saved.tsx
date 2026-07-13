import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Eye, Calendar, Download, X } from "lucide-react";
import { listReports, deleteCloudReport, type CloudReport } from "@/lib/cloudReports";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved Reports — MyEduSarthak" }] }),
});

function SavedPage() {
  const [reports, setReports] = useState<CloudReport[]>([]);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<CloudReport | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { setReports(await listReports()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      (r.student_name || "").toLowerCase().includes(q) || (r.class_sec || "").toLowerCase().includes(q)
    );
  }, [reports, query]);

  const remove = async (id: string) => { await deleteCloudReport(id); refresh(); };
  const download = (r: CloudReport) => {
    const link = document.createElement("a");
    link.href = r.image; link.download = `${r.student_name || "marksheet"}.png`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-8 min-w-0">

        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-3xl font-bold">Saved Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">All reports you've generated, stored securely in your account.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by student name or class..." className="pl-9 rounded-full bg-white" />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-sm text-muted-foreground shadow-sm">
            No saved reports yet. <Link to="/" className="text-blue-600 underline">Create one</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold uppercase">{r.report_type === "high" ? "9-10" : "6-8"}</div>
                  <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-secondary" aria-label="Delete report">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3">
                  <div className="font-bold text-lg truncate">{r.student_name || "Untitled"}</div>
                  <div className="text-sm text-muted-foreground">Class: {r.class_sec || "—"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar className="w-3 h-3" />{new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="border-t border-border mt-4 pt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">कुल प्रतिशत</div>
                    <div className="text-2xl font-bold">{r.percentage}<span className="text-sm text-muted-foreground font-normal">%</span></div>
                  </div>
                  <Button size="sm" onClick={() => setViewing(r)} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white">
                    <Eye className="w-3.5 h-3.5 mr-1" />View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-semibold">Report</div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => download(viewing)} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Download className="w-4 h-4 mr-1" />Download
                </Button>
                <button onClick={() => setViewing(null)} className="p-2 rounded-md hover:bg-secondary" aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-auto p-4 bg-secondary/30">
              <img src={viewing.image} alt={viewing.student_name ?? ""} className="max-w-full mx-auto rounded shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
