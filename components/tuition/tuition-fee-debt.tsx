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

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
      <div className="min-w-[132px] rounded-md border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">Học phí tháng</p>
        <p className="font-semibold text-primary">{formatAmount(currentMonthFee, currency)}</p>
      </div>

      <div className="min-w-[148px] rounded-md border px-3 py-2">
        <p className="text-xs text-muted-foreground">Nợ {previousMonthLabel}</p>
        <p className="font-semibold">{formatAmount(previousMonthDebt, currency)}</p>
      </div>

      {hasUnpaidHistory ? (
        <Dialog
          title={`Các tháng còn nợ — ${studentName}`}
          trigger={
            <Button type="button" variant="outline" size="sm" className="mt-1 shrink-0">
              <List className="h-4 w-4" />
              Chi tiết
            </Button>
          }
        >
          <div className="space-y-2">
            {unpaidMonths.map((month) => (
              <div key={month.billingYearMonth} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="capitalize">{month.label}</span>
                <span className="font-medium">{formatAmount(month.amount, currency)}</span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Tổng nợ:{" "}
              <span className="font-medium text-foreground">
                {formatAmount(
                  unpaidMonths.every((month) => month.amount !== null)
                    ? unpaidMonths.reduce((sum, month) => sum + (month.amount || 0), 0)
                    : null,
                  currency,
                )}
              </span>
            </p>
          </div>
        </Dialog>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Không có tháng nợ</p>
      )}
    </div>
  );
}
