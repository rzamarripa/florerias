"use client";

import dynamic from "next/dynamic";

const EcommerceCatalogPage = dynamic(
  () => import("@/features/admin/modules/ecommerce-config/components/EcommerceCatalogPage"),
  { ssr: false }
);

export default function EcommerceCatalog() {
  return <EcommerceCatalogPage />;
}