"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CashPaymentsPage from "@/features/admin/modules/cashPayments/CashPaymentsPage";

export default function Page() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Pagos en Efectivo" subtitle="Modulos" section="Admin" />
            <CashPaymentsPage />
        </div>
    );
}
