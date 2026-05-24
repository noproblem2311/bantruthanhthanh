"use client";

import { useMemo, useState } from "react";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { createManualReceiptBatchAction } from "@/lib/actions/receipts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ManualReceiptRow = {
  rowKey: string;
  student_name: string;
  class_name: string;
  start_date: string;
  studies_saturday: boolean;
  boarding_amount: number;
  saturday_amount: number;
  computer_amount: number;
  english_amount: number;
  other_label: string;
  other_amount: number;
  note: string;
};

function createRow(): ManualReceiptRow {
  return {
    rowKey: crypto.randomUUID(),
    student_name: "",
    class_name: "",
    start_date: "",
    studies_saturday: false,
    boarding_amount: 0,
    saturday_amount: 0,
    computer_amount: 0,
    english_amount: 0,
    other_label: "",
    other_amount: 0,
    note: "",
  };
}

function parseMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function getRowTotal(row: ManualReceiptRow) {
  return row.boarding_amount + row.saturday_amount + row.computer_amount + row.english_amount + row.other_amount;
}

export function ManualReceiptTable({ defaultBillingMonth }: { defaultBillingMonth: string }) {
  const [rows, setRows] = useState<ManualReceiptRow[]>(() => Array.from({ length: 3 }, () => createRow()));
  const total = useMemo(() => rows.reduce((sum, row) => sum + getRowTotal(row), 0), [rows]);

  function updateRow(index: number, patch: Partial<ManualReceiptRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)));
  }

  const payload = rows
    .filter((row) => row.student_name.trim())
    .map((row) => ({
      student_name: row.student_name,
      class_name: row.class_name,
      start_date: row.start_date,
      studies_saturday: row.studies_saturday,
      boarding_amount: row.boarding_amount,
      saturday_amount: row.saturday_amount,
      computer_amount: row.computer_amount,
      english_amount: row.english_amount,
      other_label: row.other_label,
      other_amount: row.other_amount,
      note: row.note,
    }));

  return (
    <form action={createManualReceiptBatchAction} className="space-y-4">
      <input type="hidden" name="items_json" value={JSON.stringify(payload)} />
      <div className="grid gap-3 md:grid-cols-[1fr_180px] md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="receipt-title">Tên batch</Label>
          <Input id="receipt-title" name="title" defaultValue="Phiếu thu nhập tay" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="billing-year-month">Tháng thu tiền</Label>
          <Input id="billing-year-month" name="billing_year_month" type="month" defaultValue={defaultBillingMonth} required />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="receipt-note">Ghi chú batch</Label>
        <Textarea id="receipt-note" name="note" className="min-h-16" placeholder="Ví dụ: phiếu từ ngày 18, nhóm bổ sung từ ngày 25..." />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 px-3 py-2">
        <p className="text-sm font-medium">
          Tổng tạm tính: <span className="text-primary">{formatCurrency(total)}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setRows((current) => [...current, createRow()])}>
            <Plus className="h-4 w-4" />
            Thêm dòng
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((current) => [...current, ...Array.from({ length: 10 }, () => createRow())])}
          >
            <Plus className="h-4 w-4" />
            Thêm 10 dòng
          </Button>
        </div>
      </div>

      <Table>
        <THead>
          <tr>
            <TH className="min-w-[180px]">Học sinh</TH>
            <TH className="min-w-[90px]">Lớp</TH>
            <TH className="min-w-[140px]">Bắt đầu</TH>
            <TH className="min-w-[90px]">Thứ 7</TH>
            <TH className="min-w-[130px]">Bán trú</TH>
            <TH className="min-w-[130px]">Tiền T7</TH>
            <TH className="min-w-[130px]">Tin học</TH>
            <TH className="min-w-[130px]">Tiếng Anh</TH>
            <TH className="min-w-[170px]">Khoản khác</TH>
            <TH className="min-w-[130px]">Tổng</TH>
            <TH className="min-w-[160px]">Ghi chú</TH>
            <TH></TH>
          </tr>
        </THead>
        <TBody>
          {rows.map((row, index) => (
            <tr key={row.rowKey}>
              <TD>
                <Input value={row.student_name} onChange={(event) => updateRow(index, { student_name: event.target.value })} placeholder="Tên học sinh" />
              </TD>
              <TD>
                <Input value={row.class_name} onChange={(event) => updateRow(index, { class_name: event.target.value })} placeholder="1/3" />
              </TD>
              <TD>
                <Input type="date" value={row.start_date} onChange={(event) => updateRow(index, { start_date: event.target.value })} />
              </TD>
              <TD>
                <label className="flex min-h-10 items-center justify-center rounded-md border bg-white px-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.studies_saturday}
                    onChange={(event) => updateRow(index, { studies_saturday: event.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              </TD>
              <TD>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={row.boarding_amount}
                  onChange={(event) => updateRow(index, { boarding_amount: parseMoney(event.target.value) })}
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={row.saturday_amount}
                  onChange={(event) => updateRow(index, { saturday_amount: parseMoney(event.target.value) })}
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={row.computer_amount}
                  onChange={(event) => updateRow(index, { computer_amount: parseMoney(event.target.value) })}
                />
              </TD>
              <TD>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  value={row.english_amount}
                  onChange={(event) => updateRow(index, { english_amount: parseMoney(event.target.value) })}
                />
              </TD>
              <TD>
                <div className="grid gap-2">
                  <Input value={row.other_label} onChange={(event) => updateRow(index, { other_label: event.target.value })} placeholder="Tên khoản" />
                  <Input
                    type="number"
                    step={1000}
                    value={row.other_amount}
                    onChange={(event) => updateRow(index, { other_amount: parseMoney(event.target.value) })}
                  />
                </div>
              </TD>
              <TD className="font-medium">{formatCurrency(getRowTotal(row))}</TD>
              <TD>
                <Textarea value={row.note} onChange={(event) => updateRow(index, { note: event.target.value })} className="min-h-10" />
              </TD>
              <TD>
                <Button type="button" variant="ghost" size="icon" aria-label="Xoá dòng" onClick={() => removeRow(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TD>
            </tr>
          ))}
        </TBody>
      </Table>

      <div className="flex justify-end">
        <SubmitButton pendingText="Đang tạo phiếu..." disabled={payload.length === 0}>
          <ReceiptText className="h-4 w-4" />
          Lưu batch và mở phiếu
        </SubmitButton>
      </div>
    </form>
  );
}
