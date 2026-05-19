import { z } from "zod";

export const attendanceStatusSchema = z.enum(["present", "excused_absent", "unexcused_absent", "not_marked"]);

export const markAttendanceSchema = z.object({
  student_id: z.string().uuid(),
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: attendanceStatusSchema,
  note: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
