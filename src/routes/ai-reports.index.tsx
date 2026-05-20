import { createFileRoute, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { GraduationCap, BookOpen, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/ai-reports/")({
  component: ChooseAI,
  head: () => ({ meta: [{ title: "AI Bulk Reports — MyEduSarthak" }] }),
});

function ChooseAI() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <AppSidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">AI Bulk Report Cards</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">Upload a CSV / Excel of students and auto-generate every report card. Download all as a ZIP.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link to="/ai-reports/middle" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-border">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4"><BookOpen className="w-6 h-6" /></div>
              <h2 className="text-xl font-bold mb-1">Classes 6 – 8</h2>
              <p className="text-sm text-muted-foreground mb-4">Bulk generate junior report cards from a CSV/Excel.</p>
              <span className="inline-flex items-center text-sm text-primary font-medium">Start <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            <Link to="/ai-reports/high" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg border border-border">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4"><GraduationCap className="w-6 h-6" /></div>
              <h2 className="text-xl font-bold mb-1">Classes 9 – 10</h2>
              <p className="text-sm text-muted-foreground mb-4">Bulk generate high-school report cards from a CSV/Excel.</p>
              <span className="inline-flex items-center text-sm text-primary font-medium">Start <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
