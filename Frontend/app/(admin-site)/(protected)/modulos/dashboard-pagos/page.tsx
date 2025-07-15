"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import DashboardPagosPage from "@/features/admin/modules/dashboard-pagos/dashboardPagosPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Dashboard Pagos" subtitle="Modulos" section="Admin" />
      <DashboardPagosPage />
    </div>
  );
}
