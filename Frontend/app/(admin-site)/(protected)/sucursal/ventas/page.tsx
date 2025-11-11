import SalesPage from "@/features/admin/modules/sales/SalesPage";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Ventas" subtitle="Producción" section="Admin" />
      <SalesPage />;
    </div>
  );
}
