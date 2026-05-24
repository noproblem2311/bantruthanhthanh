import { IngredientExpensesPage } from "@/components/ingredients/ingredient-expenses-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ManagerIngredientsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <IngredientExpensesPage basePath="/manager/ingredients" params={params} />;
}
