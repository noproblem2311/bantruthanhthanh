import { StudentForm } from "@/components/students/student-form";
import { PageMessage } from "@/components/ui/message";
import { createClient } from "@/lib/supabase/server";
import { getMessageParam } from "@/lib/utils";
import type { Parent } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ManagerNewStudentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: parents } = await supabase.from("parents").select("*").eq("status", "active").order("full_name");

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <StudentForm parents={(parents || []) as Parent[]} backHref="/manager/students" />
    </div>
  );
}
