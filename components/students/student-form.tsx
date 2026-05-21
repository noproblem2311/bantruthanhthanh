import { createStudentAction, updateStudentAction } from "@/lib/actions/admin";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { boardingPackageLabels } from "@/lib/labels";
import type { Parent, Student } from "@/lib/types";

export function StudentForm({ student, parents }: { student?: Student; parents: Parent[] }) {
  const action = student ? updateStudentAction : createStudentAction;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{student ? "Cập nhật học sinh" : "Tạo học sinh"}</CardTitle>
        <CardDescription>Gắn học sinh với một phụ huynh để RLS bảo vệ dữ liệu theo gia đình.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          {student ? <input type="hidden" name="id" value={student.id} /> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="parent_id">Phụ huynh</Label>
              <Select id="parent_id" name="parent_id" defaultValue={student?.parent_id || ""} required>
                <option value="">Chọn phụ huynh</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name || parent.username} ({parent.username})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="full_name">Tên học sinh</Label>
              <Input id="full_name" name="full_name" defaultValue={student?.full_name || ""} required />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-2">
              <Label htmlFor="nickname">Tên gọi</Label>
              <Input id="nickname" name="nickname" defaultValue={student?.nickname || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date_of_birth">Ngày sinh</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={student?.date_of_birth || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Input id="gender" name="gender" defaultValue={student?.gender || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select id="status" name="status" defaultValue={student?.status || "active"}>
                <option value="active">Đang học</option>
                <option value="inactive">Tạm ngưng</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="boarding_package_type">Gói bán trú</Label>
              <Select id="boarding_package_type" name="boarding_package_type" defaultValue={student?.boarding_package_type || "weekday"}>
                <option value="weekday">{boardingPackageLabels.weekday}</option>
                <option value="saturday">{boardingPackageLabels.saturday}</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="school_name">Trường</Label>
              <Input id="school_name" name="school_name" defaultValue={student?.school_name || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class_name">Lớp</Label>
              <Input id="class_name" name="class_name" defaultValue={student?.class_name || ""} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="health_notes">Sức khỏe</Label>
              <Textarea id="health_notes" name="health_notes" defaultValue={student?.health_notes || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allergy_notes">Dị ứng</Label>
              <Textarea id="allergy_notes" name="allergy_notes" defaultValue={student?.allergy_notes || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pickup_notes">Ghi chú đón trả</Label>
              <Textarea id="pickup_notes" name="pickup_notes" defaultValue={student?.pickup_notes || ""} />
            </div>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap">
            <SubmitButton className="w-full sm:w-auto">{student ? "Lưu học sinh" : "Tạo học sinh"}</SubmitButton>
            <ButtonLink href="/admin/students" variant="outline" className="w-full sm:w-auto">
              Quay lại
            </ButtonLink>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
