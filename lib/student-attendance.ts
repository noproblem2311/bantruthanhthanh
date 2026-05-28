import { getVietnamDateFromTimestamp } from "@/lib/date";
import type { Student } from "@/lib/types";

type StudentAttendanceStart = Pick<Student, "created_at"> & Partial<Pick<Student, "enrollment_date">>;

export function getStudentAttendanceStartDate(student: StudentAttendanceStart) {
  if (student.enrollment_date) return student.enrollment_date;
  return getVietnamDateFromTimestamp(student.created_at);
}

export function isStudentEligibleForAttendanceDate(student: StudentAttendanceStart, date: string) {
  return getStudentAttendanceStartDate(student) <= date;
}

export function isStudentEligibleBeforeDate(student: StudentAttendanceStart, exclusiveEndDate: string) {
  return getStudentAttendanceStartDate(student) < exclusiveEndDate;
}
