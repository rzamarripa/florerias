"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import DeliveryPage from "@/features/admin/modules/delivery/DeliveryPage";

export default function RepartidoresPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Repartidores"
        subtitle="Panel de control"
        section="Admin"
      />
      <DeliveryPage />
    </div>
  );
}