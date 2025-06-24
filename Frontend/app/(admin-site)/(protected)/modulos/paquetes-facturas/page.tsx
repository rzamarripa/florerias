import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import CountryPage from "@/features/admin/modules/countries/CountryPage";
import InvoicesPackpagePage from "@/features/admin/modules/InvoicesPackpages/InvoicesPackpagesPage";

export default function PaisesPage() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Paquetes de facturas" subtitle="Catálogos" section="Admin" />
            <InvoicesPackpagePage />
        </div>
    );
}
