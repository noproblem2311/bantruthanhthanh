import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { NavItem } from "./dashboard-nav";
import { DashboardNav } from "./dashboard-nav";
import { Button } from "@/components/ui/button";

export function DashboardShell({
  title,
  subtitle,
  navItems,
  children,
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Bán trú Learning Hub</p>
            <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </form>
        </div>
      </header>
      <div className="container-page grid gap-5 py-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border bg-white shadow-soft lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <div className="border-b p-4">
            <p className="text-sm font-medium text-slate-900">{subtitle}</p>
          </div>
          <DashboardNav items={navItems} />
        </aside>
        <main className="min-w-0 space-y-5">{children}</main>
      </div>
    </div>
  );
}
