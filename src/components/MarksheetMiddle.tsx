import {
  MIDDLE_SUBJECTS, MIDDLE_KHEL_INDEX, type MiddleMarks, type MiddleStudent,
  autoGradeMiddle, num,
} from "@/lib/reportTypes";
import { forwardRef } from "react";

export type MarksheetMiddleProps = {
  student: MiddleStudent;
  marks: MiddleMarks[];
};

export const MarksheetMiddle = forwardRef<HTMLDivElement, MarksheetMiddleProps>(function MarksheetMiddle(
  { student, marks },
  ref
) {
  const rows = marks.map((m) => {
    const halfObtained = num(m.h1) + num(m.h2) + num(m.hPrac) + num(m.hHalf);
    const annObtained = num(m.a1) + num(m.a2) + num(m.aPrac) + num(m.aAnn);
    return { halfObtained, annObtained, totalObtained: halfObtained + annObtained, totalMax: num(m.hMax) + num(m.aMax) };
  });
  const khelGrade = autoGradeMiddle(rows[MIDDLE_KHEL_INDEX].totalObtained, rows[MIDDLE_KHEL_INDEX].totalMax);
  const grand = rows.reduce(
    (acc, r, idx) => idx === MIDDLE_KHEL_INDEX ? acc : ({
      obtained: acc.obtained + r.totalObtained, max: acc.max + r.totalMax,
      halfObtained: acc.halfObtained + r.halfObtained, halfMax: acc.halfMax + num(marks[idx].hMax),
      annObtained: acc.annObtained + r.annObtained, annMax: acc.annMax + num(marks[idx].aMax),
    }),
    { obtained: 0, max: 0, halfObtained: 0, halfMax: 0, annObtained: 0, annMax: 0 }
  );
  const percentage = grand.max > 0 ? ((grand.obtained / grand.max) * 100).toFixed(2) : "0.00";

  return (
    <div ref={ref} className="marksheet p-6 rounded-md shadow-lg">
      <div className="text-center mb-2">
        <div className="font-bold text-sm">विद्यालय का नाम : {student.schoolName}</div>
        <div className="text-[10px]">(जूनियर कक्षाओं के लिए)</div>
      </div>
      <div className="flex justify-between items-center text-xs mb-3">
        <div>जनपद कोड <span className="border border-black px-3 py-0.5 inline-block min-w-12">{student.janpadCode}</span></div>
        <div className="font-bold text-base">अंक-पत्र, सत्र <u>{student.session}</u></div>
        <div>विद्यालय कोड <span className="border border-black px-3 py-0.5 inline-block min-w-12">{student.schoolCode}</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] mb-1">
        <div>छात्र/छात्रा का नाम : <span className="dotted">{student.name}</span></div>
        <div>पिता का नाम : <span className="dotted">{student.father}</span></div>
        <div>माता का नाम : <span className="dotted">{student.mother}</span></div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[11px] mb-3">
        <div>कक्षा एवं वर्ग : <span className="dotted">{student.classSec}</span></div>
        <div>अनुक्रमांक : <span className="dotted">{student.rollNo}</span></div>
        <div>जन्मतिथि : <span className="dotted">{student.dob}</span></div>
        <div>SR.No : <span className="dotted">{student.srNo}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: 28 }}>क्र.</th>
            <th rowSpan={2} style={{ minWidth: 140 }}>विषय</th>
            <th colSpan={6}>अर्धवार्षिक परीक्षा</th>
            <th colSpan={6}>वार्षिक परीक्षा</th>
            <th colSpan={2}>सम्पूर्ण योग</th>
            <th rowSpan={2} style={{ width: 50 }}>ग्रेड</th>
            <th rowSpan={2} style={{ width: 110 }}>परीक्षाफल / अन्य</th>
          </tr>
          <tr>
            <th className="vertical">प्रथम सत्रीय परीक्षा</th>
            <th className="vertical">द्वितीय सत्रीय परीक्षा</th>
            <th className="vertical">प्रायोगिक परीक्षा</th>
            <th className="vertical">अर्धवार्षिक परीक्षा</th>
            <th className="vertical">प्राप्तांक योग</th>
            <th className="vertical">पूर्णांक योग</th>
            <th className="vertical">तृतीय सत्रीय परीक्षा</th>
            <th className="vertical">चतुर्थ सत्रीय परीक्षा</th>
            <th className="vertical">प्रायोगिक परीक्षा</th>
            <th className="vertical">वार्षिक परीक्षा</th>
            <th className="vertical">प्राप्तांक योग</th>
            <th className="vertical">पूर्णांक योग</th>
            <th className="vertical">प्राप्तांक का योग</th>
            <th className="vertical">पूर्णांक का योग</th>
          </tr>
        </thead>
        <tbody>
          {MIDDLE_SUBJECTS.map((s, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td className="subj">{s}</td>
              <td>{marks[i].h1}</td>
              <td>{marks[i].h2}</td>
              <td>{marks[i].hPrac}</td>
              <td>{marks[i].hHalf}</td>
              <td className="totals">{rows[i].halfObtained || ""}</td>
              <td className="totals">{marks[i].hMax}</td>
              <td>{marks[i].a1}</td>
              <td>{marks[i].a2}</td>
              <td>{marks[i].aPrac}</td>
              <td>{marks[i].aAnn}</td>
              <td className="totals">{rows[i].annObtained || ""}</td>
              <td className="totals">{marks[i].aMax}</td>
              <td className="totals">{rows[i].totalObtained || ""}</td>
              <td className="totals">{rows[i].totalMax}</td>
              <td className="font-semibold">{i === MIDDLE_KHEL_INDEX ? khelGrade : marks[i].grade}</td>
              {i === 0 && (
                <td rowSpan={MIDDLE_SUBJECTS.length} className="align-top text-[10px] leading-relaxed text-left p-2" style={{ verticalAlign: "top" }}>
                  <div>उत्तीर्ण</div>
                  <div className="mt-2">अनुत्तीर्ण</div>
                  <div className="mt-2">कक्षा में स्थान</div>
                  <div className="mt-2">कृपांक</div>
                  <div className="mt-2">उपस्थिति अर्धवार्षिक</div>
                  <div className="mt-2">उपस्थिति वार्षिक</div>
                </td>
              )}
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="font-bold">योग</td>
            <td colSpan={4}></td>
            <td className="totals font-bold">{grand.halfObtained || ""}</td>
            <td className="totals font-bold">{grand.halfMax}</td>
            <td colSpan={4}></td>
            <td className="totals font-bold">{grand.annObtained || ""}</td>
            <td className="totals font-bold">{grand.annMax}</td>
            <td className="totals font-bold">{grand.obtained || ""}</td>
            <td className="totals font-bold">{grand.max}</td>
            <td colSpan={2} className="totals font-bold">
              <div className="text-[9px] leading-tight">कुल प्रतिशत</div>
              <div>{percentage}%</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="grid grid-cols-4 gap-4 mt-10 text-[10px] text-center">
        <div className="border-t border-black pt-1">ह० कक्षाध्यापक</div>
        <div className="border-t border-black pt-1">ह० अभिभावक</div>
        <div className="border-t border-black pt-1">ह० प्रधानाचार्य</div>
        <div className="border-t border-black pt-1">ह० प्रधानाचार्य मुहर सहित</div>
      </div>
    </div>
  );
});

export function computeMiddlePercentage(marks: MiddleMarks[]) {
  const grand = marks.reduce((acc, m, idx) => {
    if (idx === MIDDLE_KHEL_INDEX) return acc;
    const halfObtained = num(m.h1) + num(m.h2) + num(m.hPrac) + num(m.hHalf);
    const annObtained = num(m.a1) + num(m.a2) + num(m.aPrac) + num(m.aAnn);
    return { obtained: acc.obtained + halfObtained + annObtained, max: acc.max + num(m.hMax) + num(m.aMax) };
  }, { obtained: 0, max: 0 });
  return grand.max > 0 ? ((grand.obtained / grand.max) * 100).toFixed(2) : "0.00";
}
