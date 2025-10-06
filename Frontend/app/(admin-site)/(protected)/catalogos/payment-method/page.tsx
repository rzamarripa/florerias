"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import PaymentMethodsPage from "@/features/admin/modules/payment-methods/PaymentMethodsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Metodos de Pago"
        section="Metodos de Pago"
      />
      <PaymentMethodsPage />
    </div>
  );
}
