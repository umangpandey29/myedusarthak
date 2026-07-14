import { Link, useLocation } from "@tanstack/react-router";
import { FileText, LayoutDashboard, FolderOpen, LogOut, Menu, X, BarChart3, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/", label: "Create Report", icon: FileText },
  { to: "/saved", label: "Saved Reports", icon: FolderOpen },
  { to: "/analytics", label: "Teacher Analytics", icon: BarChart3 },
] as const;

export function AppSidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const Nav = (
    <>
      <div className="flex items-center justify-between gap-2 mb-8 px-1">
        <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 min-w-0 group">
          <div className="relative w-10 h-10 shrink-0 rounded-xl primary-grad flex items-center justify-center glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm tracking-tight truncate">MyEduSarthak</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">Premium Suite</div>
          </div>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-md hover:bg-white/5" aria-label="Close menu">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to + "/"));
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                active
                  ? "bg-white/[0.07] text-foreground font-medium shadow-[inset_0_1px_0_0_oklch(1_0_0/0.08)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full primary-grad" />}
              <Icon className={`w-[18px] h-[18px] transition-colors ${active ? "text-primary" : ""}`} />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5">
        {user && (
          <div className="glass rounded-xl px-3 py-2.5 mb-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in</div>
            <div className="text-xs font-medium truncate" title={user.email ?? ""}>{user.email}</div>
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
        >
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong h-14 flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 rounded-lg hover:bg-white/5">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg primary-grad flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">MyEduSarthak</span>
        </div>
        <div className="w-9" />
      </div>
      <div className="lg:hidden h-14 shrink-0" aria-hidden />

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-up" onClick={() => setOpen(false)} />
          <aside className="relative w-72 max-w-[82%] glass-strong p-5 flex flex-col h-full overflow-y-auto animate-fade-up">
            {Nav}
          </aside>
        </div>
      )}

      <aside className="w-64 hidden lg:flex flex-col p-5 border-r border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent min-h-screen sticky top-0">
        {Nav}
      </aside>
    </>
  );
}
