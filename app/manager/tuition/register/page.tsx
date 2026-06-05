import { MonthlyTuitionRegisterPage } from "@/components/tuition/monthly-tuition-register-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ManagerTuitionRegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <MonthlyTuitionRegisterPage
      searchParams={searchParams}
      basePath="/manager/tuition/register"
      tuitionPath="/manager/tuition"
    />
  );
}
