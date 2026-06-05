import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { getMonthBounds, getYearMonth } from "@/lib/date";
import { calculateMonthlyFeesForStudents, getFeeSetting } from "@/lib/fees";
import { requireRole } from "@/lib/permissions";
import { isStudentEligibleBeforeDate } from "@/lib/student-attendance";
import { createClient } from "@/lib/supabase/server";
import type { MonthlyTuitionRecord, Parent, Student } from "@/lib/types";

export const runtime = "nodejs";

type StudentWithParent = Student & {
  parents: Pick<Parent, "full_name" | "username" | "phone"> | null;
};

function getMonthParam(value: string | null) {
  return value && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

function safeExcelText(value: string | null | undefined) {
  const text = value || "";
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function applyBorder(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFD1D5DB" } },
      left: { style: "thin", color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
      right: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });
}

export async function GET(request: NextRequest) {
  await requireRole(["admin", "manager"]);

  const billingYearMonth = getMonthParam(request.nextUrl.searchParams.get("month"));
  const { start, end } = getMonthBounds(billingYearMonth);
  const supabase = await createClient();

  const [{ data: students }, { data: tuitionRecords }, { data: attendanceRecords }, feeSetting] = await Promise.all([
    supabase
      .from("students")
      .select("*, parents(full_name,username,phone)")
      .eq("status", "active")
      .order("full_name"),
    supabase.from("monthly_tuition_records").select("*").eq("billing_year_month", billingYearMonth),
    supabase.from("attendance_records").select("student_id").gte("attendance_date", start).lt("attendance_date", end),
    getFeeSetting(supabase, billingYearMonth),
  ]);

  const attendanceStudentIds = new Set((attendanceRecords || []).map((record: { student_id: string }) => record.student_id));
  const eligibleStudents = ((students || []) as StudentWithParent[]).filter(
    (student) => isStudentEligibleBeforeDate(student, end) || attendanceStudentIds.has(student.id),
  );
  const recordsByStudent = new Map(
    ((tuitionRecords || []) as MonthlyTuitionRecord[]).map((record) => [record.student_id, record]),
  );
  const feesByStudent = await calculateMonthlyFeesForStudents(supabase, eligibleStudents, billingYearMonth);
  const currency = feeSetting?.currency || "VND";
  const paidCount = eligibleStudents.filter((student) => recordsByStudent.get(student.id)?.is_paid).length;
  const receiptCount = eligibleStudents.filter((student) => recordsByStudent.get(student.id)?.receipt_sent).length;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bán trú Thạnh Thạnh";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Sổ học phí", {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
    properties: { defaultRowHeight: 21 },
  });

  worksheet.columns = [
    { key: "index", width: 7 },
    { key: "student", width: 24 },
    { key: "class", width: 12 },
    { key: "parent", width: 24 },
    { key: "phone", width: 16 },
    { key: "amount", width: 17 },
    { key: "currency", width: 10 },
    { key: "paid", width: 14 },
    { key: "receipt", width: 16 },
    { key: "note", width: 34 },
  ];

  worksheet.mergeCells("A1:J1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "SỔ HỌC PHÍ THÁNG";
  titleCell.font = { name: "Arial", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF166534" } };
  worksheet.getRow(1).height = 34;

  worksheet.mergeCells("A2:J2");
  const summaryCell = worksheet.getCell("A2");
  summaryCell.value = `Tháng ${billingYearMonth.slice(5, 7)}/${billingYearMonth.slice(0, 4)}  |  Tổng: ${eligibleStudents.length} học sinh  |  Đã nộp: ${paidCount}  |  Đã gửi phiếu: ${receiptCount}`;
  summaryCell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF14532D" } };
  summaryCell.alignment = { horizontal: "center", vertical: "middle" };
  summaryCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
  worksheet.getRow(2).height = 26;

  const headerRow = worksheet.getRow(4);
  headerRow.values = ["STT", "Học sinh", "Lớp", "Phụ huynh", "Số điện thoại", "Học phí", "Đơn vị", "Tình trạng", "Phiếu thu", "Ghi chú"];
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
  });
  applyBorder(headerRow);

  eligibleStudents.forEach((student, index) => {
    const record = recordsByStudent.get(student.id);
    const fee = feesByStudent.get(student.id);
    const row = worksheet.addRow({
      index: index + 1,
      student: safeExcelText(student.full_name),
      class: safeExcelText(student.class_name),
      parent: safeExcelText(student.parents?.full_name || student.parents?.username),
      phone: safeExcelText(student.parents?.phone),
      amount: fee?.total_amount ?? null,
      currency,
      paid: record?.is_paid ? "Đã nộp" : "Chưa nộp",
      receipt: record?.receipt_sent ? "Đã gửi" : "Chưa gửi",
      note: safeExcelText(record?.note),
    });

    row.height = 25;
    row.font = { name: "Arial", size: 10 };
    row.alignment = { vertical: "middle", wrapText: true };
    row.getCell("index").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("amount").numFmt = currency === "VND" ? '#,##0" ₫"' : "#,##0.00";
    row.getCell("amount").alignment = { horizontal: "right", vertical: "middle" };
    row.getCell("currency").alignment = { horizontal: "center", vertical: "middle" };

    for (const key of ["paid", "receipt"] as const) {
      const cell = row.getCell(key);
      const completed = key === "paid" ? record?.is_paid : record?.receipt_sent;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: completed ? "FF166534" : "FF991B1B" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: completed ? "FFDCFCE7" : "FFFEE2E2" },
      };
    }

    if (index % 2 === 1) {
      for (const key of ["index", "student", "class", "parent", "phone", "amount", "currency", "note"] as const) {
        row.getCell(key).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    }
    applyBorder(row);
  });

  const lastDataRow = Math.max(4 + eligibleStudents.length, 4);
  worksheet.autoFilter = { from: "A4", to: `J${lastDataRow}` };

  const totalRow = worksheet.getRow(lastDataRow + 2);
  worksheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
  totalRow.getCell(1).value = "TỔNG HỌC PHÍ";
  totalRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  totalRow.getCell(1).font = { name: "Arial", size: 11, bold: true, color: { argb: "FF14532D" } };
  totalRow.getCell(6).value = {
    formula: eligibleStudents.length > 0 ? `SUM(F5:F${lastDataRow})` : "0",
    result: eligibleStudents.reduce((sum, student) => sum + (feesByStudent.get(student.id)?.total_amount || 0), 0),
  };
  totalRow.getCell(6).numFmt = currency === "VND" ? '#,##0" ₫"' : "#,##0.00";
  totalRow.getCell(6).font = { name: "Arial", size: 11, bold: true, color: { argb: "FF14532D" } };
  totalRow.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
  worksheet.mergeCells(`G${totalRow.number}:J${totalRow.number}`);
  totalRow.getCell(7).value = `Đã nộp ${paidCount}/${eligibleStudents.length} học sinh`;
  totalRow.getCell(7).font = { name: "Arial", size: 11, bold: true, color: { argb: "FF14532D" } };
  totalRow.getCell(7).alignment = { horizontal: "center", vertical: "middle" };
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
  });
  applyBorder(totalRow);
  totalRow.height = 28;

  worksheet.headerFooter.oddFooter = `&L${billingYearMonth}&CTrang &P / &N&RSo hoc phi`;

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="so-hoc-phi-${billingYearMonth}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
