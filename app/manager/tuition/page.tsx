import { MonthlyTuitionPage } from "@/components/tuition/monthly-tuition-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ManagerTuitionPage({ searchParams }: { searchParams: SearchParams }) {
  return <MonthlyTuitionPage searchParams={searchParams} basePath="/manager/tuition" />;
}
