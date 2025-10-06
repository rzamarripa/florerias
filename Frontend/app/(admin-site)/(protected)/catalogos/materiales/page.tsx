"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import MaterialsPage from "@/features/admin/modules/materials/MaterialsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Materiales" />
      <MaterialsPage />
    </div>
  );
}
