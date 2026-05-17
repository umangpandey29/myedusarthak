export type SavedReport = {
  id: string;
  name: string;
  classSec: string;
  rollNo: string;
  session: string;
  percentage: string;
  createdAt: number;
  image: string; // dataURL PNG
};

const KEY = "myedusarthak_saved_reports_v1";

export function getSavedReports(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveReport(r: SavedReport) {
  const all = getSavedReports();
  all.unshift(r);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteReport(id: string) {
  const all = getSavedReports().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
