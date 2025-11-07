"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ExpenseConceptsPage from "@/features/admin/modules/expenseConcepts/ExpenseConceptsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Conceptos de Gastos" />
      <ExpenseConceptsPage />
    </div>
  );
}
