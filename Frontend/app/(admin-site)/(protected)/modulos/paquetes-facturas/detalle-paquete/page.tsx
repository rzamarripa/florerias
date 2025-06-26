import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import NewPackpageDetailsPage from "@/features/admin/modules/InvoicesPackpages/NewPackpageDetails/NewPackpageDetailsPage";

export default function PaisesPage() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Paquetes de facturas" subtitle="Catálogos" section="Admin" />
            <NewPackpageDetailsPage />
        </div>
    );
}
