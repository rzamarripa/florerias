import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ExpenseConceptsPage from "@/features/admin/modules/expenseConcepts/SpendingConceptsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Conceptos de gastos" subtitle="Catálogos" section="Admin" />
      <ExpenseConceptsPage/>
    </div>
  );
} 