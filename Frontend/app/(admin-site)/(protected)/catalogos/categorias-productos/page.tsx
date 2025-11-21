"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProductCategoriesPage from "@/features/admin/modules/productCategories/ProductCategoriesPage";
export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Catalogos"
        section="Categorias de productos"
      />
      <ProductCategoriesPage />
    </div>
  );
}
