import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("*, parents(full_name,username,phone)").order("created_at", { ascending: false });

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
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Phụ huynh</TH>
                <TH>Trường/Lớp</TH>
                <TH>Trạng thái</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {(students || []).map((student) => (
                <tr key={student.id}>
                  <TD>{student.full_name}</TD>
                  <TD>
                    <p>{student.parents?.full_name || student.parents?.username}</p>
                    <p className="text-xs text-muted-foreground">{student.parents?.phone || "Chưa có SĐT"}</p>
                  </TD>
                  <TD>
                    <p>{student.school_name || "Chưa có trường"}</p>
                    <p className="text-xs text-muted-foreground">{student.class_name || "Chưa có lớp"}</p>
                  </TD>
                  <TD>
                    <Badge variant={student.status === "active" ? "success" : "muted"}>{student.status}</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
