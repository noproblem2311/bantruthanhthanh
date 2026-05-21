"use client";

import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function AttendanceFilterCard({
  date,
  q,
  status,
  qPlaceholder = "Tên học sinh, phụ huynh, SĐT",
}: {
  date: string;
  q: string;
  status: string;
  qPlaceholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardContent className="p-4">
        <form ref={formRef} className="grid gap-3 md:grid-cols-[180px_1fr_220px_auto] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="date">Ngày</Label>
            <Input id="date" name="date" type="date" defaultValue={date} onChange={() => formRef.current?.requestSubmit()} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="q">Tìm kiếm</Label>
            <Input id="q" name="q" defaultValue={q} placeholder={qPlaceholder} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select id="status" name="status" defaultValue={status}>
              <option value="all">Tất cả</option>
              <option value="not_marked">Chưa điểm danh</option>
              <option value="present">Có mặt</option>
              <option value="excused_absent">Nghỉ có phép</option>
              <option value="unexcused_absent">Vắng không phép</option>
            </Select>
          </div>
          <SubmitButton pendingText="Đang lọc...">Lọc</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
