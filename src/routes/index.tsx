import { createFileRoute, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { GraduationCap, BookOpen, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: ChoosePage,
  head: () => ({ meta: [{ title: "Create Report — MyEduSarthak" }] }),
});

function ChoosePage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <AppSidebar />
      <main className="flex-1 p-4 lg:p-10 min-w-0 max-w-[1200px] mx-auto w-full">
        <div className="mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-[11px] uppercase tracking-[0.15em] mb-3">
            <Sparkles className="w-3 h-3 text-primary" /> New Report
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Choose a <span className="text-gradient">class level</span></h1>
          <p className="text-sm text-muted-foreground">Pick the format that matches the student. Both produce a downloadable, print-ready marksheet.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card to="/report/middle" title="Classes 6 – 8" tint="from-amber-400/20 to-transparent" iconTint="bg-amber-500/15 text-amber-300"
            icon={<BookOpen className="w-6 h-6" />}
            description="Junior section report card (अंक-पत्र) with half-yearly & annual exams." />
          <Card to="/report/high" title="Classes 9 – 10" tint="from-primary/25 to-transparent" iconTint="bg-primary/15 text-primary"
            icon={<GraduationCap className="w-6 h-6" />}
            description="High-school marksheet with सामयिक परीक्षा (अगस्त · अक्टूबर · दिसम्बर) & वार्षिक." />
        </div>
      </main>
    </div>
  );
}

function Card({ to, title, description, icon, tint, iconTint }: { to: string; title: string; description: string; icon: React.ReactNode; tint: string; iconTint: string }) {
  return (
    <Link to={to} className="group relative glass rounded-2xl p-6 overflow-hidden hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-0.5">
      <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br ${tint} blur-2xl pointer-events-none`} />
      <div className={`relative w-12 h-12 rounded-xl ${iconTint} flex items-center justify-center mb-5`}>{icon}</div>
      <h2 className="relative text-xl font-bold mb-1.5 tracking-tight">{title}</h2>
      <p className="relative text-sm text-muted-foreground mb-6">{description}</p>
      <span className="relative inline-flex items-center text-sm text-primary font-medium">
        Start <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}
