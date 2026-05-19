import { StudentForm } from "@/components/students/student-form";
import { createClient } from "@/lib/supabase/server";
import type { Parent } from "@/lib/types";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const { data: parents } = await supabase.from("parents").select("*").eq("status", "active").order("full_name");
  return <StudentForm parents={(parents || []) as Parent[]} />;
}
