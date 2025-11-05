"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BuysPage from "@/features/admin/modules/buys/BuysPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Compras"
        section="Compras"
      />
      <BuysPage />
    </div>
  );
}
