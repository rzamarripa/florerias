import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CompaniesDashboard from "@/features/admin/modules/companies/CompaniesDashboard";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Dashboard" subtitle="Empresas" section="Admin" />
      <CompaniesDashboard />
    </div>
  );
}
