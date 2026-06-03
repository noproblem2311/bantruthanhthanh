import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientListFilters } from "@/components/ui/client-list-filters";
import { PageMessage } from "@/components/ui/message";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { boardingPackageLabels, boardingPackageOptions } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate, getVietnamDateFromTimestamp } from "@/lib/date";
import { getMessageParam } from "@/lib/utils";
import type { BoardingPackageType, Parent, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type StudentRow = Student & { parents: Pick<Parent, "full_name" | "username" | "phone"> | null };

export default async function ManagerStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*, parents(full_name,phone,username)")
    .eq("status", "active")
    .order("full_name");
  const studentRows = (students || []) as StudentRow[];
  const classOptions = Array.from(new Set(studentRows.map((student) => student.class_name).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, "vi"),
  );

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Học sinh</h2>
          <p className="text-sm text-muted-foreground">Xem danh sách và thêm học sinh mới.</p>
        </div>
        <ButtonLink href="/manager/students/new">
          <Plus className="h-4 w-4" />
          Tạo học sinh
        </ButtonLink>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc học sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientListFilters
            targetId="manager-students-results"
            searchPlaceholder="Tên, lớp, phụ huynh, SĐT"
            countLabel="học sinh"
            className="lg:grid-cols-[1fr_160px_180px] lg:items-start"
            filters={[
              {
                key: "class",
                label: "Lớp",
                options: [{ value: "all", label: "Tất cả" }, ...classOptions.map((option) => ({ value: option, label: option }))],
              },
              {
                key: "package",
                label: "Gói bán trú",
                options: [{ value: "all", label: "Tất cả" }, ...boardingPackageOptions],
              },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Học sinh đang bán trú</CardTitle>
        </CardHeader>
        <CardContent id="manager-students-results" className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Trường/Lớp</TH>
                <TH>Gói bán trú</TH>
                <TH>Ngày vào</TH>
                <TH>Phụ huynh liên hệ</TH>
                <TH>Ghi chú</TH>
              </tr>
            </THead>
            <TBody>
              {studentRows.map((student) => (
                <tr
                  key={student.id}
                  data-search-key={student.id}
                  data-search-text={`${student.full_name} ${student.class_name || ""} ${student.school_name || ""} ${student.parents?.full_name || ""} ${student.parents?.username || ""} ${student.parents?.phone || ""}`}
                  data-filter-class={student.class_name || ""}
                  data-filter-package={student.boarding_package_type || "weekday"}
                >
                  <TD>
                    <p className="font-medium">{student.full_name}</p>
                    <Badge className="mt-2" variant="success">
                      Active
                    </Badge>
                  </TD>
                  <TD>
                    <p>{student.school_name || "Chưa có trường"}</p>
                    <p className="text-sm text-muted-foreground">{student.class_name || "Chưa có lớp"}</p>
                  </TD>
                  <TD>{boardingPackageLabels[(student.boarding_package_type || "weekday") as BoardingPackageType]}</TD>
                  <TD>{formatVietnamDate(student.enrollment_date || getVietnamDateFromTimestamp(student.created_at))}</TD>
                  <TD>
                    <p>{student.parents?.full_name || student.parents?.username}</p>
                    <p className="text-sm text-muted-foreground">{student.parents?.phone || "Chưa có SĐT"}</p>
                  </TD>
                  <TD className="max-w-md">
                    {[student.health_notes, student.allergy_notes, student.pickup_notes].filter(Boolean).join(" · ") || "Không có"}
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
          {studentRows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có học sinh phù hợp.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
