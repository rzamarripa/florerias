"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewProductPage from "@/features/admin/modules/products/NewProductPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Catalogos" subtitle="Productos" section="Editar" />
      <NewProductPage />
    </div>
  );
}
