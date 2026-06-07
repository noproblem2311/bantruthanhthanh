import type { AttendanceStatus, BoardingPackageType, OffRequestStatus } from "@/lib/types";

export const attendanceLabels: Record<string, string> = {
  present: "Có mặt",
  excused_absent: "Nghỉ có phép",
  unexcused_absent: "Vắng không phép",
  not_marked: "Chưa điểm danh",
};

export const offRequestLabels: Record<string, string> = {
  auto_approved: "Tự duyệt",
  pending: "Chờ xử lý",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
};

export const passwordResetLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  resolved: "Đã xử lý",
  rejected: "Từ chối",
};

export const statusLabels: Record<string, string> = {
  active: "Đang hoạt động",
  inactive: "Ngưng hoạt động",
};

export const boardingPackageLabels: Record<BoardingPackageType, string> = {
  weekday: "Không thứ 7",
  saturday: "Có thứ 7",
  two_days: "2 ngày/tuần",
  three_days: "3 ngày/tuần",
  four_days: "4 ngày/tuần",
  morning_weekday: "Buổi sáng T2-T6 (không bán trú)",
};

export const boardingPackageOptions: Array<{ value: BoardingPackageType; label: string }> = [
  { value: "saturday", label: boardingPackageLabels.saturday },
  { value: "weekday", label: boardingPackageLabels.weekday },
  { value: "two_days", label: boardingPackageLabels.two_days },
  { value: "three_days", label: boardingPackageLabels.three_days },
  { value: "four_days", label: boardingPackageLabels.four_days },
  { value: "morning_weekday", label: boardingPackageLabels.morning_weekday },
];

export function attendanceBadgeVariant(status: AttendanceStatus) {
  if (status === "present") return "success" as const;
  if (status === "excused_absent") return "info" as const;
  if (status === "unexcused_absent") return "danger" as const;
  return "muted" as const;
}

export function offRequestBadgeVariant(status: OffRequestStatus) {
  if (status === "approved" || status === "auto_approved") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "muted" as const;
}
