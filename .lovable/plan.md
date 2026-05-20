# Changes

## 1. Class 9–10 report card fixes (`src/routes/report.high.tsx`)
- Rename every "समीय / समिय परीक्षा" label → **सामयिक परीक्षा** (table header + form helper text).
- Date display in the marksheet (दिनांक cell) → formatted as **DD/MM/YYYY** (input stays `type=date`, only the rendered output changes).
- Elective logic:
  - **संस्कृत / उर्दू** becomes a permanent subject (always counted, no toggle).
  - Replace the toggle with a choice between **वैकल्पिक विषय (कला)** and **कम्प्यूटर शिक्षा** — only the chosen one is filled and added to totals; the other is greyed and excluded.
  - खेल तथा स्वास्थ्य stays auto-graded and excluded from totals (unchanged).

## 2. New "Create AI Reports" feature (bulk CSV → ZIP of PNGs)
- Add **`/ai-reports`** route (choice page: 6–8 vs 9–10), plus **`/ai-reports/middle`** and **`/ai-reports/high`**.
- Sidebar (`AppSidebar.tsx`): new item "Create AI Reports" with sub-links.
- On each AI route:
  1. Upload a **`.csv` or `.xlsx`** file (parsed with `papaparse` + `xlsx`).
  2. For each row, render the exact same report-card markup off-screen, snapshot via `html-to-image`, and collect PNGs.
  3. Show progress ("Generating 4 / 32…"), then two buttons:
     - **Save Reports** → bulk insert into the `reports` table (same as manual flow).
     - **Download ZIP** → bundle all PNGs via `jszip` → `student-reports-<timestamp>.zip`.
- A **"Download CSV template"** button on each page exports the exact expected column headers so there's zero ambiguity. Computed fields (totals, %, grade, result) are derived — NOT taken from the CSV — so there can be no calculation mismatch.

### Proposed CSV columns
**6–8:** `name, father, mother, class_sec, roll_no, dob, session, school_name, <subject>_half, <subject>_half_max, <subject>_ann, <subject>_ann_max` for each of the 8 subjects (हिन्दी, गणित, अंग्रेजी, विज्ञान, सामाजिक विज्ञान, संस्कृत, खेल, कम्प्यूटर).

**9–10:** same identity fields + per-subject `_s1, _s2, _s3, _ann, _ann_max` for each of: हिन्दी, गणित, अंग्रेजी, विज्ञान, सामाजिक विज्ञान, संस्कृत/उर्दू (permanent), elective (कला OR कम्प्यूटर — one column set named `elective_*` + an `elective_choice` column = "kala" | "computer"), खेल.

## 3. Forgot password via email
- `/login` page: add **"Forgot password?"** link.
- New `/forgot-password` route → calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`.
- New `/reset-password` route (public) → form that calls `supabase.auth.updateUser({ password })` after the recovery link lands.
- Uses Lovable Cloud's default auth emails (works out of the box, no domain setup needed).

## 4. Packages to add
`papaparse`, `xlsx`, `jszip` (+ `@types/papaparse`).

---

# Questions before I build

1. **Elective in 9–10:** Confirm the third option is literally **कम्प्यूटर शिक्षा** (so the existing Computer row becomes the elective slot) — OR should कम्प्यूटर शिक्षा stay as a separate always-on subject and the elective toggle be only between कला and something else?
2. **AI bulk — CSV template:** OK with me auto-downloading a template CSV with the exact column names listed above? (Easiest for you — just fill the cells and re-upload.)
3. **ZIP filenames:** `<roll_no>-<name>.png` inside the zip, OK?