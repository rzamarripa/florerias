"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import StageCatalogsPage from "@/features/admin/modules/stageCatalogs/StageCatalogsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Etapas" />
      <StageCatalogsPage />
    </div>
  );
}
