import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewCompanyPage from "@/features/admin/modules/companies/NewCompanyPage";

export default function Page() {
  return;
  <div className="container-fluid">
    <PageBreadcrumb title="Editar Empresa" subtitle="Gestión" section="Admin" />
    <NewCompanyPage />;
  </div>;
}
