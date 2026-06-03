import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { TuitionFeeDebt } from "@/components/tuition/tuition-fee-debt";
import { formatVietnamDateTime } from "@/lib/date";
type TuitionStudentRowProps = {
  studentId: string;
  fullName: string;
  studentClassName: string | null;
  parentName: string | null;
  parentUsername: string | null;
  parentPhone: string | null;
  isPaid: boolean;
  receiptSent: boolean;
  note: string;
  updatedAt: string | null;
  previousMonthLabel: string;
  currency: string;
  debt?: {
    currentMonthFee: number | null;
    previousMonthDebt: number | null;
    unpaidMonths: { billingYearMonth: string; label: string; amount: number | null }[];
  };
};

function StatusCheckbox({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-5 w-5 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

export function TuitionStudentRow({
  studentId,
  fullName,
  studentClassName,
  parentName,
  parentUsername,
  parentPhone,
  isPaid,
  receiptSent,
  note,
  updatedAt,
  previousMonthLabel,
  currency,
  debt,
}: TuitionStudentRowProps) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <input type="hidden" name="student_id" value={studentId} />

      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-tight">{fullName}</h3>
            <Badge variant="muted">{studentClassName || "Chưa có lớp"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            PH: <span className="text-foreground">{parentName || parentUsername || "Chưa cập nhật"}</span>
            {parentPhone ? ` · ${parentPhone}` : " · Chưa có SĐT"}
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground sm:text-right">
          {updatedAt ? formatVietnamDateTime(updatedAt) : "Chưa lưu"}
        </p>
      </div>

      <div className="py-4">
        <TuitionFeeDebt
          studentName={fullName}
          currentMonthFee={debt?.currentMonthFee ?? null}
          previousMonthDebt={debt?.previousMonthDebt ?? null}
          previousMonthLabel={previousMonthLabel}
          unpaidMonths={debt?.unpaidMonths ?? []}
          currency={currency}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusCheckbox name={`is_paid_${studentId}`} value="paid" label="Đã nộp" defaultChecked={isPaid} />
        <StatusCheckbox name={`receipt_sent_${studentId}`} value="sent" label="Đã gửi phiếu" defaultChecked={receiptSent} />
      </div>

      <div className="mt-3 grid gap-2">
        <label htmlFor={`note_${studentId}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Ghi chú
        </label>
        <Textarea
          id={`note_${studentId}`}
          name={`note_${studentId}`}
          defaultValue={note}
          className="min-h-[72px] w-full resize-y"
          placeholder="Ghi chú riêng cho học sinh này"
        />
      </div>
    </article>
  );
}
