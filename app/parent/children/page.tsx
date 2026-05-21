import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate } from "@/lib/date";
import { boardingPackageLabels } from "@/lib/labels";

export default async function ParentChildrenPage() {
  const supabase = await createClient();
  const { data: children } = await supabase.from("students").select("*").order("full_name");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Con của tôi</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <THead>
            <tr>
              <TH>Học sinh</TH>
              <TH>Ngày sinh</TH>
              <TH>Trường/Lớp</TH>
              <TH>Gói bán trú</TH>
              <TH>Ghi chú</TH>
            </tr>
          </THead>
          <TBody>
            {(children || []).map((child) => (
              <tr key={child.id}>
                <TD>
                  <p className="font-medium">{child.full_name}</p>
                  {child.nickname ? <p className="text-xs text-muted-foreground">Tên gọi: {child.nickname}</p> : null}
                  <Badge className="mt-2" variant={child.status === "active" ? "success" : "muted"}>
                    {child.status === "active" ? "Đang học" : "Tạm ngưng"}
                  </Badge>
                </TD>
                <TD>{formatVietnamDate(child.date_of_birth)}</TD>
                <TD>
                  <p>{child.school_name || "Chưa có trường"}</p>
                  <p className="text-sm text-muted-foreground">{child.class_name || "Chưa có lớp"}</p>
                </TD>
                <TD>{boardingPackageLabels[child.boarding_package_type as keyof typeof boardingPackageLabels] || boardingPackageLabels.weekday}</TD>
                <TD className="max-w-sm">
                  <p>{child.health_notes || child.allergy_notes || child.pickup_notes || "Không có ghi chú"}</p>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
        {(children || []).length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có học sinh.</div> : null}
      </CardContent>
    </Card>
  );
}
