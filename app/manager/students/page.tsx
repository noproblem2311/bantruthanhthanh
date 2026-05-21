import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { boardingPackageLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { BoardingPackageType, Parent, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type StudentRow = Student & { parents: Pick<Parent, "full_name" | "username" | "phone"> | null };

export default async function ManagerStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const className = typeof params.class === "string" ? params.class : "all";
  const packageType = typeof params.package === "string" ? params.package : "all";
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
  const filtered = studentRows.filter((student) => {
    const text = `${student.full_name} ${student.class_name || ""} ${student.school_name || ""} ${student.parents?.full_name || ""} ${student.parents?.username || ""} ${student.parents?.phone || ""}`.toLowerCase();
    return (
      (!q || text.includes(q)) &&
      (className === "all" || student.class_name === className) &&
      (packageType === "all" || student.boarding_package_type === packageType)
    );
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc học sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1fr_160px_180px_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="q">Tìm kiếm</Label>
              <Input id="q" name="q" defaultValue={q} placeholder="Tên, lớp, phụ huynh, SĐT" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class">Lớp</Label>
              <Select id="class" name="class" defaultValue={className}>
                <option value="all">Tất cả</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="package">Gói bán trú</Label>
              <Select id="package" name="package" defaultValue={packageType}>
                <option value="all">Tất cả</option>
                <option value="weekday">{boardingPackageLabels.weekday}</option>
                <option value="saturday">{boardingPackageLabels.saturday}</option>
              </Select>
            </div>
            <SubmitButton pendingText="Đang lọc...">Lọc</SubmitButton>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            Hiển thị {filtered.length}/{studentRows.length} học sinh
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Học sinh đang bán trú</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Trường/Lớp</TH>
                <TH>Gói bán trú</TH>
                <TH>Phụ huynh liên hệ</TH>
                <TH>Ghi chú</TH>
              </tr>
            </THead>
            <TBody>
              {filtered.map((student) => (
                <tr key={student.id}>
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
          {filtered.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có học sinh phù hợp.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
