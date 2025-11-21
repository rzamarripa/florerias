import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import OrderAnalyticsPage from "@/features/admin/modules/order-analytics/OrderAnalyticsPage";

export default function Finanzas() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Admin"
        subtitle="Finanzas"
        section="Dashboard Analitico"
      />
      <OrderAnalyticsPage />;
    </div>
  );
}
