"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ClientSearch } from "@/components/ui/client-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function AttendanceFilterCard({
  date,
  status,
  searchTargetId,
  qPlaceholder = "Tên học sinh, phụ huynh, SĐT",
}: {
  date: string;
  status: string;
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
          <div className="grid gap-2 md:col-start-3">
            <Label htmlFor="status">Trạng thái</Label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="all">Tất cả</option>
              <option value="not_marked">Chưa điểm danh</option>
              <option value="present">Có mặt</option>
              <option value="excused_absent">Nghỉ có phép</option>
              <option value="unexcused_absent">Vắng không phép</option>
            </Select>
          </div>
          <SubmitButton pendingText="Đang tải..." className="md:col-start-4">
            Xem dữ liệu
          </SubmitButton>
          </form>
          <ClientSearch
            targetId={searchTargetId}
            placeholder={qPlaceholder}
            countLabel="học sinh"
            className="md:col-start-2 md:row-start-1"
            disableControlsWhenHidden
          />
        </div>
      </CardContent>
    </Card>
  );
}
