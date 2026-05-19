import { AlertTriangle, CalendarCheck, CreditCard, UsersRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getVietnamToday, getYearMonth, getMonthBounds } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";

export default async function ParentDashboardPage() {
  const profile = await requireRole("parent");
  const supabase = await createClient();
  const today = getVietnamToday();
  const yearMonth = getYearMonth();
  const { start, end } = getMonthBounds(yearMonth);

  const { data: parent } = await supabase.from("parents").select("*").eq("auth_user_id", profile.auth_user_id).single();
  const { data: children } = await supabase.from("students").select("*").eq("status", "active").order("full_name");
  const childIds = (children || []).map((child) => child.id);

  const [{ data: todayOff }, { data: monthlyAttendance }, { data: feeSetting }] = await Promise.all([
    childIds.length
      ? supabase.from("off_requests").select("*").eq("off_date", today).in("student_id", childIds)
      : Promise.resolve({ data: [] }),
    childIds.length
      ? supabase
          .from("attendance_records")
          .select("*")
          .gte("attendance_date", start)
          .lt("attendance_date", end)
          .in("student_id", childIds)
      : Promise.resolve({ data: [] }),
    supabase.from("fee_settings").select("*").eq("year_month", yearMonth).maybeSingle(),
  ]);

  const presentDays = (monthlyAttendance || []).filter((record) => record.status === "present").length;
  const estimatedFee = feeSetting ? presentDays * feeSetting.fee_per_attendance_day : null;

  return (
    <div className="space-y-5">
      {parent && !parent.profile_completed ? (
        <Alert variant="warning" className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-medium">Vui lòng cập nhật thông tin phụ huynh để bán trú tiện liên hệ khi cần.</p>
            <ButtonLink href="/parent/profile" size="sm" className="mt-3">
              Cập nhật hồ sơ
            </ButtonLink>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Số con đang bán trú" value={children?.length || 0} icon={UsersRound} />
        <StatCard title="Đơn xin nghỉ hôm nay" value={todayOff?.length || 0} icon={CalendarCheck} />
        <StatCard title="Số buổi có mặt tháng này" value={presentDays} icon={CalendarCheck} />
        <StatCard
          title="Phí dự kiến tháng này"
          value={estimatedFee === null ? "Chưa cấu hình" : formatCurrency(estimatedFee)}
          icon={CreditCard}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Con của tôi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(children || []).map((child) => (
            <div key={child.id} className="rounded-lg border p-4">
              <p className="font-semibold">{child.full_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {child.school_name || "Chưa có trường"} · {child.class_name || "Chưa có lớp"}
              </p>
            </div>
          ))}
          {(children || []).length === 0 ? <p className="text-sm text-muted-foreground">Chưa có học sinh nào được gắn với tài khoản này.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
