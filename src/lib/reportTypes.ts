// Shared types + helpers for both manual and AI bulk report generation.

export const fmtDate = (iso: string) => {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

export const num = (v: string | number | undefined | null) => {
  if (v === null || v === undefined || v === "") return 0;
  const x = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(x) ? 0 : x;
};

export const autoGradeMiddle = (obtained: number, max: number): string => {
  if (max <= 0) return "";
  const p = (obtained / max) * 100;
  if (p >= 91) return "A1"; if (p >= 81) return "A2";
  if (p >= 71) return "B1"; if (p >= 61) return "B2";
  if (p >= 51) return "C1"; if (p >= 33) return "C2";
  return "E";
};

export const autoGradeHigh = (obtained: number, max: number): string => {
  if (max <= 0) return "";
  const p = (obtained / max) * 100;
  if (p >= 91) return "A1"; if (p >= 81) return "A2";
  if (p >= 71) return "B1"; if (p >= 61) return "B2";
  if (p >= 51) return "C1"; if (p >= 41) return "C2";
  if (p >= 33) return "D";
  if (p >= 21) return "E1";
  return "E2";
};

// ----- Class 6–8 -----
export const MIDDLE_SUBJECTS = [
  "हिन्दी एवं अनिवार्य संस्कृत",
  "गणित",
  "अंग्रेजी",
  "सामाजिक विषय",
  "संस्कृत / उर्दू",
  "बेसिक क्राफ्ट (कृषि/पशुपालन/उद्योग)",
  "ऐच्छिक विषय (कला/संगीत/वाणिज्य)",
  "सामान्य विज्ञान",
  "खेल और स्वास्थ्य",
  "पर्यावरणीय अध्ययन",
  "कम्प्यूटर",
];
export const MIDDLE_KHEL_INDEX = 8;

export type MiddleMarks = {
  h1: string; h2: string; hPrac: string; hHalf: string; hMax: string;
  a1: string; a2: string; aPrac: string; aAnn: string; aMax: string;
  grade: string;
};
export const emptyMiddle = (): MiddleMarks => ({
  h1: "", h2: "", hPrac: "", hHalf: "", hMax: "50",
  a1: "", a2: "", aPrac: "", aAnn: "", aMax: "50", grade: "",
});

export type MiddleStudent = {
  name: string; father: string; mother: string; classSec: string; rollNo: string;
  dob: string; session: string; janpadCode: string; schoolCode: string; srNo: string;
  schoolName: string;
};
export const emptyMiddleStudent = (): MiddleStudent => ({
  name: "", father: "", mother: "", classSec: "", rollNo: "",
  dob: "", session: "2026-2027", janpadCode: "", schoolCode: "", srNo: "",
  schoolName: "जयप्रकाश नारायण सर्वोदय विद्यालय, तड़सड़ा (कठिराँव), जनपद-वाराणसी",
});

// ----- Class 9–10 -----
// Index 5 = Sanskrit/Urdu (PERMANENT). 6 = Vaikalpik (Kala). 7 = Khel (auto, excluded).
// 8 = Computer. User chooses elective between Vaikalpik (Kala) and Computer.
export const HIGH_SUBJECTS = [
  "हिन्दी",
  "गणित / मूलविज्ञान",
  "अंग्रेजी",
  "विज्ञान",
  "सामाजिक विज्ञान",
  "संस्कृत / उर्दू",
  "वैकल्पिक विषय (कला)",
  "खेल तथा स्वास्थ्य",
  "कम्प्यूटर शिक्षा",
];
export const HIGH_KHEL_INDEX = 7;
export const HIGH_ELECTIVE_KALA = 6;
export const HIGH_ELECTIVE_COMPUTER = 8;

export type HighRow = {
  halfMax: string; s1: string; s2: string; s3: string; ann: string; annMax: string; grade: string;
};
export const emptyHigh = (): HighRow => ({
  halfMax: "30", s1: "", s2: "", s3: "", ann: "", annMax: "70", grade: "",
});

export type HighStudent = {
  name: string; father: string; mother: string; classSec: string; rollNo: string;
  dob: string; session: string; janpadCode: string; schoolCode: string;
  upperId: string; uDiseCode: string; pen: string; aadhaar: string; penReg: string; registration: string;
  elective: "kala" | "computer";
  schoolName: string;
  date: string;
};
export const emptyHighStudent = (): HighStudent => ({
  name: "", father: "", mother: "", classSec: "", rollNo: "",
  dob: "", session: "2026-2027", janpadCode: "", schoolCode: "",
  upperId: "", uDiseCode: "", pen: "", aadhaar: "", penReg: "", registration: "",
  elective: "kala",
  schoolName: "जयप्रकाश नारायण सर्वोदय विद्यालय",
  date: new Date().toISOString().slice(0, 10),
});

export const isHighExcluded = (i: number, elective: "kala" | "computer") => {
  if (i === HIGH_KHEL_INDEX) return true;
  if (i === HIGH_ELECTIVE_KALA && elective !== "kala") return true;
  if (i === HIGH_ELECTIVE_COMPUTER && elective !== "computer") return true;
  return false;
};
