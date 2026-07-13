import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, RotateCcw, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { saveCloudReport } from "@/lib/cloudReports";
import { MarksheetMiddle } from "@/components/MarksheetMiddle";
import {
  MIDDLE_SUBJECTS as SUBJECTS, MIDDLE_KHEL_INDEX as KHEL_INDEX,
  emptyMiddle as emptyMarks, emptyMiddleStudent,
  type MiddleMarks as SubjectMarks, autoGradeMiddle as autoGrade, num as n,
} from "@/lib/reportTypes";

export const Route = createFileRoute("/report/middle")({
  component: CreateMiddle,
  head: () => ({ meta: [{ title: "Class 6–8 Report — MyEduSarthak" }] }),
});

function CreateMiddle() {
  const [student, setStudent] = useState(emptyMiddleStudent());
  const [marks, setMarks] = useState<SubjectMarks[]>(SUBJECTS.map(emptyMarks));
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => marks.map((m) => {
    const halfObtained = n(m.h1) + n(m.h2) + n(m.hPrac) + n(m.hHalf);
    const annObtained = n(m.a1) + n(m.a2) + n(m.aPrac) + n(m.aAnn);
    return { halfObtained, annObtained, totalObtained: halfObtained + annObtained, totalMax: n(m.hMax) + n(m.aMax) };
  }), [marks]);

  const khelGrade = useMemo(() => autoGrade(rows[KHEL_INDEX].totalObtained, rows[KHEL_INDEX].totalMax), [rows]);

  const grand = useMemo(() => rows.reduce(
    (acc, r, idx) => idx === KHEL_INDEX ? acc : ({
      obtained: acc.obtained + r.totalObtained, max: acc.max + r.totalMax,
      halfObtained: acc.halfObtained + r.halfObtained, halfMax: acc.halfMax + n(marks[idx].hMax),
      annObtained: acc.annObtained + r.annObtained, annMax: acc.annMax + n(marks[idx].aMax),
    }),
    { obtained: 0, max: 0, halfObtained: 0, halfMax: 0, annObtained: 0, annMax: 0 }
  ), [rows, marks]);

  const percentage = grand.max > 0 ? ((grand.obtained / grand.max) * 100).toFixed(2) : "0.00";

  const updateMark = (i: number, field: keyof SubjectMarks, value: string) =>
    setMarks((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const reset = () => {
    setMarks(SUBJECTS.map(emptyMarks));
    setStudent(emptyMiddleStudent());
  };

  const download = async () => {
    if (!sheetRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const node = sheetRef.current;
      const w = Math.max(node.scrollWidth, node.offsetWidth);
      const h = Math.max(node.scrollHeight, node.offsetHeight);
      const dataUrl = await toPng(node, {
        pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true,
        width: w, height: h,
        style: { transform: "none", width: `${w}px`, height: `${h}px` },
      });
      const link = document.createElement("a");
      link.download = `${student.name || "marksheet"}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      try {
        await saveCloudReport({
          report_type: "middle",
          student_name: student.name, class_sec: student.classSec, roll_no: student.rollNo,
          session: student.session, percentage, image: dataUrl,
        });
      } catch (e) { console.error("Cloud save failed", e); }
    } catch (err) { console.error(err); alert("Could not generate the report image."); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Create Report — Classes 6–8</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
            <Button size="sm" onClick={download} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}Save & Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <div className="space-y-6">
            <section className="bg-card rounded-xl p-5 border border-border">
              <h2 className="font-semibold text-primary mb-4 text-sm tracking-wide">1. STUDENT RECORDS</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Student Name" value={student.name} onChange={(v) => setStudent({ ...student, name: v })} />
                <Field label="Roll No" value={student.rollNo} onChange={(v) => setStudent({ ...student, rollNo: v })} />
                <Field label="Father's Name" value={student.father} onChange={(v) => setStudent({ ...student, father: v })} />
                <Field label="Mother's Name" value={student.mother} onChange={(v) => setStudent({ ...student, mother: v })} />
                <Field label="Class & Sec" value={student.classSec} onChange={(v) => setStudent({ ...student, classSec: v })} />
                <Field label="SR. No" value={student.srNo} onChange={(v) => setStudent({ ...student, srNo: v })} />
                <Field label="Date of Birth" type="date" value={student.dob} onChange={(v) => setStudent({ ...student, dob: v })} />
                <Field label="Session" value={student.session} onChange={(v) => setStudent({ ...student, session: v })} />
                <Field label="Janpad Code" value={student.janpadCode} onChange={(v) => setStudent({ ...student, janpadCode: v })} />
                <Field label="School Code" value={student.schoolCode} onChange={(v) => setStudent({ ...student, schoolCode: v })} />
                <div className="col-span-2">
                  <Field label="School Name" value={student.schoolName} onChange={(v) => setStudent({ ...student, schoolName: v })} />
                </div>
              </div>
            </section>

            <section className="bg-card rounded-xl p-5 border border-border">
              <h2 className="font-semibold text-primary mb-4 text-sm tracking-wide">2. EXAMINATION MARKS (अंक-पत्र)</h2>
              <div className="space-y-4">
                {SUBJECTS.map((s, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 bg-secondary/30">
                    <div className="font-medium text-sm mb-2">{i + 1}. {s}</div>
                    <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">अर्धवार्षिक (Half-Yearly)</div>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      <SmallInput placeholder="1st" value={marks[i].h1} onChange={(v) => updateMark(i, "h1", v)} />
                      <SmallInput placeholder="2nd" value={marks[i].h2} onChange={(v) => updateMark(i, "h2", v)} />
                      <SmallInput placeholder="Prac" value={marks[i].hPrac} onChange={(v) => updateMark(i, "hPrac", v)} />
                      <SmallInput placeholder="Half" value={marks[i].hHalf} onChange={(v) => updateMark(i, "hHalf", v)} />
                      <SmallInput placeholder="Max" value={marks[i].hMax} onChange={(v) => updateMark(i, "hMax", v)} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">वार्षिक (Annual)</div>
                    <div className="grid grid-cols-5 gap-1.5 mb-3">
                      <SmallInput placeholder="3rd" value={marks[i].a1} onChange={(v) => updateMark(i, "a1", v)} />
                      <SmallInput placeholder="4th" value={marks[i].a2} onChange={(v) => updateMark(i, "a2", v)} />
                      <SmallInput placeholder="Prac" value={marks[i].aPrac} onChange={(v) => updateMark(i, "aPrac", v)} />
                      <SmallInput placeholder="Ann" value={marks[i].aAnn} onChange={(v) => updateMark(i, "aAnn", v)} />
                      <SmallInput placeholder="Max" value={marks[i].aMax} onChange={(v) => updateMark(i, "aMax", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-primary/10 rounded px-2 py-1.5 text-xs font-semibold text-primary text-center">
                        Total: {rows[i].totalObtained}/{rows[i].totalMax}
                      </div>
                      <Input className="h-8 text-xs" placeholder={i === KHEL_INDEX ? "Auto-graded" : "Grade (A1, B2…)"}
                        value={i === KHEL_INDEX ? khelGrade : marks[i].grade}
                        disabled={i === KHEL_INDEX}
                        onChange={(e) => updateMark(i, "grade", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div>
            <MarksheetMiddle ref={sheetRef} student={student} marks={marks} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}

function SmallInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 text-xs px-1.5 text-center" />;
}
