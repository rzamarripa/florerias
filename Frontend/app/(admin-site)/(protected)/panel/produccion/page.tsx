"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProductionPage from "@/features/admin/modules/production/ProductionPage";

export default function ProduccionPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Personal de Producción"
        subtitle="Panel de control"
        section="Admin"
      />
      <ProductionPage />
    </div>
  );
}