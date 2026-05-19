import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, RotateCcw, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { saveCloudReport } from "@/lib/cloudReports";

export const Route = createFileRoute("/report/high")({
  component: CreateHigh,
  head: () => ({ meta: [{ title: "Class 9–10 Report — MyEduSarthak" }] }),
});

// Subjects for 9-10 — index 5 = Sanskrit/Urdu, index 6 = Vaikalpik (only one filled)
// index 7 = खेल तथा स्वास्थ्य (auto-grade, excluded from total)
const SUBJECTS = [
  "हिन्दी",
  "गणित / मूलविज्ञान",
  "अंग्रेजी",
  "विज्ञान",
  "सामाजिक विज्ञान",
  "संस्कृत / उर्दू",
  "वैकल्पिक विषय",
  "खेल तथा स्वास्थ्य",
  "कम्प्यूटर शिक्षा",
];
const ELECTIVE_PAIR = [5, 6]; // user fills only one of these
const KHEL = 7;

type Row = {
  half: string; halfMax: string;     // अर्धवार्षिक
  s1: string; s2: string; s3: string; // सम्यिक प्रथम/द्वितीय/तृतीय (each /10)
  ann: string; annMax: string;        // वार्षिक (/70)
  grade: string;
};
const empty = (): Row => ({ half: "", halfMax: "30", s1: "", s2: "", s3: "", ann: "", annMax: "70", grade: "" });
const n = (v: string) => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };

const autoGrade = (obtained: number, max: number): string => {
  if (max <= 0) return "";
  const p = (obtained / max) * 100;
  if (p >= 91) return "A1"; if (p >= 81) return "A2";
  if (p >= 71) return "B1"; if (p >= 61) return "B2";
  if (p >= 51) return "C1"; if (p >= 41) return "C2";
  if (p >= 33) return "D";
  return "E";
};

function CreateHigh() {
  const today = new Date().toISOString().slice(0, 10);
  const [student, setStudent] = useState({
    name: "", father: "", mother: "", classSec: "", rollNo: "",
    dob: "", session: "2026-2027", janpadCode: "", schoolCode: "",
    upperId: "", uDiseCode: "", pen: "", aadhaar: "", penReg: "", registration: "",
    elective: "sanskrit" as "sanskrit" | "vaikalpik",
    schoolName: "जयप्रकाश नारायण सर्वोदय विद्यालय",
    date: today,
  });
  const [rows, setRows] = useState<Row[]>(SUBJECTS.map(empty));
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const computed = useMemo(() => rows.map((r) => {
    const samiya = n(r.s1) + n(r.s2) + n(r.s3); // /30
    const totalObtained = samiya + n(r.ann);    // /100
    const totalMax = n(r.halfMax) + n(r.annMax); // 30+70
    return { samiya, totalObtained, totalMax };
  }), [rows]);

  const isExcluded = (i: number) => {
    if (i === KHEL) return true;
    // exclude the un-used elective row
    if (i === 5 && student.elective !== "sanskrit") return true;
    if (i === 6 && student.elective !== "vaikalpik") return true;
    return false;
  };

  const khelGrade = useMemo(() => autoGrade(computed[KHEL].totalObtained, computed[KHEL].totalMax), [computed]);

  const grand = useMemo(() => computed.reduce(
    (acc, r, idx) => isExcluded(idx) ? acc : ({
      obtained: acc.obtained + r.totalObtained,
      max: acc.max + r.totalMax,
    }),
    { obtained: 0, max: 0 }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [computed, student.elective]);

  const percentage = grand.max > 0 ? ((grand.obtained / grand.max) * 100).toFixed(2) : "0.00";
  const result = grand.max > 0 && grand.obtained / grand.max >= 0.33 ? "PASSED" : "FAILED";
  const overallGrade = autoGrade(grand.obtained, grand.max);

  const update = (i: number, f: keyof Row, v: string) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r));

  const reset = () => setRows(SUBJECTS.map(empty));

  const download = async () => {
    if (!sheetRef.current) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(sheetRef.current, { pixelRatio: 2, backgroundColor: "#cfe3ef", cacheBust: true });
      const link = document.createElement("a");
      link.download = `${student.name || "marksheet-9-10"}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      try {
        await saveCloudReport({
          report_type: "high",
          student_name: student.name, class_sec: student.classSec, roll_no: student.rollNo,
          session: student.session, percentage, image: dataUrl,
        });
      } catch (e) { console.error("Cloud save failed", e); }
    } catch (err) { console.error(err); alert("Could not generate image."); }
    finally { setSaving(false); }
  };

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
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Elective Choice</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStudent({ ...student, elective: "sanskrit" })}
                      className={`flex-1 text-xs py-2 rounded border ${student.elective === "sanskrit" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      संस्कृत / उर्दू
                    </button>
                    <button type="button" onClick={() => setStudent({ ...student, elective: "vaikalpik" })}
                      className={`flex-1 text-xs py-2 rounded border ${student.elective === "vaikalpik" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      वैकल्पिक विषय
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-xl p-5 border border-border">
              <h2 className="font-semibold text-primary mb-4 text-sm tracking-wide">EXAMINATION MARKS</h2>
              <div className="space-y-3">
                {SUBJECTS.map((s, i) => {
                  const disabled = (i === 5 && student.elective !== "sanskrit") || (i === 6 && student.elective !== "vaikalpik");
                  return (
                    <div key={i} className={`border border-border rounded-lg p-3 ${disabled ? "opacity-40" : "bg-secondary/30"}`}>
                      <div className="font-medium text-sm mb-2">{i + 1}. {s}{i === KHEL && <span className="text-[10px] text-muted-foreground"> (auto-graded)</span>}</div>
                      <div className="text-[10px] text-muted-foreground mb-1">समीय परीक्षा (अगस्त / अक्टूबर / दिसम्बर) · वार्षिक</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        <SmallInput placeholder="अगस्त" value={rows[i].s1} onChange={(v) => update(i, "s1", v)} disabled={disabled} />
                        <SmallInput placeholder="अक्टू" value={rows[i].s2} onChange={(v) => update(i, "s2", v)} disabled={disabled} />
                        <SmallInput placeholder="दिस" value={rows[i].s3} onChange={(v) => update(i, "s3", v)} disabled={disabled} />
                        <SmallInput placeholder="वार्षिक" value={rows[i].ann} onChange={(v) => update(i, "ann", v)} disabled={disabled} />
                        <SmallInput placeholder="पूर्णांक" value={rows[i].annMax} onChange={(v) => update(i, "annMax", v)} disabled={disabled} />
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">Total: {computed[i].totalObtained}/{computed[i].totalMax} {i === KHEL && <span className="font-semibold ml-2">Grade: {khelGrade}</span>}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Preview */}
          <div>
            <div ref={sheetRef} className="marksheet-high p-6 rounded-md shadow-lg text-[11px]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[11px]">
                  <div>विद्यालय का नाम</div>
                  <div className="bg-black text-white px-2 py-1 mt-1 text-center font-bold">(हाईस्कूल कक्षाओं के लिए)</div>
                </div>
                <div className="text-center flex-1 px-4">
                  <div className="font-bold text-base">अंक-पत्र, सत्र {student.session}</div>
                  <div className="text-[10px] mt-1">जनपद कोड <span className="border border-black px-2 inline-block min-w-10">{student.janpadCode}</span></div>
                </div>
                <div className="text-[11px]">विद्यालय कोड <span className="border border-black px-2 inline-block min-w-12">{student.schoolCode}</span></div>
              </div>

              <div className="text-[11px] mb-1">अपर आई.डी. <span className="dotted">{student.upperId}</span> यू-डायस कोड <span className="dotted">{student.uDiseCode}</span> P.E.N. <span className="dotted">{student.pen}</span></div>
              <div className="text-[11px] mb-1">छात्र/छात्रा का नाम: <span className="dotted">{student.name}</span> पिता का नाम <span className="dotted">{student.father}</span> माता का नाम <span className="dotted">{student.mother}</span> कक्षा एवं वर्ग <span className="dotted">{student.classSec}</span></div>
              <div className="text-[11px] mb-3">अनुक्रमांक <span className="dotted">{student.rollNo}</span> जन्म तिथि <span className="dotted">{student.dob}</span> आधार सं. <span className="dotted">{student.aadhaar}</span> छात्र पं० सं० <span className="dotted">{student.penReg}</span> पंजीकरण संख्या <span className="dotted">{student.registration}</span></div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <table>
                    <thead>
                      <tr>
                        <th rowSpan={3} style={{ minWidth: 120 }}>विषय</th>
                        <th colSpan={2}>अर्धवार्षिक परीक्षा</th>
                        <th colSpan={8}>समीय परीक्षा</th>
                        <th colSpan={2}>वार्षिक परीक्षा</th>
                        <th colSpan={2}>सम्पूर्ण योग (30+70)</th>
                        <th rowSpan={3} style={{ width: 40 }}>ग्रेड</th>
                      </tr>
                      <tr>
                        <th rowSpan={2}>प्राप्तांक</th>
                        <th rowSpan={2}>पूर्णांक</th>
                        <th colSpan={2}>प्रथम<br />(अगस्त)</th>
                        <th colSpan={2}>द्वितीय<br />(अक्टूबर)</th>
                        <th colSpan={2}>तृतीय<br />(दिसम्बर)</th>
                        <th colSpan={2}>योग</th>
                        <th rowSpan={2}>प्राप्तांक</th>
                        <th rowSpan={2}>पूर्णांक</th>
                        <th rowSpan={2}>प्राप्तांक</th>
                        <th rowSpan={2}>पूर्णांक</th>
                      </tr>
                      <tr>
                        <th>प्रा.</th><th>पू.</th>
                        <th>प्रा.</th><th>पू.</th>
                        <th>प्रा.</th><th>पू.</th>
                        <th>प्रा.</th><th>पू.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SUBJECTS.map((s, i) => {
                        const isHidden = (i === 5 && student.elective !== "sanskrit") || (i === 6 && student.elective !== "vaikalpik");
                        const grade = i === KHEL ? khelGrade : (isHidden ? "" : rows[i].grade || autoGrade(computed[i].totalObtained, computed[i].totalMax));
                        return (
                          <tr key={i} style={isHidden ? { background: "#e6eef3" } : undefined}>
                            <td className="subj">{i + 1}. {s}{isHidden && " (—)"}</td>
                            <td></td><td>{!isHidden ? rows[i].halfMax : ""}</td>
                            <td>{!isHidden ? rows[i].s1 : ""}</td><td>10</td>
                            <td>{!isHidden ? rows[i].s2 : ""}</td><td>10</td>
                            <td>{!isHidden ? rows[i].s3 : ""}</td><td>10</td>
                            <td className="totals">{!isHidden ? (computed[i].samiya || "") : ""}</td>
                            <td>30</td>
                            <td>{!isHidden ? rows[i].ann : ""}</td>
                            <td>{!isHidden ? rows[i].annMax : ""}</td>
                            <td className="totals">{!isHidden ? (computed[i].totalObtained || "") : ""}</td>
                            <td>{!isHidden ? computed[i].totalMax : ""}</td>
                            <td className="font-semibold">{grade}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td className="font-bold">योग</td>
                        <td colSpan={11}></td>
                        <td className="totals font-bold">{grand.obtained || ""}</td>
                        <td className="totals font-bold">{grand.max || ""}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="w-24 shrink-0">
                  <table>
                    <thead><tr><th colSpan={2}>ग्रेड</th></tr></thead>
                    <tbody>
                      <tr><td>91-100</td><td>A1</td></tr>
                      <tr><td>81-90</td><td>A2</td></tr>
                      <tr><td>71-80</td><td>B1</td></tr>
                      <tr><td>61-70</td><td>B2</td></tr>
                      <tr><td>51-60</td><td>C1</td></tr>
                      <tr><td>41-50</td><td>C2</td></tr>
                      <tr><td>33-40</td><td>D</td></tr>
                      <tr><td colSpan={2} className="font-bold">PASSED</td></tr>
                      <tr><td>21-32</td><td>E1</td></tr>
                      <tr><td>00-20</td><td>E2</td></tr>
                      <tr><td colSpan={2} className="font-bold">FAILED</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <table className="mt-2">
                <thead>
                  <tr>
                    <th>कुल प्राप्तांक</th>
                    <th>कुल पूर्णांक</th>
                    <th>प्रतिशत (%)</th>
                    <th>परिणाम</th>
                    <th>श्रेणी</th>
                    <th>दिनांक</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">{grand.obtained || ""}</td>
                    <td className="font-bold">{grand.max || ""}</td>
                    <td className="font-bold">{percentage}%</td>
                    <td className="font-bold">{grand.max > 0 ? result : ""}</td>
                    <td className="font-bold">{overallGrade}</td>
                    <td className="font-bold">{student.date}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-[10px] text-center mt-1">छात्र पं० सं० के पंजीकरण संख्या (30) तथा वार्षिक (70)=100 ही जोड़े जायेंगे</div>

              <div className="grid grid-cols-5 gap-2 mt-6 text-[10px] text-center">
                <div className="border-t border-black pt-1">ह० कक्षाध्यापक</div>
                <div className="border-t border-black pt-1">ह० अभिभावक</div>
                <div className="border-t border-black pt-1">ह० प्रधानाचार्य</div>
                <div className="border-t border-black pt-1">ह० कक्षाध्यापक</div>
                <div className="border-t border-black pt-1">ह० प्रधानाचार्य</div>
              </div>
            </div>
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
