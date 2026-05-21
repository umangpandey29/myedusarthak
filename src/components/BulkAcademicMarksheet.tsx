import { forwardRef } from "react";
import type { BulkAcademicReport } from "@/lib/aiBulk";

export type BulkAcademicMarksheetProps = {
  report: BulkAcademicReport;
  title: string;
};

export const BulkAcademicMarksheet = forwardRef<HTMLDivElement, BulkAcademicMarksheetProps>(function BulkAcademicMarksheet(
  { report, title },
  ref
) {
  const { student, subjects, totals } = report;
  return (
    <div ref={ref} className="marksheet bulk-marksheet p-6 rounded-md shadow-lg">
      <div className="text-center mb-4">
        <div className="font-bold text-base">{student.schoolName || "विद्यालय का नाम"}</div>
        <div className="font-bold text-sm mt-1">{title}</div>
        <div className="text-[11px] mt-1">सत्र: <span className="dotted">{student.session}</span></div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] mb-2">
        <div>छात्र/छात्रा का नाम : <span className="dotted">{student.name}</span></div>
        <div>पिता का नाम : <span className="dotted">{student.father}</span></div>
        <div>माता का नाम : <span className="dotted">{student.mother}</span></div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-[11px] mb-4">
        <div>कक्षा एवं वर्ग : <span className="dotted">{student.classSec}</span></div>
        <div>अनुक्रमांक : <span className="dotted">{student.rollNo}</span></div>
        <div>जन्मतिथि : <span className="dotted">{student.dob}</span></div>
        <div>SR.No : <span className="dotted">{student.srNo}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: 42 }}>क्र.</th>
            <th>Subject</th>
            <th style={{ width: 120 }}>Marks</th>
            <th style={{ width: 120 }}>Max Marks</th>
            <th style={{ width: 90 }}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject, index) => (
            <tr key={`${subject.name}-${index}`}>
              <td>{index + 1}</td>
              <td className="subj">{subject.name}</td>
              <td>{subject.marks}</td>
              <td>{subject.maxMarks}</td>
              <td className="font-semibold">{subject.grade}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="font-bold">Grand Total</td>
            <td className="totals font-bold">{Number.isInteger(totals.obtained) ? totals.obtained : totals.obtained.toFixed(2)}</td>
            <td className="totals font-bold">{Number.isInteger(totals.max) ? totals.max : totals.max.toFixed(2)}</td>
            <td className="font-bold">{totals.overallGrade}</td>
          </tr>
        </tbody>
      </table>

      <table className="mt-3">
        <tbody>
          <tr>
            <th>Percentage</th>
            <th>Class Rank</th>
            <th>Result</th>
          </tr>
          <tr>
            <td className="font-bold">{totals.percentage}%</td>
            <td className="font-bold">{totals.rank || ""}</td>
            <td className="font-bold">{totals.max > 0 && totals.obtained / totals.max >= 0.33 ? "PASSED" : "FAILED"}</td>
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