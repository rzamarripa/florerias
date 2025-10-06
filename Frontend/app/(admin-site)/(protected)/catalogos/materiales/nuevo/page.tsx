"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewMaterialPage from "@/features/admin/modules/materials/NewMaterialPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Catalogos" subtitle="Materiales" section="Nuevo" />
      <NewMaterialPage />
    </div>
  );
}
