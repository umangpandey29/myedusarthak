import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Eye, Calendar, Download, X } from "lucide-react";
import { getSavedReports, deleteReport, type SavedReport } from "@/lib/savedReports";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved Reports — MyEduSarthak" }] }),
});

function SavedPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<SavedReport | null>(null);

  useEffect(() => setReports(getSavedReports()), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      (r.name || "").toLowerCase().includes(q) || (r.classSec || "").toLowerCase().includes(q)
    );
  }, [reports, query]);

  const remove = (id: string) => {
    deleteReport(id);
    setReports(getSavedReports());
  };

  const download = (r: SavedReport) => {
    const link = document.createElement("a");
    link.href = r.image;
    link.download = `${r.name || "marksheet"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <AppSidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-3xl font-bold">Saved Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage and access all your generated student records locally.</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name or class..."
              className="pl-9 rounded-full bg-white"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-sm text-muted-foreground shadow-sm">
            No saved reports yet. <Link to="/" className="text-blue-600 underline">Create one</Link> — it will be saved here automatically when you download.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-lg font-bold">?</div>
                  <button
                    onClick={() => remove(r.id)}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-secondary"
                    aria-label="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3">
                  <div className="font-bold text-lg truncate">{r.name || "Untitled"}</div>
                  <div className="text-sm text-muted-foreground">Class: {r.classSec || "—"}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="border-t border-border mt-4 pt-3 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Marks (सम्पूर्ण योग)</div>
                    <div className="text-2xl font-bold">{r.percentage}<span className="text-sm text-muted-foreground font-normal">%</span></div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setViewing(r)}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />View Card
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {viewing && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="font-semibold">Report</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => download(viewing)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />Download
                </Button>
                <button
                  onClick={() => setViewing(null)}
                  className="p-2 rounded-md hover:bg-secondary"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-4 bg-secondary/30">
              <img src={viewing.image} alt={viewing.name} className="max-w-full mx-auto rounded shadow" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
