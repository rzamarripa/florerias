import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import BranchPage from "@/features/admin/modules/branch/BranchPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Sucursales" subtitle="Catálogos" section="Admin" />
      <BranchPage />
    </div>
  );
} 