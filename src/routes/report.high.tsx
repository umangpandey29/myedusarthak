import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, RotateCcw, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { saveCloudReport } from "@/lib/cloudReports";
import { MarksheetHigh, computeHighPercentage } from "@/components/MarksheetHigh";
import {
  HIGH_SUBJECTS, HIGH_KHEL_INDEX, emptyHigh, emptyHighStudent,
  type HighRow, autoGradeHigh, isHighExcluded, num,
} from "@/lib/reportTypes";

export const Route = createFileRoute("/report/high")({
  component: CreateHigh,
  head: () => ({ meta: [{ title: "Class 9–10 Report — MyEduSarthak" }] }),
});

function CreateHigh() {
  const [student, setStudent] = useState(emptyHighStudent());
  const [rows, setRows] = useState<HighRow[]>(HIGH_SUBJECTS.map(emptyHigh));
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const update = (i: number, f: keyof HighRow, v: string) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const reset = () => setRows(HIGH_SUBJECTS.map(emptyHigh));

  const download = async () => {
    if (!sheetRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(sheetRef.current, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
      const link = document.createElement("a");
      link.download = `${student.name || "marksheet-9-10"}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      try {
        await saveCloudReport({
          report_type: "high",
          student_name: student.name, class_sec: student.classSec, roll_no: student.rollNo,
          session: student.session, percentage: computeHighPercentage(student, rows), image: dataUrl,
        });
      } catch (e) { console.error("Cloud save failed", e); }
    } catch (err) { console.error(err); alert("Could not generate image."); }
    finally { setSaving(false); }
  };

  // Per-row computed view for sidebar totals
  const totals = (i: number) => {
    const samiya = num(rows[i].s1) + num(rows[i].s2) + num(rows[i].s3);
    const totalObtained = samiya + num(rows[i].ann);
    const totalMax = num(rows[i].halfMax) + num(rows[i].annMax);
    return { totalObtained, totalMax };
  };
  const khelGrade = autoGradeHigh(totals(HIGH_KHEL_INDEX).totalObtained, totals(HIGH_KHEL_INDEX).totalMax);

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-xl font-semibold">Create Report — Classes 9–10</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
            <Button size="sm" onClick={download} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}Save & Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <div className="space-y-6">
            <section className="bg-card rounded-xl p-5 border border-border">
              <h2 className="font-semibold text-primary mb-4 text-sm tracking-wide">STUDENT RECORDS</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Student Name" value={student.name} onChange={(v) => setStudent({ ...student, name: v })} />
                <Field label="Roll No (अनुक्रमांक)" value={student.rollNo} onChange={(v) => setStudent({ ...student, rollNo: v })} />
                <Field label="Father's Name" value={student.father} onChange={(v) => setStudent({ ...student, father: v })} />
                <Field label="Mother's Name" value={student.mother} onChange={(v) => setStudent({ ...student, mother: v })} />
                <Field label="Class & Sec" value={student.classSec} onChange={(v) => setStudent({ ...student, classSec: v })} />
                <Field label="Date of Birth" type="date" value={student.dob} onChange={(v) => setStudent({ ...student, dob: v })} />
                <Field label="Session" value={student.session} onChange={(v) => setStudent({ ...student, session: v })} />
                <Field label="Janpad Code" value={student.janpadCode} onChange={(v) => setStudent({ ...student, janpadCode: v })} />
                <Field label="School Code" value={student.schoolCode} onChange={(v) => setStudent({ ...student, schoolCode: v })} />
                <Field label="Upper आई.डी." value={student.upperId} onChange={(v) => setStudent({ ...student, upperId: v })} />
                <Field label="U-Dise Code" value={student.uDiseCode} onChange={(v) => setStudent({ ...student, uDiseCode: v })} />
                <Field label="P.E.N." value={student.pen} onChange={(v) => setStudent({ ...student, pen: v })} />
                <Field label="Aadhaar सं." value={student.aadhaar} onChange={(v) => setStudent({ ...student, aadhaar: v })} />
                <Field label="छात्र पं० सं०" value={student.penReg} onChange={(v) => setStudent({ ...student, penReg: v })} />
                <Field label="पंजीकरण संख्या" value={student.registration} onChange={(v) => setStudent({ ...student, registration: v })} />
                <Field label="Date (दिनांक)" type="date" value={student.date} onChange={(v) => setStudent({ ...student, date: v })} />
                <div className="col-span-2">
                  <Field label="School Name" value={student.schoolName} onChange={(v) => setStudent({ ...student, schoolName: v })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Elective Choice (Sanskrit/Urdu is permanent)</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStudent({ ...student, elective: "kala" })}
                      className={`flex-1 text-xs py-2 rounded border ${student.elective === "kala" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      वैकल्पिक विषय (कला)
                    </button>
                    <button type="button" onClick={() => setStudent({ ...student, elective: "computer" })}
                      className={`flex-1 text-xs py-2 rounded border ${student.elective === "computer" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      कम्प्यूटर शिक्षा
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-xl p-5 border border-border">
              <h2 className="font-semibold text-primary mb-4 text-sm tracking-wide">EXAMINATION MARKS</h2>
              <div className="space-y-3">
                {HIGH_SUBJECTS.map((s, i) => {
                  const disabled = isHighExcluded(i, student.elective) && i !== HIGH_KHEL_INDEX;
                  const t = totals(i);
                  return (
                    <div key={i} className={`border border-border rounded-lg p-3 ${disabled ? "opacity-40" : "bg-secondary/30"}`}>
                      <div className="font-medium text-sm mb-2">{i + 1}. {s}{i === HIGH_KHEL_INDEX && <span className="text-[10px] text-muted-foreground"> (auto-graded, excluded)</span>}</div>
                      <div className="text-[10px] text-muted-foreground mb-1">सामयिक परीक्षा (अगस्त / अक्टूबर / दिसम्बर) · वार्षिक</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        <SmallInput placeholder="अगस्त" value={rows[i].s1} onChange={(v) => update(i, "s1", v)} disabled={disabled} />
                        <SmallInput placeholder="अक्टू" value={rows[i].s2} onChange={(v) => update(i, "s2", v)} disabled={disabled} />
                        <SmallInput placeholder="दिस" value={rows[i].s3} onChange={(v) => update(i, "s3", v)} disabled={disabled} />
                        <SmallInput placeholder="वार्षिक" value={rows[i].ann} onChange={(v) => update(i, "ann", v)} disabled={disabled} />
                        <SmallInput placeholder="पूर्णांक" value={rows[i].annMax} onChange={(v) => update(i, "annMax", v)} disabled={disabled} />
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Total: {t.totalObtained}/{t.totalMax}
                        {i === HIGH_KHEL_INDEX && <span className="font-semibold ml-2">Grade: {khelGrade}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div>
            <MarksheetHigh ref={sheetRef} student={student} rows={rows} />
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
function SmallInput({ value, onChange, placeholder, disabled }: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="h-8 text-xs px-1.5 text-center" />;
}
