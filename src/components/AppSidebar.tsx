import { Link, useLocation } from "@tanstack/react-router";
import { FileText, LayoutDashboard, FolderOpen, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/", label: "Create Report", icon: <FileText className="w-4 h-4" /> },
    { to: "/saved", label: "Saved Reports", icon: <FolderOpen className="w-4 h-4" /> },
  ] as const;

  const Nav = (
    <>
      <div className="flex items-center justify-between gap-2 mb-6 px-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">MyEduSarthak</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Report System</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded hover:bg-secondary" aria-label="Close menu">
          <X className="w-4 h-4" />
        </button>
      </div>
      {items.map((it) => {
        const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {it.icon}
            {it.label}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-border pt-3">
        {user && (
          <div className="px-3 pb-2 text-[11px] text-muted-foreground truncate" title={user.email ?? ""}>
            {user.email}
          </div>
        )}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary"
        >
          <LogOut className="w-4 h-4" />Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card border-b border-border h-12 flex items-center justify-between px-3">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 rounded hover:bg-secondary">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">MyEduSarthak</span>
        </div>
        <div className="w-9" />
      </div>
      <div className="lg:hidden h-12 shrink-0" aria-hidden />

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative w-64 max-w-[80%] bg-card border-r border-border p-4 flex flex-col gap-1 h-full overflow-y-auto">
            {Nav}
          </aside>
        </div>
      )}

      <aside className="w-60 bg-card border-r border-border p-4 hidden lg:flex flex-col gap-1">
        {Nav}
      </aside>
    </>
  );
}
