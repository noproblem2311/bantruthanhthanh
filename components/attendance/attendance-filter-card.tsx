"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClientListFilters } from "@/components/ui/client-list-filters";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

export function AttendanceFilterCard({
  date,
  searchTargetId,
  qPlaceholder = "Tên học sinh, phụ huynh, SĐT",
}: {
  date: string;
  searchTargetId: string;
  qPlaceholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_220px_auto] md:items-end">
          <form ref={formRef} method="get" className="contents">
          <div className="grid gap-2">
            <Label htmlFor="date">Ngày</Label>
            <Input id="date" name="date" type="date" defaultValue={date} onChange={() => formRef.current?.requestSubmit()} required />
          </div>
          <SubmitButton pendingText="Đang tải..." className="md:col-start-4">
            Xem dữ liệu
          </SubmitButton>
          </form>
          <ClientListFilters
            targetId={searchTargetId}
            searchPlaceholder={qPlaceholder}
            countLabel="học sinh"
            className="md:col-span-2 md:col-start-2 md:row-start-1 md:grid-cols-[1fr_220px]"
            disableControlsWhenHidden
            filters={[
              {
                key: "status",
                label: "Trạng thái",
                options: [
                  { value: "all", label: "Tất cả" },
                  { value: "not_marked", label: "Chưa điểm danh" },
                  { value: "present", label: "Có mặt" },
                  { value: "excused_absent", label: "Nghỉ có phép" },
                  { value: "unexcused_absent", label: "Vắng không phép" },
                ],
              },
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}
