import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CompaniesPage from "@/features/admin/modules/companies/CompaniesPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Empresas" subtitle="Gestión" section="Admin" />
      <CompaniesPage />;
    </div>
  );
}
