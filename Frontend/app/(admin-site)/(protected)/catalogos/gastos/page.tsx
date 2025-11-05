"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ExpensesPage from "@/features/admin/modules/expenses/ExpensesPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Gastos" />
      <ExpensesPage />
    </div>
  );
}
