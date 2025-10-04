"use client";

import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProductDetailsPage from "@/features/admin/modules/products/ProductDetailsPage";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Catalogos" subtitle="Productos" section="Detalles" />
      <ProductDetailsPage productId={id} />
    </div>
  );
}
