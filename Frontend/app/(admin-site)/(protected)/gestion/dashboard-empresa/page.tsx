"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { CompanyDashboardPage } from "@/features/admin/modules/dashboard-company";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Dashboard Empresa"
        subtitle="Gestión"
        section="Admin"
      />
      <CompanyDashboardPage />
    </div>
  );
}
