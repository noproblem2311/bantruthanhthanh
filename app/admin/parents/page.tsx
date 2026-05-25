import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSearch } from "@/components/ui/client-search";
import { PageMessage } from "@/components/ui/message";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMessageParam } from "@/lib/utils";
import { statusLabels } from "@/lib/labels";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminParentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: parents } = await supabase.from("parents").select("*, students(id)").order("created_at", { ascending: false });

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
          <ClientSearch targetId="admin-parents-results" label="Tên, username, số điện thoại" placeholder="Nhập để lọc ngay" countLabel="phụ huynh" className="max-w-lg" />
        </CardContent>
      </Card>
      <Card>
        <CardContent id="admin-parents-results" className="p-0">
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
                <tr
                  key={parent.id}
                  data-search-key={parent.id}
                  data-search-text={`${parent.full_name || ""} ${parent.username} ${parent.phone || ""} ${parent.email || ""}`}
                >
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
