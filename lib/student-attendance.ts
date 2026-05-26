import { getVietnamDateFromTimestamp } from "@/lib/date";
import type { Student } from "@/lib/types";

type StudentCreatedAt = Pick<Student, "created_at">;

export function getStudentAttendanceStartDate(student: StudentCreatedAt) {
  return getVietnamDateFromTimestamp(student.created_at);
}

export function isStudentEligibleForAttendanceDate(student: StudentCreatedAt, date: string) {
  return getStudentAttendanceStartDate(student) <= date;
}

export function isStudentEligibleBeforeDate(student: StudentCreatedAt, exclusiveEndDate: string) {
  return getStudentAttendanceStartDate(student) < exclusiveEndDate;
}
