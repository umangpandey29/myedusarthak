import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { Upload, Download, Save, Loader2, FileSpreadsheet } from "lucide-react";
import { MarksheetHigh, computeHighPercentage } from "@/components/MarksheetHigh";
import { HIGH_SUBJECTS, emptyHigh, emptyHighStudent, type HighRow, type HighStudent } from "@/lib/reportTypes";
import { parseFile, downloadCSV, snapshotToPng, buildZip, safeFileName, bulkSaveCloud, pick, isBlankRow, type Row } from "@/lib/aiBulk";

export const Route = createFileRoute("/ai-reports/high")({
  component: AIHigh,
  head: () => ({ meta: [{ title: "AI Bulk Reports 9–10 — MyEduSarthak" }] }),
});

const SUBJ_KEYS = ["hindi", "ganit", "english", "vigyan", "samajik", "sanskrit", "vaikalpik", "khel", "computer"];
const IDENTITY = ["name", "father", "mother", "class_sec", "roll_no", "dob", "session", "janpad_code", "school_code",
  "upper_id", "udise_code", "pen", "aadhaar", "pen_reg", "registration", "elective_choice", "date", "school_name"];
const PER_SUBJ_FIELDS = ["halfmax", "s1", "s2", "s3", "ann", "annmax", "grade"];

function buildHeaders() {
  const h = [...IDENTITY];
  for (const s of SUBJ_KEYS) for (const f of PER_SUBJ_FIELDS) h.push(`${s}_${f}`);
  return h;
}

function rowToStudent(row: Row): { student: HighStudent; rows: HighRow[] } {
  const base = emptyHighStudent();
  const electiveRaw = pick(row, "elective_choice", "elective", "vaikalpik_choice").toLowerCase();
  const elective: "kala" | "computer" = electiveRaw === "computer" ? "computer" : "kala";
  const student: HighStudent = {
    ...base,
    name: pick(row, "name", "student_name", "students_name", "full_name"),
    father: pick(row, "father", "fathers_name", "father_name"),
    mother: pick(row, "mother", "mothers_name", "mother_name"),
    classSec: pick(row, "class_sec", "class_section", "class") + (pick(row, "section") ? " - " + pick(row, "section") : ""),
    rollNo: pick(row, "roll_no", "roll_number", "roll", "rollno"),
    dob: pick(row, "dob", "date_of_birth", "birth_date"),
    session: pick(row, "session", "academic_session", "year") || base.session,
    janpadCode: pick(row, "janpad_code", "district_code"),
    schoolCode: pick(row, "school_code"),
    upperId: pick(row, "upper_id", "upperid"),
    uDiseCode: pick(row, "udise_code", "udise"),
    pen: pick(row, "pen"),
    aadhaar: pick(row, "aadhaar", "aadhar"),
    penReg: pick(row, "pen_reg", "penreg"),
    registration: pick(row, "registration", "registration_number", "admission_number", "admission_no"),
    elective,
    date: pick(row, "date", "report_date") || base.date,
    schoolName: pick(row, "school_name", "school") || base.schoolName,
  };
  const rows: HighRow[] = HIGH_SUBJECTS.map((_, i) => {
    const k = SUBJ_KEYS[i];
    const r = emptyHigh();
    r.halfMax = pick(row, `${k}_halfmax`) || r.halfMax;
    r.s1 = pick(row, `${k}_s1`); r.s2 = pick(row, `${k}_s2`); r.s3 = pick(row, `${k}_s3`);
    r.ann = pick(row, `${k}_ann`); r.annMax = pick(row, `${k}_annmax`) || r.annMax;
    r.grade = pick(row, `${k}_grade`);
    return r;
  });
  return { student, rows };
}

function AIHigh() {
  const [students, setStudents] = useState<{ student: HighStudent; rows: HighRow[] }[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState<"" | "zip" | "save">("");
  const [err, setErr] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setErr(null); setWarnings([]);
    try {
      const rows = (await parseFile(f)).filter((r) => !isBlankRow(r));
      const mapped = rows.map(rowToStudent);
      const warn: string[] = [];
      mapped.forEach((m, idx) => {
        if (!m.student.name) warn.push(`Row ${idx + 2}: missing student name (will be skipped)`);
      });
      const valid = mapped.filter((m) => m.student.name);
      if (valid.length === 0) throw new Error("No valid student rows found. Check the CSV — at least 'name' (or 'student_name') is required.");
      setStudents(valid);
      setWarnings(warn);
      setProgress(0);
    } catch (er) { setErr(er instanceof Error ? er.message : "Could not parse file"); }
  };

  const generatePngs = async () => {
    const out: { filename: string; dataUrl: string; idx: number }[] = [];
    for (let i = 0; i < students.length; i++) {
      const el = refs.current[i]; if (!el) continue;
      const dataUrl = await snapshotToPng(el, "#ffffff");
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
      a.download = `reports-9-10-${Date.now()}.zip`;
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
        const { student, rows } = students[p.idx];
        return {
          report_type: "high",
          student_name: student.name, class_sec: student.classSec, roll_no: student.rollNo,
          session: student.session, percentage: computeHighPercentage(student, rows), image: p.dataUrl,
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
        <h1 className="text-xl font-semibold mb-1">AI Bulk Reports — Classes 9–10</h1>
        <p className="text-sm text-muted-foreground mb-5">Upload a CSV / Excel of students to auto-generate all report cards.</p>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadCSV("template-9-10.csv", buildHeaders())}>
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
                <Button size="sm" onClick={downloadZip} disabled={!!busy}>
                  {busy === "zip" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}Download ZIP
                </Button>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Subjects in order: {SUBJ_KEYS.map((k, i) => `${k}=${HIGH_SUBJECTS[i]}`).join("  •  ")}</div>
            <div>elective_choice must be either <code>kala</code> or <code>computer</code>. Date format: <code>YYYY-MM-DD</code>.</div>
          </div>
          {students.length > 0 && (
            <div className="text-sm">
              <strong>{students.length}</strong> students loaded.
              {busy && <span className="ml-3 text-muted-foreground">Generating {progress}/{students.length}…</span>}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 max-h-24 overflow-auto">
              {warnings.map((w, i) => <div key={i}>{w}</div>)}
            </div>
          )}
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>

        <div style={{ position: "absolute", left: -99999, top: 0 }}>
          {students.map((s, i) => (
            <div key={i} style={{ width: 1100 }}>
              <MarksheetHigh ref={(el) => { refs.current[i] = el; }} student={s.student} rows={s.rows} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
