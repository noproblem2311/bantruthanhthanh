import { MonthlyTuitionRegisterPage } from "@/components/tuition/monthly-tuition-register-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AdminTuitionRegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <MonthlyTuitionRegisterPage
      searchParams={searchParams}
      basePath="/admin/tuition/register"
      tuitionPath="/admin/tuition"
    />
  );
}
