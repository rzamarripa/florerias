"use client";

import dynamic from "next/dynamic";

const EcommerceFullView = dynamic(
  () => import("@/features/admin/modules/ecommerce-config/EcommerceFullView"),
  { ssr: false }
);

export default function EcommercePreviewPage() {
  return <EcommerceFullView />;
}