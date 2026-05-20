import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { Upload, Download, Save, Loader2, FileSpreadsheet } from "lucide-react";
import { MarksheetMiddle, computeMiddlePercentage } from "@/components/MarksheetMiddle";
import { MIDDLE_SUBJECTS, emptyMiddle, emptyMiddleStudent, type MiddleMarks, type MiddleStudent } from "@/lib/reportTypes";
import { parseFile, downloadCSV, snapshotToPng, buildZip, safeFileName, bulkSaveCloud, type Row } from "@/lib/aiBulk";

export const Route = createFileRoute("/ai-reports/middle")({
  component: AIMiddle,
  head: () => ({ meta: [{ title: "AI Bulk Reports 6–8 — MyEduSarthak" }] }),
});

const SUBJ_KEYS = ["hindi", "ganit", "english", "samajik", "sanskrit", "craft", "elective", "vigyan", "khel", "paryavaran", "computer"];
const IDENTITY = ["name", "father", "mother", "class_sec", "roll_no", "dob", "session", "janpad_code", "school_code", "sr_no", "school_name"];
const PER_SUBJ_FIELDS = ["h1", "h2", "hprac", "hhalf", "hmax", "a1", "a2", "aprac", "aann", "amax", "grade"];

function buildHeaders() {
  const h = [...IDENTITY];
  for (const s of SUBJ_KEYS) for (const f of PER_SUBJ_FIELDS) h.push(`${s}_${f}`);
  return h;
}

function rowToStudent(row: Row): { student: MiddleStudent; marks: MiddleMarks[] } {
  const base = emptyMiddleStudent();
  const student: MiddleStudent = {
    ...base,
    name: row.name || "", father: row.father || "", mother: row.mother || "",
    classSec: row.class_sec || "", rollNo: row.roll_no || "", dob: row.dob || "",
    session: row.session || base.session, janpadCode: row.janpad_code || "",
    schoolCode: row.school_code || "", srNo: row.sr_no || "",
    schoolName: row.school_name || base.schoolName,
  };
  const marks: MiddleMarks[] = MIDDLE_SUBJECTS.map((_, i) => {
    const k = SUBJ_KEYS[i];
    const m = emptyMiddle();
    m.h1 = row[`${k}_h1`] || ""; m.h2 = row[`${k}_h2`] || ""; m.hPrac = row[`${k}_hprac`] || "";
    m.hHalf = row[`${k}_hhalf`] || ""; m.hMax = row[`${k}_hmax`] || m.hMax;
    m.a1 = row[`${k}_a1`] || ""; m.a2 = row[`${k}_a2`] || ""; m.aPrac = row[`${k}_aprac`] || "";
    m.aAnn = row[`${k}_aann`] || ""; m.aMax = row[`${k}_amax`] || m.aMax;
    m.grade = row[`${k}_grade`] || "";
    return m;
  });
  return { student, marks };
}

function AIMiddle() {
  const [students, setStudents] = useState<{ student: MiddleStudent; marks: MiddleMarks[] }[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState<"" | "zip" | "save">("");
  const [err, setErr] = useState<string | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setErr(null);
    try {
      const rows = await parseFile(f);
      setStudents(rows.map(rowToStudent));
      setProgress(0);
    } catch (er) { setErr(er instanceof Error ? er.message : "Could not parse file"); }
  };

  const generatePngs = async () => {
    const out: { filename: string; dataUrl: string; idx: number }[] = [];
    for (let i = 0; i < students.length; i++) {
      const el = refs.current[i]; if (!el) continue;
      const dataUrl = await snapshotToPng(el, "#fef9c3");
      const s = students[i].student;
      out.push({ filename: `${safeFileName(s.rollNo || String(i + 1))}-${safeFileName(s.name)}.png`, dataUrl, idx: i });
      setProgress(i + 1);
    }
    return out;
  };

  const downloadZip = async () => {
    if (students.length === 0) return;
    setBusy("zip"); setProgress(0);
    try {
      const pngs = await generatePngs();
      const blob = await buildZip(pngs);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `reports-6-8-${Date.now()}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { setErr(e instanceof Error ? e.message : "ZIP failed"); }
    finally { setBusy(""); }
  };

  const saveAll = async () => {
    if (students.length === 0) return;
    setBusy("save"); setProgress(0);
    try {
      const pngs = await generatePngs();
      await bulkSaveCloud(pngs.map((p) => {
        const { student, marks } = students[p.idx];
        return {
          report_type: "middle",
          student_name: student.name, class_sec: student.classSec, roll_no: student.rollNo,
          session: student.session, percentage: computeMiddlePercentage(marks), image: p.dataUrl,
        };
      }));
      alert(`Saved ${pngs.length} reports to your account.`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(""); }
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <h1 className="text-xl font-semibold mb-1">AI Bulk Reports — Classes 6–8</h1>
        <p className="text-sm text-muted-foreground mb-5">Upload a CSV / Excel of students to auto-generate all report cards.</p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCSV("template-6-8.csv", buildHeaders())}>
              <FileSpreadsheet className="w-4 h-4 mr-1" />Download CSV template
            </Button>
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-input cursor-pointer hover:bg-secondary">
              <Upload className="w-4 h-4" />Upload CSV / Excel
              <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={onFile} />
            </label>
            {students.length > 0 && (
              <>
                <Button size="sm" onClick={saveAll} disabled={!!busy}>
                  {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Save Reports
                </Button>
                <Button size="sm" variant="default" onClick={downloadZip} disabled={!!busy}>
                  {busy === "zip" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}Download ZIP
                </Button>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Subjects in order: {SUBJ_KEYS.map((k, i) => `${k} = ${MIDDLE_SUBJECTS[i]}`).join("  •  ")}
          </div>
          {students.length > 0 && (
            <div className="text-sm">
              <strong>{students.length}</strong> students loaded.
              {busy && <span className="ml-3 text-muted-foreground">Generating {progress}/{students.length}…</span>}
            </div>
          )}
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>

        {/* Off-screen render of all marksheets */}
        <div style={{ position: "absolute", left: -99999, top: 0 }}>
          {students.map((s, i) => (
            <div key={i} style={{ width: 1100 }}>
              <MarksheetMiddle ref={(el) => { refs.current[i] = el; }} student={s.student} marks={s.marks} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
