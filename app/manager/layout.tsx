import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/dashboard-nav";
import { requireRole } from "@/lib/permissions";

const navItems: NavItem[] = [
  { href: "/manager/attendance", label: "Điểm danh", icon: "attendance" },
  { href: "/manager/tuition", label: "Nộp học phí", icon: "fees" },
  { href: "/manager/ingredients", label: "Nguyên liệu", icon: "ingredients" },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("manager");
  return (
    <DashboardShell title="Quản lý bán trú" subtitle={profile.full_name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
