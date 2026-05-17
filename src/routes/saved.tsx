import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Plus } from "lucide-react";
import { getSavedReports, deleteReport, type SavedReport } from "@/lib/savedReports";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({ meta: [{ title: "Saved Reports — MyEduSarthak" }] }),
});

function SavedPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  useEffect(() => setReports(getSavedReports()), []);

  const remove = (id: string) => {
    deleteReport(id);
    setReports(getSavedReports());
  };

  const download = (r: SavedReport) => {
    const link = document.createElement("a");
    link.href = r.image;
    link.download = `${r.name || "marksheet"}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-xl font-semibold">Saved Reports</h1>
          <Link to="/">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Report</Button>
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
            No saved reports yet. <Link to="/" className="text-primary underline">Create one</Link> — it will be saved here automatically when you download.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
                <div className="bg-secondary/40 aspect-[4/3] overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <div className="font-medium text-sm truncate">{r.name || "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">
                    Class {r.classSec || "—"} • Roll {r.rollNo || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()} • {r.percentage}%
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => download(r)}>
                      <Download className="w-3.5 h-3.5 mr-1" />Download
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
