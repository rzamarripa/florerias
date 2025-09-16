"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ImportBlackListPage from "@/features/admin/modules/importBlackList/ImportBlackListPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Importar Lista Negra" subtitle="Lista Negra" section="Admin" />
      <ImportBlackListPage />
    </div>
  );
}