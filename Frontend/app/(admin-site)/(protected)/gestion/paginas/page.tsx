"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import PagesPage from "@/features/admin/modules/pages/PagesPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Páginas" subtitle="Gestión" section="Admin" />
      <PagesPage />
    </div>
  );
}
