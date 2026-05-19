import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMessageParam } from "@/lib/utils";
import { statusLabels } from "@/lib/labels";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminParentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const supabase = await createClient();
  let query = supabase.from("parents").select("*, students(id)").order("created_at", { ascending: false });
  if (q) query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: parents } = await query;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Phụ huynh</h2>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản username/password cho phụ huynh.</p>
        </div>
        <ButtonLink href="/admin/parents/new">
          <Plus className="h-4 w-4" />
          Tạo phụ huynh
        </ButtonLink>
      </div>
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex max-w-lg items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="q">Tên, username, số điện thoại</Label>
              <Input id="q" name="q" defaultValue={q} />
            </div>
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white">Tìm</button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Phụ huynh</TH>
                <TH>Liên hệ</TH>
                <TH>Số con</TH>
                <TH>Trạng thái</TH>
                <TH></TH>
              </tr>
            </THead>
            <TBody>
              {(parents || []).map((parent) => (
                <tr key={parent.id}>
                  <TD>
                    <p className="font-medium">{parent.full_name || parent.username}</p>
                    <p className="text-xs text-muted-foreground">{parent.username}</p>
                  </TD>
                  <TD>
                    <p>{parent.phone || "Chưa có SĐT"}</p>
                    <p className="text-xs text-muted-foreground">{parent.email || "Chưa có email"}</p>
                  </TD>
                  <TD>{parent.students?.length || 0}</TD>
                  <TD>
                    <Badge variant={parent.status === "active" ? "success" : "muted"}>{statusLabels[parent.status]}</Badge>
                  </TD>
                  <TD>
                    <Link className="font-medium text-primary" href={`/admin/parents/${parent.id}`}>
                      Chi tiết
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
