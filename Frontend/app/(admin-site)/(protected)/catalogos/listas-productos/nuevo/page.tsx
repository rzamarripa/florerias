"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewProductListPage from "@/features/admin/modules/product-lists/NewProductListPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Catalogos" subtitle="Listas de Productos" section="Nuevo" />
      <NewProductListPage />
    </div>
  );
}
