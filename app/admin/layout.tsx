import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/dashboard-nav";
import { requireRole } from "@/lib/permissions";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "home" },
  { href: "/admin/parents", label: "Phụ huynh", icon: "parents" },
  { href: "/admin/students", label: "Học sinh", icon: "children" },
  { href: "/admin/managers", label: "Quản lý", icon: "security" },
  { href: "/admin/attendance", label: "Điểm danh", icon: "attendance" },
  { href: "/admin/ingredients", label: "Nguyên liệu", icon: "ingredients" },
  { href: "/admin/off-requests", label: "Đơn xin nghỉ", icon: "requests" },
  { href: "/admin/password-reset-requests", label: "Cấp lại mật khẩu", icon: "security" },
  { href: "/admin/fee-settings", label: "Cấu hình phí", icon: "fees" },
  { href: "/admin/fees", label: "Tổng hợp phí", icon: "fees" },
  { href: "/admin/receipts", label: "Phiếu thu", icon: "receipts" },
  { href: "/admin/monthly-history", label: "Lịch sử", icon: "history" },
  { href: "/admin/settings", label: "Cài đặt", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");
  return (
    <DashboardShell title="Quản trị bán trú" subtitle={profile.full_name} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
