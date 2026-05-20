import { AttendanceTable, type AttendanceStudent } from "@/components/attendance/attendance-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { getDateOrVietnamToday } from "@/lib/date";
import { getMessageParam } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildRedirectTo(date: string, q: string, status: string) {
  const params = new URLSearchParams();
  params.set("date", date);
  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  return `/manager/attendance?${params.toString()}`;
}

export default async function ManagerAttendancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = getDateOrVietnamToday(params.date);
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const supabase = await createClient();

  const [{ data: students }, { data: records }, { data: offRequests }] = await Promise.all([
    supabase.from("students").select("*, parents(full_name,username,phone)").eq("status", "active").order("full_name"),
    supabase.from("attendance_records").select("*").eq("attendance_date", date),
    supabase.from("off_requests").select("student_id").eq("off_date", date).in("status", ["auto_approved", "approved"]),
  ]);

  const recordMap = new Map(((records || []) as AttendanceRecord[]).map((record) => [record.student_id, record]));
  const approvedOffStudentIds = new Set((offRequests || []).map((request: { student_id: string }) => request.student_id));
  const filtered = ((students || []) as AttendanceStudent[]).filter((student) => {
    const text = `${student.full_name} ${student.parents?.full_name || ""} ${student.parents?.phone || ""}`.toLowerCase();
    const currentStatus = (recordMap.get(student.id)?.status || "not_marked") as AttendanceStatus;
    return (!q || text.includes(q)) && (status === "all" || currentStatus === status);
  });
  const redirectTo = buildRedirectTo(date, q, status);

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-[180px_1fr_220px_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="date">Ngày</Label>
              <Input id="date" name="date" type="date" defaultValue={date} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="q">Tìm kiếm</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Tên học sinh, phụ huynh, SĐT" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="all">Tất cả</option>
                <option value="not_marked">Chưa điểm danh</option>
                <option value="present">Có mặt</option>
                <option value="excused_absent">Nghỉ có phép</option>
                <option value="unexcused_absent">Vắng không phép</option>
              </Select>
            </div>
            <SubmitButton pendingText="Đang lọc...">Lọc</SubmitButton>
          </form>
        </CardContent>
      </Card>
      <AttendanceTable
        date={date}
        students={filtered}
        records={(records || []) as AttendanceRecord[]}
        approvedOffStudentIds={approvedOffStudentIds}
        redirectTo={redirectTo}
      />
    </div>
  );
}
