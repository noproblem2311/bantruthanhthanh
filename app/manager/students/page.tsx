import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { boardingPackageLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

export default async function ManagerStudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("*, parents(full_name,phone,username)")
    .eq("status", "active")
    .order("full_name");

  return (
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
            {(students || []).map((student) => (
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
                <TD>{boardingPackageLabels[student.boarding_package_type as keyof typeof boardingPackageLabels] || boardingPackageLabels.weekday}</TD>
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
      </CardContent>
    </Card>
  );
}
