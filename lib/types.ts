export type AppRole = "admin" | "manager" | "parent";
export type RecordStatus = "active" | "inactive";
export type AttendanceStatus = "present" | "excused_absent" | "unexcused_absent" | "not_marked";
export type OffRequestStatus = "auto_approved" | "pending" | "approved" | "rejected" | "cancelled";
export type PasswordResetStatus = "pending" | "resolved" | "rejected";
export type BoardingPackageType = "weekday" | "saturday";

export type Profile = {
  id: string;
  auth_user_id: string;
  role: AppRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
};

export type Parent = {
  id: string;
  profile_id: string | null;
  auth_user_id: string | null;
  full_name: string | null;
  username: string;
  username_normalized: string;
  phone: string | null;
  email: string | null;
  internal_auth_email: string;
  status: RecordStatus;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  parent_id: string;
  full_name: string;
  nickname: string | null;
  date_of_birth: string | null;
  gender: string | null;
  school_name: string | null;
  class_name: string | null;
  health_notes: string | null;
  allergy_notes: string | null;
  pickup_notes: string | null;
  boarding_package_type: BoardingPackageType;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecord = {
  id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  marked_by: string | null;
  marked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OffRequest = {
  id: string;
  student_id: string;
  parent_id: string;
  off_date: string;
  reason: string | null;
  status: OffRequestStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type FeeSetting = {
  id: string;
  year_month: string;
  fee_per_attendance_day: number;
  saturday_package_amount: number;
  weekday_package_amount: number;
  absence_deduction_amount: number;
  currency: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyHistorySnapshot = {
  id: string;
  billing_year_month: string;
  previous_year_month: string;
  captured_by: string | null;
  captured_at: string;
  note: string | null;
  student_count: number;
  excused_absence_total: number;
  unexcused_absence_total: number;
  package_total: number | null;
  excused_deduction_total: number | null;
  billing_total: number | null;
  saturday_package_amount: number | null;
  weekday_package_amount: number | null;
  absence_deduction_amount: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyHistoryStudent = {
  id: string;
  snapshot_id: string;
  student_id: string | null;
  parent_id: string | null;
  student_full_name: string;
  student_nickname: string | null;
  date_of_birth: string | null;
  gender: string | null;
  school_name: string | null;
  class_name: string | null;
  health_notes: string | null;
  allergy_notes: string | null;
  pickup_notes: string | null;
  boarding_package_type: BoardingPackageType;
  student_status: RecordStatus;
  parent_full_name: string | null;
  parent_username: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  excused_absent_count: number;
  unexcused_absent_count: number;
  excused_absent_dates: string[];
  unexcused_absent_dates: string[];
  package_amount: number | null;
  excused_deduction_amount: number | null;
  billing_amount: number | null;
  created_at: string;
};
