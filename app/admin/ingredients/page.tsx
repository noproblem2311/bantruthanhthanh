import { IngredientExpensesPage } from "@/components/ingredients/ingredient-expenses-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminIngredientsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <IngredientExpensesPage basePath="/admin/ingredients" params={params} />;
}
