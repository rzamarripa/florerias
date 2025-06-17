import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import ProvidersPage from "@/features/admin/modules/providers/ProvidersPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Razones Sociales" subtitle="Catálogos" section="Admin" />
      <ProvidersPage/>
    </div>
  );
} 