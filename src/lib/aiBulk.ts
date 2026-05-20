// Shared utilities for AI bulk report generation.
import Papa from "papaparse";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveCloudReport } from "@/lib/cloudReports";

export type Row = Record<string, string>;

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
  for (const k of Object.keys(row)) out[k.trim()] = String(row[k] ?? "").trim();
  return out;
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
