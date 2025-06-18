import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CountryPage from "@/features/admin/modules/countries/CountryPage";

export default function PaisesPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Países" subtitle="Catálogos" section="Admin" />
      <CountryPage />
    </div>
  );
}
