"use client";

import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

type UnpaidTuitionMonth = {
  billingYearMonth: string;
  label: string;
  amount: number | null;
};

function formatAmount(value: number | null, currency: string) {
  return value === null ? "Chưa tính" : formatCurrency(value, currency);
}

function FeeStat({
  label,
  value,
  currency,
  highlight = false,
}: {
  label: string;
  value: number | null;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${highlight ? "border-primary/25 bg-primary/5" : "bg-muted/20"}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-base font-semibold leading-tight ${highlight ? "text-primary" : ""}`}>
        {formatAmount(value, currency)}
      </p>
    </div>
  );
}

export function TuitionFeeDebt({
  studentName,
  currentMonthFee,
  previousMonthDebt,
  previousMonthLabel,
  unpaidMonths,
  currency = "VND",
}: {
  studentName: string;
  currentMonthFee: number | null;
  previousMonthDebt: number | null;
  previousMonthLabel: string;
  unpaidMonths: UnpaidTuitionMonth[];
  currency?: string;
}) {
  const hasUnpaidHistory = unpaidMonths.length > 0;
  const totalDebt =
    unpaidMonths.length > 0 && unpaidMonths.every((month) => month.amount !== null)
      ? unpaidMonths.reduce((sum, month) => sum + (month.amount || 0), 0)
      : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <FeeStat label="Học phí tháng" value={currentMonthFee} currency={currency} highlight />
        <FeeStat label={`Nợ ${previousMonthLabel}`} value={previousMonthDebt} currency={currency} />
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Các tháng còn nợ</p>
          <p className="text-sm font-medium">
            {hasUnpaidHistory ? `${unpaidMonths.length} tháng · ${formatAmount(totalDebt, currency)}` : "Không có"}
          </p>
        </div>
        {hasUnpaidHistory ? (
          <Dialog
            title={`Các tháng còn nợ — ${studentName}`}
            trigger={
              <Button type="button" variant="outline" size="sm" className="shrink-0">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Chi tiết</span>
                <span className="sm:hidden">Xem</span>
              </Button>
            }
          >
            <div className="max-h-[min(60vh,420px)] space-y-2 overflow-y-auto pr-1">
              {unpaidMonths.map((month) => (
                <div
                  key={month.billingYearMonth}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm"
                >
                  <span className="capitalize">{month.label}</span>
                  <span className="shrink-0 font-medium">{formatAmount(month.amount, currency)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
              Tổng nợ: <span className="font-semibold text-foreground">{formatAmount(totalDebt, currency)}</span>
            </p>
          </Dialog>
        ) : null}
      </div>
    </div>
  );
}
