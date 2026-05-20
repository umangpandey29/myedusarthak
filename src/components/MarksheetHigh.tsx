import {
  HIGH_SUBJECTS, HIGH_KHEL_INDEX, type HighRow, type HighStudent,
  autoGradeHigh, fmtDate, isHighExcluded, num,
} from "@/lib/reportTypes";
import { forwardRef } from "react";

export type MarksheetHighProps = {
  student: HighStudent;
  rows: HighRow[];
};

export const MarksheetHigh = forwardRef<HTMLDivElement, MarksheetHighProps>(function MarksheetHigh(
  { student, rows },
  ref
) {
  const computed = rows.map((r) => {
    const samiya = num(r.s1) + num(r.s2) + num(r.s3);
    const totalObtained = samiya + num(r.ann);
    const totalMax = num(r.halfMax) + num(r.annMax);
    return { samiya, totalObtained, totalMax };
  });
  const khelGrade = autoGradeHigh(computed[HIGH_KHEL_INDEX].totalObtained, computed[HIGH_KHEL_INDEX].totalMax);
  const grand = computed.reduce(
    (acc, r, idx) => isHighExcluded(idx, student.elective)
      ? acc
      : ({ obtained: acc.obtained + r.totalObtained, max: acc.max + r.totalMax }),
    { obtained: 0, max: 0 }
  );
  const percentage = grand.max > 0 ? ((grand.obtained / grand.max) * 100).toFixed(2) : "0.00";
  const result = grand.max > 0 && grand.obtained / grand.max >= 0.33 ? "PASSED" : "FAILED";
  const overallGrade = autoGradeHigh(grand.obtained, grand.max);

  return (
    <div ref={ref} className="marksheet-high p-6 rounded-md shadow-lg text-[11px]">
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
      <div className="text-[11px] mb-3">अनुक्रमांक <span className="dotted">{student.rollNo}</span> जन्म तिथि <span className="dotted">{fmtDate(student.dob)}</span> आधार सं. <span className="dotted">{student.aadhaar}</span> छात्र पं० सं० <span className="dotted">{student.penReg}</span> पंजीकरण संख्या <span className="dotted">{student.registration}</span></div>

      <div className="flex gap-2">
        <div className="flex-1">
          <table>
            <thead>
              <tr>
                <th rowSpan={3} style={{ minWidth: 120 }}>विषय</th>
                <th colSpan={2}>अर्धवार्षिक परीक्षा</th>
                <th colSpan={8}>सामयिक परीक्षा</th>
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
              {HIGH_SUBJECTS.map((s, i) => {
                const isHidden = isHighExcluded(i, student.elective) && i !== HIGH_KHEL_INDEX;
                const grade = i === HIGH_KHEL_INDEX
                  ? khelGrade
                  : (isHidden ? "" : rows[i].grade || autoGradeHigh(computed[i].totalObtained, computed[i].totalMax));
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
            <th>कुल प्रतिशत (%)</th>
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
            <td className="font-bold">{fmtDate(student.date)}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-[10px] text-center mt-1">अर्धवार्षिक (30) तथा वार्षिक (70)=100 ही जोड़े जायेंगे</div>

      <div className="grid grid-cols-5 gap-2 mt-6 text-[10px] text-center">
        <div className="border-t border-black pt-1">ह० कक्षाध्यापक</div>
        <div className="border-t border-black pt-1">ह० अभिभावक</div>
        <div className="border-t border-black pt-1">ह० प्रधानाचार्य</div>
        <div className="border-t border-black pt-1">ह० कक्षाध्यापक</div>
        <div className="border-t border-black pt-1">ह० प्रधानाचार्य</div>
      </div>
    </div>
  );
});

export function computeHighPercentage(student: HighStudent, rows: HighRow[]) {
  const grand = rows.reduce((acc, r, idx) => {
    if (isHighExcluded(idx, student.elective)) return acc;
    const totalObtained = num(r.s1) + num(r.s2) + num(r.s3) + num(r.ann);
    const totalMax = num(r.halfMax) + num(r.annMax);
    return { obtained: acc.obtained + totalObtained, max: acc.max + totalMax };
  }, { obtained: 0, max: 0 });
  return grand.max > 0 ? ((grand.obtained / grand.max) * 100).toFixed(2) : "0.00";
}
