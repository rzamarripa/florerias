"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProductListsPage from "@/features/admin/modules/product-lists/ProductListsPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Admin" subtitle="Catalogos" section="Listas de Productos" />
      <ProductListsPage />
    </div>
  );
}
