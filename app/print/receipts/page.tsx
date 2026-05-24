import { ReceiptPrintToolbar } from "@/components/receipts/print-toolbar";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import { boardingPackageLabels } from "@/lib/labels";
import type { BoardingPackageType, MonthlyHistorySnapshot, MonthlyHistoryStudent, ReceiptBatch, ReceiptItem } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ReceiptLine = {
  label: string;
  amount: number;
};

type Receipt = {
  number: number;
  studentName: string;
  className: string | null;
  billingLabel: string;
  periodLabel: string | null;
  studiesSaturday: boolean;
  lines: ReceiptLine[];
  total: number;
  note: string | null;
};

function getMonthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split("-");
  return `tháng ${month}/${year}`;
}

function formatSignedCurrency(value: number) {
  if (value < 0) return `- ${formatCurrency(Math.abs(value))}`;
  return formatCurrency(value);
}

function getReceiptTotal(lines: ReceiptLine[]) {
  return lines.reduce((sum, line) => sum + line.amount, 0);
}

const zeroFeeLines: ReceiptLine[] = [
  { label: "Tiền học Tin học/Python", amount: 0 },
  { label: "Tiền học Tiếng Anh", amount: 0 },
];

function buildHistoryReceipts(snapshot: MonthlyHistorySnapshot, rows: MonthlyHistoryStudent[]) {
  return rows.map((row, index): Receipt => {
    const packageAmount = row.package_amount || 0;
    const deductionTotal = (row.excused_deduction_amount || 0) * row.excused_absent_count;
    const lines: ReceiptLine[] = [];
    if (packageAmount > 0) {
      lines.push({
        label: `Tiền gói bán trú ${boardingPackageLabels[row.boarding_package_type as BoardingPackageType]}`,
        amount: packageAmount,
      });
    }
    if (deductionTotal > 0) {
      lines.push({
        label: `Trừ ${row.excused_absent_count} buổi nghỉ có phép ${snapshot.previous_year_month}`,
        amount: -deductionTotal,
      });
    }
    if (lines.length === 0 && row.billing_amount !== null) {
      lines.push({ label: "Số tiền bán trú", amount: row.billing_amount });
    }
    lines.push(...zeroFeeLines);

    const unexcusedNote = row.unexcused_absent_count > 0 ? `Nghỉ không phép ${row.unexcused_absent_count} buổi.` : "";

    return {
      number: index + 1,
      studentName: row.student_full_name,
      className: row.class_name,
      billingLabel: getMonthLabel(snapshot.billing_year_month),
      periodLabel: "Cả tháng",
      studiesSaturday: row.boarding_package_type === "saturday",
      lines,
      total: row.billing_amount ?? getReceiptTotal(lines),
      note: [unexcusedNote, snapshot.note].filter(Boolean).join(" ") || null,
    };
  });
}

function buildManualReceipts(batch: ReceiptBatch, rows: ReceiptItem[]) {
  return rows.map((row, index): Receipt => {
    const lines: ReceiptLine[] = [{ label: "Tiền gói bán trú", amount: row.boarding_amount }];

    if (row.studies_saturday || row.saturday_amount !== 0) {
      lines.push({ label: "Tiền học thứ 7", amount: row.saturday_amount });
    }

    lines.push(
      { label: "Tiền học Tin học/Python", amount: row.computer_amount },
      { label: "Tiền học Tiếng Anh", amount: row.english_amount },
    );

    if (row.other_amount !== 0) {
      lines.push({ label: row.other_label || "Khoản cộng/trừ khác", amount: row.other_amount });
    }

    return {
      number: index + 1,
      studentName: row.student_name,
      className: row.class_name,
      billingLabel: getMonthLabel(batch.billing_year_month),
      periodLabel: row.start_date ? `Từ ngày ${formatVietnamDate(row.start_date)}` : null,
      studiesSaturday: row.studies_saturday,
      lines,
      total: getReceiptTotal(lines),
      note: [row.note, batch.note].filter(Boolean).join(" ") || null,
    };
  });
}

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <section className="receipt-card">
      <div className="receipt-head">
        <div>
          <p className="receipt-brand">CƠ SỞ BÁN TRÚ THANH THANH</p>
          <p className="receipt-muted">Số TT: {receipt.number}</p>
        </div>
        <div className="receipt-date">Điện Ngọc, ngày ...... tháng ...... năm 2026</div>
      </div>

      <h1>GIẤY BÁO THU TIỀN</h1>
      <p className="receipt-subtitle">{receipt.billingLabel}</p>

      <div className="receipt-student">
        <p>
          Kính gửi phụ huynh em: <strong>{receipt.studentName}</strong>
          {receipt.className ? ` (${receipt.className})` : ""}
        </p>
        <p>
          {receipt.periodLabel || "Thời gian thu theo thông báo"} · Học thứ 7: <strong>{receipt.studiesSaturday ? "Có" : "Không"}</strong>
        </p>
      </div>

      <table className="receipt-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Nội dung</th>
            <th>Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {receipt.lines.map((line, index) => (
            <tr key={`${line.label}-${index}`}>
              <td>{index + 1}</td>
              <td>{line.label}</td>
              <td>{formatSignedCurrency(line.amount)}</td>
            </tr>
          ))}
          {receipt.lines.length === 0 ? (
            <tr>
              <td>1</td>
              <td>Số tiền hiện tại nộp</td>
              <td>{formatCurrency(receipt.total)}</td>
            </tr>
          ) : null}
          <tr className="receipt-total-row">
            <td colSpan={2}>Số tiền hiện tại nộp</td>
            <td>{formatCurrency(receipt.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="receipt-note">
        <p>
          <strong>Ghi chú:</strong> - Phụ huynh nộp đủ tiền vào ngày 9 hằng tháng.
        </p>
        <p>- Hai anh chị em ruột được giảm 100000đ.</p>
        <p>- Phụ huynh có thắc mắc gì thì gặp trực tiếp cô Lan hoặc điện thoại số 0392333013 (chủ cơ sở).</p>
      </div>

      <div className="receipt-footer">
        <p></p>
        <div>
          <p>Chủ cơ sở</p>
          <strong>Phùng Vũ An Quân</strong>
        </div>
      </div>
    </section>
  );
}

export default async function ReceiptPrintPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("admin");
  const params = await searchParams;
  const source = params.source === "manual" ? "manual" : "history";
  const supabase = await createClient();
  let title = "Phiếu thu";
  let receipts: Receipt[] = [];

  if (source === "history") {
    const snapshotId = typeof params.snapshot_id === "string" ? params.snapshot_id : "";
    const [{ data: snapshot }, { data: students }] = await Promise.all([
      supabase.from("monthly_history_snapshots").select("*").eq("id", snapshotId).single(),
      supabase.from("monthly_history_students").select("*").eq("snapshot_id", snapshotId).order("student_full_name"),
    ]);

    if (snapshot) {
      title = `Phiếu thu ${snapshot.billing_year_month}`;
      receipts = buildHistoryReceipts(snapshot as MonthlyHistorySnapshot, (students || []) as MonthlyHistoryStudent[]);
    }
  } else {
    const batchId = typeof params.batch_id === "string" ? params.batch_id : "";
    const [{ data: batch }, { data: items }] = await Promise.all([
      supabase.from("receipt_batches").select("*").eq("id", batchId).single(),
      supabase.from("receipt_items").select("*").eq("batch_id", batchId).order("sort_order", { ascending: true }),
    ]);

    if (batch) {
      title = batch.title;
      receipts = buildManualReceipts(batch as ReceiptBatch, (items || []) as ReceiptItem[]);
    }
  }

  return (
    <main className="receipt-page">
      <ReceiptPrintToolbar />
      <div className="receipt-wrap">
        <div className="no-print mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{receipts.length} phiếu · 2 phiếu / trang A4</p>
        </div>
        {receipts.length > 0 ? (
          <div className="receipt-sheets">
            {receipts.map((receipt) => (
              <ReceiptCard key={`${receipt.number}-${receipt.studentName}`} receipt={receipt} />
            ))}
          </div>
        ) : (
          <div className="no-print rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">Không tìm thấy dữ liệu phiếu thu.</div>
        )}
      </div>

      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        .receipt-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
        }

        .receipt-wrap {
          width: min(210mm, calc(100% - 24px));
          margin: 0 auto;
          padding: 16px 0 32px;
        }

        .receipt-sheets {
          display: grid;
          gap: 0;
        }

        .receipt-card {
          display: flex;
          min-height: 136mm;
          break-inside: avoid;
          page-break-inside: avoid;
          flex-direction: column;
          border: 1px solid #111827;
          background: white;
          padding: 7mm;
          font-size: 12px;
        }

        .receipt-card:nth-child(2n) {
          page-break-after: always;
          break-after: page;
        }

        .receipt-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .receipt-brand {
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .receipt-muted,
        .receipt-date,
        .receipt-subtitle,
        .receipt-note,
        .receipt-footer {
          color: #475569;
        }

        .receipt-date {
          text-align: right;
          font-size: 11px;
        }

        .receipt-card h1 {
          margin: 10px 0 2px;
          text-align: center;
          font-size: 18px;
          font-weight: 800;
        }

        .receipt-subtitle {
          text-align: center;
          font-weight: 600;
        }

        .receipt-student {
          margin-top: 10px;
          display: grid;
          gap: 3px;
        }

        .receipt-table {
          margin-top: 10px;
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .receipt-table th,
        .receipt-table td {
          border: 1px solid #1f2937;
          padding: 5px 6px;
          vertical-align: top;
        }

        .receipt-table th:first-child,
        .receipt-table td:first-child {
          width: 34px;
          text-align: center;
        }

        .receipt-table th:last-child,
        .receipt-table td:last-child {
          width: 110px;
          text-align: right;
        }

        .receipt-total-row td {
          font-weight: 800;
        }

        .receipt-note {
          margin-top: 8px;
          font-size: 11px;
          font-style: italic;
          line-height: 1.35;
        }

        .receipt-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding-top: 12px;
        }

        .receipt-footer > div {
          min-width: 135px;
          text-align: center;
        }

        @media print {
          html,
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt-page {
            background: white;
          }

          .receipt-wrap {
            width: auto;
            margin: 0;
            padding: 0;
          }

          .receipt-card {
            min-height: 136mm;
            box-shadow: none;
          }
        }
      `}</style>
    </main>
  );
}
