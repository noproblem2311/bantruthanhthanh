import { CalendarCheck, ClipboardList, CreditCard, KeyRound, UserCheck, UsersRound } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMonthBounds, getVietnamToday, getYearMonth } from "@/lib/date";
import { attendanceBadgeVariant, attendanceLabels, offRequestBadgeVariant, offRequestLabels } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = getVietnamToday();
  const yearMonth = getYearMonth();
  const { start, end } = getMonthBounds(yearMonth);

  const [
    { count: activeStudents },
    { count: activeParents },
    { data: todayAttendance },
    { data: todayOffRequests },
    { count: pendingPasswordRequests },
    { data: monthlyPresent },
    { data: feeSetting },
    { data: latestOffRequests },
    { data: latestPasswordRequests },
    { data: latestParents },
    { data: latestStudents },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("parents").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("attendance_records").select("*, students(full_name)").eq("attendance_date", today),
    supabase.from("off_requests").select("*, students(full_name), parents(full_name,username)").eq("off_date", today),
    supabase.from("password_reset_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("attendance_records").select("id,status").eq("status", "present").gte("attendance_date", start).lt("attendance_date", end),
    supabase.from("fee_settings").select("*").eq("year_month", yearMonth).maybeSingle(),
    supabase.from("off_requests").select("*, students(full_name), parents(full_name,username)").order("submitted_at", { ascending: false }).limit(5),
    supabase.from("password_reset_requests").select("*, parents(full_name,username)").order("requested_at", { ascending: false }).limit(5),
    supabase.from("parents").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("students").select("*, parents(full_name,username)").order("created_at", { ascending: false }).limit(5),
  ]);

  const presentToday = (todayAttendance || []).filter((record) => record.status === "present").length;
  const excusedToday = (todayAttendance || []).filter((record) => record.status === "excused_absent").length;
  const markedStudentIds = new Set((todayAttendance || []).filter((record) => record.status !== "not_marked").map((record) => record.student_id));
  const notMarkedToday = Math.max((activeStudents || 0) - markedStudentIds.size, 0);
  const presentMonth = monthlyPresent?.length || 0;
  const estimatedRevenue = feeSetting ? presentMonth * feeSetting.fee_per_attendance_day : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Học sinh active" value={activeStudents || 0} icon={UsersRound} />
        <StatCard title="Phụ huynh active" value={activeParents || 0} icon={UsersRound} />
        <StatCard title="Có mặt hôm nay" value={presentToday} icon={UserCheck} />
        <StatCard title="Nghỉ có phép hôm nay" value={excusedToday} icon={CalendarCheck} />
        <StatCard title="Chưa điểm danh hôm nay" value={notMarkedToday} icon={ClipboardList} />
        <StatCard title="Đơn xin nghỉ hôm nay" value={todayOffRequests?.length || 0} icon={ClipboardList} />
        <StatCard title="Yêu cầu reset pending" value={pendingPasswordRequests || 0} icon={KeyRound} />
        <StatCard
          title="Doanh thu dự kiến tháng"
          value={estimatedRevenue === null ? "Chưa cấu hình" : formatCurrency(estimatedRevenue)}
          description={`${presentMonth} buổi bán trú`}
          icon={CreditCard}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đơn xin nghỉ mới nhất</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Học sinh</TH>
                  <TH>Phụ huynh</TH>
                  <TH>Trạng thái</TH>
                </tr>
              </THead>
              <TBody>
                {(latestOffRequests || []).map((request) => (
                  <tr key={request.id}>
                    <TD>{request.students?.full_name}</TD>
                    <TD>{request.parents?.full_name || request.parents?.username}</TD>
                    <TD>
                      <Badge variant={offRequestBadgeVariant(request.status)}>{offRequestLabels[request.status]}</Badge>
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu cấp lại mật khẩu</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Username</TH>
                  <TH>Phụ huynh</TH>
                  <TH>Trạng thái</TH>
                </tr>
              </THead>
              <TBody>
                {(latestPasswordRequests || []).map((request) => (
                  <tr key={request.id}>
                    <TD>{request.username}</TD>
                    <TD>{request.parents?.full_name || "Chưa khớp hồ sơ"}</TD>
                    <TD>
                      <Badge variant={request.status === "pending" ? "warning" : request.status === "resolved" ? "success" : "danger"}>
                        {request.status}
                      </Badge>
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Điểm danh hôm nay</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Học sinh</TH>
                  <TH>Trạng thái</TH>
                </tr>
              </THead>
              <TBody>
                {(todayAttendance || []).slice(0, 8).map((record) => (
                  <tr key={record.id}>
                    <TD>{record.students?.full_name}</TD>
                    <TD>
                      <Badge variant={attendanceBadgeVariant(record.status)}>{attendanceLabels[record.status]}</Badge>
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mới tạo gần đây</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <p className="mb-2 text-sm font-semibold">Phụ huynh</p>
              {(latestParents || []).map((parent) => (
                <p key={parent.id} className="text-sm text-muted-foreground">
                  {parent.full_name || parent.username} · {parent.username}
                </p>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Học sinh</p>
              {(latestStudents || []).map((student) => (
                <p key={student.id} className="text-sm text-muted-foreground">
                  {student.full_name} · {student.parents?.full_name || student.parents?.username}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
