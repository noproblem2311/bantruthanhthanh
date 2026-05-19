import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/dashboard-nav";
import { requireRole } from "@/lib/permissions";

const navItems: NavItem[] = [
  { href: "/parent", label: "Tổng quan", icon: "home" },
  { href: "/parent/children", label: "Con của tôi", icon: "children" },
  { href: "/parent/off-requests", label: "Xin nghỉ", icon: "requests" },
  { href: "/parent/attendance", label: "Điểm danh", icon: "attendance" },
  { href: "/parent/fees", label: "Phí tháng", icon: "fees" },
  { href: "/parent/profile", label: "Hồ sơ", icon: "profile" },
];

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("parent");
  return (
    <DashboardShell title="Cổng phụ huynh" subtitle={profile.full_name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
