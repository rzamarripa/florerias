"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ManagersPage from "@/features/admin/modules/managers/ManagersPage";

export default function GerentesPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Gerentes"
        subtitle="Panel de control"
        section="Admin"
      />
      <ManagersPage />
    </div>
  );
}