import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import MunicipalityPage from "@/features/admin/modules/municipalitys/MunicipalityPage";

export default function Page() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Razones Sociales" subtitle="Catálogos" section="Admin" />
            <MunicipalityPage />
        </div>
    );
} 