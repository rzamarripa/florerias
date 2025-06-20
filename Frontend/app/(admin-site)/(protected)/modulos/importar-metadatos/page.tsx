"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ImportInvoicesPage from "@/features/admin/modules/importInvoices/ImportInvoicesPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Importar CFDI's SAT" subtitle="Modulos" section="Admin" />
      <ImportInvoicesPage />
    </div>
  );
}
