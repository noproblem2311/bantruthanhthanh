import { StudentForm } from "@/components/students/student-form";
import { PageMessage } from "@/components/ui/message";
import { createClient } from "@/lib/supabase/server";
import { getMessageParam } from "@/lib/utils";
import type { Parent, Student } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudentDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: student }, { data: parents }] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    supabase.from("parents").select("*").order("full_name"),
  ]);

  if (!student) return <PageMessage error="Không tìm thấy học sinh" />;

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(query, "success")} error={getMessageParam(query, "error")} />
      <StudentForm student={student as Student} parents={(parents || []) as Parent[]} />
    </div>
  );
}
