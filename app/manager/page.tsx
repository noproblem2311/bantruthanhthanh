import { CalendarCheck, ClipboardList, UserCheck, UsersRound } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getVietnamToday } from "@/lib/date";
import { attendanceBadgeVariant, attendanceLabels } from "@/lib/labels";

export default async function ManagerDashboardPage() {
  const supabase = await createClient();
  const today = getVietnamToday();

  const [{ data: students }, { data: attendance }, { data: offRequests }] = await Promise.all([
    supabase.from("students").select("*").eq("status", "active"),
    supabase.from("attendance_records").select("*, students(full_name)").eq("attendance_date", today),
    supabase.from("off_requests").select("*, students(full_name)").eq("off_date", today),
  ]);

  const present = (attendance || []).filter((record) => record.status === "present").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Học sinh active" value={students?.length || 0} icon={UsersRound} />
        <StatCard title="Có mặt hôm nay" value={present} icon={UserCheck} />
        <StatCard title="Đơn xin nghỉ hôm nay" value={offRequests?.length || 0} icon={ClipboardList} />
        <StatCard title="Đã điểm danh" value={attendance?.length || 0} icon={CalendarCheck} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Điểm danh hôm nay</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(attendance || []).slice(0, 12).map((record) => (
            <div key={record.id} className="rounded-lg border p-3">
              <p className="font-medium">{record.students?.full_name}</p>
              <Badge className="mt-2" variant={attendanceBadgeVariant(record.status)}>
                {attendanceLabels[record.status]}
              </Badge>
            </div>
          ))}
          {(attendance || []).length === 0 ? <p className="text-sm text-muted-foreground">Chưa có điểm danh hôm nay.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
