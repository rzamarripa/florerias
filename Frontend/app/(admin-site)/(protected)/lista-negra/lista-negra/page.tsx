"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BlackListViewPage from "@/features/admin/modules/importBlackList/BlackListViewPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Lista Negra" subtitle="Lista Negra" section="Admin" />
      <BlackListViewPage />
    </div>
  );
}