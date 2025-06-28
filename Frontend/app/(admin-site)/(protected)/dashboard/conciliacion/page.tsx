import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ConciliacionDashboardPage from "@/features/dashboard/ConciliacionDashboardPage";

export default function BancosPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Conciliación Bancaria"
        subtitle="Dashboard"
        section="Admin"
      />
      <ConciliacionDashboardPage />
    </div>
  );
}
