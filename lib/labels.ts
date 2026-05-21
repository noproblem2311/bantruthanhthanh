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
};

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
