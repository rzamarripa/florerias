import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ConciliacionPage from "@/features/admin/modules/conciliacion/ConciliacionPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Conciliación" subtitle="Módulos" section="Admin" />
      <ConciliacionPage />
    </div>
  );
}
