import { Link, useLocation } from "@tanstack/react-router";
import { FileText, LayoutDashboard, FolderOpen } from "lucide-react";

export function AppSidebar() {
  const { pathname } = useLocation();
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/", label: "Create Report", icon: <FileText className="w-4 h-4" /> },
    { to: "/saved", label: "Saved Reports", icon: <FolderOpen className="w-4 h-4" /> },
  ] as const;

  return (
    <aside className="w-60 bg-card border-r border-border p-4 hidden lg:flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-bold text-sm">MyEduSarthak</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Report System</div>
        </div>
      </div>
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {it.icon}
            {it.label}
          </Link>
        );
      })}
    </aside>
  );
}
