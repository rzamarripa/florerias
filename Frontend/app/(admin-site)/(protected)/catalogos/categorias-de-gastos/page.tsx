import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ExpenseConceptCategoryPage from "@/features/admin/modules/expenseConceptCategories/ExpenseConceptCategoryPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Categorías de gastos"
        subtitle="Catálogos"
        section="Admin"
      />
      <ExpenseConceptCategoryPage />
    </div>
  );
}
