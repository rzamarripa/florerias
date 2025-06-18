import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CompanyPage from "@/features/admin/modules/companies/CompanyPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Razones Sociales"
        subtitle="Catálogos"
        section="Admin"
      />
      <CompanyPage />
    </div>
  );
}
