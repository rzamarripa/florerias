"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CashiersPage from "@/features/admin/modules/cashiers/CashiersPage";

export default function CajerosPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Cajeros"
        subtitle="Panel de control"
        section="Admin"
      />
      <CashiersPage />
    </div>
  );
}