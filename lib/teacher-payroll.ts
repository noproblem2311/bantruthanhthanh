export const MAY_2026_PAYROLL_MONTH = "2026-05";
export const JUNE_2026_PAYROLL_START_MONTH = "2026-06";
export const CLASS_STUDENT_CAP = 35;

export type PayrollFormulaType = "may_2026" | "from_june_2026";
export type PayrollShiftType = "full_day" | "morning_lunch" | "afternoon_only";

export type TeacherPayrollInput = {
  yearMonth: string;
  rawStudentCount: number;
  morningWorked: boolean;
  afternoonWorked: boolean;
};

export type TeacherPayrollResult = {
  formulaType: PayrollFormulaType;
  shiftType: PayrollShiftType;
  shiftLabel: string;
  studentCount: number;
  rawStudentCount: number;
  dayUnits: number;
  amount: number;
  formulaLabel: string;
};

export function getPayrollFormulaType(yearMonth: string): PayrollFormulaType {
  return yearMonth >= JUNE_2026_PAYROLL_START_MONTH ? "from_june_2026" : "may_2026";
}

export function getPayrollShiftType(morningWorked: boolean, afternoonWorked: boolean): PayrollShiftType {
  if (morningWorked && afternoonWorked) return "full_day";
  if (morningWorked) return "morning_lunch";
  return "afternoon_only";
}

export function calculateTeacherPayroll(input: TeacherPayrollInput): TeacherPayrollResult {
  const formulaType = getPayrollFormulaType(input.yearMonth);
  const shiftType = getPayrollShiftType(input.morningWorked, input.afternoonWorked);
  const studentCount = Math.min(input.rawStudentCount, CLASS_STUDENT_CAP);
  const rawStudentCount = input.rawStudentCount;

  if (formulaType === "may_2026") {
    const rateByShift: Record<PayrollShiftType, number> = {
      full_day: 12000,
      morning_lunch: 8000,
      afternoon_only: 4000,
    };
    const shiftLabelByShift: Record<PayrollShiftType, string> = {
      full_day: "Cả ngày",
      morning_lunch: "Sáng + giữ trưa",
      afternoon_only: "Chiều 14-17h",
    };
    const rate = rateByShift[shiftType];

    return {
      formulaType,
      shiftType,
      shiftLabel: shiftLabelByShift[shiftType],
      studentCount,
      rawStudentCount,
      dayUnits: shiftType === "full_day" ? 1 : 0.5,
      amount: studentCount * rate,
      formulaLabel: `${studentCount} HS x ${rate.toLocaleString("vi-VN")}đ`,
    };
  }

  const dayRate = studentCount >= 30 ? 375000 : 240000;
  const dayUnits = shiftType === "full_day" ? 1 : 0.5;

  return {
    formulaType,
    shiftType,
    shiftLabel: shiftType === "full_day" ? "Cả ngày" : shiftType === "morning_lunch" ? "Sáng" : "Chiều",
    studentCount,
    rawStudentCount,
    dayUnits,
    amount: dayRate * dayUnits,
    formulaLabel: `${studentCount >= 30 ? ">=30" : "<30"} HS: ${dayRate.toLocaleString("vi-VN")}đ x ${dayUnits}`,
  };
}
