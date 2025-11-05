"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NeighborhoodsPage from "@/features/admin/modules/neighborhoods/NeighborhoodsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Colonias" />
      <NeighborhoodsPage />
    </div>
  );
}
