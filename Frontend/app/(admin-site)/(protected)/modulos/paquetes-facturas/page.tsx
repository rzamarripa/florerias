import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import InvoicesPackagePage from "@/features/admin/modules/InvoicesPackpages/InvoicesPackpagesPage";

export default function PaquetesFacturasPage() {
    return (
        <div className="container-fluid">
            <PageBreadcrumb title="Paquetes de facturas" subtitle="Catálogos" section="Admin" />
            <InvoicesPackagePage />
        </div>
    );
}
