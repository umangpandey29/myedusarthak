// Shared utilities for AI bulk report generation.
import Papa from "papaparse";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveCloudReport } from "@/lib/cloudReports";

export type Row = Record<string, string>;

export type DetectedSubject = {
  key: string;
  label: string;
  obtained: string;
  max: string;
  grade: string;
};

export async function parseFile(file: File): Promise<Row[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv" || file.type === "text/csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Row>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data.map(normalize)),
        error: reject,
      });
    });
  }
  // xlsx / xls
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "", raw: false });
  return json.map(normalize);
}

function normalize(row: Row): Row {
  const out: Row = {};
  for (const k of Object.keys(row)) {
    // Normalize header: lowercase, trim, strip apostrophes/punctuation,
    // collapse whitespace and dashes to underscore.
    const key = String(k)
      .trim()
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[\s\-./]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    out[key] = String(row[k] ?? "").trim();
  }
  return out;
}

export function normalizeKey(key: string): string {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[\s\-./()]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Pick the first non-empty value from a list of possible keys. */
export function pick(row: Row, ...keys: string[]): string {
  for (const k of keys) {
    const norm = normalizeKey(k);
    if (row[norm] != null && row[norm] !== "") return row[norm];
  }
  return "";
}

export function toNumber(value: string | number | undefined | null): number | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").replace(/%/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!cleaned) return null;
  const parsed = Number(cleaned[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "").replace(/0$/, "");
}

const NON_ACADEMIC = new Set([
  "name", "student_name", "students_name", "full_name", "father", "fathers_name", "father_name",
  "mother", "mothers_name", "mother_name", "class", "class_sec", "class_section", "section",
  "roll", "roll_no", "roll_number", "rollno", "dob", "date_of_birth", "birth_date", "birthdate",
  "session", "academic_session", "year", "janpad_code", "district_code", "school_code", "school_name",
  "school", "sr_no", "srno", "admission_number", "admission_no", "admission", "upper_id", "upperid",
  "udise_code", "udise", "pen", "aadhaar", "aadhar", "pen_reg", "penreg", "registration",
  "registration_number", "elective_choice", "elective", "vaikalpik_choice", "date", "report_date",
  "total", "total_marks", "obtained_total", "grand_total", "percentage", "percent", "grade", "overall_grade",
  "rank", "class_rank", "result", "remarks",
]);

const FIELD_SUFFIXES: { suffix: string; field: "obtained" | "max" | "grade" }[] = [
  { suffix: "_obtained_marks", field: "obtained" }, { suffix: "_marks_obtained", field: "obtained" },
  { suffix: "_total_obtained", field: "obtained" }, { suffix: "_obtained", field: "obtained" },
  { suffix: "_marks", field: "obtained" }, { suffix: "_mark", field: "obtained" },
  { suffix: "_score", field: "obtained" }, { suffix: "_total", field: "obtained" },
  { suffix: "_maximum_marks", field: "max" }, { suffix: "_max_marks", field: "max" },
  { suffix: "_full_marks", field: "max" }, { suffix: "_out_of", field: "max" },
  { suffix: "_maximum", field: "max" }, { suffix: "_max", field: "max" },
  { suffix: "_grade", field: "grade" },
];

function splitAcademicKey(key: string): { subject: string; field: "obtained" | "max" | "grade" } | null {
  if (NON_ACADEMIC.has(key)) return null;
  if (key.startsWith("max_marks_")) return { subject: key.replace(/^max_marks_/, ""), field: "max" };
  if (key.startsWith("maximum_marks_")) return { subject: key.replace(/^maximum_marks_/, ""), field: "max" };
  if (key.startsWith("max_")) return { subject: key.replace(/^max_/, ""), field: "max" };
  if (key.startsWith("marks_")) return { subject: key.replace(/^marks_/, ""), field: "obtained" };
  if (key.startsWith("grade_")) return { subject: key.replace(/^grade_/, ""), field: "grade" };
  for (const item of FIELD_SUFFIXES) {
    if (key.endsWith(item.suffix)) return { subject: key.slice(0, -item.suffix.length), field: item.field };
  }
  return { subject: key, field: "obtained" };
}

function labelFromKey(key: string): string {
  return key.split("_").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function detectAcademicSubjects(row: Row): DetectedSubject[] {
  const grouped = new Map<string, { obtained?: string; max?: string; grade?: string }>();
  for (const [key, value] of Object.entries(row)) {
    const parsed = splitAcademicKey(key);
    if (!parsed || !parsed.subject || NON_ACADEMIC.has(parsed.subject)) continue;
    const group = grouped.get(parsed.subject) ?? {};
    if (parsed.field === "grade") group.grade = String(value ?? "").trim();
    else if (parsed.field === "max") {
      const max = toNumber(value);
      if (max !== null) group.max = formatNumber(max);
    } else {
      const raw = String(value ?? "").trim();
      const pair = raw.match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
      if (pair) {
        group.obtained = formatNumber(Number(pair[1]));
        group.max = formatNumber(Number(pair[2]));
      } else {
        const obtained = toNumber(value);
        if (obtained !== null) group.obtained = formatNumber(obtained);
      }
    }
    grouped.set(parsed.subject, group);
  }

  return Array.from(grouped.entries())
    .filter(([, value]) => value.obtained !== undefined || value.grade)
    .map(([key, value]) => ({
      key,
      label: labelFromKey(key),
      obtained: value.obtained ?? "",
      max: value.max ?? (value.obtained !== undefined ? "100" : ""),
      grade: value.grade ?? "",
    }));
}

/** True if every value in the row is empty — used to skip blank CSV rows. */
export function isBlankRow(row: Row): boolean {
  return Object.values(row).every((v) => !v || !String(v).trim());
}

export function downloadCSV(filename: string, headers: string[], sampleRow?: Row) {
  const csv = Papa.unparse({ fields: headers, data: [sampleRow ? headers.map((h) => sampleRow[h] ?? "") : headers.map(() => "")] });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function snapshotToPng(el: HTMLElement, bg: string): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(el, { pixelRatio: 2, backgroundColor: bg, cacheBust: true });
}

export async function buildZip(pngs: { filename: string; dataUrl: string }[]): Promise<Blob> {
  const zip = new JSZip();
  for (const p of pngs) {
    const base64 = p.dataUrl.split(",")[1];
    zip.file(p.filename, base64, { base64: true });
  }
  return zip.generateAsync({ type: "blob" });
}

export function safeFileName(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60) || "student";
}

export async function bulkSaveCloud(
  records: { report_type: "middle" | "high"; student_name: string; class_sec: string; roll_no: string; session: string; percentage: string; image: string }[]
) {
  for (const r of records) {
    try { await saveCloudReport(r); } catch (e) { console.error("Save failed for", r.student_name, e); }
  }
}
