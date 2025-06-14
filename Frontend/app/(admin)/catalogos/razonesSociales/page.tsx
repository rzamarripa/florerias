import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import RazonesSocialesPage from "@/features/admin/modules/razonesSociales/RazonesSocialesPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Razones Sociales" subtitle="Catálogos" section="Admin" />
      <RazonesSocialesPage />
    </div>
  );
} 