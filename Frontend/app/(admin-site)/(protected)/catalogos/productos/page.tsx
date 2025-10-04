"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProductsPage from "@/features/admin/modules/products/ProductsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Productos" />
      <ProductsPage />
    </div>
  );
}
