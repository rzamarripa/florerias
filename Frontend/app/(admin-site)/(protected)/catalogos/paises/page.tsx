import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CountryPage from "@/features/admin/modules/countries/CountryPage";

export default function Page() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb
        title="Razones Sociales"
        subtitle="Catálogos"
        section="Admin"
      />
      <CountryPage />
    </div>
  );
}
