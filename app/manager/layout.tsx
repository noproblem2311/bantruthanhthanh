import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/dashboard-nav";
import { requireRole } from "@/lib/permissions";

const navItems: NavItem[] = [
  { href: "/manager", label: "Tổng quan", icon: "home" },
  { href: "/manager/timekeeping", label: "Chấm công", icon: "timekeeping" },
  { href: "/manager/attendance", label: "Điểm danh", icon: "attendance" },
  { href: "/manager/ingredients", label: "Nguyên liệu", icon: "ingredients" },
  { href: "/manager/off-requests", label: "Đơn xin nghỉ", icon: "requests" },
  { href: "/manager/students", label: "Học sinh", icon: "children" },
  { href: "/manager/tuition", label: "Nộp học phí", icon: "fees" },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("manager");
  return (
    <DashboardShell title="Quản lý bán trú" subtitle={profile.full_name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
