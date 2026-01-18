"use client";

import ProductDetailsPage from "@/features/admin/modules/products/ProductDetailsPage";
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="container-fluid">
      <ProductDetailsPage productId={id} />
    </div>
  );
}
