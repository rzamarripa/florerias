import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import MunicipalityPage from "@/features/admin/modules/municipalities/MunicipalityPage";

export default function MunicipiosPage() {
  return (
    <div className="container-fluid">
      <PageBreadcrumb title="Municipios" subtitle="Catálogos" section="Admin" />
      <MunicipalityPage />
    </div>
  );
}
