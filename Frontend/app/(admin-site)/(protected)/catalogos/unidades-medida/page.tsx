"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import UnitsPage from "@/features/admin/modules/units/UnitsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Unidades de Medida"
        section="Unidades de Medida"
      />
      <UnitsPage />
    </div>
  );
}
