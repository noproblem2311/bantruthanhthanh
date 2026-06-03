import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientListFilters } from "@/components/ui/client-list-filters";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { boardingPackageLabels, boardingPackageOptions, statusLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate, getVietnamDateFromTimestamp } from "@/lib/date";
import type { BoardingPackageType, Parent, RecordStatus, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type StudentRow = Student & { parents: Pick<Parent, "full_name" | "username" | "phone"> | null };

export default async function AdminStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  await searchParams;
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("*, parents(full_name,username,phone)").order("created_at", { ascending: false });
  const studentRows = (students || []) as StudentRow[];
  const classOptions = Array.from(new Set(studentRows.map((student) => student.class_name).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, "vi"),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Học sinh</h2>
          <p className="text-sm text-muted-foreground">CRUD học sinh và liên kết phụ huynh.</p>
        </div>
        <ButtonLink href="/admin/students/new">
          <Plus className="h-4 w-4" />
          Tạo học sinh
        </ButtonLink>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientListFilters
            targetId="admin-students-results"
            searchPlaceholder="Tên, lớp, phụ huynh, SĐT"
            countLabel="học sinh"
            className="lg:grid-cols-[1fr_160px_160px_180px] lg:items-start"
            filters={[
              {
                key: "class",
                label: "Lớp",
                options: [{ value: "all", label: "Tất cả" }, ...classOptions.map((option) => ({ value: option, label: option }))],
              },
              {
                key: "status",
                label: "Trạng thái",
                options: [
                  { value: "all", label: "Tất cả" },
                  { value: "active", label: statusLabels.active },
                  { value: "inactive", label: statusLabels.inactive },
                ],
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
        <CardContent id="admin-students-results" className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Phụ huynh</TH>
                <TH>Trường/Lớp</TH>
                <TH>Gói bán trú</TH>
                <TH>Ngày vào</TH>
                <TH>Trạng thái</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {studentRows.map((student) => (
                <tr
                  key={student.id}
                  data-search-key={student.id}
                  data-search-text={`${student.full_name} ${student.class_name || ""} ${student.school_name || ""} ${student.parents?.full_name || ""} ${student.parents?.username || ""} ${student.parents?.phone || ""}`}
                  data-filter-class={student.class_name || ""}
                  data-filter-status={student.status}
                  data-filter-package={student.boarding_package_type || "weekday"}
                >
                  <TD>{student.full_name}</TD>
                  <TD>
                    <p>{student.parents?.full_name || student.parents?.username}</p>
                    <p className="text-xs text-muted-foreground">{student.parents?.phone || "Chưa có SĐT"}</p>
                  </TD>
                  <TD>
                    <p>{student.school_name || "Chưa có trường"}</p>
                    <p className="text-xs text-muted-foreground">{student.class_name || "Chưa có lớp"}</p>
                  </TD>
                  <TD>{boardingPackageLabels[(student.boarding_package_type || "weekday") as BoardingPackageType]}</TD>
                  <TD>{formatVietnamDate(student.enrollment_date || getVietnamDateFromTimestamp(student.created_at))}</TD>
                  <TD>
                    <Badge variant={student.status === "active" ? "success" : "muted"}>{statusLabels[student.status as RecordStatus]}</Badge>
                  </TD>
                  <TD>
                    <Link className="font-medium text-primary" href={`/admin/students/${student.id}`}>
                      Sửa
                    </Link>
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
