"use client";

import dynamic from "next/dynamic";

const EcommerceClientDashboard = dynamic(
  () => import("@/features/admin/modules/ecommerce-config/EcommerceClientDashboard"),
  { ssr: false }
);

export default function EcommerceDashboardPage() {
  return <EcommerceClientDashboard />;
}
